import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const watchlistItemsTable = pgTable("watchlist_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  watchType: text("watch_type").notNull().default("all"),
  checkFrequency: text("check_frequency").notNull().default("daily"),
  lastCheckedAt: timestamp("last_checked_at"),
  nextCheckAt: timestamp("next_check_at").notNull().defaultNow(),
  lastContent: text("last_content"),
  lastScreenshot: text("last_screenshot"),
  changeCount: integer("change_count").notNull().default(0),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItemsTable).omit({ createdAt: true });
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type WatchlistItem = typeof watchlistItemsTable.$inferSelect;

export const watchlistChangesTable = pgTable("watchlist_changes", {
  id: text("id").primaryKey(),
  watchlistItemId: text("watchlist_item_id").notNull().references(() => watchlistItemsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  changeType: text("change_type").notNull().default("content_change"),
  changeTitle: text("change_title").notNull(),
  changeDescription: text("change_description").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  severity: text("severity").notNull().default("medium"),
  screenshot: text("screenshot"),
});

export const insertWatchlistChangeSchema = createInsertSchema(watchlistChangesTable).omit({ detectedAt: true });
export type InsertWatchlistChange = z.infer<typeof insertWatchlistChangeSchema>;
export type WatchlistChange = typeof watchlistChangesTable.$inferSelect;
