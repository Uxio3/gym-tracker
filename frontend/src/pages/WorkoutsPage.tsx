import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { WorkoutSession } from "../lib/types";
import { Badge, Card, EmptyState, IconTile } from "../components/ui";

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatDuration(startedAt: string, finishedAt: string) {
    const minutes = Math.max(
        1,
        Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    );
    return `${minutes} min`;
}

export function WorkoutsPage() {
    const { data: sessions, isLoading } = useQuery({
        queryKey: ["workouts"],
        queryFn: () => api.get<WorkoutSession[]>("/workouts"),
    });

    const sorted = sessions
        ?.slice()
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Entrenamientos</h1>

            {isLoading && <p className="text-concrete-500">Cargando...</p>}

            <div className="space-y-2">
                {sorted?.map((session) => {
                    const setCount = session.setCount ?? 0;
                    return (
                        <Link key={session.id} to={`/workouts/${session.id}`} className="block">
                            <Card className="flex items-center gap-3 active:bg-concrete-100 dark:active:bg-concrete-700">
                                <IconTile icon="🏋️" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {formatDate(session.startedAt)}
                                    </p>
                                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                                        {setCount} {setCount === 1 ? "serie" : "series"}
                                        {session.finishedAt &&
                                            ` · ${formatDuration(session.startedAt, session.finishedAt)}`}
                                    </p>
                                </div>
                                <Badge variant={session.finishedAt ? "success" : "volt"}>
                                    {session.finishedAt ? "Completado" : "En curso"}
                                </Badge>
                            </Card>
                        </Link>
                    );
                })}

                {sorted?.length === 0 && (
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
        </div>
    );
}
