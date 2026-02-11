# Planning & Goals Section - Complete Implementation Specifications

## Document Purpose
This document contains EVERY detail needed to recreate the Planning & Goals Section pixel-perfect. It includes exact measurements, colors, spacing, content, layouts, and component specifications for all 4 tabs, the New Goal Modal, and all subsections within the comprehensive planning system.

---

## Quick Reference

### File Structure
- **Planning & Goals Page**: `/src/app/components/planning/PlanningGoalsPage.tsx`
- **New Goal Modal**: `/src/app/components/planning/NewGoalModal.tsx`

### All Components Included
1. ✅ Main page with 4-tab navigation
2. ✅ **Annual Planning Tab** - Strategic pillars and annual objectives
3. ✅ **Quarterly Planning Tab** - Q1 priorities and weekly action items
4. ✅ **Goals Tab** - All goals with filtering
5. ✅ **Metrics & KPIs Tab** - Performance dashboard across 4 categories
6. ✅ **New Goal Modal** - 3-step wizard with AI assistance

---

## Page Container

```tsx
<div className="flex-1 overflow-auto bg-background">
  <div className="max-w-[1400px] mx-auto p-8">
    {/* Header, Tabs, and Tab Content */}
  </div>
</div>
```

**Specifications**:
- Max width: `max-w-[1400px]` (1400px)
- Padding: `p-8` (32px all sides)
- Background: `bg-background`
- Overflow: `overflow-auto`

---

## Page Header

```tsx
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h1 className="text-sidebar-foreground mb-2">Planning & Goals</h1>
      <p className="text-muted-foreground">
        Strategic planning, quarterly execution, and goal tracking
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted/30 transition-colors">
        <Filter className="w-4 h-4 inline mr-2" />
        Filter
      </button>
      <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
        <Plus className="w-4 h-4 inline mr-2" />
        New Goal
      </button>
    </div>
  </div>
</div>
```

**Specifications**:
- H1: Default HTML size, `text-sidebar-foreground`, `mb-2`
- Subtitle: `text-muted-foreground`
- Filter button: `px-4 py-2 bg-card border border-border` (secondary style)
- New Goal button: `px-4 py-2 bg-accent text-accent-foreground` (primary style)
- Icon: `w-4 h-4 inline mr-2`
- Button gap: `gap-3` (12px)

---

## Tab Navigation

```tsx
<div className="mb-8 border-b border-border">
  <div className="flex gap-6">
    <button className="flex items-center gap-2 px-4 py-3 border-b-2 border-accent text-accent transition-colors">
      <Calendar className="w-4 h-4" />
      <span className="text-sm">Annual Planning</span>
    </button>
    <button className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-muted-foreground hover:text-sidebar-foreground transition-colors">
      <Target className="w-4 h-4" />
      <span className="text-sm">Quarterly Planning</span>
    </button>
    <button className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-muted-foreground hover:text-sidebar-foreground transition-colors">
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-sm">Goals</span>
    </button>
    <button className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-muted-foreground hover:text-sidebar-foreground transition-colors">
      <TrendingUp className="w-4 h-4" />
      <span className="text-sm">Metrics & KPIs</span>
    </button>
  </div>
</div>
```

**Specifications**:
- Container: `mb-8 border-b border-border`
- Tab layout: `flex gap-6`
- Tab button: `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors`
- Active tab: `border-accent text-accent`
- Inactive tab: `border-transparent text-muted-foreground hover:text-sidebar-foreground`
- Icon: `w-4 h-4`
- Label: `text-sm`

**Tab Icons**:
- Annual Planning: `<Calendar className="w-4 h-4" />`
- Quarterly Planning: `<Target className="w-4 h-4" />`
- Goals: `<CheckCircle2 className="w-4 h-4" />`
- Metrics & KPIs: `<TrendingUp className="w-4 h-4" />`

---

## Tab 1: Annual Planning

### Planning Year Header

```tsx
<div className="mb-8 bg-card border border-border rounded-lg p-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-sidebar-foreground mb-2">2026 Annual Plan</h2>
      <p className="text-sm text-muted-foreground">Strategic priorities and objectives for the fiscal year</p>
    </div>
    <div className="text-right">
      <div className="text-xs text-muted-foreground mb-1">PLAN COMPLETION</div>
      <div className="text-3xl text-sidebar-foreground mb-1">68%</div>
      <div className="text-xs text-muted-foreground">8 of 12 quarters complete</div>
    </div>
  </div>
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-accent rounded-full" style={{ width: "68%" }} />
  </div>
</div>
```

**Specifications**:
- Container: `mb-8 bg-card border border-border rounded-lg p-6`
- H2: `text-sidebar-foreground mb-2`
- Subtitle: `text-sm text-muted-foreground`
- Label: `text-xs text-muted-foreground mb-1` (uppercase)
- Percentage: `text-3xl text-sidebar-foreground mb-1`
- Description: `text-xs text-muted-foreground`
- Progress bar: `h-2 bg-muted rounded-full overflow-hidden`
- Progress fill: `bg-accent rounded-full`

---

### Strategic Pillars

```tsx
<div className="mb-8">
  <h3 className="text-sidebar-foreground mb-4">Strategic Pillars</h3>
  <div className="grid grid-cols-3 gap-6">
    {/* Pillar cards */}
  </div>
</div>
```

**Grid**: `grid-cols-3 gap-6` (3 columns, 24px gap)

#### Pillar Card

```tsx
<div className="bg-card border border-green-200 rounded-lg p-6">
  <h4 className="text-sidebar-foreground mb-2">Profitable Growth</h4>
  <p className="text-xs text-muted-foreground mb-4">$250M Revenue | 12% EBITDA</p>
  
  <div className="mb-4">
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
      <span>Progress</span>
      <span>72%</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-green-500 rounded-full" style={{ width: "72%" }} />
    </div>
  </div>
  
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground">8 initiatives</span>
    <span className="text-green-600">On Track</span>
  </div>
</div>
```

**Specifications**:
- Card: `bg-card rounded-lg p-6`
- Border colors: Dynamic based on status
  - On Track: `border-green-200`, progress: `bg-green-500`, text: `text-green-600`
  - At Risk: `border-yellow-200`, progress: `bg-yellow-500`, text: `text-yellow-600`
- H4: `text-sidebar-foreground mb-2`
- Target: `text-xs text-muted-foreground mb-4`
- Progress label: `text-xs text-muted-foreground`
- Progress bar: `h-2 bg-muted rounded-full`
- Initiatives count: `text-xs text-muted-foreground`

**Default Pillars (3)**:
1. **Profitable Growth** - $250M Revenue | 12% EBITDA - 72%, 8 initiatives, On Track
2. **Operational Excellence** - 85% OEE | <2% Waste - 58%, 6 initiatives, At Risk
3. **Market Leadership** - 20% Market Share | Top 3 Brand - 65%, 5 initiatives, On Track

---

### Annual Objectives

```tsx
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sidebar-foreground">Annual Objectives</h3>
    <button className="text-sm text-accent hover:text-accent/80 transition-colors">
      View All (24)
    </button>
  </div>
  <div className="space-y-3">
    {/* Objective cards */}
  </div>
</div>
```

#### Objective Card

```tsx
<div className="bg-card border border-border rounded-lg p-5 hover:border-accent/50 transition-colors cursor-pointer">
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <h4 className="text-sm text-sidebar-foreground">
          Achieve $250M in total revenue with balanced growth across raw and cooked segments
        </h4>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          CEO
        </span>
        <span className="px-2 py-1 bg-muted rounded text-xs">Financial</span>
        <span className="flex items-center gap-1">
          <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">Q1</span>
          <span className="px-2 py-1 bg-muted/50 rounded text-xs">Q2</span>
          <span className="px-2 py-1 bg-muted/50 rounded text-xs">Q3</span>
          <span className="px-2 py-1 bg-muted/50 rounded text-xs">Q4</span>
        </span>
      </div>
    </div>
    <div className="ml-6 text-right">
      <div className="text-2xl text-sidebar-foreground mb-1">78%</div>
      <div className="text-xs text-green-600">On Track</div>
    </div>
  </div>
  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-green-500 rounded-full" style={{ width: "78%" }} />
  </div>
</div>
```

**Specifications**:
- Card: `bg-card rounded-lg p-5 hover:border-accent/50 transition-colors cursor-pointer`
- Border: Dynamic based on status
  - On Track: `border-border`
  - At Risk: `border-yellow-200`
  - Needs Attention: `border-accent/30`
- Title: `text-sm text-sidebar-foreground`
- Owner icon: `w-3 h-3`
- Category badge: `px-2 py-1 bg-muted rounded text-xs`
- Active quarter: `px-2 py-1 bg-accent text-accent-foreground rounded text-xs`
- Inactive quarter: `px-2 py-1 bg-muted/50 rounded text-xs`
- Progress percentage: `text-2xl text-sidebar-foreground mb-1`
- Status: `text-xs` with color (green-600, yellow-600, or accent)
- Progress bar: `h-1.5 bg-muted rounded-full`
- Progress fill colors: `bg-green-500`, `bg-yellow-500`, or `bg-accent`

**Default Objectives (5)**:
1. **Achieve $250M in total revenue** - CEO, Financial, Q1-Q4, 78%, On Track
2. **Expand national distribution to 9,000+ retail points** - CMO, Market Growth, Q1-Q4, 62%, On Track
3. **Improve plant OEE to 85%** - COO, Operational, Q1-Q4, 54%, At Risk
4. **Build executive bench strength - 80% A-players** - CEO, People, Q1-Q4, 70%, On Track
5. **Launch 3 new value-added product lines** - CMO, Innovation, Q2-Q4, 45%, Needs Attention

---

## Tab 2: Quarterly Planning

### Quarter Selector

```tsx
<div className="mb-8 flex items-center justify-between">
  <div className="flex items-center gap-4">
    <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground">
      <option>Q1 2026</option>
      <option>Q2 2026</option>
      <option>Q3 2026</option>
      <option>Q4 2026</option>
    </select>
    <div className="text-sm text-muted-foreground">January 1 - March 31, 2026</div>
  </div>
  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
    Start Q2 Planning
  </button>
</div>
```

**Specifications**:
- Select: `px-4 py-2 bg-card border border-border rounded-lg text-sm`
- Date range: `text-sm text-muted-foreground`
- Button: `px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm`

---

### Quarter Overview

```tsx
<div className="mb-8 bg-card border border-border rounded-lg p-6">
  <div className="grid grid-cols-4 gap-6">
    <div>
      <div className="text-xs text-muted-foreground mb-2">QUARTERLY THEME</div>
      <div className="text-sm text-sidebar-foreground">Foundation & Momentum</div>
    </div>
    <div>
      <div className="text-xs text-muted-foreground mb-2">PRIORITIES</div>
      <div className="text-sm text-sidebar-foreground">12 Active</div>
    </div>
    <div>
      <div className="text-xs text-muted-foreground mb-2">ACTION ITEMS</div>
      <div className="text-sm text-sidebar-foreground">47 Total • 32 Complete</div>
    </div>
    <div>
      <div className="text-xs text-muted-foreground mb-2">COMPLETION</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: "68%" }} />
        </div>
        <span className="text-sm text-sidebar-foreground">68%</span>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Container: `mb-8 bg-card border border-border rounded-lg p-6`
- Grid: `grid-cols-4 gap-6`
- Label: `text-xs text-muted-foreground mb-2` (uppercase)
- Value: `text-sm text-sidebar-foreground`
- Progress bar: `h-2 bg-muted rounded-full`

---

### Quarterly Priorities

```tsx
<div className="mb-8">
  <h3 className="text-sidebar-foreground mb-4">Q1 2026 Priorities</h3>
  <div className="space-y-4">
    {/* Priority cards */}
  </div>
</div>
```

#### Priority Card

```tsx
<div className="bg-card border border-border rounded-lg p-5">
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <h4 className="text-sm text-sidebar-foreground mb-3">
        Complete operational audit and implement Q1 efficiency improvements
      </h4>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="px-2 py-1 bg-muted rounded">Operational Excellence</span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          President/COO - Sarah Mitchell
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Mar 31, 2026
        </span>
      </div>
    </div>
    <div className="ml-6">
      <span className="inline-block px-3 py-1 rounded text-xs bg-green-50 text-green-700">
        On Track
      </span>
    </div>
  </div>

  {/* Action Items Progress */}
  <div className="mb-3">
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
      <span>Action Items</span>
      <span>6 of 8 complete</span>
    </div>
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-accent rounded-full" style={{ width: "75%" }} />
    </div>
  </div>

  {/* Expandable Action Items */}
  <button className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors">
    <span>View action items</span>
    <ChevronRight className="w-3 h-3" />
  </button>
</div>
```

**Specifications**:
- Card: `bg-card border border-border rounded-lg p-5`
- Title: `text-sm text-sidebar-foreground mb-3`
- Category badge: `px-2 py-1 bg-muted rounded`
- Meta icons: `w-3 h-3`
- Meta text: `text-xs text-muted-foreground`
- Status badge: `inline-block px-3 py-1 rounded text-xs`
  - On Track: `bg-green-50 text-green-700`
  - At Risk: `bg-yellow-50 text-yellow-700`
- Progress bar: `h-1.5 bg-muted rounded-full`
- Expand button: `text-xs text-accent hover:text-accent/80`

**Default Priorities (4)**:
1. **Complete operational audit** - Operational Excellence, Sarah Mitchell, Mar 31, 6/8 actions, On Track
2. **Launch national marketing campaign** - Market Leadership, Jennifer Lopez, Feb 28, 10/12 actions, On Track
3. **Close acquisition of regional distributor** - Profitable Growth, You, Mar 15, 3/6 actions, At Risk
4. **Execute LeaderShift program** - People & Culture, You, Mar 31, 4/5 actions, On Track

---

### Weekly Action Items

```tsx
<div>
  <h3 className="text-sidebar-foreground mb-4">This Week's Action Items</h3>
  <div className="space-y-2">
    {/* Action item cards */}
  </div>
</div>
```

#### Action Item Card

```tsx
<div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
  <button className="w-5 h-5 rounded border-2 border-border flex items-center justify-center">
    {/* Empty for incomplete */}
  </button>
  <div className="flex-1">
    <div className="text-sm text-sidebar-foreground">
      Review and approve Q1 marketing budget allocation
    </div>
  </div>
  <div className="text-xs text-muted-foreground">CMO</div>
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Clock className="w-3 h-3" />
    Jan 17
  </div>
</div>
```

**Completed State**:
```tsx
<div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 opacity-50">
  <button className="w-5 h-5 rounded border-2 bg-accent border-accent flex items-center justify-center">
    <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
  </button>
  <div className="flex-1">
    <div className="text-sm line-through text-muted-foreground">
      Conduct LeaderShift Module 3 session
    </div>
  </div>
  <div className="text-xs text-muted-foreground">You</div>
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Clock className="w-3 h-3" />
    Jan 16
  </div>
</div>
```

**Specifications**:
- Card: `bg-card border border-border rounded-lg p-4 flex items-center gap-4`
- Completed opacity: `opacity-50`
- Checkbox: `w-5 h-5 rounded border-2`
  - Unchecked: `border-border`
  - Checked: `bg-accent border-accent`
- Checkmark icon: `w-4 h-4 text-accent-foreground`
- Task text: `text-sm`
  - Incomplete: `text-sidebar-foreground`
  - Complete: `line-through text-muted-foreground`
- Owner: `text-xs text-muted-foreground`
- Due date: `text-xs text-muted-foreground`
- Clock icon: `w-3 h-3`

**Default Action Items (6)**:
1. Review Q1 marketing budget - CMO, Jan 17, not done
2. Finalize acquisition due diligence - CFO, Jan 18, not done
3. Conduct LeaderShift Module 3 - You, Jan 16, done
4. Review plant efficiency metrics - You, Jan 19, not done
5. Approve new product launch timeline - CMO, Jan 20, not done
6. Meet with board compensation committee - You, Jan 18, done

---

## Tab 3: Goals

### Goals Summary Stats

```tsx
<div className="mb-8 grid grid-cols-4 gap-4">
  <div className="bg-card border border-border rounded-lg p-5">
    <div className="text-xs text-muted-foreground mb-2">TOTAL GOALS</div>
    <div className="text-3xl text-sidebar-foreground mb-1">18</div>
    <div className="text-xs text-green-600">+3 this quarter</div>
  </div>
  <div className="bg-card border border-green-200 rounded-lg p-5">
    <div className="text-xs text-muted-foreground mb-2">ON TRACK</div>
    <div className="text-3xl text-green-600 mb-1">12</div>
    <div className="text-xs text-muted-foreground">67% of total</div>
  </div>
  <div className="bg-card border border-yellow-200 rounded-lg p-5">
    <div className="text-xs text-muted-foreground mb-2">AT RISK</div>
    <div className="text-3xl text-yellow-600 mb-1">4</div>
    <div className="text-xs text-muted-foreground">22% of total</div>
  </div>
  <div className="bg-card border border-accent rounded-lg p-5">
    <div className="text-xs text-muted-foreground mb-2">NEEDS ATTENTION</div>
    <div className="text-3xl text-accent mb-1">2</div>
    <div className="text-xs text-muted-foreground">11% of total</div>
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-4 gap-4`
- Card: `bg-card rounded-lg p-5`
- Borders: `border-border`, `border-green-200`, `border-yellow-200`, `border-accent`
- Label: `text-xs text-muted-foreground mb-2` (uppercase)
- Value: `text-3xl mb-1` with color (sidebar-foreground, green-600, yellow-600, accent)
- Sub-text: `text-xs` (green-600 for total, muted-foreground for others)

---

### Filter Tabs

```tsx
<div className="mb-6 flex items-center gap-2">
  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm">
    All Goals (18)
  </button>
  <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
    My Goals (8)
  </button>
  <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
    Team Goals (10)
  </button>
  <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
    Company Goals (6)
  </button>
</div>
```

**Specifications**:
- Active: `px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm`
- Inactive: `px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground`

---

### Goals List

#### Goal Card

```tsx
<div className="bg-card border border-border rounded-lg p-6 hover:border-accent/50 transition-colors cursor-pointer">
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <h4 className="text-sm text-sidebar-foreground">Increase EBITDA to $24M by end of Q1 2026</h4>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="px-2 py-1 bg-muted rounded">Company</span>
        <span className="px-2 py-1 bg-muted rounded">Financial</span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          CFO - Marcus Chen
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Mar 31, 2026
        </span>
      </div>
      <div className="text-xs text-accent">Scorecard: Revenue & Profit Growth</div>
    </div>
    <div className="ml-6 text-right">
      <div className="text-2xl text-sidebar-foreground mb-1">78%</div>
      <div className="text-xs text-green-600 mb-2">On Track</div>
      <div className="text-xs text-muted-foreground">$22.8M / $24M</div>
    </div>
  </div>
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-green-500 rounded-full" style={{ width: "78%" }} />
  </div>
</div>
```

**Specifications**:
- Card: `bg-card rounded-lg p-6 hover:border-accent/50 transition-colors cursor-pointer`
- Border: Dynamic based on status (border-border, border-yellow-200, border-accent/30)
- Title: `text-sm text-sidebar-foreground`
- Type/Category badges: `px-2 py-1 bg-muted rounded text-xs`
- Owner/Due date icons: `w-3 h-3`
- Linked to: `text-xs text-accent`
- Progress: `text-2xl text-sidebar-foreground mb-1`
- Status: `text-xs mb-2` with color
- Current/Target: `text-xs text-muted-foreground`
- Progress bar: `h-2 bg-muted rounded-full`
- Progress fill: `bg-green-500`, `bg-yellow-500`, or `bg-accent`

**Default Goals (6)**:
1. **Increase EBITDA to $24M** - Company, Financial, CFO, 78%, $22.8M/$24M, On Track
2. **Achieve 85% OEE across all plants** - Company, Operational, COO, 54%, 82.3%/85%, At Risk
3. **Complete LeaderShift with 90%+ engagement** - Team, People, You, 82%, Module 7/9, On Track
4. **Expand distribution to 9,000 retail points** - Company, Market Growth, CMO, 62%, 8,420/9,000, On Track
5. **Launch 3 new value-added product SKUs** - Team, Innovation, CMO, 33%, 1/3 products, Needs Attention
6. **Achieve 80% A-player rating** - Personal, People, You, 78%, 78%/80%, On Track

---

## Tab 4: Metrics & KPIs

### KPI Performance Dashboard Header

```tsx
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sidebar-foreground">KPI Performance Dashboard</h3>
    <div className="flex items-center gap-3">
      <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground">
        <option>Q1 2026</option>
        <option>Q4 2025</option>
        <option>Q3 2025</option>
      </select>
    </div>
  </div>
</div>
```

---

### KPI Categories

Each category follows this pattern:

```tsx
<div className="mb-8">
  <div className="flex items-center gap-2 mb-4">
    <DollarSign className="w-5 h-5 text-accent" />
    <h4 className="text-sm text-sidebar-foreground">Financial Performance</h4>
  </div>
  <div className="grid grid-cols-4 gap-4">
    {/* Metric cards */}
  </div>
</div>
```

**Specifications**:
- Category icon: `w-5 h-5 text-accent`
- Category title: `text-sm text-sidebar-foreground`
- Grid: `grid-cols-4 gap-4` (Financial, Operational) or `grid-cols-3 gap-4` (People, Market)

---

#### Metric Card

```tsx
<div className="bg-card border border-border rounded-lg p-5">
  <div className="text-xs text-muted-foreground mb-2">Revenue</div>
  <div className="text-2xl text-sidebar-foreground mb-2">$62.5M</div>
  <div className="flex items-center justify-between text-xs mb-3">
    <span className="text-muted-foreground">Target: $62M</span>
    <span className="text-green-600">+0.8%</span>
  </div>
  <div className="text-xs text-muted-foreground">Quarterly</div>
</div>
```

**Specifications**:
- Card: `bg-card border border-border rounded-lg p-5`
- Label: `text-xs text-muted-foreground mb-2`
- Value: `text-2xl text-sidebar-foreground mb-2`
- Target: `text-xs text-muted-foreground`
- Change: `text-xs` with color
  - Up: `text-green-600`
  - Down: `text-accent`
  - Neutral: `text-muted-foreground`
- Unit/Period: `text-xs text-muted-foreground`

---

### Category 1: Financial Performance (4 metrics)

**Grid**: `grid-cols-4 gap-4`
**Icon**: `<DollarSign className="w-5 h-5 text-accent" />`

1. **Revenue**: $62.5M | Target: $62M | +0.8% | Quarterly
2. **EBITDA**: $24.5M | Target: $23M | +6.5% | Annual Run Rate
3. **Net Margin**: 8.2% | Target: 8.0% | +0.3% | %
4. **ROIC**: 14.8% | Target: 15% | -0.5% | %

---

### Category 2: Operational Efficiency (4 metrics)

**Grid**: `grid-cols-4 gap-4`
**Icon**: `<Factory className="w-5 h-5 text-accent" />`

1. **Plant OEE**: 82.3% | Target: 85% | -2.7%
2. **Product Yield**: 94.1% | Target: 95% | 0%
3. **Throughput/Shift**: 12.8K lbs | Target: 13K lbs | +3%
4. **Downtime Hours**: 124hrs | Target: <100hrs | +24%

---

### Category 3: People & Culture (3 metrics)

**Grid**: `grid-cols-3 gap-4`
**Icon**: `<Users className="w-5 h-5 text-accent" />`

1. **A-Player %**: 78% | Target: 80% | +5%
2. **Engagement Score**: 87% | Target: 85% | +2%
3. **Leadership Retention**: 92% | Target: 90% | +2%

---

### Category 4: Market Growth (3 metrics)

**Grid**: `grid-cols-3 gap-4`
**Icon**: `<Award className="w-5 h-5 text-accent" />`

1. **Market Share**: 18.2% | Target: 20% | +1.5%
2. **Distribution Points**: 8,420 | Target: 9,000 | +12%
3. **Brand NPS**: 67 | Target: 70 | +5

---

## New Goal Modal

**Trigger**: Clicking "New Goal" button opens modal

### Modal Structure

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

  {/* Modal */}
  <div className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
    {/* Header */}
    {/* Progress Indicator */}
    {/* Content (Step-based) */}
    {/* Footer */}
  </div>
</div>
```

**Specifications**:
- Backdrop: `fixed inset-0 bg-black/50 backdrop-blur-sm z-50`
- Modal: `relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh]`
- Max width: `max-w-3xl` (768px)
- Max height: `max-h-[90vh]` (90% viewport height)

---

### Modal Header

```tsx
<div className="flex items-center justify-between px-8 py-6 border-b border-border">
  <div>
    <h2 className="text-sidebar-foreground mb-1">Create New Goal</h2>
    <p className="text-sm text-muted-foreground">
      Step 1 of 3 • Define Goal
    </p>
  </div>
  <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
    <X className="w-5 h-5 text-muted-foreground" />
  </button>
</div>
```

**Specifications**:
- Padding: `px-8 py-6`
- Border: `border-b border-border`
- H2: `text-sidebar-foreground mb-1`
- Step text: `text-sm text-muted-foreground`
- Close button: `p-2 hover:bg-muted rounded-lg`
- X icon: `w-5 h-5 text-muted-foreground`

**Step Labels**:
- Step 1: "Define Goal"
- Step 2: "Set Targets"
- Step 3: "Link & Finalize"

---

### Progress Indicator

```tsx
<div className="px-8 pt-6">
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1 rounded-full bg-accent" />
    <div className="flex-1 h-1 rounded-full bg-muted" />
    <div className="flex-1 h-1 rounded-full bg-muted" />
  </div>
</div>
```

**Specifications**:
- Container: `px-8 pt-6`
- Step bar: `flex-1 h-1 rounded-full`
- Active: `bg-accent`
- Inactive: `bg-muted`
- Gap: `gap-2` (8px)

---

### Modal Content Area

```tsx
<div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
  {/* Step content */}
</div>
```

**Specifications**:
- Padding: `px-8 py-6`
- Overflow: `overflow-y-auto`
- Max height: `max-h-[calc(90vh-200px)]` (viewport minus header/footer)

---

### Modal Footer

```tsx
<div className="flex items-center justify-between px-8 py-6 border-t border-border bg-muted/30">
  <button className="px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
    Cancel
  </button>
  <div className="flex items-center gap-3">
    <button className="px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
      Save as Draft
    </button>
    <button className="px-6 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
      Continue
    </button>
  </div>
</div>
```

**Specifications**:
- Padding: `px-8 py-6`
- Border: `border-t border-border`
- Background: `bg-muted/30`
- Cancel/Back button: `px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground`
- Save as Draft: Same as Cancel (only shows on steps 1-2)
- Continue button: `px-6 py-2 bg-accent text-accent-foreground rounded-lg text-sm`

**Button Text**:
- Step 1: "Cancel" / "Save as Draft" / "Continue"
- Step 2: "Back" / "Save as Draft" / "Continue"
- Step 3: "Back" / "Create Goal"

---

## Step 1: Define Goal

### AI Assistance Banner

```tsx
<div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-sm text-sidebar-foreground mb-1">AI Goal Assistant</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Get smart suggestions based on your Scorecard metrics and annual plan
      </p>
      <button className="text-xs text-accent hover:text-accent/80 transition-colors">
        Show AI suggestions
      </button>
    </div>
  </div>
</div>
```

**Specifications**:
- Background: `bg-gradient-to-r from-accent/10 to-accent/5`
- Border: `border-accent/20`
- Icon: `w-5 h-5 text-accent flex-shrink-0 mt-0.5`
- Title: `text-sm text-sidebar-foreground mb-1`
- Description: `text-xs text-muted-foreground mb-3`
- Button: `text-xs text-accent hover:text-accent/80`

---

### AI Suggestions (Expandable)

```tsx
<div className="space-y-3">
  <div className="text-xs text-muted-foreground mb-2">SUGGESTED GOALS FROM YOUR SCORECARD</div>
  
  <button className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
    <div className="flex items-start justify-between mb-2">
      <h4 className="text-sm text-sidebar-foreground pr-4">
        Improve Plant OEE from 82.3% to 85%
      </h4>
      <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground whitespace-nowrap">
        Operational
      </span>
    </div>
    <p className="text-xs text-muted-foreground mb-2">
      Your Operational Excellence accountability is at risk (78 score)
    </p>
    <div className="flex items-center gap-1 text-xs text-accent">
      <LinkIcon className="w-3 h-3" />
      <span>Scorecard: Operational Excellence</span>
    </div>
  </button>
</div>
```

**Specifications**:
- Container: `space-y-3`
- Label: `text-xs text-muted-foreground mb-2` (uppercase)
- Suggestion card: `w-full text-left bg-card border border-border rounded-lg p-4 hover:border-accent/50`
- Title: `text-sm text-sidebar-foreground pr-4`
- Category badge: `px-2 py-1 bg-muted rounded text-xs text-muted-foreground whitespace-nowrap`
- Reason: `text-xs text-muted-foreground mb-2`
- Link: `text-xs text-accent`
- Link icon: `w-3 h-3`

**Default Suggestions (3)**:
1. **Improve Plant OEE from 82.3% to 85%** - Operational, "at risk (78 score)"
2. **Close 2 strategic M&A deals in Q2-Q3 2026** - Growth, "needs attention (72 score)"
3. **Launch innovation lab for new product development** - Innovation, "maintains momentum (85 score)"

---

### Goal Statement Field

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-2">
    GOAL STATEMENT <span className="text-accent">*</span>
  </label>
  <textarea
    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
    rows={3}
    placeholder="e.g., Achieve 85% OEE across all manufacturing plants by end of Q2 2026"
  />
  <div className="text-xs text-muted-foreground mt-2">
    Tip: Use specific, measurable language that clearly defines success
  </div>
</div>
```

**Specifications**:
- Label: `block text-xs text-muted-foreground mb-2` (uppercase)
- Required indicator: `text-accent`
- Textarea: `w-full px-4 py-3 bg-background border border-border rounded-lg text-sm resize-none`
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-accent/50`
- Rows: `3`
- Tip text: `text-xs text-muted-foreground mt-2`

---

### Goal Type & Category (2-column)

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-xs text-muted-foreground mb-2">
      GOAL TYPE <span className="text-accent">*</span>
    </label>
    <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
      <option>Select type...</option>
      <option>Company Goal</option>
      <option>Team Goal</option>
      <option>Personal Goal</option>
    </select>
  </div>
  <div>
    <label className="block text-xs text-muted-foreground mb-2">
      CATEGORY <span className="text-accent">*</span>
    </label>
    <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
      <option>Select category...</option>
      <option>Financial</option>
      <option>Operational</option>
      <option>Market Growth</option>
      <option>People & Culture</option>
      <option>Innovation</option>
      <option>Compliance & Safety</option>
      <option>Brand Strength</option>
    </select>
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-2 gap-4`
- Select: `w-full px-4 py-3 bg-background border border-border rounded-lg text-sm`
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-accent/50`

---

### Goal Owner Field

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-2">
    GOAL OWNER <span className="text-accent">*</span>
  </label>
  <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
    <option>You (CEO)</option>
    <option>Sarah Mitchell (President/COO)</option>
    <option>Marcus Chen (CFO)</option>
    <option>Jennifer Lopez (CMO)</option>
    <option>David Park (VP Operations)</option>
    <option>Amanda Brooks (VP Sales)</option>
  </select>
</div>
```

---

### Timeline (2-column)

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-xs text-muted-foreground mb-2">
      START DATE <span className="text-accent">*</span>
    </label>
    <input
      type="date"
      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
      defaultValue="2026-01-14"
    />
  </div>
  <div>
    <label className="block text-xs text-muted-foreground mb-2">
      TARGET DATE <span className="text-accent">*</span>
    </label>
    <input
      type="date"
      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
    />
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-2 gap-4`
- Date input: `w-full px-4 py-3 bg-background border border-border rounded-lg text-sm`

---

### Active Quarters Selector

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-3">
    ACTIVE QUARTERS <span className="text-accent">*</span>
  </label>
  <div className="flex gap-3">
    <button className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-sidebar-foreground hover:border-accent transition-colors">
      Q1 2026
    </button>
    <button className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-sidebar-foreground hover:border-accent transition-colors">
      Q2 2026
    </button>
    <button className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-sidebar-foreground hover:border-accent transition-colors">
      Q3 2026
    </button>
    <button className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-sidebar-foreground hover:border-accent transition-colors">
      Q4 2026
    </button>
  </div>
  <div className="text-xs text-muted-foreground mt-2">
    Select all quarters where this goal will be actively tracked
  </div>
</div>
```

**Specifications**:
- Quarter buttons: `flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg text-sm`
- Hover: `hover:border-accent`
- Selected (add): `border-accent` (border becomes accent color)
- Gap: `gap-3` (12px)
- Help text: `text-xs text-muted-foreground mt-2`

---

## Step 2: Set Targets

### Instructions Banner

```tsx
<div className="bg-muted/50 border border-border rounded-lg p-4">
  <div className="flex items-start gap-3">
    <Target className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="text-sm text-sidebar-foreground mb-1">Define Success Metrics</h4>
      <p className="text-xs text-muted-foreground">
        Set measurable targets so progress can be tracked automatically
      </p>
    </div>
  </div>
</div>
```

---

### Current State / Baseline

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-2">
    CURRENT STATE / BASELINE <span className="text-accent">*</span>
  </label>
  <div className="grid grid-cols-3 gap-3">
    <div className="col-span-2">
      <input
        type="text"
        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        placeholder="e.g., 82.3"
      />
    </div>
    <div>
      <input
        type="text"
        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        placeholder="Unit (e.g., %)"
      />
    </div>
  </div>
</div>
```

**Specifications**:
- Grid: `grid-cols-3 gap-3`
- Value input: `col-span-2` (2 of 3 columns)
- Unit input: 1 column
- Input: `w-full px-4 py-3 bg-background border border-border rounded-lg text-sm`

---

### Target State / Goal

Same structure as Current State

---

### Progress Calculation Preview

```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-sm text-sidebar-foreground mb-1">Progress Preview</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Based on your baseline and target, here's how progress will be calculated
      </p>
      <div className="bg-white border border-green-200 rounded p-3">
        <div className="text-xs text-muted-foreground mb-2">Current Progress</div>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl text-sidebar-foreground">0%</div>
          <div className="text-xs text-muted-foreground">82.3% → 85%</div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: "0%" }} />
        </div>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Container: `bg-green-50 border border-green-200 rounded-lg p-4`
- Icon: `w-5 h-5 text-green-600 flex-shrink-0 mt-0.5`
- Title: `text-sm text-sidebar-foreground mb-1`
- Description: `text-xs text-muted-foreground mb-3`
- Preview box: `bg-white border border-green-200 rounded p-3`
- Progress value: `text-2xl text-sidebar-foreground`
- Range: `text-xs text-muted-foreground`
- Progress bar: `h-2 bg-muted rounded-full`

---

### Measurement Frequency

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-2">
    MEASUREMENT FREQUENCY <span className="text-accent">*</span>
  </label>
  <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
    <option>Weekly</option>
    <option>Bi-weekly</option>
    <option>Monthly</option>
    <option>Quarterly</option>
  </select>
  <div className="text-xs text-muted-foreground mt-2">
    How often will you update progress on this goal?
  </div>
</div>
```

---

### Key Milestones (Optional)

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-2">KEY MILESTONES (OPTIONAL)</label>
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <input
        type="text"
        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        defaultValue="Complete operational audit"
      />
      <input
        type="date"
        className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
      <button className="p-2 text-muted-foreground hover:text-accent transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
    
    <button className="text-xs text-accent hover:text-accent/80 transition-colors">
      + Add milestone
    </button>
  </div>
</div>
```

**Specifications**:
- Milestone row: `flex items-center gap-3`
- Milestone input: `flex-1 px-4 py-2` (flexible width)
- Date input: `px-4 py-2` (fixed width)
- Delete button: `p-2 text-muted-foreground hover:text-accent`
- Delete icon: `w-4 h-4`
- Add button: `text-xs text-accent hover:text-accent/80`

---

## Step 3: Link & Finalize

### Instructions Banner

```tsx
<div className="bg-muted/50 border border-border rounded-lg p-4">
  <div className="flex items-start gap-3">
    <LinkIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="text-sm text-sidebar-foreground mb-1">Connect to Strategic Framework</h4>
      <p className="text-xs text-muted-foreground">
        Link this goal to your Scorecard, Annual Plan, or Leadership Program for visibility
      </p>
    </div>
  </div>
</div>
```

---

### Link to Scorecard (Recommended)

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-3">LINK TO SCORECARD (RECOMMENDED)</label>
  <div className="space-y-2">
    <button className="w-full text-left bg-card border border-accent rounded-lg p-4 hover:border-accent transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm text-sidebar-foreground mb-1">Operational Excellence</h4>
          <p className="text-xs text-muted-foreground">Partner with COO to drive efficiencies</p>
        </div>
        <div className="ml-4 text-right">
          <div className="text-lg text-sidebar-foreground mb-1">78</div>
          <div className="text-xs text-yellow-600">At Risk</div>
        </div>
      </div>
    </button>
  </div>
</div>
```

**Specifications**:
- Scorecard option: `w-full text-left bg-card border rounded-lg p-4`
- Selected: `border-accent`
- Unselected: `border-border`
- Title: `text-sm text-sidebar-foreground mb-1`
- Description: `text-xs text-muted-foreground`
- Score: `text-lg text-sidebar-foreground mb-1`
- Status: `text-xs` with color

**Default Scorecard Options (3)**:
1. **Operational Excellence** - 78, At Risk
2. **Revenue & Profit Growth** - 88, On Track
3. **Talent & Culture** - 90, On Track

---

### Link to Annual Plan (Optional)

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-3">LINK TO ANNUAL PLAN (OPTIONAL)</label>
  <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
    <option>No link</option>
    <option>Profitable Growth Pillar</option>
    <option>Operational Excellence Pillar</option>
    <option>Market Leadership Pillar</option>
  </select>
</div>
```

---

### Link to Program (Optional)

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-3">LINK TO LEADERSHIP PROGRAM (OPTIONAL)</label>
  <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
    <option>No link</option>
    <option>LeaderShift: Leading through Change</option>
    <option>Executive Excellence Program</option>
    <option>High-Performance Team Building</option>
  </select>
</div>
```

---

### Visibility & Collaboration

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-3">VISIBILITY & COLLABORATION</label>
  <div className="space-y-3">
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
        defaultChecked
      />
      <div>
        <div className="text-sm text-sidebar-foreground mb-1">Visible to direct reports</div>
        <div className="text-xs text-muted-foreground">
          Your leadership team can see and contribute to this goal
        </div>
      </div>
    </div>
    
    <div className="flex items-start gap-3">
      <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent" />
      <div>
        <div className="text-sm text-sidebar-foreground mb-1">Add to Dashboard</div>
        <div className="text-xs text-muted-foreground">
          Show this goal in your Journey Hub for quick access
        </div>
      </div>
    </div>
    
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
        defaultChecked
      />
      <div>
        <div className="text-sm text-sidebar-foreground mb-1">Enable AI coaching suggestions</div>
        <div className="text-xs text-muted-foreground">
          Receive weekly insights and recommendations to stay on track
        </div>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Checkbox: `mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent`
- Option title: `text-sm text-sidebar-foreground mb-1`
- Option description: `text-xs text-muted-foreground`
- Checkbox gap: `gap-3`
- Options spacing: `space-y-3`

---

### Accountability Partner (Optional)

```tsx
<div>
  <label className="block text-xs text-muted-foreground mb-3">ACCOUNTABILITY PARTNER (OPTIONAL)</label>
  <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
    <option>No partner</option>
    <option>Sarah Mitchell (President/COO)</option>
    <option>Marcus Chen (CFO)</option>
    <option>Jennifer Lopez (CMO)</option>
    <option>Your Executive Coach</option>
  </select>
  <div className="text-xs text-muted-foreground mt-2">
    This person will receive progress updates and can provide guidance
  </div>
</div>
```

---

### Goal Summary

```tsx
<div className="bg-accent/5 border border-accent/20 rounded-lg p-5">
  <h4 className="text-sm text-sidebar-foreground mb-3">Goal Summary</h4>
  <div className="space-y-2 text-xs">
    <div className="flex justify-between">
      <span className="text-muted-foreground">Goal:</span>
      <span className="text-sidebar-foreground">Achieve 85% OEE across all plants</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Owner:</span>
      <span className="text-sidebar-foreground">You (CEO)</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Timeline:</span>
      <span className="text-sidebar-foreground">Q1-Q2 2026</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Target:</span>
      <span className="text-sidebar-foreground">82.3% → 85%</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Linked to:</span>
      <span className="text-sidebar-foreground">Scorecard: Operational Excellence</span>
    </div>
  </div>
</div>
```

**Specifications**:
- Container: `bg-accent/5 border border-accent/20 rounded-lg p-5`
- Title: `text-sm text-sidebar-foreground mb-3`
- Rows: `space-y-2 text-xs`
- Row layout: `flex justify-between`
- Label: `text-muted-foreground`
- Value: `text-sidebar-foreground`

---

## Icon Reference

```tsx
import { 
  Calendar,
  Target,
  TrendingUp,
  Plus,
  ChevronRight,
  Circle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  DollarSign,
  Factory,
  Award,
  Filter,
  X,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
```

---

## Color System

**Status Colors**:
- On Track: `border-green-200`, `bg-green-500`, `bg-green-50`, `text-green-600`, `text-green-700`
- At Risk: `border-yellow-200`, `bg-yellow-500`, `bg-yellow-50`, `text-yellow-600`, `text-yellow-700`
- Needs Attention/Behind: `border-accent`, `border-accent/30`, `bg-accent`, `bg-red-50`, `text-accent`
- Default: `border-border`

**Form Elements**:
- Background: `bg-background`
- Border: `border-border`
- Focus ring: `focus:ring-2 focus:ring-accent/50`
- Placeholder: Default browser styling

---

## Typography Scale

- H1: Default HTML size
- H2: Default HTML size
- H3: Default HTML size
- H4: `text-sm`
- Body: `text-sm`
- Labels: `text-xs` (uppercase with muted color)
- Large numbers: `text-3xl` (stats), `text-2xl` (goals/objectives)
- Medium numbers: `text-lg` (scorecard options)

---

## Spacing System

**Section Spacing**:
- Between major sections: `mb-8` (32px)
- Between subsections: `mb-6` (24px)
- Between cards: `gap-4` (16px), `gap-6` (24px for pillars), `space-y-3` (12px), `space-y-4` (16px)

**Card Padding**:
- Large cards: `p-6` (24px)
- Medium cards: `p-5` (20px)
- Small cards: `p-4` (16px)
- Modal: `px-8 py-6` (32px horizontal, 24px vertical)

**Modal Spacing**:
- Step content: `space-y-6` (24px between form sections)
- Form fields: `mb-2` (8px label to input), `mb-3` (12px for special spacing)

---

## Summary

This document provides COMPLETE specifications for Planning & Goals including:

✅ **4-Tab Navigation System** - Annual, Quarterly, Goals, Metrics & KPIs
✅ **Annual Planning Tab** - 2026 plan header, 3 strategic pillars, 5 annual objectives
✅ **Quarterly Planning Tab** - Q1 2026 overview, 4 priorities, 6 weekly action items
✅ **Goals Tab** - Stats bar, filter tabs, 6 complete goals
✅ **Metrics & KPIs Tab** - 4 categories (Financial, Operational, People, Market) with 14 total metrics
✅ **New Goal Modal** - 3-step wizard with AI assistance, full form specifications
✅ **Step 1** - Define goal with AI suggestions, type/category, owner, timeline, quarters
✅ **Step 2** - Set targets with baseline/target, measurement frequency, milestones
✅ **Step 3** - Link to scorecard/plan/program, visibility settings, summary

✅ All exact Tailwind classes and measurements
✅ Complete data structures and default values
✅ Color configurations for all status states
✅ Icon mappings and usage
✅ Typography scale
✅ Spacing system
✅ Grid layouts
✅ Form specifications
✅ Modal structure and behavior
✅ Hover states and transitions

Everything needed to recreate Planning & Goals pixel-perfect is included.
