// This script uses the existing server database connection to add team ownership

// Import database setup from the server code
const { db } = require('./db');
const { teamMembers } = require('../shared/schema');
const { eq } = require('drizzle-orm');

async function fixTeamOwnership() {
  try {
    console.log('Starting to fix team ownership...');
    
    // Check if the user is already a team member
    const existingMembership = await db.select()
      .from(teamMembers)
      .where(
        eq(teamMembers.teamId, 1) && 
        eq(teamMembers.userId, 1)
      );
    
    if (existingMembership.length > 0) {
      console.log('User is already a team member. Updating role to Owner...');
      
      const updated = await db.update(teamMembers)
        .set({ 
          role: 'Owner', 
          isOwner: true 
        })
        .where(
          eq(teamMembers.teamId, 1) && 
          eq(teamMembers.userId, 1)
        )
        .returning();
      
      console.log('Updated membership:', updated[0]);
    } else {
      console.log('Adding user as team owner...');
      
      const inserted = await db.insert(teamMembers)
        .values({ 
          teamId: 1, 
          userId: 1, 
          role: 'Owner', 
          isOwner: true 
        })
        .returning();
      
      console.log('Added membership:', inserted[0]);
    }
    
    // Show all team members
    const allMembers = await db.select().from(teamMembers);
    console.log('\nAll team memberships:');
    console.log(allMembers);
    
    console.log('Team ownership fix complete!');
  } catch (error) {
    console.error('Error fixing team ownership:', error);
  }
}

// Run the fix
fixTeamOwnership(); 