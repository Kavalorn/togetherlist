CREATE TABLE "email_watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"movie_id" integer NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"release_date" text,
	"overview" text,
	"vote_average" real,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_movie_id_idx" ON "email_watchlist" USING btree ("movie_id","user_email");--> statement-breakpoint
ALTER TABLE "friends" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "friends" DROP COLUMN "friend_id";