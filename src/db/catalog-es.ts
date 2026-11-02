// Spanish labels for the fixed vocabularies used by free-exercise-db.
// Exercise names stay in English; everything else the app shows is Spanish.

export const MUSCLES_ES = {
    abdominals: "Abdominales",
    abductors: "Abductores",
    adductors: "Aductores",
    biceps: "Bíceps",
    calves: "Gemelos",
    chest: "Pecho",
    forearms: "Antebrazos",
    glutes: "Glúteos",
    hamstrings: "Isquiotibiales",
    lats: "Dorsales",
    "lower back": "Zona lumbar",
    "middle back": "Espalda media",
    neck: "Cuello",
    quadriceps: "Cuádriceps",
    shoulders: "Hombros",
    traps: "Trapecios",
    triceps: "Tríceps",
} as const satisfies Record<string, string>;

export const EQUIPMENT_ES: Record<string, string> = {
    barbell: "Barra",
    dumbbell: "Mancuernas",
    "body only": "Peso corporal",
    cable: "Polea",
    machine: "Máquina",
    kettlebells: "Kettlebell",
    bands: "Bandas elásticas",
    "medicine ball": "Balón medicinal",
    "exercise ball": "Fitball",
    "foam roll": "Rodillo de espuma",
    "e-z curl bar": "Barra Z",
    other: "Otro",
};

export const LEVELS_ES: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    expert: "Avanzado",
};

export const CATEGORIES_ES: Record<string, string> = {
    strength: "Fuerza",
    stretching: "Estiramiento",
    plyometrics: "Pliometría",
    powerlifting: "Powerlifting",
    "olympic weightlifting": "Halterofilia",
    strongman: "Strongman",
    cardio: "Cardio",
};

// Falls back to the original value so a new term in a future version of the
// dataset still shows up (in English) instead of disappearing.
export function translate(labels: Record<string, string>, value: string | null) {
    return value === null ? null : (labels[value] ?? value);
}

function normalizeLabel(text: string) {
    return text
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

const MUSCLE_KEY_BY_LABEL = new Map<string, MuscleKey>();
for (const [key, label] of Object.entries(MUSCLES_ES) as [MuscleKey, string][]) {
    MUSCLE_KEY_BY_LABEL.set(normalizeLabel(key), key);
    MUSCLE_KEY_BY_LABEL.set(normalizeLabel(label), key);
}

export type MuscleKey = keyof typeof MUSCLES_ES;

// Maps a stored muscle label back to its dataset key, so analysis doesn't
// depend on display text. Accepts the Spanish label ("Cuádriceps"), the
// original key ("quadriceps") and user input with any case or accents
// ("cuadriceps", "PECHO"). Returns null for anything else ("Piernas").
export function muscleKey(label: string | null): MuscleKey | null {
    return label === null ? null : (MUSCLE_KEY_BY_LABEL.get(normalizeLabel(label)) ?? null);
}
