import { 
  messages, replies, admins, users, reactions, notifications, follows, likedMessages, honorableMentions,
  type Message, type Reply, type Admin, type User, type Reaction, type Notification, 
  type Follow, type LikedMessage, type HonorableMention, type InsertMessage, type InsertReply, type InsertAdmin, 
  type InsertUser, type InsertReaction, type InsertNotification, type InsertFollow, 
  type InsertLikedMessage, type InsertHonorableMention, type MessageWithReplies, type UserProfile, 
  type NotificationWithDetails, type UpdateUserProfile, type ReplyWithUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, isNull, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: number, isActive: boolean): Promise<User>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getPublicMessages(): Promise<MessageWithReplies[]>;
  getPrivateMessages(): Promise<MessageWithReplies[]>;
  getMessagesByCategory(category: string): Promise<MessageWithReplies[]>;
  getMessagesByRecipient(recipient: string): Promise<MessageWithReplies[]>;
  getMessageById(id: number): Promise<MessageWithReplies | null>;
  searchPublicMessages(query: string): Promise<MessageWithReplies[]>;
  updateMessageVisibility(messageId: number, isPublic: boolean): Promise<Message>;
  deleteMessage(messageId: number): Promise<void>;

  // Reply operations
  createReply(reply: InsertReply): Promise<Reply>;
  getRepliesByMessageId(messageId: number): Promise<Reply[]>;
  getReplyById(id: number): Promise<Reply | null>;
  deleteReply(id: number): Promise<void>;

  // Admin operations
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(adminId: number): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  updateAdminStatus(adminId: number, isActive: boolean): Promise<Admin>;
  updateAdminProfile(adminId: number, updates: { displayName?: string; profilePicture?: string; bio?: string; lastDisplayNameChange?: Date }): Promise<Admin>;
  getAdminMessages(adminId: number): Promise<MessageWithReplies[]>;
  getAdminReplies(adminId: number): Promise<Reply[]>;
  searchAdmins(query: string): Promise<Admin[]>;

  // Recipients operations - now returns admin display names
  getRecipients(): Promise<string[]>;

  // User management operations
  deleteUser(userId: number): Promise<void>;
  getUserMessages(userId: number): Promise<MessageWithReplies[]>;
  searchUsers(query: string): Promise<User[]>;
  getUserProfile(userId: number): Promise<UserProfile | null>;

  // Reaction operations
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(messageId: number, userId?: number, adminId?: number): Promise<void>;
  getMessageReactions(messageId: number): Promise<Reaction[]>;
  getUserReaction(messageId: number, userId?: number, adminId?: number): Promise<Reaction | null>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<NotificationWithDetails[]>;
  getAdminNotifications(adminId: number): Promise<NotificationWithDetails[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId?: number, adminId?: number): Promise<void>;

  // Follow operations
  followUser(followerId: number, followingId: number): Promise<Follow>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  followAdmin(followerId: number, adminId: number): Promise<Follow>;
  unfollowAdmin(followerId: number, adminId: number): Promise<void>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  isFollowingAdmin(followerId: number, adminId: number): Promise<boolean>;
  getUserFollowers(userId: number): Promise<User[]>;
  getUserFollowing(userId: number): Promise<User[]>;
  getFollowStats(userId: number): Promise<{ followersCount: number; followingCount: number }>;

  // Liked messages operations (personal archive)
  likeMessage(userId: number, adminId: number | undefined, messageId: number): Promise<LikedMessage>;
  unlikeMessage(userId: number, adminId: number | undefined, messageId: number): Promise<void>;
  isMessageLiked(userId: number, adminId: number | undefined, messageId: number): Promise<boolean>;
  getUserLikedMessages(userId: number, adminId?: number): Promise<MessageWithReplies[]>;

  // User profile operations
  updateUserProfile(userId: number, updates: UpdateUserProfile): Promise<User>;
  canUpdateDisplayName(userId: number): Promise<boolean>;
  updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User>;
  updateAdminVerificationStatus(adminId: number, isVerified: boolean): Promise<Admin>;
  deleteUserAccount(userId: number): Promise<void>;
  deleteAdminAccount(adminId: number): Promise<void>;

  // Message privacy operations
  updateMessagePrivacy(messageId: number, userId: number, isOwnerPrivate: boolean): Promise<Message>;

  // Honorable mentions operations
  getHonorableMentions(): Promise<HonorableMention[]>;
  createHonorableMention(mention: InsertHonorableMention): Promise<HonorableMention>;
  updateHonorableMention(id: number, updates: { name: string; emoji?: string | null }): Promise<HonorableMention>;
  deleteHonorableMention(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return result;
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getPublicMessages(): Promise<MessageWithReplies[]> {
    try {
      const result = await db.query.messages.findMany({
        where: eq(messages.isPublic, true),
        orderBy: desc(messages.createdAt),
        with: {
          replies: {
            orderBy: desc(replies.createdAt),
            with: {
              user: true,
              admin: true,
              mentionedUser: true,
              mentionedAdmin: true,
              children: {
                with: {
                  user: true,
                  admin: true,
                  mentionedUser: true,
                  mentionedAdmin: true,
                },
                orderBy: asc(replies.createdAt),
              },
            },
          },
          user: true,
          admin: true,
        },
      });

    } catch (error) {
      console.error('Error loading public messages:', error);
      return [];
    }

    console.log(`Loaded ${result.length} public messages`); // Debug log

    // Build nested replies structure and add reaction counts
    const messagesWithReactions = await Promise.all(
      result.map(async (message) => {
        const messageReactions = await this.getMessageReactions(message.id);

        // Organize replies in nested structure
        const allReplies = message.replies;
        const rootReplies = allReplies.filter(reply => !reply.parentId);
        const childRepliesMap = new Map();

        // Group child replies by parent ID
        allReplies.forEach(reply => {
          if (reply.parentId) {
            if (!childRepliesMap.has(reply.parentId)) {
              childRepliesMap.set(reply.parentId, []);
            }
            childRepliesMap.get(reply.parentId).push(reply);
          }
        });

        // Attach children to their parents recursively
        const attachChildren = (reply: any): any => {
          const children = childRepliesMap.get(reply.id) || [];
          return {
            ...reply,
            children: children.map(attachChildren),
          };
        };

        const nestedReplies = rootReplies.map(attachChildren);

        return {
          ...message,
          replies: nestedReplies,
          reactionCount: messageReactions.length,
          reactions: messageReactions,
        };
      })
    );

    return messagesWithReactions;
  }

  async getPrivateMessages(): Promise<MessageWithReplies[]> {
    const result = await db.query.messages.findMany({
      where: eq(messages.isPublic, false),
      orderBy: desc(messages.createdAt),
      with: {
        replies: {
          orderBy: asc(replies.createdAt),
          with: {
            user: true,
          },
        },
        user: true,
      },
    });

    // Add reaction counts to messages
    const messagesWithReactions = await Promise.all(
      result.map(async (message) => {
        const messageReactions = await this.getMessageReactions(message.id);
        return {
          ...message,
          reactionCount: messageReactions.length,
          reactions: messageReactions,
        };
      })
    );

    return messagesWithReactions;
  }

  async getMessagesByCategory(category: string): Promise<MessageWithReplies[]> {
    const result = await db.query.messages.findMany({
      where: eq(messages.category, category),
      orderBy: desc(messages.createdAt),
      with: {
        replies: {
          orderBy: asc(replies.createdAt),
          with: {
            user: true,
          },
        },
        user: true,
      },
    });

    // Add reaction counts to messages
    const messagesWithReactions = await Promise.all(
      result.map(async (message) => {
        const messageReactions = await this.getMessageReactions(message.id);
        return {
          ...message,
          reactionCount: messageReactions.length,
          reactions: messageReactions,
        };
      })
    );

    return messagesWithReactions;
  }

  async createReply(reply: InsertReply): Promise<Reply> {
    try {
      // Validate that the message exists
      const message = await this.getMessageById(reply.messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // If there's a parentId, validate that the parent reply exists
      if (reply.parentId) {
        const parentReply = await this.getReplyById(reply.parentId);
        if (!parentReply) {
          throw new Error("Parent reply not found");
        }
      }

      const [newReply] = await db.insert(replies).values(reply).returning();
      return newReply;
    } catch (error) {
      console.error("Error creating reply:", error);
      throw error;
    }
  }

  async getRepliesByMessageId(messageId: number): Promise<Reply[]> {
    const result = await db
      .select()
      .from(replies)
      .where(eq(replies.messageId, messageId))
      .orderBy(asc(replies.createdAt));
    return result;
  }

  async getReplyById(id: number): Promise<Reply | null> {
    const [result] = await db
      .select()
      .from(replies)
      .where(eq(replies.id, id))
      .limit(1);
    return result || null;
  }

  async deleteReply(id: number): Promise<void> {
    await db
      .delete(replies)
      .where(eq(replies.id, id));
  }

  async getMessageById(id: number): Promise<MessageWithReplies | null> {
    const result = await db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: {
        replies: {
          orderBy: asc(replies.createdAt),
          with: {
            user: true,
            admin: true,
            mentionedUser: true,
            mentionedAdmin: true,
            children: {
              with: {
                user: true,
                admin: true,
                mentionedUser: true,
                mentionedAdmin: true,
              },
              orderBy: asc(replies.createdAt),
            },
          },
        },
        user: true,
        admin: true,
      },
    });

    if (!result) return null;

    // Build nested replies structure
    const allReplies = result.replies;
    const rootReplies = allReplies.filter(reply => !reply.parentId);
    const childRepliesMap = new Map();

    // Group child replies by parent ID
    allReplies.forEach(reply => {
      if (reply.parentId) {
        if (!childRepliesMap.has(reply.parentId)) {
          childRepliesMap.set(reply.parentId, []);
        }
        childRepliesMap.get(reply.parentId).push(reply);
      }
    });

    // Attach children to their parents recursively
    const attachChildren = (reply: any): any => {
      const children = childRepliesMap.get(reply.id) || [];
      return {
        ...reply,
        children: children.map(attachChildren),
      };
    };

    const nestedReplies = rootReplies.map(attachChildren);

    // Add reaction data
    const messageReactions = await this.getMessageReactions(result.id);
    return {
      ...result,
      replies: nestedReplies,
      reactionCount: messageReactions.length,
      reactions: messageReactions,
    };
  }

  async getMessagesByRecipient(recipient: string): Promise<MessageWithReplies[]> {
    const result = await db.query.messages.findMany({
      where: eq(messages.recipient, recipient),
      orderBy: desc(messages.createdAt),
      with: {
        replies: {
          orderBy: desc(replies.createdAt),
          with: {
            user: true,
          },
        },
        user: true,
      },
    });

    // Add reaction counts to messages
    const messagesWithReactions = await Promise.all(
      result.map(async (message) => {
        const messageReactions = await this.getMessageReactions(message.id);
        return {
          ...message,
          reactionCount: messageReactions.length,
          reactions: messageReactions,
        };
      })
    );

    return messagesWithReactions;
  }

  async searchPublicMessages(query: string): Promise<MessageWithReplies[]> {
    if (!query.trim()) {
      return this.getPublicMessages();
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    let result;

    try {
      result = await db.query.messages.findMany({
        where: and(
          eq(messages.isPublic, true),
          or(
            ilike(messages.content, searchTerm),
            ilike(messages.category, searchTerm),
            ilike(messages.senderName || '', searchTerm)
          )
        ),
        orderBy: desc(messages.createdAt),
        with: {
          replies: {
            orderBy: desc(replies.createdAt),
            with: {
              user: true,
            },
          },
          user: true,
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple content search if complex query fails
      result = await db.query.messages.findMany({
        where: and(
          eq(messages.isPublic, true),
          ilike(messages.content, searchTerm)
        ),
        orderBy: desc(messages.createdAt),
        with: {
          replies: {
            orderBy: desc(replies.createdAt),
            with: {
              user: true,
            },
          },
          user: true,
        },
      });
    }

    // Add reaction counts to messages
    const messagesWithReactions = await Promise.all(
      result.map(async (message) => {
        const messageReactions = await this.getMessageReactions(message.id);
        return {
          ...message,
          reactionCount: messageReactions.length,
          reactions: messageReactions,
        };
      })
    );

    return messagesWithReactions;
  }

  async updateMessageVisibility(messageId: number, isPublic: boolean): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ isPublic })
      .where(eq(messages.id, messageId))
      .returning();
    return message;
  }

  async deleteMessage(messageId: number): Promise<void> {
    // Delete in proper order to avoid foreign key constraints
    // 1. Delete all reactions for this message
    await db.delete(reactions).where(eq(reactions.messageId, messageId));

    // 2. Delete all replies to the message
    await db.delete(replies).where(eq(replies.messageId, messageId));

    // 3. Finally delete the message itself
    await db.delete(messages).where(eq(messages.id, messageId));
  }

  // Admin operations
  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values(adminData)
      .returning();
    return admin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username))
      .limit(1);
    return admin;
  }

  async getAdminById(adminId: number): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);
    return admin;
  }

  async getAllAdmins(): Promise<Admin[]> {
    const result = await db
      .select()
      .from(admins)
      .orderBy(desc(admins.createdAt));
    return result;
  }

  async updateAdminStatus(adminId: number, isActive: boolean): Promise<Admin> {
    const [admin] = await db
      .update(admins)
      .set({ isActive })
      .where(eq(admins.id, adminId))
      .returning();
    return admin;
  }

  async updateAdminProfile(adminId: number, updates: { displayName?: string; profilePicture?: string; bio?: string; backgroundPhoto?: string; lastDisplayNameChange?: Date }): Promise<Admin> {
    const updateData: any = {};

    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.profilePicture !== undefined) updateData.profilePicture = updates.profilePicture;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.backgroundPhoto !== undefined) updateData.backgroundPhoto = updates.backgroundPhoto;
    if (updates.lastDisplayNameChange !== undefined) updateData.lastDisplayNameChange = updates.lastDisplayNameChange;

    const [updatedAdmin] = await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.id, adminId))
      .returning();

    if (!updatedAdmin) {
      throw new Error("Admin not found");
    }

    return updatedAdmin;
  }

  async getAdminMessages(adminId: number): Promise<MessageWithReplies[]> {
    const adminMessages = await db.query.messages.findMany({
      where: eq(messages.adminId, adminId),
      orderBy: desc(messages.createdAt),
      with: {
        replies: {
          orderBy: asc(replies.createdAt),
          with: {
            user: true,
            admin: true,
          },
        },
        user: true,
        admin: true,
      },
    });

    // Add reaction counts to messages
    const messagesWithReactions = await Promise.all(
      adminMessages.map(async (message) => {
        const messageReactions = await this.getMessageReactions(message.id);
        return {
          ...message,
          reactionCount: messageReactions.length,
          reactions: messageReactions,
        };
      })
    );

    return adminMessages;
  }

  async getAdminReplies(adminId: number): Promise<Reply[]> {
    return await db
      .select()
      .from(replies)
      .where(eq(replies.adminId, adminId))
      .orderBy(asc(replies.createdAt));
  }

  async getUserReplies(userId: number): Promise<Reply[]> {
    const result = await db
      .select()
      .from(replies)
      .where(eq(replies.userId, userId))
      .orderBy(asc(replies.createdAt));
    return result;
  }

  async getRecipients(): Promise<string[]> {
    // Return active admin display names as recipients
    const activeAdmins = await db
      .select({ displayName: admins.displayName })
      .from(admins)
      .where(eq(admins.isActive, true));

    if (activeAdmins.length === 0) {
      // Fallback to default recipients if no admins exist
      return ["Admin", "Moderator", "Support", "Community Manager"];
    }

    return activeAdmins.map(admin => admin.displayName);
  }

  // User management operations
  async deleteUser(userId: number): Promise<void> {
    // Delete in proper order to avoid foreign key constraints
    // 1. Delete notifications referencing this user's replies first
    const userReplies = await db.select({ id: replies.id }).from(replies).where(eq(replies.userId, userId));
    for (const reply of userReplies) {
      await db.delete(notifications).where(eq(notifications.replyId, reply.id));
    }

    // 2. Delete notifications referencing this user's messages  
    const userMessages = await db.select({ id: messages.id }).from(messages).where(eq(messages.userId, userId));
    for (const message of userMessages) {
      await db.delete(notifications).where(eq(notifications.messageId, message.id));
    }

    // 3. Delete other notifications
    await db.delete(notifications).where(or(
      eq(notifications.userId, userId),
      eq(notifications.fromUserId, userId)
    ));

    // 4. Delete follows
    await db.delete(follows).where(or(
      eq(follows.followerId, userId),
      eq(follows.followingId, userId)
    ));

    // 5. Delete liked messages
    await db.delete(likedMessages).where(eq(likedMessages.userId, userId));

    // 6. Delete reactions on this user's messages first
    for (const message of userMessages) {
      await db.delete(reactions).where(eq(reactions.messageId, message.id));
    }

    // 7. Delete reactions by this user
    await db.delete(reactions).where(eq(reactions.userId, userId));

    // 8. Delete all replies by the user
    await db.delete(replies).where(eq(replies.userId, userId));

    // 9. Delete all messages by the user
    await db.delete(messages).where(eq(messages.userId, userId));

    // 10. Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async getUserMessages(userId: number): Promise<MessageWithReplies[]> {
    const result = await db.query.messages.findMany({
      where: eq(messages.userId, userId),
      orderBy: desc(messages.createdAt),
      with: {
        replies: {
          orderBy: desc(replies.createdAt),
          with: {
            user: true,
          },
        },
        user: true,
      },
    });
    return result;
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) {
      return this.getAllUsers();
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const result = await db
      .select()
      .from(users)
      .where(ilike(users.username, searchTerm))
      .orderBy(desc(users.createdAt));
    return result;
  }

  async searchAdmins(searchTerm: string): Promise<Admin[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    const result = await db
      .select()
      .from(admins)
      .where(
        or(
          ilike(admins.username, `%${searchTerm}%`),
          ilike(admins.displayName, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(admins.createdAt));
    return result;
  }

  async getUserProfile(userId: number, currentUserId?: number): Promise<UserProfile | null> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      const userMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.userId, userId));

      const userReplies = await db
        .select()
        .from(replies)
        .where(eq(replies.userId, userId));

      // Count reactions on all user messages
      let totalReactions = 0;
      try {
        for (const message of userMessages) {
          const messageReactions = await db
            .select()
            .from(reactions)
            .where(eq(reactions.messageId, message.id));
          totalReactions += messageReactions.length;
        }
      } catch (error) {
        // Skip if reactions table doesn't exist yet
        totalReactions = 0;
      }

      // Get follow stats
      let followersCount = 0;
      let followingCount = 0;
      try {
        const stats = await this.getFollowStats(userId);
        followersCount = stats.followersCount;
        followingCount = stats.followingCount;
      } catch (error) {
        // Skip if follows table doesn't exist yet
      }

      // Check if current user is following this user
      let isFollowing = false;
      try {
        if (currentUserId && currentUserId !== userId) {
          isFollowing = await this.isFollowing(currentUserId, userId);
        }
      } catch (error) {
        // Skip if follows table doesn't exist yet
        isFollowing = false;
      }

      return {
        ...user,
        messageCount: userMessages.length,
        replyCount: userReplies.length,
        totalReactions,
        followersCount,
        followingCount,
        isFollowing,
      };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  }

  // Reaction operations
  async addReaction(reactionData: InsertReaction): Promise<Reaction> {
    const [reaction] = await db
      .insert(reactions)
      .values(reactionData)
      .returning();
    return reaction;
  }

  async removeReaction(messageId: number, userId?: number, adminId?: number): Promise<void> {
    const conditions = [eq(reactions.messageId, messageId)];

    if (userId) {
      conditions.push(eq(reactions.userId, userId));
    }

    if (adminId) {
      conditions.push(eq(reactions.adminId, adminId));
    }

    await db
      .delete(reactions)
      .where(and(...conditions));
  }

  async getMessageReactions(messageId: number): Promise<Reaction[]> {
    try {
      const result = await db
        .select()
        .from(reactions)
        .where(eq(reactions.messageId, messageId));
      return result;
    } catch (error) {
      // Return empty array if table doesn't exist yet
      return [];
    }
  }

  async getUserReaction(messageId: number, userId?: number, adminId?: number): Promise<Reaction | null> {
    const conditions = [eq(reactions.messageId, messageId)];

    if (userId) {
      conditions.push(eq(reactions.userId, userId));
    }

    if (adminId) {
      conditions.push(eq(reactions.adminId, adminId));
    }

    const [reaction] = await db
      .select()
      .from(reactions)
      .where(and(...conditions))
      .limit(1);

    return reaction || null;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: number): Promise<NotificationWithDetails[]> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
      return result as NotificationWithDetails[];
    } catch (error) {
      // Return empty array if table doesn't exist yet
      return [];
    }
  }

  async getAdminNotifications(adminId: number): Promise<NotificationWithDetails[]> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.adminId, adminId))
        .orderBy(desc(notifications.createdAt));
      return result as NotificationWithDetails[];
    } catch (error) {
      // Return empty array if table doesn't exist yet
      return [];
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId?: number, adminId?: number): Promise<void> {
    if (userId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } else if (adminId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.adminId, adminId));
    } else {
      return; // Must provide either userId or adminId
    }
  }

  async followUser(followerId: number, followingId: number): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    try {
      const follow = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        )
        .limit(1);

      return follow.length > 0;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  }

  async getUserFollowers(userId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        backgroundPhoto: users.backgroundPhoto,
        bio: users.bio,
        lastDisplayNameChange: users.lastDisplayNameChange,
        isVerified: users.isVerified,
        likedMessagesPrivacy: users.likedMessagesPrivacy,
        createdAt: users.createdAt,
        isActive: users.isActive,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result;
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        backgroundPhoto: users.backgroundPhoto,
        bio: users.bio,
        lastDisplayNameChange: users.lastDisplayNameChange,
        isVerified: users.isVerified,
        likedMessagesPrivacy: users.likedMessagesPrivacy,
        createdAt: users.createdAt,
        isActive: users.isActive,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result;
  }

  async getFollowStats(userId: number): Promise<{ followersCount: number; followingCount: number }> {
    const [followersResult] = await db
      .select({ count: follows.id })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingResult] = await db
      .select({ count: follows.id })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return {
      followersCount: followersResult?.count || 0,
      followingCount: followingResult?.count || 0,
    };
  }

  // Liked messages operations (personal archive)
async likeMessage(userId: number, adminId: number | undefined, messageId: number): Promise<LikedMessage> {
    const [liked] = await db
      .insert(likedMessages)
      .values({
        userId: userId || null,
        adminId: adminId || null,
        messageId,
      })
      .returning();
    return liked;
  }

  async unlikeMessage(userId: number, adminId: number | undefined, messageId: number): Promise<void> {
    const conditions = [eq(likedMessages.messageId, messageId)];

    if (userId) {
      conditions.push(eq(likedMessages.userId, userId));
    }

    if (adminId) {
      conditions.push(eq(likedMessages.adminId, adminId));
    }

    await db
      .delete(likedMessages)
      .where(and(...conditions));
  }

  async isMessageLiked(userId: number, adminId: number | undefined, messageId: number): Promise<boolean> {
    const conditions = [eq(likedMessages.messageId, messageId)];

    if (userId) {
      conditions.push(eq(likedMessages.userId, userId));
    }

    if (adminId) {
      conditions.push(eq(likedMessages.adminId, adminId));
    }

    const [liked] = await db
      .select()
      .from(likedMessages)
      .where(and(...conditions))
      .limit(1);

    return !!liked;
  }

  async getUserLikedMessages(userId: number, adminId?: number): Promise<MessageWithReplies[]> {
    const conditions = [];

    if (userId) {
      conditions.push(eq(likedMessages.userId, userId));
    }

    if (adminId) {
      conditions.push(eq(likedMessages.adminId, adminId));
    }

    const likedMessageIds = await db
      .select({ messageId: likedMessages.messageId })
      .from(likedMessages)
      .where(and(...conditions))
      .orderBy(desc(likedMessages.createdAt));

    if (likedMessageIds.length === 0) {
      return [];
    }

    const messageIds = likedMessageIds.map(row => row.messageId);

    const result = await db.query.messages.findMany({
      where: or(...messageIds.map(id => eq(messages.id, id))),
      orderBy: desc(messages.createdAt),
      with: {
        replies: {
          orderBy: desc(replies.createdAt),
          with: {
            user: true,
          },
        },
        user: true,
      },
    });

    // Add reaction counts to messages
    const messagesWithReactions = await Promise.all(
      result.map(async (message) => {
        const messageReactions = await this.getMessageReactions(message.id);
        return {
          ...message,
          reactionCount: messageReactions.length,
          reactions: messageReactions,
        };
      })
    );

    return messagesWithReactions;
  }

  // User profile operations
  async updateUserProfile(userId: number, updates: UpdateUserProfile): Promise<User> {
    const updateData: any = {};

    if (updates.displayName !== undefined) {
      updateData.displayName = updates.displayName;
      updateData.lastDisplayNameChange = new Date();
    }

    if (updates.profilePicture !== undefined) {
      updateData.profilePicture = updates.profilePicture;
    }

    if (updates.backgroundPhoto !== undefined) {
      updateData.backgroundPhoto = updates.backgroundPhoto;
    }

    if (updates.bio !== undefined) {
      updateData.bio = updates.bio;
    }

    // If no valid updates, return current user
    if (Object.keys(updateData).length === 0) {
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return currentUser;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async canUpdateDisplayName(userId: number): Promise<boolean> {
    const user = await this.getUserById(userId);

    if (!user || !user.lastDisplayNameChange) {
      return true; // First time or no previous change
    }

    const daysSinceLastChange = (Date.now() - new Date(user.lastDisplayNameChange).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastChange >= 30;
  }

  async updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isVerified })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateAdminVerificationStatus(adminId: number, isVerified: boolean): Promise<Admin> {
    const [admin] = await db
      .update(admins)
      .set({ isVerified })
      .where(eq(admins.id, adminId))
      .returning();
    return admin;
  }

  async followAdmin(followerId: number, adminId: number): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({
        followerId,
        followingAdminId: adminId,
      })
      .returning();
    return follow;
  }

  async unfollowAdmin(followerId: number, adminId: number): Promise<void> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingAdminId, adminId)
        )
      );
  }

  async isFollowingAdmin(followerId: number, adminId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingAdminId, adminId)
        )
      )
      .limit(1);
    return !!result;
  }

  // Message privacy operations
  async updateMessagePrivacy(messageId: number, userId: number, isOwnerPrivate: boolean): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ isOwnerPrivate })
      .where(and(
        eq(messages.id, messageId),
        eq(messages.userId, userId) // Only owner can update privacy
      ))
      .returning();
    return message;
  }

  // Account deletion operations (ADMIN ONLY - CRITICAL)
  async deleteUserAccount(userId: number): Promise<void> {
    // Delete all related data in correct order to maintain referential integrity
    // 1. Delete notifications
    await db.delete(notifications).where(or(
      eq(notifications.userId, userId),
      eq(notifications.fromUserId, userId)
    ));

    // 2. Delete follows
    await db.delete(follows).where(or(
      eq(follows.followerId, userId),
      eq(follows.followingId, userId)
    ));

    // 3. Delete liked messages
    await db.delete(likedMessages).where(eq(likedMessages.userId, userId));

    // 4. Delete reactions
    await db.delete(reactions).where(eq(reactions.userId, userId));

    // 5. Delete replies (including nested ones)
    await db.delete(replies).where(eq(replies.userId, userId));

    // 6. Delete messages
    await db.delete(messages).where(eq(messages.userId, userId));

    // 7. Finally delete user account
    await db.delete(users).where(eq(users.id, userId));
  }

  async deleteAdminAccount(adminId: number): Promise<void> {
    // Delete all related data in correct order
    // 1. Delete notifications
    await db.delete(notifications).where(or(
      eq(notifications.adminId, adminId),
      eq(notifications.fromAdminId, adminId)
    ));

    // 2. Delete liked messages
    await db.delete(likedMessages).where(eq(likedMessages.adminId, adminId));

    // 3. Delete reactions
    await db.delete(reactions).where(eq(reactions.adminId, adminId));

    // 4. Delete replies
    await db.delete(replies).where(eq(replies.adminId, adminId));

    // 5. Delete messages
    await db.delete(messages).where(eq(messages.adminId, adminId));

    // 6. Finally delete admin account
    await db.delete(admins).where(eq(admins.id, adminId));
  }


  // Honorable mentions operations
  async getHonorableMentions(): Promise<HonorableMention[]> {
    return await db
      .select()
      .from(honorableMentions)
      .orderBy(asc(honorableMentions.order), asc(honorableMentions.createdAt));
  }

  async createHonorableMention(mentionData: InsertHonorableMention): Promise<HonorableMention> {
    const [mention] = await db
      .insert(honorableMentions)
      .values({
        ...mentionData,
        updatedAt: new Date(),
      })
      .returning();
    return mention;
  }

  async updateHonorableMention(id: number, updates: { name: string; emoji?: string | null }): Promise<HonorableMention> {
    const [mention] = await db
      .update(honorableMentions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(honorableMentions.id, id))
      .returning();
    return mention;
  }

  async deleteHonorableMention(id: number): Promise<void> {
    await db
      .delete(honorableMentions)
      .where(eq(honorableMentions.id, id));
  }
}

export const storage = new DatabaseStorage();