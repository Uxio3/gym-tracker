import { z } from "zod";

const routineExerciseSchema = z.object({
    exerciseId: z.number().int().positive(),
    order: z.number().int().min(0).optional(),
    targetSets: z.number().int().positive().optional(),
    targetReps: z.number().int().positive().optional(),
});

export const createRoutineSchema = z.object({
    name: z.string().trim().min(1),
    exercises: z.array(routineExerciseSchema).optional().default([]),
});

// Editing replaces the whole routine: its name and its exercise list.
export const updateRoutineSchema = z.object({
    name: z.string().trim().min(1),
    exercises: z.array(routineExerciseSchema),
});
