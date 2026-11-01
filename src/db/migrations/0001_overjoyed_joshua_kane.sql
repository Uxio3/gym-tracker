CREATE TABLE "revoked_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"jti" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revoked_tokens_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
ALTER TABLE "revoked_tokens" ADD CONSTRAINT "revoked_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;