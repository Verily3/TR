import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js';
import type { Variables } from '../types/context.js';

const { assessments, assessmentInvitations, assessmentResponses } = schema;

// ============================
// AUTHENTICATED RESPONSE ROUTES
// ============================

export const assessmentResponseRoutes = new Hono<{ Variables: Variables }>();

const responseDataSchema = z.object({
  competencyId: z.string().min(1),
  questionId: z.string().min(1),
  rating: z.number().int().min(1).max(10).optional(),
  text: z.string().optional(),
  comment: z.string().optional(),
});

const submitResponseSchema = z.object({
  responses: z.array(responseDataSchema).min(1),
  overallComments: z.string().optional(),
});

/**
 * GET /api/tenants/:tenantId/assessments/:assessmentId/responses/mine
 * Get the current user's response for this assessment
 */
assessmentResponseRoutes.get('/mine', async (c) => {
  const assessmentId = c.req.param('assessmentId')!;
  const user = c.get('user');

  // Find the user's invitation
  const [invitation] = await db
    .select()
    .from(assessmentInvitations)
    .where(
      and(
        eq(assessmentInvitations.assessmentId, assessmentId),
        eq(assessmentInvitations.raterId, user.id)
      )
    )
    .limit(1);

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  // Find their response
  const [response] = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.invitationId, invitation.id))
    .limit(1);

  return c.json({
    data: {
      invitation,
      response: response || null,
    },
  });
});

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/responses
 * Submit or save a draft response
 */
assessmentResponseRoutes.post('/', zValidator('json', submitResponseSchema), async (c) => {
  const assessmentId = c.req.param('assessmentId')!;
  const user = c.get('user');
  const body = c.req.valid('json');

  // Verify assessment is open
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');
  if (assessment.status !== 'open') {
    throw new BadRequestError('Assessment is not open for responses');
  }

  // Find the user's invitation
  const [invitation] = await db
    .select()
    .from(assessmentInvitations)
    .where(
      and(
        eq(assessmentInvitations.assessmentId, assessmentId),
        eq(assessmentInvitations.raterId, user.id)
      )
    )
    .limit(1);

  if (!invitation) {
    throw new ForbiddenError('You are not invited to this assessment');
  }

  if (invitation.status === 'completed') {
    throw new BadRequestError('Response already submitted');
  }

  // Upsert response
  const [existing] = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.invitationId, invitation.id))
    .limit(1);

  let response;
  if (existing) {
    [response] = await db
      .update(assessmentResponses)
      .set({
        responses: body.responses,
        overallComments: body.overallComments ?? null,
        updatedAt: new Date(),
      })
      .where(eq(assessmentResponses.id, existing.id))
      .returning();
  } else {
    [response] = await db
      .insert(assessmentResponses)
      .values({
        invitationId: invitation.id,
        responses: body.responses,
        overallComments: body.overallComments ?? null,
        isComplete: false,
      })
      .returning();

    // Update invitation status to started
    if (
      invitation.status === 'pending' ||
      invitation.status === 'sent' ||
      invitation.status === 'viewed'
    ) {
      await db
        .update(assessmentInvitations)
        .set({ status: 'started', startedAt: new Date() })
        .where(eq(assessmentInvitations.id, invitation.id));
    }
  }

  return c.json({ data: response }, existing ? 200 : 201);
});

/**
 * POST /api/tenants/:tenantId/assessments/:assessmentId/responses/submit
 * Finalize and submit the response
 */
assessmentResponseRoutes.post('/submit', zValidator('json', submitResponseSchema), async (c) => {
  const assessmentId = c.req.param('assessmentId')!;
  const user = c.get('user');
  const body = c.req.valid('json');

  // Verify assessment is open
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');
  if (assessment.status !== 'open') {
    throw new BadRequestError('Assessment is not open for responses');
  }

  // Find the user's invitation
  const [invitation] = await db
    .select()
    .from(assessmentInvitations)
    .where(
      and(
        eq(assessmentInvitations.assessmentId, assessmentId),
        eq(assessmentInvitations.raterId, user.id)
      )
    )
    .limit(1);

  if (!invitation) {
    throw new ForbiddenError('You are not invited to this assessment');
  }

  if (invitation.status === 'completed') {
    throw new BadRequestError('Response already submitted');
  }

  // Upsert response as complete
  const [existing] = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.invitationId, invitation.id))
    .limit(1);

  let response;
  if (existing) {
    [response] = await db
      .update(assessmentResponses)
      .set({
        responses: body.responses,
        overallComments: body.overallComments ?? null,
        isComplete: true,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assessmentResponses.id, existing.id))
      .returning();
  } else {
    [response] = await db
      .insert(assessmentResponses)
      .values({
        invitationId: invitation.id,
        responses: body.responses,
        overallComments: body.overallComments ?? null,
        isComplete: true,
        submittedAt: new Date(),
      })
      .returning();
  }

  // Mark invitation as completed
  await db
    .update(assessmentInvitations)
    .set({ status: 'completed', completedAt: new Date() })
    .where(eq(assessmentInvitations.id, invitation.id));

  return c.json({ data: response });
});

/**
 * PUT /api/tenants/:tenantId/assessments/:assessmentId/responses/:responseId
 * Update a draft response (only if not yet submitted)
 */
assessmentResponseRoutes.put(
  '/:responseId',
  zValidator('json', submitResponseSchema),
  async (c) => {
    const responseId = c.req.param('responseId')!;
    const user = c.get('user');
    const body = c.req.valid('json');

    // Find the response
    const [existing] = await db
      .select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.id, responseId))
      .limit(1);

    if (!existing) throw new NotFoundError('Response');
    if (existing.isComplete) {
      throw new BadRequestError('Cannot update a submitted response');
    }

    // Verify ownership via invitation
    const [invitation] = await db
      .select()
      .from(assessmentInvitations)
      .where(eq(assessmentInvitations.id, existing.invitationId))
      .limit(1);

    if (!invitation || invitation.raterId !== user.id) {
      throw new ForbiddenError('You cannot update this response');
    }

    const [updated] = await db
      .update(assessmentResponses)
      .set({
        responses: body.responses,
        overallComments: body.overallComments ?? null,
        updatedAt: new Date(),
      })
      .where(eq(assessmentResponses.id, responseId))
      .returning();

    return c.json({ data: updated });
  }
);

// ============================
// PUBLIC TOKEN-BASED ROUTES
// ============================

export const publicAssessmentRoutes = new Hono();

/**
 * GET /api/assessments/respond/:accessToken
 * Get assessment info for a rater using their access token (no auth required)
 */
publicAssessmentRoutes.get('/:accessToken', async (c) => {
  const accessToken = c.req.param('accessToken')!;

  const [invitation] = await db
    .select()
    .from(assessmentInvitations)
    .where(eq(assessmentInvitations.accessToken, accessToken))
    .limit(1);

  if (!invitation) {
    throw new NotFoundError('Invalid or expired access token');
  }

  // Fetch assessment + template
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, invitation.assessmentId))
    .limit(1);

  if (!assessment) throw new NotFoundError('Assessment');

  const [template] = await db
    .select({
      id: schema.assessmentTemplates.id,
      name: schema.assessmentTemplates.name,
      assessmentType: schema.assessmentTemplates.assessmentType,
      config: schema.assessmentTemplates.config,
    })
    .from(schema.assessmentTemplates)
    .where(eq(schema.assessmentTemplates.id, assessment.templateId))
    .limit(1);

  // Fetch existing draft response (if any)
  const [existingResponse] = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.invitationId, invitation.id))
    .limit(1);

  // Mark as viewed
  if (invitation.status === 'pending' || invitation.status === 'sent') {
    await db
      .update(assessmentInvitations)
      .set({ status: 'viewed', viewedAt: new Date() })
      .where(eq(assessmentInvitations.id, invitation.id));
  }

  const subjectName =
    [assessment.subjectFirstName, assessment.subjectLastName].filter(Boolean).join(' ') ||
    'the subject';

  return c.json({
    data: {
      assessment: {
        id: assessment.id,
        name: assessment.name,
        description: assessment.description,
        status: assessment.status,
        closeDate: assessment.closeDate,
        subjectName,
      },
      template,
      invitation: {
        id: invitation.id,
        raterType: invitation.raterType,
        status: invitation.status,
      },
      existingResponse: existingResponse || null,
    },
  });
});

/**
 * POST /api/assessments/respond/:accessToken
 * Submit a response using an access token (no auth required)
 */
publicAssessmentRoutes.post(
  '/:accessToken',
  zValidator('json', submitResponseSchema),
  async (c) => {
    const accessToken = c.req.param('accessToken')!;
    const body = c.req.valid('json');

    const [invitation] = await db
      .select()
      .from(assessmentInvitations)
      .where(eq(assessmentInvitations.accessToken, accessToken))
      .limit(1);

    if (!invitation) {
      throw new NotFoundError('Invalid or expired access token');
    }

    // Verify assessment is open (allow resubmission while open)
    const [assessment] = await db
      .select({ status: assessments.status })
      .from(assessments)
      .where(eq(assessments.id, invitation.assessmentId))
      .limit(1);

    if (!assessment || assessment.status !== 'open') {
      throw new BadRequestError('Assessment is not open for responses');
    }

    // Upsert response
    const [existing] = await db
      .select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.invitationId, invitation.id))
      .limit(1);

    let response;
    if (existing) {
      [response] = await db
        .update(assessmentResponses)
        .set({
          responses: body.responses,
          overallComments: body.overallComments ?? null,
          isComplete: true,
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assessmentResponses.id, existing.id))
        .returning();
    } else {
      [response] = await db
        .insert(assessmentResponses)
        .values({
          invitationId: invitation.id,
          responses: body.responses,
          overallComments: body.overallComments ?? null,
          isComplete: true,
          submittedAt: new Date(),
        })
        .returning();
    }

    // Mark invitation as completed
    await db
      .update(assessmentInvitations)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(assessmentInvitations.id, invitation.id));

    return c.json({ data: { success: true, responseId: response.id } });
  }
);
