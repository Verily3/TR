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
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants, users } from "./core";

// ============================================================================
// ENUMS
// ============================================================================

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "180",  // Self + Manager
  "360",  // Self + Manager + Peers + Direct Reports
  "self", // Self only
  "custom",
]);

export const raterTypeEnum = pgEnum("rater_type", [
  "self",
  "manager",
  "peer",
  "direct_report",
  "external",
]);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "draft",
  "active",
  "closed",
  "archived",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "started",
  "completed",
  "declined",
  "expired",
]);

// ============================================================================
// ASSESSMENT TEMPLATES (Agency-level)
// ============================================================================

export const assessmentTemplates = pgTable("assessment_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull(),

  name: text("name").notNull(),
  description: text("description"),
  type: assessmentTypeEnum("type").notNull().default("360"),

  // Competencies and questions structure
  competencies: jsonb("competencies").default([]),
  /*
    Example structure:
    [
      {
        id: "uuid",
        name: "Collaboration",
        description: "Works effectively with others",
        questions: [
          {
            id: "uuid",
            text: "Actively seeks input from team members",
            scaleMin: 1,
            scaleMax: 5,
            scaleLabels: ["Never", "Rarely", "Sometimes", "Often", "Always"]
          }
        ]
      }
    ]
  */

  // Scoring configuration
  scaleMin: integer("scale_min").default(1),
  scaleMax: integer("scale_max").default(5),
  scaleLabels: jsonb("scale_labels").default([]),

  // Goal suggestion rules
  goalSuggestionRules: jsonb("goal_suggestion_rules").default([]),
  /*
    Example structure:
    [
      {
        competencyId: "uuid",
        threshold: 3,
        operator: "less_than",
        suggestedGoal: "Improve collaboration skills",
        suggestedProgram: "uuid"
      }
    ]
  */

  // Settings
  allowComments: boolean("allow_comments").default(true),
  requireComments: boolean("require_comments").default(false),
  anonymizeResponses: boolean("anonymize_responses").default(true),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ASSESSMENTS (Instances of assessments for specific users)
// ============================================================================

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => assessmentTemplates.id),

  // The person being assessed
  subjectId: uuid("subject_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Assessment info
  name: text("name").notNull(),
  description: text("description"),
  type: assessmentTypeEnum("type").notNull(),

  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),

  // Status
  status: assessmentStatusEnum("status").notNull().default("draft"),

  // Settings (can override template)
  anonymizeResponses: boolean("anonymize_responses").default(true),

  // Completion stats
  totalInvitations: integer("total_invitations").default(0),
  completedResponses: integer("completed_responses").default(0),

  // Results available
  resultsReleasedAt: timestamp("results_released_at"),

  createdById: uuid("created_by_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ASSESSMENT INVITATIONS (Raters invited to provide feedback)
// ============================================================================

export const assessmentInvitations = pgTable("assessment_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),

  // Rater info
  raterId: uuid("rater_id").references(() => users.id), // Can be null for external raters
  raterEmail: text("rater_email").notNull(),
  raterName: text("rater_name"),
  raterType: raterTypeEnum("rater_type").notNull(),

  // Invitation
  token: text("token").notNull().unique(),
  invitedAt: timestamp("invited_at").defaultNow(),
  reminderSentAt: timestamp("reminder_sent_at"),

  // Status
  status: invitationStatusEnum("status").notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ASSESSMENT RESPONSES (Individual question responses)
// ============================================================================

export const assessmentResponses = pgTable("assessment_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").notNull().references(() => assessmentInvitations.id, { onDelete: "cascade" }),

  // Question reference
  competencyId: text("competency_id").notNull(),
  questionId: text("question_id").notNull(),

  // Response
  score: integer("score"),
  comment: text("comment"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ASSESSMENT RESULTS (Aggregated results per competency)
// ============================================================================

export const assessmentResults = pgTable("assessment_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),

  // Competency
  competencyId: text("competency_id").notNull(),
  competencyName: text("competency_name").notNull(),

  // Aggregated scores by rater type
  selfScore: decimal("self_score", { precision: 4, scale: 2 }),
  managerScore: decimal("manager_score", { precision: 4, scale: 2 }),
  peerScore: decimal("peer_score", { precision: 4, scale: 2 }),
  directReportScore: decimal("direct_report_score", { precision: 4, scale: 2 }),
  overallScore: decimal("overall_score", { precision: 4, scale: 2 }),

  // Response counts
  selfCount: integer("self_count").default(0),
  managerCount: integer("manager_count").default(0),
  peerCount: integer("peer_count").default(0),
  directReportCount: integer("direct_report_count").default(0),

  // Gap analysis
  selfVsOthersGap: decimal("self_vs_others_gap", { precision: 4, scale: 2 }),

  // Previous assessment comparison (if exists)
  previousScore: decimal("previous_score", { precision: 4, scale: 2 }),
  scoreDelta: decimal("score_delta", { precision: 4, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ASSESSMENT GOAL SUGGESTIONS (AI-generated goal suggestions from results)
// ============================================================================

export const assessmentGoalSuggestions = pgTable("assessment_goal_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  resultId: uuid("result_id").references(() => assessmentResults.id),

  // Suggestion
  competencyId: text("competency_id"),
  competencyName: text("competency_name"),
  suggestedGoal: text("suggested_goal").notNull(),
  reason: text("reason"),

  // Linked program (if applicable)
  suggestedProgramId: uuid("suggested_program_id"),

  // User action
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, dismissed
  acceptedAt: timestamp("accepted_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdGoalId: uuid("created_goal_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [assessments.tenantId],
    references: [tenants.id],
  }),
  template: one(assessmentTemplates, {
    fields: [assessments.templateId],
    references: [assessmentTemplates.id],
  }),
  subject: one(users, {
    fields: [assessments.subjectId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [assessments.createdById],
    references: [users.id],
  }),
  invitations: many(assessmentInvitations),
  results: many(assessmentResults),
  goalSuggestions: many(assessmentGoalSuggestions),
}));

export const assessmentInvitationsRelations = relations(assessmentInvitations, ({ one, many }) => ({
  assessment: one(assessments, {
    fields: [assessmentInvitations.assessmentId],
    references: [assessments.id],
  }),
  rater: one(users, {
    fields: [assessmentInvitations.raterId],
    references: [users.id],
  }),
  responses: many(assessmentResponses),
}));

export const assessmentResponsesRelations = relations(assessmentResponses, ({ one }) => ({
  invitation: one(assessmentInvitations, {
    fields: [assessmentResponses.invitationId],
    references: [assessmentInvitations.id],
  }),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentResults.assessmentId],
    references: [assessments.id],
  }),
}));

export const assessmentGoalSuggestionsRelations = relations(assessmentGoalSuggestions, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentGoalSuggestions.assessmentId],
    references: [assessments.id],
  }),
  result: one(assessmentResults, {
    fields: [assessmentGoalSuggestions.resultId],
    references: [assessmentResults.id],
  }),
}));
