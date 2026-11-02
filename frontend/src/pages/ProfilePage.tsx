import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { UserProfile } from "../lib/types";
import { ProfileForm } from "../components/ProfileForm";

export function ProfilePage() {
    const navigate = useNavigate();

    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: () => api.get<UserProfile | null>("/profile"),
    });

    if (isLoading) {
        return <p className="text-concrete-500">Cargando...</p>;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Tu perfil</h1>
            <p className="text-sm text-concrete-500 dark:text-concrete-400">
                Estos datos se usan para sugerirte rutinas acordes a tu meta. Puedes
                actualizarlos cuando quieras.
            </p>
            <ProfileForm
                initialProfile={profile}
                submitLabel="Guardar cambios"
                onSaved={() => navigate("/")}
            />
        </div>
    );
}
