import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running migration to add prepaid session tables...');
    
    // Create session_balances table
    await sql`
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
    `;
    console.log('Created session_balances table');

    // Create session_transactions table
    await sql`
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
    `;
    console.log('Created session_transactions table');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS "idx_session_balances_player_id" ON "session_balances" ("player_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_session_balances_team_id" ON "session_balances" ("team_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_session_transactions_player_id" ON "session_transactions" ("player_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_session_transactions_team_id" ON "session_transactions" ("team_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_session_transactions_date" ON "session_transactions" ("date");`;
    console.log('Created indexes');
    
    console.log('Migration completed successfully!');
    
    // Verify the tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('session_balances', 'session_transactions')
      ORDER BY table_name;
    `;
    
    console.log('\nCreated tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration(); 