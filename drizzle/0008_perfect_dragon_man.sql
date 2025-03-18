CREATE TABLE "watchlist_movies" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchlist_id" integer NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"movie_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"poster_path" varchar(255),
	"release_date" varchar(20),
	"overview" text,
	"vote_average" real,
	"vote_count" integer,
	"created_at" timestamp DEFAULT now(),
	"notes" text,
	"priority" integer DEFAULT 0,
	CONSTRAINT "watchlist_movies_watchlist_id_movie_id_unique" UNIQUE("watchlist_id","movie_id")
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"color" varchar(50) DEFAULT '#3b82f6',
	"icon" varchar(50) DEFAULT 'list',
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "watchlists_user_email_name_unique" UNIQUE("user_email","name")
);
--> statement-breakpoint
ALTER TABLE "watchlist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "watchlist" CASCADE;--> statement-breakpoint
DROP INDEX "email_movie_id_idx";--> statement-breakpoint
DROP INDEX "actor_id_user_email_idx";--> statement-breakpoint
DROP INDEX "friendship_idx";--> statement-breakpoint
DROP INDEX "watched_movie_id_user_idx";--> statement-breakpoint
ALTER TABLE "email_watchlist" ALTER COLUMN "user_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "email_watchlist" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "email_watchlist" ALTER COLUMN "poster_path" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "email_watchlist" ALTER COLUMN "release_date" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "email_watchlist" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "favorite_actors" ALTER COLUMN "user_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "favorite_actors" ALTER COLUMN "actor_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "favorite_actors" ALTER COLUMN "profile_path" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "favorite_actors" ALTER COLUMN "known_for_department" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "favorite_actors" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "user_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "friend_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "status" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "watched_movies" ALTER COLUMN "user_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "watched_movies" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "watched_movies" ALTER COLUMN "poster_path" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "watched_movies" ALTER COLUMN "release_date" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "watched_movies" ALTER COLUMN "watched_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "watched_movies" ALTER COLUMN "rating" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "friends" ADD COLUMN "user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "friends" ADD COLUMN "friend_id" varchar(255);