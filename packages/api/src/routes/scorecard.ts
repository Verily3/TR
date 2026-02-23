import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, asc, desc } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireTenantAccess } from '../middleware/permissions.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';
import type { Variables } from '../types/context.js';

const { scorecardItems, scorecardMetrics, scorecardCompetencies } = schema;

export const scorecardRoutes = new Hono<{ Variables: Variables }>();

// ─── GET /scorecard — Full scorecard for a user ────────────────────────────────

scorecardRoutes.get('/', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const user = c.get('user');
  const { period, userId: requestedUserId } = c.req.query();

  const targetUserId =
    requestedUserId && requestedUserId !== user.id
      ? (() => {
          if (user.roleLevel < 70) throw new ForbiddenError('You can only view your own scorecard');
          return requestedUserId;
        })()
      : user.id;

  // Default period to current quarter
  const currentPeriod = period || getCurrentQuarter();

  const [items, metrics, competencies] = await Promise.all([
    db
      .select()
      .from(scorecardItems)
      .where(
        and(
          eq(scorecardItems.tenantId, tenantId),
          eq(scorecardItems.userId, targetUserId),
          eq(scorecardItems.period, currentPeriod)
        )
      )
      .orderBy(asc(scorecardItems.ordinal), asc(scorecardItems.createdAt)),

    db
      .select()
      .from(scorecardMetrics)
      .where(
        and(
          eq(scorecardMetrics.tenantId, tenantId),
          eq(scorecardMetrics.userId, targetUserId),
          eq(scorecardMetrics.period, currentPeriod)
        )
      )
      .orderBy(asc(scorecardMetrics.category), asc(scorecardMetrics.ordinal)),

    db
      .select()
      .from(scorecardCompetencies)
      .where(
        and(
          eq(scorecardCompetencies.tenantId, tenantId),
          eq(scorecardCompetencies.userId, targetUserId),
          eq(scorecardCompetencies.period, currentPeriod)
        )
      )
      .orderBy(asc(scorecardCompetencies.ordinal)),
  ]);

  // Group metrics by category
  const metricsByCategory = metrics.reduce<
    Record<string, { category: string; metrics: typeof metrics }>
  >((acc, m) => {
    if (!acc[m.category]) {
      acc[m.category] = { category: m.category, metrics: [] };
    }
    acc[m.category].metrics.push(m);
    return acc;
  }, {});

  // Compute overall score from items
  const overallScore =
    items.length > 0 ? Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length) : 0;

  return c.json({
    data: {
      userId: targetUserId,
      period: currentPeriod,
      overallScore,
      items,
      metricCategories: Object.values(metricsByCategory),
      competencies,
    },
  });
});

// ─── Scorecard Items (Accountabilities) ───────────────────────────────────────

const itemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  status: z.enum(['on_track', 'at_risk', 'needs_attention']).optional(),
  period: z.string().max(20).optional(),
  ordinal: z.number().int().optional(),
});

scorecardRoutes.post('/items', requireTenantAccess(), zValidator('json', itemSchema), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const user = c.get('user');
  const body = c.req.valid('json');

  const period = body.period || getCurrentQuarter();

  const [item] = await db
    .insert(scorecardItems)
    .values({
      tenantId,
      userId: user.id,
      title: body.title,
      description: body.description,
      score: body.score ?? 0,
      status: body.status ?? 'on_track',
      period,
      ordinal: body.ordinal ?? 0,
    })
    .returning();

  return c.json({ data: item }, 201);
});

scorecardRoutes.put(
  '/items/:itemId',
  requireTenantAccess(),
  zValidator('json', itemSchema.partial()),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const itemId = c.req.param('itemId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(scorecardItems)
      .where(and(eq(scorecardItems.id, itemId), eq(scorecardItems.tenantId, tenantId)))
      .limit(1);

    if (!existing) throw new NotFoundError('Scorecard item');
    if (existing.userId !== user.id && user.roleLevel < 70) {
      throw new ForbiddenError('Cannot edit this scorecard item');
    }

    const [updated] = await db
      .update(scorecardItems)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(scorecardItems.id, itemId))
      .returning();

    return c.json({ data: updated });
  }
);

scorecardRoutes.delete('/items/:itemId', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const itemId = c.req.param('itemId')!;
  const user = c.get('user');

  const [existing] = await db
    .select()
    .from(scorecardItems)
    .where(and(eq(scorecardItems.id, itemId), eq(scorecardItems.tenantId, tenantId)))
    .limit(1);

  if (!existing) throw new NotFoundError('Scorecard item');
  if (existing.userId !== user.id && user.roleLevel < 70) {
    throw new ForbiddenError('Cannot delete this scorecard item');
  }

  await db.delete(scorecardItems).where(eq(scorecardItems.id, itemId));

  return c.json({ data: { success: true } });
});

// ─── Scorecard Metrics (KPIs) ─────────────────────────────────────────────────

const metricSchema = z.object({
  category: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  targetValue: z.string().max(100).optional(),
  actualValue: z.string().max(100).optional(),
  targetNumeric: z.number().optional(),
  actualNumeric: z.number().optional(),
  changeLabel: z.string().max(50).optional(),
  trend: z.enum(['up', 'down', 'neutral']).optional(),
  invertTrend: z.boolean().optional(),
  period: z.string().max(20).optional(),
  ordinal: z.number().int().optional(),
  scorecardItemId: z.string().uuid().optional(),
});

scorecardRoutes.post(
  '/metrics',
  requireTenantAccess(),
  zValidator('json', metricSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    const period = body.period || getCurrentQuarter();

    const [metric] = await db
      .insert(scorecardMetrics)
      .values({
        tenantId,
        userId: user.id,
        category: body.category,
        name: body.name,
        targetValue: body.targetValue ?? '',
        actualValue: body.actualValue ?? '',
        targetNumeric: body.targetNumeric,
        actualNumeric: body.actualNumeric,
        changeLabel: body.changeLabel,
        trend: body.trend ?? 'neutral',
        invertTrend: body.invertTrend ? 1 : 0,
        period,
        ordinal: body.ordinal ?? 0,
        scorecardItemId: body.scorecardItemId,
      })
      .returning();

    return c.json({ data: metric }, 201);
  }
);

scorecardRoutes.put(
  '/metrics/:metricId',
  requireTenantAccess(),
  zValidator('json', metricSchema.partial()),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const metricId = c.req.param('metricId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(scorecardMetrics)
      .where(and(eq(scorecardMetrics.id, metricId), eq(scorecardMetrics.tenantId, tenantId)))
      .limit(1);

    if (!existing) throw new NotFoundError('Scorecard metric');
    if (existing.userId !== user.id && user.roleLevel < 70) {
      throw new ForbiddenError('Cannot edit this scorecard metric');
    }

    const [updated] = await db
      .update(scorecardMetrics)
      .set({
        ...body,
        invertTrend:
          body.invertTrend !== undefined ? (body.invertTrend ? 1 : 0) : existing.invertTrend,
        updatedAt: new Date(),
      })
      .where(eq(scorecardMetrics.id, metricId))
      .returning();

    return c.json({ data: updated });
  }
);

scorecardRoutes.delete('/metrics/:metricId', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const metricId = c.req.param('metricId')!;
  const user = c.get('user');

  const [existing] = await db
    .select()
    .from(scorecardMetrics)
    .where(and(eq(scorecardMetrics.id, metricId), eq(scorecardMetrics.tenantId, tenantId)))
    .limit(1);

  if (!existing) throw new NotFoundError('Scorecard metric');
  if (existing.userId !== user.id && user.roleLevel < 70) {
    throw new ForbiddenError('Cannot delete this scorecard metric');
  }

  await db.delete(scorecardMetrics).where(eq(scorecardMetrics.id, metricId));

  return c.json({ data: { success: true } });
});

// ─── Scorecard Competencies ────────────────────────────────────────────────────

const competencySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  selfRating: z.number().int().min(0).max(5).optional(),
  managerRating: z.number().int().min(0).max(5).optional(),
  period: z.string().max(20).optional(),
  ordinal: z.number().int().optional(),
  reviewerId: z.string().uuid().optional(),
});

scorecardRoutes.post(
  '/competencies',
  requireTenantAccess(),
  zValidator('json', competencySchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    const period = body.period || getCurrentQuarter();

    const [competency] = await db
      .insert(scorecardCompetencies)
      .values({
        tenantId,
        userId: user.id,
        name: body.name,
        description: body.description,
        selfRating: body.selfRating ?? 0,
        managerRating: body.managerRating ?? 0,
        period,
        ordinal: body.ordinal ?? 0,
        reviewerId: body.reviewerId,
      })
      .returning();

    return c.json({ data: competency }, 201);
  }
);

scorecardRoutes.put(
  '/competencies/:competencyId',
  requireTenantAccess(),
  zValidator('json', competencySchema.partial()),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const competencyId = c.req.param('competencyId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(scorecardCompetencies)
      .where(
        and(
          eq(scorecardCompetencies.id, competencyId),
          eq(scorecardCompetencies.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!existing) throw new NotFoundError('Scorecard competency');

    // Self-rating: only the user themselves (or admin)
    // Manager rating: only the assigned reviewer or admin
    const canEdit =
      user.roleLevel >= 70 ||
      (body.selfRating !== undefined && existing.userId === user.id) ||
      (body.managerRating !== undefined &&
        (existing.reviewerId === user.id || user.roleLevel >= 50));

    if (!canEdit) throw new ForbiddenError('Cannot edit this competency');

    const [updated] = await db
      .update(scorecardCompetencies)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(scorecardCompetencies.id, competencyId))
      .returning();

    return c.json({ data: updated });
  }
);

scorecardRoutes.delete('/competencies/:competencyId', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const competencyId = c.req.param('competencyId')!;
  const user = c.get('user');

  const [existing] = await db
    .select()
    .from(scorecardCompetencies)
    .where(
      and(eq(scorecardCompetencies.id, competencyId), eq(scorecardCompetencies.tenantId, tenantId))
    )
    .limit(1);

  if (!existing) throw new NotFoundError('Scorecard competency');
  if (existing.userId !== user.id && user.roleLevel < 70) {
    throw new ForbiddenError('Cannot delete this competency');
  }

  await db.delete(scorecardCompetencies).where(eq(scorecardCompetencies.id, competencyId));

  return c.json({ data: { success: true } });
});

// ─── Org Health ───────────────────────────────────────────────────────────────

scorecardRoutes.get('/org-health', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const { period } = c.req.query();
  const currentPeriod = period || getCurrentQuarter();

  const metrics = await db
    .select({ category: scorecardMetrics.category, trend: scorecardMetrics.trend })
    .from(scorecardMetrics)
    .where(
      and(eq(scorecardMetrics.tenantId, tenantId), eq(scorecardMetrics.period, currentPeriod))
    );

  // Group by category
  const categoryMap = new Map<
    string,
    { up: number; neutral: number; down: number; total: number }
  >();
  for (const m of metrics) {
    const entry = categoryMap.get(m.category) ?? { up: 0, neutral: 0, down: 0, total: 0 };
    entry.total++;
    if (m.trend === 'up') entry.up++;
    else if (m.trend === 'down') entry.down++;
    else entry.neutral++;
    categoryMap.set(m.category, entry);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, counts], idx) => {
    const score =
      counts.total > 0
        ? Math.round((counts.up * 100 + counts.neutral * 60 + counts.down * 20) / counts.total)
        : 0;
    const trend: 'up' | 'down' | 'neutral' =
      counts.up > counts.down ? 'up' : counts.down > counts.up ? 'down' : 'neutral';
    return { id: `health-${idx + 1}`, name, score, change: 0, trend };
  });

  return c.json({ data: categories });
});

// ─── Available periods ─────────────────────────────────────────────────────────

scorecardRoutes.get('/periods', requireTenantAccess(), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const user = c.get('user');

  const rows = await db
    .selectDistinct({ period: scorecardItems.period })
    .from(scorecardItems)
    .where(and(eq(scorecardItems.tenantId, tenantId), eq(scorecardItems.userId, user.id)))
    .orderBy(desc(scorecardItems.period));

  const periods = rows.map((r) => r.period);

  // Always include the current quarter
  const current = getCurrentQuarter();
  if (!periods.includes(current)) periods.unshift(current);

  return c.json({ data: periods });
});

// ─── Utility ──────────────────────────────────────────────────────────────────

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q}-${now.getFullYear()}`;
}
