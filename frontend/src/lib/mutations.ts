import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { PLAN_QUERY_KEY } from "./plan";

// After deleting, the detail query of the deleted item is dropped (not
// refetched, which would just 404) and only the lists are refreshed.

export function useDeleteRoutine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (routineId: number) => api.delete(`/routines/${routineId}`),
        onSuccess: (_, routineId) => {
            queryClient.removeQueries({ queryKey: ["routines", String(routineId)] });
            queryClient.invalidateQueries({ queryKey: ["routines"], exact: true });
            // Deleting the routine also ends a plan built on it, and past
            // workouts lose their link to it.
            queryClient.invalidateQueries({ queryKey: PLAN_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["workouts"], exact: true });
            queryClient.invalidateQueries({ queryKey: ["muscle-load"] });
        },
    });
}

export function useDeleteWorkout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: number) => api.delete(`/workouts/${sessionId}`),
        onSuccess: (_, sessionId) => {
            queryClient.removeQueries({ queryKey: ["workouts", String(sessionId)] });
            queryClient.invalidateQueries({ queryKey: ["workouts"], exact: true });
            queryClient.invalidateQueries({ queryKey: ["muscle-load"] });
        },
    });
}
