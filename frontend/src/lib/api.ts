const TOKEN_KEY = "gym-tracker-token";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
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
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
