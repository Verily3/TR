# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants working on the Transformation OS project.

## Project Overview

**Transformation OS** is a multi-tenant B2B SaaS platform for corporate transformation and executive leadership development. It combines LMS, scorecard management, goal tracking, mentoring, and assessments.

## Repository Structure

```
TR/
├── packages/
│   ├── api/              # Hono API server
│   │   ├── src/
│   │   │   ├── routes/   # API route handlers (auth, programs, goals, mentoring, etc.)
│   │   │   ├── middleware/  # Auth, logging, etc.
│   │   │   └── index.ts  # Server entry point
│   │   └── .env          # API environment variables
│   │
│   ├── db/               # Database package
│   │   ├── src/
│   │   │   ├── schema/   # Drizzle ORM schemas
│   │   │   ├── seed.ts   # Database seeding
│   │   │   └── index.ts  # DB client export
│   │   └── drizzle/      # Migrations
│   │
│   └── web/              # Next.js frontend
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   │   ├── (dashboard)/  # Authenticated routes
│       │   │   │   ├── agency/   # Agency portal pages
│       │   │   │   ├── mentoring/ # Mentoring dashboard and sessions
│       │   │   │   ├── goals/    # Goals pages
│       │   │   │   ├── programs/ # Programs pages
│       │   │   │   └── dashboard/ # Tenant dashboard
│       │   │   └── (auth)/       # Login, register
│       │   ├── components/
│       │   │   ├── ui/           # shadcn components
│       │   │   ├── layout/       # Sidebar, header, etc.
│       │   │   ├── goals/        # Goal-related components
│       │   │   ├── programs/     # Program-related components
│       │   │   └── coaching/     # Mentoring-related components
│       │   ├── hooks/
│       │   │   └── api/          # React Query hooks (usePrograms, useGoals, useMentoring, etc.)
│       │   ├── lib/              # Utilities, API client
│       │   ├── providers/        # React Query, Auth, Theme
│       │   └── stores/           # Zustand stores
│       └── .env.local            # Web environment variables
│
├── components/                   # UI Prototype (Vite + React)
│   ├── src/                      # Main app entry
│   ├── dashboard/                # Dashboard components
│   ├── scorecard/                # Scorecard components
│   ├── planning/                 # Planning & Goals components
│   ├── programs/                 # Programs & LMS components
│   ├── program-builder/          # Program Builder components
│   ├── coaching/                 # Mentoring components
│   ├── assessments/              # Assessments components
│   ├── people/                   # People management components
│   ├── analytics/                # Analytics components
│   ├── settings/                 # Settings components
│   ├── agency/                   # Agency portal components
│   ├── notifications/            # Notifications components
│   ├── onboarding/               # Onboarding wizard components
│   ├── help/                     # Help & Support components
│   ├── search/                   # Search & Command Palette components
│   └── ui/                       # Shared UI components (Card, etc.)
│
├── Corporate Transformation OS/  # Legacy prototype reference
│   └── src/                      # Legacy prototype components
│
├── SPECS/                        # Detailed specifications
├── ANALYSIS_NOTES.md             # Full requirements spec
├── overview.txt                  # Detailed PRD document
└── turbo.json                    # Monorepo config
```

## Key Concepts

### Multi-Tenant Architecture

1. **Agency Account** (parent): Manages the system, creates clients, owns templates
2. **Client/Tenant** (child): Runs programs, has own users and branding

### Context Switching

Users can switch between Agency view and Tenant view using the context switcher in the sidebar. The current context is stored in Zustand and determines which navigation/pages are shown.

### Authentication

- **JWT-based**: Login via `POST /api/auth/login` with `{email, password}` (argon2 hashing)
- Access tokens (15 min) + Refresh tokens (7 day)
- Tokens stored in `localStorage` as `accessToken` / `refreshToken`
- Auth middleware at `packages/api/src/middleware/auth.ts` verifies JWT
- Impersonation uses `X-Impersonation-Token` header + `sessionStorage`

### Impersonation

Agency admins can "Login As" any tenant user to see their experience:
- **Header dropdown** → "Login As User" → search modal with real-time cross-tenant search
- API: `POST /api/admin/impersonate` starts session, `POST /api/admin/impersonate/end` ends it
- `GET /api/agencies/me/users/search?search=` searches users across all agency tenants
- Impersonation token stored in `sessionStorage`, injected via `X-Impersonation-Token` header
- Amber `ImpersonationBanner` shows at top with "Switch Back" button
- All sessions logged for audit (reason, duration, admin, target)
- Requires `AGENCY_IMPERSONATE` permission (agency_owner role)

### Program Roles

Users enrolled in programs have one of three roles:
- **Facilitator**: Administers and leads the program
- **Mentor**: Guides and supports learners through the program
- **Learner**: Enrolled participant who completes the program content

Mentor-Learner relationships are tracked in the `enrollment_mentorships` table, supporting many-to-many assignments within a program.

### Mentoring Module

The mentoring module supports ongoing 1:1 mentoring relationships outside of programs:

**Mentoring Relationships**: Mentor ↔ Mentee pairings with relationship types (mentor, coach, manager) and meeting preferences.

**Mentoring Sessions**: Scheduled meetings with:
- Session types: mentoring, one_on_one, check_in, review, planning
- Session prep: Pre-session reflection by mentee (wins, challenges, topics to discuss)
- Session notes: Public or private notes during/after sessions
- Action items: Follow-up tasks with owner, due date, priority, and completion tracking

**Session Statuses**: scheduled → prep_in_progress → ready → completed (or cancelled/no_show)

## Tech Stack Details

| Component | Technology | Notes |
|-----------|------------|-------|
| Monorepo | Turborepo + pnpm | Workspaces in `packages/` and `apps/` |
| Frontend | Next.js 14 | App Router, server components where possible |
| UI | shadcn/ui + Tailwind | Custom theme matching prototype |
| State | Zustand | Persistent auth store |
| Server State | React Query | Data fetching and caching |
| API | Hono.js | Lightweight, fast, TypeScript-first |
| Database | PostgreSQL + Drizzle | Type-safe ORM with migrations |
| Auth | Firebase Admin | Server-side token verification |

## Design System

### Colors (from prototype)

```css
--primary: #1F2937;        /* Dark charcoal - buttons, nav */
--accent: #E53E3E;         /* Red - active states, icons, CTAs */
--muted: #ececf0;          /* Light gray backgrounds */
--sidebar: #F9FAFB;        /* Very light gray sidebar */
```

### Design Patterns

1. **Icons**: Use `text-accent` (red) for icons in cards
2. **Cards**: `rounded-xl`, `hover:border-accent/30 transition-all`
3. **Active nav**: `bg-accent text-accent-foreground`
4. **Action links**: `text-accent` with `ArrowRight` icon, hover animation
5. **Progress bars**: `bg-accent` for high values
6. **Page layout**: `max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8` (responsive padding)

### Responsive Breakpoints

The UI follows Tailwind's default breakpoints:
- **Mobile first**: Default styles apply to mobile
- **sm (640px+)**: Small tablets and larger phones in landscape
- **lg (1024px+)**: Desktop and larger tablets

Common responsive patterns:
```css
/* Padding */
p-4 sm:p-6 lg:p-8

/* Grid columns */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

/* Text sizing */
text-xl sm:text-2xl

/* Visibility */
hidden sm:block  /* Hide on mobile */
sm:hidden        /* Show only on mobile */

/* Sidebar */
-translate-x-full lg:translate-x-0  /* Collapsible on mobile */
```

### Mobile Navigation

The sidebar uses a drawer pattern on mobile:
- Hidden by default on mobile (`-translate-x-full`)
- Triggered by hamburger menu in mobile header
- Full-screen overlay backdrop when open
- Auto-closes on navigation

### Component Library

Located in `packages/web/src/components/ui/`:
- Button, Card, Input, Label, Select, Textarea
- Avatar, DropdownMenu, Toast, Dialog, AlertDialog
- Checkbox, Popover, MultiSelect, Tabs
- All follow shadcn/ui patterns with custom theme
- Use `useToast` hook for notifications

### Program Components

Located in `packages/web/src/components/programs/`:
- `AddParticipantModal` - Add new or existing users to programs with role selection
- `CreateProgramWizard` - 6-step wizard for program creation (Basic Info → Objectives → Schedule → Communication → Audience → Review)
- `wizard-types.ts` - Type definitions for wizard form data (WizardStep, WizardFormData, etc.)
- `wizard-data.ts` - Constants (learning tracks, timezones, email/reminder defaults)
- `BulkInviteModal` - Spreadsheet-based bulk enrollment
- `CurriculumBuilder` - Module/lesson management sidebar
- `LessonEditorPanel` - Comprehensive lesson editing with tabs
- `LessonViewer` - Content rendering for learners
- `LearnerSidebar` - Navigation sidebar for learners
- `CreateModuleModal`, `CreateLessonModal` - Creation modals
- `ModuleEditorSheet` - Module editing interface
- `DripSettings` - Content drip scheduling configuration
- `ProgramSettings` - Program-level settings editor

### Programs Module Architecture

**Content Types** (9 types in `content_type` enum):
- `lesson` - Rich content with video + text
- `sub_module` - Container for nested content
- `quiz` - Scored questions
- `assignment` - Work submission
- `mentor_meeting` - Scheduled 1:1 meeting
- `text_form` - Multi-line text input
- `goal` - Goal setting with review workflow
- `mentor_approval` - Learner submits, mentor/facilitator approves
- `facilitator_approval` - Simple completion flag

**Drip Scheduling**:
- Module-level: `immediate`, `days_after_enrollment`, `days_after_previous`, `on_date`
- Lesson-level: `immediate`, `sequential`, `days_after_module_start`, `on_date`

**Sub-Module Support**: 2-level nesting (depth 0 = top-level, depth 1 = sub-module)

**Goal Responses** (for `goal` content type):
- Statement, success metrics, action steps, target date
- Review frequency (weekly, biweekly, monthly, quarterly)
- Periodic reviews with progress tracking

**Approval Workflow** (for `mentor_approval` content type):
- Learner submits description
- Mentor or facilitator reviews and approves/rejects with feedback

### Mentoring Components

Located in `packages/web/src/components/coaching/`:
- `NewSessionModal` - Schedule new mentoring sessions with relationship selection

### Template Components

Located in `packages/web/src/components/templates/`:
- `CompetencyEditor` - Edit individual competency with inline question management
- `CompetencyList` - Manage list of competencies with reorder, add/delete
- `CreateTemplateModal` - Quick template creation with name, type, description

### Assessments Module Architecture

The assessments module has two levels:

**Agency Level (Templates):**
- Templates are owned by agencies and can be published to tenants
- API routes at `/agencies/:agencyId/templates`
- Hooks: `useTemplates`, `useTemplate`, `useCreateTemplate`, `useUpdateTemplate`, `useDeleteTemplate`, `useDuplicateTemplate`
- Pages: `/agency/assessments` (list), `/agency/assessments/[templateId]` (editor)

**Tenant Level (Assessments):**
- Assessments are created from templates for specific subjects
- API routes at `/tenants/:tenantId/assessments`
- Full CRUD + invitations, rater responses, result computation, PDF generation, benchmarks
- Hooks: `useAssessments`, `useAssessment`, `useAssessmentStats`, `useAssessmentResults`, `useCreateAssessment`, `useUpdateAssessment`, `useDeleteAssessment`, `useAddInvitations`, `useRemoveInvitation`, `useSendReminders`, `useCloseAssessment`, `useComputeResults`, `useDownloadReport`, `useAssessmentBenchmarks`, `useAssessmentGoals`, `useCreateGoalsFromAssessment`
- Pages: `/assessments` (list with filter tabs, detail view with Overview/Raters/Results/Development/Settings tabs)

**Template Structure (JSONB):**
```typescript
{
  competencies: [{
    id: string,
    name: string,
    description?: string,
    subtitle?: string,        // e.g., "Direction Must Hold Under Pressure"
    questions: [{
      id: string,
      text: string,
      type?: 'rating' | 'text' | 'multiple_choice',
      required?: boolean,
      reverseScored?: boolean, // [R] items — score inverted during computation
      isCCI?: boolean,         // Coaching Capacity Index item (one per competency)
    }]
  }],
  scaleMin: number,
  scaleMax: number,
  scaleLabels: string[],
  allowComments: boolean,
  requireComments: boolean,
  anonymizeResponses: boolean,
  raterTypes: ('self' | 'manager' | 'peer' | 'direct_report')[],
}
```

**Assessment Engine** (`packages/api/src/lib/assessment-engine.ts`):
- `computeAssessmentResults(assessmentId)` — computes all scores, gaps, CCI, ceiling, trend
- Reverse scoring: `effectiveRating = scaleMax + scaleMin - rawRating` for `[R]` items
- CCI (Coaching Capacity Index): average of `isCCI`-tagged questions, bands: Low/Moderate/High/Very High
- Current Ceiling: lowest-scoring competency with generated constraint narrative
- Trend comparison: calls `computeTrend()` from `trend-engine.ts` for sequential assessments
- Gap analysis with Johari Window classification (blind_spot, hidden_strength, aligned)

**PDF Report** (`packages/api/src/lib/pdf/`):
- `report-generator.tsx` — 16-section LeaderShift™ report using `@react-pdf/renderer`
- `svg-charts.ts` — Adaptive radar (180 Self vs Boss, 360 multi-rater), CCI gauge, distribution histograms, gap divergence
- `shared-styles.ts` — Minimal executive palette: Deep Navy `#1B3A5C` + grayscale, Helvetica typography
- Design: "A private board-level document" — no gradients, shadows, or decorative elements

**Assessment Components** (`packages/web/src/components/assessments/`):
- `DownloadReportButton` — PDF download button
- `RaterResponseForm` — Public rater response form
- `DevelopmentPlanView` — Post-assessment development planning
- `GoalSuggestions` — AI-generated goal suggestions from results
- `MentoringGuide` — Mentoring recommendations based on results

## Development Commands

```bash
# Start everything
pnpm dev

# Run specific package
pnpm --filter @tr/api dev
pnpm --filter @tr/web dev

# Database operations
pnpm --filter @tr/db db:generate   # Generate migrations
pnpm --filter @tr/db db:migrate    # Run migrations
pnpm --filter @tr/db db:seed       # Seed data
pnpm --filter @tr/db db:studio     # Open Drizzle Studio
```

## Port Configuration

| Service | Port | Notes |
|---------|------|-------|
| API     | 3002 | Hono server (`packages/api`) |
| Web     | 3003 | Next.js frontend (`packages/web`) |
| UI Prototype | 5173 | Vite dev server (`components/`) |

## Environment Variables

### API (`packages/api/.env`)
```
PORT=3002
DATABASE_URL=postgres://user:pass@localhost:5432/transformation_os
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

### Web (`packages/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

## Current Implementation Status

### Completed
- Agency portal (6 tabs): Overview, Clients, People, Templates, Branding, Billing
- Context switcher for Agency/Tenant views
- JWT authentication with password login (argon2), access/refresh tokens
- Design system matching prototype
- React Query hooks for data fetching (tenants, programs, goals, mentoring, assessments, templates)
- Dashboard page connected to real API data
- **Header with user dropdown menu** (avatar, name, Settings, Login As User, Sign out)
- Database seeded with test data
- Goals list, detail, and create modal
- Program enrollment with role selection (Facilitator, Mentor, Learner)
- Mentor-Learner relationship management
- Add Participant modal (new user or existing member)
- Mentoring API routes (relationships, sessions, prep, notes, action items, stats)
- Mentoring dashboard page (stats, sessions list, relationships tabs)
- Session detail page (prep, notes, action items, participants)
- New Session modal, Add Note modal, Add Action Item modal
- Agency template API routes (CRUD, duplicate, stats)
- Agency assessments page connected to real API
- Template builder UI (competencies, questions, scale settings)
- Create template modal
- Template editor with toast notifications, keyboard shortcuts (Ctrl+S), unsaved changes protection
- **Programs Learner UI (matching PROGRAMS_SECTION_COMPLETE_SPECS.md):**
  - Programs Page (`/programs`) - Catalog with stats bar, filter tabs, program cards
    - Status-based styling (blue=in-progress, green=completed, muted=not-started)
    - ProgramCard with expandable curriculum and Phase Progress Tracker
    - Agency user tenant selection support
  - Program Detail Page (`/programs/[programId]`) - Learner overview
    - Header with icon box, title, meta info, status badge
    - Stats grid (Total Points, Progress, Time Remaining, Linked Goals)
    - Module Progress Tracker with horizontal nodes
    - Program Overview (What You'll Learn + Program Structure)
    - Linked Goals section with progress
  - Module View LMS (`/programs/[programId]/learn`) - Full learning interface
    - Left sidebar (w-80) with course outline, expandable modules/lessons
    - 6 lesson types: reading, video, meeting, submission, assignment, goal
    - Top navigation bar (breadcrumb, points badge, completed badge)
    - Bottom navigation bar (Previous/Next, lesson counter)
    - Completion modal for marking lessons done
- **Program Builder Features:**
  - 9 content types (lesson, quiz, goal, mentor_approval, etc.)
  - Sub-module support (2-level nesting)
  - Drip scheduling (module and lesson level)
  - Goal responses and reviews API
  - Approval workflow API (mentor/facilitator can approve)
  - Progress tracking with completion marking
  - Module/lesson CRUD, reorder, duplicate
  - 27+ React Query hooks for programs
- **Impersonation System (full stack):**
  - API: POST /api/admin/impersonate, POST /end, GET /status, GET /history
  - API: GET /api/agencies/me/users/search (cross-tenant user search for impersonation)
  - Header dropdown → "Login As User" → search modal with real-time filtering
  - ImpersonationSearchModal: search users across tenants, grouped results, confirmation flow
  - ImpersonationBanner: amber bar showing "Viewing as [name]" + "Switch Back" button
  - API client injects X-Impersonation-Token header from sessionStorage
  - Audit logging of all impersonation sessions
- **Dashboard Pages (10 pages built):**
  - Scorecard (`/scorecard`) - Role/Mission, KPIs, Competencies
  - Planning & Goals (`/planning`) - Quarterly planning, goal management
  - Mentoring (`/mentoring`) - Sessions, relationships, action items
  - Assessments (`/assessments`) - 180/360 types, filter tabs, detail view with Results/Development tabs, CCI + Current Ceiling display
  - People (`/people`) - User directory with grid/list views
  - Analytics (`/analytics`) - Charts and metrics dashboard
  - Settings (`/settings`) - Profile (connected to real API), Notifications, Security, Integrations, Account
  - Notifications (`/notifications`) - Notification center with filters
  - Help & Support (`/help`) - Knowledge base, FAQs, tickets
  - Program Builder (`/program-builder`) - Connected to real programs API
- **Program Builder connected to real API:**
  - Agency users: useAgencyPrograms() → GET /api/agencies/me/programs
  - Tenant users: usePrograms(tenantId) with search/filter/pagination
  - Real Create, Duplicate, Delete actions via mutations
  - 6-step Create Program Wizard matching prototype design
  - Program Builder Editor (`/program-builder/[programId]`) with 6 tabs: Curriculum, Participants, Info, Goals, Resources, Reports
  - Curriculum tab: content type picker dropdown (9 types), inline lesson editors per type
  - Wizard stores objectives, email settings, reminders, audience in program `config` JSONB
- **Settings Profile connected to real API:**
  - useMyProfile() → GET /api/users/me (full profile with phone, timezone, metadata)
  - Save via useUpdateUser(tenantId, userId) for tenant users
  - Loads real firstName, lastName, email, title, department, phone, timezone, bio
- **UI Prototype (components/):**
  - Dashboard with Journey Hub, Leaderboard, Schedule, Learning Queue
  - Scorecard with Role/Mission, KPIs, Competencies, Org Health
  - Planning & Goals with quarterly planning and goal management
  - Programs with list, detail, and LMS learning views
  - Program Builder with curriculum editor
  - Mentoring with sessions and relationships
  - Assessments with list and detail views
  - People management with grid/list views and filters
  - Analytics dashboard
  - Settings page
  - Agency portal with all tabs (Overview, Clients, Team, Templates, etc.)
  - Notifications system (page, dropdown, preferences)
  - Onboarding wizard (multi-step with profile, goals, team setup)
  - Help & Support (knowledge base, FAQs, ticket system)
  - Search (command palette Cmd+K + full search page)
  - **Responsive/Mobile layouts** for all pages
- **Assessment Module (full stack, end-to-end):**
  - DB schema: `assessment_templates`, `assessments`, `assessment_invitations`, `assessment_responses`, `assessment_benchmarks`
  - Assessment API routes (CRUD, invitations, responses, close, compute results, PDF generation, benchmarks)
  - Assessment engine: score computation, gap analysis, Johari window, top/bottom items
  - Reverse-scored questions (`[R]` items) with automatic score inversion
  - Coaching Capacity Index (CCI): composite of `isCCI`-tagged questions with band classification
  - Current Ceiling: lowest competency with generated constraint narrative
  - Trend engine: comparison of sequential assessments for same subject/template
  - PDF report generator: 16-section LeaderShift™ executive report (`@react-pdf/renderer`)
  - Adaptive radar chart: 180 (Self vs Boss solid/dashed) and 360 (multi-rater overlay)
  - Minimal executive aesthetic: Deep Navy `#1B3A5C` + grayscale, Helvetica typography
  - Web results view: competency scores, gap analysis, CCI gauge, Current Ceiling, trend comparison
  - Rater response form (public token-based access)
  - Development plan view, goal suggestions, mentoring guide from results
  - PDF download button with streaming
  - 17 React Query hooks for full assessment lifecycle
  - Seed data: 4 templates (Leadership 360, Manager 180, LeaderShift 360, LeaderShift 180), 5 assessments with realistic responses

### In Progress
- Specialized content type editors (quiz builder, form builder)
- Connect Programs UI to real enrollment/progress data (currently using mock data)

### Pages Using Mock Data (No API Routes Yet)
- Scorecard - no API routes, no DB schema
- Planning & Goals - DB schema exists (planning/), no API routes
- Mentoring - DB schema exists (mentoring/), no API routes
- Analytics - no API routes, no DB schema
- Notifications - no API routes, no DB schema
- Help & Support - static content, no API needed

### Not Yet Implemented
- API routes for: Mentoring, Planning, Scorecard, Analytics, Notifications
- Session prep form (edit mode)
- Mentoring relationship management UI
- Real Firebase integration
- Program templates and duplication
- Certificate/diploma generation
- Rich content editor (WYSIWYG)
- Lesson resources/attachments UI
- Programs admin view: settings and advanced features (basic editor built)

### Test Accounts (after running `pnpm --filter @tr/db db:seed`)
- `admin@acme.com` - Agency Owner (has agencyId, no tenantId) - password: `password123`
- `admin@techcorp.com` - Tenant Admin (tenantId, no enrollments)
- `coach@techcorp.com` - Facilitator
- `mentor@techcorp.com` - Mentor
- `john.doe@techcorp.com` - Learner (enrolled in "Leadership Essentials")
- `jane.smith@techcorp.com` - Learner
- `alex.wilson@techcorp.com` - Learner

## Code Style Guidelines

1. **TypeScript**: Strict mode, explicit types for function parameters
2. **Components**: Functional components with hooks
3. **Naming**: PascalCase for components, camelCase for functions/variables
4. **Imports**: Absolute imports using `@/` alias
5. **State**: Zustand for global state, React Query for server state
6. **API calls**: Use the API client from `@/lib/api.ts`
7. **Hooks**: Use hooks from `@/hooks/api/` for data fetching (usePrograms, useGoals, useTenants, useMentoringSessions, useActionItems, useTemplates, useAssessments, useAssessmentResults, useComputeResults, useDownloadReport, useAssessmentBenchmarks, useAgencyPrograms, useAgencyUserSearch, useMyProfile, useImpersonate, etc.)

## UI Prototype (components/)

The `components/` folder contains a standalone Vite + React prototype app for rapid UI development.

### Running the Prototype

```bash
cd components
npm install
npm run dev
# Opens at http://localhost:5173
```

### Prototype Structure

Each module follows a consistent pattern:
- `types.ts` - TypeScript interfaces and types
- `data.ts` - Mock data and helper functions
- `*Page.tsx` - Main page component
- `*Card.tsx`, `*Modal.tsx` - Supporting components
- `index.ts` - Barrel exports

### Key Features

| Module | Components | Features |
|--------|------------|----------|
| Dashboard | JourneyHub, Leaderboard, MySchedule, LearningQueue | Progress tracking, gamification |
| Scorecard | RoleMission, KPIs, Competencies, OrgHealth | Performance metrics |
| Programs | ProgramsPage, ProgramDetail, ModuleViewLMS | Learning experience |
| Mentoring | SessionCard, RelationshipCard, NewSessionModal | Session management |
| Notifications | NotificationDropdown, NotificationCard, Preferences | Real-time alerts |
| Search | SearchCommand (Cmd+K), SearchPage | Global search with categories |
| Onboarding | OnboardingWizard (7 steps) | New user setup |
| Help | HelpPage, FAQSection, SupportTicketModal | Self-service support |

### Mobile/Responsive

All components are mobile-responsive with:
- Collapsible sidebar drawer on mobile
- Mobile header with hamburger menu
- Responsive grids (1→2→3 columns)
- Touch-friendly tap targets
- Adaptive text sizing

## Reference Documents

- **Requirements**: `ANALYSIS_NOTES.md` (full spec & development phases)
- **PRD**: `overview.txt` (detailed product requirements)
- **Specifications**: `SPECS/` folder (detailed module specs)
- **UI Prototype**: `components/` (Vite + React app at localhost:5173)
- **Legacy Prototype**: `Corporate Transformation OS/src/` (original reference)

## Common Tasks

### Adding a new page
1. Create page at `packages/web/src/app/(dashboard)/[route]/page.tsx`
2. Use `"use client"` if needed
3. Follow the layout pattern: `max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8`
4. Add navigation item in `packages/web/src/components/layout/sidebar.tsx`

### Adding an API route
1. Create route file at `packages/api/src/routes/[name].ts`
2. Export Hono router
3. Import and mount in `packages/api/src/index.ts`

### Adding a database table
1. Add schema in `packages/db/src/schema/`
2. Export from `packages/db/src/schema/index.ts`
3. Run `pnpm --filter @tr/db db:generate`
4. Run `pnpm --filter @tr/db db:migrate`

### Adding a UI Prototype Module
1. Create folder at `components/[module-name]/`
2. Create files following the pattern:
   - `types.ts` - Define interfaces
   - `data.ts` - Add mock data
   - `[Module]Page.tsx` - Main page component
   - `index.ts` - Export all components
3. Add content path to `components/tailwind.config.js`
4. Import and wire up in `components/src/App.tsx`
5. Add navigation item to `navItems` array
