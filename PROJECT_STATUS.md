# Results Tracking System — Project Status

> Last Updated: 2026-02-24 (session 8)

## Status Legend

| Status             | Meaning                                      |
| ------------------ | -------------------------------------------- |
| 🟢 **Complete**    | Fully implemented and connected to real data |
| 🟡 **In Progress** | Currently being worked on                    |
| 🟠 **Partial**     | Core functionality exists, known gaps remain |
| 🔴 **Not Started** | Planned but not yet begun                    |

---

## Foundation

### Infrastructure & Auth

| Feature                                   | Status          | Notes                                                    |
| ----------------------------------------- | --------------- | -------------------------------------------------------- |
| Monorepo (pnpm + Turborepo)               | 🟢 **Complete** | 4 packages: api, db, web, shared                         |
| PostgreSQL + Drizzle ORM                  | 🟢 **Complete** | 18 migrations applied                                    |
| JWT auth (access 15 min / refresh 7 days) | 🟢 **Complete** | argon2 password hashing                                  |
| Login / logout / refresh endpoints        | 🟢 **Complete** | `/api/auth/*`                                            |
| Forgot password / reset password          | 🟢 **Complete** | Email token flow via Resend                              |
| Multi-tenant data isolation               | 🟢 **Complete** | All queries scoped by tenantId                           |
| Auth middleware                           | 🟢 **Complete** | JWT verify + role resolution                             |
| Permission constants + role hierarchy     | 🟢 **Complete** | 6 roles, 30+ permissions                                 |
| File storage (local + S3)                 | 🟢 **Complete** | Avatars, cover images, program resources; presigned URLs |

### Core Tables

| Table                                                      | Status          |
| ---------------------------------------------------------- | --------------- |
| agencies, tenants, users, roles                            | 🟢 **Complete** |
| programs, modules, lessons                                 | 🟢 **Complete** |
| enrollments, enrollment_mentorships                        | 🟢 **Complete** |
| lesson_progress, goal_responses, goal_reviews              | 🟢 **Complete** |
| approval_submissions                                       | 🟢 **Complete** |
| lesson_tasks, task_progress                                | 🟢 **Complete** |
| quiz_attempts                                              | 🟢 **Complete** |
| surveys, survey_questions, survey_responses                | 🟢 **Complete** |
| assessment_templates, assessments, assessment_invitations  | 🟢 **Complete** |
| assessment_responses, assessment_benchmarks                | 🟢 **Complete** |
| mentoring_relationships, mentoring_sessions                | 🟢 **Complete** |
| session_notes, session_action_items, session_prep          | 🟢 **Complete** |
| notifications, notification_preferences                    | 🟢 **Complete** |
| tenant_role_permissions, tenant_user_permissions           | 🟢 **Complete** |
| impersonation_sessions                                     | 🟢 **Complete** |
| scorecard_items, scorecard_metrics, scorecard_competencies | 🟢 **Complete** |
| individual_goals, strategic_plans                          | 🟢 **Complete** |
| program_resources                                          | 🟢 **Complete** |

---

## LMS / Programs

| Feature                                             | Status          | Notes                                                         |
| --------------------------------------------------- | --------------- | ------------------------------------------------------------- |
| Program CRUD + publish/duplicate                    | 🟢 **Complete** | Full API + builder UI                                         |
| Module + lesson structure (nested, ordered)         | 🟢 **Complete** | Parent/child modules, reorder support                         |
| 6 content types                                     | 🟢 **Complete** | `lesson`, `quiz`, `assignment`, `text_form`, `goal`, `survey` |
| Curriculum builder (11-entry add menu)              | 🟢 **Complete** | 3 groups: Content, Reflection, Activity                       |
| Drip scheduling (module + lesson level)             | 🟢 **Complete** | 4 drip strategies each; enforced on learner LMS view          |
| Program enrollment (Facilitator / Mentor / Learner) | 🟢 **Complete** | Role-based access                                             |
| Mentor–Learner assignments                          | 🟢 **Complete** | Many-to-many via enrollment_mentorships                       |
| Progress tracking + lesson completion               | 🟢 **Complete** | Cascades to enrollment.progress                               |
| Learner LMS UI (`/programs/[id]/learn`)             | 🟢 **Complete** | Sidebar, sequential locking, completion modal                 |
| Program detail page (`/programs/[id]`)              | 🟢 **Complete** | Stats, module tracker, linked goals                           |
| Program catalog (`/programs`)                       | 🟢 **Complete** | Tabs, cards, filter, agency tenant selector                   |
| Content visibility toggles (draft/active)           | 🟢 **Complete** | Module + lesson status; API + frontend filtering              |
| API-level draft filtering                           | 🟢 **Complete** | Non-builder users only see `active` content in API responses  |
| Drip scheduling enforcement (learner LMS)           | 🟢 **Complete** | `drip-utils.ts` evaluator + sidebar lock indicators           |
| Preview mode (`?previewRole=learner`)               | 🟢 **Complete** | Bypasses sequential + drip locking; respects draft visibility |
| Program Templates                                   | 🟢 **Complete** | Mark as template, use template, assign to client              |
| Tasks within lessons                                | 🟢 **Complete** | `lesson_tasks` + `task_progress` tables                       |
| Events as module peers                              | 🟢 **Complete** | `moduleType` enum (module / event) + eventConfig JSONB        |

### Quiz System

| Feature                                  | Status          | Notes                                                   |
| ---------------------------------------- | --------------- | ------------------------------------------------------- |
| Quiz builder UI                          | 🟢 **Complete** | `QuizEditor.tsx` — MC, T/F, short-answer question types |
| Passing score + retake settings          | 🟢 **Complete** | Stored in lesson content JSONB                          |
| Auto-grading (MC + T/F)                  | 🟢 **Complete** | `quiz-engine.ts`                                        |
| Short-answer: auto_complete mode         | 🟢 **Complete** | Always awards full points                               |
| Short-answer: keyword mode               | 🟢 **Complete** | Matches answer against keyword list                     |
| Short-answer: manual review mode         | 🟢 **Complete** | Sets `gradingStatus = pending_grade`                    |
| Attempt tracking (`quiz_attempts` table) | 🟢 **Complete** | Per-enrollment, attempt number, score, breakdown        |
| Retake limit enforcement                 | 🟢 **Complete** | 403 when maxAttempts reached                            |
| Learner results view                     | 🟢 **Complete** | Score card, per-question breakdown, pass/fail           |
| Pending grade banner                     | 🟢 **Complete** | Shown when manual review outstanding                    |
| Facilitator manual grading endpoint      | 🟢 **Complete** | `PUT .../quiz/attempts/:id/grade`                       |

### Survey System

| Feature                                  | Status          | Notes                                                                |
| ---------------------------------------- | --------------- | -------------------------------------------------------------------- |
| Survey CRUD (tenant + agency scoped)     | 🟢 **Complete** | Full API at `/api/tenants/:id/surveys`                               |
| 7 question types                         | 🟢 **Complete** | single_choice, multiple_choice, text, rating, nps, yes_no, ranking   |
| Share link (public access)               | 🟢 **Complete** | `shareToken` on surveys table                                        |
| Anonymous + login-required modes         | 🟢 **Complete** | Session-token dedup for anonymous                                    |
| Results aggregation                      | 🟢 **Complete** | Per-question stats: counts, avg, NPS score, rank order               |
| Survey list page (`/surveys`)            | 🟢 **Complete** | Tabs: All / Draft / Active / Closed                                  |
| Survey editor (`/surveys/[id]`)          | 🟢 **Complete** | Questions / Settings / Results tabs                                  |
| Public response page (`/survey/[token]`) | 🟢 **Complete** | Outside auth wrapper, all 7 question types                           |
| In-program survey viewer                 | 🟢 **Complete** | `SurveyContent.tsx` — inline, checks prior response                  |
| Results charts                           | 🟢 **Complete** | `SurveyResults.tsx` — bar charts, NPS breakdown, rating distribution |
| Sidebar nav entry                        | 🟢 **Complete** | Between assessments and people                                       |

---

## Assessments (360 / 180)

| Feature                                             | Status          | Notes                                                |
| --------------------------------------------------- | --------------- | ---------------------------------------------------- |
| Assessment template CRUD                            | 🟢 **Complete** | Agency-owned, published to tenants                   |
| Competency + question builder                       | 🟢 **Complete** | Inline editor, drag reorder                          |
| Rating scale configuration                          | 🟢 **Complete** | Custom min/max/labels per template                   |
| Rater type config (self/manager/peer/direct_report) | 🟢 **Complete** | Stored in template config JSONB                      |
| Assessment creation from template                   | 🟢 **Complete** | Per-subject, per-tenant                              |
| Rater invitation workflow                           | 🟢 **Complete** | Token-based public rater form                        |
| Email reminders to raters                           | 🟢 **Complete** | Via Resend (silently skips if no key)                |
| Response collection                                 | 🟢 **Complete** | Stored in `assessment_responses`                     |
| Close assessment + compute results                  | 🟢 **Complete** | `POST /:id/results/compute`                          |
| Reverse-scored questions [R]                        | 🟢 **Complete** | Auto-inverted in scoring engine                      |
| Gap analysis + Johari window                        | 🟢 **Complete** | blind_spot / hidden_strength / aligned               |
| CCI (Coaching Capacity Index)                       | 🟢 **Complete** | isCCI-tagged questions, 4 bands                      |
| Current Ceiling computation                         | 🟢 **Complete** | Lowest competency with narrative                     |
| Sequential trend comparison                         | 🟢 **Complete** | Compares same subject across assessments             |
| Benchmarks                                          | 🟢 **Complete** | Aggregate comparison data                            |
| PDF report (LeaderShift™)                           | 🟢 **Complete** | 16-section executive report via react-pdf            |
| Adaptive radar charts                               | 🟢 **Complete** | 180 (self vs boss) and 360 (multi-rater overlay)     |
| Agency templates page (`/agency/assessments`)       | 🟢 **Complete** | List, editor, competency builder                     |
| Tenant assessments page (`/assessments`)            | 🟢 **Complete** | Filter tabs, detail view, Results / Development tabs |
| Development plan + goal suggestions                 | 🟢 **Complete** | Post-assessment planning views                       |

---

## Mentoring

| Feature                            | Status          | Notes                                                                                                                   |
| ---------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Mentor ↔ Mentee relationships      | 🟢 **Complete** | With relationship type and meeting preferences                                                                          |
| Session scheduling                 | 🟢 **Complete** | Types: mentoring, one_on_one, check_in, review, planning                                                                |
| Session lifecycle                  | 🟢 **Complete** | scheduled → prep → ready → completed / cancelled                                                                        |
| Pre-session reflection (mentee)    | 🟢 **Complete** | Wins, challenges, topics to discuss, questions for mentor                                                               |
| Session prep form end-to-end       | 🟢 **Complete** | `SessionPrepModal` + GET/POST/PUT prep endpoints; sessions API enriched (Feb 22)                                        |
| Sessions API enrichment            | 🟢 **Complete** | `GET /sessions` returns nested `mentor`/`mentee` objects, `scheduledAt`, `prep`; POST/PUT accept `scheduledAt` + `type` |
| Session notes (public + private)   | 🟢 **Complete** | Per-session, role-scoped visibility                                                                                     |
| Action items                       | 🟢 **Complete** | Owner, due date, priority, completion tracking                                                                          |
| Role-scoped views                  | 🟢 **Complete** | Mentor: own mentees; Facilitator: program scope; Admin: all                                                             |
| Mentoring dashboard (`/mentoring`) | 🟢 **Complete** | Stats, sessions list, relationships tabs — real API data                                                                |
| Session detail page                | 🟢 **Complete** | Prep, notes, action items, participants                                                                                 |
| Agency user tenant selector        | 🟢 **Complete** | Auto-selects first tenant                                                                                               |
| Seed data                          | 🟢 **Complete** | 2 relationships, 4 sessions, 1 submitted prep (John/ready), 3 action items                                              |

---

## Scorecard

| Feature                            | Status          | Notes                                                                           |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| Scorecard items (accountabilities) | 🟢 **Complete** | CRUD + period scoping; `GET/POST/PUT/DELETE /scorecard/items`                   |
| Scorecard metrics (KPIs)           | 🟢 **Complete** | CRUD; category grouping; trend (up/down/neutral); invertTrend                   |
| Scorecard competencies             | 🟢 **Complete** | Self-rating + manager-rating; reviewer assignment                               |
| Org health                         | 🟢 **Complete** | `GET /scorecard/org-health` — aggregates metrics by category into health scores |
| Period selector                    | 🟢 **Complete** | `GET /scorecard/periods`; defaults to current quarter (e.g. Q1-2026)            |
| Overall score computation          | 🟢 **Complete** | Average of all item scores; computed server-side                                |
| Role/Mission section               | 🟢 **Complete** | Displayed from user profile fields                                              |
| Agency user tenant selector        | 🟢 **Complete** | Same pattern as mentoring/planning pages                                        |
| Scorecard page (`/scorecard`)      | 🟢 **Complete** | Real API — items, metrics, competencies, org health, period picker              |

---

## Analytics

| Feature                                  | Status          | Notes                                                       |
| ---------------------------------------- | --------------- | ----------------------------------------------------------- |
| Analytics API (`GET /api/analytics`)     | 🟢 **Complete** | Aggregates programs, enrollments, assessments, users, goals |
| Time range filter (7d / 30d / 90d / 12m) | 🟢 **Complete** | Passed as query param                                       |
| Agency-level: filter by client           | 🟢 **Complete** | `tenantId` query param                                      |
| Overview tab                             | 🟢 **Complete** | KPI cards with trend badges                                 |
| Programs tab                             | 🟢 **Complete** | Enrollment/completion trends, top programs list             |
| Assessments tab                          | 🟢 **Complete** | Activity trend, status breakdown                            |
| Team tab                                 | 🟢 **Complete** | Headcount trend, department bars                            |
| Goals tab                                | 🟢 **Complete** | Goals trend, status and category breakdowns                 |
| Analytics page (`/analytics`)            | 🟢 **Complete** | Real data, custom dropdowns, 5 tab views                    |

---

## Email & Notifications

| Feature                                    | Status          | Notes                                                                                                                          |
| ------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Resend email service                       | 🟢 **Complete** | 10 typed send helpers; silently skips if no API key                                                                            |
| React Email templates                      | 🟢 **Complete** | assessment invite/reminder, welcome, password reset, program welcome/kickoff, weekly digest, inactivity, milestone, completion |
| In-app notification creation               | 🟢 **Complete** | `createNotification()` helper — fails silently                                                                                 |
| Notification API (7 endpoints)             | 🟢 **Complete** | List, unread count, mark read, mark all, archive, preferences                                                                  |
| Cron endpoint                              | 🟢 **Complete** | `POST /api/cron/notifications` secured by `X-Cron-Secret`                                                                      |
| Weekly digest + inactivity + due-date jobs | 🟢 **Complete** | All three cron job handlers                                                                                                    |
| Forgot password / reset password           | 🟢 **Complete** | Token stored on user, expiry enforced                                                                                          |
| Notification preferences                   | 🟢 **Complete** | Per-user, per-type toggle storage                                                                                              |
| Notifications page (`/notifications`)      | 🟢 **Complete** | Wired to real API — list, unread count, mark read/all, archive, preferences                                                    |

---

## Role-Based Navigation & Permissions

| Feature                                    | Status          | Notes                                                       |
| ------------------------------------------ | --------------- | ----------------------------------------------------------- |
| 3-layer nav resolution                     | 🟢 **Complete** | Hardcoded defaults → role DB override → user DB override    |
| `tenant_role_permissions` table            | 🟢 **Complete** | Per-tenant role overrides                                   |
| `tenant_user_permissions` table            | 🟢 **Complete** | Per-user grant/revoke overrides                             |
| `GET /my-nav` endpoint                     | 🟢 **Complete** | Returns effective nav for authenticated user                |
| Role permissions admin UI                  | 🟢 **Complete** | Nav item × role matrix with toggle switches                 |
| User permissions overrides UI              | 🟢 **Complete** | User list, modal with grant/revoke checkboxes + nav preview |
| Permissions page (`/settings/permissions`) | 🟢 **Complete** | Tenant admin only                                           |
| Sidebar dynamic nav (useMyNav hook)        | 🟢 **Complete** | staleTime 5 min, falls back to constants                    |
| Learner role navigation filtering          | 🟢 **Complete** | No mentoring in learner's sidebar                           |

---

## Impersonation System

| Feature                                   | Status          | Notes                                |
| ----------------------------------------- | --------------- | ------------------------------------ |
| `POST /api/admin/impersonate`             | 🟢 **Complete** | Starts impersonation session         |
| `POST /api/admin/impersonate/end`         | 🟢 **Complete** | Ends session, returns admin token    |
| `GET /api/admin/impersonate/status`       | 🟢 **Complete** | Check if currently impersonating     |
| `GET /api/admin/impersonate/history`      | 🟢 **Complete** | Audit log of all sessions            |
| Cross-tenant user search                  | 🟢 **Complete** | `GET /api/agencies/me/users/search`  |
| Header "Login As User" modal              | 🟢 **Complete** | Real-time search, grouped by client  |
| Impersonation banner                      | 🟢 **Complete** | Amber bar, "Switch Back" button      |
| Header dropdown state while impersonating | 🟢 **Complete** | Shows "Return to Agency View"        |
| X-Impersonation-Token injection           | 🟢 **Complete** | API client reads sessionStorage      |
| Audit logging                             | 🟢 **Complete** | Reason, duration, admin, target user |

---

## Agency Portal

| Feature                    | Status          | Notes                                      |
| -------------------------- | --------------- | ------------------------------------------ |
| Overview tab               | 🟢 **Complete** | Stats, activity feed                       |
| Clients tab                | 🟢 **Complete** | Tenant list, create client                 |
| People tab                 | 🟢 **Complete** | Cross-tenant user directory                |
| Templates tab (assessment) | 🟢 **Complete** | Template builder, competency editor        |
| Branding tab               | 🟢 **Complete** | Theme customization UI                     |
| Billing tab                | 🟢 **Complete** | Placeholder UI                             |
| Program Builder (agency)   | 🟢 **Complete** | Full program builder with templates system |

---

## Planning & Goals

| Feature                       | Status          | Notes                                                                                                           |
| ----------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| Individual goals CRUD         | 🟢 **Complete** | `POST/GET/PUT/DELETE /api/tenants/:id/planning/goals`                                                           |
| Strategic plans CRUD          | 🟢 **Complete** | `POST/GET/PUT/DELETE /api/tenants/:id/planning/plans`                                                           |
| Goal ↔ plan links             | 🟢 **Complete** | `strategic_goal_links` table; inserted on goal create when `strategicPlanId` provided                           |
| Planning summary stats        | 🟢 **Complete** | `GET /planning/summary` — totals, avg progress, category breakdown                                              |
| All goal fields submitted     | 🟢 **Complete** | Title, description, category, priority, startDate, targetDate, reviewFrequency, successMetrics, strategicPlanId |
| Agency user tenant selector   | 🟢 **Complete** | Header select dropdown; passes `tenantId` prop to all 4 tabs                                                    |
| Create Strategic Plan modal   | 🟢 **Complete** | Admin-only (`roleLevel >= 70`); name, type, description, dates                                                  |
| Inline goal progress editing  | 🟢 **Complete** | Pencil icon on GoalCard → number input → blur/Enter saves via `useUpdateGoal`                                   |
| Real scorecard items in modal | 🟢 **Complete** | Step 3 "Linked to Scorecard" dropdown populated from `useScorecard`                                             |
| Real annual plans in modal    | 🟢 **Complete** | Step 3 "Linked to Plan" select populated from `useStrategicPlans`                                               |
| Goals tab                     | 🟢 **Complete** | Filter by status, category; goal cards with progress bars                                                       |
| Annual Planning tab           | 🟢 **Complete** | Strategic plans list; Create Plan button (admin only)                                                           |
| Quarterly Planning tab        | 🟢 **Complete** | Quarterly goal breakdown; Create Plan button (admin only)                                                       |
| Metrics tab                   | 🟢 **Complete** | Scorecard metrics view                                                                                          |

---

## Dashboard Pages

| Page                    | Status          | Data Source                                                                                   |
| ----------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `/dashboard`            | 🟢 **Complete** | Real API                                                                                      |
| `/programs`             | 🟢 **Complete** | Real API                                                                                      |
| `/programs/[id]`        | 🟢 **Complete** | Real API                                                                                      |
| `/programs/[id]/learn`  | 🟢 **Complete** | Real API                                                                                      |
| `/program-builder`      | 🟢 **Complete** | Real API                                                                                      |
| `/program-builder/[id]` | 🟢 **Complete** | Real API                                                                                      |
| `/assessments`          | 🟢 **Complete** | Real API                                                                                      |
| `/mentoring`            | 🟢 **Complete** | Real API                                                                                      |
| `/analytics`            | 🟢 **Complete** | Real API                                                                                      |
| `/surveys`              | 🟢 **Complete** | Real API                                                                                      |
| `/surveys/[id]`         | 🟢 **Complete** | Real API                                                                                      |
| `/settings`             | 🟢 **Complete** | Real API (profile, notifications, security tabs)                                              |
| `/settings/permissions` | 🟢 **Complete** | Real API                                                                                      |
| `/people`               | 🟢 **Complete** | Real API — users, departments, manager field, Add Person modal with role + manager assignment |
| `/scorecard`            | 🟢 **Complete** | Real API — full DB schema, API routes, hooks, seeded                                          |
| `/planning`             | 🟢 **Complete** | Real API — full CRUD (goals + plans + summary)                                                |
| `/notifications`        | 🟢 **Complete** | Real API — list, unread count, mark read, preferences                                         |
| `/help`                 | 🟢 **Complete** | Static content (no API needed)                                                                |
| `/onboarding`           | 🟢 **Complete** | Multi-step wizard (full_platform / strategic_planning / program_only flows)                   |

---

## File Storage & Content Editing

| Feature                          | Status          | Notes                                                                                        |
| -------------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| Storage abstraction (local + S3) | 🟢 **Complete** | `StorageProvider` interface, `LocalStorage`, `S3Storage` with presigned URLs                 |
| Avatar file upload               | 🟢 **Complete** | `POST/DELETE /api/upload/avatar`; Settings page uses FormData (no base64)                    |
| Cover image upload               | 🟢 **Complete** | `POST/DELETE /api/upload/cover/:programId`; InfoTab with preview/remove                      |
| Program resources CRUD           | 🟢 **Complete** | `program_resources` table, file upload + external links, category stats                      |
| Resources tab UI                 | 🟢 **Complete** | Upload zone, link form, file list with download/delete                                       |
| Base64 avatar migration          | 🟢 **Complete** | `db:migrate-avatars` script converts legacy data URLs to storage keys                        |
| WYSIWYG editor (Tiptap)          | 🟢 **Complete** | Bold, italic, underline, strike, headings, lists, code block, links                          |
| WYSIWYG: lesson fields           | 🟢 **Complete** | `introduction`, `mainContent`, `keyTakeaway`                                                 |
| WYSIWYG: assignment fields       | 🟢 **Complete** | `introduction`, `instructions`                                                               |
| WYSIWYG: goal/text_form intro    | 🟢 **Complete** | `introduction` for both content types                                                        |
| HTML rendering (learner side)    | 🟢 **Complete** | `isHtmlContent()` guard in ReadingContent, AssignmentContent, GoalContent, SubmissionContent |

---

## Not Yet Implemented

| Item                                         | Priority | Notes                                                                     |
| -------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| 3HAG visual wizard UI                        | Low      | DB + API + create modal exist; no step-by-step 3HAG builder with timeline |
| Real-time updates (WebSocket / SSE)          | Low      | Not yet scoped                                                            |
| Settings Integrations tab (real connections) | Low      | Shows Coming Soon; no OAuth flows built                                   |
| Settings Billing tab (real data)             | Low      | Shows Coming Soon; needs billing provider                                 |

### Recently Completed (session 8)

| Item                                   | Status                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ~~Content visibility toggles~~         | 🟢 Module/lesson `status` (draft/active); Zod schemas fixed; toggle UI in CurriculumTab                |
| ~~Drip scheduling enforcement~~        | 🟢 `drip-utils.ts` pure evaluator; integrated into learn page useMemo + LearnerSidebar lock indicators |
| ~~API-level draft filtering~~          | 🟢 `programs.ts` GET /:programId + `progress.ts` GET /progress filter for non-builder users            |
| ~~New content defaults to active~~     | 🟢 All create/deep-copy handlers in programs.ts + agencies.ts default to `status: 'active'`            |
| ~~Learn page navigation improvements~~ | 🟢 Skips empty modules in init/goToNext/goToPrevious; "Back to Program" goes to detail page            |

---

## Spec Compliance Checklist

| Requirement                         | Status          | Notes                                                                                                                          |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Programs are the main focus         | 🟢 **Complete** | Full LMS with 6 content types                                                                                                  |
| Agency creates programs for clients | 🟢 **Complete** | Programs linked to tenant, optional agency_id                                                                                  |
| Multi-client program participation  | 🟢 **Complete** | Templates → assign to any client                                                                                               |
| Mentors see only assigned learners  | 🟢 **Complete** | Role-scoped mentoring API                                                                                                      |
| Learner restricted navigation       | 🟢 **Complete** | 3-layer permission resolution                                                                                                  |
| 180 assessments (self + boss)       | 🟢 **Complete** | End-to-end with PDF reports                                                                                                    |
| 360 assessments (full circle)       | 🟢 **Complete** | Multi-rater radar charts                                                                                                       |
| Agency admin impersonation          | 🟢 **Complete** | Full stack — modal, banner, audit log                                                                                          |
| Coach → Mentor terminology          | 🟢 **Complete** | All new code uses "Mentor/Mentoring"                                                                                           |
| Intelligent goal handling           | 🟢 **Complete** | Individual goals full CRUD, category/priority/reviewFrequency, strategic plan links                                            |
| 3HAG / BHAG support                 | 🟠 **Partial**  | DB schema + full API + Create Plan modal (all 4 plan types incl. 3hag/bhag); no dedicated 3HAG wizard UI with visual timeline  |
| Role-specific onboarding            | 🟢 **Complete** | `/onboarding` page, OnboardingGate in dashboard layout                                                                         |
| Auto-save onboarding progress       | 🟢 **Complete** | `PUT /api/onboarding/progress` upsert on each step                                                                             |
| Role-specific notifications         | 🟢 **Complete** | Notification preferences table + cron jobs                                                                                     |
| Certificate/diploma generation      | 🟢 **Complete** | PDF via `@react-pdf/renderer`, download button on completion                                                                   |
| Global search / Cmd+K               | 🟢 **Complete** | `CommandPalette.tsx`, `GET /api/tenants/:id/search`, Cmd+K binding                                                             |
| Session prep form (end-to-end)      | 🟢 **Complete** | `SessionPrepModal` + GET/POST/PUT prep endpoints; sessions API now returns enriched data with `mentor`/`mentee`/`prep` objects |

---

## Security Audit Status

### Full Codebase Audit (2026-02-12)

108 issues found. Key items:

| Category        | Found | Fixed | Remaining |
| --------------- | ----- | ----- | --------- |
| Critical (SEC)  | 9     | 3     | 6         |
| High priority   | 28    | ~12   | ~16       |
| Medium priority | 38    | 1     | 37        |
| Low priority    | 21    | 0     | 21        |

Key fixed: bulk enrollment passwords, impersonation permission checks, DB indexes, CHECK constraints, connection pool, security headers, Zod env validation, barrel exports.

Key still pending from original audit: some medium/low items. SEC-01 (.env git history) verified clean. SEC-05 (CSRF) documented as N/A (header-based auth).

Fixed in session 2 (2026-02-20): rate limiting (SEC-03), ESLint/Prettier (ARCH-01), CI/CD (ARCH-12).

See full report: `AUDITS/2026-02-12-full-codebase-audit.md`

### Program Creation Audit (2026-02-20)

23 issues found, 19 fixed, 3 deferred (M-03 timezone scheduling, M-08 multi-tenant UI, L-02 audit field). C-04 (cover image upload) resolved in session 6 via file storage backend.

See full report: `AUDITS/2026-02-20-program-creation-audit.md`

### Security Audit — Section by Section (complete, all 19/19 resolved)

19 issues found (0 critical, 6 high, 7 medium, 6 low). 17 fixed (2026-02-20), final 2 fixed (2026-02-22): M-04 (JWT min-length raised to 43 chars), L-06 (CSRF architecture documented).

Frontend hardening (2026-02-22): API client fetch timeout (30s/120s), 401 auto-refresh interceptor with retry, logout redirect to `/login`, concurrent refresh mutex.

See full report: `AUDITS/2026-02-20-security-audit.md`

---

## Test Accounts

Password for all: `password123`

| Email                      | Role         | Context                                                                                                |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| `admin@acme.com`           | Agency Owner | Agency-level access, impersonation enabled                                                             |
| `admin@techcorp.com`       | Tenant Admin | Full TechCorp access                                                                                   |
| `coach@techcorp.com`       | Facilitator  | Program facilitation                                                                                   |
| `mentor@techcorp.com`      | Mentor       | 2 mentoring relationships (Emily ↔ John, Emily ↔ Jane); 3 sessions (1 completed, 1 ready, 1 scheduled) |
| `john.doe@techcorp.com`    | Learner      | Enrolled in "Leadership Essentials"; mentee of Emily; session prep submitted for "Progress Check-in"   |
| `jane.smith@techcorp.com`  | Learner      | Mentee of Emily; 1 upcoming planning session                                                           |
| `alex.wilson@techcorp.com` | Learner      | Enrolled in "Leadership Essentials"                                                                    |

---

## Notes

- Seeded assessments have `status: 'completed'` but `computedResults` is null until `POST /:tenantId/assessments/:id/results/compute` is called
- Email sending silently skips in dev if `RESEND_API_KEY` is not set
- TypeScript check: run `npx tsc --noEmit` from within each package directory (not via `pnpm filter`)
- Drizzle LATERAL JOIN does not work via `.leftJoin()` — use correlated subqueries
- Module/lesson DB default is `status = 'draft'`; all API create handlers override to `'active'`; deep-copy preserves source status
- `components/` folder is a standalone Vite + React 18 prototype — do not import from `packages/web` (React 19)
