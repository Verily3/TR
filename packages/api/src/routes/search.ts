import { Hono } from 'hono';
import { ilike, and, eq, or } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type { Variables } from '../types/context.js';

const { programs, users, individualGoals, assessments } = schema;

export const searchRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET /api/tenants/:tenantId/search?q=
 *
 * Full-text search across programs, people, goals, and assessments
 * for a given tenant. Returns up to 5 results per category.
 */
searchRoutes.get('/', async (c) => {
  const tenantId = c.req.param('tenantId')!;
  const q = (c.req.query('q') ?? '').trim();

  if (!q || q.length < 2) {
    return c.json({
      data: { programs: [], people: [], goals: [], assessments: [] },
    });
  }

  const like = `%${q}%`;

  const [programResults, peopleResults, goalResults, assessmentResults] = await Promise.all([
    // Programs
    db
      .select({
        id: programs.id,
        name: programs.name,
        description: programs.description,
        status: programs.status,
      })
      .from(programs)
      .where(
        and(
          eq(programs.tenantId, tenantId),
          or(ilike(programs.name, like), ilike(programs.description, like))
        )
      )
      .limit(5),

    // People (users in this tenant)
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        title: users.title,
        department: users.department,
      })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          or(
            ilike(users.firstName, like),
            ilike(users.lastName, like),
            ilike(users.email, like),
            ilike(users.title, like)
          )
        )
      )
      .limit(5),

    // Goals
    db
      .select({
        id: individualGoals.id,
        title: individualGoals.title,
        description: individualGoals.description,
        status: individualGoals.status,
        category: individualGoals.category,
      })
      .from(individualGoals)
      .where(
        and(
          eq(individualGoals.tenantId, tenantId),
          or(ilike(individualGoals.title, like), ilike(individualGoals.description, like))
        )
      )
      .limit(5),

    // Assessments
    db
      .select({
        id: assessments.id,
        name: assessments.name,
        subjectFirstName: assessments.subjectFirstName,
        subjectLastName: assessments.subjectLastName,
        status: assessments.status,
      })
      .from(assessments)
      .where(
        and(
          eq(assessments.tenantId, tenantId),
          or(
            ilike(assessments.name, like),
            ilike(assessments.subjectFirstName, like),
            ilike(assessments.subjectLastName, like)
          )
        )
      )
      .limit(5),
  ]);

  return c.json({
    data: {
      programs: programResults.map((p) => ({
        id: p.id,
        type: 'program' as const,
        title: p.name,
        subtitle: p.status,
        url: `/programs/${p.id}`,
      })),
      people: peopleResults.map((u) => ({
        id: u.id,
        type: 'person' as const,
        title: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
        subtitle: [u.title, u.department].filter(Boolean).join(' · ') || u.email,
        url: `/people?highlight=${u.id}`,
      })),
      goals: goalResults.map((g) => ({
        id: g.id,
        type: 'goal' as const,
        title: g.title,
        subtitle: `${g.category} · ${g.status}`,
        url: `/planning`,
      })),
      assessments: assessmentResults.map((a) => ({
        id: a.id,
        type: 'assessment' as const,
        title: a.name,
        subtitle: [a.subjectFirstName, a.subjectLastName].filter(Boolean).join(' ') || a.status,
        url: `/assessments`,
      })),
    },
  });
});
