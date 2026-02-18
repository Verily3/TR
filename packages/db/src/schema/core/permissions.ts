import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

/**
 * Tenant-level role permission overrides.
 * When a row exists for a (tenantId, roleSlug) pair, it replaces the hardcoded
 * navigation defaults from navigation.ts for that role within that tenant.
 */
export const tenantRolePermissions = pgTable(
  'tenant_role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    // 'learner' | 'mentor' | 'facilitator' | 'tenant_admin'
    roleSlug: text('role_slug').notNull(),
    // Array of nav item keys that are enabled for this role in this tenant
    navItems: text('nav_items').array().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [uniqueIndex('uniq_tenant_role_perm').on(t.tenantId, t.roleSlug)]
);

/**
 * User-level permission overrides on top of the role defaults.
 * grantedNavItems: items added to the user beyond their role's nav
 * revokedNavItems: items removed from the user despite being in their role's nav
 */
export const tenantUserPermissions = pgTable(
  'tenant_user_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    grantedNavItems: text('granted_nav_items').array().notNull().default([]),
    revokedNavItems: text('revoked_nav_items').array().notNull().default([]),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [uniqueIndex('uniq_tenant_user_perm').on(t.tenantId, t.userId)]
);
