import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from '../core/agencies';
import { users } from '../core/users';

/**
 * Template status enum
 */
export const templateStatusEnum = pgEnum('template_status', [
  'draft',
  'published',
  'archived',
]);

/**
 * Assessment type enum
 * - 180: Self + manager only
 * - 360: Self + manager + peers + direct reports
 * - custom: Custom rater configuration
 */
export const assessmentTypeEnum = pgEnum('assessment_type', [
  '180',
  '360',
  'custom',
]);

/**
 * Rater type enum
 */
export const raterTypeEnum = pgEnum('rater_type', [
  'self',
  'manager',
  'peer',
  'direct_report',
]);

/**
 * Question type enum
 */
export const questionTypeEnum = pgEnum('question_type', [
  'rating',       // Numeric scale rating
  'text',         // Open text response
  'multiple_choice',
  'ranking',      // Rank items in order
]);

/**
 * Competency structure
 */
export interface TemplateQuestion {
  id: string;
  text: string;
  type?: 'rating' | 'text' | 'multiple_choice';
  required?: boolean;
  reverseScored?: boolean;  // [R] items — score is inverted during computation
  isCCI?: boolean;          // Coaching Capacity Index item (one per competency)
}

export interface TemplateCompetency {
  id: string;
  name: string;
  description?: string;
  subtitle?: string;  // e.g., "Direction Must Hold Under Pressure"
  questions: TemplateQuestion[];
}

/**
 * Template configuration
 */
export interface TemplateConfig {
  competencies: TemplateCompetency[];
  scaleMin: number;
  scaleMax: number;
  scaleLabels: string[];
  allowComments: boolean;
  requireComments: boolean;
  anonymizeResponses: boolean;
  raterTypes: ('self' | 'manager' | 'peer' | 'direct_report')[];
  minRatersPerType?: Record<string, number>;
  maxRatersPerType?: Record<string, number>;
}

/**
 * Assessment templates table - agency-owned templates
 *
 * Templates define the structure of assessments including competencies,
 * questions, rating scales, and rater types (180/360/custom).
 */
export const assessmentTemplates = pgTable(
  'assessment_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Owner (agency creates templates)
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Basic info
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Assessment type (determines rater configuration)
    assessmentType: assessmentTypeEnum('assessment_type')
      .notNull()
      .default('360'),

    // Status
    status: templateStatusEnum('status').notNull().default('draft'),

    // Version tracking
    version: integer('version').notNull().default(1),
    parentTemplateId: uuid('parent_template_id'), // For versioning

    // Configuration (competencies, questions, scale, etc.)
    config: jsonb('config').$type<TemplateConfig>().notNull(),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('assessment_templates_agency_idx').on(table.agencyId),
    index('assessment_templates_status_idx').on(table.status),
    index('assessment_templates_type_idx').on(table.assessmentType),
  ]
);

export const assessmentTemplatesRelations = relations(
  assessmentTemplates,
  ({ one, many }) => ({
    agency: one(agencies, {
      fields: [assessmentTemplates.agencyId],
      references: [agencies.id],
    }),
    createdByUser: one(users, {
      fields: [assessmentTemplates.createdBy],
      references: [users.id],
    }),
    parentTemplate: one(assessmentTemplates, {
      fields: [assessmentTemplates.parentTemplateId],
      references: [assessmentTemplates.id],
      relationName: 'templateVersions',
    }),
    versions: many(assessmentTemplates, {
      relationName: 'templateVersions',
    }),
  })
);

export type AssessmentTemplate = typeof assessmentTemplates.$inferSelect;
export type NewAssessmentTemplate = typeof assessmentTemplates.$inferInsert;
