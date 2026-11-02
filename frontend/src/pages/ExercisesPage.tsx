import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Exercise } from "../lib/types";
import {
    capitalize,
    muscleGroups,
    sameMuscleGroup,
    searchExercises,
    useExercises,
} from "../lib/exercises";
import { Badge, Button, Card, EmptyState, Input, Select } from "../components/ui";
import { ExerciseThumb } from "../components/ExerciseThumb";

const PAGE_SIZE = 30;

const cardClassName =
    "rounded-2xl border border-concrete-200 bg-concrete-50 p-4 dark:border-concrete-700 dark:bg-concrete-800";

function CreateExerciseForm({ onCreated }: { onCreated: () => void }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");

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
            onCreated();
        },
    });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        createExercise.mutate();
    }

    return (
        <form onSubmit={onSubmit} className={`space-y-2 ${cardClassName}`}>
            <Input
                placeholder="Nombre (ej. Press banca)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />
            <Input
                placeholder="Grupo muscular (opcional)"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
            />
            {createExercise.isError && (
                <p className="text-sm text-red-600">{createExercise.error.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={createExercise.isPending}>
                Añadir ejercicio
            </Button>
        </form>
    );
}

export function ExercisesPage() {
    const { data: exercises, isLoading } = useExercises();
    const [query, setQuery] = useState("");
    const [muscle, setMuscle] = useState("");
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [showForm, setShowForm] = useState(false);

    const muscles = useMemo(() => muscleGroups(exercises ?? []), [exercises]);
    const filtered = useMemo(() => {
        const byMuscle = muscle
            ? (exercises ?? []).filter((e) => sameMuscleGroup(e.muscleGroup, muscle))
            : (exercises ?? []);
        return searchExercises(byMuscle, query);
    }, [exercises, muscle, query]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Ejercicios</h1>
                    {!!exercises?.length && (
                        <p className="text-sm text-concrete-500 dark:text-concrete-400">
                            {filtered.length === exercises.length
                                ? `${exercises.length} ejercicios`
                                : `${filtered.length} de ${exercises.length}`}
                        </p>
                    )}
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 px-3 py-2 text-sm"
                    onClick={() => setShowForm((v) => !v)}
                >
                    {showForm ? "Cancelar" : "+ Propio"}
                </Button>
            </div>

            {showForm && <CreateExerciseForm onCreated={() => setShowForm(false)} />}

            <div className="space-y-2">
                <Input
                    type="search"
                    placeholder="Buscar (ej. squat, mancuernas, pecho)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setVisible(PAGE_SIZE);
                    }}
                    aria-label="Buscar ejercicio"
                />
                <Select
                    value={muscle}
                    onChange={(e) => {
                        setMuscle(e.target.value);
                        setVisible(PAGE_SIZE);
                    }}
                    aria-label="Filtrar por parte del cuerpo"
                >
                    <option value="">Todas las partes del cuerpo</option>
                    {muscles.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </Select>
            </div>

            {isLoading && <p className="text-concrete-500">Cargando...</p>}

            <div className="space-y-2">
                {filtered.slice(0, visible).map((exercise) => (
                    <Link key={exercise.id} to={`/exercises/${exercise.id}`} className="block">
                        <Card className="flex items-center gap-3 py-3 active:bg-concrete-100 dark:active:bg-concrete-700">
                            <ExerciseThumb exercise={exercise} size={48} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{exercise.name}</p>
                                <p className="truncate text-sm text-concrete-500 dark:text-concrete-400">
                                    {[exercise.muscleGroup, exercise.equipment]
                                        .filter(Boolean)
                                        .map((v) => capitalize(v!))
                                        .join(" · ")}
                                </p>
                            </div>
                            {exercise.createdBy !== null && <Badge variant="volt">Tuyo</Badge>}
                        </Card>
                    </Link>
                ))}

                {filtered.length > visible && (
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    >
                        Ver más ({filtered.length - visible} restantes)
                    </Button>
                )}

                {exercises && filtered.length === 0 && (
                    <EmptyState
                        icon="🔍"
                        title="Ningún ejercicio coincide"
                        description="Prueba con otra palabra o crea tu propio ejercicio."
                    />
                )}
            </div>
        </div>
    );
}
