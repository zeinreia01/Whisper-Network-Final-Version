import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts for anonymous senders
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"), // User's display name (can be changed with cooldown)
  profilePicture: text("profile_picture"), // URL or path to profile picture
  backgroundPhoto: text("background_photo"), // URL or path to background profile photo
  bio: text("bio"), // User's bio/description (200 character limit)
  lastDisplayNameChange: timestamp("last_display_name_change"), // Track last change for 30-day cooldown
  isVerified: boolean("is_verified").default(false), // Verified badge (only ZEKE001 can grant)
  likedMessagesPrivacy: text("liked_messages_privacy").default("private"), // "public" or "private"
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  spotifyLink: text("spotify_link"),
  isPublic: boolean("is_public").default(true),
  recipient: text("recipient"), // Who the private message is sent to
  senderName: text("sender_name"), // Optional sender name
  userId: integer("user_id").references(() => users.id), // Link to user account (optional)
  adminId: integer("admin_id").references(() => admins.id), // Link to admin account (optional)
  isAuthenticated: boolean("is_authenticated").default(false), // Whether posted as authenticated user
  isOwnerPrivate: boolean("is_owner_private").default(false), // Whether owner set this as private
  createdAt: timestamp("created_at").defaultNow(),
});

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  parentId: integer("parent_id"), // Self-reference for nested replies - will be configured in relations
  content: text("content").notNull(),
  nickname: text("nickname").notNull(),
  userId: integer("user_id").references(() => users.id), // Link to user account (optional)
  adminId: integer("admin_id").references(() => admins.id), // Link to admin account (optional)
  mentionedUserId: integer("mentioned_user_id").references(() => users.id), // User being mentioned
  mentionedAdminId: integer("mentioned_admin_id").references(() => admins.id), // Admin being mentioned
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin accounts table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Optional password for non-ZEKE001 accounts
  displayName: text("display_name").notNull().unique(), // What shows in recipient options
  profilePicture: text("profile_picture"), // URL or path to profile picture
  backgroundPhoto: text("background_photo"), // URL or path to background profile photo
  bio: text("bio"), // Admin's bio/description (200 character limit)
  role: text("role").notNull().default("admin"), // admin, moderator, support, community_manager
  isVerified: boolean("is_verified").default(false), // Verified badge (only ZEKE001 can grant)
  lastDisplayNameChange: timestamp("last_display_name_change"), // Track last change for 30-day cooldown
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Heart reactions table
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => admins.id),
  type: text("type").notNull().default("heart"), // heart, like, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => admins.id),
  type: text("type").notNull(), // reaction, reply, mention, follow
  messageId: integer("message_id").references(() => messages.id),
  replyId: integer("reply_id").references(() => replies.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  fromAdminId: integer("from_admin_id").references(() => admins.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follow system table
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id).notNull(),
  followingId: integer("following_id").references(() => users.id),
  followingAdminId: integer("following_admin_id").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Liked messages table for personal archives
export const likedMessages = pgTable("liked_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => admins.id),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Honorable mentions table for the gratitude modal
export const honorableMentions = pgTable("honorable_mentions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji"), // Optional emoji for the person
  order: integer("order").notNull().default(0), // Order of display
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert and select schemas for honorable mentions
export const insertHonorableMentionSchema = createInsertSchema(honorableMentions);
export type InsertHonorableMention = z.infer<typeof insertHonorableMentionSchema>;
export type HonorableMention = typeof honorableMentions.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  replies: many(replies),
}));

export const messagesRelations = relations(messages, ({ many, one }) => ({
  replies: many(replies),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  admin: one(admins, {
    fields: [messages.adminId],
    references: [admins.id],
  }),
}));

export const repliesRelations = relations(replies, ({ one, many }) => ({
  message: one(messages, {
    fields: [replies.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [replies.userId],
    references: [users.id],
  }),
  admin: one(admins, {
    fields: [replies.adminId],
    references: [admins.id],
  }),
  mentionedUser: one(users, {
    fields: [replies.mentionedUserId],
    references: [users.id],
  }),
  mentionedAdmin: one(admins, {
    fields: [replies.mentionedAdminId],
    references: [admins.id],
  }),
  parent: one(replies, {
    fields: [replies.parentId],
    references: [replies.id],
    relationName: "parent_child"
  }),
  children: many(replies, {
    relationName: "parent_child"
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  message: one(messages, {
    fields: [reactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
  admin: one(admins, {
    fields: [reactions.adminId],
    references: [admins.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  admin: one(admins, {
    fields: [notifications.adminId],
    references: [admins.id],
  }),
  message: one(messages, {
    fields: [notifications.messageId],
    references: [messages.id],
  }),
  reply: one(replies, {
    fields: [notifications.replyId],
    references: [replies.id],
  }),
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
  }),
  fromAdmin: one(admins, {
    fields: [notifications.fromAdminId],
    references: [admins.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
  }),
  followingAdmin: one(admins, {
    fields: [follows.followingAdminId],
    references: [admins.id],
  }),
}));

export const likedMessagesRelations = relations(likedMessages, ({ one }) => ({
  user: one(users, {
    fields: [likedMessages.userId],
    references: [users.id],
  }),
  admin: one(admins, {
    fields: [likedMessages.adminId],
    references: [admins.id],
  }),
  message: one(messages, {
    fields: [likedMessages.messageId],
    references: [messages.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertReplySchema = createInsertSchema(replies).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string().min(1, "Reply content is required").max(500, "Reply content must be 500 characters or less"),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertLikedMessageSchema = createInsertSchema(likedMessages).omit({
  id: true,
  createdAt: true,
});

// Profile update schemas
export const updateUserProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  profilePicture: z.string().optional().refine(
    (val) => !val || val === "" || val.startsWith("data:image/") || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or base64 image data" }
  ),
  backgroundPhoto: z.string().optional(),
  bio: z.string().max(200).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Reply = typeof replies.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertLikedMessage = z.infer<typeof insertLikedMessageSchema>;
export type LikedMessage = typeof likedMessages.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type MessageWithReplies = Message & {
  replies: ReplyWithUser[];
  user?: User | null;
  admin?: Admin | null;
  reactions?: Reaction[];
  reactionCount?: number;
  userHasReacted?: boolean;
};

export type ReplyWithUser = Reply & {
  user?: User | null;
  admin?: Admin | null;
  mentionedUser?: User | null;
  mentionedAdmin?: Admin | null;
  children?: ReplyWithUser[];
};

export type UserProfile = User & {
  messageCount: number;
  replyCount: number;
  totalReactions: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  publicLikedMessages?: MessageWithReplies[];
};

export type NotificationWithDetails = Notification & {
  fromUser?: User | null;
  fromAdmin?: Admin | null;
  message?: Message | null;
  reply?: Reply | null;
};

// Message categories with their colors
export const MESSAGE_CATEGORIES = [
  { name: "Anything", color: "bg-gray-100 text-gray-800 border-gray-300" },
  { name: "Love", color: "bg-pink-100 text-pink-800 border-pink-300" },
  { name: "Advice", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { name: "Confession", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { name: "Rant", color: "bg-red-100 text-red-800 border-red-300" },
  { name: "Reflection", color: "bg-green-100 text-green-800 border-green-300" },
  { name: "Writing", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
] as const;

export type MessageCategory = typeof MESSAGE_CATEGORIES[number]["name"];