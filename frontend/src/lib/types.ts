export interface User {
    id: number;
    email: string;
}

export interface Exercise {
    id: number;
    name: string;
    muscleGroup: string | null;
    createdBy: number | null;
    createdAt: string;
}

export interface RoutineExercise {
    id: number;
    routineId: number;
    exerciseId: number;
    order: number;
    targetSets: number | null;
    targetReps: number | null;
}

export interface Routine {
    id: number;
    userId: number;
    name: string;
    createdAt: string;
    exercises?: RoutineExercise[];
    exerciseCount?: number;
}

export interface SetEntry {
    id: number;
    sessionId: number;
    exerciseId: number;
    setNumber: number;
    reps: number;
    weightKg: number | null;
    rpe: number | null;
    notes: string | null;
}

export interface WorkoutSession {
    id: number;
    userId: number;
    routineId: number | null;
    startedAt: string;
    finishedAt: string | null;
    sets?: SetEntry[];
    setCount?: number;
}
