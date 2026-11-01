import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    api,
    clearSession,
    getStoredUser,
    getToken,
    setStoredUser,
    setToken,
    UNAUTHORIZED_EVENT,
} from "./api";
import type { User } from "./types";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [token, setTokenState] = useState<string | null>(getToken());
    const [user, setUser] = useState<User | null>(getStoredUser<User>());

    function persist(nextToken: string, nextUser: User) {
        setToken(nextToken);
        setStoredUser(nextUser);
        setTokenState(nextToken);
        setUser(nextUser);
    }

    function clearLocalSession() {
        clearSession();
        setTokenState(null);
        setUser(null);
        // Drop any cached data so it can't leak into the next session on
        // this device (e.g. a different user logging in afterwards).
        queryClient.clear();
    }

    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, clearLocalSession);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearLocalSession);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    async function logout() {
        try {
            await api.post("/auth/logout");
        } catch {
            // Best-effort: even if revoking the token on the server fails
            // (offline, server down), still drop the local session.
        } finally {
            clearLocalSession();
        }
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
