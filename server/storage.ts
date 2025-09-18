import {
  messages, replies, admins, users, reactions, notifications, follows, likedMessages, honorableMentions, anonymousMessages,
  userMusicList, dashboardMessages, adminAnnouncements,
  type Message, type Reply, type Admin, type User, type Reaction, type Notification,
  type Follow, type LikedMessage, type HonorableMention, type AnonymousMessage, type InsertMessage, type InsertReply, type InsertAdmin,
  type InsertUser, type InsertReaction, type InsertNotification, type InsertFollow,
  type InsertLikedMessage, type InsertHonorableMention, type InsertAnonymousMessage, type MessageWithReplies, type UserProfile,
  type NotificationWithDetails, type UpdateUserProfile, type ReplyWithUser, type UserMusic, type InsertUserMusic,
  type DashboardMessage, type InsertDashboardMessage, type AdminAnnouncement, type InsertAdminAnnouncement
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, isNull, sql, ilike, isNotNull } from "drizzle-orm";

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
  deleteReplyWithChildren(replyId: number): Promise<void>;

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
  updateUserProfile(userId: number, updates: UpdateUserProfile): Promise<User>;

  // Password management operations
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  updateAdminPassword(adminId: number, hashedPassword: string): Promise<void>;
  getAllUsersWithPasswords(): Promise<User[]>;
  getAllAdminsWithPasswords(): Promise<Admin[]>;

  // Spotify integration operations
  updateUserSpotifyTrack(userId: number, spotifyData: {
    spotifyTrackId?: string | null;
    spotifyTrackName?: string | null;
    spotifyArtistName?: string | null;
    spotifyAlbumCover?: string | null;
  }): Promise<User>;
  updateAdminSpotifyTrack(adminId: number, spotifyData: {
    spotifyTrackId?: string | null;
    spotifyTrackName?: string | null;
    spotifyArtistName?: string | null;
    spotifyAlbumCover?: string | null;
  }): Promise<Admin>;

  // User music list operations
  addToMusicList(userId: number, adminId: number | undefined, spotifyData: {
    spotifyTrackId: string;
    spotifyTrackName: string;
    spotifyArtistName: string;
    spotifyAlbumCover?: string;
  }): Promise<UserMusic>;
  removeFromMusicList(musicId: number): Promise<void>;
  getUserMusicList(userId: number, adminId?: number): Promise<UserMusic[]>;
  setFavoriteTrack(musicId: number): Promise<UserMusic>;
  reorderMusicList(userId: number, adminId: number | undefined, musicIds: number[]): Promise<void>;

  // Dashboard message operations
  createDashboardMessage(message: InsertDashboardMessage): Promise<DashboardMessage>;
  getUserDashboardMessages(userId: number, adminId?: number): Promise<DashboardMessage[]>;
  deleteDashboardMessage(messageId: number): Promise<void>;
  pinDashboardMessage(messageId: number, isPinned: boolean): Promise<DashboardMessage>;

  // Admin announcement operations
  createAdminAnnouncement(announcement: InsertAdminAnnouncement): Promise<AdminAnnouncement>;
  getAllAdminAnnouncements(): Promise<AdminAnnouncement[]>;
  deleteAdminAnnouncement(announcementId: number): Promise<void>;
  pinAdminAnnouncement(announcementId: number, isPinned: boolean): Promise<AdminAnnouncement>;

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

  // Anonymous messages operations (NGL-style)
  sendAnonymousMessage(message: InsertAnonymousMessage): Promise<AnonymousMessage>;
  getAnonymousMessages(userId: number, adminId?: number): Promise<AnonymousMessage[]>;
  markAnonymousMessageAsRead(messageId: number): Promise<void>;
  deleteAnonymousMessage(messageId: number): Promise<void>;
  getAnonymousMessageCount(userId: number, adminId?: number): Promise<number>;

  // Leaderboard operations
  getLeaderboardData(): Promise<any>;
  getUserRanking(userId: number): Promise<any>;
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
      console.log('Loading public messages...');

      // Get all public messages, pinned messages first
      const messagesData = await db
        .select()
        .from(messages)
        .where(eq(messages.isPublic, true))
        .orderBy(desc(messages.isPinned), desc(messages.createdAt));

      const result: MessageWithReplies[] = [];

      for (const message of messagesData) {
        // Get user if exists
        let user = null;
        if (message.userId) {
          const userData = await db
            .select({
              id: users.id,
              username: users.username,
              displayName: users.displayName,
              profilePicture: users.profilePicture,
              isVerified: users.isVerified,
            })
            .from(users)
            .where(eq(users.id, message.userId))
            .limit(1);
          user = userData[0] || null;
          if (user) {
            console.log(`User ${user.username} profile picture:`, user.profilePicture?.substring(0, 50) + '...');
          }
        }

        // Get admin if exists
        let admin = null;
        if (message.adminId) {
          const adminData = await db
            .select({
              id: admins.id,
              displayName: admins.displayName,
              profilePicture: admins.profilePicture,
              isVerified: admins.isVerified,
            })
            .from(admins)
            .where(eq(admins.id, message.adminId))
            .limit(1);
          admin = adminData[0] || null;
          if (admin) {
            console.log(`Admin ${admin.displayName} profile picture:`, admin.profilePicture?.substring(0, 50) + '...');
          }
        }

        // Get replies for this message
        const repliesData = await db
          .select()
          .from(replies)
          .where(eq(replies.messageId, message.id))
          .orderBy(asc(replies.createdAt));

        // Get users and admins for replies
        const repliesWithUsers: ReplyWithUser[] = [];
        for (const reply of repliesData) {
          let replyUser = null;
          let replyAdmin = null;

          if (reply.userId) {
            const userData = await db
              .select()
              .from(users)
              .where(eq(users.id, reply.userId))
              .limit(1);
            replyUser = userData[0] || null;
          }

          if (reply.adminId) {
            const adminData = await db
              .select()
              .from(admins)
              .where(eq(admins.id, reply.adminId))
              .limit(1);
            replyAdmin = adminData[0] || null;
          }

          repliesWithUsers.push({
            ...reply,
            user: replyUser as any,
            admin: replyAdmin as any,
          });
        }

        // Get reactions
        const messageReactions = await this.getMessageReactions(message.id);

        result.push({
          ...message,
          user: user as any,
          admin: admin as any,
          replies: repliesWithUsers,
          reactions: messageReactions,
          reactionCount: messageReactions.length,
        });
      }

      console.log(`Loaded ${result.length} public messages`);
      return result;
    } catch (error) {
      console.error('Error loading public messages:', error);
      return [];
    }
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

  // Leaderboard functionality - REMOVED DUPLICATE
  async getLeaderboardDataOLD() {
    try {
      // Get message leaders
      const messageLeaders = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified,
          messageCount: sql<number>`count(${messages.id})`.as('messageCount'),
        })
        .from(users)
        .leftJoin(messages, eq(users.id, messages.userId))
        .where(eq(users.isActive, true))
        .groupBy(users.id)
        .orderBy(sql`count(${messages.id}) DESC`)
        .limit(100);

      // Get reply leaders
      const replyLeaders = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified,
          replyCount: sql<number>`count(${replies.id})`.as('replyCount'),
        })
        .from(users)
        .leftJoin(replies, eq(users.id, replies.userId))
        .where(eq(users.isActive, true))
        .groupBy(users.id)
        .orderBy(sql`count(${replies.id}) DESC`)
        .limit(100);

      // Get like leaders (users with most reactions)
      const likeLeaders = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified,
          likeCount: sql<number>`count(${reactions.id})`.as('likeCount'),
        })
        .from(users)
        .leftJoin(messages, eq(users.id, messages.userId))
        .leftJoin(reactions, eq(messages.id, reactions.messageId))
        .where(eq(users.isActive, true))
        .groupBy(users.id)
        .orderBy(sql`count(${reactions.id}) DESC`)
        .limit(100);

      // Get follower leaders
      const followerLeaders = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified,
          followerCount: sql<number>`count(${follows.id})`.as('followerCount'),
        })
        .from(users)
        .leftJoin(follows, eq(users.id, follows.followingId))
        .where(eq(users.isActive, true))
        .groupBy(users.id)
        .orderBy(sql`count(${follows.id}) DESC`)
        .limit(100);

      // Add rank to each user
      const addRanks = (leaders: any[]) => {
        return leaders.map((leader, index) => ({
          ...leader,
          rank: index + 1,
        }));
      };

      return {
        messageLeaders: addRanks(messageLeaders),
        replyLeaders: addRanks(replyLeaders),
        likeLeaders: addRanks(likeLeaders),
        followerLeaders: addRanks(followerLeaders),
      };
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      throw error;
    }
  }

  async getUserRanking(userId: number) {
    try {
      // Get user's message rank
      const messageRank = await db
        .select({ rank: sql<number>`ROW_NUMBER() OVER (ORDER BY COUNT(${messages.id}) DESC)`.as('rank') })
        .from(users)
        .leftJoin(messages, eq(users.id, messages.userId))
        .where(and(eq(users.isActive, true), eq(users.id, userId)))
        .groupBy(users.id);

      // Get user's reply rank
      const replyRank = await db
        .select({ rank: sql<number>`ROW_NUMBER() OVER (ORDER BY COUNT(${replies.id}) DESC)`.as('rank') })
        .from(users)
        .leftJoin(replies, eq(users.id, replies.userId))
        .where(and(eq(users.isActive, true), eq(users.id, userId)))
        .groupBy(users.id);

      // Get user's like rank
      const likeRank = await db
        .select({ rank: sql<number>`ROW_NUMBER() OVER (ORDER BY COUNT(${reactions.id}) DESC)`.as('rank') })
        .from(users)
        .leftJoin(messages, eq(users.id, messages.userId))
        .leftJoin(reactions, eq(messages.id, reactions.messageId))
        .where(and(eq(users.isActive, true), eq(users.id, userId)))
        .groupBy(users.id);

      // Get user's follower rank
      const followerRank = await db
        .select({ rank: sql<number>`ROW_NUMBER() OVER (ORDER BY COUNT(${follows.id}) DESC)`.as('rank') })
        .from(users)
        .leftJoin(follows, eq(users.id, follows.followingId))
        .where(and(eq(users.isActive, true), eq(users.id, userId)))
        .groupBy(users.id);

      return {
        messageRank: messageRank[0]?.rank || 999,
        replyRank: replyRank[0]?.rank || 999,
        likeRank: likeRank[0]?.rank || 999,
        followerRank: followerRank[0]?.rank || 999,
      };
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      throw error;
    }
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
    try {
      // 1. Delete notifications that reference this reply
      await db.delete(notifications).where(eq(notifications.replyId, id));

      // 2. Delete the reply itself
      await db.delete(replies).where(eq(replies.id, id));
    } catch (error) {
      console.error('Error in deleteReply:', error);
      throw error;
    }
  }

  async deleteReplyWithChildren(replyId: number): Promise<void> {
    try {
      // Recursively collect all child reply IDs
      const allReplyIds = await this.collectAllChildReplyIds(replyId);

      // Delete notifications for all these replies
      for (const id of allReplyIds) {
        await db.delete(notifications).where(eq(notifications.replyId, id));
      }

      // Delete all replies in reverse order (children first, then parents)
      for (let i = allReplyIds.length - 1; i >= 0; i--) {
        await db.delete(replies).where(eq(replies.id, allReplyIds[i]));
      }
    } catch (error) {
      console.error('Error in deleteReplyWithChildren:', error);
      throw error;
    }
  }

  private async collectAllChildReplyIds(parentId: number): Promise<number[]> {
    const allIds: number[] = [parentId];

    // Get all direct children
    const children = await db
      .select({ id: replies.id })
      .from(replies)
      .where(eq(replies.parentId, parentId));

    // Recursively get all nested children
    for (const child of children) {
      const childIds = await this.collectAllChildReplyIds(child.id);
      allIds.push(...childIds);
    }

    return allIds;
  }

  async getMessageById(id: number): Promise<MessageWithReplies | null> {
    try {
      // First get the message
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (!message || message.length === 0) {
        return null;
      }

      const messageData = message[0];

      // Get the user if exists
      let user = null;
      if (messageData.userId) {
        const userData = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            profilePicture: users.profilePicture,
            isVerified: users.isVerified,
          })
          .from(users)
          .where(eq(users.id, messageData.userId))
          .limit(1);
        user = userData[0] || null;
      }

      // Get the admin if exists
      let admin = null;
      if (messageData.adminId) {
        const adminData = await db
          .select({
            id: admins.id,
            displayName: admins.displayName,
            profilePicture: admins.profilePicture,
            isVerified: admins.isVerified,
          })
          .from(admins)
          .where(eq(admins.id, messageData.adminId))
          .limit(1);
        admin = adminData[0] || null;
      }

      // Get all replies for this message
      const repliesData = await db
        .select()
        .from(replies)
        .where(eq(replies.messageId, id))
        .orderBy(asc(replies.createdAt));

      // Get users and admins for replies
      const repliesWithUsers: ReplyWithUser[] = [];
      for (const reply of repliesData) {
        let replyUser = null;
        let replyAdmin = null;

        if (reply.userId) {
          const userData = await db
            .select({
              id: users.id,
              username: users.username,
              displayName: users.displayName,
              profilePicture: users.profilePicture,
              isVerified: users.isVerified,
            })
            .from(users)
            .where(eq(users.id, reply.userId))
            .limit(1);
          replyUser = userData[0] || null;
        }

        if (reply.adminId) {
          const adminData = await db
            .select({
              id: admins.id,
              displayName: admins.displayName,
              profilePicture: admins.profilePicture,
              isVerified: admins.isVerified,
            })
            .from(admins)
            .where(eq(admins.id, reply.adminId))
            .limit(1);
          replyAdmin = adminData[0] || null;
        }

        repliesWithUsers.push({
          ...reply,
          user: replyUser as any,
          admin: replyAdmin as any,
        });
      }

      // Get reactions
      const reactionsData = await db
        .select()
        .from(reactions)
        .where(eq(reactions.messageId, id));

      console.log(`Retrieved message ${id} with ${repliesWithUsers.length} replies`);
      console.log('Raw replies:', repliesWithUsers.map(r => ({ id: r.id, parentId: r.parentId, content: r.content.substring(0, 50) })));

      return {
        ...messageData,
        user: user as any,
        admin: admin as any,
        replies: repliesWithUsers,
        reactions: reactionsData,
        reactionCount: reactionsData.length,

      };
    } catch (error) {
      console.error('Error in getMessageById:', error);
      return null;
    }
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
    try {
      // Delete in proper order to avoid foreign key constraints

      // 1. First, get all reply IDs for this message to clean up notifications
      const messageReplies = await db
        .select({ id: replies.id })
        .from(replies)
        .where(eq(replies.messageId, messageId));

      // 2. Delete notifications that reference these replies
      for (const reply of messageReplies) {
        await db.delete(notifications).where(eq(notifications.replyId, reply.id));
      }

      // 3. Delete notifications that reference this message directly
      await db.delete(notifications).where(eq(notifications.messageId, messageId));

      // 4. Delete all liked message references
      await db.delete(likedMessages).where(eq(likedMessages.messageId, messageId));

      // 5. Delete all reactions for this message
      await db.delete(reactions).where(eq(reactions.messageId, messageId));

      // 6. Delete all replies to the message (now safe since notifications are gone)
      await db.delete(replies).where(eq(replies.messageId, messageId));

      // 7. Finally delete the message itself
      await db.delete(messages).where(eq(messages.id, messageId));
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      throw error;
    }
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

  async updateAdminProfile(adminId: number, updates: { displayName?: string; profilePicture?: string; bio?: string; backgroundPhoto?: string; lastDisplayNameChange?: Date; allowBoardCreation?: boolean; boardVisibility?: string; boardName?: string; boardBanner?: string; isAnonymousLinkPaused?: boolean }): Promise<Admin> {
    const updateData: any = {};

    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.profilePicture !== undefined) updateData.profilePicture = updates.profilePicture;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.backgroundPhoto !== undefined) updateData.backgroundPhoto = updates.backgroundPhoto;
    if (updates.lastDisplayNameChange !== undefined) updateData.lastDisplayNameChange = updates.lastDisplayNameChange;
    if (updates.allowBoardCreation !== undefined) updateData.allowBoardCreation = updates.allowBoardCreation;
    if (updates.boardVisibility !== undefined) updateData.boardVisibility = updates.boardVisibility;
    if (updates.boardName !== undefined) updateData.boardName = updates.boardName;
    if (updates.boardBanner !== undefined) updateData.boardBanner = updates.boardBanner;
    if (updates.isAnonymousLinkPaused !== undefined) updateData.isAnonymousLinkPaused = updates.isAnonymousLinkPaused;

    const [updatedAdmin] = await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.id, adminId))
      .returning();

    if (!updatedAdmin) {
      throw new Error("Admin not found");
    }

    // If display name was updated, update it in existing messages and replies
    if (updates.displayName !== undefined) {
      await this.updateAdminDisplayNameInContent(adminId, updates.displayName);
    }

    return updatedAdmin;
  }

  private async updateAdminDisplayNameInContent(adminId: number, newDisplayName: string): Promise<void> {
    try {
      // Update senderName in messages where this admin is the author
      await db
        .update(messages)
        .set({ senderName: newDisplayName })
        .where(eq(messages.adminId, adminId));

      // Update nickname in replies where this admin is the author
      await db
        .update(replies)
        .set({ nickname: newDisplayName })
        .where(eq(replies.adminId, adminId));

      console.log(`Updated display name to "${newDisplayName}" for admin ${adminId} across all content`);
    } catch (error) {
      console.error('Error updating admin display name in content:', error);
    }
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
      where: and(
        eq(messages.userId, userId),
        eq(messages.isPublic, true) // CRITICAL FIX: Only return public messages for profile views
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
        .where(and(
          eq(messages.userId, userId),
          eq(messages.isPublic, true) // CRITICAL FIX: Only count public messages in profile stats
        ));

      const userReplies = await db
        .select()
        .from(replies)
        .where(eq(replies.userId, userId));

      // Count reactions on public user messages only
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
        isAnonymousLinkPaused: users.isAnonymousLinkPaused,
        createdAt: users.createdAt,
        isActive: users.isActive,
        spotifyTrackId: users.spotifyTrackId,
        spotifyTrackName: users.spotifyTrackName,
        spotifyArtistName: users.spotifyArtistName,
        spotifyAlbumCover: users.spotifyAlbumCover,
        boardName: users.boardName,
        boardBanner: users.boardBanner,
        boardProfilePicture: users.boardProfilePicture,
        boardVisibility: users.boardVisibility,
        allowBoardCreation: users.allowBoardCreation,
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
        isAnonymousLinkPaused: users.isAnonymousLinkPaused,
        createdAt: users.createdAt,
        isActive: users.isActive,
        spotifyTrackId: users.spotifyTrackId,
        spotifyTrackName: users.spotifyTrackName,
        spotifyArtistName: users.spotifyArtistName,
        spotifyAlbumCover: users.spotifyAlbumCover,
        boardName: users.boardName,
        boardBanner: users.boardBanner,
        boardProfilePicture: users.boardProfilePicture,
        boardVisibility: users.boardVisibility,
        allowBoardCreation: users.allowBoardCreation,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result;
  }

  async getFollowStats(userId: number): Promise<{ followersCount: number; followingCount: number }> {
    // Get followers count (people following this user)
    const followersQuery = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));

    // Get following count (people this user is following)  
    const followingQuery = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    return {
      followersCount: followersQuery.length,
      followingCount: followingQuery.length,
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

    if (updates.isAnonymousLinkPaused !== undefined) {
      updateData.isAnonymousLinkPaused = updates.isAnonymousLinkPaused;
    }

    if (updates.boardName !== undefined) {
      updateData.boardName = updates.boardName;
    }

    if (updates.boardBanner !== undefined) {
      updateData.boardBanner = updates.boardBanner;
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

    // If display name was updated, update it in existing messages and replies
    if (updates.displayName !== undefined) {
      await this.updateUserDisplayNameInContent(userId, updates.displayName);
    }

    return user;
  }

  private async updateUserDisplayNameInContent(userId: number, newDisplayName: string): Promise<void> {
    try {
      // Update senderName in messages where this user is the author
      await db
        .update(messages)
        .set({ senderName: newDisplayName })
        .where(eq(messages.userId, userId));

      // Update nickname in replies where this user is the author
      await db
        .update(replies)
        .set({ nickname: newDisplayName })
        .where(eq(replies.userId, userId));

      console.log(`Updated display name to "${newDisplayName}" for user ${userId} across all content`);
    } catch (error) {
      console.error('Error updating user display name in content:', error);
    }
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

  // Anonymous messages operations (NGL-style)
  async sendAnonymousMessage(messageData: InsertAnonymousMessage): Promise<AnonymousMessage> {
    const [message] = await db
      .insert(anonymousMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getAnonymousMessages(userId: number, adminId?: number): Promise<AnonymousMessage[]> {
    if (adminId) {
      return await db
        .select()
        .from(anonymousMessages)
        .where(eq(anonymousMessages.recipientAdminId, adminId))
        .orderBy(desc(anonymousMessages.createdAt));
    } else {
      return await db
        .select()
        .from(anonymousMessages)
        .where(eq(anonymousMessages.recipientUserId, userId))
        .orderBy(desc(anonymousMessages.createdAt));
    }
  }

  async markAnonymousMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(anonymousMessages)
      .set({ isRead: true })
      .where(eq(anonymousMessages.id, messageId));
  }

  async deleteAnonymousMessage(messageId: number): Promise<void> {
    await db.delete(anonymousMessages).where(eq(anonymousMessages.id, messageId));
  }

  async getAnonymousMessageCount(userId: number, adminId?: number): Promise<number> {
    if (adminId) {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(anonymousMessages)
        .where(and(
          eq(anonymousMessages.recipientAdminId, adminId),
          eq(anonymousMessages.isRead, false)
        ));
      return Number(result[0].count);
    } else {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(anonymousMessages)
        .where(and(
          eq(anonymousMessages.recipientUserId, userId),
          eq(anonymousMessages.isRead, false)
        ));
      return Number(result[0].count);
    }
  }

  // Pin/Unpin message operations
  async updateMessagePinStatus(messageId: number, isPinned: boolean): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ isPinned })
      .where(eq(messages.id, messageId))
      .returning();
    return message;
  }

  // Password management operations  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    console.log(`Updating password for user ID: ${userId}`);
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    console.log(`Updated user password successfully, rows affected: ${result.length}`);
    if (result.length === 0) {
      throw new Error(`Failed to update password for user ${userId}`);
    }
  }

  async updateAdminPassword(adminId: number, hashedPassword: string): Promise<void> {
    console.log(`Updating password for admin ID: ${adminId}`);
    const result = await db
      .update(admins)
      .set({ password: hashedPassword })
      .where(eq(admins.id, adminId))
      .returning();
    console.log(`Updated admin password successfully, rows affected: ${result.length}`);
    if (result.length === 0) {
      throw new Error(`Failed to update password for admin ${adminId}`);
    }
  }

  async getAllUsersWithPasswords(): Promise<User[]> {
    const result = await db
      .select()
      .from(users);
    return result;
  }

  async getAllAdminsWithPasswords(): Promise<Admin[]> {
    const result = await db
      .select()
      .from(admins);
    return result;
  }

  // Store original passwords for ZEKE001 viewing (only in memory for security)
  private userPasswords = new Map<number, string>();
  private adminPasswords = new Map<number, string>();

  async storeOriginalPassword(userId: number, adminId: number | null, originalPassword: string): Promise<void> {
    if (userId) {
      this.userPasswords.set(userId, originalPassword);
    } else if (adminId) {
      this.adminPasswords.set(adminId, originalPassword);
    }
  }

  async getOriginalPassword(userId: number, adminId: number | null): Promise<string | null> {
    if (userId) {
      return this.userPasswords.get(userId) || null;
    } else if (adminId) {
      return this.adminPasswords.get(adminId) || null;
    }
    return null;
  }



  // Spotify integration methods
  async updateUserSpotifyTrack(userId: number, spotifyData: {
    spotifyTrackId?: string | null;
    spotifyTrackName?: string | null;
    spotifyArtistName?: string | null;
    spotifyAlbumCover?: string | null;
  }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        spotifyTrackId: spotifyData.spotifyTrackId,
        spotifyTrackName: spotifyData.spotifyTrackName,
        spotifyArtistName: spotifyData.spotifyArtistName,
        spotifyAlbumCover: spotifyData.spotifyAlbumCover,
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  }

  async updateAdminSpotifyTrack(adminId: number, spotifyData: {
    spotifyTrackId?: string | null;
    spotifyTrackName?: string | null;
    spotifyArtistName?: string | null;
    spotifyAlbumCover?: string | null;
  }): Promise<Admin> {
    const [updatedAdmin] = await db
      .update(admins)
      .set({
        spotifyTrackId: spotifyData.spotifyTrackId,
        spotifyTrackName: spotifyData.spotifyTrackName,
        spotifyArtistName: spotifyData.spotifyArtistName,
        spotifyAlbumCover: spotifyData.spotifyAlbumCover,
      })
      .where(eq(admins.id, adminId))
      .returning();

    if (!updatedAdmin) {
      throw new Error('Admin not found');
    }

    return updatedAdmin;
  }

  // User music list methods
  async addToMusicList(userId: number, adminId: number | undefined, spotifyData: {
    spotifyTrackId: string;
    spotifyTrackName: string;
    spotifyArtistName: string;
    spotifyAlbumCover?: string;
  }): Promise<UserMusic> {
    // Get the current highest order for this user
    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`max(${userMusicList.order})` })
      .from(userMusicList)
      .where(userId ? eq(userMusicList.userId, userId) : eq(userMusicList.adminId, adminId!));

    const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

    const [music] = await db
      .insert(userMusicList)
      .values({
        userId: userId || null,
        adminId: adminId || null,
        ...spotifyData,
        order: nextOrder,
      })
      .returning();
    return music;
  }

  async removeFromMusicList(musicId: number): Promise<void> {
    await db.delete(userMusicList).where(eq(userMusicList.id, musicId));
  }

  async getUserMusicList(userId: number, adminId?: number): Promise<UserMusic[]> {
    const result = await db
      .select()
      .from(userMusicList)
      .where(userId ? eq(userMusicList.userId, userId) : eq(userMusicList.adminId, adminId!))
      .orderBy(desc(userMusicList.isFavorite), asc(userMusicList.order));
    return result;
  }

  async setFavoriteTrack(musicId: number): Promise<UserMusic> {
    // First, remove favorite status from all tracks for this user
    const musicTrack = await db
      .select()
      .from(userMusicList)
      .where(eq(userMusicList.id, musicId))
      .limit(1);

    if (musicTrack.length === 0) {
      throw new Error("Music track not found");
    }

    const track = musicTrack[0];

    // Remove favorite from all tracks for this user/admin
    if (track.userId) {
      await db
        .update(userMusicList)
        .set({ isFavorite: false })
        .where(eq(userMusicList.userId, track.userId));
    } else if (track.adminId) {
      await db
        .update(userMusicList)
        .set({ isFavorite: false })
        .where(eq(userMusicList.adminId, track.adminId));
    }

    // Set this track as favorite
    const [updatedTrack] = await db
      .update(userMusicList)
      .set({ isFavorite: true })
      .where(eq(userMusicList.id, musicId))
      .returning();

    return updatedTrack;
  }

  async reorderMusicList(userId: number, adminId: number | undefined, musicIds: number[]): Promise<void> {
    // Update the order of each track
    for (let i = 0; i < musicIds.length; i++) {
      await db
        .update(userMusicList)
        .set({ order: i + 1 })
        .where(eq(userMusicList.id, musicIds[i]));
    }
  }

  // Dashboard message methods
  async createDashboardMessage(message: InsertDashboardMessage): Promise<DashboardMessage> {
    const [dashboardMessage] = await db
      .insert(dashboardMessages)
      .values(message)
      .returning();
    return dashboardMessage;
  }

  async getUserDashboardMessages(userId: number, adminId?: number): Promise<DashboardMessage[]> {
    const conditions = [eq(dashboardMessages.isVisible, true)];

    if (userId) {
      conditions.push(eq(dashboardMessages.targetUserId, userId));
    } else if (adminId) {
      conditions.push(eq(dashboardMessages.targetAdminId, adminId));
    }

    try {
      const result = await db
        .select()
        .from(dashboardMessages)
        .where(and(...conditions))
        .orderBy(desc(dashboardMessages.isPinned), desc(dashboardMessages.createdAt));
      return result;
    } catch (error) {
      // Fallback query without isPinned column if it doesn't exist yet
      console.log("Falling back to query without isPinned column");
      const result = await db
        .select()
        .from(dashboardMessages)
        .where(and(...conditions))
        .orderBy(desc(dashboardMessages.createdAt));
      return result;
    }
  }

  async deleteDashboardMessage(messageId: number): Promise<void> {
    await db.delete(dashboardMessages).where(eq(dashboardMessages.id, messageId));
  }

  async pinDashboardMessage(messageId: number, isPinned: boolean): Promise<DashboardMessage> {
    try {
      const [message] = await db
        .update(dashboardMessages)
        .set({ isPinned })
        .where(eq(dashboardMessages.id, messageId))
        .returning();
      return message;
    } catch (error) {
      console.error('Error pinning dashboard message:', error);
      // Fallback for databases without isPinned column
      const [message] = await db
        .select()
        .from(dashboardMessages)
        .where(eq(dashboardMessages.id, messageId))
        .limit(1);
      return message;
    }
  }

  // Admin announcement methods
  async createAdminAnnouncement(announcement: InsertAdminAnnouncement): Promise<AdminAnnouncement> {
    const [adminAnnouncement] = await db
      .insert(adminAnnouncements)
      .values(announcement)
      .returning();
    return adminAnnouncement;
  }

  async getAllAdminAnnouncements(): Promise<AdminAnnouncement[]> {
    const result = await db
      .select()
      .from(adminAnnouncements)
      .orderBy(desc(adminAnnouncements.isPinned), desc(adminAnnouncements.createdAt));
    return result;
  }

  async deleteAdminAnnouncement(announcementId: number): Promise<void> {
    await db.delete(adminAnnouncements).where(eq(adminAnnouncements.id, announcementId));
  }

  async pinAdminAnnouncement(announcementId: number, isPinned: boolean): Promise<AdminAnnouncement> {
    const [announcement] = await db
      .update(adminAnnouncements)
      .set({ isPinned })
      .where(eq(announcementId, announcementId))
      .returning();
    return announcement;
  }

  // Leaderboard methods
  async getLeaderboardData(): Promise<{
    messageLeaders: any[];
    replyLeaders: any[];
    likeLeaders: any[];
    followerLeaders: any[];
  }> {
    // Get message leaders
    const messageLeaders = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        isVerified: users.isVerified,
        messageCount: sql<number>`count(distinct ${messages.id})`,
        replyCount: sql<number>`0`,
        likeCount: sql<number>`0`,
        followerCount: sql<number>`0`
      })
      .from(users)
      .leftJoin(messages, and(eq(messages.userId, users.id), eq(messages.isPublic, true)))
      .where(eq(users.isActive, true))
      .groupBy(users.id, users.username, users.displayName, users.profilePicture, users.isVerified)
      .orderBy(desc(sql<number>`count(distinct ${messages.id})`))
      .limit(10);

    // Get reply leaders
    const replyLeaders = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        isVerified: users.isVerified,
        messageCount: sql<number>`0`,
        replyCount: sql<number>`count(distinct ${replies.id})`,
        likeCount: sql<number>`0`,
        followerCount: sql<number>`0`
      })
      .from(users)
      .leftJoin(replies, eq(replies.userId, users.id))
      .where(eq(users.isActive, true))
      .groupBy(users.id, users.username, users.displayName, users.profilePicture, users.isVerified)
      .orderBy(desc(sql<number>`count(distinct ${replies.id})`))
      .limit(10);

    // Get like leaders (users whose messages received the most hearts)
    const likeLeaders = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        isVerified: users.isVerified,
        messageCount: sql<number>`0`,
        replyCount: sql<number>`0`,
        likeCount: sql<number>`count(distinct ${reactions.id})`,
        followerCount: sql<number>`0`
      })
      .from(users)
      .leftJoin(messages, eq(messages.userId, users.id))
      .leftJoin(reactions, eq(messages.id, reactions.messageId))
      .where(eq(users.isActive, true))
      .groupBy(users.id, users.username, users.displayName, users.profilePicture, users.isVerified)
      .orderBy(desc(sql<number>`count(distinct ${reactions.id})`))
      .limit(10);

    // Get follower leaders
    const followerLeaders = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        isVerified: users.isVerified,
        messageCount: sql<number>`0`,
        replyCount: sql<number>`0`,
        likeCount: sql<number>`0`,
        followerCount: sql<number>`count(distinct ${follows.followerId})`
      })
      .from(users)
      .leftJoin(follows, eq(follows.followingId, users.id))
      .where(eq(users.isActive, true))
      .groupBy(users.id, users.username, users.displayName, users.profilePicture, users.isVerified)
      .orderBy(desc(sql<number>`count(distinct ${follows.followerId})`))
      .limit(10);

    return {
      messageLeaders: messageLeaders.map((user, index) => ({ ...user, rank: index + 1 })),
      replyLeaders: replyLeaders.map((user, index) => ({ ...user, rank: index + 1 })),
      likeLeaders: likeLeaders.map((user, index) => ({ ...user, rank: index + 1 })),
      followerLeaders: followerLeaders.map((user, index) => ({ ...user, rank: index + 1 }))
    };
  }

  // Boards functionality
  async getAllBoardsWithMessageCounts() {
    try {
      // Get all active users with their message counts
      const usersWithCounts = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          displayName: users.displayName,
          profilePicture: users.profilePicture,
          backgroundPhoto: users.backgroundPhoto,
          bio: users.bio,
          boardName: users.boardName,
          boardBanner: users.boardBanner,
          boardProfilePicture: users.boardProfilePicture,
          boardVisibility: users.boardVisibility,
          allowBoardCreation: users.allowBoardCreation,
          lastDisplayNameChange: users.lastDisplayNameChange,
          isVerified: users.isVerified,
          likedMessagesPrivacy: users.likedMessagesPrivacy,
          isAnonymousLinkPaused: users.isAnonymousLinkPaused,
          createdAt: users.createdAt,
          isActive: users.isActive,
          spotifyTrackId: users.spotifyTrackId,
          spotifyTrackName: users.spotifyTrackName,
          spotifyArtistName: users.spotifyArtistName,
          spotifyAlbumCover: users.spotifyAlbumCover,
          messageCount: sql<number>`count(${dashboardMessages.id})`.as('messageCount'),
        })
        .from(users)
        .leftJoin(dashboardMessages, eq(users.id, dashboardMessages.targetUserId))
        .where(and(eq(users.isActive, true), eq(users.boardVisibility, 'public')))
        .groupBy(users.id)
        .having(sql`count(${dashboardMessages.id}) > 0`);

      // Get all active admins with their dashboard message counts
      const adminsWithCounts = await db
        .select({
          id: admins.id,
          username: admins.username,
          password: admins.password,
          displayName: admins.displayName,
          profilePicture: admins.profilePicture,
          backgroundPhoto: admins.backgroundPhoto,
          bio: admins.bio,
          boardName: admins.boardName,
          boardBanner: admins.boardBanner,
          boardProfilePicture: admins.boardProfilePicture,
          boardVisibility: admins.boardVisibility,
          allowBoardCreation: admins.allowBoardCreation,
          role: admins.role,
          isVerified: admins.isVerified,
          lastDisplayNameChange: admins.lastDisplayNameChange,
          createdAt: admins.createdAt,
          isActive: admins.isActive,
          spotifyTrackId: admins.spotifyTrackId,
          spotifyTrackName: admins.spotifyTrackName,
          spotifyArtistName: admins.spotifyArtistName,
          spotifyAlbumCover: admins.spotifyAlbumCover,
          messageCount: sql<number>`count(${dashboardMessages.id})`.as('messageCount'),
        })
        .from(admins)
        .leftJoin(dashboardMessages, eq(admins.id, dashboardMessages.targetAdminId))
        .where(and(
          eq(admins.isActive, true), 
          eq(admins.allowBoardCreation, true),
          eq(admins.boardVisibility, 'public'),
          isNotNull(admins.boardName)
        ))
        .groupBy(admins.id);

      // Combine and return all boards
      const allBoards = [...usersWithCounts, ...adminsWithCounts];

      return allBoards;
    } catch (error) {
      console.error("Error fetching boards with message counts:", error);
      throw error;
    }
  }

  async createBoardReport(data: {
    targetUserId: number | null;
    targetAdminId: number | null;
    reason: string;
    reporterId: number;
    reporterType: 'user' | 'admin';
  }) {
    try {
      const reportData = {
        targetUserId: data.targetUserId,
        targetAdminId: data.targetAdminId,
        reason: data.reason,
        reporterId: data.reporterId,
        reporterType: data.reporterType,
        type: 'board' as const,
        status: 'pending' as const,
        createdAt: new Date(),
      };

      const [report] = await db.insert(notifications).values(reportData as any).returning();

      // Create notification for admins
      await this.createNotification({
        adminId: 1, // ZEKE001
        content: `New board report submitted: ${data.reason}`,
        type: 'board_report',
      });

      return report;
    } catch (error) {
      console.error("Error creating board report:", error);
      throw error;
    }
  }

  async deleteUserBoard(userId: number) {
    try {
      // Clear board-specific user data
      await db
        .update(users)
        .set({
          boardName: null,
          boardBanner: null,
          boardProfilePicture: null,
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error("Error deleting user board:", error);
      throw error;
    }
  }

  async deleteAdminBoard(adminId: number) {
    try {
      // Clear board-specific admin data
      await db
        .update(admins)
        .set({
          boardName: null,
          boardBanner: null,
          boardProfilePicture: null,
        })
        .where(eq(admins.id, adminId));

      return true;
    } catch (error) {
      console.error("Error deleting admin board:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();