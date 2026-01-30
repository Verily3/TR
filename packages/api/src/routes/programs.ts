import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import {
  db,
  eq,
  and,
  sql,
  programs,
  modules,
  lessons,
  enrollments,
  lessonProgress,
  enrollmentMentorships,
  users,
  tenantMembers,
} from "@tr/db";
import { success, paginated, noContent } from "../lib/response";
import { listQuerySchema } from "../lib/validation";
import {
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
} from "../middleware";
import type { AppVariables } from "../types";

const programsRouter = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// SCHEMAS
// ============================================================================

const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["self_paced", "cohort", "blended"]).default("self_paced"),
  thumbnailUrl: z.string().url().optional(),
  scheduleType: z.enum(["open", "scheduled", "drip"]).default("open"),
  settings: z.record(z.unknown()).optional(),
});

const updateProgramSchema = createProgramSchema.partial();

const createModuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

const createLessonSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["video", "text", "quiz", "assignment", "resource", "live_session"]),
  content: z.record(z.unknown()).optional(),
  duration: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

const enrollUserSchema = z
  .object({
    // Option A: Add existing user by ID
    userId: z.string().uuid().optional(),

    // Option B: Create new user (if userId not provided)
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    title: z.string().optional(),
    organization: z.string().optional(),
    notes: z.string().optional(),

    // Role in the program
    role: z.enum(["learner", "facilitator", "mentor"]).default("learner"),

    // Mentor/Learner assignments
    mentorEnrollmentIds: z.array(z.string().uuid()).optional(),
    learnerEnrollmentIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.userId || data.email, {
    message: "Either userId or email must be provided",
  });

// ============================================================================
// PROGRAMS CRUD
// ============================================================================

/**
 * GET /tenants/:tenantId/programs
 * List programs in tenant
 */
programsRouter.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", listQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const query = c.req.valid("query");

    const programList = await db.query.programs.findMany({
      where: eq(programs.tenantId, tenantCtx.id),
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
      orderBy: (programs, { desc }) => [desc(programs.createdAt)],
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(programs)
      .where(eq(programs.tenantId, tenantCtx.id));

    return paginated(
      c,
      programList.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        thumbnailUrl: p.thumbnailUrl,
        status: p.status,
        enrollmentCount: p.enrollmentCount,
        createdAt: p.createdAt,
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
 * POST /tenants/:tenantId/programs
 * Create a new program (admin only)
 */
programsRouter.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", createProgramSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const user = c.get("user");
    const body = c.req.valid("json");

    const [program] = await db
      .insert(programs)
      .values({
        tenantId: tenantCtx.id,
        createdById: user.id,
        ...body,
      })
      .returning();

    return success(c, program, 201);
  }
);

/**
 * GET /tenants/:tenantId/programs/:programId
 * Get program details with modules
 */
programsRouter.get(
  "/:programId",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const programId = c.req.param("programId");

    const program = await db.query.programs.findFirst({
      where: and(
        eq(programs.id, programId),
        eq(programs.tenantId, tenantCtx.id)
      ),
      with: {
        modules: {
          with: {
            lessons: true,
          },
          orderBy: (modules, { asc }) => [asc(modules.orderIndex)],
        },
      },
    });

    if (!program) {
      throw new HTTPException(404, { message: "Program not found" });
    }

    return success(c, program);
  }
);

/**
 * PATCH /tenants/:tenantId/programs/:programId
 * Update program (admin only)
 */
programsRouter.patch(
  "/:programId",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", updateProgramSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const programId = c.req.param("programId");
    const body = c.req.valid("json");

    const [updated] = await db
      .update(programs)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(eq(programs.id, programId), eq(programs.tenantId, tenantCtx.id))
      )
      .returning();

    if (!updated) {
      throw new HTTPException(404, { message: "Program not found" });
    }

    return success(c, updated);
  }
);

/**
 * DELETE /tenants/:tenantId/programs/:programId
 * Delete program (admin only)
 */
programsRouter.delete(
  "/:programId",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const programId = c.req.param("programId");

    const result = await db
      .delete(programs)
      .where(
        and(eq(programs.id, programId), eq(programs.tenantId, tenantCtx.id))
      );

    return noContent(c);
  }
);

// ============================================================================
// MODULES
// ============================================================================

/**
 * POST /tenants/:tenantId/programs/:programId/modules
 * Create a module
 */
programsRouter.post(
  "/:programId/modules",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", createModuleSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const programId = c.req.param("programId");
    const body = c.req.valid("json");

    // Verify program exists
    const program = await db.query.programs.findFirst({
      where: and(
        eq(programs.id, programId),
        eq(programs.tenantId, tenantCtx.id)
      ),
    });

    if (!program) {
      throw new HTTPException(404, { message: "Program not found" });
    }

    // Get next order index if not provided
    let orderIndex = body.orderIndex;
    if (orderIndex === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(order_index), -1)` })
        .from(modules)
        .where(eq(modules.programId, programId));
      orderIndex = Number(maxOrder) + 1;
    }

    const [module] = await db
      .insert(modules)
      .values({
        programId,
        name: body.name,
        description: body.description,
        orderIndex,
      })
      .returning();

    return success(c, module, 201);
  }
);

// ============================================================================
// LESSONS
// ============================================================================

/**
 * POST /tenants/:tenantId/programs/:programId/modules/:moduleId/lessons
 * Create a lesson
 */
programsRouter.post(
  "/:programId/modules/:moduleId/lessons",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", createLessonSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const programId = c.req.param("programId");
    const moduleId = c.req.param("moduleId");
    const body = c.req.valid("json");

    // Verify module exists and belongs to program
    const module = await db.query.modules.findFirst({
      where: eq(modules.id, moduleId),
      with: { program: true },
    });

    if (!module || module.program.tenantId !== tenantCtx.id) {
      throw new HTTPException(404, { message: "Module not found" });
    }

    // Get next order index if not provided
    let orderIndex = body.orderIndex;
    if (orderIndex === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(order_index), -1)` })
        .from(lessons)
        .where(eq(lessons.moduleId, moduleId));
      orderIndex = Number(maxOrder) + 1;
    }

    const [lesson] = await db
      .insert(lessons)
      .values({
        moduleId,
        title: body.title,
        description: body.description,
        type: body.type,
        content: body.content || {},
        duration: body.duration,
        orderIndex,
      })
      .returning();

    return success(c, lesson, 201);
  }
);

// ============================================================================
// ENROLLMENTS
// ============================================================================

/**
 * GET /tenants/:tenantId/programs/:programId/enrollments
 * List program enrollments
 */
programsRouter.get(
  "/:programId/enrollments",
  authMiddleware,
  tenantMiddleware,
  zValidator("query", listQuerySchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const programId = c.req.param("programId");
    const query = c.req.valid("query");

    const enrollmentList = await db.query.enrollments.findMany({
      where: eq(enrollments.programId, programId),
      with: {
        user: true,
      },
      limit: query.perPage,
      offset: (query.page - 1) * query.perPage,
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.programId, programId));

    return paginated(
      c,
      enrollmentList.map((e) => ({
        id: e.id,
        userId: e.userId,
        email: e.user.email,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        avatarUrl: e.user.avatarUrl,
        organization: e.user.organization,
        title: e.user.title,
        role: e.role,
        status: e.status,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
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
 * GET /tenants/:tenantId/programs/:programId/enrollments/mentors
 * List all mentors in the program
 */
programsRouter.get(
  "/:programId/enrollments/mentors",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const programId = c.req.param("programId");

    const mentors = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.programId, programId),
        eq(enrollments.role, "mentor")
      ),
      with: {
        user: true,
      },
    });

    return success(
      c,
      mentors.map((e) => ({
        id: e.id,
        enrollmentId: e.id,
        userId: e.userId,
        email: e.user.email,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        avatarUrl: e.user.avatarUrl,
      }))
    );
  }
);

/**
 * GET /tenants/:tenantId/programs/:programId/enrollments/learners
 * List all learners in the program
 */
programsRouter.get(
  "/:programId/enrollments/learners",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const programId = c.req.param("programId");

    const learners = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.programId, programId),
        eq(enrollments.role, "learner")
      ),
      with: {
        user: true,
      },
    });

    return success(
      c,
      learners.map((e) => ({
        id: e.id,
        enrollmentId: e.id,
        userId: e.userId,
        email: e.user.email,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        avatarUrl: e.user.avatarUrl,
        progress: e.progress,
      }))
    );
  }
);

/**
 * POST /tenants/:tenantId/programs/:programId/enrollments/:enrollmentId/mentorships
 * Add mentor-learner relationships for an enrollment
 */
programsRouter.post(
  "/:programId/enrollments/:enrollmentId/mentorships",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator(
    "json",
    z.object({
      mentorEnrollmentIds: z.array(z.string().uuid()).optional(),
      learnerEnrollmentIds: z.array(z.string().uuid()).optional(),
    })
  ),
  async (c) => {
    const enrollmentId = c.req.param("enrollmentId");
    const body = c.req.valid("json");

    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
    });

    if (!enrollment) {
      throw new HTTPException(404, { message: "Enrollment not found" });
    }

    const created = [];

    // If this is a learner, add mentors
    if (enrollment.role === "learner" && body.mentorEnrollmentIds?.length) {
      const mentorships = await db
        .insert(enrollmentMentorships)
        .values(
          body.mentorEnrollmentIds.map((mentorEnrollmentId) => ({
            learnerEnrollmentId: enrollmentId,
            mentorEnrollmentId,
          }))
        )
        .returning();
      created.push(...mentorships);
    }

    // If this is a mentor, add learners
    if (enrollment.role === "mentor" && body.learnerEnrollmentIds?.length) {
      const mentorships = await db
        .insert(enrollmentMentorships)
        .values(
          body.learnerEnrollmentIds.map((learnerEnrollmentId) => ({
            learnerEnrollmentId,
            mentorEnrollmentId: enrollmentId,
          }))
        )
        .returning();
      created.push(...mentorships);
    }

    return success(c, created, 201);
  }
);

/**
 * DELETE /tenants/:tenantId/programs/:programId/enrollments/:enrollmentId/mentorships/:mentorshipId
 * Remove a mentor-learner relationship
 */
programsRouter.delete(
  "/:programId/enrollments/:enrollmentId/mentorships/:mentorshipId",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  async (c) => {
    const mentorshipId = c.req.param("mentorshipId");

    await db
      .delete(enrollmentMentorships)
      .where(eq(enrollmentMentorships.id, mentorshipId));

    return noContent(c);
  }
);

/**
 * POST /tenants/:tenantId/programs/:programId/enrollments
 * Enroll a user in program (admin only)
 * Supports both existing users (by userId) and new users (by email + details)
 */
programsRouter.post(
  "/:programId/enrollments",
  authMiddleware,
  tenantMiddleware,
  requireTenantAdmin,
  zValidator("json", enrollUserSchema),
  async (c) => {
    const tenantCtx = c.get("tenant")!;
    const programId = c.req.param("programId");
    const body = c.req.valid("json");

    let userId = body.userId;

    // If no userId provided, create or find user by email
    if (!userId && body.email) {
      // Check if user exists
      let user = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (user) {
        userId = user.id;
        // Update user info if provided
        if (body.firstName || body.lastName || body.phone || body.title || body.organization || body.notes) {
          await db
            .update(users)
            .set({
              ...(body.firstName && { firstName: body.firstName }),
              ...(body.lastName && { lastName: body.lastName }),
              ...(body.phone && { phone: body.phone }),
              ...(body.title && { title: body.title }),
              ...(body.organization && { organization: body.organization }),
              ...(body.notes && { notes: body.notes }),
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));
        }
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            email: body.email,
            firstName: body.firstName || "",
            lastName: body.lastName || "",
            phone: body.phone,
            title: body.title,
            organization: body.organization,
            notes: body.notes,
          })
          .returning();
        userId = newUser.id;

        // Add user as tenant member
        await db.insert(tenantMembers).values({
          tenantId: tenantCtx.id,
          userId: newUser.id,
          role: "user",
        });
      }
    }

    if (!userId) {
      throw new HTTPException(400, {
        message: "Either userId or email must be provided",
      });
    }

    // Check if already enrolled
    const existing = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.programId, programId),
        eq(enrollments.userId, userId)
      ),
    });

    if (existing) {
      throw new HTTPException(409, {
        message: "User is already enrolled in this program",
      });
    }

    // Create enrollment
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        programId,
        userId,
        role: body.role,
        status: "active",
      })
      .returning();

    // Handle mentor/learner assignments
    if (body.role === "learner" && body.mentorEnrollmentIds?.length) {
      // Assign mentors to this learner
      await db.insert(enrollmentMentorships).values(
        body.mentorEnrollmentIds.map((mentorEnrollmentId) => ({
          learnerEnrollmentId: enrollment.id,
          mentorEnrollmentId,
        }))
      );
    }

    if (body.role === "mentor" && body.learnerEnrollmentIds?.length) {
      // Assign this mentor to learners
      await db.insert(enrollmentMentorships).values(
        body.learnerEnrollmentIds.map((learnerEnrollmentId) => ({
          learnerEnrollmentId,
          mentorEnrollmentId: enrollment.id,
        }))
      );
    }

    // Update program enrollment count
    await db
      .update(programs)
      .set({
        enrollmentCount: sql`enrollment_count + 1`,
      })
      .where(eq(programs.id, programId));

    // Return enrollment with user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return success(
      c,
      {
        ...enrollment,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      201
    );
  }
);

/**
 * POST /tenants/:tenantId/programs/:programId/lessons/:lessonId/complete
 * Mark lesson as complete (for enrolled user)
 */
programsRouter.post(
  "/:programId/lessons/:lessonId/complete",
  authMiddleware,
  tenantMiddleware,
  async (c) => {
    const user = c.get("user");
    const programId = c.req.param("programId");
    const lessonId = c.req.param("lessonId");

    // Verify enrollment
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.programId, programId),
        eq(enrollments.userId, user.id)
      ),
    });

    if (!enrollment) {
      throw new HTTPException(403, {
        message: "You are not enrolled in this program",
      });
    }

    // Update or create progress
    const [progress] = await db
      .insert(lessonProgress)
      .values({
        enrollmentId: enrollment.id,
        lessonId,
        status: "completed",
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
        set: {
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return success(c, progress);
  }
);

export { programsRouter };
