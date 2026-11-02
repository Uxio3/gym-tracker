import { z } from "zod";

export const ACTIVITY_LEVELS = ["1-2", "3-4", "5-6", "7"] as const;
export const GOALS = ["muscle", "strength", "definition"] as const;

export const upsertProfileSchema = z.object({
    weightKg: z.number().positive(),
    heightCm: z.number().positive(),
    age: z.number().int().positive(),
    activityLevel: z.enum(ACTIVITY_LEVELS),
    goal: z.enum(GOALS),
});
