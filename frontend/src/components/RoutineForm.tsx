import { useState, type FormEvent } from "react";
import type { Exercise } from "../lib/types";
import { useExercises } from "../lib/exercises";
import { Button, Card, Input } from "./ui";
import { ExercisePicker } from "./ExercisePicker";
import { ExerciseThumb } from "./ExerciseThumb";

export interface RoutineFormValues {
    name: string;
    exercises: { exerciseId: number; targetSets: number; targetReps: number }[];
}

interface DraftExercise {
    key: string;
    exerciseId: number;
    targetSets: string;
    targetReps: string;
}

let nextKey = 0;
const draftKey = () => `draft-${nextKey++}`;

const numberInputClass =
    "min-h-11 w-14 rounded-lg border border-concrete-300 bg-concrete-50 px-1 text-center dark:border-concrete-700 dark:bg-concrete-900";

const iconButtonClass =
    "flex min-h-11 min-w-11 items-center justify-center rounded-lg text-concrete-500 active:bg-concrete-200 disabled:opacity-30 dark:text-concrete-400 dark:active:bg-concrete-700";

export function RoutineForm({
    initialValues,
    submitLabel,
    pending,
    error,
    onSubmit,
}: {
    initialValues?: RoutineFormValues;
    submitLabel: string;
    pending: boolean;
    error?: string | null;
    onSubmit: (values: RoutineFormValues) => void;
}) {
    const { data: exercises } = useExercises();
    const [name, setName] = useState(initialValues?.name ?? "");
    const [draft, setDraft] = useState<DraftExercise[]>(
        () =>
            initialValues?.exercises.map((e) => ({
                key: draftKey(),
                exerciseId: e.exerciseId,
                targetSets: String(e.targetSets),
                targetReps: String(e.targetReps),
            })) ?? []
    );
    const [validationError, setValidationError] = useState<string | null>(null);

    function addExercise(exercise: Exercise) {
        setDraft((prev) => [
            ...prev,
            { key: draftKey(), exerciseId: exercise.id, targetSets: "3", targetReps: "10" },
        ]);
    }

    function update(key: string, field: "targetSets" | "targetReps", value: string) {
        setDraft((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
    }

    function move(index: number, delta: -1 | 1) {
        setDraft((prev) => {
            const next = [...prev];
            const [item] = next.splice(index, 1);
            next.splice(index + delta, 0, item);
            return next;
        });
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setValidationError("Ponle un nombre a la rutina.");
            return;
        }
        const values = draft.map((item) => ({
            exerciseId: item.exerciseId,
            targetSets: Number(item.targetSets),
            targetReps: Number(item.targetReps),
        }));
        if (values.some((v) => !Number.isInteger(v.targetSets) || v.targetSets < 1 || !Number.isInteger(v.targetReps) || v.targetReps < 1)) {
            setValidationError("Las series y repeticiones deben ser números mayores que 0.");
            return;
        }
        setValidationError(null);
        onSubmit({ name: name.trim(), exercises: values });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                placeholder="Nombre (ej. Push Day)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Nombre de la rutina"
            />

            <div className="space-y-2">
                {draft.map((item, index) => {
                    const exercise = exercises?.find((e) => e.id === item.exerciseId);
                    return (
                        <Card key={item.key} className="space-y-2 p-3">
                            <div className="flex items-center gap-3">
                                <ExerciseThumb exercise={exercise} />
                                <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
                                    {exercise?.name ?? `#${item.exerciseId}`}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Quitar ejercicio"
                                    className={`${iconButtonClass} text-red-600 dark:text-red-400`}
                                    onClick={() => setDraft((prev) => prev.filter((d) => d.key !== item.key))}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    aria-label="Series"
                                    className={numberInputClass}
                                    value={item.targetSets}
                                    onChange={(e) => update(item.key, "targetSets", e.target.value)}
                                />
                                <span className="text-concrete-400">×</span>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    aria-label="Repeticiones"
                                    className={numberInputClass}
                                    value={item.targetReps}
                                    onChange={(e) => update(item.key, "targetReps", e.target.value)}
                                />
                                <span className="text-xs text-concrete-500 dark:text-concrete-400">series × reps</span>
                                <div className="ml-auto flex">
                                    <button
                                        type="button"
                                        aria-label="Subir"
                                        className={iconButtonClass}
                                        disabled={index === 0}
                                        onClick={() => move(index, -1)}
                                    >
                                        ▲
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Bajar"
                                        className={iconButtonClass}
                                        disabled={index === draft.length - 1}
                                        onClick={() => move(index, 1)}
                                    >
                                        ▼
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <ExercisePicker exercises={exercises} onSelect={addExercise} placeholder="Añadir ejercicio (ej. squat, pecho)" />

            {(validationError || error) && (
                <p className="text-sm text-red-600">{validationError ?? error}</p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Guardando..." : submitLabel}
            </Button>
        </form>
    );
}
