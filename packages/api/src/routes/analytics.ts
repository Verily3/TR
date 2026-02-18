import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, sql, inArray } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type { Variables } from '../types/context.js';

const {
  programs,
  enrollments,
  assessments,
  assessmentInvitations,
  users,
  individualGoals,
} = schema;

export const analyticsRoutes = new Hono<{ Variables: Variables }>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TimeRange = '7d' | '30d' | '90d' | '12m';

function getDateRange(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case '7d':  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '12m': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
}

// Generate last N month labels as "YYYY-MM" for trend arrays
function getMonthLabels(count: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return labels;
}

const querySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '12m']).default('30d'),
  tenantId: z.string().uuid().optional(),
});

// ─── GET /api/analytics ───────────────────────────────────────────────────────

analyticsRoutes.get(
  '/',
  zValidator('query', querySchema),
  async (c) => {
    const user = c.get('user');
    const { timeRange, tenantId: queryTenantId } = c.req.valid('query');
    const since = getDateRange(timeRange);

    // Determine scope
    const isAgencyUser = !!user.agencyId;
    const effectiveTenantId = isAgencyUser ? queryTenantId ?? null : (user.tenantId ?? null);

    // For agency users filtering across tenants we need the agency's tenant list
    let agencyTenantIds: string[] | null = null;
    if (isAgencyUser && !effectiveTenantId) {
      const rows = await db
        .select({ id: schema.tenants.id })
        .from(schema.tenants)
        .where(and(eq(schema.tenants.agencyId, user.agencyId!), isNull(schema.tenants.deletedAt)));
      agencyTenantIds = rows.map((r) => r.id);
    }

    // Build tenant filter conditions for each table
    function tenantEnrollmentCond() {
      if (effectiveTenantId) return eq(enrollments.tenantId, effectiveTenantId);
      if (agencyTenantIds && agencyTenantIds.length > 0) return inArray(enrollments.tenantId, agencyTenantIds);
      return sql`false`;
    }
    function tenantAssessmentCond() {
      if (effectiveTenantId) return eq(assessments.tenantId, effectiveTenantId);
      if (agencyTenantIds && agencyTenantIds.length > 0) return inArray(assessments.tenantId, agencyTenantIds);
      return sql`false`;
    }
    function tenantUserCond() {
      if (effectiveTenantId) return eq(users.tenantId, effectiveTenantId);
      if (agencyTenantIds && agencyTenantIds.length > 0) return inArray(users.tenantId, agencyTenantIds);
      return sql`false`;
    }
    function tenantGoalCond() {
      if (effectiveTenantId) return eq(individualGoals.tenantId, effectiveTenantId);
      if (agencyTenantIds && agencyTenantIds.length > 0) return inArray(individualGoals.tenantId, agencyTenantIds);
      return sql`false`;
    }
    function agencyProgramCond() {
      if (isAgencyUser) {
        const base = and(eq(programs.agencyId, user.agencyId!), isNull(programs.deletedAt));
        if (effectiveTenantId) return and(base, eq(programs.tenantId, effectiveTenantId));
        return base;
      }
      // Tenant user: programs assigned to their tenant
      if (effectiveTenantId) return and(eq(programs.tenantId, effectiveTenantId), isNull(programs.deletedAt));
      return sql`false`;
    }

    // ── Programs ──────────────────────────────────────────────────────────────

    const [programStats] = await db
      .select({
        total:     sql<number>`count(*)::int`,
        active:    sql<number>`count(*) filter (where ${programs.status} = 'active')::int`,
        draft:     sql<number>`count(*) filter (where ${programs.status} = 'draft')::int`,
        archived:  sql<number>`count(*) filter (where ${programs.status} = 'archived')::int`,
        templates: sql<number>`count(*) filter (where ${programs.isTemplate} = true)::int`,
      })
      .from(programs)
      .where(agencyProgramCond());

    // ── Enrollments ───────────────────────────────────────────────────────────

    const [enrollmentStats] = await db
      .select({
        total:          sql<number>`count(*)::int`,
        active:         sql<number>`count(*) filter (where ${enrollments.status} = 'active')::int`,
        completed:      sql<number>`count(*) filter (where ${enrollments.status} = 'completed')::int`,
        avgProgress:    sql<number>`round(avg(${enrollments.progress}))::int`,
        newInPeriod:    sql<number>`count(*) filter (where ${enrollments.enrolledAt} >= ${since.toISOString()})::int`,
        completedInPeriod: sql<number>`count(*) filter (where ${enrollments.completedAt} >= ${since.toISOString()})::int`,
      })
      .from(enrollments)
      .where(and(tenantEnrollmentCond(), eq(enrollments.role, 'learner')));

    // Top 5 programs by learner enrollment count
    const topPrograms = await db
      .select({
        id:             programs.id,
        name:           programs.name,
        enrollments:    sql<number>`count(${enrollments.id})::int`,
        completionRate: sql<number>`round(100.0 * count(${enrollments.id}) filter (where ${enrollments.status} = 'completed') / nullif(count(${enrollments.id}), 0))::int`,
      })
      .from(programs)
      .leftJoin(enrollments, and(eq(enrollments.programId, programs.id), eq(enrollments.role, 'learner')))
      .where(agencyProgramCond())
      .groupBy(programs.id, programs.name)
      .orderBy(sql`count(${enrollments.id}) desc`)
      .limit(5);

    // Enrollment trend by month (last 7 months)
    const monthLabels = getMonthLabels(7);
    const enrollmentTrendRows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${enrollments.enrolledAt}), 'YYYY-MM')`,
        value: sql<number>`count(*)::int`,
      })
      .from(enrollments)
      .where(and(
        tenantEnrollmentCond(),
        eq(enrollments.role, 'learner'),
        sql`${enrollments.enrolledAt} >= now() - interval '7 months'`
      ))
      .groupBy(sql`date_trunc('month', ${enrollments.enrolledAt})`)
      .orderBy(sql`date_trunc('month', ${enrollments.enrolledAt})`);

    const enrollmentTrendMap = Object.fromEntries(enrollmentTrendRows.map((r) => [r.month, r.value]));
    const enrollmentTrend = monthLabels.map((m) => ({ label: m.slice(0, 7), value: enrollmentTrendMap[m] ?? 0 }));

    // Completion trend by month
    const completionTrendRows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${enrollments.completedAt}), 'YYYY-MM')`,
        value: sql<number>`count(*)::int`,
      })
      .from(enrollments)
      .where(and(
        tenantEnrollmentCond(),
        eq(enrollments.role, 'learner'),
        eq(enrollments.status, 'completed'),
        sql`${enrollments.completedAt} >= now() - interval '7 months'`
      ))
      .groupBy(sql`date_trunc('month', ${enrollments.completedAt})`)
      .orderBy(sql`date_trunc('month', ${enrollments.completedAt})`);

    const completionTrendMap = Object.fromEntries(completionTrendRows.map((r) => [r.month, r.value]));
    const completionTrend = monthLabels.map((m) => ({ label: m.slice(0, 7), value: completionTrendMap[m] ?? 0 }));

    // ── Assessments ───────────────────────────────────────────────────────────

    const [assessmentStats] = await db
      .select({
        total:     sql<number>`count(*)::int`,
        active:    sql<number>`count(*) filter (where ${assessments.status} = 'open')::int`,
        completed: sql<number>`count(*) filter (where ${assessments.status} = 'completed')::int`,
        draft:     sql<number>`count(*) filter (where ${assessments.status} = 'draft')::int`,
      })
      .from(assessments)
      .where(tenantAssessmentCond());

    // Response rate for all assessments in this scope
    const assessmentIds = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(tenantAssessmentCond());

    let avgResponseRate = 0;
    if (assessmentIds.length > 0) {
      const ids = assessmentIds.map((a) => a.id);
      const [inviteStats] = await db
        .select({
          total:     sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${assessmentInvitations.status} = 'completed')::int`,
        })
        .from(assessmentInvitations)
        .where(inArray(assessmentInvitations.assessmentId, ids));

      avgResponseRate = inviteStats.total > 0
        ? Math.round((inviteStats.completed / inviteStats.total) * 100)
        : 0;
    }

    // Response rate trend by month
    const responseTrendRows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${assessments.createdAt}), 'YYYY-MM')`,
        value: sql<number>`count(*)::int`,
      })
      .from(assessments)
      .where(and(
        tenantAssessmentCond(),
        sql`${assessments.createdAt} >= now() - interval '7 months'`
      ))
      .groupBy(sql`date_trunc('month', ${assessments.createdAt})`)
      .orderBy(sql`date_trunc('month', ${assessments.createdAt})`);

    const responseTrendMap = Object.fromEntries(responseTrendRows.map((r) => [r.month, r.value]));
    const responseTrend = monthLabels.map((m) => ({ label: m.slice(0, 7), value: responseTrendMap[m] ?? 0 }));

    // ── Team / Users ──────────────────────────────────────────────────────────

    const [userStats] = await db
      .select({
        total:    sql<number>`count(*)::int`,
        active:   sql<number>`count(*) filter (where ${users.status} = 'active')::int`,
        newHires: sql<number>`count(*) filter (where ${users.createdAt} >= ${since.toISOString()})::int`,
      })
      .from(users)
      .where(and(tenantUserCond(), isNull(users.deletedAt)));

    // Department breakdown
    const departmentRows = await db
      .select({
        label: users.department,
        value: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(and(tenantUserCond(), isNull(users.deletedAt), sql`${users.department} is not null`))
      .groupBy(users.department)
      .orderBy(sql`count(*) desc`)
      .limit(8);

    // Headcount trend by month (last 7 months, cumulative at end of month)
    const headcountTrendRows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM')`,
        value: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(and(
        tenantUserCond(),
        isNull(users.deletedAt),
        sql`${users.createdAt} >= now() - interval '7 months'`
      ))
      .groupBy(sql`date_trunc('month', ${users.createdAt})`)
      .orderBy(sql`date_trunc('month', ${users.createdAt})`);

    const headcountTrendMap = Object.fromEntries(headcountTrendRows.map((r) => [r.month, r.value]));
    const headcountTrend = monthLabels.map((m) => ({ label: m.slice(0, 7), value: headcountTrendMap[m] ?? 0 }));

    // ── Goals ─────────────────────────────────────────────────────────────────

    const [goalStats] = await db
      .select({
        total:      sql<number>`count(*)::int`,
        completed:  sql<number>`count(*) filter (where ${individualGoals.status} = 'completed')::int`,
        inProgress: sql<number>`count(*) filter (where ${individualGoals.status} = 'active')::int`,
        onHold:     sql<number>`count(*) filter (where ${individualGoals.status} = 'on_hold')::int`,
        cancelled:  sql<number>`count(*) filter (where ${individualGoals.status} = 'cancelled')::int`,
        overdue:    sql<number>`count(*) filter (where ${individualGoals.targetDate} < now() and ${individualGoals.status} not in ('completed', 'cancelled'))::int`,
        avgProgress: sql<number>`round(avg(${individualGoals.progress}))::int`,
      })
      .from(individualGoals)
      .where(and(tenantGoalCond(), sql`${individualGoals.status} != 'draft'`));

    // Goals by category
    const goalCategoryRows = await db
      .select({
        label: individualGoals.category,
        value: sql<number>`count(*)::int`,
      })
      .from(individualGoals)
      .where(and(tenantGoalCond(), sql`${individualGoals.status} != 'draft'`))
      .groupBy(individualGoals.category)
      .orderBy(sql`count(*) desc`);

    // Goals created trend by month
    const goalTrendRows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${individualGoals.createdAt}), 'YYYY-MM')`,
        value: sql<number>`count(*)::int`,
      })
      .from(individualGoals)
      .where(and(
        tenantGoalCond(),
        sql`${individualGoals.createdAt} >= now() - interval '7 months'`,
        sql`${individualGoals.status} != 'draft'`
      ))
      .groupBy(sql`date_trunc('month', ${individualGoals.createdAt})`)
      .orderBy(sql`date_trunc('month', ${individualGoals.createdAt})`);

    const goalTrendMap = Object.fromEntries(goalTrendRows.map((r) => [r.month, r.value]));
    const goalsTrend = monthLabels.map((m) => ({ label: m.slice(0, 7), value: goalTrendMap[m] ?? 0 }));

    // ── Assemble response ─────────────────────────────────────────────────────

    const completionRate = enrollmentStats.total > 0
      ? Math.round((enrollmentStats.completed / enrollmentStats.total) * 100)
      : 0;

    const goalCompletionRate = goalStats.total > 0
      ? Math.round((goalStats.completed / goalStats.total) * 100)
      : 0;

    return c.json({
      data: {
        overview: {
          programs: {
            total: programStats.total,
            change: programStats.active,
            trend: programStats.active > 0 ? 'up' : 'stable',
          },
          assessments: {
            total: assessmentStats.total,
            active: assessmentStats.active,
            trend: assessmentStats.active > 0 ? 'up' : 'stable',
          },
          enrollments: {
            total: enrollmentStats.total,
            newInPeriod: enrollmentStats.newInPeriod,
            trend: enrollmentStats.newInPeriod > 0 ? 'up' : 'stable',
          },
          goals: {
            completionRate: goalCompletionRate,
            total: goalStats.total,
            trend: goalCompletionRate >= 70 ? 'up' : goalCompletionRate >= 40 ? 'stable' : 'down',
          },
        },
        programs: {
          totalPrograms: programStats.total,
          activePrograms: programStats.active,
          completedPrograms: 0,
          draftPrograms: programStats.draft,
          archivedPrograms: programStats.archived,
          totalEnrollments: enrollmentStats.total,
          activeEnrollments: enrollmentStats.active,
          completionRate,
          averageProgress: enrollmentStats.avgProgress ?? 0,
          enrollmentTrend,
          completionTrend,
          programsByStatus: [
            { label: 'Active', value: programStats.active },
            { label: 'Draft', value: programStats.draft },
            { label: 'Archived', value: programStats.archived },
          ].filter((d) => d.value > 0),
          topPrograms: topPrograms.map((p) => ({
            id: p.id,
            name: p.name,
            enrollments: p.enrollments,
            completionRate: p.completionRate ?? 0,
          })),
        },
        assessments: {
          totalAssessments: assessmentStats.total,
          activeAssessments: assessmentStats.active,
          completedAssessments: assessmentStats.completed,
          draftAssessments: assessmentStats.draft,
          averageResponseRate: avgResponseRate,
          responseRateTrend: responseTrend,
          assessmentsByStatus: [
            { label: 'Completed', value: assessmentStats.completed },
            { label: 'Active', value: assessmentStats.active },
            { label: 'Draft', value: assessmentStats.draft },
          ].filter((d) => d.value > 0),
        },
        team: {
          totalEmployees: userStats.total,
          activeEmployees: userStats.active,
          newHires: userStats.newHires,
          departmentBreakdown: departmentRows.map((r) => ({
            label: r.label ?? 'Other',
            value: r.value,
          })),
          headcountTrend,
        },
        goals: {
          totalGoals: goalStats.total,
          completedGoals: goalStats.completed,
          inProgressGoals: goalStats.inProgress,
          overdueGoals: goalStats.overdue,
          completionRate: goalCompletionRate,
          averageProgress: goalStats.avgProgress ?? 0,
          goalsByStatus: [
            { label: 'Completed', value: goalStats.completed },
            { label: 'In Progress', value: goalStats.inProgress },
            { label: 'On Hold', value: goalStats.onHold },
            { label: 'Overdue', value: goalStats.overdue },
          ].filter((d) => d.value > 0),
          goalsByCategory: goalCategoryRows.map((r) => ({
            label: r.label ? r.label.charAt(0).toUpperCase() + r.label.slice(1).replace(/_/g, ' ') : 'Other',
            value: r.value,
          })),
          goalsTrend,
        },
      },
    });
  }
);
