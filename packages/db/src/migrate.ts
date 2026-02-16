import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationResult {
  success: boolean;
  timestamp: string;
  durationMs: number;
  databaseUrl: string; // masked
  migrationsFolder: string;
  appliedBefore: string[];
  appliedAfter: string[];
  newlyApplied: string[];
  availableMigrations: string[];
  pending: string[];
  logs: string[];
  error?: string;
  errorStack?: string;
}

/**
 * Resolve the drizzle migrations folder.
 * Works whether running from src/ (tsx) or dist/ (compiled).
 * Both resolve to packages/db/drizzle/ via ../drizzle from __dirname.
 */
function resolveMigrationsFolder(): string {
  // __dirname is packages/db/src or packages/db/dist
  const folder = path.resolve(__dirname, '..', 'drizzle');
  if (fs.existsSync(folder)) return folder;

  // Fallback: try relative to cwd
  const cwdFolder = path.resolve(process.cwd(), 'packages', 'db', 'drizzle');
  if (fs.existsSync(cwdFolder)) return cwdFolder;

  throw new Error(
    `Cannot find drizzle migrations folder. Tried:\n  - ${folder}\n  - ${cwdFolder}`
  );
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return url.replace(/:[^@]+@/, ':****@');
  }
}

function listSqlFiles(folder: string): string[] {
  try {
    return fs
      .readdirSync(folder)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    return [];
  }
}

async function getAppliedMigrations(sql: postgres.Sql): Promise<string[]> {
  try {
    const rows = await sql`
      SELECT hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at ASC
    `;
    return rows.map((r: any) => `${r.hash} (${r.created_at})`);
  } catch {
    // Table might not exist yet on first run
    return [];
  }
}

/**
 * Run all pending Drizzle migrations programmatically.
 * Creates a dedicated short-lived connection, runs migrations, and returns detailed results.
 */
export async function runMigrations(databaseUrl?: string): Promise<MigrationResult> {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs: 0,
      databaseUrl: '(not set)',
      migrationsFolder: '(not resolved)',
      appliedBefore: [],
      appliedAfter: [],
      newlyApplied: [],
      availableMigrations: [],
      pending: [],
      logs: [],
      error: 'DATABASE_URL environment variable is not set',
    };
  }

  const start = Date.now();
  const logs: string[] = [];
  let migrationsFolder = '';
  let sql: postgres.Sql | null = null;

  try {
    // Resolve migrations folder
    migrationsFolder = resolveMigrationsFolder();
    logs.push(`Migrations folder: ${migrationsFolder}`);

    const availableMigrations = listSqlFiles(migrationsFolder);
    logs.push(`Available migration files: ${availableMigrations.length}`);

    // Create dedicated migration connection (max 1)
    sql = postgres(url, { max: 1, connect_timeout: 15 });
    logs.push('Database connection established');

    // Check what's already applied
    const appliedBefore = await getAppliedMigrations(sql);
    logs.push(`Previously applied migrations: ${appliedBefore.length}`);

    // Run migrations
    const migrationDb = drizzle(sql);
    logs.push('Starting migration...');
    await migrate(migrationDb, { migrationsFolder });
    logs.push('Migration command completed');

    // Check what's applied now
    const appliedAfter = await getAppliedMigrations(sql);
    const newlyApplied =
      appliedAfter.length > appliedBefore.length
        ? appliedAfter.slice(appliedBefore.length)
        : [];

    logs.push(`Newly applied: ${newlyApplied.length}`);

    const duration = Date.now() - start;
    logs.push(`Total duration: ${duration}ms`);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      databaseUrl: maskUrl(url),
      migrationsFolder,
      appliedBefore,
      appliedAfter,
      newlyApplied,
      availableMigrations,
      pending: [],
      logs,
    };
  } catch (err: any) {
    const duration = Date.now() - start;
    logs.push(`FAILED after ${duration}ms: ${err.message}`);

    // Try to get current state even after failure
    let appliedBefore: string[] = [];
    try {
      if (sql) appliedBefore = await getAppliedMigrations(sql);
    } catch {}

    return {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      databaseUrl: maskUrl(url),
      migrationsFolder,
      appliedBefore,
      appliedAfter: appliedBefore,
      newlyApplied: [],
      availableMigrations: listSqlFiles(migrationsFolder),
      pending: [],
      logs,
      error: err.message,
      errorStack: err.stack,
    };
  } finally {
    if (sql) {
      try {
        await sql.end();
      } catch {}
    }
  }
}

// CLI support: run directly with `tsx src/migrate.ts`
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'));

if (isDirectRun) {
  console.log('Running database migrations...');
  runMigrations()
    .then((result) => {
      if (result.success) {
        console.log(`Migrations completed successfully (${result.durationMs}ms)`);
        if (result.newlyApplied.length > 0) {
          console.log(`Applied ${result.newlyApplied.length} new migration(s):`);
          result.newlyApplied.forEach((m) => console.log(`  + ${m}`));
        } else {
          console.log('Database is up to date.');
        }
      } else {
        console.error('Migration failed:', result.error);
        if (result.errorStack) console.error(result.errorStack);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
