import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Exercise } from "../lib/types";
import { Badge, Button, Card, EmptyState, IconTile, Input } from "../components/ui";

const cardClassName =
    "rounded-2xl border border-concrete-200 bg-concrete-50 p-4 dark:border-concrete-700 dark:bg-concrete-800";

export function ExercisesPage() {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");

    const { data: exercises, isLoading } = useQuery({
        queryKey: ["exercises"],
        queryFn: () => api.get<Exercise[]>("/exercises"),
    });

    const createExercise = useMutation({
        mutationFn: () =>
            api.post<Exercise>("/exercises", {
                name,
                muscleGroup: muscleGroup || undefined,
            }),
        onSuccess: () => {
            setName("");
            setMuscleGroup("");
            queryClient.invalidateQueries({ queryKey: ["exercises"] });
        },
    });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        createExercise.mutate();
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold">Ejercicios</h1>
                {!!exercises?.length && (
                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                        {exercises.length} {exercises.length === 1 ? "ejercicio" : "ejercicios"}
                    </p>
                )}
            </div>

            <form onSubmit={onSubmit} className={`space-y-2 ${cardClassName}`}>
                <Input
                    placeholder="Nombre (ej. Press banca)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    placeholder="Grupo muscular (opcional)"
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={createExercise.isPending}>
                    Añadir ejercicio
                </Button>
            </form>

            {isLoading && <p className="text-concrete-500">Cargando...</p>}

            <div className="space-y-2">
                {exercises?.map((exercise) => (
                    <Card key={exercise.id} className="flex items-center gap-3">
                        <IconTile icon="💪" />
                        <span className="flex-1 font-medium">{exercise.name}</span>
                        {exercise.muscleGroup && <Badge>{exercise.muscleGroup}</Badge>}
                    </Card>
                ))}

                {exercises?.length === 0 && (
                    <EmptyState
                        icon="💪"
                        title="Todavía no tienes ejercicios"
                        description="Añade ejercicios para poder crear tus rutinas."
                    />
                )}
            </div>
        </div>
    );
}
