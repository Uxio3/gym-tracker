import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { getProfile, upsertProfile } from "./profile.service.js";
import { upsertProfileSchema } from "./profile.schema.js";
import { parseBody } from "../../utils/validate.js";

export async function getMyProfile(req: AuthRequest, res: Response) {
    const profile = await getProfile(req.userId!);
    res.json(profile);
}

export async function putMyProfile(req: AuthRequest, res: Response) {
    const data = parseBody(upsertProfileSchema, req.body);
    const profile = await upsertProfile(req.userId!, data);
    res.json(profile);
}
