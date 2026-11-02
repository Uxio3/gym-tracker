export function formatSessionDate(iso: string) {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDuration(startedAt: string, finishedAt: string) {
    const minutes = Math.max(
        1,
        Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    );
    return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

// Accepts "62,5" as well as "62.5". Empty input means "no value".
export function parseDecimal(text: string): number | null {
    const trimmed = text.trim().replace(",", ".");
    if (!trimmed) return null;
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : NaN;
}
