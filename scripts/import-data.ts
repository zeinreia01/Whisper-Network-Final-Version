import { db } from "../server/db";
import { users, messages, replies, admins } from "../shared/schema";
import fs from "fs";
import path from "path";

/**
 * DATA IMPORT SCRIPT
 * 
 * This script helps import data from CSV/JSON exports into your database.
 * 
 * Usage:
 * 1. Export your data from Supabase as CSV or JSON files
 * 2. Place the files in the 'data-exports' directory:
 *    - users.json or users.csv
 *    - messages.json or messages.csv
 *    - replies.json or replies.csv
 *    - admins.json or admins.csv
 * 3. Run: npm run import-data
 */

async function importData() {
  const dataDir = path.join(process.cwd(), "data-exports");

  if (!fs.existsSync(dataDir)) {
    console.log("❌ No data-exports directory found");
    console.log("📁 Create a 'data-exports' directory in the root with your exported files:");
    console.log("   - users.json");
    console.log("   - messages.json");
    console.log("   - replies.json");
    console.log("   - admins.json");
    return;
  }

  try {
    // Import users
    const usersFile = path.join(dataDir, "users.json");
    if (fs.existsSync(usersFile)) {
      const userData = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
      console.log(`📥 Importing ${userData.length} users...`);
      await db.insert(users).values(userData).onConflictDoNothing();
      console.log("✅ Users imported");
    }

    // Import admins
    const adminsFile = path.join(dataDir, "admins.json");
    if (fs.existsSync(adminsFile)) {
      const adminData = JSON.parse(fs.readFileSync(adminsFile, "utf-8"));
      console.log(`📥 Importing ${adminData.length} admins...`);
      await db.insert(admins).values(adminData).onConflictDoNothing();
      console.log("✅ Admins imported");
    }

    // Import messages
    const messagesFile = path.join(dataDir, "messages.json");
    if (fs.existsSync(messagesFile)) {
      const messageData = JSON.parse(fs.readFileSync(messagesFile, "utf-8"));
      console.log(`📥 Importing ${messageData.length} messages...`);
      await db.insert(messages).values(messageData).onConflictDoNothing();
      console.log("✅ Messages imported");
    }

    // Import replies
    const repliesFile = path.join(dataDir, "replies.json");
    if (fs.existsSync(repliesFile)) {
      const replyData = JSON.parse(fs.readFileSync(repliesFile, "utf-8"));
      console.log(`📥 Importing ${replyData.length} replies...`);
      await db.insert(replies).values(replyData).onConflictDoNothing();
      console.log("✅ Replies imported");
    }

    console.log("\n✨ Data import complete!");
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

importData();
