import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Routine } from "../lib/types";
import { Card } from "../components/ui";

export function RoutinesPage() {
    const { data: routines, isLoading } = useQuery({
        queryKey: ["routines"],
        queryFn: () => api.get<Routine[]>("/routines"),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Rutinas</h1>
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
                        <Card className="active:bg-concrete-100 dark:active:bg-concrete-700">
                            <span className="font-medium">{routine.name}</span>
                        </Card>
                    </Link>
                ))}
                {routines?.length === 0 && (
                    <p className="text-concrete-500">Todavía no tienes rutinas.</p>
                )}
            </div>
        </div>
    );
}
