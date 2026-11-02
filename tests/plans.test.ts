import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createUserAndToken } from "./helpers.js";

async function firstTemplate(token: string, goal = "muscle") {
    const res = await request(app)
        .get(`/routine-templates?goal=${goal}`)
        .set("Authorization", `Bearer ${token}`);
    return res.body[0] as { id: number; name: string; exercises: unknown[] };
}

describe("training plans", () => {
    it("has no current plan for a new user", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .get("/plans/current")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeNull();
    });

    it("shows a template's detail before choosing it", async () => {
        const token = await createUserAndToken();
        const template = await firstTemplate(token);

        const res = await request(app)
            .get(`/routine-templates/${template.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe(template.name);
        expect(res.body.exercises).toHaveLength(template.exercises.length);
        expect(res.body.exercises[0].order).toBe(0);

        const missing = await request(app)
            .get("/routine-templates/999999")
            .set("Authorization", `Bearer ${token}`);
        expect(missing.status).toBe(404);
    });

    it("starts a 3-month plan from a template", async () => {
        const token = await createUserAndToken();
        const template = await firstTemplate(token);

        const res = await request(app)
            .post("/plans")
            .set("Authorization", `Bearer ${token}`)
            .send({ templateId: template.id });

        expect(res.status).toBe(201);
        expect(res.body.templateId).toBe(template.id);
        expect(res.body.routine.name).toBe(template.name);
        expect(res.body.routine.exercises).toHaveLength(template.exercises.length);

        const days =
            (new Date(res.body.endsAt).getTime() - new Date(res.body.startedAt).getTime()) /
            (24 * 60 * 60 * 1000);
        expect(days >= 89 && days <= 92).toBe(true);

        const current = await request(app)
            .get("/plans/current")
            .set("Authorization", `Bearer ${token}`);
        expect(current.body.id).toBe(res.body.id);

        // The chosen routine shows up among the user's routines.
        const routines = await request(app)
            .get("/routines")
            .set("Authorization", `Bearer ${token}`);
        expect(routines.body.some((r: { id: number }) => r.id === res.body.routineId)).toBe(true);
    });

    it("rejects a second plan while one is active", async () => {
        const token = await createUserAndToken();
        const template = await firstTemplate(token);

        await request(app)
            .post("/plans")
            .set("Authorization", `Bearer ${token}`)
            .send({ templateId: template.id });

        const second = await request(app)
            .post("/plans")
            .set("Authorization", `Bearer ${token}`)
            .send({ templateId: template.id });
        expect(second.status).toBe(409);

        // No extra routine was left behind by the rejected attempt.
        const routines = await request(app)
            .get("/routines")
            .set("Authorization", `Bearer ${token}`);
        expect(routines.body).toHaveLength(1);
    });

    it("returns 404 for a nonexistent template and 400 for a bad body", async () => {
        const token = await createUserAndToken();

        const missing = await request(app)
            .post("/plans")
            .set("Authorization", `Bearer ${token}`)
            .send({ templateId: 999999 });
        expect(missing.status).toBe(404);

        const bad = await request(app)
            .post("/plans")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(bad.status).toBe(400);
    });

    it("keeps each user's plan separate", async () => {
        const tokenA = await createUserAndToken("a@example.com");
        const tokenB = await createUserAndToken("b@example.com");
        const template = await firstTemplate(tokenA);

        await request(app)
            .post("/plans")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ templateId: template.id });

        const res = await request(app)
            .get("/plans/current")
            .set("Authorization", `Bearer ${tokenB}`);
        expect(res.body).toBeNull();
    });

    it("drops the plan when its routine is deleted", async () => {
        const token = await createUserAndToken();
        const template = await firstTemplate(token);

        const plan = await request(app)
            .post("/plans")
            .set("Authorization", `Bearer ${token}`)
            .send({ templateId: template.id });

        const del = await request(app)
            .delete(`/routines/${plan.body.routineId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(del.status).toBe(204);

        const current = await request(app)
            .get("/plans/current")
            .set("Authorization", `Bearer ${token}`);
        expect(current.body).toBeNull();
    });
});
