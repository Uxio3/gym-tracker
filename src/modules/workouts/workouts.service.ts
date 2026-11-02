import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { workoutSessions, setEntries, routines } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";
import { assertExercisesVisible } from "../exercises/exercises.service.js";
import { getRoutineById } from "../routines/routines.service.js";
import { computeMuscleLoad, loggedSetCounts } from "../muscle-load/muscle-load.service.js";

export interface SetEntryInput {
    exerciseId: number;
    setNumber?: number;
    reps: number;
    weightKg?: number | null;
    rpe?: number | null;
    notes?: string | null;
}

export type SetEntryUpdate = Partial<Pick<SetEntryInput, "reps" | "weightKg" | "rpe" | "notes">>;

export async function startSession(userId: number, routineId?: number) {
    if (routineId !== undefined) {
        // 404 for routines that don't exist or belong to someone else.
        await getRoutineById(userId, routineId);
    }

    const [session] = await db
        .insert(workoutSessions)
        .values({ userId, routineId })
        .returning();
    return session;
}

export async function listSessions(userId: number) {
    return db
        .select({
            id: workoutSessions.id,
            userId: workoutSessions.userId,
            routineId: workoutSessions.routineId,
            routineName: routines.name,
            startedAt: workoutSessions.startedAt,
            finishedAt: workoutSessions.finishedAt,
            setCount: sql<number>`count(${setEntries.id})`.mapWith(Number),
        })
        .from(workoutSessions)
        .leftJoin(setEntries, eq(setEntries.sessionId, workoutSessions.id))
        .leftJoin(routines, eq(routines.id, workoutSessions.routineId))
        .where(eq(workoutSessions.userId, userId))
        .groupBy(workoutSessions.id, routines.name)
        .orderBy(desc(workoutSessions.startedAt));
}

async function getOwnedSession(userId: number, sessionId: number) {
    const [session] = Number.isInteger(sessionId)
        ? await db
              .select()
              .from(workoutSessions)
              .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
        : [];

    if (!session) {
        throw new HttpError(404, "Workout session not found");
    }
    return session;
}

async function getOwnedSet(userId: number, sessionId: number, setId: number) {
    await getOwnedSession(userId, sessionId);
    const [set] = Number.isInteger(setId)
        ? await db
              .select()
              .from(setEntries)
              .where(and(eq(setEntries.id, setId), eq(setEntries.sessionId, sessionId)))
        : [];

    if (!set) {
        throw new HttpError(404, "Set not found");
    }
    return set;
}

// The session, its sets and, when it was started from a routine, that routine
// with its exercises and targets, so the client can show what's planned.
export async function getSessionById(userId: number, sessionId: number) {
    const session = await getOwnedSession(userId, sessionId);
    const sets = await db
        .select()
        .from(setEntries)
        .where(eq(setEntries.sessionId, sessionId))
        .orderBy(asc(setEntries.setNumber), asc(setEntries.id));

    const routine =
        session.routineId !== null ? await getRoutineById(userId, session.routineId) : null;

    return { ...session, routine, sets };
}

export async function addSetEntry(userId: number, sessionId: number, input: SetEntryInput) {
    await getOwnedSession(userId, sessionId);
    await assertExercisesVisible(userId, [input.exerciseId]);

    let setNumber = input.setNumber;
    if (setNumber === undefined) {
        const [row] = await db
            .select({ last: sql<number>`coalesce(max(${setEntries.setNumber}), 0)`.mapWith(Number) })
            .from(setEntries)
            .where(and(eq(setEntries.sessionId, sessionId), eq(setEntries.exerciseId, input.exerciseId)));
        setNumber = row.last + 1;
    }

    const [set] = await db
        .insert(setEntries)
        .values({ sessionId, ...input, setNumber })
        .returning();
    return set;
}

export async function updateSetEntry(
    userId: number,
    sessionId: number,
    setId: number,
    changes: SetEntryUpdate
) {
    await getOwnedSet(userId, sessionId, setId);
    const [set] = await db
        .update(setEntries)
        .set(changes)
        .where(eq(setEntries.id, setId))
        .returning();
    return set;
}

// Removing a set closes the gap so the remaining ones stay numbered 1..n.
export async function deleteSetEntry(userId: number, sessionId: number, setId: number) {
    const set = await getOwnedSet(userId, sessionId, setId);
    await db.transaction(async (tx) => {
        await tx.delete(setEntries).where(eq(setEntries.id, setId));
        await tx
            .update(setEntries)
            .set({ setNumber: sql`${setEntries.setNumber} - 1` })
            .where(
                and(
                    eq(setEntries.sessionId, sessionId),
                    eq(setEntries.exerciseId, set.exerciseId),
                    gt(setEntries.setNumber, set.setNumber)
                )
            );
    });
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

export async function reopenSession(userId: number, sessionId: number) {
    await getOwnedSession(userId, sessionId);
    const [session] = await db
        .update(workoutSessions)
        .set({ finishedAt: null })
        .where(eq(workoutSessions.id, sessionId))
        .returning();
    return session;
}

// Its sets go with it (ON DELETE CASCADE).
export async function deleteSession(userId: number, sessionId: number) {
    await getOwnedSession(userId, sessionId);
    await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));
}

export async function getSessionMuscleLoad(userId: number, sessionId: number) {
    await getOwnedSession(userId, sessionId);
    return computeMuscleLoad(await loggedSetCounts({ sessionId }));
}
