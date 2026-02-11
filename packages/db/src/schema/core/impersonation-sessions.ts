import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { sessions } from './sessions';

/**
 * Impersonation sessions table - tracks when agency admins impersonate users
 * Provides audit trail and allows ending impersonation
 */
export const impersonationSessions = pgTable(
  'impersonation_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Who is impersonating (agency admin)
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    adminSessionId: uuid('admin_session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),

    // Who is being impersonated (tenant user)
    targetUserId: uuid('target_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Session token for the impersonation (hashed)
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),

    // Reason for impersonation (audit trail)
    reason: varchar('reason', { length: 500 }),

    // Time bounds
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('impersonation_sessions_admin_idx').on(table.adminUserId),
    index('impersonation_sessions_target_idx').on(table.targetUserId),
    index('impersonation_sessions_token_hash_idx').on(table.tokenHash),
  ]
);

// Named exports for relations to avoid circular dependency issues
export const impersonationSessionsAsAdmin = impersonationSessions;
export const impersonationSessionsAsTarget = impersonationSessions;

export const impersonationSessionsRelations = relations(
  impersonationSessions,
  ({ one }) => ({
    adminUser: one(users, {
      fields: [impersonationSessions.adminUserId],
      references: [users.id],
      relationName: 'impersonationsAsAdmin',
    }),
    adminSession: one(sessions, {
      fields: [impersonationSessions.adminSessionId],
      references: [sessions.id],
    }),
    targetUser: one(users, {
      fields: [impersonationSessions.targetUserId],
      references: [users.id],
      relationName: 'impersonationsAsTarget',
    }),
  })
);

export type ImpersonationSession = typeof impersonationSessions.$inferSelect;
export type NewImpersonationSession = typeof impersonationSessions.$inferInsert;
