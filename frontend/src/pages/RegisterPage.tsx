import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { Button, Input } from "../components/ui";

export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await register(email, password);
            navigate("/routines");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Algo salió mal");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-concrete-100 px-4 dark:bg-concrete-950">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
                <h1 className="text-center text-2xl font-semibold">Crear cuenta</h1>

                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                <Input
                    type="password"
                    placeholder="Contraseña (mín. 8 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creando..." : "Crear cuenta"}
                </Button>

                <p className="text-center text-sm text-concrete-500 dark:text-concrete-400">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="font-medium text-volt-700 dark:text-volt">
                        Entra
                    </Link>
                </p>
            </form>
        </div>
    );
}
