import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navItems = [
    { to: "/routines", label: "Rutinas", icon: "📋" },
    { to: "/workouts", label: "Entrenos", icon: "🏋️" },
    { to: "/exercises", label: "Ejercicios", icon: "💪" },
];

function LogoutIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

export function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logout();
            navigate("/login", { replace: true });
        } finally {
            setLoggingOut(false);
        }
    }

    const initial = user?.email?.[0]?.toUpperCase() ?? "?";

    return (
        <div className="flex min-h-screen flex-col bg-concrete-100 text-concrete-900 dark:bg-concrete-950 dark:text-concrete-100">
            <header className="border-b border-concrete-200 dark:border-concrete-700">
                <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
                    <span className="shrink-0 text-lg font-semibold">Gym Tracker</span>

                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-concrete-200 text-sm font-medium text-concrete-700 dark:bg-concrete-700 dark:text-concrete-200"
                            title={user?.email}
                        >
                            {initial}
                        </span>
                        <span
                            className="hidden max-w-[10rem] truncate text-sm text-concrete-500 dark:text-concrete-400 sm:inline"
                            title={user?.email}
                        >
                            {user?.email}
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            aria-label="Cerrar sesión"
                            title="Cerrar sesión"
                            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-concrete-500 active:bg-concrete-200 disabled:opacity-60 dark:text-concrete-400 dark:active:bg-concrete-700"
                        >
                            {loggingOut ? (
                                <span
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                                    aria-hidden="true"
                                />
                            ) : (
                                <LogoutIcon />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-xl flex-1 px-4 py-4 pb-24">
                <Outlet />
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl border-t border-concrete-200 bg-concrete-50 dark:border-concrete-700 dark:bg-concrete-900"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                                isActive
                                    ? "text-volt-700 dark:text-volt"
                                    : "text-concrete-500 dark:text-concrete-400"
                            }`
                        }
                    >
                        <span className="text-xl">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
