import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

const buttonVariants = {
    primary:
        "bg-concrete-900 text-volt active:bg-concrete-800 disabled:bg-concrete-400 disabled:text-concrete-600 dark:bg-volt dark:text-concrete-900 dark:active:opacity-90 dark:disabled:bg-concrete-600 dark:disabled:text-concrete-800",
    secondary:
        "bg-transparent text-steelblue border border-steelblue active:bg-steelblue/10 dark:text-steelblue-light dark:border-steelblue-light dark:active:bg-steelblue-light/10",
    danger: "bg-red-600 text-white active:bg-red-700",
};

export function Button({
    className = "",
    variant = "primary",
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof buttonVariants;
}) {
    return (
        <button
            className={`min-h-11 rounded-xl px-4 py-2.5 text-base font-medium transition-colors disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
            {...props}
        />
    );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`min-h-11 w-full rounded-xl border border-concrete-300 bg-concrete-50 px-3.5 py-2.5 text-base text-concrete-900 outline-none focus:border-steelblue focus:ring-2 focus:ring-steelblue/20 dark:border-concrete-700 dark:bg-concrete-800 dark:text-concrete-100 dark:focus:border-steelblue-light dark:focus:ring-steelblue-light/20 ${className}`}
            {...props}
        />
    );
}

export function Select({
    className = "",
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            className={`min-h-11 w-full rounded-xl border border-concrete-300 bg-concrete-50 px-3.5 text-base text-concrete-900 outline-none focus:border-steelblue focus:ring-2 focus:ring-steelblue/20 dark:border-concrete-700 dark:bg-concrete-800 dark:text-concrete-100 dark:focus:border-steelblue-light dark:focus:ring-steelblue-light/20 ${className}`}
            {...props}
        />
    );
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`rounded-2xl border border-concrete-200 bg-concrete-50 p-4 dark:border-concrete-700 dark:bg-concrete-800 ${className}`}
            {...props}
        />
    );
}

const badgeVariants = {
    neutral: "bg-concrete-200 text-concrete-700 dark:bg-concrete-700 dark:text-concrete-200",
    volt: "bg-volt/20 text-volt-700 dark:bg-volt/15 dark:text-volt",
    success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

export function Badge({
    className = "",
    variant = "neutral",
    ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof badgeVariants }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeVariants[variant]} ${className}`}
            {...props}
        />
    );
}

export function IconTile({ icon, className = "" }: { icon: ReactNode; className?: string }) {
    return (
        <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-concrete-100 text-lg dark:bg-concrete-700 ${className}`}
            aria-hidden="true"
        >
            {icon}
        </span>
    );
}

export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-concrete-300 px-6 py-10 text-center dark:border-concrete-700">
            <span className="text-3xl" aria-hidden="true">
                {icon}
            </span>
            <p className="font-medium">{title}</p>
            {description && (
                <p className="text-sm text-concrete-500 dark:text-concrete-400">{description}</p>
            )}
            {action && <div className="pt-2">{action}</div>}
        </div>
    );
}
