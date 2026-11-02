import type { ActivityLevel, Goal } from "./types";

export const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string }[] = [
    { value: "1-2", label: "1-2 dias/semana" },
    { value: "3-4", label: "3-4 dias/semana" },
    { value: "5-6", label: "5-6 dias/semana" },
    { value: "7", label: "Todos los dias" },
];

export const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
    {
        value: "muscle",
        label: "Ganar musculatura",
        description: "Volumen moderado-alto para hipertrofia.",
    },
    {
        value: "strength",
        label: "Fuerza",
        description: "Cargas altas y pocas repeticiones.",
    },
    {
        value: "definition",
        label: "Definicion",
        description: "Repeticiones altas y trabajo cardiovascular.",
    },
];

export function goalLabel(goal: Goal) {
    return GOAL_OPTIONS.find((option) => option.value === goal)?.label ?? goal;
}

export function activityLevelLabel(level: ActivityLevel) {
    return ACTIVITY_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;
}
