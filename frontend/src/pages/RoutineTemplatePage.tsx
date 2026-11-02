import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { RoutineTemplate, TrainingPlan } from "../lib/types";
import { goalLabel } from "../lib/profile-options";
import { useExercises } from "../lib/exercises";
import { formatPlanDate, planEndDateFromNow, PLAN_QUERY_KEY, useCurrentPlan } from "../lib/plan";
import { Badge, Button, Card } from "../components/ui";
import { ExerciseThumb } from "../components/ExerciseThumb";
import { BodyMap } from "../components/BodyMap";
import { useMuscleLoad } from "../lib/muscles";

export function RoutineTemplatePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = useState(false);

    const { data: template, isLoading } = useQuery({
        queryKey: ["routine-templates", "detail", id],
        queryFn: () => api.get<RoutineTemplate>(`/routine-templates/${id}`),
    });
    const { data: exercises } = useExercises();
    const { data: plan } = useCurrentPlan();
    const { data: muscleLoad } = useMuscleLoad(`/routine-templates/${id}/muscle-load`);

    const choose = useMutation({
        mutationFn: () => api.post<TrainingPlan>("/plans", { templateId: Number(id) }),
        onSuccess: (newPlan) => {
            queryClient.setQueryData(PLAN_QUERY_KEY, newPlan);
            queryClient.invalidateQueries({ queryKey: ["routines"] });
            navigate("/", { replace: true });
        },
    });

    if (isLoading) return <p className="text-concrete-500">Cargando...</p>;
    if (!template) return <p className="text-concrete-500">Rutina no encontrada.</p>;

    return (
        <div className="space-y-4">
            <Link to="/" className="text-sm text-steelblue dark:text-steelblue-light">
                ← Volver
            </Link>

            <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <h1 className="text-xl font-semibold">{template.name}</h1>
                    <Badge variant="volt" className="shrink-0">
                        {goalLabel(template.goal)}
                    </Badge>
                </div>
                {template.description && (
                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                        {template.description}
                    </p>
                )}
            </div>

            <Card>
                <h2 className="mb-2 font-medium">Qué trabaja esta rutina</h2>
                <BodyMap load={muscleLoad} scale="relative" />
            </Card>

            <div className="space-y-2">
                <h2 className="font-medium">
                    {template.exercises.length}{" "}
                    {template.exercises.length === 1 ? "ejercicio" : "ejercicios"}
                </h2>
                {template.exercises.map((item) => {
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
            </div>

            {plan ? (
                <Card className="text-sm text-concrete-500 dark:text-concrete-400">
                    Ya estás siguiendo <span className="font-medium">{plan.routine.name}</span>{" "}
                    hasta el {formatPlanDate(plan.endsAt)}.
                </Card>
            ) : confirming ? (
                <Card className="space-y-3">
                    <p className="text-sm">
                        Esta será tu rutina durante los próximos 3 meses, hasta el{" "}
                        <span className="font-medium">{formatPlanDate(planEndDateFromNow())}</span>.
                        ¿Quieres elegirla?
                    </p>
                    {choose.isError && <p className="text-sm text-red-600">{choose.error.message}</p>}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setConfirming(false)}
                            disabled={choose.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="flex-1"
                            onClick={() => choose.mutate()}
                            disabled={choose.isPending}
                        >
                            {choose.isPending ? "Guardando..." : "Confirmar"}
                        </Button>
                    </div>
                </Card>
            ) : (
                <Button type="button" className="w-full" onClick={() => setConfirming(true)}>
                    Elegir esta rutina
                </Button>
            )}
        </div>
    );
}
