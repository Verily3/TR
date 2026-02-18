import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requireRoleLevel } from '../middleware/permissions.js';
import { NAVIGATION_BY_ROLE, getNavigationForRole } from '@tr/shared';
import type { Variables } from '../types/context.js';

const { tenantRolePermissions, tenantUserPermissions, users } = schema;

export const permissionsRoutes = new Hono<{ Variables: Variables }>();

// All nav items that can be toggled (excluding agency which is agency-only)
const ALL_NAV_ITEMS = [
  'dashboard', 'programs', 'mentoring', 'assessments',
  'scorecard', 'planning', 'people', 'analytics',
  'notifications', 'help', 'settings',
] as const;

// Tenant-level roles that can be configured
const CONFIGURABLE_ROLES = ['learner', 'mentor', 'facilitator', 'tenant_admin'] as const;

/**
 * Resolve the effective nav items for a user:
 * 1. Start with hardcoded defaults for their role
 * 2. Apply tenant role override (if any)
 * 3. Apply user-level override (if any)
 */
async function resolveNavForUser(
  userId: string,
  roleSlug: string,
  tenantId: string
): Promise<string[]> {
  // 1. Hardcoded default
  let nav: string[] = [...getNavigationForRole(roleSlug)];

  // 2. Tenant role override
  const [roleOverride] = await db
    .select()
    .from(tenantRolePermissions)
    .where(
      and(
        eq(tenantRolePermissions.tenantId, tenantId),
        eq(tenantRolePermissions.roleSlug, roleSlug)
      )
    );
  if (roleOverride) {
    nav = roleOverride.navItems;
  }

  // 3. User-level override
  const [userOverride] = await db
    .select()
    .from(tenantUserPermissions)
    .where(
      and(
        eq(tenantUserPermissions.tenantId, tenantId),
        eq(tenantUserPermissions.userId, userId)
      )
    );
  if (userOverride) {
    const granted = userOverride.grantedNavItems ?? [];
    const revoked = userOverride.revokedNavItems ?? [];
    nav = [...new Set([...nav, ...granted])].filter((item) => !revoked.includes(item));
  }

  return nav;
}

// ─── GET /my-nav ─────────────────────────────────────────────────────────────

permissionsRoutes.get('/my-nav', requireTenantAccess(), async (c) => {
  const user = c.get('user');
  const tenantId = c.req.param('tenantId');

  if (!user.tenantId) {
    // Agency user — return hardcoded nav
    return c.json({ data: [...getNavigationForRole(user.roleSlug)] });
  }

  const nav = await resolveNavForUser(user.id, user.roleSlug, tenantId);
  return c.json({ data: nav });
});

// ─── GET /roles ───────────────────────────────────────────────────────────────

permissionsRoutes.get('/roles', requireTenantAccess(), requireRoleLevel(70), async (c) => {
  const tenantId = c.req.param('tenantId');

  const overrides = await db
    .select()
    .from(tenantRolePermissions)
    .where(eq(tenantRolePermissions.tenantId, tenantId));

  const overrideMap = new Map(overrides.map((o) => [o.roleSlug, o.navItems]));

  const result = CONFIGURABLE_ROLES.map((roleSlug) => ({
    roleSlug,
    navItems: overrideMap.get(roleSlug) ?? [...getNavigationForRole(roleSlug)],
    isCustomised: overrideMap.has(roleSlug),
    defaultNavItems: [...getNavigationForRole(roleSlug)],
  }));

  return c.json({ data: result });
});

// ─── PUT /roles/:roleSlug ─────────────────────────────────────────────────────

permissionsRoutes.put(
  '/roles/:roleSlug',
  requireTenantAccess(),
  requireRoleLevel(70),
  async (c) => {
    const tenantId = c.req.param('tenantId');
    const roleSlug = c.req.param('roleSlug');
    const user = c.get('user');

    if (!CONFIGURABLE_ROLES.includes(roleSlug as typeof CONFIGURABLE_ROLES[number])) {
      return c.json({ error: { code: 'INVALID_ROLE', message: 'Role not configurable' } }, 400);
    }

    const body = await c.req.json();
    const { navItems } = z.object({
      navItems: z.array(z.string()),
    }).parse(body);

    // Validate all nav items are known
    const valid = navItems.filter((item) => (ALL_NAV_ITEMS as readonly string[]).includes(item));

    await db
      .insert(tenantRolePermissions)
      .values({
        tenantId,
        roleSlug,
        navItems: valid,
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: [tenantRolePermissions.tenantId, tenantRolePermissions.roleSlug],
        set: { navItems: valid, updatedAt: new Date(), updatedBy: user.id },
      });

    return c.json({ data: { roleSlug, navItems: valid } });
  }
);

// Reset role to defaults
permissionsRoutes.delete(
  '/roles/:roleSlug',
  requireTenantAccess(),
  requireRoleLevel(70),
  async (c) => {
    const tenantId = c.req.param('tenantId');
    const roleSlug = c.req.param('roleSlug');

    await db
      .delete(tenantRolePermissions)
      .where(
        and(
          eq(tenantRolePermissions.tenantId, tenantId),
          eq(tenantRolePermissions.roleSlug, roleSlug)
        )
      );

    return c.json({ data: { roleSlug, navItems: [...getNavigationForRole(roleSlug)], isCustomised: false } });
  }
);

// ─── GET /users ───────────────────────────────────────────────────────────────

permissionsRoutes.get('/users', requireTenantAccess(), requireRoleLevel(70), async (c) => {
  const tenantId = c.req.param('tenantId');

  const overrides = await db
    .select({
      id: tenantUserPermissions.id,
      userId: tenantUserPermissions.userId,
      tenantId: tenantUserPermissions.tenantId,
      grantedNavItems: tenantUserPermissions.grantedNavItems,
      revokedNavItems: tenantUserPermissions.revokedNavItems,
      updatedAt: tenantUserPermissions.updatedAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(tenantUserPermissions)
    .leftJoin(users, eq(tenantUserPermissions.userId, users.id))
    .where(eq(tenantUserPermissions.tenantId, tenantId));

  return c.json({ data: overrides });
});

// ─── GET /users/:userId ────────────────────────────────────────────────────────

permissionsRoutes.get(
  '/users/:userId',
  requireTenantAccess(),
  requireRoleLevel(70),
  async (c) => {
    const tenantId = c.req.param('tenantId');
    const userId = c.req.param('userId');

    const [override] = await db
      .select()
      .from(tenantUserPermissions)
      .where(
        and(
          eq(tenantUserPermissions.tenantId, tenantId),
          eq(tenantUserPermissions.userId, userId)
        )
      );

    return c.json({ data: override ?? null });
  }
);

// ─── PUT /users/:userId ────────────────────────────────────────────────────────

permissionsRoutes.put(
  '/users/:userId',
  requireTenantAccess(),
  requireRoleLevel(70),
  async (c) => {
    const tenantId = c.req.param('tenantId');
    const userId = c.req.param('userId');
    const adminUser = c.get('user');

    const body = await c.req.json();
    const { grantedNavItems, revokedNavItems } = z.object({
      grantedNavItems: z.array(z.string()).default([]),
      revokedNavItems: z.array(z.string()).default([]),
    }).parse(body);

    const [row] = await db
      .insert(tenantUserPermissions)
      .values({
        tenantId,
        userId,
        grantedNavItems,
        revokedNavItems,
        updatedBy: adminUser.id,
      })
      .onConflictDoUpdate({
        target: [tenantUserPermissions.tenantId, tenantUserPermissions.userId],
        set: { grantedNavItems, revokedNavItems, updatedAt: new Date(), updatedBy: adminUser.id },
      })
      .returning();

    return c.json({ data: row });
  }
);

// ─── DELETE /users/:userId ─────────────────────────────────────────────────────

permissionsRoutes.delete(
  '/users/:userId',
  requireTenantAccess(),
  requireRoleLevel(70),
  async (c) => {
    const tenantId = c.req.param('tenantId');
    const userId = c.req.param('userId');

    await db
      .delete(tenantUserPermissions)
      .where(
        and(
          eq(tenantUserPermissions.tenantId, tenantId),
          eq(tenantUserPermissions.userId, userId)
        )
      );

    return c.json({ data: { success: true } });
  }
);
