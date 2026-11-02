import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../../middleware/auth.js";
import { parseBody } from "../../utils/validate.js";
import { weeklyMuscleLoad } from "./muscle-load.service.js";

const querySchema = z.object({
    days: z.coerce.number().int().min(1).max(90).default(7),
});

export const statsRouter = Router();

statsRouter.use(requireAuth);

// Effective sets per muscle over the last `days` days (7 by default).
statsRouter.get("/muscle-load", async (req: AuthRequest, res: Response) => {
    const { days } = parseBody(querySchema, req.query);
    res.json({ days, ...(await weeklyMuscleLoad(req.userId!, days)) });
});
