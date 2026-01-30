import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestIdMiddleware, errorHandler } from "./middleware";
import { auth, agenciesRouter, tenantsRouter, programsRouter, goalsRouter, coachingRouter, assessmentsRouter, assessmentPublicRouter, templatesRouter } from "./routes";
import type { AppVariables } from "./types";
import { env } from "./lib/env";

// Create app instance
const app = new Hono<{ Variables: AppVariables }>();

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Security headers
app.use("*", secureHeaders());

// CORS
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN.split(","),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Tenant-ID",
      "X-Agency-ID",
      "X-Request-ID",
    ],
  })
);

// Request logging
app.use("*", logger());

// Request ID
app.use("*", requestIdMiddleware);

// Error handling
app.onError(errorHandler);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/", (c) => {
  return c.json({
    name: "Transformation OS API",
    version: "0.1.0",
    status: "healthy",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Auth routes
app.route("/auth", auth);

// Agency routes
app.route("/agencies", agenciesRouter);

// Agency-level template routes
app.route("/agencies/:agencyId/templates", templatesRouter);

// Tenant routes
app.route("/tenants", tenantsRouter);

// Nested tenant routes
app.route("/tenants/:tenantId/programs", programsRouter);
app.route("/tenants/:tenantId/goals", goalsRouter);
app.route("/tenants/:tenantId/coaching", coachingRouter);
app.route("/tenants/:tenantId/assessments", assessmentsRouter);

// Public routes (no auth required)
app.route("/assessments/respond", assessmentPublicRouter);

// ============================================================================
// 404 HANDLER
// ============================================================================

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

export { app };
