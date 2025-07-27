
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function addPinnedColumn() {
  try {
    console.log("🔄 Adding isPinned column to messages table...");
    
    // Add the isPinned column with default value false
    await db.execute(sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE
    `);
    
    console.log("✅ Successfully added isPinned column to messages table");
    console.log("🎯 Database is now ready for pin/unpin functionality");
    
  } catch (error) {
    console.error("❌ Error adding isPinned column:", error);
    throw error;
  }
}

// Run the migration
addPinnedColumn()
  .then(() => {
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
