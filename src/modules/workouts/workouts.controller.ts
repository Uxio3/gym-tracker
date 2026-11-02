import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import {
    startSession,
    listSessions,
    getSessionById,
    addSetEntry,
    updateSetEntry,
    deleteSetEntry,
    finishSession,
    reopenSession,
    deleteSession,
    getSessionMuscleLoad,
} from "./workouts.service.js";
import { startSessionSchema, addSetSchema, updateSetSchema } from "./workouts.schema.js";
import { parseBody } from "../../utils/validate.js";

export async function postSession(req: AuthRequest, res: Response) {
    const { routineId } = parseBody(startSessionSchema, req.body);
    const session = await startSession(req.userId!, routineId);
    res.status(201).json(session);
}

export async function getSessions(req: AuthRequest, res: Response) {
    const sessions = await listSessions(req.userId!);
    res.json(sessions);
}

export async function getSession(req: AuthRequest, res: Response) {
    const session = await getSessionById(req.userId!, Number(req.params.id));
    res.json(session);
}

export async function removeSession(req: AuthRequest, res: Response) {
    await deleteSession(req.userId!, Number(req.params.id));
    res.status(204).send();
}

export async function postSet(req: AuthRequest, res: Response) {
    const input = parseBody(addSetSchema, req.body);
    const set = await addSetEntry(req.userId!, Number(req.params.id), input);
    res.status(201).json(set);
}

export async function patchSet(req: AuthRequest, res: Response) {
    const changes = parseBody(updateSetSchema, req.body);
    const set = await updateSetEntry(
        req.userId!,
        Number(req.params.id),
        Number(req.params.setId),
        changes
    );
    res.json(set);
}

export async function removeSet(req: AuthRequest, res: Response) {
    await deleteSetEntry(req.userId!, Number(req.params.id), Number(req.params.setId));
    res.status(204).send();
}

export async function postFinish(req: AuthRequest, res: Response) {
    const session = await finishSession(req.userId!, Number(req.params.id));
    res.json(session);
}

export async function postReopen(req: AuthRequest, res: Response) {
    const session = await reopenSession(req.userId!, Number(req.params.id));
    res.json(session);
}

export async function getSessionLoad(req: AuthRequest, res: Response) {
    res.json(await getSessionMuscleLoad(req.userId!, Number(req.params.id)));
}
