import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { NotFoundError } from '../lib/errors.js';
import type { Variables } from '../types/context.js';

const { onboardingProgress, enrollments, programs, users } = schema;

export const onboardingRoutes = new Hono<{ Variables: Variables }>();

// Validation schemas
const updateProgressSchema = z.object({
  currentStep: z.string().min(1).max(50),
  completedSteps: z
    .array(
      z.object({
        stepId: z.string(),
        completedAt: z.string().datetime(),
      })
    )
    .optional(),
  formData: z.record(z.record(z.unknown())).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']).optional(),
});

/**
 * Onboarding step definitions by type
 */
const ONBOARDING_STEPS = {
  program_only: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to the program' },
    { id: 'prework', title: 'Prework', description: 'Complete prework instructions' },
    { id: 'setup', title: 'Setup', description: 'Set up your profile' },
  ],
  strategic_planning: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to strategic planning' },
    { id: 'organization', title: 'Organization', description: 'Set up your organization' },
    { id: 'team', title: 'Team', description: 'Invite your team' },
    { id: 'goals', title: 'Goals', description: 'Set your initial goals' },
  ],
  full_platform: [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to Transformation OS' },
    { id: 'profile', title: 'Profile', description: 'Complete your profile' },
    { id: 'organization', title: 'Organization', description: 'Set up your organization' },
    { id: 'team', title: 'Team', description: 'Invite your team' },
    { id: 'programs', title: 'Programs', description: 'Explore available programs' },
    { id: 'goals', title: 'Goals', description: 'Set your initial goals' },
    { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
  ],
};

type OnboardingType = keyof typeof ONBOARDING_STEPS;

/**
 * Determine onboarding type based on user's context
 */
async function determineOnboardingType(
  userId: string,
  tenantId?: string,
  programId?: string
): Promise<OnboardingType> {
  // If specific program, use program-only flow
  if (programId) {
    return 'program_only';
  }

  // Check if user is enrolled in any programs
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  // If user has programs, use strategic planning flow (mix of both)
  if (Number(count) > 0) {
    return 'strategic_planning';
  }

  // Default to full platform onboarding
  return 'full_platform';
}

/**
 * GET /api/onboarding/path
 * Get user's onboarding steps based on their context
 */
onboardingRoutes.get('/path', async (c) => {
  const user = c.get('user');
  const programId = c.req.query('programId');

  const onboardingType = await determineOnboardingType(
    user.id,
    user.tenantId || undefined,
    programId
  );

  const steps = ONBOARDING_STEPS[onboardingType];

  // Check for existing progress
  const [existingProgress] = await db
    .select()
    .from(onboardingProgress)
    .where(
      and(
        eq(onboardingProgress.userId, user.id),
        programId
          ? eq(onboardingProgress.programId, programId)
          : isNull(onboardingProgress.programId)
      )
    )
    .limit(1);

  return c.json({
    data: {
      onboardingType,
      steps,
      currentStep: existingProgress?.currentStep || steps[0].id,
      completedSteps: existingProgress?.completedSteps || [],
      formData: existingProgress?.formData || {},
      status: existingProgress?.status || 'not_started',
    },
  });
});

/**
 * GET /api/onboarding/resume
 * Get the last position to resume from
 */
onboardingRoutes.get('/resume', async (c) => {
  const user = c.get('user');
  const programId = c.req.query('programId');

  const [progress] = await db
    .select()
    .from(onboardingProgress)
    .where(
      and(
        eq(onboardingProgress.userId, user.id),
        programId
          ? eq(onboardingProgress.programId, programId)
          : isNull(onboardingProgress.programId)
      )
    )
    .limit(1);

  if (!progress) {
    return c.json({
      data: {
        hasProgress: false,
        currentStep: null,
        formData: {},
      },
    });
  }

  // Determine onboarding type
  const onboardingType = await determineOnboardingType(
    user.id,
    user.tenantId || undefined,
    programId
  );

  const steps = ONBOARDING_STEPS[onboardingType];

  return c.json({
    data: {
      hasProgress: true,
      currentStep: progress.currentStep,
      completedSteps: progress.completedSteps,
      formData: progress.formData,
      status: progress.status,
      lastActivityAt: progress.lastActivityAt,
      steps,
    },
  });
});

/**
 * PUT /api/onboarding/progress
 * Auto-save onboarding progress
 */
onboardingRoutes.put(
  '/progress',
  zValidator('json', updateProgressSchema),
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const programId = c.req.query('programId');

    // Check for existing progress
    const [existing] = await db
      .select()
      .from(onboardingProgress)
      .where(
        and(
          eq(onboardingProgress.userId, user.id),
          programId
            ? eq(onboardingProgress.programId, programId)
            : isNull(onboardingProgress.programId)
        )
      )
      .limit(1);

    // Determine onboarding type
    const onboardingType = await determineOnboardingType(
      user.id,
      user.tenantId || undefined,
      programId
    );

    const now = new Date();

    if (existing) {
      // Update existing progress
      const updateData: Partial<typeof existing> = {
        currentStep: body.currentStep,
        lastActivityAt: now,
        updatedAt: now,
      };

      if (body.completedSteps) {
        updateData.completedSteps = body.completedSteps;
      }

      if (body.formData) {
        // Merge form data (don't replace entirely)
        updateData.formData = {
          ...(existing.formData || {}),
          ...body.formData,
        };
      }

      if (body.status) {
        updateData.status = body.status;
        if (body.status === 'completed') {
          updateData.completedAt = now;
        }
      }

      const [updated] = await db
        .update(onboardingProgress)
        .set(updateData)
        .where(eq(onboardingProgress.id, existing.id))
        .returning();

      return c.json({ data: updated });
    } else {
      // Create new progress record
      const [created] = await db
        .insert(onboardingProgress)
        .values({
          userId: user.id,
          tenantId: user.tenantId,
          programId: programId || null,
          onboardingType,
          currentStep: body.currentStep,
          completedSteps: body.completedSteps || [],
          formData: body.formData || {},
          status: body.status || 'in_progress',
          startedAt: now,
          lastActivityAt: now,
        })
        .returning();

      return c.json({ data: created }, 201);
    }
  }
);

/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete
 */
onboardingRoutes.post('/complete', async (c) => {
  const user = c.get('user');
  const programId = c.req.query('programId');

  const [existing] = await db
    .select()
    .from(onboardingProgress)
    .where(
      and(
        eq(onboardingProgress.userId, user.id),
        programId
          ? eq(onboardingProgress.programId, programId)
          : isNull(onboardingProgress.programId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Onboarding progress');
  }

  const now = new Date();

  const [updated] = await db
    .update(onboardingProgress)
    .set({
      status: 'completed',
      completedAt: now,
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(onboardingProgress.id, existing.id))
    .returning();

  return c.json({ data: updated });
});

/**
 * POST /api/onboarding/skip
 * Skip onboarding
 */
onboardingRoutes.post('/skip', async (c) => {
  const user = c.get('user');
  const programId = c.req.query('programId');

  const now = new Date();

  // Determine onboarding type
  const onboardingType = await determineOnboardingType(
    user.id,
    user.tenantId || undefined,
    programId
  );

  // Upsert - create if not exists, update if exists
  const [existing] = await db
    .select()
    .from(onboardingProgress)
    .where(
      and(
        eq(onboardingProgress.userId, user.id),
        programId
          ? eq(onboardingProgress.programId, programId)
          : isNull(onboardingProgress.programId)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(onboardingProgress)
      .set({
        status: 'skipped',
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(onboardingProgress.id, existing.id))
      .returning();

    return c.json({ data: updated });
  } else {
    const [created] = await db
      .insert(onboardingProgress)
      .values({
        userId: user.id,
        tenantId: user.tenantId,
        programId: programId || null,
        onboardingType,
        currentStep: 'skipped',
        completedSteps: [],
        formData: {},
        status: 'skipped',
        startedAt: now,
        lastActivityAt: now,
      })
      .returning();

    return c.json({ data: created }, 201);
  }
});
