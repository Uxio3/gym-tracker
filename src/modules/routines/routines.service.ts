import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { routines, routineExercises } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";

export interface RoutineExerciseInput {
    exerciseId: number;
    order?: number;
    targetSets?: number;
    targetReps?: number;
}

export async function listRoutines(userId: number) {
    return db.select().from(routines).where(eq(routines.userId, userId));
}

export async function createRoutine(
    userId: number,
    name: string,
    exercises: RoutineExerciseInput[]
) {
    const [routine] = await db
        .insert(routines)
        .values({ userId, name })
        .returning();

    if (exercises.length > 0) {
        await db.insert(routineExercises).values(
            exercises.map((exercise, index) => ({
                routineId: routine.id,
                exerciseId: exercise.exerciseId,
                order: exercise.order ?? index,
                targetSets: exercise.targetSets,
                targetReps: exercise.targetReps,
            }))
        );
    }

    return getRoutineById(userId, routine.id);
}

export async function getRoutineById(userId: number, routineId: number) {
    const [routine] = await db
        .select()
        .from(routines)
        .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));

    if (!routine) {
        throw new HttpError(404, "Routine not found");
    }

    const exercises = await db
        .select()
        .from(routineExercises)
        .where(eq(routineExercises.routineId, routineId));

    return { ...routine, exercises };
}

export async function deleteRoutine(userId: number, routineId: number) {
    await getRoutineById(userId, routineId);
    await db
        .delete(routineExercises)
        .where(eq(routineExercises.routineId, routineId));
    await db.delete(routines).where(eq(routines.id, routineId));
}
