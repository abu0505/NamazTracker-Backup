import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
config(); // Ensure env vars are loaded

// Use memory database if no DATABASE_URL (for demo/development)
let db: any = null;

if (process.env.DATABASE_URL) {
  const client = postgres(process.env.DATABASE_URL);
  db = drizzle(client);
} else {
  console.log("No DATABASE_URL found - using memory storage only");
  db = null; // Will use MemStorage
}

export { db };
