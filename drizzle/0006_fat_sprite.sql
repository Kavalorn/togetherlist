CREATE TABLE "watched_movies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"movie_id" integer NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"release_date" text,
	"overview" text,
	"vote_average" real,
	"vote_count" integer,
	"watched_at" timestamp with time zone DEFAULT now(),
	"comment" text,
	"rating" real
);
--> statement-breakpoint
CREATE UNIQUE INDEX "watched_movie_id_user_idx" ON "watched_movies" USING btree ("movie_id","user_email");