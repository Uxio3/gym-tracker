import request from "supertest";
import { app } from "../src/app.js";

export async function createUserAndToken(
    email = "user@example.com",
    password = "password123"
) {
    const res = await request(app)
        .post("/auth/register")
        .send({ email, password });
    return res.body.token as string;
}

export async function createExercise(token: string, name = "Squat") {
    const res = await request(app)
        .post("/exercises")
        .set("Authorization", `Bearer ${token}`)
        .send({ name });
    return res.body.id as number;
}
