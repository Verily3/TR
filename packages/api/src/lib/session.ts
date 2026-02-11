import { createHash, randomBytes } from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type { UserWithPermissions } from '@tr/shared';

const { sessions, users, userRoles, roles } = schema;

interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

interface SessionResult {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}

interface ValidatedSession {
  sessionId: string;
  userId: string;
}

/**
 * Session manager for creating, validating, and revoking sessions
 */
export class SessionManager {
  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    metadata: SessionMetadata
  ): Promise<SessionResult> {
    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // 7 day expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        tokenHash,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        deviceInfo: metadata.deviceInfo || {},
        expiresAt,
      })
      .returning();

    return {
      sessionId: session.id,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Validate a refresh token and return session info
   */
  async validateSession(refreshToken: string): Promise<ValidatedSession | null> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, new Date()),
          isNull(sessions.revokedAt)
        )
      )
      .limit(1);

    if (!session) return null;

    // Update last active time
    await db
      .update(sessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(sessions.id, session.id));

    return { sessionId: session.id, userId: session.userId };
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    await db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(eq(sessions.id, sessionId));
  }

  /**
   * Revoke all sessions for a user (except optionally one)
   */
  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string
  ): Promise<void> {
    // Get all active sessions for user
    const userSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

    // Revoke each one except the exception
    for (const session of userSessions) {
      if (session.id !== exceptSessionId) {
        await this.revokeSession(session.id, 'all_sessions_revoked');
      }
    }
  }

  /**
   * Get user with their roles and permissions
   */
  async getUserWithPermissions(
    userId: string
  ): Promise<UserWithPermissions | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) return null;

    // Get user's roles with permissions
    const userRolesData = await db
      .select({
        roleSlug: roles.slug,
        roleLevel: roles.level,
        permissions: roles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    // Merge permissions from all roles and find highest role
    const allPermissions = new Set<string>();
    let highestRole = { slug: 'learner', level: 0 };

    for (const { roleSlug, roleLevel, permissions } of userRolesData) {
      for (const permission of permissions as string[]) {
        allPermissions.add(permission);
      }
      if (roleLevel > highestRole.level) {
        highestRole = { slug: roleSlug, level: roleLevel };
      }
    }

    return {
      id: user.id,
      agencyId: user.agencyId ?? undefined,
      tenantId: user.tenantId ?? undefined,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleSlug: highestRole.slug,
      roleLevel: highestRole.level,
      permissions: Array.from(allPermissions) as UserWithPermissions['permissions'],
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
