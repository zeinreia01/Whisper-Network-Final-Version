
import { config } from 'dotenv';
config({ override: true });

import { db } from '../server/db.js';
import { admins } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function resetIcxrusPassword() {
  console.log('🔄 Resetting password for icxrus_...');

  try {
    // Find the admin account
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, "icxrus_"))
      .limit(1);

    if (existingAdmin.length === 0) {
      console.log("❌ Admin icxrus_ not found");
      return;
    }

    console.log("🔧 Updating icxrus_ password to 122209...");
    const hashedPassword = await hashPassword("122209");
    
    await db
      .update(admins)
      .set({ password: hashedPassword })
      .where(eq(admins.username, "icxrus_"));
    
    console.log("✅ icxrus_ password successfully reset to 122209");
    console.log("🎉 icxrus_ can now login with password: 122209");

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetIcxrusPassword();
