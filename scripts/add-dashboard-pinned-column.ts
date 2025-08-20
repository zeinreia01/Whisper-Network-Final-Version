
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Create database connection
const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function addDashboardPinnedColumn() {
  try {
    console.log("Adding isPinned column to dashboard_messages table...");
    
    // Add isPinned column with default value false
    await sql`
      ALTER TABLE dashboard_messages 
      ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE
    `;
    
    console.log("✅ Successfully added isPinned column to dashboard_messages table");
    
    // Close the connection
    await sql.end();
  } catch (error) {
    console.error("❌ Error adding isPinned column:", error);
    process.exit(1);
  }
}

// Run the migration
addDashboardPinnedColumn();
