import { messages, replies, admins, users, type Message, type Reply, type Admin, type User, type InsertMessage, type InsertReply, type InsertAdmin, type InsertUser, type MessageWithReplies } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, and } from "drizzle-orm";

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
  deleteReply(id: number): Promise<void>;
  
  // Admin operations
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  updateAdminStatus(adminId: number, isActive: boolean): Promise<Admin>;
  
  // Recipients operations - now returns admin display names
  getRecipients(): Promise<string[]>;
  
  // User management operations
  deleteUser(userId: number): Promise<void>;
  getUserMessages(userId: number): Promise<MessageWithReplies[]>;
  searchUsers(query: string): Promise<User[]>;
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
    const result = await db.query.messages.findMany({
      where: eq(messages.isPublic, true),
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

  async getPrivateMessages(): Promise<MessageWithReplies[]> {
    const result = await db.query.messages.findMany({
      where: eq(messages.isPublic, false),
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

  async getMessagesByCategory(category: string): Promise<MessageWithReplies[]> {
    const result = await db.query.messages.findMany({
      where: eq(messages.category, category),
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

  async createReply(replyData: InsertReply): Promise<Reply> {
    const [reply] = await db
      .insert(replies)
      .values(replyData)
      .returning();
    return reply;
  }

  async getRepliesByMessageId(messageId: number): Promise<Reply[]> {
    const result = await db
      .select()
      .from(replies)
      .where(eq(replies.messageId, messageId))
      .orderBy(desc(replies.createdAt));
    return result;
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
          orderBy: desc(replies.createdAt),
          with: {
            user: true,
          },
        },
        user: true,
      },
    });
    return result || null;
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
    return result;
  }

  async searchPublicMessages(query: string): Promise<MessageWithReplies[]> {
    if (!query.trim()) {
      return this.getPublicMessages();
    }
    
    const searchTerm = `%${query.toLowerCase()}%`;
    try {
      const result = await db.query.messages.findMany({
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
      return result;
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple content search if complex query fails
      const result = await db.query.messages.findMany({
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
      return result;
    }
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
    // First delete all replies to the message
    await db
      .delete(replies)
      .where(eq(replies.messageId, messageId));
    
    // Then delete the message itself
    await db
      .delete(messages)
      .where(eq(messages.id, messageId));
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
    // First delete all replies by the user
    await db
      .delete(replies)
      .where(eq(replies.userId, userId));
    
    // Then delete all messages by the user
    await db
      .delete(messages)
      .where(eq(messages.userId, userId));
    
    // Finally delete the user
    await db
      .delete(users)
      .where(eq(users.id, userId));
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
}

export const storage = new DatabaseStorage();
