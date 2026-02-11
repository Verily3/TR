import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from '../core/tenants';
import { users } from '../core/users';
import { individualGoals } from './goals';
import { goalResponses } from '../programs/progress';

/**
 * Strategic plan type enum
 * - 3hag: 3-Year Highly Achievable Goal
 * - bhag: Big Hairy Audacious Goal (10-25 year vision)
 * - annual: Annual operating plan
 * - quarterly: Quarterly objectives (OKRs)
 */
export const strategicPlanTypeEnum = pgEnum('strategic_plan_type', [
  '3hag',
  'bhag',
  'annual',
  'quarterly',
]);

/**
 * Strategic plan status enum
 */
export const strategicPlanStatusEnum = pgEnum('strategic_plan_status', [
  'draft',
  'active',
  'completed',
  'archived',
]);

/**
 * Goal alignment type enum
 */
export const goalAlignmentTypeEnum = pgEnum('goal_alignment_type', [
  'supports',      // This goal supports the strategic objective
  'derived_from',  // This goal is derived from the strategic objective
  'related',       // This goal is related to the strategic objective
]);

/**
 * Strategic plan configuration
 */
export interface StrategicPlanConfig {
  // For 3HAG
  revenueTarget?: number;
  profitTarget?: number;
  marketPosition?: string;

  // For BHAG
  visionStatement?: string;
  coreValues?: string[];

  // For quarterly
  okrFormat?: boolean;
  keyResults?: string[];

  // General
  metrics?: { name: string; target: string; current?: string }[];
}

/**
 * Strategic plans table - organizational strategic planning
 *
 * Supports 3HAG (3-Year Highly Achievable Goal), BHAG (Big Hairy Audacious Goal),
 * annual plans, and quarterly objectives.
 */
export const strategicPlans = pgTable(
  'strategic_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Owner
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Plan details
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    planType: strategicPlanTypeEnum('plan_type').notNull(),

    // Timeline
    startDate: date('start_date'),
    targetDate: date('target_date'),

    // Status
    status: strategicPlanStatusEnum('status').notNull().default('draft'),

    // Configuration (varies by plan type)
    config: jsonb('config').$type<StrategicPlanConfig>().default({}),

    // Parent plan (for cascading: BHAG → 3HAG → Annual → Quarterly)
    parentPlanId: uuid('parent_plan_id'),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('strategic_plans_tenant_idx').on(table.tenantId),
    index('strategic_plans_type_idx').on(table.planType),
    index('strategic_plans_status_idx').on(table.status),
    index('strategic_plans_parent_idx').on(table.parentPlanId),
  ]
);

/**
 * Strategic goal links table - connects goals to strategic plans
 *
 * Enables intelligent goal linking between:
 * - Individual goals and strategic objectives
 * - Program goals and strategic objectives
 * - Goal cascading across organizational levels
 */
export const strategicGoalLinks = pgTable(
  'strategic_goal_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // The strategic plan/objective this links to
    strategicPlanId: uuid('strategic_plan_id')
      .notNull()
      .references(() => strategicPlans.id, { onDelete: 'cascade' }),

    // Link to individual goal (optional, one of these must be set)
    individualGoalId: uuid('individual_goal_id').references(
      () => individualGoals.id,
      { onDelete: 'cascade' }
    ),

    // Link to program goal response (optional)
    programGoalId: uuid('program_goal_id').references(() => goalResponses.id, {
      onDelete: 'cascade',
    }),

    // How the goal aligns with the strategic objective
    alignmentType: goalAlignmentTypeEnum('alignment_type')
      .notNull()
      .default('supports'),

    // Notes about the alignment
    alignmentNotes: text('alignment_notes'),

    // Who created the link
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('strategic_goal_links_plan_idx').on(table.strategicPlanId),
    index('strategic_goal_links_individual_idx').on(table.individualGoalId),
    index('strategic_goal_links_program_idx').on(table.programGoalId),
  ]
);

// Relations
export const strategicPlansRelations = relations(
  strategicPlans,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [strategicPlans.tenantId],
      references: [tenants.id],
    }),
    createdByUser: one(users, {
      fields: [strategicPlans.createdBy],
      references: [users.id],
    }),
    parentPlan: one(strategicPlans, {
      fields: [strategicPlans.parentPlanId],
      references: [strategicPlans.id],
      relationName: 'childPlans',
    }),
    childPlans: many(strategicPlans, {
      relationName: 'childPlans',
    }),
    goalLinks: many(strategicGoalLinks),
  })
);

export const strategicGoalLinksRelations = relations(
  strategicGoalLinks,
  ({ one }) => ({
    strategicPlan: one(strategicPlans, {
      fields: [strategicGoalLinks.strategicPlanId],
      references: [strategicPlans.id],
    }),
    individualGoal: one(individualGoals, {
      fields: [strategicGoalLinks.individualGoalId],
      references: [individualGoals.id],
    }),
    programGoal: one(goalResponses, {
      fields: [strategicGoalLinks.programGoalId],
      references: [goalResponses.id],
    }),
    createdByUser: one(users, {
      fields: [strategicGoalLinks.createdBy],
      references: [users.id],
    }),
  })
);

export type StrategicPlan = typeof strategicPlans.$inferSelect;
export type NewStrategicPlan = typeof strategicPlans.$inferInsert;
export type StrategicGoalLink = typeof strategicGoalLinks.$inferSelect;
export type NewStrategicGoalLink = typeof strategicGoalLinks.$inferInsert;
