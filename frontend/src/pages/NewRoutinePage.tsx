import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Exercise, Routine } from "../lib/types";
import { Button, Card, Input, Select } from "../components/ui";

interface DraftExercise {
    exerciseId: number;
    targetSets: number;
    targetReps: number;
}

export function NewRoutinePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [draft, setDraft] = useState<DraftExercise[]>([]);
    const [selectedExerciseId, setSelectedExerciseId] = useState<number | "">("");

    const { data: exercises } = useQuery({
        queryKey: ["exercises"],
        queryFn: () => api.get<Exercise[]>("/exercises"),
    });

    const createRoutine = useMutation({
        mutationFn: () => api.post<Routine>("/routines", { name, exercises: draft }),
        onSuccess: (routine) => {
            queryClient.invalidateQueries({ queryKey: ["routines"] });
            navigate(`/routines/${routine.id}`);
        },
    });

    function addExercise() {
        if (!selectedExerciseId) return;
        setDraft((prev) => [
            ...prev,
            { exerciseId: Number(selectedExerciseId), targetSets: 3, targetReps: 10 },
        ]);
        setSelectedExerciseId("");
    }

    function removeExercise(index: number) {
        setDraft((prev) => prev.filter((_, i) => i !== index));
    }

    function updateExercise(index: number, field: "targetSets" | "targetReps", value: number) {
        setDraft((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    }

    function exerciseName(id: number) {
        return exercises?.find((e) => e.id === id)?.name ?? `#${id}`;
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        createRoutine.mutate();
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <h1 className="text-xl font-semibold">Nueva rutina</h1>

            <Input
                placeholder="Nombre (ej. Push Day)"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <div className="flex gap-2">
                <Select
                    value={selectedExerciseId}
                    onChange={(e) =>
                        setSelectedExerciseId(e.target.value ? Number(e.target.value) : "")
                    }
                >
                    <option value="">Elegir ejercicio...</option>
                    {exercises?.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                            {exercise.name}
                        </option>
                    ))}
                </Select>
                <Button type="button" variant="secondary" onClick={addExercise}>
                    Añadir
                </Button>
            </div>

            <div className="space-y-2">
                {draft.map((item, index) => (
                    <Card key={index} className="flex items-center gap-3">
                        <span className="flex-1 font-medium">{exerciseName(item.exerciseId)}</span>
                        <input
                            type="number"
                            min={1}
                            aria-label="Series"
                            className="min-h-11 w-16 rounded-lg border border-gray-300 px-2 text-center dark:border-gray-700 dark:bg-gray-900"
                            value={item.targetSets}
                            onChange={(e) =>
                                updateExercise(index, "targetSets", Number(e.target.value))
                            }
                        />
                        <span className="text-gray-400">×</span>
                        <input
                            type="number"
                            min={1}
                            aria-label="Repeticiones"
                            className="min-h-11 w-16 rounded-lg border border-gray-300 px-2 text-center dark:border-gray-700 dark:bg-gray-900"
                            value={item.targetReps}
                            onChange={(e) =>
                                updateExercise(index, "targetReps", Number(e.target.value))
                            }
                        />
                        <button
                            type="button"
                            onClick={() => removeExercise(index)}
                            aria-label="Quitar ejercicio"
                            className="min-h-11 min-w-11 text-xl text-red-600"
                        >
                            ✕
                        </button>
                    </Card>
                ))}
            </div>

            <Button type="submit" className="w-full" disabled={createRoutine.isPending}>
                Crear rutina
            </Button>
        </form>
    );
}
