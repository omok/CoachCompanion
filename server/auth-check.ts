import { storage } from "./storage";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Copy of the comparePasswords function from auth.ts since it's not exported
async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  
  if (!username || !password) {
    console.error("Usage: npx tsx server/auth-check.ts <username> <password>");
    process.exit(1);
  }
  
  console.log(`Checking authentication for username: ${username}`);
  
  try {
    // Get user by username
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.error(`User not found: ${username}`);
      process.exit(1);
    }
    
    console.log(`Found user: ID=${user.id}, Username=${user.username}, Role=${user.role}`);
    
    // Check password
    const passwordMatch = await comparePasswords(password, user.password);
    
    if (passwordMatch) {
      console.log("✅ Password is correct!");
    } else {
      console.log("❌ Password is incorrect!");
    }
    
  } catch (error) {
    console.error("Error during authentication check:", error);
  }
}

main().catch(console.error); 