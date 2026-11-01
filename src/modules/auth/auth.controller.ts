import type { Request, Response } from "express";
import { registerUser, loginUser, signToken } from "./auth.service.js";
import { credentialsSchema } from "./auth.schema.js";
import { parseBody } from "../../utils/validate.js";

export async function register(req: Request, res: Response) {
    const { email, password } = parseBody(credentialsSchema, req.body);
    const user = await registerUser(email, password);
    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
}

export async function login(req: Request, res: Response) {
    const { email, password } = parseBody(credentialsSchema, req.body);
    const user = await loginUser(email, password);
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email } });
}
