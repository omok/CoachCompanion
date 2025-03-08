import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!username || !newPassword) {
    console.error("Usage: npx tsx server/reset-password.ts <username> <newPassword>");
    process.exit(1);
  }
  
  console.log(`Resetting password for user: ${username}`);
  
  try {
    // Get user by username
    const result = await db.select().from(users).where(eq(users.username, username));
    const user = result[0];
    
    if (!user) {
      console.error(`User not found: ${username}`);
      process.exit(1);
    }
    
    console.log(`Found user: ID=${user.id}, Username=${user.username}, Role=${user.role}`);
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password
    const updateResult = await db.update(users)
      .set({ password: hashedPassword, lastUpdatedByUser: user.id })
      .where(eq(users.id, user.id))
      .returning();
    
    if (updateResult.length > 0) {
      console.log(`✅ Password reset successful for user: ${username}`);
    } else {
      console.error(`❌ Failed to reset password for user: ${username}`);
    }
    
  } catch (error) {
    console.error("Error resetting password:", error);
  }
}

main().catch(console.error); 