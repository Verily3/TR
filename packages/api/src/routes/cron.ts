import { Hono } from 'hono';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { env } from '../lib/env.js';
import {
  sendWeeklyDigest,
  sendInactivityReminder,
} from '../lib/email.js';

const { enrollments, programs, users, lessonProgress } = schema;

export const cronRoutes = new Hono();

/**
 * POST /api/cron/notifications
 * Scheduled jobs: weekly digest, inactivity reminders, due date reminders.
 * Secured by X-Cron-Secret header.
 *
 * Local testing:
 *   curl -X POST http://localhost:3002/api/cron/notifications \
 *     -H "X-Cron-Secret: your-secret"
 */
cronRoutes.post('/notifications', async (c) => {
  // Verify cron secret
  const secret = c.req.header('X-Cron-Secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } }, 401);
  }

  const results = {
    weeklyDigest: { sent: 0, errors: 0 },
    inactivityReminders: { sent: 0, errors: 0 },
  };

  // ─── Job 1: Weekly digest ────────────────────────────────────────────────────
  // Send to active learner enrollments in programs that have weeklyDigest enabled
  // and today matches the configured digest day (default: Monday = 1)
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...

  try {
    const activeEnrollments = await db
      .select({
        enrollment: {
          id: enrollments.id,
          progress: enrollments.progress,
          pointsEarned: enrollments.pointsEarned,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
        },
        program: {
          id: programs.id,
          name: programs.name,
          config: programs.config,
        },
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.role, 'learner'),
          eq(enrollments.status, 'active'),
          isNull(enrollments.completedAt)
        )
      );

    for (const row of activeEnrollments) {
      const emailSettings = row.program.config?.emailSettings;
      const digestEnabled = emailSettings?.weeklyDigest !== false;
      const digestDay = typeof emailSettings?.weeklyDigestDay === 'number'
        ? emailSettings.weeklyDigestDay
        : 1; // Monday by default

      if (!digestEnabled || today !== digestDay) continue;

      // Count completed lessons via enrollment
      const [{ modulesCompleted }] = await db
        .select({ modulesCompleted: sql<number>`count(*)` })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.enrollmentId, row.enrollment.id),
            eq(lessonProgress.status, 'completed')
          )
        );

      try {
        await sendWeeklyDigest({
          to: row.user.email,
          name: row.user.firstName,
          programName: row.program.name,
          progress: Math.round(Number(row.enrollment.progress) || 0),
          modulesCompleted: Number(modulesCompleted),
          pointsEarned: Number(row.enrollment.pointsEarned) || 0,
          nextUrl: `${env.APP_URL}/programs/${row.program.id}`,
        });
        results.weeklyDigest.sent++;
      } catch {
        results.weeklyDigest.errors++;
      }
    }
  } catch (err) {
    console.error('[cron] Weekly digest job failed:', err);
  }

  // ─── Job 2: Inactivity reminders ─────────────────────────────────────────────
  // Find active enrollments where the learner hasn't completed any lesson in 7+ days
  try {
    const INACTIVE_DAYS = 7;
    const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);

    const activeEnrollments = await db
      .select({
        enrollment: { id: enrollments.id },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
        },
        program: {
          id: programs.id,
          name: programs.name,
          config: programs.config,
        },
        lastActivity: sql<Date>`max(${lessonProgress.updatedAt})`,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .leftJoin(
        lessonProgress,
        eq(lessonProgress.enrollmentId, enrollments.id)
      )
      .where(
        and(
          eq(enrollments.role, 'learner'),
          eq(enrollments.status, 'active'),
          isNull(enrollments.completedAt)
        )
      )
      .groupBy(enrollments.id, users.id, programs.id);

    for (const row of activeEnrollments) {
      const emailSettings = row.program.config?.emailSettings;
      const inactivityEnabled = emailSettings?.inactivityReminders !== false;
      if (!inactivityEnabled) continue;

      // Only remind if last activity is older than cutoff (or null = never active)
      if (row.lastActivity && new Date(row.lastActivity) > cutoff) continue;

      const daysSinceActive = row.lastActivity
        ? Math.floor((Date.now() - new Date(row.lastActivity).getTime()) / (24 * 60 * 60 * 1000))
        : INACTIVE_DAYS;

      try {
        await sendInactivityReminder({
          to: row.user.email,
          name: row.user.firstName,
          programName: row.program.name,
          daysSinceActive,
          resumeUrl: `${env.APP_URL}/programs/${row.program.id}/learn`,
        });
        results.inactivityReminders.sent++;
      } catch {
        results.inactivityReminders.errors++;
      }
    }
  } catch (err) {
    console.error('[cron] Inactivity reminders job failed:', err);
  }

  return c.json({
    data: {
      success: true,
      results,
      ranAt: new Date().toISOString(),
    },
  });
});
