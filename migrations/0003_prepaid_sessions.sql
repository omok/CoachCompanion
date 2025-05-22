-- Migration to add prepaid session tracking tables
-- This migration adds tables for tracking prepaid sessions

-- Create session_balances table
CREATE TABLE IF NOT EXISTS "session_balances" (
  "id" serial PRIMARY KEY NOT NULL,
  "player_id" integer NOT NULL,
  "team_id" integer NOT NULL,
  "total_sessions" integer NOT NULL,
  "used_sessions" integer NOT NULL DEFAULT 0,
  "remaining_sessions" integer NOT NULL,
  "expiration_date" date,
  "lastUpdatedByUser" integer NOT NULL
);

-- Create session_transactions table
CREATE TABLE IF NOT EXISTS "session_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "player_id" integer NOT NULL,
  "team_id" integer NOT NULL,
  "date" timestamp NOT NULL,
  "session_change" integer NOT NULL,
  "reason" varchar NOT NULL,
  "notes" varchar,
  "payment_id" integer,
  "attendance_id" integer,
  "lastUpdatedByUser" integer NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_session_balances_player_id" ON "session_balances" ("player_id");
CREATE INDEX IF NOT EXISTS "idx_session_balances_team_id" ON "session_balances" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_session_transactions_player_id" ON "session_transactions" ("player_id");
CREATE INDEX IF NOT EXISTS "idx_session_transactions_team_id" ON "session_transactions" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_session_transactions_date" ON "session_transactions" ("date");
