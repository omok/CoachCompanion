// Migration script to add a team membership record
import pg from 'pg';
const { Client } = pg;

async function main() {
  // Create a client to connect to the database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    // First, check if the team_members table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members'
      );
    `;
    const tableCheck = await client.query(tableCheckQuery);
    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      console.log('team_members table does not exist, creating it...');
      const createTableQuery = `
        CREATE TABLE team_members (
          id SERIAL PRIMARY KEY,
          team_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role VARCHAR(255) NOT NULL,
          is_owner BOOLEAN NOT NULL DEFAULT false
        );
      `;
      await client.query(createTableQuery);
      console.log('Created team_members table');
    } else {
      console.log('team_members table exists');
    }

    // Check if a membership for user 1 and team 1 already exists
    const checkQuery = `
      SELECT * FROM team_members 
      WHERE user_id = 1 AND team_id = 1;
    `;
    const checkResult = await client.query(checkQuery);

    if (checkResult.rows.length > 0) {
      console.log('Team membership already exists:', checkResult.rows[0]);
      
      // Update the existing record to ensure owner status
      const updateQuery = `
        UPDATE team_members 
        SET role = 'owner', is_owner = true
        WHERE user_id = 1 AND team_id = 1
        RETURNING *;
      `;
      const updateResult = await client.query(updateQuery);
      console.log('Updated team membership:', updateResult.rows[0]);
    } else {
      // Insert a new team membership record
      const insertQuery = `
        INSERT INTO team_members (team_id, user_id, role, is_owner)
        VALUES (1, 1, 'owner', true)
        RETURNING *;
      `;
      const insertResult = await client.query(insertQuery);
      console.log('Created team membership:', insertResult.rows[0]);
    }

    // List all team memberships
    const listQuery = `SELECT * FROM team_members;`;
    const listResult = await client.query(listQuery);
    console.log('All team memberships:', listResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Disconnected from database');
  }
}

main(); 