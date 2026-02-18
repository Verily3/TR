import { Hono } from 'hono';
import { runMigrations, type MigrationResult } from '@tr/db';
import { sql } from 'drizzle-orm';

const adminDbRoutes = new Hono();

/**
 * Verify the admin secret from query param or header.
 * Uses ADMIN_SECRET env var, falls back to JWT_ACCESS_SECRET.
 */
function verifySecret(secret: string | undefined): boolean {
  const expected =
    process.env.ADMIN_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!expected) return false;
  return secret === expected;
}

/**
 * Render migration result as a detailed HTML page.
 */
function renderHtml(result: MigrationResult): string {
  const statusColor = result.success ? '#16a34a' : '#dc2626';
  const statusText = result.success ? 'SUCCESS' : 'FAILED';
  const statusEmoji = result.success ? '&#9989;' : '&#10060;';

  const section = (title: string, items: string[], empty = 'None') => {
    if (!items.length) return `<h3>${title}</h3><p class="empty">${empty}</p>`;
    return `<h3>${title}</h3><ol>${items.map((i) => `<li><code>${escHtml(i)}</code></li>`).join('')}</ol>`;
  };

  const escHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Database Migration — ${statusText}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0f172a; color: #e2e8f0; padding: 2rem; line-height: 1.6; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  h2 { font-size: 1.1rem; color: #94a3b8; font-weight: normal; margin-bottom: 2rem; }
  h3 { font-size: 0.95rem; color: #7dd3fc; margin: 1.5rem 0 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .status { display: inline-block; padding: 0.3rem 1rem; border-radius: 4px; font-weight: bold; font-size: 1.1rem; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}44; margin-bottom: 1rem; }
  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: #1e293b; border-radius: 8px; }
  .meta-item label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-item span { font-size: 0.9rem; color: #e2e8f0; }
  ol, ul { padding-left: 1.5rem; }
  li { margin: 0.25rem 0; font-size: 0.85rem; }
  code { background: #1e293b; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.85rem; }
  .empty { color: #64748b; font-style: italic; font-size: 0.85rem; }
  .error-box { background: #dc262622; border: 1px solid #dc262644; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  .error-box h3 { color: #fca5a5; margin-top: 0; }
  .error-box pre { white-space: pre-wrap; word-break: break-all; font-size: 0.8rem; color: #fca5a5; max-height: 400px; overflow-y: auto; }
  .logs { background: #1e293b; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
  .logs p { font-size: 0.8rem; color: #94a3b8; margin: 0.15rem 0; font-family: monospace; }
  .logs p::before { content: "▸ "; color: #475569; }
  .copy-btn { background: #334155; color: #e2e8f0; border: 1px solid #475569; padding: 0.4rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; float: right; }
  .copy-btn:hover { background: #475569; }
  .json-section { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #334155; }
  .json-section pre { background: #1e293b; padding: 1rem; border-radius: 8px; font-size: 0.75rem; max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-all; }
  footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #334155; color: #475569; font-size: 0.75rem; }
</style>
</head>
<body>
<div class="container">
  <h1>${statusEmoji} Database Migration</h1>
  <h2>Transformation OS — Drizzle ORM</h2>
  <div class="status">${statusText}</div>

  <div class="meta">
    <div class="meta-item">
      <label>Timestamp</label>
      <span>${result.timestamp}</span>
    </div>
    <div class="meta-item">
      <label>Duration</label>
      <span>${result.durationMs}ms</span>
    </div>
    <div class="meta-item">
      <label>Database</label>
      <span><code>${escHtml(result.databaseUrl)}</code></span>
    </div>
    <div class="meta-item">
      <label>Migrations Folder</label>
      <span><code>${escHtml(result.migrationsFolder)}</code></span>
    </div>
  </div>

  ${
    result.newlyApplied.length > 0
      ? section('Newly Applied', result.newlyApplied)
      : '<h3>Newly Applied</h3><p class="empty">No new migrations — database is up to date.</p>'
  }

  ${section('Available Migration Files', result.availableMigrations, 'No SQL files found')}

  ${section('Previously Applied', result.appliedBefore, 'None (fresh database)')}

  ${section('Total Applied After Run', result.appliedAfter, 'None')}

  ${
    result.error
      ? `<div class="error-box">
    <h3>Error Details</h3>
    <p><strong>${escHtml(result.error)}</strong></p>
    ${result.errorStack ? `<pre>${escHtml(result.errorStack)}</pre>` : ''}
  </div>`
      : ''
  }

  <div class="logs">
    <h3 style="margin-top:0">Execution Log</h3>
    ${result.logs.map((l) => `<p>${escHtml(l)}</p>`).join('')}
  </div>

  <div class="json-section">
    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('json-data').textContent)">Copy JSON</button>
    <h3>Raw JSON (for sharing)</h3>
    <pre id="json-data">${escHtml(JSON.stringify(result, null, 2))}</pre>
  </div>

  <footer>
    Transformation OS &mdash; Admin Database Management<br>
    Endpoint: GET /api/admin/db/migrate?secret=...
  </footer>
</div>
</body>
</html>`;
}

/**
 * GET /admin/db/migrate?secret=YOUR_SECRET
 *
 * Runs all pending Drizzle migrations and returns detailed results.
 * No JWT auth required — secured by admin secret so it works even
 * when the database hasn't been set up yet.
 *
 * Returns HTML (for browser viewing) or JSON (Accept: application/json).
 */
adminDbRoutes.get('/migrate', async (c) => {
  const secret = c.req.query('secret') || c.req.header('X-Admin-Secret');

  if (!verifySecret(secret)) {
    return c.html(
      `<html><body style="font-family:monospace;background:#0f172a;color:#fca5a5;padding:2rem">
        <h1>&#10060; 401 Unauthorized</h1>
        <p>Invalid or missing secret. Provide <code>?secret=YOUR_SECRET</code> query parameter or <code>X-Admin-Secret</code> header.</p>
        <p style="color:#64748b;margin-top:1rem">The secret is your <code>ADMIN_SECRET</code> env var (or <code>JWT_ACCESS_SECRET</code> if ADMIN_SECRET is not set).</p>
      </body></html>`,
      401
    );
  }

  const result = await runMigrations();
  const status = result.success ? 200 : 500;

  // Return JSON if requested
  const accept = c.req.header('Accept') || '';
  if (accept.includes('application/json')) {
    return c.json({ data: result }, status);
  }

  return c.html(renderHtml(result), status);
});

/**
 * GET /admin/db/status?secret=YOUR_SECRET
 *
 * Returns current migration status without running anything.
 */
adminDbRoutes.get('/status', async (c) => {
  const secret = c.req.query('secret') || c.req.header('X-Admin-Secret');

  if (!verifySecret(secret)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { db } = await import('@tr/db');
    const rows = await db.execute(
      // @ts-ignore - raw SQL
      `SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at ASC`
    );

    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      appliedMigrations: rows.length,
      migrations: rows,
    });
  } catch (err: any) {
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err.message,
    }, 500);
  }
});

/**
 * POST /admin/db/verify
 *
 * Validates an admin secret. Used by the frontend to check the secret
 * before storing it in sessionStorage.
 */
adminDbRoutes.post('/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const secret = body.secret || c.req.header('X-Admin-Secret');
  return c.json({ data: { valid: verifySecret(secret) } });
});

/**
 * GET /admin/db/health?secret=YOUR_SECRET
 *
 * Returns comprehensive database health information without modifying anything.
 * Includes connection status, PostgreSQL version, table list with row counts,
 * and migration status (applied vs available).
 */
adminDbRoutes.get('/health', async (c) => {
  const secret = c.req.query('secret') || c.req.header('X-Admin-Secret');

  if (!verifySecret(secret)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const start = Date.now();

  try {
    const { db } = await import('@tr/db');

    // Test connection + measure latency
    const connStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - connStart;

    // PostgreSQL version
    let postgresVersion = 'unknown';
    try {
      const versionRows = await db.execute(sql`SHOW server_version`);
      if (versionRows.length > 0) {
        postgresVersion = (versionRows[0] as any).server_version || 'unknown';
      }
    } catch {}

    // Table list with estimated row counts
    let tables: { schema: string; name: string; estimatedRows: number }[] = [];
    try {
      const tableRows = await db.execute(sql`
        SELECT schemaname as schema, relname as name, n_live_tup as estimated_rows
        FROM pg_stat_user_tables
        ORDER BY schemaname, relname
      `);
      tables = tableRows.map((r: any) => ({
        schema: r.schema,
        name: r.name,
        estimatedRows: Number(r.estimated_rows) || 0,
      }));
    } catch {}

    // Applied migrations
    let appliedList: { hash: string; createdAt: string }[] = [];
    try {
      const migRows = await db.execute(
        sql`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at ASC`
      );
      appliedList = migRows.map((r: any) => ({
        hash: String(r.hash),
        createdAt: String(r.created_at),
      }));
    } catch {}

    // Available migration files from disk
    let availableFiles: string[] = [];
    try {
      const { resolveMigrationsFolder, listMigrationFiles } = await import('@tr/db');
      const folder = resolveMigrationsFolder();
      availableFiles = listMigrationFiles(folder);
    } catch {
      // Fallback: count from _journal.json is fine, files just won't be listed
    }

    // Masked database URL
    let databaseUrl = '(unknown)';
    try {
      const rawUrl = process.env.DATABASE_URL || '';
      const u = new URL(rawUrl);
      if (u.password) u.password = '****';
      databaseUrl = u.toString();
    } catch {
      databaseUrl = (process.env.DATABASE_URL || '').replace(/:[^@]+@/, ':****@');
    }

    return c.json({
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - start,
        connection: {
          connected: true,
          latencyMs,
          postgresVersion,
          databaseUrl,
        },
        tables,
        migrations: {
          applied: appliedList.length,
          available: availableFiles.length,
          pending: Math.max(0, availableFiles.length - appliedList.length),
          appliedList,
          availableFiles,
        },
      },
    });
  } catch (err: any) {
    return c.json({
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - start,
        connection: { connected: false, latencyMs: 0, postgresVersion: 'unknown', databaseUrl: '(error)' },
        tables: [],
        migrations: { applied: 0, available: 0, pending: 0, appliedList: [], availableFiles: [] },
        error: err.message,
      },
    }, 500);
  }
});

export { adminDbRoutes };
