import { db } from "./db";
import { users } from "@shared/schema";

async function main() {
  console.log("Checking database connection...");
  
  try {
    // Check if we can connect to the database
    console.log("Database URL:", process.env.DATABASE_URL?.replace(/:[^:]*@/, ":****@"));
    
    // Query users table
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in the database:`);
    
    // Print user details (excluding password)
    allUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Name: ${user.name}`);
    });
    
    console.log("\nDatabase check completed successfully.");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}

main().catch(console.error); 