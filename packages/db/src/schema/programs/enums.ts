/**
 * Shared enums for the programs module.
 * Extracted to avoid circular import issues between lessons.ts, tasks.ts, and progress.ts.
 */
import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Content type enum
 */
export const contentTypeEnum = pgEnum('content_type', [
  'lesson',
  'quiz',
  'assignment',
  'text_form',
  'goal',
  'survey',
]);

/**
 * Lesson drip type enum
 */
export const lessonDripTypeEnum = pgEnum('lesson_drip_type', [
  'immediate',
  'sequential',
  'days_after_module_start',
  'on_date',
]);

/**
 * Lesson status enum
 */
export const lessonStatusEnum = pgEnum('lesson_status', ['draft', 'active']);

/**
 * Approval required enum - who must approve before completion
 */
export const approvalRequiredEnum = pgEnum('approval_required', [
  'none',
  'mentor',
  'facilitator',
  'both',
]);

/**
 * Task response type enum
 */
export const taskResponseTypeEnum = pgEnum('task_response_type', [
  'text',
  'file_upload',
  'goal',
  'completion_click',
  'discussion',
]);

/**
 * Task progress status enum
 */
export const taskProgressStatusEnum = pgEnum('task_progress_status', [
  'not_started',
  'in_progress',
  'completed',
]);

/**
 * Quiz grading status enum
 */
export const quizGradingStatusEnum = pgEnum('quiz_grading_status', [
  'auto_graded',    // MC + T/F questions only — graded instantly
  'pending_grade',  // Has manual short-answer questions awaiting facilitator review
  'graded',         // Facilitator has completed manual grading
]);
