import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { errorHandler } from './error-handler.js';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ValidationError,
} from '../lib/errors.js';

/**
 * Helper: create a Hono app with the error handler and a single route that throws.
 */
function createApp(throwFn: () => never) {
  const app = new Hono();
  app.onError(errorHandler);
  app.get('/test', () => {
    throwFn();
  });
  return app;
}

async function getErrorBody(app: Hono, path = '/test') {
  const res = await app.request(path);
  return { status: res.status, body: await res.json() };
}

// Suppress console.error during tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorHandler', () => {
  describe('ZodError', () => {
    it('returns 400 with VALIDATION_ERROR code and field errors', async () => {
      const app = createApp(() => {
        z.object({ name: z.string(), age: z.number() }).parse({ name: 123 });
        throw new Error('unreachable');
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid request data');
      expect(body.error.details).toBeDefined();
      // 'name' should have an error (expected string, got number)
      expect(body.error.details.name).toBeDefined();
    });
  });

  describe('AppError subclasses', () => {
    it('NotFoundError → 404', async () => {
      const app = createApp(() => {
        throw new NotFoundError('User', 'xyz');
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('xyz');
    });

    it('ForbiddenError → 403', async () => {
      const app = createApp(() => {
        throw new ForbiddenError('No access');
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('No access');
    });

    it('BadRequestError → 400', async () => {
      const app = createApp(() => {
        throw new BadRequestError('Invalid input');
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('ValidationError includes details', async () => {
      const app = createApp(() => {
        throw new ValidationError({ email: ['invalid'] });
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toEqual({ errors: { email: ['invalid'] } });
    });

    it('AppError with custom status code', async () => {
      const app = createApp(() => {
        throw new AppError(409, 'CONFLICT', 'duplicate', { field: 'email' });
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(409);
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.details).toEqual({ field: 'email' });
    });
  });

  describe('HTTPException', () => {
    it('returns the correct status and HTTP_ERROR code', async () => {
      const app = createApp(() => {
        throw new HTTPException(429, { message: 'Too many requests' });
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(429);
      expect(body.error.code).toBe('HTTP_ERROR');
      expect(body.error.message).toBe('Too many requests');
    });
  });

  describe('unknown errors', () => {
    it('returns 500 with error message in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const app = createApp(() => {
        throw new Error('something broke');
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('something broke');

      process.env.NODE_ENV = originalEnv;
    });

    it('returns 500 with generic message in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const app = createApp(() => {
        throw new Error('secret details');
      });

      const { status, body } = await getErrorBody(app);
      expect(status).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('An unexpected error occurred');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
