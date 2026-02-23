import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, count, sql, inArray } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import {
  sendAssessmentInvitation,
  sendAssessmentReminder,
  sendSubjectInvitation,
} from '../lib/email.js';
import { createNotification } from '../lib/notifications.js';
import { env } from '../lib/env.js';
import { computeAssessmentResults } from '../lib/assessment-engine.js';
import { generateAssessmentReport } from '../lib/pdf/report-generator.js';
import type { ComputedAssessmentResults } from '@tr/db/schema';
import type { Variables } from '../types/context.js';

const { assessments, assessmentTemplates, assessmentInvitations, individualGoals, users } = schema;

export const assessmentsRoutes = new Hono<{ Variables: Variables }>();
export const publicAssessmentSetupRoutes = new Hono();

// Zod schemas
const createAssessmentSchema = z
  .object({
    templateId: z.string().uuid(),
    // Either subjectId (existing user) OR external subject fields
    subjectId: z.string().uuid().optional(),
    subjectEmail: z
      .string()
      .email()
      .transform((v) => v.toLowerCase().trim())
      .optional(),
    subjectFirstName: z.string().min(1).max(100).optional(),
    subjectLastName: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    openDate: z.string().optional(),
    closeDate: z.string().optional(),
    anonymizeResults: z.boolean().default(true),
    showResultsToSubject: z.boolean().default(true),
    subjectCanAddRaters: z.boolean().default(true),
    programId: z.string().uuid().optional(),
    enrollmentId: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      data.subjectId || (data.subjectEmail && data.subjectFirstName && data.subjectLastName),
    { message: 'Either subjectId or subject email + first name + last name is required' }
  );

const updateAssessmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'open', 'closed', 'completed']).optional(),
  openDate: z.string().nullable().optional(),
  closeDate: z.string().nullable().optional(),
  anonymizeResults: z.boolean().optional(),
  showResultsToSubject: z.boolean().optional(),
  subjectCanAddRaters: z.boolean().optional(),
});

const addInvitationsSchema = z.object({
  invitations: z
    .array(
      z
        .object({
          // Either raterId (existing user) OR external rater fields
          raterId: z.string().uuid().optional(),
          raterEmail: z
            .string()
            .email()
            .transform((v) => v.toLowerCase().trim())
            .optional(),
          raterFirstName: z.string().min(1).max(100).optional(),
          raterLastName: z.string().min(1).max(100).optional(),
          raterType: z.enum(['self', 'manager', 'peer', 'direct_report']),
          addedBy: z.enum(['admin', 'subject']).default('admin'),
        })
        .refine(
          (data) => data.raterId || (data.raterEmail && data.raterFirstName && data.raterLastName),
          { message: 'Either raterId or rater email + name is required' }
        )
    )
    .min(1),
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
  let invitationCounts: Record<string, { total: number; completed: number }> = {};

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

  // Fetch subject info for registered users
  const subjectIds = [...new Set(rows.map((a) => a.subjectId).filter(Boolean))] as string[];
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
    subject: a.subjectId
      ? subjectMap[a.subjectId] || null
      : a.subjectEmail
        ? {
            firstName: a.subjectFirstName ?? '',
            lastName: a.subjectLastName ?? '',
            email: a.subjectEmail,
          }
        : null,
    template: templateMap[a.templateId] || null,
    invitationStats: invitationCounts[a.id] || { total: 0, completed: 0 },
    responseRate:
      invitationCounts[a.id] && invitationCounts[a.id].total > 0
        ? Math.round((invitationCounts[a.id].completed / invitationCounts[a.id].total) * 100)
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
      activeAssessments: allAssessments.filter((a) => a.status === 'open').length,
      completedAssessments: allAssessments.filter((a) => a.status === 'completed').length,
      draftAssessments: allAssessments.filter((a) => a.status === 'draft').length,
      pendingResponses: totalInvited - totalCompleted,
      averageResponseRate: totalInvited > 0 ? Math.round((totalCompleted / totalInvited) * 100) : 0,
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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
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

  // Fetch subject (may be null for external subjects)
  let subject: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    title: string | null;
    avatar: string | null;
  } | null = null;
  if (assessment.subjectId) {
    const [row] = await db
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
    subject = row ?? null;
  } else if (assessment.subjectEmail) {
    subject = {
      id: '',
      firstName: assessment.subjectFirstName ?? '',
      lastName: assessment.subjectLastName ?? '',
      email: assessment.subjectEmail,
      title: null,
      avatar: null,
    };
  }

  // Fetch invitations with rater info (supports both registered and external raters)
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
      addedBy: assessmentInvitations.addedBy,
      // From invitation record (external raters)
      invRaterEmail: assessmentInvitations.raterEmail,
      invRaterFirstName: assessmentInvitations.raterFirstName,
      invRaterLastName: assessmentInvitations.raterLastName,
      // From users table (registered raters)
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
      userAvatar: users.avatar,
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
    addedBy: inv.addedBy ?? 'admin',
    rater: {
      id: inv.raterId ?? null,
      firstName: inv.userFirstName ?? inv.invRaterFirstName ?? null,
      lastName: inv.userLastName ?? inv.invRaterLastName ?? null,
      email: inv.userEmail ?? inv.invRaterEmail ?? null,
      avatar: inv.userAvatar ?? null,
    },
  }));

  const totalInvited = invitations.length;
  const totalCompleted = invitations.filter((inv) => inv.status === 'completed').length;

  return c.json({
    data: {
      ...assessment,
      template,
      subject,
      invitations: invitationsFormatted,
      invitationStats: { total: totalInvited, completed: totalCompleted },
      responseRate: totalInvited > 0 ? Math.round((totalCompleted / totalInvited) * 100) : 0,
    },
  });
});

/**
 * POST /api/tenants/:tenantId/assessments
 * Create assessment from template
 */
assessmentsRoutes.post('/', zValidator('json', createAssessmentSchema), async (c) => {
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

  // Generate setup token for subjects who can add their own raters
  const subjectSetupToken = crypto.randomUUID().replace(/-/g, '').slice(0, 48);

  const [assessment] = await db
    .insert(assessments)
    .values({
      templateId: body.templateId,
      tenantId,
      subjectId: body.subjectId ?? null,
      subjectEmail: body.subjectEmail ?? null,
      subjectFirstName: body.subjectFirstName ?? null,
      subjectLastName: body.subjectLastName ?? null,
      subjectSetupToken,
      subjectCanAddRaters: body.subjectCanAddRaters ?? true,
      createdBy: user.id,
      name: body.name,
      description: body.description,
      openDate: body.openDate ?? null,
      closeDate: body.closeDate ?? null,
      anonymizeResults: body.anonymizeResults,
      showResultsToSubject: body.showResultsToSubject,
      programId: body.programId ?? null,
      enrollmentId: body.enrollmentId ?? null,
      status: 'open',
    })
    .returning();

  // Send subject invitation email if external subject or if subject should add raters
  if (body.subjectCanAddRaters !== false) {
    const setupUrl = `${env.APP_URL}/assessment-setup/${subjectSetupToken}`;
    if (body.subjectEmail && body.subjectFirstName) {
      // External subject — send invitation
      await sendSubjectInvitation({
        to: body.subjectEmail,
        name: `${body.subjectFirstName} ${body.subjectLastName ?? ''}`.trim(),
        assessmentName: body.name,
        setupUrl,
      }).catch((err) => console.error('[email] Failed to send subject invitation:', err));
    } else if (body.subjectId) {
      // Registered subject — look up and send
      const [subjectUser] = await db
        .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, body.subjectId))
        .limit(1);
      if (subjectUser) {
        await sendSubjectInvitation({
          to: subjectUser.email,
          name: `${subjectUser.firstName} ${subjectUser.lastName}`,
          assessmentName: body.name,
          setupUrl,
        }).catch((err) => console.error('[email] Failed to send subject invitation:', err));
      }
    }
  }

  return c.json({ data: assessment }, 201);
});

/**
 * PUT /api/tenants/:tenantId/assessments/:assessmentId
 * Update assessment
 */
assessmentsRoutes.put('/:assessmentId', zValidator('json', updateAssessmentSchema), async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const assessmentId = c.req.param('assessmentId')!;
  const body = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
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
  if (body.showResultsToSubject !== undefined)
    updateData.showResultsToSubject = body.showResultsToSubject;
  if (body.subjectCanAddRaters !== undefined)
    updateData.subjectCanAddRaters = body.subjectCanAddRaters;

  const [updated] = await db
    .update(assessments)
    .set(updateData)
    .where(eq(assessments.id, assessmentId))
    .returning();

  return c.json({ data: updated });
});

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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Assessment');
  }

  if (existing.status === 'open') {
    throw new BadRequestError('Cannot delete an open assessment. Close it first.');
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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
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
      addedBy: assessmentInvitations.addedBy,
      invRaterEmail: assessmentInvitations.raterEmail,
      invRaterFirstName: assessmentInvitations.raterFirstName,
      invRaterLastName: assessmentInvitations.raterLastName,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
      userAvatar: users.avatar,
    })
    .from(assessmentInvitations)
    .leftJoin(users, eq(assessmentInvitations.raterId, users.id))
    .where(eq(assessmentInvitations.assessmentId, assessmentId))
    .orderBy(assessmentInvitations.raterType);

  const data = invitations.map((inv) => ({
    id: inv.id,
    raterId: inv.raterId,
    raterType: inv.raterType,
    status: inv.status,
    accessToken: inv.accessToken,
    sentAt: inv.sentAt,
    viewedAt: inv.viewedAt,
    startedAt: inv.startedAt,
    completedAt: inv.completedAt,
    reminderCount: inv.reminderCount,
    lastReminderAt: inv.lastReminderAt,
    addedBy: inv.addedBy ?? 'admin',
    rater: {
      id: inv.raterId ?? null,
      firstName: inv.userFirstName ?? inv.invRaterFirstName ?? null,
      lastName: inv.userLastName ?? inv.invRaterLastName ?? null,
      email: inv.userEmail ?? inv.invRaterEmail ?? null,
      avatar: inv.userAvatar ?? null,
    },
  }));

  return c.json({ data });
});

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/invitations
 * Batch add rater invitations (supports both registered and external raters)
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
      .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
      .limit(1);

    if (!assessment) {
      throw new NotFoundError('Assessment');
    }

    // Determine subject name for email context
    let subjectName = assessment.name;
    if (assessment.subjectFirstName) {
      subjectName = `${assessment.subjectFirstName} ${assessment.subjectLastName ?? ''}`.trim();
    }

    // Insert invitations — support both registered and external raters
    const values = body.invitations.map((inv) => ({
      assessmentId,
      raterId: inv.raterId ?? null,
      raterEmail: inv.raterEmail ?? null,
      raterFirstName: inv.raterFirstName ?? null,
      raterLastName: inv.raterLastName ?? null,
      addedBy: inv.addedBy ?? 'admin',
      raterType: inv.raterType as 'self' | 'manager' | 'peer' | 'direct_report',
      status: 'pending' as const,
      accessToken: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
    }));

    const inserted = await db.insert(assessmentInvitations).values(values).returning();

    // Fetch registered rater details for email
    const registeredRaterIds = inserted.map((inv) => inv.raterId).filter(Boolean) as string[];
    const registeredRaters =
      registeredRaterIds.length > 0
        ? await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(inArray(users.id, registeredRaterIds))
        : [];
    const raterMap = new Map(registeredRaters.map((r) => [r.id, r]));

    // Send invitation emails + in-app notifications
    await Promise.allSettled(
      inserted.map(async (inv) => {
        const respondUrl = `${env.APP_URL}/respond/${inv.accessToken}`;
        let raterEmail: string | undefined;
        let raterName: string | undefined;
        let raterId: string | undefined;

        if (inv.raterId) {
          const rater = raterMap.get(inv.raterId);
          if (rater) {
            raterEmail = rater.email;
            raterName = rater.firstName;
            raterId = rater.id;
          }
        } else if (inv.raterEmail) {
          raterEmail = inv.raterEmail;
          raterName = inv.raterFirstName ?? 'there';
        }

        if (!raterEmail) return;

        await sendAssessmentInvitation({
          to: raterEmail,
          name: raterName ?? 'there',
          assessorName: subjectName,
          assessmentName: assessment.name,
          respondUrl,
        });

        if (raterId) {
          await createNotification({
            userId: raterId,
            type: 'assessment_invite',
            title: 'Assessment invitation',
            message: `You've been invited to complete the "${assessment.name}" assessment.`,
            actionUrl: respondUrl,
            actionLabel: 'Start Assessment',
          });
        }
      })
    );

    // Mark all inserted as 'sent'
    if (inserted.length > 0) {
      await db
        .update(assessmentInvitations)
        .set({ status: 'sent', sentAt: new Date() })
        .where(
          inArray(
            assessmentInvitations.id,
            inserted.map((i) => i.id)
          )
        );
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
        .enum(['pending', 'sent', 'viewed', 'started', 'completed', 'declined', 'expired'])
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
assessmentsRoutes.delete('/:assessmentId/invitations/:invitationId', async (c) => {
  const invitationId = c.req.param('invitationId')!;

  const [deleted] = await db
    .delete(assessmentInvitations)
    .where(eq(assessmentInvitations.id, invitationId))
    .returning();

  if (!deleted) {
    throw new NotFoundError('Invitation');
  }

  return c.json({ success: true });
});

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
  await db
    .update(assessmentInvitations)
    .set({
      lastReminderAt: new Date(),
      status: 'sent',
      sentAt: new Date(),
      reminderCount: sql`(COALESCE(${assessmentInvitations.reminderCount}::int, 0) + 1)::text`,
    })
    .where(
      inArray(
        assessmentInvitations.id,
        pending.map((i) => i.id)
      )
    );

  // Fetch assessment name for email subject
  const [assessment] = await db
    .select({ name: assessments.name })
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  // Send reminder emails (supports both registered and external raters)
  const registeredRaterIds = pending.map((inv) => inv.raterId).filter(Boolean) as string[];
  const raters =
    registeredRaterIds.length > 0
      ? await db
          .select({ id: users.id, email: users.email, firstName: users.firstName })
          .from(users)
          .where(inArray(users.id, registeredRaterIds))
      : [];

  const raterMap = new Map(raters.map((r) => [r.id, r]));

  await Promise.allSettled(
    pending.map(async (inv) => {
      let email: string | undefined;
      let name: string | undefined;

      if (inv.raterId) {
        const rater = raterMap.get(inv.raterId);
        if (rater) {
          email = rater.email;
          name = rater.firstName;
        }
      } else if (inv.raterEmail) {
        email = inv.raterEmail;
        name = inv.raterFirstName ?? 'there';
      }

      if (!email) return;
      const reminderCount = parseInt(inv.reminderCount || '0', 10) + 1;
      await sendAssessmentReminder({
        to: email,
        name: name ?? 'there',
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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (!assessment.computedResults) {
    return c.json(
      {
        error: {
          code: 'NO_RESULTS',
          message:
            'Results have not been computed yet. Close the assessment or trigger computation.',
        },
      },
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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
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
    .select({
      id: assessments.id,
      status: assessments.status,
      computedResults: assessments.computedResults,
      name: assessments.name,
    })
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (!assessment.computedResults) {
    throw new BadRequestError(
      'Results must be computed before generating a report. Close the assessment first.'
    );
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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
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
    .where(and(eq(assessments.id, assessmentId), eq(assessments.tenantId, tenantId)))
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  if (!assessment.computedResults) {
    throw new BadRequestError('Results must be computed before creating goals');
  }

  if (!assessment.subjectId) {
    throw new BadRequestError(
      'Goals can only be created for assessments with a registered subject'
    );
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
    const cs = results.competencyScores.find((c) => c.competencyName === area);
    const gap = results.gapAnalysis.find((g) => g.competencyName === area);

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

  const created = await db.insert(individualGoals).values(goalsToCreate).returning();

  return c.json({ data: created }, 201);
});

// ============================================
// PUBLIC ASSESSMENT SETUP ROUTES
// (Mounted before auth middleware in app.ts)
// ============================================

/**
 * GET /api/assessments/setup/:token
 * Public: Get assessment setup info for the subject
 */
publicAssessmentSetupRoutes.get('/:token', async (c) => {
  const token = c.req.param('token')!;

  const [assessment] = await db
    .select({
      id: assessments.id,
      name: assessments.name,
      description: assessments.description,
      subjectFirstName: assessments.subjectFirstName,
      subjectLastName: assessments.subjectLastName,
      subjectEmail: assessments.subjectEmail,
      subjectCanAddRaters: assessments.subjectCanAddRaters,
      subjectSetupCompletedAt: assessments.subjectSetupCompletedAt,
      templateId: assessments.templateId,
      closeDate: assessments.closeDate,
    })
    .from(assessments)
    .where(eq(assessments.subjectSetupToken, token))
    .limit(1);

  if (!assessment) {
    return c.json({ error: { message: 'Invalid or expired setup link' } }, 404);
  }

  // Fetch template name
  const [template] = await db
    .select({ name: assessmentTemplates.name, assessmentType: assessmentTemplates.assessmentType })
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.id, assessment.templateId))
    .limit(1);

  // Fetch existing raters
  const raters = await db
    .select({
      id: assessmentInvitations.id,
      raterId: assessmentInvitations.raterId,
      raterType: assessmentInvitations.raterType,
      status: assessmentInvitations.status,
      addedBy: assessmentInvitations.addedBy,
      invRaterEmail: assessmentInvitations.raterEmail,
      invRaterFirstName: assessmentInvitations.raterFirstName,
      invRaterLastName: assessmentInvitations.raterLastName,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
    })
    .from(assessmentInvitations)
    .leftJoin(users, eq(assessmentInvitations.raterId, users.id))
    .where(eq(assessmentInvitations.assessmentId, assessment.id));

  const ratersFormatted = raters.map((r) => ({
    id: r.id,
    raterType: r.raterType,
    status: r.status,
    addedBy: r.addedBy ?? 'admin',
    firstName: r.userFirstName ?? r.invRaterFirstName ?? null,
    lastName: r.userLastName ?? r.invRaterLastName ?? null,
    email: r.userEmail ?? r.invRaterEmail ?? null,
  }));

  return c.json({
    data: {
      ...assessment,
      template: template ?? null,
      raters: ratersFormatted,
    },
  });
});

/**
 * POST /api/assessments/setup/:token/raters
 * Public: Subject submits their rater list
 */
publicAssessmentSetupRoutes.post('/:token/raters', async (c) => {
  const token = c.req.param('token')!;

  const body = await c.req.json<{
    raters: { firstName: string; lastName: string; email: string; raterType: string }[];
  }>();

  if (!body?.raters || !Array.isArray(body.raters) || body.raters.length === 0) {
    return c.json({ error: { message: 'At least one rater is required' } }, 400);
  }

  const [assessment] = await db
    .select({
      id: assessments.id,
      name: assessments.name,
      subjectCanAddRaters: assessments.subjectCanAddRaters,
      subjectSetupCompletedAt: assessments.subjectSetupCompletedAt,
    })
    .from(assessments)
    .where(eq(assessments.subjectSetupToken, token))
    .limit(1);

  if (!assessment) {
    return c.json({ error: { message: 'Invalid or expired setup link' } }, 404);
  }

  if (!assessment.subjectCanAddRaters) {
    return c.json(
      { error: { message: 'This assessment does not allow subject-added raters' } },
      403
    );
  }

  // Allow re-submission only if not yet completed
  const values = body.raters.map((r) => ({
    assessmentId: assessment.id,
    raterId: null,
    raterEmail: r.email,
    raterFirstName: r.firstName,
    raterLastName: r.lastName,
    raterType: r.raterType as 'self' | 'manager' | 'peer' | 'direct_report',
    addedBy: 'subject',
    status: 'pending' as const,
    accessToken: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
  }));

  const inserted = await db.insert(assessmentInvitations).values(values).returning();

  // Send invitation emails to the raters
  await Promise.allSettled(
    inserted.map(async (inv) => {
      if (!inv.raterEmail) return;
      const respondUrl = `${env.APP_URL}/respond/${inv.accessToken}`;
      await sendAssessmentInvitation({
        to: inv.raterEmail,
        name: inv.raterFirstName ?? 'there',
        assessorName: assessment.name,
        assessmentName: assessment.name,
        respondUrl,
      });
    })
  );

  // Mark as sent
  await db
    .update(assessmentInvitations)
    .set({ status: 'sent', sentAt: new Date() })
    .where(
      inArray(
        assessmentInvitations.id,
        inserted.map((i) => i.id)
      )
    );

  // Mark setup as completed
  await db
    .update(assessments)
    .set({ subjectSetupCompletedAt: new Date() })
    .where(eq(assessments.subjectSetupToken, token));

  return c.json({ data: { added: inserted.length } }, 201);
});
