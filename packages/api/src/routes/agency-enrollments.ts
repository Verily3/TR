import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, or, isNull, sql, desc, ilike } from 'drizzle-orm';
import { hash } from 'argon2';
import { db, schema } from '@tr/db';
import { requireAgencyAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError, ConflictError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';
import type { PaginationMeta } from '@tr/shared';

const { programs, enrollments, users, tenants } = schema;

export const agencyEnrollmentsRoutes = new Hono<{ Variables: Variables }>();

// Validation schemas
const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(['learner', 'mentor', 'facilitator']).optional(),
  status: z.enum(['active', 'completed', 'dropped']).optional(),
  tenantId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
});

const createEnrollmentSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['learner', 'mentor', 'facilitator']).default('learner'),
});

const bulkEnrollSchema = z.object({
  participants: z.array(
    z.object({
      email: z.string().email(),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      role: z.enum(['learner', 'mentor', 'facilitator']).default('learner'),
      tenantId: z.string().uuid().optional(),
    })
  ).min(1).max(500),
});

/**
 * Helper: verify a program belongs to the user's agency
 */
async function verifyAgencyProgram(programId: string, agencyId: string) {
  const [program] = await db
    .select()
    .from(programs)
    .where(
      and(
        eq(programs.id, programId),
        eq(programs.agencyId, agencyId),
        isNull(programs.deletedAt)
      )
    )
    .limit(1);

  if (!program) {
    throw new NotFoundError('Program', programId);
  }
  return program;
}

/**
 * GET /api/agencies/me/programs/:programId/enrollments
 * List all enrollments for an agency program (across all tenants)
 */
agencyEnrollmentsRoutes.get(
  '/',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('query', listQuerySchema),
  async (c) => {
    const user = c.get('user');
    const programId = c.req.param('programId');
    const { page, limit, role, status, tenantId, search } = c.req.valid('query');

    await verifyAgencyProgram(programId, user.agencyId!);

    const conditions: unknown[] = [eq(enrollments.programId, programId)];

    if (role) {
      conditions.push(eq(enrollments.role, role));
    }
    if (status) {
      conditions.push(eq(enrollments.status, status));
    }
    if (tenantId) {
      conditions.push(eq(enrollments.tenantId, tenantId));
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
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id));

    if (search) {
      // Need the user join for search filtering
      const [{ count }] = await countQuery.where(and(...(conditions as any[])));
      var total = Number(count);
    } else {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .where(and(...(conditions as any[])));
      var total = Number(count);
    }

    // Get paginated results with user info + tenant name
    const results = await db
      .select({
        id: enrollments.id,
        programId: enrollments.programId,
        userId: enrollments.userId,
        tenantId: enrollments.tenantId,
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
        tenantName: tenants.name,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .leftJoin(tenants, eq(enrollments.tenantId, tenants.id))
      .where(and(...(conditions as any[])))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    return c.json({ data: results, meta: { pagination } });
  }
);

/**
 * POST /api/agencies/me/programs/:programId/enrollments
 * Enroll a single user in an agency program
 */
agencyEnrollmentsRoutes.post(
  '/',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_ENROLL),
  zValidator('json', createEnrollmentSchema),
  async (c) => {
    const user = c.get('user');
    const programId = c.req.param('programId');
    const { userId, role } = c.req.valid('json');

    const program = await verifyAgencyProgram(programId, user.agencyId!);

    // Verify user exists and belongs to this agency's scope
    const [enrollUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!enrollUser) {
      throw new NotFoundError('User', userId);
    }

    // Verify user belongs to the agency (either directly or via tenant)
    if (enrollUser.agencyId && enrollUser.agencyId !== user.agencyId) {
      throw new BadRequestError('User does not belong to this agency');
    }
    if (enrollUser.tenantId) {
      const [userTenant] = await db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.id, enrollUser.tenantId),
            eq(tenants.agencyId, user.agencyId!)
          )
        )
        .limit(1);

      if (!userTenant) {
        throw new BadRequestError('User does not belong to this agency');
      }
    }

    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.programId, programId),
          eq(enrollments.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictError('User is already enrolled in this program');
    }

    // Check capacity
    if (program.config?.maxCapacity && role === 'learner') {
      const [{ enrollmentCount }] = await db
        .select({ enrollmentCount: sql<number>`count(*)` })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.programId, programId),
            eq(enrollments.role, 'learner')
          )
        );

      if (Number(enrollmentCount) >= program.config.maxCapacity) {
        throw new BadRequestError('Program has reached maximum capacity');
      }
    }

    const [enrollment] = await db
      .insert(enrollments)
      .values({
        programId,
        userId,
        tenantId: enrollUser.tenantId || null,
        role,
      })
      .returning();

    return c.json({ data: enrollment }, 201);
  }
);

/**
 * POST /api/agencies/me/programs/:programId/enrollments/bulk
 * Bulk enroll participants (find-or-create users, then enroll)
 */
agencyEnrollmentsRoutes.post(
  '/bulk',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_ENROLL),
  zValidator('json', bulkEnrollSchema),
  async (c) => {
    const user = c.get('user');
    const programId = c.req.param('programId');
    const { participants } = c.req.valid('json');

    const program = await verifyAgencyProgram(programId, user.agencyId!);

    // Validate all tenantIds belong to this agency
    const tenantIds = [...new Set(participants.filter(p => p.tenantId).map(p => p.tenantId!))];
    if (tenantIds.length > 0) {
      const validTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(
          and(
            sql`${tenants.id} IN (${sql.join(tenantIds.map(id => sql`${id}`), sql`, `)})`,
            eq(tenants.agencyId, user.agencyId!)
          )
        );

      const validTenantIds = new Set(validTenants.map(t => t.id));
      for (const tid of tenantIds) {
        if (!validTenantIds.has(tid)) {
          throw new BadRequestError(`Tenant ${tid} does not belong to this agency`);
        }
      }
    }

    const results: {
      success: boolean;
      email: string;
      error?: string;
      userCreated?: boolean;
    }[] = [];
    let enrolled = 0;
    let created = 0;
    let errors = 0;

    // Process each participant
    for (const participant of participants) {
      try {
        // Find existing user by email within agency scope
        let [existingUser] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, participant.email),
              or(
                eq(users.agencyId, user.agencyId!),
                participant.tenantId
                  ? eq(users.tenantId, participant.tenantId)
                  : sql`FALSE`
              )
            )
          )
          .limit(1);

        // Also check users by email in any tenant of this agency
        if (!existingUser) {
          const userWithTenant = await db
            .select({ user: users })
            .from(users)
            .innerJoin(tenants, eq(users.tenantId, tenants.id))
            .where(
              and(
                eq(users.email, participant.email),
                eq(tenants.agencyId, user.agencyId!)
              )
            )
            .limit(1);

          if (userWithTenant.length > 0) {
            existingUser = userWithTenant[0].user;
          }
        }

        let enrollUserId: string;
        let enrollTenantId: string | null;
        let userCreated = false;

        if (existingUser) {
          enrollUserId = existingUser.id;
          enrollTenantId = existingUser.tenantId;
        } else {
          // Create new user
          const passwordHash = await hash('password123'); // Default password
          const [newUser] = await db
            .insert(users)
            .values({
              email: participant.email,
              firstName: participant.firstName,
              lastName: participant.lastName,
              passwordHash,
              tenantId: participant.tenantId || null,
              agencyId: participant.tenantId ? null : user.agencyId!,
              status: 'active',
            })
            .returning();

          enrollUserId = newUser.id;
          enrollTenantId = newUser.tenantId;
          userCreated = true;
          created++;
        }

        // Check if already enrolled
        const [existing] = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.programId, programId),
              eq(enrollments.userId, enrollUserId)
            )
          )
          .limit(1);

        if (existing) {
          results.push({
            success: false,
            email: participant.email,
            error: 'Already enrolled',
            userCreated,
          });
          errors++;
          continue;
        }

        await db.insert(enrollments).values({
          programId,
          userId: enrollUserId,
          tenantId: enrollTenantId,
          role: participant.role,
        });

        enrolled++;
        results.push({ success: true, email: participant.email, userCreated });
      } catch (err) {
        errors++;
        results.push({
          success: false,
          email: participant.email,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return c.json({
      data: {
        results,
        summary: { enrolled, created, errors, total: participants.length },
      },
    }, 201);
  }
);

/**
 * DELETE /api/agencies/me/programs/:programId/enrollments/:enrollmentId
 * Remove an enrollment from an agency program
 */
agencyEnrollmentsRoutes.delete(
  '/:enrollmentId',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_ENROLL),
  async (c) => {
    const user = c.get('user');
    const { programId, enrollmentId } = c.req.param();

    await verifyAgencyProgram(programId, user.agencyId!);

    // Verify enrollment exists for this program
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.programId, programId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Enrollment', enrollmentId);
    }

    await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));

    return c.json({ data: { success: true } });
  }
);
