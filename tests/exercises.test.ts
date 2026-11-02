import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createUserAndToken, createExercise } from "./helpers.js";
import { seed } from "../src/db/seed.js";
import { readFileSync } from "node:fs";

const catalog = JSON.parse(
    readFileSync(new URL("../src/db/data/free-exercise-db.json", import.meta.url), "utf8")
) as { id: string; instructions: string[] }[];

describe("exercises", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/exercises");
        expect(res.status).toBe(401);
    });

    it("creates and lists exercises", async () => {
        const token = await createUserAndToken();

        const before = await request(app)
            .get("/exercises")
            .set("Authorization", `Bearer ${token}`);
        const countBefore = before.body.length;

        const create = await request(app)
            .post("/exercises")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Bench Press", muscleGroup: "chest" });
        expect(create.status).toBe(201);

        const list = await request(app)
            .get("/exercises")
            .set("Authorization", `Bearer ${token}`);
        expect(list.status).toBe(200);
        expect(list.body).toHaveLength(countBefore + 1);
        expect(list.body.some((e: { name: string }) => e.name === "Bench Press")).toBe(true);
    });

    it("rejects a missing name", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .post("/exercises")
            .set("Authorization", `Bearer ${token}`)
            .send({ muscleGroup: "legs" });

        expect(res.status).toBe(400);
    });

    it("includes the seeded catalog with images", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .get("/exercises")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(800);

        const squat = res.body.find((e: { name: string }) => e.name === "Barbell Squat");
        expect(squat.muscleGroup).toBe("Cuádriceps");
        expect(squat.equipment).toBe("Barra");
        expect(squat.images).toHaveLength(2);
        expect(squat.images[0]).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/.+\/Barbell_Squat\/0\.jpg$/);
        // The list stays light; instructions are only in the detail endpoint.
        expect(squat.instructions).toBe(undefined);
    });

    it("returns an exercise's full detail", async () => {
        const token = await createUserAndToken();

        const list = await request(app)
            .get("/exercises")
            .set("Authorization", `Bearer ${token}`);
        const squat = list.body.find((e: { name: string }) => e.name === "Barbell Squat");

        const res = await request(app)
            .get(`/exercises/${squat.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.externalId).toBe("Barbell_Squat");
        expect(res.body.level).toBe("Principiante");
        expect(res.body.secondaryMuscles).toContain("Isquiotibiales");

        // Instructions come from the Spanish translation, step for step.
        const original = catalog.find((e) => e.id === "Barbell_Squat")!;
        expect(res.body.instructions).toHaveLength(original.instructions.length);
        expect(res.body.instructions[0] === original.instructions[0]).toBe(false);
    });

    it("returns 404 for another user's exercise or an invalid id", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");
        const privateId = await createExercise(tokenA, "My secret move");

        const own = await request(app)
            .get(`/exercises/${privateId}`)
            .set("Authorization", `Bearer ${tokenA}`);
        expect(own.status).toBe(200);

        const other = await request(app)
            .get(`/exercises/${privateId}`)
            .set("Authorization", `Bearer ${tokenB}`);
        expect(other.status).toBe(404);

        const invalid = await request(app)
            .get("/exercises/not-a-number")
            .set("Authorization", `Bearer ${tokenA}`);
        expect(invalid.status).toBe(404);
    });

    it("can re-run the seed without duplicating the catalog", async () => {
        const token = await createUserAndToken();
        const before = await request(app)
            .get("/exercises")
            .set("Authorization", `Bearer ${token}`);

        await seed();

        const after = await request(app)
            .get("/exercises")
            .set("Authorization", `Bearer ${token}`);
        expect(after.body.length).toBe(before.body.length);

        const templates = await request(app)
            .get("/routine-templates")
            .set("Authorization", `Bearer ${token}`);
        expect(templates.body.length).toBe(6);
    });
});
