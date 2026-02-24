import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client with explicit pool configuration
const client = postgres(connectionString, {
  max: 25,                        // Connection pool size
  idle_timeout: 30,               // Close idle connections after 30s
  connect_timeout: 10,            // Connection establishment timeout (seconds)
  max_lifetime: 60 * 30,          // Max connection lifetime (30 min)
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for use in other packages
export { schema };

// Export types
export type Database = typeof db;

// Export migration runner and helpers
export { runMigrations, resolveMigrationsFolder, listMigrationFiles } from './migrate.js';
export type { MigrationResult } from './migrate.js';

// Export production seed runner
export { runProductionSeed } from './seed-production.js';
export type { ProductionSeedResult } from './seed-production.js';

// Graceful shutdown: close all database connections
export async function closeDatabase() {
  await client.end();
}
