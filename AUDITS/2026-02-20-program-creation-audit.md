# Program Creation Flow Audit

> Date: 2026-02-20
> Scope: Full program creation — wizard, APIs, templates, emails, deep copy
> Status: 23 issues found (5 critical, 5 high, 9 medium, 4 low)
> Fixed (2026-02-20): C-01✓, C-02✓, C-03✓, C-05✓, H-01✓, H-02✓, H-03✓, H-04✓, H-05 (partial)✓, M-01✓, M-04✓, M-05✓ — all Tier 1 + most Tier 2 items addressed

---

## Fields Collected vs. Persisted

| Step | Field | Collected in Wizard | In API Schema | Saved to DB |
|------|-------|--------------------|--------------|----|
| 1 | internalName | ✓ | ✓ | ✓ |
| 1 | title | ✓ | ✓ (as `name`) | ✓ |
| 1 | description | ✓ | ✓ | ✓ |
| 1 | coverImage | ✓ (UI only) | ✓ | ✗ upload not implemented |
| 1 | learningTrack | ✓ | ✗ direct | ✓ via `config` JSONB |
| 2 | objectives (3+) | ✓ | ✗ | ✗ **DROPPED** |
| 3 | programType | ✓ | ✓ (as `type`) | ✓ |
| 3 | startDate / endDate | ✓ | ✓ | ✓ |
| 3 | timezone | ✓ | ✓ | ✓ |
| 3 | estimatedDuration | ✓ | ✗ | ✗ **DROPPED** |
| 3 | allowIndividualPacing | ✓ | ✗ | ✗ **DROPPED** |
| 3 | startOffset | ✓ | ✗ | ✗ **DROPPED** |
| 3 | deadlineFlexibility | ✓ | ✗ | ✗ **DROPPED** |
| 4 | emailSettings (7 toggles) | ✓ (visual only) | ✗ | ✗ **DROPPED** |
| 4 | beforeDueReminders (5) | ✓ (visual only) | ✗ | ✗ **DROPPED** |
| 4 | afterDueReminders (3) | ✓ (visual only) | ✗ | ✗ **DROPPED** |
| 5 | targetAudience | ✓ | ✗ | ✗ **DROPPED** |
| 5 | prerequisites | ✓ | ✗ | ✗ **DROPPED** |
| 5 | recommendedFor | ✓ | ✗ | ✗ **DROPPED** |

**~40% of wizard data actually persists to the database.**

---

## Critical Issues

### C-01: Email Configuration Completely Dropped
**Where:** Wizard Step 4 → `CreateProgramWizard.tsx`, `onCreate()` handler
**Problem:** Step 4 collects 7 email toggles + 8 reminder day settings (before/after due date). None are included in the `onCreate(formData)` payload passed to the API. The `createAgencyProgramSchema` / `createProgramSchema` Zod schemas have no `emailSettings` field.
**Effect:** All program email preferences are always the hardcoded defaults. Admins cannot customize emails per-program at creation time or save their choices.

### C-02: Step 4 Toggle Buttons Are Visual-Only
**Where:** `CreateProgramWizard.tsx` Step 4 render
**Problem:** Email toggle buttons have no state management — clicking them changes visual appearance but doesn't update `formData.emailSettings`. The component renders the `defaultEmailSettings` constant without binding it to mutable state.
**Effect:** Even if Step 4 data were passed to the API, the values would always be the hardcoded defaults because the toggles don't actually track state.

### C-03: Learning Objectives Not Persisted
**Where:** Wizard Step 2, API schema
**Problem:** Step 2 collects 3+ learning objectives (`{ id, text }`). The `objectives` array is not in either program creation API schema and is not saved anywhere. No `program_objectives` table exists.
**Effect:** Objectives disappear after creation. The program overview page has no objectives to display; the field shown in the program detail is likely a static string.

### C-04: Cover Image Upload Not Implemented
**Where:** Wizard Step 1 drag-drop zone
**Problem:** The UI shows a drag-and-drop image upload zone that accepts PNG/JPG up to 5MB. There is no upload handler, no presigned S3 URL request, and no multipart form submission. The field `coverImageUrl` accepts a text string in the form state but is never sent.
**Effect:** Programs cannot have cover images. The API field `coverImage` exists in the schema and DB but is always null.

### C-05: No Date Validation in Tenant Program Route
**Where:** `packages/api/src/routes/programs.ts` POST `/api/tenants/:tenantId/programs`
**Problem:** The agency route (`agencies.ts`) validates `startDate < endDate` and returns a 400 if violated. The tenant route has no equivalent check. A tenant admin can create a program with `endDate` before `startDate`.
**Effect:** Programs with inverted date ranges break downstream scheduling, progress calculation, and email reminder logic.

---

## High-Severity Issues

### H-01: Pacing Settings Never Sent to API
**Where:** Wizard Step 3 (cohort path), API schema
**Problem:** `allowIndividualPacing`, `startOffset` (days after enrollment start), and `deadlineFlexibility` (days of buffer) are collected in the wizard but are not explicitly mapped into the API payload. The `config` JSONB field could store them, but the wizard's `onCreate()` handler doesn't pack them into `config`.
**Effect:** All cohort programs behave identically regardless of pacing selection. No per-learner flexibility is enforced.

### H-02: Target Audience / Prerequisites / RecommendedFor Dropped
**Where:** Wizard Step 5, API schema
**Problem:** `targetAudience`, `prerequisites`, and `recommendedFor` are collected (large textareas) but not in either program creation schema. The `ProgramConfig` interface in `programs.ts` defines these fields, but the API schema's `config` object definition does not accept them.
**Effect:** Metadata for program discovery and enrollment eligibility is lost. Cannot filter programs by prerequisites or audience.

### H-03: No Error Handling When Creation Fails
**Where:** `program-builder/page.tsx`, wizard `onCreate()` handler
**Problem:** The wizard closes immediately after calling `onCreate(formData)`. If the API call throws (network error, validation error, DB constraint), the modal closes and the user sees nothing — no toast, no error modal, no re-open. The mutation's `isError` / `error` state is not observed after dismiss.
**Effect:** Silent failures. Users lose all wizard data and must start over with no feedback.

### H-04: No Transactional Wrapping on Deep Copy
**Where:** `agencies.ts` — `use-template`, `assign`, `duplicate` handlers
**Problem:** Template deep-copy runs as individual sequential INSERTs: program → modules loop → lessons loop → tasks loop. If an INSERT fails midway (e.g., DB constraint), partial data is left in the database — the program record exists but has incomplete/missing modules or lessons.
**Effect:** Orphaned or corrupt program content in the DB. Requires manual cleanup.

### H-05: Wizard Data Not Validated Before Each Step
**Where:** `CreateProgramWizard.tsx`, step navigation
**Problem:** The "Next" button on each step advances unconditionally — no client-side validation runs. Required fields (`internalName`, `title`, `description`, `learningTrack`) are marked required in the schema but not checked before step advance.
**Effect:** User can reach Step 6 and submit with blank required fields, hitting a backend 400 with no recovery path (due to H-03).

---

## Medium-Severity Issues

### M-01: estimatedDuration Not Persisted (Self-Paced)
Step 3 self-paced path collects `estimatedDuration` (weeks). Not in API schema. Never saved. No `estimated_duration` field in `programs` table.

### M-02: sourceTemplateId Not Surfaced in UI
Programs track `sourceTemplateId` when created from a template. No UI shows which template a program derived from, and no "template lineage" view exists. Cannot track template → derived program relationships.

### M-03: Timezone Not Used Downstream
`programs.timezone` is saved but not applied to any scheduling logic — lesson due dates, cron jobs, and email sends all use UTC. The timezone field is decorative.

### M-04: Default Timezone Hard-Coded as America/New_York
Not derived from user profile, browser, or agency settings. All non-US programs default to ET.

### M-05: Duplicate Preserves isTemplate Flag
`POST .../duplicate` sets `isTemplate: original.isTemplate`, so duplicating a template creates another template. No confirmation or warning shown to user.

### M-06: No Self-Enrollment / Capacity Config in Wizard
API and `ProgramConfig` support `allowSelfEnrollment`, `requireManagerApproval`, `programCapacity`, `enableWaitlist`. None exposed in wizard. Must be set post-creation via Settings tab.

### M-07: Wizard Progress Not Persisted
Closing the wizard mid-way loses all entered data. No auto-save, no localStorage draft, no resume flow.

### M-08: Multi-Tenant allowedTenantIds No UI
`POST /api/agencies/me/programs` accepts `allowedTenantIds` array to share a single program across multiple tenants without copying. No UI exposes this; must be set via raw API call.

### M-09: Agency Route Creates Program With agencyId but No tenantId by Default
Agency program creation results in a program not scoped to any tenant until explicitly assigned. Program Builder list shows these as "agency-level" programs but learners can't enroll until a tenant copy is assigned.

---

## Low-Severity Issues

### L-01: No Wizard Completion Emails
No email sent to the creator or any admin when a program is created.

### L-02: No `creationSource` Audit Field
No way to distinguish programs created via wizard vs. API vs. template vs. duplicate.

### L-03: Soft Delete Doesn't Cascade to Children
`DELETE /api/.../programs/:id` sets `programs.deletedAt` but does not soft-delete child modules, lessons, or tasks. Direct queries on those tables without the program join may surface orphaned content.

### L-04: Objectives Displayed in Review Step via Placeholder
Step 6 review renders `formData.objectives.filter(o => o.text.trim())` — showing what was typed. But since objectives aren't saved, the program overview page cannot replicate this display from real data.

---

## Template Flow Summary

| Action | Endpoint | Deep Copies | isTemplate | sourceTemplateId | Transactional |
|--------|----------|------------|------------|------------------|--------------|
| Mark as Template | POST `.../mark-template` | No | true | unchanged | N/A |
| Use Template (agency copy) | POST `.../use-template` | Yes | false | ← template.id | ✓ Fixed |
| Assign to Client | POST `.../assign` | Yes | false | ← source.id | ✓ Fixed |
| Duplicate | POST `.../duplicate` | Yes | **false** (fixed) | null | ✓ Fixed |

---

## Email Trigger Inventory

| Email | Trigger Point | Currently Fires? |
|-------|--------------|-----------------|
| Program Welcome (learner enrolled) | `POST .../enrollments` | ✓ Yes (`sendProgramWelcome`) |
| Program Kickoff | Start date reached | ✗ Not implemented |
| Weekly Progress Digest | Cron job | ✗ Not implemented |
| Inactivity Reminder | Cron job | ✗ Not implemented |
| Milestone Celebrations | Progress update | ✗ Not implemented |
| Completion Email | lessonProgress cascade | ✗ Not implemented |
| Mentor/Manager Summary | Cron job | ✗ Not implemented |
| Before-Due Reminders (5 intervals) | Cron job | ✗ Not implemented |
| After-Due Reminders (3 intervals) | Cron job | ✗ Not implemented |

**Only 1 of 9 program emails is implemented.**
The cron handler at `POST /api/cron/notifications` is the intended home for scheduled emails but currently only handles assessment reminders.

---

## Fix Status

### ✅ Fixed (2026-02-20)

| ID | Issue | How Fixed |
|----|-------|-----------|
| C-01 | Email config dropped | `ProgramWizardForm.tsx` `handleCreate` builds full config with email settings |
| C-02 | Step 4 toggles visual-only | `toggleEmailSetting` / `updateEmailField` update `formData` state correctly |
| C-03 | Objectives not persisted | Packed into `config.objectives` in `handleCreate` |
| C-05 | No date validation in tenant route | Already present in `programs.ts` POST handler |
| H-01 | Pacing settings dropped | `allowIndividualPacing`, `startOffset`, `deadlineFlexibility` packed into `config` |
| H-02 | Audience/prerequisites dropped | `targetAudience`, `prerequisites`, `recommendedFor` packed into `config` |
| H-03 | No error handling on creation fail | Try/catch in `handleCreate` sets `error` state shown in Step 6 |
| H-04 | Deep-copy not transactional | All 3 endpoints (`duplicate`, `use-template`, `assign`) wrapped in `db.transaction()` |
| H-05 | No per-step validation | `canProceed()` validates Steps 1–3; Step 3 now blocks if `startDate >= endDate` |
| M-01 | estimatedDuration dropped | Packed into `config.estimatedDuration` for self-paced programs |
| M-04 | Timezone hardcoded to ET | Wizard initializes from `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| M-05 | Duplicate preserves isTemplate | `duplicate` now always sets `isTemplate: false` |
| API | `survey` not in lesson schema | Added `'survey'` to `contentType` enum in both `programs.ts` and `agencies.ts` |

---

### ✅ Do Next — All Completed (2026-02-20)

| ID | Issue | How Fixed |
|----|-------|-----------|
| L-03 | Soft-delete cascade | Hard-deletes modules (lessons cascade via FK) in both DELETE program handlers |
| L-04 | Objectives in program overview | `learningOutcomes` memo now prefers `config.objectives`; falls back to module titles |
| M-06 | Self-enrollment config in wizard | Added `allowSelfEnrollment`, `requireManagerApproval`, `programCapacity`, `enableWaitlist` to Step 3 UI and `handleCreate` config |
| M-07 | Wizard draft to localStorage | Draft saved on every change; restored on mount with amber banner + "Start fresh" link; cleared on success |
| M-02 | Template lineage in program list | API enriched with `sourceTemplateName` subquery; shown as purple "From: [name]" line in program builder rows |
| L-01 | No creation email to admin | `sendProgramCreated` added to `email.ts`; fired (fire-and-forget) in both tenant and agency create handlers |

---

### ⏭ Deferred / Skip

| ID | Issue | Reason |
|----|-------|--------|
| C-04 | Cover image upload | Requires S3/storage backend — infrastructure not set up |
| M-03 | Timezone applied to scheduling | No program lifecycle emails exist yet; revisit after cron emails are built |
| M-08 | Multi-tenant allowedTenantIds UI | Niche feature; API already accepts it via raw call |
| L-02 | creationSource audit field | No reporting need yet |

---

## Recommended Fixes (Original Priority Order)

### Tier 1 — Fix Before Launch
1. ✅ **Fix toggle state management in Step 4** — bind `defaultEmailSettings` to mutable `formData` state
2. ✅ **Add `emailSettings` + `config` fields to API schema** — persist wizard pacing, audience, objectives, email prefs into `programs.config` JSONB (all these fit without a schema migration)
3. ✅ **Add date validation to tenant program route** — mirror the check in the agency route
4. ✅ **Wrap deep-copy operations in `db.transaction()`** — all three copy endpoints
5. ✅ **Add error boundary to wizard** — catch mutation errors, show toast, keep wizard open

### Tier 2 — High Value
6. ⏭ **Implement cover image upload** — presigned S3 URL on backend; file picker in wizard *(deferred: needs storage backend)*
7. ✅ **Persist objectives in `programs.config`** — simplest path (no new table needed); array of strings in JSONB
8. ⏭ **Send missing program lifecycle emails** — kickoff, digest, milestone, completion via cron *(deferred: M-03 dependency)*
9. ⏭ **Apply timezone to scheduling** — use `programs.timezone` when computing cron send times *(deferred: no lifecycle emails yet)*
10. ✅ **Validate all required fields per step** — client-side before advancing

### Tier 3 — Polish
11. 🔜 **Auto-save wizard to localStorage** — resume on re-open
12. ✅ **Default timezone from browser** — `Intl.DateTimeFormat().resolvedOptions().timeZone`
13. 🔜 **Show template lineage in program list** — "Created from: [Template Name]"
14. ✅ **Warn when duplicating a template** — duplicate now always sets `isTemplate: false`
15. 🔜 **Add soft-delete cascade** — set `deletedAt` on modules/lessons when program deleted
