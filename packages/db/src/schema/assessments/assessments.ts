import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  jsonb,
  index,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from '../core/tenants';
import { users } from '../core/users';
import { assessmentTemplates, raterTypeEnum } from './templates';

/**
 * Assessment status enum
 */
export const assessmentStatusEnum = pgEnum('assessment_status', [
  'draft',        // Being configured
  'open',         // Accepting responses
  'closed',       // No longer accepting responses
  'completed',    // All responses collected and analyzed
]);

/**
 * Invitation status enum
 */
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'sent',
  'viewed',
  'started',
  'completed',
  'declined',
  'expired',
]);

/**
 * Assessments table - instances of templates for specific subjects
 *
 * An assessment is created from a template to evaluate a specific person
 * (the subject). Raters are invited based on the assessment type (180/360).
 */
export const assessments = pgTable(
  'assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Template and tenant
    templateId: uuid('template_id')
      .notNull()
      .references(() => assessmentTemplates.id, { onDelete: 'restrict' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    // Who is being assessed
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Who created/manages this assessment
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Assessment details
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Status and timeline
    status: assessmentStatusEnum('status').notNull().default('draft'),
    openDate: date('open_date'),
    closeDate: date('close_date'),

    // Settings
    anonymizeResults: boolean('anonymize_results').notNull().default(true),
    showResultsToSubject: boolean('show_results_to_subject')
      .notNull()
      .default(true),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('assessments_template_idx').on(table.templateId),
    index('assessments_tenant_idx').on(table.tenantId),
    index('assessments_subject_idx').on(table.subjectId),
    index('assessments_status_idx').on(table.status),
  ]
);

/**
 * Assessment invitations table - raters invited to complete assessments
 */
export const assessmentInvitations = pgTable(
  'assessment_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Which assessment
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),

    // The rater
    raterId: uuid('rater_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // What type of rater
    raterType: raterTypeEnum('rater_type').notNull(),

    // Status
    status: invitationStatusEnum('status').notNull().default('pending'),

    // Access token for anonymous/external raters
    accessToken: varchar('access_token', { length: 64 }).unique(),

    // Tracking
    sentAt: timestamp('sent_at', { withTimezone: true }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // Reminder tracking
    reminderCount: varchar('reminder_count', { length: 10 }).default('0'),
    lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('assessment_invitations_assessment_idx').on(table.assessmentId),
    index('assessment_invitations_rater_idx').on(table.raterId),
    index('assessment_invitations_status_idx').on(table.status),
    index('assessment_invitations_token_idx').on(table.accessToken),
  ]
);

/**
 * Response data structure
 */
export interface AssessmentResponseData {
  competencyId: string;
  questionId: string;
  rating?: number;
  text?: string;
  comment?: string;
}

/**
 * Assessment responses table - actual ratings/feedback from raters
 */
export const assessmentResponses = pgTable(
  'assessment_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Which invitation this response is for
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => assessmentInvitations.id, { onDelete: 'cascade' }),

    // Response data (array of question responses)
    responses: jsonb('responses').$type<AssessmentResponseData[]>().notNull(),

    // Overall comments
    overallComments: text('overall_comments'),

    // Submission tracking
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    isComplete: boolean('is_complete').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('assessment_responses_invitation_idx').on(table.invitationId),
    index('assessment_responses_complete_idx').on(table.isComplete),
  ]
);

// Relations
export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  template: one(assessmentTemplates, {
    fields: [assessments.templateId],
    references: [assessmentTemplates.id],
  }),
  tenant: one(tenants, {
    fields: [assessments.tenantId],
    references: [tenants.id],
  }),
  subject: one(users, {
    fields: [assessments.subjectId],
    references: [users.id],
    relationName: 'assessmentsAsSubject',
  }),
  createdByUser: one(users, {
    fields: [assessments.createdBy],
    references: [users.id],
    relationName: 'assessmentsCreated',
  }),
  invitations: many(assessmentInvitations),
}));

export const assessmentInvitationsRelations = relations(
  assessmentInvitations,
  ({ one, many }) => ({
    assessment: one(assessments, {
      fields: [assessmentInvitations.assessmentId],
      references: [assessments.id],
    }),
    rater: one(users, {
      fields: [assessmentInvitations.raterId],
      references: [users.id],
    }),
    responses: many(assessmentResponses),
  })
);

export const assessmentResponsesRelations = relations(
  assessmentResponses,
  ({ one }) => ({
    invitation: one(assessmentInvitations, {
      fields: [assessmentResponses.invitationId],
      references: [assessmentInvitations.id],
    }),
  })
);

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
export type AssessmentInvitation = typeof assessmentInvitations.$inferSelect;
export type NewAssessmentInvitation = typeof assessmentInvitations.$inferInsert;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type NewAssessmentResponse = typeof assessmentResponses.$inferInsert;
