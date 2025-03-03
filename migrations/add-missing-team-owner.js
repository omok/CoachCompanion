// This script adds a team membership record for the team owner
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function addTeamOwnership() {
  try {
    console.log('Starting to fix team ownership...');
    
    // Check for user with ID 1
    const users = await sql`SELECT * FROM users WHERE id = 1`;
    if (users.length === 0) {
      console.error('User with ID 1 not found.');
      return;
    }
    
    // Check for team with ID 1
    const teams = await sql`SELECT * FROM teams WHERE id = 1`;
    if (teams.length === 0) {
      console.error('Team with ID 1 not found.');
      return;
    }
    
    // Check if the user is already a team member
    const existingMembership = await sql`
      SELECT * FROM team_members 
      WHERE team_id = 1 AND user_id = 1
    `;
    
    if (existingMembership.length > 0) {
      console.log('User is already a team member. Updating role to Owner...');
      await sql`
        UPDATE team_members
        SET role = 'Owner', is_owner = true
        WHERE team_id = 1 AND user_id = 1
        RETURNING *
      `;
    } else {
      console.log('Adding user as team owner...');
      await sql`
        INSERT INTO team_members (team_id, user_id, role, is_owner)
        VALUES (1, 1, 'Owner', true)
        RETURNING *
      `;
    }
    
    // Verify the team membership was added
    const membership = await sql`
      SELECT * FROM team_members 
      WHERE team_id = 1 AND user_id = 1
    `;
    
    if (membership.length > 0) {
      console.log('Success! User is now the team owner.');
      console.log('Membership details:', membership[0]);
    } else {
      console.error('Failed to add team ownership.');
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