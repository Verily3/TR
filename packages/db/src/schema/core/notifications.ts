import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Notification content
    type: varchar('type', { length: 50 }).notNull(), // program_update | assessment_invite | goal_reminder | etc.
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    actionUrl: varchar('action_url', { length: 500 }),
    actionLabel: varchar('action_label', { length: 100 }),

    // Priority and state
    priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low | medium | high | urgent
    status: varchar('status', { length: 20 }).notNull().default('unread'),     // unread | read | archived

    // Extra data (e.g. related entity ids)
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_status_idx').on(table.status),
    index('notifications_user_status_idx').on(table.userId, table.status),
    index('notifications_created_at_idx').on(table.createdAt),
  ]
);

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),

    // Email channel
    emailEnabled: boolean('email_enabled').notNull().default(true),
    emailDigest: varchar('email_digest', { length: 20 }).notNull().default('instant'), // instant | daily | weekly | never

    // In-app channel
    inAppEnabled: boolean('in_app_enabled').notNull().default(true),

    // Per-type toggles stored as JSONB: { program_updates: true, assessment_invites: true, ... }
    preferences: jsonb('preferences').$type<Record<string, boolean>>().default({}),

    // Quiet hours
    quietHoursEnabled: boolean('quiet_hours_enabled').notNull().default(false),
    quietHoursStart: varchar('quiet_hours_start', { length: 5 }).default('22:00'),
    quietHoursEnd: varchar('quiet_hours_end', { length: 5 }).default('08:00'),
    timezone: varchar('timezone', { length: 50 }).default('America/New_York'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);
