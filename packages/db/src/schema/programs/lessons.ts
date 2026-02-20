import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { modules } from './modules';
import {
  contentTypeEnum,
  lessonDripTypeEnum,
  lessonStatusEnum,
  approvalRequiredEnum,
} from './enums';

// Re-export enums for backward compatibility
export { contentTypeEnum, lessonDripTypeEnum, lessonStatusEnum, approvalRequiredEnum };

/**
 * Lesson content varies by content_type
 */
export interface LessonContent {
  // Common for lesson type
  introduction?: string;
  mainContent?: string; // Rich HTML
  videoUrl?: string;
  keyConcepts?: { title: string; description: string }[];
  keyTakeaway?: string;
  reflectionPrompts?: string[];

  // For assignment type
  instructions?: string;
  questions?: string[];
  submissionFormat?: string; // legacy free-text field
  submissionTypes?: ('text' | 'file_upload' | 'url' | 'video' | 'presentation' | 'spreadsheet')[];
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[]; // e.g. ['.pdf', '.docx', '.pptx']

  // For mentor_meeting type
  agenda?: string;
  discussionQuestions?: string[];
  preparationInstructions?: string;

  // For quiz type
  quizQuestions?: {
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer?: string | number;
    points?: number;
    // Short answer grading mode (only applies to short_answer type)
    gradingMode?: 'auto_complete' | 'keyword' | 'manual';
    keywords?: string[];  // For gradingMode='keyword'
  }[];
  passingScore?: number;
  allowRetakes?: boolean;
  maxAttempts?: number;

  // For text_form type
  formPrompt?: string;
  minLength?: number;
  maxLength?: number;

  // For goal type
  goalPrompt?: string;
  requireMetrics?: boolean;
  requireActionSteps?: boolean;
  metricsGuidance?: string;
  actionStepsGuidance?: string;

  // Discussion toggle for text_form
  enableDiscussion?: boolean;
}

/**
 * Visibility settings per role
 */
export interface VisibilitySettings {
  learner: boolean;
  mentor: boolean;
  facilitator: boolean;
}

/**
 * Lessons table - individual content items within modules
 */
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),

    // Content
    title: varchar('title', { length: 255 }).notNull(),
    contentType: contentTypeEnum('content_type').notNull().default('lesson'),
    content: jsonb('content').$type<LessonContent>().default({}),

    // Ordering
    order: integer('order').notNull().default(0),

    // Metrics
    durationMinutes: integer('duration_minutes'),
    points: integer('points').notNull().default(0),

    // Drip scheduling
    dripType: lessonDripTypeEnum('drip_type').notNull().default('immediate'),
    dripValue: integer('drip_value'), // days or null
    dripDate: timestamp('drip_date', { withTimezone: true }), // for 'on_date' type

    // Visibility
    visibleTo: jsonb('visible_to').$type<VisibilitySettings>().default({
      learner: true,
      mentor: true,
      facilitator: true,
    }),

    // Approval workflow
    approvalRequired: approvalRequiredEnum('approval_required').notNull().default('none'),

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
    index('lessons_module_id_idx').on(table.moduleId),
    index('lessons_order_idx').on(table.moduleId, table.order),
    index('lessons_content_type_idx').on(table.contentType),
    index('lessons_approval_required_idx').on(table.approvalRequired),
  ]
);

// Forward declare (avoid circular imports — tasks relation defined in tasks.ts)
import { lessonProgress } from './progress';

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  progress: many(lessonProgress),
}));

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
