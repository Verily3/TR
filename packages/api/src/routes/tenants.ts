import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import {
  db,
  eq,
  and,
  like,
  sql,
  tenants,
  tenantMembers,
  users,
} from "@tr/db";
import { success, paginated, noContent } from "../lib/response";
import { listQuerySchema, idParamSchema } from "../lib/validation";
import {
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
} from "../middleware";
import type { AppVariables } from "../types";

const tenantsRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  agencyId: z.string().uuid(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().url().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// ============================================================================
// TENANT CRUD
// ============================================================================

/**
 * GET /tenants
 * List tenants for current user
 */
tenantsRouter.get(
  "/",
  authMiddleware,
  zValidator("query", listQuerySchema),
  async (c) => {
    const user = c.get("user");
    const query = c.req.valid("query");

    // Get user's tenant memberships
    const memberships = await db.query.tenantMembers.findMany({
      where: and(
        eq(tenantMembers.userId, user.id),
        eq(tenantMembers.isActive, true)
      ),
      with: {
        tenant: true,
      },
    });

    const tenantList = memberships
      .filter((m) => m.tenant.isActive)
      .filter((m) =>
        query.search
          ? m.tenant.name.toLowerCase().includes(query.search.toLowerCase())
          : true
      );

    // Apply pagination
    const start = (query.page - 1) * query.perPage;
    const paginatedTenants = tenantList.slice(start, start + query.perPage);

    return paginated(
      c,
      paginatedTenants.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        logoUrl: m.tenant.logoUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      {
        page: query.page,
        perPage: query.perPage,
        total: tenantList.length,
      }
    );
  }
);

/**
 * GET /tenants/:tenantId
 * Get tenant details
 */
tenantsRouter.get(
  "/:tenantId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantCtx.id),
    });

    return success(c, {
      id: tenant!.id,
      name: tenant!.name,
      slug: tenant!.slug,
      logoUrl: tenant!.logoUrl,
      settings: tenant!.settings,
      createdAt: tenant!.createdAt,
    });
  }
);

/**
 * PATCH /tenants/:tenantId
 * Update tenant (admin only)
 */
tenantsRouter.patch(
  "/:tenantId",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", updateTenantSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const body = c.req.valid("json");

    const [updatedTenant] = await db
      .update(tenants)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantCtx.id))
      .returning();

    return success(c, {
      id: updatedTenant.id,
      name: updatedTenant.name,
      slug: updatedTenant.slug,
      logoUrl: updatedTenant.logoUrl,
      settings: updatedTenant.settings,
    });
  }
);

// ============================================================================
// TENANT MEMBERS
// ============================================================================

/**
 * GET /tenants/:tenantId/members
 * List tenant members
 */
tenantsRouter.get(
  "/:tenantId/members",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", listQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const query = c.req.valid("query");

    const members = await db.query.tenantMembers.findMany({
      where: eq(tenantMembers.tenantId, tenantCtx.id),
      with: {
        user: true,
      },
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, tenantCtx.id));

    return paginated(
      c,
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        isActive: m.isActive,
        joinedAt: m.joinedAt,
      })),
      {
        page: query.page,
        perPage: query.perPage,
        total: Number(count),
      }
    );
  }
);

/**
 * POST /tenants/:tenantId/members/invite
 * Invite a member to tenant (admin only)
 */
tenantsRouter.post(
  "/:tenantId/members/invite",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", inviteMemberSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const body = c.req.valid("json");

    // Check if user with email exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (existingUser) {
      // Check if already a member
      const existingMember = await db.query.tenantMembers.findFirst({
        where: and(
          eq(tenantMembers.tenantId, tenantCtx.id),
          eq(tenantMembers.userId, existingUser.id)
        ),
      });

      if (existingMember) {
        throw new HTTPException(409, {
          message: "User is already a member of this tenant",
        });
      }

      // Add existing user to tenant
      const [membership] = await db
        .insert(tenantMembers)
        .values({
          tenantId: tenantCtx.id,
          userId: existingUser.id,
          role: body.role,
        })
        .returning();

      return success(
        c,
        {
          id: membership.id,
          userId: existingUser.id,
          email: existingUser.email,
          role: membership.role,
          status: "added",
        },
        201
      );
    }

    // TODO: Create invitation record and send email
    // For now, return pending status

    return success(
      c,
      {
        email: body.email,
        role: body.role,
        status: "invited",
      },
      201
    );
  }
);

/**
 * PATCH /tenants/:tenantId/members/:memberId
 * Update member role (admin only)
 */
tenantsRouter.patch(
  "/:tenantId/members/:memberId",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", z.object({ role: z.enum(["admin", "user"]) })),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const memberId = c.req.param("memberId");
    const body = c.req.valid("json");

    const [updated] = await db
      .update(tenantMembers)
      .set({
        role: body.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantMembers.id, memberId),
          eq(tenantMembers.tenantId, tenantCtx.id)
        )
      )
      .returning();

    if (!updated) {
      throw new HTTPException(404, { message: "Member not found" });
    }

    return success(c, { id: updated.id, role: updated.role });
  }
);

/**
 * DELETE /tenants/:tenantId/members/:memberId
 * Remove member from tenant (admin only)
 */
tenantsRouter.delete(
  "/:tenantId/members/:memberId",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const memberId = c.req.param("memberId");

    // Prevent self-removal
    const member = await db.query.tenantMembers.findFirst({
      where: and(
        eq(tenantMembers.id, memberId),
        eq(tenantMembers.tenantId, tenantCtx.id)
      ),
    });

    if (!member) {
      throw new HTTPException(404, { message: "Member not found" });
    }

    if (member.userId === user.id) {
      throw new HTTPException(400, {
        message: "Cannot remove yourself from tenant",
      });
    }

    await db
      .delete(tenantMembers)
      .where(
        and(
          eq(tenantMembers.id, memberId),
          eq(tenantMembers.tenantId, tenantCtx.id)
        )
      );

    return noContent(c);
  }
);

export { tenantsRouter };
