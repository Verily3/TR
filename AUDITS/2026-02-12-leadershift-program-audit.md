# LeaderShift Program Audit: Spec vs Implementation

**Date:** 2026-02-12
**Spec Document:** `screenshots/LeadershiftProgramBuildOut.txt`
**Seed File:** `packages/db/src/seed-leadershift.ts`
**Learner View:** `/programs/[programId]/learn`

---

## Executive Summary

| Metric | Spec | Seed | Match |
|--------|------|------|-------|
| Total Modules | 9 modules + 2 events = 11 sections | 11 modules (0-10) | YES |
| Total Lessons/Tasks | ~73 content items + tasks | 73 lessons | YES |
| Video Lessons with URLs | 18 unique videos | 14 embedded video URLs | PARTIAL |
| Content Types Used | N/A (flat text) | 6 types (lesson, text_form, assignment, goal, mentor_approval, facilitator_approval, mentor_meeting) | N/A |

**Overall Match: ~90%** — The seed faithfully recreates the program structure. The main gaps are missing video URLs in 2 modules and missing resource attachments.

---

## Module-by-Module Comparison

### Module 0 / Spec Module 1: Introduction to the Results Tracking Platform

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Welcome text + video | "Welcome to the Results Tracking Platform" | lesson | PARTIAL |
| Task: Profile picture upload | "Upload Your Profile Picture" | facilitator_approval | YES |
| Task: Watch "Get Started" video | 'Watch the "Get Started" Video' | facilitator_approval | YES |

**Issues:**
- [ ] **LS-01**: Welcome lesson uses `placeholder.com/get-started` instead of actual video URL. The spec says "**Video included here" without a URL, so no URL is available, but the placeholder is misleading. Should either use a real orientation video or remove the videoUrl field entirely.

---

### Module 1 / Spec Module 2: Welcome to LeaderShift!

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Welcome video (vimeo/910093966) | "Welcome to LeaderShift!" | lesson | YES |
| Task: Challenges & Frustrations Worksheet | "Challenges & Frustrations Worksheet" | assignment | YES |
| Content 2: Assessment completion | "Complete Your Assessment" | facilitator_approval | YES |
| Content 3: DISC Intro (vimeo/948880657) | "An Introduction to DISC" | lesson | YES |
| Content 4: DISC Model (vimeo/948880634) | "Understanding the DISC Model" | lesson | YES |
| Content 5: Report Insights (share w/ peers) | "DISC Report Insights" | text_form (discussion) | YES |
| Content 6: Bonus Resources (4 videos) | "Bonus Resources" | lesson | PARTIAL |
| Resource: DISC Cheat Sheet | — | — | MISSING |

**Issues:**
- [ ] **LS-02**: "Bonus Resources" lesson has no video URLs or downloadable resources. Spec lists 4 bonus videos:
  - "Getting to Know High Blue (High C)"
  - "Getting to Know the GREEN (High S)"
  - "Getting to Know the RED (High D)"
  - "Getting to Know the Yellow (High I)"
  These should be added as `content.resources[]` entries (URLs not provided in spec — may need to be sourced).
- [ ] **LS-03**: DISC Cheat Sheet resource is listed in the spec but not included in the seed. Should be added as a resource on the "An Introduction to DISC" lesson or the module level.

---

### Module 2 / Spec Module 3: Milestone — You're Ready for Your First Meeting!

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Pre-meeting checklist | "Pre-Meeting Checklist" | lesson | YES |
| Content 1: Kickoff Resources (8 videos) | "Kickoff Resources" | lesson | PARTIAL |
| Content 2: Session (Zoom meeting) | "Program Kickoff Session" | mentor_meeting | YES |
| Content 3: Goal #1 | "Leadership Development Goal #1" | goal | YES |
| Content 3: Goal #2 | "Leadership Development Goal #2" | goal | YES |
| Content 3: Goal #3 | "Leadership Development Goal #3" | goal | YES |
| Task: Manager Review (Coach Approves) | "Manager Review" | mentor_approval | YES |

**Issues:**
- [ ] **LS-04**: Kickoff Resources lesson only embeds 1 of 8 video URLs as the iframe video (`910101196`). The other 7 are listed as text bullets in `mainContent` but are **not playable**. Missing embedded videos:

  | # | Title | Vimeo URL | Status |
  |---|---|---|---|
  | 1 | How to view your problems/challenges | `910101196` | Embedded as iframe |
  | 2 | Leadership & The Ceiling of Complexity | `910109887` | Text only |
  | 3 | Understanding Your Roles as a Leader | `910112969` | Text only |
  | 4 | The Accountability Support Matrix | `910115718` | Text only |
  | 5 | COI/COC Video | `910118272` | Text only |
  | 6 | Learn Defend Choice | `910133514` | Text only |
  | 7 | Management by the Ideal | `949634342` | Text only |
  | 8 | Charting the Course | `949633965` | Text only |

  **Fix options:**
  - **(A)** Split into 8 separate video lessons (one per video) — more granular tracking
  - **(B)** Add videos 2-8 as `content.resources[]` with playable links — keeps single lesson
  - **(C)** Add all 8 URLs as `content.keyConcepts[]` with embedded video support — requires UI change

- [ ] **LS-05**: Program Kickoff Session (mentor_meeting) does not include meeting time (spec says "13:30 - 15:00") or Zoom details. The seed `content.agenda` field could include this info.

---

### Module 3 / Spec Module 4: The Leader and The Manager

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting (Action Step) | "My Action Step" | text_form | YES |
| Content 2: Video: Leader & Manager (948391797) | "Video: The Leader and The Manager" | lesson | YES |
| Content 3: Video: Vision & Goals (948396986) | "Video: Vision and Goals" | lesson | YES |
| Content 4: Video: Qualities (948399430) | "Video: Qualities of Leadership" | lesson | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: Coach Meeting (Coach Approves) | "Coach Meeting" | mentor_approval | YES |

**Match: 100%** — All content, video URLs, and tasks are correctly implemented.

---

### Module 4 / Spec Module 5: Leading Yourself

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting | "My Action Step" | text_form | YES |
| Content 2: Time As A Resource (948747767) | "Video: Time As A Resource" | lesson | YES |
| Content 3: Truth About Time (948747730) | "Video: The Truth About Time" | lesson | YES |
| Content 4: The Path Forward (948747703) | "Video: The Path Forward" | lesson | YES |
| Content 5: Roadblocks (948747703) | "Video: Roadblocks and Obstacles" | lesson | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: High Payoff Activities | "High Payoff Activities" | text_form | YES |
| Task: Coach Meeting | "Coach Meeting" | mentor_approval | YES |

**Match: 100%** — All content correct.

> **Note:** "Roadblocks and Obstacles" uses the same Vimeo URL (948747703) as "The Path Forward". This matches the spec document, so it may be an error in the original source material, not in the seed.

---

### Module 5 / Spec Module 6: Planning Performance

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting | "My Action Step" | text_form | YES |
| Content 2: Video: Planning Performance (948754156) | "Video: Planning Performance" | lesson | YES |
| Content 3: Create Position Scorecard | "Create Your Position Scorecard" | assignment | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: Skill Practice | "Planning Performance Skill Practice" | facilitator_approval | YES |
| Task: What went well | "What went well in your coaching session?" | text_form | YES |
| Task: What differently | "What would you do differently next time?" | text_form | YES |
| Task: Coach Meeting | "Coach Meeting" | mentor_approval | YES |

**Match: 100%** — All content correct.

---

### Module 6 / Spec MidPoint Event: Coaching For Improved Performance

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting | "My Action Step" | text_form | YES |
| Content 2: Mid Term Assessment | "Mid-Term Self Assessment" | facilitator_approval | YES |
| Content 3: Video: Coaching (948757060) | "Video: Coaching For Improved Performance" | lesson | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: Skill Practice | "Coaching To Improve Performance Skill Practice" | facilitator_approval | YES |
| Task: What went well | "What went well in your coaching session?" | text_form | YES |
| Task: What differently | "What would you do differently next time?" | text_form | YES |
| Task: Coach Meeting | "Coach Meeting" | mentor_approval | YES |

**Match: 100%** — All content correct.

---

### Module 7 / Spec Module 7: Coaching For Development

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting | "My Action Step" | text_form | YES |
| Content 2: Video: Coaching Dev (948758472) | "Video: Coaching For Development" | lesson | YES |
| Content 3: Video: Stockdale (948758460) | "Video: The Stockdale Paradox" | lesson | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: Identifying Motivators Skill Practice | "Identifying Motivators Skill Practice" | facilitator_approval | YES |
| Task: What went well | "What went well in your coaching session?" | text_form | YES |
| Task: What differently | "What would you do differently next time?" | text_form | YES |
| Task: Coach Meeting | "Coach Meeting" | mentor_approval | YES |

**Match: 100%** — All content correct.

---

### Module 8 / Spec Module 8: Leading A Team

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting | "My Action Step" | text_form | YES |
| Content 2: Video: Leading A Team (948748732) | "Video: Leading A Team" | lesson | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: Food For Thought | "Food For Thought" | text_form | YES |
| Task: How will this benefit | "How will this benefit the person, team and you?" | text_form | YES |
| Task: Coach Meeting | "Coach Meeting" | mentor_approval | YES |

**Match: 100%** — All content correct.

---

### Module 9 / Spec Module 9: Counseling and Corrective Action

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting | "My Action Step" | text_form | YES |
| Content 2: Video: Counseling (948776006) | "Video: Counseling and Corrective Action" | lesson | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: Food For Thought | "Food For Thought" | facilitator_approval | YES |
| Task: Coach Meeting | "Coach Meeting" | mentor_approval | YES |

**Match: 100%** — All content correct.

---

### Module 10 / Spec Final Event: Leadership Thinking

| Spec Content | Seed Lesson | Content Type | Match |
|---|---|---|---|
| Content 1: Goal Setting | "My Action Step" | text_form | YES |
| Content 2: Video: Leadership Thinking (948760115) | "Video: Leadership Thinking" | lesson | YES |
| Task: Most Useful Idea | "Most Useful Idea" | text_form | YES |
| Task: Skill Process For Problem Solving | "Skill Process For Problem Solving" | text_form | YES |
| Task: Decision Making | "Decision Making" | text_form | YES |
| Task: Coach Meeting | "Coach Meeting" | mentor_approval | YES |
| Task: Write celebration letter | "Write Your Celebration Letter" | text_form | YES |

**Match: 100%** — All content correct. Coach Meeting has customized final-program content.

---

## Issues Summary

| ID | Severity | Module | Issue | Status |
|----|----------|--------|-------|--------|
| LS-01 | Low | 0 | Welcome video uses placeholder URL | [ ] |
| LS-02 | Medium | 1 | 4 Bonus DISC videos missing from resources | [ ] |
| LS-03 | Low | 1 | DISC Cheat Sheet resource not included | [ ] |
| LS-04 | High | 2 | 7 of 8 Kickoff videos are text-only, not playable | [ ] |
| LS-05 | Low | 2 | Kickoff Session missing meeting time/Zoom details | [ ] |

### Severity Breakdown
- **High:** 1 (7 unplayable kickoff videos)
- **Medium:** 1 (missing bonus resources)
- **Low:** 3 (placeholder URL, missing resource, missing meeting details)

---

## Video URL Verification

All Vimeo video URLs in the seed match the spec document exactly:

| Video | Spec URL | Seed URL | Match |
|-------|----------|----------|-------|
| Welcome to LeaderShift | vimeo.com/910093966 | player.vimeo.com/video/910093966 | YES |
| Intro to DISC | vimeo.com/948880657 | player.vimeo.com/video/948880657 | YES |
| Understanding DISC | vimeo.com/948880634 | player.vimeo.com/video/948880634 | YES |
| Kickoff Video 1 | player.vimeo.com/video/910101196 | player.vimeo.com/video/910101196 | YES |
| Leader & Manager | vimeo.com/948391797 | player.vimeo.com/video/948391797 | YES |
| Vision & Goals | vimeo.com/948396986 | player.vimeo.com/video/948396986 | YES |
| Qualities of Leadership | vimeo.com/948399430 | player.vimeo.com/video/948399430 | YES |
| Time As A Resource | vimeo.com/948747767 | player.vimeo.com/video/948747767 | YES |
| Truth About Time | vimeo.com/948747730 | player.vimeo.com/video/948747730 | YES |
| The Path Forward | vimeo.com/948747703 | player.vimeo.com/video/948747703 | YES |
| Roadblocks* | vimeo.com/948747703 | player.vimeo.com/video/948747703 | YES* |
| Planning Performance | vimeo.com/948754156 | player.vimeo.com/video/948754156 | YES |
| Coaching for Performance | vimeo.com/948757060 | player.vimeo.com/video/948757060 | YES |
| Coaching for Development | vimeo.com/948758472 | player.vimeo.com/video/948758472 | YES |
| Stockdale Paradox | vimeo.com/948758460 | player.vimeo.com/video/948758460 | YES |
| Leading A Team | vimeo.com/948748732 | player.vimeo.com/video/948748732 | YES |
| Counseling | vimeo.com/948776006 | player.vimeo.com/video/948776006 | YES |
| Leadership Thinking | vimeo.com/948760115 | player.vimeo.com/video/948760115 | YES |

> *Roadblocks uses the same URL as The Path Forward — this matches the spec and may be an error in the original source material.

**Missing from seed (text-only in Kickoff Resources):**

| Video | Vimeo ID | Status |
|-------|----------|--------|
| Leadership & Ceiling of Complexity | 910109887 | Not embedded |
| Understanding Roles as Leader | 910112969 | Not embedded |
| Accountability Support Matrix | 910115718 | Not embedded |
| COI/COC | 910118272 | Not embedded |
| Learn Defend Choice | 910133514 | Not embedded |
| Management by the Ideal | 949634342 | Not embedded |
| Charting the Course | 949633965 | Not embedded |

---

## Content Type Mapping Analysis

The seed maps spec content to appropriate content types:

| Spec Pattern | Seed Content Type | Appropriate? |
|---|---|---|
| Video + "Finish Task" button | `lesson` (video) | YES |
| "Download and complete" worksheet | `assignment` | YES |
| "Click Finish Task" confirmation | `facilitator_approval` | YES |
| Comment/share with peers | `text_form` (discussion enabled) | YES |
| Leadership Goals (structured) | `goal` | YES |
| Coach Meeting (Coach Approves) | `mentor_approval` | YES |
| Kickoff Session (Zoom) | `mentor_meeting` | YES |
| Action Steps (repeating) | `text_form` | YES |
| Food For Thought reflections | `text_form` | YES |

All content type mappings are appropriate and well-chosen.

---

## Learner View Rendering Assessment

Based on analysis of the LMS page components:

| Content Type | Renderer | Renders Correctly? |
|---|---|---|
| lesson (video) | VideoContent | YES — Vimeo URLs converted to iframe embeds |
| lesson (reading) | ReadingContent | YES — HTML mainContent rendered |
| text_form | DiscussionContent / SubmissionContent | YES — based on enableDiscussion flag |
| assignment | AssignmentContent | YES — questions displayed as cards |
| goal | GoalContent | YES — SMART goal form |
| mentor_meeting | MeetingContent | YES — agenda, discussion questions |
| mentor_approval | ApprovalContent | YES — textarea + submit for approval |
| facilitator_approval | ApprovalContent | YES — "Mark as Done" button |

All content types have working renderers. The video-utils module correctly converts `player.vimeo.com/video/ID` URLs to embeddable iframes.

---

## Recommendations

### Priority 1 (High): Fix Kickoff Videos (LS-04)
Split "Kickoff Resources" into individual lessons or add videos as `content.resources[]`:

```typescript
// Option B: Add as resources (recommended — keeps module concise)
{
  title: 'Kickoff Resources',
  contentType: 'lesson',
  content: {
    introduction: '...',
    videoUrl: 'https://player.vimeo.com/video/910101196',
    mainContent: '...',
    resources: [
      { title: 'Leadership & The Ceiling of Complexity', url: 'https://player.vimeo.com/video/910109887', type: 'video' },
      { title: 'Understanding Your Roles as a Leader', url: 'https://player.vimeo.com/video/910112969', type: 'video' },
      { title: 'The Accountability Support Matrix', url: 'https://player.vimeo.com/video/910115718', type: 'video' },
      { title: 'COI/COC Video', url: 'https://player.vimeo.com/video/910118272', type: 'video' },
      { title: 'Learn Defend Choice', url: 'https://player.vimeo.com/video/910133514', type: 'video' },
      { title: 'Management by the Ideal', url: 'https://player.vimeo.com/video/949634342', type: 'video' },
      { title: 'Charting the Course', url: 'https://player.vimeo.com/video/949633965', type: 'video' },
    ],
  },
}
```

### Priority 2 (Medium): Add Bonus DISC Resources (LS-02)
Add the 4 bonus video titles as resources on the "Bonus Resources" lesson. URLs are not in the spec — they may need to be sourced from the original platform.

### Priority 3 (Low): Clean Up Minor Items (LS-01, LS-03, LS-05)
- Remove placeholder video URL or replace with real orientation video
- Add DISC Cheat Sheet as a resource (PDF link needed)
- Add meeting time/Zoom info to Kickoff Session content
