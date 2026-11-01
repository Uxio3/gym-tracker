import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from "react";

const buttonVariants = {
    primary:
        "bg-indigo-600 text-white active:bg-indigo-700 disabled:bg-indigo-300",
    secondary:
        "bg-gray-100 text-gray-900 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
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
            className={`min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${className}`}
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
            className={`min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-base text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${className}`}
            {...props}
        />
    );
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
            {...props}
        />
    );
}
