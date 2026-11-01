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
        <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            <header className="border-b border-gray-200 dark:border-gray-800">
                <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
                    <span className="text-lg font-semibold">Gym Tracker</span>
                    <button
                        onClick={logout}
                        className="min-h-11 px-2 text-sm text-gray-500 active:text-gray-700 dark:text-gray-400"
                    >
                        {user?.email} · Salir
                    </button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-xl flex-1 px-4 py-4 pb-24">
                <Outlet />
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                                isActive
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-500 dark:text-gray-400"
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
