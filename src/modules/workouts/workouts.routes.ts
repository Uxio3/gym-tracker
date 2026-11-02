import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
    postSession,
    getSessions,
    getSession,
    removeSession,
    postSet,
    patchSet,
    removeSet,
    postFinish,
    postReopen,
    getSessionLoad,
} from "./workouts.controller.js";

export const workoutsRouter = Router();

workoutsRouter.use(requireAuth);
workoutsRouter.post("/", postSession);
workoutsRouter.get("/", getSessions);
workoutsRouter.get("/:id", getSession);
workoutsRouter.get("/:id/muscle-load", getSessionLoad);
workoutsRouter.delete("/:id", removeSession);
workoutsRouter.post("/:id/sets", postSet);
workoutsRouter.patch("/:id/sets/:setId", patchSet);
workoutsRouter.delete("/:id/sets/:setId", removeSet);
workoutsRouter.post("/:id/finish", postFinish);
workoutsRouter.post("/:id/reopen", postReopen);
