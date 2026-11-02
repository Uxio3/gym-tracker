import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Exercise, SetEntry } from "../lib/types";
import { parseDecimal } from "../lib/workouts";
import { Card } from "./ui";
import { ExerciseThumb } from "./ExerciseThumb";

interface PlannedRow {
    key: string;
    reps: string;
    weight: string;
}

let nextKey = 0;
const rowKey = () => `planned-${nextKey++}`;

const GRID = "grid grid-cols-[2.25rem_1fr_1fr_2.75rem_2.75rem] items-center gap-2";

const inputClass =
    "min-h-11 w-full min-w-0 rounded-lg border bg-concrete-50 px-2 text-center text-base outline-none focus:border-steelblue focus:ring-2 focus:ring-steelblue/20 dark:bg-concrete-900 dark:focus:border-steelblue-light";

const iconButton =
    "flex min-h-11 min-w-11 items-center justify-center rounded-lg text-lg disabled:opacity-40";

function formatWeight(value: number | null) {
    return value === null ? "" : String(value).replace(".", ",");
}

function validReps(text: string) {
    const n = Number(text);
    return text.trim() !== "" && Number.isInteger(n) && n >= 0;
}

function validWeight(text: string) {
    const n = parseDecimal(text);
    return n === null || (!Number.isNaN(n) && n >= 0);
}

// One exercise of the workout: what was planned (from the routine), what has
// been logged so far, and rows to log the remaining sets.
export function ExerciseLog({
    sessionId,
    exercise,
    exerciseId,
    target,
    sets,
    finished,
}: {
    sessionId: number;
    exercise: Exercise | undefined;
    exerciseId: number;
    target: { sets: number | null; reps: number | null } | null;
    sets: SetEntry[];
    finished: boolean;
}) {
    const queryClient = useQueryClient();
    const lastSet = sets[sets.length - 1];

    const [planned, setPlanned] = useState<PlannedRow[]>(() => {
        const wanted = target?.sets ?? (sets.length === 0 ? 1 : 0);
        return Array.from({ length: Math.max(0, wanted - sets.length) }, () => ({
            key: rowKey(),
            reps: String(target?.reps ?? lastSet?.reps ?? ""),
            weight: formatWeight(lastSet?.weightKg ?? null),
        }));
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["workouts"] });
        queryClient.invalidateQueries({ queryKey: ["muscle-load"] });
    };

    const addSet = useMutation({
        mutationFn: (row: PlannedRow) =>
            api.post<SetEntry>(`/workouts/${sessionId}/sets`, {
                exerciseId,
                reps: Number(row.reps),
                weightKg: parseDecimal(row.weight),
            }),
        onSuccess: (saved, row) => {
            setPlanned((prev) =>
                prev
                    .filter((r) => r.key !== row.key)
                    // Carry the weight forward to the next sets still empty.
                    .map((r) => (r.weight === "" ? { ...r, weight: formatWeight(saved.weightKg) } : r))
            );
            refresh();
        },
    });

    function updatePlanned(key: string, field: "reps" | "weight", value: string) {
        setPlanned((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
    }

    function addRow() {
        const source = planned[planned.length - 1];
        setPlanned((prev) => [
            ...prev,
            {
                key: rowKey(),
                reps: source?.reps ?? String(lastSet?.reps ?? target?.reps ?? ""),
                weight: source?.weight ?? formatWeight(lastSet?.weightKg ?? null),
            },
        ]);
    }

    const done = sets.length;
    const goal = target?.sets ?? null;

    if (finished) {
        return <ExerciseSummary exercise={exercise} exerciseId={exerciseId} target={target} sets={sets} />;
    }

    return (
        <Card className="space-y-3">
            <Link to={`/exercises/${exerciseId}`} className="flex items-center gap-3">
                <ExerciseThumb exercise={exercise} size={56} />
                <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{exercise?.name ?? `Ejercicio #${exerciseId}`}</p>
                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                        {target ? `Objetivo: ${target.sets ?? "-"} × ${target.reps ?? "-"}` : "Fuera de la rutina"}
                    </p>
                </div>
                {goal !== null && (
                    <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            done >= goal
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                : "bg-concrete-200 text-concrete-700 dark:bg-concrete-700 dark:text-concrete-200"
                        }`}
                    >
                        {done}/{goal}
                    </span>
                )}
            </Link>

            {(sets.length > 0 || planned.length > 0) && (
                <div className="space-y-2">
                    <div className={`${GRID} text-xs text-concrete-500 dark:text-concrete-400`}>
                        <span className="text-center">Serie</span>
                        <span className="text-center">Reps</span>
                        <span className="text-center">Kg</span>
                        <span />
                        <span />
                    </div>

                    {sets.map((set) => (
                        <LoggedSetRow
                            key={set.id}
                            sessionId={sessionId}
                            set={set}
                            onChanged={refresh}
                        />
                    ))}

                    {planned.map((row, index) => {
                            const canSave = validReps(row.reps) && validWeight(row.weight);
                            const saving = addSet.isPending && addSet.variables?.key === row.key;
                            return (
                                <div key={row.key} className={GRID}>
                                    <span className="text-center text-sm font-medium text-concrete-500 dark:text-concrete-400">
                                        {done + index + 1}
                                    </span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        aria-label={`Repeticiones de la serie ${done + index + 1}`}
                                        placeholder={target?.reps ? String(target.reps) : "-"}
                                        className={`${inputClass} border-dashed border-concrete-300 dark:border-concrete-600`}
                                        value={row.reps}
                                        onChange={(e) => updatePlanned(row.key, "reps", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        aria-label={`Peso en kg de la serie ${done + index + 1}`}
                                        placeholder="-"
                                        className={`${inputClass} border-dashed ${
                                            validWeight(row.weight) ? "border-concrete-300 dark:border-concrete-600" : "border-red-500"
                                        }`}
                                        value={row.weight}
                                        onChange={(e) => updatePlanned(row.key, "weight", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        aria-label={`Registrar serie ${done + index + 1}`}
                                        disabled={!canSave || addSet.isPending}
                                        onClick={() => addSet.mutate(row)}
                                        className={`${iconButton} bg-concrete-900 text-volt dark:bg-volt dark:text-concrete-900`}
                                    >
                                        {saving ? "…" : "✓"}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Quitar serie"
                                        onClick={() => setPlanned((prev) => prev.filter((r) => r.key !== row.key))}
                                        className={`${iconButton} text-concrete-400 active:bg-concrete-200 dark:active:bg-concrete-700`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                </div>
            )}

            {addSet.isError && <p className="text-sm text-red-600">{addSet.error.message}</p>}

            <button
                type="button"
                onClick={addRow}
                className="min-h-11 w-full rounded-xl border border-dashed border-concrete-300 text-sm font-medium text-steelblue active:bg-concrete-100 dark:border-concrete-600 dark:text-steelblue-light dark:active:bg-concrete-700"
            >
                + Añadir serie
            </button>
        </Card>
    );
}

// A set already saved. Changes are saved when the field loses focus.
function LoggedSetRow({
    sessionId,
    set,
    onChanged,
}: {
    sessionId: number;
    set: SetEntry;
    onChanged: () => void;
}) {
    const [reps, setReps] = useState(String(set.reps));
    const [weight, setWeight] = useState(formatWeight(set.weightKg));

    const update = useMutation({
        mutationFn: (changes: { reps?: number; weightKg?: number | null }) =>
            api.patch<SetEntry>(`/workouts/${sessionId}/sets/${set.id}`, changes),
        onSuccess: onChanged,
    });
    const remove = useMutation({
        mutationFn: () => api.delete(`/workouts/${sessionId}/sets/${set.id}`),
        onSuccess: onChanged,
    });

    function saveReps() {
        if (!validReps(reps)) return setReps(String(set.reps));
        if (Number(reps) !== set.reps) update.mutate({ reps: Number(reps) });
    }

    function saveWeight() {
        if (!validWeight(weight)) return setWeight(formatWeight(set.weightKg));
        const value = parseDecimal(weight);
        if (value !== set.weightKg) update.mutate({ weightKg: value });
    }

    const border = update.isError
        ? "border-red-500"
        : "border-green-600/40 dark:border-green-500/40";

    return (
        <div className={GRID}>
            <span className="text-center text-sm font-semibold">{set.setNumber}</span>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                aria-label={`Repeticiones de la serie ${set.setNumber}`}
                className={`${inputClass} ${border}`}
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                onBlur={saveReps}
            />
            <input
                type="text"
                inputMode="decimal"
                aria-label={`Peso en kg de la serie ${set.setNumber}`}
                placeholder="-"
                className={`${inputClass} ${border}`}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onBlur={saveWeight}
            />
            <span
                className="flex min-h-11 items-center justify-center text-lg text-green-600 dark:text-green-400"
                aria-label="Serie registrada"
            >
                {update.isPending ? "…" : "✓"}
            </span>
            <button
                type="button"
                aria-label={`Eliminar serie ${set.setNumber}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
                className={`${iconButton} text-red-600 active:bg-concrete-200 dark:text-red-400 dark:active:bg-concrete-700`}
            >
                ✕
            </button>
        </div>
    );
}

// Read-only view for a finished workout: what was actually done.
function ExerciseSummary({
    exercise,
    exerciseId,
    target,
    sets,
}: {
    exercise: Exercise | undefined;
    exerciseId: number;
    target: { sets: number | null; reps: number | null } | null;
    sets: SetEntry[];
}) {
    const skipped = sets.length === 0;
    const goal = target?.sets ?? null;

    return (
        <Card className={`space-y-2 py-3 ${skipped ? "opacity-60" : ""}`}>
            <Link to={`/exercises/${exerciseId}`} className="flex items-center gap-3">
                <ExerciseThumb exercise={exercise} size={44} />
                <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{exercise?.name ?? `Ejercicio #${exerciseId}`}</p>
                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                        {skipped
                            ? "No realizado"
                            : `${sets.length} ${sets.length === 1 ? "serie" : "series"}${
                                  goal !== null ? ` de ${goal}` : ""
                              }${target?.reps ? ` · objetivo ${target.reps} reps` : ""}`}
                    </p>
                </div>
                {goal !== null && !skipped && sets.length >= goal && (
                    <span className="shrink-0 text-lg text-green-600 dark:text-green-400" aria-label="Objetivo cumplido">
                        ✓
                    </span>
                )}
            </Link>

            {!skipped && (
                <ol className="divide-y divide-concrete-200 rounded-xl bg-concrete-100 text-sm dark:divide-concrete-700 dark:bg-concrete-900">
                    {sets.map((set) => (
                        <li key={set.id} className="flex items-center gap-3 px-3 py-2">
                            <span className="w-14 shrink-0 text-concrete-500 dark:text-concrete-400">
                                Serie {set.setNumber}
                            </span>
                            <span className="flex-1 font-medium">
                                {set.reps} reps
                                {set.weightKg !== null && (
                                    <span className="text-concrete-500 dark:text-concrete-400">
                                        {" "}× {formatWeight(set.weightKg)} kg
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ol>
            )}
        </Card>
    );
}
