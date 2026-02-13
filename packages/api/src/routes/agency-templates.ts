import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, count } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireAgencyAccess } from '../middleware/permissions.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import type { Variables } from '../types/context.js';

const { assessmentTemplates, assessments } = schema;

export const agencyTemplatesRoutes = new Hono<{ Variables: Variables }>();

// Zod schemas
const competencyQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(['rating', 'text', 'multiple_choice']).optional(),
  required: z.boolean().optional(),
});

const competencySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(competencyQuestionSchema).min(1),
});

const templateConfigSchema = z.object({
  competencies: z.array(competencySchema).min(1),
  scaleMin: z.number().int().min(1).default(1),
  scaleMax: z.number().int().min(2).default(5),
  scaleLabels: z.array(z.string()).optional().default([]),
  allowComments: z.boolean().default(true),
  requireComments: z.boolean().default(false),
  anonymizeResponses: z.boolean().default(true),
  raterTypes: z
    .array(z.enum(['self', 'manager', 'peer', 'direct_report']))
    .min(1),
  minRatersPerType: z.record(z.string(), z.number()).optional(),
  maxRatersPerType: z.record(z.string(), z.number()).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  assessmentType: z.enum(['180', '360', 'custom']).default('360'),
  config: templateConfigSchema,
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assessmentType: z.enum(['180', '360', 'custom']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  config: templateConfigSchema.optional(),
});

/**
 * GET /api/agencies/me/templates
 * List all templates for the agency
 */
agencyTemplatesRoutes.get('/', requireAgencyAccess(), async (c) => {
  const user = c.get('user');
  const status = c.req.query('status');
  const type = c.req.query('type');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const conditions = [eq(assessmentTemplates.agencyId, user.agencyId!)];
  if (status) {
    conditions.push(
      eq(assessmentTemplates.status, status as 'draft' | 'published' | 'archived')
    );
  }
  if (type) {
    conditions.push(
      eq(assessmentTemplates.assessmentType, type as '180' | '360' | 'custom')
    );
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(assessmentTemplates)
    .where(and(...conditions));

  const templates = await db
    .select()
    .from(assessmentTemplates)
    .where(and(...conditions))
    .orderBy(desc(assessmentTemplates.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return c.json({
    data: templates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/agencies/me/templates/stats
 * Template statistics
 */
agencyTemplatesRoutes.get('/stats', requireAgencyAccess(), async (c) => {
  const user = c.get('user');

  const allTemplates = await db
    .select({
      status: assessmentTemplates.status,
      type: assessmentTemplates.assessmentType,
    })
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.agencyId, user.agencyId!));

  const stats = {
    total: allTemplates.length,
    draft: allTemplates.filter((t) => t.status === 'draft').length,
    published: allTemplates.filter((t) => t.status === 'published').length,
    archived: allTemplates.filter((t) => t.status === 'archived').length,
    byType: {
      '180': allTemplates.filter((t) => t.type === '180').length,
      '360': allTemplates.filter((t) => t.type === '360').length,
      custom: allTemplates.filter((t) => t.type === 'custom').length,
    },
  };

  return c.json({ data: stats });
});

/**
 * GET /api/agencies/me/templates/:templateId
 * Get template detail
 */
agencyTemplatesRoutes.get('/:templateId', requireAgencyAccess(), async (c) => {
  const user = c.get('user');
  const templateId = c.req.param('templateId')!;

  const [template] = await db
    .select()
    .from(assessmentTemplates)
    .where(
      and(
        eq(assessmentTemplates.id, templateId),
        eq(assessmentTemplates.agencyId, user.agencyId!)
      )
    )
    .limit(1);

  if (!template) {
    throw new NotFoundError('Assessment template');
  }

  return c.json({ data: template });
});

/**
 * POST /api/agencies/me/templates
 * Create template
 */
agencyTemplatesRoutes.post(
  '/',
  requireAgencyAccess(),
  zValidator('json', createTemplateSchema),
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const [template] = await db
      .insert(assessmentTemplates)
      .values({
        agencyId: user.agencyId!,
        createdBy: user.id,
        name: body.name,
        description: body.description,
        assessmentType: body.assessmentType,
        config: body.config,
        status: 'draft',
      })
      .returning();

    return c.json({ data: template }, 201);
  }
);

/**
 * PUT /api/agencies/me/templates/:templateId
 * Update template
 */
agencyTemplatesRoutes.put(
  '/:templateId',
  requireAgencyAccess(),
  zValidator('json', updateTemplateSchema),
  async (c) => {
    const user = c.get('user');
    const templateId = c.req.param('templateId')!;
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(assessmentTemplates)
      .where(
        and(
          eq(assessmentTemplates.id, templateId),
          eq(assessmentTemplates.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Assessment template');
    }

    const [updated] = await db
      .update(assessmentTemplates)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(assessmentTemplates.id, templateId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/agencies/me/templates/:templateId
 * Delete template (only if no assessments use it)
 */
agencyTemplatesRoutes.delete(
  '/:templateId',
  requireAgencyAccess(),
  async (c) => {
    const user = c.get('user');
    const templateId = c.req.param('templateId')!;

    const [existing] = await db
      .select()
      .from(assessmentTemplates)
      .where(
        and(
          eq(assessmentTemplates.id, templateId),
          eq(assessmentTemplates.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Assessment template');
    }

    // Check if any assessments use this template
    const [{ usageCount }] = await db
      .select({ usageCount: count() })
      .from(assessments)
      .where(eq(assessments.templateId, templateId));

    if (usageCount > 0) {
      throw new BadRequestError(
        `Cannot delete template: ${usageCount} assessments use this template. Archive it instead.`
      );
    }

    await db
      .delete(assessmentTemplates)
      .where(eq(assessmentTemplates.id, templateId));

    return c.json({ success: true });
  }
);

/**
 * POST /api/agencies/me/templates/:templateId/duplicate
 * Duplicate template
 */
agencyTemplatesRoutes.post(
  '/:templateId/duplicate',
  requireAgencyAccess(),
  async (c) => {
    const user = c.get('user');
    const templateId = c.req.param('templateId')!;

    const [existing] = await db
      .select()
      .from(assessmentTemplates)
      .where(
        and(
          eq(assessmentTemplates.id, templateId),
          eq(assessmentTemplates.agencyId, user.agencyId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Assessment template');
    }

    const [duplicate] = await db
      .insert(assessmentTemplates)
      .values({
        agencyId: existing.agencyId,
        createdBy: user.id,
        name: `${existing.name} (Copy)`,
        description: existing.description,
        assessmentType: existing.assessmentType,
        config: existing.config,
        status: 'draft',
        parentTemplateId: existing.id,
      })
      .returning();

    return c.json({ data: duplicate }, 201);
  }
);
