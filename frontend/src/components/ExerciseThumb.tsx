import { useState } from "react";
import type { Exercise } from "../lib/types";

// The size is set inline (not with utility classes) so the photo can never
// render at its natural size, whatever CSS has or hasn't been generated.
export function ExerciseThumb({
    exercise,
    size = 40,
}: {
    exercise: Pick<Exercise, "images"> | undefined;
    size?: number;
}) {
    const [failed, setFailed] = useState(false);
    const src = exercise?.images?.[0];
    const style = { width: size, height: size, minWidth: size };

    if (!src || failed) {
        return (
            <span
                style={{ ...style, fontSize: size * 0.45 }}
                className="flex shrink-0 items-center justify-center rounded-xl bg-concrete-100 dark:bg-concrete-700"
                aria-hidden="true"
            >
                💪
            </span>
        );
    }

    return (
        <img
            src={src}
            alt=""
            loading="lazy"
            width={size}
            height={size}
            style={style}
            onError={() => setFailed(true)}
            className="shrink-0 rounded-xl bg-concrete-100 object-cover dark:bg-concrete-700"
        />
    );
}
