import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, desc, sql, asc, or, arrayContains } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';
import type { PaginationMeta } from '@tr/shared';

const {
  programs,
  modules,
  lessons,
  enrollments,
  enrollmentMentorships,
  lessonProgress,
  goalResponses,
  approvalSubmissions,
  lessonTasks,
} = schema;

export const programsRoutes = new Hono<{ Variables: Variables }>();

// Validation schemas
const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  type: z.enum(['cohort', 'self_paced']).optional(),
});

const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  internalName: z.string().max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['cohort', 'self_paced']).default('cohort'),
  coverImage: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().max(50).optional(),
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
    })
    .passthrough()
    .optional(),
});

const updateProgramSchema = createProgramSchema.partial().extend({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  allowedTenantIds: z.array(z.string().uuid()).optional(),
});

// Event config schema
const eventConfigSchema = z.object({
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

// Module schemas
const createModuleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  parentModuleId: z.string().uuid().optional(),
  order: z.number().int().optional(),
  type: z.enum(['module', 'event']).default('module'),
  eventConfig: eventConfigSchema.optional(),
  dripType: z
    .enum(['immediate', 'days_after_enrollment', 'days_after_previous', 'on_date'])
    .default('immediate'),
  dripValue: z.number().int().optional(),
  dripDate: z.string().datetime().optional(),
});

const updateModuleSchema = createModuleSchema.partial();

// Lesson schemas
const createLessonSchema = z.object({
  title: z.string().min(1).max(255),
  contentType: z
    .enum([
      'lesson',
      'sub_module',
      'quiz',
      'assignment',
      'mentor_meeting',
      'text_form',
      'goal',
      'mentor_approval',
      'facilitator_approval',
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

const updateLessonSchema = createLessonSchema.partial();

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int(),
    })
  ),
});

// Task schemas
const taskConfigSchema = z.object({
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

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  order: z.number().int().optional(),
  responseType: z.enum(['text', 'file_upload', 'goal', 'completion_click', 'discussion']).default('completion_click'),
  approvalRequired: z.enum(['none', 'mentor', 'facilitator', 'both']).default('none'),
  dueDate: z.string().datetime().optional(),
  dueDaysOffset: z.number().int().optional(),
  points: z.number().int().default(0),
  config: taskConfigSchema.optional(),
  status: z.enum(['draft', 'active']).default('draft'),
});

const updateTaskSchema = createTaskSchema.partial();

/**
 * GET /api/tenants/:tenantId/programs
 * List programs available to a tenant
 *
 * Programs are visible if:
 * 1. Program's tenantId matches this tenant, OR
 * 2. This tenant is in program's allowedTenantIds, OR
 * 3. Program belongs to the tenant's agency and is open to all agency tenants
 */
programsRoutes.get(
  '/',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('query', listQuerySchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { page, limit, status, type } = c.req.valid('query');

    // Build access conditions for agency-owned program model
    // A tenant can see programs where:
    // - tenantId = this tenant (tenant-specific program), OR
    // - this tenant is in allowedTenantIds (multi-tenant program), OR
    // - agencyId matches and program is not restricted (tenantId is null)
    const accessConditions = [
      eq(programs.tenantId, tenant.id),
      sql`${tenant.id} = ANY(${programs.allowedTenantIds})`,
    ];

    // Only include agency-wide programs if tenant belongs to an agency
    if (tenant.agencyId) {
      accessConditions.push(
        and(
          eq(programs.agencyId, tenant.agencyId),
          isNull(programs.tenantId)
        )!
      );
    }

    const accessCondition = or(...accessConditions);

    const conditions = [accessCondition, isNull(programs.deletedAt)];

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

    // Get paginated results with enrollment count + current user's enrollment
    const user = c.get('user');
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
        agencyId: programs.agencyId,
        tenantId: programs.tenantId,
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
        myTenantEnrollmentCount: sql<number>`(
          SELECT count(*) FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."tenant_id" = ${tenant.id}
        )`,
        // Current user's enrollment data
        myEnrollmentId: sql<string | null>`(
          SELECT e."id" FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."user_id" = ${user.id}
          LIMIT 1
        )`,
        myRole: sql<string | null>`(
          SELECT e."role"::text FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."user_id" = ${user.id}
          LIMIT 1
        )`,
        myProgress: sql<number | null>`(
          SELECT e."progress" FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."user_id" = ${user.id}
          LIMIT 1
        )`,
        myPointsEarned: sql<number | null>`(
          SELECT e."points_earned" FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."user_id" = ${user.id}
          LIMIT 1
        )`,
        myEnrollmentStatus: sql<string | null>`(
          SELECT e."status"::text FROM "enrollments" e
          WHERE e."program_id" = "programs"."id"
          AND e."user_id" = ${user.id}
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
 * POST /api/tenants/:tenantId/programs
 * Create a new program (tenant-scoped)
 *
 * Note: Programs are owned by agencies. When a tenant creates a program,
 * it's created with agencyId from the tenant and tenantId set to restrict
 * access to this tenant only. Agency admins can later expand access.
 *
 * Requires: Tenant must have programs:create permission (granted by agency)
 */
programsRoutes.post(
  '/',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_CREATE),
  zValidator('json', createProgramSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    // Validate dates
    if (body.startDate && body.endDate) {
      if (new Date(body.startDate) >= new Date(body.endDate)) {
        throw new BadRequestError('End date must be after start date');
      }
    }

    // Tenant must belong to an agency
    if (!tenant.agencyId) {
      throw new ForbiddenError('Tenant must belong to an agency to create programs');
    }

    const [program] = await db
      .insert(programs)
      .values({
        // Agency owns the program
        agencyId: tenant.agencyId,
        // Restrict to this tenant only (agency can expand later)
        tenantId: tenant.id,
        allowedTenantIds: [],
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
 * GET /api/tenants/:tenantId/programs/:programId
 * Get a program with its modules and lessons
 */
programsRoutes.get(
  '/:programId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId } = c.req.param();

    // Access condition: tenant can view if they have access to the program
    const accessConditions = [
      eq(programs.tenantId, tenant.id),
      sql`${tenant.id} = ANY(${programs.allowedTenantIds})`,
    ];

    if (tenant.agencyId) {
      accessConditions.push(
        and(
          eq(programs.agencyId, tenant.agencyId),
          isNull(programs.tenantId)
        )!
      );
    }

    const accessCondition = or(...accessConditions);

    const [program] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          accessCondition,
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

    // Get tasks for all lessons in the program
    const lessonIds = moduleLessons.map((l) => l.id);
    const allTasks = lessonIds.length > 0
      ? await db
          .select()
          .from(lessonTasks)
          .where(sql`${lessonTasks.lessonId} IN ${lessonIds}`)
          .orderBy(asc(lessonTasks.order))
      : [];

    // Get enrollment stats
    const [{ learnerCount, mentorCount, facilitatorCount }] = await db
      .select({
        learnerCount: sql<number>`count(*) filter (where ${enrollments.role} = 'learner')`,
        mentorCount: sql<number>`count(*) filter (where ${enrollments.role} = 'mentor')`,
        facilitatorCount: sql<number>`count(*) filter (where ${enrollments.role} = 'facilitator')`,
      })
      .from(enrollments)
      .where(eq(enrollments.programId, programId));

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
          learnerCount: Number(learnerCount),
          mentorCount: Number(mentorCount),
          facilitatorCount: Number(facilitatorCount),
        },
      },
    });
  }
);

/**
 * PUT /api/tenants/:tenantId/programs/:programId
 * Update a program
 *
 * Note: Only programs where tenantId matches can be updated by tenant.
 * Agency-wide programs can only be updated at agency level.
 */
programsRoutes.put(
  '/:programId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', updateProgramSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId } = c.req.param();
    const body = c.req.valid('json');

    // Tenants can only update programs specifically assigned to them
    const [existing] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id),
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Program', programId);
    }

    // Validate dates if provided
    const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;
    const endDate = body.endDate ? new Date(body.endDate) : existing.endDate;
    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestError('End date must be after start date');
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
 * DELETE /api/tenants/:tenantId/programs/:programId
 * Soft delete a program
 *
 * Note: Only programs where tenantId matches can be deleted by tenant.
 * Agency-wide programs can only be deleted at agency level.
 */
programsRoutes.delete(
  '/:programId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId } = c.req.param();

    // Tenants can only delete programs specifically assigned to them
    const [existing] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id),
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

/**
 * POST /api/tenants/:tenantId/programs/:programId/publish
 * Publish a program (change status to active)
 *
 * Note: Only programs where tenantId matches can be published by tenant.
 */
programsRoutes.post(
  '/:programId/publish',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId } = c.req.param();

    // Tenants can only publish programs specifically assigned to them
    const [existing] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id),
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Program', programId);
    }

    if (existing.status === 'active') {
      throw new BadRequestError('Program is already published');
    }

    const [updated] = await db
      .update(programs)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(programs.id, programId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/duplicate
 * Duplicate a program
 *
 * Note: Can duplicate any program the tenant has access to.
 * The new program will be owned by this tenant.
 */
programsRoutes.post(
  '/:programId/duplicate',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_CREATE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { programId } = c.req.param();

    // Access condition: can duplicate any program the tenant can view
    const accessConditions = [
      eq(programs.tenantId, tenant.id),
      sql`${tenant.id} = ANY(${programs.allowedTenantIds})`,
    ];

    if (tenant.agencyId) {
      accessConditions.push(
        and(
          eq(programs.agencyId, tenant.agencyId),
          isNull(programs.tenantId)
        )!
      );
    }

    const accessCondition = or(...accessConditions);

    const [existing] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          accessCondition,
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Program', programId);
    }

    // Tenant must belong to an agency to duplicate programs
    if (!tenant.agencyId) {
      throw new ForbiddenError('Tenant must belong to an agency to duplicate programs');
    }

    // Create new program - owned by this tenant
    const [newProgram] = await db
      .insert(programs)
      .values({
        agencyId: tenant.agencyId,
        tenantId: tenant.id, // New program is tenant-specific
        allowedTenantIds: [],
        name: `${existing.name} (Copy)`,
        internalName: existing.internalName
          ? `${existing.internalName} (Copy)`
          : null,
        description: existing.description,
        type: existing.type,
        coverImage: existing.coverImage,
        timezone: existing.timezone,
        config: existing.config,
        status: 'draft',
        createdBy: user.id,
      })
      .returning();

    // Copy modules
    const originalModules = await db
      .select()
      .from(modules)
      .where(eq(modules.programId, programId))
      .orderBy(asc(modules.order));

    const moduleIdMap = new Map<string, string>();

    for (const mod of originalModules) {
      const [newModule] = await db
        .insert(modules)
        .values({
          programId: newProgram.id,
          parentModuleId: mod.parentModuleId
            ? moduleIdMap.get(mod.parentModuleId)
            : null,
          title: mod.title,
          description: mod.description,
          order: mod.order,
          depth: mod.depth,
          dripType: mod.dripType,
          dripValue: mod.dripValue,
          dripDate: mod.dripDate,
          status: 'draft',
        })
        .returning();

      moduleIdMap.set(mod.id, newModule.id);

      // Copy lessons for this module
      const moduleLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, mod.id))
        .orderBy(asc(lessons.order));

      for (const lesson of moduleLessons) {
        const [newLesson] = await db.insert(lessons).values({
          moduleId: newModule.id,
          title: lesson.title,
          contentType: lesson.contentType,
          content: lesson.content,
          order: lesson.order,
          durationMinutes: lesson.durationMinutes,
          points: lesson.points,
          dripType: lesson.dripType,
          dripValue: lesson.dripValue,
          dripDate: lesson.dripDate,
          visibleTo: lesson.visibleTo,
          approvalRequired: lesson.approvalRequired,
          status: 'draft',
        }).returning();

        // Copy tasks for this lesson
        const lessonTaskList = await db
          .select()
          .from(lessonTasks)
          .where(eq(lessonTasks.lessonId, lesson.id))
          .orderBy(asc(lessonTasks.order));

        for (const task of lessonTaskList) {
          await db.insert(lessonTasks).values({
            lessonId: newLesson.id,
            title: task.title,
            description: task.description,
            order: task.order,
            responseType: task.responseType,
            approvalRequired: task.approvalRequired,
            dueDaysOffset: task.dueDaysOffset,
            points: task.points,
            config: task.config,
            status: 'draft',
          });
        }
      }
    }

    return c.json({ data: newProgram }, 201);
  }
);

// ============================================
// MODULE ROUTES
// ============================================

/**
 * POST /api/tenants/:tenantId/programs/:programId/modules
 * Create a module
 *
 * Note: Only programs where tenantId matches can have modules created by tenant.
 */
programsRoutes.post(
  '/:programId/modules',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', createModuleSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId } = c.req.param();
    const body = c.req.valid('json');

    // Verify program exists and is owned by this tenant
    const [program] = await db
      .select()
      .from(programs)
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id),
          isNull(programs.deletedAt)
        )
      )
      .limit(1);

    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    // Get max order if not provided
    let order = body.order;
    if (order === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${modules.order}), -1)` })
        .from(modules)
        .where(eq(modules.programId, programId));
      order = Number(maxOrder) + 1;
    }

    // Determine depth
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
 * PUT /api/tenants/:tenantId/programs/:programId/modules/:moduleId
 * Update a module
 */
programsRoutes.put(
  '/:programId/modules/:moduleId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', updateModuleSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, moduleId } = c.req.param();
    const body = c.req.valid('json');

    // Verify module exists and belongs to program
    const [existing] = await db
      .select()
      .from(modules)
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(modules.id, moduleId),
          eq(modules.programId, programId),
          eq(programs.tenantId, tenant.id)
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
 * DELETE /api/tenants/:tenantId/programs/:programId/modules/:moduleId
 * Delete a module and its lessons
 */
programsRoutes.delete(
  '/:programId/modules/:moduleId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, moduleId } = c.req.param();

    // Verify module exists
    const [existing] = await db
      .select()
      .from(modules)
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(modules.id, moduleId),
          eq(modules.programId, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Module', moduleId);
    }

    // Delete module (lessons cascade due to FK)
    await db.delete(modules).where(eq(modules.id, moduleId));

    return c.json({ data: { success: true } });
  }
);

/**
 * PUT /api/tenants/:tenantId/programs/:programId/modules/reorder
 * Reorder modules
 */
programsRoutes.put(
  '/:programId/modules/reorder',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', reorderSchema),
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
// LESSON ROUTES
// ============================================

/**
 * POST /api/tenants/:tenantId/programs/:programId/modules/:moduleId/lessons
 * Create a lesson
 */
programsRoutes.post(
  '/:programId/modules/:moduleId/lessons',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', createLessonSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, moduleId } = c.req.param();
    const body = c.req.valid('json');

    // Verify module exists
    const [existing] = await db
      .select()
      .from(modules)
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(modules.id, moduleId),
          eq(modules.programId, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Module', moduleId);
    }

    // Get max order if not provided
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
 * PUT /api/tenants/:tenantId/programs/:programId/modules/:moduleId/lessons/:lessonId
 * Update a lesson
 */
programsRoutes.put(
  '/:programId/modules/:moduleId/lessons/:lessonId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', updateLessonSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, moduleId, lessonId } = c.req.param();
    const body = c.req.valid('json');

    // Verify lesson exists
    const [existing] = await db
      .select()
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.moduleId, moduleId),
          eq(programs.tenantId, tenant.id)
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
 * DELETE /api/tenants/:tenantId/programs/:programId/modules/:moduleId/lessons/:lessonId
 * Delete a lesson
 */
programsRoutes.delete(
  '/:programId/modules/:moduleId/lessons/:lessonId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, moduleId, lessonId } = c.req.param();

    // Verify lesson exists
    const [existing] = await db
      .select()
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.moduleId, moduleId),
          eq(programs.tenantId, tenant.id)
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
 * PUT /api/tenants/:tenantId/programs/:programId/modules/:moduleId/lessons/reorder
 * Reorder lessons within a module
 */
programsRoutes.put(
  '/:programId/modules/:moduleId/lessons/reorder',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', reorderSchema),
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
// TASK ROUTES (within lessons)
// ============================================

/**
 * POST /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/tasks
 * Create a task within a lesson
 */
programsRoutes.post(
  '/:programId/lessons/:lessonId/tasks',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', createTaskSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, lessonId } = c.req.param();
    const body = c.req.valid('json');

    // Verify lesson exists in program owned by this tenant
    const [lesson] = await db
      .select()
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!lesson) {
      throw new NotFoundError('Lesson', lessonId);
    }

    // Get max order if not provided
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
 * PATCH /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/tasks/:taskId
 * Update a task
 */
programsRoutes.patch(
  '/:programId/lessons/:lessonId/tasks/:taskId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', updateTaskSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, lessonId, taskId } = c.req.param();
    const body = c.req.valid('json');

    // Verify task exists in a lesson owned by this tenant
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
          eq(programs.tenantId, tenant.id)
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
 * DELETE /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/tasks/:taskId
 * Delete a task
 */
programsRoutes.delete(
  '/:programId/lessons/:lessonId/tasks/:taskId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, lessonId, taskId } = c.req.param();

    // Verify task exists
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
          eq(programs.tenantId, tenant.id)
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
 * PUT /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/tasks/reorder
 * Reorder tasks within a lesson
 */
programsRoutes.put(
  '/:programId/lessons/:lessonId/tasks/reorder',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', reorderSchema),
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
