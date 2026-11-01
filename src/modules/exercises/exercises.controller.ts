import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { listExercises, createExercise } from "./exercises.service.js";
import { createExerciseSchema } from "./exercises.schema.js";
import { parseBody } from "../../utils/validate.js";

export async function getExercises(req: AuthRequest, res: Response) {
    const exercises = await listExercises(req.userId!);
    res.json(exercises);
}

export async function postExercise(req: AuthRequest, res: Response) {
    const { name, muscleGroup } = parseBody(createExerciseSchema, req.body);
    const exercise = await createExercise(req.userId!, name, muscleGroup);
    res.status(201).json(exercise);
}
