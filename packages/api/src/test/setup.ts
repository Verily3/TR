// This file runs BEFORE any test module is imported.
// Sets all env vars required by env.ts before validateEnv() calls process.exit(1).

process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-32-characters-long!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters-long!';
process.env.NODE_ENV = 'test';
process.env.WEB_URL = 'http://localhost:3003';
process.env.APP_URL = 'http://localhost:3003';
