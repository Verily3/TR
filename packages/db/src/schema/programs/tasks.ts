import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lessons } from './lessons';
import { enrollments } from './enrollments';
import {
  approvalRequiredEnum,
  lessonStatusEnum,
  taskResponseTypeEnum,
  taskProgressStatusEnum,
} from './enums';

// Re-export enums for convenience
export { taskResponseTypeEnum, taskProgressStatusEnum };

/**
 * Task config varies by responseType
 */
export interface TaskConfig {
  // For 'text' response type
  formPrompt?: string;
  minLength?: number;
  maxLength?: number;

  // For 'discussion' response type
  enableDiscussion?: boolean;

  // For 'goal' response type
  goalPrompt?: string;
  requireMetrics?: boolean;
  requireActionSteps?: boolean;
  metricsGuidance?: string;
  actionStepsGuidance?: string;

  // For 'file_upload' response type
  submissionTypes?: ('text' | 'file_upload' | 'url' | 'video' | 'presentation' | 'spreadsheet')[];
  maxFileSize?: number;
  allowedFileTypes?: string[];
  instructions?: string;
  questions?: string[];
}

/**
 * Lesson tasks table - tasks within a lesson that learners must complete
 */
export const lessonTasks = pgTable(
  'lesson_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),

    // Task definition
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),

    // Response configuration
    responseType: taskResponseTypeEnum('response_type').notNull().default('completion_click'),

    // Approval workflow (per-task)
    approvalRequired: approvalRequiredEnum('approval_required').notNull().default('none'),

    // Scheduling
    dueDate: timestamp('due_date', { withTimezone: true }),
    dueDaysOffset: integer('due_days_offset'), // days after enrollment

    // Points
    points: integer('points').notNull().default(0),

    // Response-type-specific settings
    config: jsonb('config').$type<TaskConfig>(),

    // Status
    status: lessonStatusEnum('status').notNull().default('draft'),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('lesson_tasks_lesson_id_idx').on(table.lessonId),
    index('lesson_tasks_order_idx').on(table.lessonId, table.order),
  ]
);

/**
 * Task progress table - tracks individual task completion per enrollment
 */
export const taskProgress = pgTable(
  'task_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => lessonTasks.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),

    // Progress
    status: taskProgressStatusEnum('status').notNull().default('not_started'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Points earned
    pointsEarned: integer('points_earned').notNull().default(0),

    // Submission data (learner's response)
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
    uniqueIndex('task_progress_unique').on(table.taskId, table.enrollmentId),
    index('task_progress_task_id_idx').on(table.taskId),
    index('task_progress_enrollment_id_idx').on(table.enrollmentId),
    index('task_progress_status_idx').on(table.status),
  ]
);

// Relations
export const lessonTasksRelations = relations(lessonTasks, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [lessonTasks.lessonId],
    references: [lessons.id],
  }),
  progress: many(taskProgress),
}));

export const taskProgressRelations = relations(taskProgress, ({ one }) => ({
  task: one(lessonTasks, {
    fields: [taskProgress.taskId],
    references: [lessonTasks.id],
  }),
  enrollment: one(enrollments, {
    fields: [taskProgress.enrollmentId],
    references: [enrollments.id],
  }),
}));

export type LessonTask = typeof lessonTasks.$inferSelect;
export type NewLessonTask = typeof lessonTasks.$inferInsert;
export type TaskProgress = typeof taskProgress.$inferSelect;
export type NewTaskProgress = typeof taskProgress.$inferInsert;
