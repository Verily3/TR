# Goals & KPIs Section - Complete Implementation Specifications

## Document Purpose
This document contains EVERY detail needed to recreate the Goals & KPIs Section pixel-perfect. It includes exact measurements, colors, spacing, content, layouts, and component specifications for all screens and components in the goals tracking system.

---

## Quick Reference

### File Structure
- **Goals Page**: `/src/app/components/goals/GoalsPage.tsx`
- **Goal Card**: `/src/app/components/goals/GoalCard.tsx`
- **Needs Attention**: `/src/app/components/goals/NeedsAttention.tsx`
- **Transformation Tracker**: `/src/app/components/TransformationTracker.tsx`

### All Components Included
1. ✅ Goals Page (main catalog with filters and stats)
2. ✅ Transformation Tracker (6-stage journey progress)
3. ✅ Stats Bar (4 metrics: Total, On Track, At Risk, Behind)
4. ✅ Needs Attention Banner (alert section for goals requiring action)
5. ✅ Filter Controls (timeframe tabs + type dropdown)
6. ✅ Goal Card Component (collapsed & expanded with KPI details)
7. ✅ KPI Detail Cards (within expanded goal cards)
8. ✅ Confidence Level Indicator (5-level bar visualization)

---

## Page Container

```tsx
<div className="flex-1 overflow-auto bg-background">
  <div className="max-w-[1400px] mx-auto p-8">
    {/* All sections */}
  </div>
</div>
```

**Specifications**:
- Max width: `max-w-[1400px]` (1400px)
- Padding: `p-8` (32px all sides)
- Background: `bg-background`
- Overflow: `overflow-auto`

---

## 1. Page Header

**Purpose**: Title, subtitle, and action buttons

```tsx
<div className="mb-8 flex items-start justify-between">
  <div>
    <h1 className="text-sidebar-foreground mb-2">Goals & KPIs</h1>
    <p className="text-muted-foreground">
      Track progress across personal, team, and organizational objectives
    </p>
  </div>

  <div className="flex items-center gap-3">
    <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted/50 transition-colors flex items-center gap-2">
      <Download className="w-4 h-4" />
      Export Report
    </button>
    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
      <Plus className="w-4 h-4" />
      New Goal
    </button>
  </div>
</div>
```

**Specifications**:
- H1: Default HTML size, `text-sidebar-foreground`, `mb-2`
- Subtitle: `text-muted-foreground`
- Export button: `px-4 py-2 border border-border rounded-lg text-sm` (secondary style)
- New Goal button: `px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm` (primary style)
- Icon size: `w-4 h-4`
- Button gap: `gap-3` (12px)
- Section margin: `mb-8` (32px)

---

## 2. Transformation Tracker

**Purpose**: Horizontal 6-stage journey tracker showing user progress through the transformation framework

### Container

```tsx
<div className="mb-8 p-6 bg-card border border-border rounded-lg">
  <div className="mb-4">
    <h3 className="text-sm text-sidebar-foreground mb-1">Your Transformation Journey</h3>
    <p className="text-xs text-muted-foreground">Track your progress through the complete results framework</p>
  </div>

  {/* Progress tracker visualization */}
</div>
```

**Specifications**:
- Container: `mb-8 p-6 bg-card border border-border rounded-lg`
- H3: `text-sm text-sidebar-foreground mb-1`
- Description: `text-xs text-muted-foreground`
- Header margin: `mb-4` (16px)

---

### Progress Tracker Visualization

```tsx
<div className="relative">
  {/* Progress Line Background */}
  <div 
    className="absolute top-[26px] left-0 right-0 h-0.5 bg-border" 
    style={{ marginLeft: "32px", marginRight: "32px" }} 
  />
  
  {/* Active Progress Line */}
  <div 
    className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500" 
    style={{ 
      marginLeft: "32px",
      width: `calc(33.33% - 32px)` // Example: 2 of 6 stages complete = 33.33%
    }} 
  />

  {/* Stages */}
  <div className="relative flex items-start justify-between">
    {/* Stage nodes */}
  </div>
</div>
```

**Specifications**:
- Line position: `top-[26px]` (26px from top, centered on circles)
- Line height: `h-0.5` (2px)
- Line margins: 32px left and right
- Background line: `bg-border`
- Active line: `bg-accent transition-all duration-500`
- Progress calculation: `(currentStageIndex / (totalStages - 1)) * 100%`

---

### Stage Node (Completed)

```tsx
<div className="flex flex-col items-center" style={{ width: "120px" }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-accent border-2 border-accent">
    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
  </div>

  {/* Label */}
  <div className="text-center">
    <div className="text-sm mb-1 text-sidebar-foreground">
      Clarity
    </div>
    <div className="inline-block px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">
      Complete
    </div>
  </div>
</div>
```

### Stage Node (Current)

```tsx
<div className="flex flex-col items-center" style={{ width: "120px" }}>
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20">
    <TrendingUp className="w-6 h-6 text-accent-foreground" />
  </div>

  <div className="text-center">
    <div className="text-sm mb-1 text-sidebar-foreground font-medium">
      Execution
    </div>
    <div className="inline-block px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
      In Progress
    </div>
  </div>
</div>
```

### Stage Node (Upcoming)

```tsx
<div className="flex flex-col items-center" style={{ width: "120px" }}>
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-muted border-2 border-border">
    <BarChart3 className="w-6 h-6 text-muted-foreground" />
  </div>

  <div className="text-center">
    <div className="text-sm mb-1 text-muted-foreground">
      Measurement
    </div>
    <div className="text-xs text-muted-foreground">
      Upcoming
    </div>
  </div>
</div>
```

**Specifications**:
- Stage width: `120px` (inline style for equal distribution)
- Circle size: `w-[52px] h-[52px]`
- Icon size: `w-6 h-6`
- Margin below circle: `mb-3` (12px)
- Label font: `text-sm`
- Current stage label: `font-medium`
- Badge padding: `px-2 py-0.5`
- Badge font: `text-xs`
- Z-index: `z-10` (above connecting lines)

**Status Styling**:
- **Completed**: `bg-accent border-2 border-accent` + green badge
- **Current**: `bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20` + accent badge + `font-medium`
- **Upcoming**: `bg-muted border-2 border-border` + muted text

---

### All 6 Stages (Default Data)

1. **Clarity** (Target icon) - Completed
2. **Commitment** (FileCheck icon) - Completed
3. **Execution** (TrendingUp icon) - Current (default)
4. **Measurement** (BarChart3 icon) - Upcoming
5. **Coaching** (MessageSquare icon) - Upcoming
6. **Results** (Trophy icon) - Upcoming

---

### Current Stage Description

```tsx
<div className="mt-6 pt-6 border-t border-border">
  <div className="flex items-start gap-3">
    <div className="flex-1">
      <div className="text-sm text-sidebar-foreground mb-1">Current Stage: Execution</div>
      <div className="text-xs text-muted-foreground">
        You're actively working on your programs and goals. Focus on consistent progress and building momentum.
      </div>
    </div>
    <button className="px-4 py-2 text-xs text-accent hover:text-accent/80 transition-colors">
      View Framework Guide
    </button>
  </div>
</div>
```

**Specifications**:
- Top margin: `mt-6` (24px)
- Top padding: `pt-6` (24px)
- Border: `border-t border-border`
- Title: `text-sm text-sidebar-foreground mb-1`
- Description: `text-xs text-muted-foreground`
- Button: `px-4 py-2 text-xs text-accent hover:text-accent/80`

---

## 3. Stats Bar

**Purpose**: High-level metrics for goal tracking

```tsx
<div className="mb-8 grid grid-cols-4 gap-4">
  {/* Total Goals */}
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">Total Goals</div>
    <div className="text-2xl text-sidebar-foreground">5</div>
  </div>

  {/* On Track */}
  <div className="bg-card border border-green-200 rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">On Track</div>
    <div className="text-2xl text-green-600">3</div>
  </div>

  {/* At Risk */}
  <div className="bg-card border border-yellow-200 rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">At Risk</div>
    <div className="text-2xl text-yellow-600">1</div>
  </div>

  {/* Behind */}
  <div className="bg-card border border-red-200 rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">Behind</div>
    <div className="text-2xl text-accent">1</div>
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-4 gap-4` (4 columns, 16px gap)
- Card padding: `p-4` (16px)
- Label: `text-xs text-muted-foreground mb-1`
- Value: `text-2xl`
- Border colors:
  - Total: `border-border`
  - On Track: `border-green-200`
  - At Risk: `border-yellow-200`
  - Behind: `border-red-200`
- Value colors:
  - Total: `text-sidebar-foreground`
  - On Track: `text-green-600`
  - At Risk: `text-yellow-600`
  - Behind: `text-accent` (red)

---

## 4. Needs Attention Banner

**Purpose**: Alert section highlighting goals requiring immediate action

### Container

```tsx
<div className="mb-8 p-5 bg-red-50/50 border border-red-200 rounded-lg">
  <div className="flex items-center gap-2 mb-4">
    <AlertCircle className="w-5 h-5 text-accent" />
    <h3 className="text-sidebar-foreground">Needs Attention</h3>
    <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs">
      2
    </span>
  </div>

  <div className="space-y-2">
    {/* Attention items */}
  </div>
</div>
```

**Specifications**:
- Container: `mb-8 p-5 bg-red-50/50 border border-red-200 rounded-lg`
- Icon: `w-5 h-5 text-accent`
- H3: `text-sidebar-foreground`
- Count badge: `px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs`
- Items spacing: `space-y-2` (8px between items)
- Header margin: `mb-4` (16px)

**Note**: This component only renders if there are items to display.

---

### Attention Item

```tsx
<div className="bg-card border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
  {/* Icon Box */}
  <div className="p-2 rounded-lg bg-yellow-50">
    <AlertCircle className="w-4 h-4 text-yellow-600" />
  </div>

  {/* Content */}
  <div className="flex-1">
    <h4 className="text-sm text-sidebar-foreground mb-1">Increase team productivity by 15%</h4>
    <div className="text-xs text-muted-foreground mb-2">KPI trending down for 2 weeks</div>
    <div className="text-xs text-muted-foreground">Owner: You</div>
  </div>

  {/* Action Button */}
  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Review
  </button>
</div>
```

**Specifications**:
- Card: `bg-card rounded-lg p-4 flex items-start gap-3`
- Card gap: `gap-3` (12px)
- Icon box: `p-2 rounded-lg` with colored background
- Icon: `w-4 h-4` with colored text
- Goal title: `text-sm text-sidebar-foreground mb-1`
- Issue: `text-xs text-muted-foreground mb-2`
- Owner: `text-xs text-muted-foreground`
- Button: `px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm`

---

### Attention Item Types

**Type: At Risk**
- Border: `border-yellow-200`
- Icon box bg: `bg-yellow-50`
- Icon: `AlertCircle`, `text-yellow-600`

**Type: Overdue**
- Border: `border-red-200`
- Icon box bg: `bg-red-50`
- Icon: `Clock`, `text-accent`

**Type: Stalled**
- Border: `border-orange-200`
- Icon box bg: `bg-orange-50`
- Icon: `TrendingDown`, `text-orange-600`

---

### Default Attention Items (2 items)

1. **At Risk** - "Increase team productivity by 15%"
   - Issue: "KPI trending down for 2 weeks"
   - Owner: "You"

2. **Overdue** - "Complete Q4 strategic review"
   - Issue: "Due 3 days ago"
   - Owner: "Sarah Johnson"

---

## 5. Filter Controls

**Purpose**: Timeframe tabs and type dropdown for filtering goals

```tsx
<div className="mb-6 flex items-center gap-4">
  {/* Timeframe Tabs */}
  <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
    <button className="px-4 py-2 rounded text-sm bg-accent text-accent-foreground transition-colors">
      All
    </button>
    <button className="px-4 py-2 rounded text-sm text-sidebar-foreground hover:bg-background transition-colors">
      Quarterly
    </button>
    <button className="px-4 py-2 rounded text-sm text-sidebar-foreground hover:bg-background transition-colors">
      Monthly
    </button>
    <button className="px-4 py-2 rounded text-sm text-sidebar-foreground hover:bg-background transition-colors">
      Weekly
    </button>
  </div>

  {/* Type Filter */}
  <div className="flex items-center gap-2">
    <Filter className="w-4 h-4 text-muted-foreground" />
    <select className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground bg-card hover:bg-muted/50 transition-colors">
      <option value="all">All Goals</option>
      <option value="personal">Personal</option>
      <option value="team">Team</option>
      <option value="org">Organization</option>
    </select>
  </div>

  <div className="flex-1" />

  <div className="text-sm text-muted-foreground">
    Showing 5 of 5 goals
  </div>
</div>
```

**Specifications**:
- Container: `mb-6 flex items-center gap-4`
- Tab container: `p-1 bg-muted rounded-lg`
- Tab button: `px-4 py-2 rounded text-sm transition-colors`
- Active tab: `bg-accent text-accent-foreground`
- Inactive tab: `text-sidebar-foreground hover:bg-background`
- Filter icon: `w-4 h-4 text-muted-foreground`
- Select: `px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground bg-card`
- Count text: `text-sm text-muted-foreground`
- Spacer: `flex-1` (pushes count to right)

**Timeframe Options**:
- All (default)
- Quarterly
- Monthly
- Weekly

**Type Options**:
- All Goals (default)
- Personal
- Team
- Organization

---

## 6. Goal Card Component

**Purpose**: Individual goal display with progress, KPIs, and confidence level

### Status Configurations

```tsx
const statusConfig = {
  "on-track": { color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  "at-risk": { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  "behind": { color: "text-accent", bg: "bg-red-50", border: "border-red-200" },
  "completed": { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};
```

### Type Badge Colors

```tsx
const typeColors = {
  personal: "bg-purple-100 text-purple-700",
  team: "bg-blue-100 text-blue-700",
  org: "bg-green-100 text-green-700",
};
```

---

### Card Container

```tsx
<div className="bg-card border border-green-200 rounded-lg overflow-hidden transition-all">
  {/* Main Card Content */}
  {/* Expanded KPI Details (conditional) */}
</div>
```

**Specifications**:
- Background: `bg-card`
- Border: Dynamic based on status (green-200, yellow-200, red-200, or blue-200)
- Border radius: `rounded-lg`
- Overflow: `overflow-hidden`
- Transition: `transition-all`

---

### Main Card Content

```tsx
<div className="p-5">
  {/* Header */}
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sidebar-foreground">Increase team engagement score to 8.5+</h3>
        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
          Team
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          You
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Due Mar 31, 2026
        </span>
      </div>
    </div>

    {/* Status Badge */}
    <div className="px-3 py-1 rounded-full text-xs bg-green-50 text-green-600">
      ON TRACK
    </div>
  </div>

  {/* Progress Bar */}
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2 text-xs">
      <span className="text-muted-foreground">Progress</span>
      <span className="text-sidebar-foreground">84%</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-accent transition-all"
        style={{ width: "84%" }}
      />
    </div>
  </div>

  {/* Next Action */}
  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
    <div className="text-xs text-muted-foreground mb-1">Next Action</div>
    <div className="text-sm text-sidebar-foreground">Schedule team feedback session</div>
  </div>

  {/* KPI Summary & Confidence */}
  <div className="flex items-center justify-between mb-4">
    <div className="text-xs text-muted-foreground">
      2 Linked KPIs
    </div>
    <div className="flex items-center gap-2">
      <div className="text-xs text-muted-foreground">Confidence</div>
      <div className="flex gap-0.5">
        <div className="w-6 h-1.5 rounded bg-accent" />
        <div className="w-6 h-1.5 rounded bg-accent" />
        <div className="w-6 h-1.5 rounded bg-accent" />
        <div className="w-6 h-1.5 rounded bg-accent" />
        <div className="w-6 h-1.5 rounded bg-muted" />
      </div>
      <span className="text-xs text-sidebar-foreground">4/5</span>
    </div>
  </div>

  {/* Expand Button */}
  <button className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-3 border-t border-border">
    View KPI Details
    <ChevronDown className="w-4 h-4" />
  </button>
</div>
```

**Specifications**:
- Card padding: `p-5` (20px)
- Type badge: `px-2 py-0.5 rounded text-xs` with type-specific colors
- Status badge: `px-3 py-1 rounded-full text-xs` with status-specific colors
- Owner/date icons: `w-3 h-3`
- Owner/date text: `text-xs text-muted-foreground`
- Progress bar height: `h-2` (8px)
- Progress bar fill: `bg-accent`
- Next action box: `p-3 bg-muted/50 rounded-lg mb-4`
- Confidence bars: `w-6 h-1.5 rounded`
- Filled bars: `bg-accent`
- Empty bars: `bg-muted`
- Confidence bar gap: `gap-0.5` (2px)
- Expand button: Separated by `pt-3 border-t border-border`

**Button States**:
- Collapsed: "View KPI Details" + ChevronDown
- Expanded: "Hide Details" + ChevronUp

---

### Confidence Level Indicator

**Visual**: 5 horizontal bars, filled based on confidence level (1-5)

```tsx
<div className="flex items-center gap-2">
  <div className="text-xs text-muted-foreground">Confidence</div>
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((level) => (
      <div
        key={level}
        className={`w-6 h-1.5 rounded ${
          level <= confidenceLevel ? "bg-accent" : "bg-muted"
        }`}
      />
    ))}
  </div>
  <span className="text-xs text-sidebar-foreground">4/5</span>
</div>
```

**Specifications**:
- Bar size: `w-6 h-1.5` (24px × 6px)
- Bar spacing: `gap-0.5` (2px)
- Filled: `bg-accent`
- Empty: `bg-muted`
- Rounded: `rounded`
- Label: `text-xs text-muted-foreground`
- Value: `text-xs text-sidebar-foreground`

---

## 7. Expanded KPI Details

**Purpose**: Detailed view of linked KPIs with progress bars

### Expanded Section Container

```tsx
<div className="border-t border-border bg-muted/20 p-5">
  <div className="text-xs text-muted-foreground mb-3">LINKED KPIs</div>
  <div className="space-y-3">
    {/* KPI cards */}
  </div>

  <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
    Last updated: 2 hours ago
  </div>
</div>
```

**Specifications**:
- Background: `bg-muted/20`
- Padding: `p-5` (20px)
- Label: `text-xs text-muted-foreground mb-3` (uppercase)
- Cards spacing: `space-y-3` (12px)
- Last updated: `mt-4 pt-4 border-t border-border text-xs text-muted-foreground`

---

### KPI Detail Card

```tsx
<div className="bg-card border border-border rounded-lg p-4">
  <div className="flex items-start justify-between mb-3">
    <div>
      <div className="text-sm text-sidebar-foreground mb-1">Team Engagement Score</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl text-sidebar-foreground">
          8.4/10
        </span>
        <span className="text-xs text-muted-foreground">of 8.5/10</span>
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs text-green-600">
      <TrendingUp className="w-3.5 h-3.5" />
      +12%
    </div>
  </div>

  {/* Progress to target */}
  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
    <div
      className="h-full bg-accent transition-all"
      style={{ width: "98.8%" }}
    />
  </div>
</div>
```

**Specifications**:
- Card: `bg-card border border-border rounded-lg p-4`
- KPI name: `text-sm text-sidebar-foreground mb-1`
- Current value: `text-2xl text-sidebar-foreground`
- Target value: `text-xs text-muted-foreground`
- Trend icon: `w-3.5 h-3.5`
- Trend text: `text-xs`
- Trend colors:
  - Up: `text-green-600`
  - Down: `text-accent` (red)
- Progress bar height: `h-1.5` (6px)
- Progress bar fill: `bg-accent`

---

## Default Goals Data (5 Goals)

### Goal 1: Team Engagement (On Track)
- **Title**: "Increase team engagement score to 8.5+"
- **Owner**: You
- **Type**: Team (blue badge)
- **Status**: On Track (green)
- **Progress**: 84%
- **Due Date**: Mar 31, 2026
- **Next Action**: "Schedule team feedback session"
- **Confidence Level**: 4/5
- **Timeframe**: Quarterly
- **KPIs** (2):
  1. Team Engagement Score: 8.4/10 of 8.5/10, ↑ +12%
  2. Employee Satisfaction: 87% of 90%, ↑ +5%
- **Last Update**: 2 hours ago

### Goal 2: Leadership Certification (At Risk)
- **Title**: "Complete leadership certification program"
- **Owner**: You
- **Type**: Personal (purple badge)
- **Status**: At Risk (yellow)
- **Progress**: 65%
- **Due Date**: Jan 31, 2026
- **Next Action**: "Complete Module 4 and submit field application"
- **Confidence Level**: 3/5
- **Timeframe**: Monthly
- **KPIs** (1):
  1. Program Progress: 65% of 100%, ↑ +15%
- **Last Update**: 1 day ago

### Goal 3: 1:1 Completion Rate (On Track)
- **Title**: "Achieve 95% 1:1 completion rate"
- **Owner**: You
- **Type**: Team (blue badge)
- **Status**: On Track (green)
- **Progress**: 94%
- **Due Date**: Jan 17, 2026
- **Next Action**: "Schedule 2 pending 1:1s"
- **Confidence Level**: 5/5
- **Timeframe**: Weekly
- **KPIs** (1):
  1. 1:1 Completion Rate: 94% of 95%, ↑ +8%
- **Last Update**: 3 hours ago

### Goal 4: Revenue Growth (On Track)
- **Title**: "Drive organizational revenue growth to $50M"
- **Owner**: Executive Team
- **Type**: Organization (green badge)
- **Status**: On Track (green)
- **Progress**: 72%
- **Due Date**: Dec 31, 2026
- **Next Action**: "Review Q1 forecast with finance team"
- **Confidence Level**: 4/5
- **Timeframe**: Quarterly
- **KPIs** (2):
  1. Annual Revenue: 36M of 50M, ↑ +18%
  2. Revenue per Employee: 245K of 300K, ↑ +12%
- **Last Update**: 5 hours ago

### Goal 5: Customer Retention (Behind)
- **Title**: "Improve customer retention to 92%"
- **Owner**: Sarah Johnson
- **Type**: Organization (green badge)
- **Status**: Behind (red)
- **Progress**: 45%
- **Due Date**: Jun 30, 2026
- **Next Action**: "Analyze churn data and develop action plan"
- **Confidence Level**: 2/5
- **Timeframe**: Quarterly
- **KPIs** (1):
  1. Customer Retention Rate: 85% of 92%, ↓ -3%
- **Last Update**: 1 day ago

---

## Icon Reference

All icons imported from `lucide-react`:

```tsx
import { 
  Plus,
  Filter,
  Download,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Clock,
  FileCheck,
  BarChart3,
  MessageSquare,
  Trophy,
  CheckCircle2
} from "lucide-react";
```

**Icon Usage**:
- `Plus` - New Goal button
- `Download` - Export Report button
- `Filter` - Type filter indicator
- `Target` - Transformation stage (Clarity)
- `FileCheck` - Transformation stage (Commitment)
- `TrendingUp` - Transformation stage (Execution), KPI positive trend
- `BarChart3` - Transformation stage (Measurement)
- `MessageSquare` - Transformation stage (Coaching)
- `Trophy` - Transformation stage (Results)
- `CheckCircle2` - Completed stages
- `AlertCircle` - Needs Attention, At Risk items
- `Clock` - Overdue items
- `TrendingDown` - KPI negative trend, Stalled items
- `ChevronDown` - Expand action (collapsed state)
- `ChevronUp` - Expand action (expanded state)
- `Calendar` - Due date indicator
- `User` - Owner indicator

---

## Color System

### Status Colors

**Goal Status**:
- On Track: `border-green-200`, `bg-green-50`, `text-green-600`
- At Risk: `border-yellow-200`, `bg-yellow-50`, `text-yellow-600`
- Behind: `border-red-200`, `bg-red-50`, `text-accent`
- Completed: `border-blue-200`, `bg-blue-50`, `text-blue-600`

**Type Badge Colors**:
- Personal: `bg-purple-100 text-purple-700`
- Team: `bg-blue-100 text-blue-700`
- Organization: `bg-green-100 text-green-700`

**KPI Trend Colors**:
- Positive: `text-green-600`
- Negative: `text-accent` (red)

**Attention Item Colors**:
- At Risk: `border-yellow-200`, `bg-yellow-50`, `text-yellow-600`
- Overdue: `border-red-200`, `bg-red-50`, `text-accent`
- Stalled: `border-orange-200`, `bg-orange-50`, `text-orange-600`

**Transformation Stage Colors**:
- Completed: `bg-accent border-2 border-accent` + `bg-green-50 text-green-600` badge
- Current: `bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20` + `bg-accent/10 text-accent` badge
- Upcoming: `bg-muted border-2 border-border` + `text-muted-foreground` text

---

## Typography Scale

- Page title (H1): Default HTML size
- Section titles (H3): Default HTML size (Goal Card title) or `text-sm` (Transformation Tracker, Needs Attention)
- H4: `text-sm` (Attention items)
- Labels: `text-xs` (uppercase with muted color for section headers)
- Body text: `text-sm`
- Meta text: `text-xs` (owner, due date, KPI counts)
- Large numbers: `text-2xl` (Stats Bar, KPI current values, Goal progress)
- Medium numbers: Not used in this section
- Small numbers: `text-xs`

---

## Spacing System

**Section Spacing**:
- Between major sections: `mb-8` (32px)
- Between filter controls and goals: `mb-6` (24px)
- Between goal cards: `gap-4` (16px in grid)

**Card Padding**:
- Goal cards: `p-5` (20px main content)
- Stats cards: `p-4` (16px)
- Needs Attention container: `p-5` (20px)
- Attention items: `p-4` (16px)
- Transformation Tracker: `p-6` (24px)
- KPI detail cards: `p-4` (16px)
- Expanded KPI section: `p-5` (20px)

**Grid Gaps**:
- Stats bar: `gap-4` (16px)
- Goals grid: `gap-4` (16px)
- Attention items: `space-y-2` (8px)
- KPI cards: `space-y-3` (12px)

**Internal Card Spacing**:
- Goal card sections: `mb-4` (16px)
- Transformation header: `mb-4` (16px)
- Transformation stage description: `mt-6 pt-6` (24px)
- KPI card content: `mb-3` (12px)
- Confidence bars: `gap-0.5` (2px)

---

## Goals Grid Layout

```tsx
<div className="grid gap-4">
  {filteredGoals.map((goal) => (
    <GoalCard key={goal.id} goal={goal} />
  ))}
</div>
```

**Specifications**:
- Single column grid
- Gap between cards: `gap-4` (16px)
- Each goal card is full width

---

## Empty State

```tsx
{filteredGoals.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    No goals found for the selected filters
  </div>
)}
```

**Specifications**:
- Padding: `py-12` (48px vertical)
- Text: `text-muted-foreground`
- Centered: `text-center`

---

## Interactive Elements

**Hover States**:
- Export button: `hover:bg-muted/50`
- New Goal button: `hover:bg-accent/90`
- Tab buttons: `hover:bg-background` (inactive only)
- Type dropdown: `hover:bg-muted/50`
- Expand button: `hover:text-accent/80`
- Review button: `hover:bg-accent/90`
- Framework Guide button: `hover:text-accent/80`

**Transitions**:
- All buttons: `transition-colors`
- Goal card: `transition-all`
- Progress bars: `transition-all`
- Transformation progress line: `transition-all duration-500`
- Transformation stage circles: `transition-all`

**Active States**:
- Active tab: `bg-accent text-accent-foreground`
- Inactive tab: `text-sidebar-foreground`

---

## Filter Behavior

**Timeframe Filter**: Filters goals by their timeframe property
- All - Shows all goals
- Quarterly - Shows only quarterly goals
- Monthly - Shows only monthly goals
- Weekly - Shows only weekly goals

**Type Filter**: Filters goals by their type property
- All Goals - Shows all goals
- Personal - Shows only personal goals
- Team - Shows only team goals
- Organization - Shows only organizational goals

**Combined Filtering**: Both filters work together (AND logic)

**Count Display**: "Showing X of Y goals" updates dynamically based on active filters

---

## Component Architecture

### GoalsPage Component
- **Purpose**: Main container with header, stats, filters, and goal list
- **State**: selectedTimeframe, selectedType
- **Renders**: Header, TransformationTracker, Stats Bar, NeedsAttention, Filters, Goal Cards

### GoalCard Component
- **Purpose**: Individual goal display with expand/collapse
- **Props**: goal object
- **State**: expanded (boolean)
- **Renders**: Goal info, progress bar, next action, confidence, KPI summary, expand button, KPI details (conditional)

### NeedsAttention Component
- **Purpose**: Alert banner for goals requiring action
- **Props**: None (uses internal data)
- **Conditional Render**: Only displays if attentionItems.length > 0
- **Renders**: Alert header, attention item list

### TransformationTracker Component
- **Purpose**: 6-stage journey progress tracker
- **Props**: None (uses internal data)
- **Renders**: Stage nodes with progress line, current stage description

---

## Summary

This document provides COMPLETE specifications for the Goals & KPIs Section including:

✅ **Goals Page** - Main catalog with header and action buttons
✅ **Transformation Tracker** - 6-stage journey visualization with progress line
✅ **Stats Bar** - 4 metrics (Total, On Track, At Risk, Behind)
✅ **Needs Attention Banner** - Alert section with 3 item types (At Risk, Overdue, Stalled)
✅ **Filter Controls** - Timeframe tabs (All, Quarterly, Monthly, Weekly) + Type dropdown (All, Personal, Team, Organization)
✅ **Goal Card Component** - Collapsed & expanded states with all details
✅ **Confidence Level Indicator** - 5-level horizontal bar visualization
✅ **KPI Detail Cards** - Expanded view with current/target values and progress bars
✅ **5 Complete Goals** - Default data with full KPI details

✅ All exact Tailwind classes and measurements
✅ Complete data structures and default values
✅ Color configurations for all status states (4 goal statuses, 3 goal types, 3 attention types)
✅ Icon mappings and usage (17 unique icons)
✅ Typography scale
✅ Spacing system
✅ Grid layouts
✅ Filter behavior logic
✅ Hover states and transitions
✅ Transformation journey stages
✅ Empty states
✅ Conditional rendering rules

Everything needed to recreate the Goals & KPIs Section pixel-perfect is included.
