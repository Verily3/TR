# Transformation OS

A multi-tenant B2B SaaS platform for corporate transformation and executive leadership development.

## Overview

Transformation OS (Results Tracking System) is a comprehensive platform combining:
- Learning Management System (LMS)
- Executive scorecard management
- Goals & KPI tracking
- 1:1 coaching systems
- 180/360 assessments with automation
- Performance management (individual → team → organization)
- Community features (announcements, feed)
- Member management
- White-label branding per client

## Architecture

### Multi-Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    AGENCY ACCOUNT                        │
│  (Parent account - runs the system)                      │
│                                                          │
│  • Client subaccount management                          │
│  • Global templates (programs, resources, emails)        │
│  • Assessment frameworks                                 │
│  • Cross-account analytics                               │
│  • Governance & compliance                               │
│  • Billing & plans                                       │
└─────────────────────────────────────────────────────────┘
            │
            │ Creates & manages
            ▼
┌─────────────────────────────────────────────────────────┐
│               CLIENT SUBACCOUNTS (Tenants)              │
│  (Where programs run)                                    │
│                                                          │
│  • Own branding (logo, colors)                           │
│  • Own programs & participants                           │
│  • Own assessments & goals                               │
│  • Own coaching sessions                                 │
│  • Own member management                                 │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui components |
| **State** | Zustand (client), React Query (server) |
| **Backend** | Hono.js (Node.js) |
| **Database** | PostgreSQL with Drizzle ORM |
| **Auth** | Firebase Auth (mock mode for development) |

## Project Structure

```
TR/
├── packages/
│   ├── api/          # Hono API server (port 3001)
│   ├── db/           # Drizzle ORM schemas and migrations
│   └── web/          # Next.js frontend (port 5173)
├── apps/             # Future apps (mobile, etc.)
├── turbo.json        # Turborepo config
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp packages/api/.env.example packages/api/.env
cp packages/web/.env.example packages/web/.env

# Update .env files with your database credentials
```

### Database Setup

```bash
# Generate migrations
pnpm --filter @tr/db db:generate

# Run migrations
pnpm --filter @tr/db db:migrate

# Seed the database
pnpm --filter @tr/db db:seed
```

### Development

```bash
# Run all packages in development mode
pnpm dev
```

This starts:
- **API**: http://localhost:3001
- **Web**: http://localhost:5173

### Mock Authentication

For local development without Firebase credentials, the app uses mock authentication:

- Email: `admin@example.com` (or any email)
- Password: `password` (or any password)

Mock tokens are formatted as `mock-token::uid::email` and validated by the API in development mode.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm --filter @tr/api dev` | Run API only |
| `pnpm --filter @tr/web dev` | Run Web only |
| `pnpm --filter @tr/db db:studio` | Open Drizzle Studio |

## Current Status

### Completed
- [x] Monorepo setup with Turborepo
- [x] Database schema with Drizzle ORM
- [x] API server with Hono
- [x] Web app with Next.js 14
- [x] Mock authentication system
- [x] Context switcher (Agency/Tenant views)
- [x] Agency portal pages (10 pages)
  - Overview dashboard
  - Clients management
  - Team management
  - Templates (programs, emails, resources)
  - Assessments frameworks
  - Analytics
  - Billing
  - Branding
  - Governance
  - Settings
- [x] Design system matching prototype

### In Progress
- [ ] Tenant-side pages (dashboard, programs, goals, coaching)
- [ ] API routes for data operations
- [ ] Real data integration

### Planned
- [ ] Firebase authentication integration
- [ ] Program management & LMS
- [ ] 180/360 assessment system
- [ ] Coaching session management
- [ ] Goal tracking
- [ ] Notifications system
- [ ] Mobile responsiveness

## Design System

The UI follows the prototype design language:
- **Primary color**: `#1F2937` (dark charcoal)
- **Accent color**: `#E53E3E` (red) - used for active states, icons, CTAs
- **Cards**: Rounded corners (`rounded-xl`), hover states with accent border
- **Typography**: Clean, executive-style with proper hierarchy

## Documentation

- [ANALYSIS_NOTES.md](./Corporate%20Transformation%20OS/ANALYSIS_NOTES.md) - Full requirements specification
- [CLAUDE.md](./CLAUDE.md) - AI assistant context and guidelines

## License

Private - All rights reserved.
