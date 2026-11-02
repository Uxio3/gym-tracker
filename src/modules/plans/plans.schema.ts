import { z } from "zod";

export const startPlanSchema = z.object({
    templateId: z.number().int().positive(),
});
