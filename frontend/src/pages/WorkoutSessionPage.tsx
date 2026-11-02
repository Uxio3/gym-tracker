import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { SetEntry, WorkoutSession } from "../lib/types";
import { useExercises } from "../lib/exercises";
import { useDeleteWorkout } from "../lib/mutations";
import { formatDuration, formatSessionDate } from "../lib/workouts";
import { Badge, Button, Card } from "../components/ui";
import { ActionMenu } from "../components/ActionMenu";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExerciseLog } from "../components/ExerciseLog";
import { ExercisePicker } from "../components/ExercisePicker";
import { BodyMap } from "../components/BodyMap";
import { useMuscleLoad } from "../lib/muscles";

interface Block {
    exerciseId: number;
    target: { sets: number | null; reps: number | null } | null;
}

// Routine exercises first (in routine order), then anything else logged in
// this session, then exercises just added here that have no sets yet.
function buildBlocks(session: WorkoutSession, extraIds: number[]): Block[] {
    const blocks: Block[] = (session.routine?.exercises ?? []).map((e) => ({
        exerciseId: e.exerciseId,
        target: { sets: e.targetSets, reps: e.targetReps },
    }));
    const seen = new Set(blocks.map((b) => b.exerciseId));
    const loggedOrder = [...(session.sets ?? [])].sort((a, b) => a.id - b.id);
    for (const id of [...loggedOrder.map((s) => s.exerciseId), ...extraIds]) {
        if (!seen.has(id)) {
            seen.add(id);
            blocks.push({ exerciseId: id, target: null });
        }
    }
    return blocks;
}

function setsFor(sets: SetEntry[], exerciseId: number) {
    return sets
        .filter((s) => s.exerciseId === exerciseId)
        .sort((a, b) => a.setNumber - b.setNumber || a.id - b.id);
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="truncate text-base font-semibold text-volt-700 dark:text-volt">{value}</p>
            <p className="text-xs text-concrete-500 dark:text-concrete-400">{label}</p>
        </div>
    );
}

export function WorkoutSessionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [extraIds, setExtraIds] = useState<number[]>([]);
    const [showPicker, setShowPicker] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const deleteWorkout = useDeleteWorkout();
    const { data: session, isLoading } = useQuery({
        queryKey: ["workouts", id],
        queryFn: () => api.get<WorkoutSession>(`/workouts/${id}`),
        // Once it's being deleted there's nothing left to fetch.
        enabled: deleteWorkout.isIdle || deleteWorkout.isError,
    });
    const { data: exercises } = useExercises();
    const { data: muscleLoad } = useMuscleLoad(
        session?.finishedAt && (session.sets?.length ?? 0) > 0 ? `/workouts/${id}/muscle-load` : null
    );

    const setFinished = useMutation({
        mutationFn: (finished: boolean) =>
            api.post<WorkoutSession>(`/workouts/${id}/${finished ? "finish" : "reopen"}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
    });

    if (deleteWorkout.isSuccess) return null; // navigating away
    if (isLoading) return <p className="text-concrete-500">Cargando...</p>;
    if (!session) return <p className="text-concrete-500">Entrenamiento no encontrado.</p>;

    const finished = Boolean(session.finishedAt);
    const sets = session.sets ?? [];
    const blocks = buildBlocks(session, extraIds);
    const volume = sets.reduce((sum, s) => sum + s.reps * (s.weightKg ?? 0), 0);
    const exercisesDone = new Set(sets.map((s) => s.exerciseId)).size;

    function discard() {
        deleteWorkout.mutate(session!.id, {
            // A cancelled workout never happened: go back home rather than to
            // the history it no longer belongs to.
            onSuccess: () => navigate(finished ? "/workouts" : "/", { replace: true }),
        });
    }

    // Nothing logged yet means nothing to lose, so skip the confirmation.
    function cancel() {
        if (sets.length === 0) discard();
        else setConfirmDelete(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                    <h1 className="text-xl font-semibold">{session.routine?.name ?? "Entrenamiento libre"}</h1>
                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                        {formatSessionDate(session.startedAt)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={finished ? "success" : "volt"}>
                            {finished ? "Completado" : "En curso"}
                        </Badge>
                        {!finished && (
                            <span className="text-sm text-concrete-500 dark:text-concrete-400">
                                {sets.length} {sets.length === 1 ? "serie" : "series"}
                                {volume > 0 && ` · ${Math.round(volume).toLocaleString("es-ES")} kg de volumen`}
                            </span>
                        )}
                    </div>
                </div>
                <ActionMenu
                    items={[
                        finished
                            ? { label: "Reabrir entrenamiento", onSelect: () => setFinished.mutate(false) }
                            : { label: "Finalizar entrenamiento", onSelect: () => setFinished.mutate(true) },
                        finished
                            ? { label: "Eliminar entrenamiento", danger: true, onSelect: () => setConfirmDelete(true) }
                            : { label: "Cancelar entrenamiento", danger: true, onSelect: cancel },
                    ]}
                />
            </div>

            {finished && session.finishedAt && (
                <div className="grid grid-cols-4 gap-2 rounded-2xl border border-concrete-200 bg-concrete-50 p-3 text-center dark:border-concrete-700 dark:bg-concrete-800">
                    <Stat label="Duración" value={formatDuration(session.startedAt, session.finishedAt)} />
                    <Stat label="Series" value={String(sets.length)} />
                    <Stat label="Volumen" value={volume > 0 ? `${Math.round(volume).toLocaleString("es-ES")} kg` : "-"} />
                    <Stat label="Ejercicios" value={`${exercisesDone}/${blocks.length}`} />
                </div>
            )}

            {finished && sets.length > 0 && (
                <Card>
                    <h2 className="mb-2 font-medium">Carga muscular del entrenamiento</h2>
                    <BodyMap load={muscleLoad} scale="workout" />
                </Card>
            )}

            {finished && sets.length === 0 && (
                <p className="rounded-2xl border border-dashed border-concrete-300 p-4 text-sm text-concrete-500 dark:border-concrete-700 dark:text-concrete-400">
                    No registraste ninguna serie en este entrenamiento. Si quieres añadirlas, reábrelo desde el menú ⋯.
                </p>
            )}

            {blocks.map((block) => (
                <ExerciseLog
                    key={block.exerciseId}
                    sessionId={session.id}
                    exerciseId={block.exerciseId}
                    exercise={exercises?.find((e) => e.id === block.exerciseId)}
                    target={block.target}
                    sets={setsFor(sets, block.exerciseId)}
                    finished={finished}
                />
            ))}

            {blocks.length === 0 && (
                <p className="text-concrete-500">Añade un ejercicio para empezar a registrar series.</p>
            )}

            {!finished &&
                (showPicker || blocks.length === 0 ? (
                    <ExercisePicker
                        exercises={exercises}
                        placeholder="Añadir ejercicio (ej. curl, hombros)"
                        onSelect={(exercise) => {
                            setExtraIds((prev) => (prev.includes(exercise.id) ? prev : [...prev, exercise.id]));
                            setShowPicker(false);
                        }}
                    />
                ) : (
                    <Button type="button" variant="secondary" className="w-full" onClick={() => setShowPicker(true)}>
                        + Añadir ejercicio
                    </Button>
                ))}

            {setFinished.isError && <p className="text-sm text-red-600">{setFinished.error.message}</p>}

            {!finished && (
                <div className="space-y-2">
                    <Button
                        type="button"
                        className="w-full"
                        onClick={() => setFinished.mutate(true)}
                        disabled={setFinished.isPending}
                    >
                        Finalizar entrenamiento
                    </Button>
                    <button
                        type="button"
                        onClick={cancel}
                        disabled={deleteWorkout.isPending}
                        className="min-h-11 w-full rounded-xl text-sm font-medium text-red-600 active:bg-red-600/10 disabled:opacity-60 dark:text-red-400"
                    >
                        Cancelar entrenamiento
                    </button>
                </div>
            )}

            <ConfirmDialog
                open={confirmDelete}
                title={finished ? "¿Eliminar este entrenamiento?" : "¿Cancelar este entrenamiento?"}
                confirmLabel={finished ? "Eliminar" : "Descartar"}
                cancelLabel={finished ? "Cancelar" : "Seguir entrenando"}
                pending={deleteWorkout.isPending}
                error={deleteWorkout.error?.message}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={discard}
            >
                <p>
                    {finished
                        ? "Se borrarán también todas sus series. No se puede deshacer."
                        : sets.length === 1
                          ? "Se descartará la serie que has registrado. No se puede deshacer."
                          : `Se descartarán las ${sets.length} series que has registrado. No se puede deshacer.`}
                </p>
            </ConfirmDialog>
        </div>
    );
}
