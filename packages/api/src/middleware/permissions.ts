import { createMiddleware } from 'hono/factory';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import type { Permission } from '@tr/shared';
import type { Variables } from '../types/context.js';

const { tenants } = schema;

type PermissionCheck = Permission | Permission[] | ((user: Variables['user']) => boolean);

/**
 * Permission middleware factory
 * Checks if user has required permission(s)
 */
export function requirePermission(...checks: PermissionCheck[]) {
  return createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      throw new ForbiddenError('User context not available');
    }

    for (const check of checks) {
      let hasPermission = false;

      if (typeof check === 'string') {
        // Single permission check
        hasPermission = user.permissions.includes(check);
      } else if (Array.isArray(check)) {
        // Any of these permissions
        hasPermission = check.some((p) => user.permissions.includes(p));
      } else if (typeof check === 'function') {
        // Custom check function
        hasPermission = check(user);
      }

      if (!hasPermission) {
        throw new ForbiddenError(
          `Missing required permission: ${typeof check === 'function' ? 'custom check' : check}`
        );
      }
    }

    await next();
  });
}

/**
 * Role level middleware
 * Checks if user has minimum role level
 */
export function requireRoleLevel(minLevel: number) {
  return createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const user = c.get('user');

    if (!user || user.roleLevel < minLevel) {
      throw new ForbiddenError('Insufficient role level');
    }

    await next();
  });
}

/**
 * Agency access middleware
 * Requires user to be an agency user
 */
export function requireAgencyAccess() {
  return createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const user = c.get('user');

    if (!user || !user.agencyId) {
      throw new ForbiddenError('Agency access required');
    }

    await next();
  });
}

/**
 * Tenant access middleware
 * Validates user can access the specified tenant
 * Sets tenant in context if valid
 */
export function requireTenantAccess() {
  return createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const user = c.get('user');
    const tenantId = c.req.param('tenantId') || c.req.header('X-Tenant-ID');

    if (!user) {
      throw new ForbiddenError('User context not available');
    }

    if (!tenantId) {
      throw new ForbiddenError('Tenant ID required');
    }

    // Agency users can access any tenant in their agency
    if (user.agencyId) {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(
          and(eq(tenants.id, tenantId), eq(tenants.agencyId, user.agencyId))
        )
        .limit(1);

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      c.set('tenant', tenant);
      await next();
      return;
    }

    // Tenant users can only access their own tenant
    if (user.tenantId !== tenantId) {
      throw new ForbiddenError('Access denied to this tenant');
    }

    // Get tenant data
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    c.set('tenant', tenant);
    await next();
  });
}
