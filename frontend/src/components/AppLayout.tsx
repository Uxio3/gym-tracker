import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navItems = [
    { to: "/routines", label: "Rutinas", icon: "📋" },
    { to: "/workouts", label: "Entrenos", icon: "🏋️" },
    { to: "/exercises", label: "Ejercicios", icon: "💪" },
];

export function AppLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="flex min-h-screen flex-col bg-concrete-100 text-concrete-900 dark:bg-concrete-950 dark:text-concrete-100">
            <header className="border-b border-concrete-200 dark:border-concrete-700">
                <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
                    <span className="text-lg font-semibold">Gym Tracker</span>
                    <button
                        onClick={logout}
                        className="min-h-11 px-2 text-sm text-concrete-500 active:text-concrete-700 dark:text-concrete-400 dark:active:text-concrete-200"
                    >
                        {user?.email} · Salir
                    </button>
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
