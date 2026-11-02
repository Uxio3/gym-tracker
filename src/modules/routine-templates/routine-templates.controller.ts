import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import {
    listTemplates,
    getTemplateById,
    cloneTemplateToUser,
    getTemplateMuscleLoad,
} from "./routine-templates.service.js";

export async function getTemplates(req: AuthRequest, res: Response) {
    const goal = typeof req.query.goal === "string" ? req.query.goal : undefined;
    const templates = await listTemplates(goal);
    res.json(templates);
}

export async function getTemplate(req: AuthRequest, res: Response) {
    const template = await getTemplateById(Number(req.params.id));
    res.json(template);
}

export async function postCloneTemplate(req: AuthRequest, res: Response) {
    const templateId = Number(req.params.id);
    const routine = await cloneTemplateToUser(req.userId!, templateId);
    res.status(201).json(routine);
}

export async function getTemplateLoad(req: AuthRequest, res: Response) {
    res.json(await getTemplateMuscleLoad(Number(req.params.id)));
}
