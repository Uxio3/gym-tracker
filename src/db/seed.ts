import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { and, eq, inArray, isNull, notExists, sql } from "drizzle-orm";
import { db } from "./client.js";
import {
    exercises,
    routineTemplates,
    routineTemplateExercises,
    routineExercises,
    setEntries,
} from "./schema.js";
import { CATEGORIES_ES, EQUIPMENT_ES, LEVELS_ES, MUSCLES_ES, translate } from "./catalog-es.js";

// Exercise catalog vendored from https://github.com/yuhonas/free-exercise-db
// (public domain, Unlicense). To update it, replace data/free-exercise-db.json
// with a newer dist/exercises.json and bump CATALOG_COMMIT so image URLs
// point at the matching version.
//
// data/free-exercise-db.es.json holds the Spanish instructions, keyed by the
// dataset id. Exercises missing from it keep their English instructions.
const CATALOG_PATH = new URL("./data/free-exercise-db.json", import.meta.url);
const INSTRUCTIONS_ES_PATH = new URL("./data/free-exercise-db.es.json", import.meta.url);
const CATALOG_COMMIT = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5";
const CATALOG_IMAGE_BASE_URL = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@${CATALOG_COMMIT}/exercises`;

interface CatalogExercise {
    id: string;
    name: string;
    force: string | null;
    level: string;
    mechanic: string | null;
    equipment: string | null;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    instructions: string[];
    category: string;
    images: string[];
}

interface TemplateDefinition {
    name: string;
    goal: "muscle" | "strength" | "definition";
    description: string;
    exercises: { externalId: string; targetSets: number; targetReps: number }[];
}

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
    {
        name: "Hipertrofia - Full Body",
        goal: "muscle",
        description: "Rutina de cuerpo completo enfocada en volumen moderado-alto para ganar masa muscular.",
        exercises: [
            { externalId: "Barbell_Squat", targetSets: 4, targetReps: 10 },
            { externalId: "Barbell_Bench_Press_-_Medium_Grip", targetSets: 4, targetReps: 10 },
            { externalId: "Bent_Over_Barbell_Row", targetSets: 4, targetReps: 10 },
            { externalId: "Standing_Military_Press", targetSets: 3, targetReps: 12 },
            { externalId: "Barbell_Curl", targetSets: 3, targetReps: 12 },
        ],
    },
    {
        name: "Hipertrofia - Empuje",
        goal: "muscle",
        description: "Rutina de empuje (pecho, hombro, triceps) con repeticiones altas para hipertrofia.",
        exercises: [
            { externalId: "Barbell_Bench_Press_-_Medium_Grip", targetSets: 4, targetReps: 10 },
            { externalId: "Standing_Military_Press", targetSets: 3, targetReps: 12 },
            { externalId: "Dips_-_Triceps_Version", targetSets: 3, targetReps: 12 },
            { externalId: "Triceps_Pushdown", targetSets: 3, targetReps: 15 },
            { externalId: "Side_Lateral_Raise", targetSets: 3, targetReps: 15 },
        ],
    },
    {
        name: "Fuerza - Basicos 5x5",
        goal: "strength",
        description: "Rutina clasica de fuerza basada en los movimientos basicos a bajas repeticiones.",
        exercises: [
            { externalId: "Barbell_Squat", targetSets: 5, targetReps: 5 },
            { externalId: "Barbell_Bench_Press_-_Medium_Grip", targetSets: 5, targetReps: 5 },
            { externalId: "Barbell_Deadlift", targetSets: 3, targetReps: 5 },
            { externalId: "Standing_Military_Press", targetSets: 5, targetReps: 5 },
        ],
    },
    {
        name: "Fuerza - Tiron y empuje",
        goal: "strength",
        description: "Rutina de fuerza centrada en los patrones de tiron y empuje con cargas altas.",
        exercises: [
            { externalId: "Barbell_Deadlift", targetSets: 4, targetReps: 5 },
            { externalId: "Pullups", targetSets: 4, targetReps: 6 },
            { externalId: "Barbell_Bench_Press_-_Medium_Grip", targetSets: 5, targetReps: 5 },
            { externalId: "Bent_Over_Barbell_Row", targetSets: 4, targetReps: 6 },
        ],
    },
    {
        name: "Definicion - Circuito Full Body",
        goal: "definition",
        description: "Circuito de cuerpo completo con poco descanso para maximizar el gasto calorico.",
        exercises: [
            { externalId: "Barbell_Squat", targetSets: 3, targetReps: 15 },
            { externalId: "Dumbbell_Lunges", targetSets: 3, targetReps: 15 },
            // The catalog has no burpees; star jumps are the closest match.
            { externalId: "Star_Jump", targetSets: 4, targetReps: 15 },
            { externalId: "Mountain_Climbers", targetSets: 4, targetReps: 20 },
            { externalId: "Plank", targetSets: 3, targetReps: 30 },
        ],
    },
    {
        name: "Definicion - Tren superior y cardio",
        goal: "definition",
        description: "Tren superior con altas repeticiones combinado con trabajo cardiovascular.",
        exercises: [
            { externalId: "Barbell_Bench_Press_-_Medium_Grip", targetSets: 3, targetReps: 15 },
            { externalId: "One-Arm_Dumbbell_Row", targetSets: 3, targetReps: 15 },
            { externalId: "Barbell_Hip_Thrust", targetSets: 3, targetReps: 15 },
            // The catalog has no burpees; star jumps are the closest match.
            { externalId: "Star_Jump", targetSets: 4, targetReps: 15 },
        ],
    },
];

export async function seedExerciseCatalog() {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as CatalogExercise[];
    const instructionsEs = JSON.parse(readFileSync(INSTRUCTIONS_ES_PATH, "utf8")) as Record<
        string,
        string[]
    >;

    const rows = catalog.map((exercise) => ({
        externalId: exercise.id,
        name: exercise.name,
        muscleGroup: translate(MUSCLES_ES, exercise.primaryMuscles[0] ?? null),
        equipment: translate(EQUIPMENT_ES, exercise.equipment),
        level: translate(LEVELS_ES, exercise.level),
        category: translate(CATEGORIES_ES, exercise.category),
        secondaryMuscles: exercise.secondaryMuscles.map((m) => translate(MUSCLES_ES, m)!),
        // A few source entries contain empty steps; drop them.
        instructions:
            instructionsEs[exercise.id] ?? exercise.instructions.filter((step) => step.trim()),
        images: exercise.images.map((image) => `${CATALOG_IMAGE_BASE_URL}/${image}`),
        createdBy: null,
    }));

    // Insert in chunks to stay well below Postgres' bind-parameter limit.
    // Exercises that were already imported get their catalog fields refreshed,
    // so re-running the seed picks up new translations or dataset updates.
    for (let i = 0; i < rows.length; i += 200) {
        await db
            .insert(exercises)
            .values(rows.slice(i, i + 200))
            .onConflictDoUpdate({
                target: exercises.externalId,
                set: {
                    name: sql`excluded.name`,
                    muscleGroup: sql`excluded.muscle_group`,
                    equipment: sql`excluded.equipment`,
                    level: sql`excluded.level`,
                    category: sql`excluded.category`,
                    secondaryMuscles: sql`excluded.secondary_muscles`,
                    instructions: sql`excluded.instructions`,
                    images: sql`excluded.images`,
                },
            });
    }
}

export async function seedRoutineTemplates() {
    const externalIds = [
        ...new Set(
            TEMPLATE_DEFINITIONS.flatMap((template) =>
                template.exercises.map((exercise) => exercise.externalId)
            )
        ),
    ];

    const catalogRows = await db
        .select({ id: exercises.id, externalId: exercises.externalId })
        .from(exercises)
        .where(inArray(exercises.externalId, externalIds));
    const exerciseIdByExternalId = new Map(
        catalogRows.map((row) => [row.externalId!, row.id])
    );

    const missing = externalIds.filter((id) => !exerciseIdByExternalId.has(id));
    if (missing.length > 0) {
        throw new Error(
            `Routine templates reference exercises missing from the catalog: ${missing.join(", ")}`
        );
    }

    // Templates are static content and nothing references them (cloning
    // copies their exercises into a new routine), so they are rebuilt from
    // scratch on every run. That keeps them in sync with this file.
    await db.transaction(async (tx) => {
        await tx.delete(routineTemplateExercises);
        await tx.delete(routineTemplates);

        for (const template of TEMPLATE_DEFINITIONS) {
            const [row] = await tx
                .insert(routineTemplates)
                .values({
                    name: template.name,
                    goal: template.goal,
                    description: template.description,
                })
                .returning();

            await tx.insert(routineTemplateExercises).values(
                template.exercises.map((exercise, index) => ({
                    templateId: row.id,
                    exerciseId: exerciseIdByExternalId.get(exercise.externalId)!,
                    order: index,
                    targetSets: exercise.targetSets,
                    targetReps: exercise.targetReps,
                }))
            );
        }
    });
}

// Earlier versions of this seed created a handful of shared exercises with
// Spanish names and no catalog id. Once the templates point at the catalog,
// drop the ones nobody uses so they don't show up twice in the app. Any that
// are still part of a user's routine or workout history are kept.
export async function removeLegacySeedExercises() {
    await db
        .delete(exercises)
        .where(
            and(
                isNull(exercises.createdBy),
                isNull(exercises.externalId),
                notExists(
                    db
                        .select()
                        .from(routineExercises)
                        .where(eq(routineExercises.exerciseId, exercises.id))
                ),
                notExists(
                    db
                        .select()
                        .from(setEntries)
                        .where(eq(setEntries.exerciseId, exercises.id))
                ),
                notExists(
                    db
                        .select()
                        .from(routineTemplateExercises)
                        .where(eq(routineTemplateExercises.exerciseId, exercises.id))
                )
            )
        );
}

export async function seed() {
    await seedExerciseCatalog();
    await seedRoutineTemplates();
    await removeLegacySeedExercises();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    seed()
        .then(() => {
            console.log("Exercise catalog and routine templates seeded.");
            process.exit(0);
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
