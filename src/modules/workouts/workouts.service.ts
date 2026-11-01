import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { workoutSessions, setEntries } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";

export interface SetEntryInput {
    exerciseId: number;
    setNumber: number;
    reps: number;
    weightKg?: number;
    rpe?: number;
    notes?: string;
}

export async function startSession(userId: number, routineId?: number) {
    const [session] = await db
        .insert(workoutSessions)
        .values({ userId, routineId })
        .returning();
    return session;
}

export async function listSessions(userId: number) {
    return db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.userId, userId));
}

async function getOwnedSession(userId: number, sessionId: number) {
    const [session] = await db
        .select()
        .from(workoutSessions)
        .where(
            and(
                eq(workoutSessions.id, sessionId),
                eq(workoutSessions.userId, userId)
            )
        );

    if (!session) {
        throw new HttpError(404, "Workout session not found");
    }
    return session;
}

export async function getSessionById(userId: number, sessionId: number) {
    const session = await getOwnedSession(userId, sessionId);
    const sets = await db
        .select()
        .from(setEntries)
        .where(eq(setEntries.sessionId, sessionId));
    return { ...session, sets };
}

export async function addSetEntry(
    userId: number,
    sessionId: number,
    input: SetEntryInput
) {
    await getOwnedSession(userId, sessionId);
    const [set] = await db
        .insert(setEntries)
        .values({ sessionId, ...input })
        .returning();
    return set;
}

export async function finishSession(userId: number, sessionId: number) {
    await getOwnedSession(userId, sessionId);
    const [session] = await db
        .update(workoutSessions)
        .set({ finishedAt: new Date() })
        .where(eq(workoutSessions.id, sessionId))
        .returning();
    return session;
}
