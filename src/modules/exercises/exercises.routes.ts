import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getExercises, getExercise, postExercise } from "./exercises.controller.js";

export const exercisesRouter = Router();

exercisesRouter.use(requireAuth);
exercisesRouter.get("/", getExercises);
exercisesRouter.get("/:id", getExercise);
exercisesRouter.post("/", postExercise);
