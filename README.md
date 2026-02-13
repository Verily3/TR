# Transformation OS

A multi-tenant B2B SaaS platform for corporate transformation and executive leadership development. Built for consulting firms and agencies that run leadership programs, 360 assessments, mentoring, goal tracking, and performance scorecards for their enterprise clients.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Packages](#packages)
  - [API (`@tr/api`)](#api-trapi)
  - [Web (`@tr/web`)](#web-trweb)
  - [Database (`@tr/db`)](#database-trdb)
  - [Shared (`@tr/shared`)](#shared-trshared)
- [Modules](#modules)
  - [Programs & LMS](#programs--lms)
  - [Assessments](#assessments)
  - [Mentoring](#mentoring)
  - [Scorecard](#scorecard)
  - [Planning & Goals](#planning--goals)
  - [People Management](#people-management)
  - [Analytics](#analytics)
  - [Agency Portal](#agency-portal)
- [Authentication & Authorization](#authentication--authorization)
- [Assessment Engine](#assessment-engine)
- [PDF Report Generation](#pdf-report-generation)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [UI Prototype](#ui-prototype)
- [Test Accounts](#test-accounts)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Transformation OS serves two levels of users:

1. **Agency** (parent) - Consulting firms that manage the platform, create assessment templates, build program curricula, and oversee multiple client organizations.
2. **Tenant** (child) - Client organizations that run programs, conduct assessments, track goals, and develop their leadership teams.

The platform provides:

- **Learning Management System** with 9 content types, drip scheduling, and progress tracking
- **360/180 Assessments** with scoring engines, gap analysis, and executive PDF reports
- **Mentoring** with session management, prep workflows, and action items
- **Goal Tracking** with quarterly planning and review cadences
- **Performance Scorecards** with KPIs, competencies, and organizational health metrics
- **Agency Portal** for multi-tenant management, template libraries, and cross-client analytics

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

The application is a **Turborepo monorepo** with four packages:

| Package | Description | Port |
|---------|-------------|------|
| `packages/api` | Hono.js REST API server | 3002 |
| `packages/web` | Next.js 15 frontend (App Router) | 3003 |
| `packages/db` | Drizzle ORM schemas, migrations, seed data | - |
| `packages/shared` | Shared types, constants, permissions | - |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 15.x |
| **UI Framework** | React | 19.x |
| **Styling** | Tailwind CSS + shadcn/ui | 3.4 |
| **State Management** | Zustand | 5.x |
| **Server State** | TanStack React Query | 5.60 |
| **Rich Text Editor** | TipTap | 3.19 |
| **Backend API** | Hono.js | 4.6 |
| **Database** | PostgreSQL | 15+ |
| **ORM** | Drizzle ORM | 0.38 |
| **Authentication** | JWT (jose) + argon2 | - |
| **PDF Generation** | @react-pdf/renderer | 4.3 |
| **Monorepo** | Turborepo + pnpm | 2.0 / 9.0 |
| **Language** | TypeScript (strict mode) | 5.3 |

---

## Repository Structure

```
transforming-results/
├── packages/
│   ├── api/                        # Hono API server
│   │   ├── src/
│   │   │   ├── routes/             # 15 route modules
│   │   │   │   ├── auth.ts         # Login, register, token refresh
│   │   │   │   ├── users.ts        # User CRUD
│   │   │   │   ├── tenants.ts      # Tenant management
│   │   │   │   ├── agencies.ts     # Agency management
│   │   │   │   ├── programs.ts     # Programs CRUD + curriculum
│   │   │   │   ├── enrollments.ts  # Program enrollments
│   │   │   │   ├── progress.ts     # Lesson progress tracking
│   │   │   │   ├── assessments.ts  # Assessment instances
│   │   │   │   ├── assessment-responses.ts  # Rater responses
│   │   │   │   ├── assessment-benchmarks.ts # Benchmark data
│   │   │   │   ├── agency-templates.ts      # Template library
│   │   │   │   ├── agency-enrollments.ts    # Agency enrollment mgmt
│   │   │   │   ├── dashboard.ts    # Dashboard data
│   │   │   │   ├── onboarding.ts   # Onboarding workflows
│   │   │   │   └── admin/
│   │   │   │       └── impersonation.ts  # Admin impersonation
│   │   │   ├── middleware/         # Auth, error handling, permissions
│   │   │   ├── lib/               # Business logic
│   │   │   │   ├── assessment-engine.ts   # Scoring engine
│   │   │   │   ├── benchmark-engine.ts    # Benchmark computation
│   │   │   │   ├── trend-engine.ts        # Trend analysis
│   │   │   │   └── pdf/                   # PDF generation
│   │   │   │       ├── report-generator.tsx
│   │   │   │       ├── shared-styles.ts
│   │   │   │       └── svg-charts.ts
│   │   │   └── index.ts
│   │   └── .env
│   │
│   ├── db/                         # Database package
│   │   ├── src/
│   │   │   ├── schema/             # 26 Drizzle schema files
│   │   │   │   ├── core/           # agencies, tenants, users, roles, sessions
│   │   │   │   ├── programs/       # programs, modules, lessons, enrollments, progress
│   │   │   │   ├── assessments/    # templates, assessments, benchmarks
│   │   │   │   ├── mentoring/      # relationships, sessions
│   │   │   │   └── planning/       # goals, strategic planning
│   │   │   ├── seed.ts             # Database seeder
│   │   │   └── seed-leadershift.ts # LeaderShift assessment seeder
│   │   └── drizzle/                # 9 migration files
│   │
│   ├── web/                        # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                # 25 pages (App Router)
│   │   │   │   ├── (dashboard)/    # Authenticated routes
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── programs/
│   │   │   │   │   ├── program-builder/
│   │   │   │   │   ├── assessments/
│   │   │   │   │   ├── mentoring/
│   │   │   │   │   ├── planning/
│   │   │   │   │   ├── scorecard/
│   │   │   │   │   ├── people/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── settings/
│   │   │   │   │   ├── notifications/
│   │   │   │   │   ├── help/
│   │   │   │   │   └── agency/
│   │   │   │   ├── login/
│   │   │   │   └── respond/[token]/  # Public assessment form
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn components
│   │   │   │   ├── layout/         # Sidebar, header
│   │   │   │   ├── programs/       # 28 program components
│   │   │   │   ├── assessments/    # Assessment components
│   │   │   │   └── templates/      # Template builder
│   │   │   ├── hooks/api/          # 80+ React Query hooks
│   │   │   ├── types/              # TypeScript type definitions
│   │   │   ├── lib/                # API client, utilities
│   │   │   ├── providers/          # Auth, React Query
│   │   │   └── stores/             # Zustand stores
│   │   └── .env.local
│   │
│   └── shared/                     # Shared package
│       └── src/
│           ├── constants/          # Roles, permissions, navigation
│           └── types/              # Shared type definitions
│
├── components/                     # UI Prototype (Vite + React)
│   ├── dashboard/                  # Dashboard prototype
│   ├── programs/                   # Programs prototype
│   ├── assessments/                # Assessments prototype
│   ├── coaching/                   # Mentoring prototype
│   ├── scorecard/                  # Scorecard prototype
│   ├── planning/                   # Planning prototype
│   ├── people/                     # People management
│   ├── analytics/                  # Analytics prototype
│   ├── agency/                     # Agency portal
│   ├── program-builder/            # Program builder
│   ├── settings/                   # Settings prototype
│   ├── notifications/              # Notifications
│   ├── onboarding/                 # Onboarding wizard
│   ├── help/                       # Help & support
│   ├── search/                     # Command palette + search
│   └── ui/                         # Shared UI components
│
├── SPECS/                          # Detailed specifications (12 docs)
├── AUDITS/                         # Codebase audit reports
├── CLAUDE.md                       # AI assistant context
├── turbo.json                      # Turborepo config
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
# Clone the repository
git clone https://github.com/Invo-Technologies/transforming-results.git
cd transforming-results

# Install dependencies
pnpm install
```

### Database Setup

1. **Create the PostgreSQL database:**

```bash
createdb transformation_os
```

2. **Configure environment variables:**

```bash
# Copy and edit the API environment file
cp packages/api/.env.example packages/api/.env
# Edit DATABASE_URL, JWT secrets, etc.

# Copy and edit the DB environment file
cp packages/db/.env.example packages/db/.env
# Edit DATABASE_URL

# Copy and edit the web environment file
cp packages/web/.env.local.example packages/web/.env.local
# Edit NEXT_PUBLIC_API_URL
```

3. **Run migrations and seed the database:**

```bash
# Run all migrations
pnpm db:migrate

# Seed with test data (users, programs, assessments, templates)
pnpm db:seed
```

### Running the Application

```bash
# Start all packages concurrently (API + Web)
pnpm dev

# Or start individually
pnpm --filter @tr/api dev    # API on http://localhost:3002
pnpm --filter @tr/web dev    # Web on http://localhost:3003
```

Open [http://localhost:3003](http://localhost:3003) and log in with one of the [test accounts](#test-accounts).

---

## Packages

### API (`@tr/api`)

TypeScript REST API built with **Hono.js**. Handles all business logic, authentication, data access, and PDF generation.

**Key features:**
- JWT authentication with access/refresh token rotation
- Role-based permission middleware (30+ permissions)
- Assessment scoring engine with reverse scoring, CCI, gap analysis
- PDF report generation using `@react-pdf/renderer`
- Admin impersonation system with audit logging
- CORS configured for frontend origins

**Structure:**
- `routes/` - 15 route modules with full CRUD operations
- `middleware/` - Auth verification, error handling, permission checks
- `lib/` - Assessment engine, benchmark engine, trend engine, PDF generator

### Web (`@tr/web`)

**Next.js 15** frontend with App Router, server components, and 25 pages.

**Key features:**
- Responsive design (mobile-first with collapsible sidebar)
- Agency/Tenant context switcher
- 80+ React Query hooks for data fetching
- Zustand stores for auth and UI state
- TipTap rich text editor for content authoring
- shadcn/ui component library with custom theme

**Design system:**
- Primary: `#1F2937` (dark charcoal)
- Accent: `#E53E3E` (red for CTAs and active states)
- Cards: `rounded-xl` with hover transitions
- Layout: `max-w-[1400px]` centered with responsive padding

### Database (`@tr/db`)

**Drizzle ORM** schemas and migrations for PostgreSQL.

**Schema modules:**
| Module | Tables | Description |
|--------|--------|-------------|
| Core | 7 | Agencies, tenants, users, roles, sessions, impersonation, onboarding |
| Programs | 6 | Programs, modules, lessons, enrollments, progress, tasks |
| Assessments | 3 | Templates, assessments, benchmarks |
| Mentoring | 2 | Relationships, sessions |
| Planning | 2 | Goals, strategic planning |

**Total:** 20 tables across 9 migrations.

### Shared (`@tr/shared`)

Shared TypeScript types, constants, role definitions, and permissions used by both API and web packages.

---

## Modules

### Programs & LMS

Full learning management system with program creation, curriculum building, and learner experience.

**Content types** (9):
| Type | Description |
|------|-------------|
| `lesson` | Rich text + video content |
| `sub_module` | Container for nested content (2-level nesting) |
| `quiz` | Scored assessment questions |
| `assignment` | Work submission with rubrics |
| `mentor_meeting` | Scheduled 1:1 meeting |
| `text_form` | Multi-line text input |
| `goal` | Goal setting with review workflow |
| `mentor_approval` | Learner submits, mentor approves |
| `facilitator_approval` | Completion flag by facilitator |

**Features:**
- 6-step program creation wizard
- Drip scheduling (module and lesson level): immediate, days after enrollment, sequential, on-date
- Module progress tracker with visual nodes
- Learner sidebar with expandable curriculum
- Bulk enrollment via spreadsheet upload
- Three enrollment roles: Facilitator, Mentor, Learner

### Assessments

Full 360-degree and 180-degree assessment system with the **LeaderShift™ Leadership Capacity Stress Test** as the flagship product.

**Workflow:**
1. Admin creates assessment from template, assigns subject
2. Raters are invited (self, manager, peers, direct reports)
3. Raters complete anonymous responses via token-based forms
4. System computes results with scoring engine
5. PDF report generated on demand
6. Results displayed in web UI with charts and analysis

**Assessment engine features:**
- Reverse-scored question support (`[R]` items)
- Coaching Capacity Index (CCI) - composite of tagged questions per competency
- Current Ceiling detection - identifies lowest competency as growth constraint
- Johari Window mapping (Open, Blind Spot, Hidden, Unknown)
- Gap analysis with blind spot / hidden strength classification
- Trend comparison across sequential assessments
- Rater agreement calculation
- Benchmarking against organizational/industry norms

### Mentoring

1:1 mentoring relationship management with session tracking.

**Features:**
- Mentor-mentee pairing with relationship types (mentor, coach, manager)
- Session scheduling with types: mentoring, one-on-one, check-in, review, planning
- Session prep workflow (mentee reflection before session)
- Session notes (public/private)
- Action items with assignee, due date, priority, completion tracking
- Session status flow: scheduled → prep_in_progress → ready → completed

### Scorecard

Performance dashboard with KPIs, competencies, and organizational health metrics.

### Planning & Goals

Quarterly and annual planning with goal management, review cadences, and progress tracking.

### People Management

User directory with grid/list views, search, filters, and organizational chart.

### Analytics

Dashboard with program analytics, assessment analytics, goal completion rates, and team metrics.

### Agency Portal

Multi-tenant management for consulting firms:
- **Overview** - Cross-client dashboard
- **Clients** - Tenant management and configuration
- **People** - Cross-tenant user management
- **Templates** - Assessment template library (create, duplicate, publish)
- **Branding** - Per-tenant branding configuration
- **Billing** - Subscription and usage tracking

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

POST /api/auth/logout
  → Invalidate refresh token
```

Tokens are stored in `localStorage`. The API client (`lib/api.ts`) automatically attaches the `Authorization: Bearer <token>` header and handles token refresh on 401 responses.

### Role Hierarchy

| Role | Level | Scope |
|------|-------|-------|
| `super_admin` | 100 | Platform-wide |
| `agency_owner` | 90 | Agency + all tenants |
| `agency_admin` | 80 | Agency management |
| `agency_member` | 70 | Agency read access |
| `tenant_admin` | 70 | Tenant management |
| `tenant_member` | 10 | Basic tenant access |

### Impersonation

Agency admins can impersonate any tenant user for support and debugging:

```
POST /api/admin/impersonate      # Start session
POST /api/admin/impersonate/end  # End session
GET  /api/admin/impersonate/status   # Check active session
GET  /api/admin/impersonate/history  # Audit log
```

The impersonation token is sent via `X-Impersonation-Token` header. An amber banner displays at the top of the UI with a "Switch Back" button.

---

## Assessment Engine

Located in `packages/api/src/lib/assessment-engine.ts`.

### Scoring Pipeline

```
Raw Responses
    │
    ▼
Reverse Scoring (invert [R] items: effective = scaleMax + scaleMin - raw)
    │
    ▼
Score Aggregation (per question, per competency, per rater type)
    │
    ▼
Gap Analysis (self vs. others → blind_spot / hidden_strength / aligned)
    │
    ▼
Johari Window Mapping (Open / Blind Spot / Hidden / Unknown quadrants)
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
| 1.0 - 2.0 | Low |
| 2.1 - 3.0 | Moderate |
| 3.1 - 4.0 | High |
| 4.1 - 5.0 | Very High |

---

## PDF Report Generation

Located in `packages/api/src/lib/pdf/`.

Assessment reports are generated server-side using `@react-pdf/renderer` with a minimal executive aesthetic (black/white + Deep Navy `#1B3A5C`).

### Report Sections (16 total)

| # | Section | Description |
|---|---------|-------------|
| 1 | Cover Page | Assessment title, subject name, date, confidential notice |
| 2 | How to Read | Scale explanation, emotional framing |
| 3 | Rater Participation | Response rates by rater type |
| 4 | Executive Summary | Overall score, Johari window, strengths/gaps |
| 5 | Current Ceiling | Lowest competency as growth constraint |
| 6 | CCI Gauge | Coaching Capacity Index with horizontal bar |
| 7 | Competency Overview | Ranked bars + adaptive radar chart |
| 8 | Competency Detail | One page per competency with item-level scores |
| 9 | Gap Analysis | Self vs. others divergence chart |
| 10 | Top/Bottom 5 | Highest and lowest rated items |
| 11 | Comments | Grouped qualitative feedback |
| 12 | Trend Comparison | Pre/post comparison (conditional) |
| 13 | Development Worksheet | Goal-setting templates |
| 14 | Development Ecosystem | Platform integration guide |
| 15 | Appendices | Full data tables, methodology |

### Adaptive Radar Chart

- **180-degree assessment**: Self (solid line) vs. Boss (dashed line)
- **360-degree assessment**: Multi-rater overlay (Self, Manager, Peers, Direct Reports)

---

## API Reference

All endpoints are prefixed with `/api`. Authentication required unless noted.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/register` | Register new user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout and invalidate tokens |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PUT | `/users/me` | Update current user profile |
| GET | `/tenants/:id/users` | List tenant users |
| POST | `/tenants/:id/users` | Create user in tenant |

### Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants/:id/programs` | List tenant programs |
| POST | `/tenants/:id/programs` | Create program |
| GET | `/tenants/:id/programs/:pid` | Get program detail |
| PUT | `/tenants/:id/programs/:pid` | Update program |
| DELETE | `/tenants/:id/programs/:pid` | Delete program |
| POST | `/tenants/:id/programs/:pid/modules` | Create module |
| POST | `/tenants/:id/programs/:pid/modules/:mid/lessons` | Create lesson |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants/:id/assessments` | List assessments |
| POST | `/tenants/:id/assessments` | Create assessment |
| GET | `/tenants/:id/assessments/:aid` | Get assessment |
| POST | `/tenants/:id/assessments/:aid/invitations` | Send invitations |
| POST | `/tenants/:id/assessments/:aid/results/compute` | Compute results |
| GET | `/tenants/:id/assessments/:aid/report/pdf` | Download PDF report |

### Assessment Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/respond/:token` | Get assessment form (public) |
| POST | `/respond/:token` | Submit response (public) |
| POST | `/tenants/:id/assessments/:aid/respond` | Submit response (authenticated) |

### Agency Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agencies/:id/templates` | List templates |
| POST | `/agencies/:id/templates` | Create template |
| PUT | `/agencies/:id/templates/:tid` | Update template |
| POST | `/agencies/:id/templates/:tid/duplicate` | Duplicate template |
| DELETE | `/agencies/:id/templates/:tid` | Delete template |

### Impersonation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/impersonate` | Start impersonation |
| POST | `/admin/impersonate/end` | End impersonation |
| GET | `/admin/impersonate/status` | Check active session |
| GET | `/agencies/me/users/search` | Cross-tenant user search |

---

## Database Schema

### Entity Relationship Overview

```
Agency (1) ──── (*) Tenant
Tenant (1) ──── (*) User
Tenant (1) ──── (*) Program
Program (1) ──── (*) Module ──── (*) Lesson
Program (1) ──── (*) Enrollment ──── (1) User
Agency (1) ──── (*) AssessmentTemplate
Tenant (1) ──── (*) Assessment ──── (*) Invitation ──── (*) Response
Assessment (*) ──── (1) AssessmentTemplate
Assessment (*) ──── (1) User [subject]
User (1) ──── (*) MentoringRelationship ──── (*) MentoringSession
User (1) ──── (*) Goal
```

### Key Tables

| Table | Description |
|-------|-------------|
| `agencies` | Parent consulting organizations |
| `tenants` | Client organizations |
| `users` | All user accounts with multi-tenant support |
| `roles` | System roles with hierarchical levels |
| `programs` | Learning programs with JSONB config |
| `modules` | Program modules with nesting support (depth 0-1) |
| `lessons` | Content items with 9 types and JSONB config |
| `enrollments` | User-program relationships with roles |
| `lesson_progress` | Per-user lesson completion tracking |
| `assessment_templates` | Template definitions with JSONB question config |
| `assessments` | Assessment instances with computed_results JSONB |
| `assessment_invitations` | Rater invitations with unique tokens |
| `assessment_responses` | Individual rater responses |
| `assessment_benchmarks` | Organizational/industry benchmarks |
| `mentoring_relationships` | Mentor-mentee pairings |
| `mentoring_sessions` | Session records with prep, notes, action items |
| `goals` | Goal definitions with metrics and review cadence |

---

## UI Prototype

A standalone **Vite + React** prototype app for rapid UI development and design iteration.

```bash
cd components
npm install
npm run dev
# Opens at http://localhost:5173
```

The prototype contains 16 feature modules with 131 components covering all platform pages. It uses mock data and serves as the design reference for the production Next.js frontend.

---

## Test Accounts

After running `pnpm db:seed`:

| Email | Password | Role | Organization |
|-------|----------|------|-------------|
| `admin@acme.com` | `password123` | Agency Owner | Acme Consulting |
| `admin@techcorp.com` | `password123` | Tenant Admin | TechCorp |
| `coach@techcorp.com` | `password123` | Facilitator | TechCorp |
| `mentor@techcorp.com` | `password123` | Mentor | TechCorp |
| `john.doe@techcorp.com` | `password123` | Learner | TechCorp |
| `jane.smith@techcorp.com` | `password123` | Learner | TechCorp |
| `alex.wilson@techcorp.com` | `password123` | Learner | TechCorp |

**Seeded assessments** (require compute after seeding):
- Jane Smith - Leadership 360 (completed, 5 raters)
- John Doe - LeaderShift 360 (completed, 5 raters)
- Alex Wilson - LeaderShift 180 (completed, 2 raters)

To compute results after seeding:
```bash
# Via API
POST /api/tenants/:tenantId/assessments/:assessmentId/results/compute
```

---

## Environment Variables

### API (`packages/api/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `API_PORT` | API server port | `3002` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_ACCESS_SECRET` | JWT access token signing secret (32+ chars) | - |
| `JWT_REFRESH_SECRET` | JWT refresh token signing secret (32+ chars) | - |
| `WEB_URL` | Frontend URL for CORS | `http://localhost:3003` |
| `NODE_ENV` | Environment | `development` |

### Web (`packages/web/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3002` |

### Database (`packages/db/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |

---

## Scripts

### Root (monorepo)

```bash
pnpm dev            # Start all packages concurrently
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm clean          # Clean all build artifacts
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run database migrations
pnpm db:seed        # Seed database with test data
pnpm db:studio      # Open Drizzle Studio (database GUI)
```

### Per-package

```bash
pnpm --filter @tr/api dev       # Start API server
pnpm --filter @tr/web dev       # Start Next.js frontend
pnpm --filter @tr/db db:seed    # Seed database
pnpm --filter @tr/db db:studio  # Open Drizzle Studio
pnpm --filter @tr/db db:seed-leadershift  # Seed LeaderShift data only
```

---

## Project Status

### Completed

- Multi-tenant architecture (Agency/Tenant hierarchy)
- JWT authentication with password login, access/refresh tokens
- Role-based authorization with 30+ permissions
- Admin impersonation system with audit logging
- Programs & LMS (9 content types, drip scheduling, progress tracking)
- Program Builder (6-step wizard, curriculum editor, enrollment management)
- Assessment module (full stack: templates, invitations, responses, scoring, PDF reports)
- LeaderShift assessment engine (reverse scoring, CCI, Current Ceiling, trends)
- PDF report generation (16-section executive report)
- Learner dashboard with real API data
- Agency portal (Overview, Clients, People, Templates)
- Settings profile connected to real API
- 25 frontend pages, 80+ React Query hooks

### In Progress

- Specialized content type editors (quiz builder, form builder)
- Connect Programs UI to real enrollment/progress data

### Planned

- Scorecard module (API routes, DB schema refinement)
- Planning & Goals module (API routes)
- Mentoring module (API routes)
- Analytics module (API routes)
- Notification system
- Real-time updates
- Certificate/diploma generation
- Rich content editor (WYSIWYG for lessons)

---

## Contributing

1. Create a feature branch from `main`
2. Follow existing code patterns and TypeScript strict mode
3. Use absolute imports with `@/` alias
4. Add React Query hooks for any new API endpoints
5. Follow the component naming conventions (PascalCase components, camelCase functions)
6. Test with seed data before submitting PR

---

## License

Proprietary. All rights reserved.
