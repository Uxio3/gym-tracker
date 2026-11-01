import { eq, isNull, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { exercises } from "../../db/schema.js";

export async function listExercises(userId: number) {
    return db
        .select()
        .from(exercises)
        .where(or(isNull(exercises.createdBy), eq(exercises.createdBy, userId)));
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
