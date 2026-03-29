import { pgTable, text, timestamp, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name"),
  username: text("username").unique(),
  profileImage: text("profile_image"),
  plan: text("plan").notNull().default("free"),
  queryCount: integer("query_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const authSessionsTable = pgTable("auth_sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const agentSessionsTable = pgTable("agent_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  goal: text("goal").notNull(),
  mode: text("mode").notNull().default("research"),
  answer: text("answer"),
  taskCount: integer("task_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentSessionSchema = createInsertSchema(agentSessionsTable).omit({ createdAt: true });
export type InsertAgentSession = z.infer<typeof insertAgentSessionSchema>;
export type AgentSession = typeof agentSessionsTable.$inferSelect;

export const resumesTable = pgTable("resumes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  parsedData: text("parsed_data"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({ uploadedAt: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;

export const jobApplicationsTable = pgTable("job_applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").references(() => resumesTable.id),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  jobUrl: text("job_url"),
  status: text("status").notNull().default("pending"),
  matchScore: integer("match_score"),
  coverLetter: text("cover_letter"),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplicationsTable).omit({ createdAt: true });
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplicationsTable.$inferSelect;

export const socialAccountsTable = pgTable("social_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // "linkedin" | "twitter"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  platformUserId: text("platform_user_id"),
  platformUsername: text("platform_username"),
  platformName: text("platform_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSocialAccountSchema = createInsertSchema(socialAccountsTable).omit({ createdAt: true, updatedAt: true });
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccountsTable.$inferSelect;

export const contentPostsTable = pgTable("content_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  platform: text("platform").notNull(), // "linkedin" | "twitter"
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  platformPostId: text("platform_post_id"),
  status: text("status").notNull().default("draft"), // "draft" | "published"
  publishedAt: timestamp("published_at"),
  impressions: integer("impressions").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContentPostSchema = createInsertSchema(contentPostsTable).omit({ createdAt: true });
export type InsertContentPost = z.infer<typeof insertContentPostSchema>;
export type ContentPost = typeof contentPostsTable.$inferSelect;

export const userApiKeysTable = pgTable("user_api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  service: text("service").notNull(),
  encryptedKey: text("encrypted_key").notNull(),
  keyHint: text("key_hint"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("user_api_keys_user_service_idx").on(t.userId, t.service)]);

export type UserApiKey = typeof userApiKeysTable.$inferSelect;
