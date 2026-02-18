import { Hono } from 'hono';
import { eq, and, or, inArray, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@tr/db';
import { requireTenantAccess, requirePermission } from '../middleware/permissions.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../types/context.js';

const {
  mentoringRelationships,
  mentoringSessions,
  mentoringSessionNotes,
  mentoringActionItems,
  enrollments,
  users,
} = schema;

export const mentoringRoutes = new Hono<{ Variables: Variables }>();

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns a WHERE clause that scopes mentoring relationships to the current user.
 * MENTORING_VIEW_ALL users (facilitator/tenant_admin) bypass the scope.
 */
async function getScopedRelationshipIds(
  user: Variables['user'],
  tenantId: string
): Promise<string[] | 'all'> {
  const canViewAll = user.permissions.includes(PERMISSIONS.MENTORING_VIEW_ALL);

  if (canViewAll) {
    // Facilitator: scope to programs they facilitate
    if (user.roleLevel === 50) {
      const facilitatorEnrollments = await db
        .select({ programId: enrollments.programId })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, user.id),
            eq(enrollments.tenantId, tenantId),
            eq(enrollments.role, 'facilitator'),
            eq(enrollments.status, 'active')
          )
        );

      if (facilitatorEnrollments.length === 0) return [];

      const programIds = facilitatorEnrollments.map((e) => e.programId);

      // Get all mentor user IDs in those programs
      const mentorEnrollments = await db
        .select({ userId: enrollments.userId })
        .from(enrollments)
        .where(
          and(
            inArray(enrollments.programId, programIds),
            eq(enrollments.role, 'mentor'),
            eq(enrollments.status, 'active')
          )
        );

      const mentorIds = [...new Set(mentorEnrollments.map((e) => e.userId))];
      if (mentorIds.length === 0) return [];

      const rels = await db
        .select({ id: mentoringRelationships.id })
        .from(mentoringRelationships)
        .where(
          and(
            eq(mentoringRelationships.tenantId, tenantId),
            inArray(mentoringRelationships.mentorId, mentorIds)
          )
        );
      return rels.map((r) => r.id);
    }

    // Tenant admin: all relationships in this tenant
    return 'all';
  }

  // Mentor/learner: only their own relationships
  const rels = await db
    .select({ id: mentoringRelationships.id })
    .from(mentoringRelationships)
    .where(
      and(
        eq(mentoringRelationships.tenantId, tenantId),
        or(
          eq(mentoringRelationships.mentorId, user.id),
          eq(mentoringRelationships.menteeId, user.id)
        )
      )
    );
  return rels.map((r) => r.id);
}

// ─── Relationships ──────────────────────────────────────────────────────────

mentoringRoutes.get(
  '/relationships',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const user = c.get('user');
    const tenantId = c.req.param('tenantId')!;

    const scopedIds = await getScopedRelationshipIds(user, tenantId);

    const whereClause =
      scopedIds === 'all'
        ? eq(mentoringRelationships.tenantId, tenantId)
        : scopedIds.length === 0
        ? sql`false`
        : and(
            eq(mentoringRelationships.tenantId, tenantId),
            inArray(mentoringRelationships.id, scopedIds)
          );

    const rows = await db
      .select({
        id: mentoringRelationships.id,
        tenantId: mentoringRelationships.tenantId,
        mentorId: mentoringRelationships.mentorId,
        menteeId: mentoringRelationships.menteeId,
        relationshipType: mentoringRelationships.relationshipType,
        status: mentoringRelationships.status,
        description: mentoringRelationships.description,
        goals: mentoringRelationships.goals,
        meetingPreferences: mentoringRelationships.meetingPreferences,
        startedAt: mentoringRelationships.startedAt,
        endedAt: mentoringRelationships.endedAt,
        mentorFirstName: sql<string>`mentor.first_name`,
        mentorLastName: sql<string>`mentor.last_name`,
        mentorAvatar: sql<string | null>`mentor.avatar`,
        menteeFirstName: sql<string>`mentee.first_name`,
        menteeLastName: sql<string>`mentee.last_name`,
        menteeAvatar: sql<string | null>`mentee.avatar`,
        menteeTitle: sql<string | null>`mentee.title`,
      })
      .from(mentoringRelationships)
      .leftJoin(
        sql`${users} AS mentor`,
        sql`mentor.id = ${mentoringRelationships.mentorId}`
      )
      .leftJoin(
        sql`${users} AS mentee`,
        sql`mentee.id = ${mentoringRelationships.menteeId}`
      )
      .where(whereClause!)
      .orderBy(desc(mentoringRelationships.startedAt));

    return c.json({ data: rows });
  }
);

mentoringRoutes.post(
  '/relationships',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.MENTORING_MANAGE),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const body = await c.req.json();
    const parsed = z.object({
      mentorId: z.string().uuid(),
      menteeId: z.string().uuid(),
      relationshipType: z.enum(['mentor', 'coach', 'manager', 'peer']).default('mentor'),
      description: z.string().optional(),
      goals: z.string().optional(),
      meetingPreferences: z.record(z.unknown()).optional(),
    }).parse(body);

    const [row] = await db
      .insert(mentoringRelationships)
      .values({ tenantId, ...parsed })
      .returning();

    return c.json({ data: row }, 201);
  }
);

mentoringRoutes.delete(
  '/relationships/:id',
  requireTenantAccess(),
  requirePermission(PERMISSIONS.MENTORING_MANAGE),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const id = c.req.param('id');

    await db
      .update(mentoringRelationships)
      .set({ status: 'ended', endedAt: new Date() })
      .where(and(eq(mentoringRelationships.id, id), eq(mentoringRelationships.tenantId, tenantId)));

    return c.json({ data: { success: true } });
  }
);

// ─── Sessions ───────────────────────────────────────────────────────────────

mentoringRoutes.get(
  '/sessions',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const user = c.get('user');
    const tenantId = c.req.param('tenantId')!;
    const relationshipId = c.req.query('relationshipId');

    const scopedIds = await getScopedRelationshipIds(user, tenantId);

    let whereClause;
    if (scopedIds === 'all') {
      whereClause = relationshipId
        ? eq(mentoringSessions.relationshipId, relationshipId)
        : undefined;
    } else if (scopedIds.length === 0) {
      return c.json({ data: [] });
    } else {
      whereClause = relationshipId
        ? and(
            inArray(mentoringSessions.relationshipId, scopedIds),
            eq(mentoringSessions.relationshipId, relationshipId)
          )
        : inArray(mentoringSessions.relationshipId, scopedIds);
    }

    const rows = await db
      .select()
      .from(mentoringSessions)
      .where(whereClause)
      .orderBy(desc(mentoringSessions.scheduledDate));

    return c.json({ data: rows });
  }
);

mentoringRoutes.post(
  '/sessions',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const body = await c.req.json();
    const parsed = z.object({
      relationshipId: z.string().uuid(),
      title: z.string(),
      sessionType: z.enum(['mentoring', 'one_on_one', 'check_in', 'review', 'planning']).default('mentoring'),
      scheduledDate: z.string(),
      scheduledTime: z.string().optional(),
      duration: z.number().int().positive().default(60),
      timezone: z.string().optional(),
      location: z.string().optional(),
      meetingLink: z.string().url().optional(),
      agenda: z.string().optional(),
    }).parse(body);

    const [row] = await db
      .insert(mentoringSessions)
      .values({ ...parsed, status: 'scheduled' })
      .returning();

    return c.json({ data: row }, 201);
  }
);

mentoringRoutes.put(
  '/sessions/:id',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = z.object({
      title: z.string().optional(),
      sessionType: z.enum(['mentoring', 'one_on_one', 'check_in', 'review', 'planning']).optional(),
      scheduledDate: z.string().optional(),
      scheduledTime: z.string().optional(),
      duration: z.number().int().positive().optional(),
      timezone: z.string().optional(),
      location: z.string().optional(),
      meetingLink: z.string().optional(),
      agenda: z.string().optional(),
      summary: z.string().optional(),
      status: z.enum(['scheduled', 'prep_in_progress', 'ready', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
    }).parse(body);

    const [row] = await db
      .update(mentoringSessions)
      .set(parsed)
      .where(eq(mentoringSessions.id, id))
      .returning();

    return c.json({ data: row });
  }
);

mentoringRoutes.delete(
  '/sessions/:id',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const id = c.req.param('id');
    await db
      .update(mentoringSessions)
      .set({ status: 'cancelled' })
      .where(eq(mentoringSessions.id, id));
    return c.json({ data: { success: true } });
  }
);

// ─── Notes ──────────────────────────────────────────────────────────────────

mentoringRoutes.get(
  '/sessions/:id/notes',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const user = c.get('user');
    const sessionId = c.req.param('id');

    const rows = await db
      .select()
      .from(mentoringSessionNotes)
      .where(
        and(
          eq(mentoringSessionNotes.sessionId, sessionId),
          or(
            eq(mentoringSessionNotes.visibility, 'shared'),
            eq(mentoringSessionNotes.authorId, user.id)
          )
        )
      )
      .orderBy(mentoringSessionNotes.createdAt);

    return c.json({ data: rows });
  }
);

mentoringRoutes.post(
  '/sessions/:id/notes',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const user = c.get('user');
    const sessionId = c.req.param('id');
    const body = await c.req.json();
    const parsed = z.object({
      content: z.string().min(1),
      visibility: z.enum(['private', 'shared']).default('private'),
    }).parse(body);

    const [row] = await db
      .insert(mentoringSessionNotes)
      .values({ sessionId, authorId: user.id, ...parsed })
      .returning();

    return c.json({ data: row }, 201);
  }
);

// ─── Action Items ────────────────────────────────────────────────────────────

mentoringRoutes.get(
  '/action-items',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const user = c.get('user');
    const tenantId = c.req.param('tenantId')!;
    const status = c.req.query('status');

    const scopedIds = await getScopedRelationshipIds(user, tenantId);
    if (Array.isArray(scopedIds) && scopedIds.length === 0) return c.json({ data: [] });

    const relClause =
      scopedIds === 'all'
        ? undefined
        : inArray(mentoringActionItems.relationshipId, scopedIds);

    const statusClause = status
      ? eq(mentoringActionItems.status, status as 'pending' | 'in_progress' | 'completed' | 'cancelled')
      : undefined;

    const rows = await db
      .select()
      .from(mentoringActionItems)
      .where(relClause && statusClause ? and(relClause, statusClause) : relClause ?? statusClause)
      .orderBy(desc(mentoringActionItems.dueDate));

    return c.json({ data: rows });
  }
);

mentoringRoutes.post(
  '/action-items',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const parsed = z.object({
      sessionId: z.string().uuid().optional(),
      relationshipId: z.string().uuid(),
      ownerId: z.string().uuid().default(user.id),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      dueDate: z.string().optional(),
    }).parse(body);

    const [row] = await db
      .insert(mentoringActionItems)
      .values({ ...parsed, status: 'pending' })
      .returning();

    return c.json({ data: row }, 201);
  }
);

mentoringRoutes.put(
  '/action-items/:id',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
      dueDate: z.string().optional(),
      completedAt: z.string().optional(),
    }).parse(body);

    const updateData: Record<string, unknown> = { ...parsed };
    if (parsed.status === 'completed' && !parsed.completedAt) {
      updateData.completedAt = new Date();
    }

    const [row] = await db
      .update(mentoringActionItems)
      .set(updateData)
      .where(eq(mentoringActionItems.id, id))
      .returning();

    return c.json({ data: row });
  }
);

// ─── Stats ───────────────────────────────────────────────────────────────────

mentoringRoutes.get(
  '/stats',
  requireTenantAccess(),
  requirePermission([PERMISSIONS.MENTORING_VIEW_ASSIGNED, PERMISSIONS.MENTORING_VIEW_ALL]),
  async (c) => {
    const user = c.get('user');
    const tenantId = c.req.param('tenantId')!;

    const scopedIds = await getScopedRelationshipIds(user, tenantId);

    const relWhere =
      scopedIds === 'all'
        ? eq(mentoringRelationships.tenantId, tenantId)
        : scopedIds.length === 0
        ? sql`false`
        : and(
            eq(mentoringRelationships.tenantId, tenantId),
            inArray(mentoringRelationships.id, scopedIds)
          );

    const [relStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${mentoringRelationships.status} = 'active')::int`,
      })
      .from(mentoringRelationships)
      .where(relWhere!);

    let sessionStats = { upcoming: 0, completed: 0 };
    let actionStats = { open: 0, overdue: 0 };

    if (scopedIds === 'all' || (Array.isArray(scopedIds) && scopedIds.length > 0)) {
      const sessionWhere =
        scopedIds === 'all'
          ? undefined
          : inArray(mentoringSessions.relationshipId, scopedIds as string[]);

      const [sStats] = await db
        .select({
          upcoming: sql<number>`count(*) filter (where ${mentoringSessions.status} in ('scheduled','prep_in_progress','ready'))::int`,
          completed: sql<number>`count(*) filter (where ${mentoringSessions.status} = 'completed')::int`,
        })
        .from(mentoringSessions)
        .where(sessionWhere);

      sessionStats = { upcoming: sStats?.upcoming ?? 0, completed: sStats?.completed ?? 0 };

      const actionWhere =
        scopedIds === 'all'
          ? undefined
          : inArray(mentoringActionItems.relationshipId, scopedIds as string[]);

      const [aStats] = await db
        .select({
          open: sql<number>`count(*) filter (where ${mentoringActionItems.status} in ('pending','in_progress'))::int`,
          overdue: sql<number>`count(*) filter (
            where ${mentoringActionItems.status} in ('pending','in_progress')
            and ${mentoringActionItems.dueDate} < now()
          )::int`,
        })
        .from(mentoringActionItems)
        .where(actionWhere);

      actionStats = { open: aStats?.open ?? 0, overdue: aStats?.overdue ?? 0 };
    }

    return c.json({
      data: {
        totalRelationships: relStats?.total ?? 0,
        activeRelationships: relStats?.active ?? 0,
        upcomingSessions: sessionStats.upcoming,
        completedSessions: sessionStats.completed,
        openActionItems: actionStats.open,
        overdueActionItems: actionStats.overdue,
      },
    });
  }
);
