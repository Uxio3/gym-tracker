import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createUserAndToken, createExercise } from "./helpers.js";

describe("routines", () => {
    it("creates a routine with exercises and fetches it", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);

        const create = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Leg Day",
                exercises: [{ exerciseId, targetSets: 3, targetReps: 10 }],
            });
        expect(create.status).toBe(201);
        expect(create.body.exercises).toHaveLength(1);

        const get = await request(app)
            .get(`/routines/${create.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(get.status).toBe(200);
        expect(get.body.name).toBe("Leg Day");
    });

    it("lists routines with their exercise count", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);

        await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Leg Day",
                exercises: [{ exerciseId, targetSets: 3, targetReps: 10 }],
            });
        await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Rest Day" });

        const list = await request(app)
            .get("/routines")
            .set("Authorization", `Bearer ${token}`);

        expect(list.status).toBe(200);
        const legDay = list.body.find((r: { name: string }) => r.name === "Leg Day");
        const restDay = list.body.find((r: { name: string }) => r.name === "Rest Day");
        expect(legDay.exerciseCount).toBe(1);
        expect(restDay.exerciseCount).toBe(0);
    });

    it("returns 404 for another user's routine", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");

        const create = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ name: "Push Day" });

        const res = await request(app)
            .get(`/routines/${create.body.id}`)
            .set("Authorization", `Bearer ${tokenB}`);
        expect(res.status).toBe(404);
    });

    it("deletes a routine", async () => {
        const token = await createUserAndToken();

        const create = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Pull Day" });

        const del = await request(app)
            .delete(`/routines/${create.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(del.status).toBe(204);

        const get = await request(app)
            .get(`/routines/${create.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(get.status).toBe(404);
    });

    it("edits a routine's name and exercises", async () => {
        const token = await createUserAndToken();
        const squat = await createExercise(token, "Squat");
        const press = await createExercise(token, "Press");

        const create = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Leg Day", exercises: [{ exerciseId: squat, targetSets: 3, targetReps: 10 }] });

        const update = await request(app)
            .put(`/routines/${create.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Full Body",
                exercises: [
                    { exerciseId: press, targetSets: 4, targetReps: 8 },
                    { exerciseId: squat, targetSets: 5, targetReps: 5 },
                ],
            });

        expect(update.status).toBe(200);
        expect(update.body.name).toBe("Full Body");
        expect(update.body.exercises).toHaveLength(2);
        expect(update.body.exercises[0].exerciseId).toBe(press);
        expect(update.body.exercises[1].targetSets).toBe(5);
    });

    it("rejects editing another user's routine", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");

        const create = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ name: "Mine" });

        const res = await request(app)
            .put(`/routines/${create.body.id}`)
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ name: "Hijacked", exercises: [] });
        expect(res.status).toBe(404);
    });

    it("rejects exercises the user can't see", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");
        const privateId = await createExercise(tokenA, "Secret");

        const res = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ name: "Sneaky", exercises: [{ exerciseId: privateId }] });
        expect(res.status).toBe(400);

        const missing = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ name: "Ghost", exercises: [{ exerciseId: 99999999 }] });
        expect(missing.status).toBe(400);
    });

    it("deletes a routine that already has workouts, keeping the history", async () => {
        const token = await createUserAndToken();
        const exerciseId = await createExercise(token);

        const routine = await request(app)
            .post("/routines")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Leg Day", exercises: [{ exerciseId, targetSets: 3, targetReps: 10 }] });
        const session = await request(app)
            .post("/workouts")
            .set("Authorization", `Bearer ${token}`)
            .send({ routineId: routine.body.id });
        await request(app)
            .post(`/workouts/${session.body.id}/sets`)
            .set("Authorization", `Bearer ${token}`)
            .send({ exerciseId, reps: 10 });

        const del = await request(app)
            .delete(`/routines/${routine.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(del.status).toBe(204);

        const detail = await request(app)
            .get(`/workouts/${session.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(detail.status).toBe(200);
        expect(detail.body.routineId).toBeNull();
        expect(detail.body.sets).toHaveLength(1);
    });
});

