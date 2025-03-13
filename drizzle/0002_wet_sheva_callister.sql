ALTER TABLE "friends" RENAME COLUMN "user_id" TO "user_email";--> statement-breakpoint
ALTER TABLE "friends" RENAME COLUMN "friend_id" TO "friend_email";--> statement-breakpoint
DROP INDEX "friendship_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "friendship_idx" ON "friends" USING btree ("user_email","friend_email");