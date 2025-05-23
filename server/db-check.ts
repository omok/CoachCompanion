import { db } from "./db";
import { users } from "@shared/schema";

async function main() {
  // Check if we can connect to the database
  
  try {
    // Query users table
    const allUsers = await db.select().from(users);
    
    // Print user details (excluding password)
    allUsers.forEach(user => {
      // console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Name: ${user.name}`);
    });
    
    // console.log("\nDatabase check completed successfully.");
  } catch (error) {
    // console.error("Error connecting to database:", error);
  }
}

main().catch(console.error); 