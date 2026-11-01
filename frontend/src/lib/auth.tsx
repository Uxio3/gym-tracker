import { createContext, useContext, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import type { User } from "./types";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "gym-tracker-user";

function loadStoredUser(): User | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(getToken());
    const [user, setUser] = useState<User | null>(loadStoredUser());

    function persist(nextToken: string, nextUser: User) {
        setToken(nextToken);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setTokenState(nextToken);
        setUser(nextUser);
    }

    async function login(email: string, password: string) {
        const res = await api.post<{ token: string; user: User }>("/auth/login", {
            email,
            password,
        });
        persist(res.token, res.user);
    }

    async function register(email: string, password: string) {
        const res = await api.post<{ token: string; user: User }>("/auth/register", {
            email,
            password,
        });
        persist(res.token, res.user);
    }

    function logout() {
        clearToken();
        localStorage.removeItem(USER_KEY);
        setTokenState(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
