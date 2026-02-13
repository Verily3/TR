import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireAgencyAccess } from '../middleware/permissions.js';
import { NotFoundError } from '../lib/errors.js';
import { computeBenchmarks } from '../lib/benchmark-engine.js';
import type { Variables } from '../types/context.js';

const { assessmentBenchmarks, assessmentTemplates } = schema;

export const assessmentBenchmarksRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET /api/agencies/me/benchmarks
 * List all benchmarks for the agency
 */
assessmentBenchmarksRoutes.get('/', requireAgencyAccess(), async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId!;

  const benchmarks = await db
    .select({
      id: assessmentBenchmarks.id,
      agencyId: assessmentBenchmarks.agencyId,
      templateId: assessmentBenchmarks.templateId,
      sampleSize: assessmentBenchmarks.sampleSize,
      benchmarkData: assessmentBenchmarks.benchmarkData,
      computedAt: assessmentBenchmarks.computedAt,
      templateName: assessmentTemplates.name,
      templateType: assessmentTemplates.assessmentType,
    })
    .from(assessmentBenchmarks)
    .leftJoin(assessmentTemplates, eq(assessmentBenchmarks.templateId, assessmentTemplates.id))
    .where(eq(assessmentBenchmarks.agencyId, agencyId));

  return c.json({ data: benchmarks });
});

/**
 * GET /api/agencies/me/benchmarks/:templateId
 * Get benchmark data for a specific template
 */
assessmentBenchmarksRoutes.get('/:templateId', requireAgencyAccess(), async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId!;
  const templateId = c.req.param('templateId')!;

  const [benchmark] = await db
    .select()
    .from(assessmentBenchmarks)
    .where(
      and(
        eq(assessmentBenchmarks.agencyId, agencyId),
        eq(assessmentBenchmarks.templateId, templateId)
      )
    )
    .limit(1);

  if (!benchmark) {
    return c.json({
      error: { code: 'NOT_FOUND', message: 'No benchmarks found for this template. Compute them first.' },
    }, 404);
  }

  return c.json({ data: benchmark });
});

/**
 * POST /api/agencies/me/benchmarks/compute/:templateId
 * Compute (or recompute) benchmarks for a template
 */
assessmentBenchmarksRoutes.post('/compute/:templateId', requireAgencyAccess(), async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId!;
  const templateId = c.req.param('templateId')!;

  // Verify template belongs to agency
  const [template] = await db
    .select({ id: assessmentTemplates.id })
    .from(assessmentTemplates)
    .where(
      and(
        eq(assessmentTemplates.id, templateId),
        eq(assessmentTemplates.agencyId, agencyId)
      )
    )
    .limit(1);

  if (!template) {
    throw new NotFoundError('Assessment template');
  }

  const benchmarkData = await computeBenchmarks(agencyId, templateId);

  return c.json({
    data: {
      templateId,
      benchmarkData,
      computedAt: new Date().toISOString(),
    },
  });
});
