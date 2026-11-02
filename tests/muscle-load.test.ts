import { describe, it, expect } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { app } from "../src/app.js";
import { db } from "../src/db/client.js";
import { workoutSessions } from "../src/db/schema.js";
import { createUserAndToken } from "./helpers.js";

async function catalogId(token: string, name: string) {
    const res = await request(app).get("/exercises").set("Authorization", `Bearer ${token}`);
    return (res.body as { id: number; name: string }[]).find((e) => e.name === name)!.id;
}

async function logSets(token: string, sessionId: number, exerciseId: number, count: number) {
    for (let i = 0; i < count; i++) {
        await request(app)
            .post(`/workouts/${sessionId}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, reps: 8, weightKg: 60 });
    }
}

describe("muscle load", () => {
    it("counts a full set for the target muscle and half for the helpers", async () => {
        const token = await createUserAndToken();
        const squat = await catalogId(token, "Barbell Squat");
        const session = await request(app).post("/workouts").set("Authorization", `Bearer ${token}`).send({});
        await logSets(token, session.body.id, squat, 4);

        const res = await request(app)
            .get(`/workouts/${session.body.id}/muscle-load`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.totalSets).toBe(4);
        expect(res.body.muscles.quadriceps.sets).toBe(4);
        expect(res.body.muscles.quadriceps.primarySets).toBe(4);
        // Barbell Squat lists calves, glutes, hamstrings and lower back as secondary.
        expect(res.body.muscles.glutes.sets).toBe(2);
        expect(res.body.muscles.hamstrings.secondarySets).toBe(4);
        expect(res.body.muscles["lower back"].sets).toBe(2);
        expect(res.body.muscles.chest).toBe(undefined);
        expect(res.body.muscles.glutes.exercises[0].name).toBe("Barbell Squat");
        expect(res.body.muscles.glutes.exercises[0].role).toBe("secondary");
    });

    it("adds up the last 7 days and ignores older workouts", async () => {
        const token = await createUserAndToken();
        const bench = await catalogId(token, "Barbell Bench Press - Medium Grip");

        const recent = await request(app).post("/workouts").set("Authorization", `Bearer ${token}`).send({});
        await logSets(token, recent.body.id, bench, 3);
        const another = await request(app).post("/workouts").set("Authorization", `Bearer ${token}`).send({});
        await logSets(token, another.body.id, bench, 2);
        const old = await request(app).post("/workouts").set("Authorization", `Bearer ${token}`).send({});
        await logSets(token, old.body.id, bench, 10);
        await db
            .update(workoutSessions)
            .set({ startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) })
            .where(eq(workoutSessions.id, old.body.id));

        const res = await request(app).get("/stats/muscle-load").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.days).toBe(7);
        expect(res.body.muscles.chest.sets).toBe(5);

        const month = await request(app)
            .get("/stats/muscle-load?days=30")
            .set("Authorization", `Bearer ${token}`);
        expect(month.body.muscles.chest.sets).toBe(15);

        const bad = await request(app)
            .get("/stats/muscle-load?days=0")
            .set("Authorization", `Bearer ${token}`);
        expect(bad.status).toBe(400);
    });

    it("only counts the user's own workouts", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");
        const bench = await catalogId(tokenA, "Barbell Bench Press - Medium Grip");
        const session = await request(app).post("/workouts").set("Authorization", `Bearer ${tokenA}`).send({});
        await logSets(tokenA, session.body.id, bench, 3);

        const week = await request(app).get("/stats/muscle-load").set("Authorization", `Bearer ${tokenB}`);
        expect(week.body.totalSets).toBe(0);

        const other = await request(app)
            .get(`/workouts/${session.body.id}/muscle-load`)
            .set("Authorization", `Bearer ${tokenB}`);
        expect(other.status).toBe(404);
    });

    it("recognises the muscle of the user's own exercises by its name", async () => {
        const token = await createUserAndToken();
        const created = await request(app)
            .post("/exercises")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Mi press", muscleGroup: "pecho" });
        const session = await request(app).post("/workouts").set("Authorization", `Bearer ${token}`).send({});
        await logSets(token, session.body.id, created.body.id, 2);

        const res = await request(app)
            .get(`/workouts/${session.body.id}/muscle-load`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.body.muscles.chest.sets).toBe(2);
    });

    it("previews what a template and a routine work from their target sets", async () => {
        const token = await createUserAndToken();
        const templates = await request(app)
            .get("/routine-templates?goal=strength")
            .set("Authorization", `Bearer ${token}`);
        const fiveByFive = templates.body.find((t: { name: string }) => t.name === "Fuerza - Basicos 5x5");

        const preview = await request(app)
            .get(`/routine-templates/${fiveByFive.id}/muscle-load`)
            .set("Authorization", `Bearer ${token}`);
        expect(preview.status).toBe(200);
        // 5x5 squat + 5x5 bench + 3x5 deadlift + 5x5 press
        expect(preview.body.totalSets).toBe(18);
        expect(preview.body.muscles.quadriceps.primarySets).toBe(5);
        expect(preview.body.muscles.chest.sets).toBe(5);

        const routine = await request(app)
            .post(`/routine-templates/${fiveByFive.id}/clone`)
            .set("Authorization", `Bearer ${token}`);
        const routineLoad = await request(app)
            .get(`/routines/${routine.body.id}/muscle-load`)
            .set("Authorization", `Bearer ${token}`);
        expect(routineLoad.body).toEqual(preview.body);
    });
});
