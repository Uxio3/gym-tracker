import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ExerciseDetail } from "../lib/types";
import { capitalize } from "../lib/exercises";
import { Badge, Card } from "../components/ui";

const FRAME_MS = 1000;

function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// The catalog ships two photos per exercise (start and end position).
// Alternating them gives a simple looping demo of the movement.
function ExerciseImages({ images, name }: { images: string[]; name: string }) {
    const [frame, setFrame] = useState(0);
    const [playing, setPlaying] = useState(() => !prefersReducedMotion());

    useEffect(() => {
        if (!playing || images.length < 2) return;
        const timer = window.setInterval(
            () => setFrame((f) => (f + 1) % images.length),
            FRAME_MS
        );
        return () => window.clearInterval(timer);
    }, [playing, images.length]);

    return (
        <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="relative block w-full overflow-hidden rounded-2xl bg-concrete-200 dark:bg-concrete-800"
            aria-label={playing ? "Pausar demostración" : "Reproducir demostración"}
        >
            {images.map((src, i) => (
                <img
                    key={src}
                    src={src}
                    alt={i === 0 ? name : ""}
                    className={`w-full object-cover ${i === frame ? "" : "absolute inset-0 opacity-0"}`}
                />
            ))}
            {images.length > 1 && (
                <span className="absolute bottom-2 right-2 rounded-full bg-concrete-900/70 px-2.5 py-1 text-xs font-medium text-white">
                    {playing ? "❚❚" : "▶"} {frame === 0 ? "Inicio" : "Final"}
                </span>
            )}
        </button>
    );
}

export function ExerciseDetailPage() {
    const { id } = useParams();

    const { data: exercise, isLoading } = useQuery({
        queryKey: ["exercises", id],
        queryFn: () => api.get<ExerciseDetail>(`/exercises/${id}`),
    });

    if (isLoading) return <p className="text-concrete-500">Cargando...</p>;
    if (!exercise) return <p className="text-concrete-500">Ejercicio no encontrado.</p>;

    const tags = [exercise.muscleGroup, exercise.equipment, exercise.level, exercise.category].filter(
        (v): v is string => !!v
    );

    return (
        <div className="space-y-4">
            {!!exercise.images?.length && (
                <ExerciseImages images={exercise.images} name={exercise.name} />
            )}

            <div className="space-y-2">
                <h1 className="text-xl font-semibold">{exercise.name}</h1>
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                        <Badge key={`${i}-${tag}`} variant={i === 0 ? "volt" : "neutral"}>
                            {capitalize(tag)}
                        </Badge>
                    ))}
                    {exercise.createdBy !== null && <Badge variant="volt">Tuyo</Badge>}
                </div>
                {!!exercise.secondaryMuscles?.length && (
                    <p className="text-sm text-concrete-500 dark:text-concrete-400">
                        También trabaja:{" "}
                        {exercise.secondaryMuscles.map((m) => m.toLowerCase()).join(", ")}
                    </p>
                )}
            </div>

            {!!exercise.instructions?.length && (
                <Card>
                    <h2 className="font-medium">Cómo hacerlo</h2>
                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                        {exercise.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>
                </Card>
            )}
        </div>
    );
}
