import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { userProfiles } from "../../db/schema.js";
import type { upsertProfileSchema } from "./profile.schema.js";
import type { z } from "zod";

type ProfileInput = z.infer<typeof upsertProfileSchema>;

export async function getProfile(userId: number) {
    const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));
    return profile ?? null;
}

export async function upsertProfile(userId: number, data: ProfileInput) {
    const [profile] = await db
        .insert(userProfiles)
        .values({ userId, ...data })
        .onConflictDoUpdate({
            target: userProfiles.userId,
            set: { ...data, updatedAt: new Date() },
        })
        .returning();
    return profile;
}
