import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Routine, RoutineExercise, WorkoutSession } from "../lib/types";
import { useExercises } from "../lib/exercises";
import { useCurrentPlan } from "../lib/plan";
import { useDeleteRoutine } from "../lib/mutations";
import { Badge, Button, Card } from "../components/ui";
import { ExerciseThumb } from "../components/ExerciseThumb";
import { ActionMenu } from "../components/ActionMenu";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { BodyMap } from "../components/BodyMap";
import { useMuscleLoad } from "../lib/muscles";

export function RoutineDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const deleteRoutine = useDeleteRoutine();
    const { data: routine, isLoading } = useQuery({
        queryKey: ["routines", id],
        queryFn: () => api.get<Routine & { exercises: RoutineExercise[] }>(`/routines/${id}`),
        // Once it's being deleted there's nothing left to fetch.
        enabled: deleteRoutine.isIdle || deleteRoutine.isError,
    });
    const { data: exercises } = useExercises();
    const { data: plan } = useCurrentPlan();
    const { data: muscleLoad } = useMuscleLoad(
        deleteRoutine.isIdle || deleteRoutine.isError ? `/routines/${id}/muscle-load` : null
    );

    const startSession = useMutation({
        mutationFn: () => api.post<WorkoutSession>("/workouts", { routineId: Number(id) }),
        onSuccess: (session) => {
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            navigate(`/workouts/${session.id}`);
        },
    });

    if (deleteRoutine.isSuccess) return null; // navigating away
    if (isLoading) return <p className="text-concrete-500">Cargando...</p>;
    if (!routine) return <p className="text-concrete-500">Rutina no encontrada.</p>;

    const isPlanRoutine = plan?.routineId === routine.id;

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                    <h1 className="text-xl font-semibold">{routine.name}</h1>
                    {isPlanRoutine && <Badge variant="volt">Tu rutina actual</Badge>}
                </div>
                <ActionMenu
                    items={[
                        { label: "Editar rutina", onSelect: () => navigate(`/routines/${routine.id}/edit`) },
                        { label: "Eliminar rutina", danger: true, onSelect: () => setConfirmDelete(true) },
                    ]}
                />
            </div>

            <div className="space-y-2">
                {routine.exercises.map((item) => {
                    const exercise = exercises?.find((e) => e.id === item.exerciseId);
                    return (
                        <Link key={item.id} to={`/exercises/${item.exerciseId}`} className="block">
                            <Card className="flex items-center gap-3 py-3 active:bg-concrete-100 dark:active:bg-concrete-700">
                                <ExerciseThumb exercise={exercise} size={48} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {exercise?.name ?? `Ejercicio #${item.exerciseId}`}
                                    </p>
                                    {exercise?.muscleGroup && (
                                        <p className="text-sm text-concrete-500 dark:text-concrete-400">
                                            {exercise.muscleGroup}
                                        </p>
                                    )}
                                </div>
                                <span className="shrink-0 text-sm font-medium">
                                    {item.targetSets ?? "-"} × {item.targetReps ?? "-"}
                                </span>
                            </Card>
                        </Link>
                    );
                })}
                {routine.exercises.length === 0 && (
                    <p className="text-concrete-500">
                        Esta rutina no tiene ejercicios.{" "}
                        <Link to={`/routines/${routine.id}/edit`} className="text-steelblue dark:text-steelblue-light">
                            Añadir ejercicios
                        </Link>
                    </p>
                )}
            </div>

            {routine.exercises.length > 0 && (
                <Card>
                    <h2 className="mb-2 font-medium">Qué trabaja esta rutina</h2>
                    <BodyMap load={muscleLoad} scale="relative" />
                </Card>
            )}

            {startSession.isError && <p className="text-sm text-red-600">{startSession.error.message}</p>}
            <Button className="w-full" onClick={() => startSession.mutate()} disabled={startSession.isPending}>
                Empezar entrenamiento
            </Button>

            <ConfirmDialog
                open={confirmDelete}
                title="¿Eliminar esta rutina?"
                pending={deleteRoutine.isPending}
                error={deleteRoutine.error?.message}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={() =>
                    deleteRoutine.mutate(routine.id, {
                        onSuccess: () => navigate("/routines", { replace: true }),
                    })
                }
            >
                {isPlanRoutine ? (
                    <p>Es la rutina de tu plan actual: si la eliminas, el plan se cancelará.</p>
                ) : (
                    <p>Los entrenamientos que ya hiciste con ella se conservan.</p>
                )}
            </ConfirmDialog>
        </div>
    );
}
