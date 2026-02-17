import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';
import { tenants } from './tenants';

/**
 * User metadata stored as JSONB
 */
export interface UserMetadata {
  bio?: string;
  skills?: string[];
  location?: string;
  preferences?: {
    language?: string;
    dateFormat?: string;
    theme?: 'light' | 'dark' | 'system';
  };
  onboarding?: {
    completed: boolean;
    currentStep?: number;
    completedSteps?: string[];
  };
}

/**
 * Users table - all users in the system
 * Users belong to either an agency (admin) or a tenant (regular user)
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Association - user belongs to either agency OR tenant (not both)
    agencyId: uuid('agency_id').references(() => agencies.id, {
      onDelete: 'restrict',
    }),
    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'restrict',
    }),

    // Identity
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }), // null for SSO users

    // Profile
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    displayName: varchar('display_name', { length: 200 }),
    avatar: text('avatar'),
    title: varchar('title', { length: 200 }),
    department: varchar('department', { length: 200 }),
    phone: varchar('phone', { length: 50 }),
    timezone: varchar('timezone', { length: 50 }).default('America/New_York'),

    // Hierarchy - for org chart and direct reports
    managerId: uuid('manager_id'),

    // Status: active, inactive, suspended
    status: varchar('status', { length: 50 }).notNull().default('active'),
    emailVerified: boolean('email_verified').notNull().default(false),

    // Auth tracking
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),

    // Password reset
    passwordResetToken: varchar('password_reset_token', { length: 100 }),
    passwordResetExpiresAt: timestamp('password_reset_expires_at', { withTimezone: true }),

    // Flexible metadata
    metadata: jsonb('metadata').$type<UserMetadata>().default({}),

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
    // Email must be unique within a tenant
    uniqueIndex('users_email_tenant_unique').on(table.email, table.tenantId),
    // Email must be unique within an agency
    uniqueIndex('users_email_agency_unique').on(table.email, table.agencyId),
    index('users_tenant_id_idx').on(table.tenantId),
    index('users_agency_id_idx').on(table.agencyId),
    index('users_manager_id_idx').on(table.managerId),
    index('users_status_idx').on(table.status),
    index('users_email_idx').on(table.email),
  ]
);

import { userRoles } from './roles';
import { sessions } from './sessions';
import {
  impersonationSessionsAsAdmin,
  impersonationSessionsAsTarget,
} from './impersonation-sessions';

export const usersRelations = relations(users, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [users.agencyId],
    references: [agencies.id],
  }),
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: 'managerRelation',
  }),
  directReports: many(users, { relationName: 'managerRelation' }),
  userRoles: many(userRoles),
  sessions: many(sessions),
  impersonationsAsAdmin: many(impersonationSessionsAsAdmin),
  impersonationsAsTarget: many(impersonationSessionsAsTarget),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
