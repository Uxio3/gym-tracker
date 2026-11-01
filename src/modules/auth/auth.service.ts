import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users, revokedTokens } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";

const SALT_ROUNDS = 10;

export async function registerUser(email: string, password: string) {
    const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    if (existing) {
        throw new HttpError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db
        .insert(users)
        .values({ email, passwordHash })
        .returning();

    return user;
}

export async function loginUser(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        throw new HttpError(401, "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        throw new HttpError(401, "Invalid credentials");
    }

    return user;
}

export function signToken(userId: number) {
    const jti = crypto.randomUUID();
    return jwt.sign({ userId, jti }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export async function isTokenRevoked(jti: string) {
    const [row] = await db
        .select()
        .from(revokedTokens)
        .where(eq(revokedTokens.jti, jti));
    return Boolean(row);
}

export async function revokeToken(jti: string, userId: number, expiresAt: Date) {
    await db
        .insert(revokedTokens)
        .values({ jti, userId, expiresAt })
        .onConflictDoNothing();
}
