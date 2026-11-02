import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { exercises } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";

// Exercises a user can see: the shared catalog plus the ones they created.
function visibleTo(userId: number) {
    return or(isNull(exercises.createdBy), eq(exercises.createdBy, userId));
}

// The list leaves out instructions and secondary muscles to keep the payload
// small (the catalog has ~900 entries); GET /exercises/:id returns everything.
export async function listExercises(userId: number) {
    return db
        .select({
            id: exercises.id,
            name: exercises.name,
            muscleGroup: exercises.muscleGroup,
            equipment: exercises.equipment,
            level: exercises.level,
            category: exercises.category,
            images: exercises.images,
            createdBy: exercises.createdBy,
            createdAt: exercises.createdAt,
        })
        .from(exercises)
        .where(visibleTo(userId))
        .orderBy(asc(exercises.name));
}

// Throws 400 unless every id is an exercise the user can see, so routines and
// workouts can't reference another user's private exercises (or ids that
// don't exist, which would otherwise surface as a foreign-key 500).
export async function assertExercisesVisible(userId: number, exerciseIds: number[]) {
    const unique = [...new Set(exerciseIds)];
    if (unique.length === 0) return;

    const found = await db
        .select({ id: exercises.id })
        .from(exercises)
        .where(and(inArray(exercises.id, unique), visibleTo(userId)));

    if (found.length !== unique.length) {
        const known = new Set(found.map((row) => row.id));
        const missing = unique.filter((id) => !known.has(id));
        throw new HttpError(400, `Unknown exercise: ${missing.join(", ")}`);
    }
}

export async function getExerciseById(userId: number, exerciseId: number) {
    const [exercise] = Number.isInteger(exerciseId)
        ? await db
              .select()
              .from(exercises)
              .where(and(eq(exercises.id, exerciseId), visibleTo(userId)))
        : [];

    if (!exercise) {
        throw new HttpError(404, "Exercise not found");
    }
    return exercise;
}

export async function createExercise(
    userId: number,
    name: string,
    muscleGroup?: string
) {
    const [exercise] = await db
        .insert(exercises)
        .values({ name, muscleGroup, createdBy: userId })
        .returning();
    return exercise;
}
