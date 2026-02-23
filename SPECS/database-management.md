# Database Management — Admin Reference

## Page URL

**Production:** https://transforming-results-952706457090.us-east1.run.app/agency/database

**Local:** http://localhost:3003/agency/database

---

## Admin Secret

```
437f2393f5b7ae468c749f1cc2f41e571c9563f6c822cdbca2aac59e2237fb2e
```

This is the `ADMIN_SECRET` environment variable. No fallback — must be set explicitly.

---

## API Endpoints

All endpoints are secured by the admin secret (query param or `X-Admin-Secret` header). No JWT auth required — works even before the database is initialized.

### POST /api/admin/db/verify

Validates an admin secret. Used by the frontend before storing it in sessionStorage.

```bash
curl -X POST https://transforming-results-952706457090.us-east1.run.app/api/admin/db/verify \
  -H "Content-Type: application/json" \
  -d '{"secret":"437f2393f5b7ae468c749f1cc2f41e571c9563f6c822cdbca2aac59e2237fb2e"}'
```

**Response:** `{"data":{"valid":true}}`

### GET /api/admin/db/health?secret=...

Returns database connection status, PostgreSQL version, table list with row counts, and migration status. Does not modify anything.

```bash
curl "https://transforming-results-952706457090.us-east1.run.app/api/admin/db/health?secret=437f2393f5b7ae468c749f1cc2f41e571c9563f6c822cdbca2aac59e2237fb2e" \
  -H "Accept: application/json"
```

**Response includes:**

- `connection`: connected (bool), latencyMs, postgresVersion, databaseUrl (masked)
- `tables`: array of {schema, name, estimatedRows}
- `migrations`: applied count, available count, pending count, appliedList, availableFiles

### GET /api/admin/db/migrate?secret=...

Runs all pending Drizzle ORM migrations and returns detailed results. Returns HTML by default (for browser viewing) or JSON with `Accept: application/json` header.

```bash
# JSON response
curl "https://transforming-results-952706457090.us-east1.run.app/api/admin/db/migrate?secret=437f2393f5b7ae468c749f1cc2f41e571c9563f6c822cdbca2aac59e2237fb2e" \
  -H "Accept: application/json"

# HTML response (open in browser)
https://transforming-results-952706457090.us-east1.run.app/api/admin/db/migrate?secret=437f2393f5b7ae468c749f1cc2f41e571c9563f6c822cdbca2aac59e2237fb2e
```

**Response includes:**

- `success`: boolean
- `durationMs`: execution time
- `appliedBefore` / `appliedAfter`: migration hashes
- `newlyApplied`: migrations applied in this run
- `availableMigrations`: SQL files on disk
- `logs`: step-by-step execution log
- `error` / `errorStack`: if failed

### GET /api/admin/db/status?secret=...

Returns current applied migrations without running anything.

```bash
curl "https://transforming-results-952706457090.us-east1.run.app/api/admin/db/status?secret=437f2393f5b7ae468c749f1cc2f41e571c9563f6c822cdbca2aac59e2237fb2e"
```

---

## Auto-Migration on Deploy

Set the environment variable `AUTO_MIGRATE=true` on Cloud Run to automatically run pending migrations when the API server starts. The API server entry point checks this flag on startup.

Alternatively, set `RUN_MIGRATIONS=true` to run migrations via the Docker entrypoint script before the servers start.

---

## Current Database State (as of 2026-02-16)

| Metric             | Value                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| PostgreSQL Version | 17.7                                                                                 |
| Database URL       | postgres://transforming-results-user24:\*\*\*\*@34.30.95.0:5432/transforming-results |
| Total Tables       | 34                                                                                   |
| Applied Migrations | 9 of 9                                                                               |
| Pending Migrations | 0                                                                                    |
| Connection Latency | ~220ms                                                                               |

### Migration Files

| #   | File                            |
| --- | ------------------------------- |
| 0   | 0000_nosy_longshot.sql          |
| 1   | 0001_loving_hitman.sql          |
| 2   | 0002_bitter_cobalt_man.sql      |
| 3   | 0003_lame_leech.sql             |
| 4   | 0004_famous_trish_tilby.sql     |
| 5   | 0005_lovely_shriek.sql          |
| 6   | 0006_ordinary_tinkerer.sql      |
| 7   | 0007_vengeful_virginia_dare.sql |
| 8   | 0008_elite_silver_samurai.sql   |

---

## How to Use the Page

1. Log in as `admin@acme.com` (password: `password123`) — must be an agency account
2. Navigate to `/agency/database`
3. Enter the admin secret above and click **Unlock**
4. **Database Health** card shows connection, tables, and migration status
5. **SQL Migrations** card lets you:
   - **Check Status** — logs current migration info to the terminal
   - **Run Migrations** — confirms, then executes pending migrations with live output
6. Click **Lock** (top right) to re-lock the page
7. The secret is stored in `sessionStorage` and clears when the browser tab closes

---

## Files

| File                                                        | Purpose                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/web/src/app/(dashboard)/agency/database/page.tsx` | Frontend page (SecretGate, HealthCard, MigrationCard, Terminal, Help) |
| `packages/web/src/hooks/api/useAdminDb.ts`                  | React Query hooks (useVerifySecret, useDbHealth, useRunMigrations)    |
| `packages/api/src/routes/admin/db.ts`                       | API routes (verify, health, migrate, status)                          |
| `packages/db/src/migrate.ts`                                | Programmatic migration runner (runMigrations function)                |

---

## Test Accounts

| Email                    | Role         | Password    |
| ------------------------ | ------------ | ----------- |
| admin@acme.com           | Agency Owner | password123 |
| admin@techcorp.com       | Tenant Admin | password123 |
| coach@techcorp.com       | Facilitator  | password123 |
| mentor@techcorp.com      | Mentor       | password123 |
| john.doe@techcorp.com    | Learner      | password123 |
| jane.smith@techcorp.com  | Learner      | password123 |
| alex.wilson@techcorp.com | Learner      | password123 |
