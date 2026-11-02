import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

// Dataset muscle keys, as returned by the /muscle-load endpoints.
export const MUSCLE_LABELS = {
    abdominals: "Abdominales",
    abductors: "Abductores",
    adductors: "Aductores",
    biceps: "Bíceps",
    calves: "Gemelos",
    chest: "Pecho",
    forearms: "Antebrazos",
    glutes: "Glúteos",
    hamstrings: "Isquiotibiales",
    lats: "Dorsales",
    "lower back": "Zona lumbar",
    "middle back": "Espalda media",
    neck: "Cuello",
    quadriceps: "Cuádriceps",
    shoulders: "Hombros",
    traps: "Trapecios",
    triceps: "Tríceps",
} as const;

export type MuscleKey = keyof typeof MUSCLE_LABELS;

export interface MuscleLoad {
    sets: number;
    primarySets: number;
    secondarySets: number;
    exercises: { exerciseId: number; name: string; sets: number; role: "primary" | "secondary" }[];
}

export interface MuscleLoadResult {
    muscles: Partial<Record<MuscleKey, MuscleLoad>>;
    totalSets: number;
}

// Which drawn shapes each muscle lights up. The drawing has no separate
// abductors, lats or mid-back, so those share the nearest shape.
export const MUSCLE_SHAPES: Record<MuscleKey, string[]> = {
    abdominals: ["abs", "obliques"],
    abductors: ["gluteal"],
    adductors: ["adductors"],
    biceps: ["biceps"],
    calves: ["calves"],
    chest: ["chest"],
    forearms: ["forearm"],
    glutes: ["gluteal"],
    hamstrings: ["hamstring"],
    lats: ["upper-back"],
    "lower back": ["lower-back"],
    "middle back": ["upper-back"],
    neck: ["neck"],
    quadriceps: ["quadriceps"],
    shoulders: ["deltoids"],
    traps: ["trapezius"],
    triceps: ["triceps"],
};

// Shapes that are body, not muscle: always drawn in the neutral body tone.
export const NON_MUSCLE_SHAPES = new Set(["hair", "head", "hands", "feet", "knees", "ankles", "tibialis"]);

export function musclesForShape(slug: string) {
    return (Object.keys(MUSCLE_SHAPES) as MuscleKey[]).filter((key) => MUSCLE_SHAPES[key].includes(slug));
}

export type LoadScale = "workout" | "week" | "relative";

// Effective sets at which each colour level starts (levels 1–4).
const THRESHOLDS: Record<Exclude<LoadScale, "relative">, [number, number, number, number]> = {
    workout: [0.01, 2, 4, 6],
    week: [0.01, 5, 10, 16],
};

export function loadLevel(sets: number, scale: LoadScale, maxSets: number): 0 | 1 | 2 | 3 | 4 {
    if (sets <= 0) return 0;
    const value = scale === "relative" ? sets / Math.max(maxSets, 0.01) : sets;
    const thresholds = scale === "relative" ? [0.01, 0.3, 0.55, 0.85] : THRESHOLDS[scale];
    let level = 0;
    thresholds.forEach((t, i) => {
        if (value >= t) level = i + 1;
    });
    return level as 0 | 1 | 2 | 3 | 4;
}

export const LEGEND: Record<LoadScale, string[]> = {
    workout: ["< 2 series", "2–4", "4–6", "6 o más"],
    week: ["< 5 series", "5–10", "10–16", "16 o más"],
    relative: ["Poco", "Algo", "Bastante", "Mucho"],
};

export function formatSets(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

export function useMuscleLoad(path: string | null) {
    return useQuery({
        queryKey: ["muscle-load", path],
        queryFn: () => api.get<MuscleLoadResult>(path!),
        enabled: path !== null,
    });
}

export function usePrefersDark() {
    const query = "(prefers-color-scheme: dark)";
    const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? false);
    useEffect(() => {
        const media = window.matchMedia?.(query);
        if (!media) return;
        const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);
    return dark;
}
