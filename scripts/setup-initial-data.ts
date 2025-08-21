import { config } from 'dotenv';
config({ override: true });

import { db } from '../server/db.js';
import { admins, honorableMentions } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function setupInitialData() {
  console.log('🔄 Setting up initial data for Whisper Network...');

  try {
    // Check if ZEKE001 admin already exists
    const existingAdmin = await db.select().from(admins).where(eq(admins.username, 'ZEKE001')).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create main admin account (ZEKE001)
      await db.insert(admins).values({
        username: 'ZEKE001',
        password: '122209', // Special password for ZEKE001
        displayName: 'ZEKE001',
        profilePicture: null,
        backgroundPhoto: null,
        bio: 'Creator and main administrator of Whispering Network. Building a safe space for anonymous emotional expression.',
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
      console.log('✅ Created main admin account: ZEKE001');
    } else {
      console.log('ℹ️ Main admin ZEKE001 already exists');
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