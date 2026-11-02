const TOKEN_KEY = "gym-tracker-token";
const USER_KEY = "gym-tracker-user";

export const UNAUTHORIZED_EVENT = "gym-tracker:unauthorized";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser<T>(): T | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const res = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (res.status === 401 && token) {
        // The token we sent was rejected (expired/revoked) — drop the local
        // session so the app doesn't keep looking authenticated.
        clearSession();
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    if (res.status === 204) {
        return undefined as T;
    }

    const body = await res.json().catch(() => undefined);

    if (!res.ok) {
        throw new ApiError(res.status, body?.error ?? "Request failed");
    }

    return body as T;
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, data?: unknown) =>
        request<T>(path, {
            method: "POST",
            body: data !== undefined ? JSON.stringify(data) : undefined,
        }),
    put: <T>(path: string, data?: unknown) =>
        request<T>(path, {
            method: "PUT",
            body: data !== undefined ? JSON.stringify(data) : undefined,
        }),
    patch: <T>(path: string, data?: unknown) =>
        request<T>(path, {
            method: "PATCH",
            body: data !== undefined ? JSON.stringify(data) : undefined,
        }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
