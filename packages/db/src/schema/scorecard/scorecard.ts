import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  timestamp,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from '../core/tenants';
import { users } from '../core/users';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const scorecardItemStatusEnum = pgEnum('scorecard_item_status', [
  'on_track',
  'at_risk',
  'needs_attention',
]);

export const scorecardMetricTrendEnum = pgEnum('scorecard_metric_trend', [
  'up',
  'down',
  'neutral',
]);

// ─── scorecard_items ──────────────────────────────────────────────────────────
/**
 * Scorecard accountability items — key responsibilities/areas for a user
 * in a given period (e.g., Q1-2026).
 */
export const scorecardItems = pgTable(
  'scorecard_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Display order within the scorecard
    ordinal: integer('ordinal').notNull().default(0),

    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // 0–100 score representing performance on this accountability
    score: integer('score').notNull().default(0),

    status: scorecardItemStatusEnum('status').notNull().default('on_track'),

    // Period identifier: e.g., "Q1-2026", "2026"
    period: varchar('period', { length: 20 }).notNull().default(''),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('scorecard_items_tenant_idx').on(table.tenantId),
    index('scorecard_items_user_idx').on(table.userId),
    index('scorecard_items_period_idx').on(table.period),
  ]
);

// ─── scorecard_metrics ────────────────────────────────────────────────────────
/**
 * KPI metrics for a user's scorecard — organized by category.
 * Each metric has a target and actual value with trend tracking.
 */
export const scorecardMetrics = pgTable(
  'scorecard_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Optional link to a scorecard item (accountability)
    scorecardItemId: uuid('scorecard_item_id').references(() => scorecardItems.id, {
      onDelete: 'set null',
    }),

    // Grouping category label (e.g., "Financial", "Operational")
    category: varchar('category', { length: 100 }).notNull(),

    // Display order within its category
    ordinal: integer('ordinal').notNull().default(0),

    name: varchar('name', { length: 255 }).notNull(),

    // Human-readable values — stored as strings to support formatting
    // e.g., "$24.5M", "82.3%", "124"
    targetValue: varchar('target_value', { length: 100 }).notNull().default(''),
    actualValue: varchar('actual_value', { length: 100 }).notNull().default(''),

    // Numeric actual value for calculations (optional)
    actualNumeric: real('actual_numeric'),
    targetNumeric: real('target_numeric'),

    // Formatted change label (e.g., "+6.5%", "-2.7%")
    changeLabel: varchar('change_label', { length: 50 }),

    trend: scorecardMetricTrendEnum('trend').notNull().default('neutral'),

    // When true, an upward trend is bad (e.g., TRIR injury rate)
    invertTrend: integer('invert_trend').notNull().default(0),

    // Period identifier: e.g., "Q1-2026"
    period: varchar('period', { length: 20 }).notNull().default(''),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('scorecard_metrics_tenant_idx').on(table.tenantId),
    index('scorecard_metrics_user_idx').on(table.userId),
    index('scorecard_metrics_period_idx').on(table.period),
    index('scorecard_metrics_category_idx').on(table.category),
    index('scorecard_metrics_item_idx').on(table.scorecardItemId),
  ]
);

// ─── scorecard_competencies ───────────────────────────────────────────────────
/**
 * Leadership competency ratings — self and manager assessments.
 * Scale: 1–5 (or 0 = not yet rated).
 */
export const scorecardCompetencies = pgTable(
  'scorecard_competencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // The manager/reviewer who provided the manager rating (optional)
    reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),

    // Display order
    ordinal: integer('ordinal').notNull().default(0),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // 0 = not yet rated, 1–5 rating scale
    selfRating: integer('self_rating').notNull().default(0),
    managerRating: integer('manager_rating').notNull().default(0),

    // Period identifier: e.g., "Q1-2026"
    period: varchar('period', { length: 20 }).notNull().default(''),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('scorecard_competencies_tenant_idx').on(table.tenantId),
    index('scorecard_competencies_user_idx').on(table.userId),
    index('scorecard_competencies_period_idx').on(table.period),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const scorecardItemsRelations = relations(scorecardItems, ({ one, many }) => ({
  tenant: one(tenants, { fields: [scorecardItems.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [scorecardItems.userId], references: [users.id] }),
  metrics: many(scorecardMetrics),
}));

export const scorecardMetricsRelations = relations(scorecardMetrics, ({ one }) => ({
  tenant: one(tenants, { fields: [scorecardMetrics.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [scorecardMetrics.userId], references: [users.id] }),
  scorecardItem: one(scorecardItems, {
    fields: [scorecardMetrics.scorecardItemId],
    references: [scorecardItems.id],
  }),
}));

export const scorecardCompetenciesRelations = relations(scorecardCompetencies, ({ one }) => ({
  tenant: one(tenants, { fields: [scorecardCompetencies.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [scorecardCompetencies.userId], references: [users.id] }),
  reviewer: one(users, {
    fields: [scorecardCompetencies.reviewerId],
    references: [users.id],
    relationName: 'reviewedCompetencies',
  }),
}));

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type ScorecardItem = typeof scorecardItems.$inferSelect;
export type NewScorecardItem = typeof scorecardItems.$inferInsert;
export type ScorecardMetric = typeof scorecardMetrics.$inferSelect;
export type NewScorecardMetric = typeof scorecardMetrics.$inferInsert;
export type ScorecardCompetency = typeof scorecardCompetencies.$inferSelect;
export type NewScorecardCompetency = typeof scorecardCompetencies.$inferInsert;
