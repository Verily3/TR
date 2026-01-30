import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db, eq, and, tenants, tenantMembers } from "@tr/db";
import type { AppVariables, TenantContext } from "../types";

/**
 * Tenant middleware - resolves tenant from header or path param
 * Verifies user has access to the tenant
 */
export const tenantMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    // Get tenant ID from header or path parameter
    const tenantId =
      c.req.header("X-Tenant-ID") || c.req.param("tenantId");

    if (!tenantId) {
      throw new HTTPException(400, {
        message: "Tenant ID is required",
      });
    }

    // Fetch tenant and verify user membership
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      throw new HTTPException(404, {
        message: "Tenant not found",
      });
    }

    if (!tenant.isActive) {
      throw new HTTPException(403, {
        message: "Tenant account is deactivated",
      });
    }

    // Check user membership
    const membership = await db.query.tenantMembers.findFirst({
      where: and(
        eq(tenantMembers.tenantId, tenantId),
        eq(tenantMembers.userId, user.id)
      ),
    });

    if (!membership) {
      throw new HTTPException(403, {
        message: "You do not have access to this tenant",
      });
    }

    if (!membership.isActive) {
      throw new HTTPException(403, {
        message: "Your membership in this tenant is deactivated",
      });
    }

    const tenantContext: TenantContext = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      agencyId: tenant.agencyId,
      role: membership.role as "admin" | "user",
    };

    c.set("tenant", tenantContext);

    await next();
  }
);

/**
 * Require admin role within tenant
 */
export const requireTenantAdmin = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const tenant = c.get("tenant");

    if (!tenant) {
      throw new HTTPException(500, {
        message: "Tenant context not set",
      });
    }

    if (tenant.role !== "admin") {
      throw new HTTPException(403, {
        message: "Admin access required",
      });
    }

    await next();
  }
);
