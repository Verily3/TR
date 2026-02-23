import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, desc, asc, sql, inArray } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { hash } from 'argon2';
import { db, schema } from '@tr/db';
import { requirePermission, requireTenantAccess } from '../middleware/permissions.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';
import type { PaginationMeta, ApiResponse } from '@tr/shared';
import { resolveFileUrl } from '../lib/storage.js';

const { users, userRoles, roles } = schema;

export const usersRoutes = new Hono<{ Variables: Variables }>();

// Query params schema
const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

/**
 * GET /api/users/tenants/:tenantId
 * List users in a tenant
 */
usersRoutes.get(
  '/tenants/:tenantId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.USERS_VIEW),
  zValidator('query', listQuerySchema),
  async (c) => {
    const { tenantId } = c.req.param();
    const { page, limit, status, search } = c.req.valid('query');

    // Build where conditions
    const conditions: SQL<unknown>[] = [eq(users.tenantId, tenantId), isNull(users.deletedAt)];

    if (status) {
      conditions.push(eq(users.status, status));
    }

    if (search) {
      conditions.push(
        sql`(
          "users"."first_name" ILIKE ${`%${search}%`}
          OR "users"."last_name" ILIKE ${`%${search}%`}
          OR "users"."email" ILIKE ${`%${search}%`}
        )`
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions));

    // Get paginated results with role info
    // Single subquery returning row(slug, name, level) instead of 3 separate subqueries
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatar: users.avatar,
        title: users.title,
        department: users.department,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        roleSlug: sql<string | null>`(
          SELECT r."slug" FROM "user_roles" ur
          INNER JOIN "roles" r ON ur."role_id" = r."id"
          WHERE ur."user_id" = "users"."id"
          ORDER BY r."level" DESC
          LIMIT 1
        )`,
        roleName: sql<string | null>`(
          SELECT r."name" FROM "user_roles" ur
          INNER JOIN "roles" r ON ur."role_id" = r."id"
          WHERE ur."user_id" = "users"."id"
          ORDER BY r."level" DESC
          LIMIT 1
        )`,
        roleLevel: sql<number | null>`(
          SELECT r."level" FROM "user_roles" ur
          INNER JOIN "roles" r ON ur."role_id" = r."id"
          WHERE ur."user_id" = "users"."id"
          ORDER BY r."level" DESC
          LIMIT 1
        )`,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))
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

    const response: ApiResponse<typeof results> = {
      data: results,
      meta: { pagination },
    };

    return c.json(response);
  }
);

/**
 * GET /api/users/tenants/:tenantId/:userId
 * Get a specific user
 */
usersRoutes.get(
  '/tenants/:tenantId/:userId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (c) => {
    const { tenantId, userId } = c.req.param();

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Get user's roles
    const userRolesData = await db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleSlug: roles.slug,
        roleLevel: roles.level,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return c.json({
      data: {
        ...user,
        passwordHash: undefined, // Never expose password hash
        roles: userRolesData,
      },
    });
  }
);

/**
 * GET /api/users/me
 * Get current user's full profile
 */
usersRoutes.get('/me', async (c) => {
  const currentUser = c.get('user');

  const [user] = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);

  if (!user) {
    throw new NotFoundError('User');
  }

  // Get user's roles
  const userRolesData = await db
    .select({
      roleId: roles.id,
      roleName: roles.name,
      roleSlug: roles.slug,
      roleLevel: roles.level,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, user.id));

  const avatarUrl = await resolveFileUrl(user.avatar);

  return c.json({
    data: {
      ...user,
      avatar: avatarUrl,
      passwordHash: undefined,
      roles: userRolesData,
    },
  });
});

/**
 * PATCH /api/users/me
 * Update current user's own profile (no special permission required)
 */
const updateMeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  title: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  avatar: z.string().nullable().optional(),
});

usersRoutes.patch('/me', zValidator('json', updateMeSchema), async (c) => {
  const currentUser = c.get('user');
  const body = c.req.valid('json');

  // Reject base64 avatar uploads — use POST /api/upload/avatar instead
  if (body.avatar && body.avatar.startsWith('data:')) {
    throw new BadRequestError(
      'Base64 avatar upload is no longer supported. Use POST /api/upload/avatar with multipart form data.'
    );
  }

  const [updated] = await db
    .update(users)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))
    .returning();

  const avatarUrl = await resolveFileUrl(updated.avatar);

  return c.json({
    data: {
      ...updated,
      avatar: avatarUrl,
      passwordHash: undefined,
    },
  });
});

// ============================================
// USER CRUD (Tenant admin + Agency admin)
// ============================================

const createUserSchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(12).max(100).optional(),
  title: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  role: z.enum(['learner', 'mentor', 'facilitator', 'tenant_admin']),
  managerId: z.string().uuid().nullable().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  title: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  avatar: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  managerId: z.string().uuid().nullable().optional(),
});

const changeRoleSchema = z.object({
  role: z.enum(['learner', 'mentor', 'facilitator', 'tenant_admin']),
});

/**
 * POST /api/users/tenants/:tenantId
 * Create a new user in a tenant
 */
usersRoutes.post(
  '/tenants/:tenantId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  zValidator('json', createUserSchema),
  async (c) => {
    const currentUser = c.get('user');
    const { tenantId } = c.req.param();
    const body = c.req.valid('json');

    // Check tenant user limit
    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), isNull(users.deletedAt)));

    const tenant = c.get('tenant')!;
    if (Number(userCount) >= tenant.usersLimit) {
      throw new BadRequestError(
        `User limit reached (${tenant.usersLimit}). Cannot add more users.`
      );
    }

    // Check email uniqueness within tenant
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(eq(users.email, body.email), eq(users.tenantId, tenantId), isNull(users.deletedAt))
      )
      .limit(1);

    if (existingUser) {
      throw new ConflictError(`A user with email '${body.email}' already exists in this tenant`);
    }

    // Find the role for this tenant
    const [role] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.slug, body.role), eq(roles.tenantId, tenantId)))
      .limit(1);

    if (!role) {
      throw new BadRequestError(`Role '${body.role}' not found for this tenant`);
    }

    // Cannot assign role at or above your own level (unless agency owner)
    if (currentUser.roleLevel < 100 && role.level >= currentUser.roleLevel) {
      throw new ForbiddenError('Cannot assign a role at or above your own level');
    }

    // Hash password if provided, otherwise leave null (SSO)
    const passwordHash = body.password ? await hash(body.password) : null;

    // Create user and assign role in transaction
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          tenantId,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          passwordHash,
          title: body.title,
          department: body.department,
          managerId: body.managerId ?? null,
        })
        .returning();

      await tx.insert(userRoles).values({
        userId: newUser.id,
        roleId: role.id,
      });

      return newUser;
    });

    return c.json(
      {
        data: {
          ...result,
          passwordHash: undefined,
          roleSlug: body.role,
          roleName: role.name,
          roleLevel: role.level,
        },
      },
      201
    );
  }
);

/**
 * PUT /api/users/tenants/:tenantId/:userId
 * Update a user's profile
 */
usersRoutes.put(
  '/tenants/:tenantId/:userId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  zValidator('json', updateUserSchema),
  async (c) => {
    const { tenantId, userId } = c.req.param();
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId), isNull(users.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('User', userId);
    }

    // If managerId provided, verify manager exists in same tenant
    if (body.managerId) {
      const [manager] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(eq(users.id, body.managerId), eq(users.tenantId, tenantId), isNull(users.deletedAt))
        )
        .limit(1);

      if (!manager) {
        throw new BadRequestError('Manager not found in this tenant');
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return c.json({
      data: {
        ...updated,
        passwordHash: undefined,
      },
    });
  }
);

/**
 * DELETE /api/users/tenants/:tenantId/:userId
 * Soft delete a user
 */
usersRoutes.delete(
  '/tenants/:tenantId/:userId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  async (c) => {
    const currentUser = c.get('user');
    const { tenantId, userId } = c.req.param();

    if (currentUser.id === userId) {
      throw new BadRequestError('Cannot delete yourself');
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId), isNull(users.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('User', userId);
    }

    await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date(), status: 'inactive' })
      .where(eq(users.id, userId));

    return c.json({ data: { success: true } });
  }
);

/**
 * PUT /api/users/tenants/:tenantId/:userId/role
 * Change a user's role
 */
usersRoutes.put(
  '/tenants/:tenantId/:userId/role',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  zValidator('json', changeRoleSchema),
  async (c) => {
    const currentUser = c.get('user');
    const { tenantId, userId } = c.req.param();
    const { role: newRoleSlug } = c.req.valid('json');

    if (currentUser.id === userId) {
      throw new BadRequestError('Cannot change your own role');
    }

    // Verify user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId), isNull(users.deletedAt)))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundError('User', userId);
    }

    // Find the new role
    const [newRole] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.slug, newRoleSlug), eq(roles.tenantId, tenantId)))
      .limit(1);

    if (!newRole) {
      throw new BadRequestError(`Role '${newRoleSlug}' not found for this tenant`);
    }

    // Cannot assign role at or above your own level (unless agency owner)
    if (currentUser.roleLevel < 100 && newRole.level >= currentUser.roleLevel) {
      throw new ForbiddenError('Cannot assign a role at or above your own level');
    }

    // Get current role to check level
    const [currentRole] = await db
      .select({ level: roles.level })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))
      .limit(1);

    // Cannot change role of someone at or above your level (unless agency owner)
    if (currentRole && currentUser.roleLevel < 100 && currentRole.level >= currentUser.roleLevel) {
      throw new ForbiddenError('Cannot change the role of a user at or above your own level');
    }

    // Remove old tenant roles and assign new one
    await db.transaction(async (tx) => {
      // Get all tenant role IDs
      const tenantRoleIds = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.tenantId, tenantId));

      // Delete existing tenant role assignments for this user
      for (const { id } of tenantRoleIds) {
        await tx
          .delete(userRoles)
          .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, id)));
      }

      // Assign new role
      await tx.insert(userRoles).values({
        userId,
        roleId: newRole.id,
      });
    });

    return c.json({
      data: {
        userId,
        roleSlug: newRoleSlug,
        roleName: newRole.name,
        roleLevel: newRole.level,
      },
    });
  }
);

/**
 * GET /api/users/tenants/:tenantId/departments
 * List distinct departments for a tenant (computed from users table)
 */
usersRoutes.get('/tenants/:tenantId/departments', requireTenantAccess(), async (c) => {
  const { tenantId } = c.req.param();

  const rows = await db
    .selectDistinct({ department: users.department })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        isNull(users.deletedAt),
        sql`${users.department} IS NOT NULL AND ${users.department} != ''`
      )
    )
    .orderBy(asc(users.department));

  const departments = rows.map((r) => r.department).filter((d): d is string => !!d);

  return c.json({ data: departments });
});

/**
 * GET /api/users/tenants/:tenantId/me/direct-reports
 * Return direct reports of the current user with performance summary
 */
usersRoutes.get('/tenants/:tenantId/me/direct-reports', requireTenantAccess(), async (c) => {
  const { tenantId } = c.req.param();
  const currentUser = c.get('user');

  const reports = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      title: users.title,
      department: users.department,
    })
    .from(users)
    .where(
      and(
        eq(users.managerId, currentUser.id),
        eq(users.tenantId, tenantId),
        isNull(users.deletedAt)
      )
    )
    .orderBy(asc(users.firstName));

  if (reports.length === 0) {
    return c.json({ data: [] });
  }

  const reportIds = reports.map((r) => r.id);

  // Avg scorecard score per direct report
  const scorecardScores = await db
    .select({
      userId: schema.scorecardItems.userId,
      avgScore: sql<number>`coalesce(round(avg(${schema.scorecardItems.score})), 0)::int`,
    })
    .from(schema.scorecardItems)
    .where(
      and(
        inArray(schema.scorecardItems.userId, reportIds),
        eq(schema.scorecardItems.tenantId, tenantId)
      )
    )
    .groupBy(schema.scorecardItems.userId);

  // Goal completion counts per direct report
  const goalStats = await db
    .select({
      userId: schema.enrollments.userId,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${schema.goalResponses.status} = 'completed')::int`,
    })
    .from(schema.goalResponses)
    .innerJoin(schema.enrollments, eq(schema.goalResponses.enrollmentId, schema.enrollments.id))
    .where(inArray(schema.enrollments.userId, reportIds))
    .groupBy(schema.enrollments.userId);

  // Active program counts per direct report
  const programCounts = await db
    .select({
      userId: schema.enrollments.userId,
      activeCount: sql<number>`count(*)::int`,
    })
    .from(schema.enrollments)
    .innerJoin(schema.programs, eq(schema.enrollments.programId, schema.programs.id))
    .where(
      and(
        inArray(schema.enrollments.userId, reportIds),
        eq(schema.programs.tenantId, tenantId),
        eq(schema.enrollments.status, 'active'),
        eq(schema.enrollments.role, 'learner')
      )
    )
    .groupBy(schema.enrollments.userId);

  const scoreMap = new Map(scorecardScores.map((s) => [s.userId, s.avgScore]));
  const goalMap = new Map(goalStats.map((g) => [g.userId, g]));
  const programMap = new Map(programCounts.map((p) => [p.userId, p.activeCount]));

  const getRating = (score: number): 'A' | 'A-' | 'B+' | 'B' | 'B-' => {
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    return 'B-';
  };

  const data = reports.map((r) => {
    const score = scoreMap.get(r.id) ?? 0;
    const goals = goalMap.get(r.id);
    const programs = programMap.get(r.id) ?? 0;
    return {
      id: r.id,
      name: `${r.firstName} ${r.lastName}`.trim(),
      role: r.title ?? r.department ?? 'Team Member',
      scorecardScore: score,
      scorecardTrend: 'neutral' as const,
      goalsCompleted: goals?.completed ?? 0,
      goalsTotal: goals?.total ?? 0,
      programsActive: programs,
      rating: getRating(score),
    };
  });

  return c.json({ data });
});
