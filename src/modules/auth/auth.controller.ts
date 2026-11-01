import type { Request, Response } from "express";
import { registerUser, loginUser, signToken, revokeToken } from "./auth.service.js";
import { credentialsSchema } from "./auth.schema.js";
import { parseBody } from "../../utils/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";

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

export async function logout(req: AuthRequest, res: Response) {
    // Tokens issued before this feature shipped won't carry a jti, so there
    // is nothing to blacklist for them — just let the client drop its copy.
    if (req.tokenJti && req.tokenExp) {
        await revokeToken(req.tokenJti, req.userId!, new Date(req.tokenExp * 1000));
    }
    res.status(204).end();
}
