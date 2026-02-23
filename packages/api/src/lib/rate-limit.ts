import { createMiddleware } from 'hono/factory';

interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window per IP */
  max: number;
  message?: string;
  /** Prefix to namespace separate limits (e.g. 'auth', 'global') */
  keyPrefix?: string;
}

// Sliding-window in-memory store — suitable for single-instance deployment.
// For multi-instance, replace with a Redis-backed store.
const store = new Map<string, number[]>();

// Prune stale entries every 5 minutes to prevent unbounded memory growth.
setInterval(
  () => {
    const cutoff = Date.now() - 15 * 60 * 1000; // 15 min max window
    for (const [key, timestamps] of store.entries()) {
      const filtered = timestamps.filter((t) => t > cutoff);
      if (filtered.length === 0) store.delete(key);
      else store.set(key, filtered);
    }
  },
  5 * 60 * 1000
).unref();

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyPrefix = 'global',
  } = options;

  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      c.req.header('x-real-ip') ??
      'unknown';

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);
    timestamps.push(now);
    store.set(key, timestamps);

    const remaining = Math.max(0, max - timestamps.length);
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

    if (timestamps.length > max) {
      c.header('Retry-After', String(Math.ceil(windowMs / 1000)));
      return c.json({ error: { code: 'RATE_LIMIT_EXCEEDED', message } }, 429 as const);
    }

    await next();
  });
}
