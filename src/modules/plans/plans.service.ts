import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { trainingPlans } from "../../db/schema.js";
import { HttpError } from "../../utils/http-error.js";
import { getRoutineById } from "../routines/routines.service.js";
import { insertRoutineFromTemplate } from "../routine-templates/routine-templates.service.js";

export const PLAN_DURATION_MONTHS = 3;

function activePlanFor(userId: number) {
    return and(eq(trainingPlans.userId, userId), gt(trainingPlans.endsAt, new Date()));
}

export async function getCurrentPlan(userId: number) {
    const [plan] = await db
        .select()
        .from(trainingPlans)
        .where(activePlanFor(userId))
        .orderBy(desc(trainingPlans.startedAt))
        .limit(1);

    if (!plan) {
        return null;
    }

    const routine = await getRoutineById(userId, plan.routineId);
    return { ...plan, routine };
}

// Copies the template into the user's routines and commits to it for the
// next PLAN_DURATION_MONTHS. Only one plan can be active at a time.
export async function startPlan(userId: number, templateId: number) {
    await db.transaction(async (tx) => {
        const [active] = await tx
            .select({ id: trainingPlans.id })
            .from(trainingPlans)
            .where(activePlanFor(userId))
            .limit(1);

        if (active) {
            throw new HttpError(409, "You already have an active plan");
        }

        const routineId = await insertRoutineFromTemplate(tx, userId, templateId);

        const startedAt = new Date();
        const endsAt = new Date(startedAt);
        endsAt.setMonth(endsAt.getMonth() + PLAN_DURATION_MONTHS);

        await tx.insert(trainingPlans).values({ userId, routineId, templateId, startedAt, endsAt });
    });

    return getCurrentPlan(userId);
}
