import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  eq,
  and,
  desc,
  count,
  sql,
  inArray,
} from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { sendAssessmentInvitation, sendAssessmentReminder } from '../lib/email.js';
import { createNotification } from '../lib/notifications.js';
import { env } from '../lib/env.js';
import { computeAssessmentResults } from '../lib/assessment-engine.js';
import { generateAssessmentReport } from '../lib/pdf/report-generator.js';
import type { ComputedAssessmentResults } from '@tr/db/schema';
import type { Variables } from '../types/context.js';

const {
  assessments,
  assessmentTemplates,
  assessmentInvitations,
  individualGoals,
  users,
} = schema;

export const assessmentsRoutes = new Hono<{ Variables: Variables }>();

// Zod schemas
const createAssessmentSchema = z.object({
  templateId: z.string().uuid(),
  subjectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  anonymizeResults: z.boolean().default(true),
  showResultsToSubject: z.boolean().default(true),
  programId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
});

const updateAssessmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'open', 'closed', 'completed']).optional(),
  openDate: z.string().nullable().optional(),
  closeDate: z.string().nullable().optional(),
  anonymizeResults: z.boolean().optional(),
  showResultsToSubject: z.boolean().optional(),
});

const addInvitationsSchema = z.object({
  invitations: z.array(
    z.object({
      raterId: z.string().uuid(),
      raterType: z.enum(['self', 'manager', 'peer', 'direct_report']),
    })
  ).min(1),
});

/**
 * GET /api/tenants/:tenantId/assessments
 * List assessments
 */
assessmentsRoutes.get('/', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const status = c.req.query('status');
  const subjectId = c.req.query('subjectId');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const conditions: ReturnType<typeof eq>[] = [eq(assessments.tenantId, tenantId)];
  if (status) {
    conditions.push(eq(assessments.status, status as 'draft' | 'open' | 'closed' | 'completed'));
  }
  if (subjectId) {
    conditions.push(eq(assessments.subjectId, subjectId));
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(assessments)
    .where(and(...conditions));

  const rows = await db
    .select()
    .from(assessments)
    .where(and(...conditions))
    .orderBy(desc(assessments.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  // Fetch invitation counts per assessment
  const assessmentIds = rows.map((a) => a.id);
  let invitationCounts: Record<
    string,
    { total: number; completed: number }
  > = {};

  if (assessmentIds.length > 0) {
    const invCounts = await db
      .select({
        assessmentId: assessmentInvitations.assessmentId,
        total: count(),
        completed: sql<number>`count(*) filter (where ${assessmentInvitations.status} = 'completed')`,
      })
      .from(assessmentInvitations)
      .where(inArray(assessmentInvitations.assessmentId, assessmentIds))
      .groupBy(assessmentInvitations.assessmentId);

    invitationCounts = Object.fromEntries(
      invCounts.map((ic) => [
        ic.assessmentId,
        { total: Number(ic.total), completed: Number(ic.completed) },
      ])
    );
  }

  // Fetch subject info
  const subjectIds = [...new Set(rows.map((a) => a.subjectId))];
  let subjectMap: Record<string, { firstName: string; lastName: string; email: string }> = {};
  if (subjectIds.length > 0) {
    const subjects = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, subjectIds));

    subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));
  }

  // Fetch template names
  const templateIds = [...new Set(rows.map((a) => a.templateId))];
  let templateMap: Record<string, { name: string; assessmentType: string }> = {};
  if (templateIds.length > 0) {
    const templates = await db
      .select({
        id: assessmentTemplates.id,
        name: assessmentTemplates.name,
        assessmentType: assessmentTemplates.assessmentType,
      })
      .from(assessmentTemplates)
      .where(inArray(assessmentTemplates.id, templateIds));

    templateMap = Object.fromEntries(templates.map((t) => [t.id, t]));
  }

  const data = rows.map((a) => ({
    ...a,
    subject: subjectMap[a.subjectId] || null,
    template: templateMap[a.templateId] || null,
    invitationStats: invitationCounts[a.id] || { total: 0, completed: 0 },
    responseRate:
      invitationCounts[a.id] && invitationCounts[a.id].total > 0
        ? Math.round(
            (invitationCounts[a.id].completed / invitationCounts[a.id].total) *
              100
          )
        : 0,
  }));

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/tenants/:tenantId/assessments/stats
 * Assessment statistics
 */
assessmentsRoutes.get('/stats', async (c) => {
  const tenantId = c.req.param('tenantId')!;

  const allAssessments = await db
    .select({ id: assessments.id, status: assessments.status })
    .from(assessments)
    .where(eq(assessments.tenantId, tenantId));

  const assessmentIds = allAssessments.map((a) => a.id);
  let totalInvited = 0;
  let totalCompleted = 0;

  if (assessmentIds.length > 0) {
    const [invStats] = await db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${assessmentInvitations.status} = 'completed')`,
      })
      .from(assessmentInvitations)
      .where(inArray(assessmentInvitations.assessmentId, assessmentIds));

    totalInvited = Number(invStats.total);
    totalCompleted = Number(invStats.completed);
  }

  return c.json({
    data: {
      totalAssessments: allAssessments.length,
      activeAssessments: allAssessments.filter((a) => a.status === 'open')
        .length,
      completedAssessments: allAssessments.filter(
        (a) => a.status === 'completed'
      ).length,
      draftAssessments: allAssessments.filter((a) => a.status === 'draft')
        .length,
      pendingResponses: totalInvited - totalCompleted,
      averageResponseRate:
        totalInvited > 0
          ? Math.round((totalCompleted / totalInvited) * 100)
          : 0,
    },
  });
});

/**
 * GET /api/tenants/:tenantId/assessments/:assessmentId
 * Get assessment detail with invitations
 */
assessmentsRoutes.get('/:assessmentId', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) {
    throw new NotFoundError('Assessment');
  }

  // Fetch template
  const [template] = await db
    .select()
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.id, assessment.templateId))
    .limit(1);

  // Fetch subject
  const [subject] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      title: users.title,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.id, assessment.subjectId))
    .limit(1);

  // Fetch invitations with rater info
  const invitations = await db
    .select({
      id: assessmentInvitations.id,
      raterId: assessmentInvitations.raterId,
      raterType: assessmentInvitations.raterType,
      status: assessmentInvitations.status,
      accessToken: assessmentInvitations.accessToken,
      sentAt: assessmentInvitations.sentAt,
      completedAt: assessmentInvitations.completedAt,
      reminderCount: assessmentInvitations.reminderCount,
      raterFirstName: users.firstName,
      raterLastName: users.lastName,
      raterEmail: users.email,
      raterAvatar: users.avatar,
    })
    .from(assessmentInvitations)
    .leftJoin(users, eq(assessmentInvitations.raterId, users.id))
    .where(eq(assessmentInvitations.assessmentId, assessmentId))
    .orderBy(assessmentInvitations.raterType);

  const invitationsFormatted = invitations.map((inv) => ({
    id: inv.id,
    raterId: inv.raterId,
    raterType: inv.raterType,
    status: inv.status,
    accessToken: inv.accessToken,
    sentAt: inv.sentAt,
    completedAt: inv.completedAt,
    reminderCount: inv.reminderCount,
    rater: {
      id: inv.raterId,
      firstName: inv.raterFirstName,
      lastName: inv.raterLastName,
      email: inv.raterEmail,
      avatar: inv.raterAvatar,
    },
  }));

  const totalInvited = invitations.length;
  const totalCompleted = invitations.filter(
    (inv) => inv.status === 'completed'
  ).length;

  return c.json({
    data: {
      ...assessment,
      template,
      subject,
      invitations: invitationsFormatted,
      invitationStats: { total: totalInvited, completed: totalCompleted },
      responseRate:
        totalInvited > 0
          ? Math.round((totalCompleted / totalInvited) * 100)
          : 0,
    },
  });
});

/**
 * POST /api/tenants/:tenantId/assessments
 * Create assessment from template
 */
assessmentsRoutes.post(
  '/',
  zValidator('json', createAssessmentSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    // Verify template exists
    const [template] = await db
      .select()
      .from(assessmentTemplates)
      .where(eq(assessmentTemplates.id, body.templateId))
      .limit(1);

    if (!template) {
      throw new NotFoundError('Assessment template');
    }

    if (template.status !== 'published') {
      throw new BadRequestError('Template must be published to create assessments');
    }

    const [assessment] = await db
      .insert(assessments)
      .values({
        templateId: body.templateId,
        tenantId,
        subjectId: body.subjectId,
        createdBy: user.id,
        name: body.name,
        description: body.description,
        openDate: body.openDate ?? null,
        closeDate: body.closeDate ?? null,
        anonymizeResults: body.anonymizeResults,
        showResultsToSubject: body.showResultsToSubject,
        programId: body.programId ?? null,
        enrollmentId: body.enrollmentId ?? null,
        status: 'draft',
      })
      .returning();

    return c.json({ data: assessment }, 201);
  }
);

/**
 * PUT /api/tenants/:tenantId/assessments/:assessmentId
 * Update assessment
 */
assessmentsRoutes.put(
  '/:assessmentId',
  zValidator('json', updateAssessmentSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const assessmentId = c.req.param('assessmentId')!;
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.id, assessmentId),
          eq(assessments.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Assessment');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.openDate !== undefined) updateData.openDate = body.openDate;
    if (body.closeDate !== undefined) updateData.closeDate = body.closeDate;
    if (body.anonymizeResults !== undefined) updateData.anonymizeResults = body.anonymizeResults;
    if (body.showResultsToSubject !== undefined) updateData.showResultsToSubject = body.showResultsToSubject;

    const [updated] = await db
      .update(assessments)
      .set(updateData)
      .where(eq(assessments.id, assessmentId))
      .returning();

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/tenants/:tenantId/assessments/:assessmentId
 * Delete assessment
 */
assessmentsRoutes.delete('/:assessmentId', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  const [existing] = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.id, assessmentId),
        eq(assessments.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Assessment');
  }

  if (existing.status === 'open') {
    throw new BadRequestError(
      'Cannot delete an open assessment. Close it first.'
    );
  }

  await db.delete(assessments).where(eq(assessments.id, assessmentId));

  return c.json({ success: true });
});

// ============================================
// INVITATION ROUTES
// ============================================

/**
 * GET /api/tenants/:tenantId/assessments/:assessmentId/invitations
 * List invitations for an assessment
 */
assessmentsRoutes.get('/:assessmentId/invitations', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  // Verify assessment belongs to tenant
  const [assessment] = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) {
    throw new NotFoundError('Assessment');
  }

  const invitations = await db
    .select({
      id: assessmentInvitations.id,
      raterId: assessmentInvitations.raterId,
      raterType: assessmentInvitations.raterType,
      status: assessmentInvitations.status,
      accessToken: assessmentInvitations.accessToken,
      sentAt: assessmentInvitations.sentAt,
      viewedAt: assessmentInvitations.viewedAt,
      startedAt: assessmentInvitations.startedAt,
      completedAt: assessmentInvitations.completedAt,
      reminderCount: assessmentInvitations.reminderCount,
      lastReminderAt: assessmentInvitations.lastReminderAt,
      raterFirstName: users.firstName,
      raterLastName: users.lastName,
      raterEmail: users.email,
      raterAvatar: users.avatar,
    })
    .from(assessmentInvitations)
    .leftJoin(users, eq(assessmentInvitations.raterId, users.id))
    .where(eq(assessmentInvitations.assessmentId, assessmentId))
    .orderBy(assessmentInvitations.raterType);

  const data = invitations.map((inv) => ({
    ...inv,
    rater: {
      id: inv.raterId,
      firstName: inv.raterFirstName,
      lastName: inv.raterLastName,
      email: inv.raterEmail,
      avatar: inv.raterAvatar,
    },
  }));

  return c.json({ data });
});

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/invitations
 * Batch add rater invitations
 */
assessmentsRoutes.post(
  '/:assessmentId/invitations',
  zValidator('json', addInvitationsSchema),
  async (c) => {
    const tenantId = c.req.param('tenantId')!;
    const assessmentId = c.req.param('assessmentId')!;
    const body = c.req.valid('json');

    const [assessment] = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.id, assessmentId),
          eq(assessments.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!assessment) {
      throw new NotFoundError('Assessment');
    }

    // Generate access tokens for each invitation
    const values = body.invitations.map((inv) => ({
      assessmentId,
      raterId: inv.raterId,
      raterType: inv.raterType as 'self' | 'manager' | 'peer' | 'direct_report',
      status: 'pending' as const,
      accessToken: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
    }));

    const inserted = await db
      .insert(assessmentInvitations)
      .values(values)
      .returning();

    // Send invitation emails + create in-app notifications
    const raterIds = inserted.map((inv) => inv.raterId);
    const raters = raterIds.length > 0
      ? await db.select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, raterIds))
      : [];

    const raterMap = new Map(raters.map((r) => [r.id, r]));

    await Promise.allSettled(
      inserted.map(async (inv) => {
        const rater = raterMap.get(inv.raterId);
        if (!rater) return;
        const respondUrl = `${env.APP_URL}/respond/${inv.accessToken}`;
        await sendAssessmentInvitation({
          to: rater.email,
          name: rater.firstName,
          assessorName: assessment.name,
          assessmentName: assessment.name,
          respondUrl,
        });
        await createNotification({
          userId: rater.id,
          type: 'assessment_invite',
          title: 'Assessment invitation',
          message: `You've been invited to complete the "${assessment.name}" assessment.`,
          actionUrl: respondUrl,
          actionLabel: 'Start Assessment',
        });
      })
    );

    // Mark all inserted as 'sent'
    if (inserted.length > 0) {
      await db.update(assessmentInvitations)
        .set({ status: 'sent', sentAt: new Date() })
        .where(inArray(assessmentInvitations.id, inserted.map((i) => i.id)));
    }

    return c.json({ data: inserted }, 201);
  }
);

/**
 * PUT /api/tenants/:tenantId/assessments/:assessmentId/invitations/:invitationId
 * Update invitation status
 */
assessmentsRoutes.put(
  '/:assessmentId/invitations/:invitationId',
  zValidator(
    'json',
    z.object({
      status: z
        .enum([
          'pending',
          'sent',
          'viewed',
          'started',
          'completed',
          'declined',
          'expired',
        ])
        .optional(),
    })
  ),
  async (c) => {
    const invitationId = c.req.param('invitationId')!;
    const body = c.req.valid('json');

    const [updated] = await db
      .update(assessmentInvitations)
      .set({
        ...(body.status && { status: body.status }),
        ...(body.status === 'sent' && { sentAt: new Date() }),
        ...(body.status === 'viewed' && { viewedAt: new Date() }),
        ...(body.status === 'started' && { startedAt: new Date() }),
        ...(body.status === 'completed' && { completedAt: new Date() }),
      })
      .where(eq(assessmentInvitations.id, invitationId))
      .returning();

    if (!updated) {
      throw new NotFoundError('Invitation');
    }

    return c.json({ data: updated });
  }
);

/**
 * DELETE /api/tenants/:tenantId/assessments/:assessmentId/invitations/:invitationId
 * Remove rater
 */
assessmentsRoutes.delete(
  '/:assessmentId/invitations/:invitationId',
  async (c) => {
    const invitationId = c.req.param('invitationId')!;

    const [deleted] = await db
      .delete(assessmentInvitations)
      .where(eq(assessmentInvitations.id, invitationId))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Invitation');
    }

    return c.json({ success: true });
  }
);

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/invitations/remind
 * Send reminders to pending raters
 */
assessmentsRoutes.post('/:assessmentId/invitations/remind', async (c) => {
  const assessmentId = c.req.param('assessmentId')!;

  // Find pending/sent invitations
  const pending = await db
    .select()
    .from(assessmentInvitations)
    .where(
      and(
        eq(assessmentInvitations.assessmentId, assessmentId),
        inArray(assessmentInvitations.status, ['pending', 'sent', 'viewed', 'started'])
      )
    );

  if (pending.length === 0) {
    return c.json({ data: { reminded: 0 } });
  }

  // Bulk update: increment reminder count, set timestamps
  await db.update(assessmentInvitations)
    .set({
      lastReminderAt: new Date(),
      status: 'sent',
      sentAt: new Date(),
      reminderCount: sql`(COALESCE(${assessmentInvitations.reminderCount}::int, 0) + 1)::text`,
    })
    .where(inArray(assessmentInvitations.id, pending.map((i) => i.id)));

  // Fetch assessment name for email subject
  const [assessment] = await db
    .select({ name: assessments.name })
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  // Send reminder emails
  const raterIds = pending.map((inv) => inv.raterId);
  const raters = await db
    .select({ id: users.id, email: users.email, firstName: users.firstName })
    .from(users)
    .where(inArray(users.id, raterIds));

  const raterMap = new Map(raters.map((r) => [r.id, r]));

  await Promise.allSettled(
    pending.map(async (inv) => {
      const rater = raterMap.get(inv.raterId);
      if (!rater) return;
      const reminderCount = parseInt(inv.reminderCount || '0', 10) + 1;
      await sendAssessmentReminder({
        to: rater.email,
        name: rater.firstName,
        assessorName: assessment?.name ?? 'Assessment',
        assessmentName: assessment?.name ?? 'Assessment',
        respondUrl: `${env.APP_URL}/respond/${inv.accessToken}`,
        reminderCount,
      });
    })
  );

  return c.json({ data: { reminded: pending.length } });
});

// ============================================
// RESULTS & CLOSE ROUTES
// ============================================

/**
 * GET /api/tenants/:tenantId/assessments/:assessmentId/results
 * Get computed results for an assessment
 */
assessmentsRoutes.get('/:assessmentId/results', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (!assessment.computedResults) {
    return c.json(
      { error: { code: 'NO_RESULTS', message: 'Results have not been computed yet. Close the assessment or trigger computation.' } },
      404
    );
  }

  return c.json({ data: assessment.computedResults });
});

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/results/compute
 * Trigger (re)computation of results
 */
assessmentsRoutes.post('/:assessmentId/results/compute', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (assessment.status === 'draft') {
    throw new BadRequestError('Cannot compute results for a draft assessment');
  }

  const results = await computeAssessmentResults(assessmentId);
  return c.json({ data: results });
});

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/close
 * Close the assessment and compute results
 */
assessmentsRoutes.post('/:assessmentId/close', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (assessment.status !== 'open') {
    throw new BadRequestError('Only open assessments can be closed');
  }

  // Expire all pending invitations
  await db
    .update(assessmentInvitations)
    .set({ status: 'expired' })
    .where(
      and(
        eq(assessmentInvitations.assessmentId, assessmentId),
        inArray(assessmentInvitations.status, ['pending', 'sent', 'viewed', 'started'])
      )
    );

  // Set status to closed
  await db
    .update(assessments)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(eq(assessments.id, assessmentId));

  // Compute results
  const results = await computeAssessmentResults(assessmentId);

  // Mark as completed
  await db
    .update(assessments)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(assessments.id, assessmentId));

  return c.json({
    data: {
      status: 'completed',
      results,
    },
  });
});

/**
 * GET /api/tenants/:tenantId/assessments/:assessmentId/report/pdf
 * Generate and download PDF report
 */
assessmentsRoutes.get('/:assessmentId/report/pdf', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  // Verify assessment belongs to tenant
  const [assessment] = await db
    .select({ id: assessments.id, status: assessments.status, computedResults: assessments.computedResults, name: assessments.name })
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (!assessment.computedResults) {
    throw new BadRequestError('Results must be computed before generating a report. Close the assessment first.');
  }

  const pdfBuffer = await generateAssessmentReport(assessmentId);

  const filename = `${assessment.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
});

// ============================================
// GOAL INTEGRATION ROUTES
// ============================================

/**
 * GET /api/tenants/:tenantId/assessments/:assessmentId/goals
 * Get goals linked to this assessment
 */
assessmentsRoutes.get('/:assessmentId/goals', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  // Verify assessment belongs to tenant
  const [assessment] = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  const goals = await db
    .select()
    .from(individualGoals)
    .where(eq(individualGoals.assessmentId, assessmentId));

  return c.json({ data: goals });
});

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/goals
 * Auto-create development goals from assessment results
 */
assessmentsRoutes.post('/:assessmentId/goals', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId))
    )
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (!assessment.computedResults) {
    throw new BadRequestError('Results must be computed before creating goals');
  }

  const results = assessment.computedResults as ComputedAssessmentResults;

  // Check if goals already exist for this assessment
  const existingGoals = await db
    .select({ id: individualGoals.id })
    .from(individualGoals)
    .where(eq(individualGoals.assessmentId, assessmentId));

  if (existingGoals.length > 0) {
    throw new BadRequestError('Goals have already been created from this assessment');
  }

  // Create goals from development areas (bottom competencies + blind spots)
  const goalsToCreate: {
    userId: string;
    tenantId: string;
    assessmentId: string;
    title: string;
    description: string;
    category: 'development';
    priority: 'high' | 'medium';
    status: 'draft';
  }[] = [];

  // From development areas
  for (const area of results.developmentAreas) {
    const cs = results.competencyScores.find(
      (c) => c.competencyName === area
    );
    const gap = results.gapAnalysis.find(
      (g) => g.competencyName === area
    );

    const description = gap
      ? `Development goal based on assessment results. ${gap.interpretation} Current score: ${cs?.overallAverage?.toFixed(1) ?? 'N/A'} / ${5}.`
      : `Development goal for ${area} based on assessment results.`;

    goalsToCreate.push({
      userId: assessment.subjectId,
      tenantId,
      assessmentId,
      title: `Develop ${area}`,
      description,
      category: 'development',
      priority: 'high',
      status: 'draft',
    });
  }

  // From blind spots (self > others by significant margin)
  for (const gap of results.gapAnalysis) {
    if (
      gap.classification === 'blind_spot' &&
      !results.developmentAreas.includes(gap.competencyName)
    ) {
      goalsToCreate.push({
        userId: assessment.subjectId,
        tenantId,
        assessmentId,
        title: `Address blind spot: ${gap.competencyName}`,
        description: `${gap.interpretation} Gap: ${gap.gap > 0 ? '+' : ''}${gap.gap.toFixed(1)}. Focus on understanding how others perceive your ${gap.competencyName.toLowerCase()} skills.`,
        category: 'development',
        priority: 'medium',
        status: 'draft',
      });
    }
  }

  if (goalsToCreate.length === 0) {
    return c.json({
      data: [],
      message: 'No development areas or blind spots found to create goals from.',
    });
  }

  const created = await db
    .insert(individualGoals)
    .values(goalsToCreate)
    .returning();

  return c.json({ data: created }, 201);
});
