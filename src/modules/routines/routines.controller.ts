import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import {
    listRoutines,
    createRoutine,
    getRoutineById,
    deleteRoutine,
    type RoutineExerciseInput,
} from "./routines.service.js";
import { HttpError } from "../../utils/http-error.js";

export async function getRoutines(req: AuthRequest, res: Response) {
    const routines = await listRoutines(req.userId!);
    res.json(routines);
}

export async function postRoutine(req: AuthRequest, res: Response) {
    const { name, exercises } = req.body as {
        name?: string;
        exercises?: RoutineExerciseInput[];
    };
    if (!name) {
        throw new HttpError(400, "name is required");
    }
    const routine = await createRoutine(req.userId!, name, exercises ?? []);
    res.status(201).json(routine);
}

export async function getRoutine(req: AuthRequest, res: Response) {
    const routineId = Number(req.params.id);
    const routine = await getRoutineById(req.userId!, routineId);
    res.json(routine);
}

export async function removeRoutine(req: AuthRequest, res: Response) {
    const routineId = Number(req.params.id);
    await deleteRoutine(req.userId!, routineId);
    res.status(204).send();
}
