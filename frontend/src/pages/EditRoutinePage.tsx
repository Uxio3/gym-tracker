import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Routine, RoutineExercise } from "../lib/types";
import { PLAN_QUERY_KEY } from "../lib/plan";
import { RoutineForm, type RoutineFormValues } from "../components/RoutineForm";

export function EditRoutinePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: routine, isLoading } = useQuery({
        queryKey: ["routines", id],
        queryFn: () => api.get<Routine & { exercises: RoutineExercise[] }>(`/routines/${id}`),
    });

    const updateRoutine = useMutation({
        mutationFn: (values: RoutineFormValues) => api.put<Routine>(`/routines/${id}`, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["routines"] });
            queryClient.invalidateQueries({ queryKey: PLAN_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            queryClient.invalidateQueries({ queryKey: ["muscle-load"] });
            navigate(`/routines/${id}`, { replace: true });
        },
    });

    if (isLoading) return <p className="text-concrete-500">Cargando...</p>;
    if (!routine) return <p className="text-concrete-500">Rutina no encontrada.</p>;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Editar rutina</h1>
            <RoutineForm
                initialValues={{
                    name: routine.name,
                    exercises: routine.exercises.map((e) => ({
                        exerciseId: e.exerciseId,
                        targetSets: e.targetSets ?? 3,
                        targetReps: e.targetReps ?? 10,
                    })),
                }}
                submitLabel="Guardar cambios"
                pending={updateRoutine.isPending}
                error={updateRoutine.error?.message}
                onSubmit={(values) => updateRoutine.mutate(values)}
            />
        </div>
    );
}
