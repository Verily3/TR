import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Per-email-type configuration for agency-level email customization
 */
export interface AgencyEmailTypeConfig {
  subject?: string;     // custom subject line (overrides hardcoded default)
  body?: string;        // custom body HTML snippet (injected into shared layout)
  enabled?: boolean;    // default enabled state for new programs (default: true)
  mandatory?: boolean;  // programs cannot disable this type (default: false)
}

/**
 * Agency-level email configuration — global defaults applied to all programs.
 * Keys match email type identifiers used in email-resolver.ts:
 * 'welcome' | 'kickoff' | 'weeklyDigest' | 'inactivity' | 'milestones' |
 * 'completion' | 'mentorSummary' | 'assessmentInvitation' | 'assessmentReminder' |
 * 'subjectInvitation' | 'passwordReset' | 'userWelcome'
 */
export interface AgencyEmailConfig {
  [emailType: string]: AgencyEmailTypeConfig;
}

/**
 * Agency settings stored as JSONB
 */
export interface AgencySettings {
  // Allow client admins to create programs
  allowClientProgramCreation?: boolean;
  // Max number of client tenants
  maxClients?: number;
  // Max users per client tenant
  maxUsersPerClient?: number;
  // Enabled features
  features?: {
    programs?: boolean;
    assessments?: boolean;
    mentoring?: boolean;
    goals?: boolean;
    analytics?: boolean;
  };
}

/**
 * Agencies table - parent entities that own client tenants
 */
export const agencies = pgTable(
  'agencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    domain: varchar('domain', { length: 255 }),

    // Branding
    logo: text('logo'),
    primaryColor: varchar('primary_color', { length: 7 }).default('#1F2937'),
    accentColor: varchar('accent_color', { length: 7 }).default('#E53E3E'),

    // Subscription
    subscriptionTier: varchar('subscription_tier', { length: 50 })
      .notNull()
      .default('starter'),
    subscriptionStatus: varchar('subscription_status', { length: 50 })
      .notNull()
      .default('active'),

    // Settings (flexible JSONB)
    settings: jsonb('settings').$type<AgencySettings>().default({}),

    // Email template customization (per-type subject/body/enabled/mandatory overrides)
    emailConfig: jsonb('email_config').$type<AgencyEmailConfig>().default({}),

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
    index('agencies_slug_idx').on(table.slug),
    index('agencies_subscription_status_idx').on(table.subscriptionStatus),
  ]
);

// Import tenants and users for relations (will be defined after those files exist)
import { tenants } from './tenants';
import { users } from './users';
import { roles } from './roles';

export const agenciesRelations = relations(agencies, ({ many }) => ({
  tenants: many(tenants),
  users: many(users),
  roles: many(roles),
}));

export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;
