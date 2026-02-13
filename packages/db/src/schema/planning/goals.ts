import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../core/users';
import { tenants } from '../core/tenants';
import { assessments } from '../assessments/assessments';

/**
 * Individual goal status enum
 */
export const individualGoalStatusEnum = pgEnum('individual_goal_status', [
  'draft',
  'active',
  'completed',
  'on_hold',
  'cancelled',
]);

/**
 * Goal category enum
 */
export const goalCategoryEnum = pgEnum('goal_category', [
  'professional',
  'personal',
  'leadership',
  'strategic',
  'performance',
  'development',
]);

/**
 * Goal priority enum
 */
export const goalPriorityEnum = pgEnum('goal_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Individual goals table - standalone goals not tied to programs
 *
 * These are personal or team goals that can optionally be linked
 * to program goals or strategic planning objectives.
 */
export const individualGoals = pgTable(
  'individual_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Owner
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    // Goal content
    title: text('title').notNull(),
    description: text('description'),
    successMetrics: text('success_metrics'),
    actionSteps: jsonb('action_steps').$type<string[]>().default([]),

    // Classification
    category: goalCategoryEnum('category').default('professional'),
    priority: goalPriorityEnum('priority').default('medium'),

    // Timeline
    startDate: date('start_date'),
    targetDate: date('target_date'),

    // Progress tracking
    progress: integer('progress').notNull().default(0), // 0-100
    status: individualGoalStatusEnum('status').notNull().default('draft'),

    // Parent goal (for cascading goals)
    parentGoalId: uuid('parent_goal_id'),

    // Optional assessment link (goal created from assessment results)
    assessmentId: uuid('assessment_id').references(() => assessments.id, {
      onDelete: 'set null',
    }),

    // Review settings (same as program goals)
    reviewFrequency: text('review_frequency').default('monthly'),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('individual_goals_user_idx').on(table.userId),
    index('individual_goals_tenant_idx').on(table.tenantId),
    index('individual_goals_status_idx').on(table.status),
    index('individual_goals_category_idx').on(table.category),
    index('individual_goals_parent_idx').on(table.parentGoalId),
    index('individual_goals_assessment_idx').on(table.assessmentId),
    index('individual_goals_target_date_idx').on(table.targetDate),
  ]
);

// Self-referential relation for parent goal
export const individualGoalsRelations = relations(
  individualGoals,
  ({ one, many }) => ({
    user: one(users, {
      fields: [individualGoals.userId],
      references: [users.id],
    }),
    tenant: one(tenants, {
      fields: [individualGoals.tenantId],
      references: [tenants.id],
    }),
    parentGoal: one(individualGoals, {
      fields: [individualGoals.parentGoalId],
      references: [individualGoals.id],
      relationName: 'childGoals',
    }),
    childGoals: many(individualGoals, {
      relationName: 'childGoals',
    }),
    assessment: one(assessments, {
      fields: [individualGoals.assessmentId],
      references: [assessments.id],
    }),
  })
);

export type IndividualGoal = typeof individualGoals.$inferSelect;
export type NewIndividualGoal = typeof individualGoals.$inferInsert;
