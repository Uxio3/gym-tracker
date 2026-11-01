import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createUserAndToken } from "./helpers.js";

describe("exercises", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/exercises");
        expect(res.status).toBe(401);
    });

    it("creates and lists exercises", async () => {
        const token = await createUserAndToken();

        const create = await request(app)
            .post("/exercises")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Bench Press", muscleGroup: "chest" });
        expect(create.status).toBe(201);

        const list = await request(app)
            .get("/exercises")
            .set("Authorization", `Bearer ${token}`);
        expect(list.status).toBe(200);
        expect(list.body).toHaveLength(1);
        expect(list.body[0].name).toBe("Bench Press");
    });

    it("rejects a missing name", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .post("/exercises")
            .set("Authorization", `Bearer ${token}`)
            .send({ muscleGroup: "legs" });

        expect(res.status).toBe(400);
    });
});
