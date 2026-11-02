import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { exercises, setEntries, workoutSessions } from "../../db/schema.js";
import { muscleKey, type MuscleKey } from "../../db/catalog-es.js";

// How much a set counts for each muscle it involves. The usual convention
// for counting weekly volume: full credit for the target muscle, half for
// the ones that assist.
const PRIMARY_WEIGHT = 1;
const SECONDARY_WEIGHT = 0.5;

export interface MuscleContribution {
    exerciseId: number;
    name: string;
    sets: number;
    role: "primary" | "secondary";
}

export interface MuscleLoad {
    // Effective sets: primary sets + half of the secondary ones.
    sets: number;
    primarySets: number;
    secondarySets: number;
    exercises: MuscleContribution[];
}

export interface MuscleLoadResult {
    muscles: Partial<Record<MuscleKey, MuscleLoad>>;
    totalSets: number;
}

export interface SetCount {
    exerciseId: number;
    sets: number;
}

export async function computeMuscleLoad(counts: SetCount[]): Promise<MuscleLoadResult> {
    const setsByExercise = new Map<number, number>();
    for (const { exerciseId, sets } of counts) {
        if (sets > 0) setsByExercise.set(exerciseId, (setsByExercise.get(exerciseId) ?? 0) + sets);
    }

    const result: MuscleLoadResult = { muscles: {}, totalSets: 0 };
    if (setsByExercise.size === 0) return result;

    const rows = await db
        .select({
            id: exercises.id,
            name: exercises.name,
            muscleGroup: exercises.muscleGroup,
            secondaryMuscles: exercises.secondaryMuscles,
        })
        .from(exercises)
        .where(inArray(exercises.id, [...setsByExercise.keys()]));

    function credit(key: MuscleKey, exercise: (typeof rows)[number], sets: number, role: MuscleContribution["role"]) {
        const load = (result.muscles[key] ??= { sets: 0, primarySets: 0, secondarySets: 0, exercises: [] });
        if (role === "primary") load.primarySets += sets;
        else load.secondarySets += sets;
        load.sets += sets * (role === "primary" ? PRIMARY_WEIGHT : SECONDARY_WEIGHT);
        load.exercises.push({ exerciseId: exercise.id, name: exercise.name, sets, role });
    }

    for (const exercise of rows) {
        const sets = setsByExercise.get(exercise.id)!;
        result.totalSets += sets;

        const primary = muscleKey(exercise.muscleGroup);
        if (primary) credit(primary, exercise, sets, "primary");

        const secondary = new Set(
            (exercise.secondaryMuscles ?? []).map(muscleKey).filter((k): k is MuscleKey => k !== null && k !== primary)
        );
        for (const key of secondary) credit(key, exercise, sets, "secondary");
    }

    for (const load of Object.values(result.muscles)) {
        load!.exercises.sort((a, b) => (a.role === b.role ? b.sets - a.sets : a.role === "primary" ? -1 : 1));
    }
    return result;
}

// Logged sets grouped by exercise, for one session or a user's recent days.
export async function loggedSetCounts(where: { sessionId: number } | { userId: number; since: Date }) {
    const condition =
        "sessionId" in where
            ? eq(setEntries.sessionId, where.sessionId)
            : and(eq(workoutSessions.userId, where.userId), gte(workoutSessions.startedAt, where.since));

    return db
        .select({
            exerciseId: setEntries.exerciseId,
            sets: sql<number>`count(*)`.mapWith(Number),
        })
        .from(setEntries)
        .innerJoin(workoutSessions, eq(workoutSessions.id, setEntries.sessionId))
        .where(condition)
        .groupBy(setEntries.exerciseId);
}

export async function weeklyMuscleLoad(userId: number, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return computeMuscleLoad(await loggedSetCounts({ userId, since }));
}
