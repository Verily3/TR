# Executive Dashboard - Complete Implementation Specifications

## Document Purpose
This document contains EVERY detail needed to recreate the Executive Dashboard pixel-perfect. It includes exact measurements, colors, spacing, content, layouts, and component specifications.

---

## Quick Reference

### File Structure
- **Main Dashboard**: `/src/app/App.tsx` (dashboard view)
- **Journey Hub**: `/src/app/components/JourneyHub.tsx`
- **LeaderShift Tracker**: `/src/app/components/programs/LeaderShiftTracker.tsx`
- **Onboarding Tracker**: `/src/app/components/OnboardingTracker.tsx`
- **Leaderboard**: `/src/app/components/Leaderboard.tsx`
- **My Schedule**: `/src/app/components/MySchedule.tsx`
- **Learning Queue**: `/src/app/components/LearningQueue.tsx`
- **Sidebar**: `/src/app/components/Sidebar.tsx`

### All Screens/Components Included
1. ✅ Dashboard Header with greeting
2. ✅ Onboarding Tracker (6-step progress)
3. ✅ Journey Hub (dynamic blocks)
4. ✅ LeaderShift Program Tracker (9-module progress)
5. ✅ Leaderboard (with top 3 podium and table)
6. ✅ My Schedule (upcoming sessions)
7. ✅ Learning Queue (personalized content)
8. ✅ Sidebar Navigation (left sidebar)

### Additional Components (Available but Not Used on Main Dashboard)
- **Scoreboard** (`/src/app/components/Scoreboard.tsx`): 4-card KPI dashboard
- **Transformation Tracker** (`/src/app/components/TransformationTracker.tsx`): 6-stage journey tracker

---

## Complete Screen Inventory

### Dashboard Layout Structure

**Container**:
```tsx
<div className="flex h-screen bg-background">
  <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
  
  <main className="flex-1 overflow-auto">
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Dashboard Content */}
    </div>
  </main>
</div>
```

**Layout Specifications**:
- Max width: `max-w-[1400px]` (1400px)
- Padding: `p-8` (32px all sides)
- Background: `bg-background`
- Overflow: `overflow-auto` (allows scrolling)

---

### 1. Dashboard Header

```tsx
<div className="mb-8">
  <h1 className="text-sidebar-foreground mb-2">Welcome back, John</h1>
  <p className="text-muted-foreground">
    Wednesday, January 14, 2026 • You have 2 actions that need attention
  </p>
</div>
```

**Specifications**:
- **H1**: Default HTML size, `text-sidebar-foreground`, `mb-2` (8px margin bottom)
- **Subtitle**: `text-muted-foreground` (gray text)
- **Content**: Dynamic greeting with user name, current date, and attention items count
- **Spacing**: `mb-8` (32px margin bottom to next section)

---

### 2. Onboarding Tracker

**Purpose**: Shows new users their progress through initial setup (6 steps)

**Container**:
```tsx
<div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
  {/* Content */}
</div>
```

**Header Section**:
```tsx
<div className="mb-6">
  <div className="flex items-center justify-between mb-2">
    <div>
      <h3 className="text-sidebar-foreground mb-1">Welcome to Results Tracking System</h3>
      <p className="text-sm text-muted-foreground">Complete your onboarding to unlock the full platform</p>
    </div>
    <div className="text-right">
      <div className="text-2xl text-sidebar-foreground">2/6</div>
      <div className="text-xs text-muted-foreground">Steps Complete</div>
    </div>
  </div>

  {/* Overall Progress Bar */}
  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
    <div
      className="h-full bg-accent transition-all duration-500"
      style={{ width: `33%` }}
    />
  </div>
</div>
```

**Steps Layout**:
```tsx
<div className="relative">
  {/* Progress Line Background */}
  <div 
    className="absolute top-[26px] left-0 right-0 h-0.5 bg-blue-200" 
    style={{ marginLeft: "32px", marginRight: "32px" }} 
  />
  
  {/* Active Progress Line */}
  <div 
    className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500" 
    style={{ 
      marginLeft: "32px",
      width: `calc(33% - 32px)`
    }} 
  />

  {/* Steps Container */}
  <div className="relative flex items-start justify-between">
    {/* Individual steps */}
  </div>
</div>
```

**Individual Step** (Completed):
```tsx
<div className="flex flex-col items-center" style={{ width: "110px" }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-accent border-2 border-accent">
    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
  </div>

  {/* Label */}
  <div className="text-center">
    <div className="text-xs mb-1 text-sidebar-foreground">
      Profile Setup
    </div>
    <div className="text-xs text-muted-foreground">
      Step 1
    </div>
  </div>
</div>
```

**Individual Step** (Current - with pulse animation):
```tsx
<div className="flex flex-col items-center" style={{ width: "110px" }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20 animate-pulse">
    <Target className="w-6 h-6 text-accent-foreground" />
  </div>

  {/* Label */}
  <div className="text-center">
    <div className="text-xs mb-1 text-sidebar-foreground font-medium">
      Goal Setting
    </div>
    <div className="text-xs text-muted-foreground">
      Step 3
    </div>
  </div>
</div>
```

**Individual Step** (Upcoming):
```tsx
<div className="flex flex-col items-center" style={{ width: "110px" }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-white border-2 border-blue-200">
    <BookOpen className="w-6 h-6 text-muted-foreground" />
  </div>

  {/* Label */}
  <div className="text-center">
    <div className="text-xs mb-1 text-muted-foreground">
      Program Selection
    </div>
    <div className="text-xs text-muted-foreground">
      Step 4
    </div>
  </div>
</div>
```

**All 6 Steps**:
1. Profile Setup (User icon)
2. Assessment (ClipboardCheck icon)
3. Goal Setting (Target icon)
4. Program Selection (BookOpen icon)
5. Team Connection (Users icon)
6. Ready to Launch (Rocket icon)

**CTA Footer**:
```tsx
<div className="mt-6 pt-6 border-t border-blue-200 flex items-center justify-between">
  <div>
    <div className="text-sm text-sidebar-foreground mb-1">
      Next: Goal Setting
    </div>
    <div className="text-xs text-muted-foreground">
      Set your quarterly goals to align your learning with results
    </div>
  </div>
  <button className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors shadow-sm">
    Continue Setup
  </button>
</div>
```

---

### 3. Journey Hub

**Purpose**: Dynamic blocks showing next actions (4 blocks in 2x2 grid)

**Section Header**:
```tsx
<div className="mb-6">
  <h2 className="text-sidebar-foreground">Journey Hub</h2>
  <p className="text-sm text-muted-foreground mt-1">Your next actions to accelerate progress</p>
</div>
```

**LeaderShift Program Tracker** (see section 4 below)

**Journey Blocks Grid**:
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Journey blocks */}
</div>
```

**Journey Block** (with progress):
```tsx
<div className="bg-card border border-border rounded-lg p-5 hover:border-accent/30 transition-all cursor-pointer group">
  <div className="flex items-start gap-4">
    {/* Icon */}
    <div className="p-2 rounded-lg bg-muted">
      <PlayCircle className="w-5 h-5 text-accent" />
    </div>

    {/* Content */}
    <div className="flex-1">
      <h3 className="text-sm mb-1">LeaderShift: Module 3 - Leading Yourself</h3>
      <p className="text-xs text-muted-foreground mb-4">
        5 of 7 tasks complete • 1,200 points earned
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: '71%' }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">71% complete</div>
      </div>

      {/* Action Button */}
      <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
        Continue Module
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  </div>
</div>
```

**Journey Block** (without progress):
```tsx
<div className="bg-card border border-border rounded-lg p-5 hover:border-accent/30 transition-all cursor-pointer group">
  <div className="flex items-start gap-4">
    {/* Icon */}
    <div className="p-2 rounded-lg bg-muted">
      <Target className="w-5 h-5 text-accent" />
    </div>

    {/* Content */}
    <div className="flex-1">
      <h3 className="text-sm mb-1">Submit Module 3 Goal</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Due tomorrow • Worth 1,000 points
      </p>

      {/* Action Button */}
      <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
        Enter Goal
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  </div>
</div>
```

**Default Journey Blocks** (4 blocks):
1. **LeaderShift: Module 3 - Leading Yourself**
   - Icon: PlayCircle
   - Description: "5 of 7 tasks complete • 1,200 points earned"
   - Progress: 71%
   - Action: "Continue Module"

2. **Submit Module 3 Goal**
   - Icon: Target
   - Description: "Due tomorrow • Worth 1,000 points"
   - Action: "Enter Goal"

3. **Mentor Meeting Scheduled**
   - Icon: FileText
   - Description: "Thursday 2pm with Sarah Chen"
   - Action: "View Details"

4. **2 Team KPIs Need Update**
   - Icon: TrendingUp
   - Description: "Weekly review due Friday"
   - Action: "Update KPIs"

---

### 4. LeaderShift Program Tracker

**Purpose**: Horizontal progress tracker for 9-module program

**Container**:
```tsx
<div className="mb-8 p-6 bg-card border border-border rounded-lg">
  {/* Content */}
</div>
```

**Header**:
```tsx
<div className="flex items-start justify-between mb-6">
  <div>
    <div className="flex items-center gap-2 mb-2">
      <BookOpen className="w-5 h-5 text-accent" />
      <h3 className="text-sidebar-foreground">Current Program</h3>
    </div>
    <p className="text-sm text-muted-foreground mb-1">LeaderShift</p>
    <p className="text-xs text-muted-foreground">9-Module Leadership Development Program</p>
  </div>
  <div className="text-right">
    <div className="text-3xl text-sidebar-foreground mb-1">33%</div>
    <div className="text-xs text-muted-foreground">Complete</div>
  </div>
</div>
```

**Module Progress Tracker**:
```tsx
<div className="relative mb-6">
  {/* Background Line */}
  <div 
    className="absolute top-[26px] left-0 right-0 h-0.5 bg-border" 
    style={{ marginLeft: "20px", marginRight: "20px" }} 
  />

  {/* Active Progress Line */}
  <div
    className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500"
    style={{
      marginLeft: "20px",
      width: `calc(25% - 20px)`, // 2 out of 8 gaps (currentModuleIndex / (modules.length - 1))
    }}
  />

  {/* Modules */}
  <div className="relative flex items-start justify-between">
    {/* Individual modules */}
  </div>
</div>
```

**Module Item** (Completed):
```tsx
<div className="flex flex-col items-center" style={{ width: "80px" }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-accent border-2 border-accent">
    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
  </div>

  {/* Label */}
  <div className="text-center">
    <div className="text-xs mb-1 text-sidebar-foreground" style={{ minHeight: "32px" }}>
      Kick-off
    </div>
    <div className="text-xs text-muted-foreground">
      1/1 tasks
    </div>
  </div>
</div>
```

**Module Item** (In Progress):
```tsx
<div className="flex flex-col items-center" style={{ width: "80px" }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20">
    <div className="text-lg text-accent-foreground">3</div>
  </div>

  {/* Label */}
  <div className="text-center">
    <div className="text-xs mb-1 text-sidebar-foreground font-medium line-clamp-2" style={{ minHeight: "32px" }}>
      Leading Yourself
    </div>
    <div className="text-xs text-muted-foreground">
      5/7 tasks
    </div>
    <div className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
      In Progress
    </div>
  </div>
</div>
```

**Module Item** (Not Started):
```tsx
<div className="flex flex-col items-center" style={{ width: "80px" }}>
  {/* Icon Circle */}
  <div className="relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all bg-muted border-2 border-border">
    <div className="text-lg text-muted-foreground">4</div>
  </div>

  {/* Label */}
  <div className="text-center">
    <div className="text-xs mb-1 text-muted-foreground line-clamp-2" style={{ minHeight: "32px" }}>
      Planning Performance
    </div>
  </div>
</div>
```

**All 9 Modules**:
1. Kick-off (completed)
2. The Leader and The Manager (completed)
3. Leading Yourself (in-progress, 5/7 tasks)
4. Planning Performance (not started)
5. Coaching to Improve Performance (not started)
6. Coaching For Development (not started)
7. Leading A Team (not started)
8. Counselling and Corrective Action (not started)
9. Leadership Thinking (not started)

**Overall Progress Bar**:
```tsx
<div className="mb-4">
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-accent transition-all duration-500" style={{ width: '33%' }} />
  </div>
</div>
```

**Next Action Footer**:
```tsx
<div className="flex items-center justify-between pt-4 border-t border-border">
  <div>
    <div className="text-xs text-muted-foreground mb-1">NEXT ACTION</div>
    <div className="text-sm text-sidebar-foreground">Complete Module 3: Leading Yourself</div>
  </div>
  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Continue Learning
  </button>
</div>
```

---

### 5. Leaderboard

**Purpose**: Gamified progress tracking with team rankings

**Section Header**:
```tsx
<div className="mb-6 flex items-center justify-between">
  <div>
    <h2 className="text-sidebar-foreground flex items-center gap-2">
      <Trophy className="w-5 h-5 text-accent" />
      Leaderboard
    </h2>
    <p className="text-sm text-muted-foreground mt-1">Track your progress against peers and goals</p>
  </div>

  {/* Filters */}
  <div className="flex gap-2">
    {/* View Type Toggle */}
    <div className="flex bg-muted rounded-lg p-1">
      <button className="px-3 py-1.5 rounded text-xs bg-card text-sidebar-foreground shadow-sm">
        My Team
      </button>
      <button className="px-3 py-1.5 rounded text-xs text-muted-foreground">
        Organization
      </button>
    </div>

    {/* Time Filter */}
    <div className="flex bg-muted rounded-lg p-1">
      <button className="px-3 py-1.5 rounded text-xs text-muted-foreground">
        This Week
      </button>
      <button className="px-3 py-1.5 rounded text-xs bg-card text-sidebar-foreground shadow-sm">
        This Month
      </button>
      <button className="px-3 py-1.5 rounded text-xs text-muted-foreground">
        All Time
      </button>
    </div>
  </div>
</div>
```

**Current User Summary Card**:
```tsx
<div className="mb-6 p-6 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg">
  <div className="flex items-center justify-between">
    {/* Left: Position */}
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg">
        JD
      </div>
      <div>
        <div className="text-sm text-sidebar-foreground mb-1">Your Position</div>
        <div className="flex items-center gap-2">
          <span className="text-2xl text-sidebar-foreground">#2</span>
          <span className="text-sm text-muted-foreground">of 8</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600">
            <ChevronUp className="w-3 h-3" />
            1
          </div>
        </div>
      </div>
    </div>

    {/* Right: Stats */}
    <div className="flex gap-8 text-right">
      <div>
        <div className="text-xs text-muted-foreground mb-1">TOTAL POINTS</div>
        <div className="text-2xl text-sidebar-foreground">11,800</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">PROGRESS</div>
        <div className="text-2xl text-sidebar-foreground">71%</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">GAP TO #1</div>
        <div className="text-2xl text-accent">650</div>
      </div>
    </div>
  </div>
</div>
```

**Top 3 Podium**:
```tsx
<div className="mb-6 grid grid-cols-3 gap-4">
  {/* Rank 1 */}
  <div className="relative p-6 border rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-600">
    {/* Rank Badge */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-current shadow-lg">
      <Crown className="w-5 h-5 text-yellow-500" />
    </div>

    <div className="text-center mt-4">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg mx-auto mb-3 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
        SC
      </div>

      <div className="text-sm text-sidebar-foreground mb-1">Sarah Chen</div>
      <div className="text-xs text-muted-foreground mb-3">Senior Manager</div>

      {/* Points */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Award className="w-4 h-4 text-accent" />
        <span className="text-lg text-sidebar-foreground">12,450</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: '87%' }} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">87% complete</div>
    </div>
  </div>

  {/* Rank 2 (silver) */}
  <div className="relative p-6 border rounded-lg bg-gradient-to-br from-gray-400/20 to-gray-500/10 border-gray-400/30 text-gray-500 ring-2 ring-accent/50">
    {/* Rank Badge */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-current shadow-lg">
      <Medal className="w-5 h-5 text-gray-400" />
    </div>

    <div className="text-center mt-4">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg mx-auto mb-3 bg-gradient-to-br from-gray-400 to-gray-500 text-white">
        JD
      </div>

      <div className="text-sm text-sidebar-foreground mb-1">John Doe</div>
      <div className="text-xs text-muted-foreground mb-3">Executive</div>

      {/* Points */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Award className="w-4 h-4 text-accent" />
        <span className="text-lg text-sidebar-foreground">11,800</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: '71%' }} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">71% complete</div>
    </div>
  </div>

  {/* Rank 3 (bronze) */}
  <div className="relative p-6 border rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-600">
    {/* Rank Badge */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-current shadow-lg">
      <Medal className="w-5 h-5 text-orange-600" />
    </div>

    <div className="text-center mt-4">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg mx-auto mb-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        MT
      </div>

      <div className="text-sm text-sidebar-foreground mb-1">Michael Torres</div>
      <div className="text-xs text-muted-foreground mb-3">Director</div>

      {/* Points */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Award className="w-4 h-4 text-accent" />
        <span className="text-lg text-sidebar-foreground">11,200</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: '68%' }} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">68% complete</div>
    </div>
  </div>
</div>
```

**Rest of Leaderboard Table**:
```tsx
<div className="bg-card border border-border rounded-lg overflow-hidden">
  {/* Table Header */}
  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border text-xs text-muted-foreground">
    <div className="col-span-1">RANK</div>
    <div className="col-span-4">NAME</div>
    <div className="col-span-2 text-right">POINTS</div>
    <div className="col-span-3">PROGRESS</div>
    <div className="col-span-2 text-center">CHANGE</div>
  </div>

  {/* Table Rows */}
  <div className="divide-y divide-border">
    {/* Example Row (Rank 4) */}
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
      {/* Rank */}
      <div className="col-span-1 flex items-center">
        <span className="text-sm text-muted-foreground">#4</span>
      </div>

      {/* Name & Role */}
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-sidebar-foreground">
          EW
        </div>
        <div>
          <div className="text-sm text-sidebar-foreground">Emma Williams</div>
          <div className="text-xs text-muted-foreground">Manager</div>
        </div>
      </div>

      {/* Points */}
      <div className="col-span-2 flex items-center justify-end">
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-accent" />
          <span className="text-sm text-sidebar-foreground">10,850</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="col-span-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: '65%' }} />
        </div>
        <span className="text-xs text-muted-foreground w-8">65%</span>
      </div>

      {/* Change */}
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
          <ChevronUp className="w-3 h-3" />
          3
        </div>
      </div>
    </div>

    {/* More rows... */}
  </div>
</div>
```

**Team Insights Cards** (bottom):
```tsx
<div className="mt-6 grid grid-cols-3 gap-4">
  {/* Team Average */}
  <div className="p-4 bg-card border border-border rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <TrendingUp className="w-4 h-4 text-accent" />
      <span className="text-xs text-muted-foreground">TEAM AVERAGE</span>
    </div>
    <div className="text-2xl text-sidebar-foreground">10,306</div>
    <div className="text-xs text-green-600 mt-1">+12% from last month</div>
  </div>

  {/* Top Performer */}
  <div className="p-4 bg-card border border-border rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Trophy className="w-4 h-4 text-accent" />
      <span className="text-xs text-muted-foreground">TOP PERFORMER</span>
    </div>
    <div className="text-2xl text-sidebar-foreground">Sarah Chen</div>
    <div className="text-xs text-muted-foreground mt-1">12,450 points</div>
  </div>

  {/* Team Goal */}
  <div className="p-4 bg-card border border-border rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Award className="w-4 h-4 text-accent" />
      <span className="text-xs text-muted-foreground">TEAM GOAL</span>
    </div>
    <div className="text-2xl text-sidebar-foreground">85%</div>
    <div className="text-xs text-muted-foreground mt-1">Program completion</div>
  </div>
</div>
```

**All Leaderboard Data** (8 participants):
1. Sarah Chen - Senior Manager - 12,450 pts - 87% - +2
2. John Doe (You) - Executive - 11,800 pts - 71% - +1
3. Michael Torres - Director - 11,200 pts - 68% - -1
4. Emma Williams - Manager - 10,850 pts - 65% - +3
5. David Park - Team Lead - 10,300 pts - 62% - 0
6. Lisa Johnson - Manager - 9,750 pts - 58% - -2
7. Robert Kim - Senior Manager - 9,200 pts - 55% - +1
8. Amanda Foster - Director - 8,900 pts - 53% - 0

---

### 6. My Schedule

**Purpose**: Upcoming coaching and group sessions

**Section Header**:
```tsx
<div className="mb-6 flex items-center justify-between">
  <div>
    <h2 className="text-sidebar-foreground">My Schedule</h2>
    <p className="text-sm text-muted-foreground mt-1">Upcoming coaching and group sessions</p>
  </div>
  <button className="text-sm text-accent hover:underline">View Calendar</button>
</div>
```

**Schedule Items**:
```tsx
<div className="space-y-3">
  {/* Coaching Session */}
  <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-accent/30 transition-all">
    <div className="p-2 rounded-lg bg-muted">
      <Video className="w-5 h-5 text-accent" />
    </div>

    <div className="flex-1">
      <h4 className="text-sm mb-1">1:1 Coaching Session</h4>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Today, 2:00 PM
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          45 min
        </span>
      </div>
    </div>

    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Join
    </button>
  </div>

  {/* Group Session */}
  <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-accent/30 transition-all">
    <div className="p-2 rounded-lg bg-muted">
      <Users className="w-5 h-5 text-accent" />
    </div>

    <div className="flex-1">
      <h4 className="text-sm mb-1">Leadership Cohort Call</h4>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Tomorrow, 10:00 AM
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          60 min
        </span>
        <span>12 participants</span>
      </div>
    </div>

    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Join
    </button>
  </div>

  {/* Another Coaching Session */}
  <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-accent/30 transition-all">
    <div className="p-2 rounded-lg bg-muted">
      <Video className="w-5 h-5 text-accent" />
    </div>

    <div className="flex-1">
      <h4 className="text-sm mb-1">Check-in with Coach Sarah</h4>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Jan 17, 3:30 PM
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          30 min
        </span>
      </div>
    </div>

    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Join
    </button>
  </div>
</div>
```

**Default Schedule Items** (3 items):
1. **1:1 Coaching Session** (coaching type, Video icon)
   - Date: Today, 2:00 PM
   - Duration: 45 min

2. **Leadership Cohort Call** (group type, Users icon)
   - Date: Tomorrow, 10:00 AM
   - Duration: 60 min
   - Participants: 12 participants

3. **Check-in with Coach Sarah** (coaching type, Video icon)
   - Date: Jan 17, 3:30 PM
   - Duration: 30 min

---

### 7. Learning Queue

**Purpose**: Personalized learning content recommendations

**Section Header**:
```tsx
<div className="mb-6">
  <h2 className="text-sidebar-foreground">Learning Queue</h2>
  <p className="text-sm text-muted-foreground mt-1">Personalized content to accelerate your growth</p>
</div>
```

**Learning Items**:
```tsx
<div className="space-y-3">
  {/* Video Item */}
  <div className="bg-card border border-border rounded-lg p-4 hover:border-accent/30 transition-all cursor-pointer group">
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-muted">
        <Video className="w-5 h-5 text-accent" />
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-sm">Communicating Vision Under Pressure</h4>
          <span className="text-xs text-muted-foreground">12 min</span>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          Recommended based on your Team Engagement KPI
        </p>

        <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs mb-3">
          Linked to: Team Engagement Score
        </div>

        <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all mt-2">
          Start Learning
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>

  {/* Article Item */}
  <div className="bg-card border border-border rounded-lg p-4 hover:border-accent/30 transition-all cursor-pointer group">
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-muted">
        <BookOpen className="w-5 h-5 text-accent" />
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-sm">The Science of Goal Achievement</h4>
          <span className="text-xs text-muted-foreground">8 min read</span>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          Align with your Q1 strategic objectives
        </p>

        <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs mb-3">
          Linked to: Goal Achievement
        </div>

        <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all mt-2">
          Start Learning
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>

  {/* Template Item */}
  <div className="bg-card border border-border rounded-lg p-4 hover:border-accent/30 transition-all cursor-pointer group">
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-muted">
        <FileText className="w-5 h-5 text-accent" />
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-sm">1:1 Coaching Conversation Framework</h4>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          Prepare for your upcoming coaching session
        </p>

        <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs mb-3">
          Linked to: 1:1 Completion Rate
        </div>

        <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all mt-2">
          Download
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</div>
```

**Default Learning Items** (3 items):
1. **Communicating Vision Under Pressure** (video type)
   - Duration: 12 min
   - Description: "Recommended based on your Team Engagement KPI"
   - Linked to: Team Engagement Score
   - Action: "Start Learning"

2. **The Science of Goal Achievement** (article type)
   - Duration: 8 min read
   - Description: "Align with your Q1 strategic objectives"
   - Linked to: Goal Achievement
   - Action: "Start Learning"

3. **1:1 Coaching Conversation Framework** (template type)
   - Description: "Prepare for your upcoming coaching session"
   - Linked to: 1:1 Completion Rate
   - Action: "Download"

---

## Two-Column Layout

**Container** (below Leaderboard):
```tsx
<div className="grid grid-cols-2 gap-8">
  {/* My Schedule */}
  <div>
    <MySchedule />
  </div>

  {/* Learning Queue */}
  <div>
    <LearningQueue />
  </div>
</div>
```

---

## Complete Component Specifications

### Toggle Switch Pattern (for filters)

**Container with Active State**:
```tsx
<div className="flex bg-muted rounded-lg p-1">
  <button className="px-3 py-1.5 rounded text-xs bg-card text-sidebar-foreground shadow-sm transition-colors">
    My Team
  </button>
  <button className="px-3 py-1.5 rounded text-xs text-muted-foreground transition-colors">
    Organization
  </button>
</div>
```

**Specifications**:
- Container: `bg-muted rounded-lg p-1`
- Active button: `bg-card text-sidebar-foreground shadow-sm`
- Inactive button: `text-muted-foreground`
- Padding: `px-3 py-1.5` (12px horizontal, 6px vertical)
- Font size: `text-xs`
- Border radius: `rounded` (4px)
- Transition: `transition-colors`

### Progress Bar Pattern

**Basic Progress Bar**:
```tsx
<div className="h-1.5 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-accent transition-all"
    style={{ width: '71%' }}
  />
</div>
```

**With Percentage Label**:
```tsx
<div className="flex items-center gap-2">
  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
    <div
      className="h-full bg-accent transition-all"
      style={{ width: '71%' }}
    />
  </div>
  <span className="text-xs text-muted-foreground w-8">71%</span>
</div>
```

**Large Progress Bar** (for onboarding):
```tsx
<div className="h-2 bg-white/60 rounded-full overflow-hidden">
  <div
    className="h-full bg-accent transition-all duration-500"
    style={{ width: '33%' }}
  />
</div>
```

**Specifications**:
- Small height: `h-1.5` (6px)
- Large height: `h-2` (8px)
- Container background: `bg-muted` or `bg-white/60`
- Fill: `bg-accent`
- Border radius: `rounded-full`
- Transition: `transition-all` or `transition-all duration-500`
- Width: Dynamic via inline style

### Avatar Pattern

**Text Avatar** (small):
```tsx
<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-sidebar-foreground">
  EW
</div>
```

**Text Avatar** (medium):
```tsx
<div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg">
  JD
</div>
```

**Text Avatar** (large with gradient):
```tsx
<div className="w-16 h-16 rounded-full flex items-center justify-center text-lg mx-auto mb-3 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
  SC
</div>
```

**Specifications**:
- Small: `w-8 h-8 text-xs`
- Medium: `w-12 h-12 text-lg`
- Large: `w-16 h-16 text-lg`
- Always: `rounded-full flex items-center justify-center`
- Background options:
  - Gray: `bg-muted text-sidebar-foreground`
  - Accent: `bg-accent text-accent-foreground`
  - Gold gradient: `bg-gradient-to-br from-yellow-500 to-yellow-600 text-white`
  - Silver gradient: `bg-gradient-to-br from-gray-400 to-gray-500 text-white`
  - Bronze gradient: `bg-gradient-to-br from-orange-500 to-orange-600 text-white`

### Badge Pattern

**Status Badge**:
```tsx
<div className="inline-block px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
  In Progress
</div>
```

**Change Badge** (positive):
```tsx
<div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
  <ChevronUp className="w-3 h-3" />
  3
</div>
```

**Change Badge** (negative):
```tsx
<div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-600">
  <ChevronDown className="w-3 h-3" />
  2
</div>
```

**Linked-to Badge**:
```tsx
<div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs">
  Linked to: Team Engagement Score
</div>
```

**Specifications**:
- Padding: `px-2 py-0.5` or `px-2 py-1`
- Border radius: `rounded-full` or `rounded`
- Font size: `text-xs`
- Background patterns:
  - Accent: `bg-accent/10 text-accent`
  - Green: `bg-green-500/10 text-green-600`
  - Red: `bg-red-500/10 text-red-600`
- Icon size in badges: `w-3 h-3`

### Icon Box Pattern

**Standard Icon Box**:
```tsx
<div className="p-2 rounded-lg bg-muted">
  <PlayCircle className="w-5 h-5 text-accent" />
</div>
```

**Specifications**:
- Padding: `p-2` (8px)
- Border radius: `rounded-lg` (8px)
- Background: `bg-muted`
- Icon size: `w-5 h-5` (20px)
- Icon color: `text-accent`

### Card Pattern

**Standard Card**:
```tsx
<div className="bg-card border border-border rounded-lg p-5">
  {/* Content */}
</div>
```

**Hoverable Card**:
```tsx
<div className="bg-card border border-border rounded-lg p-5 hover:border-accent/30 transition-all cursor-pointer group">
  {/* Content */}
</div>
```

**Gradient Card** (for special sections):
```tsx
<div className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg">
  {/* Content */}
</div>
```

**Specifications**:
- Background: `bg-card`
- Border: `border border-border`
- Border radius: `rounded-lg` (8px)
- Padding: `p-4`, `p-5`, or `p-6` depending on content density
- Hover: `hover:border-accent/30 transition-all`
- Cursor: `cursor-pointer` if clickable
- Group for hover effects: `group`

### Button Pattern

**Primary Button**:
```tsx
<button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
  Continue Learning
</button>
```

**Primary Button** (larger):
```tsx
<button className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors shadow-sm">
  Continue Setup
</button>
```

**Text Link Button**:
```tsx
<button className="text-sm text-accent hover:underline">
  View Calendar
</button>
```

**Inline Action Button** (with arrow animation):
```tsx
<button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
  Continue Module
  <ArrowRight className="w-3 h-3" />
</button>
```

**Specifications**:
- Primary padding: `px-4 py-2` or `px-5 py-2.5`
- Background: `bg-accent`
- Text color: `text-accent-foreground`
- Border radius: `rounded-lg`
- Font size: `text-sm` or `text-xs`
- Hover: `hover:bg-accent/90`
- Transition: `transition-colors` or `transition-all`
- Optional shadow: `shadow-sm`

### Spacing System

**Vertical Spacing** (between sections):
- Header to content: `mb-8` (32px)
- Between major sections: `mb-10` or `mb-8`
- Between section header and content: `mb-6` (24px)
- Between items in list: `space-y-3` (12px) or `space-y-4` (16px)

**Horizontal Spacing** (grid gaps):
- Two-column layout: `gap-8` (32px)
- Grid items: `gap-4` (16px)
- Inline items: `gap-2` (8px) or `gap-3` (12px)

### Typography Scale

**Headings**:
- H1: Default HTML size
- H2: Default HTML size
- H3: Default HTML size
- Section labels: `text-xs uppercase tracking-wider` (all caps)

**Body Text**:
- Regular: Default HTML size
- Small: `text-sm`
- Extra small: `text-xs`
- Large numbers: `text-2xl` or `text-3xl`

**Colors**:
- Primary text: `text-sidebar-foreground`
- Secondary text: `text-muted-foreground`
- Accent text: `text-accent`
- Success: `text-green-600`
- Error: `text-red-600`

### Icon Sizes

**Standard Sizes**:
- Extra small: `w-3 h-3` (12px) - Used in badges, inline
- Small: `w-4 h-4` (16px) - Used in cards, labels
- Medium: `w-5 h-5` (20px) - Default for most icons
- Large: `w-6 h-6` (24px) - Used in circles, headers

---

## Example Data Summary

### Onboarding Steps (6 total):
1. Profile Setup (completed)
2. Assessment (completed)
3. Goal Setting (current)
4. Program Selection (upcoming)
5. Team Connection (upcoming)
6. Ready to Launch (upcoming)

### Journey Blocks (4 blocks):
1. LeaderShift Module 3 (71% complete)
2. Submit Module 3 Goal (due tomorrow)
3. Mentor Meeting (Thursday 2pm)
4. Update 2 Team KPIs (due Friday)

### LeaderShift Modules (9 total):
1-2: Completed
3: In progress (5/7 tasks)
4-9: Not started

### Leaderboard Participants (8 total):
See section 5 for complete list

### Schedule Items (3 items):
See section 6 for complete list

### Learning Queue Items (3 items):
See section 7 for complete list

---

## Responsive Behavior

**Current Implementation**: Desktop-first (1400px max width)

**Breakpoints** (future consideration):
- Desktop: 1400px+ (current design)
- Tablet: 768px-1399px (would need adjusted grid)
- Mobile: <768px (would stack vertically)

**Key Responsive Elements**:
- Journey Hub: 2x2 grid → single column on mobile
- Leaderboard podium: 3 columns → stack on mobile
- Two-column layout (Schedule/Queue): side-by-side → stack on mobile
- LeaderShift tracker: horizontal scroll or stack on mobile

---

## Animation Details

**Pulse Animation** (current onboarding step):
- Class: `animate-pulse`
- Applied to current step circle
- Creates breathing effect to draw attention

**Transition Durations**:
- Default: `transition-colors` (200ms)
- Progress bars: `transition-all duration-500` (500ms)
- Hover effects: `transition-all` (200ms)

**Hover Effects**:
- Cards: Border changes to `border-accent/30`
- Buttons: Background opacity changes to `bg-accent/90`
- Inline actions: Gap increases from `gap-1` to `gap-2` (arrow slides right)

---

## Color Palette

**Semantic Colors**:
- `--accent`: Primary red (used for CTAs, progress, highlights)
- `--accent-foreground`: White text on accent
- `--background`: Main background (light)
- `--card`: Card background (white)
- `--border`: Border color (light gray)
- `--sidebar-foreground`: Primary text (dark gray/charcoal)
- `--muted-foreground`: Secondary text (medium gray)
- `--muted`: Subtle backgrounds (very light gray)
- `--sidebar`: Sidebar background (darker than main background)
- `--sidebar-border`: Sidebar border color
- `--sidebar-accent`: Sidebar hover state

**Special Colors**:
- Blue (onboarding): `from-blue-50 to-purple-50 border-blue-200`
- Gold (rank 1): `from-yellow-500 to-yellow-600`
- Silver (rank 2): `from-gray-400 to-gray-500`
- Bronze (rank 3): `from-orange-500 to-orange-600`
- Green (positive change): `bg-green-500/10 text-green-600`
- Red (negative change): `bg-red-500/10 text-red-600`

---

## 8. Sidebar Navigation

**Purpose**: Left navigation panel for primary app navigation

**Container**:
```tsx
<div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
  {/* Logo Section */}
  {/* Navigation */}
  {/* User Profile */}
</div>
```

**Specifications**:
- Width: `w-64` (256px fixed)
- Height: `h-screen` (full viewport height)
- Background: `bg-sidebar`
- Border: `border-r border-sidebar-border`
- Layout: `flex flex-col` (vertical flex)

---

### Logo Section

```tsx
<div className="p-6 border-b border-sidebar-border">
  <div className="flex items-center gap-3">
    <img src={logoIcon} alt="RTS" className="w-8 h-8" />
    <div>
      <div className="text-sm tracking-wide text-sidebar-foreground">Results Tracking</div>
      <div className="text-xs text-muted-foreground">System</div>
    </div>
  </div>
</div>
```

**Specifications**:
- Padding: `p-6` (24px all sides)
- Border: `border-b border-sidebar-border`
- Logo size: `w-8 h-8` (32px)
- Layout: Flex with gap-3 (12px)
- Title: `text-sm tracking-wide text-sidebar-foreground`
- Subtitle: `text-xs text-muted-foreground`

---

### Navigation Section

```tsx
<nav className="flex-1 p-4">
  <ul className="space-y-1">
    {/* Main navigation items */}
  </ul>

  {/* Admin Section */}
  <div className="mt-8">
    <div className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider">
      Admin
    </div>
    <ul className="space-y-1">
      {/* Admin items */}
    </ul>
  </div>
</nav>
```

**Specifications**:
- Container: `flex-1 p-4` (grows to fill space, 16px padding)
- List spacing: `space-y-1` (4px between items)
- Admin section margin: `mt-8` (32px from main nav)
- Admin label: `text-xs text-muted-foreground uppercase tracking-wider`

---

### Navigation Item (Inactive)

```tsx
<li>
  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent">
    <Home className="w-5 h-5" />
    <span>Dashboard</span>
  </button>
</li>
```

### Navigation Item (Active)

```tsx
<li>
  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-accent text-accent-foreground">
    <BookOpen className="w-5 h-5" />
    <span>Programs</span>
  </button>
</li>
```

**Specifications**:
- Width: `w-full`
- Layout: `flex items-center gap-3` (icon + text with 12px gap)
- Padding: `px-3 py-2.5` (12px horizontal, 10px vertical)
- Border radius: `rounded-lg`
- Transition: `transition-colors`
- Active state: `bg-accent text-accent-foreground`
- Inactive state: `text-sidebar-foreground hover:bg-sidebar-accent`
- Icon size: `w-5 h-5` (20px)

---

### All Navigation Items (6 main + 1 admin)

**Main Navigation**:
1. **Dashboard** (Home icon) - page: "dashboard"
2. **Programs** (BookOpen icon) - page: "programs"
3. **Scorecard** (BarChart3 icon) - page: "scorecard"
4. **Goals** (Target icon) - page: "goals"
5. **Coaching** (Users icon) - page: "coaching"
6. **Assessments** (ClipboardCheck icon) - page: "assessments"

**Admin Section**:
7. **Program Builder** (Settings icon) - page: "program-builder"

---

### User Profile Section (Bottom)

```tsx
<div className="p-4 border-t border-sidebar-border">
  <div className="flex items-center gap-3 px-3 py-2">
    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
      JD
    </div>
    <div className="flex-1">
      <div className="text-sm text-sidebar-foreground">John Doe</div>
      <div className="text-xs text-muted-foreground">Executive</div>
    </div>
  </div>
</div>
```

**Specifications**:
- Container padding: `p-4` (16px)
- Border: `border-t border-sidebar-border`
- Content padding: `px-3 py-2` (12px horizontal, 8px vertical)
- Layout: Flex with gap-3 (12px)
- Avatar: `w-8 h-8 rounded-full bg-accent text-accent-foreground`
- Name: `text-sm text-sidebar-foreground`
- Role: `text-xs text-muted-foreground`

---

### Sidebar Logo Asset

**Logo Import**:
```tsx
import logoIcon from "figma:asset/26c4afcb760ca0948720d594753021faa4c27f19.png";
```

**Usage**:
```tsx
<img src={logoIcon} alt="RTS" className="w-8 h-8" />
```

**Note**: Logo is imported using the `figma:asset` virtual module scheme (see images guidance in main documentation).

---

## Summary

This document provides COMPLETE specifications for the Executive Dashboard including:

✅ Dashboard header with dynamic greeting
✅ Onboarding Tracker (6-step horizontal progress)
✅ Journey Hub (4 dynamic action blocks + LeaderShift tracker)
✅ LeaderShift Program Tracker (9-module horizontal progress)
✅ Leaderboard (top 3 podium, table, filters, insights)
✅ My Schedule (3 upcoming sessions)
✅ Learning Queue (3 personalized items)
✅ Sidebar Navigation (logo, nav items, user profile)
✅ All component patterns (avatars, badges, progress bars, buttons)
✅ Exact Tailwind classes for every element
✅ All default data values
✅ Animation and transition details
✅ Color palette and spacing system
✅ Icon sizes and layouts

**Additional Components Available** (not on main dashboard):
- Scoreboard: 4-card KPI dashboard with trend indicators
- Transformation Tracker: 6-stage journey progress (Clarity → Commitment → Execution → Measurement → Coaching → Results)

Everything needed to recreate the Executive Dashboard pixel-perfect is included.