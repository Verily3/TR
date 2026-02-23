# Full System Audit Report

**Date:** 2026-02-20
**Conducted By:** Three parallel audit agents (API/DB, Frontend, Code Quality/Gaps)
**System Maturity:** ~75% production-ready

---

## Executive Summary

Security Phases 1–3 completed this session (17/19 issues fixed). All core modules built and connected to real data. Remaining gaps: two missing backends (Planning, Scorecard), three pages on mock data, no linter/CI/CD, potential leaked credential (verified NOT in git).

---

## Part 1: Security Audit Status

All security fixes from `2026-02-20-security-audit.md` applied. Summary:

| ID   | Issue                             | Severity     | Status                  |
| ---- | --------------------------------- | ------------ | ----------------------- |
| H-01 | Rate limiting                     | High         | ✅ Fixed                |
| H-02 | Refresh token rotation            | High         | ✅ Fixed                |
| H-03 | Impersonation permission leak     | High         | ✅ Fixed                |
| H-04 | X-Admin-Secret in CORS            | High         | ✅ Fixed                |
| H-05 | Mentoring tenant isolation gap    | High         | ✅ Fixed                |
| H-06 | Password reset token entropy      | High         | ✅ Fixed                |
| M-01 | Admin secret JWT fallback         | Medium       | ✅ Fixed                |
| M-02 | Admin secret timing attack        | Medium       | ✅ Fixed                |
| M-03 | CRON_SECRET optional warning      | Medium       | ✅ Fixed                |
| M-04 | JWT entropy (length only)         | Medium       | Deferred                |
| M-05 | Silent JWT failures               | Medium       | ✅ Fixed                |
| M-06 | CORS WEB_URL localhost fallback   | Medium       | ✅ Fixed                |
| M-07 | Impersonation role hierarchy      | Medium       | ✅ Fixed                |
| L-01 | Password min 8→12 chars           | Low          | ✅ Fixed                |
| L-02 | Failed login logging              | Low          | ✅ Fixed                |
| L-03 | Email normalisation               | Low          | ✅ Fixed                |
| L-04 | X-Forwarded-For first IP          | Low          | ✅ Fixed                |
| L-05 | Timezone IANA validation          | Low          | ✅ Fixed                |
| L-06 | CSRF documentation                | Low          | Deferred                |
| NEW  | packages/api/.env possibly in git | **CRITICAL** | ✅ Verified NOT tracked |

---

## Part 2: Feature Module Status

| Module                      | Backend                 | Frontend        | Overall       |
| --------------------------- | ----------------------- | --------------- | ------------- |
| Programs / LMS              | ✅ Complete             | ✅ Complete     | Done          |
| Assessments (360/180)       | ✅ Complete             | ✅ Complete     | Done          |
| Mentoring                   | ✅ Complete             | ✅ Complete     | Done          |
| Surveys                     | ✅ Complete             | ✅ Complete     | Done          |
| Quiz                        | ✅ Complete             | ✅ Complete     | Done          |
| Analytics                   | ✅ Complete             | ✅ Complete     | Done          |
| Notifications               | ✅ Complete             | ✅ Complete     | Done          |
| Auth / Permissions          | ✅ Complete             | ✅ Complete     | Done          |
| **Planning & Goals**        | ❌ No routes            | ⚠️ Mock data    | **Not built** |
| **Scorecard**               | ❌ No routes, no schema | ⚠️ Mock data    | **Not built** |
| Settings (non-profile tabs) | ⚠️ Partial              | ⚠️ Mock data    | Incomplete    |
| People (departments)        | ❌ No endpoint          | ⚠️ Hardcoded    | Quick fix     |
| Onboarding wizard           | ⚠️ Route exists         | ❌ No page      | Not built     |
| Global search (Cmd+K)       | ❌ No endpoint          | ❌ No component | Not built     |
| Session prep (edit mode)    | ❌ No PUT               | ⚠️ Read-only    | Incomplete    |
| Certificates / diplomas     | ❌ No endpoint          | ❌ No UI        | Not built     |
| Help & Support              | ❌ No backend           | ⚠️ Static mock  | Static only   |

---

## Part 3: API/DB Layer Findings

### 3.1 Missing Routes for Existing Schema

| Table                  | Schema File                                    | Status        |
| ---------------------- | ---------------------------------------------- | ------------- |
| `individual_goals`     | `packages/db/src/schema/planning/goals.ts`     | No API routes |
| `strategic_objectives` | `packages/db/src/schema/planning/strategic.ts` | No API routes |
| `approval_submissions` | `packages/db/src/schema/programs/progress.ts`  | No API routes |
| `goal_reviews`         | `packages/db/src/schema/programs/progress.ts`  | No API routes |
| `lesson_discussions`   | `packages/db/src/schema/programs/progress.ts`  | Schema only   |

### 3.2 Missing Seed Data

- Planning tables (strategic_initiatives, objectives, goals) — no seed
- `approval_submissions` — no test data
- Quiz attempts with all 3 grading modes — no `pending_grade` or `graded` examples

### 3.3 Performance Issues

- `users.ts` list query: 3 correlated subqueries per row for role info — should use LEFT JOIN
- Mentoring `getScopedRelationshipIds` for facilitators: N+1 query pattern — needs JOIN

### 3.4 Rate Limit Gap

- `/health` endpoint gets rate-limited — should be excluded for K8s health checks
- In-memory rate limit store — not suitable for multi-instance deployments

### 3.5 Input Validation Gaps

- Survey question text has no min/max length validation
- Email domain validation not strict (allows `test@test`)
- Programs route `page` param not validated as positive integer

### 3.6 Authentication Gaps

- `publicAssessmentSetupRoutes` mounted before auth middleware — token validation needs verification
- User creation allows agency owners to create other agency owners (privilege escalation loop)

---

## Part 4: Frontend Findings

### 4.1 Pages Still on Mock Data

| Page                         | File                 | Mock Data Items                   |
| ---------------------------- | -------------------- | --------------------------------- |
| Scorecard                    | `scorecard/page.tsx` | 5 mock arrays, 0 API calls        |
| Planning & Goals             | `planning/page.tsx`  | 5 mock arrays, 0 API calls        |
| Settings (Notifications tab) | `settings/page.tsx`  | `defaultNotifications` mock array |
| Settings (Security tab)      | `settings/page.tsx`  | Hardcoded sessions list           |
| People (departments)         | `people/page.tsx`    | Hardcoded departments array       |

### 4.2 Auth/API Client Weaknesses

- No 401 interceptor: expired token doesn't auto-refresh on API calls
- No logout redirect: user stays on page after logging out
- No fetch timeout: slow endpoints can hang indefinitely
- Race condition: concurrent `refreshUser()` calls not guarded

---

## Part 5: Code Quality Findings

### 5.1 TypeScript `as any` (non-pre-existing)

- `packages/api/src/routes/agencies.ts` line 316: `conditions as any[]`
- `packages/api/src/routes/agency-enrollments.ts` lines 112, 118, 148
- `packages/api/src/routes/admin/db.ts` lines 189, 249: raw SQL cast

### 5.2 Missing Infrastructure

| Item                     | Status             |
| ------------------------ | ------------------ |
| ESLint configuration     | ❌ None            |
| Prettier configuration   | ❌ None            |
| Pre-commit hooks (husky) | ❌ None            |
| Test suite               | ❌ Zero test files |
| GitHub Actions CI/CD     | ❌ None            |

### 5.3 Docker Gaps

- `Dockerfile`: no non-root USER, no HEALTHCHECK
- `docker-compose.yml`: hardcoded DB passwords + JWT secrets in plain text

---

## Part 6: Implementation Roadmap

| #    | Item                               | Effort   | Priority |
| ---- | ---------------------------------- | -------- | -------- |
| ✅ 0 | Verify .env not in git             | Done     | Critical |
| 1    | Planning & Goals (full stack)      | 2–3 days | High     |
| 2    | Scorecard (full build)             | 4–5 days | High     |
| 3    | Settings page tabs                 | 1 day    | Medium   |
| 4    | People departments                 | 2–3 hrs  | Low      |
| 5    | ESLint + Prettier + CI/CD + Docker | 2–3 days | Medium   |
| 6a   | Session prep edit mode             | 4 hrs    | Low      |
| 6b   | Onboarding wizard                  | 2 days   | Low      |
| 6c   | Global search (Cmd+K)              | 2 days   | Low      |
| 6d   | Certificate generation             | 1 day    | Low      |
| 6e   | Help page cleanup                  | 2 hrs    | Low      |

**Total to feature-complete + production-ready:** ~3–4 weeks

---

## Notes

- All 25 route routers are properly mounted in `app.ts` — no orphaned files
- Migrations 0000–0016 are sequential with no gaps
- Planning tables (`individual_goals`, `strategic_plans`, `strategic_goal_links`) exist in DB schema — confirmed by drizzle schema index
- Rate limiting in `rate-limit.ts` acknowledged as in-memory only; multi-instance needs Redis
