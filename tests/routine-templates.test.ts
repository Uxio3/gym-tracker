import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createUserAndToken } from "./helpers.js";

describe("routine templates", () => {
    it("lists seeded templates", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .get("/routine-templates")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].exercises.length).toBeGreaterThan(0);
    });

    it("filters templates by goal", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .get("/routine-templates?goal=strength")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        for (const template of res.body) {
            expect(template.goal).toBe("strength");
        }
    });

    it("clones a template into the user's own routines", async () => {
        const token = await createUserAndToken();

        const templates = await request(app)
            .get("/routine-templates?goal=muscle")
            .set("Authorization", `Bearer ${token}`);
        const template = templates.body[0];

        const clone = await request(app)
            .post(`/routine-templates/${template.id}/clone`)
            .set("Authorization", `Bearer ${token}`);

        expect(clone.status).toBe(201);
        expect(clone.body.name).toBe(template.name);
        expect(clone.body.exercises.length).toBe(template.exercises.length);

        const list = await request(app)
            .get("/routines")
            .set("Authorization", `Bearer ${token}`);
        expect(list.body.some((r: { id: number }) => r.id === clone.body.id)).toBe(true);
    });

    it("returns 404 when cloning a nonexistent template", async () => {
        const token = await createUserAndToken();

        const res = await request(app)
            .post("/routine-templates/999999/clone")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});
