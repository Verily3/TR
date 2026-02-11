import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  integer,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../core/users';
import { mentoringRelationships } from './relationships';

/**
 * Session type enum
 */
export const mentoringSessionTypeEnum = pgEnum('mentoring_session_type', [
  'mentoring',    // Regular mentoring session
  'one_on_one',   // 1:1 meeting
  'check_in',     // Quick check-in
  'review',       // Progress/performance review
  'planning',     // Goal/planning session
]);

/**
 * Session status enum
 */
export const mentoringSessionStatusEnum = pgEnum('mentoring_session_status', [
  'scheduled',
  'prep_in_progress',
  'ready',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

/**
 * Note visibility enum
 */
export const noteVisibilityEnum = pgEnum('note_visibility', [
  'private',    // Only visible to note creator
  'shared',     // Visible to both parties
]);

/**
 * Action item status enum
 */
export const actionItemStatusEnum = pgEnum('action_item_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

/**
 * Action item priority enum
 */
export const actionItemPriorityEnum = pgEnum('action_item_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

/**
 * Mentoring sessions table - scheduled meetings between mentors and mentees
 */
export const mentoringSessions = pgTable(
  'mentoring_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Which relationship
    relationshipId: uuid('relationship_id')
      .notNull()
      .references(() => mentoringRelationships.id, { onDelete: 'cascade' }),

    // Session details
    title: varchar('title', { length: 255 }),
    sessionType: mentoringSessionTypeEnum('session_type')
      .notNull()
      .default('mentoring'),

    // Scheduling
    scheduledDate: date('scheduled_date').notNull(),
    scheduledTime: varchar('scheduled_time', { length: 10 }), // HH:MM format
    duration: integer('duration').notNull().default(60), // minutes
    timezone: varchar('timezone', { length: 50 }).default('America/New_York'),

    // Location
    location: varchar('location', { length: 255 }),
    meetingLink: text('meeting_link'),

    // Status
    status: mentoringSessionStatusEnum('status')
      .notNull()
      .default('scheduled'),

    // Agenda
    agenda: text('agenda'),

    // Summary (filled after session)
    summary: text('summary'),

    // Actual times (for tracking)
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('mentoring_sessions_relationship_idx').on(table.relationshipId),
    index('mentoring_sessions_date_idx').on(table.scheduledDate),
    index('mentoring_sessions_status_idx').on(table.status),
  ]
);

/**
 * Session prep table - pre-session reflection by mentee
 */
export const mentoringSessionPrep = pgTable(
  'mentoring_session_prep',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Which session
    sessionId: uuid('session_id')
      .notNull()
      .references(() => mentoringSessions.id, { onDelete: 'cascade' }),

    // Who prepared (usually mentee)
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Prep content
    wins: text('wins'),           // What went well since last session
    challenges: text('challenges'), // What's been challenging
    topicsToDiscuss: jsonb('topics_to_discuss').$type<string[]>().default([]),
    questionsForMentor: text('questions_for_mentor'),

    // Submission tracking
    submittedAt: timestamp('submitted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('mentoring_session_prep_session_idx').on(table.sessionId),
    index('mentoring_session_prep_user_idx').on(table.userId),
  ]
);

/**
 * Session notes table - notes taken during/after session
 */
export const mentoringSessionNotes = pgTable(
  'mentoring_session_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Which session
    sessionId: uuid('session_id')
      .notNull()
      .references(() => mentoringSessions.id, { onDelete: 'cascade' }),

    // Who wrote the note
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Note content
    content: text('content').notNull(),

    // Visibility
    visibility: noteVisibilityEnum('visibility').notNull().default('shared'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('mentoring_session_notes_session_idx').on(table.sessionId),
    index('mentoring_session_notes_author_idx').on(table.authorId),
  ]
);

/**
 * Action items table - follow-up tasks from sessions
 */
export const mentoringActionItems = pgTable(
  'mentoring_action_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Which session (optional - could be created outside session)
    sessionId: uuid('session_id').references(() => mentoringSessions.id, {
      onDelete: 'set null',
    }),

    // Which relationship
    relationshipId: uuid('relationship_id')
      .notNull()
      .references(() => mentoringRelationships.id, { onDelete: 'cascade' }),

    // Who owns the action item
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Task details
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // Priority and status
    priority: actionItemPriorityEnum('priority').notNull().default('medium'),
    status: actionItemStatusEnum('status').notNull().default('pending'),

    // Due date
    dueDate: date('due_date'),

    // Completion
    completedAt: timestamp('completed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('mentoring_action_items_session_idx').on(table.sessionId),
    index('mentoring_action_items_relationship_idx').on(table.relationshipId),
    index('mentoring_action_items_owner_idx').on(table.ownerId),
    index('mentoring_action_items_status_idx').on(table.status),
    index('mentoring_action_items_due_idx').on(table.dueDate),
  ]
);

// Relations
export const mentoringSessionsRelations = relations(
  mentoringSessions,
  ({ one, many }) => ({
    relationship: one(mentoringRelationships, {
      fields: [mentoringSessions.relationshipId],
      references: [mentoringRelationships.id],
    }),
    prep: many(mentoringSessionPrep),
    notes: many(mentoringSessionNotes),
    actionItems: many(mentoringActionItems),
  })
);

export const mentoringSessionPrepRelations = relations(
  mentoringSessionPrep,
  ({ one }) => ({
    session: one(mentoringSessions, {
      fields: [mentoringSessionPrep.sessionId],
      references: [mentoringSessions.id],
    }),
    user: one(users, {
      fields: [mentoringSessionPrep.userId],
      references: [users.id],
    }),
  })
);

export const mentoringSessionNotesRelations = relations(
  mentoringSessionNotes,
  ({ one }) => ({
    session: one(mentoringSessions, {
      fields: [mentoringSessionNotes.sessionId],
      references: [mentoringSessions.id],
    }),
    author: one(users, {
      fields: [mentoringSessionNotes.authorId],
      references: [users.id],
    }),
  })
);

export const mentoringActionItemsRelations = relations(
  mentoringActionItems,
  ({ one }) => ({
    session: one(mentoringSessions, {
      fields: [mentoringActionItems.sessionId],
      references: [mentoringSessions.id],
    }),
    relationship: one(mentoringRelationships, {
      fields: [mentoringActionItems.relationshipId],
      references: [mentoringRelationships.id],
    }),
    owner: one(users, {
      fields: [mentoringActionItems.ownerId],
      references: [users.id],
    }),
  })
);

export type MentoringSession = typeof mentoringSessions.$inferSelect;
export type NewMentoringSession = typeof mentoringSessions.$inferInsert;
export type MentoringSessionPrep = typeof mentoringSessionPrep.$inferSelect;
export type NewMentoringSessionPrep = typeof mentoringSessionPrep.$inferInsert;
export type MentoringSessionNote = typeof mentoringSessionNotes.$inferSelect;
export type NewMentoringSessionNote = typeof mentoringSessionNotes.$inferInsert;
export type MentoringActionItem = typeof mentoringActionItems.$inferSelect;
export type NewMentoringActionItem = typeof mentoringActionItems.$inferInsert;
