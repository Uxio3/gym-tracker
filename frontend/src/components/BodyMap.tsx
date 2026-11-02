import { useState } from "react";
import {
    BACK_OUTLINE,
    BACK_SHAPES,
    BACK_VIEWBOX,
    FRONT_OUTLINE,
    FRONT_SHAPES,
    FRONT_VIEWBOX,
    type BodyShape,
} from "../lib/body-paths";
import {
    formatSets,
    LEGEND,
    loadLevel,
    MUSCLE_LABELS,
    musclesForShape,
    NON_MUSCLE_SHAPES,
    usePrefersDark,
    type LoadScale,
    type MuscleKey,
    type MuscleLoadResult,
} from "../lib/muscles";

// Colours are set inline (not with utility classes) so the drawing doesn't
// depend on which CSS has been generated. Level 0 = untouched muscle.
const PALETTE = {
    dark: {
        body: "#5b5a55",
        outline: "#6b6a63",
        selected: "#ffffff",
        levels: ["#34332f", "#6b5f12", "#b5a300", "#e8d200", "#ff8a3d"],
    },
    light: {
        body: "#e7e6e2",
        outline: "#b4b2a9",
        selected: "#1f1e1c",
        levels: ["#c9c7bd", "#efe48a", "#e3cf2e", "#c9a800", "#e0601f"],
    },
};

function View({
    label,
    viewBox,
    outline,
    shapes,
    levelFor,
    colors,
    selected,
    onSelect,
}: {
    label: string;
    viewBox: string;
    outline: string;
    shapes: BodyShape[];
    levelFor: (slug: string) => number;
    colors: (typeof PALETTE)["dark"];
    selected: string | null;
    onSelect: (slug: string) => void;
}) {
    return (
        <figure className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <svg viewBox={viewBox} className="block w-full" style={{ maxHeight: 320 }} role="img" aria-label={label}>
                <path d={outline} fill="none" stroke={colors.outline} strokeWidth={3} />
                {shapes.map((shape) => {
                    const isBody = NON_MUSCLE_SHAPES.has(shape.slug);
                    const level = isBody ? 0 : levelFor(shape.slug);
                    const fill = isBody ? colors.body : colors.levels[level];
                    const isSelected = selected === shape.slug;
                    return (
                        <g
                            key={shape.slug}
                            onClick={isBody ? undefined : () => onSelect(shape.slug)}
                            style={{ cursor: isBody ? "default" : "pointer" }}
                        >
                            {shape.paths.map((d, i) => (
                                <path
                                    key={i}
                                    d={d}
                                    fill={fill}
                                    stroke={isSelected ? colors.selected : "none"}
                                    strokeWidth={isSelected ? 4 : 0}
                                    style={{ transition: "fill 200ms" }}
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>
            <figcaption className="text-xs text-concrete-500 dark:text-concrete-400">{label}</figcaption>
        </figure>
    );
}

export function BodyMap({
    load,
    scale,
    emptyMessage,
}: {
    load: MuscleLoadResult | undefined;
    scale: LoadScale;
    emptyMessage?: string;
}) {
    const dark = usePrefersDark();
    const colors = dark ? PALETTE.dark : PALETTE.light;
    const [selected, setSelected] = useState<string | null>(null);

    const muscles = load?.muscles ?? {};
    const maxSets = Math.max(0, ...Object.values(muscles).map((m) => m!.sets));

    // A shape shows its busiest muscle (e.g. "upper back" = lats or mid-back).
    function setsForShape(slug: string) {
        return Math.max(0, ...musclesForShape(slug).map((key) => muscles[key]?.sets ?? 0));
    }
    const levelFor = (slug: string) => loadLevel(setsForShape(slug), scale, maxSets);

    const selectedMuscles = selected ? musclesForShape(selected) : [];
    const ranking = (Object.keys(muscles) as MuscleKey[])
        .sort((a, b) => muscles[b]!.sets - muscles[a]!.sets)
        .slice(0, 3);

    const isEmpty = !load || load.totalSets === 0;

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <View
                    label="Delante"
                    viewBox={FRONT_VIEWBOX}
                    outline={FRONT_OUTLINE}
                    shapes={FRONT_SHAPES}
                    levelFor={levelFor}
                    colors={colors}
                    selected={selected}
                    onSelect={(slug) => setSelected((s) => (s === slug ? null : slug))}
                />
                <View
                    label="Detrás"
                    viewBox={BACK_VIEWBOX}
                    outline={BACK_OUTLINE}
                    shapes={BACK_SHAPES}
                    levelFor={levelFor}
                    colors={colors}
                    selected={selected}
                    onSelect={(slug) => setSelected((s) => (s === slug ? null : slug))}
                />
            </div>

            <div className="flex items-center justify-center gap-3 text-[11px] text-concrete-500 dark:text-concrete-400">
                {LEGEND[scale].map((text, i) => (
                    <span key={text} className="flex items-center gap-1">
                        <span
                            className="inline-block h-2.5 w-2.5 rounded-sm"
                            style={{ background: colors.levels[i + 1], width: 10, height: 10 }}
                        />
                        {text}
                    </span>
                ))}
            </div>

            {isEmpty ? (
                emptyMessage && (
                    <p className="text-center text-sm text-concrete-500 dark:text-concrete-400">{emptyMessage}</p>
                )
            ) : selected ? (
                <div className="space-y-2 rounded-xl bg-concrete-100 p-3 text-sm dark:bg-concrete-900">
                    {selectedMuscles.map((key) => {
                        const m = muscles[key];
                        return (
                            <div key={key} className="space-y-1">
                                <p className="flex justify-between font-medium">
                                    <span>{MUSCLE_LABELS[key]}</span>
                                    <span>{m ? `${formatSets(m.sets)} series` : "Sin trabajo"}</span>
                                </p>
                                {m?.exercises.map((e) => (
                                    <p
                                        key={`${e.exerciseId}-${e.role}`}
                                        className="flex justify-between gap-2 text-concrete-500 dark:text-concrete-400"
                                    >
                                        <span className="truncate">{e.name}</span>
                                        <span className="shrink-0">
                                            {e.sets} {e.sets === 1 ? "serie" : "series"}
                                            {e.role === "secondary" && " · secundario"}
                                        </span>
                                    </p>
                                ))}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-sm text-concrete-500 dark:text-concrete-400">
                    Más trabajado:{" "}
                    {ranking.map((key, i) => (
                        <span key={key}>
                            {i > 0 && ", "}
                            <span className="font-medium text-concrete-700 dark:text-concrete-200">
                                {MUSCLE_LABELS[key]}
                            </span>{" "}
                            ({formatSets(muscles[key]!.sets)})
                        </span>
                    ))}
                    . Toca un músculo para ver el detalle.
                </p>
            )}
        </div>
    );
}
