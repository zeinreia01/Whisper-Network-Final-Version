import { db } from "../server/db.ts";
import { users, messages, replies, admins } from "../shared/schema.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data-exports");

async function importData() {
  if (!fs.existsSync(dataDir)) {
    console.log("❌ No data-exports directory found");
    return;
  }

  try {
    // Import users
    const usersFile = path.join(dataDir, "users.json");
    if (fs.existsSync(usersFile)) {
      const userData = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
      const dataArray = Array.isArray(userData) ? userData : [userData];
      if (dataArray.length > 0) {
        console.log(`📥 Importing ${dataArray.length} users...`);
        await db.insert(users).values(dataArray).onConflictDoNothing();
        console.log("✅ Users imported");
      }
    }

    // Import admins
    const adminsFile = path.join(dataDir, "admins.json");
    if (fs.existsSync(adminsFile)) {
      const adminData = JSON.parse(fs.readFileSync(adminsFile, "utf-8"));
      const dataArray = Array.isArray(adminData) ? adminData : [adminData];
      if (dataArray.length > 0) {
        console.log(`📥 Importing ${dataArray.length} admins...`);
        await db.insert(admins).values(dataArray).onConflictDoNothing();
        console.log("✅ Admins imported");
      }
    }

    // Import messages
    const messagesFile = path.join(dataDir, "messages.json");
    if (fs.existsSync(messagesFile)) {
      const messageData = JSON.parse(fs.readFileSync(messagesFile, "utf-8"));
      const dataArray = Array.isArray(messageData) ? messageData : [messageData];
      if (dataArray.length > 0) {
        console.log(`📥 Importing ${dataArray.length} messages...`);
        await db.insert(messages).values(dataArray).onConflictDoNothing();
        console.log("✅ Messages imported");
      }
    }

    // Import replies
    const repliesFile = path.join(dataDir, "replies.json");
    if (fs.existsSync(repliesFile)) {
      const replyData = JSON.parse(fs.readFileSync(repliesFile, "utf-8"));
      const dataArray = Array.isArray(replyData) ? replyData : [replyData];
      if (dataArray.length > 0) {
        console.log(`📥 Importing ${dataArray.length} replies...`);
        await db.insert(replies).values(dataArray).onConflictDoNothing();
        console.log("✅ Replies imported");
      }
    }

    console.log("\n✨ Data import complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

importData();
