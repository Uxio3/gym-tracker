import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Routine } from "../lib/types";
import { useCurrentPlan } from "../lib/plan";
import { useDeleteRoutine } from "../lib/mutations";
import { Badge, Card, EmptyState, IconTile } from "../components/ui";
import { ActionMenu } from "../components/ActionMenu";
import { ConfirmDialog } from "../components/ConfirmDialog";

const primaryLinkClass =
    "flex min-h-11 items-center justify-center rounded-xl bg-concrete-900 px-4 text-base font-medium text-volt active:bg-concrete-800 dark:bg-volt dark:text-concrete-900 dark:active:opacity-90";

export function RoutinesPage() {
    const navigate = useNavigate();
    const [toDelete, setToDelete] = useState<Routine | null>(null);

    const { data: routines, isLoading } = useQuery({
        queryKey: ["routines"],
        queryFn: () => api.get<Routine[]>("/routines"),
    });
    const { data: plan } = useCurrentPlan();
    const deleteRoutine = useDeleteRoutine();

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
                <Link to="/routines/new" className={primaryLinkClass}>
                    + Nueva
                </Link>
            </div>

            {isLoading && <p className="text-concrete-500">Cargando...</p>}

            <div className="space-y-2">
                {routines?.map((routine) => (
                    <Link key={routine.id} to={`/routines/${routine.id}`} className="block">
                        <Card className="flex items-center gap-3 py-2 pr-2 active:bg-concrete-100 dark:active:bg-concrete-700">
                            <IconTile icon="📋" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{routine.name}</p>
                                <p className="text-sm text-concrete-500 dark:text-concrete-400">
                                    {routine.exerciseCount ?? 0}{" "}
                                    {routine.exerciseCount === 1 ? "ejercicio" : "ejercicios"}
                                </p>
                            </div>
                            {plan?.routineId === routine.id && <Badge variant="volt">Actual</Badge>}
                            <ActionMenu
                                items={[
                                    { label: "Editar", onSelect: () => navigate(`/routines/${routine.id}/edit`) },
                                    { label: "Eliminar", danger: true, onSelect: () => setToDelete(routine) },
                                ]}
                            />
                        </Card>
                    </Link>
                ))}

                {routines?.length === 0 && (
                    <EmptyState
                        icon="📋"
                        title="Todavía no tienes rutinas"
                        description="Crea tu primera rutina para empezar a entrenar."
                        action={
                            <Link to="/routines/new" className={primaryLinkClass}>
                                Crear rutina
                            </Link>
                        }
                    />
                )}
            </div>

            <ConfirmDialog
                open={toDelete !== null}
                title={`¿Eliminar "${toDelete?.name ?? ""}"?`}
                pending={deleteRoutine.isPending}
                error={deleteRoutine.error?.message}
                onCancel={() => {
                    setToDelete(null);
                    deleteRoutine.reset();
                }}
                onConfirm={() => deleteRoutine.mutate(toDelete!.id, { onSuccess: () => setToDelete(null) })}
            >
                {plan?.routineId === toDelete?.id ? (
                    <p>Es la rutina de tu plan actual: si la eliminas, el plan se cancelará.</p>
                ) : (
                    <p>Los entrenamientos que ya hiciste con ella se conservan.</p>
                )}
            </ConfirmDialog>
        </div>
    );
}
