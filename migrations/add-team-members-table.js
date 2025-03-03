import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createTeamMembersTable() {
  try {
    console.log('Creating team_members table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR NOT NULL,
        is_owner BOOLEAN NOT NULL DEFAULT false
      );
    `;
    
    console.log('Team members table created successfully!');
    
    // Add some indexes to improve query performance
    console.log('Adding indexes...');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members (team_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);
    `;
    
    console.log('Indexes added successfully!');
    
    // Check that the table was created
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('Verified that team_members table exists.');
      
      // Get column information
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'team_members'
        ORDER BY ordinal_position;
      `;
      
      console.log('\nColumns in team_members table:');
      columns.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type})`);
      });
    } else {
      console.log('Failed to create team_members table.');
    }
    
  } catch (error) {
    console.error('Error creating team_members table:', error);
  } finally {
    process.exit(0);
  }
}

createTeamMembersTable(); 