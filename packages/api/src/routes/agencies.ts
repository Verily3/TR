import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, sql, desc, asc, or } from 'drizzle-orm';
import { hash } from 'argon2';
import { db, schema } from '@tr/db';
import { requireAgencyAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';
import type { PaginationMeta } from '@tr/shared';

const { agencies, tenants, users, programs, modules, lessons, enrollments, roles, userRoles, lessonTasks } = schema;

export const agenciesRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET /api/agencies/me
 * Get current user's agency
 */
agenciesRoutes.get('/me', requireAgencyAccess(), async (c) => {
  const user = c.get('user');

  const [agency] = await db
    .select()
    .from(agencies)
    .where(
      and(eq(agencies.id, user.agencyId!), isNull(agencies.deletedAt))
    )
    .limit(1);

  if (!agency) {
    throw new NotFoundError('Agency');
  }

  return c.json({ data: agency });
});

const updateAgencySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo: z.string().nullable().optional(),
  primaryColor: z.string().max(7).optional(),
  accentColor: z.string().max(7).optional(),
  domain: z.string().max(255).nullable().optional(),
  settings: z.object({
    allowClientProgramCreation: z.boolean().optional(),
    maxClients: z.number().optional(),
    maxUsersPerClient: z.number().optional(),
    features: z.object({
      programs: z.boolean().optional(),
      assessments: z.boolean().optional(),
      mentoring: z.boolean().optional(),
      goals: z.boolean().optional(),
      analytics: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

/**
 * PUT /api/agencies/me
 * Update current agency (branding, settings)
 */
agenciesRoutes.put(
  '/me',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_MANAGE),
  zValidator('json', updateAgencySchema),
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const [updated] = await db
      .update(agencies)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(agencies.id, user.agencyId!))
      .returning();

    if (!updated) {
      throw new NotFoundError('Agency');
    }

    return c.json({ data: updated });
  }
);

/**
 * GET /api/agencies/me/stats
 * Get agency statistics
 */
agenciesRoutes.get('/me/stats', requireAgencyAccess(), async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId!;

  // Single query combining all stats (was 4 separate round-trips)
  const [tenantStats] = await db
    .select({
      totalTenants: sql<number>`count(*)`,
      activeTenants: sql<number>`count(*) FILTER (WHERE ${tenants.status} = 'active')`,
    })
    .from(tenants)
    .where(and(eq(tenants.agencyId, agencyId), isNull(tenants.deletedAt)));

  const [userStats] = await db
    .select({
      totalUsers: sql<number>`count(*) FILTER (WHERE ${users.tenantId} IS NOT NULL)`,
      agencyUsers: sql<number>`count(*) FILTER (WHERE ${users.agencyId} = ${agencyId})`,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(
      and(
        isNull(users.deletedAt),
        or(
          eq(users.agencyId, agencyId),
          eq(tenants.agencyId, agencyId)
        )
      )
    );

  return c.json({
    data: {
      totalTenants: Number(tenantStats.totalTenants),
      activeTenants: Number(tenantStats.activeTenants),
      totalUsers: Number(userStats.totalUsers),
      agencyUsers: Number(userStats.agencyUsers),
    },
  });
});

// ============================================
// AGENCY STAFF ROUTES
// ============================================

/**
 * GET /api/agencies/me/users
 * List agency staff (users with agencyId)
 */
agenciesRoutes.get(
  '/me/users',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_MANAGE),
  async (c) => {
    const user = c.get('user');

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
      .where(
        and(eq(users.agencyId, user.agencyId!), isNull(users.deletedAt))
      )
      .orderBy(desc(users.createdAt));

    return c.json({ data: results });
  }
);

/**
 * GET /api/agencies/me/users/search
 * Search users across all tenants belonging to this agency (for impersonation)
 */
const searchUsersSchema = z.object({
  search: z.string().min(1).max(100).optional().default(''),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  tenantId: z.string().uuid().optional(),
  includeUnaffiliated: z.coerce.boolean().optional().default(false),
});

agenciesRoutes.get(
  '/me/users/search',
  requireAgencyAccess(),
  requirePermission([PERMISSIONS.AGENCY_IMPERSONATE, PERMISSIONS.PROGRAMS_ENROLL]),
  zValidator('query', searchUsersSchema),
  async (c) => {
    const user = c.get('user');
    const { search, limit, tenantId, includeUnaffiliated } = c.req.valid('query');

    if (search) {
      // Build conditions based on whether we include unaffiliated users
      const searchCondition = sql`(
        "users"."first_name" ILIKE ${`%${search}%`}
        OR "users"."last_name" ILIKE ${`%${search}%`}
        OR "users"."email" ILIKE ${`%${search}%`}
      )`;

      // If filtering by specific tenant, use simple join query
      if (tenantId) {
        const results = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            avatar: users.avatar,
            title: users.title,
            status: users.status,
            tenantId: users.tenantId,
            tenantName: tenants.name,
          })
          .from(users)
          .innerJoin(tenants, eq(users.tenantId, tenants.id))
          .where(
            and(
              isNull(users.deletedAt),
              eq(users.tenantId, tenantId),
              eq(tenants.agencyId, user.agencyId!),
              eq(users.status, 'active'),
              searchCondition
            )
          )
          .orderBy(users.firstName, users.lastName)
          .limit(limit);

        return c.json({ data: results });
      }

      // Default: search across all tenants (optionally include unaffiliated)
      const conditions: unknown[] = [
        isNull(users.deletedAt),
        eq(users.status, 'active'),
        searchCondition,
      ];

      if (!includeUnaffiliated) {
        conditions.push(sql`"users"."tenant_id" IS NOT NULL`);
      }

      // Use left join to include unaffiliated users (tenantId = null)
      const joinType = includeUnaffiliated ? 'leftJoin' : 'innerJoin';

      const results = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          title: users.title,
          status: users.status,
          tenantId: users.tenantId,
          tenantName: tenants.name,
        })
        .from(users)
        [joinType](tenants, eq(users.tenantId, tenants.id))
        .where(
          and(
            ...(conditions as any[]),
            // For tenant-joined users, verify agency match
            // For unaffiliated users, verify they belong to this agency
            or(
              eq(tenants.agencyId, user.agencyId!),
              and(isNull(users.tenantId), eq(users.agencyId, user.agencyId!))
            )
          )
        )
        .orderBy(users.firstName, users.lastName)
        .limit(limit);

      return c.json({ data: results });
    }

    // No search term — return empty
    return c.json({ data: [] });
  }
);

const createAgencyUserSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8).max(100).optional(),
  title: z.string().max(200).optional(),
  role: z.enum(['agency_admin', 'agency_owner']),
});

/**
 * POST /api/agencies/me/users
 * Create a new agency staff member
 */
agenciesRoutes.post(
  '/me/users',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_MANAGE),
  zValidator('json', createAgencyUserSchema),
  async (c) => {
    const currentUser = c.get('user');
    const body = c.req.valid('json');

    // Only agency owners can create other agency owners
    if (body.role === 'agency_owner' && currentUser.roleLevel < 100) {
      throw new ForbiddenError('Only agency owners can create other agency owners');
    }

    // Check email uniqueness within agency
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, body.email),
          eq(users.agencyId, currentUser.agencyId!),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictError(`A user with email '${body.email}' already exists in this agency`);
    }

    // Find the agency role
    const [role] = await db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.slug, body.role),
          eq(roles.agencyId, currentUser.agencyId!)
        )
      )
      .limit(1);

    if (!role) {
      throw new BadRequestError(`Role '${body.role}' not found for this agency`);
    }

    const passwordHash = body.password ? await hash(body.password) : null;

    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          agencyId: currentUser.agencyId!,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          passwordHash,
          title: body.title,
        })
        .returning();

      await tx.insert(userRoles).values({
        userId: newUser.id,
        roleId: role.id,
      });

      return newUser;
    });

    return c.json({
      data: {
        ...result,
        passwordHash: undefined,
        roleSlug: body.role,
        roleName: role.name,
        roleLevel: role.level,
      },
    }, 201);
  }
);

// ============================================
// AGENCY PROGRAMS ROUTES
// ============================================

// Validation schemas for programs
const programListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  type: z.enum(['cohort', 'self_paced']).optional(),
});

const createAgencyProgramSchema = z.object({
  name: z.string().min(1).max(255),
  internalName: z.string().max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['cohort', 'self_paced']).default('cohort'),
  coverImage: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().max(50).optional(),
  // Optional: restrict to specific tenant
  tenantId: z.string().uuid().optional(),
  // Optional: allow multiple tenants to participate
  allowedTenantIds: z.array(z.string().uuid()).optional(),
  config: z
    .object({
      sequentialAccess: z.boolean().optional(),
      trackInScorecard: z.boolean().optional(),
      autoEnrollment: z.boolean().optional(),
      requireManagerApproval: z.boolean().optional(),
      allowSelfEnrollment: z.boolean().optional(),
      maxCapacity: z.number().optional(),
      waitlistEnabled: z.boolean().optional(),
      issueCertificate: z.boolean().optional(),
      linkToGoals: z.boolean().optional(),
      allowCrossTenantEnrollment: z.boolean().optional(),
      requireMentor: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
});

const updateAgencyProgramSchema = createAgencyProgramSchema.partial().extend({
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

/**
 * GET /api/agencies/me/programs
 * List all programs owned by the agency
 */
agenciesRoutes.get(
  '/me/programs',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('query', programListQuerySchema),
  async (c) => {
    const user = c.get('user');
    const { page, limit, status, type } = c.req.valid('query');

    const conditions = [
      eq(programs.agencyId, user.agencyId!),
      isNull(programs.deletedAt),
    ];

    if (status) {
      conditions.push(eq(programs.status, status));
    }

    if (type) {
      conditions.push(eq(programs.type, type));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(programs)
      .where(and(...conditions));

    // Get paginated results with enrollment count
    const results = await db
      .select({
        id: programs.id,
        name: programs.name,
        internalName: programs.internalName,
        description: programs.description,
        type: programs.type,
        status: programs.status,
        coverImage: programs.coverImage,
        startDate: programs.startDate,
        endDate: programs.endDate,
        tenantId: programs.tenantId,
        allowedTenantIds: programs.allowedTenantIds,
        config: programs.config,
        createdAt: programs.createdAt,
        updatedAt: programs.updatedAt,
        enrollmentCount: sql<number>`(
          SELECT count(*) FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
        )`,
        learnerCount: sql<number>`(
          SELECT count(*) FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."role" = 'learner'
        )`,
        moduleCount: sql<number>`(
          SELECT count(*) FROM "modules" m
          WHERE m."program_id" = "programs"."id"
        )`,
        lessonCount: sql<number>`(
          SELECT count(*) FROM "lessons" l
          INNER JOIN "modules" m ON l."module_id" = m."id"
          WHERE m."program_id" = "programs"."id"
        )`,
        totalPoints: sql<number>`(
          SELECT COALESCE(SUM(l."points"), 0) FROM "lessons" l
          INNER JOIN "modules" m ON l."module_id" = m."id"
          WHERE m."program_id" = "programs"."id"
        )`,
        avgProgress: sql<number>`(
          SELECT COALESCE(ROUND(AVG(e."progress")), 0) FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."role" = 'learner'
        )`,
        createdByName: sql<string | null>`(
          SELECT CONCAT(u."first_name", ' ', u."last_name") FROM "users" u
          WHERE u."id" = "programs"."created_by"
          LIMIT 1
        )`,
      })
      .from(programs)
      .where(and(...conditions))
      .orderBy(desc(programs.createdAt))
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
  }
);

/**
 * POST /api/agencies/me/programs
 * Create a new program (agency-owned)
 */
agenciesRoutes.post(
  '/me/programs',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_CREATE),
  zValidator('json', createAgencyProgramSchema),
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    // Validate dates
    if (body.startDate && body.endDate) {
      if (new Date(body.startDate) >= new Date(body.endDate)) {
        throw new BadRequestError('End date must be after start date');
      }
    }

    // If tenantId provided, verify it belongs to this agency
    if (body.tenantId) {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.id, body.tenantId),
            eq(tenants.agencyId, user.agencyId!)
          )
        )
        .limit(1);

      if (!tenant) {
        throw new BadRequestError('Tenant does not belong to this agency');
      }
    }

    // Validate allowedTenantIds if provided
    if (body.allowedTenantIds && body.allowedTenantIds.length > 0) {
      const validTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.agencyId, user.agencyId!));

      const validIds = new Set(validTenants.map((t) => t.id));
      const invalidIds = body.allowedTenantIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        throw new BadRequestError(
          `Invalid tenant IDs: ${invalidIds.join(', ')}`
        );
      }
    }

    const [program] = await db
      .insert(programs)
      .values({
        agencyId: user.agencyId!,
        tenantId: body.tenantId || null,
        allowedTenantIds: body.allowedTenantIds || [],
        name: body.name,
        internalName: body.internalName,
        description: body.description,
        type: body.type,
        coverImage: body.coverImage,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        timezone: body.timezone,
        config: body.config || {},
        createdBy: user.id,
      })
      .returning();

    return c.json({ data: program }, 201);
  }
);

/**
 * GET /api/agencies/me/programs/:programId
 * Get a specific agency program
 */
agenciesRoutes.get(
  '/me/programs/:programId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const user = c.get('user');
    const { programId } = c.req.param();

    const [program] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.agencyId, user.agencyId!),
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    // Get modules with lessons
    const programModules = await db
      .select()
      .from(modules)
      .where(eq(modules.programId, programId))
      .orderBy(asc(modules.order));

    const moduleLessons = await db
      .select()
      .from(lessons)
      .where(
        sql`${lessons.moduleId} IN (SELECT id FROM ${modules} WHERE ${modules.programId} = ${programId})`
      )
      .orderBy(asc(lessons.order));

    // Get tasks for all lessons
    const lessonIds = moduleLessons.map((l) => l.id);
    const allTasks = lessonIds.length > 0
      ? await db
          .select()
          .from(lessonTasks)
          .where(sql`${lessonTasks.lessonId} IN ${lessonIds}`)
          .orderBy(asc(lessonTasks.order))
      : [];

    // Get enrollment stats
    const [stats] = await db
      .select({
        learnerCount: sql<number>`count(*) filter (where ${enrollments.role} = 'learner')`,
        mentorCount: sql<number>`count(*) filter (where ${enrollments.role} = 'mentor')`,
        facilitatorCount: sql<number>`count(*) filter (where ${enrollments.role} = 'facilitator')`,
      })
      .from(enrollments)
      .where(eq(enrollments.programId, programId));

    // Get enrollment breakdown by tenant
    const tenantBreakdown = await db
      .select({
        tenantId: enrollments.tenantId,
        count: sql<number>`count(*)`,
      })
      .from(enrollments)
      .where(eq(enrollments.programId, programId))
      .groupBy(enrollments.tenantId);

    // Organize lessons by module, with tasks nested in lessons
    const modulesWithLessons = programModules.map((mod) => ({
      ...mod,
      lessons: moduleLessons
        .filter((l) => l.moduleId === mod.id)
        .map((l) => ({
          ...l,
          tasks: allTasks.filter((t) => t.lessonId === l.id),
        })),
    }));

    return c.json({
      data: {
        ...program,
        modules: modulesWithLessons,
        stats: {
          learnerCount: Number(stats?.learnerCount || 0),
          mentorCount: Number(stats?.mentorCount || 0),
          facilitatorCount: Number(stats?.facilitatorCount || 0),
          tenantBreakdown,
        },
      },
    });
  }
);

/**
 * PUT /api/agencies/me/programs/:programId
 * Update an agency program
 */
agenciesRoutes.put(
  '/me/programs/:programId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', updateAgencyProgramSchema),
  async (c) => {
    const user = c.get('user');
    const { programId } = c.req.param();
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.agencyId, user.agencyId!),
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Program', programId);
    }

    // Validate allowedTenantIds if provided
    if (body.allowedTenantIds && body.allowedTenantIds.length > 0) {
      const validTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.agencyId, user.agencyId!));

      const validIds = new Set(validTenants.map((t) => t.id));
      const invalidIds = body.allowedTenantIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        throw new BadRequestError(
          `Invalid tenant IDs: ${invalidIds.join(', ')}`
        );
      }
    }

    const [updated] = await db
      .update(programs)
      .set({
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(programs.id, programId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/agencies/me/programs/:programId
 * Soft delete an agency program
 */
agenciesRoutes.delete(
  '/me/programs/:programId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const user = c.get('user');
    const { programId } = c.req.param();

    const [existing] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.agencyId, user.agencyId!),
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Program', programId);
    }

    await db
      .update(programs)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(programs.id, programId));

    return c.json({ data: { success: true } });
  }
);

// ============================================
// AGENCY PROGRAM MODULE ROUTES
// ============================================

const agencyEventConfigSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().optional(),
  location: z.string().optional(),
  zoomLink: z.string().optional(),
  meetingId: z.string().optional(),
  meetingPassword: z.string().optional(),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
});

const agencyModuleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  parentModuleId: z.string().uuid().optional(),
  order: z.number().int().optional(),
  type: z.enum(['module', 'event']).default('module'),
  eventConfig: agencyEventConfigSchema.optional(),
  dripType: z
    .enum(['immediate', 'days_after_enrollment', 'days_after_previous', 'on_date'])
    .default('immediate'),
  dripValue: z.number().int().optional(),
  dripDate: z.string().datetime().optional(),
});

const agencyLessonSchema = z.object({
  title: z.string().min(1).max(255),
  contentType: z
    .enum([
      'lesson', 'sub_module', 'quiz', 'assignment', 'mentor_meeting',
      'text_form', 'goal', 'mentor_approval', 'facilitator_approval',
    ])
    .default('lesson'),
  content: z.record(z.unknown()).optional(),
  order: z.number().int().optional(),
  durationMinutes: z.number().int().optional(),
  points: z.number().int().default(0),
  dripType: z
    .enum(['immediate', 'sequential', 'days_after_module_start', 'on_date'])
    .default('immediate'),
  dripValue: z.number().int().optional(),
  dripDate: z.string().datetime().optional(),
  visibleTo: z
    .object({
      learner: z.boolean().default(true),
      mentor: z.boolean().default(true),
      facilitator: z.boolean().default(true),
    })
    .optional(),
  approvalRequired: z.enum(['none', 'mentor', 'facilitator', 'both']).default('none'),
});

const agencyReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int(),
    })
  ),
});

const agencyTaskConfigSchema = z.object({
  formPrompt: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  enableDiscussion: z.boolean().optional(),
  goalPrompt: z.string().optional(),
  requireMetrics: z.boolean().optional(),
  requireActionSteps: z.boolean().optional(),
  metricsGuidance: z.string().optional(),
  actionStepsGuidance: z.string().optional(),
  submissionTypes: z.array(z.enum(['text', 'file_upload', 'url', 'video', 'presentation', 'spreadsheet'])).optional(),
  maxFileSize: z.number().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  questions: z.array(z.string()).optional(),
});

const agencyCreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  order: z.number().int().optional(),
  responseType: z.enum(['text', 'file_upload', 'goal', 'completion_click', 'discussion']).default('completion_click'),
  approvalRequired: z.enum(['none', 'mentor', 'facilitator', 'both']).default('none'),
  dueDate: z.string().datetime().optional(),
  dueDaysOffset: z.number().int().optional(),
  points: z.number().int().default(0),
  config: agencyTaskConfigSchema.optional(),
  status: z.enum(['draft', 'active']).default('draft'),
});

const agencyUpdateTaskSchema = agencyCreateTaskSchema.partial();

/**
 * POST /api/agencies/me/programs/:programId/modules
 * Create a module in an agency program
 */
agenciesRoutes.post(
  '/me/programs/:programId/modules',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyModuleSchema),
  async (c) => {
    const user = c.get('user');
    const { programId } = c.req.param();
    const body = c.req.valid('json');

    const [program] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.agencyId, user.agencyId!),
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    let order = body.order;
    if (order === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${modules.order}), -1)` })
        .from(modules)
        .where(eq(modules.programId, programId));
      order = Number(maxOrder) + 1;
    }

    let depth = 0;
    if (body.parentModuleId) {
      const [parent] = await db
        .select()
        .from(modules)
        .where(eq(modules.id, body.parentModuleId))
        .limit(1);
      if (!parent) {
        throw new NotFoundError('Parent module', body.parentModuleId);
      }
      depth = parent.depth + 1;
      if (depth > 1) {
        throw new BadRequestError('Maximum nesting depth is 2 levels');
      }
    }

    const [module] = await db
      .insert(modules)
      .values({
        programId,
        parentModuleId: body.parentModuleId,
        title: body.title,
        description: body.description,
        order,
        depth,
        type: body.type,
        eventConfig: body.eventConfig,
        dripType: body.dripType,
        dripValue: body.dripValue,
        dripDate: body.dripDate ? new Date(body.dripDate) : null,
      })
      .returning();

    return c.json({ data: module }, 201);
  }
);

/**
 * PUT /api/agencies/me/programs/:programId/modules/:moduleId
 * Update a module in an agency program
 */
agenciesRoutes.put(
  '/me/programs/:programId/modules/:moduleId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyModuleSchema.partial()),
  async (c) => {
    const user = c.get('user');
    const { programId, moduleId } = c.req.param();
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(modules)
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(modules.id, moduleId),
          eq(modules.programId, programId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Module', moduleId);
    }

    const [updated] = await db
      .update(modules)
      .set({
        ...body,
        dripDate: body.dripDate ? new Date(body.dripDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, moduleId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/agencies/me/programs/:programId/modules/:moduleId
 * Delete a module from an agency program
 */
agenciesRoutes.delete(
  '/me/programs/:programId/modules/:moduleId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const user = c.get('user');
    const { programId, moduleId } = c.req.param();

    const [existing] = await db
      .select()
      .from(modules)
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(modules.id, moduleId),
          eq(modules.programId, programId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Module', moduleId);
    }

    await db.delete(modules).where(eq(modules.id, moduleId));

    return c.json({ data: { success: true } });
  }
);

/**
 * PUT /api/agencies/me/programs/:programId/modules/reorder
 * Reorder modules in an agency program
 */
agenciesRoutes.put(
  '/me/programs/:programId/modules/reorder',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyReorderSchema),
  async (c) => {
    const { programId } = c.req.param();
    const { items } = c.req.valid('json');

    for (const item of items) {
      await db
        .update(modules)
        .set({ order: item.order, updatedAt: new Date() })
        .where(and(eq(modules.id, item.id), eq(modules.programId, programId)));
    }

    return c.json({ data: { success: true } });
  }
);

// ============================================
// AGENCY PROGRAM LESSON ROUTES
// ============================================

/**
 * POST /api/agencies/me/programs/:programId/modules/:moduleId/lessons
 * Create a lesson in an agency program module
 */
agenciesRoutes.post(
  '/me/programs/:programId/modules/:moduleId/lessons',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyLessonSchema),
  async (c) => {
    const user = c.get('user');
    const { programId, moduleId } = c.req.param();
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(modules)
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(modules.id, moduleId),
          eq(modules.programId, programId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Module', moduleId);
    }

    let order = body.order;
    if (order === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${lessons.order}), -1)` })
        .from(lessons)
        .where(eq(lessons.moduleId, moduleId));
      order = Number(maxOrder) + 1;
    }

    const [lesson] = await db
      .insert(lessons)
      .values({
        moduleId,
        title: body.title,
        contentType: body.contentType,
        content: body.content || {},
        order,
        durationMinutes: body.durationMinutes,
        points: body.points,
        dripType: body.dripType,
        dripValue: body.dripValue,
        dripDate: body.dripDate ? new Date(body.dripDate) : null,
        visibleTo: body.visibleTo || { learner: true, mentor: true, facilitator: true },
        approvalRequired: body.approvalRequired,
      })
      .returning();

    return c.json({ data: lesson }, 201);
  }
);

/**
 * PUT /api/agencies/me/programs/:programId/modules/:moduleId/lessons/:lessonId
 * Update a lesson in an agency program
 */
agenciesRoutes.put(
  '/me/programs/:programId/modules/:moduleId/lessons/:lessonId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyLessonSchema.partial()),
  async (c) => {
    const user = c.get('user');
    const { moduleId, lessonId } = c.req.param();
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.moduleId, moduleId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Lesson', lessonId);
    }

    const [updated] = await db
      .update(lessons)
      .set({
        ...body,
        dripDate: body.dripDate ? new Date(body.dripDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, lessonId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/agencies/me/programs/:programId/modules/:moduleId/lessons/:lessonId
 * Delete a lesson from an agency program
 */
agenciesRoutes.delete(
  '/me/programs/:programId/modules/:moduleId/lessons/:lessonId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const user = c.get('user');
    const { moduleId, lessonId } = c.req.param();

    const [existing] = await db
      .select()
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.moduleId, moduleId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Lesson', lessonId);
    }

    await db.delete(lessons).where(eq(lessons.id, lessonId));

    return c.json({ data: { success: true } });
  }
);

/**
 * PUT /api/agencies/me/programs/:programId/modules/:moduleId/lessons/reorder
 * Reorder lessons in an agency program module
 */
agenciesRoutes.put(
  '/me/programs/:programId/modules/:moduleId/lessons/reorder',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyReorderSchema),
  async (c) => {
    const { moduleId } = c.req.param();
    const { items } = c.req.valid('json');

    for (const item of items) {
      await db
        .update(lessons)
        .set({ order: item.order, updatedAt: new Date() })
        .where(and(eq(lessons.id, item.id), eq(lessons.moduleId, moduleId)));
    }

    return c.json({ data: { success: true } });
  }
);

// ============================================
// AGENCY PROGRAM TASK ROUTES
// ============================================

/**
 * POST /api/agencies/me/programs/:programId/lessons/:lessonId/tasks
 * Create a task within a lesson in an agency program
 */
agenciesRoutes.post(
  '/me/programs/:programId/lessons/:lessonId/tasks',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyCreateTaskSchema),
  async (c) => {
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();
    const body = c.req.valid('json');

    // Verify lesson exists in an agency program
    const [lesson] = await db
      .select()
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(programs.id, programId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!lesson) {
      throw new NotFoundError('Lesson', lessonId);
    }

    let order = body.order;
    if (order === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${lessonTasks.order}), -1)` })
        .from(lessonTasks)
        .where(eq(lessonTasks.lessonId, lessonId));
      order = Number(maxOrder) + 1;
    }

    const [task] = await db
      .insert(lessonTasks)
      .values({
        lessonId,
        title: body.title,
        description: body.description,
        order,
        responseType: body.responseType,
        approvalRequired: body.approvalRequired,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        dueDaysOffset: body.dueDaysOffset,
        points: body.points,
        config: body.config,
        status: body.status,
      })
      .returning();

    return c.json({ data: task }, 201);
  }
);

/**
 * PATCH /api/agencies/me/programs/:programId/lessons/:lessonId/tasks/:taskId
 * Update a task in an agency program
 */
agenciesRoutes.patch(
  '/me/programs/:programId/lessons/:lessonId/tasks/:taskId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyUpdateTaskSchema),
  async (c) => {
    const user = c.get('user');
    const { programId, lessonId, taskId } = c.req.param();
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(lessonTasks)
      .innerJoin(lessons, eq(lessonTasks.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessonTasks.id, taskId),
          eq(lessonTasks.lessonId, lessonId),
          eq(programs.id, programId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Task', taskId);
    }

    const [updated] = await db
      .update(lessonTasks)
      .set({
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(lessonTasks.id, taskId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/agencies/me/programs/:programId/lessons/:lessonId/tasks/:taskId
 * Delete a task from an agency program
 */
agenciesRoutes.delete(
  '/me/programs/:programId/lessons/:lessonId/tasks/:taskId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const user = c.get('user');
    const { programId, lessonId, taskId } = c.req.param();

    const [existing] = await db
      .select()
      .from(lessonTasks)
      .innerJoin(lessons, eq(lessonTasks.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessonTasks.id, taskId),
          eq(lessonTasks.lessonId, lessonId),
          eq(programs.id, programId),
          eq(programs.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Task', taskId);
    }

    await db.delete(lessonTasks).where(eq(lessonTasks.id, taskId));

    return c.json({ data: { success: true } });
  }
);

/**
 * PUT /api/agencies/me/programs/:programId/lessons/:lessonId/tasks/reorder
 * Reorder tasks in an agency program lesson
 */
agenciesRoutes.put(
  '/me/programs/:programId/lessons/:lessonId/tasks/reorder',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', agencyReorderSchema),
  async (c) => {
    const { lessonId } = c.req.param();
    const { items } = c.req.valid('json');

    for (const item of items) {
      await db
        .update(lessonTasks)
        .set({ order: item.order, updatedAt: new Date() })
        .where(and(eq(lessonTasks.id, item.id), eq(lessonTasks.lessonId, lessonId)));
    }

    return c.json({ data: { success: true } });
  }
);
