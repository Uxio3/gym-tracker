import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createUserAndToken } from "./helpers.js";

describe("profile", () => {
    it("returns null when the user has no profile yet", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .get("/profile")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeNull();
    });

    it("creates a profile", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .put("/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({
                weightKg: 80,
                heightCm: 180,
                age: 28,
                activityLevel: "3-4",
                goal: "muscle",
            });

        expect(res.status).toBe(200);
        expect(res.body.goal).toBe("muscle");
        expect(res.body.activityLevel).toBe("3-4");

        const get = await request(app)
            .get("/profile")
            .set("Authorization", `Bearer ${token}`);
        expect(get.body.weightKg).toBe(80);
    });

    it("updates an existing profile instead of duplicating it", async () => {
        const token = await createUserAndToken();

        await request(app)
            .put("/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({
                weightKg: 80,
                heightCm: 180,
                age: 28,
                activityLevel: "3-4",
                goal: "muscle",
            });

        const update = await request(app)
            .put("/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({
                weightKg: 82,
                heightCm: 180,
                age: 29,
                activityLevel: "5-6",
                goal: "definition",
            });

        expect(update.status).toBe(200);
        expect(update.body.goal).toBe("definition");

        const get = await request(app)
            .get("/profile")
            .set("Authorization", `Bearer ${token}`);
        expect(get.body.weightKg).toBe(82);
        expect(get.body.goal).toBe("definition");
    });

    it("rejects an invalid goal", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .put("/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({
                weightKg: 80,
                heightCm: 180,
                age: 28,
                activityLevel: "3-4",
                goal: "not-a-real-goal",
            });

        expect(res.status).toBe(400);
    });

    it("keeps each user's profile separate", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");

        await request(app)
            .put("/profile")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({
                weightKg: 70,
                heightCm: 170,
                age: 25,
                activityLevel: "1-2",
                goal: "strength",
            });

        const getB = await request(app)
            .get("/profile")
            .set("Authorization", `Bearer ${tokenB}`);
        expect(getB.body).toBeNull();
    });
});
