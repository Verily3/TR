# Program Builder - Complete Implementation Specifications

## Document Purpose
This document contains EVERY detail needed to recreate the Program Builder system pixel-perfect. It includes exact measurements, colors, spacing, content, workflows, and component specifications.

---

## Quick Reference

### File Structure
- **Wizard**: `/src/app/components/programs/CreateProgramWizard.tsx`
- **Editor**: `/src/app/components/programs/ProgramBuilderEditor.tsx`
- **Info Tab**: `/src/app/components/programs/ProgramInfoTab.tsx`
- **Participants Tab**: `/src/app/components/programs/ParticipantsTab.tsx`
- **Lesson Editor**: `/src/app/components/programs/LessonEditorEnhanced.tsx`
- **Goals Tab**: `/src/app/components/programs/ProgramGoalsTab.tsx`
- **Resources Tab**: `/src/app/components/programs/ResourcesTab.tsx`
- **Reports Tab**: `/src/app/components/programs/ReportsTab.tsx`

### All Screens Included
1. ✅ Program Creation Wizard (6 steps)
2. ✅ Program Builder Editor (main interface)
3. ✅ Curriculum Tab (module/lesson tree + editor)
4. ✅ Participants Tab (stats, table, import flow)
5. ✅ Info Tab (5 sections with full configuration)
6. ✅ Goals Tab (placeholder)
7. ✅ Resources Tab (placeholder)
8. ✅ Reports Tab (placeholder)
9. ✅ All modals (Add Module, Import Participants, Content Library, Role Assignment)
10. ✅ AI Assistant panels

---

## Complete Screen Inventory

### 1. Program Creation Wizard

**Modal Container**:
```tsx
className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
```

**Modal Body**:
```tsx
className="bg-card border border-border rounded-lg w-full max-w-4xl mx-4 shadow-lg"
```

#### Step 1: Basic Information

**Header**:
- Title: "Create New Program"
- Subtitle: "Step 1 of 6: Basic Information"
- Step indicators: 6 circles numbered 1-6
  - Current step: `bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium`
  - Completed: `bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center` with Check icon
  - Upcoming: `bg-muted text-muted-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm`

**Fields** (in order):

1. **Internal Name**
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Internal Name <span className="text-accent">*</span>
     </label>
     <input
       type="text"
       placeholder="e.g., Q1-2026-Leadership-Cohort-A"
       className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
     />
     <p className="text-xs text-muted-foreground mt-1.5">
       For internal tracking and reporting (not visible to learners)
     </p>
   </div>
   ```

2. **Program Title**
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Program Title <span className="text-accent">*</span>
     </label>
     <input
       type="text"
       placeholder="e.g., LeaderShift"
       className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
     />
     <p className="text-xs text-muted-foreground mt-1.5">
       Choose a clear, memorable name for your program
     </p>
   </div>
   ```

3. **Cover Image**
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Cover Image
     </label>
     {/* Upload area */}
     <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
       <Upload className="w-8 h-8 text-muted-foreground mb-3" />
       <p className="text-sm text-sidebar-foreground mb-1">
         Click to upload program cover
       </p>
       <p className="text-xs text-muted-foreground">
         PNG, JPG up to 5MB (Recommended: 1200x600px)
       </p>
     </div>
     <p className="text-xs text-muted-foreground mt-1.5">
       This image appears on the program overview and in program listings
     </p>
   </div>
   ```

4. **Description**
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Description <span className="text-accent">*</span>
     </label>
     <textarea
       rows={4}
       placeholder="Describe the program's purpose, what learners will gain, and why it matters..."
       className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
     />
     <p className="text-xs text-muted-foreground mt-1.5">
       This will appear on the program overview and in program listings
     </p>
   </div>
   ```

5. **Learning Track**
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Learning Track <span className="text-accent">*</span>
     </label>
     <select className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent">
       <option value="">Select track...</option>
       <option value="Leadership Track">Leadership Track</option>
       <option value="Management Track">Management Track</option>
       <option value="Technical Skills">Technical Skills</option>
       <option value="Professional Development">Professional Development</option>
       <option value="Executive Development">Executive Development</option>
     </select>
   </div>
   ```

**AI Smart Builder Box**:
```tsx
<div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
        AI Smart Builder
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Let AI analyze your program details and suggest an optimal structure, module sequence, and content outline.
      </p>
      <button className="text-sm text-accent hover:text-accent/80 font-medium">
        Generate Program Structure →
      </button>
    </div>
  </div>
</div>
```

**Footer Buttons**:
```tsx
<div className="p-6 border-t border-border flex justify-end gap-3">
  <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
    Cancel
  </button>
  <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Next →
  </button>
</div>
```

---

#### Step 2: Learning Objectives

**Fields**:

1. **Objective 1** (required):
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Objective 1 <span className="text-accent">*</span>
     </label>
     <textarea
       rows={2}
       placeholder="e.g., Distinguish between leadership and management responsibilities"
       className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
     />
   </div>
   ```

2. **Objective 2** (required) - Same as above

3. **Objective 3** (required) - Same as above

4. **Add More Button**:
   ```tsx
   <button className="text-sm text-accent hover:text-accent/80 font-medium">
     + Add Another Objective
   </button>
   ```

**Best Practice Tip**:
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="text-sm font-medium text-blue-900 mb-1">
        Best Practice
      </h3>
      <p className="text-sm text-blue-700">
        Start each objective with an action verb (e.g., "Master," "Develop," "Build," "Navigate"). Focus on measurable outcomes and specific competencies.
      </p>
    </div>
  </div>
</div>
```

**AI Objective Optimizer**:
```tsx
<div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
        AI Objective Optimizer
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        AI can refine your objectives to make them more specific, measurable, and aligned with best practices.
      </p>
      <button className="text-sm text-accent hover:text-accent/80 font-medium">
        Optimize Objectives →
      </button>
    </div>
  </div>
</div>
```

---

#### Step 3: Schedule & Dates

**Program Type Selection** (radio cards):
```tsx
<div>
  <label className="block text-sm font-medium text-sidebar-foreground mb-3">
    Program Type <span className="text-accent">*</span>
  </label>
  <div className="grid grid-cols-2 gap-4">
    {/* Cohort-Based */}
    <button className="p-4 border-2 border-accent bg-accent/5 rounded-lg text-left">
      <div className="font-medium text-sidebar-foreground mb-1">
        Cohort-Based
      </div>
      <div className="text-sm text-muted-foreground">
        All learners start and end together with fixed dates
      </div>
    </button>

    {/* Self-Paced */}
    <button className="p-4 border-2 border-border hover:border-accent/50 rounded-lg text-left">
      <div className="font-medium text-sidebar-foreground mb-1">
        Self-Paced
      </div>
      <div className="text-sm text-muted-foreground">
        Learners can start anytime and progress at their own speed
      </div>
    </button>
  </div>
</div>
```

**Cohort-Based Fields** (when selected):
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Start Date */}
  <div>
    <label className="block text-sm font-medium text-sidebar-foreground mb-2">
      Program Start Date <span className="text-accent">*</span>
    </label>
    <input
      type="date"
      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
    />
  </div>

  {/* End Date */}
  <div>
    <label className="block text-sm font-medium text-sidebar-foreground mb-2">
      Program End Date <span className="text-accent">*</span>
    </label>
    <input
      type="date"
      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
    />
  </div>
</div>
```

**Calculated Duration Display**:
```tsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-center gap-2">
    <Clock className="w-4 h-4 text-blue-600" />
    <span className="text-sm text-blue-900">
      <strong>Program Duration:</strong> 12 weeks
    </span>
  </div>
</div>
```

**Individual Pacing Toggle**:
```tsx
<div className="bg-muted/30 border border-border rounded-lg p-4">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="font-medium text-sidebar-foreground mb-1">
        Allow Individual Pacing
      </div>
      <div className="text-sm text-muted-foreground">
        Let learners start at different times within the cohort period
      </div>
    </div>
    {/* Toggle Switch */}
    <button className="relative w-11 h-6 rounded-full bg-accent">
      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
    </button>
  </div>

  {/* When enabled, show these fields */}
  <div className="grid grid-cols-2 gap-4 mt-4">
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">
        Start Offset (days after enrollment)
      </label>
      <input
        type="number"
        defaultValue="0"
        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>

    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">
        Deadline Flexibility (days)
      </label>
      <input
        type="number"
        defaultValue="7"
        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  </div>
</div>
```

**Self-Paced Fields** (when selected):
```tsx
<div>
  <label className="block text-sm font-medium text-sidebar-foreground mb-2">
    Estimated Duration
  </label>
  <div className="flex items-center gap-2">
    <input
      type="number"
      placeholder="12"
      className="w-32 px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
    />
    <span className="text-sm text-muted-foreground">weeks</span>
  </div>
  <p className="text-xs text-muted-foreground mt-1.5">
    Typical time for learners to complete this program at their own pace
  </p>
</div>
```

**Time Zone Selector** (both types):
```tsx
<div>
  <label className="block text-sm font-medium text-sidebar-foreground mb-2">
    Time Zone
  </label>
  <select className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent">
    <option value="America/New_York">Eastern Time (ET)</option>
    <option value="America/Chicago">Central Time (CT)</option>
    <option value="America/Denver">Mountain Time (MT)</option>
    <option value="America/Los_Angeles">Pacific Time (PT)</option>
    <option value="Europe/London">London (GMT)</option>
    <option value="Europe/Paris">Central European Time (CET)</option>
    <option value="Asia/Tokyo">Tokyo (JST)</option>
    <option value="Australia/Sydney">Sydney (AEDT)</option>
  </select>
  <p className="text-xs text-muted-foreground mt-1.5">
    Used for scheduling emails and displaying deadlines to participants
  </p>
</div>
```

---

#### Step 4: Communication Settings

**Email Configuration Pattern** (all emails follow this):
```tsx
<div className="bg-muted/30 border border-border rounded-lg p-4">
  {/* Header with toggle */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <div className="font-medium text-sidebar-foreground mb-1">
        [Email Name]
      </div>
      <div className="text-sm text-muted-foreground">
        [Email Description]
      </div>
    </div>
    {/* Toggle Switch */}
    <button className="relative w-11 h-6 rounded-full bg-accent">
      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
    </button>
  </div>

  {/* When enabled, show configuration */}
  <div className="space-y-3">
    {/* Custom fields per email type */}
    
    {/* Custom message (common to all) */}
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-muted-foreground">
          Custom message (optional)
        </label>
        <div className="flex gap-2">
          <button className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1">
            <Library className="w-3 h-3" />
            Content Library
          </button>
          <button className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Draft
          </button>
        </div>
      </div>
      <textarea
        rows={3}
        placeholder="Add a personalized message..."
        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
    </div>
  </div>
</div>
```

**Lesson Due Date Reminders** (ENHANCED):
```tsx
<div className="bg-muted/30 border border-border rounded-lg p-4">
  {/* Header */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <div className="font-medium text-sidebar-foreground mb-1">
        Lesson Due Date Reminders
      </div>
      <div className="text-sm text-muted-foreground">
        Automated reminders before and after lesson due dates
      </div>
    </div>
    {/* Master toggle */}
    <button className="relative w-11 h-6 rounded-full bg-accent">
      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
    </button>
  </div>

  {/* When enabled */}
  <div className="space-y-3">
    {/* Before Due Date Section */}
    <div>
      <label className="block text-xs font-medium text-sidebar-foreground mb-2">
        Before Due Date
      </label>
      <div className="space-y-2">
        {/* Each timing option */}
        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            2 weeks before due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-accent">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            1 week before due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-accent">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            3 days before due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-accent">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            1 day before due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-accent">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            Day of due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-accent">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
          </button>
        </div>
      </div>
    </div>

    {/* After Due Date (Overdue) Section */}
    <div>
      <label className="block text-xs font-medium text-sidebar-foreground mb-2">
        After Due Date (Overdue)
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            1 day after due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-border">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            3 days after due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-border">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2 bg-background rounded">
          <span className="text-sm text-sidebar-foreground">
            1 week after due date
          </span>
          <button className="relative w-11 h-6 rounded-full bg-border">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
          </button>
        </div>
      </div>
    </div>

    {/* Shared custom message */}
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-muted-foreground">
          Custom reminder message (optional)
        </label>
        <div className="flex gap-2">
          <button className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1">
            <Library className="w-3 h-3" />
            Content Library
          </button>
          <button className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Draft
          </button>
        </div>
      </div>
      <textarea
        rows={3}
        placeholder="Add a personalized message for lesson reminders..."
        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
    </div>
  </div>
</div>
```

**All Email Types to Include**:
1. Welcome Email (with "Days before start" field)
2. Program Kickoff Email
3. Lesson Due Date Reminders (enhanced as shown above)
4. Weekly Progress Digest (with "Day of week" dropdown)
5. Inactivity Reminder (with "Days inactive threshold" field)
6. Milestone Celebration Emails (shows badges: 25%, 50%, 75%, 100%)
7. Completion Email
8. Mentor/Manager Summary (with "Report frequency" dropdown: weekly/bi-weekly/monthly)

---

#### Step 5: Target Audience & Prerequisites

**Fields**:

1. **Target Audience**:
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Target Audience <span className="text-accent">*</span>
     </label>
     <textarea
       rows={3}
       placeholder="e.g., Mid-level managers with 2-5 years of experience in sales"
       className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
     />
     <p className="text-xs text-muted-foreground mt-1.5">
       Define who this program is designed for
     </p>
   </div>
   ```

2. **Prerequisites**:
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Prerequisites (optional)
     </label>
     <textarea
       rows={2}
       placeholder="e.g., Completion of Sales Fundamentals program"
       className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
     />
     <p className="text-xs text-muted-foreground mt-1.5">
       Any required programs or qualifications
     </p>
   </div>
   ```

3. **Recommended For**:
   ```tsx
   <div>
     <label className="block text-sm font-medium text-sidebar-foreground mb-2">
       Recommended For (optional)
     </label>
     <textarea
       rows={2}
       placeholder="e.g., Sales representatives looking to move into leadership roles"
       className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
     />
     <p className="text-xs text-muted-foreground mt-1.5">
       Additional context for who benefits most
     </p>
   </div>
   ```

---

#### Step 6: Review & Create

**Summary Cards Layout**:
```tsx
<div className="space-y-4">
  {/* Basic Information Summary */}
  <div className="bg-card border border-border rounded-lg p-4">
    <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
      Basic Information
    </h3>
    <div className="space-y-2 text-sm">
      <div className="flex">
        <span className="text-muted-foreground w-32">Title:</span>
        <span className="text-sidebar-foreground">LeaderShift</span>
      </div>
      <div className="flex">
        <span className="text-muted-foreground w-32">Track:</span>
        <span className="text-sidebar-foreground">Leadership Track</span>
      </div>
      <div className="flex">
        <span className="text-muted-foreground w-32">Type:</span>
        <span className="text-sidebar-foreground">Cohort-Based</span>
      </div>
    </div>
  </div>

  {/* Learning Objectives Summary */}
  <div className="bg-card border border-border rounded-lg p-4">
    <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
      Learning Objectives
    </h3>
    <ul className="space-y-1.5 text-sm text-sidebar-foreground list-disc list-inside">
      <li>Develop self-awareness and emotional intelligence as a leader</li>
      <li>Master the art of coaching and developing direct reports</li>
      <li>Build strategic thinking and decision-making capabilities</li>
    </ul>
  </div>

  {/* Schedule Summary */}
  <div className="bg-card border border-border rounded-lg p-4">
    <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
      Schedule & Dates
    </h3>
    <div className="space-y-2 text-sm">
      <div className="flex">
        <span className="text-muted-foreground w-32">Start Date:</span>
        <span className="text-sidebar-foreground">March 1, 2025</span>
      </div>
      <div className="flex">
        <span className="text-muted-foreground w-32">End Date:</span>
        <span className="text-sidebar-foreground">May 24, 2025</span>
      </div>
      <div className="flex">
        <span className="text-muted-foreground w-32">Duration:</span>
        <span className="text-sidebar-foreground">12 weeks</span>
      </div>
    </div>
  </div>

  {/* Communication Summary */}
  <div className="bg-card border border-border rounded-lg p-4">
    <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
      Communication Settings
    </h3>
    <div className="flex flex-wrap gap-2">
      <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
        Welcome Email
      </span>
      <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
        Kickoff Email
      </span>
      <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
        Lesson Reminders
      </span>
      <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
        Weekly Digest
      </span>
      <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
        Milestone Emails
      </span>
      <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
        Completion Email
      </span>
    </div>
  </div>

  {/* Target Audience Summary */}
  <div className="bg-card border border-border rounded-lg p-4">
    <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
      Target Audience
    </h3>
    <p className="text-sm text-sidebar-foreground">
      Mid-level managers with 2-5 years of experience in sales
    </p>
  </div>
</div>
```

**Footer Buttons**:
```tsx
<div className="p-6 border-t border-border flex justify-between">
  <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
    ← Back to Edit
  </button>
  <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Create Program
  </button>
</div>
```

---

### 2. Program Builder Editor

**Container**:
```tsx
<div className="h-screen flex flex-col bg-background">
  {/* Header */}
  {/* Tab Navigation */}
  {/* Content Area */}
</div>
```

#### Header

```tsx
<div className="px-8 py-4 border-b border-border flex items-center justify-between sticky top-0 z-40 bg-background">
  {/* Left section */}
  <div className="flex items-center gap-4">
    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
      <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
    </button>
    <div className="flex items-center gap-3">
      <h1 className="text-sidebar-foreground">LeaderShift: Manager to Leader Transformation</h1>
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
        Draft
      </span>
    </div>
  </div>

  {/* Right section */}
  <div className="flex items-center gap-3">
    <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
      Save Changes
    </button>
    <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
      <Eye className="w-4 h-4" />
      Preview
    </button>
    <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Publish Program
    </button>
  </div>
</div>
```

#### Tab Navigation

```tsx
<div className="px-8 border-b border-border bg-background">
  <div className="flex gap-6">
    {/* Active tab */}
    <button className="pb-3 px-1 text-sm transition-colors relative text-accent">
      Curriculum
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
    </button>

    {/* Inactive tabs */}
    <button className="pb-3 px-1 text-sm transition-colors text-muted-foreground hover:text-sidebar-foreground">
      Participants
    </button>
    <button className="pb-3 px-1 text-sm transition-colors text-muted-foreground hover:text-sidebar-foreground">
      Info
    </button>
    <button className="pb-3 px-1 text-sm transition-colors text-muted-foreground hover:text-sidebar-foreground">
      Goals
    </button>
    <button className="pb-3 px-1 text-sm transition-colors text-muted-foreground hover:text-sidebar-foreground">
      Resources
    </button>
    <button className="pb-3 px-1 text-sm transition-colors text-muted-foreground hover:text-sidebar-foreground">
      Reports
    </button>
  </div>
</div>
```

---

### 3. Curriculum Tab

**Two-Panel Layout**:
```tsx
<div className="flex h-full overflow-hidden">
  {/* Left Panel: Module Tree (40%) */}
  <div className="w-2/5 border-r border-border p-6 overflow-y-auto">
    {/* Module tree content */}
  </div>

  {/* Right Panel: Lesson Editor (60%) */}
  <div className="flex-1 p-6 overflow-y-auto">
    {/* Lesson editor or AI assistant */}
  </div>
</div>
```

#### Left Panel: Module Tree

**Add Module Button**:
```tsx
<button className="w-full mb-4 px-4 py-2.5 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
  <Plus className="w-4 h-4" />
  Add Module
</button>
```

**Module Item** (collapsed):
```tsx
<div className="mb-3 bg-card border border-border rounded-lg p-4">
  <div className="flex items-center gap-3">
    {/* Drag handle */}
    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
    
    {/* Expand/collapse */}
    <button className="p-1 hover:bg-muted rounded transition-colors">
      <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
    </button>

    {/* Module info */}
    <div className="flex-1">
      <div className="text-sm font-medium text-sidebar-foreground">
        Module 1: Introduction to Leadership
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        5 lessons
      </div>
    </div>

    {/* Module menu */}
    <button className="p-1 hover:bg-muted rounded transition-colors">
      <MoreVertical className="w-4 h-4 text-muted-foreground" />
    </button>
  </div>
</div>
```

**Module Item** (expanded):
```tsx
<div className="mb-3 bg-card border border-border rounded-lg p-4">
  <div className="flex items-center gap-3 mb-3">
    {/* Same as collapsed */}
  </div>

  {/* Lesson list */}
  <div className="ml-6 space-y-2">
    {/* Lesson item */}
    <div className="p-3 bg-muted/30 border border-border rounded-lg flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors">
      <BookOpen className="w-4 h-4 text-sidebar-foreground" />
      <div className="flex-1">
        <div className="text-sm text-sidebar-foreground">
          What is Leadership?
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
            25 min
          </span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            Draft
          </span>
        </div>
      </div>
    </div>

    {/* More lessons... */}
  </div>

  {/* Add Lesson button */}
  <button className="ml-6 mt-2 text-sm text-accent hover:text-accent/80 font-medium flex items-center gap-1">
    <Plus className="w-3 h-3" />
    Add Lesson
  </button>
</div>
```

#### Right Panel: Lesson Editor

**Editor Header**:
```tsx
<div className="flex items-center justify-between p-4 border-b border-border mb-6">
  <div className="flex items-center gap-3">
    <BookOpen className="w-5 h-5 text-sidebar-foreground" />
    <div>
      <div className="text-sidebar-foreground font-medium">
        What is Leadership?
      </div>
      <div className="text-sm text-muted-foreground">
        Reading Material
      </div>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
      Draft
    </span>
    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
      <X className="w-5 h-5 text-sidebar-foreground" />
    </button>
  </div>
</div>
```

**Content Mode Selector**:
```tsx
<div className="flex gap-4 mb-6">
  {/* Shared Content (active) */}
  <button className="flex-1 px-4 py-3 border-2 border-accent bg-accent/5 rounded-lg text-sm font-medium text-sidebar-foreground">
    Shared Content
    <div className="text-xs text-muted-foreground mt-0.5">
      Same for all roles
    </div>
  </button>

  {/* Role-Specific */}
  <button className="flex-1 px-4 py-3 border-2 border-border hover:border-accent/50 rounded-lg text-sm font-medium text-sidebar-foreground transition-colors">
    Role-Specific Content
    <div className="text-xs text-muted-foreground mt-0.5">
      Different per role
    </div>
  </button>
</div>
```

**Content Fields** (example for Reading Material):
```tsx
<div className="space-y-4">
  {/* Introduction */}
  <div>
    <label className="block text-sm font-medium text-sidebar-foreground mb-2">
      Introduction
    </label>
    <textarea
      rows={4}
      placeholder="Provide context and preview what learners will explore..."
      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
    />
  </div>

  {/* Main Content */}
  <div>
    <label className="block text-sm font-medium text-sidebar-foreground mb-2">
      Main Content
    </label>
    <textarea
      rows={8}
      placeholder="Main learning content..."
      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
    />
  </div>

  {/* Key Concepts */}
  <div>
    <label className="block text-sm font-medium text-sidebar-foreground mb-2">
      Key Concepts
    </label>
    
    {/* Repeatable concept */}
    <div className="border border-border rounded-lg p-4 mb-3">
      <input
        type="text"
        placeholder="Concept title"
        className="w-full mb-2 px-3 py-2 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <textarea
        rows={2}
        placeholder="Concept description"
        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
      <button className="mt-2 text-sm text-accent hover:text-accent/80">
        Remove
      </button>
    </div>

    <button className="text-sm text-accent hover:text-accent/80 font-medium">
      + Add Key Concept
    </button>
  </div>

  {/* Key Takeaway */}
  <div>
    <label className="block text-sm font-medium text-sidebar-foreground mb-2">
      Key Takeaway
    </label>
    <textarea
      rows={3}
      placeholder="The one thing learners should remember..."
      className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
    />
  </div>
</div>
```

**Visibility Settings** (bottom of editor):
```tsx
<div className="border-t border-border pt-4 mt-6">
  <label className="block text-sm font-medium text-sidebar-foreground mb-3">
    Visibility
  </label>
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        defaultChecked
        className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
      />
      <span className="text-sm text-sidebar-foreground">
        Visible to Learners
      </span>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        defaultChecked
        className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
      />
      <span className="text-sm text-sidebar-foreground">
        Visible to Mentors
      </span>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        defaultChecked
        className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
      />
      <span className="text-sm text-sidebar-foreground">
        Visible to Facilitators
      </span>
    </div>
  </div>
</div>
```

**Save Buttons**:
```tsx
<div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
  <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
    Save Draft
  </button>
  <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Save & Close
  </button>
</div>
```

---

### 4. Participants Tab

**Container**:
```tsx
<div className="h-full overflow-auto">
  <div className="max-w-[1400px] mx-auto p-8">
    {/* Content */}
  </div>
</div>
```

#### Overview Stats

```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  {/* Total Enrolled */}
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center gap-3 mb-2">
      <Users className="w-5 h-5 text-accent" />
      <span className="text-2xl font-medium text-sidebar-foreground">28</span>
    </div>
    <div className="text-sm text-muted-foreground">Total Enrolled</div>
  </div>

  {/* Active Learners */}
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center gap-3 mb-2">
      <Users className="w-5 h-5 text-blue-600" />
      <span className="text-2xl font-medium text-sidebar-foreground">24</span>
    </div>
    <div className="text-sm text-muted-foreground">Active Learners</div>
  </div>

  {/* Assigned Mentors */}
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center gap-3 mb-2">
      <Users className="w-5 h-5 text-green-600" />
      <span className="text-2xl font-medium text-sidebar-foreground">3</span>
    </div>
    <div className="text-sm text-muted-foreground">Assigned Mentors</div>
  </div>

  {/* Facilitators */}
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center gap-3 mb-2">
      <Users2 className="w-5 h-5 text-purple-600" />
      <span className="text-2xl font-medium text-sidebar-foreground">1</span>
    </div>
    <div className="text-sm text-muted-foreground">Facilitators</div>
  </div>
</div>
```

#### Action Bar

```tsx
<div className="flex justify-between items-center mb-4">
  {/* Search */}
  <div className="relative w-96">
    <input
      type="text"
      placeholder="Search by name, email, or role..."
      className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
    />
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  </div>

  {/* Filters and Actions */}
  <div className="flex items-center gap-3">
    {/* Role filter */}
    <select className="px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent">
      <option>All Roles</option>
      <option>Learner</option>
      <option>Mentor</option>
      <option>Facilitator</option>
    </select>

    {/* Status filter */}
    <select className="px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent">
      <option>All Status</option>
      <option>Active</option>
      <option>Inactive</option>
      <option>Completed</option>
    </select>

    {/* Import button */}
    <button className="px-4 py-2.5 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2">
      <Upload className="w-4 h-4" />
      Import Participants
    </button>

    {/* Assign Roles button */}
    <button className="px-4 py-2.5 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2">
      <Users2 className="w-4 h-4" />
      Assign Roles
    </button>
  </div>
</div>
```

#### Participants Table

```tsx
<div className="bg-card border border-border rounded-lg overflow-hidden">
  <table className="w-full">
    {/* Table header */}
    <thead>
      <tr className="bg-muted">
        <th className="px-6 py-3 text-left">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
          />
        </th>
        <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
          Email
        </th>
        <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
          Role
        </th>
        <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
          Progress
        </th>
        <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>

    {/* Table body */}
    <tbody>
      {/* Example row */}
      <tr className="border-b border-border hover:bg-muted/30 transition-colors">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="https://avatar.placeholder.url"
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-sidebar-foreground">
              Sarah Johnson
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-muted-foreground">
            sarah.johnson@company.com
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Learner
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Active
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: '65%' }}
              />
            </div>
            <span className="text-sm text-muted-foreground">65%</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <button className="p-1 hover:bg-muted rounded transition-colors">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </td>
      </tr>

      {/* More rows... */}
    </tbody>
  </table>
</div>
```

---

### 5. Info Tab

**Container**:
```tsx
<div className="h-full overflow-auto">
  <div className="max-w-4xl mx-auto p-8">
    {/* Content */}
  </div>
</div>
```

#### Section Navigation

```tsx
<div className="flex gap-2 border-b border-border pb-4 mb-6">
  {/* Active section */}
  <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground">
    <BookOpen className="w-4 h-4" />
    <span className="text-sm font-medium">Basic Information</span>
  </button>

  {/* Inactive sections */}
  <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-sidebar-foreground transition-colors">
    <Target className="w-4 h-4" />
    <span className="text-sm font-medium">Learning Objectives</span>
  </button>

  <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-sidebar-foreground transition-colors">
    <Calendar className="w-4 h-4" />
    <span className="text-sm font-medium">Schedule & Dates</span>
  </button>

  <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-sidebar-foreground transition-colors">
    <Mail className="w-4 h-4" />
    <span className="text-sm font-medium">Communication</span>
  </button>

  <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-sidebar-foreground transition-colors">
    <Settings className="w-4 h-4" />
    <span className="text-sm font-medium">Settings & Config</span>
  </button>
</div>
```

#### Section 5: Settings & Config (NEW)

**Enrollment & Access**:
```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-sidebar-foreground mb-4">Enrollment & Access</h3>
  <div className="space-y-4">
    {/* Auto-Enrollment */}
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sidebar-foreground mb-1">
            Auto-Enrollment
          </div>
          <div className="text-sm text-muted-foreground">
            Automatically enroll users who meet the target audience criteria
          </div>
        </div>
        <button className="relative w-11 h-6 rounded-full bg-border">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
        </button>
      </div>
    </div>

    {/* Require Manager Approval */}
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sidebar-foreground mb-1">
            Require Manager Approval
          </div>
          <div className="text-sm text-muted-foreground">
            Users must get manager approval before enrolling
          </div>
        </div>
        <button className="relative w-11 h-6 rounded-full bg-border">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
        </button>
      </div>
    </div>

    {/* Allow Self-Enrollment */}
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sidebar-foreground mb-1">
            Allow Self-Enrollment
          </div>
          <div className="text-sm text-muted-foreground">
            Users can enroll themselves without admin approval
          </div>
        </div>
        <button className="relative w-11 h-6 rounded-full bg-accent">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
        </button>
      </div>
    </div>

    {/* Link to Goals */}
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sidebar-foreground mb-1">
            Link to Goals
          </div>
          <div className="text-sm text-muted-foreground">
            Allow learners to link this program to their development goals
          </div>
        </div>
        <button className="relative w-11 h-6 rounded-full bg-accent">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
        </button>
      </div>
    </div>

    {/* Issue Certificate */}
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sidebar-foreground mb-1">
            Issue Certificate
          </div>
          <div className="text-sm text-muted-foreground">
            Award a completion certificate when learners finish the program
          </div>
        </div>
        <button className="relative w-11 h-6 rounded-full bg-accent">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
        </button>
      </div>
    </div>
  </div>
</div>
```

**Capacity Management**:
```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-sidebar-foreground mb-4">Capacity Management</h3>
  <div className="grid grid-cols-2 gap-4">
    {/* Program Capacity */}
    <div>
      <label className="block text-sm font-medium text-sidebar-foreground mb-2">
        Program Capacity (optional)
      </label>
      <input
        type="number"
        placeholder="Unlimited"
        defaultValue="30"
        className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <p className="text-xs text-muted-foreground mt-1.5">
        Maximum number of participants
      </p>
    </div>

    {/* Waitlist */}
    <div>
      <label className="block text-sm font-medium text-sidebar-foreground mb-2">
        Waitlist
      </label>
      <div className="bg-muted/30 border border-border rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-sidebar-foreground">
            Enable Waitlist
          </span>
          <button className="relative w-11 h-6 rounded-full bg-border">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          When capacity is reached
        </p>
      </div>
    </div>
  </div>
</div>
```

**Program Behavior**:
```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-sidebar-foreground mb-4">Program Behavior</h3>
  <div className="space-y-4">
    {/* Sequential Module Access */}
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sidebar-foreground mb-1">
            Sequential Module Access
          </div>
          <div className="text-sm text-muted-foreground">
            Lock modules until previous modules are completed
          </div>
        </div>
        <button className="relative w-11 h-6 rounded-full bg-accent">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
        </button>
      </div>
    </div>

    {/* Track Completion in Scorecard */}
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sidebar-foreground mb-1">
            Track Completion in Scorecard
          </div>
          <div className="text-sm text-muted-foreground">
            Show program completion in executive scorecard
          </div>
        </div>
        <button className="relative w-11 h-6 rounded-full bg-accent">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
        </button>
      </div>
    </div>
  </div>
</div>
```

**Save Actions** (bottom of Info Tab):
```tsx
<div className="flex justify-end gap-3 pt-6 border-t border-border">
  <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
    Reset to Defaults
  </button>
  <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Save Changes
  </button>
</div>
```

---

### 6. Content Library Modal

```tsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-card border border-border rounded-lg w-full max-w-3xl mx-4 shadow-lg">
    {/* Header */}
    <div className="p-6 border-b border-border flex items-center justify-between">
      <div>
        <h3 className="text-sidebar-foreground mb-1">
          Email Content Library
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a pre-built email template
        </p>
      </div>
      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>

    {/* Content */}
    <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
      {/* Template item */}
      <button className="w-full text-left p-4 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors">
        <div className="font-medium text-sidebar-foreground mb-1">
          Welcome - Professional
        </div>
        <div className="text-sm text-muted-foreground">
          Formal welcome message with program overview and expectations
        </div>
      </button>

      <button className="w-full text-left p-4 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors">
        <div className="font-medium text-sidebar-foreground mb-1">
          Welcome - Casual
        </div>
        <div className="text-sm text-muted-foreground">
          Friendly, approachable welcome with motivational tone
        </div>
      </button>

      <button className="w-full text-left p-4 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors">
        <div className="font-medium text-sidebar-foreground mb-1">
          Reminder - Encouraging
        </div>
        <div className="text-sm text-muted-foreground">
          Positive reminder focusing on progress and support
        </div>
      </button>
    </div>
  </div>
</div>
```

---

## Example Data Values

### Default Program Data
- **Internal Name**: LEADER-SHIFT-2025
- **Title**: LeaderShift: Manager to Leader Transformation
- **Description**: A comprehensive leadership development program designed to transform managers into high-impact leaders who can drive organizational change and build high-performing teams.
- **Track**: Leadership Track
- **Start Date**: 2025-03-01
- **End Date**: 2025-05-24
- **Duration**: 12 weeks
- **Time Zone**: America/New_York

### Default Learning Objectives
1. Develop self-awareness and emotional intelligence as a leader
2. Master the art of coaching and developing direct reports
3. Build strategic thinking and decision-making capabilities

### Default Email Settings
- Welcome Email: Enabled, 7 days before start
- Kickoff Email: Enabled
- Lesson Reminders: Enabled (all "before" options on, "after" options off)
- Weekly Digest: Enabled, Monday
- Inactivity Reminder: Enabled, 7 days
- Milestone Emails: Enabled (25%, 50%, 75%, 100%)
- Completion Email: Enabled
- Mentor Summary: Enabled, Weekly

### Default Settings & Config
- Auto-Enrollment: OFF
- Require Manager Approval: OFF
- Allow Self-Enrollment: ON
- Link to Goals: ON
- Issue Certificate: ON
- Capacity: 30
- Enable Waitlist: OFF
- Sequential Access: ON
- Track in Scorecard: ON

---

## Summary

This document provides COMPLETE specifications for the Program Builder system including:

✅ All 6 wizard steps with exact field specs and layouts
✅ Program Builder Editor header and tab navigation
✅ Curriculum tab (module tree + lesson editor)
✅ Participants tab (stats, table, filters)
✅ Info tab with 5 sections (including new Settings & Config)
✅ All modals (Content Library, etc.)
✅ Exact component code snippets with Tailwind classes
✅ Default data values for all fields
✅ Complete design system specifications
✅ Toggle states, button styles, form inputs
✅ Color palette, spacing, typography
✅ Icons, badges, progress bars
✅ Layout dimensions and breakpoints

Everything needed to recreate the system pixel-perfect is included.
