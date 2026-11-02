import { useState } from "react";
import type { Exercise } from "../lib/types";
import { capitalize, searchExercises } from "../lib/exercises";
import { ExerciseThumb } from "./ExerciseThumb";
import { Input } from "./ui";

const MAX_RESULTS = 8;

export function ExercisePicker({
    exercises,
    onSelect,
    placeholder = "Buscar ejercicio (ej. bench press, pecho)",
}: {
    exercises: Exercise[] | undefined;
    onSelect: (exercise: Exercise) => void;
    placeholder?: string;
}) {
    const [query, setQuery] = useState("");
    const matches = query.trim() ? searchExercises(exercises ?? [], query) : [];

    function select(exercise: Exercise) {
        onSelect(exercise);
        setQuery("");
    }

    return (
        <div className="space-y-2">
            <Input
                type="search"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    // Enter picks the first match instead of submitting the form.
                    if (e.key === "Enter" && query.trim()) {
                        e.preventDefault();
                        if (matches[0]) select(matches[0]);
                    }
                }}
                aria-label="Buscar ejercicio"
            />

            {query.trim() && (
                <ul className="overflow-hidden rounded-2xl border border-concrete-200 bg-concrete-50 dark:border-concrete-700 dark:bg-concrete-800">
                    {matches.slice(0, MAX_RESULTS).map((exercise) => (
                        <li key={exercise.id}>
                            <button
                                type="button"
                                onClick={() => select(exercise)}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left active:bg-concrete-100 dark:active:bg-concrete-700"
                            >
                                <ExerciseThumb exercise={exercise} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{exercise.name}</span>
                                    {exercise.muscleGroup && (
                                        <span className="block text-sm text-concrete-500 dark:text-concrete-400">
                                            {capitalize(exercise.muscleGroup)}
                                        </span>
                                    )}
                                </span>
                            </button>
                        </li>
                    ))}
                    {matches.length === 0 && (
                        <li className="px-3 py-3 text-sm text-concrete-500 dark:text-concrete-400">
                            Sin resultados para "{query.trim()}".
                        </li>
                    )}
                    {matches.length > MAX_RESULTS && (
                        <li className="px-3 py-2 text-xs text-concrete-500 dark:text-concrete-400">
                            {matches.length - MAX_RESULTS} más; afina la búsqueda.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
