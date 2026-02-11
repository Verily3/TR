# Program Builder System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Entry Points & Navigation](#entry-points--navigation)
4. [Program Creation Wizard](#program-creation-wizard)
5. [Program Builder Editor](#program-builder-editor)
6. [Tab-by-Tab Breakdown](#tab-by-tab-breakdown)
7. [Design System & Patterns](#design-system--patterns)
8. [Example Data & Content](#example-data--content)
9. [Workflows](#workflows)
10. [AI Integration Points](#ai-integration-points)
11. [Best Practices](#best-practices)

---

## Overview

### Purpose
The Program Builder is a comprehensive LMS authoring tool designed for the "Results Tracking System" platform. It enables administrators to create, manage, and deliver cohort-based or self-paced learning programs with integrated coaching, goals, and progress tracking.

### Philosophy
- **Executive-first UX**: High whitespace, clear hierarchy, "finance dashboard" aesthetic
- **One-click clarity**: Each interface element has a single, obvious action
- **Progressive disclosure**: Complexity revealed only when needed
- **AI-augmented**: Smart suggestions throughout the creation process
- **Content reusability**: Template library for emails and learning content

### Design Language
- **Colors**: Navy/charcoal tones with red accent (`--accent`)
- **Spacing**: Generous whitespace, 8px grid system
- **Typography**: Clear hierarchy, minimal font sizes (default system sizes)
- **Components**: Consistent toggle switches, bordered cards, subtle backgrounds
- **Border radius**: `rounded-lg` (8px) for all cards, buttons, inputs
- **Shadows**: Minimal, only on modals (`shadow-lg`)

---

## System Architecture

### Component Hierarchy
```
Programs (Main View)
├── Program Creation Wizard (Modal)
│   ├── Step 1: Basic Information
│   ├── Step 2: Learning Objectives
│   ├── Step 3: Schedule & Dates
│   ├── Step 4: Communication Settings
│   ├── Step 5: Target Audience & Prerequisites
│   └── Step 6: Review & Create
│
└── Program Builder Editor (Full Screen)
    ├── Header (Back, Title, Save, Preview, Publish)
    ├── Tab Navigation (6 tabs)
    ├── Curriculum Tab
    │   ├── Module List (Accordion)
    │   ├── Lesson Editor
    │   └── AI Assistant
    ├── Participants Tab
    │   ├── Overview Stats
    │   ├── Participant List
    │   ├── Role Assignment
    │   └── Bulk Import
    ├── Info Tab (5 sections)
    │   ├── Basic Information
    │   ├── Learning Objectives
    │   ├── Schedule & Dates
    │   ├── Communication
    │   └── Settings & Config
    ├── Goals Tab
    ├── Resources Tab
    └── Reports Tab
```

---

## Entry Points & Navigation

### From Programs Main View
1. **"+ Create Program" button** → Opens 6-step wizard
2. **Program card click** → Opens Program Builder Editor
3. **"Duplicate" action** → Creates copy, opens editor

### Navigation Patterns
- **Back arrow** (top-left): Returns to Programs view
- **Tab switching**: Horizontal navigation, active tab highlighted with red underline
- **Modal overlays**: Used for add/edit operations (modules, lessons, participants)
- **Breadcrumbs**: Not used; single back action provides context

---

## Program Creation Wizard

### Overview
A **6-step modal wizard** that guides users through initial program setup. Launched from Programs main view.

### Modal Specifications
- **Size**: `max-w-4xl` (672px max width)
- **Layout**: Fixed header, scrollable content, sticky footer
- **Navigation**: Step indicators at top, Previous/Next buttons in footer

---

### Step 1: Basic Information

**Purpose**: Establish core program identity

**Fields**:
1. **Internal Name** (required)
   - Placeholder: `e.g., Q1-2026-Leadership-Cohort-A`
   - Help text: "For internal tracking and reporting (not visible to learners)"
   
2. **Program Title** (required)
   - Placeholder: `e.g., LeaderShift`
   - Help text: "Choose a clear, memorable name for your program"
   
3. **Cover Image** (optional)
   - Upload area with drag-drop support
   - File types: PNG, JPG up to 5MB
   - Recommended: 1200x600px
   - Preview with remove button on hover
   
4. **Description** (required)
   - Textarea, 4 rows
   - Placeholder: "Describe the program's purpose..."
   - Help text: "This will appear on the program overview and in program listings"
   
5. **Learning Track** (required)
   - Dropdown: Leadership Track, Management Track, Technical Skills, etc.

**AI Feature**:
- **AI Smart Builder** suggestion box (accent background, Sparkles icon)
- Action: "Generate Program Structure →"
- Offers to analyze inputs and suggest module structure

---

### Step 2: Learning Objectives

**Purpose**: Define measurable learning outcomes

**Fields**:
1. **Objectives 1-3** (required)
   - Textarea inputs (2 rows each)
   - Placeholder: "e.g., Distinguish between leadership and management responsibilities"
   - Numbered labels: "Objective 1", "Objective 2", etc.
   
2. **Additional Objectives** (optional)
   - "→ Add Another Objective" button
   - Can add unlimited objectives

**Best Practice Tip**:
- Blue info box (Info icon)
- Explains: Start with action verbs, focus on measurable outcomes

**AI Feature**:
- **AI Objective Optimizer**
- Action: "Optimize Objectives →"
- Refines objectives for clarity and measurability

---

### Step 3: Schedule & Dates

**Purpose**: Set program timeline and pacing model

**Program Type Selection** (required):
- **Radio cards** (2-column grid):
  1. **Cohort-Based**: Fixed start/end dates, everyone together
  2. **Self-Paced**: Learners progress individually

**Cohort-Based Settings**:
1. **Program Start Date** (required)
   - Date picker input
   
2. **Program End Date** (required)
   - Date picker input
   
3. **Calculated Duration** (auto-display)
   - Blue info box with Clock icon
   - Shows: "Program Duration: X weeks"
   
4. **Allow Individual Pacing** (toggle)
   - Description: "Let learners start at different times within cohort period"
   - When enabled, shows:
     - Start Offset (days after enrollment)
     - Deadline Flexibility (days)

**Self-Paced Settings**:
1. **Estimated Duration**
   - Number input + "weeks" label
   - Help text: "Typical time for learners to complete at their own pace"

**Time Zone** (both types):
- Dropdown with major time zones
- Help text: "Used for scheduling emails and displaying deadlines"

**AI Feature**:
- **AI Duration Calculator**
- Action: "Calculate Optimal Duration →"
- Suggests optimal length based on objectives

---

### Step 4: Communication Settings

**Purpose**: Configure automated email communications

**Email Types** (toggleable sections):

1. **Welcome Email**
   - Toggle: enabled/disabled
   - When enabled:
     - Days before start (number input)
     - Custom message (textarea, 3 rows, optional)
     - **Content Library** button (Library icon)
     - **AI Draft** button (Sparkles icon)

2. **Program Kickoff Email**
   - Toggle: enabled/disabled
   - Sent on program start date
   - Custom message field with library/AI options

3. **Lesson Due Date Reminders** ⭐ NEW ENHANCED
   - Master toggle: enabled/disabled
   - When enabled, shows TWO sections:
   
   **Before Due Date**:
   - Individual toggles for each timing:
     - 2 weeks before due date
     - 1 week before due date
     - 3 days before due date
     - 1 day before due date
     - Day of due date
   
   **After Due Date (Overdue)**:
   - Individual toggles for each timing:
     - 1 day after due date
     - 3 days after due date
     - 1 week after due date
   
   - Shared custom message field for all reminders
   - Content Library and AI Draft buttons

4. **Weekly Progress Digest**
   - Toggle: enabled/disabled
   - Day of week dropdown (Monday-Friday)
   - Summary of progress and upcoming content

5. **Inactivity Reminder**
   - Toggle: enabled/disabled
   - Days inactive threshold (number input)
   - Re-engages dormant learners

6. **Milestone Celebration Emails**
   - Toggle: enabled/disabled
   - Displays milestone badges: 25%, 50%, 75%, 100%
   - Sent when learner reaches completion milestones

7. **Completion Email**
   - Toggle: enabled/disabled
   - Congratulates on program completion

8. **Mentor/Manager Summary**
   - Toggle: enabled/disabled
   - Report frequency dropdown (weekly/bi-weekly/monthly)
   - Sends progress reports to mentors/managers

**Design Pattern**:
- Each email type is a bordered card (`bg-muted/30`)
- Header row: Title/description on left, toggle on right
- Expanded content appears below when enabled
- Consistent spacing and typography throughout

---

### Step 5: Target Audience & Prerequisites

**Purpose**: Define enrollment criteria and requirements

**Fields**:
1. **Target Audience** (required)
   - Textarea, 3 rows
   - Examples: Department, job level, tenure
   
2. **Prerequisites** (optional)
   - Multi-select or tag input
   - Can reference other programs or requirements
   
3. **Recommended For** (optional)
   - Textarea, 2 rows
   - Additional context for who benefits most

**Auto-Enrollment Rules**:
- Can be set here or later in Settings & Config
- Links to HRIS/role data for automatic enrollment

---

### Step 6: Review & Create

**Purpose**: Final review and confirmation

**Layout**:
- Summary cards for each previous step
- Displays key information:
  - Program title, track, type
  - Number of objectives
  - Start/end dates or duration
  - Enabled email communications
  - Target audience

**Actions**:
- **"← Back to Edit"** button
- **"Create Program"** primary button (accent color)

**Post-Creation**:
- Closes wizard
- Opens Program Builder Editor
- Shows success message: "Program created successfully"
- User lands on **Curriculum tab** to start building content

---

## Program Builder Editor

### Overview
Full-screen editing environment for program management. Accessed after wizard completion or by clicking existing program card.

### Header Structure

**Left Section**:
- **← Back arrow**: Returns to Programs view
- **Program title**: Displays program name
- **Status badge**: Draft/Published/Archived (colored pill)

**Right Section**:
- **"Save Changes"** button (secondary style)
- **"Preview"** button (Eye icon, secondary)
- **"Publish Program"** button (primary, accent color)
  - Changes to "Unpublish" when published

**Behavior**:
- Header is fixed/sticky during scroll
- Save button shows checkmark on successful save
- Auto-save draft every 60 seconds (optional)

---

### Tab Navigation

**Tabs** (left to right):
1. **Curriculum** (default)
2. **Participants**
3. **Info**
4. **Goals**
5. **Resources**
6. **Reports**

**Design**:
- Horizontal tabs below header
- Active tab: Red underline (2px, accent color)
- Inactive tabs: Gray text, hover shows darkening
- Text-only labels (no icons in tab bar)

**Navigation Behavior**:
- Click to switch tabs
- Content area updates instantly
- No confirmation if unsaved changes (relies on auto-save or save prompt)

---

## Tab-by-Tab Breakdown

### 1. Curriculum Tab

**Purpose**: Build learning content structure (modules and lessons)

**Layout**: Two-panel design
- **Left Panel** (40%): Module/lesson tree
- **Right Panel** (60%): Lesson editor or AI assistant

---

#### Left Panel: Module Tree

**Structure**:
- Accordion-style module list
- Each module shows:
  - Grip icon (for drag-reorder)
  - Module title
  - Number of lessons
  - Expand/collapse chevron
  - Three-dot menu (Edit, Duplicate, Delete)
  
**Expanded Module**:
- Shows nested lesson list
- Each lesson displays:
  - Lesson type icon (BookOpen, Video, Users, etc.)
  - Lesson title
  - Duration badge
  - Status badge (Draft/Published)
  - Click to edit in right panel

**Actions**:
- **"+ Add Module"** button (top of panel)
  - Opens modal with:
    - Module title (required)
    - Description (optional)
- **Drag to reorder**: Both modules and lessons within modules
- **Module menu**: Edit, Duplicate, Delete

**Module Add Modal**:
- Title: "Add New Module"
- Fields: Module Title, Description
- Actions: Cancel, Add Module

---

#### Right Panel: Lesson Editor (Enhanced)

**Header**:
- Lesson type icon + title
- Status badge
- **Close** button (returns to AI assistant view)

**Content Mode Selector**:
- Radio toggle:
  - **Shared Content**: Same for all roles
  - **Role-Specific Content**: Different per role (Learner/Mentor/Facilitator)

**Role Tabs** (when role-specific):
- Horizontal tabs: Learner | Mentor | Facilitator
- Each role has independent content fields

**Visibility Settings** (bottom of editor):
- Checkboxes:
  - ☑ Visible to Learners
  - ☑ Visible to Mentors
  - ☑ Visible to Facilitators

---

**Lesson Type Templates**:

Each lesson type shows relevant fields:

1. **Reading Material**:
   - Introduction (textarea)
   - Main Content (rich text editor)
   - Key Concepts (repeatable title + description)
   - Key Takeaway (textarea)
   - Reflection Prompts (list)

2. **Video Content**:
   - Video URL (input)
   - Introduction (textarea)
   - Key Concepts
   - Discussion Questions

3. **Mentor Meeting**:
   - Meeting Agenda (textarea)
   - Discussion Questions (list)
   - Preparation Instructions

4. **Reflection Submission**:
   - Prompt (textarea)
   - Submission Instructions
   - Evaluation Criteria

5. **Assignment**:
   - Instructions (textarea)
   - Questions (list)
   - Submission Format

6. **Goal Setting**:
   - Goal Template (structure)
   - Action Steps Framework
   - Success Metrics

**Save Actions**:
- **"Save & Close"** button (bottom-right)
- **"Save Draft"** button (secondary)
- Auto-saves on blur (debounced)

---

#### Right Panel: AI Assistant (Default)

**When no lesson selected**:
- Shows AI assistant interface
- Sparkles icon header
- Suggestions based on program context:
  - "Generate module outline"
  - "Suggest lesson sequence"
  - "Create reading material for [topic]"
  - "Draft discussion questions"

**Chat Interface**:
- Message input at bottom
- Response appears in chat format
- Can insert generated content directly into lessons

---

### 2. Participants Tab

**Purpose**: Manage program enrollment and role assignments

**Layout**: Single column, max-width 1400px

---

#### Overview Stats Row

Four stat cards (4-column grid):

1. **Total Enrolled**
   - Number + icon
   - Label: "Total Enrolled"
   
2. **Learners**
   - Number + Users icon
   - Label: "Active Learners"
   
3. **Mentors**
   - Number + Users icon
   - Label: "Assigned Mentors"
   
4. **Facilitators**
   - Number + Users2 icon
   - Label: "Facilitators"

**Design**: White cards, border, icon + number layout

---

#### Action Bar

**Search + Filters**:
- Search input (left): "Search by name, email, or role..."
- Filter dropdowns (right):
  - Role filter (All, Learner, Mentor, Facilitator)
  - Status filter (All, Active, Inactive, Completed)

**Bulk Actions**:
- "Import Participants" button (Upload icon)
  - Opens modal with CSV template download
  - Drag-drop upload area
  - Maps CSV columns to system fields
  - Shows preview before import
  
- "Assign Roles" button (Users2 icon)
  - Bulk assign roles to selected participants
  - Allows mentor/facilitator assignment to learners

---

#### Participants Table

**Columns**:
1. **Checkbox**: For bulk selection
2. **Name**: Avatar + full name
3. **Email**: User email address
4. **Role**: Badge (Learner/Mentor/Facilitator)
5. **Status**: Badge (Active/Inactive/Completed)
6. **Progress**: Progress bar + percentage
7. **Actions**: Three-dot menu
   - Change Role
   - Assign Mentor
   - Remove from Program
   - View Progress

**Design**:
- Zebra striping (subtle)
- Hover highlights entire row
- Avatar images circular, 32px
- Role badges color-coded:
  - Learner: Blue
  - Mentor: Green
  - Facilitator: Purple

---

#### Role Assignment Modal

**Triggered by**: "Assign Mentor" action

**Fields**:
1. **Learner** (read-only, pre-filled)
2. **Assign Mentor** (dropdown)
   - Lists all participants with Mentor role
   - Shows name + current mentee count
3. **Notes** (optional textarea)

**Actions**: Cancel, Assign

---

#### Bulk Import Flow

**Step 1: Upload**
- Download CSV template link
- Drag-drop upload area
- File validation

**Step 2: Column Mapping**
- Shows CSV headers
- Dropdown to map to system fields:
  - First Name, Last Name, Email, Role
- Preview mapped data (first 5 rows)

**Step 3: Review & Import**
- Shows full preview table
- Validation warnings (duplicate emails, invalid roles)
- "Import X Participants" button

**Step 4: Confirmation**
- Success message
- Shows count of imported participants
- Updates participant list automatically

---

### 3. Info Tab

**Purpose**: Edit program configuration (mirrors wizard steps)

**Layout**: Single column, max-width 4xl, centered

---

#### Section Navigation

**Horizontal tabs** (5 sections):
1. Basic Information (BookOpen icon)
2. Learning Objectives (Target icon)
3. Schedule & Dates (Calendar icon)
4. Communication (Mail icon)
5. Settings & Config (Settings icon)

**Design**:
- Active: Red background, white text
- Inactive: Gray text, hover shows gray background
- Icon + label in each tab

---

#### Section 1: Basic Information

**Identical to Wizard Step 1**, but in edit mode:
- All fields editable
- Current values pre-filled
- Cover image shows existing with replace option
- AI Smart Builder suggestion box included

**Differences from Wizard**:
- No "required" indicators (already created)
- Can leave fields blank temporarily
- Save button at bottom of entire Info tab (not per section)

---

#### Section 2: Learning Objectives

**Identical to Wizard Step 2**:
- List of current objectives (editable)
- Add/remove objectives
- AI Objective Optimizer available
- Best Practice tip box

---

#### Section 3: Schedule & Dates

**Identical to Wizard Step 3**:
- Program type (can change, with warning if participants exist)
- Dates/duration fields
- Auto-calculated duration display (blue info box)
- Individual pacing settings
- Time zone selector
- AI Duration Calculator

---

#### Section 4: Communication

**Identical to Wizard Step 4**:
- All email type toggles and settings
- Enhanced lesson reminder controls:
  - Before due date (5 options)
  - After due date/overdue (3 options)
- Content Library integration on all email types
- AI Draft option for custom messages

**Content Library Modal**:
- Triggered by "Content Library" button
- Shows email template options:
  - Welcome - Professional
  - Welcome - Casual
  - Reminder - Encouraging
  - (Additional templates as library grows)
- Click template to apply to current field
- Can preview template before applying

---

#### Section 5: Settings & Config ⭐ NEW

**Purpose**: Advanced enrollment and behavior settings

**Three Subsections**:

##### 5.1: Enrollment & Access

Toggleable options (each in bordered card):

1. **Auto-Enrollment**
   - Description: "Automatically enroll users who meet target audience criteria"
   - Toggle (off by default)
   
2. **Require Manager Approval**
   - Description: "Users must get manager approval before enrolling"
   - Toggle (off by default)
   
3. **Allow Self-Enrollment**
   - Description: "Users can enroll themselves without admin approval"
   - Toggle (on by default)
   
4. **Link to Goals**
   - Description: "Allow learners to link this program to their development goals"
   - Toggle (on by default)
   
5. **Issue Certificate**
   - Description: "Award a completion certificate when learners finish the program"
   - Toggle (on by default)

##### 5.2: Capacity Management

Two-column layout:

**Left Column**:
- **Program Capacity** (optional)
  - Number input
  - Placeholder: "Unlimited"
  - Help text: "Maximum number of participants"

**Right Column**:
- **Waitlist** (toggle card)
  - Enable Waitlist toggle
  - Help text: "When capacity is reached"

##### 5.3: Program Behavior

Toggleable options:

1. **Sequential Module Access**
   - Description: "Lock modules until previous modules are completed"
   - Toggle (on by default)
   
2. **Track Completion in Scorecard**
   - Description: "Show program completion in executive scorecard"
   - Toggle (on by default)

---

#### Save Actions (Bottom of Info Tab)

**Two buttons**:
- **"Reset to Defaults"** (secondary, left)
  - Reverts all changes in current section
- **"Save Changes"** (primary, accent, right)
  - Saves all changes across all 5 sections
  - Shows success message on save

---

### 4. Goals Tab

**Purpose**: Link program to organizational goal framework

**Content**:
- Goal alignment interface
- Maps program to strategic goals
- Shows how program completion contributes to goal progress
- Allows setting goal templates for learners

*(Detailed design TBD based on Goals system documentation)*

---

### 5. Resources Tab

**Purpose**: Attach supplementary materials to program

**Content**:
- File upload interface
- Resource library
- Links to external resources
- Downloadable materials for learners

**Features**:
- Drag-drop file upload
- Organize into folders
- Set visibility (learners, mentors, facilitators)
- Preview documents in-browser

*(Detailed design TBD)*

---

### 6. Reports Tab

**Purpose**: View program analytics and participant progress

**Content**:
- Enrollment trends
- Completion rates
- Progress distribution
- Engagement metrics
- Downloadable reports (CSV, PDF)

**Visualizations**:
- Line charts for trends
- Bar charts for comparisons
- Progress gauges
- Participant table with filtering

*(Detailed design TBD based on Reports system)*

---

## Design System & Patterns

### Color Palette

**Semantic Colors** (from theme.css):
- `--accent`: Primary red, used for CTAs, active states, highlights
- `--accent-foreground`: White text on accent background
- `--background`: Main background (light gray/white)
- `--card`: Card background (white)
- `--border`: Border color (light gray)
- `--sidebar-foreground`: Primary text color (dark gray/charcoal)
- `--muted-foreground`: Secondary text color (medium gray)
- `--input-background`: Form input backgrounds
- `--muted`: Subtle backgrounds for hover/disabled states

**Status Colors**:
- Draft: Yellow/gold (`text-yellow-600`)
- Published: Green (`text-green-600`)
- Archived: Gray (`text-gray-400`)

**Role Colors** (Participants):
- Learner: Blue (`bg-blue-100 text-blue-700`)
- Mentor: Green (`bg-green-100 text-green-700`)
- Facilitator: Purple (`bg-purple-100 text-purple-700`)

---

### Typography

**Hierarchy**:
- **H1**: Page titles (not used in builder, only in wizard)
- **H2**: `text-xl` - Section titles (e.g., "Basic Information")
- **H3**: `text-sidebar-foreground` - Subsection titles
- **Body**: Default size, `text-sidebar-foreground` for primary, `text-muted-foreground` for secondary
- **Small**: `text-xs` or `text-sm` - Help text, labels

**Font Weights**:
- Regular (400): Body text
- Medium (500): `font-medium` - Labels, button text
- Semibold (600): Not used (avoid)
- Bold (700): Not used (avoid)

**Best Practice**: Don't use Tailwind font size classes (text-2xl, text-lg, etc.) unless user specifically requests. Use default HTML sizing.

---

### Spacing System

**Based on 8px grid**:
- `p-2` = 8px
- `p-3` = 12px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

**Common Patterns**:
- **Card padding**: `p-6` (24px)
- **Modal padding**: `p-6` (24px)
- **Section spacing**: `space-y-6` (24px vertical)
- **Form field spacing**: `space-y-4` (16px vertical)
- **Button padding**: `px-4 py-2.5` or `px-6 py-2.5`

**Whitespace Philosophy**:
- Generous spacing between sections
- Tighter spacing within related groups
- Never cramped or crowded
- "Breathing room" is intentional

---

### Component Patterns

#### Toggle Switch

**Design**:
- Width: `w-11` (44px)
- Height: `h-6` (24px)
- Thumb: `w-5 h-5` (20px circle)
- Off state: `bg-border` (gray)
- On state: `bg-accent` (red)
- Thumb translates: `translate-x-5` when on

**Usage**: Binary on/off settings

---

#### Bordered Card

**Design**:
```tsx
className="bg-card border border-border rounded-lg p-6"
```

**Usage**: 
- Section containers
- Module/lesson items
- Email configuration blocks
- Setting groups

---

#### Info Box

**Types**:

1. **AI Suggestion** (accent):
```tsx
className="bg-accent/5 border border-accent/20 rounded-lg p-4"
```
- Sparkles icon
- Suggests AI-powered actions

2. **Best Practice** (blue):
```tsx
className="bg-blue-50 border border-blue-200 rounded-lg p-4"
```
- Info icon
- Educational tips

3. **Calculated Value** (blue):
```tsx
className="bg-blue-50 border border-blue-200 rounded-lg p-4"
```
- Clock icon (or relevant icon)
- Shows auto-calculated results

---

#### Buttons

**Primary** (CTA):
```tsx
className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
```

**Secondary** (Cancel/Back):
```tsx
className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
```

**Text Button** (Inline actions):
```tsx
className="text-sm text-accent hover:text-accent/80 font-medium"
```

---

#### Form Inputs

**Text Input**:
```tsx
className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
```

**Textarea**:
- Same as text input, plus:
- `resize-none` (fixed height)
- Height set via `rows` attribute or `h-24` class

**Select Dropdown**:
- Same styling as text input

---

#### Modal Structure

**Container**:
```tsx
className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
```

**Modal Body**:
```tsx
className="bg-card border border-border rounded-lg w-full max-w-[size] mx-4 shadow-lg"
```

**Sections**:
- Header: `p-6 border-b border-border`
- Content: `p-6` (scrollable if needed)
- Footer: `p-6 border-t border-border flex justify-end gap-3`

---

### Icons

**Library**: Lucide React

**Sizing**:
- Default: `w-5 h-5` (20px)
- Small: `w-4 h-4` (16px)
- Large: `w-6 h-6` (24px)

**Common Icons**:
- BookOpen: Reading material
- Video: Video content
- Users: Meetings/mentorship
- Lightbulb: Reflections
- FileText: Assignments
- Target: Goals
- Calendar: Schedule
- Mail: Email/communication
- Settings: Configuration
- Sparkles: AI features
- Library: Content library
- Upload: File uploads
- ChevronRight/ChevronDown: Expand/collapse
- Plus: Add actions
- X: Close/remove

---

## Example Data & Content

### Example Program Creation Wizard

#### Step 1: Basic Information
- **Internal Name**: Q1-2026-Leadership-Cohort-A
- **Program Title**: LeaderShift
- **Cover Image**: Uploaded PNG (1200x600px)
- **Description**: "A comprehensive leadership development program for emerging leaders."
- **Learning Track**: Leadership Track

#### Step 2: Learning Objectives
- **Objective 1**: "Distinguish between leadership and management responsibilities."
- **Objective 2**: "Develop effective communication skills in a team setting."
- **Objective 3**: "Apply strategic thinking to solve complex business problems."

#### Step 3: Schedule & Dates
- **Program Type**: Cohort-Based
- **Program Start Date**: January 1, 2026
- **Program End Date**: March 31, 2026
- **Calculated Duration**: 12 weeks
- **Allow Individual Pacing**: Enabled (Start Offset: 5 days, Deadline Flexibility: 10 days)
- **Time Zone**: UTC

#### Step 4: Communication Settings
- **Welcome Email**: Enabled (Days before start: 7, Custom message: "Welcome to LeaderShift!")
- **Program Kickoff Email**: Enabled (Custom message: "Your program starts today!")
- **Lesson Due Date Reminders**: Enabled (Before due date: 2 weeks, 1 week, 3 days, 1 day, day of; After due date: 1 day, 3 days, 1 week)
- **Weekly Progress Digest**: Enabled (Day of week: Wednesday)
- **Inactivity Reminder**: Enabled (Days inactive threshold: 14)
- **Milestone Celebration Emails**: Enabled (25%, 50%, 75%, 100%)
- **Completion Email**: Enabled (Custom message: "Congratulations on completing LeaderShift!")
- **Mentor/Manager Summary**: Enabled (Report frequency: Weekly)

#### Step 5: Target Audience & Prerequisites
- **Target Audience**: "Emerging leaders in the sales department with 2-5 years of experience."
- **Prerequisites**: "Completion of the Sales Basics program."
- **Recommended For**: "Sales representatives looking to enhance their leadership skills."

#### Step 6: Review & Create
- **Summary**: Displays all entered information
- **Actions**: "← Back to Edit" or "Create Program"

---

## Workflows

### Creating a New Program

**Entry**: Click "+ Create Program" on Programs view

**Steps**:
1. **Wizard Step 1**: Enter basic info → "Next"
2. **Wizard Step 2**: Add 3+ learning objectives → "Next"
3. **Wizard Step 3**: Select program type, set dates → "Next"
4. **Wizard Step 4**: Configure email communications → "Next"
5. **Wizard Step 5**: Define target audience → "Next"
6. **Wizard Step 6**: Review all settings → "Create Program"

**Result**: 
- Wizard closes
- Program Builder Editor opens
- Success message appears
- User lands on Curriculum tab (empty state)

**Next Actions**:
- Add first module
- Add lessons to module
- Configure lesson content

---

### Building Curriculum

**Entry**: Curriculum tab in Program Builder Editor

**Steps**:
1. **Add Module**:
   - Click "+ Add Module"
   - Enter module title and description
   - Click "Add Module"

2. **Add Lessons to Module**:
   - Expand module
   - Click "+ Add Lesson" within module
   - Select lesson type (Reading, Video, Meeting, etc.)
   - Enter lesson title
   - Click "Create"

3. **Edit Lesson Content**:
   - Click lesson in left panel
   - Right panel opens Lesson Editor
   - Choose content mode (Shared or Role-Specific)
   - Fill in content fields based on lesson type
   - Click "Save & Close"

4. **Reorder** (optional):
   - Drag modules to reorder
   - Drag lessons within module to reorder

5. **Use AI Assistant** (optional):
   - Click AI Assistant in right panel
   - Request: "Generate lesson content for [topic]"
   - Review generated content
   - Click "Insert into Lesson"

**Result**: Curriculum structure complete, ready for participants

---

### Managing Participants

**Entry**: Participants tab in Program Builder Editor

**Add Individual Participant**:
1. *(Feature TBD: "+ Add Participant" button)*
2. Enter name, email, role
3. Save

**Bulk Import**:
1. Click "Import Participants"
2. Download CSV template
3. Fill template with participant data
4. Upload CSV file
5. Map CSV columns to system fields
6. Review preview table
7. Click "Import X Participants"
8. Confirm success

**Assign Mentors**:
1. Find learner in participant table
2. Click three-dot menu → "Assign Mentor"
3. Select mentor from dropdown
4. Add notes (optional)
5. Click "Assign"

**Change Roles**:
1. Select participant(s) via checkbox
2. Click "Assign Roles" button
3. Choose new role
4. Confirm change

---

### Editing Program Information

**Entry**: Info tab in Program Builder Editor

**Steps**:
1. Click section tab (1-5) to edit that section
2. Modify fields as needed
3. *(Optional)* Use AI features:
   - AI Smart Builder (Section 1)
   - AI Objective Optimizer (Section 2)
   - AI Duration Calculator (Section 3)
   - AI Draft for emails (Section 4)
4. *(Optional)* Use Content Library for email templates (Section 4)
5. Scroll to bottom of Info tab
6. Click "Save Changes"
7. Confirm success message

**Result**: Program info updated, changes reflected throughout system

---

### Configuring Lesson Reminders

**Entry**: Info tab → Communication section (Section 4)

**Steps**:
1. Find "Lesson Due Date Reminders" card
2. Toggle master switch to **ON**
3. Expand card to see timing options
4. **Before Due Date** section:
   - Toggle on desired reminders (2 weeks, 1 week, 3 days, 1 day, day of)
5. **After Due Date (Overdue)** section:
   - Toggle on desired reminders (1 day, 3 days, 1 week after)
6. *(Optional)* Add custom message in textarea
7. *(Optional)* Click "Content Library" to use template
8. *(Optional)* Click "AI Draft" to generate message
9. Scroll to bottom of Info tab
10. Click "Save Changes"

**Result**: Reminders configured, will send automatically based on lesson due dates

---

### Publishing a Program

**Entry**: Any tab in Program Builder Editor

**Prerequisites**:
- At least 1 module with 1 lesson
- All required Info fields filled (from wizard)

**Steps**:
1. Review curriculum in Curriculum tab
2. Verify participants in Participants tab (optional if allowing self-enrollment)
3. Check Info tab settings
4. Click "Preview" button (optional)
5. Click "Publish Program" button (top-right)
6. Confirm publish action in modal
7. Program status changes to "Published"
8. Participants receive Welcome Email (if configured)

**Result**: 
- Program visible to participants
- Enrollment can begin (based on settings)
- Communications start sending

---

## AI Integration Points

### 1. AI Smart Builder (Wizard Step 1, Info Section 1)

**Location**: Basic Information section

**Trigger**: Click "Generate Program Structure →"

**Functionality**:
- Analyzes program title, description, track
- Suggests optimal module structure
- Recommends number of modules and lesson types
- Provides module titles and descriptions

**Output**: 
- Modal with generated module outline
- User can accept all, accept selected, or dismiss
- Accepted modules pre-populate Curriculum tab

---

### 2. AI Objective Optimizer (Wizard Step 2, Info Section 2)

**Location**: Learning Objectives section

**Trigger**: Click "Optimize Objectives →"

**Functionality**:
- Analyzes current objective text
- Refines for clarity, measurability, action verbs
- Aligns with best practices (Bloom's Taxonomy)

**Output**:
- Shows original vs. optimized objectives side-by-side
- User can accept or reject each suggestion
- Click "Apply Changes" to update objectives

---

### 3. AI Duration Calculator (Wizard Step 3, Info Section 3)

**Location**: Schedule & Dates section

**Trigger**: Click "Calculate Optimal Duration →"

**Functionality**:
- Considers number of learning objectives
- Analyzes typical completion times for lesson types
- Factors in program complexity
- Suggests ideal program length

**Output**:
- Displays recommended duration (e.g., "12 weeks")
- Shows reasoning (e.g., "Based on 3 objectives and 8 lessons")
- User can accept or input custom duration

---

### 4. AI Email Drafting (Wizard Step 4, Info Section 4)

**Location**: Communication section, each email type

**Trigger**: Click "AI Draft" button

**Functionality**:
- Generates contextual email based on:
  - Email type (welcome, reminder, completion)
  - Program title and description
  - Tone preference (professional/casual)
- Uses program-specific details

**Output**:
- Displays generated email text
- User can edit before saving
- Click "Use This Draft" to insert into custom message field

---

### 5. AI Content Generation (Curriculum Tab)

**Location**: Lesson Editor, AI Assistant panel

**Trigger**: 
- Chat input: "Generate [content type] for [topic]"
- Or click suggestion buttons

**Functionality**:
- Generates lesson content:
  - Reading material text
  - Discussion questions
  - Reflection prompts
  - Assignment instructions
  - Key concepts
- Based on lesson type and topic

**Output**:
- Shows generated content in chat
- "Insert into Lesson" button
- Content populates active lesson editor fields

---

### 6. AI Assistant (Curriculum Tab - Default View)

**Location**: Right panel when no lesson selected

**Suggestions Shown**:
- "Generate module outline"
- "Suggest lesson sequence"
- "Create reading material for [detected topic]"
- "Draft discussion questions"
- "Recommend assessment strategy"

**Functionality**:
- Contextual awareness of program and existing modules
- Proactive suggestions based on curriculum state
- Can execute multi-step actions (e.g., create 3 modules at once)

**Output**: Varies based on action, inserts directly into curriculum structure

---

## Best Practices

### UX Principles

1. **Progressive Disclosure**
   - Show essential fields first
   - Expand advanced options only when needed
   - Use toggles to hide/show conditional fields

2. **Clear Hierarchy**
   - One H2 per section
   - Consistent spacing between related groups
   - Visual weight reflects importance

3. **Helpful Defaults**
   - Pre-select common options (e.g., cohort-based)
   - Enable commonly-used emails by default
   - Provide sensible timing defaults (e.g., 7 days before)

4. **Contextual Help**
   - Help text under every field
   - Best practice boxes where relevant
   - AI suggestions for complex tasks

5. **Validation & Feedback**
   - Required fields marked with red asterisk
   - Inline validation on blur
   - Success messages after save
   - Error messages specific and actionable

---

### Content Best Practices

1. **Program Titles**
   - Clear and memorable (e.g., "LeaderShift")
   - Avoid acronyms unless widely known
   - Consider brand/marketing appeal

2. **Learning Objectives**
   - Start with action verbs (Develop, Master, Build)
   - Focus on outcomes, not activities
   - Make them measurable
   - Aim for 3-5 core objectives

3. **Module Structure**
   - 5-8 modules ideal for 12-week program
   - Each module = 1 major topic/skill
   - Logical progression (foundational → advanced)
   - Balance workload across weeks

4. **Lesson Sequencing**
   - Mix content types (reading, video, practice)
   - Space out high-effort lessons (assignments, meetings)
   - Build in reflection time
   - End modules with application/practice

5. **Communication Cadence**
   - Don't overwhelm with emails
   - Space out non-critical communications
   - Always allow opt-out (system-level setting)
   - Personalize messages with merge fields

---

### Technical Considerations

1. **Performance**
   - Lazy load lesson content (only load when editing)
   - Debounce auto-save to avoid excessive API calls
   - Paginate participant lists if > 50 participants
   - Compress uploaded images

2. **Accessibility**
   - All form fields have labels (even if visually hidden)
   - Color is not sole indicator (use icons + text)
   - Keyboard navigation works throughout
   - Focus states visible on all interactive elements
   - ARIA labels on icon-only buttons

3. **Data Integrity**
   - Confirm destructive actions (delete module)
   - Warn if changing program type with existing participants
   - Validate dates (end after start)
   - Prevent publishing with incomplete curriculum

4. **Responsive Design** (Future Enhancement)
   - Currently optimized for desktop (1280px+)
   - Curriculum tab needs tablet/mobile layout
   - Modal wizards work on smaller screens
   - Tables need horizontal scroll on mobile

---

### Design Consistency

1. **Spacing**
   - Use spacing system (8px grid)
   - `space-y-6` between major sections
   - `space-y-4` within sections
   - Never use arbitrary values (e.g., `mt-7`)

2. **Colors**
   - Use semantic tokens, not hardcoded colors
   - Accent color only for primary actions and highlights
   - Gray scale for hierarchy
   - Status colors for badges

3. **Typography**
   - Don't use Tailwind text size classes unless requested
   - Use default HTML sizing
   - `font-medium` for emphasis, not `font-bold`
   - Consistent line heights

4. **Components**
   - Reuse toggle switch pattern
   - Consistent button styling
   - All modals follow same structure
   - Bordered cards for grouping

---

## Summary

The Program Builder is a comprehensive, user-friendly system for creating and managing learning programs. Key strengths:

- **6-step wizard** for quick initial setup
- **Tabbed editor** for granular control
- **AI assistance** throughout creation process
- **Enhanced communication** with granular reminder timing
- **Content library** for reusable templates
- **Role-based content** for differentiated learning
- **Bulk participant management** with CSV import
- **Consistent design language** across all screens

The system balances power-user capabilities with ease of use, following the platform's "executive-first" design philosophy of clarity, simplicity, and elegant execution.

---

## Changelog

**v2.0 - February 2026**
- Added Section 5 (Settings & Config) to Info tab
- Removed separate Settings tab from main editor
- Enhanced lesson reminders with before/after due date controls
- Added Content Library integration for email templates
- Auto-calculated duration display for cohort programs
- Removed estimated duration for cohort-based (redundant)
- Updated documentation to reflect latest design

**v1.0 - January 2026**
- Initial Program Builder implementation
- 6-step creation wizard
- Tabbed editor with 6 tabs
- AI assistant integration
- Participants management
- Role-based lesson content