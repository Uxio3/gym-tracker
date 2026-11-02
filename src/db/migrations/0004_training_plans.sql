CREATE TABLE "training_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"routine_id" integer NOT NULL,
	"template_id" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp NOT NULL
);

--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_template_id_routine_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."routine_templates"("id") ON DELETE set null ON UPDATE no action;