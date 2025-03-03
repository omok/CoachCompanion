import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function addTeamMember() {
  try {
    console.log('Checking for existing teams and users...');
    
    // Get the first team
    const teams = await sql`SELECT * FROM teams LIMIT 1`;
    if (teams.length === 0) {
      console.error('No teams found in the database. Please create a team first.');
      process.exit(1);
    }
    
    // Get the first user
    const users = await sql`SELECT * FROM users LIMIT 1`;
    if (users.length === 0) {
      console.error('No users found in the database. Please create a user first.');
      process.exit(1);
    }
    
    const team = teams[0];
    const user = users[0];
    
    console.log(`Found team: ${team.name} (ID: ${team.id})`);
    console.log(`Found user: ${user.name} (ID: ${user.id})`);
    
    // Check if this team member already exists
    const existingMember = await sql`
      SELECT * FROM team_members 
      WHERE team_id = ${team.id} AND user_id = ${user.id}
    `;
    
    if (existingMember.length > 0) {
      console.log('This user is already a member of this team.');
      console.log('Existing membership:', existingMember[0]);
      process.exit(0);
    }
    
    // Add the user as a team member
    console.log('Adding user as team member...');
    const result = await sql`
      INSERT INTO team_members (team_id, user_id, role, is_owner)
      VALUES (${team.id}, ${user.id}, 'Coach', true)
      RETURNING *
    `;
    
    console.log('Team member added successfully!');
    console.log('New team member:', result[0]);
    
    // Get all team members for this team
    const allMembers = await sql`
      SELECT tm.*, u.name as user_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ${team.id}
    `;
    
    console.log('\nAll team members for this team:');
    allMembers.forEach(member => {
      console.log(`- ${member.user_name} (${member.role}${member.is_owner ? ', Owner' : ''})`);
    });
    
  } catch (error) {
    console.error('Error adding team member:', error);
  } finally {
    process.exit(0);
  }
}

addTeamMember(); 