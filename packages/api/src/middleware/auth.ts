import { createMiddleware } from 'hono/factory';
import { eq, and, isNull, gt } from 'drizzle-orm';
import crypto from 'node:crypto';
import { jwtService } from '../lib/jwt.js';
import { UnauthorizedError } from '../lib/errors.js';
import { db, schema } from '@tr/db';
import type { Variables } from '../types/context.js';

const { users, roles, userRoles, impersonationSessions } = schema;

/**
 * Auth middleware - verifies JWT access token and sets user context.
 * When an X-Impersonation-Token header is present and valid,
 * swaps the user context to the target user.
 */
export function authMiddleware() {
  return createMiddleware<{ Variables: Variables }>(async (c, next) => {
    // Get token from Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing authorization header');
    }

    const token = authHeader.slice(7);

    // Verify token
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Check for impersonation token
    const impersonationToken = c.req.header('X-Impersonation-Token');

    if (impersonationToken) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(impersonationToken)
        .digest('hex');

      // Find active impersonation session
      const [session] = await db
        .select({
          targetUserId: impersonationSessions.targetUserId,
          adminUserId: impersonationSessions.adminUserId,
        })
        .from(impersonationSessions)
        .where(
          and(
            eq(impersonationSessions.tokenHash, tokenHash),
            eq(impersonationSessions.adminUserId, payload.sub),
            isNull(impersonationSessions.endedAt),
            gt(impersonationSessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (session) {
        // Load target user's full context
        const [targetUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, session.targetUserId))
          .limit(1);

        if (targetUser) {
          // Get target user's role
          const [role] = await db
            .select({
              slug: roles.slug,
              level: roles.level,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, targetUser.id))
            .limit(1);

          c.set('user', {
            id: targetUser.id,
            sessionId: payload.sid,
            agencyId: targetUser.agencyId ?? undefined,
            tenantId: targetUser.tenantId ?? undefined,
            email: targetUser.email,
            roleSlug: role?.slug ?? 'learner',
            roleLevel: role?.level ?? 10,
            permissions: payload.permissions, // Keep admin permissions for safety
            isImpersonating: true,
            impersonatedBy: {
              userId: session.adminUserId,
              sessionId: payload.sid,
            },
          });

          await next();
          return;
        }
      }
    }

    // Default: use admin's own context
    c.set('user', {
      id: payload.sub,
      sessionId: payload.sid,
      agencyId: payload.agencyId,
      tenantId: payload.tenantId,
      email: payload.email,
      roleSlug: payload.roleSlug,
      roleLevel: payload.roleLevel,
      permissions: payload.permissions,
      isImpersonating: !!payload.impersonatedBy,
      impersonatedBy: payload.impersonatedBy,
    });

    await next();
  });
}
