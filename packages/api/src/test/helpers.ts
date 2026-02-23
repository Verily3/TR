import { Hono } from 'hono';
import { rateLimit } from '../lib/rate-limit.js';

/**
 * Create a minimal Hono app with rate limiting for testing.
 */
export function makeRateLimitTestApp(options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}) {
  const app = new Hono();
  app.use('/*', rateLimit(options));
  app.get('/ping', (c) => c.text('ok'));
  app.post('/ping', (c) => c.text('ok'));
  return app;
}
