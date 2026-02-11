import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import { requireAgencyAccess, requirePermission } from '../../middleware/permissions.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../lib/errors.js';
import { PERMISSIONS } from '@tr/shared';
import type { Variables } from '../../types/context.js';
import crypto from 'node:crypto';

const { users, tenants, impersonationSessions, sessions } = schema;

export const impersonationRoutes = new Hono<{ Variables: Variables }>();

// Validation schemas
const startImpersonationSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.string().max(500).optional(),
  durationMinutes: z.number().min(5).max(480).default(60), // 5 min to 8 hours
});

/**
 * POST /api/admin/impersonate
 * Start impersonating a user (agency admin only)
 */
impersonationRoutes.post(
  '/',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_IMPERSONATE),
  zValidator('json', startImpersonationSchema),
  async (c) => {
    const adminUser = c.get('user');
    const adminSession = c.get('session');
    const { targetUserId, reason, durationMinutes } = c.req.valid('json');

    // Can't impersonate yourself
    if (targetUserId === adminUser.id) {
      throw new BadRequestError('Cannot impersonate yourself');
    }

    // Find target user
    const [targetUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundError('User', targetUserId);
    }

    // Verify target user belongs to a tenant under this agency
    if (targetUser.tenantId) {
      const [targetTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, targetUser.tenantId))
        .limit(1);

      if (!targetTenant || targetTenant.agencyId !== adminUser.agencyId) {
        throw new ForbiddenError(
          'Cannot impersonate users from other agencies'
        );
      }
    } else if (targetUser.agencyId !== adminUser.agencyId) {
      throw new ForbiddenError('Cannot impersonate users from other agencies');
    }

    // Can't impersonate another agency admin
    if (targetUser.agencyId && !targetUser.tenantId) {
      throw new ForbiddenError('Cannot impersonate agency-level users');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    // End any existing impersonation sessions for this admin
    await db
      .update(impersonationSessions)
      .set({ endedAt: new Date() })
      .where(
        and(
          eq(impersonationSessions.adminUserId, adminUser.id),
          isNull(impersonationSessions.endedAt)
        )
      );

    // Create impersonation session
    const [impersonation] = await db
      .insert(impersonationSessions)
      .values({
        adminUserId: adminUser.id,
        adminSessionId: adminSession!.id,
        targetUserId,
        tokenHash,
        reason,
        expiresAt,
      })
      .returning();

    return c.json({
      data: {
        impersonationId: impersonation.id,
        token, // Return plain token (client stores this)
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
        },
        expiresAt: expiresAt.toISOString(),
      },
    });
  }
);

/**
 * POST /api/admin/impersonate/end
 * End the current impersonation session
 */
impersonationRoutes.post('/end', async (c) => {
  const impersonationToken = c.req.header('X-Impersonation-Token');

  if (!impersonationToken) {
    throw new BadRequestError('No impersonation token provided');
  }

  const tokenHash = crypto
    .createHash('sha256')
    .update(impersonationToken)
    .digest('hex');

  // Find active impersonation session
  const [session] = await db
    .select()
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.tokenHash, tokenHash),
        isNull(impersonationSessions.endedAt),
        gt(impersonationSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    throw new BadRequestError('Invalid or expired impersonation session');
  }

  // End the session
  await db
    .update(impersonationSessions)
    .set({ endedAt: new Date() })
    .where(eq(impersonationSessions.id, session.id));

  return c.json({ data: { success: true } });
});

/**
 * GET /api/admin/impersonate/status
 * Check current impersonation status
 */
impersonationRoutes.get('/status', async (c) => {
  const impersonationToken = c.req.header('X-Impersonation-Token');

  if (!impersonationToken) {
    return c.json({
      data: {
        isImpersonating: false,
      },
    });
  }

  const tokenHash = crypto
    .createHash('sha256')
    .update(impersonationToken)
    .digest('hex');

  // Find active impersonation session
  const [session] = await db
    .select({
      id: impersonationSessions.id,
      adminUserId: impersonationSessions.adminUserId,
      targetUserId: impersonationSessions.targetUserId,
      expiresAt: impersonationSessions.expiresAt,
      reason: impersonationSessions.reason,
    })
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.tokenHash, tokenHash),
        isNull(impersonationSessions.endedAt),
        gt(impersonationSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return c.json({
      data: {
        isImpersonating: false,
      },
    });
  }

  // Get admin and target user info
  const [adminUser] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, session.adminUserId))
    .limit(1);

  const [targetUser] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, session.targetUserId))
    .limit(1);

  return c.json({
    data: {
      isImpersonating: true,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        reason: session.reason,
      },
      adminUser,
      targetUser,
    },
  });
});

/**
 * GET /api/admin/impersonate/history
 * Get impersonation history (for audit)
 */
impersonationRoutes.get(
  '/history',
  requireAgencyAccess(),
  requirePermission(PERMISSIONS.AGENCY_MANAGE),
  async (c) => {
    const adminUser = c.get('user');

    const history = await db
      .select({
        id: impersonationSessions.id,
        adminUserId: impersonationSessions.adminUserId,
        targetUserId: impersonationSessions.targetUserId,
        reason: impersonationSessions.reason,
        createdAt: impersonationSessions.createdAt,
        expiresAt: impersonationSessions.expiresAt,
        endedAt: impersonationSessions.endedAt,
      })
      .from(impersonationSessions)
      .where(eq(impersonationSessions.adminUserId, adminUser.id))
      .orderBy(impersonationSessions.createdAt)
      .limit(50);

    return c.json({ data: history });
  }
);
