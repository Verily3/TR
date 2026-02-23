import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@tr/shared',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
