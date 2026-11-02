CREATE TABLE "routine_template_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"target_sets" integer,
	"target_reps" integer
);
--> statement-breakpoint
CREATE TABLE "routine_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"goal" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"weight_kg" real NOT NULL,
	"height_cm" real NOT NULL,
	"age" integer NOT NULL,
	"activity_level" text NOT NULL,
	"goal" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "routine_template_exercises" ADD CONSTRAINT "routine_template_exercises_template_id_routine_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."routine_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_template_exercises" ADD CONSTRAINT "routine_template_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;