import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import type { AccessTokenPayload, RefreshTokenPayload } from '@tr/shared';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * JWT service for token generation and verification
 */
export class JWTService {
  private accessSecret: Uint8Array;
  private refreshSecret: Uint8Array;

  constructor() {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error(
        'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables are required'
      );
    }

    this.accessSecret = new TextEncoder().encode(accessSecret);
    this.refreshSecret = new TextEncoder().encode(refreshSecret);
  }

  /**
   * Generate an access token (15 min expiry)
   */
  async generateAccessToken(
    payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'type'>
  ): Promise<string> {
    return new SignJWT({ ...payload, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(this.accessSecret);
  }

  /**
   * Generate a refresh token (7 day expiry)
   */
  async generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    return new SignJWT({ sub: userId, sid: sessionId, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .sign(this.refreshSecret);
  }

  /**
   * Verify an access token
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.accessSecret);
      return payload as unknown as AccessTokenPayload;
    } catch (err) {
      const reason =
        err instanceof joseErrors.JWTExpired
          ? 'expired'
          : err instanceof joseErrors.JWTInvalid
            ? 'invalid'
            : err instanceof joseErrors.JWSSignatureVerificationFailed
              ? 'bad_signature'
              : 'unknown';
      console.warn(`[JWT] Access token verification failed: ${reason}`);
      return null;
    }
  }

  /**
   * Verify a refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.refreshSecret);
      return payload as unknown as RefreshTokenPayload;
    } catch (err) {
      const reason =
        err instanceof joseErrors.JWTExpired
          ? 'expired'
          : err instanceof joseErrors.JWTInvalid
            ? 'invalid'
            : err instanceof joseErrors.JWSSignatureVerificationFailed
              ? 'bad_signature'
              : 'unknown';
      console.warn(`[JWT] Refresh token verification failed: ${reason}`);
      return null;
    }
  }
}

// Singleton instance
export const jwtService = new JWTService();
