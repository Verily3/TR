import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { tenants } from '../core/tenants';
import { agencies } from '../core/agencies';
import { users } from '../core/users';

/**
 * Program type enum
 */
export const programTypeEnum = pgEnum('program_type', ['cohort', 'self_paced']);

/**
 * Program status enum
 */
export const programStatusEnum = pgEnum('program_status', [
  'draft',
  'active',
  'archived',
]);

/**
 * Program configuration stored as JSONB
 */
export interface ProgramEmailSettings {
  // Toggle which email types are active for this program
  welcome?: boolean;
  kickoff?: boolean;
  weeklyDigest?: boolean;
  weeklyDigestDay?: number;              // 0=Sun … 6=Sat, default 1 (Mon)
  inactivityReminders?: boolean;
  inactivityDays?: number;              // days of inactivity before reminder, default 7
  milestones?: boolean;
  completion?: boolean;
  mentorSummary?: boolean;
  mentorSummaryFrequency?: 'weekly' | 'biweekly';
  // Due-date reminders (days relative to due date; negative = before, positive = after)
  beforeDueReminders?: number[];        // e.g. [14, 7, 3, 1, 0]
  afterDueReminders?: number[];         // e.g. [1, 3, 7]
  // Per-program copy overrides (keyed by email type id)
  subjectOverrides?: Record<string, string>;
  bodyOverrides?: Record<string, string>;
}

export interface ProgramConfig {
  sequentialAccess?: boolean;
  trackInScorecard?: boolean;
  autoEnrollment?: boolean;
  requireManagerApproval?: boolean;
  allowSelfEnrollment?: boolean;
  maxCapacity?: number;
  waitlistEnabled?: boolean;
  issueCertificate?: boolean;
  linkToGoals?: boolean;
  // Multi-tenant settings
  allowCrossTenantEnrollment?: boolean;
  requireMentor?: boolean;
  // Email / notification configuration
  emailSettings?: ProgramEmailSettings;
}

/**
 * Programs table - learning programs/courses
 */
export const programs = pgTable(
  'programs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Programs are owned by agencies (required)
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),

    // Optional: if program is specific to a single tenant
    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'set null',
    }),

    // For multi-tenant programs: which tenants can have participants
    allowedTenantIds: uuid('allowed_tenant_ids')
      .array()
      .default(sql`'{}'::uuid[]`),

    // Basic info
    name: varchar('name', { length: 255 }).notNull(),
    internalName: varchar('internal_name', { length: 255 }),
    description: text('description'),

    // Type and status
    type: programTypeEnum('type').notNull().default('cohort'),
    status: programStatusEnum('status').notNull().default('draft'),

    // Appearance
    coverImage: text('cover_image'),

    // Scheduling (for cohort programs)
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    timezone: varchar('timezone', { length: 50 }).default('America/New_York'),

    // Configuration
    config: jsonb('config').$type<ProgramConfig>().default({}),

    // Template support
    isTemplate: boolean('is_template').notNull().default(false),
    sourceTemplateId: uuid('source_template_id'),

    // Audit — how the program was created
    creationSource: varchar('creation_source', { length: 30 }).default('wizard'),

    // Tracking
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('programs_tenant_id_idx').on(table.tenantId),
    index('programs_agency_id_idx').on(table.agencyId),
    index('programs_status_idx').on(table.status),
    index('programs_type_idx').on(table.type),
    index('programs_start_date_idx').on(table.startDate),
    index('programs_end_date_idx').on(table.endDate),
  ]
);

// Forward declare for circular reference
import { modules } from './modules';
import { enrollments } from './enrollments';

export const programsRelations = relations(programs, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [programs.tenantId],
    references: [tenants.id],
  }),
  agency: one(agencies, {
    fields: [programs.agencyId],
    references: [agencies.id],
  }),
  createdByUser: one(users, {
    fields: [programs.createdBy],
    references: [users.id],
  }),
  sourceTemplate: one(programs, {
    fields: [programs.sourceTemplateId],
    references: [programs.id],
    relationName: 'templateDerivations',
  }),
  derivedPrograms: many(programs, { relationName: 'templateDerivations' }),
  modules: many(modules),
  enrollments: many(enrollments),
}));

export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
