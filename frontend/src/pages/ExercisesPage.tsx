import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Exercise } from "../lib/types";
import { Button, Card, Input } from "../components/ui";

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
            <h1 className="text-xl font-semibold">Ejercicios</h1>

            <form onSubmit={onSubmit} className="space-y-2">
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

            {isLoading && <p className="text-gray-500">Cargando...</p>}

            <div className="space-y-2">
                {exercises?.map((exercise) => (
                    <Card key={exercise.id} className="flex items-center justify-between">
                        <span className="font-medium">{exercise.name}</span>
                        {exercise.muscleGroup && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {exercise.muscleGroup}
                            </span>
                        )}
                    </Card>
                ))}
                {exercises?.length === 0 && (
                    <p className="text-gray-500">Todavía no tienes ejercicios.</p>
                )}
            </div>
        </div>
    );
}
