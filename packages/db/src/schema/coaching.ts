import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  integer,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants, users } from "./core";
import { goals } from "./goals";

// ============================================================================
// ENUMS
// ============================================================================

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "prep_in_progress",
  "ready",
  "completed",
  "cancelled",
  "no_show",
]);

export const sessionTypeEnum = pgEnum("session_type", [
  "coaching",
  "one_on_one",
  "check_in",
  "review",
  "planning",
]);

export const coachingActionStatusEnum = pgEnum("coaching_action_status", [
  "pending",
  "in_progress",
  "completed",
  "blocked",
  "cancelled",
]);

// ============================================================================
// COACHING RELATIONSHIPS (Who coaches whom)
// ============================================================================

export const coachingRelationships = pgTable("coaching_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // The coach/mentor
  coachId: uuid("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // The person being coached
  coacheeId: uuid("coachee_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Relationship type
  relationshipType: varchar("relationship_type", { length: 50 }).default("mentor"), // mentor, coach, manager

  // Status
  isActive: boolean("is_active").default(true),

  // Meeting preferences
  defaultDurationMinutes: integer("default_duration_minutes").default(60),
  preferredDay: varchar("preferred_day", { length: 20 }),
  preferredTime: varchar("preferred_time", { length: 20 }),
  meetingFrequency: varchar("meeting_frequency", { length: 50 }), // weekly, biweekly, monthly

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// COACHING SESSIONS
// ============================================================================

export const coachingSessions = pgTable("coaching_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  relationshipId: uuid("relationship_id").references(() => coachingRelationships.id, { onDelete: "set null" }),

  // Participants
  coachId: uuid("coach_id").notNull().references(() => users.id),
  coacheeId: uuid("coachee_id").notNull().references(() => users.id),

  // Session details
  title: text("title"),
  type: sessionTypeEnum("type").notNull().default("coaching"),

  // Scheduling
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  timezone: varchar("timezone", { length: 50 }),

  // Meeting link
  meetingUrl: text("meeting_url"),
  meetingProvider: varchar("meeting_provider", { length: 50 }), // zoom, teams, meet

  // Status
  status: sessionStatusEnum("status").notNull().default("scheduled"),

  // Prep status (for coachee)
  prepStatus: varchar("prep_status", { length: 50 }).default("not_started"), // not_started, in_progress, ready

  // Completion
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// SESSION PREP (Pre-session preparation by coachee)
// ============================================================================

export const sessionPrep = pgTable("session_prep", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => coachingSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),

  // Reflection questions and answers
  reflections: jsonb("reflections").default([]),

  // Progress since last session
  progressSummary: text("progress_summary"),
  wins: jsonb("wins").default([]),
  challenges: jsonb("challenges").default([]),

  // Topics to discuss
  topicsToDiscuss: jsonb("topics_to_discuss").default([]),

  // Goals review
  goalsOnTrack: integer("goals_on_track").default(0),
  goalsAtRisk: integer("goals_at_risk").default(0),

  // Status
  isComplete: boolean("is_complete").default(false),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// SESSION NOTES (Notes taken during/after session)
// ============================================================================

export const sessionNotes = pgTable("session_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => coachingSessions.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id),

  // Note content
  content: text("content"),
  isPrivate: boolean("is_private").default(false), // Only visible to author

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// COACHING ACTION ITEMS
// ============================================================================

export const coachingActionItems = pgTable("coaching_action_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => coachingSessions.id, { onDelete: "set null" }),

  // Assignment
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  assignedById: uuid("assigned_by_id").references(() => users.id),

  // Content
  title: text("title").notNull(),
  description: text("description"),

  // Timeline
  dueDate: date("due_date"),

  // Status
  status: coachingActionStatusEnum("status").notNull().default("pending"),
  completedAt: timestamp("completed_at"),

  // Priority
  priority: varchar("priority", { length: 20 }).default("medium"),

  // Link to goal (optional)
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// COACHING HISTORY (Aggregate stats for a coaching relationship)
// ============================================================================

export const coachingHistory = pgTable("coaching_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  relationshipId: uuid("relationship_id").notNull().references(() => coachingRelationships.id, { onDelete: "cascade" }),

  // Stats
  totalSessions: integer("total_sessions").default(0),
  completedSessions: integer("completed_sessions").default(0),
  totalActionItems: integer("total_action_items").default(0),
  completedActionItems: integer("completed_action_items").default(0),

  // Trends
  actionItemCompletionRate: integer("action_item_completion_rate"), // 0-100

  // Last session
  lastSessionAt: timestamp("last_session_at"),
  nextSessionAt: timestamp("next_session_at"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const coachingRelationshipsRelations = relations(coachingRelationships, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [coachingRelationships.tenantId],
    references: [tenants.id],
  }),
  coach: one(users, {
    fields: [coachingRelationships.coachId],
    references: [users.id],
  }),
  coachee: one(users, {
    fields: [coachingRelationships.coacheeId],
    references: [users.id],
  }),
  sessions: many(coachingSessions),
  history: one(coachingHistory),
}));

export const coachingSessionsRelations = relations(coachingSessions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [coachingSessions.tenantId],
    references: [tenants.id],
  }),
  relationship: one(coachingRelationships, {
    fields: [coachingSessions.relationshipId],
    references: [coachingRelationships.id],
  }),
  coach: one(users, {
    fields: [coachingSessions.coachId],
    references: [users.id],
  }),
  coachee: one(users, {
    fields: [coachingSessions.coacheeId],
    references: [users.id],
  }),
  prep: many(sessionPrep),
  notes: many(sessionNotes),
  actionItems: many(coachingActionItems),
}));

export const sessionPrepRelations = relations(sessionPrep, ({ one }) => ({
  session: one(coachingSessions, {
    fields: [sessionPrep.sessionId],
    references: [coachingSessions.id],
  }),
  user: one(users, {
    fields: [sessionPrep.userId],
    references: [users.id],
  }),
}));

export const sessionNotesRelations = relations(sessionNotes, ({ one }) => ({
  session: one(coachingSessions, {
    fields: [sessionNotes.sessionId],
    references: [coachingSessions.id],
  }),
  author: one(users, {
    fields: [sessionNotes.authorId],
    references: [users.id],
  }),
}));

export const coachingActionItemsRelations = relations(coachingActionItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [coachingActionItems.tenantId],
    references: [tenants.id],
  }),
  session: one(coachingSessions, {
    fields: [coachingActionItems.sessionId],
    references: [coachingSessions.id],
  }),
  owner: one(users, {
    fields: [coachingActionItems.ownerId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [coachingActionItems.assignedById],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [coachingActionItems.goalId],
    references: [goals.id],
  }),
}));
