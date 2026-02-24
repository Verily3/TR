import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { timeout } from 'hono/timeout';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimit } from './lib/rate-limit.js';
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
import { agencyTemplatesRoutes } from './routes/agency-templates.js';
import { assessmentsRoutes, publicAssessmentSetupRoutes } from './routes/assessments.js';
import { assessmentResponseRoutes, publicAssessmentRoutes } from './routes/assessment-responses.js';
import { assessmentBenchmarksRoutes } from './routes/assessment-benchmarks.js';
import { adminDbRoutes } from './routes/admin/db.js';
import { notificationsRoutes } from './routes/notifications.js';
import { cronRoutes } from './routes/cron.js';
import { mentoringRoutes } from './routes/mentoring.js';
import { permissionsRoutes } from './routes/permissions.js';
import { analyticsRoutes } from './routes/analytics.js';
import { surveysRoutes, agencySurveysRoutes, publicSurveyRoutes } from './routes/surveys.js';
import { planningRoutes } from './routes/planning.js';
import { scorecardRoutes } from './routes/scorecard.js';
import { searchRoutes } from './routes/search.js';
import { uploadsRoutes } from './routes/uploads.js';
import { uploadApiRoutes } from './routes/upload-api.js';
import { resourcesRoutes } from './routes/resources.js';
import type { Variables } from './types/context.js';

// Create Hono app with typed variables
export const app = new Hono<{ Variables: Variables }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());

// Request timeout: 30 seconds (default), 120 seconds for admin db operations
app.use('/api/admin/db/*', timeout(120_000));
app.use('*', timeout(30_000));

// Body size limit: 1MB for JSON payloads (default)
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));

// Increased body limit for file upload routes (50MB)
app.use('/api/upload/*', bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use('/api/tenants/*/programs/*/resources', bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Rate limiting — global: 200 req/min per IP; auth: 10 req/min per IP
// Health check is excluded to avoid false-positive K8s/LB failures
app.use('/api/*', rateLimit({ windowMs: 60_000, max: 200, keyPrefix: 'global' }));
app.use(
  '/api/auth/*',
  rateLimit({
    windowMs: 60_000,
    max: 10,
    keyPrefix: 'auth',
    message: 'Too many auth requests, please wait a minute.',
  })
);

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

// CSRF Note: This API uses Authorization: Bearer headers (not cookies) for
// authentication. Since Authorization headers are never sent automatically by
// browsers cross-origin, standard CSRF attacks do not apply. If auth is ever
// migrated to cookie-based sessions, CSRF token middleware becomes mandatory.

// Error handler (Hono native onError)
app.onError(errorHandler);

// Fail loudly in production if WEB_URL is not explicitly set
if (process.env.NODE_ENV === 'production' && !process.env.WEB_URL) {
  console.error('❌ WEB_URL environment variable is required in production');
  process.exit(1);
}

// Health check (no auth required)
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
);

// Auth routes (no auth required for login/register)
app.route('/api/auth', authRoutes);

// Admin DB routes (no JWT — secured by admin secret, must work before DB is ready)
app.route('/api/admin/db', adminDbRoutes);

// Cron routes (no JWT — secured by X-Cron-Secret header)
app.route('/api/cron', cronRoutes);

// Public assessment response routes (token-based, no auth required)
app.route('/api/assessments/respond', publicAssessmentRoutes);

// Public assessment setup routes (subject portal, no auth required)
app.route('/api/assessments/setup', publicAssessmentSetupRoutes);

// Public survey routes (share token, no auth required)
app.route('/api/surveys', publicSurveyRoutes);

// File uploads — public serving (no auth, before auth middleware)
app.route('/api/uploads', uploadsRoutes);

// Protected routes - require authentication
app.use('/api/*', authMiddleware());

// File upload API (authenticated)
app.route('/api/upload', uploadApiRoutes);

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

// Agency assessment templates
app.route('/api/agencies/me/templates', agencyTemplatesRoutes);

// Agency assessment benchmarks
app.route('/api/agencies/me/benchmarks', assessmentBenchmarksRoutes);

// Tenant assessments
app.route('/api/tenants/:tenantId/assessments', assessmentsRoutes);

// Assessment responses (nested under assessments)
app.route('/api/tenants/:tenantId/assessments/:assessmentId/responses', assessmentResponseRoutes);

// Admin routes
app.route('/api/admin/impersonate', impersonationRoutes);

// Onboarding routes
app.route('/api/onboarding', onboardingRoutes);

// Notifications routes
app.route('/api/notifications', notificationsRoutes);

// Mentoring routes (role-scoped)
app.route('/api/tenants/:tenantId/mentoring', mentoringRoutes);

// Permissions routes (role/user nav overrides)
app.route('/api/tenants/:tenantId/permissions', permissionsRoutes);

// Analytics routes (agency + tenant)
app.route('/api/analytics', analyticsRoutes);

// Survey routes (protected)
app.route('/api/tenants/:tenantId/surveys', surveysRoutes);
app.route('/api/agencies/me/surveys', agencySurveysRoutes);

// Planning & Goals routes (tenant-scoped)
app.route('/api/tenants/:tenantId/planning', planningRoutes);

// Scorecard routes (tenant-scoped)
app.route('/api/tenants/:tenantId/scorecard', scorecardRoutes);

// Search routes (tenant-scoped)
app.route('/api/tenants/:tenantId/search', searchRoutes);

// Program resources (tenant-scoped, nested under programs)
app.route('/api/tenants/:tenantId/programs/:programId/resources', resourcesRoutes);

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
