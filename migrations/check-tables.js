import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Query to list all tables in the public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Tables in the database:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Specifically check for team_members table
    const teamMembersExists = tables.some(table => table.table_name === 'team_members');
    if (teamMembersExists) {
      console.log('\nThe team_members table exists.');
      
      // Get column information for team_members table
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
      console.log('\nThe team_members table does NOT exist in the database.');
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    process.exit(0);
  }
}

checkTables(); 