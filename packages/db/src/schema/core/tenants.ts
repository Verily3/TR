import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';

/**
 * Tenant settings stored as JSONB
 */
export interface TenantSettings {
  timezone?: string;
  dateFormat?: string;
  fiscalYearStart?: string;
  // Requires agency permission to be true
  canCreatePrograms?: boolean;
  // Enabled features (can be subset of agency features)
  features?: {
    programs?: boolean;
    assessments?: boolean;
    mentoring?: boolean;
    goals?: boolean;
    analytics?: boolean;
    scorecard?: boolean;
    planning?: boolean;
  };
}

/**
 * Tenants table - client organizations under an agency
 */
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'restrict' }),

    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    domain: varchar('domain', { length: 255 }),
    industry: varchar('industry', { length: 100 }),

    // Status: active, trial, suspended, churned
    status: varchar('status', { length: 50 }).notNull().default('active'),

    // Branding (inherits from agency if null)
    logo: text('logo'),
    primaryColor: varchar('primary_color', { length: 7 }),
    accentColor: varchar('accent_color', { length: 7 }),

    // Limits
    usersLimit: integer('users_limit').notNull().default(50),

    // Settings
    settings: jsonb('settings').$type<TenantSettings>().default({}),

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
    index('tenants_agency_id_idx').on(table.agencyId),
    index('tenants_status_idx').on(table.status),
    uniqueIndex('tenants_slug_agency_unique').on(table.slug, table.agencyId),
  ]
);

import { users } from './users';
import { roles } from './roles';

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [tenants.agencyId],
    references: [agencies.id],
  }),
  users: many(users),
  roles: many(roles),
}));

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
