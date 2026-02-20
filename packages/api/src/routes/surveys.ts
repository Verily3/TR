import { Hono } from 'hono';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '@tr/db';
import {
  surveys,
  surveyQuestions,
  surveyResponses,
  type SurveyQuestionConfig,
} from '@tr/db/schema';
import { randomBytes } from 'crypto';
import type { Variables } from '../types/context.js';

// ── Tenant-scoped router (mounted at /api/tenants/:tenantId/surveys) ──────────
export const surveysRoutes = new Hono<{ Variables: Variables }>();

// ── Agency-scoped router (mounted at /api/agencies/me/surveys) ────────────────
export const agencySurveysRoutes = new Hono<{ Variables: Variables }>();

// ── Public router (mounted at /api/surveys) ────────────────────────────────────
export const publicSurveyRoutes = new Hono();

// ── Helper: generate share token ──────────────────────────────────────────────
function generateShareToken(): string {
  return randomBytes(32).toString('hex');
}

// ── Helper: aggregate results per question ────────────────────────────────────
async function computeSurveyResults(surveyId: string) {
  const questions = await db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId))
    .orderBy(surveyQuestions.order);

  const responses = await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId));

  const totalResponses = responses.length;

  const results = questions.map((q) => {
    const allAnswers = responses
      .map((r) => (r.answers as Record<string, unknown>)[q.id])
      .filter((a) => a != null);

    switch (q.type) {
      case 'single_choice':
      case 'yes_no': {
        const config = (q.config ?? {}) as SurveyQuestionConfig;
        const opts = config.options ?? (q.type === 'yes_no' ? ['Yes', 'No'] : []);
        const counts: Record<string, number> = {};
        for (const opt of opts) counts[opt] = 0;
        for (const ans of allAnswers) {
          const key = String(ans);
          counts[key] = (counts[key] ?? 0) + 1;
        }
        return {
          questionId: q.id,
          type: q.type,
          text: q.text,
          totalAnswers: allAnswers.length,
          data: opts.map((opt) => ({
            label: opt,
            count: counts[opt] ?? 0,
            percent: allAnswers.length > 0 ? Math.round(((counts[opt] ?? 0) / allAnswers.length) * 100) : 0,
          })),
        };
      }

      case 'multiple_choice': {
        const config = (q.config ?? {}) as SurveyQuestionConfig;
        const opts = config.options ?? [];
        const counts: Record<string, number> = {};
        for (const opt of opts) counts[opt] = 0;
        for (const ans of allAnswers) {
          if (Array.isArray(ans)) {
            for (const item of ans) counts[String(item)] = (counts[String(item)] ?? 0) + 1;
          }
        }
        return {
          questionId: q.id,
          type: q.type,
          text: q.text,
          totalAnswers: allAnswers.length,
          data: opts.map((opt) => ({
            label: opt,
            count: counts[opt] ?? 0,
            percent: allAnswers.length > 0 ? Math.round(((counts[opt] ?? 0) / allAnswers.length) * 100) : 0,
          })),
        };
      }

      case 'rating': {
        const nums = allAnswers.map(Number).filter((n) => !isNaN(n));
        const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        const config = (q.config ?? {}) as SurveyQuestionConfig;
        const min = config.min ?? 1;
        const max = config.max ?? 5;
        const distribution: { value: number; count: number }[] = [];
        for (let v = min; v <= max; v++) {
          distribution.push({ value: v, count: nums.filter((n) => n === v).length });
        }
        return {
          questionId: q.id,
          type: q.type,
          text: q.text,
          totalAnswers: nums.length,
          data: { average: Math.round(avg * 10) / 10, distribution },
        };
      }

      case 'nps': {
        const nums = allAnswers.map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 10);
        const promoters = nums.filter((n) => n >= 9).length;
        const detractors = nums.filter((n) => n <= 6).length;
        const passives = nums.filter((n) => n === 7 || n === 8).length;
        const npsScore = nums.length > 0
          ? Math.round(((promoters - detractors) / nums.length) * 100)
          : 0;
        return {
          questionId: q.id,
          type: q.type,
          text: q.text,
          totalAnswers: nums.length,
          data: { npsScore, promoters, passives, detractors },
        };
      }

      case 'text': {
        return {
          questionId: q.id,
          type: q.type,
          text: q.text,
          totalAnswers: allAnswers.length,
          data: { responses: allAnswers.map(String).slice(0, 100) },
        };
      }

      case 'ranking': {
        const config = (q.config ?? {}) as SurveyQuestionConfig;
        const items = config.items ?? [];
        const rankSums: Record<string, number> = {};
        const rankCounts: Record<string, number> = {};
        for (const item of items) {
          rankSums[item] = 0;
          rankCounts[item] = 0;
        }
        for (const ans of allAnswers) {
          if (Array.isArray(ans)) {
            ans.forEach((item, idx) => {
              const key = String(item);
              rankSums[key] = (rankSums[key] ?? 0) + (idx + 1);
              rankCounts[key] = (rankCounts[key] ?? 0) + 1;
            });
          }
        }
        const ranked = items
          .map((item) => ({
            item,
            avgRank: rankCounts[item] > 0 ? rankSums[item] / rankCounts[item] : Infinity,
          }))
          .sort((a, b) => a.avgRank - b.avgRank);
        return {
          questionId: q.id,
          type: q.type,
          text: q.text,
          totalAnswers: allAnswers.length,
          data: ranked.map((r) => ({ item: r.item, avgRank: Math.round(r.avgRank * 10) / 10 })),
        };
      }

      default:
        return { questionId: q.id, type: q.type, text: q.text, totalAnswers: 0, data: null };
    }
  });

  return { totalResponses, questions: results };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TENANT ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/tenants/:tenantId/surveys
surveysRoutes.get('/', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const status = c.req.query('status');

  const conditions = [eq(surveys.tenantId, tenantId)];
  if (status) conditions.push(eq(surveys.status, status as 'draft' | 'active' | 'closed'));

  const rows = await db
    .select()
    .from(surveys)
    .where(and(...conditions))
    .orderBy(desc(surveys.createdAt));

  // Attach question count and response count
  const ids = rows.map((s) => s.id);
  let questionCounts: Record<string, number> = {};
  let responseCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const qCounts = await db
      .select({ surveyId: surveyQuestions.surveyId, count: sql<number>`count(*)::int` })
      .from(surveyQuestions)
      .where(inArray(surveyQuestions.surveyId, ids))
      .groupBy(surveyQuestions.surveyId);
    questionCounts = Object.fromEntries(qCounts.map((r) => [r.surveyId, r.count]));

    const rCounts = await db
      .select({ surveyId: surveyResponses.surveyId, count: sql<number>`count(*)::int` })
      .from(surveyResponses)
      .where(inArray(surveyResponses.surveyId, ids))
      .groupBy(surveyResponses.surveyId);
    responseCounts = Object.fromEntries(rCounts.map((r) => [r.surveyId, r.count]));
  }

  return c.json({
    data: rows.map((s) => ({
      ...s,
      questionCount: questionCounts[s.id] ?? 0,
      responseCount: responseCounts[s.id] ?? 0,
    })),
  });
});

// POST /api/tenants/:tenantId/surveys
surveysRoutes.post('/', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const user = c.get('user');
  const body = await c.req.json();

  const [survey] = await db
    .insert(surveys)
    .values({
      tenantId,
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? 'draft',
      anonymous: body.anonymous ?? false,
      requireLogin: body.requireLogin ?? true,
      allowMultipleResponses: body.allowMultipleResponses ?? false,
      showResultsToRespondent: body.showResultsToRespondent ?? false,
      shareToken: generateShareToken(),
      createdBy: user.id,
    })
    .returning();

  return c.json({ data: survey }, 201);
});

// GET /api/tenants/:tenantId/surveys/:surveyId
surveysRoutes.get('/:surveyId', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;

  const [survey] = await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));

  if (!survey) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const questions = await db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId))
    .orderBy(surveyQuestions.order);

  const [responseCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId));

  return c.json({ data: { ...survey, questions, responseCount: responseCount?.count ?? 0 } });
});

// PUT /api/tenants/:tenantId/surveys/:surveyId
surveysRoutes.put('/:surveyId', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;
  const body = await c.req.json();

  const [existing] = await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));

  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const updateFields: Partial<typeof surveys.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.anonymous !== undefined) updateFields.anonymous = body.anonymous;
  if (body.requireLogin !== undefined) updateFields.requireLogin = body.requireLogin;
  if (body.allowMultipleResponses !== undefined) updateFields.allowMultipleResponses = body.allowMultipleResponses;
  if (body.showResultsToRespondent !== undefined) updateFields.showResultsToRespondent = body.showResultsToRespondent;

  const [updated] = await db
    .update(surveys)
    .set(updateFields)
    .where(eq(surveys.id, surveyId))
    .returning();

  return c.json({ data: updated });
});

// DELETE /api/tenants/:tenantId/surveys/:surveyId
surveysRoutes.delete('/:surveyId', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;

  const [existing] = await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));

  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  await db.delete(surveys).where(eq(surveys.id, surveyId));
  return c.json({ data: { success: true } });
});

// ── Questions CRUD ─────────────────────────────────────────────────────────────

// POST /api/tenants/:tenantId/surveys/:surveyId/questions
surveysRoutes.post('/:surveyId/questions', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;
  const body = await c.req.json();

  const [existing] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  // Auto-assign order
  const [maxOrder] = await db
    .select({ maxOrder: sql<number>`coalesce(max("order"), -1)::int` })
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId));

  const [question] = await db
    .insert(surveyQuestions)
    .values({
      surveyId,
      text: body.text,
      description: body.description ?? null,
      type: body.type,
      required: body.required ?? true,
      order: body.order ?? (maxOrder?.maxOrder ?? -1) + 1,
      config: body.config ?? null,
    })
    .returning();

  return c.json({ data: question }, 201);
});

// PUT /api/tenants/:tenantId/surveys/:surveyId/questions/:questionId
surveysRoutes.put('/:surveyId/questions/:questionId', async (c) => {
  const surveyId = c.req.param('surveyId')!;
  const questionId = c.req.param('questionId')!;
  const body = await c.req.json();

  const [existing] = await db
    .select({ id: surveyQuestions.id })
    .from(surveyQuestions)
    .where(and(eq(surveyQuestions.id, questionId), eq(surveyQuestions.surveyId, surveyId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Question not found' } }, 404);

  const updateFields: Partial<typeof surveyQuestions.$inferInsert> = {};
  if (body.text !== undefined) updateFields.text = body.text;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.type !== undefined) updateFields.type = body.type;
  if (body.required !== undefined) updateFields.required = body.required;
  if (body.order !== undefined) updateFields.order = body.order;
  if (body.config !== undefined) updateFields.config = body.config;

  const [updated] = await db
    .update(surveyQuestions)
    .set(updateFields)
    .where(eq(surveyQuestions.id, questionId))
    .returning();

  return c.json({ data: updated });
});

// DELETE /api/tenants/:tenantId/surveys/:surveyId/questions/:questionId
surveysRoutes.delete('/:surveyId/questions/:questionId', async (c) => {
  const surveyId = c.req.param('surveyId')!;
  const questionId = c.req.param('questionId')!;

  await db
    .delete(surveyQuestions)
    .where(and(eq(surveyQuestions.id, questionId), eq(surveyQuestions.surveyId, surveyId)));

  return c.json({ data: { success: true } });
});

// POST /api/tenants/:tenantId/surveys/:surveyId/questions/reorder
surveysRoutes.post('/:surveyId/questions/reorder', async (c) => {
  const surveyId = c.req.param('surveyId')!;
  const body = await c.req.json<{ orderedIds: string[] }>();

  await Promise.all(
    body.orderedIds.map((id, idx) =>
      db
        .update(surveyQuestions)
        .set({ order: idx })
        .where(and(eq(surveyQuestions.id, id), eq(surveyQuestions.surveyId, surveyId)))
    )
  );

  return c.json({ data: { success: true } });
});

// ── Aggregated Results ─────────────────────────────────────────────────────────

// GET /api/tenants/:tenantId/surveys/:surveyId/results
surveysRoutes.get('/:surveyId/results', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;

  const [existing] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const results = await computeSurveyResults(surveyId);
  return c.json({ data: results });
});

// GET /api/tenants/:tenantId/surveys/:surveyId/responses (admin: individual)
surveysRoutes.get('/:surveyId/responses', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;

  const [existing] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const page = parseInt(c.req.query('page') ?? '1');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 100);
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .orderBy(desc(surveyResponses.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data: rows });
});

// POST /api/tenants/:tenantId/surveys/:surveyId/respond (authenticated)
surveysRoutes.post('/:surveyId/respond', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;
  const user = c.get('user');
  const body = await c.req.json();

  const [survey] = await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));
  if (!survey) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);
  if (survey.status !== 'active') {
    return c.json({ error: { code: 'SURVEY_CLOSED', message: 'This survey is not accepting responses' } }, 409);
  }

  // Check for existing response if multiple not allowed
  if (!survey.allowMultipleResponses) {
    const [existing] = await db
      .select({ id: surveyResponses.id })
      .from(surveyResponses)
      .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.userId, user.id)));
    if (existing) {
      return c.json({ error: { code: 'ALREADY_RESPONDED', message: 'You have already submitted a response' } }, 409);
    }
  }

  const [response] = await db
    .insert(surveyResponses)
    .values({
      surveyId,
      userId: user.id,
      enrollmentId: body.enrollmentId ?? null,
      answers: body.answers ?? {},
      completedAt: new Date(),
    })
    .returning();

  return c.json({ data: response }, 201);
});

// GET /api/tenants/:tenantId/surveys/:surveyId/my-response
surveysRoutes.get('/:surveyId/my-response', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const surveyId = c.req.param('surveyId')!;
  const user = c.get('user');

  const [existing] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const [response] = await db
    .select()
    .from(surveyResponses)
    .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.userId, user.id)))
    .orderBy(desc(surveyResponses.createdAt));

  return c.json({ data: response ?? null });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AGENCY ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/agencies/me/surveys
agencySurveysRoutes.get('/', async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId;
  if (!agencyId) return c.json({ error: { code: 'FORBIDDEN', message: 'Agency access required' } }, 403);

  const rows = await db
    .select()
    .from(surveys)
    .where(eq(surveys.agencyId, agencyId))
    .orderBy(desc(surveys.createdAt));

  return c.json({ data: rows });
});

// POST /api/agencies/me/surveys
agencySurveysRoutes.post('/', async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId;
  if (!agencyId) return c.json({ error: { code: 'FORBIDDEN', message: 'Agency access required' } }, 403);

  const body = await c.req.json();
  const [survey] = await db
    .insert(surveys)
    .values({
      agencyId,
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? 'draft',
      anonymous: body.anonymous ?? false,
      requireLogin: body.requireLogin ?? true,
      allowMultipleResponses: body.allowMultipleResponses ?? false,
      showResultsToRespondent: body.showResultsToRespondent ?? false,
      shareToken: generateShareToken(),
      createdBy: user.id,
    })
    .returning();

  return c.json({ data: survey }, 201);
});

// GET /api/agencies/me/surveys/:surveyId
agencySurveysRoutes.get('/:surveyId', async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId;
  if (!agencyId) return c.json({ error: { code: 'FORBIDDEN', message: 'Agency access required' } }, 403);

  const surveyId = c.req.param('surveyId')!;
  const [survey] = await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.agencyId, agencyId)));
  if (!survey) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const questions = await db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId))
    .orderBy(surveyQuestions.order);

  return c.json({ data: { ...survey, questions } });
});

// PUT /api/agencies/me/surveys/:surveyId
agencySurveysRoutes.put('/:surveyId', async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId;
  if (!agencyId) return c.json({ error: { code: 'FORBIDDEN', message: 'Agency access required' } }, 403);

  const surveyId = c.req.param('surveyId')!;
  const body = await c.req.json();

  const [existing] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.agencyId, agencyId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const updateFields: Partial<typeof surveys.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.anonymous !== undefined) updateFields.anonymous = body.anonymous;
  if (body.requireLogin !== undefined) updateFields.requireLogin = body.requireLogin;
  if (body.allowMultipleResponses !== undefined) updateFields.allowMultipleResponses = body.allowMultipleResponses;
  if (body.showResultsToRespondent !== undefined) updateFields.showResultsToRespondent = body.showResultsToRespondent;

  const [updated] = await db.update(surveys).set(updateFields).where(eq(surveys.id, surveyId)).returning();
  return c.json({ data: updated });
});

// DELETE /api/agencies/me/surveys/:surveyId
agencySurveysRoutes.delete('/:surveyId', async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId;
  if (!agencyId) return c.json({ error: { code: 'FORBIDDEN', message: 'Agency access required' } }, 403);

  const surveyId = c.req.param('surveyId')!;
  const [existing] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.agencyId, agencyId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  await db.delete(surveys).where(eq(surveys.id, surveyId));
  return c.json({ data: { success: true } });
});

// Agency surveys also get question CRUD (same pattern as tenant)
agencySurveysRoutes.post('/:surveyId/questions', async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId;
  if (!agencyId) return c.json({ error: { code: 'FORBIDDEN', message: 'Agency access required' } }, 403);

  const surveyId = c.req.param('surveyId')!;
  const body = await c.req.json();

  const [existing] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.agencyId, agencyId)));
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);

  const [maxOrder] = await db
    .select({ maxOrder: sql<number>`coalesce(max("order"), -1)::int` })
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId));

  const [question] = await db
    .insert(surveyQuestions)
    .values({
      surveyId,
      text: body.text,
      description: body.description ?? null,
      type: body.type,
      required: body.required ?? true,
      order: body.order ?? (maxOrder?.maxOrder ?? -1) + 1,
      config: body.config ?? null,
    })
    .returning();

  return c.json({ data: question }, 201);
});

agencySurveysRoutes.put('/:surveyId/questions/:questionId', async (c) => {
  const surveyId = c.req.param('surveyId')!;
  const questionId = c.req.param('questionId')!;
  const body = await c.req.json();

  const updateFields: Partial<typeof surveyQuestions.$inferInsert> = {};
  if (body.text !== undefined) updateFields.text = body.text;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.type !== undefined) updateFields.type = body.type;
  if (body.required !== undefined) updateFields.required = body.required;
  if (body.order !== undefined) updateFields.order = body.order;
  if (body.config !== undefined) updateFields.config = body.config;

  const [updated] = await db
    .update(surveyQuestions)
    .set(updateFields)
    .where(and(eq(surveyQuestions.id, questionId), eq(surveyQuestions.surveyId, surveyId)))
    .returning();

  return c.json({ data: updated });
});

agencySurveysRoutes.delete('/:surveyId/questions/:questionId', async (c) => {
  const surveyId = c.req.param('surveyId')!;
  const questionId = c.req.param('questionId')!;
  await db
    .delete(surveyQuestions)
    .where(and(eq(surveyQuestions.id, questionId), eq(surveyQuestions.surveyId, surveyId)));
  return c.json({ data: { success: true } });
});

agencySurveysRoutes.get('/:surveyId/results', async (c) => {
  const user = c.get('user');
  const agencyId = user.agencyId;
  if (!agencyId) return c.json({ error: { code: 'FORBIDDEN', message: 'Agency access required' } }, 403);

  const surveyId = c.req.param('surveyId')!;
  const results = await computeSurveyResults(surveyId);
  return c.json({ data: results });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC ROUTES (no auth)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/surveys/:shareToken
publicSurveyRoutes.get('/:shareToken', async (c) => {
  const shareToken = c.req.param('shareToken')!;

  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.shareToken, shareToken));

  if (!survey) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);
  if (survey.status !== 'active') {
    return c.json({ error: { code: 'SURVEY_CLOSED', message: 'This survey is closed or not yet active' } }, 410);
  }
  if (survey.requireLogin) {
    return c.json({ error: { code: 'LOGIN_REQUIRED', message: 'This survey requires you to log in first' } }, 401);
  }

  const questions = await db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, survey.id))
    .orderBy(surveyQuestions.order);

  return c.json({ data: { ...survey, questions } });
});

// POST /api/surveys/:shareToken/respond
publicSurveyRoutes.post('/:shareToken/respond', async (c) => {
  const shareToken = c.req.param('shareToken')!;
  const body = await c.req.json();

  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.shareToken, shareToken));

  if (!survey) return c.json({ error: { code: 'NOT_FOUND', message: 'Survey not found' } }, 404);
  if (survey.status !== 'active') {
    return c.json({ error: { code: 'SURVEY_CLOSED', message: 'This survey is closed' } }, 409);
  }

  // Deduplicate by sessionToken for anonymous surveys
  if (!survey.allowMultipleResponses && body.sessionToken) {
    const [existing] = await db
      .select({ id: surveyResponses.id })
      .from(surveyResponses)
      .where(
        and(
          eq(surveyResponses.surveyId, survey.id),
          eq(surveyResponses.sessionToken, body.sessionToken)
        )
      );
    if (existing) {
      return c.json({ error: { code: 'ALREADY_RESPONDED', message: 'You have already submitted a response' } }, 409);
    }
  }

  const [response] = await db
    .insert(surveyResponses)
    .values({
      surveyId: survey.id,
      sessionToken: body.sessionToken ?? null,
      answers: body.answers ?? {},
      completedAt: new Date(),
    })
    .returning();

  const result: { data: typeof response; surveyResults?: unknown } = { data: response };

  if (survey.showResultsToRespondent) {
    result.surveyResults = await computeSurveyResults(survey.id);
  }

  return c.json(result, 201);
});
