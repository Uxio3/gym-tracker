ALTER TABLE "exercises" ADD COLUMN "external_id" text;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "equipment" text;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "level" text;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "category" text;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "secondary_muscles" text[];
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "instructions" text[];
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "images" text[];
--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_external_id_unique" UNIQUE("external_id");