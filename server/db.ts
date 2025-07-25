import { config } from 'dotenv';
config({ override: true });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon (works with Supabase too)
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

import { pgTable, serial, integer, varchar, timestamp, unique } from 'drizzle-orm/pg-core';

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => schema.messages.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => schema.users.id, { onDelete: "cascade" }),
  adminId: integer("admin_id").references(() => schema.admins.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).default("heart"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  followerType: varchar("follower_type", { length: 10 }).notNull(), // 'user' or 'admin'
  followingType: varchar("following_type", { length: 10 }).notNull(), // 'user' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate follows
  uniqueFollow: unique().on(table.followerId, table.followingId, table.followerType, table.followingType),
}));