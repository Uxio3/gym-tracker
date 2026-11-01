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
});
