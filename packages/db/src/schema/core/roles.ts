import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';
import { tenants } from './tenants';
import { users } from './users';

/**
 * Roles table - defines permission sets
 * Roles can be agency-level (for agency admins) or tenant-level (for tenant users)
 */
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Scope - agency-level roles or tenant-level roles
    // If agencyId is set, it's an agency role
    // If tenantId is set, it's a tenant role
    // If both are null, it's a system-wide role
    agencyId: uuid('agency_id').references(() => agencies.id, {
      onDelete: 'cascade',
    }),
    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),

    // Role definition
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    description: text('description'),

    // Hierarchy level (higher = more permissions)
    // 100 = agency_owner, 90 = agency_admin, 70 = tenant_admin,
    // 50 = facilitator, 30 = mentor, 10 = learner
    level: integer('level').notNull().default(0),

    // Is this a system role (cannot be deleted or modified)?
    isSystem: boolean('is_system').notNull().default(false),

    // Permissions array stored as JSONB
    permissions: jsonb('permissions').$type<string[]>().notNull().default([]),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Slug must be unique within scope
    uniqueIndex('roles_slug_scope_unique').on(
      table.slug,
      table.agencyId,
      table.tenantId
    ),
    index('roles_agency_id_idx').on(table.agencyId),
    index('roles_tenant_id_idx').on(table.tenantId),
    index('roles_level_idx').on(table.level),
  ]
);

/**
 * User-role assignments junction table
 * Links users to their roles
 */
export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),

    // Optional context - role may be scoped to specific tenant for agency users
    // This allows agency admins to have different permissions per client
    contextTenantId: uuid('context_tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // User can only have a role once per context
    uniqueIndex('user_roles_unique').on(
      table.userId,
      table.roleId,
      table.contextTenantId
    ),
    index('user_roles_user_id_idx').on(table.userId),
    index('user_roles_role_id_idx').on(table.roleId),
  ]
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [roles.agencyId],
    references: [agencies.id],
  }),
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  contextTenant: one(tenants, {
    fields: [userRoles.contextTenantId],
    references: [tenants.id],
  }),
}));

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
