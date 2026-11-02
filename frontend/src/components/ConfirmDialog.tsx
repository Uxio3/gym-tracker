import { useEffect, type ReactNode } from "react";
import { Button } from "./ui";

export function ConfirmDialog({
    open,
    title,
    children,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    danger = true,
    pending = false,
    error,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    children?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    pending?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !pending) onCancel();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, pending, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            onClick={() => !pending && onCancel()}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                className="w-full max-w-sm space-y-4 rounded-2xl bg-concrete-50 p-5 text-concrete-900 shadow-xl dark:bg-concrete-800 dark:text-concrete-100"
                style={{ marginBottom: "env(safe-area-inset-bottom)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-title" className="text-lg font-semibold">
                    {title}
                </h2>
                {children && (
                    <div className="text-sm text-concrete-600 dark:text-concrete-300">{children}</div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onCancel}
                        disabled={pending}
                        autoFocus
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant={danger ? "danger" : "primary"}
                        className="flex-1"
                        onClick={onConfirm}
                        disabled={pending}
                    >
                        {pending ? "..." : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
