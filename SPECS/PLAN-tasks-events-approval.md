# Plan: Tasks-Within-Lessons, Approval-as-Task-Attribute, Events-as-Module-Peers

## Status: All 6 Phases Complete

## Summary of Changes

Three structural changes to the program data model:
1. **Tasks within lessons** — A lesson holds content + multiple tasks with their own response types and completion tracking
2. **Approval as task attribute** — Per-task flag (`none`, `mentor`, `facilitator`, `both`) instead of content types
3. **Events as module peers** — Events sit alongside modules in navigation with distinct styling (blue), date/location/Zoom info

---

## Phase Completion Tracker

### Phase 1: Database Schema Changes — COMPLETE
- [x] Added `module_type` enum (`module`, `event`) and `type` column to modules table
- [x] Added `eventConfig` JSONB column to modules table with `EventConfig` interface
- [x] Created `lesson_tasks` table (id, lessonId, title, description, order, responseType, approvalRequired, points, config, status)
- [x] Created `task_progress` table (id, taskId, enrollmentId, status, submissionData, pointsEarned, completedAt)
- [x] Added `taskId` column to `approval_submissions`
- [x] Updated relations and exports in `packages/db/src/schema/programs/`
- [x] Migration generated and run

**Files created:**
- `packages/db/src/schema/programs/tasks.ts`

**Files modified:**
- `packages/db/src/schema/programs/modules.ts`
- `packages/db/src/schema/programs/lessons.ts`
- `packages/db/src/schema/programs/progress.ts`
- `packages/db/src/schema/programs/index.ts`

---

### Phase 2: API Routes — COMPLETE
- [x] Task CRUD endpoints (POST/PATCH/DELETE + reorder) within programs.ts
- [x] Include `tasks[]` in GET program detail response
- [x] Module CRUD accepts `type` and `eventConfig`
- [x] Task completion endpoint (PUT complete) with cascade to lesson_progress
- [x] Task approval endpoint (POST approve)
- [x] Task progress query endpoint (GET task-progress)
- [x] Agency route variants in agencies.ts

**Files modified:**
- `packages/api/src/routes/programs.ts`
- `packages/api/src/routes/progress.ts`
- `packages/api/src/routes/agencies.ts`

---

### Phase 3: Frontend Types & Hooks — COMPLETE
- [x] New types: `TaskResponseType`, `ModuleType`, `EventConfig`, `LessonTask`, `TaskProgressData`, `TaskWithProgress`
- [x] Updated interfaces: `Module` (type, eventConfig), `Lesson` (tasks[]), `CreateModuleInput`, `UpdateModuleInput`
- [x] New hooks: `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useCompleteTask`, `useTaskProgress`
- [x] Agency hook variants: `useCreateAgencyTask`, `useUpdateAgencyTask`, `useDeleteAgencyTask`

**Files modified:**
- `packages/web/src/types/programs.ts`
- `packages/web/src/hooks/api/usePrograms.ts`
- `packages/web/src/hooks/api/useAgencyPrograms.ts`

---

### Phase 4: Builder UI — COMPLETE
- [x] Event support in CurriculumTab sidebar (Calendar icon, blue styling, "EVENT" label)
- [x] "Add Event" button alongside "Add Module"
- [x] EventEditor component for event configuration (schedule, location, Zoom, video)
- [x] TaskEditor component integrated into lesson editor
- [x] Task CRUD wired up with proper agency/tenant context switching

**Files created:**
- `packages/web/src/components/programs/EventEditor.tsx`
- `packages/web/src/components/programs/TaskEditor.tsx`

**Files modified:**
- `packages/web/src/components/programs/CurriculumTab.tsx`

---

### Phase 5: Learner UI — COMPLETE
- [x] Events in LearnerSidebar with blue Calendar icon, "EVENT" label, date display
- [x] EventContent component (info cards: date/time/location/Zoom, description, embedded video)
- [x] TaskList component within lessons (progress bar, per-task completion, approval status)
- [x] Learn page updated: EventContent for events, TaskList for lessons with tasks
- [x] Bottom nav: hidden for events, "Complete all tasks" message when tasks present
- [x] Task completion cascade: task → lesson auto-complete

**Files created:**
- `packages/web/src/components/programs/lesson-content/EventContent.tsx`
- `packages/web/src/components/programs/lesson-content/TaskList.tsx`

**Files modified:**
- `packages/web/src/components/programs/LearnerSidebar.tsx`
- `packages/web/src/components/programs/lesson-content/index.ts`
- `packages/web/src/components/programs/index.ts`
- `packages/web/src/app/(dashboard)/programs/[programId]/learn/page.tsx`

---

### Phase 6: Seed Data Rework — COMPLETE
- [x] Added TaskDef/EventDef interfaces and createEvent helper
- [x] Module 0: 3 lessons → 1 lesson + 2 tasks (Profile picture upload, Watch Get Started video)
- [x] Module 1: "Complete Assessment" moved to task on Welcome lesson
- [x] 3 Events created: Program Kickoff (order 3), MidPoint Session (order 7), Final Session (order 12)
- [x] LS-01: Removed placeholder video URL
- [x] LS-02: Added 4 bonus DISC video resource URLs
- [x] LS-05: Added Zoom meeting details to kickoff event
- [x] Seed runs successfully: 11 modules + 3 events, tasks on Modules 0 and 1

**Files modified:**
- `packages/db/src/seed-leadershift.ts`

---

## Audit Issues Status

| ID | Issue | Status |
|----|-------|--------|
| LS-01 | Placeholder video URL in Module 0 | FIXED — removed |
| LS-02 | Missing 4 bonus DISC video URLs | FIXED — added as resources |
| LS-03 | Missing real video URLs for lesson content | OPEN — requires real URLs |
| LS-04 | Missing 7 kickoff video URLs | OPEN — requires real URLs |
| LS-05 | Missing meeting time/Zoom for kickoff | FIXED — added to event |

---

## Remaining Work (Not in Original Plan)

- [ ] Many lessons in the spec have per-video "Click Finish Task" tasks not yet converted to the new task system (only Module 0 and Module 1 tasks were converted)
- [ ] Real video URLs needed for all modules (LS-03, LS-04)
- [ ] Dashboard schedule widget integration with events (stretch goal)
- [ ] TaskCard.tsx and TaskItem.tsx were mentioned in plan but functionality was absorbed into TaskEditor.tsx and TaskList.tsx respectively
