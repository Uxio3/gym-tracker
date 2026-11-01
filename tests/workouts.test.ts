import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createUserAndToken, createExercise } from "./helpers.js";

describe("workouts", () => {
    it("runs a full session lifecycle", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token, "Deadlift");

        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(session.status).toBe(201);
        expect(session.body.finishedAt).toBeNull();

        const set = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, setNumber: 1, reps: 5, weightKg: 100 });
        expect(set.status).toBe(201);

        const finish = await request(app)
            .post(`/workouts/${session.body.id}/finish`)
            .set("Authorization", `Bearer ${token}`);
        expect(finish.status).toBe(200);
        expect(finish.body.finishedAt).not.toBeNull();

        const detail = await request(app)
            .get(`/workouts/${session.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(detail.status).toBe(200);
        expect(detail.body.sets).toHaveLength(1);
    });

    it("lists sessions with their set count", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token, "Squat");

        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, setNumber: 1, reps: 5 });
        await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, setNumber: 2, reps: 5 });

        const list = await request(app)
            .get("/workouts")
            .set("Authorization", `Bearer ${token}`);

        expect(list.status).toBe(200);
        expect(list.body[0].setCount).toBe(2);
    });

    it("rejects an invalid set payload", async () => {
        const token = await createUserAndToken();

        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        const res = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId: 1 });

        expect(res.status).toBe(400);
    });

    it("returns 404 for a session belonging to another user", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");

        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({});

        const res = await request(app)
            .get(`/workouts/${session.body.id}`)
            .set("Authorization", `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});
