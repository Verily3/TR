import { createMiddleware } from "hono/factory";
import { nanoid } from "nanoid";
import type { AppVariables } from "../types";

/**
 * Request ID middleware - generates unique ID for each request
 * Useful for tracing and debugging
 */
export const requestIdMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const requestId = c.req.header("X-Request-ID") || nanoid();
    c.set("requestId", requestId);
    c.header("X-Request-ID", requestId);
    await next();
  }
);
