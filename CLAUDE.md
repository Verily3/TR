# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants working on the Transformation OS project.

## Project Overview

**Transformation OS** is a multi-tenant B2B SaaS platform for corporate transformation and executive leadership development. It combines LMS, scorecard management, goal tracking, coaching, and 360 assessments.

## Repository Structure

```
TR/
├── packages/
│   ├── api/              # Hono API server
│   │   ├── src/
│   │   │   ├── routes/   # API route handlers (auth, programs, goals, coaching, etc.)
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
│       │   │   │   ├── coaching/ # Coaching dashboard and sessions
│       │   │   │   ├── goals/    # Goals pages
│       │   │   │   ├── programs/ # Programs pages
│       │   │   │   └── dashboard/ # Tenant dashboard
│       │   │   └── (auth)/       # Login, register
│       │   ├── components/
│       │   │   ├── ui/           # shadcn components
│       │   │   ├── layout/       # Sidebar, header, etc.
│       │   │   ├── goals/        # Goal-related components
│       │   │   ├── programs/     # Program-related components
│       │   │   └── coaching/     # Coaching-related components
│       │   ├── hooks/
│       │   │   └── api/          # React Query hooks (usePrograms, useGoals, useCoaching, etc.)
│       │   ├── lib/              # Utilities, API client
│       │   ├── providers/        # React Query, Auth, Theme
│       │   └── stores/           # Zustand stores
│       └── .env.local            # Web environment variables
│
├── Corporate Transformation OS/  # Prototype reference
│   └── src/                      # Prototype components
│
├── ROADMAP.md                    # Development status & task tracking
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

- **Production**: Firebase Auth with JWT tokens
- **Development**: Mock auth system (`mock-token::uid::email` format)

The API middleware at `packages/api/src/middleware/auth.ts` handles both modes.

### Program Roles

Users enrolled in programs have one of three roles:
- **Facilitator**: Administers and leads the program
- **Mentor**: Guides and supports learners through the program
- **Learner**: Enrolled participant who completes the program content

Mentor-Learner relationships are tracked in the `enrollment_mentorships` table, supporting many-to-many assignments within a program.

### Coaching Module

The coaching module supports ongoing 1:1 coaching and mentoring relationships outside of programs:

**Coaching Relationships**: Coach ↔ Coachee pairings with relationship types (mentor, coach, manager) and meeting preferences.

**Coaching Sessions**: Scheduled meetings with:
- Session types: coaching, one_on_one, check_in, review, planning
- Session prep: Pre-session reflection by coachee (wins, challenges, topics to discuss)
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
6. **Page layout**: `max-w-[1400px] mx-auto p-8`

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

### Coaching Components

Located in `packages/web/src/components/coaching/`:
- `NewSessionModal` - Schedule new coaching sessions with relationship selection

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
- Hooks: `useAssessments`, `useAssessment`, `useCreateAssessment`, etc.
- Supports invitations, rater responses, and results aggregation

**Template Structure (JSONB):**
```typescript
{
  competencies: [{
    id: string,
    name: string,
    description?: string,
    questions: [{ id: string, text: string }]
  }],
  scaleMin: number,
  scaleMax: number,
  scaleLabels: string[],
  allowComments: boolean,
  requireComments: boolean,
  anonymizeResponses: boolean
}
```

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
- Agency portal (10 pages): Overview, Clients, Team, Templates, Assessments, Analytics, Billing, Branding, Governance, Settings
- Context switcher for Agency/Tenant views
- Mock authentication for development
- Design system matching prototype
- React Query hooks for data fetching (tenants, programs, goals, coaching, assessments, templates)
- Dashboard page connected to real API data
- Header with user menu and logout
- Database seeded with test data
- Programs list and detail pages
- Goals list, detail, and create modal
- Program enrollment with role selection (Facilitator, Mentor, Learner)
- Mentor-Learner relationship management
- Add Participant modal (new user or existing member)
- Coaching API routes (relationships, sessions, prep, notes, action items, stats)
- Coaching dashboard page (stats, sessions list, relationships tabs)
- Session detail page (prep, notes, action items, participants)
- New Session modal, Add Note modal, Add Action Item modal
- Agency template API routes (CRUD, duplicate, stats)
- Agency assessments page connected to real API
- Template builder UI (competencies, questions, scale settings)
- Create template modal
- Template editor with toast notifications, keyboard shortcuts (Ctrl+S), unsaved changes protection

### In Progress
- Tenant assessment UI pages

### Not Yet Implemented
- Program creation wizard UI
- Session prep form (edit mode)
- Coaching relationship management UI
- Assessment response collection UI (public rater form)
- Results visualization charts
- Goal suggestion generation from assessments
- Real Firebase integration
- Notifications

### Test Accounts (after running `pnpm --filter @tr/db db:seed`)
- `admin@acme.com` - Agency Owner + Tenant Admin
- `john.doe@acme.com` - Tenant User
- `jane.smith@acme.com` - Tenant User
- `coach@acme.com` - Tenant Admin (facilitator)

## Code Style Guidelines

1. **TypeScript**: Strict mode, explicit types for function parameters
2. **Components**: Functional components with hooks
3. **Naming**: PascalCase for components, camelCase for functions/variables
4. **Imports**: Absolute imports using `@/` alias
5. **State**: Zustand for global state, React Query for server state
6. **API calls**: Use the API client from `@/lib/api.ts`
7. **Hooks**: Use hooks from `@/hooks/api/` for data fetching (usePrograms, useGoals, useTenants, useCoachingSessions, useActionItems, useTemplates, useAssessments, etc.)

## Reference Documents

- **Roadmap**: `ROADMAP.md` (development status & task tracking)
- **Requirements**: `ANALYSIS_NOTES.md` (full spec & development phases)
- **PRD**: `overview.txt` (detailed product requirements)
- **Prototype**: `Corporate Transformation OS/src/` (Vite + React app)
- **Design reference**: Run the prototype with `cd "Corporate Transformation OS" && npm run dev`

## Common Tasks

### Adding a new page
1. Create page at `packages/web/src/app/(dashboard)/[route]/page.tsx`
2. Use `"use client"` if needed
3. Follow the layout pattern: `max-w-[1400px] mx-auto p-8`
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
