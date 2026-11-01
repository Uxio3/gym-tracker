import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
    postSession,
    getSessions,
    getSession,
    postSet,
    postFinish,
} from "./workouts.controller.js";

export const workoutsRouter = Router();

workoutsRouter.use(requireAuth);
workoutsRouter.post("/", postSession);
workoutsRouter.get("/", getSessions);
workoutsRouter.get("/:id", getSession);
workoutsRouter.post("/:id/sets", postSet);
workoutsRouter.post("/:id/finish", postFinish);
