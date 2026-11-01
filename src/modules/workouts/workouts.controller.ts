import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import {
    startSession,
    listSessions,
    getSessionById,
    addSetEntry,
    finishSession,
    type SetEntryInput,
} from "./workouts.service.js";
import { HttpError } from "../../utils/http-error.js";

export async function postSession(req: AuthRequest, res: Response) {
    const { routineId } = req.body as { routineId?: number };
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
    const { exerciseId, setNumber, reps, weightKg, rpe, notes } =
        req.body as Partial<SetEntryInput>;

    if (!exerciseId || !setNumber || !reps) {
        throw new HttpError(
            400,
            "exerciseId, setNumber and reps are required"
        );
    }

    const set = await addSetEntry(req.userId!, sessionId, {
        exerciseId,
        setNumber,
        reps,
        weightKg,
        rpe,
        notes,
    });
    res.status(201).json(set);
}

export async function postFinish(req: AuthRequest, res: Response) {
    const sessionId = Number(req.params.id);
    const session = await finishSession(req.userId!, sessionId);
    res.json(session);
}
