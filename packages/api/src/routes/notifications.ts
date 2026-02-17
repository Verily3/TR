import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type { Variables } from '../types/context.js';

const { notifications, notificationPreferences } = schema;

export const notificationsRoutes = new Hono<{ Variables: Variables }>();

// ─── List notifications ────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  status: z.enum(['unread', 'read', 'archived']).optional(),
  type: z.string().optional(),
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
});

/**
 * GET /api/notifications
 * Paginated list of notifications for the current user.
 */
notificationsRoutes.get('/', zValidator('query', listQuerySchema), async (c) => {
  const user = c.get('user');
  const { status, type, page, limit } = c.req.valid('query');
  const offset = (page - 1) * limit;

  const conditions = [eq(notifications.userId, user.id)];
  if (status) conditions.push(eq(notifications.status, status));
  if (type) conditions.push(eq(notifications.type, type));

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions)),
  ]);

  return c.json({
    data: items,
    meta: {
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    },
  });
});

// ─── Unread count ──────────────────────────────────────────────────────────────

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the badge.
 */
notificationsRoutes.get('/unread-count', async (c) => {
  const user = c.get('user');

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.status, 'unread')));

  return c.json({ data: { count: Number(count) } });
});

// ─── Preferences ──────────────────────────────────────────────────────────────

/**
 * GET /api/notifications/preferences
 * Get notification preferences, upsert defaults if none exist.
 */
notificationsRoutes.get('/preferences', async (c) => {
  const user = c.get('user');

  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, user.id))
    .limit(1);

  if (prefs) {
    return c.json({ data: prefs });
  }

  // Upsert defaults
  const [newPrefs] = await db
    .insert(notificationPreferences)
    .values({ userId: user.id })
    .onConflictDoNothing()
    .returning();

  // If conflict race, re-fetch
  if (!newPrefs) {
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id))
      .limit(1);
    return c.json({ data: existing });
  }

  return c.json({ data: newPrefs });
});

const updatePrefsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailDigest: z.enum(['instant', 'daily', 'weekly', 'never']).optional(),
  inAppEnabled: z.boolean().optional(),
  preferences: z.record(z.boolean()).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().optional(),
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences.
 */
notificationsRoutes.put('/preferences', zValidator('json', updatePrefsSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  const [updated] = await db
    .insert(notificationPreferences)
    .values({ userId: user.id, ...body })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { ...body, updatedAt: new Date() },
    })
    .returning();

  return c.json({ data: updated });
});

// ─── Mark read ─────────────────────────────────────────────────────────────────

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
notificationsRoutes.put('/:id/read', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [updated] = await db
    .update(notifications)
    .set({ status: 'read', readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    .returning();

  return c.json({ data: updated ?? null });
});

/**
 * PUT /api/notifications/read-all
 * Mark all unread notifications as read.
 */
notificationsRoutes.put('/read-all', async (c) => {
  const user = c.get('user');

  await db
    .update(notifications)
    .set({ status: 'read', readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), eq(notifications.status, 'unread')));

  return c.json({ data: { success: true } });
});

// ─── Archive / delete ─────────────────────────────────────────────────────────

/**
 * DELETE /api/notifications/:id
 * Archive a notification (status = 'archived').
 */
notificationsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await db
    .update(notifications)
    .set({ status: 'archived' })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  return c.json({ data: { success: true } });
});
