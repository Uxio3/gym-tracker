import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
    getRoutines,
    postRoutine,
    getRoutine,
    putRoutine,
    removeRoutine,
    getRoutineLoad,
} from "./routines.controller.js";

export const routinesRouter = Router();

routinesRouter.use(requireAuth);
routinesRouter.get("/", getRoutines);
routinesRouter.post("/", postRoutine);
routinesRouter.get("/:id", getRoutine);
routinesRouter.get("/:id/muscle-load", getRoutineLoad);
routinesRouter.put("/:id", putRoutine);
routinesRouter.delete("/:id", removeRoutine);
