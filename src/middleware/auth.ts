import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http-error.js";

export interface AuthRequest extends Request {
    userId?: number;
}

export function requireAuth(
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new HttpError(401, "Missing authorization token");
    }

    const token = header.slice("Bearer ".length);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: number;
        };
        req.userId = payload.userId;
        next();
    } catch {
        throw new HttpError(401, "Invalid or expired token");
    }
}
