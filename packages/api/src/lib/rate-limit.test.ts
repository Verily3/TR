import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeRateLimitTestApp } from '../test/helpers.js';

describe('rateLimit middleware', () => {
  describe('basic limiting', () => {
    it('allows requests within the limit', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 5, keyPrefix: 'basic-1' });
      const res = await app.request('/ping', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });
      expect(res.status).toBe(200);
    });

    it('allows exactly max requests before blocking', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 3, keyPrefix: 'basic-2' });
      const headers = { 'x-forwarded-for': '10.0.0.2' };

      for (let i = 0; i < 3; i++) {
        const res = await app.request('/ping', { headers });
        expect(res.status).toBe(200);
      }

      const blocked = await app.request('/ping', { headers });
      expect(blocked.status).toBe(429);
    });

    it('returns 429 with correct error body', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 1, keyPrefix: 'basic-3' });
      const headers = { 'x-forwarded-for': '10.0.0.3' };

      await app.request('/ping', { headers });
      const blocked = await app.request('/ping', { headers });

      expect(blocked.status).toBe(429);
      const body = (await blocked.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.error.message).toBeTruthy();
    });
  });

  describe('headers', () => {
    it('sets X-RateLimit-Limit header', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 10, keyPrefix: 'hdr-1' });
      const res = await app.request('/ping', {
        headers: { 'x-forwarded-for': '10.1.0.1' },
      });
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    });

    it('sets X-RateLimit-Remaining header that decrements', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 5, keyPrefix: 'hdr-2' });
      const headers = { 'x-forwarded-for': '10.1.0.2' };

      const res1 = await app.request('/ping', { headers });
      expect(res1.headers.get('X-RateLimit-Remaining')).toBe('4');

      const res2 = await app.request('/ping', { headers });
      expect(res2.headers.get('X-RateLimit-Remaining')).toBe('3');
    });

    it('sets Retry-After header on 429', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 1, keyPrefix: 'hdr-3' });
      const headers = { 'x-forwarded-for': '10.1.0.3' };

      await app.request('/ping', { headers });
      const blocked = await app.request('/ping', { headers });

      expect(blocked.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('key isolation', () => {
    it('different keyPrefixes do not interfere', async () => {
      const app1 = makeRateLimitTestApp({ windowMs: 60000, max: 1, keyPrefix: 'iso-auth' });
      const app2 = makeRateLimitTestApp({ windowMs: 60000, max: 1, keyPrefix: 'iso-global' });
      const headers = { 'x-forwarded-for': '10.2.0.1' };

      // Exhaust limit on app1
      await app1.request('/ping', { headers });
      const blocked = await app1.request('/ping', { headers });
      expect(blocked.status).toBe(429);

      // app2 with same IP should still work (different prefix)
      const res = await app2.request('/ping', { headers });
      expect(res.status).toBe(200);
    });

    it('different IPs do not interfere', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 1, keyPrefix: 'iso-ip' });

      await app.request('/ping', { headers: { 'x-forwarded-for': '10.2.0.2' } });
      const blocked = await app.request('/ping', { headers: { 'x-forwarded-for': '10.2.0.2' } });
      expect(blocked.status).toBe(429);

      // Different IP should still work
      const res = await app.request('/ping', { headers: { 'x-forwarded-for': '10.2.0.3' } });
      expect(res.status).toBe(200);
    });
  });

  describe('IP detection', () => {
    it('uses x-real-ip when x-forwarded-for is absent', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 1, keyPrefix: 'ip-1' });

      await app.request('/ping', { headers: { 'x-real-ip': '10.3.0.1' } });
      const blocked = await app.request('/ping', { headers: { 'x-real-ip': '10.3.0.1' } });
      expect(blocked.status).toBe(429);

      // Different x-real-ip should still work
      const res = await app.request('/ping', { headers: { 'x-real-ip': '10.3.0.2' } });
      expect(res.status).toBe(200);
    });

    it('uses first IP from x-forwarded-for when multiple present', async () => {
      const app = makeRateLimitTestApp({ windowMs: 60000, max: 1, keyPrefix: 'ip-2' });

      await app.request('/ping', { headers: { 'x-forwarded-for': '10.3.1.1, 10.3.1.2' } });
      const blocked = await app.request('/ping', {
        headers: { 'x-forwarded-for': '10.3.1.1, 10.3.1.3' },
      });
      expect(blocked.status).toBe(429);
    });
  });

  describe('window expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('allows requests again after window expires', async () => {
      const app = makeRateLimitTestApp({ windowMs: 1000, max: 1, keyPrefix: 'expiry-1' });
      const headers = { 'x-forwarded-for': '10.4.0.1' };

      const res1 = await app.request('/ping', { headers });
      expect(res1.status).toBe(200);

      const blocked = await app.request('/ping', { headers });
      expect(blocked.status).toBe(429);

      // Advance past window
      vi.advanceTimersByTime(1001);

      const res2 = await app.request('/ping', { headers });
      expect(res2.status).toBe(200);
    });
  });
});
