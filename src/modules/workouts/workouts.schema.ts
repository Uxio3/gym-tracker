import { z } from "zod";

export const startSessionSchema = z.object({
    routineId: z.number().int().positive().optional(),
});

export const addSetSchema = z.object({
    exerciseId: z.number().int().positive(),
    setNumber: z.number().int().positive(),
    reps: z.number().int().positive(),
    weightKg: z.number().positive().optional(),
    rpe: z.number().min(0).max(10).optional(),
    notes: z.string().optional(),
});
