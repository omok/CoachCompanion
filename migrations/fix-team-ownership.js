// This script adds a team membership record for the team owner
import { neon } from '@neondatabase/serverless';

// You'll need to replace 'YOUR_DATABASE_URL' with your actual database URL when running this script
const DATABASE_URL = 'YOUR_DATABASE_URL';
const sql = neon(DATABASE_URL);

async function addTeamOwnership() {
  try {
    console.log('Starting to fix team ownership...');
    
    // Check if the user is already a team member
    const existingMembership = await sql`
      SELECT * FROM team_members 
      WHERE team_id = 1 AND user_id = 1
    `;
    
    if (existingMembership.length > 0) {
      console.log('User is already a team member. Updating role to Owner...');
      const updated = await sql`
        UPDATE team_members
        SET role = 'Owner', is_owner = true
        WHERE team_id = 1 AND user_id = 1
        RETURNING *
      `;
      console.log('Updated membership:', updated[0]);
    } else {
      console.log('Adding user as team owner...');
      const inserted = await sql`
        INSERT INTO team_members (team_id, user_id, role, is_owner)
        VALUES (1, 1, 'Owner', true)
        RETURNING *
      `;
      console.log('Added membership:', inserted[0]);
    }
    
    // Show all team members
    const allMembers = await sql`
      SELECT * FROM team_members
    `;
    
    console.log('\nAll team memberships:');
    console.log(allMembers);
    
  } catch (error) {
    console.error('Error fixing team ownership:', error);
  }
}

addTeamOwnership(); 