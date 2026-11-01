import { z } from "zod";

export const createExerciseSchema = z.object({
    name: z.string().min(1),
    muscleGroup: z.string().min(1).optional(),
});
