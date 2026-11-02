import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

export interface ActionMenuItem {
    label: string;
    onSelect: () => void;
    danger?: boolean;
}

// "⋯" button with a small dropdown. Safe to place inside a <Link>: clicks on
// it never trigger the surrounding navigation.
export function ActionMenu({
    items,
    label = "Más opciones",
}: {
    items: ActionMenuItem[];
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuId = useId();

    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: PointerEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    function stop(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    return (
        <div ref={rootRef} className="relative shrink-0" onClick={stop}>
            <button
                type="button"
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={() => setOpen((v) => !v)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-xl leading-none text-concrete-500 active:bg-concrete-200 dark:text-concrete-400 dark:active:bg-concrete-700"
            >
                ⋯
            </button>
            {open && (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-xl border border-concrete-200 bg-concrete-50 py-1 shadow-lg dark:border-concrete-700 dark:bg-concrete-800"
                >
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                item.onSelect();
                            }}
                            className={`block w-full px-4 py-3 text-left text-sm font-medium active:bg-concrete-100 dark:active:bg-concrete-700 ${
                                item.danger ? "text-red-600 dark:text-red-400" : ""
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
