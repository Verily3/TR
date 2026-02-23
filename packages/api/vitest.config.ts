import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    name: '@tr/api',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    isolate: true,
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/test_db',
      JWT_ACCESS_SECRET: 'test-access-secret-minimum-32-characters-long!!',
      JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-32-characters-long!',
      NODE_ENV: 'test',
      WEB_URL: 'http://localhost:3003',
      APP_URL: 'http://localhost:3003',
    },
    server: {
      deps: {
        inline: ['@tr/shared'],
      },
    },
  },
  resolve: {
    alias: {
      '@tr/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
