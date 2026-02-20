import { Hono } from 'hono';
import { eq, and, isNull, sql, gte, lt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db, schema } from '@tr/db';
import { env } from '../lib/env.js';
import {
  sendWeeklyDigest,
  sendInactivityReminder,
  sendProgramKickoff,
  sendMentorSummary,
} from '../lib/email.js';
import { resolveEmailContent } from '../lib/email-resolver.js';

const { enrollments, programs, users, lessonProgress, enrollmentMentorships } = schema;

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
    kickoff: { sent: 0, errors: 0 },
    mentorSummary: { sent: 0, errors: 0 },
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
          agencyId: programs.agencyId,
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
      const digestDay = typeof emailSettings?.weeklyDigestDay === 'number'
        ? emailSettings.weeklyDigestDay
        : 1; // Monday by default

      if (today !== digestDay) continue;

      const resolved = await resolveEmailContent({
        emailType: 'weeklyDigest',
        agencyId: row.program.agencyId ?? null,
        programConfig: emailSettings,
        userId: row.user.id,
        defaults: { subject: `Your weekly progress in ${row.program.name}`, body: '' },
      });
      if (!resolved.enabled) continue;

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
          overrides: { subject: resolved.subject || undefined, body: resolved.body || undefined },
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
          agencyId: programs.agencyId,
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

      // Only remind if last activity is older than cutoff (or null = never active)
      if (row.lastActivity && new Date(row.lastActivity) > cutoff) continue;

      const daysSinceActive = row.lastActivity
        ? Math.floor((Date.now() - new Date(row.lastActivity).getTime()) / (24 * 60 * 60 * 1000))
        : INACTIVE_DAYS;

      const resolved = await resolveEmailContent({
        emailType: 'inactivity',
        agencyId: row.program.agencyId ?? null,
        programConfig: emailSettings,
        userId: row.user.id,
        defaults: { subject: 'We miss you — pick up where you left off', body: '' },
      });
      if (!resolved.enabled) continue;

      try {
        await sendInactivityReminder({
          to: row.user.email,
          name: row.user.firstName,
          programName: row.program.name,
          daysSinceActive,
          resumeUrl: `${env.APP_URL}/programs/${row.program.id}/learn`,
          overrides: { subject: resolved.subject || undefined, body: resolved.body || undefined },
        });
        results.inactivityReminders.sent++;
      } catch {
        results.inactivityReminders.errors++;
      }
    }
  } catch (err) {
    console.error('[cron] Inactivity reminders job failed:', err);
  }

  // ─── Job 3: Program kickoff emails ────────────────────────────────────────────
  // Send kickoff to all active learners in programs whose startDate is today
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const kickoffEnrollments = await db
      .select({
        user: { id: users.id, email: users.email, firstName: users.firstName },
        program: { id: programs.id, name: programs.name, agencyId: programs.agencyId, config: programs.config },
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .where(
        and(
          eq(enrollments.role, 'learner'),
          eq(enrollments.status, 'active'),
          gte(programs.startDate, todayStart),
          lt(programs.startDate, todayEnd)
        )
      );

    for (const row of kickoffEnrollments) {
      const resolved = await resolveEmailContent({
        emailType: 'kickoff',
        agencyId: row.program.agencyId,
        programConfig: row.program.config?.emailSettings,
        userId: row.user.id,
        defaults: { subject: `${row.program.name} starts today`, body: '' },
      });
      if (!resolved.enabled) continue;

      try {
        await sendProgramKickoff({
          to: row.user.email,
          name: row.user.firstName,
          programName: row.program.name,
          programUrl: `${env.APP_URL}/programs/${row.program.id}`,
          overrides: { subject: resolved.subject || undefined, body: resolved.body || undefined },
        });
        results.kickoff.sent++;
      } catch {
        results.kickoff.errors++;
      }
    }
  } catch (err) {
    console.error('[cron] Kickoff job failed:', err);
  }

  // ─── Job 4: Mentor summary emails ─────────────────────────────────────────────
  // Send weekly/biweekly progress summaries to mentors about their mentees
  try {
    // Query mentor-learner relationships via enrollment_mentorships
    // Use alias to join users twice: once as mentor, once as mentee
    const mentorUsers = alias(users, 'mentor_users');
    const menteeUsers = alias(users, 'mentee_users');

    const mentorships = await db
      .select({
        mentor: { id: mentorUsers.id, email: mentorUsers.email, firstName: mentorUsers.firstName },
        menteeProgress: enrollments.progress,
        menteeName: menteeUsers.firstName,
        program: { id: programs.id, name: programs.name, agencyId: programs.agencyId, config: programs.config },
      })
      .from(enrollmentMentorships)
      .innerJoin(enrollments, eq(enrollmentMentorships.enrollmentId, enrollments.id))
      .innerJoin(programs, eq(enrollments.programId, programs.id))
      .innerJoin(mentorUsers, eq(enrollmentMentorships.mentorUserId, mentorUsers.id))
      .innerJoin(menteeUsers, eq(enrollments.userId, menteeUsers.id))
      .where(eq(enrollments.status, 'active'));

    // Group by mentor
    type MentorGroup = { mentor: { id: string; email: string; firstName: string }; mentees: Array<{ name: string; programName: string; progress: number }>; agencyId: string; programConfig: typeof mentorships[0]['program']['config'] };
    const byMentor = new Map<string, MentorGroup>();

    for (const row of mentorships) {
      const emailSettings = row.program.config?.emailSettings;
      const mentorSummaryEnabled = emailSettings?.mentorSummary !== false;
      if (!mentorSummaryEnabled) continue;

      // Biweekly check: only send on even weeks
      const frequency = emailSettings?.mentorSummaryFrequency ?? 'weekly';
      if (frequency === 'biweekly') {
        const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
        if (weekNum % 2 !== 0) continue;
      }

      if (!byMentor.has(row.mentor.id)) {
        byMentor.set(row.mentor.id, {
          mentor: row.mentor,
          mentees: [],
          agencyId: row.program.agencyId,
          programConfig: row.program.config,
        });
      }
      byMentor.get(row.mentor.id)!.mentees.push({
        name: row.menteeName,
        programName: row.program.name,
        progress: Math.round(Number(row.menteeProgress) || 0),
      });
    }

    for (const { mentor, mentees, agencyId, programConfig } of byMentor.values()) {
      if (mentees.length === 0) continue;
      const resolved = await resolveEmailContent({
        emailType: 'mentorSummary',
        agencyId,
        programConfig: programConfig?.emailSettings,
        userId: mentor.id,
        defaults: { subject: 'Weekly mentee progress summary', body: '' },
      });
      if (!resolved.enabled) continue;

      try {
        await sendMentorSummary({
          to: mentor.email,
          name: mentor.firstName,
          mentees,
          dashboardUrl: `${env.APP_URL}/mentoring`,
          overrides: { subject: resolved.subject || undefined, body: resolved.body || undefined },
        });
        results.mentorSummary.sent++;
      } catch {
        results.mentorSummary.errors++;
      }
    }
  } catch (err) {
    console.error('[cron] Mentor summary job failed:', err);
  }

  return c.json({
    data: {
      success: true,
      results,
      ranAt: new Date().toISOString(),
    },
  });
});
