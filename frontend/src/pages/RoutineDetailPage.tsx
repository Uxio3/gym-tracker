import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Exercise, Routine, WorkoutSession } from "../lib/types";
import { Button, Card } from "../components/ui";

export function RoutineDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: routine, isLoading } = useQuery({
        queryKey: ["routines", id],
        queryFn: () => api.get<Routine>(`/routines/${id}`),
    });

    const { data: exercises } = useQuery({
        queryKey: ["exercises"],
        queryFn: () => api.get<Exercise[]>("/exercises"),
    });

    const deleteRoutine = useMutation({
        mutationFn: () => api.delete(`/routines/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["routines"] });
            navigate("/routines");
        },
    });

    const startSession = useMutation({
        mutationFn: () => api.post<WorkoutSession>("/workouts", { routineId: Number(id) }),
        onSuccess: (session) => {
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            navigate(`/workouts/${session.id}`);
        },
    });

    function exerciseName(exerciseId: number) {
        return exercises?.find((e) => e.id === exerciseId)?.name ?? `Ejercicio #${exerciseId}`;
    }

    if (isLoading) return <p className="text-gray-500">Cargando...</p>;
    if (!routine) return <p className="text-gray-500">Rutina no encontrada.</p>;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">{routine.name}</h1>

            <div className="space-y-2">
                {routine.exercises?.map((item) => (
                    <Card key={item.id} className="flex items-center justify-between">
                        <span className="font-medium">{exerciseName(item.exerciseId)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.targetSets ?? "-"} × {item.targetReps ?? "-"}
                        </span>
                    </Card>
                ))}
                {routine.exercises?.length === 0 && (
                    <p className="text-gray-500">Esta rutina no tiene ejercicios.</p>
                )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => startSession.mutate()} disabled={startSession.isPending}>
                    Empezar entrenamiento
                </Button>
                <Button
                    variant="danger"
                    onClick={() => {
                        if (confirm("¿Eliminar esta rutina?")) {
                            deleteRoutine.mutate();
                        }
                    }}
                    disabled={deleteRoutine.isPending}
                >
                    Eliminar rutina
                </Button>
            </div>
        </div>
    );
}
