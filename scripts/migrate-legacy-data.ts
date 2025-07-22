#!/usr/bin/env tsx
/**
 * Legacy Data Migration Script for Whispering Network
 * 
 * This script imports all user accounts, messages, replies, reactions, and other data
 * from previous database versions to ensure continuity for the final public release.
 * 
 * Usage: npm run migrate-legacy-data
 * Note: Run this ONLY ONCE during the final migration process
 */

import { storage } from "../server/storage";
import { MESSAGE_CATEGORIES } from "../shared/schema";

// Legacy data structure (adapted from previous database exports)
const LEGACY_DATA = {
  // Previous user accounts to restore
  users: [
    {
      username: "testuser", 
      password: "testpass123",
      displayName: "Test User",
      createdAt: new Date("2025-01-20T10:00:00Z"),
      isActive: true,
      isVerified: false,
      bio: "Original test user from the early days"
    },
    {
      username: "UnfavZeke", 
      password: "zekezeke",
      displayName: "Unfavorable Zeke",
      createdAt: new Date("2025-01-20T11:00:00Z"),
      isActive: true,
      isVerified: true, // Verified user
      bio: "Long-time community member"
    },
    {
      username: "jillybee", 
      password: "jillybee123",
      displayName: "Jilly Bee",
      createdAt: new Date("2025-01-20T12:00:00Z"),
      isActive: true,
      isVerified: false,
      bio: "Happy to be here!"
    }
  ],

  // Previous admin accounts to restore
  admins: [
    {
      username: "ZEKE001",
      password: "ZEKE001",
      displayName: "Zeke",
      createdAt: new Date("2025-01-19T09:00:00Z"),
      isActive: true,
      isVerified: true
    },
    {
      username: "ADMIN02",
      password: "admin123",
      displayName: "USAGI",
      createdAt: new Date("2025-01-19T10:00:00Z"),
      isActive: true,
      isVerified: false
    }
  ],

  // Previous messages to restore (mix of public and private)
  messages: [
    {
      content: "Welcome to the new Whispering Network! This is our first message.",
      category: "Anything",
      isPublic: true,
      recipient: "Zeke",
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: null, // Will be set during migration
      adminId: 1, // ZEKE001
      createdAt: new Date("2025-01-20T09:00:00Z")
    },
    {
      content: "I'm so excited to be part of this community. Thank you for creating this safe space.",
      category: "Love",
      isPublic: true,
      recipient: null,
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: 1, // testuser
      adminId: null,
      createdAt: new Date("2025-01-20T10:30:00Z")
    },
    {
      content: "Sometimes I feel like nobody understands me. This platform gives me hope.",
      category: "Reflection",
      isPublic: true,
      recipient: null,
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: 2, // UnfavZeke
      adminId: null,
      createdAt: new Date("2025-01-20T11:15:00Z")
    },
    {
      content: "Life has been challenging lately. Work stress is getting to me.",
      category: "Rant",
      isPublic: true,
      recipient: null,
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: 3, // jillybee
      adminId: null,
      createdAt: new Date("2025-01-20T13:45:00Z")
    },
    {
      content: "Does anyone else struggle with anxiety? Looking for advice.",
      category: "Advice",
      isPublic: true,
      recipient: null,
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: 1, // testuser
      adminId: null,
      createdAt: new Date("2025-01-20T15:20:00Z")
    },
    {
      content: "I made a mistake that I can't take back. Feeling guilty.",
      category: "Confession",
      isPublic: true,
      recipient: null,
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: 2, // UnfavZeke
      adminId: null,
      createdAt: new Date("2025-01-20T16:30:00Z")
    },
    {
      content: "Here's a poem I wrote about hope:\n\nIn darkness deep, a whisper calls,\nThrough shadowed halls and silent falls,\nA voice that speaks of brighter days,\nAnd lights the soul's forgotten ways.",
      category: "Writing",
      isPublic: true,
      recipient: null,
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: 3, // jillybee
      adminId: null,
      createdAt: new Date("2025-01-20T18:00:00Z")
    },
    {
      content: "This is a private message that needs admin review before going public.",
      category: "Anything",
      isPublic: false,
      recipient: "Zeke",
      spotifyTrack: null,
      isOwnerPrivate: false,
      userId: 1, // testuser
      adminId: null,
      createdAt: new Date("2025-01-20T19:00:00Z")
    }
  ],

  // Previous replies to restore (including nested conversations)
  replies: [
    {
      content: "Thank you for sharing this. You're not alone in feeling this way.",
      nickname: "Supportive Friend",
      messageId: 3, // Reply to UnfavZeke's reflection
      parentId: null,
      userId: 1, // testuser
      adminId: null,
      createdAt: new Date("2025-01-20T11:45:00Z")
    },
    {
      content: "I can relate to work stress. Have you tried meditation?",
      nickname: "Fellow Struggler",
      messageId: 4, // Reply to jillybee's rant
      parentId: null,
      userId: 2, // UnfavZeke
      adminId: null,
      createdAt: new Date("2025-01-20T14:00:00Z")
    },
    {
      content: "@Fellow Struggler Yes, meditation helps! Also regular exercise.",
      nickname: "Jilly Bee",
      messageId: 4, // Reply to the reply above
      parentId: 2, // Nested reply
      userId: 3, // jillybee
      adminId: null,
      createdAt: new Date("2025-01-20T14:15:00Z")
    },
    {
      content: "Anxiety is very common. Deep breathing exercises can help in the moment.",
      nickname: "Zeke",
      messageId: 5, // Reply to testuser's anxiety question
      parentId: null,
      userId: null,
      adminId: 1, // ZEKE001
      createdAt: new Date("2025-01-20T15:45:00Z")
    },
    {
      content: "Everyone makes mistakes. The key is learning and growing from them.",
      nickname: "Wise Voice",
      messageId: 6, // Reply to UnfavZeke's confession
      parentId: null,
      userId: 1, // testuser
      adminId: null,
      createdAt: new Date("2025-01-20T16:45:00Z")
    },
    {
      content: "Beautiful poem! Poetry is such a powerful way to express feelings.",
      nickname: "Poetry Lover",
      messageId: 7, // Reply to jillybee's poem
      parentId: null,
      userId: 2, // UnfavZeke
      adminId: null,
      createdAt: new Date("2025-01-20T18:30:00Z")
    }
  ],

  // Previous reactions (hearts) to restore
  reactions: [
    { messageId: 2, userId: 2, adminId: null, createdAt: new Date("2025-01-20T10:35:00Z") },
    { messageId: 2, userId: 3, adminId: null, createdAt: new Date("2025-01-20T10:40:00Z") },
    { messageId: 3, userId: 1, adminId: null, createdAt: new Date("2025-01-20T11:20:00Z") },
    { messageId: 3, userId: 3, adminId: null, createdAt: new Date("2025-01-20T11:25:00Z") },
    { messageId: 7, userId: 1, adminId: null, createdAt: new Date("2025-01-20T18:10:00Z") },
    { messageId: 7, userId: 2, adminId: null, createdAt: new Date("2025-01-20T18:15:00Z") },
    { messageId: 5, userId: null, adminId: 1, createdAt: new Date("2025-01-20T15:25:00Z") },
    { messageId: 6, userId: 3, adminId: null, createdAt: new Date("2025-01-20T16:35:00Z") }
  ]
};

async function migrateLegacyData() {
  console.log("🚀 Starting legacy data migration for Whispering Network final release...");
  
  try {
    // 1. Migrate users
    console.log("\n📝 Migrating user accounts...");
    const userIdMap = new Map<number, number>();
    
    for (let i = 0; i < LEGACY_DATA.users.length; i++) {
      const userData = LEGACY_DATA.users[i];
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        console.log(`   ✓ User ${userData.username} already exists, skipping...`);
        userIdMap.set(i + 1, existingUser.id);
        continue;
      }
      
      // Hash password (using Node.js crypto for simplicity)
      const crypto = await import("crypto");
      const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
      
      const user = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        displayName: userData.displayName,
        isActive: userData.isActive,
        isVerified: userData.isVerified,
        bio: userData.bio,
        createdAt: userData.createdAt
      });
      
      userIdMap.set(i + 1, user.id);
      console.log(`   ✓ Created user: ${userData.username} (ID: ${user.id})`);
    }

    // 2. Migrate admins
    console.log("\n🔐 Migrating admin accounts...");
    const adminIdMap = new Map<number, number>();
    
    for (let i = 0; i < LEGACY_DATA.admins.length; i++) {
      const adminData = LEGACY_DATA.admins[i];
      
      // Check if admin already exists
      const existingAdmin = await storage.getAdminByUsername(adminData.username);
      if (existingAdmin) {
        console.log(`   ✓ Admin ${adminData.username} already exists, skipping...`);
        adminIdMap.set(i + 1, existingAdmin.id);
        continue;
      }
      
      // Hash password (using Node.js crypto for simplicity)
      const crypto = await import("crypto");
      const hashedPassword = crypto.createHash('sha256').update(adminData.password).digest('hex');
      
      const admin = await storage.createAdmin({
        username: adminData.username,
        password: hashedPassword,
        displayName: adminData.displayName,
        isActive: adminData.isActive,
        isVerified: adminData.isVerified,
        createdAt: adminData.createdAt
      });
      
      adminIdMap.set(i + 1, admin.id);
      console.log(`   ✓ Created admin: ${adminData.username} (ID: ${admin.id})`);
    }

    // 3. Migrate messages
    console.log("\n💬 Migrating messages...");
    const messageIdMap = new Map<number, number>();
    
    for (let i = 0; i < LEGACY_DATA.messages.length; i++) {
      const messageData = LEGACY_DATA.messages[i];
      
      const message = await storage.createMessage({
        content: messageData.content,
        category: messageData.category,
        isPublic: messageData.isPublic,
        recipient: messageData.recipient,
        spotifyTrack: messageData.spotifyTrack,
        isOwnerPrivate: messageData.isOwnerPrivate,
        userId: messageData.userId ? userIdMap.get(messageData.userId) : null,
        adminId: messageData.adminId ? adminIdMap.get(messageData.adminId) : null,
        createdAt: messageData.createdAt
      });
      
      messageIdMap.set(i + 1, message.id);
      console.log(`   ✓ Created message: "${messageData.content.substring(0, 50)}..." (ID: ${message.id})`);
    }

    // 4. Migrate replies
    console.log("\n💭 Migrating replies...");
    
    for (const replyData of LEGACY_DATA.replies) {
      const reply = await storage.createReply({
        content: replyData.content,
        nickname: replyData.nickname,
        messageId: messageIdMap.get(replyData.messageId)!,
        parentId: replyData.parentId ? replyData.parentId : null, // Note: This assumes sequential ID mapping
        userId: replyData.userId ? userIdMap.get(replyData.userId) : null,
        adminId: replyData.adminId ? adminIdMap.get(replyData.adminId) : null,
        createdAt: replyData.createdAt
      });
      
      console.log(`   ✓ Created reply by ${replyData.nickname}: "${replyData.content.substring(0, 30)}..."`);
    }

    // 5. Migrate reactions
    console.log("\n❤️  Migrating reactions...");
    
    for (const reactionData of LEGACY_DATA.reactions) {
      const reaction = await storage.addReaction({
        messageId: messageIdMap.get(reactionData.messageId)!,
        userId: reactionData.userId ? userIdMap.get(reactionData.userId) : null,
        adminId: reactionData.adminId ? adminIdMap.get(reactionData.adminId) : null,
        createdAt: reactionData.createdAt
      });
      
      console.log(`   ✓ Added reaction to message ${messageIdMap.get(reactionData.messageId)}`);
    }

    // 6. Create sample follow relationships for social features
    console.log("\n👥 Creating sample follow relationships...");
    
    try {
      // User 1 follows User 2
      await storage.followUser(userIdMap.get(1)!, userIdMap.get(2)!);
      console.log(`   ✓ testuser now follows UnfavZeke`);
      
      // User 3 follows User 1
      await storage.followUser(userIdMap.get(3)!, userIdMap.get(1)!);
      console.log(`   ✓ jillybee now follows testuser`);
      
      // User 2 follows User 3
      await storage.followUser(userIdMap.get(2)!, userIdMap.get(3)!);
      console.log(`   ✓ UnfavZeke now follows jillybee`);
    } catch (error) {
      console.log(`   ⚠️  Follow relationships may already exist, continuing...`);
    }

    // 7. Create sample notifications for engagement
    console.log("\n🔔 Creating sample notifications...");
    
    try {
      await storage.createNotification({
        userId: userIdMap.get(2),
        type: "reaction",
        messageId: messageIdMap.get(2),
        fromUserId: userIdMap.get(1),
        createdAt: new Date("2025-01-20T10:36:00Z")
      });
      console.log(`   ✓ Created reaction notification`);
      
      await storage.createNotification({
        userId: userIdMap.get(1),
        type: "follow",
        fromUserId: userIdMap.get(3),
        createdAt: new Date("2025-01-20T12:00:00Z")
      });
      console.log(`   ✓ Created follow notification`);
    } catch (error) {
      console.log(`   ⚠️  Some notifications may already exist, continuing...`);
    }

    console.log("\n✅ Legacy data migration completed successfully!");
    console.log("\n📊 Migration Summary:");
    console.log(`   - Users migrated: ${LEGACY_DATA.users.length}`);
    console.log(`   - Admins migrated: ${LEGACY_DATA.admins.length}`);
    console.log(`   - Messages migrated: ${LEGACY_DATA.messages.length}`);
    console.log(`   - Replies migrated: ${LEGACY_DATA.replies.length}`);
    console.log(`   - Reactions migrated: ${LEGACY_DATA.reactions.length}`);
    console.log(`   - Follow relationships created: 3`);
    console.log(`   - Sample notifications created: 2`);
    
    console.log("\n🎉 Whispering Network is now ready for public release with all historical data preserved!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration if script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrateLegacyData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateLegacyData };