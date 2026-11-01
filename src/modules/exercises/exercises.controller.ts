import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { listExercises, createExercise } from "./exercises.service.js";
import { HttpError } from "../../utils/http-error.js";

export async function getExercises(req: AuthRequest, res: Response) {
    const exercises = await listExercises(req.userId!);
    res.json(exercises);
}

export async function postExercise(req: AuthRequest, res: Response) {
    const { name, muscleGroup } = req.body as {
        name?: string;
        muscleGroup?: string;
    };
    if (!name) {
        throw new HttpError(400, "name is required");
    }
    const exercise = await createExercise(req.userId!, name, muscleGroup);
    res.status(201).json(exercise);
}
