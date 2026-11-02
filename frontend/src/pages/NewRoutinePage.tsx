import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Routine } from "../lib/types";
import { RoutineForm, type RoutineFormValues } from "../components/RoutineForm";

export function NewRoutinePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const createRoutine = useMutation({
        mutationFn: (values: RoutineFormValues) => api.post<Routine>("/routines", values),
        onSuccess: (routine) => {
            queryClient.invalidateQueries({ queryKey: ["routines"] });
            navigate(`/routines/${routine.id}`, { replace: true });
        },
    });

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Nueva rutina</h1>
            <RoutineForm
                submitLabel="Crear rutina"
                pending={createRoutine.isPending}
                error={createRoutine.error?.message}
                onSubmit={(values) => createRoutine.mutate(values)}
            />
        </div>
    );
}
