import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getMyProfile, putMyProfile } from "./profile.controller.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);
profileRouter.get("/", getMyProfile);
profileRouter.put("/", putMyProfile);
