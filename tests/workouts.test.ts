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

    it("includes the routine plan in the session detail", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);
        const routine = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Leg Day", exercises: [{ exerciseId, targetSets: 4, targetReps: 8 }] });

        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({ routineId: routine.body.id });

        const detail = await request(app)
            .get(`/workouts/${session.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(detail.body.routine.name).toBe("Leg Day");
        expect(detail.body.routine.exercises[0].targetSets).toBe(4);

        const list = await request(app)
            .get("/workouts")
            .set("Authorization", `Bearer ${token}`);
        expect(list.body[0].routineName).toBe("Leg Day");
    });

    it("rejects starting a session from another user's routine", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");
        const routine = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ name: "Mine" });

        const res = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ routineId: routine.body.id });
        expect(res.status).toBe(404);
    });

    it("numbers sets automatically and allows different reps and weight per set", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);
        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        const first = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, reps: 10, weightKg: 60 });
        const second = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, reps: 8, weightKg: 65 });
        const bodyweight = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, reps: 12 });

        expect(first.body.setNumber).toBe(1);
        expect(second.body.setNumber).toBe(2);
        expect(second.body.weightKg).toBe(65);
        expect(bodyweight.body.setNumber).toBe(3);
        expect(bodyweight.body.weightKg).toBeNull();
    });

    it("edits a set", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);
        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        const set = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, reps: 10, weightKg: 60 });

        const res = await request(app)
            .patch(`/workouts/${session.body.id}/sets/${set.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ reps: 9, weightKg: null });

        expect(res.status).toBe(200);
        expect(res.body.reps).toBe(9);
        expect(res.body.weightKg).toBeNull();

        const empty = await request(app)
            .patch(`/workouts/${session.body.id}/sets/${set.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(empty.status).toBe(400);
    });

    it("deletes a set and renumbers the rest", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);
        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        const ids: number[] = [];
        for (const reps of [10, 9, 8]) {
            const res = await request(app)
                .post(`/workouts/${session.body.id}/sets`)
                .set("Authorization", `Bearer ${token}`)
                .send({ exerciseId, reps });
            ids.push(res.body.id);
        }

        const del = await request(app)
            .delete(`/workouts/${session.body.id}/sets/${ids[0]}`)
            .set("Authorization", `Bearer ${token}`);
        expect(del.status).toBe(204);

        const detail = await request(app)
            .get(`/workouts/${session.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(detail.body.sets.map((s: { setNumber: number }) => s.setNumber).join(",")).toBe("1,2");
        expect(detail.body.sets[0].reps).toBe(9);
    });

    it("can't touch another user's sets", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");
        const exerciseId = await createExercise(tokenA);
        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({});
        const set = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ exerciseId, reps: 10 });

        const patch = await request(app)
            .patch(`/workouts/${session.body.id}/sets/${set.body.id}`)
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ reps: 1 });
        expect(patch.status).toBe(404);

        const del = await request(app)
            .delete(`/workouts/${session.body.id}/sets/${set.body.id}`)
            .set("Authorization", `Bearer ${tokenB}`);
        expect(del.status).toBe(404);
    });

    it("rejects a set with another user's private exercise", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");
        const privateId = await createExercise(tokenA, "Secret");
        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({});

        const res = await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ exerciseId: privateId, reps: 5 });
        expect(res.status).toBe(400);
    });

    it("reopens a finished session and deletes a session with its sets", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);
        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, reps: 5 });
        await request(app)
            .post(`/workouts/${session.body.id}/finish`)
            .set("Authorization", `Bearer ${token}`);

        const reopen = await request(app)
            .post(`/workouts/${session.body.id}/reopen`)
            .set("Authorization", `Bearer ${token}`);
        expect(reopen.status).toBe(200);
        expect(reopen.body.finishedAt).toBeNull();

        const del = await request(app)
            .delete(`/workouts/${session.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(del.status).toBe(204);

        const detail = await request(app)
            .get(`/workouts/${session.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(detail.status).toBe(404);
    });
});

