import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts for anonymous senders
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  content: text("content").notNull(),
  nickname: text("nickname").notNull(),
  userId: integer("user_id").references(() => users.id), // Link to user account (optional)
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin accounts table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Optional password for non-ZEKE001 accounts
  displayName: text("display_name").notNull().unique(), // What shows in recipient options
  role: text("role").notNull().default("admin"), // admin, moderator, support, community_manager
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

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
}));

export const repliesRelations = relations(replies, ({ one }) => ({
  message: one(messages, {
    fields: [replies.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [replies.userId],
    references: [users.id],
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
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Reply = typeof replies.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export type MessageWithReplies = Message & {
  replies: Reply[];
  user?: User | null;
};

export type ReplyWithUser = Reply & {
  user?: User | null;
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
