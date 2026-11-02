import { asc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { routineTemplates, routineTemplateExercises, routines, routineExercises } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";
import { getRoutineById } from "../routines/routines.service.js";
import { computeMuscleLoad } from "../muscle-load/muscle-load.service.js";

// Either the shared client or a transaction handle.
type DbExecutor = Pick<typeof db, "select" | "insert">;

export async function listTemplates(goal?: string) {
    const query = db.select().from(routineTemplates);
    const templates = goal
        ? await query.where(eq(routineTemplates.goal, goal))
        : await query;

    const exercises = await db.select().from(routineTemplateExercises);

    return templates.map((template) => ({
        ...template,
        exercises: exercises
            .filter((exercise) => exercise.templateId === template.id)
            .sort((a, b) => a.order - b.order),
    }));
}

export async function getTemplateById(templateId: number) {
    const [template] = Number.isInteger(templateId)
        ? await db.select().from(routineTemplates).where(eq(routineTemplates.id, templateId))
        : [];

    if (!template) {
        throw new HttpError(404, "Routine template not found");
    }

    const exercises = await db
        .select()
        .from(routineTemplateExercises)
        .where(eq(routineTemplateExercises.templateId, templateId))
        .orderBy(asc(routineTemplateExercises.order));

    return { ...template, exercises };
}

// Copies a template into a new routine owned by the user and returns its id.
export async function insertRoutineFromTemplate(
    executor: DbExecutor,
    userId: number,
    templateId: number
) {
    const [template] = Number.isInteger(templateId)
        ? await executor
              .select()
              .from(routineTemplates)
              .where(eq(routineTemplates.id, templateId))
        : [];

    if (!template) {
        throw new HttpError(404, "Routine template not found");
    }

    const templateExercises = await executor
        .select()
        .from(routineTemplateExercises)
        .where(eq(routineTemplateExercises.templateId, templateId));

    const [routine] = await executor
        .insert(routines)
        .values({ userId, name: template.name })
        .returning();

    if (templateExercises.length > 0) {
        await executor.insert(routineExercises).values(
            templateExercises.map((exercise) => ({
                routineId: routine.id,
                exerciseId: exercise.exerciseId,
                order: exercise.order,
                targetSets: exercise.targetSets,
                targetReps: exercise.targetReps,
            }))
        );
    }

    return routine.id;
}

export async function cloneTemplateToUser(userId: number, templateId: number) {
    const routineId = await insertRoutineFromTemplate(db, userId, templateId);
    return getRoutineById(userId, routineId);
}

export async function getTemplateMuscleLoad(templateId: number) {
    const template = await getTemplateById(templateId);
    return computeMuscleLoad(
        template.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.targetSets ?? 1 }))
    );
}
