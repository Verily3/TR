import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, sql, asc } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requirePermission } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';
import { sendMilestoneCelebration, sendProgramCompletion } from '../lib/email.js';
import { createNotification } from '../lib/notifications.js';
import { env } from '../lib/env.js';

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
  lessonTasks,
  taskProgress,
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
    const enrollmentId = c.req.param('enrollmentId')!;
    const programId = c.req.param('programId')!;

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
    const lessonId = c.req.param('lessonId')!;
    const programId = c.req.param('programId')!;
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
    const lessonId = c.req.param('lessonId')!;
    const programId = c.req.param('programId')!;
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
    const goalId = c.req.param('goalId')!;
    const programId = c.req.param('programId')!;
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
    const lessonId = c.req.param('lessonId')!;
    const programId = c.req.param('programId')!;
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
    const lessonId = c.req.param('lessonId')!;
    const programId = c.req.param('programId')!;
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
    const enrollmentId = c.req.param('enrollmentId')!;
    const programId = c.req.param('programId')!;

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
    const lessonId = c.req.param('lessonId')!;
    const programId = c.req.param('programId')!;

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
    const lessonId = c.req.param('lessonId')!;
    const programId = c.req.param('programId')!;

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
    const lessonId = c.req.param('lessonId')!;
    const programId = c.req.param('programId')!;
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

// ============================================
// TASK-LEVEL PROGRESS ROUTES
// ============================================

const completeTaskSchema = z.object({
  submissionData: z.record(z.unknown()).optional(),
});

const submitTaskSchema = z.object({
  submissionText: z.string().min(1),
  submissionData: z.record(z.unknown()).optional(),
});

const reviewTaskSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewerRole: z.enum(['mentor', 'facilitator']),
  feedback: z.string().optional(),
});

/**
 * PUT /api/tenants/:tenantId/programs/:programId/tasks/:taskId/complete
 * Mark a task as complete (no approval required)
 */
progressRoutes.put(
  '/tasks/:taskId/complete',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('json', completeTaskSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const taskId = c.req.param('taskId')!;
    const programId = c.req.param('programId')!;
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

    // Verify task exists in this program
    const [task] = await db
      .select({
        task: lessonTasks,
        lesson: lessons,
      })
      .from(lessonTasks)
      .innerJoin(lessons, eq(lessonTasks.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessonTasks.id, taskId),
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!task) {
      throw new NotFoundError('Task', taskId);
    }

    // Check if task requires approval
    if (task.task.approvalRequired !== 'none') {
      throw new BadRequestError(
        'This task requires approval. Use the submit endpoint instead.'
      );
    }

    // Upsert task progress
    const [progress] = await db
      .insert(taskProgress)
      .values({
        taskId,
        enrollmentId: enrollment.id,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        pointsEarned: task.task.points,
        submissionData,
      })
      .onConflictDoUpdate({
        target: [taskProgress.taskId, taskProgress.enrollmentId],
        set: {
          status: 'completed',
          completedAt: new Date(),
          pointsEarned: task.task.points,
          submissionData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Check if all tasks for the parent lesson are now completed
    await checkLessonTaskCompletion(task.task.lessonId, enrollment.id, task.lesson.points);

    return c.json({ data: progress });
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/tasks/:taskId/submit
 * Submit a task for approval
 */
progressRoutes.post(
  '/tasks/:taskId/submit',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  zValidator('json', submitTaskSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const taskId = c.req.param('taskId')!;
    const programId = c.req.param('programId')!;
    const { submissionText, submissionData } = c.req.valid('json');

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
      throw new ForbiddenError('You are not enrolled as a learner in this program');
    }

    // Verify task exists and requires approval
    const [task] = await db
      .select()
      .from(lessonTasks)
      .innerJoin(lessons, eq(lessonTasks.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(
        and(
          eq(lessonTasks.id, taskId),
          eq(programs.id, programId),
          eq(programs.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!task) {
      throw new NotFoundError('Task', taskId);
    }

    const approvalRequired = task.lesson_tasks.approvalRequired;
    if (!approvalRequired || approvalRequired === 'none') {
      throw new BadRequestError(
        'This task does not require approval. Use the complete endpoint instead.'
      );
    }

    // Determine which reviewer roles are needed
    const rolesToSubmit: ('mentor' | 'facilitator')[] =
      approvalRequired === 'both'
        ? ['mentor', 'facilitator']
        : [approvalRequired as 'mentor' | 'facilitator'];

    // Create approval submissions for each required role (task-level)
    const submissions = [];
    for (const role of rolesToSubmit) {
      const [submission] = await db
        .insert(approvalSubmissions)
        .values({
          lessonId: task.lesson_tasks.lessonId,
          taskId,
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
            taskId,
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

    // Mark task progress as in_progress
    await db
      .insert(taskProgress)
      .values({
        taskId,
        enrollmentId: enrollment.id,
        status: 'in_progress',
        startedAt: new Date(),
        submissionData,
      })
      .onConflictDoUpdate({
        target: [taskProgress.taskId, taskProgress.enrollmentId],
        set: {
          status: 'in_progress',
          submissionData,
          updatedAt: new Date(),
        },
      });

    // Also ensure lesson progress is at least in_progress
    await db
      .insert(lessonProgress)
      .values({
        enrollmentId: enrollment.id,
        lessonId: task.lesson_tasks.lessonId,
        status: 'in_progress',
        startedAt: new Date(),
      })
      .onConflictDoNothing();

    return c.json({ data: submissions }, 201);
  }
);

/**
 * POST /api/tenants/:tenantId/programs/:programId/tasks/:taskId/approve
 * Approve or reject a task submission
 */
progressRoutes.post(
  '/tasks/:taskId/approve',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_MANAGE, PERMISSIONS.PROGRAMS_MANAGE]),
  zValidator('json', reviewTaskSchema),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const taskId = c.req.param('taskId')!;
    const programId = c.req.param('programId')!;
    const { status, reviewerRole, feedback } = c.req.valid('json');

    const enrollmentId = c.req.query('enrollmentId');
    if (!enrollmentId) {
      throw new BadRequestError('enrollmentId query parameter is required');
    }

    // Verify reviewer has the appropriate role
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

    if (!reviewerEnrollment) {
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
          `You must be enrolled as a ${reviewerRole} or facilitator to approve`
        );
      }
    }

    // Find the approval submission for this task
    const [submission] = await db
      .select()
      .from(approvalSubmissions)
      .innerJoin(enrollments, eq(approvalSubmissions.enrollmentId, enrollments.id))
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(approvalSubmissions.taskId, taskId),
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

    // If approved, check if task is fully approved
    if (status === 'approved') {
      // Get the task to check approvalRequired
      const [task] = await db
        .select()
        .from(lessonTasks)
        .where(eq(lessonTasks.id, taskId))
        .limit(1);

      if (task) {
        let fullyApproved = true;

        if (task.approvalRequired === 'both') {
          const allSubmissions = await db
            .select()
            .from(approvalSubmissions)
            .where(
              and(
                eq(approvalSubmissions.taskId, taskId),
                eq(approvalSubmissions.enrollmentId, enrollmentId)
              )
            );
          fullyApproved = allSubmissions.every((s) => s.status === 'approved');
        }

        if (fullyApproved) {
          // Mark task as completed
          await db
            .update(taskProgress)
            .set({
              status: 'completed',
              completedAt: new Date(),
              pointsEarned: task.points,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(taskProgress.taskId, taskId),
                eq(taskProgress.enrollmentId, enrollmentId)
              )
            );

          // Check if all tasks for the parent lesson are now completed
          const [lesson] = await db
            .select()
            .from(lessons)
            .where(eq(lessons.id, task.lessonId))
            .limit(1);

          if (lesson) {
            await checkLessonTaskCompletion(task.lessonId, enrollmentId, lesson.points);
          }
        }
      }
    }

    return c.json({ data: updated });
  }
);

/**
 * GET /api/tenants/:tenantId/programs/:programId/enrollments/:enrollmentId/task-progress
 * Get all task progress for an enrollment
 */
progressRoutes.get(
  '/enrollments/:enrollmentId/task-progress',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.PROGRAMS_VIEW),
  async (c) => {
    const tenant = c.get('tenant')!;
    const user = c.get('user');
    const enrollmentId = c.req.param('enrollmentId')!;
    const programId = c.req.param('programId')!;

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

    // Check access
    const canView =
      enrollment.enrollments.userId === user.id ||
      user.permissions.includes(PERMISSIONS.MENTORING_VIEW_ALL) ||
      user.permissions.includes(PERMISSIONS.PROGRAMS_MANAGE);

    if (!canView) {
      throw new ForbiddenError('You do not have access to view this enrollment');
    }

    // Get all tasks for this program
    const allTasks = await db
      .select({
        id: lessonTasks.id,
        lessonId: lessonTasks.lessonId,
        title: lessonTasks.title,
        responseType: lessonTasks.responseType,
        approvalRequired: lessonTasks.approvalRequired,
        points: lessonTasks.points,
        order: lessonTasks.order,
      })
      .from(lessonTasks)
      .innerJoin(lessons, eq(lessonTasks.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(modules.programId, programId))
      .orderBy(asc(modules.order), asc(lessons.order), asc(lessonTasks.order));

    // Get task progress for this enrollment
    const progress = await db
      .select()
      .from(taskProgress)
      .where(eq(taskProgress.enrollmentId, enrollmentId));

    const progressMap = new Map(progress.map((p) => [p.taskId, p]));

    const tasksWithProgress = allTasks.map((task) => {
      const prog = progressMap.get(task.id);
      return {
        ...task,
        status: prog?.status || 'not_started',
        startedAt: prog?.startedAt,
        completedAt: prog?.completedAt,
        pointsEarned: prog?.pointsEarned || 0,
        submissionData: prog?.submissionData,
      };
    });

    return c.json({ data: tasksWithProgress });
  }
);

/**
 * Helper: Check if all tasks in a lesson are completed and auto-complete the lesson
 */
async function checkLessonTaskCompletion(
  lessonId: string,
  enrollmentId: string,
  lessonPoints: number
) {
  // Get all tasks for this lesson
  const allLessonTasks = await db
    .select({ id: lessonTasks.id })
    .from(lessonTasks)
    .where(eq(lessonTasks.lessonId, lessonId));

  if (allLessonTasks.length === 0) return;

  // Get completed task count
  const taskIds = allLessonTasks.map((t) => t.id);
  const [{ completedCount }] = await db
    .select({
      completedCount: sql<number>`count(*) filter (where ${taskProgress.status} = 'completed')`,
    })
    .from(taskProgress)
    .where(
      and(
        eq(taskProgress.enrollmentId, enrollmentId),
        sql`${taskProgress.taskId} IN ${taskIds}`
      )
    );

  const allCompleted = Number(completedCount) >= allLessonTasks.length;

  if (allCompleted) {
    // Auto-complete the lesson
    await db
      .insert(lessonProgress)
      .values({
        enrollmentId,
        lessonId,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        pointsEarned: lessonPoints,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
        set: {
          status: 'completed',
          completedAt: new Date(),
          pointsEarned: lessonPoints,
          updatedAt: new Date(),
        },
      });

    await updateEnrollmentProgress(enrollmentId);
  } else {
    // Ensure lesson is at least in_progress
    await db
      .insert(lessonProgress)
      .values({
        enrollmentId,
        lessonId,
        status: 'in_progress',
        startedAt: new Date(),
      })
      .onConflictDoNothing();
  }
}

// Helper function to update enrollment progress + send lifecycle emails
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

  // Fetch current enrollment to detect milestone crossings
  const [enrollment] = await db
    .select({
      id: enrollments.id,
      progress: enrollments.progress,
      completedAt: enrollments.completedAt,
      userId: enrollments.userId,
      programId: enrollments.programId,
    })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  const prevProgress = Number(enrollment?.progress ?? 0);
  const isNowComplete = percentage >= 100 && !enrollment?.completedAt;

  await db
    .update(enrollments)
    .set({
      progress: percentage,
      ...(isNowComplete ? { completedAt: new Date(), status: 'completed' } : {}),
      updatedAt: new Date(),
    })
    .where(eq(enrollments.id, enrollmentId));

  // Send lifecycle emails (fire-and-forget)
  if (enrollment) {
    const [user] = await db
      .select({ id: users.id, email: users.email, firstName: users.firstName })
      .from(users)
      .where(eq(users.id, enrollment.userId))
      .limit(1);

    const [program] = await db
      .select({ id: programs.id, name: programs.name })
      .from(programs)
      .where(eq(programs.id, enrollment.programId))
      .limit(1);

    if (user && program) {
      const programUrl = `${env.APP_URL}/programs/${program.id}`;

      // Milestone emails — fire once when crossing 25/50/75/100%
      const milestones = [25, 50, 75, 100] as const;
      for (const m of milestones) {
        if (prevProgress < m && percentage >= m) {
          await sendMilestoneCelebration({
            to: user.email,
            name: user.firstName,
            programName: program.name,
            milestone: m,
            programUrl,
          }).catch(() => {});

          await createNotification({
            userId: user.id,
            type: 'achievement',
            title: `You've reached ${m}% in ${program.name}!`,
            message: m === 100
              ? `Congratulations! You've completed ${program.name}.`
              : `Keep it up — you're ${m}% of the way through ${program.name}.`,
            actionUrl: `/programs/${program.id}`,
            actionLabel: m === 100 ? 'View Certificate' : 'Continue Learning',
            priority: m === 100 ? 'high' : 'medium',
          });
        }
      }

      // Completion email
      if (isNowComplete) {
        await sendProgramCompletion({
          to: user.email,
          name: user.firstName,
          programName: program.name,
          programUrl,
        }).catch(() => {});
      }
    }
  }
}
