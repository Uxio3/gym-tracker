import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Routine } from "../lib/types";
import { Card, EmptyState, IconTile } from "../components/ui";

export function RoutinesPage() {
    const { data: routines, isLoading } = useQuery({
        queryKey: ["routines"],
        queryFn: () => api.get<Routine[]>("/routines"),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Rutinas</h1>
                    {!!routines?.length && (
                        <p className="text-sm text-concrete-500 dark:text-concrete-400">
                            {routines.length} {routines.length === 1 ? "rutina" : "rutinas"}
                        </p>
                    )}
                </div>
                <Link
                    to="/routines/new"
                    className="flex min-h-11 items-center rounded-xl bg-concrete-900 px-4 text-base font-medium text-volt active:bg-concrete-800 dark:bg-volt dark:text-concrete-900 dark:active:opacity-90"
                >
                    + Nueva
                </Link>
            </div>

            {isLoading && <p className="text-concrete-500">Cargando...</p>}

            <div className="space-y-2">
                {routines?.map((routine) => (
                    <Link key={routine.id} to={`/routines/${routine.id}`} className="block">
                        <Card className="flex items-center gap-3 active:bg-concrete-100 dark:active:bg-concrete-700">
                            <IconTile icon="📋" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{routine.name}</p>
                                <p className="text-sm text-concrete-500 dark:text-concrete-400">
                                    {routine.exerciseCount ?? 0}{" "}
                                    {routine.exerciseCount === 1 ? "ejercicio" : "ejercicios"}
                                </p>
                            </div>
                            <span className="text-concrete-400" aria-hidden="true">
                                ›
                            </span>
                        </Card>
                    </Link>
                ))}

                {routines?.length === 0 && (
                    <EmptyState
                        icon="📋"
                        title="Todavía no tienes rutinas"
                        description="Crea tu primera rutina para empezar a entrenar."
                        action={
                            <Link
                                to="/routines/new"
                                className="flex min-h-11 items-center justify-center rounded-xl bg-concrete-900 px-4 text-base font-medium text-volt active:bg-concrete-800 dark:bg-volt dark:text-concrete-900 dark:active:opacity-90"
                            >
                                Crear rutina
                            </Link>
                        }
                    />
                )}
            </div>
        </div>
    );
}
