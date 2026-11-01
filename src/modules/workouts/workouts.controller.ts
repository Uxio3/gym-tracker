import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import {
    startSession,
    listSessions,
    getSessionById,
    addSetEntry,
    finishSession,
} from "./workouts.service.js";
import { startSessionSchema, addSetSchema } from "./workouts.schema.js";
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
    const sessionId = Number(req.params.id);
    const session = await getSessionById(req.userId!, sessionId);
    res.json(session);
}

export async function postSet(req: AuthRequest, res: Response) {
    const sessionId = Number(req.params.id);
    const input = parseBody(addSetSchema, req.body);
    const set = await addSetEntry(req.userId!, sessionId, input);
    res.status(201).json(set);
}

export async function postFinish(req: AuthRequest, res: Response) {
    const sessionId = Number(req.params.id);
    const session = await finishSession(req.userId!, sessionId);
    res.json(session);
}
