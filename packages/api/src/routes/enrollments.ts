import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, or, isNull, sql, desc } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError, ConflictError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';
import type { PaginationMeta } from '@tr/shared';

const { programs, enrollments, enrollmentMentorships, users } = schema;

/**
 * Helper: check if a tenant has access to a program.
 * A tenant can access a program if:
 *   1. The program is directly owned by the tenant (programs.tenantId = tenant.id), OR
 *   2. The tenant is in the program's allowedTenantIds array, OR
 *   3. The program is agency-wide (tenantId is null) and belongs to the tenant's agency
 */
function programAccessCondition(tenantId: string, agencyId?: string | null) {
  const conditions = [
    eq(programs.tenantId, tenantId),
    sql`${tenantId} = ANY(${programs.allowedTenantIds})`,
  ];
  if (agencyId) {
    conditions.push(
      and(eq(programs.agencyId, agencyId), isNull(programs.tenantId))!
    );
  }
  return or(...conditions)!;
}

export const enrollmentsRoutes = new Hono<{ Variables: Variables }>();

// Validation schemas
const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(['learner', 'mentor', 'facilitator']).optional(),
  status: z.enum(['active', 'completed', 'dropped']).optional(),
});

const createEnrollmentSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['learner', 'mentor', 'facilitator']).default('learner'),
});

const updateEnrollmentSchema = z.object({
  role: z.enum(['learner', 'mentor', 'facilitator']).optional(),
  status: z.enum(['active', 'completed', 'dropped']).optional(),
});

const assignMentorSchema = z.object({
  enrollmentId: z.string().uuid(),
  mentorUserId: z.string().uuid(),
});

/**
 * GET /api/tenants/:tenantId/programs/:programId/enrollments
 * List enrollments for a program
 */
enrollmentsRoutes.get(
  '/',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('query', listQuerySchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const programId = c.req.param('programId')!;
    const { page, limit, role, status } = c.req.valid('query');

    // Verify program exists and tenant has access
    const [program] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), programAccessCondition(tenant.id, tenant.agencyId)))
      .limit(1);

    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    const conditions = [eq(enrollments.programId, programId)];

    if (role) {
      conditions.push(eq(enrollments.role, role));
    }

    if (status) {
      conditions.push(eq(enrollments.status, status));
    }

    // If user only has 'mentoring:view:assigned', filter to their assigned learners
    if (
      user.permissions.includes(PERMISSIONS.MENTORING_VIEW_ASSIGNED) &&
      !user.permissions.includes(PERMISSIONS.MENTORING_VIEW_ALL)
    ) {
      conditions.push(
        sql`(
          ${enrollments.userId} = ${user.id}
          OR ${enrollments.id} IN (
            SELECT ${enrollmentMentorships.enrollmentId}
            FROM ${enrollmentMentorships}
            WHERE ${enrollmentMentorships.mentorUserId} = ${user.id}
          )
        )`
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(and(...conditions));

    // Get paginated results with user info
    const results = await db
      .select({
        id: enrollments.id,
        programId: enrollments.programId,
        userId: enrollments.userId,
        role: enrollments.role,
        status: enrollments.status,
        progress: enrollments.progress,
        pointsEarned: enrollments.pointsEarned,
        enrolledAt: enrollments.enrolledAt,
        startedAt: enrollments.startedAt,
        completedAt: enrollments.completedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
        },
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(enrollments.enrolledAt))
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
 * POST /api/tenants/:tenantId/programs/:programId/enrollments
 * Enroll a user in a program
 */
enrollmentsRoutes.post(
  '/',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_ENROLL),
  zValidator('json', createEnrollmentSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const programId = c.req.param('programId')!;
    const { userId, role } = c.req.valid('json');

    // Verify program exists and tenant has access
    const [program] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), programAccessCondition(tenant.id, tenant.agencyId)))
      .limit(1);

    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    // Verify user exists — allow cross-tenant enrollment for multi-tenant programs
    const [enrollUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!enrollUser) {
      throw new NotFoundError('User', userId);
    }

    // For cross-tenant enrollment, verify the user's tenant also has access to this program
    if (enrollUser.tenantId && enrollUser.tenantId !== tenant.id) {
      const [userTenantAccess] = await db
        .select({ id: programs.id })
        .from(programs)
        .where(and(eq(programs.id, programId), programAccessCondition(enrollUser.tenantId)))
        .limit(1);

      if (!userTenantAccess) {
        throw new BadRequestError('User\'s organization does not have access to this program');
      }
    }

    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.programId, programId), eq(enrollments.userId, userId)))
      .limit(1);

    if (existing) {
      throw new ConflictError('User is already enrolled in this program');
    }

    // Check capacity if configured
    if (program.config?.maxCapacity) {
      const [{ enrollmentCount }] = await db
        .select({ enrollmentCount: sql<number>`count(*)` })
        .from(enrollments)
        .where(
          and(eq(enrollments.programId, programId), eq(enrollments.role, 'learner'))
        );

      if (Number(enrollmentCount) >= program.config.maxCapacity && role === 'learner') {
        throw new BadRequestError('Program has reached maximum capacity');
      }
    }

    const [enrollment] = await db
      .insert(enrollments)
      .values({
        programId,
        userId,
        tenantId: enrollUser.tenantId || tenant.id,
        role,
      })
      .returning();

    return c.json({ data: enrollment }, 201);
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/enrollments/:enrollmentId
 * Get a specific enrollment
 */
enrollmentsRoutes.get(
  '/:enrollmentId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const tenant = c.get('tenant')!;
    const enrollmentId = c.req.param('enrollmentId')!;
    const programId = c.req.param('programId')!;

    const [enrollment] = await db
      .select({
        id: enrollments.id,
        programId: enrollments.programId,
        userId: enrollments.userId,
        role: enrollments.role,
        status: enrollments.status,
        progress: enrollments.progress,
        pointsEarned: enrollments.pointsEarned,
        enrolledAt: enrollments.enrolledAt,
        startedAt: enrollments.startedAt,
        completedAt: enrollments.completedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          title: users.title,
        },
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.programId, programId),
          programAccessCondition(tenant.id, tenant.agencyId)
        )
      )
      .limit(1);

    if (!enrollment) {
      throw new NotFoundError('Enrollment', enrollmentId);
    }

    // Get mentor assignments if this is a learner
    let mentors: { id: string; email: string; firstName: string; lastName: string }[] =
      [];
    if (enrollment.role === 'learner') {
      mentors = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(enrollmentMentorships)
        .innerJoin(users, eq(enrollmentMentorships.mentorUserId, users.id))
        .where(eq(enrollmentMentorships.enrollmentId, enrollmentId));
    }

    return c.json({
      data: {
        ...enrollment,
        mentors,
      },
    });
  }
);

/**
 * PUT /api/tenants/:tenantId/programs/:programId/enrollments/:enrollmentId
 * Update an enrollment
 */
enrollmentsRoutes.put(
  '/:enrollmentId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_ENROLL),
  zValidator('json', updateEnrollmentSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const enrollmentId = c.req.param('enrollmentId')!;
    const programId = c.req.param('programId')!;
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(enrollments)
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.programId, programId),
          programAccessCondition(tenant.id, tenant.agencyId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Enrollment', enrollmentId);
    }

    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    // Set completedAt if status changed to completed
    if (body.status === 'completed' && existing.enrollments.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, enrollmentId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/tenants/:tenantId/programs/:programId/enrollments/:enrollmentId
 * Remove an enrollment
 */
enrollmentsRoutes.delete(
  '/:enrollmentId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_ENROLL),
  async (c) => {
    const tenant = c.get('tenant')!;
    const enrollmentId = c.req.param('enrollmentId')!;
    const programId = c.req.param('programId')!;

    const [existing] = await db
      .select()
      .from(enrollments)
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.programId, programId),
          programAccessCondition(tenant.id, tenant.agencyId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Enrollment', enrollmentId);
    }

    // Delete enrollment (mentorships cascade due to FK)
    await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));

    return c.json({ data: { success: true } });
  }
);

// ============================================
// MENTORSHIP ROUTES
// ============================================

/**
 * GET /api/tenants/:tenantId/programs/:programId/mentorships
 * List mentorship assignments for a program
 */
enrollmentsRoutes.get(
  '/mentorships',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const tenant = c.get('tenant')!;
    const programId = c.req.param('programId')!;

    // Verify program exists and tenant has access
    const [program] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), programAccessCondition(tenant.id, tenant.agencyId)))
      .limit(1);

    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    const mentorships = await db
      .select({
        id: enrollmentMentorships.id,
        enrollmentId: enrollmentMentorships.enrollmentId,
        mentorUserId: enrollmentMentorships.mentorUserId,
        assignedAt: enrollmentMentorships.assignedAt,
        status: enrollmentMentorships.status,
        mentor: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(enrollmentMentorships)
      .innerJoin(users, eq(enrollmentMentorships.mentorUserId, users.id))
      .where(eq(enrollmentMentorships.programId, programId));

    return c.json({ data: mentorships });
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/mentorships
 * Assign a mentor to a learner enrollment
 */
enrollmentsRoutes.post(
  '/mentorships',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.MENTORING_MANAGE),
  zValidator('json', assignMentorSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const programId = c.req.param('programId')!;
    const { enrollmentId, mentorUserId } = c.req.valid('json');

    // Verify program exists and tenant has access
    const [program] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), programAccessCondition(tenant.id, tenant.agencyId)))
      .limit(1);

    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    // Verify enrollment exists and is a learner
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.programId, programId),
          eq(enrollments.role, 'learner')
        )
      )
      .limit(1);

    if (!enrollment) {
      throw new NotFoundError('Learner enrollment', enrollmentId);
    }

    // Verify mentor exists and is enrolled as mentor
    const [mentorEnrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.programId, programId),
          eq(enrollments.userId, mentorUserId),
          eq(enrollments.role, 'mentor')
        )
      )
      .limit(1);

    if (!mentorEnrollment) {
      throw new BadRequestError('User is not enrolled as a mentor in this program');
    }

    // Check if assignment already exists
    const [existing] = await db
      .select()
      .from(enrollmentMentorships)
      .where(
        and(
          eq(enrollmentMentorships.enrollmentId, enrollmentId),
          eq(enrollmentMentorships.mentorUserId, mentorUserId)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictError('Mentor is already assigned to this learner');
    }

    const [mentorship] = await db
      .insert(enrollmentMentorships)
      .values({
        enrollmentId,
        mentorUserId,
        programId,
      })
      .returning();

    return c.json({ data: mentorship }, 201);
  }
);

/**
 * DELETE /api/tenants/:tenantId/programs/:programId/mentorships/:mentorshipId
 * Remove a mentor assignment
 */
enrollmentsRoutes.delete(
  '/mentorships/:mentorshipId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.MENTORING_MANAGE),
  async (c) => {
    const tenant = c.get('tenant')!;
    const mentorshipId = c.req.param('mentorshipId')!;
    const programId = c.req.param('programId')!;

    // Verify mentorship exists and tenant has access to the program
    const [existing] = await db
      .select()
      .from(enrollmentMentorships)
      .innerJoin(programs, eq(enrollmentMentorships.programId, programs.id))
      .where(
        and(
          eq(enrollmentMentorships.id, mentorshipId),
          eq(enrollmentMentorships.programId, programId),
          programAccessCondition(tenant.id, tenant.agencyId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Mentorship', mentorshipId);
    }

    await db
      .delete(enrollmentMentorships)
      .where(eq(enrollmentMentorships.id, mentorshipId));

    return c.json({ data: { success: true } });
  }
);
