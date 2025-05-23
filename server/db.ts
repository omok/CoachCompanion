// Ensure environment variables are loaded
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log a masked version of the database URL for security
const maskedDbUrl = process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@');
console.log("Using DATABASE_URL:", maskedDbUrl);

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
