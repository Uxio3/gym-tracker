import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Exercise, SetEntry, WorkoutSession } from "../lib/types";
import { Button, Card, Input, Select } from "../components/ui";

export function WorkoutSessionPage() {
    const { id } = useParams();
    const queryClient = useQueryClient();

    const { data: session, isLoading } = useQuery({
        queryKey: ["workouts", id],
        queryFn: () => api.get<WorkoutSession>(`/workouts/${id}`),
    });

    const { data: exercises } = useQuery({
        queryKey: ["exercises"],
        queryFn: () => api.get<Exercise[]>("/exercises"),
    });

    const [exerciseId, setExerciseId] = useState<number | "">("");
    const [reps, setReps] = useState("10");
    const [weightKg, setWeightKg] = useState("");

    function nextSetNumber(forExerciseId: number) {
        const existing = session?.sets?.filter((s) => s.exerciseId === forExerciseId) ?? [];
        return existing.length + 1;
    }

    const addSet = useMutation({
        mutationFn: () =>
            api.post<SetEntry>(`/workouts/${id}/sets`, {
                exerciseId: Number(exerciseId),
                setNumber: nextSetNumber(Number(exerciseId)),
                reps: Number(reps),
                weightKg: weightKg ? Number(weightKg) : undefined,
            }),
        onSuccess: () => {
            setWeightKg("");
            queryClient.invalidateQueries({ queryKey: ["workouts", id] });
        },
    });

    const finishSession = useMutation({
        mutationFn: () => api.post<WorkoutSession>(`/workouts/${id}/finish`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workouts", id] });
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
        },
    });

    function exerciseName(exerciseId: number) {
        return exercises?.find((e) => e.id === exerciseId)?.name ?? `Ejercicio #${exerciseId}`;
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!exerciseId || !reps) return;
        addSet.mutate();
    }

    if (isLoading) return <p className="text-gray-500">Cargando...</p>;
    if (!session) return <p className="text-gray-500">Entrenamiento no encontrado.</p>;

    const isFinished = Boolean(session.finishedAt);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Entrenamiento</h1>
                <span
                    className={`text-sm font-medium ${
                        isFinished ? "text-green-600" : "text-amber-600"
                    }`}
                >
                    {isFinished ? "Completado" : "En curso"}
                </span>
            </div>

            <div className="space-y-2">
                {session.sets?.map((set) => (
                    <Card key={set.id} className="flex items-center justify-between">
                        <span className="font-medium">{exerciseName(set.exerciseId)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Serie {set.setNumber} · {set.reps} reps
                            {set.weightKg ? ` · ${set.weightKg} kg` : ""}
                        </span>
                    </Card>
                ))}
                {session.sets?.length === 0 && (
                    <p className="text-gray-500">Todavía no registraste series.</p>
                )}
            </div>

            {!isFinished && (
                <form onSubmit={onSubmit} className="space-y-2 pt-2">
                    <Select
                        value={exerciseId}
                        onChange={(e) =>
                            setExerciseId(e.target.value ? Number(e.target.value) : "")
                        }
                    >
                        <option value="">Elegir ejercicio...</option>
                        {exercises?.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                                {exercise.name}
                            </option>
                        ))}
                    </Select>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={1}
                            placeholder="Reps"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                        />
                        <Input
                            type="number"
                            min={0}
                            step="0.5"
                            placeholder="Peso (kg)"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={addSet.isPending}>
                        Registrar serie
                    </Button>
                </form>
            )}

            {!isFinished && (
                <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => finishSession.mutate()}
                    disabled={finishSession.isPending}
                >
                    Finalizar entrenamiento
                </Button>
            )}
        </div>
    );
}
