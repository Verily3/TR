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
  agencies,
  agencyMembers,
  tenants,
  tenantMembers,
  users,
  programs,
  enrollments,
} from "@tr/db";
import { success, paginated } from "../lib/response";
import { listQuerySchema, uuidSchema } from "../lib/validation";
import { authMiddleware } from "../middleware";
import type { AppVariables } from "../types";

// Agency ID param schema
const agencyIdParamSchema = z.object({
  agencyId: uuidSchema,
});

const agenciesRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Verify user has access to the agency
 */
const requireAgencyAccess = async (
  userId: string,
  agencyId: string
): Promise<{ role: string }> => {
  const membership = await db.query.agencyMembers.findFirst({
    where: and(
      eq(agencyMembers.agencyId, agencyId),
      eq(agencyMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new HTTPException(403, {
      message: "You do not have access to this agency",
    });
  }

  return { role: membership.role };
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /agencies
 * List agencies for current user
 */
agenciesRouter.get("/", authMiddleware, async (c) => {
  const user = c.get("user");

  const memberships = await db.query.agencyMembers.findMany({
    where: eq(agencyMembers.userId, user.id),
    with: {
      agency: true,
    },
  });

  return success(
    c,
    memberships.map((m) => ({
      id: m.agency.id,
      name: m.agency.name,
      slug: m.agency.slug,
      logoUrl: m.agency.logoUrl,
      role: m.role,
    }))
  );
});

/**
 * GET /agencies/:agencyId
 * Get agency details
 */
agenciesRouter.get(
  "/:agencyId",
  authMiddleware,
  zValidator("param", agencyIdParamSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId } = c.req.valid("param");

    await requireAgencyAccess(user.id, agencyId);

    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, agencyId),
    });

    if (!agency) {
      throw new HTTPException(404, { message: "Agency not found" });
    }

    return success(c, {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      domain: agency.domain,
      logoUrl: agency.logoUrl,
      settings: agency.settings,
      createdAt: agency.createdAt,
    });
  }
);

/**
 * GET /agencies/:agencyId/tenants
 * List all tenants (clients) for an agency
 */
agenciesRouter.get(
  "/:agencyId/tenants",
  authMiddleware,
  zValidator("param", agencyIdParamSchema),
  zValidator("query", listQuerySchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId } = c.req.valid("param");
    const query = c.req.valid("query");

    await requireAgencyAccess(user.id, agencyId);

    // Get all tenants for this agency
    const allTenants = await db.query.tenants.findMany({
      where: eq(tenants.agencyId, agencyId),
    });

    // Filter by search if provided
    let filteredTenants = allTenants;
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredTenants = allTenants.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.slug.toLowerCase().includes(searchLower)
      );
    }

    // Get additional stats for each tenant
    const tenantsWithStats = await Promise.all(
      filteredTenants.map(async (tenant) => {
        // Count members
        const memberCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(tenantMembers)
          .where(
            and(
              eq(tenantMembers.tenantId, tenant.id),
              eq(tenantMembers.isActive, true)
            )
          );

        // Count active members (logged in last 30 days would require lastLoginAt tracking)
        // For now, just use total members
        const totalMembers = Number(memberCount[0]?.count || 0);

        // Count programs
        const programCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(programs)
          .where(eq(programs.tenantId, tenant.id));
        const totalPrograms = Number(programCount[0]?.count || 0);

        // Calculate engagement (simplified: % of members enrolled in programs)
        let engagement = 0;
        if (totalMembers > 0 && totalPrograms > 0) {
          const enrollmentCount = await db
            .select({ count: sql<number>`count(distinct ${enrollments.userId})` })
            .from(enrollments)
            .innerJoin(programs, eq(enrollments.programId, programs.id))
            .where(eq(programs.tenantId, tenant.id));
          const enrolledUsers = Number(enrollmentCount[0]?.count || 0);
          engagement = Math.round((enrolledUsers / totalMembers) * 100);
        }

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
          status: tenant.isActive ? "active" : "inactive",
          users: totalMembers,
          activeUsers: totalMembers, // TODO: track actual active users
          programs: totalPrograms,
          engagement,
          pendingInvites: 0, // TODO: count pending invitations
          createdAt: tenant.createdAt,
        };
      })
    );

    // Sort by name
    tenantsWithStats.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    const start = (query.page - 1) * query.perPage;
    const paginatedTenants = tenantsWithStats.slice(
      start,
      start + query.perPage
    );

    return paginated(c, paginatedTenants, {
      page: query.page,
      perPage: query.perPage,
      total: tenantsWithStats.length,
    });
  }
);

/**
 * GET /agencies/:agencyId/stats
 * Get agency-level statistics
 */
agenciesRouter.get(
  "/:agencyId/stats",
  authMiddleware,
  zValidator("param", agencyIdParamSchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId } = c.req.valid("param");

    await requireAgencyAccess(user.id, agencyId);

    // Count tenants
    const tenantCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(and(eq(tenants.agencyId, agencyId), eq(tenants.isActive, true)));

    // Count total users across all tenants
    const userCount = await db
      .select({ count: sql<number>`count(distinct ${tenantMembers.userId})` })
      .from(tenantMembers)
      .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
      .where(
        and(eq(tenants.agencyId, agencyId), eq(tenantMembers.isActive, true))
      );

    // Count total programs across all tenants
    const programCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(programs)
      .innerJoin(tenants, eq(programs.tenantId, tenants.id))
      .where(eq(tenants.agencyId, agencyId));

    return success(c, {
      totalTenants: Number(tenantCount[0]?.count || 0),
      totalUsers: Number(userCount[0]?.count || 0),
      totalPrograms: Number(programCount[0]?.count || 0),
    });
  }
);

/**
 * GET /agencies/:agencyId/members
 * List agency team members
 */
agenciesRouter.get(
  "/:agencyId/members",
  authMiddleware,
  zValidator("param", agencyIdParamSchema),
  zValidator("query", listQuerySchema),
  async (c) => {
    const user = c.get("user");
    const { agencyId } = c.req.valid("param");
    const query = c.req.valid("query");

    await requireAgencyAccess(user.id, agencyId);

    // Get all agency members with user details
    const members = await db.query.agencyMembers.findMany({
      where: eq(agencyMembers.agencyId, agencyId),
      with: {
        user: true,
      },
    });

    // Filter by search if provided
    let filteredMembers = members;
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredMembers = members.filter(
        (m) =>
          m.user.email.toLowerCase().includes(searchLower) ||
          (m.user.firstName?.toLowerCase().includes(searchLower)) ||
          (m.user.lastName?.toLowerCase().includes(searchLower))
      );
    }

    // Map to response format
    const mappedMembers = filteredMembers.map((m) => ({
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      createdAt: m.createdAt,
    }));

    // Sort by role priority then name
    const rolePriority: Record<string, number> = {
      owner: 0,
      admin: 1,
      support: 2,
      analyst: 3,
    };
    mappedMembers.sort((a, b) => {
      const roleDiff = (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
      if (roleDiff !== 0) return roleDiff;
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
      return nameA.localeCompare(nameB);
    });

    // Apply pagination
    const start = (query.page - 1) * query.perPage;
    const paginatedMembers = mappedMembers.slice(start, start + query.perPage);

    return paginated(c, paginatedMembers, {
      page: query.page,
      perPage: query.perPage,
      total: mappedMembers.length,
    });
  }
);

export { agenciesRouter };
