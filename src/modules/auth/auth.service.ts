import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema.js";
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
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}
