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
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants, users } from "./core";
import { programs } from "./programs";

// ============================================================================
// ENUMS
// ============================================================================

export const goalTypeEnum = pgEnum("goal_type", [
  "company",
  "team",
  "personal",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "draft",
  "active",
  "completed",
  "cancelled",
]);

export const goalProgressStatusEnum = pgEnum("goal_progress_status", [
  "on_track",
  "at_risk",
  "behind",
  "ahead",
]);

export const trendEnum = pgEnum("trend", [
  "up",
  "down",
  "flat",
]);

export const kpiCategoryEnum = pgEnum("kpi_category", [
  "financial",
  "operational",
  "market_growth",
  "people_culture",
  "compliance_safety",
  "brand_strength",
  "custom",
]);

export const planPeriodEnum = pgEnum("plan_period", [
  "annual",
  "quarterly",
]);

// ============================================================================
// SCORECARD TEMPLATES (Agency-level reusable templates)
// ============================================================================

export const scorecardTemplates = pgTable("scorecard_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull(),

  name: text("name").notNull(),
  description: text("description"),
  roleType: varchar("role_type", { length: 100 }), // CEO, COO, CMO, etc.

  // Template structure
  accountabilities: jsonb("accountabilities").default([]),
  kpis: jsonb("kpis").default([]),
  competencies: jsonb("competencies").default([]),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// SCORECARDS (Per-user scorecard)
// ============================================================================

export const scorecards = pgTable("scorecards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => scorecardTemplates.id),

  // Role info
  roleTitle: text("role_title").notNull(),
  missionStatement: text("mission_statement"),

  // Overall score (calculated)
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  previousScore: decimal("previous_score", { precision: 5, scale: 2 }),
  trend: trendEnum("trend"),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ACCOUNTABILITIES (Key responsibility areas on a scorecard)
// ============================================================================

export const accountabilities = pgTable("accountabilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  scorecardId: uuid("scorecard_id").notNull().references(() => scorecards.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),

  // Scoring
  score: decimal("score", { precision: 5, scale: 2 }),
  previousScore: decimal("previous_score", { precision: 5, scale: 2 }),
  targetScore: decimal("target_score", { precision: 5, scale: 2 }),
  trend: trendEnum("trend"),

  // Status
  status: goalProgressStatusEnum("status").default("on_track"),

  // Weighting (for overall score calculation)
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.0"),

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// KPIS (Key Performance Indicators)
// ============================================================================

export const kpis = pgTable("kpis", {
  id: uuid("id").primaryKey().defaultRandom(),
  scorecardId: uuid("scorecard_id").notNull().references(() => scorecards.id, { onDelete: "cascade" }),
  accountabilityId: uuid("accountability_id").references(() => accountabilities.id, { onDelete: "set null" }),

  name: text("name").notNull(),
  description: text("description"),
  category: kpiCategoryEnum("category").notNull().default("custom"),

  // Values
  currentValue: decimal("current_value", { precision: 15, scale: 4 }),
  targetValue: decimal("target_value", { precision: 15, scale: 4 }),
  previousValue: decimal("previous_value", { precision: 15, scale: 4 }),
  baselineValue: decimal("baseline_value", { precision: 15, scale: 4 }),

  // Formatting
  unit: varchar("unit", { length: 50 }), // %, $, points, etc.
  format: varchar("format", { length: 50 }), // number, currency, percentage

  // Change tracking
  changePercent: decimal("change_percent", { precision: 8, scale: 2 }),
  trend: trendEnum("trend"),

  // Measurement
  measurementFrequency: varchar("measurement_frequency", { length: 50 }), // daily, weekly, monthly, quarterly

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// KPI HISTORY (Track KPI values over time)
// ============================================================================

export const kpiHistory = pgTable("kpi_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  kpiId: uuid("kpi_id").notNull().references(() => kpis.id, { onDelete: "cascade" }),

  value: decimal("value", { precision: 15, scale: 4 }).notNull(),
  recordedAt: timestamp("recorded_at").notNull(),
  recordedById: uuid("recorded_by_id").references(() => users.id),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// COMPETENCIES (A-Player competencies on scorecard)
// ============================================================================

export const competencies = pgTable("competencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  scorecardId: uuid("scorecard_id").notNull().references(() => scorecards.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),

  // Dual ratings
  selfRating: integer("self_rating"), // 1-5
  mentorRating: integer("mentor_rating"), // 1-5

  // Previous ratings for trend
  previousSelfRating: integer("previous_self_rating"),
  previousMentorRating: integer("previous_mentor_rating"),

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ANNUAL PLANS
// ============================================================================

export const annualPlans = pgTable("annual_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  year: integer("year").notNull(),
  name: text("name").notNull(),
  description: text("description"),

  // Progress
  completionPercent: integer("completion_percent").default(0),

  // Status
  status: varchar("status", { length: 50 }).default("active"),

  createdById: uuid("created_by_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// STRATEGIC PILLARS (Major pillars of an annual plan)
// ============================================================================

export const strategicPillars = pgTable("strategic_pillars", {
  id: uuid("id").primaryKey().defaultRandom(),
  annualPlanId: uuid("annual_plan_id").notNull().references(() => annualPlans.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),
  targetMetrics: text("target_metrics"), // e.g., "$250M Revenue | 12% EBITDA"

  // Progress
  progress: integer("progress").default(0),
  initiativeCount: integer("initiative_count").default(0),
  status: goalProgressStatusEnum("status").default("on_track"),

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// QUARTERLY PLANS
// ============================================================================

export const quarterlyPlans = pgTable("quarterly_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  annualPlanId: uuid("annual_plan_id").notNull().references(() => annualPlans.id, { onDelete: "cascade" }),

  quarter: integer("quarter").notNull(), // 1, 2, 3, 4
  year: integer("year").notNull(),
  theme: text("theme"),

  // Progress
  completionPercent: integer("completion_percent").default(0),
  priorityCount: integer("priority_count").default(0),
  actionItemsTotal: integer("action_items_total").default(0),
  actionItemsComplete: integer("action_items_complete").default(0),

  // Status
  status: varchar("status", { length: 50 }).default("active"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// QUARTERLY PRIORITIES
// ============================================================================

export const quarterlyPriorities = pgTable("quarterly_priorities", {
  id: uuid("id").primaryKey().defaultRandom(),
  quarterlyPlanId: uuid("quarterly_plan_id").notNull().references(() => quarterlyPlans.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),

  // Owner
  ownerId: uuid("owner_id").references(() => users.id),

  // Timeline
  dueDate: date("due_date"),

  // Progress
  status: goalProgressStatusEnum("status").default("on_track"),
  actionItemsComplete: integer("action_items_complete").default(0),
  actionItemsTotal: integer("action_items_total").default(0),

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// GOALS
// ============================================================================

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Basic info
  title: text("title").notNull(),
  description: text("description"),
  type: goalTypeEnum("type").notNull().default("personal"),
  category: kpiCategoryEnum("category"),

  // Owner and visibility
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  visibleToDirectReports: boolean("visible_to_direct_reports").default(true),
  showOnDashboard: boolean("show_on_dashboard").default(false),
  enableAiCoaching: boolean("enable_ai_coaching").default(true),

  // Accountability partner
  accountabilityPartnerId: uuid("accountability_partner_id").references(() => users.id),

  // Timeline
  startDate: date("start_date"),
  targetDate: date("target_date"),
  activeQuarters: jsonb("active_quarters").default([]), // ["Q1 2026", "Q2 2026"]

  // Measurement
  baselineValue: decimal("baseline_value", { precision: 15, scale: 4 }),
  currentValue: decimal("current_value", { precision: 15, scale: 4 }),
  targetValue: decimal("target_value", { precision: 15, scale: 4 }),
  unit: varchar("unit", { length: 50 }),
  measurementFrequency: varchar("measurement_frequency", { length: 50 }),

  // Progress
  progress: integer("progress").default(0), // 0-100
  progressStatus: goalProgressStatusEnum("progress_status").default("on_track"),

  // Links
  scorecardId: uuid("scorecard_id").references(() => scorecards.id),
  accountabilityId: uuid("accountability_id").references(() => accountabilities.id),
  annualPlanId: uuid("annual_plan_id").references(() => annualPlans.id),
  pillarId: uuid("pillar_id").references(() => strategicPillars.id),
  programId: uuid("program_id").references(() => programs.id),

  // Status
  status: goalStatusEnum("status").notNull().default("draft"),
  completedAt: timestamp("completed_at"),

  // AI suggestions
  aiSuggested: boolean("ai_suggested").default(false),
  suggestionReason: text("suggestion_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// GOAL MILESTONES
// ============================================================================

export const goalMilestones = pgTable("goal_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),
  dueDate: date("due_date"),

  // Status
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),

  orderIndex: integer("order_index").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// GOAL UPDATES (Progress updates on goals)
// ============================================================================

export const goalUpdates = pgTable("goal_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),

  // Update content
  value: decimal("value", { precision: 15, scale: 4 }),
  notes: text("notes"),
  status: goalProgressStatusEnum("status"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ACTION ITEMS (Tasks linked to priorities or goals)
// ============================================================================

export const actionItems = pgTable("action_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Links (can be linked to priority, goal, or standalone)
  priorityId: uuid("priority_id").references(() => quarterlyPriorities.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "cascade" }),

  // Basic info
  title: text("title").notNull(),
  description: text("description"),

  // Assignment
  ownerId: uuid("owner_id").references(() => users.id),
  assignedById: uuid("assigned_by_id").references(() => users.id),

  // Timeline
  dueDate: date("due_date"),

  // Status
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, blocked
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),

  // Priority
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const scorecardsRelations = relations(scorecards, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [scorecards.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [scorecards.userId],
    references: [users.id],
  }),
  template: one(scorecardTemplates, {
    fields: [scorecards.templateId],
    references: [scorecardTemplates.id],
  }),
  accountabilities: many(accountabilities),
  kpis: many(kpis),
  competencies: many(competencies),
}));

export const accountabilitiesRelations = relations(accountabilities, ({ one, many }) => ({
  scorecard: one(scorecards, {
    fields: [accountabilities.scorecardId],
    references: [scorecards.id],
  }),
  kpis: many(kpis),
  goals: many(goals),
}));

export const kpisRelations = relations(kpis, ({ one, many }) => ({
  scorecard: one(scorecards, {
    fields: [kpis.scorecardId],
    references: [scorecards.id],
  }),
  accountability: one(accountabilities, {
    fields: [kpis.accountabilityId],
    references: [accountabilities.id],
  }),
  history: many(kpiHistory),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [goals.tenantId],
    references: [tenants.id],
  }),
  owner: one(users, {
    fields: [goals.ownerId],
    references: [users.id],
  }),
  accountabilityPartner: one(users, {
    fields: [goals.accountabilityPartnerId],
    references: [users.id],
  }),
  scorecard: one(scorecards, {
    fields: [goals.scorecardId],
    references: [scorecards.id],
  }),
  accountability: one(accountabilities, {
    fields: [goals.accountabilityId],
    references: [accountabilities.id],
  }),
  annualPlan: one(annualPlans, {
    fields: [goals.annualPlanId],
    references: [annualPlans.id],
  }),
  pillar: one(strategicPillars, {
    fields: [goals.pillarId],
    references: [strategicPillars.id],
  }),
  program: one(programs, {
    fields: [goals.programId],
    references: [programs.id],
  }),
  milestones: many(goalMilestones),
  updates: many(goalUpdates),
  actionItems: many(actionItems),
}));

export const annualPlansRelations = relations(annualPlans, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [annualPlans.tenantId],
    references: [tenants.id],
  }),
  createdBy: one(users, {
    fields: [annualPlans.createdById],
    references: [users.id],
  }),
  pillars: many(strategicPillars),
  quarterlyPlans: many(quarterlyPlans),
  goals: many(goals),
}));

export const quarterlyPlansRelations = relations(quarterlyPlans, ({ one, many }) => ({
  annualPlan: one(annualPlans, {
    fields: [quarterlyPlans.annualPlanId],
    references: [annualPlans.id],
  }),
  priorities: many(quarterlyPriorities),
}));

export const quarterlyPrioritiesRelations = relations(quarterlyPriorities, ({ one, many }) => ({
  quarterlyPlan: one(quarterlyPlans, {
    fields: [quarterlyPriorities.quarterlyPlanId],
    references: [quarterlyPlans.id],
  }),
  owner: one(users, {
    fields: [quarterlyPriorities.ownerId],
    references: [users.id],
  }),
  actionItems: many(actionItems),
}));

export const actionItemsRelations = relations(actionItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [actionItems.tenantId],
    references: [tenants.id],
  }),
  priority: one(quarterlyPriorities, {
    fields: [actionItems.priorityId],
    references: [quarterlyPriorities.id],
  }),
  goal: one(goals, {
    fields: [actionItems.goalId],
    references: [goals.id],
  }),
  owner: one(users, {
    fields: [actionItems.ownerId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [actionItems.assignedById],
    references: [users.id],
  }),
}));
