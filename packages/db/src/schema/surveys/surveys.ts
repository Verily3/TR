import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { users } from '../core/users';
import { agencies } from '../core/agencies';
import { tenants } from '../core/tenants';
import { enrollments } from '../programs/enrollments';

// ── Enums ──────────────────────────────────────────────────────────────────────

export const surveyStatusEnum = pgEnum('survey_status', [
  'draft',
  'active',
  'closed',
]);

export const surveyQuestionTypeEnum = pgEnum('survey_question_type', [
  'single_choice',
  'multiple_choice',
  'text',
  'rating',
  'nps',
  'yes_no',
  'ranking',
]);

// ── surveys ────────────────────────────────────────────────────────────────────

export const surveys = pgTable(
  'surveys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: surveyStatusEnum('status').notNull().default('draft'),
    // Response settings
    anonymous: boolean('anonymous').notNull().default(false),
    requireLogin: boolean('require_login').notNull().default(true),
    allowMultipleResponses: boolean('allow_multiple_responses').notNull().default(false),
    showResultsToRespondent: boolean('show_results_to_respondent').notNull().default(false),
    // Share link (generated on creation for anonymous surveys)
    shareToken: varchar('share_token', { length: 64 }).unique(),
    // Metadata
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('surveys_tenant_idx').on(t.tenantId),
    index('surveys_agency_idx').on(t.agencyId),
    uniqueIndex('surveys_share_token_idx').on(t.shareToken),
  ]
);

// ── survey_questions ───────────────────────────────────────────────────────────

export interface SurveyQuestionConfig {
  options?: string[];          // single_choice, multiple_choice, yes_no
  min?: number;                // rating: scale minimum
  max?: number;                // rating: scale maximum (default 5)
  minLabel?: string;           // rating: label for minimum end
  maxLabel?: string;           // rating: label for maximum end
  items?: string[];            // ranking: ordered list of items to rank
  placeholder?: string;        // text: placeholder hint
}

export const surveyQuestions = pgTable(
  'survey_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    description: text('description'),
    type: surveyQuestionTypeEnum('type').notNull(),
    required: boolean('required').notNull().default(true),
    order: integer('order').notNull().default(0),
    config: jsonb('config').$type<SurveyQuestionConfig>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('survey_questions_survey_idx').on(t.surveyId),
  ]
);

// ── survey_responses ───────────────────────────────────────────────────────────

export const surveyResponses = pgTable(
  'survey_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    enrollmentId: uuid('enrollment_id').references(() => enrollments.id, { onDelete: 'set null' }),
    // For anonymous deduplication — stored in localStorage on client
    sessionToken: varchar('session_token', { length: 64 }),
    answers: jsonb('answers').$type<Record<string, unknown>>().notNull().default({}),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('survey_responses_survey_idx').on(t.surveyId),
    index('survey_responses_user_idx').on(t.userId),
  ]
);
