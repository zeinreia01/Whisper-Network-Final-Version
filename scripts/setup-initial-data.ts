import { config } from 'dotenv';
config({ override: true });

import { db } from '../server/db.js';
import { admins, honorableMentions } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function setupInitialData() {
  console.log('🔄 Setting up initial data for Whisper Network...');

  try {
    // Create or update main admin ZEKE001
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, "ZEKE001"))
      .limit(1);

    if (existingAdmin.length === 0) {
      console.log("🔧 Creating main admin ZEKE001...");
      const hashedPassword = await hashPassword("122209");
      await db.insert(admins).values({
        username: "ZEKE001",
        password: hashedPassword,
        displayName: "ZEKE001",
        role: "super_admin",
        isActive: true,
        isVerified: true,
      });
      console.log("✅ Main admin ZEKE001 created with password 122209");
    } else {
      console.log("ℹ️ Main admin ZEKE001 already exists");
      // Always update ZEKE001 password to ensure it works
      console.log("🔧 Updating ZEKE001 password...");
      const hashedPassword = await hashPassword("122209");
      await db
        .update(admins)
        .set({ password: hashedPassword })
        .where(eq(admins.username, "ZEKE001"));
      console.log("✅ ZEKE001 password set to 122209 (hashed)");
    }

    // Check if honorable mentions exist
    const existingMentions = await db.select().from(honorableMentions).limit(1);

    if (existingMentions.length === 0) {
      // Add some default honorable mentions
      await db.insert(honorableMentions).values([
        {
          name: 'The Anonymous Contributors',
          emoji: '💝',
          order: 1,
        },
        {
          name: 'Beta Testers',
          emoji: '🔧',
          order: 2,
        },
        {
          name: 'Community Supporters',
          emoji: '🤝',
          order: 3,
        },
        {
          name: 'Silent Messengers',
          emoji: '📝',
          order: 4,
        },
      ]);
      console.log('✅ Created initial honorable mentions');
    } else {
      console.log('ℹ️ Honorable mentions already exist');
    }

    console.log('🎉 Initial data setup complete!');
    console.log('');
    console.log('📊 Database Summary:');
    console.log('- Main admin account (ZEKE001) ready');
    console.log('- All database tables created and configured');
    console.log('- Honorable mentions initialized');
    console.log('- Ready for deployment to any PostgreSQL database');
    console.log('');
    console.log('🚀 To deploy to Render:');
    console.log('1. Create PostgreSQL database on Render');
    console.log('2. Set DATABASE_URL environment variable');
    console.log('3. Run: npm run db:push');
    console.log('4. Run: npx tsx scripts/setup-initial-data.ts');

  } catch (error) {
    console.error('❌ Error setting up initial data:', error);
    process.exit(1);
  }
}

setupInitialData();