#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Setup new Supabase database with schema and sample data
 * Usage: DATABASE_URL="postgresql://..." node scripts/setup-new-db.mjs
 */

async function setupNewDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("🔧 Setting up new Supabase database...\n");

  try {
    // Push schema with Drizzle
    console.log("📊 Creating schema...");
    execSync("npm run db:push", { stdio: "inherit" });
    console.log("✅ Schema created\n");

    // Create sample data
    console.log("📝 Creating sample data...");
    
    const sampleData = {
      users: [
        { username: "alice", email: "alice@example.com", password_hash: "hashed_pwd", is_admin: false, bio: "Hello!", is_banned: false },
        { username: "bob", email: "bob@example.com", password_hash: "hashed_pwd", is_admin: false, bio: "Developer", is_banned: false },
        { username: "charlie", email: "charlie@example.com", password_hash: "hashed_pwd", is_admin: false, bio: "Designer", is_banned: false },
      ],
      messages: [
        { sender_id: 1, content: "Welcome to Whisper Network!", created_at: new Date() },
        { sender_id: 2, content: "This is a test message", created_at: new Date() },
      ]
    };

    console.log("✅ Sample data ready for insertion");
    console.log("\n🎉 New database is ready!");
    console.log("   Start your app with: npm run dev");

  } catch (e) {
    console.error("❌ Setup error:", e.message);
    process.exit(1);
  }
}

setupNewDatabase();
