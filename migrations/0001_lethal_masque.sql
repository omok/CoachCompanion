CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"date" timestamp NOT NULL,
	"notes" varchar
);
--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "name" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "practice_notes" ALTER COLUMN "notes" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "sid" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "sess" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expire" SET DATA TYPE timestamp (6);--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "name" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "description" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "jersey_number" varchar;