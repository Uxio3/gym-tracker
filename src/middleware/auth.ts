import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http-error.js";
import { isTokenRevoked } from "../modules/auth/auth.service.js";

export interface AuthRequest extends Request {
    userId?: number;
    tokenJti?: string;
    tokenExp?: number;
}

interface TokenPayload {
    userId: number;
    jti: string;
    exp: number;
}

export async function requireAuth(
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new HttpError(401, "Missing authorization token");
    }

    const token = header.slice("Bearer ".length);

    let payload: TokenPayload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch {
        throw new HttpError(401, "Invalid or expired token");
    }

    if (await isTokenRevoked(payload.jti)) {
        throw new HttpError(401, "Token has been revoked");
    }

    req.userId = payload.userId;
    req.tokenJti = payload.jti;
    req.tokenExp = payload.exp;
    next();
}
