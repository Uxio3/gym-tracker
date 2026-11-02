import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Exercise } from "./types";

export function useExercises() {
    return useQuery({
        queryKey: ["exercises"],
        queryFn: () => api.get<Exercise[]>("/exercises"),
        // The catalog barely changes; avoid refetching ~900 rows on every mount.
        staleTime: 5 * 60 * 1000,
    });
}

function normalize(text: string) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

// Every word of the query has to appear in the name, muscle or equipment,
// so queries like "press pecho" narrow things down quickly. Results whose
// name starts with (or contains) the whole query are listed first.
export function searchExercises(exercises: Exercise[], query: string) {
    const normalizedQuery = normalize(query).trim();
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    if (words.length === 0) return exercises;

    const scored: { exercise: Exercise; score: number }[] = [];
    for (const exercise of exercises) {
        const name = normalize(exercise.name);
        const haystack = [name, exercise.muscleGroup, exercise.equipment]
            .filter(Boolean)
            .map((v) => normalize(v!))
            .join(" ");
        if (!words.every((word) => haystack.includes(word))) continue;

        const score = name.startsWith(normalizedQuery) ? 0 : name.includes(normalizedQuery) ? 1 : 2;
        scored.push({ exercise, score });
    }

    // Array.prototype.sort is stable, so equal scores keep the API's A-Z order.
    return scored.sort((a, b) => a.score - b.score).map((entry) => entry.exercise);
}

// Body parts for the filter. Catalog values are already Spanish labels;
// user-created exercises may spell the same one differently ("pecho" vs
// "Pecho"), so they're grouped case- and accent-insensitively.
export function muscleGroups(exercises: Exercise[]) {
    const byKey = new Map<string, string>();
    for (const { muscleGroup } of exercises) {
        if (!muscleGroup) continue;
        const key = normalize(muscleGroup.trim());
        if (!byKey.has(key)) byKey.set(key, capitalize(muscleGroup.trim()));
    }
    return [...byKey.values()].sort((a, b) => a.localeCompare(b, "es"));
}

export function sameMuscleGroup(a: string | null, b: string) {
    return a !== null && normalize(a.trim()) === normalize(b.trim());
}

export function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
