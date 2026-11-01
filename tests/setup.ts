import "dotenv/config";
import { beforeEach, afterAll } from "vitest";

if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is not set");
}

// Point the app's db client at the test database before it is ever imported.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { migrate } = await import("drizzle-orm/postgres-js/migrator");
const { db, pgClient } = await import("../src/db/client.js");

await migrate(db, { migrationsFolder: "./src/db/migrations" });

beforeEach(async () => {
    await pgClient`
        TRUNCATE TABLE
            set_entries, workout_sessions, routine_exercises, routines, exercises, users
        RESTART IDENTITY CASCADE
    `;
});

afterAll(async () => {
    await pgClient.end({ timeout: 1 });
});
