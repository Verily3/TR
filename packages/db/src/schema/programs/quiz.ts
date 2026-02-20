import {
  pgTable,
  uuid,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lessons } from './lessons';
import { enrollments } from './enrollments';
import { users } from '../core/users';
import { quizGradingStatusEnum } from './enums';

// Re-export for convenience
export { quizGradingStatusEnum };

export interface QuizAnswers {
  [questionId: string]: string | number;
}

export interface QuizBreakdownItem {
  questionId: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  yourAnswer: string | number | null;
  correctAnswer?: string | number;
  pointsEarned: number;
  pointsPossible: number;
  isCorrect?: boolean;      // undefined for short_answer:manual
  gradingMode?: 'auto_complete' | 'keyword' | 'manual';
}

/**
 * Quiz attempts — one row per attempt per learner per lesson
 */
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),

    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),

    attemptNumber: integer('attempt_number').notNull().default(1),

    // Submitted answers: { [questionId]: answer }
    answers: jsonb('answers').$type<QuizAnswers>().notNull().default({}),

    // Scoring
    score: numeric('score', { precision: 5, scale: 2 }),  // 0.00–100.00, null if pending
    pointsEarned: integer('points_earned').notNull().default(0),
    passed: boolean('passed'),

    // Per-question breakdown stored for display
    breakdown: jsonb('breakdown').$type<QuizBreakdownItem[]>().default([]),

    // Grading workflow
    gradingStatus: quizGradingStatusEnum('grading_status')
      .notNull()
      .default('auto_graded'),
    gradedBy: uuid('graded_by').references(() => users.id),
    gradedAt: timestamp('graded_at', { withTimezone: true }),

    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('quiz_attempts_unique_idx').on(
      table.lessonId,
      table.enrollmentId,
      table.attemptNumber
    ),
    index('quiz_attempts_enrollment_idx').on(table.enrollmentId),
    index('quiz_attempts_lesson_idx').on(table.lessonId),
  ]
);

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  lesson: one(lessons, {
    fields: [quizAttempts.lessonId],
    references: [lessons.id],
  }),
  enrollment: one(enrollments, {
    fields: [quizAttempts.enrollmentId],
    references: [enrollments.id],
  }),
  gradedByUser: one(users, {
    fields: [quizAttempts.gradedBy],
    references: [users.id],
  }),
}));

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
