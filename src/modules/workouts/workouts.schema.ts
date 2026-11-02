import { z } from "zod";

export const startSessionSchema = z.object({
    routineId: z.number().int().positive().optional(),
});

export const addSetSchema = z.object({
    exerciseId: z.number().int().positive(),
    // Defaults to the next number for that exercise in the session.
    setNumber: z.number().int().positive().optional(),
    reps: z.number().int().min(0),
    weightKg: z.number().min(0).nullable().optional(),
    rpe: z.number().min(0).max(10).nullable().optional(),
    notes: z.string().nullable().optional(),
});

export const updateSetSchema = z
    .object({
        reps: z.number().int().min(0),
        weightKg: z.number().min(0).nullable(),
        rpe: z.number().min(0).max(10).nullable(),
        notes: z.string().nullable(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update" });
