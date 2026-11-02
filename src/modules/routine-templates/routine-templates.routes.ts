import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getTemplates, getTemplate, postCloneTemplate, getTemplateLoad } from "./routine-templates.controller.js";

export const routineTemplatesRouter = Router();

routineTemplatesRouter.use(requireAuth);
routineTemplatesRouter.get("/", getTemplates);
routineTemplatesRouter.get("/:id", getTemplate);
routineTemplatesRouter.get("/:id/muscle-load", getTemplateLoad);
routineTemplatesRouter.post("/:id/clone", postCloneTemplate);
