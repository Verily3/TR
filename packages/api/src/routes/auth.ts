import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, isNull, gt, desc } from 'drizzle-orm';
import { verify, hash } from 'argon2';
import crypto from 'node:crypto';
import { db, schema } from '@tr/db';
import { jwtService } from '../lib/jwt.js';
import { sessionManager } from '../lib/session.js';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../lib/errors.js';
import type { LoginResponse, RefreshResponse } from '@tr/shared';
import { sendPasswordReset } from '../lib/email.js';
import { env } from '../lib/env.js';

const { users, impersonationSessions, sessions } = schema;

export const authRoutes = new Hono();

// Login schema
const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

// Refresh schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new UnauthorizedError('Account is not active');
  }

  if (!user.passwordHash) {
    throw new UnauthorizedError('Password login not available for this account');
  }

  // Verify password
  const validPassword = await verify(user.passwordHash, password);
  if (!validPassword) {
    console.warn(`[AUTH] Failed login attempt for: ${email}`);
    throw new UnauthorizedError('Invalid email or password');
  }

  // Get user permissions
  const userWithPermissions = await sessionManager.getUserWithPermissions(user.id);
  if (!userWithPermissions) {
    throw new NotFoundError('User permissions');
  }

  // Create session
  // Note: X-Forwarded-For may be spoofed unless running behind a trusted reverse proxy.
  // We take only the first (leftmost) IP from the header.
  const session = await sessionManager.createSession(user.id, {
    userAgent: c.req.header('User-Agent'),
    ipAddress: c.req.header('X-Forwarded-For')?.split(',')[0].trim() ?? c.req.header('X-Real-IP'),
  });

  // Generate tokens
  const accessToken = await jwtService.generateAccessToken({
    sub: user.id,
    sid: session.sessionId,
    agencyId: user.agencyId ?? undefined,
    tenantId: user.tenantId ?? undefined,
    email: user.email,
    roleSlug: userWithPermissions.roleSlug,
    roleLevel: userWithPermissions.roleLevel,
    permissions: userWithPermissions.permissions,
  });

  // Update last login
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const response: LoginResponse = {
    accessToken,
    refreshToken: session.refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      agencyId: user.agencyId ?? undefined,
      tenantId: user.tenantId ?? undefined,
      roleSlug: userWithPermissions.roleSlug,
      roleLevel: userWithPermissions.roleLevel,
    },
  };

  return c.json({ data: response });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  // Validate session
  const session = await sessionManager.validateSession(refreshToken);
  if (!session) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Get user with permissions
  const userWithPermissions = await sessionManager.getUserWithPermissions(session.userId);
  if (!userWithPermissions) {
    throw new NotFoundError('User');
  }

  // Generate new access token
  const accessToken = await jwtService.generateAccessToken({
    sub: userWithPermissions.id,
    sid: session.sessionId,
    agencyId: userWithPermissions.agencyId,
    tenantId: userWithPermissions.tenantId,
    email: userWithPermissions.email,
    roleSlug: userWithPermissions.roleSlug,
    roleLevel: userWithPermissions.roleLevel,
    permissions: userWithPermissions.permissions,
  });

  // Rotate the refresh token — old token is now invalid
  const newRefreshToken = await sessionManager.rotateSession(session.sessionId);

  const response: RefreshResponse = {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: 15 * 60,
  };

  return c.json({ data: response });
});

/**
 * POST /api/auth/logout
 * Revoke current session
 */
authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await jwtService.verifyAccessToken(token);

    if (payload) {
      await sessionManager.revokeSession(payload.sid, 'logout');
    }
  }

  return c.json({ data: { success: true } });
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing authorization header');
  }

  const token = authHeader.slice(7);
  const payload = await jwtService.verifyAccessToken(token);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  // Check for impersonation - if active, return target user data
  const impersonationToken = c.req.header('X-Impersonation-Token');
  let isImpersonating = false;
  let targetUserId: string | null = null;

  if (impersonationToken) {
    const tokenHash = crypto.createHash('sha256').update(impersonationToken).digest('hex');

    const [session] = await db
      .select({ targetUserId: impersonationSessions.targetUserId })
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
      isImpersonating = true;
      targetUserId = session.targetUserId;
    }
  }

  // Get user data - target user if impersonating, admin otherwise
  const userId = targetUserId ?? payload.sub;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new NotFoundError('User');
  }

  const userWithPermissions = await sessionManager.getUserWithPermissions(user.id);

  return c.json({
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatar: user.avatar,
      title: user.title,
      department: user.department,
      agencyId: user.agencyId,
      tenantId: user.tenantId,
      roleSlug: userWithPermissions?.roleSlug,
      roleLevel: userWithPermissions?.roleLevel,
      permissions: userWithPermissions?.permissions || [],
      isImpersonating,
    },
  });
});

// ─── Password Reset ───────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim()),
});

/**
 * POST /api/auth/forgot-password
 * Generate a password reset token and send email. Always returns 200 to prevent email enumeration.
 */
authRoutes.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (user && user.status === 'active') {
    const token = crypto.randomBytes(32).toString('hex'); // 256-bit token
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({ passwordResetToken: token, passwordResetExpiresAt: expiresAt })
      .where(eq(users.id, user.id));

    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
    await sendPasswordReset({
      to: user.email,
      name: user.firstName,
      resetUrl,
    });
  }

  // Always 200 to prevent email enumeration
  return c.json({ data: { success: true } });
});

// ─── Active Sessions ──────────────────────────────────────────────────────────

/**
 * GET /api/auth/sessions
 * List active sessions for the authenticated user.
 * JWT verified manually (auth routes mount before global authMiddleware).
 */
authRoutes.get('/sessions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer '))
    throw new UnauthorizedError('Missing authorization header');

  const payload = await jwtService.verifyAccessToken(authHeader.slice(7));
  if (!payload) throw new UnauthorizedError('Invalid or expired token');

  const currentSessionId = payload.sid;

  const activeSessions = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
      createdAt: sessions.createdAt,
      lastActiveAt: sessions.lastActiveAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, payload.sub),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date())
      )
    )
    .orderBy(desc(sessions.lastActiveAt));

  return c.json({
    data: activeSessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    })),
  });
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session owned by the authenticated user.
 */
authRoutes.delete('/sessions/:sessionId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer '))
    throw new UnauthorizedError('Missing authorization header');

  const payload = await jwtService.verifyAccessToken(authHeader.slice(7));
  if (!payload) throw new UnauthorizedError('Invalid or expired token');

  const { sessionId } = c.req.param();

  if (sessionId === payload.sid) {
    throw new BadRequestError('Cannot revoke current session. Use /logout instead.');
  }

  const [session] = await db
    .select({ userId: sessions.userId, revokedAt: sessions.revokedAt })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session || session.userId !== payload.sub) {
    throw new NotFoundError('Session');
  }

  if (session.revokedAt) {
    throw new BadRequestError('Session is already revoked');
  }

  await sessionManager.revokeSession(sessionId, 'user_revoked');

  return c.json({ data: { success: true } });
});

// ─── Change Password ───────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, 'Password must be at least 12 characters'),
});

/**
 * POST /api/auth/change-password
 * Verify current password and set a new one.
 * Revokes all other sessions on success.
 */
authRoutes.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer '))
    throw new UnauthorizedError('Missing authorization header');

  const payload = await jwtService.verifyAccessToken(authHeader.slice(7));
  if (!payload) throw new UnauthorizedError('Invalid or expired token');

  const { currentPassword, newPassword } = c.req.valid('json');

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, payload.sub), isNull(users.deletedAt)))
    .limit(1);

  if (!user) throw new NotFoundError('User');
  if (!user.passwordHash)
    throw new BadRequestError('Password login not available for this account');

  const valid = await verify(user.passwordHash, currentPassword);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const newPasswordHash = await hash(newPassword);

  await db
    .update(users)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Revoke all OTHER sessions (keep current one active)
  await sessionManager.revokeAllUserSessions(user.id, payload.sid);

  return c.json({ data: { success: true } });
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

/**
 * POST /api/auth/reset-password
 * Validate reset token, update password, clear token.
 */
authRoutes.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, password } = c.req.valid('json');

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, token),
        isNull(users.deletedAt),
        gt(users.passwordResetExpiresAt, new Date())
      )
    )
    .limit(1);

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  const passwordHash = await hash(password);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return c.json({ data: { success: true } });
});
