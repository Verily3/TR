import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// jwt.ts has `export const jwtService = new JWTService()` which runs at module load time.
// The constructor reads process.env.JWT_ACCESS_SECRET / JWT_REFRESH_SECRET.
// We must set env vars BEFORE the module is evaluated, so we use dynamic import.
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-minimum-32-characters-long!!';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-minimum-32-characters-long!';

const { JWTService } = await import('./jwt.js');

describe('JWTService', () => {
  let service: InstanceType<typeof JWTService>;

  beforeEach(() => {
    service = new JWTService();
  });

  describe('constructor', () => {
    it('throws when JWT_ACCESS_SECRET is missing', () => {
      const saved = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;
      expect(() => new JWTService()).toThrow('JWT_ACCESS_SECRET');
      process.env.JWT_ACCESS_SECRET = saved;
    });

    it('throws when JWT_REFRESH_SECRET is missing', () => {
      const saved = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      expect(() => new JWTService()).toThrow('JWT_REFRESH_SECRET');
      process.env.JWT_REFRESH_SECRET = saved;
    });

    it('constructs successfully with valid secrets', () => {
      expect(() => new JWTService()).not.toThrow();
    });
  });

  describe('access token round-trip', () => {
    it('generates a valid JWT string', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        sid: 'session-456',
        email: 'test@example.com',
        roleSlug: 'learner',
        roleLevel: 10,
        permissions: ['programs:view'],
      });
      expect(token).toMatch(/^ey/);
    });

    it('verifyAccessToken returns payload with correct claims', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        sid: 'session-456',
        email: 'test@example.com',
        roleSlug: 'learner',
        roleLevel: 10,
        permissions: ['programs:view'],
        tenantId: 'tenant-789',
      });

      const payload = await service.verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('user-123');
      expect(payload!.sid).toBe('session-456');
      expect(payload!.email).toBe('test@example.com');
      expect(payload!.roleSlug).toBe('learner');
      expect(payload!.type).toBe('access');
      expect(payload!.tenantId).toBe('tenant-789');
    });

    it('returns null for tampered token', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        sid: 'session-456',
        email: 'test@example.com',
        roleSlug: 'learner',
        roleLevel: 10,
        permissions: [],
      });

      const tampered = token.slice(0, -5) + 'XXXXX';
      const payload = await service.verifyAccessToken(tampered);
      expect(payload).toBeNull();
    });

    it('returns null for token signed with wrong secret', async () => {
      const originalSecret = process.env.JWT_ACCESS_SECRET;
      process.env.JWT_ACCESS_SECRET = 'different-secret-that-is-32-characters-long!!!';
      const otherService = new JWTService();
      process.env.JWT_ACCESS_SECRET = originalSecret;

      const token = await otherService.generateAccessToken({
        sub: 'user-123',
        sid: 'session-456',
        email: 'test@example.com',
        roleSlug: 'learner',
        roleLevel: 10,
        permissions: [],
      });

      const payload = await service.verifyAccessToken(token);
      expect(payload).toBeNull();
    });
  });

  describe('refresh token round-trip', () => {
    it('generates a valid JWT string', async () => {
      const token = await service.generateRefreshToken('user-123', 'session-456');
      expect(token).toMatch(/^ey/);
    });

    it('verifyRefreshToken returns payload with correct claims', async () => {
      const token = await service.generateRefreshToken('user-123', 'session-456');
      const payload = await service.verifyRefreshToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('user-123');
      expect(payload!.sid).toBe('session-456');
      expect(payload!.type).toBe('refresh');
    });

    it('returns null for tampered token', async () => {
      const token = await service.generateRefreshToken('user-123', 'session-456');
      const tampered = token.slice(0, -5) + 'ZZZZZ';
      const payload = await service.verifyRefreshToken(tampered);
      expect(payload).toBeNull();
    });
  });

  describe('cross-secret rejection', () => {
    it('access token does not verify as refresh token', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        sid: 'session-456',
        email: 'test@example.com',
        roleSlug: 'learner',
        roleLevel: 10,
        permissions: [],
      });

      const payload = await service.verifyRefreshToken(token);
      expect(payload).toBeNull();
    });

    it('refresh token does not verify as access token', async () => {
      const token = await service.generateRefreshToken('user-123', 'session-456');
      const payload = await service.verifyAccessToken(token);
      expect(payload).toBeNull();
    });
  });

  describe('expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('access token expires after 15 minutes', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        sid: 'session-456',
        email: 'test@example.com',
        roleSlug: 'learner',
        roleLevel: 10,
        permissions: [],
      });

      const valid = await service.verifyAccessToken(token);
      expect(valid).not.toBeNull();

      vi.advanceTimersByTime(16 * 60 * 1000);

      const expired = await service.verifyAccessToken(token);
      expect(expired).toBeNull();
    });

    it('refresh token expires after 7 days', async () => {
      const token = await service.generateRefreshToken('user-123', 'session-456');

      const valid = await service.verifyRefreshToken(token);
      expect(valid).not.toBeNull();

      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);

      const expired = await service.verifyRefreshToken(token);
      expect(expired).toBeNull();
    });
  });
});
