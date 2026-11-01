import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { WorkoutSession } from "../lib/types";
import { Card } from "../components/ui";

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
    });
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

            {isLoading && <p className="text-gray-500">Cargando...</p>}

            <div className="space-y-2">
                {sorted?.map((session) => (
                    <Link key={session.id} to={`/workouts/${session.id}`} className="block">
                        <Card className="flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-800">
                            <span>{formatDate(session.startedAt)}</span>
                            <span
                                className={`text-sm font-medium ${
                                    session.finishedAt ? "text-green-600" : "text-amber-600"
                                }`}
                            >
                                {session.finishedAt ? "Completado" : "En curso"}
                            </span>
                        </Card>
                    </Link>
                ))}
                {sorted?.length === 0 && (
                    <p className="text-gray-500">Todavía no tienes entrenamientos.</p>
                )}
            </div>
        </div>
    );
}
