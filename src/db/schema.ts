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
        .references(() => routines.id),
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
    routineId: integer("routine_id").references(() => routines.id),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
});

export const setEntries = pgTable("set_entries", {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
        .notNull()
        .references(() => workoutSessions.id),
    exerciseId: integer("exercise_id")
        .notNull()
        .references(() => exercises.id),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps").notNull(),
    weightKg: real("weight_kg"),
    rpe: real("rpe"),
    notes: text("notes"),
});
