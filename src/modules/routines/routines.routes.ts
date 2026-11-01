import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
    getRoutines,
    postRoutine,
    getRoutine,
    removeRoutine,
} from "./routines.controller.js";

export const routinesRouter = Router();

routinesRouter.use(requireAuth);
routinesRouter.get("/", getRoutines);
routinesRouter.post("/", postRoutine);
routinesRouter.get("/:id", getRoutine);
routinesRouter.delete("/:id", removeRoutine);
