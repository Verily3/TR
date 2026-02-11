import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tenants } from './tenants';

// Forward declare to avoid circular dependencies
import { programs } from '../programs/programs';

/**
 * Onboarding type enum - determines which onboarding flow to show
 */
export const onboardingTypeEnum = pgEnum('onboarding_type', [
  'program_only',       // Just enrolled in program: welcome → prework → setup
  'strategic_planning', // Org/team setup: welcome → org → team → goals
  'full_platform',      // Complete wizard: all steps
]);

/**
 * Onboarding status enum
 */
export const onboardingStatusEnum = pgEnum('onboarding_status', [
  'not_started',
  'in_progress',
  'completed',
  'skipped',
]);

/**
 * Completed steps structure
 */
export interface OnboardingCompletedSteps {
  stepId: string;
  completedAt: string;
}

/**
 * Form data structure - varies by step
 */
export interface OnboardingFormData {
  [stepId: string]: Record<string, unknown>;
}

/**
 * Onboarding progress table - tracks user progress through onboarding
 *
 * Supports dynamic onboarding paths based on user's assigned programs/features.
 * Auto-saves form data and remembers position for resume capability.
 */
export const onboardingProgress = pgTable(
  'onboarding_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Who is being onboarded
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Optional: user's tenant (for tenant-specific onboarding)
    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'set null',
    }),

    // Optional: if onboarding is program-specific
    programId: uuid('program_id').references(() => programs.id, {
      onDelete: 'set null',
    }),

    // What type of onboarding flow
    onboardingType: onboardingTypeEnum('onboarding_type')
      .notNull()
      .default('full_platform'),

    // Current position
    currentStep: varchar('current_step', { length: 50 }).notNull(),

    // Completed steps with timestamps
    completedSteps: jsonb('completed_steps')
      .$type<OnboardingCompletedSteps[]>()
      .default([]),

    // Auto-saved form data per step
    formData: jsonb('form_data').$type<OnboardingFormData>().default({}),

    // Overall status
    status: onboardingStatusEnum('status').notNull().default('not_started'),

    // Timeline
    startedAt: timestamp('started_at', { withTimezone: true }),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // User can only have one onboarding per program (or one general onboarding)
    uniqueIndex('onboarding_progress_user_program_unique').on(
      table.userId,
      table.programId
    ),
    index('onboarding_progress_user_idx').on(table.userId),
    index('onboarding_progress_tenant_idx').on(table.tenantId),
    index('onboarding_progress_status_idx').on(table.status),
  ]
);

export const onboardingProgressRelations = relations(
  onboardingProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [onboardingProgress.userId],
      references: [users.id],
    }),
    tenant: one(tenants, {
      fields: [onboardingProgress.tenantId],
      references: [tenants.id],
    }),
    program: one(programs, {
      fields: [onboardingProgress.programId],
      references: [programs.id],
    }),
  })
);

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type NewOnboardingProgress = typeof onboardingProgress.$inferInsert;
