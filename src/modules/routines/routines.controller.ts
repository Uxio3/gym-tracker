import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import {
    listRoutines,
    createRoutine,
    getRoutineById,
    deleteRoutine,
} from "./routines.service.js";
import { createRoutineSchema } from "./routines.schema.js";
import { parseBody } from "../../utils/validate.js";

export async function getRoutines(req: AuthRequest, res: Response) {
    const routines = await listRoutines(req.userId!);
    res.json(routines);
}

export async function postRoutine(req: AuthRequest, res: Response) {
    const { name, exercises } = parseBody(createRoutineSchema, req.body);
    const routine = await createRoutine(req.userId!, name, exercises);
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
