import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { WorkoutSession } from "../lib/types";
import { useDeleteWorkout } from "../lib/mutations";
import { formatDuration, formatSessionDate } from "../lib/workouts";
import { Badge, Card, EmptyState, IconTile } from "../components/ui";
import { ActionMenu } from "../components/ActionMenu";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function WorkoutsPage() {
    const navigate = useNavigate();
    const [toDelete, setToDelete] = useState<WorkoutSession | null>(null);

    const { data: sessions, isLoading } = useQuery({
        queryKey: ["workouts"],
        queryFn: () => api.get<WorkoutSession[]>("/workouts"),
    });
    const deleteWorkout = useDeleteWorkout();

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Entrenamientos</h1>

            {isLoading && <p className="text-concrete-500">Cargando...</p>}

            <div className="space-y-2">
                {sessions?.map((session) => {
                    const setCount = session.setCount ?? 0;
                    return (
                        <Link key={session.id} to={`/workouts/${session.id}`} className="block">
                            <Card className="flex items-center gap-3 py-2 pr-2 active:bg-concrete-100 dark:active:bg-concrete-700">
                                <IconTile icon="🏋️" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {session.routineName ?? "Entrenamiento libre"}
                                    </p>
                                    <p className="truncate text-sm text-concrete-500 dark:text-concrete-400">
                                        {formatSessionDate(session.startedAt)} · {setCount}{" "}
                                        {setCount === 1 ? "serie" : "series"}
                                        {session.finishedAt &&
                                            ` · ${formatDuration(session.startedAt, session.finishedAt)}`}
                                    </p>
                                </div>
                                <Badge variant={session.finishedAt ? "success" : "volt"}>
                                    {session.finishedAt ? "Hecho" : "En curso"}
                                </Badge>
                                <ActionMenu
                                    items={[
                                        { label: "Ver detalles", onSelect: () => navigate(`/workouts/${session.id}`) },
                                        { label: "Eliminar", danger: true, onSelect: () => setToDelete(session) },
                                    ]}
                                />
                            </Card>
                        </Link>
                    );
                })}

                {sessions?.length === 0 && (
                    <EmptyState
                        icon="🏋️"
                        title="Todavía no tienes entrenamientos"
                        description="Empieza un entrenamiento desde una de tus rutinas."
                        action={
                            <Link
                                to="/routines"
                                className="flex min-h-11 items-center justify-center rounded-xl bg-concrete-900 px-4 text-base font-medium text-volt active:bg-concrete-800 dark:bg-volt dark:text-concrete-900 dark:active:opacity-90"
                            >
                                Ver rutinas
                            </Link>
                        }
                    />
                )}
            </div>

            <ConfirmDialog
                open={toDelete !== null}
                title="¿Eliminar este entrenamiento?"
                pending={deleteWorkout.isPending}
                error={deleteWorkout.error?.message}
                onCancel={() => {
                    setToDelete(null);
                    deleteWorkout.reset();
                }}
                onConfirm={() => deleteWorkout.mutate(toDelete!.id, { onSuccess: () => setToDelete(null) })}
            >
                <p>Se borrarán también todas sus series. No se puede deshacer.</p>
            </ConfirmDialog>
        </div>
    );
}
