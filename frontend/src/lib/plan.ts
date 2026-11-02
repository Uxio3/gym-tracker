import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { TrainingPlan } from "./types";

export const PLAN_QUERY_KEY = ["plan"] as const;

export function useCurrentPlan() {
    return useQuery({
        queryKey: PLAN_QUERY_KEY,
        queryFn: () => api.get<TrainingPlan | null>("/plans/current"),
    });
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function planProgress(plan: Pick<TrainingPlan, "startedAt" | "endsAt">, now = Date.now()) {
    const start = new Date(plan.startedAt).getTime();
    const end = new Date(plan.endsAt).getTime();
    const totalWeeks = Math.max(1, Math.round((end - start) / (7 * DAY_MS)));
    const elapsed = Math.min(Math.max(now - start, 0), end - start);
    const week = Math.min(totalWeeks, Math.floor(elapsed / (7 * DAY_MS)) + 1);
    const daysLeft = Math.max(0, Math.ceil((end - now) / DAY_MS));
    return { week, totalWeeks, daysLeft, percent: Math.round((elapsed / (end - start)) * 100) };
}

export function formatPlanDate(date: string | Date) {
    return new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

// End date a plan started now would have (mirrors the backend's 3 months).
export function planEndDateFromNow() {
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    return end;
}
