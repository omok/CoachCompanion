import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function runMigration() {
  try {
    console.log('Running migration to add team fields...');
    
    // Add season_start_date column
    await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS season_start_date DATE`;
    console.log('Added season_start_date column');
    
    // Add season_end_date column
    await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS season_end_date DATE`;
    console.log('Added season_end_date column');
    
    // Add team_fee column
    await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_fee NUMERIC`;
    console.log('Added team_fee column');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration(); 