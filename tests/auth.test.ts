import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("auth", () => {
    it("registers a new user", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });

        expect(res.status).toBe(201);
        expect(res.body.token).toBeTypeOf("string");
        expect(res.body.user.email).toBe("alice@example.com");
    });

    it("rejects an invalid email", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({ email: "not-an-email", password: "password123" });

        expect(res.status).toBe(400);
    });

    it("rejects a short password", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({ email: "short@example.com", password: "short" });

        expect(res.status).toBe(400);
    });

    it("rejects a duplicate email", async () => {
        await request(app)
            .post("/auth/register")
            .send({ email: "bob@example.com", password: "password123" });

        const res = await request(app)
            .post("/auth/register")
            .send({ email: "bob@example.com", password: "password123" });

        expect(res.status).toBe(409);
    });

    it("logs in with correct credentials", async () => {
        await request(app)
            .post("/auth/register")
            .send({ email: "carol@example.com", password: "password123" });

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "carol@example.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeTypeOf("string");
    });

    it("rejects a wrong password", async () => {
        await request(app)
            .post("/auth/register")
            .send({ email: "dave@example.com", password: "password123" });

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "dave@example.com", password: "wrongpass" });

        expect(res.status).toBe(401);
    });
});
