# Programs Section - Complete Implementation Specifications

## Document Purpose
This document contains EVERY detail needed to recreate the Programs Section pixel-perfect. It includes exact measurements, colors, spacing, content, layouts, and component specifications for all three screens: Programs Page, Program Detail Page, and Module View (LMS).

---

## Quick Reference

### File Structure
- **Programs Page**: `/src/app/components/programs/ProgramsPage.tsx`
- **Program Card**: `/src/app/components/programs/ProgramCard.tsx`
- **Program Detail Page**: `/src/app/components/programs/ProgramDetailPage.tsx`
- **Module View LMS**: `/src/app/components/programs/ModuleViewLMS.tsx`
- **Phase Progress Tracker**: `/src/app/components/programs/PhaseProgressTracker.tsx`
- **LeaderShift Tracker**: `/src/app/components/programs/LeaderShiftTracker.tsx` (documented in Dashboard specs)

### All Screens Included
1. ✅ Programs Page (catalog with program cards)
2. ✅ Program Card Component (collapsed & expanded states)
3. ✅ Program Detail Page (overview with stats and linked goals)
4. ✅ Module View LMS (learning interface with 6 lesson types)
5. ✅ Phase Progress Tracker Component

---

## Complete Screen Inventory

### Screen Flow
```
Programs Page
    ↓ (Click "Continue Program" or "Start Program")
Program Detail Page
    ↓ (Click "Continue Learning")
Module View LMS
    ← (Back button returns to Programs Page)
```

---

## 1. Programs Page

**Purpose**: Main catalog of all programs with filtering and stats

### Container
```tsx
<div className="flex-1 overflow-auto bg-background">
  <div className="max-w-[1400px] mx-auto p-8">
    {/* Content */}
  </div>
</div>
```

**Specifications**:
- Max width: `max-w-[1400px]` (1400px)
- Padding: `p-8` (32px all sides)
- Background: `bg-background`

---

### Page Header

```tsx
<div className="mb-8 flex items-start justify-between">
  <div>
    <h1 className="text-sidebar-foreground mb-2">Programs</h1>
    <p className="text-muted-foreground">
      Structured learning paths to develop capabilities and drive results
    </p>
  </div>

  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
    <Plus className="w-4 h-4" />
    Enroll in Program
  </button>
</div>
```

**Specifications**:
- H1: Default HTML size, `text-sidebar-foreground`, `mb-2`
- Subtitle: `text-muted-foreground`
- Button: `px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm`
- Icon in button: `w-4 h-4`, gap-2 (8px)
- Section margin: `mb-8` (32px)

---

### Stats Bar

```tsx
<div className="mb-8 grid grid-cols-4 gap-4">
  {/* Total Programs */}
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">Total Programs</div>
    <div className="text-2xl text-sidebar-foreground">3</div>
  </div>

  {/* In Progress */}
  <div className="bg-card border border-blue-200 rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">In Progress</div>
    <div className="text-2xl text-blue-600">1</div>
  </div>

  {/* Completed */}
  <div className="bg-card border border-green-200 rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">Completed</div>
    <div className="text-2xl text-green-600">1</div>
  </div>

  {/* Not Started */}
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">Not Started</div>
    <div className="text-2xl text-muted-foreground">1</div>
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-4 gap-4` (4 columns, 16px gap)
- Card padding: `p-4` (16px)
- Label: `text-xs text-muted-foreground mb-1`
- Value: `text-2xl` with color variant
- Border colors:
  - Default: `border-border`
  - In Progress: `border-blue-200`
  - Completed: `border-green-200`
- Text colors:
  - In Progress: `text-blue-600`
  - Completed: `text-green-600`
  - Not Started: `text-muted-foreground`

---

### Filter Tabs

```tsx
<div className="mb-6 flex items-center gap-4">
  {/* Tab Container */}
  <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
    {/* Active Tab */}
    <button className="px-4 py-2 rounded text-sm bg-accent text-accent-foreground transition-colors">
      All Programs
    </button>
    
    {/* Inactive Tab */}
    <button className="px-4 py-2 rounded text-sm text-sidebar-foreground hover:bg-background transition-colors">
      In Progress
    </button>
    
    <button className="px-4 py-2 rounded text-sm text-sidebar-foreground hover:bg-background transition-colors">
      Not Started
    </button>
    
    <button className="px-4 py-2 rounded text-sm text-sidebar-foreground hover:bg-background transition-colors">
      Completed
    </button>
  </div>

  <div className="flex-1" />

  <div className="text-sm text-muted-foreground">
    Showing 3 of 3 programs
  </div>
</div>
```

**Specifications**:
- Container: `p-1 bg-muted rounded-lg`
- Tab button padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Active tab: `bg-accent text-accent-foreground`
- Inactive tab: `text-sidebar-foreground hover:bg-background`
- Font size: `text-sm`
- Count text: `text-sm text-muted-foreground`

---

### Programs Grid

```tsx
<div className="grid gap-4">
  {/* Program cards render here */}
</div>
```

**Specifications**:
- Single column grid with `gap-4` (16px between cards)
- Each program card is full width

---

### Empty State

```tsx
<div className="text-center py-12 text-muted-foreground">
  No programs found for the selected filter
</div>
```

**Specifications**:
- Padding: `py-12` (48px vertical)
- Text: `text-muted-foreground`
- Centered: `text-center`

---

## 2. Program Card Component

**Purpose**: Displays program information with collapsible curriculum

### Status Color Configurations

```tsx
const statusConfig = {
  completed: { 
    color: "text-green-600", 
    bg: "bg-green-50", 
    border: "border-green-200" 
  },
  "in-progress": { 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-200" 
  },
  "not-started": { 
    color: "text-muted-foreground", 
    bg: "bg-muted", 
    border: "border-border" 
  },
};
```

---

### Card Container

```tsx
<div className="bg-card border border-blue-200 rounded-lg overflow-hidden">
  {/* Main Card Content */}
  {/* Expanded Curriculum (conditional) */}
</div>
```

**Specifications**:
- Background: `bg-card`
- Border: Dynamic based on status (blue-200, green-200, or border)
- Border radius: `rounded-lg`
- Overflow: `overflow-hidden` (for expanded section)

---

### Main Card Content

```tsx
<div className="p-5">
  {/* Header */}
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      {/* Icon and Title */}
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="text-sidebar-foreground">LeaderShift</h3>
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground mb-2">
        Transform from manager to high-impact leader through 9 comprehensive modules
      </p>
      
      {/* Track Badge */}
      <div className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
        Leadership Track
      </div>
    </div>

    {/* Status Badge */}
    <div className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-600">
      IN PROGRESS
    </div>
  </div>

  {/* Progress Bar (if not not-started) */}
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2 text-xs">
      <span className="text-muted-foreground">Overall Progress</span>
      <span className="text-sidebar-foreground">27%</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-accent transition-all"
        style={{ width: '27%' }}
      />
    </div>
  </div>

  {/* Next Action (if in-progress) */}
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="text-xs text-blue-600 mb-1">Next Action</div>
    <div className="text-sm text-sidebar-foreground">
      Continue Module 3: Leading Yourself - Lesson 6
    </div>
  </div>

  {/* Linked Goals */}
  <div className="mb-4">
    <div className="text-xs text-muted-foreground mb-2">LINKED TO GOALS</div>
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded text-xs text-sidebar-foreground">
        <Target className="w-3 h-3 text-accent" />
        Improve Team Engagement Score
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded text-xs text-sidebar-foreground">
        <Target className="w-3 h-3 text-accent" />
        Develop Coaching Capability
      </div>
    </div>
  </div>

  {/* Due Date & Phases */}
  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
    <span>Due: April 15, 2026</span>
    <span>3 Phases</span>
  </div>

  {/* Action Button */}
  <div className="flex gap-3 mb-4">
    <button className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Continue Program
    </button>
  </div>

  {/* Expand Button */}
  <button className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-3 border-t border-border">
    View Curriculum
    <ChevronDown className="w-4 h-4" />
  </button>
</div>
```

**Specifications**:
- Card padding: `p-5` (20px)
- Icon size: `w-5 h-5`
- Track badge: `px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs`
- Status badge: `px-3 py-1 rounded-full text-xs`
- Progress bar height: `h-2`
- Next action box: `p-3 bg-blue-50 border border-blue-200 rounded-lg`
- Goal badge: `px-2.5 py-1 bg-muted rounded text-xs`
- Target icon in goal: `w-3 h-3 text-accent`
- Button: `px-4 py-2` with full width or flex-1
- Expand button: Separated by `pt-3 border-t border-border`

---

### "View Curriculum" Toggle Button

**Purpose**: Expands/collapses the full curriculum structure within the program card

```tsx
<button className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-3 border-t border-border">
  View Curriculum
  <ChevronDown className="w-4 h-4" />
</button>
```

**Collapsed State**:
- Text: "View Curriculum"
- Icon: `<ChevronDown className="w-4 h-4" />`

**Expanded State**:
- Text: "Hide Curriculum"
- Icon: `<ChevronUp className="w-4 h-4" />`

**Specifications**:
- Width: `w-full`
- Layout: `flex items-center justify-center gap-2`
- Font: `text-sm text-accent hover:text-accent/80`
- Top spacing: `pt-3` (12px padding-top)
- Border: `border-t border-border` (separator from card content)
- Transition: `transition-colors`

---

## View Curriculum Feature (Expanded State)

**What It Shows**: Complete hierarchical view of program structure with phases, modules, and lessons

### Action Button

```tsx
<div className="flex gap-3 mb-4">
  <button className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Continue Program
  </button>
</div>

{/* Expand Button */}
<button className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-3 border-t border-border">
  View Curriculum
  <ChevronDown className="w-4 h-4" />
</button>
```

**Specifications**:
- Card padding: `p-5` (20px)
- Icon size: `w-5 h-5`
- Track badge: `px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs`
- Status badge: `px-3 py-1 rounded-full text-xs`
- Progress bar height: `h-2`
- Next action box: `p-3 bg-blue-50 border border-blue-200 rounded-lg`
- Goal badge: `px-2.5 py-1 bg-muted rounded text-xs`
- Target icon in goal: `w-3 h-3 text-accent`
- Button: `px-4 py-2` with full width or flex-1
- Expand button: Separated by `pt-3 border-t border-border`

---

### Expanded Curriculum Section

```tsx
<div className="border-t border-border bg-muted/20 p-5">
  {/* Phase Progress Tracker */}
  <PhaseProgressTracker phases={[...]} />

  <div className="text-xs text-muted-foreground mb-4">CURRICULUM STRUCTURE</div>
  
  <div className="space-y-3">
    {/* Phase Card */}
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Phase Header (clickable) */}
      <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <div className="text-left">
            <div className="text-sm text-sidebar-foreground mb-1">Foundation</div>
            <div className="text-xs text-muted-foreground">
              2 of 3 modules completed
            </div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Expanded Modules (conditional) */}
      <div className="px-4 pb-4 space-y-2">
        {/* Module Item */}
        <div className="pl-8 py-2 border-l-2 border-border">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div className="flex-1">
              <div className="text-sm text-sidebar-foreground">
                Module 1: Leadership vs Management
              </div>
              <div className="text-xs text-muted-foreground">
                7 of 7 lessons
              </div>
            </div>
          </div>

          {/* Lessons (only for completed modules with lesson data) */}
          <div className="ml-6 mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground line-through">
                Reading: Leadership Fundamentals
              </span>
              <span className="text-muted-foreground">• 20 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Expanded section background: `bg-muted/20`
- Padding: `p-5`
- Phase card: `bg-card border border-border rounded-lg`
- Phase button: `p-4` with full width
- Phase icons: `w-4 h-4` (completed: green-600, in-progress: blue-600, not-started: muted-foreground)
- Module indent: `pl-8` with `border-l-2 border-border`
- Lesson icons: `w-4 h-4`
- Completed lessons: `line-through text-muted-foreground`

**Status Icons**:
- Completed: `<CheckCircle2 className="w-4 h-4 text-green-600" />`
- In Progress: `<Clock className="w-4 h-4 text-blue-600" />`
- Not Started: `<Circle className="w-4 h-4 text-muted-foreground" />`

---

### Default Programs Data (3 programs)

1. **LeaderShift** (in-progress)
   - Track: Leadership Track
   - Progress: 27%
   - Due: April 15, 2026
   - Linked Goals: 2
   - Phases: 3 (Foundation, Team Leadership, Strategic Leadership)
   - Next Action: "Continue Module 3: Leading Yourself - Lesson 6"

2. **Executive Presence** (not-started)
   - Track: Leadership Track
   - Progress: 0%
   - Due: June 30, 2026
   - Linked Goals: 0
   - Phases: 2 (Communication Mastery, Personal Brand)

3. **Strategic Planning & Execution** (completed)
   - Track: Strategy Track
   - Progress: 100%
   - Due: December 15, 2025
   - Linked Goals: 1
   - Phases: 1 (Strategic Foundation)

---

## 3. Phase Progress Tracker Component

**Purpose**: Horizontal progress indicator for program phases

### Container

```tsx
<div className="mb-6 p-5 bg-muted/30 rounded-lg">
  {/* Header */}
  <div className="mb-4">
    <div className="text-xs text-muted-foreground mb-1">PROGRAM PHASES</div>
    <div className="text-sm text-sidebar-foreground">
      Phase 1 of 3
    </div>
  </div>

  {/* Progress Tracker */}
  <div className="relative">
    {/* Background Line */}
    <div 
      className="absolute top-[18px] left-0 right-0 h-0.5 bg-border" 
      style={{ marginLeft: "18px", marginRight: "18px" }} 
    />
    
    {/* Active Progress Line */}
    <div 
      className="absolute top-[18px] left-0 h-0.5 bg-accent transition-all duration-500" 
      style={{ 
        marginLeft: "18px",
        width: `calc(0% - 18px)` // (currentPhaseIndex / (phases.length - 1)) * 100
      }} 
    />

    {/* Phases */}
    <div className="relative flex items-start justify-between">
      {/* Individual phase nodes */}
    </div>
  </div>
</div>
```

**Specifications**:
- Container: `p-5 bg-muted/30 rounded-lg mb-6`
- Label: `text-xs text-muted-foreground mb-1`
- Value: `text-sm text-sidebar-foreground`
- Progress line position: `top-[18px]` (18px from top)
- Line height: `h-0.5` (2px)
- Line margins: 18px left and right
- Transition: `transition-all duration-500`

---

### Phase Node (Completed)

```tsx
<div className="flex flex-col items-center" style={{ flex: 1 }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center mb-2 transition-all bg-accent border-2 border-accent">
    <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
  </div>

  {/* Label */}
  <div className="text-center px-1">
    <div className="text-xs text-sidebar-foreground">
      Foundation
    </div>
  </div>
</div>
```

### Phase Node (Current)

```tsx
<div className="flex flex-col items-center" style={{ flex: 1 }}>
  <div className="relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center mb-2 transition-all bg-accent border-3 border-accent/20 shadow-md shadow-accent/20">
    <Clock className="w-4 h-4 text-accent-foreground" />
  </div>

  <div className="text-center px-1">
    <div className="text-xs text-sidebar-foreground font-medium">
      Team Leadership
    </div>
  </div>
</div>
```

### Phase Node (Upcoming)

```tsx
<div className="flex flex-col items-center" style={{ flex: 1 }}>
  <div className="relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center mb-2 transition-all bg-card border-2 border-border">
    <Circle className="w-4 h-4 text-muted-foreground" />
  </div>

  <div className="text-center px-1">
    <div className="text-xs text-muted-foreground">
      Strategic Leadership
    </div>
  </div>
</div>
```

**Specifications**:
- Phase container: `flex: 1` (equal width distribution)
- Circle size: `w-[36px] h-[36px]`
- Icon size: `w-4 h-4`
- Margin below circle: `mb-2`
- Label font: `text-xs`
- Current phase: `font-medium`
- Padding: `px-1` on label container

---

## 4. Program Detail Page

**Purpose**: Detailed view of a single program with stats and overview

### Container

```tsx
<div className="flex-1 overflow-auto bg-background">
  <div className="max-w-[1400px] mx-auto p-8">
    {/* Content */}
  </div>
</div>
```

---

### Back Button

```tsx
<button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6">
  <ChevronLeft className="w-4 h-4" />
  Back to Programs
</button>
```

**Specifications**:
- Font: `text-sm`
- Color: `text-muted-foreground hover:text-accent`
- Icon: `w-4 h-4`
- Gap: `gap-2` (8px)
- Margin: `mb-6` (24px)

---

### Program Header

```tsx
<div className="mb-8">
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-3">
        {/* Icon Box */}
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-accent" />
        </div>
        
        {/* Title & Meta */}
        <div>
          <h1 className="text-sidebar-foreground mb-1">LeaderShift</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Leadership Track</span>
            <span>•</span>
            <span>9 Modules</span>
            <span>•</span>
            <span>~12 weeks</span>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-muted-foreground max-w-3xl">
        A comprehensive leadership development program designed to transform managers into high-impact leaders.
        Master essential leadership competencies through structured modules, mentor coaching, and practical
        application.
      </p>
    </div>

    {/* Status Badge */}
    <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
      IN PROGRESS
    </div>
  </div>
</div>
```

**Specifications**:
- Icon box: `w-12 h-12 rounded-lg bg-accent/10`
- Icon: `w-6 h-6 text-accent`
- H1: Default size, `mb-1`
- Meta text: `text-sm text-muted-foreground` with bullet separators
- Description: `text-muted-foreground max-w-3xl`
- Status badge: `px-4 py-2` with colored bg and border

---

### Program Stats (4-column grid)

```tsx
<div className="mb-8 grid grid-cols-4 gap-4">
  {/* Total Points */}
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Award className="w-4 h-4 text-accent" />
      <span className="text-xs text-muted-foreground">TOTAL POINTS</span>
    </div>
    <div className="text-2xl text-sidebar-foreground">11,800</div>
    <div className="text-xs text-muted-foreground mt-1">of 57,000 available</div>
  </div>

  {/* Progress */}
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Play className="w-4 h-4 text-accent" />
      <span className="text-xs text-muted-foreground">PROGRESS</span>
    </div>
    <div className="text-2xl text-sidebar-foreground">27%</div>
    <div className="text-xs text-muted-foreground mt-1">2.4 of 9 modules complete</div>
  </div>

  {/* Time Remaining */}
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Calendar className="w-4 h-4 text-accent" />
      <span className="text-xs text-muted-foreground">TIME REMAINING</span>
    </div>
    <div className="text-2xl text-sidebar-foreground">9 weeks</div>
    <div className="text-xs text-muted-foreground mt-1">Due April 15, 2026</div>
  </div>

  {/* Linked Goals */}
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Target className="w-4 h-4 text-accent" />
      <span className="text-xs text-muted-foreground">LINKED GOALS</span>
    </div>
    <div className="text-2xl text-sidebar-foreground">2</div>
    <div className="text-xs text-muted-foreground mt-1">Active connections</div>
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-4 gap-4`
- Card: `bg-card border border-border rounded-lg p-4`
- Icon: `w-4 h-4 text-accent`
- Label: `text-xs text-muted-foreground` (all caps)
- Value: `text-2xl text-sidebar-foreground`
- Sub-text: `text-xs text-muted-foreground mt-1`

---

### Module Progress Tracker

Uses the LeaderShiftTracker component (see Dashboard documentation):

```tsx
<LeaderShiftTracker onContinue={onStartModule} />
```

---

### Program Overview (2-column grid)

```tsx
<div className="grid grid-cols-2 gap-6 mb-8">
  {/* What You'll Learn */}
  <div className="bg-card border border-border rounded-lg p-6">
    <h3 className="text-sidebar-foreground mb-4">What You'll Learn</h3>
    <ul className="space-y-3 text-sm text-muted-foreground">
      <li className="flex items-start gap-2">
        <span className="text-accent mt-1">•</span>
        <span>Distinguish between leadership and management responsibilities</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent mt-1">•</span>
        <span>Develop self-awareness and emotional intelligence</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent mt-1">•</span>
        <span>Master performance planning and coaching frameworks</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent mt-1">•</span>
        <span>Build high-performing, accountable teams</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent mt-1">•</span>
        <span>Navigate difficult conversations and corrective action</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent mt-1">•</span>
        <span>Develop strategic leadership thinking</span>
      </li>
    </ul>
  </div>

  {/* Program Structure */}
  <div className="bg-card border border-border rounded-lg p-6">
    <h3 className="text-sidebar-foreground mb-4">Program Structure</h3>
    <div className="space-y-4">
      <div>
        <div className="text-sm text-sidebar-foreground mb-2">Each module includes:</div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Reading materials (20-30 min)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Video content (25-30 min)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Mentor coaching session (60 min)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Reflection submissions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Practical assignments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Goal setting exercise</span>
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-1">ESTIMATED TIME COMMITMENT</div>
        <div className="text-sm text-sidebar-foreground">3-4 hours per module</div>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-2 gap-6`
- Card: `bg-card border border-border rounded-lg p-6`
- H3: `text-sidebar-foreground mb-4`
- List spacing: `space-y-3` or `space-y-2`
- List items: `text-sm text-muted-foreground`
- Bullet: `text-accent mt-1`
- Divider: `pt-4 border-t border-border`

---

### Linked Goals Section

```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-sidebar-foreground mb-4">Linked Goals</h3>
  <div className="space-y-3">
    {/* Goal Card */}
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Target className="w-5 h-5 text-accent" />
        <div>
          <div className="text-sm text-sidebar-foreground">Improve Team Engagement Score</div>
          <div className="text-xs text-muted-foreground">Q1 2026 • Individual Goal</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-sidebar-foreground">72%</div>
          <div className="text-xs text-muted-foreground">Progress</div>
        </div>
        <button className="text-sm text-accent hover:text-accent/80">View Goal</button>
      </div>
    </div>

    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Target className="w-5 h-5 text-accent" />
        <div>
          <div className="text-sm text-sidebar-foreground">Develop Coaching Capability</div>
          <div className="text-xs text-muted-foreground">H1 2026 • Development Goal</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-sidebar-foreground">45%</div>
          <div className="text-xs text-muted-foreground">Progress</div>
        </div>
        <button className="text-sm text-accent hover:text-accent/80">View Goal</button>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Card: `bg-card border border-border rounded-lg p-6`
- Goal card: `p-4 bg-muted/30 rounded-lg`
- Icon: `w-5 h-5 text-accent`
- Title: `text-sm text-sidebar-foreground`
- Meta: `text-xs text-muted-foreground`
- Progress value: `text-sm text-sidebar-foreground`
- Button: `text-sm text-accent hover:text-accent/80`

---

## 5. Module View LMS

**Purpose**: Full learning interface with left sidebar navigation and main content area

### Page Layout

```tsx
<div className="flex h-screen bg-background">
  {/* Left Sidebar - Course Outline */}
  <div className="w-80 bg-card border-r border-border flex flex-col overflow-hidden">
    {/* Sidebar content */}
  </div>

  {/* Main Content Area */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Top Navigation Bar */}
    {/* Lesson Content (scrollable) */}
    {/* Bottom Navigation */}
  </div>
</div>
```

**Specifications**:
- Full height: `h-screen`
- Sidebar width: `w-80` (320px fixed)
- Sidebar: `bg-card border-r border-border`
- Layout: Horizontal flex

---

### Left Sidebar - Header

```tsx
<div className="p-6 border-b border-border flex-shrink-0">
  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-4">
    <ChevronLeft className="w-4 h-4" />
    Back to Programs
  </button>
  <h3 className="text-sidebar-foreground mb-1">LeaderShift</h3>
  <p className="text-sm text-muted-foreground">9-Module Leadership Program</p>
</div>
```

**Specifications**:
- Padding: `p-6` (24px)
- Border: `border-b border-border`
- Flex-shrink: `flex-shrink-0` (don't shrink)
- Back button: `text-sm text-muted-foreground hover:text-accent mb-4`
- Title: `text-sidebar-foreground mb-1`
- Subtitle: `text-sm text-muted-foreground`

---

### Module List Item

```tsx
<div className="border-b border-border bg-muted/30">
  <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
    <div className="flex items-start gap-3 mb-2">
      <div className="mt-1">
        <CheckCircle2 className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1">Module 2</div>
        <div className="text-sm text-sidebar-foreground mb-2">The Leader and The Manager</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>7/7 complete</span>
          <span>•</span>
          <span>100%</span>
        </div>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="h-1 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-accent transition-all" style={{ width: '100%' }} />
    </div>
  </button>

  {/* Expanded Lesson List (only for current module) */}
  <div className="bg-background/50">
    <button className="w-full p-3 pl-16 text-left border-t border-border/50 hover:bg-muted/30 transition-colors bg-accent/5 border-l-2 border-l-accent">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-sidebar-foreground">Food for Thought</span>
        <CheckCircle2 className="w-3 h-3 text-accent ml-auto" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>20 min</span>
        <span>•</span>
        <span>800 pts</span>
      </div>
    </button>
  </div>
</div>
```

**Specifications**:
- Module button: `w-full p-4 text-left hover:bg-muted/50`
- Module icon: `w-5 h-5` (text-accent for completed/in-progress, text-muted-foreground for locked)
- Module number: `text-xs text-muted-foreground mb-1`
- Module title: `text-sm text-sidebar-foreground mb-2`
- Progress bar: `h-1 bg-muted rounded-full`
- Current module background: `bg-muted/30`
- Lesson indent: `pl-16` (64px)
- Current lesson: `bg-accent/5 border-l-2 border-l-accent`
- Lesson icon: `w-3 h-3`
- Lesson title: `text-xs`

**Module Status Icons**:
- Completed: `<CheckCircle2 className="w-5 h-5 text-accent" />`
- In Progress: `<Clock className="w-5 h-5 text-accent" />`
- Locked: `<Lock className="w-5 h-5 text-muted-foreground" />`

---

### Top Navigation Bar

```tsx
<div className="flex-shrink-0 border-b border-border bg-card px-8 py-4">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-xs text-muted-foreground mb-1">
        Module 3 • Lesson 6 of 7
      </div>
      <h2 className="text-sidebar-foreground">Food for Thought</h2>
    </div>
    <div className="flex items-center gap-4">
      {/* Points Badge */}
      <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
        <Award className="w-4 h-4 text-accent" />
        <span className="text-sm text-accent">800 points</span>
      </div>
      
      {/* Completed Badge (if completed) */}
      <div className="flex items-center gap-2 text-sm text-accent">
        <CheckCircle2 className="w-4 h-4" />
        <span>Completed</span>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Padding: `px-8 py-4` (32px horizontal, 16px vertical)
- Border: `border-b border-border`
- Background: `bg-card`
- Breadcrumb: `text-xs text-muted-foreground mb-1`
- Title: H2 default size, `text-sidebar-foreground`
- Points badge: `px-3 py-1 bg-accent/10 rounded-full`
- Icon: `w-4 h-4 text-accent`

---

### Lesson Content Area (Scrollable)

```tsx
<div className="flex-1 overflow-auto">
  <div className="max-w-4xl mx-auto p-8">
    {/* Content varies by lesson type */}
  </div>
</div>
```

**Specifications**:
- Flex: `flex-1` (grows to fill space)
- Overflow: `overflow-auto` (scrollable)
- Content max-width: `max-w-4xl` (896px)
- Content padding: `p-8` (32px)
- Content centered: `mx-auto`

---

### Lesson Types (6 types)

#### 1. Reading Lesson

```tsx
<div className="prose prose-sm max-w-none">
  <h3 className="text-sidebar-foreground mb-4">Module 3: Leading Yourself</h3>
  <p className="text-muted-foreground mb-6">
    Leadership begins with self-leadership. Before you can effectively guide others, you must first master
    yourself. This module explores the critical components of leading yourself effectively.
  </p>

  <h4 className="text-sidebar-foreground mt-6 mb-3">Key Concepts</h4>
  <div className="space-y-4 text-muted-foreground">
    <div className="p-4 bg-muted/30 rounded-lg">
      <h5 className="text-sidebar-foreground mb-2">1. Self-Awareness</h5>
      <p>
        Understanding your leadership style, strengths, and development areas is the foundation of effective
        leadership. Self-aware leaders make better decisions and build stronger relationships.
      </p>
    </div>

    <div className="p-4 bg-muted/30 rounded-lg">
      <h5 className="text-sidebar-foreground mb-2">2. Personal Accountability</h5>
      <p>
        Great leaders take ownership of their results and their impact on others. Accountability means
        stopping the excuses and focusing on what you can control.
      </p>
    </div>

    <div className="p-4 bg-muted/30 rounded-lg">
      <h5 className="text-sidebar-foreground mb-2">3. Emotional Intelligence</h5>
      <p>
        Your emotional state directly impacts your team's performance. Leaders who master their emotions
        create more productive, engaged teams.
      </p>
    </div>
  </div>

  <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-lg">
    <div className="flex items-start gap-3">
      <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
      <div>
        <h4 className="text-sidebar-foreground mb-2">Key Takeaway</h4>
        <p className="text-muted-foreground">
          The most effective leaders invest as much time developing themselves as they do developing their
          teams. Self-leadership isn't selfish—it's essential.
        </p>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Concept boxes: `p-4 bg-muted/30 rounded-lg`
- Key takeaway box: `p-6 bg-accent/5 border border-accent/20 rounded-lg`
- Lightbulb icon: `w-5 h-5 text-accent flex-shrink-0 mt-1`

#### 2. Video Lesson

```tsx
<div>
  {/* Video Player Placeholder */}
  <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
        <Play className="w-10 h-10 text-accent ml-1" />
      </div>
      <p className="text-muted-foreground">Video Player Placeholder</p>
      <p className="text-sm text-muted-foreground">30 min</p>
    </div>
  </div>

  <h3 className="text-sidebar-foreground mb-3">Video Overview</h3>
  <p className="text-muted-foreground mb-6">
    In this video series, you'll explore practical techniques for developing self-leadership. Watch expert
    interviews, real-world examples, and actionable strategies you can apply immediately.
  </p>

  {/* Video Segments */}
  <div className="grid grid-cols-2 gap-4">
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Video className="w-4 h-4 text-accent" />
        <span className="text-sm text-sidebar-foreground">Part 1: Self-Awareness</span>
      </div>
      <p className="text-xs text-muted-foreground">12:34 • Discover your leadership style</p>
    </div>
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Video className="w-4 h-4 text-accent" />
        <span className="text-sm text-sidebar-foreground">Part 2: Accountability</span>
      </div>
      <p className="text-xs text-muted-foreground">15:22 • Taking ownership of results</p>
    </div>
  </div>
</div>
```

**Specifications**:
- Video placeholder: `aspect-video bg-muted rounded-lg mb-6`
- Play button circle: `w-20 h-20 rounded-full bg-accent/20`
- Play icon: `w-10 h-10 text-accent ml-1` (ml-1 for visual centering)
- Segments grid: `grid-cols-2 gap-4`
- Segment card: `p-4 bg-card border border-border rounded-lg`

#### 3. Meeting Lesson

```tsx
<div>
  <div className="p-6 bg-muted/30 rounded-lg mb-6">
    <div className="flex items-center gap-3 mb-4">
      <Users className="w-6 h-6 text-accent" />
      <h3 className="text-sidebar-foreground">Mentor Meeting</h3>
    </div>
    <p className="text-muted-foreground mb-4">
      Schedule a 60-minute meeting with your assigned mentor to discuss this module's concepts and how they
      apply to your specific leadership challenges.
    </p>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div className="text-xs text-muted-foreground mb-1">Your Mentor</div>
        <div className="text-sidebar-foreground">Sarah Chen</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Next Available</div>
        <div className="text-sidebar-foreground">Thursday 2:00 PM</div>
      </div>
    </div>
  </div>

  <h4 className="text-sidebar-foreground mb-3">Discussion Topics</h4>
  <ul className="space-y-2 text-muted-foreground">
    <li className="flex items-start gap-2">
      <span className="text-accent mt-1">•</span>
      <span>How do you currently practice self-leadership?</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-accent mt-1">•</span>
      <span>What accountability gaps exist in your current role?</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-accent mt-1">•</span>
      <span>How does your emotional state impact your team?</span>
    </li>
  </ul>

  <div className="mt-6">
    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Schedule Meeting
    </button>
  </div>
</div>
```

**Specifications**:
- Info box: `p-6 bg-muted/30 rounded-lg mb-6`
- Users icon: `w-6 h-6 text-accent`
- Grid: `grid-cols-2 gap-4`
- Button: `px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm`

#### 4. Submission Lesson

```tsx
<div>
  <h3 className="text-sidebar-foreground mb-3">Most Useful Idea</h3>
  <p className="text-muted-foreground mb-6">
    Reflect on this module's content and share the single most useful idea that resonated with you. Be specific about why this concept is valuable for your leadership development.
  </p>

  <textarea
    placeholder="Enter your response here..."
    className="w-full h-64 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-4"
  />

  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">0 characters</span>
    <button
      disabled
      className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Submit Response
    </button>
  </div>
</div>
```

**Specifications**:
- Textarea: `h-64 p-4 bg-input-background border border-border rounded-lg`
- Focus ring: `focus:ring-2 focus:ring-accent`
- Resize: `resize-none`
- Character count: `text-sm text-muted-foreground`
- Button disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- Minimum characters: 50

#### 5. Assignment Lesson

```tsx
<div>
  <h3 className="text-sidebar-foreground mb-3">Food for Thought</h3>
  <p className="text-muted-foreground mb-6">
    Reflect on these questions to deepen your understanding of the module concepts. Your responses will help
    you apply these ideas to your specific leadership context.
  </p>

  <div className="space-y-6">
    <div className="p-6 bg-card border border-border rounded-lg">
      <h4 className="text-sidebar-foreground mb-3">
        1. Reflect on a recent situation where you struggled with self-leadership. What was the outcome?
      </h4>
      <p className="text-sm text-muted-foreground mb-4">
        Consider the gap between your intended behavior and actual behavior.
      </p>
      <textarea
        placeholder="Your reflection..."
        className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
    </div>

    <div className="p-6 bg-card border border-border rounded-lg">
      <h4 className="text-sidebar-foreground mb-3">
        2. What personal accountability gaps exist in your current role?
      </h4>
      <p className="text-sm text-muted-foreground mb-4">
        Think about areas where you tend to externalize responsibility.
      </p>
      <textarea
        placeholder="Your reflection..."
        className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
    </div>

    <div className="p-6 bg-card border border-border rounded-lg">
      <h4 className="text-sidebar-foreground mb-3">
        3. How does your emotional state impact your team's performance?
      </h4>
      <p className="text-sm text-muted-foreground mb-4">Identify specific examples from the past week.</p>
      <textarea
        placeholder="Your reflection..."
        className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
    </div>
  </div>

  <div className="mt-6 flex justify-end">
    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Submit Assignment
    </button>
  </div>
</div>
```

**Specifications**:
- Question card: `p-6 bg-card border border-border rounded-lg`
- Spacing: `space-y-6` between questions
- Textarea: `h-32 p-4`
- Guidance text: `text-sm text-muted-foreground mb-4`

#### 6. Goal Lesson

```tsx
<div>
  <h3 className="text-sidebar-foreground mb-3">Set Your Goal for This Period</h3>
  <p className="text-muted-foreground mb-6">
    Based on what you've learned in this module, set a specific, measurable goal that you'll work toward over
    the next 30 days. This goal should directly relate to the module's content.
  </p>

  <div className="space-y-4">
    <div>
      <label className="block text-sm text-sidebar-foreground mb-2">Goal Statement</label>
      <input
        type="text"
        placeholder="e.g., Improve self-awareness by journaling daily reflections"
        className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>

    <div>
      <label className="block text-sm text-sidebar-foreground mb-2">Success Metric</label>
      <input
        type="text"
        placeholder="How will you measure success?"
        className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>

    <div>
      <label className="block text-sidebar-foreground mb-2">Action Steps</label>
      <textarea
        placeholder="List specific actions you'll take to achieve this goal..."
        className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-sidebar-foreground mb-2">Target Date</label>
        <input
          type="date"
          className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div>
        <label className="block text-sm text-sidebar-foreground mb-2">Review Frequency</label>
        <select className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent">
          <option>Weekly</option>
          <option>Bi-weekly</option>
          <option>Monthly</option>
        </select>
      </div>
    </div>
  </div>

  <div className="mt-6 flex justify-end">
    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Save Goal
    </button>
  </div>
</div>
```

**Specifications**:
- Label: `block text-sm text-sidebar-foreground mb-2` (or just `block` for textarea label)
- Input/Select: `p-3 bg-input-background border border-border rounded-lg`
- Textarea: `h-32 p-4`
- Form spacing: `space-y-4`
- Grid: `grid-cols-2 gap-4`
- Focus ring: `focus:ring-2 focus:ring-accent`

---

### Bottom Navigation Bar

```tsx
<div className="flex-shrink-0 border-t border-border bg-card px-8 py-4">
  <div className="flex items-center justify-between">
    {/* Previous Button */}
    <button
      disabled
      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronLeft className="w-4 h-4" />
      Previous
    </button>

    {/* Lesson Counter */}
    <div className="text-sm text-muted-foreground">
      Lesson 6 of 7
    </div>

    {/* Next / Mark Complete Button */}
    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
      Mark Complete & Continue
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
</div>
```

**Specifications**:
- Padding: `px-8 py-4` (32px horizontal, 16px vertical)
- Border: `border-t border-border`
- Background: `bg-card`
- Button padding: `px-4 py-2`
- Icon: `w-4 h-4`
- Counter: `text-sm text-muted-foreground`

**Button States**:
- If lesson not completed: "Mark Complete & Continue"
- If lesson completed: "Next"
- If first lesson: Previous button disabled
- If last lesson: Next button disabled

---

### Completion Modal

```tsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-card border border-border rounded-lg w-full max-w-md mx-4 shadow-lg">
    <div className="p-6">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-center text-sidebar-foreground mb-2">Mark as Complete?</h3>
      <p className="text-center text-sm text-muted-foreground mb-6">
        You'll earn 800 points and move to the next lesson.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
          Cancel
        </button>
        <button className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
          Mark Complete
        </button>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Backdrop: `fixed inset-0 bg-background/80 backdrop-blur-sm`
- Z-index: `z-50`
- Modal: `max-w-md mx-4` (448px max, 16px margin)
- Padding: `p-6`
- Icon circle: `w-12 h-12 rounded-full bg-accent/10`
- Icon: `w-6 h-6 text-accent`
- Button gap: `gap-3`
- Cancel: `border border-border text-muted-foreground hover:bg-muted`
- Confirm: `bg-accent text-accent-foreground hover:bg-accent/90`

---

## Lesson Type Icons

Map lesson types to icons:

```tsx
const getLessonIcon = (type: LessonType) => {
  switch (type) {
    case "reading": return BookOpen;
    case "video": return Video;
    case "meeting": return Users;
    case "submission": return Lightbulb;
    case "assignment": return FileText;
    case "goal": return Target;
    default: return FileText;
  }
};
```

---

## Complete Module Data Structure

**9 Modules** (Modules 1-2 completed, Module 3 in progress, Modules 4-9 locked):

Each module has **7 lessons** in this order:
1. Read the Text (reading, 500 pts, 25 min)
2. Watch the Videos (video, 800 pts, 30 min)
3. Mentor Meeting (meeting, 1500 pts, 60 min)
4. Most Useful Idea (submission, 1000 pts, 15 min)
5. How You Used the Idea (submission, 1200 pts, 15 min)
6. Food for Thought (assignment, 800 pts, 20 min)
7. Enter Your Goal (goal, 1000 pts, 10 min)

**Total points per module**: 6,800
**Total points for all 9 modules**: 61,200

**Current state** (for LeaderShift program):
- Module 3, Lesson 6 (Food for Thought) is current
- Lessons 1-5 of Module 3 are completed
- Lesson 7 of Module 3 is not started

---

## Color Palette

**Program Status Colors**:
- In Progress: `blue-600` text, `blue-50` bg, `blue-200` border
- Completed: `green-600` text, `green-50` bg, `green-200` border
- Not Started: `muted-foreground` text, `muted` bg, `border` border

**Track Badge**:
- `bg-purple-100 text-purple-700`

**Form Inputs**:
- Background: `bg-input-background`
- Border: `border-border`
- Focus: `focus:ring-2 focus:ring-accent`
- Placeholder: `placeholder:text-muted-foreground`

---

## Spacing System

**Section Spacing**:
- Between major sections: `mb-8` (32px)
- Between subsections: `mb-6` (24px)
- Between cards: `mb-4` or `gap-4` (16px)
- Between list items: `space-y-3` (12px) or `space-y-2` (8px)

**Grid Gaps**:
- 4-column stats: `gap-4` (16px)
- 2-column layout: `gap-6` (24px)

**Card Padding**:
- Small cards: `p-4` (16px)
- Medium cards: `p-5` (20px)
- Large cards: `p-6` (24px)
- Sidebar: `p-8` (32px)

---

## Summary

This document provides COMPLETE specifications for the Programs Section including:

✅ Programs Page (catalog with stats, filters, program cards)
✅ Program Card Component (collapsed & expanded with curriculum)
✅ Phase Progress Tracker (horizontal phase indicator)
✅ Program Detail Page (overview, stats, linked goals)
✅ Module View LMS (full learning interface)
✅ All 6 lesson types (reading, video, meeting, submission, assignment, goal)
✅ Left sidebar navigation with module/lesson list
✅ Top and bottom navigation bars
✅ Completion modal
✅ All exact Tailwind classes and measurements
✅ Complete data structures and example content
✅ Color configurations for all status states
✅ Form input specifications
✅ Icon mappings

Everything needed to recreate the Programs Section pixel-perfect is included.