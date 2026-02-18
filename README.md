# Transformation OS

A multi-tenant B2B SaaS platform for corporate transformation and executive leadership development. Built for consulting firms and agencies that run leadership programs, 360/180 assessments, mentoring, goal tracking, and performance scorecards for their enterprise clients.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Test Accounts](#test-accounts)
- [Modules](#modules)
- [Authentication & Authorization](#authentication--authorization)
- [Assessment Engine](#assessment-engine)
- [PDF Report Generation](#pdf-report-generation)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [UI Prototype](#ui-prototype)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Project Status](#project-status)
- [License](#license)

---

## Overview

Transformation OS serves two levels of users:

1. **Agency** (parent) — Consulting firms that manage the platform, create assessment templates, build program curricula, and oversee multiple client organizations.
2. **Tenant** (child) — Client organizations that run programs, conduct assessments, track goals, and develop their leadership teams.

The platform provides:

- **Learning Management System** with 5 content types, drip scheduling, task system, and progress tracking
- **360/180 Assessments** with scoring engines, gap analysis, Johari Window, and executive PDF reports
- **Mentoring** with relationship management, session scheduling, prep workflows, and action items
- **Goal Tracking** with quarterly planning and review cadences
- **Performance Scorecards** with KPIs, competencies, and organizational health metrics
- **Agency Portal** for multi-tenant management, template libraries, impersonation, and cross-client administration
- **Email & Notifications** with in-app notification center, Resend email, and cron-based digest jobs
- **Role-Based Navigation** with per-tenant role matrix and per-user overrides

---

## Architecture

```
                    ┌─────────────────┐
                    │   Next.js 15    │ :3003
                    │   (Frontend)    │
                    └────────┬────────┘
                             │ REST API
                    ┌────────▼────────┐
                    │    Hono.js      │ :3002
                    │   (API Server)  │
                    └────────┬────────┘
                             │ Drizzle ORM
                    ┌────────▼────────┐
                    │   PostgreSQL    │ :5432
                    │   (Database)    │
                    └─────────────────┘
```

**Turborepo monorepo** with four packages:

| Package | Description | Port |
|---------|-------------|------|
| `packages/api` | Hono.js REST API server | 3002 |
| `packages/web` | Next.js 15 frontend (App Router) | 3003 |
| `packages/db` | Drizzle ORM schemas, migrations, seed data | — |
| `packages/shared` | Shared types, constants, permissions | — |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15.x |
| UI Framework | React | 19.x |
| Styling | Tailwind CSS + shadcn/ui | 3.4 |
| State Management | Zustand | 5.x |
| Server State | TanStack React Query | 5.x |
| Backend API | Hono.js | 4.x |
| Database | PostgreSQL | 15+ |
| ORM | Drizzle ORM | 0.38 |
| Authentication | JWT (jose) + argon2 | — |
| Email | Resend + React Email | — |
| PDF Generation | @react-pdf/renderer | 4.x |
| Monorepo | Turborepo + pnpm | 2.x / 9.x |
| Language | TypeScript (strict mode) | 5.3 |

---

## Repository Structure

```
TR v2/
├── packages/
│   ├── api/                        # Hono API server
│   │   └── src/
│   │       ├── routes/             # Route modules
│   │       │   ├── auth.ts         # Login, register, token refresh, forgot/reset password
│   │       │   ├── users.ts        # User CRUD + profile
│   │       │   ├── tenants.ts      # Tenant management
│   │       │   ├── agencies.ts     # Agency management + cross-tenant user search
│   │       │   ├── programs.ts     # Programs CRUD + curriculum
│   │       │   ├── enrollments.ts  # Program enrollments
│   │       │   ├── progress.ts     # Lesson progress + task completion
│   │       │   ├── assessments.ts  # Assessment instances + PDF reports
│   │       │   ├── mentoring.ts    # Mentoring relationships, sessions, notes, action items
│   │       │   ├── permissions.ts  # Role nav matrix + user permission overrides
│   │       │   ├── notifications.ts# In-app notifications + preferences
│   │       │   ├── cron.ts         # Scheduled notification jobs
│   │       │   ├── agency-templates.ts  # Assessment template library
│   │       │   └── admin/
│   │       │       └── impersonation.ts # Admin impersonation with audit log
│   │       ├── middleware/         # Auth, error handling, permissions
│   │       ├── lib/               # Business logic
│   │       │   ├── assessment-engine.ts
│   │       │   ├── trend-engine.ts
│   │       │   ├── email.ts        # Resend email service (10 typed helpers)
│   │       │   ├── notifications.ts# In-app notification creator
│   │       │   └── pdf/            # LeaderShift™ PDF report generator
│   │       └── emails/             # 10 React Email templates
│   │
│   ├── db/                         # Database package
│   │   ├── src/
│   │   │   ├── schema/             # Drizzle ORM table definitions
│   │   │   │   ├── core/           # agencies, tenants, users, roles, sessions, permissions, notifications
│   │   │   │   ├── programs/       # programs, modules, lessons, enrollments, progress, tasks
│   │   │   │   ├── assessments/    # templates, assessments, benchmarks
│   │   │   │   ├── mentoring/      # relationships, sessions
│   │   │   │   └── planning/       # goals, strategic planning
│   │   │   ├── seed.ts             # Core seed (users, tenants, programs, assessments)
│   │   │   └── seed-leadershift.ts # LeaderShift LMS program seed (run separately)
│   │   └── drizzle/                # 12 migration files
│   │
│   ├── web/                        # Next.js frontend
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (dashboard)/    # Authenticated routes
│   │       │   │   ├── dashboard/
│   │       │   │   ├── programs/          # Learner LMS + Program Builder
│   │       │   │   ├── assessments/       # Assessment lifecycle + results
│   │       │   │   ├── mentoring/         # Role-aware mentoring dashboard
│   │       │   │   ├── planning/
│   │       │   │   ├── scorecard/
│   │       │   │   ├── people/
│   │       │   │   ├── analytics/
│   │       │   │   ├── settings/          # Profile, notifications, permissions
│   │       │   │   ├── notifications/
│   │       │   │   ├── help/
│   │       │   │   └── agency/            # Agency portal
│   │       │   └── (auth)/        # Login, forgot/reset password
│   │       ├── components/
│   │       │   ├── ui/            # shadcn/ui components
│   │       │   ├── layout/        # Sidebar, header, ImpersonationBanner, ImpersonationSearchModal
│   │       │   ├── programs/      # LMS builder & learner components
│   │       │   ├── assessments/   # Assessment components + rater form
│   │       │   ├── coaching/      # Mentoring components
│   │       │   └── templates/     # Assessment template editor
│   │       ├── hooks/api/         # 85+ React Query data-fetching hooks
│   │       ├── types/             # TypeScript type definitions
│   │       ├── lib/               # API client, utilities
│   │       ├── providers/         # Auth, React Query
│   │       └── stores/            # Zustand stores (auth)
│   │
│   └── shared/                     # Shared package
│       └── src/
│           ├── constants/          # Roles, permissions, navigation slugs
│           └── types/              # Shared type definitions
│
├── components/                     # UI Prototype (Vite + React 18, port 5173)
├── SPECS/                          # Detailed module specifications
├── AUDITS/                         # Codebase audit reports
├── CLAUDE.md                       # AI assistant context (detailed architecture notes)
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml             # Workspace config
└── package.json                    # Root scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9.x (`npm install -g pnpm`)
- **PostgreSQL** 15+ (running locally or via Docker)

### Installation

```bash
pnpm install
```

### Environment Variables

**`packages/api/.env`**
```env
PORT=3002
DATABASE_URL=postgres://user:pass@localhost:5432/transformation_os
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
WEB_URL=http://localhost:3003
NODE_ENV=development
RESEND_API_KEY=re_...          # Optional — emails silently skipped if unset
APP_URL=http://localhost:3003
CRON_SECRET=your-cron-secret   # Optional — secures POST /api/cron/notifications
```

**`packages/db/.env`**
```env
DATABASE_URL=postgres://user:pass@localhost:5432/transformation_os
```

**`packages/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Database Setup

```bash
# Create the database
createdb transformation_os

# Run all migrations
pnpm --filter @tr/db db:migrate

# Seed core data (users, tenants, programs, assessments)
pnpm --filter @tr/db db:seed

# Seed the LeaderShift LMS program (optional — separate script)
pnpm --filter @tr/db db:seed-leadershift

# Or run both seeds in one command
pnpm --filter @tr/db db:seed-all
```

### Running the Application

```bash
# Start all packages (API + Web)
pnpm dev

# Or individually
pnpm --filter @tr/api dev    # API on http://localhost:3002
pnpm --filter @tr/web dev    # Web on http://localhost:3003
```

Open [http://localhost:3003](http://localhost:3003) and log in with one of the [test accounts](#test-accounts).

---

## Test Accounts

After running `db:seed`:

| Email | Password | Role | Organization |
|-------|----------|------|-------------|
| `admin@acme.com` | `password123` | Agency Owner | Acme Consulting |
| `admin@techcorp.com` | `password123` | Tenant Admin | TechCorp |
| `coach@techcorp.com` | `password123` | Facilitator | TechCorp |
| `mentor@techcorp.com` | `password123` | Mentor | TechCorp |
| `john.doe@techcorp.com` | `password123` | Learner | TechCorp |
| `jane.smith@techcorp.com` | `password123` | Learner | TechCorp |
| `alex.wilson@techcorp.com` | `password123` | Learner | TechCorp |

**Note:** The `admin@acme.com` agency account can use "Login As User" in the header to impersonate any tenant user. Seeded assessments have `status: completed` but `computedResults` is null until `POST /results/compute` is called.

---

## Modules

### Programs & LMS

Full learning management system with program creation, curriculum building, and learner experience.

**Content types** (5, stored in `content_type` DB enum):

| DB Type | Add-Menu Labels | Description |
|---------|-----------------|-------------|
| `lesson` | Reading, Video, Key Concepts | Rich text + video content |
| `quiz` | Quiz | Scored assessment questions |
| `assignment` | Assignment, Food for Thought | Work submission |
| `text_form` | Most Useful Idea, How You Used This Idea, Text Form | Multi-line text input |
| `goal` | Goal | Goal setting with review workflow |

The curriculum builder add menu shows 10 entries grouped into 3 sections (Content, Reflection, Activity). All map to the 5 DB types above.

**Features:**
- 6-step program creation wizard
- Drip scheduling (module and lesson level): immediate, days after enrollment, sequential, on-date
- Task system for interactive content and event milestones (`lesson_tasks` + `task_progress`)
- Module/event type distinction — events show Calendar icon, modules show red accent
- Module progress tracker with visual nodes
- Learner sidebar with expandable curriculum
- Preview mode (`?previewRole=learner`) bypasses sequential module locking
- Bulk enrollment via spreadsheet upload
- Three enrollment roles: Facilitator, Mentor, Learner

### Assessments

Full 360-degree and 180-degree assessment system with the **LeaderShift™ Leadership Capacity Stress Test** as the flagship product.

**Workflow:**
1. Admin creates assessment from template, assigns subject
2. Raters are invited (self, manager, peers, direct reports)
3. Raters complete anonymous responses via token-based public forms
4. Admin computes results (`POST /results/compute`)
5. PDF report generated on demand
6. Results displayed in web UI with charts, CCI gauge, Current Ceiling, and trend sections

**Assessment engine features:**
- Reverse-scored question support (`[R]` items): `effective = scaleMax + scaleMin - raw`
- Coaching Capacity Index (CCI) — composite of `isCCI`-tagged questions per competency
- Current Ceiling — lowest competency with generated constraint narrative
- Johari Window mapping (Blind Spot, Hidden Strength, Aligned)
- Gap analysis with blind spot / hidden strength classification
- Trend comparison across sequential assessments for same subject/template
- Benchmarking against organizational norms

### Mentoring

1:1 mentoring relationship management with session tracking and role-scoped access.

**Features:**
- Mentor-mentee pairing with relationship types (mentor, coach, manager)
- Session scheduling with types: mentoring, one-on-one, check-in, review, planning
- Session prep workflow (mentee reflection before session)
- Session notes (public/private), action items with assignee, due date, priority
- Session status flow: `scheduled → prep_in_progress → ready → completed`
- Role-scoped visibility:
  - `mentor` — sees own sessions and mentees
  - `facilitator` — sees all relationships within facilitated programs
  - `tenant_admin` — sees all relationships in tenant
- Agency users get tenant selector dropdown to view any client's mentoring data

### Role-Based Navigation & Permissions

- Per-tenant role navigation matrix — toggle which pages each role can access
- Per-user overrides layered on top of role defaults
- Sidebar updates dynamically via `/api/tenants/:tenantId/permissions/my-nav`
- Permissions admin screen (`/settings/permissions`) for tenant admins

### Impersonation

Agency admins can "Login As" any tenant user for support and debugging:
- Header dropdown → "Login As User" → real-time cross-tenant user search
- Results grouped by client (accordion); all collapsed by default
- Amber `ImpersonationBanner` displays with "Switch Back" button during session
- "Return to Agency View" in header dropdown restores admin session
- All sessions logged for audit (admin, target, reason, duration)

### Email & Notifications

- In-app notification center with read/archive and per-type preferences
- Resend email service with 10 typed send helpers (silently skips if `RESEND_API_KEY` unset)
- 10 React Email templates: invitations, welcome, password reset, digest, inactivity, milestone, completion
- Cron endpoint (`POST /api/cron/notifications`, secured by `X-Cron-Secret`) for weekly digest, inactivity, and due-date jobs
- Forgot/reset password flow with email token

### Agency Portal

Multi-tenant management for consulting firms:
- **Overview** — Cross-client dashboard
- **Clients** — Tenant management and configuration
- **People** — Cross-tenant user management
- **Templates** — Assessment template library (create, duplicate, publish)
- **Branding** — Per-tenant branding configuration
- **Billing** — Subscription and usage tracking

---

## Authentication & Authorization

### Authentication Flow

```
POST /api/auth/login { email, password }
  → Verify password (argon2)
  → Generate JWT access token (15 min) + refresh token (7 days)
  → Return tokens + user profile

POST /api/auth/refresh { refreshToken }
  → Verify refresh token
  → Issue new access/refresh pair

POST /api/auth/forgot-password { email }
  → Send reset email with signed token

POST /api/auth/reset-password { token, newPassword }
  → Verify token, update password hash
```

Tokens are stored in `localStorage`. The API client (`lib/api.ts`) automatically attaches `Authorization: Bearer <token>` and handles token refresh on 401 responses.

The impersonation token is stored separately in `sessionStorage` and sent via `X-Impersonation-Token` header.

### Role Hierarchy

| Role | Level | Scope |
|------|-------|-------|
| `super_admin` | 100 | Platform-wide |
| `agency_owner` | 90 | Agency + all tenants |
| `agency_admin` | 80 | Agency management |
| `agency_member` | 70 | Agency read access |
| `tenant_admin` | 70 | Tenant management |
| `facilitator` | 50 | Program facilitation |
| `mentor` | 40 | Mentoring scope |
| `learner` | 30 | Enrolled learner |
| `tenant_member` | 10 | Basic tenant access |

---

## Assessment Engine

Located in `packages/api/src/lib/assessment-engine.ts`.

### Scoring Pipeline

```
Raw Responses
    │
    ▼
Reverse Scoring ([R] items: effective = scaleMax + scaleMin - raw)
    │
    ▼
Score Aggregation (per question → per competency → per rater type)
    │
    ▼
Gap Analysis (self vs. others → blind_spot / hidden_strength / aligned)
    │
    ▼
CCI Computation (average of isCCI-tagged questions → Low/Moderate/High/Very High)
    │
    ▼
Current Ceiling (lowest competency → constraint narrative)
    │
    ▼
Top/Bottom 5 Items (ranked by overall average)
    │
    ▼
Trend Comparison (delta vs. previous assessment for same subject/template)
    │
    ▼
Stored as computed_results JSONB on assessment record
```

### CCI Bands

| Score Range | Band |
|-------------|------|
| 1.0 – 2.0 | Low |
| 2.1 – 3.0 | Moderate |
| 3.1 – 4.0 | High |
| 4.1 – 5.0 | Very High |

---

## PDF Report Generation

Located in `packages/api/src/lib/pdf/`.

Uses `@react-pdf/renderer` with a minimal executive aesthetic (black/white + Deep Navy `#1B3A5C`). All JSX uses `React.createElement` (no JSX transform) and SVG charts are rendered inline.

### Report Sections (16 total)

| # | Section |
|---|---------|
| 1 | Cover Page |
| 2 | How to Read |
| 3 | Rater Participation |
| 4 | Executive Summary |
| 5 | Current Ceiling |
| 6 | CCI Gauge |
| 7 | Competency Overview (ranked bars + adaptive radar) |
| 8 | Competency Detail (one page per competency) |
| 9 | Gap Analysis (divergence chart) |
| 10 | Top/Bottom 5 Items |
| 11 | Qualitative Comments |
| 12 | Trend Comparison (conditional) |
| 13 | Development Worksheet |
| 14 | Development Ecosystem |
| 15–16 | Appendices + Methodology |

**Adaptive radar chart:**
- 180-degree: Self (solid) vs. Boss (dashed)
- 360-degree: Multi-rater overlay (Self, Manager, Peers, Direct Reports)

---

## API Reference

All endpoints prefixed with `/api`. Auth required unless noted.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout and invalidate tokens |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Complete password reset |

### Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants/:id/programs` | List programs |
| POST | `/tenants/:id/programs` | Create program |
| GET/PUT/DELETE | `/tenants/:id/programs/:pid` | Program CRUD |
| POST | `/tenants/:id/programs/:pid/modules` | Create module |
| POST | `/tenants/:id/programs/:pid/modules/:mid/lessons` | Create lesson |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/tenants/:id/assessments` | List / create |
| GET/PUT/DELETE | `/tenants/:id/assessments/:aid` | Assessment CRUD |
| POST | `/tenants/:id/assessments/:aid/invitations` | Send invitations |
| POST | `/tenants/:id/assessments/:aid/results/compute` | Compute results |
| GET | `/tenants/:id/assessments/:aid/report/pdf` | Download PDF |
| GET/POST | `/respond/:token` | Public rater form (no auth) |

### Mentoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/tenants/:id/mentoring/relationships` | Relationships |
| GET/POST | `/tenants/:id/mentoring/sessions` | Sessions |
| GET/POST | `/tenants/:id/mentoring/sessions/:sid/notes` | Session notes |
| GET/POST | `/tenants/:id/mentoring/action-items` | Action items |
| GET | `/tenants/:id/mentoring/stats` | Aggregate stats |

### Permissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants/:id/permissions/my-nav` | Effective nav for current user |
| GET/PUT/DELETE | `/tenants/:id/permissions/roles/:roleSlug` | Role nav config |
| GET/PUT/DELETE | `/tenants/:id/permissions/users/:userId` | Per-user overrides |

### Impersonation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/impersonate` | Start impersonation session |
| POST | `/admin/impersonate/end` | End session |
| GET | `/admin/impersonate/status` | Check active session |
| GET | `/admin/impersonate/history` | Audit log |
| GET | `/agencies/me/users/search` | Cross-tenant user search |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Unread count |
| POST | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all read |
| POST | `/notifications/:id/archive` | Archive |
| GET/PUT | `/notifications/preferences` | Notification preferences |
| POST | `/cron/notifications` | Trigger cron jobs (`X-Cron-Secret` required) |

---

## Database Schema

### Key Tables

| Table | Description |
|-------|-------------|
| `agencies` | Parent consulting organizations |
| `tenants` | Client organizations |
| `users` | All user accounts |
| `roles` | System roles with hierarchical levels |
| `tenant_role_permissions` | Per-tenant role nav overrides |
| `tenant_user_permissions` | Per-user nav grant/revoke overrides |
| `impersonation_sessions` | Admin impersonation audit log |
| `programs` | Learning programs with JSONB config |
| `modules` | Program modules (type: `module` or `event`) |
| `lessons` | Content items with 5 types and JSONB config |
| `lesson_tasks` | Completion tasks attached to lessons |
| `task_progress` | Per-user task completion tracking |
| `enrollments` | User-program relationships with roles |
| `lesson_progress` | Per-user lesson completion |
| `assessment_templates` | Template definitions with JSONB question config |
| `assessments` | Assessment instances with `computed_results` JSONB |
| `assessment_invitations` | Rater invitations with unique tokens |
| `assessment_responses` | Individual rater responses |
| `assessment_benchmarks` | Organizational/industry benchmarks |
| `mentoring_relationships` | Mentor-mentee pairings |
| `mentoring_sessions` | Sessions with prep, notes, action items |
| `notifications` | In-app notifications |
| `notification_preferences` | Per-user notification type preferences |
| `goals` | Goal definitions with metrics and review cadence |

### Migrations

| Migration | Key Contents |
|-----------|-------------|
| 0001–0006 | Core schema: agencies, tenants, users, programs, assessments, mentoring, goals |
| 0007 | Indexes + CHECK constraints (audit hardening) |
| 0008 | `lesson_tasks`, `task_progress`, module `type` enum, `eventConfig` JSONB |
| 0009 | `notifications`, `notification_preferences`, password reset fields on users |
| 0010 | Removed deprecated content types; finalized notification schema |
| 0011 | `tenant_role_permissions`, `tenant_user_permissions`, `impersonation_sessions` |

---

## UI Prototype

A standalone **Vite + React 18** app for rapid UI prototyping. Runs independently — **do not import** into the Next.js app.

```bash
cd components
npm install
npm run dev
# Opens at http://localhost:5173
```

Contains 16 feature modules covering all platform pages with mock data.

---

## Environment Variables

### API (`packages/api/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default: `3002`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (32+ chars) |
| `WEB_URL` | Frontend URL for CORS (default: `http://localhost:3003`) |
| `RESEND_API_KEY` | Resend API key for transactional email (optional) |
| `APP_URL` | Public app URL used in email links |
| `CRON_SECRET` | Secret for `X-Cron-Secret` header on cron endpoint |
| `NODE_ENV` | Environment (`development` / `production`) |

### Web (`packages/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | API base URL (default: `http://localhost:3002`) |

### Database (`packages/db/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

---

## Scripts

### Root (monorepo)

```bash
pnpm dev              # Start API + Web concurrently
pnpm build            # Build all packages
pnpm clean            # Clean all build artifacts
```

### Database

```bash
pnpm --filter @tr/db db:generate          # Generate migration from schema changes
pnpm --filter @tr/db db:migrate           # Apply pending migrations
pnpm --filter @tr/db db:seed              # Seed core test data
pnpm --filter @tr/db db:seed-leadershift  # Seed LeaderShift LMS program
pnpm --filter @tr/db db:seed-all          # Run both seeds in sequence
pnpm --filter @tr/db db:studio            # Open Drizzle Studio (DB GUI)
```

---

## Project Status

### Completed

- Multi-tenant architecture (Agency / Tenant hierarchy)
- JWT authentication: login, refresh tokens, forgot/reset password
- Role-based authorization with 30+ permissions
- **Admin impersonation** — cross-tenant user search, session logging, "Return to Agency View"
- **Programs & LMS** — 5 content types, 10 add-menu entries, drip scheduling, task system, progress tracking
- **Program Builder** — 6-step wizard, curriculum editor, module/event types, enrollment management
- **Assessment module** (full stack) — templates, invitations, rater forms, scoring engine, PDF reports
- **LeaderShift™ engine** — reverse scoring, CCI, Current Ceiling, Johari Window, trend analysis
- **PDF reports** — 16-section executive report, adaptive radar chart, CCI gauge
- **Mentoring module** — relationships, sessions, prep, notes, action items, role-scoped visibility
- **Role-Based Navigation** — per-tenant role matrix, per-user overrides, dynamic sidebar
- **Permissions admin screen** (`/settings/permissions`) — role matrix + user override management
- **Email & Notifications** — Resend integration, 10 email templates, in-app notification center, cron jobs
- **Agency portal** — 6 tabs (Overview, Clients, People, Templates, Branding, Billing)
- **10 dashboard pages** connected to real API data
- Settings profile connected to real API
- Agency users: tenant selector on mentoring, permissions, and other tenant-scoped pages

### In Progress

- Specialized content type editors (quiz builder, form builder)
- Connect Programs UI to real enrollment/progress data (currently uses mock data)
- Connect Notifications page to real API (routes built; frontend still uses mock data)

### Not Yet Implemented

- API routes for: Scorecard, Planning & Goals, Analytics
- Session prep form (edit mode for mentees)
- Real-time updates (WebSocket / SSE)
- Certificate/diploma generation
- Rich content WYSIWYG editor for lessons
- Lesson resource/attachment upload UI

---

## License

Proprietary. All rights reserved.
