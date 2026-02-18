# Transformation OS

A multi-tenant B2B SaaS platform for corporate transformation and executive leadership development. Combines LMS, 360 assessments, goal tracking, mentoring, and analytics in one integrated system.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Server state | TanStack Query v5 |
| Global state | Zustand |
| API | Hono.js |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT (jose) + argon2 |

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables — edit both files with your values
cp packages/api/.env.example packages/api/.env
cp packages/web/.env.local.example packages/web/.env.local

# Run database migrations and seed test data
pnpm --filter @tr/db db:migrate
pnpm --filter @tr/db db:seed

# Start all services
pnpm dev
```

Services:
- **API** → http://localhost:3002
- **Web** → http://localhost:3003
- **UI Prototype** → `cd components && npm run dev` → http://localhost:5173

## Project Structure

```
packages/
├── api/          # Hono.js API server (port 3002)
│   └── src/
│       ├── routes/       # Route handlers
│       ├── middleware/   # Auth, error handling
│       └── lib/          # Email, PDF, assessment engine, notifications
│
├── db/           # PostgreSQL + Drizzle ORM
│   ├── src/schema/       # Table definitions
│   ├── drizzle/          # Generated migrations (0001–0012)
│   └── seed.ts           # Test data
│
└── web/          # Next.js frontend (port 3003)
    └── src/
        ├── app/(dashboard)/   # Authenticated pages
        ├── components/        # UI components by module
        ├── hooks/api/         # React Query hooks
        └── lib/               # API client, utilities
```

## Features

### Multi-tenant Architecture
- **Agency** accounts own the platform, create clients, and build program templates
- **Tenant** (client) accounts run programs and assessments for their employees
- Context switcher lets agency users toggle between agency view and any tenant view
- Impersonation system for agency admins to view tenant user experiences

### LMS / Programs
- Curriculum builder: modules, lessons, 5 content types (`lesson`, `quiz`, `assignment`, `text_form`, `goal`)
- Add-menu with 10 entries in 3 groups: Content, Reflection, Activity
- Drip scheduling at module and lesson level
- Learner sidebar with progress tracking, sequential module locking, completion modal
- Program roles: Facilitator, Mentor, Learner

### Program Templates
- Mark any program as a reusable template
- "Start from Scratch or Template" choice modal when creating programs
- Create from template: deep-copies all modules/lessons/tasks with new IDs
- Assign to client: creates a tenant-scoped copy for a specific client tenant
- Templates tab in Program Builder with "Template" badges and 3-dot menu actions

### Assessments (360/180)
- Configurable templates: competencies, rating scales, rater types
- Rater invitation workflow with public token-based response forms
- Scoring engine: reverse scoring, gap analysis, Johari window, CCI
- Coaching Capacity Index and Current Ceiling computation
- Sequential trend comparison across assessments for the same subject
- 16-section LeaderShift™ PDF report via `@react-pdf/renderer`

### Mentoring
- Mentor↔Mentee relationships with session scheduling
- Session lifecycle: scheduled → prep → ready → completed
- Pre-session reflection, public/private notes, action items with priority tracking
- Role-scoped views: mentor sees their mentees, facilitator sees program scope, admin sees all

### Analytics
- Real-time data from 5 tabs: Overview, Programs, Assessments, Team, Goals
- Agency users filter by client and time range (7d / 30d / 90d / 12m)
- Enrollment/completion trend charts, department breakdowns, goal category analysis

### Role-Based Navigation
- Per-role and per-user nav item overrides stored in database
- 3-layer resolution: hardcoded defaults → role DB override → user DB override
- Admin screen at `/settings/permissions` for toggle-based management

### Email & Notifications
- Resend email service (10 typed helpers: assessment invites, welcome, digest, etc.)
- In-app notification center with unread count badge
- Cron endpoint for scheduled jobs (weekly digest, inactivity, due-date reminders)
- Password reset flow (forgot-password → email → reset-password)

## Database Commands

```bash
pnpm --filter @tr/db db:generate   # Generate migration from schema changes
pnpm --filter @tr/db db:migrate    # Apply pending migrations
pnpm --filter @tr/db db:seed       # Seed test data
pnpm --filter @tr/db db:studio     # Open Drizzle Studio (database browser)
```

## Test Accounts

After running `db:seed` (password: `password123` for all):

| Email | Role | Notes |
|-------|------|-------|
| `admin@acme.com` | Agency Owner | Agency-level access, can impersonate users |
| `admin@techcorp.com` | Tenant Admin | Full TechCorp tenant access |
| `coach@techcorp.com` | Facilitator | Program facilitation role |
| `mentor@techcorp.com` | Mentor | Mentoring relationships |
| `john.doe@techcorp.com` | Learner | Enrolled in Leadership Essentials |
| `jane.smith@techcorp.com` | Learner | — |
| `alex.wilson@techcorp.com` | Learner | — |

## Environment Variables

### `packages/api/.env`
```
PORT=3002
DATABASE_URL=postgres://user:pass@localhost:5432/transformation_os
JWT_SECRET=your-secret-here
RESEND_API_KEY=re_...            # Optional — email sending via Resend
APP_URL=http://localhost:3003
CRON_SECRET=your-cron-secret     # Optional — secures /api/cron endpoints
```

### `packages/web/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## Development Notes

- TypeScript check: run `npx tsc --noEmit` from within each package directory
- The `components/` folder is a standalone Vite + React 18 prototype — do not import from it in `packages/web` (React 19)
- Assessment computed results are not auto-calculated on seed; call `POST /:tenantId/assessments/:id/results/compute` to generate them
- Drizzle LATERAL JOIN does not work cleanly via `.leftJoin()` — use correlated subqueries instead

## Reference

- `CLAUDE.md` — full implementation status, architecture decisions, component inventory
- `SPECS/` — detailed feature specifications per module
- `ANALYSIS_NOTES.md` — full requirements specification
- `AUDITS/2026-02-12-full-codebase-audit.md` — security and code quality audit report
