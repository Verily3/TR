import { Hono } from 'hono';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess } from '../middleware/permissions.js';
import type { Variables } from '../types/context.js';

const {
  programs,
  modules,
  lessons,
  enrollments,
  lessonProgress,
  goalResponses,
  approvalSubmissions,
  lessonDiscussions,
  users,
} = schema;

export const dashboardRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET /api/tenants/:tenantId/dashboard/learner
 * Aggregated dashboard data for the logged-in learner
 */
dashboardRoutes.get(
  '/learner',
  requireTenantAccess(),
  async (c) => {
    const user = c.get('user');

    // 1. Get user's active enrollments
    const userEnrollments = await db
      .select({
        id: enrollments.id,
        programId: enrollments.programId,
        role: enrollments.role,
        status: enrollments.status,
        progress: enrollments.progress,
        pointsEarned: enrollments.pointsEarned,
        enrolledAt: enrollments.enrolledAt,
        programName: programs.name,
        programDescription: programs.description,
        programStatus: programs.status,
        programStartDate: programs.startDate,
        programEndDate: programs.endDate,
        programCoverImage: programs.coverImage,
      })
      .from(enrollments)
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.userId, user.id),
          eq(enrollments.status, 'active')
        )
      )
      .orderBy(desc(enrollments.enrolledAt));

    if (userEnrollments.length === 0) {
      return c.json({
        data: {
          enrollments: [],
          programModules: [],
          recentDiscussions: [],
          upcomingItems: [],
          activeGoals: [],
          pendingApprovals: [],
          summary: {
            enrolledPrograms: 0,
            overallProgress: 0,
            totalPoints: 0,
            lessonsCompleted: 0,
            totalLessons: 0,
          },
        },
      });
    }

    const enrollmentIds = userEnrollments.map((e) => e.id);
    const programIds = userEnrollments.map((e) => e.programId);

    // 2. Get modules and lessons for the primary program (first active enrollment)
    const primaryEnrollment = userEnrollments[0];
    const programModules = await db
      .select({
        id: modules.id,
        programId: modules.programId,
        title: modules.title,
        order: modules.order,
        depth: modules.depth,
      })
      .from(modules)
      .where(
        and(
          eq(modules.programId, primaryEnrollment.programId),
          eq(modules.depth, 0)
        )
      )
      .orderBy(modules.order);

    // Get lesson counts and completion per module
    const moduleLessonStats = await db
      .select({
        moduleId: lessons.moduleId,
        totalLessons: sql<number>`count(*)::int`,
        completedLessons: sql<number>`count(*) filter (
          where ${lessonProgress.status} = 'completed'
        )::int`,
      })
      .from(lessons)
      .leftJoin(
        lessonProgress,
        and(
          eq(lessonProgress.lessonId, lessons.id),
          eq(lessonProgress.enrollmentId, primaryEnrollment.id)
        )
      )
      .where(
        inArray(
          lessons.moduleId,
          programModules.map((m) => m.id)
        )
      )
      .groupBy(lessons.moduleId);

    const moduleStatsMap = new Map(
      moduleLessonStats.map((s) => [s.moduleId, s])
    );

    const enrichedModules = programModules.map((m) => {
      const stats = moduleStatsMap.get(m.id);
      const total = stats?.totalLessons ?? 0;
      const completed = stats?.completedLessons ?? 0;
      return {
        ...m,
        totalLessons: total,
        completedLessons: completed,
        status:
          completed === total && total > 0
            ? ('completed' as const)
            : completed > 0
            ? ('in-progress' as const)
            : ('not-started' as const),
      };
    });

    // 3. Recent discussions across all enrolled programs (last 10)
    const recentDiscussions = await db
      .select({
        id: lessonDiscussions.id,
        lessonId: lessonDiscussions.lessonId,
        userId: lessonDiscussions.userId,
        content: lessonDiscussions.content,
        createdAt: lessonDiscussions.createdAt,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorAvatar: users.avatar,
        lessonTitle: lessons.title,
        lessonContentType: lessons.contentType,
        programId: sql<string>`${modules.programId}`,
        programName: programs.name,
      })
      .from(lessonDiscussions)
      .innerJoin(users, eq(lessonDiscussions.userId, users.id))
      .innerJoin(lessons, eq(lessonDiscussions.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(inArray(modules.programId, programIds))
      .orderBy(desc(lessonDiscussions.createdAt))
      .limit(10);

    // 4. Upcoming items: incomplete lessons of actionable types
    const upcomingItems = await db
      .select({
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        contentType: lessons.contentType,
        points: lessons.points,
        durationMinutes: lessons.durationMinutes,
        moduleTitle: modules.title,
        moduleOrder: modules.order,
        lessonOrder: lessons.order,
        programId: modules.programId,
        programName: programs.name,
        progressStatus: lessonProgress.status,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .innerJoin(
        enrollments,
        and(
          eq(enrollments.programId, modules.programId),
          eq(enrollments.userId, user.id),
          eq(enrollments.status, 'active')
        )
      )
      .leftJoin(
        lessonProgress,
        and(
          eq(lessonProgress.lessonId, lessons.id),
          eq(lessonProgress.enrollmentId, enrollments.id)
        )
      )
      .where(
        and(
          inArray(modules.programId, programIds),
          inArray(lessons.contentType, [
            'assignment',
            'goal',
            'text_form',
          ]),
          sql`(${lessonProgress.status} IS NULL OR ${lessonProgress.status} != 'completed')`
        )
      )
      .orderBy(modules.order, lessons.order)
      .limit(10);

    // 5. Active goals with latest review info
    const activeGoals = await db
      .select({
        id: goalResponses.id,
        statement: goalResponses.statement,
        successMetrics: goalResponses.successMetrics,
        targetDate: goalResponses.targetDate,
        reviewFrequency: goalResponses.reviewFrequency,
        status: goalResponses.status,
        createdAt: goalResponses.createdAt,
        lessonTitle: lessons.title,
        programName: programs.name,
        latestReviewDate: sql<string | null>`(
          SELECT gr.review_date FROM goal_reviews gr
          WHERE gr.goal_response_id = ${goalResponses.id}
          ORDER BY gr.review_date DESC LIMIT 1
        )`,
        latestProgress: sql<number | null>`(
          SELECT gr.progress_percentage FROM goal_reviews gr
          WHERE gr.goal_response_id = ${goalResponses.id}
          ORDER BY gr.review_date DESC LIMIT 1
        )`,
      })
      .from(goalResponses)
      .innerJoin(
        enrollments,
        and(
          eq(goalResponses.enrollmentId, enrollments.id),
          eq(enrollments.userId, user.id)
        )
      )
      .innerJoin(lessons, eq(goalResponses.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(eq(goalResponses.status, 'active'))
      .orderBy(goalResponses.createdAt);

    // 6. Pending approval submissions
    const pendingApprovals = await db
      .select({
        id: approvalSubmissions.id,
        lessonId: approvalSubmissions.lessonId,
        submissionText: approvalSubmissions.submissionText,
        submittedAt: approvalSubmissions.submittedAt,
        reviewerRole: approvalSubmissions.reviewerRole,
        status: approvalSubmissions.status,
        lessonTitle: lessons.title,
        programName: programs.name,
        programId: modules.programId,
      })
      .from(approvalSubmissions)
      .innerJoin(
        enrollments,
        and(
          eq(approvalSubmissions.enrollmentId, enrollments.id),
          eq(enrollments.userId, user.id)
        )
      )
      .innerJoin(lessons, eq(approvalSubmissions.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(programs, eq(modules.programId, programs.id))
      .where(eq(approvalSubmissions.status, 'pending'))
      .orderBy(desc(approvalSubmissions.submittedAt));

    // 7. Summary stats
    const totalPoints = userEnrollments.reduce(
      (sum, e) => sum + (e.pointsEarned || 0),
      0
    );
    const avgProgress =
      userEnrollments.length > 0
        ? Math.round(
            userEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) /
              userEnrollments.length
          )
        : 0;

    // Get total lesson counts across all enrollments
    const [lessonCounts] = await db
      .select({
        completed: sql<number>`count(*) filter (where ${lessonProgress.status} = 'completed')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(lessonProgress)
      .where(inArray(lessonProgress.enrollmentId, enrollmentIds));

    return c.json({
      data: {
        enrollments: userEnrollments,
        programModules: enrichedModules,
        recentDiscussions,
        upcomingItems,
        activeGoals,
        pendingApprovals,
        summary: {
          enrolledPrograms: userEnrollments.length,
          overallProgress: avgProgress,
          totalPoints,
          lessonsCompleted: lessonCounts?.completed ?? 0,
          totalLessons: lessonCounts?.total ?? 0,
        },
      },
    });
  }
);
