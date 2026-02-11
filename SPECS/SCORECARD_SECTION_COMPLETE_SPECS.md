# Executive Scorecard Section - Complete Implementation Specifications

## Document Purpose
This document contains EVERY detail needed to recreate the Executive Scorecard Section pixel-perfect. It includes exact measurements, colors, spacing, content, layouts, and component specifications for all sections of the comprehensive strategic performance dashboard.

---

## Quick Reference

### File Structure
- **Scorecard Page**: `/src/app/components/scorecard/ScorecardPage.tsx`

### All Sections Included
1. ✅ Page Header with period selector and export button
2. ✅ Role & Mission card with overall score
3. ✅ Key Accountabilities (8 cards in 2-column grid)
4. ✅ KPI Dashboard (6 categories with multiple KPIs each):
   - Financial KPIs (4 metrics)
   - Operational KPIs (4 metrics)
   - Market Growth KPIs (3 metrics)
   - People & Culture KPIs (3 metrics)
   - Compliance & Safety KPIs (3 metrics)
   - Brand Strength KPIs (3 metrics)
5. ✅ A-Player Competencies (9 competencies with dual ratings)
6. ✅ Direct Reports Performance table (5 direct reports)
7. ✅ Organizational Health Score (5 categories)

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

**Purpose**: Title, subtitle, period selector, and export button

```tsx
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h1 className="text-sidebar-foreground mb-2">Executive Scorecard</h1>
      <p className="text-muted-foreground">
        Strategic performance dashboard for organizational leadership
      </p>
    </div>
    <div className="flex items-center gap-3">
      <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground">
        <option>Q1 2026</option>
        <option>Q4 2025</option>
        <option>Q3 2025</option>
        <option>Q2 2025</option>
      </select>
      <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
        Export Report
      </button>
    </div>
  </div>
</div>
```

**Specifications**:
- H1: Default HTML size, `text-sidebar-foreground`, `mb-2`
- Subtitle: `text-muted-foreground`
- Select: `px-4 py-2 bg-card border border-border rounded-lg text-sm`
- Button: `px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm`
- Controls gap: `gap-3` (12px)
- Section margin: `mb-8` (32px)

**Period Options**:
- Q1 2026 (default selected)
- Q4 2025
- Q3 2025
- Q2 2025

---

## 2. Role & Mission Card

**Purpose**: Executive role, mission statement, and overall performance score

```tsx
<div className="mb-8 bg-card border border-border rounded-lg p-6">
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-xs text-muted-foreground">ROLE</div>
      </div>
      <h2 className="text-sidebar-foreground mb-4">Chief Executive Officer</h2>
      <div className="text-xs text-muted-foreground mb-2">MISSION</div>
      <p className="text-sm text-sidebar-foreground leading-relaxed max-w-4xl">
        Lead the company to profitable, scalable growth by setting strategic direction, strengthening operational
        performance, building a high-performance leadership team, and positioning the brand as a trusted industry
        leader in both raw and value-added chicken products.
      </p>
    </div>
    <div className="text-right">
      <div className="text-xs text-muted-foreground mb-1">OVERALL SCORE</div>
      <div className="text-3xl text-sidebar-foreground mb-1">87</div>
      <div className="flex items-center gap-1 text-sm text-green-600">
        <TrendingUp className="w-4 h-4" />
        <span>+5 vs Q4</span>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Container: `bg-card border border-border rounded-lg p-6 mb-8`
- Layout: Flex with `items-start justify-between`
- ROLE label: `text-xs text-muted-foreground` (all caps)
- Role title (H2): `text-sidebar-foreground mb-4`
- MISSION label: `text-xs text-muted-foreground mb-2` (all caps)
- Mission text: `text-sm text-sidebar-foreground leading-relaxed max-w-4xl`
- Overall score label: `text-xs text-muted-foreground mb-1`
- Score value: `text-3xl text-sidebar-foreground mb-1`
- Trend: `flex items-center gap-1 text-sm text-green-600`
- Trend icon: `w-4 h-4`

**Default Data**:
- Role: "Chief Executive Officer"
- Overall Score: 87
- Trend: "+5 vs Q4" (green, trending up)
- Mission: Full mission statement as shown

---

## 3. Key Accountabilities

**Purpose**: 8 key accountability areas with scores and status indicators

### Section Header

```tsx
<div className="mb-8">
  <h3 className="text-sidebar-foreground mb-4">Key Accountabilities</h3>
  <div className="grid grid-cols-2 gap-4">
    {/* Accountability cards */}
  </div>
</div>
```

**Specifications**:
- H3: `text-sidebar-foreground mb-4`
- Grid: `grid-cols-2 gap-4` (2 columns, 16px gap)

---

### Accountability Card

```tsx
<div className="bg-card border border-green-200 rounded-lg p-5">
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <h4 className="text-sm text-sidebar-foreground mb-2">Strategic Direction & Vision</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Establish and execute a 3–5 year growth strategy aligned with market trends and company capabilities
      </p>
    </div>
    <div className="ml-4 text-right">
      <div className="text-xl text-sidebar-foreground mb-1">92</div>
      <div className="text-xs text-green-600">
        On Track
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Card: `bg-card rounded-lg p-5`
- Border color: Dynamic based on status
  - On Track: `border-green-200`
  - At Risk: `border-yellow-200`
  - Needs Attention: `border-accent`
- Layout: `flex items-start justify-between mb-3`
- Title: `text-sm text-sidebar-foreground mb-2`
- Description: `text-xs text-muted-foreground leading-relaxed`
- Score: `text-xl text-sidebar-foreground mb-1`
- Status text: `text-xs` with color
  - On Track: `text-green-600`
  - At Risk: `text-yellow-600`
  - Needs Attention: `text-accent`

---

### All 8 Accountabilities (Default Data)

1. **Strategic Direction & Vision** - 92, On Track
   - "Establish and execute a 3–5 year growth strategy aligned with market trends and company capabilities"

2. **Revenue & Profit Growth** - 88, On Track
   - "Achieve YoY revenue growth of X%, with margin expansion. Balance growth between raw and cooked segments"

3. **Operational Excellence** - 78, At Risk
   - "Partner with President/COO to drive efficiencies and throughput. Benchmark OEE >85%"

4. **Brand Expansion** - 85, On Track
   - "Grow brand awareness and trust in both B2B and retail channels; launch national campaigns"

5. **Talent & Culture** - 90, On Track
   - "Attract and retain A-player executives; achieve >90% leadership retention; drive high-performance culture"

6. **Board & Investor Relations** - 94, On Track
   - "Maintain transparent communication and trust. Deliver consistent performance against board-approved metrics"

7. **M&A/Strategic Partnerships** - 72, Needs Attention
   - "Lead successful acquisitions or joint ventures to strengthen capabilities, market share, or capacity"

8. **Compliance & Risk Oversight** - 96, On Track
   - "Ensure regulatory and food safety compliance; zero critical violations; proactively mitigate risk"

---

## 4. KPI Dashboard

**Purpose**: Comprehensive performance metrics across 6 categories

### Section Header

```tsx
<div className="mb-8">
  <h3 className="text-sidebar-foreground mb-4">Key Performance Indicators</h3>
  {/* KPI categories */}
</div>
```

---

### KPI Category Pattern

Each category has:
- Category header with icon and label
- Grid of KPI cards

```tsx
<div className="mb-6">
  <div className="flex items-center gap-2 mb-3">
    <DollarSign className="w-5 h-5 text-accent" />
    <h4 className="text-sm text-sidebar-foreground">Financial</h4>
  </div>
  <div className="grid grid-cols-4 gap-4">
    {/* KPI cards */}
  </div>
</div>
```

**Specifications**:
- Category margin: `mb-6` (24px)
- Icon: `w-5 h-5 text-accent`
- Header: `text-sm text-sidebar-foreground`
- Gap between icon and text: `gap-2` (8px)
- Cards margin top: `mb-3` (12px)

---

### KPI Card

```tsx
<div className="bg-card border border-border rounded-lg p-4">
  <div className="text-xs text-muted-foreground mb-2">EBITDA</div>
  <div className="text-2xl text-sidebar-foreground mb-1">$24.5M</div>
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground">Target: $23M</span>
    <div className="flex items-center gap-1 text-green-600">
      <TrendingUp className="w-3 h-3" />
      <span>+6.5%</span>
    </div>
  </div>
</div>
```

**Specifications**:
- Card: `bg-card border border-border rounded-lg p-4`
- Label: `text-xs text-muted-foreground mb-2` (all caps)
- Value: `text-2xl text-sidebar-foreground mb-1`
- Target label: `text-xs text-muted-foreground`
- Trend: `flex items-center gap-1 text-xs`
- Trend colors:
  - Up: `text-green-600`
  - Down: `text-accent`
  - Neutral: `text-muted-foreground`
- Trend icon: `w-3 h-3`

**Trend Icons**:
- Up: `<TrendingUp className="w-3 h-3" />`
- Down: `<TrendingDown className="w-3 h-3" />`
- Neutral: `<Minus className="w-3 h-3" />`

---

### Category 1: Financial (4 KPIs)

**Grid**: `grid-cols-4 gap-4`
**Icon**: `<DollarSign className="w-5 h-5 text-accent" />`

1. **EBITDA**: $24.5M | Target: $23M | ↑ +6.5% (green)
2. **Net Margin %**: 8.2% | Target: 8.0% | ↑ +0.3% (green)
3. **Revenue Growth %**: 12.4% | Target: 10% | ↑ +2.4% (green)
4. **ROIC**: 14.8% | Target: 15% | ↓ -0.5% (red)

---

### Category 2: Operational (4 KPIs)

**Grid**: `grid-cols-4 gap-4`
**Icon**: `<Factory className="w-5 h-5 text-accent" />`

1. **Plant OEE**: 82.3% | Target: 85% | ↓ -2.7% (red)
2. **Yield %**: 94.1% | Target: 95% | — 0% (neutral)
3. **Downtime Hours**: 124 | Target: <100 | ↓ +24% (red - higher is worse)
4. **Throughput/Shift**: 12.8K lbs | Target: 13K lbs | ↑ +3% (green)

---

### Category 3: Market Growth (3 KPIs)

**Grid**: `grid-cols-3 gap-4`
**Icon**: `<GrowthIcon className="w-5 h-5 text-accent" />` (TrendingUp icon, aliased as GrowthIcon)

1. **Market Share (Cooked)**: 18.2% | Target: 20% | ↑ +1.5% (green)
2. **New Product Revenue %**: 15% | Target: 12% | ↑ +3% (green)
3. **Customer Retention**: 94% | Target: 95% | ↓ -1% (red)

---

### Category 4: People & Culture (3 KPIs)

**Grid**: `grid-cols-3 gap-4`
**Icon**: `<Users className="w-5 h-5 text-accent" />`

1. **% A-Players in Leadership**: 78% | Target: 80% | ↑ +5% (green)
2. **Engagement Score**: 87% | Target: 85% | ↑ +2% (green)
3. **Executive Team Stability**: 92% | Target: 90% | ↑ +2% (green)

---

### Category 5: Compliance & Safety (3 KPIs)

**Grid**: `grid-cols-3 gap-4`
**Icon**: `<Shield className="w-5 h-5 text-accent" />`

1. **USDA/FDA Audit Score**: 98 | Target: >95 | ↑ +3% (green)
2. **Critical Violations**: 0 | Target: 0 | — 0 (neutral, green)
3. **TRIR**: 2.1 | Target: <2.5 | ↑ -15% (green - negative is good for safety metrics)

---

### Category 6: Brand Strength (3 KPIs)

**Grid**: `grid-cols-3 gap-4`
**Icon**: `<Award className="w-5 h-5 text-accent" />`

1. **National Distribution Points**: 8,420 | Target: 9,000 | ↑ +12% (green)
2. **Brand Recall Rate**: 42% | Target: 45% | ↑ +3% (green)
3. **NPS (B2B & Retail)**: 67 | Target: 70 | ↑ +5 (green)

---

## 5. A-Player Competencies

**Purpose**: Self and mentor ratings for 9 leadership competencies

### Section Header

```tsx
<div className="mb-8">
  <h3 className="text-sidebar-foreground mb-4">A-Player Competencies</h3>
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="space-y-4">
      {/* Competency items */}
    </div>
  </div>
</div>
```

**Specifications**:
- H3: `text-sidebar-foreground mb-4`
- Container: `bg-card border border-border rounded-lg p-6`
- List spacing: `space-y-4` (16px between items)

---

### Competency Item

```tsx
<div className="pb-4 border-b border-border last:border-0 last:pb-0">
  <div className="flex items-start justify-between mb-2">
    <div className="flex-1">
      <div className="text-sm text-sidebar-foreground mb-1">Visionary Leadership</div>
      <div className="text-xs text-muted-foreground">
        Sees around corners and guides the company toward strategic advantage
      </div>
    </div>
    <div className="ml-6 flex items-center gap-6">
      {/* Self Rating */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">Self</div>
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-muted" />
        </div>
      </div>
      
      {/* Mentor Rating */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">Mentor</div>
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-accent" />
          <div className="w-6 h-6 rounded bg-muted" />
        </div>
      </div>
    </div>
  </div>
</div>
```

**Specifications**:
- Item separator: `pb-4 border-b border-border`
- Last item: `last:border-0 last:pb-0` (no border or padding on last)
- Competency name: `text-sm text-sidebar-foreground mb-1`
- Description: `text-xs text-muted-foreground`
- Rating columns gap: `gap-6` (24px between Self and Mentor)
- Left margin for ratings: `ml-6` (24px)
- Rating label: `text-xs text-muted-foreground mb-1`
- Rating squares: `w-6 h-6 rounded`
- Filled square: `bg-accent`
- Empty square: `bg-muted`
- Gap between squares: `gap-1` (4px)

---

### All 9 Competencies (Default Data)

1. **Visionary Leadership** (Self: 4, Mentor: 4)
   - "Sees around corners and guides the company toward strategic advantage"

2. **Financial Acumen** (Self: 5, Mentor: 5)
   - "Deep P&L mastery; understands drivers of value creation"

3. **Influence & Communication** (Self: 4, Mentor: 5)
   - "Inspires trust with board, customers, regulators, and employees"

4. **Talent Magnet** (Self: 4, Mentor: 4)
   - "Attracts and retains top executives and key talent"

5. **Operational Savvy** (Self: 3, Mentor: 3)
   - "Understands complexities of vertically integrated food processing"

6. **Customer Intuition** (Self: 4, Mentor: 4)
   - "Understands evolving customer demands across channels"

7. **Execution Focus** (Self: 5, Mentor: 4)
   - "Drives accountability and consistent delivery against critical goals"

8. **Crisis Leadership** (Self: 4, Mentor: 5)
   - "Maintains clarity and calm in times of volatility"

9. **High Integrity** (Self: 5, Mentor: 5)
   - "Embodies ethical, safety-first, and compliant business conduct"

---

## 6. Direct Reports Performance

**Purpose**: Table showing performance summary for 5 direct reports

### Section Container

```tsx
<div className="mb-8">
  <h3 className="text-sidebar-foreground mb-4">Direct Reports Performance</h3>
  <div className="bg-card border border-border rounded-lg overflow-hidden">
    <table className="w-full">
      {/* Table content */}
    </table>
  </div>
</div>
```

**Specifications**:
- H3: `text-sidebar-foreground mb-4`
- Container: `bg-card border border-border rounded-lg overflow-hidden`
- Table: `w-full`

---

### Table Header

```tsx
<thead className="bg-muted/50 border-b border-border">
  <tr>
    <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">NAME</th>
    <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">ROLE</th>
    <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">SCORECARD</th>
    <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">GOALS</th>
    <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">PROGRAMS</th>
    <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">A-PLAYER RATING</th>
    <th className="px-6 py-3"></th>
  </tr>
</thead>
```

**Specifications**:
- Header row: `bg-muted/50 border-b border-border`
- Header cells: `text-left px-6 py-3 text-xs text-muted-foreground font-normal`
- All header text is uppercase

---

### Table Row

```tsx
<tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
  <td className="px-6 py-4 text-sm text-sidebar-foreground">Sarah Mitchell</td>
  <td className="px-6 py-4 text-sm text-muted-foreground">President/COO</td>
  <td className="px-6 py-4">
    <div className="flex items-center gap-2">
      <span className="text-sm text-sidebar-foreground">89</span>
      <TrendingUp className="w-3 h-3 text-green-600" />
    </div>
  </td>
  <td className="px-6 py-4 text-sm text-muted-foreground">5/6 On Track</td>
  <td className="px-6 py-4 text-sm text-muted-foreground">2 Active</td>
  <td className="px-6 py-4">
    <span className="inline-block px-2 py-1 rounded text-xs bg-green-50 text-green-700">
      A
    </span>
  </td>
  <td className="px-6 py-4 text-right">
    <button className="text-accent hover:text-accent/80 transition-colors">
      <ChevronRight className="w-4 h-4" />
    </button>
  </td>
</tr>
```

**Specifications**:
- Row: `border-b border-border last:border-0 hover:bg-muted/30 transition-colors`
- Cell padding: `px-6 py-4`
- Name: `text-sm text-sidebar-foreground`
- Role: `text-sm text-muted-foreground`
- Scorecard score: `text-sm text-sidebar-foreground`
- Scorecard trend icon: `w-3 h-3 text-green-600`
- Goals/Programs: `text-sm text-muted-foreground`
- Rating badge: `inline-block px-2 py-1 rounded text-xs`
  - A ratings: `bg-green-50 text-green-700`
  - B ratings: `bg-blue-50 text-blue-700`
- Action button icon: `w-4 h-4`

---

### All 5 Direct Reports (Default Data)

1. **Sarah Mitchell** - President/COO
   - Scorecard: 89 ↑
   - Goals: 5/6 On Track
   - Programs: 2 Active
   - Rating: A (green badge)

2. **Marcus Chen** - CFO
   - Scorecard: 92 ↑
   - Goals: 4/4 On Track
   - Programs: 1 Active
   - Rating: A (green badge)

3. **Jennifer Lopez** - CMO
   - Scorecard: 85 ↑
   - Goals: 3/5 On Track
   - Programs: 3 Active
   - Rating: A- (green badge)

4. **David Park** - VP Operations
   - Scorecard: 78 ↑
   - Goals: 2/4 On Track
   - Programs: 2 Active
   - Rating: B+ (blue badge)

5. **Amanda Brooks** - VP Sales
   - Scorecard: 88 ↑
   - Goals: 6/7 On Track
   - Programs: 1 Active
   - Rating: A (green badge)

---

## 7. Organizational Health Score

**Purpose**: 5 category health scores at the bottom of the page

```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-sidebar-foreground mb-4">Organizational Health Score</h3>
  <div className="grid grid-cols-5 gap-4">
    {/* Health score items */}
  </div>
</div>
```

**Specifications**:
- Container: `bg-card border border-border rounded-lg p-6`
- H3: `text-sidebar-foreground mb-4`
- Grid: `grid-cols-5 gap-4` (5 columns, 16px gap)

---

### Health Score Item

```tsx
<div className="text-center">
  <div className="text-xs text-muted-foreground mb-2">Strategy</div>
  <div className="text-3xl text-sidebar-foreground mb-2">88</div>
  <div className="flex items-center justify-center gap-1 text-xs text-green-600">
    <TrendingUp className="w-3 h-3" />
    <span>+3</span>
  </div>
</div>
```

**Specifications**:
- Alignment: `text-center`
- Category label: `text-xs text-muted-foreground mb-2`
- Score: `text-3xl text-sidebar-foreground mb-2`
- Trend: `flex items-center justify-center gap-1 text-xs`
- Trend colors:
  - Up: `text-green-600`
  - Down: `text-accent`
  - Neutral: `text-muted-foreground`
- Icon: `w-3 h-3`

---

### All 5 Health Categories (Default Data)

1. **Strategy**: 88 | ↑ +3 (green)
2. **Execution**: 82 | — 0 (neutral)
3. **Culture**: 90 | ↑ +3 (green)
4. **Learning**: 85 | ↑ +3 (green)
5. **Innovation**: 78 | ↓ -2 (red)

---

## Icon Reference

All icons imported from `lucide-react`:

```tsx
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronRight, 
  Target, 
  Users, 
  DollarSign, 
  Factory, 
  Award, 
  Shield, 
  TrendingUp as GrowthIcon 
} from "lucide-react";
```

**Icon Usage**:
- `TrendingUp` - Upward trend indicator
- `TrendingDown` - Downward trend indicator
- `Minus` - Neutral trend indicator
- `ChevronRight` - Navigation arrow in table
- `DollarSign` - Financial category
- `Factory` - Operational category
- `GrowthIcon` (alias of TrendingUp) - Market Growth category
- `Users` - People & Culture category
- `Shield` - Compliance & Safety category
- `Award` - Brand Strength category

---

## Color System

### Status Colors

**Accountability Status**:
- On Track: `border-green-200`, `text-green-600`
- At Risk: `border-yellow-200`, `text-yellow-600`
- Needs Attention: `border-accent`, `text-accent`

**KPI Trends**:
- Positive: `text-green-600`
- Negative: `text-accent` (red)
- Neutral: `text-muted-foreground`

**Rating Badges**:
- A ratings: `bg-green-50 text-green-700`
- B ratings: `bg-blue-50 text-blue-700`

**Competency Ratings**:
- Filled: `bg-accent`
- Empty: `bg-muted`

---

## Typography Scale

- Page title (H1): Default HTML size
- Section titles (H3): Default HTML size (used for "Key Accountabilities", "Key Performance Indicators", etc.)
- Card titles (H4): `text-sm`
- H2 (Role title): Default HTML size
- Labels: `text-xs` (uppercase with muted color)
- Body text: `text-sm`
- Large numbers: `text-2xl` (KPIs), `text-3xl` (Overall Score, Health Scores)
- Medium numbers: `text-xl` (Accountability scores)
- Small numbers: `text-sm`

---

## Spacing System

**Section Spacing**:
- Between major sections: `mb-8` (32px)
- Between KPI categories: `mb-6` (24px)
- Between category header and cards: `mb-3` (12px)
- Between competency items: `space-y-4` (16px in container)

**Card Padding**:
- Role & Mission card: `p-6` (24px)
- Accountability cards: `p-5` (20px)
- KPI cards: `p-4` (16px)
- A-Player Competencies container: `p-6` (24px)
- Org Health Score container: `p-6` (24px)

**Grid Gaps**:
- 2-column accountability grid: `gap-4` (16px)
- 4-column KPI grid: `gap-4` (16px)
- 3-column KPI grid: `gap-4` (16px)
- 5-column health score grid: `gap-4` (16px)

**Table Spacing**:
- Header padding: `px-6 py-3`
- Cell padding: `px-6 py-4`

---

## Responsive Considerations

- Max width: 1400px centered
- 2-column grids for accountability cards
- 4-column grids for Financial/Operational KPIs
- 3-column grids for other KPI categories
- 5-column grid for Org Health Score
- Table is full width within container

---

## Interactive Elements

**Hover States**:
- Export button: `hover:bg-accent/90`
- Table rows: `hover:bg-muted/30`
- Action button in table: `hover:text-accent/80`

**Transitions**:
- Button: `transition-colors`
- Table row: `transition-colors`
- Action button: `transition-colors`

---

## Summary

This document provides COMPLETE specifications for the Executive Scorecard including:

✅ **Page Header** - Title, subtitle, period selector, export button
✅ **Role & Mission Card** - Executive role, mission, overall score
✅ **8 Key Accountabilities** - Status-coded accountability cards in 2-column grid
✅ **6 KPI Categories** - 20 total KPIs across Financial, Operational, Market Growth, People & Culture, Compliance & Safety, and Brand Strength
✅ **9 A-Player Competencies** - Dual rating system (Self + Mentor) with 5-point scale
✅ **Direct Reports Table** - 5 reports with scorecard, goals, programs, and rating
✅ **Organizational Health Score** - 5 category health metrics

✅ All exact Tailwind classes and measurements
✅ Complete data structures and default values
✅ Color configurations for all status states
✅ Icon mappings and usage
✅ Typography scale
✅ Spacing system
✅ Grid layouts
✅ Table specifications
✅ Hover states and transitions

Everything needed to recreate the Executive Scorecard pixel-perfect is included.
