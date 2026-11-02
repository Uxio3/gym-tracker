import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { RoutineTemplate, TrainingPlan, UserProfile, WorkoutSession } from "../lib/types";
import { goalLabel } from "../lib/profile-options";
import { useExercises } from "../lib/exercises";
import { formatPlanDate, planProgress, useCurrentPlan } from "../lib/plan";
import { Badge, Button, Card, IconTile } from "../components/ui";
import { ProfileForm } from "../components/ProfileForm";
import { ExerciseThumb } from "../components/ExerciseThumb";
import { BodyMap } from "../components/BodyMap";
import { useMuscleLoad } from "../lib/muscles";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function OnboardingForm() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold">Antes de empezar</h1>
                <p className="text-sm text-concrete-500 dark:text-concrete-400">
                    Cuentanos un poco sobre ti para poder sugerirte rutinas que se
                    adapten a tu meta.
                </p>
            </div>
            <ProfileForm submitLabel="Empezar" />
        </div>
    );
}

function WeeklySummary({ sessions }: { sessions: WorkoutSession[] }) {
    const { data: load } = useMuscleLoad("/stats/muscle-load?days=7");
    const now = Date.now();
    const thisWeek = sessions.filter(
        (session) => now - new Date(session.startedAt).getTime() < ONE_WEEK_MS
    );
    const completed = thisWeek.filter((session) => session.finishedAt);
    const totalSets = thisWeek.reduce((sum, session) => sum + (session.setCount ?? 0), 0);

    return (
        <Card>
            <h2 className="font-medium">Resumen de la semana</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-2xl font-semibold text-volt-700 dark:text-volt">
                        {thisWeek.length}
                    </p>
                    <p className="text-xs text-concrete-500 dark:text-concrete-400">Entrenos</p>
                </div>
                <div>
                    <p className="text-2xl font-semibold text-volt-700 dark:text-volt">
                        {completed.length}
                    </p>
                    <p className="text-xs text-concrete-500 dark:text-concrete-400">Completados</p>
                </div>
                <div>
                    <p className="text-2xl font-semibold text-volt-700 dark:text-volt">
                        {totalSets}
                    </p>
                    <p className="text-xs text-concrete-500 dark:text-concrete-400">Series</p>
                </div>
            </div>
            <div className="mt-4 border-t border-concrete-200 pt-4 dark:border-concrete-700">
                <h3 className="mb-2 text-sm font-medium">Carga muscular · últimos 7 días</h3>
                <BodyMap load={load} scale="week" emptyMessage="Aún no has registrado series esta semana." />
            </div>
        </Card>
    );
}

function ActivePlan({ plan }: { plan: TrainingPlan }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data: exercises } = useExercises();
    const { week, totalWeeks, daysLeft, percent } = planProgress(plan);

    const startSession = useMutation({
        mutationFn: () =>
            api.post<WorkoutSession>("/workouts", { routineId: plan.routineId }),
        onSuccess: (session) => {
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            navigate(`/workouts/${session.id}`);
        },
    });

    const routineExercises = [...plan.routine.exercises].sort((a, b) => a.order - b.order);

    return (
        <Card className="space-y-4">
            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-concrete-500 dark:text-concrete-400">
                    Tu rutina
                </p>
                <h2 className="text-lg font-semibold">{plan.routine.name}</h2>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                    <span className="font-medium">
                        Semana {week} de {totalWeeks}
                    </span>
                    <span className="text-concrete-500 dark:text-concrete-400">
                        {daysLeft} {daysLeft === 1 ? "día restante" : "días restantes"}
                    </span>
                </div>
                <div
                    className="h-2 overflow-hidden rounded-full bg-concrete-200 dark:bg-concrete-700"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progreso del plan"
                >
                    <div className="h-full rounded-full bg-volt" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-concrete-500 dark:text-concrete-400">
                    Hasta el {formatPlanDate(plan.endsAt)}
                </p>
            </div>

            <ul className="space-y-2">
                {routineExercises.map((item) => {
                    const exercise = exercises?.find((e) => e.id === item.exerciseId);
                    return (
                        <li key={item.id} className="flex items-center gap-3">
                            <ExerciseThumb exercise={exercise} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {exercise?.name ?? `Ejercicio #${item.exerciseId}`}
                            </span>
                            <span className="shrink-0 text-sm text-concrete-500 dark:text-concrete-400">
                                {item.targetSets ?? "-"} × {item.targetReps ?? "-"}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {startSession.isError && (
                <p className="text-sm text-red-600">{startSession.error.message}</p>
            )}

            <div className="flex flex-col gap-2">
                <Button onClick={() => startSession.mutate()} disabled={startSession.isPending}>
                    Empezar entrenamiento
                </Button>
                <Link
                    to={`/routines/${plan.routineId}`}
                    className="text-center text-sm text-steelblue dark:text-steelblue-light"
                >
                    Ver rutina
                </Link>
            </div>
        </Card>
    );
}

function SuggestedRoutines({ profile }: { profile: UserProfile }) {
    const { data: templates, isLoading } = useQuery({
        queryKey: ["routine-templates", profile.goal],
        queryFn: () => api.get<RoutineTemplate[]>(`/routine-templates?goal=${profile.goal}`),
    });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="font-medium">Rutinas para tu meta</h2>
                <Badge variant="volt">{goalLabel(profile.goal)}</Badge>
            </div>
            <p className="text-sm text-concrete-500 dark:text-concrete-400">
                Elige una para los próximos 3 meses.
            </p>

            {isLoading && <p className="text-concrete-500">Cargando...</p>}

            {templates?.map((template) => (
                <Card key={template.id} className="flex items-center gap-3">
                    <IconTile icon="📋" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{template.name}</p>
                        <p className="text-sm text-concrete-500 dark:text-concrete-400">
                            {template.exercises.length} ejercicios
                        </p>
                    </div>
                    <Link
                        to={`/routine-templates/${template.id}`}
                        className="flex min-h-11 shrink-0 items-center rounded-xl border border-steelblue px-3 text-sm font-medium text-steelblue active:bg-steelblue/10 dark:border-steelblue-light dark:text-steelblue-light dark:active:bg-steelblue-light/10"
                    >
                        Ver detalles
                    </Link>
                </Card>
            ))}
        </div>
    );
}

export function HomePage() {
    const { user } = useAuth();

    const { data: profile, isLoading: loadingProfile } = useQuery({
        queryKey: ["profile"],
        queryFn: () => api.get<UserProfile | null>("/profile"),
    });

    const { data: sessions } = useQuery({
        queryKey: ["workouts"],
        queryFn: () => api.get<WorkoutSession[]>("/workouts"),
        enabled: !!profile,
    });

    const { data: plan, isLoading: loadingPlan } = useCurrentPlan();

    if (loadingProfile) {
        return <p className="text-concrete-500">Cargando...</p>;
    }

    if (!profile) {
        return <OnboardingForm />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Hola, {user?.email?.split("@")[0]}</h1>
                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                        Meta actual: {goalLabel(profile.goal)}
                    </p>
                </div>
                <Link to="/profile" className="text-sm text-steelblue dark:text-steelblue-light">
                    Editar perfil
                </Link>
            </div>

            {loadingPlan ? (
                <p className="text-concrete-500">Cargando...</p>
            ) : plan ? (
                <ActivePlan plan={plan} />
            ) : (
                <SuggestedRoutines profile={profile} />
            )}

            <WeeklySummary sessions={sessions ?? []} />
        </div>
    );
}
