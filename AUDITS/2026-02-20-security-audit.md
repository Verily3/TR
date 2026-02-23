# Security Audit — Results Tracking System

> Date: 2026-02-20
> Scope: Full API stack — auth middleware, JWT handling, route authorization, multi-tenant isolation, input validation, CORS, admin routes
> Status: 19 issues found (0 critical, 6 high, 7 medium, 6 low)
> Fixed (2026-02-20): H-01✓, H-02✓, H-03✓, H-04✓, H-05✓, H-06✓, M-01✓, M-02✓, M-03✓, M-05✓, M-06✓, M-07✓, L-01✓, L-02✓, L-03✓, L-04✓, L-05✓ — All 3 phases complete
> Fixed (2026-02-22): M-04✓ (JWT min-length raised to 43 chars), L-06✓ (CSRF architecture documented in app.ts) — **All 19 issues resolved**
> Also fixed (2026-02-22, frontend): API client fetch timeout (30s), 401 auto-refresh interceptor, logout redirect, concurrent refresh mutex

---

## Scope & Methodology

Two parallel sweeps were performed on the API codebase:

1. **Auth & Middleware sweep** — `middleware/auth.ts`, `routes/auth.ts`, `lib/jwt.ts`, `lib/env.ts`, `app.ts`, `.env.example`
2. **Route Authorization sweep** — all files in `routes/`, focusing on IDOR, tenant isolation, and missing guards

**Key architectural note:** Global `app.use('/api/*', authMiddleware())` is applied at line 90 of `app.ts`, _after_ all intentionally public routes are mounted (`/api/auth`, `/api/admin/db`, `/api/cron`, `/api/assessments/respond`, `/api/assessments/setup`, `/api/surveys`). This means all other routes are covered by auth. Claimed "missing auth" findings from automated analysis that ignore this global middleware are marked **[FALSE POSITIVE]** below.

---

## Summary

| ID   | Title                                                                 | Severity | File                            | Line    |
| ---- | --------------------------------------------------------------------- | -------- | ------------------------------- | ------- |
| H-01 | No rate limiting anywhere                                             | High     | `app.ts`                        | 37–58   |
| H-02 | No refresh token rotation                                             | High     | `routes/auth.ts`                | 116–135 |
| H-03 | Impersonation leaks admin permissions to target                       | High     | `middleware/auth.ts`            | 88      |
| H-04 | X-Admin-Secret in CORS allowHeaders                                   | High     | `app.ts`                        | 56      |
| H-05 | Mentoring relationship: users not validated to belong to tenant       | High     | `routes/mentoring.ts`           | 162–179 |
| H-06 | Password reset uses randomUUID (128-bit) — should use randomBytes(32) | High     | `routes/auth.ts`                | 278     |
| M-01 | Admin secret falls back to JWT_ACCESS_SECRET                          | Medium   | `routes/admin/db.ts`            | 12–13   |
| M-02 | Admin secret comparison vulnerable to timing attack                   | Medium   | `routes/admin/db.ts`            | 15      |
| M-03 | CRON_SECRET optional — endpoint unprotected if not set                | Medium   | `lib/env.ts` / `routes/cron.ts` | —       |
| M-04 | JWT secret validated by length only (not entropy)                     | Medium   | `lib/env.ts`                    | 5–6     |
| M-05 | Silent token verification failures — no logging                       | Medium   | `lib/jwt.ts`                    | 55–61   |
| M-06 | CORS: WEB_URL falls back to localhost if unset                        | Medium   | `app.ts`                        | 52      |
| M-07 | Impersonation: no role-level hierarchy enforcement                    | Medium   | `routes/admin/impersonation.ts` | 27–120  |
| L-01 | Password minimum 8 chars (NIST recommends 12+)                        | Low      | `routes/auth.ts`                | 291     |
| L-02 | No login attempt logging                                              | Low      | `routes/auth.ts`                | —       |
| L-03 | Email addresses not normalised to lowercase                           | Low      | Multiple routes                 | —       |
| L-04 | X-Forwarded-For spoofable for session audit log                       | Low      | `routes/auth.ts`                | 76      |
| L-05 | Timezone input not validated against IANA list                        | Low      | `routes/agencies.ts`            | —       |
| L-06 | No CSRF tokens (acceptable for header-based auth, document)           | Low      | All routes                      | —       |

---

## High Severity

### H-01: No Rate Limiting Anywhere

**File:** `packages/api/src/app.ts` — lines 37–58
**Status:** Unfixed

Global middleware stack has no rate limiting:

```typescript
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', timeout(30_000));
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
app.use('*', cors({...}));
// ← No rate limiter
```

The following endpoints are open to brute-force and DoS:

- `POST /api/auth/login` — unlimited password attempts
- `POST /api/auth/forgot-password` — inbox flooding, email service quota exhaustion
- `POST /api/tenants/:id/assessments/:id/responses` — public rater form spam
- `GET /api/admin/db/health` — cheap DB probe

**Fix:** Add `hono-rate-limiter` (or `@hono/rate-limiter`):

```typescript
import { rateLimiter } from 'hono-rate-limiter';

// Global: 200 req/min per IP
app.use('*', rateLimiter({ windowMs: 60_000, limit: 200, keyGenerator: (c) => c.req.header('x-real-ip') ?? 'anon' }));

// Tight: auth endpoints 10 req/min per IP
app.use('/api/auth/*', rateLimiter({ windowMs: 60_000, limit: 10, ... }));
```

---

### H-02: No Refresh Token Rotation

**File:** `packages/api/src/routes/auth.ts` — lines 116–135
**Status:** Unfixed

`POST /api/auth/refresh` returns a new access token but reuses the same refresh token:

```typescript
// Only a new access token is returned — refresh token never rotates
const accessToken = await jwtService.generateAccessToken({...});
return c.json({ data: { accessToken, expiresIn: 15 * 60 } });
// refreshToken stays in the DB unchanged
```

If a refresh token is stolen, the attacker silently generates access tokens for up to 7 days with no way to invalidate the session (short of manual DB intervention).

**Fix:** Issue a new refresh token on every `/refresh` call, rotate the DB session record, and return `newRefreshToken` in the response. Client must persist the new token immediately.

---

### H-03: Impersonation Leaks Admin Permissions to Target User

**File:** `packages/api/src/middleware/auth.ts` — line 88
**Status:** Unfixed

When an admin impersonates a learner, the admin's own permissions from the JWT payload are placed in the request context:

```typescript
c.set('user', {
  id: targetUser.id,
  roleSlug: role?.slug ?? 'learner',      // ← Target user's role
  roleLevel: role?.level ?? 10,           // ← Target user's level
  permissions: payload.permissions,       // ← ADMIN's permissions ← BUG
  isImpersonating: true,
  ...
});
```

The comment reads "Keep admin permissions for safety" but this has the opposite effect: while impersonating, the target user context is granted all admin capabilities. Any permission check (e.g., `PROGRAMS_MANAGE`, `AGENCY_IMPERSONATE`) that the learner should fail will pass.

**Fix:**

```typescript
// Resolve target user's actual permissions from DB
const targetPerms = await resolveUserPermissions(targetUser.id, targetUser.tenantId);
c.set('user', {
  ...
  permissions: targetPerms,  // Target user's permissions only
  impersonatedBy: { userId: session.adminUserId, adminPermissions: payload.permissions },
});
```

---

### H-04: X-Admin-Secret Allowed in CORS Headers

**File:** `packages/api/src/app.ts` — line 56
**Status:** Unfixed

```typescript
allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Impersonation-Token', 'X-Admin-Secret'],
```

`X-Admin-Secret` is listed as an allowed CORS header, meaning browsers can send it cross-origin. Any developer who accidentally stores the admin secret in client-side code (localStorage, JS bundle) and auto-attaches it as a header will have it accepted cross-origin. The admin secret should never be sent by browsers.

**Fix:** Remove `X-Admin-Secret` from `allowHeaders`. Admin DB routes are pre-auth and only intended for server-to-server or CLI use.

---

### H-05: Mentoring Relationship — Users Not Validated to Belong to Tenant

**File:** `packages/api/src/routes/mentoring.ts` — lines 162–179
**Status:** Unfixed

`POST /api/tenants/:tenantId/mentoring/relationships` accepts `mentorId` and `menteeId` UUIDs and inserts them without checking they belong to the specified tenant:

```typescript
const parsed = z.object({
  mentorId: z.string().uuid(),
  menteeId: z.string().uuid(),
  ...
}).parse(body);

const [row] = await db
  .insert(mentoringRelationships)
  .values({ tenantId, ...parsed })  // ← No ownership check
  .returning();
```

An admin could cross-link users from different tenants by supplying foreign UUIDs.

**Fix:** Before insert, verify both users belong to `tenantId`:

```typescript
const [mentor, mentee] = await Promise.all([
  db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, parsed.mentorId), eq(users.tenantId, tenantId)))
    .limit(1),
  db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, parsed.menteeId), eq(users.tenantId, tenantId)))
    .limit(1),
]);
if (!mentor[0] || !mentee[0]) throw new BadRequestError('Users must belong to the same tenant');
```

---

### H-06: Password Reset Token Uses randomUUID (128-bit)

**File:** `packages/api/src/routes/auth.ts` — line 278
**Status:** Unfixed

```typescript
const token = crypto.randomUUID(); // 122 bits of entropy
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
```

OWASP recommends 256-bit tokens for security-critical operations like password reset (used by unauthenticated callers). UUIDs are 122 bits.

**Fix:**

```typescript
const token = crypto.randomBytes(32).toString('hex'); // 256 bits
```

---

## Medium Severity

### M-01: Admin Secret Falls Back to JWT_ACCESS_SECRET

**File:** `packages/api/src/routes/admin/db.ts` — lines 12–13
**Status:** Unfixed

```typescript
const expected = process.env.ADMIN_SECRET || process.env.JWT_ACCESS_SECRET;
```

If `ADMIN_SECRET` is not set (common during development), the JWT signing secret doubles as the admin DB migration secret. Compromise of one key compromises both operations. Also creates implicit coupling between two independent secret domains.

**Fix:** Require `ADMIN_SECRET` explicitly; throw on startup if missing:

```typescript
const expected = process.env.ADMIN_SECRET;
if (!expected) throw new Error('ADMIN_SECRET env var is required');
```

---

### M-02: Admin Secret Comparison Vulnerable to Timing Attack

**File:** `packages/api/src/routes/admin/db.ts` — line 15
**Status:** Unfixed

```typescript
return secret === expected; // String equality — timing-observable
```

The JavaScript `===` operator short-circuits on the first differing character. An attacker who can measure response times (e.g., over a high-bandwidth local connection) can oracle the secret character by character.

**Fix:**

```typescript
return crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
```

---

### M-03: CRON_SECRET Is Optional — Endpoint Unprotected If Not Set

**File:** `packages/api/src/lib/env.ts` / `packages/api/src/routes/cron.ts`
**Status:** Unfixed

`CRON_SECRET` is declared optional. If not set, the cron endpoint can be triggered by any caller:

```typescript
// env.ts
CRON_SECRET: z.string().optional(),

// cron.ts
if (!env.CRON_SECRET || secret !== env.CRON_SECRET) { return 401; }
// If CRON_SECRET is undefined → !undefined === true → always 401 ✓
// BUT: the optional declaration misleads developers into thinking it's safe to omit
```

The guard logic is technically correct when undefined (always rejects), but the `optional()` declaration invites developers to leave it unset in production thinking "it's optional."

**Fix:** Make `CRON_SECRET` required in `env.ts` and document it in `.env.example`:

```typescript
CRON_SECRET: z.string().min(32, 'CRON_SECRET required to secure cron endpoints'),
```

---

### M-04: JWT Secret Validated by Length Only (Not Entropy)

**File:** `packages/api/src/lib/env.ts` — lines 5–6
**Status:** Unfixed

```typescript
JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
```

A 32-character string such as `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` passes validation but has near-zero entropy. OWASP recommends 256-bit (43+ Base64 chars) for HMAC-SHA256 signing keys.

**Fix:**

- Increase minimum to 43 characters (256-bit Base64)
- Update `.env.example` with generation command:

```bash
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=<output>
JWT_REFRESH_SECRET=<output>
```

---

### M-05: Silent Token Verification Failures — No Logging

**File:** `packages/api/src/lib/jwt.ts` — lines 55–61
**Status:** Unfixed

```typescript
async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, this.accessSecret);
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;  // Silent failure — no log, no reason captured
  }
}
```

Failed token verifications (expired, bad signature, malformed) are silently swallowed. An attacker probing with forged JWTs leaves no trace.

**Fix:** Log the failure reason (without leaking the token itself):

```typescript
} catch (err) {
  const reason = err instanceof errors.JWTExpired ? 'expired'
    : err instanceof errors.JWTInvalid ? 'invalid'
    : 'unknown';
  console.warn(`[JWT] Verification failed: ${reason}`);
  return null;
}
```

---

### M-06: CORS WEB_URL Falls Back to localhost in Production

**File:** `packages/api/src/app.ts` — line 52
**Status:** Unfixed

```typescript
origin: [
  'http://localhost:3003',
  'http://localhost:5173',
  process.env.WEB_URL || 'http://localhost:3003',  // Fallback is localhost
],
```

If `WEB_URL` is unset in production, `localhost:3003` appears three times in the allowlist. This is harmless in itself but indicates `WEB_URL` is silently missing. An incorrect production URL would allow requests only from localhost.

**Fix:** Fail loudly in production if `WEB_URL` is missing:

```typescript
if (process.env.NODE_ENV === 'production' && !process.env.WEB_URL) {
  throw new Error('WEB_URL environment variable is required in production');
}
const allowedOrigins = ['http://localhost:3003', 'http://localhost:5173'];
if (process.env.WEB_URL) allowedOrigins.push(process.env.WEB_URL);
```

---

### M-07: Impersonation Does Not Enforce Role Hierarchy

**File:** `packages/api/src/routes/admin/impersonation.ts`
**Status:** Unfixed

The impersonation start route correctly prevents impersonating across agencies and prevents impersonating other agency-level users. However, there is no check that the _impersonating admin's_ role level is higher than the target. A lower-privilege agency user (if somehow granted `AGENCY_IMPERSONATE`) could impersonate a higher-privilege tenant admin.

**Fix:** Add role level check after fetching target user:

```typescript
const [targetRole] = await db
  .select({ level: roles.level })
  .from(userRoles)
  .innerJoin(roles, eq(userRoles.roleId, roles.id))
  .where(eq(userRoles.userId, targetUser.id))
  .limit(1);

if ((targetRole?.level ?? 0) >= adminUser.roleLevel) {
  throw new ForbiddenError('Cannot impersonate a user with equal or higher role level');
}
```

---

## Low Severity

### L-01: Password Minimum Length Is 8 Characters

**File:** `packages/api/src/routes/auth.ts` — line 291
NIST SP 800-63B recommends 12+ characters for user-chosen passwords. Current minimum is 8.

**Fix:** Change `z.string().min(8, ...)` to `z.string().min(12, 'Password must be at least 12 characters')`.

---

### L-02: No Login Attempt Logging

**File:** `packages/api/src/routes/auth.ts`
Failed login attempts are not logged. Without logging, brute-force attempts are invisible.

**Fix:** Add `console.warn('[AUTH] Failed login:', email, 'from', ip)` on authentication failure.

---

### L-03: Email Addresses Not Normalised to Lowercase

**File:** Multiple — `routes/agencies.ts`, `routes/tenants.ts`, `routes/auth.ts`
Emails are stored and compared case-sensitively. `John@example.com` and `john@example.com` are treated as different accounts.

**Fix:** Normalize on write: `email: body.email.toLowerCase().trim()` before all DB inserts/lookups.

---

### L-04: X-Forwarded-For Spoofable for Session Audit Log

**File:** `packages/api/src/routes/auth.ts` — line 76
IP address recorded in session metadata comes from `X-Forwarded-For`, which can be set by any client if the API is directly internet-accessible. Only accept this header if behind a trusted reverse proxy.

---

### L-05: Timezone Input Not Validated Against IANA List

**File:** `packages/api/src/routes/agencies.ts`
`timezone: z.string().max(50).optional()` accepts any string. Invalid timezones stored in the DB will silently cause errors in date calculations.

**Fix:** Validate with `Intl.supportedValuesOf('timeZone')` or an IANA list.

---

### L-06: No CSRF Tokens (Acceptable for Current Architecture)

The API uses `Authorization: Bearer <token>` headers, not cookies. Since `Authorization` headers are not sent automatically by browsers cross-origin, standard CSRF attacks do not apply. **This is acceptable** as long as auth remains header-based.

Document this assumption. If auth is ever migrated to cookies, CSRF tokens become mandatory.

---

## Remediation Plan

### Phase 1 — This Week (High Impact)

| #   | Action                                                          | Effort |
| --- | --------------------------------------------------------------- | ------ |
| 1   | Add `hono-rate-limiter` — global + tight `/api/auth/*` limit    | 1 hr   |
| 2   | Implement refresh token rotation in `POST /api/auth/refresh`    | 2 hr   |
| 3   | Fix impersonation to use target user's permissions, not admin's | 1 hr   |
| 4   | Add mentor/mentee tenant ownership check in mentoring POST      | 30 min |
| 5   | Upgrade password reset token to `randomBytes(32)`               | 15 min |

### Phase 2 — Next Week (Medium Impact)

| #   | Action                                                                | Effort |
| --- | --------------------------------------------------------------------- | ------ |
| 6   | Require explicit `ADMIN_SECRET`; remove JWT fallback                  | 15 min |
| 7   | Replace `===` with `crypto.timingSafeEqual` in admin secret check     | 15 min |
| 8   | Remove `X-Admin-Secret` from CORS `allowHeaders`                      | 5 min  |
| 9   | Make `CRON_SECRET` required in env schema                             | 15 min |
| 10  | Increase JWT secret minimum length to 43 chars; update `.env.example` | 15 min |
| 11  | Add token verification failure logging in `jwt.ts`                    | 15 min |
| 12  | Fail loudly in production if `WEB_URL` unset                          | 15 min |
| 13  | Add impersonation role-level hierarchy check                          | 30 min |

### Phase 3 — Improvements

| #   | Action                                      | Effort |
| --- | ------------------------------------------- | ------ |
| 14  | Raise password minimum to 12 chars          | 5 min  |
| 15  | Add failed login attempt logging            | 15 min |
| 16  | Normalise emails to lowercase on all writes | 1 hr   |
| 17  | Validate timezone against IANA list         | 30 min |

---

## False Positives from Route Sweep

The following were flagged by the route analysis but are **not actual vulnerabilities**:

- **"Assessments GET missing auth"** — FALSE: Mounted at line 115 of `app.ts`, after the global `app.use('/api/*', authMiddleware())` at line 90.
- **"Analytics GET missing auth"** — FALSE: Same; mounted at line 136.
- **"Tenant surveys missing auth"** — FALSE: `surveysRoutes` (tenant-scoped) is mounted at line 139, after the auth middleware. `publicSurveyRoutes` at line 87 is intentionally public (share-token access).
- **"Permissions user list IDOR"** — NOT CONFIRMED: `requireTenantAccess()` in those routes validates the requesting user belongs to the tenant before proceeding. Legitimate by design for multi-tenant admin.

---

## What's Good

- `secureHeaders()` middleware applied globally (X-Frame-Options, NOSNIFF, HSTS, etc.)
- Argon2 password hashing with appropriate parameters
- JWT access tokens short-lived (15 min)
- Impersonation tokens hashed in DB (not plain text), with expiry and one-session-per-admin enforcement
- Agency boundary checks prevent cross-agency impersonation
- Self-impersonation explicitly blocked
- Email enumeration protected in forgot-password (always returns 200)
- Error messages in production do not expose stack traces
- Body size limit (1 MB) prevents oversized payload attacks
- 30-second request timeout prevents slow-loris attacks
