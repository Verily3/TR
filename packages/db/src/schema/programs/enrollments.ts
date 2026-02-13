import {
  pgTable,
  uuid,
  timestamp,
  integer,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { programs } from './programs';
import { users } from '../core/users';
import { tenants } from '../core/tenants';

/**
 * Enrollment role enum
 */
export const enrollmentRoleEnum = pgEnum('enrollment_role', [
  'learner',
  'mentor',
  'facilitator',
]);

/**
 * Enrollment status enum
 */
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'active',
  'completed',
  'dropped',
]);

/**
 * Mentorship status enum
 */
export const mentorshipStatusEnum = pgEnum('mentorship_status', [
  'active',
  'inactive',
]);

/**
 * Enrollments table - user participation in programs
 *
 * Supports cross-tenant enrollment: users from different tenants can all
 * enroll in the same agency-owned program. The tenantId tracks the user's
 * home tenant for filtering and reporting purposes.
 */
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Links to agency-owned program
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),

    // The enrolled user
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // User's home tenant (for cross-tenant filtering)
    // Nullable: participants without a company can be enrolled and assigned later
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'set null' }),

    // Role in program
    role: enrollmentRoleEnum('role').notNull().default('learner'),

    // Status
    status: enrollmentStatusEnum('status').notNull().default('active'),

    // Timeline
    enrolledAt: timestamp('enrolled_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Progress
    progress: integer('progress').notNull().default(0), // 0-100
    pointsEarned: integer('points_earned').notNull().default(0),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('enrollments_program_user_unique').on(
      table.programId,
      table.userId
    ),
    index('enrollments_program_id_idx').on(table.programId),
    index('enrollments_user_id_idx').on(table.userId),
    index('enrollments_tenant_id_idx').on(table.tenantId),
    index('enrollments_role_idx').on(table.role),
    index('enrollments_status_idx').on(table.status),
    index('enrollments_completed_at_idx').on(table.completedAt),
  ]
);

/**
 * Enrollment mentorships table - mentor-learner assignments within a program
 */
export const enrollmentMentorships = pgTable(
  'enrollment_mentorships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    mentorUserId: uuid('mentor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),

    // Assignment tracking
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: mentorshipStatusEnum('status').notNull().default('active'),

    // Audit timestamp
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('enrollment_mentorships_unique').on(
      table.enrollmentId,
      table.mentorUserId
    ),
    index('enrollment_mentorships_mentor_idx').on(table.mentorUserId),
    index('enrollment_mentorships_program_idx').on(table.programId),
  ]
);

// Forward declare
import { lessonProgress, goalResponses, approvalSubmissions } from './progress';

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  program: one(programs, {
    fields: [enrollments.programId],
    references: [programs.id],
  }),
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [enrollments.tenantId],
    references: [tenants.id],
  }),
  mentorships: many(enrollmentMentorships),
  lessonProgress: many(lessonProgress),
  goalResponses: many(goalResponses),
  approvalSubmissions: many(approvalSubmissions),
}));

export const enrollmentMentorshipsRelations = relations(
  enrollmentMentorships,
  ({ one }) => ({
    enrollment: one(enrollments, {
      fields: [enrollmentMentorships.enrollmentId],
      references: [enrollments.id],
    }),
    mentor: one(users, {
      fields: [enrollmentMentorships.mentorUserId],
      references: [users.id],
    }),
    program: one(programs, {
      fields: [enrollmentMentorships.programId],
      references: [programs.id],
    }),
  })
);

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type EnrollmentMentorship = typeof enrollmentMentorships.$inferSelect;
export type NewEnrollmentMentorship = typeof enrollmentMentorships.$inferInsert;
