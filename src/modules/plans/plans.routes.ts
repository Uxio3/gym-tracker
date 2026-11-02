import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getMyCurrentPlan, postPlan } from "./plans.controller.js";

export const plansRouter = Router();

plansRouter.use(requireAuth);
plansRouter.get("/current", getMyCurrentPlan);
plansRouter.post("/", postPlan);
