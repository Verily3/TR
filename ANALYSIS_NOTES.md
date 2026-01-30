# Corporate Transformation OS - Analysis Notes

**Date:** January 20, 2026
**Last Updated:** January 20, 2026
**Analyst:** Claude (Opus 4.5)
**Project Path:** `C:\Users\Admin\Documents\Projects\TR\Corporate Transformation OS`

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Platform Architecture](#platform-architecture)
3. [Account Structure & Roles](#account-structure--roles)
4. [Technology Stack](#technology-stack)
5. [Cost Estimates](#cost-estimates)
6. [Project Structure](#project-structure)
7. [Navigation Architecture](#navigation-architecture)
8. [Core Modules](#core-modules)
9. [Assessments System](#assessments-system)
10. [Program Administration](#program-administration)
11. [Agency Account Features](#agency-account-features)
12. [Billing & Monetization](#billing--monetization)
13. [Security & Compliance](#security--compliance)
14. [Integrations](#integrations)
15. [Notifications System](#notifications-system)
16. [Mobile Experience](#mobile-experience)
17. [Content & Learning Features](#content--learning-features)
18. [Search & Discovery](#search--discovery)
19. [Collaboration Features](#collaboration-features)
20. [Localization & Internationalization](#localization--internationalization)
21. [Accessibility](#accessibility)
22. [AI Features](#ai-features)
23. [Help & Support](#help--support)
24. [Branding & Customization](#branding--customization)
25. [Reporting Requirements](#reporting-requirements)
26. [Design Patterns & Conventions](#design-patterns--conventions)
27. [Spec vs Implementation Comparison](#spec-vs-implementation-comparison)
28. [Gaps & Concerns](#gaps--concerns)
29. [Areas Not Yet Analyzed](#areas-not-yet-analyzed)
30. [Recommendations](#recommendations)

---

## Project Overview

The **Results Tracking System** (Corporate Transformation OS) is a **multi-tenant B2B SaaS platform** designed for corporate transformation and executive leadership development.

### Purpose
A comprehensive platform combining:
- Learning Management System (LMS)
- Executive scorecard management
- Goals & KPI tracking
- 1:1 coaching systems
- 180/360 assessments with automation
- Performance management across individual → team → organization levels
- Community features (announcements, feed)
- Member management
- White-label branding per client

### Design Philosophy
- **"Executive-first" UX** - Premium, high-whitespace aesthetic
- **Finance dashboard feel** - Not a fitness/wellness app aesthetic
- **One-click clarity** - Each action is obvious and singular
- **Progressive disclosure** - Show what matters now, hide the rest

### Transformation Flow
```
Clarity → Commitment → Execution → Measurement → Coaching → Results
```

### Strategic Cascade
```
Scorecard (Strategic)
    ↓
Annual Planning (Yearly pillars)
    ↓
Quarterly Planning (90-day sprints)
    ↓
Goals (Specific metrics)
    ↓
Programs (Skill development)
    ↓
Coaching (Execution support)
```

---

## Platform Architecture

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
│               CLIENT SUBACCOUNTS                         │
│  (Where programs run)                                    │
│                                                          │
│  • Own branding (logo, colors)                           │
│  • Own programs & participants                           │
│  • Own assessments & goals                               │
│  • Own coaching sessions                                 │
│  • Own member management                                 │
└─────────────────────────────────────────────────────────┘
```

### Core Concept

> **Subaccounts run programs. The agency account runs the system.**
>
> The agency account owns: creation, governance, reusable assets, analytics, and support.

---

## Account Structure & Roles

### Two-Tier Role System

#### 1. Account-Level Roles (Subaccount)

| Role | Description |
|------|-------------|
| **Account Admin** | Full access to subaccount settings, members, programs |
| **Account User** | Standard access within the subaccount |

#### 2. Program-Level Roles (Contextual)

A person's role can change depending on which program they're in:

| Role | Description |
|------|-------------|
| **Facilitator** | Runs/delivers the program |
| **Mentor** | Participant's boss/manager |
| **Participant** | Learner in the program |

**Important:** Menu options and available actions change based on the user's program role.

#### 3. Agency-Level Roles

| Role | Description |
|------|-------------|
| **Agency Owner** | Full platform control |
| **Agency Admin** | Administrative access across subaccounts |
| **Agency Support/Implementer** | Support and setup access |
| **Agency Read-only/Analyst** | View-only access for reporting |

---

## Technology Stack

### Infrastructure Decisions (Confirmed)

| Component | Decision | Status |
|-----------|----------|--------|
| **Database** | PostgreSQL | ✅ Confirmed |
| **Cloud Provider** | Google Cloud Platform (GCP) | ✅ Confirmed |
| **Email** | Twilio SendGrid | ✅ Confirmed |
| **SMS** | Twilio Messaging | ✅ Confirmed |
| **2FA** | Twilio Verify | ✅ Confirmed |

### Recommended Development Stack

#### Frontend
| Category | Technology | Notes |
|----------|------------|-------|
| **Framework** | Next.js 14 (App Router) | SSR, API routes, middleware |
| **Language** | TypeScript | Shared with backend |
| **Styling** | Tailwind CSS v4 | Already in use |
| **UI Components** | Radix UI + shadcn/ui | Already in use |
| **Icons** | Lucide React | Already in use |
| **Charts** | Recharts | Already in use |
| **State** | React Context + React Query | Server state management |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Animations** | Motion | Already in use |

#### Backend API
| Category | Technology | Notes |
|----------|------------|-------|
| **Runtime** | Node.js | Same language as frontend |
| **Framework** | Hono | Lightweight, fast, Cloud Run optimized |
| **Language** | TypeScript | Shared types with frontend |
| **ORM** | Drizzle | PostgreSQL-native, type-safe, performant |
| **Validation** | Zod | Shared schemas with frontend |

#### Authentication
| Category | Technology | Notes |
|----------|------------|-------|
| **Provider** | Firebase Auth + Auth.js | Native GCP integration |
| **SSO/SAML** | Firebase Identity Platform | Enterprise requirement |
| **2FA** | Twilio Verify | SMS/email codes |

#### Infrastructure
| Category | Technology | Notes |
|----------|------------|-------|
| **Monorepo** | Turborepo | Shared packages, fast builds |
| **Package Manager** | pnpm | Fast, efficient |
| **API Hosting** | Cloud Run | Auto-scaling containers |
| **Frontend Hosting** | Firebase Hosting | CDN, SSL included |
| **Database** | Cloud SQL (PostgreSQL) | Managed, HA available |
| **Cache** | Memorystore (Redis) | Sessions, performance |
| **File Storage** | Cloud Storage | Resources, videos, uploads |
| **CDN** | Cloud CDN | Static assets, video delivery |

### GCP Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloud CDN                               │
│              (static assets, video delivery)                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Firebase      │    │ Cloud Run     │    │ Cloud Storage │
│ Hosting       │    │ (Hono API)    │    │ (Files)       │
│ (Next.js)     │    │               │    │               │
└───────────────┘    └───────┬───────┘    └───────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Cloud SQL│   │Memorystore│  │ Firebase │
       │ Postgres │   │ (Redis)   │  │ Auth     │
       └──────────┘   └──────────┘   └──────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Twilio   │   │ Twilio   │   │ Twilio   │
       │ SendGrid │   │ SMS      │   │ Verify   │
       └──────────┘   └──────────┘   └──────────┘
```

### Recommended Project Structure

```
/
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, signup pages
│   │   │   ├── (dashboard)/     # Protected app routes
│   │   │   └── api/             # API routes (optional)
│   │   ├── components/
│   │   └── lib/
│   │
│   └── api/                     # Hono API (Cloud Run)
│       ├── src/
│       │   ├── routes/          # API endpoints
│       │   ├── services/        # Business logic
│       │   ├── middleware/      # Auth, tenant, logging
│       │   └── db/              # Drizzle queries
│       └── Dockerfile
│
├── packages/
│   ├── db/                      # Shared Drizzle schema
│   ├── types/                   # Shared TypeScript types
│   └── validators/              # Shared Zod schemas
│
├── turbo.json                   # Monorepo config
└── pnpm-workspace.yaml
```

### Why This Stack

**Drizzle over Prisma:**
- Better PostgreSQL feature support (RLS, JSON, arrays)
- Faster queries, smaller bundle size
- Closer to raw SQL, more control
- No Prisma Client bloat

**Hono over Express/Fastify:**
- Modern, built for TypeScript
- Works on Cloud Run, edge, and Node
- Tiny bundle size (~14KB)
- Excellent performance

**Next.js benefits:**
- Server Components for faster page loads
- Built-in API routes option
- Middleware for auth/tenant checks
- Image optimization for thumbnails
- Great developer experience

**TypeScript everywhere:**
- One language across entire stack
- Share types between frontend and backend
- Catch errors at compile time
- Better IDE support and refactoring

### Current Prototype Stack (For Reference)

The existing UI prototype uses:

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 18.3.1 |
| Build Tool | Vite | 6.3.5 |
| Styling | Tailwind CSS | v4 |
| UI Components | Radix UI + shadcn/ui | Multiple |
| Icons | Lucide React | 0.487.0 |
| Charts | Recharts | 2.15.2 |
| Forms | React Hook Form | 7.55.0 |
| Animations | Motion | 12.23.24 |
| Notifications | Sonner | 2.0.3 |

*Note: The prototype will be migrated to Next.js and connected to the real backend.*

---

## Cost Estimates

### Free Services (Open Source)

| Service | Type | Cost |
|---------|------|------|
| Turborepo | Monorepo tool | Free |
| Next.js | Frontend framework | Free |
| Hono | API framework | Free |
| Drizzle | ORM | Free |
| Zod | Validation | Free |
| React | UI library | Free |
| TypeScript | Language | Free |
| Tailwind CSS | Styling | Free |

### Google Cloud Services

| Service | Free Tier | Paid Pricing |
|---------|-----------|--------------|
| **Cloud SQL (PostgreSQL)** | None | $9/mo (micro) → $300+/mo (HA) |
| **Cloud Run** | 2M requests/mo | ~$50-200/mo at scale |
| **Firebase Hosting** | 10GB, 360MB/day | Per GB after |
| **Firebase Auth** | 50K MAU | $0.0055/MAU after |
| **Cloud Storage** | 5GB | $0.020/GB/month |
| **Memorystore (Redis)** | None | ~$30-50/mo minimum |
| **Cloud CDN** | None | ~$0.08-0.12/GB |

### Twilio Services

| Service | Free Tier | Paid Pricing |
|---------|-----------|--------------|
| **SendGrid (Email)** | 100/day | $20/mo (50K) → $90/mo (100K) |
| **SMS** | None | $0.0079/SMS (US) |
| **Verify (2FA)** | None | $0.05/verification |

### Monthly Cost by Stage

| Stage | Users | Estimated Monthly Cost |
|-------|-------|------------------------|
| **MVP / Development** | Dev only | ~$10-15 |
| **Early Production** | ~100 | ~$65-100 |
| **Growth** | ~1,000 | ~$350-500 |
| **Scale** | ~10,000+ | ~$1,200-2,000+ |

### Detailed Cost Breakdown

#### MVP / Development (~$10-15/month)
- Cloud SQL (micro): $9
- Cloud Run: Free tier
- Firebase Auth: Free tier
- Firebase Hosting: Free tier
- Cloud Storage: Free tier
- SendGrid: Free tier

#### Early Production (~$65-100/month)
- Cloud SQL (small): $25-50
- Cloud Run: ~$10-20
- Firebase Auth: Free
- Cloud Storage: ~$5
- SendGrid (Essentials): $20
- Twilio SMS (500 msgs): ~$5

#### Growth (~$350-500/month)
- Cloud SQL (custom): $75-150
- Cloud Run: ~$50-100
- Memorystore (Redis): $30-50
- Cloud Storage: ~$20
- Cloud CDN: ~$20
- SendGrid (Pro): $90
- Twilio SMS (5K msgs): ~$40

#### Scale (~$1,200-2,000+/month)
- Cloud SQL (HA): $300-500+
- Cloud Run: $200-400
- Firebase Auth: ~$50
- Memorystore: $100+
- Cloud Storage: $50-100
- Cloud CDN: $50-100
- SendGrid: $200+
- Twilio SMS: $200+

### Cost Optimization Tips

1. Use Cloud SQL **db-f1-micro** for dev/staging (save ~$50/mo)
2. **Committed use discounts** (1-3 year) save 20-50% on Cloud SQL
3. Set Cloud Run **min instances to 0** for dev environments
4. Use **Cloud Storage Coldline** for archived files (80% cheaper)
5. **Batch SMS notifications** into digests to reduce volume
6. **Prefer email over SMS** when possible (much cheaper)
7. **Cache aggressively** with Redis to reduce database load
8. Use **connection pooling** to reduce Cloud SQL connections

### One-Time Costs

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year (if iOS app) |
| Google Play Developer | $25 one-time (if Android app) |
| Domain name | $12-50/year |

---

## Project Structure

```
Corporate Transformation OS/
├── src/
│   ├── main.tsx                      # React entry point
│   ├── app/
│   │   ├── App.tsx                   # Root component with routing
│   │   └── components/
│   │       ├── Sidebar.tsx           # Main navigation
│   │       ├── JourneyHub.tsx        # Dashboard action blocks
│   │       ├── Scoreboard.tsx        # KPI metrics
│   │       ├── MySchedule.tsx        # Calendar/commitments
│   │       ├── LearningQueue.tsx     # Learning items
│   │       ├── OnboardingTracker.tsx # Onboarding flow
│   │       ├── TransformationTracker.tsx  # 6-stage progress
│   │       ├── Leaderboard.tsx       # Gamification
│   │       │
│   │       ├── programs/             # LMS Module
│   │       │   ├── ProgramsPage.tsx
│   │       │   ├── ProgramDetailPage.tsx
│   │       │   ├── ModuleViewLMS.tsx
│   │       │   └── ...
│   │       │
│   │       ├── goals/                # Goals Module
│   │       │   ├── GoalsPage.tsx
│   │       │   ├── GoalCard.tsx
│   │       │   └── NeedsAttention.tsx
│   │       │
│   │       ├── coaching/             # Coaching Module
│   │       │   ├── CoachingPage.tsx
│   │       │   ├── SessionCard.tsx
│   │       │   └── ...
│   │       │
│   │       ├── scorecard/            # Scorecard Module
│   │       │   └── ScorecardPage.tsx
│   │       │
│   │       ├── planning/             # Planning Module
│   │       │   ├── PlanningGoalsPage.tsx
│   │       │   └── NewGoalModal.tsx
│   │       │
│   │       └── ui/                   # 60+ Radix UI components
│   │
│   ├── styles/
│   │   ├── theme.css                 # Design tokens & colors
│   │   ├── tailwind.css
│   │   └── fonts.css
│   │
│   └── assets/
│
├── guidelines/                       # Design guidelines
├── package.json                      # Dependencies
├── vite.config.ts                    # Build configuration
├── overview.txt                      # Detailed PRD
└── ANALYSIS_NOTES.md                 # This file
```

---

## Navigation Architecture

### Subaccount Main Menu (Full Spec)

The complete navigation has **11 items** (only 6 currently implemented):

| # | Menu Item | Status | Description |
|---|-----------|--------|-------------|
| 1 | **Dashboard** | ✅ Built | Executive hub with dynamic blocks |
| 2 | **Programs** | ✅ Built | Learning & leadership development catalog |
| 3 | **Scorecard** | ✅ Built | Executive performance dashboard |
| 4 | **Goals** | ✅ Built | Planning & goal tracking system |
| 5 | **Coaching** | ✅ Built | 1:1 coaching and team development |
| 6 | **Assessments** | ⚠️ Placeholder | 180/360 assessments |
| 7 | **Announcements** | ❌ Not built | Communications to members |
| 8 | **Feed** | ❌ Not built | Activity/community feed |
| 9 | **Members** | ❌ Not built | Member management |
| 10 | **Resources** | ❌ Not built | Resource library |
| 11 | **Settings** | ❌ Not built | Account configuration |

### 3-Level LMS Hierarchy

```
Level 1: Programs Catalog (browse all programs)
    ↓
Level 2: Program Detail (overview, modules, progress)
    ↓
Level 3: Module View (lesson content, video, exercises)
```

Example: `Programs → LeaderShift → Module 3: Self-Leadership`

---

## Core Modules

### 1. Dashboard (Executive Hub)
**Purpose:** Central command center for executives

**Components:**
- Onboarding Tracker (6-step checklist, conditional)
- Journey Hub (dynamic context-aware blocks)
- LeaderShift Program Tracker (current module progress)
- Leaderboard (gamification with engagement scores)
- My Schedule (upcoming commitments)
- Learning Queue (curated learning items)

### 2. Programs (LMS)
**Purpose:** Learning & leadership development

**Content Types:**
- Reading materials (20-25 min)
- Videos (25-30 min)
- Mentor sessions (60 min)
- Reflections & submissions (15 min)
- Assignments & assessments
- Goal-setting exercises

**Points System:** 500-1500 pts per lesson

### 3. Scorecard (Executive Dashboard)
**Purpose:** Strategic anchor - defines what "winning" looks like

**8 Key Accountabilities:**
1. Strategic Direction & Vision
2. Revenue & Profit Growth
3. Operational Excellence
4. Brand Expansion
5. Talent & Culture
6. Board & Investor Relations
7. M&A/Strategic Partnerships
8. Compliance & Risk Oversight

**22 KPIs across 6 categories:**
- Financial (EBITDA, Net Margin, Revenue Growth, ROIC)
- Operational (Plant OEE, Yield %, Downtime, Throughput)
- Market Growth (Market Share, Distribution Points, Customer Retention)
- People & Culture (% A-Players, Engagement Score, Leadership Retention)
- Compliance & Safety (Audit Score, Critical Violations, TRIR)
- Brand Strength (Distribution Points, Brand Recall, NPS)

**Additional Components:**
- A-Player Competencies (9 CEO competencies, dual ratings)
- Direct Reports Performance Table
- Organizational Health Score (5 dimensions)

### 4. Goals & Planning
**Purpose:** Tactical execution layer cascading from Scorecard

**4-Tab Structure:**
1. Annual Planning (pillars, objectives)
2. Quarterly Planning (90-day sprints, priorities)
3. Goals (personal, team, company goals)
4. Metrics & KPIs (focused number view)

**New Goal Modal (3-step wizard):**
1. Define Goal (AI suggestions, statement, type, category)
2. Set Targets (baseline, goal, milestones)
3. Link & Finalize (Scorecard, Annual Plan, Program connections)

### 5. Coaching
**Purpose:** 1:1 coaching and team development

**Components:**
- Upcoming Sessions (calendar view with prep status)
- Session Prep View (reflection questions, topics, action items)
- Action Items Dashboard (status tracking)
- Direct Reports (for managers)
- Coaching History

### 6. Announcements (Not Built)
**Purpose:** Communications to program/account members

### 7. Feed (Not Built)
**Purpose:** Activity and community feed

### 8. Members (Not Built)
**Purpose:** Member management within subaccount

### 9. Resources (Not Built)
**Purpose:** Resource library (global or account-specific)

### 10. Settings (Not Built)
**Purpose:** Account configuration, branding, email templates

---

## Assessments System

### Assessment Types

| Type | Raters | Description |
|------|--------|-------------|
| **360 Peer Assessment** | Boss, Peer, Self, Direct Reports | Full multi-rater feedback |
| **180 Assessment** | Boss, Self | Manager + self evaluation only |

### Key Behavior: Assessment-Driven Goal Creation

Assessments aren't just reports—they drive next-step actions:

```
Assessment Results
    ↓
Low score detected (e.g., Collaboration < threshold)
    ↓
System prompts: "Would you like to add Collaboration as a goal?"
    ↓
User accepts → Goal created automatically
    ↓
Goal linked to relevant program/coaching
```

**Example Automation:**
- If someone scores low on Collaboration:
  - System shows prompt: "Would you like to add Collaboration as a goal?"
  - "What other goals would you like to add?"
- Results inform goal suggestions + guidance

### Assessment Framework (Agency-Level)

The agency account manages assessment blueprints:
- Competencies + scoring scales
- Question banks
- 180 vs 360 configurations
- Rules connecting results → recommendations
- Ability to publish frameworks to selected subaccounts

---

## Program Administration

### Program Creation Settings

When creating a program, administrators configure:

#### Basic Details
| Field | Example |
|-------|---------|
| Program name | LeaderShift: Leading through Change |
| Program internal name | leadershift-2026-q1 |
| Program category | Live |
| Program timezone | UTC-05:00 America/New_York |
| Program language | English |

#### Support + Ownership
| Field | Example |
|-------|---------|
| Support email | support@company.com |
| Support telephone | +1-555-0123 |
| Program creator | Andrew Oxley |

#### Branding
- Program image upload (square 200x200 recommended)

#### Program Type (Community Visibility)

| Type | Description |
|------|-------------|
| **Cohort program** | Interaction + communication with other learners enabled |
| **Individual program** | Interaction disabled; other learners/content not visible |

#### Schedule Type

| Type | Description |
|------|-------------|
| **Fixed dates** | Same start/end for all members (e.g., 10/26/2025 - 03/02/2026) |
| **Individual dates** | Members can have different timelines |
| **Default access period** | E.g., 12 months |

#### Reminders
- Auto reminder day before tasks due
- Auto reminder day after tasks overdue

#### Other Settings
- Enable logotype in emails
- Allow members to access program without invitation
- Allow learners to invite their coach

#### Completion + Diploma
- Completion criteria (managed)
- Program diploma (managed)

#### Program Administrators
- Program-specific admins with full permission within the program

### Program Operations

#### Adding Participants
- Add manually
- Import CSV
- "No members" state when empty

#### Invitations
- Schedule invitations
- Invite now
- Manage templates
- "No invitations" state when empty

#### Program Content Actions
- Add Program Goals
- Add Resources (from global library OR upload to specific account)
- Create Groups

---

## Agency Account Features

The agency (parent) account provides system-wide administration:

### 1. Client Subaccount Management
- Create / edit / deactivate client subaccounts
- Subaccount directory (search, filters, status)
- "Enter" a subaccount as admin (impersonate/view-as for support)
- Subaccount health snapshot:
  - Active users
  - Active programs
  - Invitations pending
  - Engagement level

### 2. Global User + Role Controls
- Manage agency team members
- Agency-level permissions:
  - Agency Owner
  - Agency Admin
  - Agency Support / Implementer
  - Agency Read-only / Analyst
- Set/enforce rules for subaccount roles

### 3. Templates and Global Libraries

#### Global Program Templates
- Reusable program templates with:
  - Program structure (cohort/individual)
  - Default schedules
  - Default reminders
  - Default completion criteria + diplomas
  - Recommended resources
  - Suggested goals

#### Global Resource Library
- Central library of resources
- Can be assigned into any subaccount/program
- Private to agency or shared selectively

#### Email Template Library
Master templates for:
- Invitations
- Reminders (due tomorrow / overdue)
- Program announcements
- Coach/mentor invites
- Diplomas/completion

Features:
- Variables + placeholders (first name, program name, start date, etc.)
- Lock parts of templates (compliance/legal)
- Let subaccounts customize allowed sections

### 4. Branding System (Multi-Tenant White Label)
- Default agency theme (fallback)
- Per-subaccount branding:
  - Logo
  - Brand colors
  - Email logotype setting
- Optional: subdomain / custom domain mapping

### 5. Cross-Account Reporting + Analytics

#### Portfolio-Level Dashboards
- Programs running across clients
- Enrollments, invitation acceptance rates
- Completion rates
- Engagement metrics (logins, content consumption, goal updates)

#### Assessment Insights Across Clients
- Average 180/360 scores by competency
- Improvement deltas (baseline vs follow-up)

#### Exporting
- CSV/PDF exports
- Scheduled reports to email (optional)

### 6. Assessment Framework Management
- Create/maintain assessment blueprints
- Competencies + scoring scales
- Question banks
- 180 vs 360 configurations
- Rules: result → recommendation mapping
- Publish frameworks to selected subaccounts

### 7. Governance and Compliance Controls
- Invitation requirements vs open access
- Privacy + data retention settings
- Required email footers/disclaimers
- Audit logs (who changed what, where, when)

### 8. Support + Implementation Tools
- "View as" / impersonation for troubleshooting
- Activity log per subaccount
- Basic ticket/notes system (optional)
- Bulk actions:
  - Bulk upload resources to multiple accounts
  - Bulk update email templates
  - Bulk publish program template updates

### 9. Billing / Plans (SaaS Model)
- Plan assignment per subaccount
- Limits: seats, programs, assessments
- Usage tracking (users, invites, storage)
- Invoices / payment status

---

## Billing & Monetization

### Payment Gateway Integration
- Integration with payment processor (Stripe recommended)
- Secure payment handling
- Subscription management
- Payment method storage (cards, ACH, etc.)
- Failed payment handling & retry logic

### Pricing Models

| Model | Description |
|-------|-------------|
| **Per-seat** | Charge based on number of active users/participants |
| **Per-program** | Charge based on number of active programs |
| **Tiered** | Feature tiers (Basic, Pro, Enterprise) with different capabilities |
| **Hybrid** | Combination of above (e.g., base tier + per-seat overage) |

### Trial & Freemium Options
- **Free trial period** - Time-limited full access (e.g., 14 or 30 days)
- **Freemium tier** - Limited free access with paid upgrade path
- Trial-to-paid conversion tracking
- Trial expiration notifications

### Invoice Customization
- Custom invoice branding (logo, colors)
- Configurable invoice fields
- Tax handling (VAT, sales tax)
- Multiple currency support
- Invoice delivery (email, download)
- Payment terms customization

### Billing Administration (Agency Level)
- View/manage all subaccount subscriptions
- Override pricing for specific clients
- Apply discounts or credits
- Revenue reporting and analytics
- Subscription lifecycle management (upgrade, downgrade, cancel)

---

## Security & Compliance

### Authentication & Access
| Feature | Description |
|---------|-------------|
| **SSO/SAML** | Okta, Azure AD, Google Workspace, OneLogin |
| **2FA/MFA** | Authenticator apps, SMS, email |
| **Password policies** | Complexity, expiration, history |
| **Session management** | Timeout, concurrent session limits |
| **IP whitelisting** | Optional for high-security clients |
| **Magic link** | Passwordless login option |

### Data Protection & Privacy
- **GDPR compliance tools:**
  - Data export (user can download their data)
  - Right to deletion (right to be forgotten)
  - Consent management
  - Data processing agreements
- Data encryption (at rest and in transit)
- PII handling and masking
- Data retention policies (configurable per subaccount)

### Audit & Compliance
- Comprehensive audit logs (who, what, when, where)
- Admin action logging
- Login/logout tracking
- Data access logging
- Exportable audit reports
- SOC 2 Type II compliance considerations

---

## Integrations

### Calendar Integrations
- Google Calendar sync
- Microsoft Outlook / Office 365 sync
- Apple Calendar (iCal) support
- Two-way sync for coaching sessions, events, deadlines
- Calendar invites with video conferencing links

### Video Conferencing
- Zoom integration (create/join meetings)
- Microsoft Teams integration
- Google Meet integration
- Auto-generate meeting links for coaching sessions

### HRIS / HR Systems
- Workday, BambooHR, SAP SuccessFactors, ADP
- User provisioning and deprovisioning sync
- Org chart / reporting structure sync

### Communication Tools
- **Slack:** Notifications, slash commands, channel updates
- **Microsoft Teams:** Bot notifications, tab integration

### API & Developer Tools
- RESTful API for third-party integrations
- Webhook support (goal updated, assessment completed, etc.)
- API key management
- Rate limiting and usage tracking
- API documentation (OpenAPI/Swagger)

### No-Code Automation
- Zapier integration
- Make (Integromat) integration
- Pre-built templates for common workflows

---

## Notifications System

### In-App Notifications
- Notification center (bell icon with unread count)
- Real-time updates
- Mark as read / mark all as read
- Categories: Programs, Coaching, Goals, Assessments, System

### Push Notifications
- Web push notifications (browser)
- Mobile push notifications (iOS/Android)
- Rich notifications with actions

### Notification Preferences
- Per-user settings
- Channel preferences (in-app, email, push, SMS)
- Frequency settings (immediate, daily digest, weekly)
- Quiet hours / do not disturb

### Email Notifications
- Transactional emails (invites, password reset)
- Reminder emails (due dates, overdue items)
- Digest emails (daily/weekly summaries)
- Unsubscribe management

### SMS Notifications (Optional)
- Critical alerts via SMS
- Session reminders
- 2FA codes

---

## Mobile Experience

### Mobile App (iOS & Android)
- Native mobile applications
- Core features: Dashboard, Programs, Goals, Coaching, Notifications
- Offline mode for downloaded content
- Touch ID / Face ID authentication

### Progressive Web App (PWA)
- Installable web app experience
- Works offline for key features
- Home screen shortcut
- Push notification support

### Mobile-Specific Features
- Responsive design for all screen sizes
- Touch-optimized interactions
- Mobile-friendly video player
- Quick actions (update goal, mark complete)

---

## Content & Learning Features

### Content Formats
- SCORM 1.2 and SCORM 2004 support
- xAPI (Tin Can) support
- Native video hosting with progress tracking
- PDF documents with tracking
- Interactive quizzes and assessments
- Embedded content (YouTube, Vimeo)
- Audio content / podcasts

### Video Features
- Native video player with:
  - Progress tracking
  - Playback speed control
  - Closed captions / subtitles
  - Quality selection
  - Resume from last position
- Video analytics (watch time, completion, drop-off points)

### Content Management
- Content versioning and history
- Draft / published states
- Scheduled publishing
- Content tagging and categorization

### Certificates & Credentials
- Customizable certificate templates
- Auto-generated on program completion
- Unique certificate IDs for verification
- LinkedIn sharing integration
- Certificate verification page (public URL)

---

## Search & Discovery

### Global Search
- Search across: Programs, Resources, Members, Goals, Announcements
- Real-time search suggestions
- Recent searches history

### Search Filters
- Filter by content type
- Filter by date range
- Filter by status
- Filter by category/tag
- Saved search queries

### Search Analytics
- Track what users search for
- Identify content gaps
- Popular search terms dashboard

---

## Collaboration Features

### Discussion Forums
- Program-level discussion boards
- Module-level discussions
- Threaded replies
- Rich text formatting
- File attachments
- Moderation tools (pin, lock, delete)

### Direct Messaging
- One-on-one messaging between users
- Participant ↔ Mentor messaging
- Message history
- File sharing in messages
- Read receipts (optional)

### Comments & Annotations
- Comments on goals
- Comments on assessment results
- Comments on learning content
- @mentions to notify users
- Comment threading

### File Sharing
- Upload files to programs/resources
- Share files in messages
- File type restrictions (configurable)
- Storage limits per subaccount

---

## Localization & Internationalization

### Multi-Language Support
- Platform UI in multiple languages
- Language selector in user settings
- Default language per subaccount
- Content translation management
- Initial languages: English, Spanish, French, German, Portuguese

### Regional Formatting
- Date formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
- Time formats (12-hour, 24-hour)
- Number formats (decimal separators)
- Currency formatting
- Timezone handling (per user, per program)

### RTL Support
- Right-to-left language support (Arabic, Hebrew)
- Mirrored UI layouts
- RTL-compatible components

---

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels and roles
- Color contrast ratios (4.5:1 minimum)
- Focus indicators
- Alt text for images

### Keyboard Navigation
- Full keyboard accessibility
- Logical tab order
- Skip navigation links
- Keyboard shortcuts for common actions

### Screen Reader Support
- Compatible with JAWS, NVDA, VoiceOver
- Descriptive labels and announcements
- Live region updates

### Visual Accommodations
- High contrast mode
- Resizable text (up to 200%)
- Reduced motion option
- Dyslexia-friendly font option (optional)

---

## AI Features

### AI Coaching Assistant
- On-demand chatbot for guidance between sessions
- Contextual suggestions based on goals and progress
- Answers questions about program content
- Escalation to human coach when needed

### Personalized Learning
- AI-recommended content based on:
  - Assessment results
  - Goal progress
  - Learning history
  - Role and competency gaps
- Adaptive learning paths
- Content difficulty adjustment

### Analytics & Predictions
- At-risk participant detection
- Predicted goal completion likelihood
- Engagement trend analysis
- Churn prediction for subscription management

### Content Intelligence
- Sentiment analysis on reflections and feedback
- Automatic content tagging
- Summary generation for long content
- Translation assistance

---

## Help & Support

### In-App Help
- Help center / knowledge base integration
- Contextual help tooltips
- Searchable FAQ
- Video tutorials library

### Onboarding & Guidance
- Interactive onboarding tours
- Feature walkthroughs for new features
- Checklist-based onboarding (Dashboard)
- Contextual tips based on user actions

### Support Channels
- In-app chat widget (Intercom, Zendesk)
- Support ticket submission
- Email support
- Phone support (enterprise plans)

### Admin Support Tools
- System status page
- Maintenance notifications
- Release notes / changelog
- Feature request submission

---

## Branding & Customization

### Subaccount Branding
Each subaccount admin can brand their site with:
- Client logo
- Brand colors

### Email Customization
Two types of emails to customize:
1. **System emails** - Platform-wide notifications
2. **Program emails** - Program-specific reminders, invites, etc.

Template system supports:
- Variables and placeholders
- Role-based messaging
- Locked vs. editable sections

---

## Reporting Requirements

### Report Scopes

| Report Type | Description |
|-------------|-------------|
| **Participant Progress** | Goals + assessment deltas per individual |
| **Program Completion** | Engagement and completion metrics |
| **Manager/Mentor View** | Direct reports overview |
| **Org/Team Rollups** | Aggregated scorecards/KPIs |
| **Portfolio Dashboards** | Cross-client analytics (agency level) |

---

## Design Patterns & Conventions

### Architecture Patterns
- Component-driven UI (73 TSX files)
- Page-based routing via single App.tsx
- Mock data approach (no API calls currently)
- Figma-originated design with asset references
- Wrapped Radix UI components for consistency

### Layout Patterns
- Two-column layouts (Schedule + Learning queue)
- Card-based components throughout
- Tab-based navigation for filtering
- Breadcrumb trails in detail views

### Status Indicators
- **Colors:** Green (on-track), Yellow (at-risk), Red (behind/overdue)
- **Trend indicators:** ↑ (up), ↓ (down), → (flat)

### Data Structures
```typescript
// Status enums
type Status = "pending" | "in-progress" | "completed" | "locked"
type Trend = "up" | "down" | "flat"
type GoalState = "on-track" | "at-risk" | "behind"
type LessonType = "reading" | "video" | "meeting" | "submission" | "assignment" | "goal"

// Role enums
type AccountRole = "account-admin" | "account-user"
type ProgramRole = "facilitator" | "mentor" | "participant"
type AgencyRole = "owner" | "admin" | "support" | "analyst"
```

### Naming Conventions
- PascalCase for components
- Descriptive names (e.g., `ProgramDetailPage`, `SessionCard`)
- Page components suffixed with "Page"
- Utility hooks prefixed with "use-"

### Styling
- CSS custom properties for design tokens
- Tailwind utility classes
- Navy/charcoal (#1F2937) primary
- Red (#E53E3E) accent
- High whitespace, premium aesthetic
- Dark mode support via OKLch color space

---

## Spec vs Implementation Comparison

### Navigation Items

| Specified | Implemented | Status |
|-----------|-------------|--------|
| Dashboard | Yes | ✅ Complete |
| Programs | Yes | ✅ Complete |
| Scorecard | Yes | ✅ Complete |
| Goals | Yes | ✅ Complete |
| Coaching | Yes | ✅ Complete |
| Assessments | Placeholder only | ⚠️ Partial |
| Announcements | No | ❌ Not built |
| Feed | No | ❌ Not built |
| Members | No | ❌ Not built |
| Resources | No | ❌ Not built |
| Settings | No | ❌ Not built |

### Features

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| Dashboard with Journey Hub | Yes | ✅ Complete |
| Onboarding Tracker | Yes | ✅ Complete |
| 8 Scorecard Accountabilities | Yes | ✅ Complete |
| 22 KPIs in 6 categories | Yes | ✅ Complete |
| 3-step New Goal Modal | Yes | ✅ Complete |
| AI Goal Suggestions | UI exists | ⚠️ Mock only |
| Programs Catalog | Yes | ✅ Complete |
| Program Detail Page | Yes | ✅ Complete |
| Module View (LMS) | Yes | ✅ Complete |
| Coaching Page | Yes | ✅ Complete |
| Session Prep View | Yes | ✅ Complete |
| 180/360 Assessments | No | ❌ Not built |
| Assessment → Goal automation | No | ❌ Not built |
| Program Creation Admin | No | ❌ Not built |
| Member Management | No | ❌ Not built |
| Invitations System | No | ❌ Not built |
| Resource Library | No | ❌ Not built |
| White-label Branding | No | ❌ Not built |
| Email Templates | No | ❌ Not built |
| Agency Account | No | ❌ Not built |
| Cross-account Analytics | No | ❌ Not built |
| Stripe/Payment Integration | No | ❌ Not built |
| Pricing Models (seat/program/tiered) | No | ❌ Not built |
| Trial/Freemium Support | No | ❌ Not built |
| Invoice Customization | No | ❌ Not built |
| Subscription Management | No | ❌ Not built |
| Backend/Database | No | ❌ All mock data |
| Real Authentication | No | ❌ Not implemented |

### Security & Compliance

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| SSO/SAML Integration | No | ❌ Not built |
| 2FA/MFA | No | ❌ Not built |
| Password Policies | No | ❌ Not built |
| Session Management | No | ❌ Not built |
| GDPR Compliance Tools | No | ❌ Not built |
| Audit Logs | No | ❌ Not built |
| Data Encryption | No | ❌ Not built |

### Integrations

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| Calendar Sync (Google/Outlook) | No | ❌ Not built |
| Video Conferencing (Zoom/Teams/Meet) | No | ❌ Not built |
| HRIS Integration (Workday/BambooHR) | No | ❌ Not built |
| Slack/Teams Integration | No | ❌ Not built |
| REST API | No | ❌ Not built |
| Webhooks | No | ❌ Not built |
| Zapier/Make Integration | No | ❌ Not built |

### Notifications & Mobile

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| In-App Notification Center | No | ❌ Not built |
| Push Notifications (Web/Mobile) | No | ❌ Not built |
| Notification Preferences | No | ❌ Not built |
| Email Digest System | No | ❌ Not built |
| Native Mobile Apps (iOS/Android) | No | ❌ Not built |
| PWA Support | No | ❌ Not built |
| Offline Mode | No | ❌ Not built |

### Content & Learning

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| SCORM/xAPI Support | No | ❌ Not built |
| Native Video Player | Partial | ⚠️ Basic only |
| Content Versioning | No | ❌ Not built |
| Certificates/Credentials | No | ❌ Not built |
| LinkedIn Sharing | No | ❌ Not built |

### Collaboration & Search

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| Global Search | No | ❌ Not built |
| Discussion Forums | No | ❌ Not built |
| Direct Messaging | No | ❌ Not built |
| Comments & @mentions | No | ❌ Not built |
| File Sharing | No | ❌ Not built |

### Localization & Accessibility

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| Multi-Language UI | No | ❌ Not built |
| RTL Support | No | ❌ Not built |
| Regional Formatting | No | ❌ Not built |
| WCAG 2.1 AA Compliance | Partial | ⚠️ Via Radix UI |
| Keyboard Navigation | Partial | ⚠️ Via Radix UI |
| Screen Reader Support | Partial | ⚠️ Via Radix UI |

### AI & Help Features

| Specified Feature | Implemented | Status |
|-------------------|-------------|--------|
| AI Coaching Chatbot | No | ❌ Not built |
| Personalized Learning Paths | No | ❌ Not built |
| At-Risk Detection | No | ❌ Not built |
| Sentiment Analysis | No | ❌ Not built |
| Help Center Integration | No | ❌ Not built |
| Onboarding Tours | No | ❌ Not built |
| In-App Chat Support | No | ❌ Not built |

### Implementation Fidelity

**UI Prototype:** ~85% of core user-facing screens (Dashboard, Programs, Scorecard, Goals, Coaching)
**Full Platform:** ~15% of total specified functionality (with all new requirements included)

---

## Gaps & Concerns

### Major Missing Components

| Category | Component | Impact |
|----------|-----------|--------|
| **Infrastructure** | Backend/Database | All data is hardcoded |
| | Authentication | No user system |
| | Multi-tenancy | No subaccount architecture |
| **Core Features** | Agency Account | Entire admin tier not built |
| | Assessments (180/360) | Core feature only placeholder |
| | Member Management | Can't add/manage users |
| | Invitations System | Can't onboard participants |
| | Resource Library | No content management |
| **Monetization** | Billing & Payments | No Stripe, pricing models, trials, invoicing |
| **Security** | SSO/SAML | Enterprise requirement missing |
| | 2FA/MFA | No multi-factor authentication |
| | GDPR Tools | No compliance features |
| | Audit Logs | No activity tracking |
| **Integrations** | Calendar Sync | No Google/Outlook integration |
| | Video Conferencing | No Zoom/Teams/Meet integration |
| | HRIS Systems | No Workday/BambooHR sync |
| | Slack/Teams | No communication tool integration |
| | API/Webhooks | No external integration capability |
| **Notifications** | In-App Notifications | No notification center |
| | Push Notifications | No web/mobile push |
| | Email System | No transactional/digest emails |
| **Mobile** | Native Apps | No iOS/Android apps |
| | PWA | No progressive web app |
| | Offline Mode | No offline capability |
| **Content** | SCORM/xAPI | No LMS standard support |
| | Certificates | No credential generation |
| | Content Versioning | No version control |
| **Collaboration** | Global Search | No search functionality |
| | Discussion Forums | No community features |
| | Direct Messaging | No user-to-user chat |
| | Comments | No commenting system |
| **Localization** | Multi-Language | English only |
| | RTL Support | No Arabic/Hebrew support |
| **AI Features** | AI Chatbot | No coaching assistant |
| | Personalization | No adaptive learning |
| | Predictions | No at-risk detection |
| **Support** | Help Center | No knowledge base |
| | Onboarding Tours | No guided walkthroughs |
| | Chat Support | No in-app support widget |

### Technical Debt
1. No global state management
2. No test coverage identified
3. No error handling patterns
4. No API layer or data abstractions
5. Role-based menu switching not implemented
6. No TypeScript strict mode
7. No CI/CD pipeline

### Architecture Gaps
1. No multi-tenant data isolation
2. No audit logging
3. No permission system
4. No real-time features (WebSockets)
5. No caching strategy
6. No CDN integration
7. No rate limiting
8. No monitoring/observability

---

## Areas Not Yet Analyzed

The analysis covered structure and requirements but did not examine:

1. **Code Quality** - Anti-patterns, complexity metrics
2. **Build & Compilation** - Errors, warnings, bundle size
3. **Testing** - Coverage, patterns
4. **Security** - Dependency vulnerabilities, code issues
5. **Performance** - Render optimization, lazy loading
6. **Accessibility** - WCAG compliance, keyboard navigation
7. **Documentation Accuracy** - README vs reality
8. **Dead Code** - Unused components/dependencies

---

## Recommendations

### Current State Assessment

The codebase is a **high-fidelity UI prototype** suitable for:
- Stakeholder demos
- UX validation
- Design review
- Investor presentations

It is **not production-ready** and lacks the backend infrastructure for a multi-tenant SaaS.

### For Production Readiness

#### Phase 1: Foundation (Critical)
1. **Backend Architecture**
   - Multi-tenant database design
   - API layer (REST or GraphQL)
   - Authentication & authorization (including SSO/SAML, 2FA)
   - Agency → Subaccount hierarchy

2. **Core Infrastructure**
   - User management & roles
   - Invitation system
   - Email service integration (transactional + marketing)
   - Basic notification system

#### Phase 2: Core Features
3. **Assessments Module**
   - 180/360 implementation
   - Assessment → Goal automation
   - Framework management

4. **Admin Features**
   - Program creation workflow
   - Member management
   - Resource library
   - Settings pages

5. **Billing & Monetization**
   - Stripe integration
   - Pricing models (per-seat, tiered)
   - Subscription management
   - Invoice generation

#### Phase 3: Platform Features
6. **Agency Account**
   - Subaccount management
   - Global templates (programs, emails, resources)
   - Cross-account analytics
   - Governance controls

7. **White-Label Branding**
   - Per-subaccount theming
   - Custom domains (optional)
   - Email customization

#### Phase 4: Integrations & Security
8. **Integrations**
   - Calendar sync (Google, Outlook)
   - Video conferencing (Zoom, Teams, Meet)
   - Slack/Teams notifications
   - REST API & webhooks
   - Zapier/Make connectors

9. **Security & Compliance**
   - GDPR tools (data export, deletion)
   - Comprehensive audit logs
   - Session management
   - Data encryption

#### Phase 5: Enhanced Experience
10. **Notifications & Mobile**
    - In-app notification center
    - Push notifications (web)
    - Mobile apps or PWA
    - Offline support

11. **Content & Learning**
    - SCORM/xAPI support
    - Enhanced video player
    - Certificates & credentials
    - Content versioning

12. **Collaboration**
    - Global search
    - Discussion forums
    - Direct messaging
    - Comments & @mentions

#### Phase 6: Advanced Features
13. **AI & Intelligence**
    - AI coaching chatbot
    - Personalized learning paths
    - At-risk detection
    - Sentiment analysis

14. **Localization**
    - Multi-language UI
    - RTL support
    - Regional formatting

15. **Help & Support**
    - Help center integration
    - Onboarding tours
    - In-app chat support

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-20 | Claude (Opus 4.5) | Initial analysis |
| 2026-01-20 | Claude (Opus 4.5) | Added account structure, roles, full navigation, assessments, program admin, agency features, branding, reporting |
| 2026-01-20 | Claude (Opus 4.5) | Added detailed Billing & Monetization section |
| 2026-01-20 | Claude (Opus 4.5) | Added Security, Integrations, Notifications, Mobile, Content, Search, Collaboration, Localization, Accessibility, AI, Help & Support sections |
| 2026-01-20 | Claude (Opus 4.5) | Added recommended Technology Stack (Next.js, Hono, Drizzle, GCP architecture) and Cost Estimates |

---

*This document serves as a reference for the Corporate Transformation OS project, capturing both the current implementation state and the full product specification.*
