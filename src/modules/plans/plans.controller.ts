import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { getCurrentPlan, startPlan } from "./plans.service.js";
import { startPlanSchema } from "./plans.schema.js";
import { parseBody } from "../../utils/validate.js";

export async function getMyCurrentPlan(req: AuthRequest, res: Response) {
    const plan = await getCurrentPlan(req.userId!);
    res.json(plan);
}

export async function postPlan(req: AuthRequest, res: Response) {
    const { templateId } = parseBody(startPlanSchema, req.body);
    const plan = await startPlan(req.userId!, templateId);
    res.status(201).json(plan);
}
