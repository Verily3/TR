import {
  pgTable,
  uuid,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from '../core/agencies';
import { assessmentTemplates } from './templates';

/**
 * Benchmark data per competency
 */
export interface CompetencyBenchmark {
  mean: number;
  median: number;
  p25: number;
  p75: number;
  stdDev: number;
  sampleSize: number;
}

/**
 * Full benchmark data structure (keyed by competencyId)
 */
export type BenchmarkData = Record<string, CompetencyBenchmark>;

/**
 * Assessment benchmarks table — agency-level normative data per template
 *
 * Aggregated from all completed assessments across the agency's tenants
 * that used the same template. Recomputed periodically.
 */
export const assessmentBenchmarks = pgTable(
  'assessment_benchmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Owner agency
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),

    // Which template this benchmark is for
    templateId: uuid('template_id')
      .notNull()
      .references(() => assessmentTemplates.id, { onDelete: 'cascade' }),

    // How many completed assessments contributed
    sampleSize: integer('sample_size').notNull().default(0),

    // Per-competency benchmark statistics
    benchmarkData: jsonb('benchmark_data').$type<BenchmarkData>().notNull(),

    // When this was last computed
    computedAt: timestamp('computed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('assessment_benchmarks_agency_template_idx').on(
      table.agencyId,
      table.templateId
    ),
    index('assessment_benchmarks_template_idx').on(table.templateId),
  ]
);

export const assessmentBenchmarksRelations = relations(
  assessmentBenchmarks,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [assessmentBenchmarks.agencyId],
      references: [agencies.id],
    }),
    template: one(assessmentTemplates, {
      fields: [assessmentBenchmarks.templateId],
      references: [assessmentTemplates.id],
    }),
  })
);

export type AssessmentBenchmark = typeof assessmentBenchmarks.$inferSelect;
export type NewAssessmentBenchmark = typeof assessmentBenchmarks.$inferInsert;
