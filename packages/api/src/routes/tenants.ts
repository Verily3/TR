import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireAgencyAccess, requirePermission, requireTenantAccess } from '../middleware/permissions.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { PERMISSIONS, SYSTEM_ROLES } from '@tr/shared';
import type { Variables } from '../types/context.js';
import type { PaginationMeta } from '@tr/shared';

const { tenants, users, roles } = schema;

export const tenantsRoutes = new Hono<{ Variables: Variables }>();

// Query params schema
const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['active', 'trial', 'suspended', 'churned']).optional(),
});

/**
 * GET /api/tenants
 * List tenants (for agency users, lists tenants in their agency)
 * (for tenant users, returns their own tenant)
 */
tenantsRoutes.get('/', zValidator('query', listQuerySchema), async (c) => {
  const user = c.get('user');
  const { page, limit, status } = c.req.valid('query');

  // If tenant user, return only their tenant
  if (user.tenantId && !user.agencyId) {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(
        and(eq(tenants.id, user.tenantId), isNull(tenants.deletedAt))
      )
      .limit(1);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    return c.json({ data: [tenant], meta: { pagination: { page: 1, limit: 1, total: 1, totalPages: 1, hasNext: false, hasPrev: false } } });
  }

  // Agency user - list all tenants in agency
  if (!user.agencyId) {
    throw new NotFoundError('Agency context required');
  }

  const conditions = [
    eq(tenants.agencyId, user.agencyId),
    isNull(tenants.deletedAt),
  ];

  if (status) {
    conditions.push(eq(tenants.status, status));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenants)
    .where(and(...conditions));

  // Get paginated results with user count
  const results = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      domain: tenants.domain,
      industry: tenants.industry,
      status: tenants.status,
      logo: tenants.logo,
      usersLimit: tenants.usersLimit,
      settings: tenants.settings,
      createdAt: tenants.createdAt,
      userCount: sql<number>`(
        SELECT count(*) FROM "users" u
        WHERE u."tenant_id" = "tenants"."id"
        AND u."deleted_at" IS NULL
      )`,
    })
    .from(tenants)
    .where(and(...conditions))
    .orderBy(desc(tenants.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const pagination: PaginationMeta = {
    page,
    limit,
    total: Number(count),
    totalPages: Math.ceil(Number(count) / limit),
    hasNext: page * limit < Number(count),
    hasPrev: page > 1,
  };

  return c.json({ data: results, meta: { pagination } });
});

/**
 * GET /api/tenants/:tenantId
 * Get a specific tenant
 */
tenantsRoutes.get('/:tenantId', requireTenantAccess(), async (c) => {
  const tenant = c.get('tenant');

  if (!tenant) {
    throw new NotFoundError('Tenant');
  }

  // Get user count for this tenant
  const [{ userCount }] = await db
    .select({ userCount: sql<number>`count(*)` })
    .from(users)
    .where(
      and(eq(users.tenantId, tenant.id), isNull(users.deletedAt))
    );

  return c.json({
    data: {
      ...tenant,
      userCount: Number(userCount),
    },
  });
});

/**
 * GET /api/tenants/:tenantId/stats
 * Get tenant statistics
 */
tenantsRoutes.get('/:tenantId/stats', requireTenantAccess(), async (c) => {
  const tenant = c.get('tenant');

  if (!tenant) {
    throw new NotFoundError('Tenant');
  }

  // Get various stats
  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)` })
    .from(users)
    .where(
      and(eq(users.tenantId, tenant.id), isNull(users.deletedAt))
    );

  const [{ activeUsers }] = await db
    .select({ activeUsers: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenant.id),
        eq(users.status, 'active'),
        isNull(users.deletedAt)
      )
    );

  return c.json({
    data: {
      totalUsers: Number(totalUsers),
      activeUsers: Number(activeUsers),
      usersLimit: tenant.usersLimit,
      usersRemaining: tenant.usersLimit - Number(totalUsers),
    },
  });
});

// ============================================
// TENANT CRUD (Agency admins only)
// ============================================

const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  domain: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  status: z.enum(['active', 'trial', 'suspended']).default('active'),
  usersLimit: z.number().int().min(1).max(10000).default(50),
  settings: z.object({
    timezone: z.string().optional(),
    dateFormat: z.string().optional(),
    fiscalYearStart: z.string().optional(),
    canCreatePrograms: z.boolean().optional(),
    features: z.object({
      programs: z.boolean().optional(),
      assessments: z.boolean().optional(),
      mentoring: z.boolean().optional(),
      goals: z.boolean().optional(),
      analytics: z.boolean().optional(),
      scorecard: z.boolean().optional(),
      planning: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const updateTenantSchema = createTenantSchema.partial().extend({
  logo: z.string().optional(),
  primaryColor: z.string().max(7).optional(),
  accentColor: z.string().max(7).optional(),
});

/**
 * POST /api/tenants
 * Create a new tenant (agency admin only)
 */
tenantsRoutes.post(
  '/',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_MANAGE_CLIENTS),
  zValidator('json', createTenantSchema),
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    // Auto-generate slug from name if not provided
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check slug uniqueness within agency
    const [existing] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(
        and(
          eq(tenants.slug, slug),
          eq(tenants.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictError(`A client with slug '${slug}' already exists`);
    }

    // Create tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        agencyId: user.agencyId!,
        name: body.name,
        slug,
        domain: body.domain,
        industry: body.industry,
        status: body.status,
        usersLimit: body.usersLimit,
        settings: body.settings || {},
      })
      .returning();

    // Create default system roles for the new tenant
    const tenantRoles = Object.values(SYSTEM_ROLES).filter(r => !r.isAgencyRole);
    for (const roleDef of tenantRoles) {
      await db.insert(roles).values({
        tenantId: tenant.id,
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        level: roleDef.level,
        isSystem: true,
        permissions: roleDef.permissions as string[],
      });
    }

    return c.json({ data: tenant }, 201);
  }
);

/**
 * PUT /api/tenants/:tenantId
 * Update a tenant (agency admin only)
 */
tenantsRoutes.put(
  '/:tenantId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_MANAGE_CLIENTS),
  zValidator('json', updateTenantSchema),
  async (c) => {
    const user = c.get('user');
    const { tenantId } = c.req.param();
    const body = c.req.valid('json');

    // Verify tenant belongs to this agency
    const [existing] = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, tenantId),
          eq(tenants.agencyId, user.agencyId!),
          isNull(tenants.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Tenant', tenantId);
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const [slugConflict] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(
          and(
            eq(tenants.slug, body.slug),
            eq(tenants.agencyId, user.agencyId!)
          )
        )
        .limit(1);

      if (slugConflict) {
        throw new ConflictError(`A client with slug '${body.slug}' already exists`);
      }
    }

    const [updated] = await db
      .update(tenants)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/tenants/:tenantId
 * Soft delete a tenant (agency admin only)
 */
tenantsRoutes.delete(
  '/:tenantId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_MANAGE_CLIENTS),
  async (c) => {
    const user = c.get('user');
    const { tenantId } = c.req.param();

    const [existing] = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, tenantId),
          eq(tenants.agencyId, user.agencyId!),
          isNull(tenants.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Tenant', tenantId);
    }

    await db
      .update(tenants)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    return c.json({ data: { success: true } });
  }
);
