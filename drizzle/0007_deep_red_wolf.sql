CREATE TABLE "favorite_actors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"actor_id" integer NOT NULL,
	"actor_name" text NOT NULL,
	"profile_path" text,
	"known_for_department" text,
	"popularity" real,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "actor_id_user_email_idx" ON "favorite_actors" USING btree ("actor_id","user_email");