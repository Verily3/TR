/**
 * Auth-related types for Results Tracking System
 */

/**
 * Access token JWT payload (15 min expiry)
 */
export interface AccessTokenPayload {
  // Standard JWT claims
  sub: string; // User ID
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expiration (Unix timestamp)

  // Custom claims
  sid: string; // Session ID
  type: 'access';

  // User context
  agencyId?: string;
  tenantId?: string;
  email: string;

  // Role info (denormalized for performance)
  roleSlug: string;
  roleLevel: number;
  permissions: string[];

  // Impersonation
  impersonatedBy?: {
    userId: string;
    sessionId: string;
  };
}

/**
 * Refresh token JWT payload (7 day expiry)
 */
export interface RefreshTokenPayload {
  sub: string; // User ID
  sid: string; // Session ID
  iat: number;
  exp: number;
  type: 'refresh';
}

/**
 * Authenticated user context (set by middleware)
 */
export interface AuthUser {
  id: string;
  sessionId: string;
  agencyId?: string;
  tenantId?: string;
  email: string;
  roleSlug: string;
  roleLevel: number;
  permissions: string[];
  isImpersonating: boolean;
  impersonatedBy?: {
    userId: string;
    sessionId: string;
  };
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    agencyId?: string;
    tenantId?: string;
    roleSlug: string;
    roleLevel: number;
  };
}

/**
 * Token refresh request
 */
export interface RefreshRequest {
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string; // New rotated refresh token — client must replace the old one
  expiresIn: number;
}

/**
 * Start impersonation request
 */
export interface StartImpersonationRequest {
  targetUserId: string;
  reason: string;
}

/**
 * Impersonation response
 */
export interface ImpersonationResponse {
  accessToken: string;
  impersonationSessionId: string;
  targetUser: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: string;
}
