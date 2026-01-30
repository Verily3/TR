import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants, users } from "./core";
import { programs } from "./programs";

// ============================================================================
// ENUMS
// ============================================================================

export const notificationTypeEnum = pgEnum("notification_type", [
  "program",      // New content, due dates
  "coaching",     // Session reminders, action items
  "goal",         // Updates, at-risk alerts
  "assessment",   // Invitations, results ready
  "announcement", // Account/program announcements
  "system",       // Platform updates
  "mention",      // @mentions
  "message",      // Direct messages
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const announcementTypeEnum = pgEnum("announcement_type", [
  "info",
  "warning",
  "success",
  "update",
]);

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  // Notification details
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  priority: notificationPriorityEnum("priority").default("medium"),

  // Link/action
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),

  // Related entity
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),

  // Additional data
  metadata: jsonb("metadata").default({}),

  // Status
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isArchived: boolean("is_archived").default(false),

  // Delivery tracking
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  pushSent: boolean("push_sent").default(false),
  pushSentAt: timestamp("push_sent_at"),
  smsSent: boolean("sms_sent").default(false),
  smsSentAt: timestamp("sms_sent_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// NOTIFICATION PREFERENCES (Per-user settings)
// ============================================================================

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Channel preferences per type
  preferences: jsonb("preferences").default({}),
  /*
    Example structure:
    {
      "program": { "inApp": true, "email": true, "push": true, "sms": false },
      "coaching": { "inApp": true, "email": true, "push": true, "sms": true },
      "goal": { "inApp": true, "email": false, "push": false, "sms": false },
      ...
    }
  */

  // Digest settings
  digestEnabled: boolean("digest_enabled").default(true),
  digestFrequency: varchar("digest_frequency", { length: 50 }).default("daily"), // daily, weekly

  // Quiet hours
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
  quietHoursStart: varchar("quiet_hours_start", { length: 10 }), // "22:00"
  quietHoursEnd: varchar("quiet_hours_end", { length: 10 }), // "08:00"
  quietHoursTimezone: varchar("quiet_hours_timezone", { length: 50 }),

  // Global mute
  isMuted: boolean("is_muted").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ANNOUNCEMENTS (Tenant or program-wide announcements)
// ============================================================================

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  programId: uuid("program_id").references(() => programs.id, { onDelete: "cascade" }),

  // Content
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: announcementTypeEnum("type").default("info"),

  // Targeting
  targetRoles: jsonb("target_roles").default([]), // Empty = all roles

  // Scheduling
  publishAt: timestamp("publish_at"),
  expiresAt: timestamp("expires_at"),

  // Status
  isPublished: boolean("is_published").default(false),
  isPinned: boolean("is_pinned").default(false),

  // Author
  authorId: uuid("author_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ANNOUNCEMENT READS (Track who has read announcements)
// ============================================================================

export const announcementReads = pgTable("announcement_reads", {
  id: uuid("id").primaryKey().defaultRandom(),
  announcementId: uuid("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  readAt: timestamp("read_at").defaultNow().notNull(),
});

// ============================================================================
// FEED ITEMS (Activity feed)
// ============================================================================

export const feedItems = pgTable("feed_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  programId: uuid("program_id").references(() => programs.id, { onDelete: "cascade" }),

  // Actor
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Activity
  activityType: varchar("activity_type", { length: 100 }).notNull(),
  // e.g., "completed_lesson", "achieved_goal", "joined_program", "earned_certificate"

  title: text("title").notNull(),
  body: text("body"),

  // Related entity
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),

  // Visibility
  isPublic: boolean("is_public").default(true),

  // Metadata
  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [announcements.tenantId],
    references: [tenants.id],
  }),
  program: one(programs, {
    fields: [announcements.programId],
    references: [programs.id],
  }),
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  reads: many(announcementReads),
}));

export const feedItemsRelations = relations(feedItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [feedItems.tenantId],
    references: [tenants.id],
  }),
  program: one(programs, {
    fields: [feedItems.programId],
    references: [programs.id],
  }),
  user: one(users, {
    fields: [feedItems.userId],
    references: [users.id],
  }),
}));
