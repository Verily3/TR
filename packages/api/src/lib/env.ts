import { z } from 'zod';

const envSchema = z.object({
  API_PORT: z.string().default('3002').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(43, 'JWT_ACCESS_SECRET must be at least 43 characters (256-bit Base64)'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(43, 'JWT_REFRESH_SECRET must be at least 43 characters (256-bit Base64)'),
  WEB_URL: z.string().default('http://localhost:3003'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ADMIN_SECRET: z.string().optional(),
  AUTO_MIGRATE: z.string().default('false'),
  RESEND_API_KEY: z.string().optional(),
  APP_URL: z.string().default('http://localhost:3003'),
  CRON_SECRET: z.string().optional(),

  // File Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./uploads'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment variable validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const data = result.data;

  // Warn about missing secrets that affect security
  if (!data.ADMIN_SECRET) {
    console.warn('⚠️  ADMIN_SECRET is not set — /api/admin/db/* endpoints are disabled');
  }
  if (!data.CRON_SECRET) {
    console.warn('⚠️  CRON_SECRET is not set — /api/cron/* endpoints will reject all requests');
  }

  return data;
}

export const env = validateEnv();
