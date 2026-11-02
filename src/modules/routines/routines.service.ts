import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { routines, routineExercises } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";
import { assertExercisesVisible } from "../exercises/exercises.service.js";
import { computeMuscleLoad } from "../muscle-load/muscle-load.service.js";

export interface RoutineExerciseInput {
    exerciseId: number;
    order?: number;
    targetSets?: number;
    targetReps?: number;
}

type DbExecutor = Pick<typeof db, "insert">;

export async function listRoutines(userId: number) {
    return db
        .select({
            id: routines.id,
            userId: routines.userId,
            name: routines.name,
            createdAt: routines.createdAt,
            exerciseCount: sql<number>`count(${routineExercises.id})`.mapWith(Number),
        })
        .from(routines)
        .leftJoin(routineExercises, eq(routineExercises.routineId, routines.id))
        .where(eq(routines.userId, userId))
        .groupBy(routines.id)
        .orderBy(asc(routines.createdAt));
}

async function insertRoutineExercises(
    executor: DbExecutor,
    routineId: number,
    exercises: RoutineExerciseInput[]
) {
    if (exercises.length === 0) return;
    await executor.insert(routineExercises).values(
        exercises.map((exercise, index) => ({
            routineId,
            exerciseId: exercise.exerciseId,
            order: exercise.order ?? index,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
        }))
    );
}

export async function createRoutine(
    userId: number,
    name: string,
    exercises: RoutineExerciseInput[]
) {
    await assertExercisesVisible(userId, exercises.map((e) => e.exerciseId));

    const routineId = await db.transaction(async (tx) => {
        const [routine] = await tx.insert(routines).values({ userId, name }).returning();
        await insertRoutineExercises(tx, routine.id, exercises);
        return routine.id;
    });

    return getRoutineById(userId, routineId);
}

export async function getRoutineById(userId: number, routineId: number) {
    const [routine] = Number.isInteger(routineId)
        ? await db
              .select()
              .from(routines)
              .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
        : [];

    if (!routine) {
        throw new HttpError(404, "Routine not found");
    }

    const exercises = await db
        .select()
        .from(routineExercises)
        .where(eq(routineExercises.routineId, routineId))
        .orderBy(asc(routineExercises.order), asc(routineExercises.id));

    return { ...routine, exercises };
}

export async function updateRoutine(
    userId: number,
    routineId: number,
    name: string,
    exercises: RoutineExerciseInput[]
) {
    await getRoutineById(userId, routineId);
    await assertExercisesVisible(userId, exercises.map((e) => e.exerciseId));

    await db.transaction(async (tx) => {
        await tx.update(routines).set({ name }).where(eq(routines.id, routineId));
        await tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId));
        await insertRoutineExercises(tx, routineId, exercises);
    });

    return getRoutineById(userId, routineId);
}

// Its exercises and any plan built on it go with it (ON DELETE CASCADE);
// past workouts keep their sets and just lose the link (ON DELETE SET NULL).
export async function deleteRoutine(userId: number, routineId: number) {
    await getRoutineById(userId, routineId);
    await db.delete(routines).where(eq(routines.id, routineId));
}

// What the routine works, from its target sets (one set if none is set).
export async function getRoutineMuscleLoad(userId: number, routineId: number) {
    const routine = await getRoutineById(userId, routineId);
    return computeMuscleLoad(
        routine.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.targetSets ?? 1 }))
    );
}
