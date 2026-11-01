import type { Request, Response } from "express";
import { registerUser, loginUser, signToken } from "./auth.service.js";
import { HttpError } from "../../utils/http-error.js";

function parseCredentials(req: Request) {
    const { email, password } = req.body as {
        email?: string;
        password?: string;
    };
    if (!email || !password) {
        throw new HttpError(400, "email and password are required");
    }
    return { email, password };
}

export async function register(req: Request, res: Response) {
    const { email, password } = parseCredentials(req);
    const user = await registerUser(email, password);
    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
}

export async function login(req: Request, res: Response) {
    const { email, password } = parseCredentials(req);
    const user = await loginUser(email, password);
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email } });
}
