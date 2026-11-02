export interface User {
    id: number;
    email: string;
}

export interface Exercise {
    id: number;
    name: string;
    muscleGroup: string | null;
    equipment: string | null;
    level: string | null;
    category: string | null;
    images: string[] | null;
    createdBy: number | null;
    createdAt: string;
}

// Returned by GET /exercises/:id; the list endpoint leaves these fields out.
export interface ExerciseDetail extends Exercise {
    externalId: string | null;
    secondaryMuscles: string[] | null;
    instructions: string[] | null;
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
    // GET /workouts/:id
    sets?: SetEntry[];
    routine?: (Routine & { exercises: RoutineExercise[] }) | null;
    // GET /workouts
    setCount?: number;
    routineName?: string | null;
}

export type ActivityLevel = "1-2" | "3-4" | "5-6" | "7";
export type Goal = "muscle" | "strength" | "definition";

export interface UserProfile {
    id: number;
    userId: number;
    weightKg: number;
    heightCm: number;
    age: number;
    activityLevel: ActivityLevel;
    goal: Goal;
    updatedAt: string;
}

export interface RoutineTemplateExercise {
    id: number;
    templateId: number;
    exerciseId: number;
    order: number;
    targetSets: number | null;
    targetReps: number | null;
}

export interface RoutineTemplate {
    id: number;
    name: string;
    goal: Goal;
    description: string | null;
    exercises: RoutineTemplateExercise[];
}

// The routine the user committed to for the next 3 months.
export interface TrainingPlan {
    id: number;
    userId: number;
    routineId: number;
    templateId: number | null;
    startedAt: string;
    endsAt: string;
    routine: Routine & { exercises: RoutineExercise[] };
}
