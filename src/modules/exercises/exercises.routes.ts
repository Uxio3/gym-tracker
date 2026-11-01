import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getExercises, postExercise } from "./exercises.controller.js";

export const exercisesRouter = Router();

exercisesRouter.use(requireAuth);
exercisesRouter.get("/", getExercises);
exercisesRouter.post("/", postExercise);
