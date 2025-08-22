import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { spotifyAPI } from "./spotify";
import { generateUserProfileOG, generateUserBoardOG, generateMessageOG, generateAnonymousLinkOG, generateLandingPageOG, generateDashboardOG, generateLeaderboardOG, generatePersonalArchiveOG, generateAdminDashboardOG, generateAdminProfileOG, generateHomePageOG, generatePasswordManagementOG } from "./dynamic-meta";
import { insertMessageSchema, insertReplySchema, insertAdminSchema, insertUserSchema, insertReactionSchema, insertNotificationSchema, insertFollowSchema, follows, changePasswordSchema, adminChangePasswordSchema, viewAllPasswordsSchema, insertUserMusicSchema, insertDashboardMessageSchema, insertAdminAnnouncementSchema } from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";

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

  // File upload configuration
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Announcement photo upload configuration
  const announcementUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for announcements
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

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
      
      // Store original password for ZEKE001 viewing
      await storage.storeOriginalPassword(user.id, null, password);

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
      if (!admin || !await comparePasswords(password, admin.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!admin.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }

      // Return admin without password
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

      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Username, password, and display name are required" });
      }

      // Check if admin already exists
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin username already exists" });
      }

      // Hash password for new admin accounts
      const hashedPassword = await hashPassword(password);

      const admin = await storage.createAdmin({
        username,
        password: hashedPassword,
        displayName,
        role: role || "admin",
        isActive: true,
      });

      // Store original password for ZEKE001 viewing
      if (password) {
        await storage.storeOriginalPassword(0, admin.id, password);
      }

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
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  app.get("/api/admin/passwords", async (req, res) => {
    try {
      // Get all users with their passwords (hashed)
      const users = await storage.getAllUsersWithPasswords();
      const admins = await storage.getAllAdminsWithPasswords();

      console.log("Retrieved users for password view:", users.length);
      console.log("Retrieved admins for password view:", admins.length);

      const responseData = {
        message: "Password data retrieved successfully",
        users: await Promise.all(users.map(async user => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          hashedPassword: user.password,
          unhashed: await storage.getOriginalPassword(user.id, null),
          createdAt: user.createdAt
        }))),
        admins: await Promise.all(admins.map(async admin => ({
          id: admin.id,
          username: admin.username,
          displayName: admin.displayName,
          hashedPassword: admin.password,
          unhashed: await storage.getOriginalPassword(0, admin.id),
          createdAt: admin.createdAt
        })))
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching user passwords:", error);
      res.status(500).json({ message: "Failed to fetch user passwords" });
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

  // Generate dynamic meta tags for social sharing
  app.get("/api/meta/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const meta = generateUserProfileOG(user);
      res.json(meta);
    } catch (error) {
      console.error("Error generating user meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/board/:username", async (req, res) => {
    try {
      const { username } = req.params;
      let user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Try admin
        const admin = await storage.getAdminByUsername(username);
        if (!admin) {
          return res.status(404).json({ error: "User not found" });
        }
        user = admin;
      }

      const meta = generateUserBoardOG(user);
      res.json(meta);
    } catch (error) {
      console.error("Error generating board meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/message/:id", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessageById(messageId);
      
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      const meta = generateMessageOG({
        id: message.id,
        content: message.content,
        senderName: message.senderName || "Anonymous",
        category: message.category || "General"
      });
      res.json(meta);
    } catch (error) {
      console.error("Error generating message meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/anonymous/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const meta = generateAnonymousLinkOG(username);
      res.json(meta);
    } catch (error) {
      console.error("Error generating anonymous meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/landing", async (req, res) => {
    try {
      const meta = generateLandingPageOG();
      res.json(meta);
    } catch (error) {
      console.error("Error generating landing meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/dashboard", async (req, res) => {
    try {
      const meta = generateDashboardOG();
      res.json(meta);
    } catch (error) {
      console.error("Error generating dashboard meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/leaderboard", async (req, res) => {
    try {
      const meta = generateLeaderboardOG();
      res.json(meta);
    } catch (error) {
      console.error("Error generating leaderboard meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/personal", async (req, res) => {
    try {
      const meta = generatePersonalArchiveOG();
      res.json(meta);
    } catch (error) {
      console.error("Error generating personal archive meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/admin", async (req, res) => {
    try {
      const meta = generateAdminDashboardOG();
      res.json(meta);
    } catch (error) {
      console.error("Error generating admin dashboard meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/admin/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const meta = generateAdminProfileOG(admin);
      res.json(meta);
    } catch (error) {
      console.error("Error generating admin profile meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/home", async (req, res) => {
    try {
      const meta = generateHomePageOG();
      res.json(meta);
    } catch (error) {
      console.error("Error generating home meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  app.get("/api/meta/password-management", async (req, res) => {
    try {
      const meta = generatePasswordManagementOG();
      res.json(meta);
    } catch (error) {
      console.error("Error generating password management meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
    }
  });

  // Add generic meta generation for any route
  app.get("/api/meta/generate", async (req, res) => {
    try {
      const { path, title, description } = req.query;
      
      let meta;
      
      if (typeof path === 'string') {
        if (path.startsWith('/user/')) {
          const username = path.split('/')[2];
          if (username) {
            const user = await storage.getUserByUsername(username);
            if (user) {
              meta = generateUserProfileOG(user);
            }
          }
        } else if (path.startsWith('/board/')) {
          const username = path.split('/')[2];
          if (username) {
            let user = await storage.getUserByUsername(username);
            if (!user) {
              user = await storage.getAdminByUsername(username);
            }
            if (user) {
              meta = generateUserBoardOG(user);
            }
          }
        } else if (path.startsWith('/admin/')) {
          const username = path.split('/')[2];
          if (username) {
            const admin = await storage.getAdminByUsername(username);
            if (admin) {
              meta = generateAdminProfileOG(admin);
            }
          } else {
            meta = generateAdminDashboardOG();
          }
        } else if (path.startsWith('/anonymous/')) {
          const username = path.split('/')[2];
          if (username) {
            meta = generateAnonymousLinkOG(username);
          }
        } else if (path === '/dashboard') {
          meta = generateDashboardOG();
        } else if (path === '/leaderboard') {
          meta = generateLeaderboardOG();
        } else if (path === '/personal') {
          meta = generatePersonalArchiveOG();
        } else if (path === '/home') {
          meta = generateHomePageOG();
        } else if (path === '/password-management') {
          meta = generatePasswordManagementOG();
        } else if (path === '/') {
          meta = generateLandingPageOG();
        }
      }

      if (!meta) {
        meta = {
          title: (title as string) || 'Whisper Network',
          description: (description as string) || 'Anonymous messaging platform for authentic conversations',
          image: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent((title as string) || 'Whisper Network')}&backgroundColor=3b82f6&fontSize=40`,
          url: path || '/'
        };
      }

      res.json(meta);
    } catch (error) {
      console.error("Error generating generic meta:", error);
      res.status(500).json({ error: "Failed to generate meta tags" });
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

  // Delete message (admin/owner/board owner only)
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminUsername, userId, boardOwnerId } = req.body;

      // Get the message first to check ownership
      const message = await storage.getMessageById(parseInt(id));
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Allow deletion if:
      // 1. User is ZEKE001 (main admin - can delete any message)
      // 2. Message belongs to the requesting admin
      // 3. Message belongs to the requesting user
      // 4. Message is on the user's board (anonymous messages to user)
      let canDelete = false;

      if (adminUsername === "ZEKE001") {
        canDelete = true;
      } else if (message.adminId && adminUsername) {
        const admin = await storage.getAdminByUsername(adminUsername);
        canDelete = (admin && message.adminId === admin.id) || false;
      } else if (message.userId && userId) {
        canDelete = message.userId === parseInt(userId);
      } else if (boardOwnerId && message.recipient) {
        // Check if this is an anonymous message to the board owner
        const boardOwner = await storage.getUserById(parseInt(boardOwnerId));
        canDelete = (boardOwner && message.recipient === boardOwner.username) || false;
      }

      if (!canDelete) {
        return res.status(403).json({ message: "You can only delete your own messages, messages on your board, or have admin privileges" });
      }

      await storage.deleteMessage(parseInt(id));
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Report message endpoint
  app.post("/api/reports/message", async (req, res) => {
    try {
      const { messageId, reason, reporterId, reporterType } = req.body;

      if (!messageId || !reason || !reporterId || !reporterType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get the message being reported
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Get reporter info
      let reporterName = "Anonymous";
      if (reporterType === "user") {
        const reporter = await storage.getUserById(reporterId);
        reporterName = reporter?.displayName || reporter?.username || "Unknown User";
      } else if (reporterType === "admin") {
        const reporter = await storage.getAdminById(reporterId);
        reporterName = reporter?.displayName || "Unknown Admin";
      }

      // Create notifications for all admins
      const admins = await storage.getAllAdmins();
      for (const admin of admins) {
        if (admin.isActive) {
          await storage.createNotification({
            adminId: admin.id,
            type: "report",
            messageId: messageId,
            content: `${reporterName} reported a message: "${reason}" - Message: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`,
            isRead: false,
          });
        }
      }

      res.json({ message: "Report submitted successfully" });
    } catch (error) {
      console.error("Error submitting message report:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // Report user account endpoint
  app.post("/api/reports/user", async (req, res) => {
    try {
      const { targetUserId, targetAdminId, reason, reporterId, reporterType } = req.body;

      if ((!targetUserId && !targetAdminId) || !reason || !reporterId || !reporterType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get the user/admin being reported
      let targetName = "Unknown";
      if (targetUserId) {
        const targetUser = await storage.getUserById(targetUserId);
        targetName = targetUser?.displayName || targetUser?.username || "Unknown User";
      } else if (targetAdminId) {
        const targetAdmin = await storage.getAdminById(targetAdminId);
        targetName = targetAdmin?.displayName || "Unknown Admin";
      }

      // Get reporter info
      let reporterName = "Anonymous";
      if (reporterType === "user") {
        const reporter = await storage.getUserById(reporterId);
        reporterName = reporter?.displayName || reporter?.username || "Unknown User";
      } else if (reporterType === "admin") {
        const reporter = await storage.getAdminById(reporterId);
        reporterName = reporter?.displayName || "Unknown Admin";
      }

      // Create notifications for all admins
      const admins = await storage.getAllAdmins();
      for (const admin of admins) {
        if (admin.isActive) {
          await storage.createNotification({
            adminId: admin.id,
            type: "report",
            content: `${reporterName} reported ${targetUserId ? 'user' : 'admin'} "${targetName}": "${reason}"`,
            isRead: false,
          });
        }
      }

      res.json({ message: "Report submitted successfully" });
    } catch (error) {
      console.error("Error submitting user report:", error);
      res.status(500).json({ message: "Failed to submit report" });
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

  // Password management routes
  app.post("/api/users/:id/change-password", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = changePasswordSchema.parse(req.body);

      const user = await storage.getUserById(parseInt(id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePasswords(validatedData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await hashPassword(validatedData.newPassword);
      await storage.updateUserPassword(parseInt(id), hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid password data", errors: error.errors });
        return;
      }
      console.error("Error changing user password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/admins/:id/change-password", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = adminChangePasswordSchema.parse(req.body);

      const admin = await storage.getAdminById(parseInt(id));
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Skip current password verification for ZEKE001
      if (admin.username !== "ZEKE001" && validatedData.currentPassword) {
        const isCurrentPasswordValid = await comparePasswords(validatedData.currentPassword, admin.password!);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      // Hash new password and update
      const hashedNewPassword = await hashPassword(validatedData.newPassword);
      await storage.updateAdminPassword(parseInt(id), hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid password data", errors: error.errors });
        return;
      }
      console.error("Error changing admin password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/admin/view-all-passwords", async (req, res) => {
    try {
      const validatedData = viewAllPasswordsSchema.parse(req.body);

      if (validatedData.adminUsername !== "ZEKE001") {
        return res.status(403).json({ message: "Only ZEKE001 can access this feature" });
      }

      const users = await storage.getAllUsersWithPasswords();
      const admins = await storage.getAllAdminsWithPasswords();

      console.log("Retrieved users for ZEKE001:", users.length);
      console.log("Retrieved admins for ZEKE001:", admins.length);

      const responseData = {
        message: "Password data retrieved successfully",
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          hashedPassword: user.password,
          createdAt: user.createdAt
        })),
        admins: admins.map(admin => ({
          id: admin.id,
          username: admin.username,
          displayName: admin.displayName,
          hashedPassword: admin.password,
          createdAt: admin.createdAt
        }))
      };

      console.log("Sending password data response:", responseData);
      res.json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
        return;
      }
      console.error("Error viewing all passwords:", error);
      res.status(500).json({ message: "Failed to retrieve password data" });
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

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboardData = await storage.getLeaderboardData();
      res.json(leaderboardData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard data" });
    }
  });

  app.get("/api/leaderboard/my-ranking", async (req, res) => {
    try {
      // Note: session middleware would need to be set up for this to work
      // For now, we'll need to get userId from request body or headers
      const userId = req.body.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userRanking = await storage.getUserRanking(userId);
      res.json(userRanking);
    } catch (error) {
      console.error("Error fetching user ranking:", error);
      res.status(500).json({ error: "Failed to fetch user ranking" });
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

      // Set default board name if creating board for first time
      if (updates.allowBoardCreation && !updates.boardName) {
        const user = await storage.getUserById(parseInt(userId));
        updates.boardName = `${user?.displayName || user?.username}'s Board`;
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

  // Password management routes
  // Change user password
  app.post("/api/users/:id/change-password", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const validatedData = changePasswordSchema.parse(req.body);

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePasswords(validatedData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash and update new password
      const hashedNewPassword = await hashPassword(validatedData.newPassword);
      await storage.updateUserPassword(userId, hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error changing user password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Change admin password
  app.post("/api/admins/:id/change-password", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const validatedData = adminChangePasswordSchema.parse(req.body);

      const admin = await storage.getAdminById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Skip current password verification for ZEKE001
      if (admin.username !== "ZEKE001" && validatedData.currentPassword) {
        const isCurrentPasswordValid = await comparePasswords(validatedData.currentPassword, admin.password!);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      // Hash new password and update for all admins (including ZEKE001)
      const hashedNewPassword = await hashPassword(validatedData.newPassword);
      await storage.updateAdminPassword(adminId, hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid password data", errors: error.errors });
        return;
      }
      console.error("Error changing admin password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // ZEKE001 special privilege: View all user passwords
  app.post("/api/admin/view-all-passwords", async (req, res) => {
    try {
      const validatedData = viewAllPasswordsSchema.parse(req.body);

      // Only ZEKE001 can access this endpoint
      if (validatedData.adminUsername !== "ZEKE001") {
        return res.status(403).json({ message: "Access denied. Only ZEKE001 can access this feature." });
      }

      // Get all users with their passwords (hashed)
      const users = await storage.getAllUsersWithPasswords();
      const admins = await storage.getAllAdminsWithPasswords();

      console.log("Retrieved users for ZEKE001:", users.length);
      console.log("Retrieved admins for ZEKE001:", admins.length);

      const responseData = {
        message: "Password data retrieved successfully",
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          hashedPassword: user.password,
          createdAt: user.createdAt
        })),
        admins: admins.map(admin => ({
          id: admin.id,
          username: admin.username,
          displayName: admin.displayName,
          hashedPassword: admin.password,
          createdAt: admin.createdAt
        }))
      };

      console.log("Sending password data response:", responseData);
      res.json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("Error retrieving password data:", error);
      res.status(500).json({ message: "Failed to retrieve password data" });
    }
  });

  // Spotify API routes
  app.get("/api/spotify/search", async (req, res) => {
    try {
      const { q, limit = "20" } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      const tracks = await spotifyAPI.searchTracks(q, parseInt(limit as string));
      res.json({ tracks });
    } catch (error) {
      console.error("Spotify search error:", error);
      res.status(500).json({ message: "Failed to search Spotify tracks" });
    }
  });

  app.get("/api/spotify/track/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const track = await spotifyAPI.getTrack(id);

      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }

      res.json(track);
    } catch (error) {
      console.error("Get Spotify track error:", error);
      res.status(500).json({ message: "Failed to get track details" });
    }
  });

  // Update user profile song
  app.patch("/api/users/:id/spotify", async (req, res) => {
    try {
      const { id } = req.params;
      const { spotifyTrackId, spotifyTrackName, spotifyArtistName, spotifyAlbumCover } = req.body;

      const userId = parseInt(id);

      // Validate that the user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user's Spotify track info
      const updatedUser = await storage.updateUserSpotifyTrack(userId, {
        spotifyTrackId,
        spotifyTrackName,
        spotifyArtistName,
        spotifyAlbumCover,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Update user Spotify track error:", error);
      res.status(500).json({ message: "Failed to update profile song" });
    }
  });

  // Update admin profile song
  app.patch("/api/admins/:id/spotify", async (req, res) => {
    try {
      const { id } = req.params;
      const { spotifyTrackId, spotifyTrackName, spotifyArtistName, spotifyAlbumCover } = req.body;

      const adminId = parseInt(id);

      // Validate that the admin exists
      const admin = await storage.getAdminById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Update admin's Spotify track info
      const updatedAdmin = await storage.updateAdminSpotifyTrack(adminId, {
        spotifyTrackId,
        spotifyTrackName,
        spotifyArtistName,
        spotifyAlbumCover,
      });

      res.json(updatedAdmin);
    } catch (error) {
      console.error("Update admin Spotify track error:", error);
      res.status(500).json({ message: "Failed to update profile song" });
    }
  });

  // Spotify audio proxy for CORS issues
  app.get("/api/spotify/proxy/:url", async (req, res) => {
    try {
      const audioUrl = decodeURIComponent(req.params.url);
      
      // Validate it's a Spotify preview URL
      if (!audioUrl.includes('p.scdn.co')) {
        return res.status(400).json({ message: "Invalid audio URL" });
      }

      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      // Set appropriate headers
      res.set({
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=86400'
      });

      // Stream the audio data
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Spotify proxy error:", error);
      res.status(500).json({ message: "Failed to proxy audio" });
    }
  });

  // User Music List Routes
  app.post("/api/users/:id/music", async (req, res) => {
    try {
      const { id } = req.params;
      const { spotifyTrackId, spotifyTrackName, spotifyArtistName, spotifyAlbumCover } = req.body;

      const userId = parseInt(id);

      // Validate that the user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Add to music list
      const music = await storage.addToMusicList(userId, undefined, {
        spotifyTrackId,
        spotifyTrackName,
        spotifyArtistName,
        spotifyAlbumCover,
      });

      res.json(music);
    } catch (error) {
      console.error("Add music to list error:", error);
      res.status(500).json({ message: "Failed to add music to list" });
    }
  });

  app.post("/api/admins/:id/music", async (req, res) => {
    try {
      const { id } = req.params;
      const { spotifyTrackId, spotifyTrackName, spotifyArtistName, spotifyAlbumCover } = req.body;

      const adminId = parseInt(id);

      // Validate that the admin exists
      const admin = await storage.getAdminById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Add to music list
      const music = await storage.addToMusicList(0, adminId, {
        spotifyTrackId,
        spotifyTrackName,
        spotifyArtistName,
        spotifyAlbumCover,
      });

      res.json(music);
    } catch (error) {
      console.error("Add music to admin list error:", error);
      res.status(500).json({ message: "Failed to add music to list" });
    }
  });

  app.get("/api/users/:id/music", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const musicList = await storage.getUserMusicList(userId);
      res.json(musicList);
    } catch (error) {
      console.error("Get user music list error:", error);
      res.status(500).json({ message: "Failed to get music list" });
    }
  });

  app.get("/api/admins/:id/music", async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = parseInt(id);

      const musicList = await storage.getUserMusicList(0, adminId);
      res.json(musicList);
    } catch (error) {
      console.error("Get admin music list error:", error);
      res.status(500).json({ message: "Failed to get music list" });
    }
  });

  app.delete("/api/music/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const musicId = parseInt(id);

      await storage.removeFromMusicList(musicId);
      res.json({ message: "Music removed from list" });
    } catch (error) {
      console.error("Remove music from list error:", error);
      res.status(500).json({ message: "Failed to remove music from list" });
    }
  });

  app.patch("/api/music/:id/favorite", async (req, res) => {
    try {
      const { id } = req.params;
      const musicId = parseInt(id);

      const updatedMusic = await storage.setFavoriteTrack(musicId);
      res.json(updatedMusic);
    } catch (error) {
      console.error("Set favorite track error:", error);
      res.status(500).json({ message: "Failed to set favorite track" });
    }
  });

  // Dashboard Message Routes
  app.post("/api/dashboard/messages", async (req, res) => {
    try {
      const messageData = insertDashboardMessageSchema.parse(req.body);
      const message = await storage.createDashboardMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("Create dashboard message error:", error);
      res.status(500).json({ message: "Failed to create dashboard message" });
    }
  });

  app.get("/api/users/:id/dashboard", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const messages = await storage.getUserDashboardMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Get user dashboard messages error:", error);
      res.status(500).json({ message: "Failed to get dashboard messages" });
    }
  });

  app.get("/api/admins/:id/dashboard", async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = parseInt(id);

      const messages = await storage.getUserDashboardMessages(0, adminId);
      res.json(messages);
    } catch (error) {
      console.error("Get admin dashboard messages error:", error);
      res.status(500).json({ message: "Failed to get dashboard messages" });
    }
  });

  app.delete("/api/dashboard/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);

      await storage.deleteDashboardMessage(messageId);
      res.json({ message: "Dashboard message deleted" });
    } catch (error) {
      console.error("Delete dashboard message error:", error);
      res.status(500).json({ message: "Failed to delete dashboard message" });
    }
  });

  app.patch("/api/dashboard/messages/:id/pin", async (req, res) => {
    try {
      const { id } = req.params;
      const { isPinned } = req.body;
      const messageId = parseInt(id);

      const message = await storage.pinDashboardMessage(messageId, isPinned);
      res.json(message);
    } catch (error) {
      console.error("Pin dashboard message error:", error);
      res.status(500).json({ message: "Failed to pin dashboard message" });
    }
  });

  // Admin Announcements Routes
  app.post("/api/admin/announcements", async (req, res) => {
    try {
      const announcementData = insertAdminAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAdminAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("Create admin announcement error:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.get("/api/admin/announcements", async (req, res) => {
    try {
      const announcements = await storage.getAllAdminAnnouncements();

      // Enhance announcements with author information
      const announcementsWithAuthors = await Promise.all(
        announcements.map(async (announcement) => {
          let author = null;
          if (announcement.authorAdminId) {
            author = await storage.getAdminById(announcement.authorAdminId);
            if (author) {
              const { password, ...authorWithoutPassword } = author;
              author = authorWithoutPassword;
            }
          }
          return {
            ...announcement,
            author,
          };
        })
      );

      res.json(announcementsWithAuthors);
    } catch (error) {
      console.error("Get admin announcements error:", error);
      res.status(500).json({ message: "Failed to get announcements" });
    }
  });

  app.delete("/api/admin/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const announcementId = parseInt(id);

      await storage.deleteAdminAnnouncement(announcementId);
      res.json({ message: "Announcement deleted" });
    } catch (error) {
      console.error("Delete admin announcement error:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  app.patch("/api/admin/announcements/:id/pin", async (req, res) => {
    try {
      const { id } = req.params;
      const { isPinned } = req.body;
      const announcementId = parseInt(id);

      const announcement = await storage.pinAdminAnnouncement(announcementId, isPinned);
      res.json(announcement);
    } catch (error) {
      console.error("Pin admin announcement error:", error);
      res.status(500).json({ message: "Failed to pin announcement" });
    }
  });

  // Upload announcement photo
  app.post("/api/upload/announcement", announcementUpload.single("photo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const adminId = req.headers['x-admin-id'] as string;
      if (!adminId || !parseInt(adminId)) {
        return res.status(401).json({ message: "Admin not authenticated" });
      }

      // Check file size and type
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "File size too large. Maximum 5MB allowed." });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." });
      }

      // Convert to base64 for storage
      const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      res.json({ url: base64String });
    } catch (error) {
      console.error("Announcement upload error:", error);
      res.status(500).json({ message: "Failed to upload announcement photo" });
    }
  });

  // Boards endpoints
  app.get("/api/boards/all", async (req, res) => {
    try {
      const boards = await storage.getAllBoardsWithMessageCounts();
      res.json(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.post("/api/reports/board", async (req, res) => {
    try {
      const { targetUserId, targetAdminId, reason, reporterId, reporterType } = req.body;
      
      const report = await storage.createBoardReport({
        targetUserId: targetUserId || null,
        targetAdminId: targetAdminId || null,
        reason,
        reporterId,
        reporterType
      });

      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating board report:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  app.delete("/api/users/:id/board", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUserBoard(parseInt(id));
      res.json({ success: true, message: "User board deleted successfully" });
    } catch (error) {
      console.error("Error deleting user board:", error);
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  app.delete("/api/admins/:id/board", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdminBoard(parseInt(id));
      res.json({ success: true, message: "Admin board deleted successfully" });
    } catch (error) {
      console.error("Error deleting admin board:", error);
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  // OG Image generation endpoints
  app.get("/api/og-image/board/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Generate SVG image for board sharing
      const boardName = user.boardName || `${user.displayName || user.username}'s Board`;
      const displayName = user.displayName || user.username;
      const boardBanner = user.boardBanner || user.backgroundPhoto;
      const profilePic = user.boardProfilePicture || user.profilePicture;
      
      const svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          ${boardBanner ? `<image href="${boardBanner}" width="1200" height="630" style="object-fit:cover;opacity:0.3"/>` : ''}
          <rect width="1200" height="630" fill="${boardBanner ? 'rgba(0,0,0,0.4)' : 'url(#bg)'}"/>
          
          <rect x="60" y="180" width="1080" height="270" rx="20" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.1)"/>
          
          ${profilePic ? `<circle cx="180" cy="240" r="40" fill="white"/><image href="${profilePic}" x="140" y="200" width="80" height="80" style="border-radius:50%;object-fit:cover;clip-path:circle(40px)"/>` : `<circle cx="180" cy="240" r="40" fill="#667eea"/><text x="180" y="250" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${displayName.charAt(0).toUpperCase()}</text>`}
          
          <text x="250" y="220" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1f2937">Post a message to</text>
          <text x="250" y="260" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#4f46e5">"${boardName}"</text>
          <text x="250" y="300" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">by @${username}</text>
          
          <text x="60" y="510" font-family="Arial, sans-serif" font-size="20" fill="#9ca3af">Share your thoughts anonymously</text>
          <text x="60" y="540" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#667eea">Whisper Network</text>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } catch (error) {
      console.error('Error generating board OG image:', error);
      res.status(500).send("Error generating image");
    }
  });

  app.get("/api/og-image/anonymous/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      const displayName = user.displayName || user.username;
      const profilePic = user.profilePicture;
      
      const svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="anonBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#7c2d12;stop-opacity:1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect width="1200" height="630" fill="url(#anonBg)"/>
          
          <!-- Decorative elements -->
          <circle cx="100" cy="100" r="60" fill="rgba(255,255,255,0.1)"/>
          <circle cx="1100" cy="530" r="80" fill="rgba(255,255,255,0.1)"/>
          <rect x="200" y="400" width="40" height="40" rx="8" fill="rgba(255,255,255,0.1)" transform="rotate(45 220 420)"/>
          
          <rect x="150" y="140" width="900" height="350" rx="30" fill="rgba(255,255,255,0.95)" filter="url(#glow)"/>
          
          <text x="600" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#dc2626">📤 Send Anonymous Message</text>
          
          ${profilePic ? `<circle cx="450" cy="280" r="35" fill="white"/><image href="${profilePic}" x="415" y="245" width="70" height="70" style="border-radius:50%;object-fit:cover;clip-path:circle(35px)"/>` : `<circle cx="450" cy="280" r="35" fill="#dc2626"/><text x="450" y="290" text-anchor="middle" fill="white" font-size="20" font-weight="bold">${displayName.charAt(0).toUpperCase()}</text>`}
          
          <text x="520" y="270" font-family="Arial, sans-serif" font-size="28" fill="#1f2937">to</text>
          <text x="520" y="300" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#dc2626">${displayName}</text>
          
          <text x="600" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">Your identity will remain completely hidden</text>
          <text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#dc2626">🤫 Anonymous • Safe • Private</text>
          
          <text x="600" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">Whisper Network</text>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } catch (error) {
      console.error('Error generating anonymous OG image:', error);
      res.status(500).send("Error generating image");
    }
  });

  // Additional OG Image endpoints for other pages
  app.get("/api/og-image/landing", async (req, res) => {
    try {
      const svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="landingBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <rect width="1200" height="630" fill="url(#landingBg)"/>
          
          <!-- Decorative elements -->
          <circle cx="150" cy="120" r="80" fill="rgba(255,255,255,0.1)"/>
          <circle cx="1050" cy="510" r="100" fill="rgba(255,255,255,0.1)"/>
          
          <rect x="200" y="150" width="800" height="330" rx="40" fill="rgba(255,255,255,0.95)"/>
          
          <text x="600" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#1e40af">Whisper Network</text>
          <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">Anonymous Messaging Platform</text>
          <text x="600" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#374151">Connect anonymously and share your thoughts</text>
          <text x="600" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#374151">A safe space for authentic conversations</text>
          
          <text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#3b82f6">🤫 Anonymous • 💬 Safe • 🌟 Authentic</text>
          
          <text x="600" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">Join the conversation today</text>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } catch (error) {
      console.error('Error generating landing OG image:', error);
      res.status(500).send("Error generating image");
    }
  });

  app.get("/api/og-image/dashboard", async (req, res) => {
    try {
      const svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dashBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <rect width="1200" height="630" fill="url(#dashBg)"/>
          
          <!-- Message cards illustration -->
          <rect x="100" y="100" width="300" height="120" rx="15" fill="rgba(255,255,255,0.9)"/>
          <rect x="120" y="120" width="260" height="8" rx="4" fill="#d1d5db"/>
          <rect x="120" y="140" width="200" height="8" rx="4" fill="#d1d5db"/>
          <rect x="120" y="160" width="180" height="8" rx="4" fill="#d1d5db"/>
          <circle cx="380" cy="140" r="15" fill="#ef4444"/>
          
          <rect x="450" y="120" width="300" height="120" rx="15" fill="rgba(255,255,255,0.9)"/>
          <rect x="470" y="140" width="260" height="8" rx="4" fill="#d1d5db"/>
          <rect x="470" y="160" width="220" height="8" rx="4" fill="#d1d5db"/>
          <rect x="470" y="180" width="160" height="8" rx="4" fill="#d1d5db"/>
          <circle cx="730" cy="160" r="15" fill="#ef4444"/>
          
          <rect x="800" y="100" width="300" height="120" rx="15" fill="rgba(255,255,255,0.9)"/>
          <rect x="820" y="120" width="260" height="8" rx="4" fill="#d1d5db"/>
          <rect x="820" y="140" width="240" height="8" rx="4" fill="#d1d5db"/>
          <rect x="820" y="160" width="140" height="8" rx="4" fill="#d1d5db"/>
          <circle cx="1080" cy="140" r="15" fill="#ef4444"/>
          
          <rect x="200" y="300" width="800" height="200" rx="30" fill="rgba(255,255,255,0.95)"/>
          
          <text x="600" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#047857">Community Dashboard</text>
          <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#6b7280">Discover messages from the community</text>
          <text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">A place where voices unite and hearts connect</text>
          
          <text x="600" y="460" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#059669">💬 Share • ❤️ Connect • 🌟 Discover</text>
          
          <text x="600" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">Whisper Network</text>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } catch (error) {
      console.error('Error generating dashboard OG image:', error);
      res.status(500).send("Error generating image");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}