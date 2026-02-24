import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, desc, sql, asc, or, count, inArray } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';
import type { PaginationMeta } from '@tr/shared';
import { gradeQuizSubmission, applyManualGrades } from '../lib/quiz-engine.js';
import { sendProgramCreated } from '../lib/email.js';
import { env } from '../lib/env.js';
import { resolveFileUrl } from '../lib/storage.js';

const {
  programs,
  modules,
  lessons,
  enrollments,
  lessonTasks,
  quizAttempts,
  lessonProgress,
  goalResponses,
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
  timezone: z
    .string()
    .max(50)
    .refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid IANA timezone' }
    )
    .optional(),
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
  timezone: z
    .string()
    .refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid IANA timezone' }
    )
    .optional(),
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
    .enum(['lesson', 'quiz', 'assignment', 'text_form', 'goal', 'survey'])
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
  submissionTypes: z
    .array(z.enum(['text', 'file_upload', 'url', 'video', 'presentation', 'spreadsheet']))
    .optional(),
  maxFileSize: z.number().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  questions: z.array(z.string()).optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  order: z.number().int().optional(),
  responseType: z
    .enum(['text', 'file_upload', 'goal', 'completion_click', 'discussion'])
    .default('completion_click'),
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
        and(eq(programs.agencyId, tenant.agencyId), isNull(programs.tenantId))!
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
          AND m."type" = 'module'
        )`,
        eventCount: sql<number>`(
          SELECT count(*) FROM "modules" m
          WHERE m."program_id" = "programs"."id"
          AND m."type" = 'event'
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

    // Resolve cover image URLs
    const resolvedResults = await Promise.all(
      results.map(async (p) => ({
        ...p,
        coverImage: await resolveFileUrl(p.coverImage),
      }))
    );

    return c.json({ data: resolvedResults, meta: { pagination } });
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
        creationSource: 'wizard',
        createdBy: user.id,
      })
      .returning();

    // Notify creator
    sendProgramCreated({
      to: user.email,
      name: user.email,
      programName: program.name,
      programUrl: `${env.APP_URL}/program-builder/${program.id}`,
    }).catch(() => {});

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
        and(eq(programs.agencyId, tenant.agencyId), isNull(programs.tenantId))!
      );
    }

    const accessCondition = or(...accessConditions);

    const [program] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), accessCondition, isNull(programs.deletedAt)))
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
    const allTasks =
      lessonIds.length > 0
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

    const resolvedCoverImage = await resolveFileUrl(program.coverImage);

    return c.json({
      data: {
        ...program,
        coverImage: resolvedCoverImage,
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
 * GET /api/tenants/:tenantId/programs/:programId/stats
 * Program analytics for the Reports tab in the builder
 */
programsRoutes.get(
  '/:programId/stats',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const { programId } = c.req.param();

    // 1. Program dates
    const [program] = await db
      .select({ endDate: programs.endDate })
      .from(programs)
      .where(eq(programs.id, programId))
      .limit(1);

    // 2. Enrollment aggregates (learner role only)
    const [enrollmentAgg] = await db
      .select({
        totalEnrolled: sql<number>`count(*) filter (where ${enrollments.role} = 'learner')`,
        avgCompletion: sql<number>`coalesce(round(avg(${enrollments.progress}) filter (where ${enrollments.role} = 'learner')), 0)`,
        completedCount: sql<number>`count(*) filter (where ${enrollments.role} = 'learner' and ${enrollments.status} = 'completed')`,
      })
      .from(enrollments)
      .where(eq(enrollments.programId, programId));

    const totalEnrolled = Number(enrollmentAgg.totalEnrolled ?? 0);
    const avgCompletion = Number(enrollmentAgg.avgCompletion ?? 0);
    const completedCount = Number(enrollmentAgg.completedCount ?? 0);

    // 3. Weeks remaining
    let weeksRemaining: number | null = null;
    if (program?.endDate) {
      const msLeft = new Date(program.endDate).getTime() - Date.now();
      if (msLeft > 0) weeksRemaining = Math.ceil(msLeft / (7 * 24 * 60 * 60 * 1000));
    }

    // 4. Module performance
    const programModules = await db
      .select({ id: modules.id, title: modules.title, order: modules.order })
      .from(modules)
      .where(eq(modules.programId, programId))
      .orderBy(asc(modules.order));

    let modulePerformance: { name: string; completionPct: number }[] = [];
    if (programModules.length > 0) {
      const moduleIds = programModules.map((m) => m.id);

      // Total lessons per module
      const lessonCounts = await db
        .select({ moduleId: lessons.moduleId, lessonCount: count() })
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds))
        .groupBy(lessons.moduleId);

      // Completed lesson-progress rows per module (across all learner enrollments)
      const completionCounts = await db
        .select({
          moduleId: lessons.moduleId,
          completedCount: sql<number>`count(*)`,
        })
        .from(lessonProgress)
        .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
        .innerJoin(enrollments, eq(lessonProgress.enrollmentId, enrollments.id))
        .where(
          and(
            eq(enrollments.programId, programId),
            sql`${enrollments.role} = 'learner'`,
            sql`${lessonProgress.status} = 'completed'`,
            inArray(lessons.moduleId, moduleIds)
          )
        )
        .groupBy(lessons.moduleId);

      const lessonCountMap = Object.fromEntries(
        lessonCounts.map((r) => [r.moduleId, Number(r.lessonCount)])
      );
      const completionCountMap = Object.fromEntries(
        completionCounts.map((r) => [r.moduleId, Number(r.completedCount)])
      );

      modulePerformance = programModules.map((mod) => {
        const lessonCount = lessonCountMap[mod.id] ?? 0;
        const completed = completionCountMap[mod.id] ?? 0;
        const maxPossible = lessonCount * Math.max(totalEnrolled, 1);
        const pct = maxPossible > 0 ? Math.round((completed / maxPossible) * 100) : 0;
        return { name: mod.title, completionPct: Math.min(pct, 100) };
      });
    }

    // 5. Recent activity (last 10 lesson completions)
    const recentActivityRaw = await db
      .select({
        userName: sql<string>`${schema.users.firstName} || ' ' || ${schema.users.lastName}`,
        lessonTitle: lessons.title,
        completedAt: lessonProgress.completedAt,
      })
      .from(lessonProgress)
      .innerJoin(enrollments, eq(lessonProgress.enrollmentId, enrollments.id))
      .innerJoin(schema.users, eq(enrollments.userId, schema.users.id))
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .where(and(eq(enrollments.programId, programId), sql`${lessonProgress.status} = 'completed'`))
      .orderBy(desc(lessonProgress.completedAt))
      .limit(10);

    const recentActivity = recentActivityRaw.map((r) => ({
      userName: r.userName,
      action: `completed "${r.lessonTitle}"`,
      completedAt: r.completedAt,
    }));

    return c.json({
      data: {
        totalEnrolled,
        avgCompletion,
        completedCount,
        weeksRemaining,
        modulePerformance,
        recentActivity,
      },
    });
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/goals
 * Aggregate goal responses set by learners in this program
 */
programsRoutes.get(
  '/:programId/goals',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const { programId } = c.req.param();

    const goals = await db
      .select({
        id: goalResponses.id,
        statement: goalResponses.statement,
        status: goalResponses.status,
        targetDate: goalResponses.targetDate,
        reviewFrequency: goalResponses.reviewFrequency,
        createdAt: goalResponses.createdAt,
        learnerFirstName: schema.users.firstName,
        learnerLastName: schema.users.lastName,
        lessonTitle: lessons.title,
        latestProgress: sql<number | null>`(
          SELECT gr.progress_percentage FROM goal_reviews gr
          WHERE gr.goal_response_id = ${goalResponses.id}
          ORDER BY gr.review_date DESC LIMIT 1
        )`,
        latestReviewDate: sql<string | null>`(
          SELECT gr.review_date FROM goal_reviews gr
          WHERE gr.goal_response_id = ${goalResponses.id}
          ORDER BY gr.review_date DESC LIMIT 1
        )`,
        reviewCount: sql<number>`(
          SELECT count(*) FROM goal_reviews gr
          WHERE gr.goal_response_id = ${goalResponses.id}
        )::int`,
      })
      .from(goalResponses)
      .innerJoin(enrollments, eq(goalResponses.enrollmentId, enrollments.id))
      .innerJoin(schema.users, eq(enrollments.userId, schema.users.id))
      .innerJoin(lessons, eq(goalResponses.lessonId, lessons.id))
      .where(eq(enrollments.programId, programId))
      .orderBy(desc(goalResponses.createdAt));

    const total = goals.length;
    const active = goals.filter((g) => g.status === 'active').length;
    const completed = goals.filter((g) => g.status === 'completed').length;
    const draft = goals.filter((g) => g.status === 'draft').length;

    const progressValues = goals
      .filter((g) => g.latestProgress !== null)
      .map((g) => g.latestProgress as number);
    const avgProgress =
      progressValues.length > 0
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

    const mapped = goals.map((g) => ({
      id: g.id,
      statement: g.statement,
      status: g.status,
      targetDate: g.targetDate,
      reviewFrequency: g.reviewFrequency,
      createdAt: g.createdAt,
      lessonTitle: g.lessonTitle,
      learnerName: `${g.learnerFirstName ?? ''} ${g.learnerLastName ?? ''}`.trim(),
      learnerInitials:
        `${g.learnerFirstName?.[0] ?? ''}${g.learnerLastName?.[0] ?? ''}`.toUpperCase() || '?',
      latestProgress: g.latestProgress,
      latestReviewDate: g.latestReviewDate,
      reviewCount: g.reviewCount,
    }));

    return c.json({
      data: {
        stats: { total, active, completed, draft, avgProgress },
        goals: mapped,
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

    const now = new Date();
    await db
      .update(programs)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(programs.id, programId));

    // Cascade: hard-delete all modules (lessons/tasks cascade via FK)
    await db.delete(modules).where(eq(modules.programId, programId));

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
        and(eq(programs.agencyId, tenant.agencyId), isNull(programs.tenantId))!
      );
    }

    const accessCondition = or(...accessConditions);

    const [existing] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), accessCondition, isNull(programs.deletedAt)))
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
        internalName: existing.internalName ? `${existing.internalName} (Copy)` : null,
        description: existing.description,
        type: existing.type,
        coverImage: existing.coverImage,
        timezone: existing.timezone,
        config: existing.config,
        status: 'draft',
        creationSource: 'duplicate',
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
          parentModuleId: mod.parentModuleId ? moduleIdMap.get(mod.parentModuleId) : null,
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
        const [newLesson] = await db
          .insert(lessons)
          .values({
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
          })
          .returning();

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
 * PUT /api/tenants/:tenantId/programs/:programId/modules/reorder
 * Reorder modules
 * NOTE: Must be registered BEFORE the :moduleId wildcard route
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
 * PUT /api/tenants/:tenantId/programs/:programId/modules/:moduleId/lessons/reorder
 * Reorder lessons within a module
 * NOTE: Must be registered BEFORE the :lessonId wildcard route
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
    const { moduleId, lessonId } = c.req.param();
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
    const { moduleId, lessonId } = c.req.param();

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
        and(eq(lessons.id, lessonId), eq(programs.id, programId), eq(programs.tenantId, tenant.id))
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
 * PUT /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/tasks/reorder
 * Reorder tasks within a lesson
 * NOTE: Must be registered BEFORE the :taskId wildcard route
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

// ─── Quiz Endpoints ─────────────────────────────────────────────────────────

const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number()])),
});

const gradeQuizSchema = z.object({
  questionGrades: z
    .array(
      z.object({
        questionId: z.string(),
        pointsAwarded: z.number().min(0),
      })
    )
    .min(1),
});

/**
 * Helper: verify lesson belongs to program+tenant and return it
 */
async function getQuizLesson(tenantId: string, programId: string, lessonId: string) {
  const [row] = await db
    .select({ lesson: lessons, program: programs })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(programs, eq(modules.programId, programs.id))
    .where(
      and(
        eq(lessons.id, lessonId),
        eq(programs.id, programId),
        eq(programs.tenantId, tenantId),
        eq(lessons.contentType, 'quiz')
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * POST /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/quiz/submit
 * Submit a quiz attempt
 */
programsRoutes.post(
  '/:programId/lessons/:lessonId/quiz/submit',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('json', submitQuizSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { lessonId, programId } = c.req.param();
    const { answers } = c.req.valid('json');

    // Verify lesson is a quiz in this program
    const row = await getQuizLesson(tenant.id, programId, lessonId);
    if (!row) throw new NotFoundError('Quiz lesson', lessonId);

    // Get user's learner enrollment
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.programId, programId),
          eq(enrollments.userId, user.id),
          eq(enrollments.role, 'learner')
        )
      )
      .limit(1);
    if (!enrollment) throw new ForbiddenError('You are not enrolled in this program');

    const content = row.lesson.content ?? {};
    const maxAttempts = content.maxAttempts ?? null;
    const allowRetakes = content.allowRetakes ?? false;

    // Count existing attempts
    const [{ attemptCount }] = await db
      .select({ attemptCount: count() })
      .from(quizAttempts)
      .where(
        and(eq(quizAttempts.lessonId, lessonId), eq(quizAttempts.enrollmentId, enrollment.id))
      );

    const currentCount = Number(attemptCount);

    // Enforce retake limits
    if (maxAttempts && currentCount >= maxAttempts && !allowRetakes) {
      throw new ForbiddenError(`Maximum attempts (${maxAttempts}) reached`);
    }
    if (maxAttempts && allowRetakes && currentCount >= maxAttempts) {
      throw new ForbiddenError(`Maximum attempts (${maxAttempts}) reached`);
    }

    // Grade the submission
    const result = gradeQuizSubmission(content, answers);

    // Persist attempt
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        lessonId,
        enrollmentId: enrollment.id,
        attemptNumber: currentCount + 1,
        answers,
        score: result.score.toString(),
        pointsEarned: result.pointsEarned,
        passed: result.passed,
        breakdown: result.breakdown,
        gradingStatus: result.gradingStatus,
        completedAt: new Date(),
      })
      .returning();

    // Update lessonProgress if passed (or no passing score and auto_graded)
    if (result.passed === true) {
      await db
        .insert(lessonProgress)
        .values({
          enrollmentId: enrollment.id,
          lessonId,
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          pointsEarned: result.pointsEarned,
          submissionData: { quizAttemptId: attempt.id, score: result.score },
        })
        .onConflictDoUpdate({
          target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
          set: {
            status: 'completed',
            completedAt: new Date(),
            pointsEarned: result.pointsEarned,
            submissionData: { quizAttemptId: attempt.id, score: result.score },
            updatedAt: new Date(),
          },
        });
    }

    return c.json({
      data: {
        attempt,
        score: result.score,
        passed: result.passed,
        gradingStatus: result.gradingStatus,
        breakdown: result.breakdown,
      },
    });
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/quiz/attempts
 * Get current user's quiz attempts for this lesson
 */
programsRoutes.get(
  '/:programId/lessons/:lessonId/quiz/attempts',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { lessonId, programId } = c.req.param();

    // Verify lesson exists in program
    const row = await getQuizLesson(tenant.id, programId, lessonId);
    if (!row) throw new NotFoundError('Quiz lesson', lessonId);

    // Get user's enrollment
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.programId, programId), eq(enrollments.userId, user.id)))
      .limit(1);

    if (!enrollment) return c.json({ data: [] });

    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.lessonId, lessonId), eq(quizAttempts.enrollmentId, enrollment.id)))
      .orderBy(desc(quizAttempts.attemptNumber));

    return c.json({ data: attempts });
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/quiz/stats
 * Get aggregate quiz stats (facilitators/admins only)
 */
programsRoutes.get(
  '/:programId/lessons/:lessonId/quiz/stats',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { lessonId, programId } = c.req.param();

    const row = await getQuizLesson(tenant.id, programId, lessonId);
    if (!row) throw new NotFoundError('Quiz lesson', lessonId);

    // Get all attempts for this lesson (latest per enrollment)
    const allAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.lessonId, lessonId))
      .orderBy(desc(quizAttempts.attemptNumber));

    // Keep only latest attempt per enrollment
    const latestByEnrollment = new Map<string, (typeof allAttempts)[0]>();
    for (const a of allAttempts) {
      if (!latestByEnrollment.has(a.enrollmentId)) {
        latestByEnrollment.set(a.enrollmentId, a);
      }
    }
    const latest = Array.from(latestByEnrollment.values());

    const totalAttempts = latest.length;
    const passed = latest.filter((a) => a.passed === true).length;
    const scores = latest.filter((a) => a.score !== null).map((a) => Number(a.score));
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;

    return c.json({
      data: {
        totalAttempts,
        passRate: totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0,
        avgScore,
        pendingGrade: latest.filter((a) => a.gradingStatus === 'pending_grade').length,
      },
    });
  }
);

/**
 * PUT /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/quiz/attempts/:attemptId/grade
 * Manually grade short-answer questions in an attempt
 */
programsRoutes.put(
  '/:programId/lessons/:lessonId/quiz/attempts/:attemptId/grade',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_MANAGE),
  zValidator('json', gradeQuizSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { lessonId, programId, attemptId } = c.req.param();
    const { questionGrades } = c.req.valid('json');

    const row = await getQuizLesson(tenant.id, programId, lessonId);
    if (!row) throw new NotFoundError('Quiz lesson', lessonId);

    // Load attempt
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.lessonId, lessonId)))
      .limit(1);
    if (!attempt) throw new NotFoundError('Quiz attempt', attemptId);

    if (attempt.gradingStatus === 'auto_graded') {
      throw new BadRequestError('This attempt has no manually graded questions');
    }

    const content = row.lesson.content ?? {};
    const passingScore = content.passingScore ?? null;
    const existingBreakdown = (attempt.breakdown ??
      []) as import('../lib/quiz-engine.js').QuizBreakdownItem[];

    const updated = applyManualGrades(existingBreakdown, questionGrades, passingScore);

    const [graded] = await db
      .update(quizAttempts)
      .set({
        score: updated.score.toString(),
        pointsEarned: updated.pointsEarned,
        passed: updated.passed,
        breakdown: updated.breakdown,
        gradingStatus: 'graded',
        gradedBy: user.id,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quizAttempts.id, attemptId))
      .returning();

    // Update lessonProgress if now passed
    if (updated.passed) {
      await db
        .insert(lessonProgress)
        .values({
          enrollmentId: attempt.enrollmentId,
          lessonId,
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          pointsEarned: updated.pointsEarned,
          submissionData: { quizAttemptId: attemptId, score: updated.score },
        })
        .onConflictDoUpdate({
          target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
          set: {
            status: 'completed',
            completedAt: new Date(),
            pointsEarned: updated.pointsEarned,
            submissionData: { quizAttemptId: attemptId, score: updated.score },
            updatedAt: new Date(),
          },
        });
    }

    return c.json({ data: graded });
  }
);
