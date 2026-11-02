import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ActivityLevel, Goal, UserProfile } from "../lib/types";
import { ACTIVITY_LEVEL_OPTIONS, GOAL_OPTIONS } from "../lib/profile-options";
import { Button, Input, Select } from "./ui";

export function ProfileForm({
    initialProfile,
    onSaved,
    submitLabel = "Guardar",
}: {
    initialProfile?: UserProfile | null;
    onSaved?: (profile: UserProfile) => void;
    submitLabel?: string;
}) {
    const queryClient = useQueryClient();
    const [weightKg, setWeightKg] = useState(initialProfile?.weightKg?.toString() ?? "");
    const [heightCm, setHeightCm] = useState(initialProfile?.heightCm?.toString() ?? "");
    const [age, setAge] = useState(initialProfile?.age?.toString() ?? "");
    const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">(
        initialProfile?.activityLevel ?? ""
    );
    const [goal, setGoal] = useState<Goal | "">(initialProfile?.goal ?? "");

    const saveProfile = useMutation({
        mutationFn: () =>
            api.put<UserProfile>("/profile", {
                weightKg: Number(weightKg),
                heightCm: Number(heightCm),
                age: Number(age),
                activityLevel,
                goal,
            }),
        onSuccess: (profile) => {
            queryClient.setQueryData(["profile"], profile);
            onSaved?.(profile);
        },
    });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!weightKg || !heightCm || !age || !activityLevel || !goal) return;
        saveProfile.mutate();
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1 text-sm text-concrete-500 dark:text-concrete-400">
                    <span className="block">Peso (kg)</span>
                    <Input
                        type="number"
                        min={1}
                        step="0.1"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                    />
                </label>
                <label className="block space-y-1 text-sm text-concrete-500 dark:text-concrete-400">
                    <span className="block">Altura (cm)</span>
                    <Input
                        type="number"
                        min={1}
                        step="0.1"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                    />
                </label>
            </div>

            <label className="block space-y-1 text-sm text-concrete-500 dark:text-concrete-400">
                <span className="block">Edad</span>
                <Input
                    type="number"
                    min={1}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                />
            </label>

            <label className="block space-y-1 text-sm text-concrete-500 dark:text-concrete-400">
                <span className="block">Actividad fisica</span>
                <Select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                >
                    <option value="">Elegir dias por semana...</option>
                    {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </label>

            <label className="block space-y-1 text-sm text-concrete-500 dark:text-concrete-400">
                <span className="block">Meta para los proximos 3 meses</span>
                <Select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                    <option value="">Elegir meta...</option>
                    {GOAL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </label>

            <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
                {submitLabel}
            </Button>
        </form>
    );
}
