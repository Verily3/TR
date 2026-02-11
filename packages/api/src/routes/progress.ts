import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, sql, asc } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';

const {
  programs,
  modules,
  lessons,
  enrollments,
  lessonProgress,
  goalResponses,
  goalReviews,
  approvalSubmissions,
  lessonDiscussions,
  users,
} = schema;

export const progressRoutes = new Hono<{ Variables: Variables }>();

// Validation schemas
const completeLessonSchema = z.object({
  submissionData: z.record(z.unknown()).optional(),
});

const createGoalSchema = z.object({
  statement: z.string().min(1),
  successMetrics: z.string().optional(),
  actionSteps: z.array(z.string()).optional(),
  targetDate: z.string().optional(),
  reviewFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']).default('monthly'),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(['draft', 'active', 'completed']).optional(),
});

const createGoalReviewSchema = z.object({
  reviewDate: z.string(),
  progressPercentage: z.number().min(0).max(100),
  reflectionNotes: z.string().optional(),
  nextSteps: z.string().optional(),
});

const submitApprovalSchema = z.object({
  submissionText: z.string().min(1),
});

const reviewApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewerRole: z.enum(['mentor', 'facilitator']),
  feedback: z.string().optional(),
});

const createDiscussionSchema = z.object({
  content: z.string().min(1),
});

/**
 * GET /api/tenants/:tenantId/programs/:programId/enrollments/:enrollmentId/progress
 * Get learner progress for a program
 */
progressRoutes.get(
  '/enrollments/:enrollmentId/progress',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { programId, enrollmentId } = c.req.param();

    // Verify enrollment exists
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.programId, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!enrollment) {
      throw new NotFoundError('Enrollment', enrollmentId);
    }

    // Check access - user can view their own, mentors can view assigned learners
    const canView =
      enrollment.enrollments.userId === user.id ||
      user.permissions.includes(PERMISSIONS.MENTORING_VIEW_ALL) ||
      user.permissions.includes(PERMISSIONS.PROGRAMS_MANAGE);

    if (!canView) {
      throw new ForbiddenError('You do not have access to view this enrollment');
    }

    // Get all lessons for the program
    const allLessons = await db
      .select({
        id: lessons.id,
        moduleId: lessons.moduleId,
        title: lessons.title,
        contentType: lessons.contentType,
        points: lessons.points,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(modules.programId, programId))
      .orderBy(asc(modules.order), asc(lessons.order));

    // Get progress for each lesson
    const progress = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.enrollmentId, enrollmentId));

    const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

    // Build detailed progress
    const lessonsWithProgress = allLessons.map((lesson) => {
      const prog = progressMap.get(lesson.id);
      return {
        ...lesson,
        status: prog?.status || 'not_started',
        startedAt: prog?.startedAt,
        completedAt: prog?.completedAt,
        pointsEarned: prog?.pointsEarned || 0,
      };
    });

    // Calculate totals
    const totalLessons = allLessons.length;
    const completedLessons = lessonsWithProgress.filter(
      (l) => l.status === 'completed'
    ).length;
    const totalPoints = allLessons.reduce((sum, l) => sum + l.points, 0);
    const earnedPoints = lessonsWithProgress.reduce((sum, l) => sum + l.pointsEarned, 0);

    return c.json({
      data: {
        enrollment: enrollment.enrollments,
        progress: {
          lessonsCompleted: completedLessons,
          totalLessons,
          percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          pointsEarned: earnedPoints,
          totalPoints,
        },
        lessons: lessonsWithProgress,
      },
    });
  }
);

/**
 * PUT /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/complete
 * Mark a lesson as complete
 */
progressRoutes.put(
  '/lessons/:lessonId/complete',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('json', completeLessonSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();
    const { submissionData } = c.req.valid('json');

    // Get user's enrollment
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

    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this program');
    }

    // Verify lesson exists in program
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

    // Check if lesson requires approval before completion
    if (lesson.lessons.approvalRequired && lesson.lessons.approvalRequired !== 'none') {
      throw new BadRequestError(
        'This lesson requires approval. Use the submit endpoint instead.'
      );
    }

    // Upsert progress
    const [progress] = await db
      .insert(lessonProgress)
      .values({
        enrollmentId: enrollment.id,
        lessonId,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        pointsEarned: lesson.lessons.points,
        submissionData,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
        set: {
          status: 'completed',
          completedAt: new Date(),
          pointsEarned: lesson.lessons.points,
          submissionData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Update enrollment progress
    await updateEnrollmentProgress(enrollment.id);

    return c.json({ data: progress });
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/goals
 * Create a goal response for a goal lesson
 */
progressRoutes.post(
  '/lessons/:lessonId/goals',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('json', createGoalSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();
    const body = c.req.valid('json');

    // Get user's enrollment
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(eq(enrollments.programId, programId), eq(enrollments.userId, user.id))
      )
      .limit(1);

    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this program');
    }

    // Verify lesson is a goal type
    const [lesson] = await db
      .select()
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id),
          eq(lessons.contentType, 'goal')
        )
      )
      .limit(1);

    if (!lesson) {
      throw new NotFoundError('Goal lesson', lessonId);
    }

    // Create goal response
    const [goal] = await db
      .insert(goalResponses)
      .values({
        lessonId,
        enrollmentId: enrollment.id,
        statement: body.statement,
        successMetrics: body.successMetrics,
        actionSteps: body.actionSteps || [],
        targetDate: body.targetDate,
        reviewFrequency: body.reviewFrequency,
        status: 'active',
      })
      .returning();

    // Mark lesson progress
    await db
      .insert(lessonProgress)
      .values({
        enrollmentId: enrollment.id,
        lessonId,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        pointsEarned: lesson.lessons.points,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
        set: {
          status: 'completed',
          completedAt: new Date(),
          pointsEarned: lesson.lessons.points,
          updatedAt: new Date(),
        },
      });

    await updateEnrollmentProgress(enrollment.id);

    return c.json({ data: goal }, 201);
  }
);

/**
 * PUT /api/tenants/:tenantId/programs/:programId/goals/:goalId
 * Update a goal response
 */
progressRoutes.put(
  '/goals/:goalId',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.GOALS_MANAGE),
  zValidator('json', updateGoalSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const { programId, goalId } = c.req.param();
    const body = c.req.valid('json');

    // Verify goal exists
    const [existing] = await db
      .select()
      .from(goalResponses)
      .innerJoin(lessons, eq(goalResponses.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(goalResponses.id, goalId),
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Goal', goalId);
    }

    const [updated] = await db
      .update(goalResponses)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(goalResponses.id, goalId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/goals/:goalId/reviews
 * Add a periodic review to a goal
 */
progressRoutes.post(
  '/goals/:goalId/reviews',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.GOALS_VIEW),
  zValidator('json', createGoalReviewSchema),
  async (c) => {
    const { goalId } = c.req.param();
    const body = c.req.valid('json');

    // Verify goal exists
    const [existing] = await db
      .select()
      .from(goalResponses)
      .where(eq(goalResponses.id, goalId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Goal', goalId);
    }

    const [review] = await db
      .insert(goalReviews)
      .values({
        goalResponseId: goalId,
        reviewDate: body.reviewDate,
        progressPercentage: body.progressPercentage,
        reflectionNotes: body.reflectionNotes,
        nextSteps: body.nextSteps,
      })
      .returning();

    return c.json({ data: review }, 201);
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/submit
 * Submit a lesson for approval (any lesson with approvalRequired != 'none')
 * Creates submission row(s) for each required reviewer role.
 */
progressRoutes.post(
  '/lessons/:lessonId/submit',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('json', submitApprovalSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();
    const { submissionText } = c.req.valid('json');

    // Get user's enrollment (must be a learner)
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

    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled as a learner in this program');
    }

    // Verify lesson exists and requires approval
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

    const approvalRequired = lesson.lessons.approvalRequired;
    if (!approvalRequired || approvalRequired === 'none') {
      throw new BadRequestError(
        'This lesson does not require approval. Use the complete endpoint instead.'
      );
    }

    // Determine which reviewer roles are needed
    const rolesToSubmit: ('mentor' | 'facilitator')[] =
      approvalRequired === 'both'
        ? ['mentor', 'facilitator']
        : [approvalRequired as 'mentor' | 'facilitator'];

    // Create or update submission(s) for each required role
    const submissions = [];
    for (const role of rolesToSubmit) {
      const [submission] = await db
        .insert(approvalSubmissions)
        .values({
          lessonId,
          enrollmentId: enrollment.id,
          reviewerRole: role,
          submissionText,
          status: 'pending',
        })
        .onConflictDoUpdate({
          target: [
            approvalSubmissions.lessonId,
            approvalSubmissions.enrollmentId,
            approvalSubmissions.reviewerRole,
          ],
          set: {
            submissionText,
            submittedAt: new Date(),
            status: 'pending',
            reviewedBy: null,
            reviewedAt: null,
            feedback: null,
            updatedAt: new Date(),
          },
        })
        .returning();
      submissions.push(submission);
    }

    // Mark lesson as in_progress
    await db
      .insert(lessonProgress)
      .values({
        enrollmentId: enrollment.id,
        lessonId,
        status: 'in_progress',
        startedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
        set: {
          status: 'in_progress',
          updatedAt: new Date(),
        },
      });

    return c.json({ data: submissions }, 201);
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/approve
 * Approve or reject a submission (mentor/facilitator only).
 * Body must include reviewerRole to specify which role is approving.
 * For lessons with approvalRequired='both', the lesson is only completed
 * when both the mentor and facilitator submissions are approved.
 */
progressRoutes.post(
  '/lessons/:lessonId/approve',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_MANAGE, PERMISSIONS.PROGRAMS_MANAGE]),
  zValidator('json', reviewApprovalSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();
    const { status, reviewerRole, feedback } = c.req.valid('json');

    // Get enrollment ID from query
    const enrollmentId = c.req.query('enrollmentId');
    if (!enrollmentId) {
      throw new BadRequestError('enrollmentId query parameter is required');
    }

    // Verify the reviewer has the appropriate enrollment role in this program
    const [reviewerEnrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.programId, programId),
          eq(enrollments.userId, user.id),
          eq(enrollments.role, reviewerRole)
        )
      )
      .limit(1);

    // Also allow if user is a facilitator (they can approve both roles if they have program manage permission)
    if (!reviewerEnrollment) {
      // Check if user is a facilitator in the program (facilitators can approve mentor-role submissions too)
      const [facilitatorEnrollment] = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.programId, programId),
            eq(enrollments.userId, user.id),
            eq(enrollments.role, 'facilitator')
          )
        )
        .limit(1);

      if (!facilitatorEnrollment) {
        throw new ForbiddenError(
          `You must be enrolled as a ${reviewerRole} or facilitator in this program to approve`
        );
      }
    }

    // Verify submission exists for the specified reviewer role
    const [submission] = await db
      .select()
      .from(approvalSubmissions)
      .innerJoin(enrollments, eq(approvalSubmissions.enrollmentId, enrollments.id))
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .innerJoin(lessons, eq(approvalSubmissions.lessonId, lessons.id))
      .where(
        and(
          eq(approvalSubmissions.lessonId, lessonId),
          eq(approvalSubmissions.enrollmentId, enrollmentId),
          eq(approvalSubmissions.reviewerRole, reviewerRole),
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!submission) {
      throw new NotFoundError('Submission');
    }

    // Update submission
    const [updated] = await db
      .update(approvalSubmissions)
      .set({
        status,
        feedback,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(approvalSubmissions.id, submission.approval_submissions.id))
      .returning();

    // If approved, check if the lesson is fully approved
    if (status === 'approved') {
      const approvalRequired = submission.lessons.approvalRequired;

      let fullyApproved = true;

      if (approvalRequired === 'both') {
        // For 'both', check that ALL submission rows for this lesson+enrollment are approved
        const allSubmissions = await db
          .select()
          .from(approvalSubmissions)
          .where(
            and(
              eq(approvalSubmissions.lessonId, lessonId),
              eq(approvalSubmissions.enrollmentId, enrollmentId)
            )
          );

        fullyApproved = allSubmissions.every((s) => s.status === 'approved');
      }

      if (fullyApproved) {
        // Mark lesson as complete
        await db
          .update(lessonProgress)
          .set({
            status: 'completed',
            completedAt: new Date(),
            pointsEarned: submission.lessons.points,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(lessonProgress.enrollmentId, enrollmentId),
              eq(lessonProgress.lessonId, lessonId)
            )
          );

        await updateEnrollmentProgress(enrollmentId);
      }
    }

    return c.json({ data: updated });
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/enrollments/:enrollmentId/goals
 * Get all goals linked to a program enrollment, with latest review progress
 */
progressRoutes.get(
  '/enrollments/:enrollmentId/goals',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const { programId, enrollmentId } = c.req.param();

    // Verify enrollment belongs to this tenant/program
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.programId, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!enrollment) {
      throw new NotFoundError('Enrollment', enrollmentId);
    }

    // Check access - user can view their own, or users with mentoring/manage permissions
    const canView =
      enrollment.enrollments.userId === user.id ||
      user.permissions.includes(PERMISSIONS.MENTORING_VIEW_ALL) ||
      user.permissions.includes(PERMISSIONS.PROGRAMS_MANAGE);

    if (!canView) {
      throw new ForbiddenError('You do not have access to view this enrollment');
    }

    // Subquery: latest review per goal response (most recent reviewDate)
    const latestReviewSq = db
      .select({
        goalResponseId: goalReviews.goalResponseId,
        progressPercentage: goalReviews.progressPercentage,
        rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${goalReviews.goalResponseId} ORDER BY ${goalReviews.reviewDate} DESC)`.as('row_num'),
      })
      .from(goalReviews)
      .as('latest_review');

    // Query goal responses with the latest review's progress
    const goals = await db
      .select({
        id: goalResponses.id,
        lessonId: goalResponses.lessonId,
        enrollmentId: goalResponses.enrollmentId,
        statement: goalResponses.statement,
        successMetrics: goalResponses.successMetrics,
        actionSteps: goalResponses.actionSteps,
        targetDate: goalResponses.targetDate,
        reviewFrequency: goalResponses.reviewFrequency,
        status: goalResponses.status,
        progress: latestReviewSq.progressPercentage,
        createdAt: goalResponses.createdAt,
        updatedAt: goalResponses.updatedAt,
      })
      .from(goalResponses)
      .leftJoin(
        latestReviewSq,
        and(
          eq(latestReviewSq.goalResponseId, goalResponses.id),
          eq(latestReviewSq.rowNum, 1)
        )
      )
      .where(eq(goalResponses.enrollmentId, enrollmentId));

    // Map results to ensure progress defaults to 0 when no review exists
    const data = goals.map((g) => ({
      ...g,
      progress: g.progress ?? 0,
    }));

    return c.json({ data });
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/submission
 * Get the current user's approval submission(s) for a lesson
 */
progressRoutes.get(
  '/lessons/:lessonId/submission',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();

    // Get user's enrollment
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.programId, programId),
          eq(enrollments.userId, user.id)
        )
      )
      .limit(1);

    if (!enrollment) {
      return c.json({ data: [] });
    }

    // Get submissions for this lesson + enrollment
    const submissions = await db
      .select()
      .from(approvalSubmissions)
      .where(
        and(
          eq(approvalSubmissions.lessonId, lessonId),
          eq(approvalSubmissions.enrollmentId, enrollment.id)
        )
      );

    return c.json({ data: submissions });
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/discussions
 * Get all discussion posts for a lesson (visible to all enrolled users)
 */
progressRoutes.get(
  '/lessons/:lessonId/discussions',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();

    // Verify user is enrolled in this program
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.programId, programId),
          eq(enrollments.userId, user.id)
        )
      )
      .limit(1);

    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this program');
    }

    // Get discussion posts joined with user info
    const posts = await db
      .select({
        id: lessonDiscussions.id,
        lessonId: lessonDiscussions.lessonId,
        userId: lessonDiscussions.userId,
        content: lessonDiscussions.content,
        createdAt: lessonDiscussions.createdAt,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(lessonDiscussions)
      .innerJoin(users, eq(lessonDiscussions.userId, users.id))
      .where(eq(lessonDiscussions.lessonId, lessonId))
      .orderBy(asc(lessonDiscussions.createdAt));

    return c.json({ data: posts });
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/lessons/:lessonId/discussions
 * Create a discussion post for a lesson
 */
progressRoutes.post(
  '/lessons/:lessonId/discussions',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('json', createDiscussionSchema),
  async (c) => {
    const user = c.get('user');
    const { programId, lessonId } = c.req.param();
    const { content } = c.req.valid('json');

    // Get user's enrollment
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.programId, programId),
          eq(enrollments.userId, user.id)
        )
      )
      .limit(1);

    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this program');
    }

    // Create the post
    const [post] = await db
      .insert(lessonDiscussions)
      .values({
        lessonId,
        enrollmentId: enrollment.id,
        userId: user.id,
        content,
      })
      .returning();

    // Mark lesson progress as in_progress if not started
    await db
      .insert(lessonProgress)
      .values({
        enrollmentId: enrollment.id,
        lessonId,
        status: 'in_progress',
        startedAt: new Date(),
      })
      .onConflictDoNothing();

    // Get author info for the response
    const [author] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return c.json({
      data: {
        ...post,
        authorFirstName: author?.firstName ?? null,
        authorLastName: author?.lastName ?? null,
      },
    }, 201);
  }
);

// Helper function to update enrollment progress
async function updateEnrollmentProgress(enrollmentId: string) {
  const [{ completed, total }] = await db
    .select({
      completed: sql<number>`count(*) filter (where ${lessonProgress.status} = 'completed')`,
      total: sql<number>`count(*)`,
    })
    .from(lessonProgress)
    .where(eq(lessonProgress.enrollmentId, enrollmentId));

  const percentage =
    Number(total) > 0 ? Math.round((Number(completed) / Number(total)) * 100) : 0;

  await db
    .update(enrollments)
    .set({
      progress: percentage,
      updatedAt: new Date(),
    })
    .where(eq(enrollments.id, enrollmentId));
}
