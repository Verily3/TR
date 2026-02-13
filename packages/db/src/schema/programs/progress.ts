import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lessons } from './lessons';
import { enrollments } from './enrollments';
import { users } from '../core/users';
import { lessonTasks } from './tasks';

/**
 * Lesson progress status enum
 */
export const progressStatusEnum = pgEnum('progress_status', [
  'not_started',
  'in_progress',
  'completed',
]);

/**
 * Goal status enum
 */
export const goalStatusEnum = pgEnum('goal_status', [
  'draft',
  'active',
  'completed',
]);

/**
 * Goal review frequency enum
 */
export const reviewFrequencyEnum = pgEnum('review_frequency', [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
]);

/**
 * Approval status enum
 */
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);

/**
 * Lesson progress table - tracks individual lesson completion
 */
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),

    // Progress status
    status: progressStatusEnum('status').notNull().default('not_started'),

    // Timeline
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Points
    pointsEarned: integer('points_earned').notNull().default(0),

    // Submission data for assignments, text_forms, etc.
    submissionData: jsonb('submission_data'),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('lesson_progress_unique').on(table.enrollmentId, table.lessonId),
    index('lesson_progress_enrollment_idx').on(table.enrollmentId),
    index('lesson_progress_lesson_idx').on(table.lessonId),
    index('lesson_progress_status_idx').on(table.status),
  ]
);

/**
 * Goal responses table - for 'goal' content type
 */
export const goalResponses = pgTable(
  'goal_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),

    // Goal content
    statement: text('statement').notNull(),
    successMetrics: text('success_metrics'),
    actionSteps: jsonb('action_steps').$type<string[]>().default([]),
    targetDate: date('target_date'),

    // Review settings
    reviewFrequency: reviewFrequencyEnum('review_frequency')
      .notNull()
      .default('monthly'),

    // Status
    status: goalStatusEnum('status').notNull().default('draft'),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('goal_responses_unique').on(table.lessonId, table.enrollmentId),
    index('goal_responses_enrollment_idx').on(table.enrollmentId),
    index('goal_responses_lesson_idx').on(table.lessonId),
    index('goal_responses_status_idx').on(table.status),
  ]
);

/**
 * Goal reviews table - periodic reviews for goals
 */
export const goalReviews = pgTable(
  'goal_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    goalResponseId: uuid('goal_response_id')
      .notNull()
      .references(() => goalResponses.id, { onDelete: 'cascade' }),

    // Review content
    reviewDate: date('review_date').notNull(),
    progressPercentage: integer('progress_percentage').notNull().default(0),
    reflectionNotes: text('reflection_notes'),
    nextSteps: text('next_steps'),

    // Audit timestamp
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('goal_reviews_goal_response_idx').on(table.goalResponseId),
    index('goal_reviews_date_idx').on(table.reviewDate),
  ]
);

/**
 * Reviewer role enum - which role is providing the approval
 */
export const reviewerRoleEnum = pgEnum('reviewer_role', ['mentor', 'facilitator']);

/**
 * Approval submissions table - tracks approval workflow for lessons with approvalRequired != 'none'
 * When approvalRequired is 'both', there will be two rows per (lesson, enrollment):
 * one for mentor approval and one for facilitator approval.
 */
export const approvalSubmissions = pgTable(
  'approval_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),

    // Optional task reference (null = lesson-level, non-null = task-level)
    taskId: uuid('task_id').references(() => lessonTasks.id, { onDelete: 'cascade' }),

    // Which role must approve this row
    reviewerRole: reviewerRoleEnum('reviewer_role').notNull(),

    // Submission content
    submissionText: text('submission_text').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Approval status
    status: approvalStatusEnum('status').notNull().default('pending'),

    // Review info
    reviewedBy: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    feedback: text('feedback'),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('approval_submissions_unique').on(
      table.lessonId,
      table.enrollmentId,
      table.reviewerRole
    ),
    index('approval_submissions_enrollment_idx').on(table.enrollmentId),
    index('approval_submissions_lesson_idx').on(table.lessonId),
    index('approval_submissions_status_idx').on(table.status),
    index('approval_submissions_reviewer_idx').on(table.reviewedBy),
    index('approval_submissions_task_idx').on(table.taskId),
  ]
);

/**
 * Lesson discussions table - peer sharing posts for lessons with discussion enabled.
 * All enrolled users can read all posts for a lesson.
 */
export const lessonDiscussions = pgTable(
  'lesson_discussions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Post content
    content: text('content').notNull(),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('lesson_discussions_lesson_idx').on(table.lessonId),
    index('lesson_discussions_enrollment_idx').on(table.enrollmentId),
    index('lesson_discussions_user_idx').on(table.userId),
    index('lesson_discussions_created_idx').on(table.createdAt),
  ]
);

// Relations
export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [lessonProgress.enrollmentId],
    references: [enrollments.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const goalResponsesRelations = relations(
  goalResponses,
  ({ one, many }) => ({
    lesson: one(lessons, {
      fields: [goalResponses.lessonId],
      references: [lessons.id],
    }),
    enrollment: one(enrollments, {
      fields: [goalResponses.enrollmentId],
      references: [enrollments.id],
    }),
    reviews: many(goalReviews),
  })
);

export const goalReviewsRelations = relations(goalReviews, ({ one }) => ({
  goalResponse: one(goalResponses, {
    fields: [goalReviews.goalResponseId],
    references: [goalResponses.id],
  }),
}));

export const approvalSubmissionsRelations = relations(
  approvalSubmissions,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [approvalSubmissions.lessonId],
      references: [lessons.id],
    }),
    enrollment: one(enrollments, {
      fields: [approvalSubmissions.enrollmentId],
      references: [enrollments.id],
    }),
    task: one(lessonTasks, {
      fields: [approvalSubmissions.taskId],
      references: [lessonTasks.id],
    }),
    reviewer: one(users, {
      fields: [approvalSubmissions.reviewedBy],
      references: [users.id],
    }),
  })
);

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
export type GoalResponse = typeof goalResponses.$inferSelect;
export type NewGoalResponse = typeof goalResponses.$inferInsert;
export type GoalReview = typeof goalReviews.$inferSelect;
export type NewGoalReview = typeof goalReviews.$inferInsert;
export const lessonDiscussionsRelations = relations(
  lessonDiscussions,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonDiscussions.lessonId],
      references: [lessons.id],
    }),
    enrollment: one(enrollments, {
      fields: [lessonDiscussions.enrollmentId],
      references: [enrollments.id],
    }),
    user: one(users, {
      fields: [lessonDiscussions.userId],
      references: [users.id],
    }),
  })
);

export type ApprovalSubmission = typeof approvalSubmissions.$inferSelect;
export type NewApprovalSubmission = typeof approvalSubmissions.$inferInsert;
export type LessonDiscussion = typeof lessonDiscussions.$inferSelect;
export type NewLessonDiscussion = typeof lessonDiscussions.$inferInsert;
