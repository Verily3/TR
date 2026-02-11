import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';
import { tenantsRoutes } from './routes/tenants.js';
import { agenciesRoutes } from './routes/agencies.js';
import { programsRoutes } from './routes/programs.js';
import { enrollmentsRoutes } from './routes/enrollments.js';
import { progressRoutes } from './routes/progress.js';
import { impersonationRoutes } from './routes/admin/impersonation.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { agencyEnrollmentsRoutes } from './routes/agency-enrollments.js';
import { dashboardRoutes } from './routes/dashboard.js';
import type { Variables } from './types/context.js';

// Create Hono app with typed variables
export const app = new Hono<{ Variables: Variables }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3003',
      'http://localhost:5173',
      process.env.WEB_URL || 'http://localhost:3003',
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Impersonation-Token'],
  })
);

// Error handler (Hono native onError)
app.onError(errorHandler);

// Health check (no auth required)
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
);

// Auth routes (no auth required for login/register)
app.route('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/*', authMiddleware());

// Mount protected route handlers
app.route('/api/users', usersRoutes);
app.route('/api/tenants', tenantsRoutes);
app.route('/api/agencies', agenciesRoutes);

// Programs routes (nested under tenants)
app.route('/api/tenants/:tenantId/programs', programsRoutes);
app.route('/api/tenants/:tenantId/programs/:programId/enrollments', enrollmentsRoutes);
app.route('/api/tenants/:tenantId/programs/:programId', progressRoutes);

// Dashboard routes (learner dashboard aggregation)
app.route('/api/tenants/:tenantId/dashboard', dashboardRoutes);

// Agency enrollment routes (cross-tenant participant management)
app.route('/api/agencies/me/programs/:programId/enrollments', agencyEnrollmentsRoutes);

// Admin routes
app.route('/api/admin/impersonate', impersonationRoutes);

// Onboarding routes
app.route('/api/onboarding', onboardingRoutes);

// 404 handler
app.notFound((c) =>
  c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  )
);
