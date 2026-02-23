import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess } from '../middleware/permissions.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';
import type { Variables } from '../types/context.js';

const { individualGoals, strategicPlans, strategicGoalLinks } = schema;

export const planningRoutes = new Hono<{ Variables: Variables }>();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const goalListQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'completed', 'on_hold', 'cancelled']).optional(),
  category: z
    .enum(['professional', 'personal', 'leadership', 'strategic', 'performance', 'development'])
    .optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const createGoalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  successMetrics: z.string().optional(),
  actionSteps: z.array(z.string()).default([]),
  category: z
    .enum(['professional', 'personal', 'leadership', 'strategic', 'performance', 'development'])
    .default('professional'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  reviewFrequency: z.string().default('monthly'),
  parentGoalId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  strategicPlanId: z.string().uuid().optional(),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['draft', 'active', 'completed', 'on_hold', 'cancelled']).optional(),
});

const planListQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  planType: z.enum(['3hag', 'bhag', 'annual', 'quarterly']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const createPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  planType: z.enum(['3hag', 'bhag', 'annual', 'quarterly']),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  config: z.record(z.unknown()).default({}),
  parentPlanId: z.string().uuid().optional(),
});

const updatePlanSchema = createPlanSchema.partial().extend({
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
});

// ─── Goals ───────────────────────────────────────────────────────────────────

/**
 * GET /api/tenants/:tenantId/planning/goals
 * List goals for the tenant (optionally scoped to current user)
 */
planningRoutes.get(
  '/goals',
  requireTenantAccess(),
  zValidator('query', goalListQuerySchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const user = c.get('user');
    const { status, category, userId: filterUserId, page, limit } = c.req.valid('query');

    const isAdmin = user.roleLevel >= 70;
    // Non-admins can only see their own goals
    const effectiveUserId = isAdmin ? (filterUserId ?? undefined) : user.id;

    const conditions = [eq(individualGoals.tenantId, tenantId)];

    if (effectiveUserId) conditions.push(eq(individualGoals.userId, effectiveUserId));
    if (status) conditions.push(eq(individualGoals.status, status));
    if (category) conditions.push(eq(individualGoals.category, category));

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(individualGoals)
      .where(and(...conditions));

    const offset = (page - 1) * limit;
    const rows = await db
      .select({
        id: individualGoals.id,
        userId: individualGoals.userId,
        title: individualGoals.title,
        description: individualGoals.description,
        successMetrics: individualGoals.successMetrics,
        actionSteps: individualGoals.actionSteps,
        category: individualGoals.category,
        priority: individualGoals.priority,
        startDate: individualGoals.startDate,
        targetDate: individualGoals.targetDate,
        progress: individualGoals.progress,
        status: individualGoals.status,
        parentGoalId: individualGoals.parentGoalId,
        assessmentId: individualGoals.assessmentId,
        reviewFrequency: individualGoals.reviewFrequency,
        lastReviewedAt: individualGoals.lastReviewedAt,
        createdAt: individualGoals.createdAt,
        updatedAt: individualGoals.updatedAt,
        ownerName: sql<string | null>`(
          SELECT concat(u.first_name, ' ', u.last_name)
          FROM users u WHERE u.id = ${individualGoals.userId}
        )`,
      })
      .from(individualGoals)
      .where(and(...conditions))
      .orderBy(desc(individualGoals.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * POST /api/tenants/:tenantId/planning/goals
 * Create a new goal
 */
planningRoutes.post(
  '/goals',
  requireTenantAccess(),
  zValidator('json', createGoalSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    const goal = await db.transaction(async (tx) => {
      const [newGoal] = await tx
        .insert(individualGoals)
        .values({
          userId: user.id,
          tenantId,
          title: body.title,
          description: body.description,
          successMetrics: body.successMetrics,
          actionSteps: body.actionSteps,
          category: body.category,
          priority: body.priority,
          startDate: body.startDate ?? null,
          targetDate: body.targetDate ?? null,
          reviewFrequency: body.reviewFrequency,
          parentGoalId: body.parentGoalId ?? null,
          assessmentId: body.assessmentId ?? null,
        })
        .returning();

      if (body.strategicPlanId) {
        await tx.insert(strategicGoalLinks).values({
          strategicPlanId: body.strategicPlanId,
          individualGoalId: newGoal.id,
          alignmentType: 'supports',
          createdBy: user.id,
        });
      }

      return newGoal;
    });

    return c.json({ data: goal }, 201);
  }
);

/**
 * GET /api/tenants/:tenantId/planning/goals/:goalId
 * Get a single goal
 */
planningRoutes.get('/goals/:goalId', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const goalId = c.req.param('goalId')!;
  const user = c.get('user');

  const [goal] = await db
    .select()
    .from(individualGoals)
    .where(and(eq(individualGoals.id, goalId), eq(individualGoals.tenantId, tenantId)));

  if (!goal) throw new NotFoundError('Goal not found');

  // Non-admins can only view their own goals
  const isAdmin = user.roleLevel >= 70;
  if (!isAdmin && goal.userId !== user.id) throw new ForbiddenError();

  return c.json({ data: goal });
});

/**
 * PUT /api/tenants/:tenantId/planning/goals/:goalId
 * Update a goal
 */
planningRoutes.put(
  '/goals/:goalId',
  requireTenantAccess(),
  zValidator('json', updateGoalSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const goalId = c.req.param('goalId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    const [existing] = await db
      .select({ id: individualGoals.id, userId: individualGoals.userId })
      .from(individualGoals)
      .where(and(eq(individualGoals.id, goalId), eq(individualGoals.tenantId, tenantId)));

    if (!existing) throw new NotFoundError('Goal not found');

    const isAdmin = user.roleLevel >= 70;
    if (!isAdmin && existing.userId !== user.id) throw new ForbiddenError();

    const [updated] = await db
      .update(individualGoals)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(individualGoals.id, goalId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/tenants/:tenantId/planning/goals/:goalId
 * Delete (cancel) a goal
 */
planningRoutes.delete('/goals/:goalId', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const goalId = c.req.param('goalId')!;
  const user = c.get('user');

  const [existing] = await db
    .select({ id: individualGoals.id, userId: individualGoals.userId })
    .from(individualGoals)
    .where(and(eq(individualGoals.id, goalId), eq(individualGoals.tenantId, tenantId)));

  if (!existing) throw new NotFoundError('Goal not found');

  const isAdmin = user.roleLevel >= 70;
  if (!isAdmin && existing.userId !== user.id) throw new ForbiddenError();

  // Soft-delete by setting status to cancelled
  await db
    .update(individualGoals)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(individualGoals.id, goalId));

  return c.json({ success: true });
});

// ─── Strategic Plans ──────────────────────────────────────────────────────────

/**
 * GET /api/tenants/:tenantId/planning/plans
 * List strategic plans for the tenant
 */
planningRoutes.get(
  '/plans',
  requireTenantAccess(),
  zValidator('query', planListQuerySchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const { status, planType, page, limit } = c.req.valid('query');

    const conditions = [eq(strategicPlans.tenantId, tenantId)];
    if (status) conditions.push(eq(strategicPlans.status, status));
    if (planType) conditions.push(eq(strategicPlans.planType, planType));

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(strategicPlans)
      .where(and(...conditions));

    const offset = (page - 1) * limit;
    const rows = await db
      .select()
      .from(strategicPlans)
      .where(and(...conditions))
      .orderBy(desc(strategicPlans.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * POST /api/tenants/:tenantId/planning/plans
 * Create a new strategic plan
 */
planningRoutes.post(
  '/plans',
  requireTenantAccess(),
  zValidator('json', createPlanSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    // Only admins can create strategic plans
    if (user.roleLevel < 70) throw new ForbiddenError();

    const [plan] = await db
      .insert(strategicPlans)
      .values({
        tenantId,
        createdBy: user.id,
        name: body.name,
        description: body.description,
        planType: body.planType,
        startDate: body.startDate ?? null,
        targetDate: body.targetDate ?? null,
        config: body.config,
        parentPlanId: body.parentPlanId ?? null,
      })
      .returning();

    return c.json({ data: plan }, 201);
  }
);

/**
 * PUT /api/tenants/:tenantId/planning/plans/:planId
 * Update a strategic plan
 */
planningRoutes.put(
  '/plans/:planId',
  requireTenantAccess(),
  zValidator('json', updatePlanSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const planId = c.req.param('planId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    if (user.roleLevel < 70) throw new ForbiddenError();

    const [existing] = await db
      .select({ id: strategicPlans.id })
      .from(strategicPlans)
      .where(and(eq(strategicPlans.id, planId), eq(strategicPlans.tenantId, tenantId)));

    if (!existing) throw new NotFoundError('Strategic plan not found');

    const [updated] = await db
      .update(strategicPlans)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(strategicPlans.id, planId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/tenants/:tenantId/planning/plans/:planId
 * Archive a strategic plan
 */
planningRoutes.delete('/plans/:planId', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const planId = c.req.param('planId')!;
  const user = c.get('user');

  if (user.roleLevel < 70) throw new ForbiddenError();

  const [existing] = await db
    .select({ id: strategicPlans.id })
    .from(strategicPlans)
    .where(and(eq(strategicPlans.id, planId), eq(strategicPlans.tenantId, tenantId)));

  if (!existing) throw new NotFoundError('Strategic plan not found');

  await db
    .update(strategicPlans)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(strategicPlans.id, planId));

  return c.json({ success: true });
});

// ─── Summary ──────────────────────────────────────────────────────────────────

/**
 * GET /api/tenants/:tenantId/planning/summary
 * Aggregated planning stats for the current user's scope
 */
planningRoutes.get('/summary', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const user = c.get('user');
  const isAdmin = user.roleLevel >= 70;

  const goalConditions = [eq(individualGoals.tenantId, tenantId)];
  if (!isAdmin) goalConditions.push(eq(individualGoals.userId, user.id));

  const [goalStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${individualGoals.status} = 'active')::int`,
      completed: sql<number>`count(*) filter (where ${individualGoals.status} = 'completed')::int`,
      draft: sql<number>`count(*) filter (where ${individualGoals.status} = 'draft')::int`,
      onHold: sql<number>`count(*) filter (where ${individualGoals.status} = 'on_hold')::int`,
      avgProgress: sql<number>`round(avg(${individualGoals.progress}))::int`,
    })
    .from(individualGoals)
    .where(and(...goalConditions));

  const categoryBreakdown = await db
    .select({
      category: individualGoals.category,
      count: sql<number>`count(*)::int`,
    })
    .from(individualGoals)
    .where(and(...goalConditions))
    .groupBy(individualGoals.category)
    .orderBy(asc(individualGoals.category));

  const [planStats] = isAdmin
    ? await db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${strategicPlans.status} = 'active')::int`,
        })
        .from(strategicPlans)
        .where(eq(strategicPlans.tenantId, tenantId))
    : [{ total: 0, active: 0 }];

  return c.json({
    goals: {
      ...goalStats,
      byCategory: categoryBreakdown,
    },
    plans: planStats,
  });
});
