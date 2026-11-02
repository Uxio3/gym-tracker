import {
    pgTable,
    serial,
    text,
    integer,
    real,
    timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    muscleGroup: text("muscle_group"),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Catalog fields, filled for exercises imported from free-exercise-db.
    // `externalId` is the dataset's own id and keeps the import idempotent.
    externalId: text("external_id").unique(),
    equipment: text("equipment"),
    level: text("level"),
    category: text("category"),
    secondaryMuscles: text("secondary_muscles").array(),
    instructions: text("instructions").array(),
    images: text("images").array(),
});

export const routines = pgTable("routines", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const routineExercises = pgTable("routine_exercises", {
    id: serial("id").primaryKey(),
    routineId: integer("routine_id")
        .notNull()
        .references(() => routines.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
        .notNull()
        .references(() => exercises.id),
    order: integer("order").notNull().default(0),
    targetSets: integer("target_sets"),
    targetReps: integer("target_reps"),
});

export const workoutSessions = pgTable("workout_sessions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id),
    // Workout history outlives the routine it was based on.
    routineId: integer("routine_id").references(() => routines.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
});

export const revokedTokens = pgTable("revoked_tokens", {
    id: serial("id").primaryKey(),
    jti: text("jti").notNull().unique(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at").defaultNow().notNull(),
});

export const setEntries = pgTable("set_entries", {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
        .notNull()
        .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
        .notNull()
        .references(() => exercises.id),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps").notNull(),
    weightKg: real("weight_kg"),
    rpe: real("rpe"),
    notes: text("notes"),
});

export const userProfiles = pgTable("user_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .unique()
        .references(() => users.id),
    weightKg: real("weight_kg").notNull(),
    heightCm: real("height_cm").notNull(),
    age: integer("age").notNull(),
    activityLevel: text("activity_level").notNull(),
    goal: text("goal").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const routineTemplates = pgTable("routine_templates", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    goal: text("goal").notNull(),
    description: text("description"),
});

export const routineTemplateExercises = pgTable("routine_template_exercises", {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
        .notNull()
        .references(() => routineTemplates.id),
    exerciseId: integer("exercise_id")
        .notNull()
        .references(() => exercises.id),
    order: integer("order").notNull().default(0),
    targetSets: integer("target_sets"),
    targetReps: integer("target_reps"),
});

// A routine the user committed to for a fixed period (3 months), picked from
// the suggested templates. The plan is active while `endsAt` is in the future.
export const trainingPlans = pgTable("training_plans", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id),
    // Deleting the routine also drops the plan built on it.
    routineId: integer("routine_id")
        .notNull()
        .references(() => routines.id, { onDelete: "cascade" }),
    templateId: integer("template_id").references(() => routineTemplates.id, {
        onDelete: "set null",
    }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endsAt: timestamp("ends_at").notNull(),
});
