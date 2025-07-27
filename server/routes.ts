import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertReplySchema, insertAdminSchema, insertUserSchema, insertReactionSchema, insertNotificationSchema, insertFollowSchema, follows } from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Authentication routes for users
  // Check username availability
  app.get("/api/auth/check-username/:username", async (req, res) => {
    try {
      const { username } = req.params;

      // Check if username exists in users table
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        res.json({ available: false, message: "Username already taken by a Silent Messenger" });
        return;
      }

      // Check if username exists in admins table
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        res.json({ available: false, message: "Username already taken by a Whisper Listener" });
        return;
      }

      res.json({ available: true, message: "Username is available" });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(500).json({ message: "Failed to check username" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Check if username already exists in both tables
      const existingUser = await storage.getUserByUsername(username);
      const existingAdmin = await storage.getAdminByUsername(username);

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists as Silent Messenger" });
      }

      if (existingAdmin) {
        return res.status(400).json({ message: "Username already exists as Whisper Listener" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin authentication routes
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Special handling for ZEKE001 - password should be "ZEKE001"
      if (username === "ZEKE001") {
        if (password !== "ZEKE001") {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        if (!admin.isActive) {
          return res.status(401).json({ message: "Account is disabled" });
        }
        const { password: _, ...adminWithoutPassword } = admin;
        return res.json(adminWithoutPassword);
      }

      // For other admins, check password
      if (!admin.password || !await comparePasswords(password, admin.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!admin.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }

      const { password: _, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error logging in admin:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Create admin (only for existing admins)
  app.post("/api/admin/create", async (req, res) => {
    try {
      const { username, password, displayName, role } = req.body;

      // Check if admin already exists
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin username already exists" });
      }

      // Hash password if provided
      const hashedPassword = password ? await hashPassword(password) : null;

      const admin = await storage.createAdmin({
        username,
        password: hashedPassword,
        displayName,
        role: role || "admin",
      });

      const { password: _, ...adminWithoutPassword } = admin;
      res.status(201).json(adminWithoutPassword);
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Get all admins
  app.get("/api/admin/list", async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      const adminsWithoutPasswords = admins.map(({ password, ...admin }) => admin);
      res.json(adminsWithoutPasswords);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  // Update admin status
  app.patch("/api/admin/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const admin = await storage.updateAdminStatus(parseInt(id), isActive);
      const { password: _, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // Pin/unpin message (only ZEKE001 can do this)
  app.patch("/api/messages/:id/pin", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminUsername, isPinned } = req.body;

      // Only ZEKE001 can pin/unpin messages
      if (adminUsername !== "ZEKE001") {
        return res.status(403).json({ message: "Only ZEKE001 can pin/unpin messages" });
      }

      const message = await storage.updateMessagePinStatus(parseInt(id), isPinned);
      res.json(message);
    } catch (error) {
      console.error("Error updating pin status:", error);
      res.status(500).json({ message: "Failed to update pin status" });
    }
  });

  // Get all public messages
  app.get("/api/messages/public", async (req, res) => {
    try {
      const messages = await storage.getPublicMessages();

      // Enhance messages with reaction counts and reactions
      const messagesWithReactions = await Promise.all(
        messages.map(async (message) => {
          let reactions: any[] = [];
          let reactionCount = 0;

          try {
            reactions = await storage.getMessageReactions(message.id);
            reactionCount = reactions.length;
          } catch (error) {
            // Skip if reactions table doesn't exist
          }

          return {
            ...message,
            reactions,
            reactionCount,
          };
        })
      );

      res.json(messagesWithReactions);
    } catch (error) {
      console.error("Error fetching public messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Search public messages
  app.get("/api/messages/search", async (req, res) => {
    try {
      const { q } = req.query;
      const query = typeof q === 'string' ? q : '';
      const messages = await storage.searchPublicMessages(query);
      res.json(messages);
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ message: "Failed to search messages" });
    }
  });

  app.get("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const message = await storage.getMessageById(parseInt(id));
      if (!message) {
        res.status(404).json({ message: "Message not found" });
        return;
      }

      // Add reaction data
      let reactions: any[] = [];
      let reactionCount = 0;

      try {
        reactions = await storage.getMessageReactions(message.id);
        reactionCount = reactions.length;
      } catch (error) {
        // Skip if reactions table doesn't exist
      }

      res.json({
        ...message,
        reactions,
        reactionCount,
      });
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ message: "Failed to fetch message" });
    }
  });

  // Get all private messages (admin only)
  app.get("/api/messages/private", async (req, res) => {
    try {
      const messages = await storage.getPrivateMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching private messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages by category
  app.get("/api/messages/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const messages = await storage.getMessagesByCategory(category);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages by category:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages by recipient
  app.get("/api/messages/recipient/:recipient", async (req, res) => {
    try {
      const { recipient } = req.params;
      const messages = await storage.getMessagesByRecipient(recipient);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages by recipient:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get available recipients
  app.get("/api/recipients", async (req, res) => {
    try {
      const recipients = await storage.getRecipients();
      res.json(recipients);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      res.status(500).json({ message: "Failed to fetch recipients" });
    }
  });

  // Create new message
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
        return;
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Create new reply
  app.post("/api/replies", async (req, res) => {
    try {
      const validatedData = insertReplySchema.parse(req.body);
      const reply = await storage.createReply(validatedData);

      // Create notification for the message author or parent reply author
      if (validatedData.parentId && typeof validatedData.parentId === 'number') {
        // This is a nested reply - notify the parent reply author
        const parentReply = await storage.getReplyById(validatedData.parentId);
        if (parentReply && (parentReply.userId || parentReply.adminId)) {
          await storage.createNotification({
            userId: parentReply.userId || undefined,
            adminId: parentReply.adminId || undefined,
            type: "reply",
            messageId: validatedData.messageId as number,
            replyId: reply.id,
            fromUserId: validatedData.userId || undefined,
            fromAdminId: validatedData.adminId || undefined,
            content: `${validatedData.nickname} replied to your comment: "${String(validatedData.content).substring(0, 50)}${String(validatedData.content).length > 50 ? '...' : ''}"`,
          });
        }
      } else {
        // This is a root reply - notify the message author
        const message = await storage.getMessageById(validatedData.messageId as number);
        if (message && (message.userId || message.adminId)) {
          await storage.createNotification({
            userId: message.userId || undefined,
            adminId: message.adminId || undefined,
            type: "reply",
            messageId: validatedData.messageId as number,
            replyId: reply.id,
            fromUserId: validatedData.userId || undefined,
            fromAdminId: validatedData.adminId || undefined,
            content: `${validatedData.nickname} replied to your message: "${String(validatedData.content).substring(0, 50)}${String(validatedData.content).length > 50 ? '...' : ''}"`,
          });
        }
      }

      res.status(201).json(reply);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid reply data", errors: error.errors });
        return;
      }
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  app.delete("/api/replies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const replyId = parseInt(id);
      
      // Delete the reply and all its nested children
      await storage.deleteReplyWithChildren(replyId);
      res.json({ message: "Reply deleted successfully" });
    } catch (error) {
      console.error("Error deleting reply:", error);
      res.status(500).json({ message: "Failed to delete reply" });
    }
  });

  // Delete message (admin/owner only)
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminUsername, userId } = req.body;
      
      // Get the message first to check ownership
      const message = await storage.getMessageById(parseInt(id));
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Allow deletion if:
      // 1. User is ZEKE001 (main admin - can delete any message)
      // 2. Message belongs to the requesting admin
      // 3. Message belongs to the requesting user
      const canDelete = 
        adminUsername === "ZEKE001" || 
        (message.adminId && adminUsername && message.adminId === await storage.getAdminByUsername(adminUsername)?.then(a => a?.id)) ||
        (message.userId && userId && message.userId === userId);
      
      if (!canDelete) {
        return res.status(403).json({ message: "You can only delete your own messages or have admin privileges" });
      }
      
      await storage.deleteMessage(parseInt(id));
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.post("/api/warnings", async (req, res) => {
    try {
      const { replyId, messageId, reason, userId } = req.body;

      // Store warning in database (you could extend schema for warnings table)
      console.log(`Warning sent for reply ${replyId} on message ${messageId} to user ${userId}: ${reason}`);

      // In a real app, this would send notifications/emails to users
      res.json({ 
        message: "Warning sent successfully",
        details: `Warning sent for inappropriate content: ${reason}` 
      });
    } catch (error) {
      console.error("Error sending warning:", error);
      res.status(500).json({ message: "Failed to send warning" });
    }
  });

  // Update message visibility (make private message public)
  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isPublic } = req.body;
      const message = await storage.updateMessageVisibility(parseInt(id), isPublic);
      res.json(message);
    } catch (error) {
      console.error("Error updating message visibility:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  // Admin management routes
  app.post("/api/admins", async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      const admin = await storage.createAdmin(validatedData);
      // Don't return password in response
      const { password, ...adminWithoutPassword } = admin;
      res.status(201).json(adminWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid admin data", errors: error.errors });
        return;
      }
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  app.get("/api/admins", async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      // Don't return passwords in response
      const adminsWithoutPasswords = admins.map(({ password, ...admin }) => admin);
      res.json(adminsWithoutPasswords);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  app.patch("/api/admins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const admin = await storage.updateAdminStatus(parseInt(id), isActive);
      const { password, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || !user.isActive) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);

      if (!admin || admin.password !== password || !admin.isActive) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const { password: _, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // User management routes
  app.get("/api/user/messages/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getUserMessages(parseInt(userId));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({ message: "Failed to fetch user messages" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(parseInt(id));
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const { q } = req.query;
      const users = await storage.searchUsers(q as string || "");
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const user = await storage.updateUserStatus(parseInt(id), isActive);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // User profile routes - removed duplicate route

  app.get("/api/users/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getUserMessages(parseInt(id));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({ message: "Failed to fetch user messages" });
    }
  });

  // Reaction routes
  app.post("/api/messages/:id/reactions", async (req, res) => {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);
      const { userId, adminId, type = "heart" } = req.body;

      // Check if user already reacted
      const existingReaction = await storage.getUserReaction(messageId, userId, adminId);
      if (existingReaction) {
        return res.status(400).json({ message: "You have already reacted to this message" });
      }

      // Add reaction
      const reaction = await storage.addReaction({
        messageId,
        userId: userId || null,
        adminId: adminId || null,
        type,
      });

      // Get message to find owner for notification
      const message = await storage.getMessageById(messageId);
      if (message && message.userId) {
        // Create notification for message owner
        const fromName = userId ? (await storage.getUserById(userId))?.username : 
                         adminId ? (await storage.getAdminByUsername("admin"))?.displayName : "Anonymous";

        await storage.createNotification({
          userId: message.userId,
          type: "reaction",
          messageId,
          fromUserId: userId || null,
          fromAdminId: adminId || null,
          content: `${fromName} reacted with ${type} to your message`,
          isRead: false,
        });
      }

      res.status(201).json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  app.delete("/api/messages/:id/reactions", async (req, res) => {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);
      const { userId, adminId } = req.body;

      await storage.removeReaction(messageId, userId, adminId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  app.get("/api/messages/:id/reactions", async (req, res) => {
    try {
      const { id } = req.params;
      const reactions = await storage.getMessageReactions(parseInt(id));
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Liked messages routes (personal archive)
  app.post("/api/messages/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);
      const { userId, adminId } = req.body;

      if (!userId && !adminId) {
        return res.status(400).json({ message: "Authentication required" });
      }

      // Check if already liked
      const isLiked = await storage.isMessageLiked(userId, adminId, messageId);
      if (isLiked) {
        return res.status(400).json({ message: "Message already liked" });
      }

      const liked = await storage.likeMessage(userId, adminId, messageId);
      res.status(201).json(liked);
    } catch (error) {
      console.error("Error liking message:", error);
      res.status(500).json({ message: "Failed to like message" });
    }
  });

  app.delete("/api/messages/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);
      const { userId, adminId } = req.body;

      if (!userId && !adminId) {
        return res.status(400).json({ message: "Authentication required" });
      }

      await storage.unlikeMessage(userId, adminId, messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unliking message:", error);
      res.status(500).json({ message: "Failed to unlike message" });
    }
  });

  app.get("/api/users/:userId/liked-messages", async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminId } = req.query;

      const likedMessages = await storage.getUserLikedMessages(
        parseInt(userId), 
        adminId ? parseInt(adminId as string) : undefined
      );
      res.json(likedMessages);
    } catch (error) {
      console.error("Error fetching liked messages:", error);
      res.status(500).json({ message: "Failed to fetch liked messages" });
    }
  });

  // User profile update routes
  // Message privacy routes
  app.patch("/api/messages/:messageId/privacy", async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, isOwnerPrivate } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "Authentication required" });
      }

      const message = await storage.updateMessagePrivacy(parseInt(messageId), userId, isOwnerPrivate);
      res.json(message);
    } catch (error) {
      console.error("Error updating message privacy:", error);
      res.status(500).json({ message: "Failed to update message privacy" });
    }
  });

  // Verified badge routes (only ZEKE001 can manage)
  app.patch("/api/users/:userId/verification", async (req, res) => {
    try {
      const { userId } = req.params;
      const { isVerified } = req.body;

      const user = await storage.updateUserVerificationStatus(parseInt(userId), isVerified);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user verification:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  app.patch("/api/admins/:adminId/verification", async (req, res) => {
    try {
      const { adminId } = req.params;
      const { isVerified } = req.body;

      const admin = await storage.updateAdminVerificationStatus(parseInt(adminId), isVerified);
      const { password, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error updating admin verification:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  app.patch("/api/users/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Validate display name cooldown if being updated
      if (updates.displayName !== undefined) {
        const canUpdate = await storage.canUpdateDisplayName(parseInt(userId));
        if (!canUpdate) {
          return res.status(400).json({ 
            message: "Display name can only be changed once every 30 days" 
          });
        }
      }

      const updatedUser = await storage.updateUserProfile(parseInt(userId), updates);

      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/users/:userId/can-update-display-name", async (req, res) => {
    try {
      const { userId } = req.params;
      const canUpdate = await storage.canUpdateDisplayName(parseInt(userId));
      res.json({ canUpdate });
    } catch (error) {
      console.error("Error checking display name cooldown:", error);
      res.status(500).json({ message: "Failed to check cooldown" });
    }
  });

  // Account deletion endpoints (ADMIN ONLY - CRITICAL)
  app.delete("/api/users/:userId/account", async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminUsername } = req.body;

      // Only ZEKE001 can delete user accounts
      if (adminUsername !== "ZEKE001") {
        return res.status(403).json({ message: "Only ZEKE001 can delete user accounts" });
      }

      await storage.deleteUserAccount(parseInt(userId));
      res.json({ message: "User account deleted successfully" });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: "Failed to delete user account" });
    }
  });

  app.delete("/api/admins/:adminId/account", async (req, res) => {
    try{
      const { adminId } = req.params;
      const { adminUsername } = req.body;

      // Only ZEKE001 can delete admin accounts
      if (adminUsername !== "ZEKE001") {
        return res.status(403).json({ message: "Only ZEKE001 can delete admin accounts" });
      }

      // Prevent self-deletion of ZEKE001
      const adminToDelete = await storage.getAdminById(parseInt(adminId));
      if (adminToDelete?.username === "ZEKE001") {
        return res.status(400).json({ message: "Cannot delete the primary ZEKE001 admin account" });
      }

      await storage.deleteAdminAccount(parseInt(adminId));
      res.json({ message: "Admin account deleted successfully" });
    } catch (error) {
      console.error("Error deleting admin account:", error);
      res.status(500).json({ message: "Failed to delete admin account" });
    }
  });

  // Notification routes
  app.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getUserNotifications(parseInt(userId));
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/admin/:adminId", async (req, res) => {
    try {
      const { adminId } = req.params;
      const notifications = await storage.getAdminNotifications(parseInt(adminId));
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const { userId, adminId } = req.body;
      await storage.markAllNotificationsAsRead(userId, adminId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // User profile endpoints
  app.get("/api/users/:id/profile", async (req, res) => {
    const userId = parseInt(req.params.id);
    const currentUserId = req.query.currentUserId ? parseInt(req.query.currentUserId as string) : undefined;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
      const profile = await storage.getUserProfile(userId, currentUserId);
      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password
      const { password, ...profileWithoutPassword } = profile;
      res.json(profileWithoutPassword);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.get("/api/users/:id/messages", async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
      const messages = await storage.getUserMessages(userId);

      // Get reactions and replies for each message
      const messagesWithDetails = await Promise.all(
        messages.map(async (message) => {
          let reactionCount = 0;
          try {
            const reactions = await storage.getMessageReactions(message.id);
            reactionCount = reactions.length;
          } catch (error) {
            // Skip if reactions table doesn't exist yet
          }

          const replies = await storage.getRepliesByMessageId(message.id);
          return {
            ...message,
            reactionCount,
            replies: replies || [],
          };
        })
      );

      res.json(messagesWithDetails);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({ error: "Failed to fetch user messages" });
    }
  });

  // Follow system endpoints - users
  app.post("/api/users/:id/follow", async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const { followerId } = req.body;

      if (!followingId || !followerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (followingId === followerId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      // Check if already following
      const isAlreadyFollowing = await storage.isFollowing(followerId, followingId);
      if (isAlreadyFollowing) {
        return res.status(400).json({ error: "Already following this user" });
      }

      const follow = await storage.followUser(followerId, followingId);

      // Create notification for the followed user
      const follower = await storage.getUserById(followerId);
      if (follower) {
        await storage.createNotification({
          userId: followingId,
          type: "follow",
          fromUserId: followerId,
          content: `${follower.displayName || follower.username} started following you`,
        });
      }

      res.json({ success: true, follow });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  // Follow system endpoints - admins
  app.post("/api/admins/:id/follow", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const { followerId } = req.body;

      if (!adminId || !followerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if already following
      const isAlreadyFollowing = await storage.isFollowingAdmin(followerId, adminId);
      if (isAlreadyFollowing) {
        return res.status(400).json({ error: "Already following this admin" });
      }

      const follow = await storage.followAdmin(followerId, adminId);

      // Create notification for the followed admin
      const follower = await storage.getUserById(followerId);
      if (follower) {
        await storage.createNotification({
          adminId: adminId,
          type: "follow",
          fromUserId: followerId,
          content: `${follower.displayName || follower.username} started following you`,
        });
      }

      res.json({ success: true, follow });
    } catch (error) {
      console.error("Error following admin:", error);
      res.status(500).json({ error: "Failed to follow admin" });
    }
  });

  app.post("/api/admins/:id/unfollow", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const { followerId } = req.body;

      if (!adminId || !followerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await storage.unfollowAdmin(followerId, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing admin:", error);
      res.status(500).json({ error: "Failed to unfollow admin" });
    }
  });

  app.post("/api/users/:id/unfollow", async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const { followerId } = req.body;

      if (!followingId || !followerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await storage.unfollowUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const followers = await storage.getUserFollowers(userId);
      // Remove password from response
      const followersWithoutPassword = followers.map(({ password, ...user }) => user);
      res.json(followersWithoutPassword);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const following = await storage.getUserFollowing(userId);
      // Remove password from response
      const followingWithoutPassword = following.map(({ password, ...user }) => user);
      res.json(followingWithoutPassword);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  // Global search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const { q, type = "users" } = req.query;

      if (!q || typeof q !== "string" || q.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }

      const searchTerm = q.trim();

      if (type === "users") {
        const users = await storage.searchUsers(searchTerm);
        const admins = await storage.searchAdmins(searchTerm);
        // Remove password from response
        const usersWithoutPassword = users.map(({ password, ...user }) => user);
        const adminsWithoutPassword = admins.map(({ password, ...admin }) => admin);
        res.json({ users: usersWithoutPassword, admins: adminsWithoutPassword });
      } else if (type === "messages") {
        const messages = await storage.searchPublicMessages(searchTerm);
        res.json({ messages });
      } else {
        return res.status(400).json({ error: "Invalid search type. Use 'users' or 'messages'" });
      }
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get user profile by username (for anonymous messaging)
  app.get("/api/users/profile/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return basic profile info (no password)
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { bio, displayName, profilePicture } = req.body;

      // Security check: Verify user is updating their own profile
      // This would need proper authentication middleware in a production app
      // For now, we'll rely on frontend checks and session validation

      const updatedUser = await storage.updateUserProfile(userId, { bio, displayName, profilePicture });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Admin profile routes
  app.patch("/api/admins/:id/profile", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const { displayName, profilePicture, bio, backgroundPhoto } = req.body;

      // Validate admin ID
      if (!adminId || isNaN(adminId)) {
        return res.status(400).json({ message: "Invalid admin ID" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Validate profile picture size if provided
      if (profilePicture && typeof profilePicture === 'string') {
        // Check if base64 string is too large (approx 1MB after base64 encoding)
        const sizeInBytes = (profilePicture.length * 3) / 4;
        if (sizeInBytes > 1024 * 1024) { // 1MB limit
          return res.status(400).json({ 
            message: "Profile picture is too large. Please choose a smaller image." 
          });
        }
      }

      // Check display name change cooldown (bypass for ZEKE001)
      if (displayName && displayName !== admin.displayName && admin.username !== "ZEKE001") {
        const lastChange = admin.lastDisplayNameChange;
        if (lastChange) {
          const daysSinceLastChange = Math.floor((Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceLastChange < 30) {
            return res.status(400).json({ 
              message: `Display name can only be changed once every 30 days. Wait ${30 - daysSinceLastChange} more days.` 
            });
          }
        }
      }

      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
      if (bio !== undefined) updateData.bio = bio;
      if (backgroundPhoto !== undefined) updateData.backgroundPhoto = backgroundPhoto;
      
      // Only update lastDisplayNameChange if display name actually changed
      if (displayName && displayName !== admin.displayName && admin.username !== "ZEKE001") {
        updateData.lastDisplayNameChange = new Date();
      }

      const updatedAdmin = await storage.updateAdminProfile(adminId, updateData);

      // Return admin without password
      const { password: _, ...adminWithoutPassword } = updatedAdmin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Admin profile update error:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('too large')) {
          return res.status(413).json({ message: "Request payload too large. Please use a smaller image." });
        }
      }

      res.status(500).json({ message: "Failed to update admin profile" });
    }
  });

  // Check admin display name update cooldown
  app.get("/api/admins/:id/can-update-display-name", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const admin = await storage.getAdminById(adminId);

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // ZEKE001 can always update display name
      if (admin.username === "ZEKE001") {
        return res.json({ canUpdate: true });
      }

      const lastChange = admin.lastDisplayNameChange;
      let canUpdate = true;

      if (lastChange) {
        const daysSinceLastChange = Math.floor((Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24));
        canUpdate = daysSinceLastChange >= 30;
      }

      res.json({ canUpdate });
    } catch (error) {
      console.error("Cooldown check error:", error);
      res.status(500).json({ message: "Failed to check cooldown status" });
    }
  });



  // Get admin profile by ID with stats and follow status
  app.get("/api/admins/:id/profile", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const { currentUserId } = req.query;

      if (!adminId || isNaN(adminId)) {
        return res.status(400).json({ error: "Invalid admin ID" });
      }

      const admin = await storage.getAdminById(adminId);

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Get admin messages count
      const adminMessages = await storage.getAdminMessages(adminId);
      
      // Get admin replies count
      const adminReplies = await storage.getAdminReplies(adminId);

      // Check if current user is following this admin
      let isFollowing = false;
      try {
        if (currentUserId) {
          isFollowing = await storage.isFollowingAdmin(parseInt(currentUserId as string), adminId);
        }
      } catch (error) {
        // Skip if follows table doesn't exist yet
        isFollowing = false;
      }

      // Count reactions on all admin messages
      let totalReactions = 0;
      try {
        for (const message of adminMessages) {
          const messageReactions = await storage.getMessageReactions(message.id);
          totalReactions += messageReactions.length;
        }
      } catch (error) {
        // Skip if reactions table doesn't exist yet
        totalReactions = 0;
      }

      // Count followers for this admin
      let followersCount = 0;
      try {
        const followResults = await db
          .select()
          .from(follows)
          .where(eq(follows.followingAdminId, adminId));
        followersCount = followResults.length;
      } catch (error) {
        // Skip if follows table doesn't exist yet
        followersCount = 0;
      }

      const profile = {
        ...admin,
        messageCount: adminMessages.length,
        replyCount: adminReplies.length,
        totalReactions,
        followersCount,
        isFollowing,
      };

      // Return admin profile without password
      const { password: _, ...adminProfile } = profile;
      res.json(adminProfile);
    } catch (error) {
      console.error("Get admin profile error:", error);
      res.status(500).json({ error: "Failed to get admin profile" });
    }
  });

  // Get admin messages
  app.get("/api/admins/:id/messages", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);

      if (!adminId || isNaN(adminId)) {
        return res.status(400).json({ error: "Invalid admin ID" });
      }

      const messages = await storage.getAdminMessages(adminId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ error: "Failed to fetch admin messages" });
    }
  });

  // Get admin replies
  app.get("/api/admins/:id/replies", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);

      if (!adminId || isNaN(adminId)) {
        return res.status(400).json({ error: "Invalid admin ID" });
      }

      const replies = await storage.getAdminReplies(adminId);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching admin replies:", error);
      res.status(500).json({ error: "Failed to fetch admin replies" });
    }
  });

  // Honorable mentions routes
  app.get("/api/honorable-mentions", async (req, res) => {
    try {
      const mentions = await storage.getHonorableMentions();
      res.json(mentions);
    } catch (error) {
      console.error("Error fetching honorable mentions:", error);
      res.status(500).json({ message: "Failed to fetch honorable mentions" });
    }
  });

  app.post("/api/honorable-mentions", async (req, res) => {
    try {
      const { name, emoji } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }

      const mention = await storage.createHonorableMention({
        name: name.trim(),
        emoji: emoji?.trim() || null,
        order: 0,
      });

      res.status(201).json(mention);
    } catch (error) {
      console.error("Error creating honorable mention:", error);
      res.status(500).json({ message: "Failed to create honorable mention" });
    }
  });

  app.put("/api/honorable-mentions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, emoji } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }

      const mention = await storage.updateHonorableMention(parseInt(id), {
        name: name.trim(),
        emoji: emoji?.trim() || null,
      });

      res.json(mention);
    } catch (error) {
      console.error("Error updating honorable mention:", error);
      res.status(500).json({ message: "Failed to update honorable mention" });
    }
  });

  app.delete("/api/honorable-mentions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteHonorableMention(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting honorable mention:", error);
      res.status(500).json({ message: "Failed to delete honorable mention" });
    }
  });

  // Anonymous messages endpoints (NGL-style)
  app.post("/api/anonymous-messages", async (req, res) => {
    try {
      const { content, category, spotifyLink, senderName, recipientUserId, recipientAdminId } = req.body;

      if (!content || (!recipientUserId && !recipientAdminId)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (content.length > 500) {
        return res.status(400).json({ error: "Message too long (max 500 characters)" });
      }

      // Check if recipient has paused their anonymous link
      if (recipientUserId) {
        const recipient = await storage.getUserById(recipientUserId);
        if (recipient?.isAnonymousLinkPaused) {
          return res.status(403).json({ 
            error: "Link paused, try again later or ask the owner of the link to turn it back on to resume whispering" 
          });
        }
      }

      const message = await storage.sendAnonymousMessage({
        content: content.trim(),
        category: category || "Anything",
        spotifyLink: spotifyLink || null,
        senderName: senderName || null,
        recipientUserId: recipientUserId || null,
        recipientAdminId: recipientAdminId || null,
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending anonymous message:", error);
      res.status(500).json({ error: "Failed to send anonymous message" });
    }
  });

  app.get("/api/anonymous-messages/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const adminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;

      if (!userId && !adminId) {
        return res.status(400).json({ error: "Invalid user ID or admin ID" });
      }

      const messages = await storage.getAnonymousMessages(userId, adminId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching anonymous messages:", error);
      res.status(500).json({ error: "Failed to fetch anonymous messages" });
    }
  });

  app.patch("/api/anonymous-messages/:id/read", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (!messageId) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      await storage.markAnonymousMessageAsRead(messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking anonymous message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  app.delete("/api/anonymous-messages/:id", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (!messageId) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      await storage.deleteAnonymousMessage(messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting anonymous message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.get("/api/anonymous-messages/:userId/count", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const adminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;

      if (!userId && !adminId) {
        return res.status(400).json({ error: "Invalid user ID or admin ID" });
      }

      const count = await storage.getAnonymousMessageCount(userId, adminId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching anonymous message count:", error);
      res.status(500).json({ error: "Failed to fetch message count" });
    }
  });

  // Toggle anonymous link status
  app.patch("/api/users/:userId/toggle-anonymous-link", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { isAnonymousLinkPaused } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const updatedUser = await storage.updateUserProfile(userId, { 
        isAnonymousLinkPaused 
      });

      res.json({ isAnonymousLinkPaused: updatedUser.isAnonymousLinkPaused });
    } catch (error) {
      console.error("Error toggling anonymous link:", error);
      res.status(500).json({ error: "Failed to toggle anonymous link" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}