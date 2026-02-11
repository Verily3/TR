/**
 * Default mock data for Planning & Goals module
 */

import type {
  Pillar,
  Objective,
  Priority,
  ActionItem,
  Goal,
  KPICategory,
  ScorecardOption,
  GoalSuggestion,
  GoalStats,
  QuarterOverview,
  AnnualPlan,
} from "./types";

/** Annual plan data */
export const defaultAnnualPlan: AnnualPlan = {
  year: 2026,
  completionPercent: 68,
  quartersComplete: 8,
  totalQuarters: 12,
};

/** Strategic pillars */
export const defaultPillars: Pillar[] = [
  {
    id: "pillar-1",
    name: "Profitable Growth",
    target: "$250M Revenue | 12% EBITDA",
    progress: 72,
    initiatives: 8,
    status: "on-track",
  },
  {
    id: "pillar-2",
    name: "Operational Excellence",
    target: "85% OEE | <2% Waste",
    progress: 58,
    initiatives: 6,
    status: "at-risk",
  },
  {
    id: "pillar-3",
    name: "Market Leadership",
    target: "20% Market Share | Top 3 Brand",
    progress: 65,
    initiatives: 5,
    status: "on-track",
  },
];

/** Annual objectives */
export const defaultObjectives: Objective[] = [
  {
    id: "obj-1",
    title: "Achieve $250M in total revenue with balanced growth across raw and cooked segments",
    owner: "CEO",
    ownerRole: "CEO",
    category: "Financial",
    activeQuarters: ["Q1", "Q2", "Q3", "Q4"],
    progress: 78,
    status: "on-track",
  },
  {
    id: "obj-2",
    title: "Expand national distribution to 9,000+ retail points",
    owner: "CMO",
    ownerRole: "CMO",
    category: "Market Growth",
    activeQuarters: ["Q1", "Q2", "Q3", "Q4"],
    progress: 62,
    status: "on-track",
  },
  {
    id: "obj-3",
    title: "Improve plant OEE to 85%",
    owner: "COO",
    ownerRole: "COO",
    category: "Operational",
    activeQuarters: ["Q1", "Q2", "Q3", "Q4"],
    progress: 54,
    status: "at-risk",
  },
  {
    id: "obj-4",
    title: "Build executive bench strength - 80% A-players",
    owner: "CEO",
    ownerRole: "CEO",
    category: "People",
    activeQuarters: ["Q1", "Q2", "Q3", "Q4"],
    progress: 70,
    status: "on-track",
  },
  {
    id: "obj-5",
    title: "Launch 3 new value-added product lines",
    owner: "CMO",
    ownerRole: "CMO",
    category: "Innovation",
    activeQuarters: ["Q2", "Q3", "Q4"],
    progress: 45,
    status: "needs-attention",
  },
];

/** Quarter overview */
export const defaultQuarterOverview: QuarterOverview = {
  theme: "Foundation & Momentum",
  prioritiesActive: 12,
  actionItemsTotal: 47,
  actionItemsComplete: 32,
  completionPercent: 68,
};

/** Quarterly priorities */
export const defaultPriorities: Priority[] = [
  {
    id: "priority-1",
    title: "Complete operational audit and implement Q1 efficiency improvements",
    category: "Operational Excellence",
    owner: "Sarah Mitchell",
    ownerRole: "President/COO",
    dueDate: "Mar 31, 2026",
    actionsCompleted: 6,
    actionsTotal: 8,
    status: "on-track",
  },
  {
    id: "priority-2",
    title: "Launch national marketing campaign",
    category: "Market Leadership",
    owner: "Jennifer Lopez",
    ownerRole: "CMO",
    dueDate: "Feb 28, 2026",
    actionsCompleted: 10,
    actionsTotal: 12,
    status: "on-track",
  },
  {
    id: "priority-3",
    title: "Close acquisition of regional distributor",
    category: "Profitable Growth",
    owner: "You",
    ownerRole: "CEO",
    dueDate: "Mar 15, 2026",
    actionsCompleted: 3,
    actionsTotal: 6,
    status: "at-risk",
  },
  {
    id: "priority-4",
    title: "Execute LeaderShift program",
    category: "People & Culture",
    owner: "You",
    ownerRole: "CEO",
    dueDate: "Mar 31, 2026",
    actionsCompleted: 4,
    actionsTotal: 5,
    status: "on-track",
  },
];

/** Weekly action items */
export const defaultActionItems: ActionItem[] = [
  {
    id: "action-1",
    title: "Review and approve Q1 marketing budget allocation",
    owner: "CMO",
    dueDate: "Jan 17",
    completed: false,
  },
  {
    id: "action-2",
    title: "Finalize acquisition due diligence",
    owner: "CFO",
    dueDate: "Jan 18",
    completed: false,
  },
  {
    id: "action-3",
    title: "Conduct LeaderShift Module 3 session",
    owner: "You",
    dueDate: "Jan 16",
    completed: true,
  },
  {
    id: "action-4",
    title: "Review plant efficiency metrics",
    owner: "You",
    dueDate: "Jan 19",
    completed: false,
  },
  {
    id: "action-5",
    title: "Approve new product launch timeline",
    owner: "CMO",
    dueDate: "Jan 20",
    completed: false,
  },
  {
    id: "action-6",
    title: "Meet with board compensation committee",
    owner: "You",
    dueDate: "Jan 18",
    completed: true,
  },
];

/** Goal stats summary */
export const defaultGoalStats: GoalStats = {
  total: 18,
  newThisQuarter: 3,
  onTrack: 12,
  atRisk: 4,
  needsAttention: 2,
};

/** Goals list */
export const defaultGoals: Goal[] = [
  {
    id: "goal-1",
    title: "Increase EBITDA to $24M by end of Q1 2026",
    type: "company",
    category: "Financial",
    owner: "Marcus Chen",
    ownerRole: "CFO",
    dueDate: "Mar 31, 2026",
    scorecardLink: "Revenue & Profit Growth",
    progress: 78,
    currentValue: "$22.8M",
    targetValue: "$24M",
    status: "on-track",
  },
  {
    id: "goal-2",
    title: "Achieve 85% OEE across all plants",
    type: "company",
    category: "Operational",
    owner: "Sarah Mitchell",
    ownerRole: "COO",
    dueDate: "Jun 30, 2026",
    scorecardLink: "Operational Excellence",
    progress: 54,
    currentValue: "82.3%",
    targetValue: "85%",
    status: "at-risk",
  },
  {
    id: "goal-3",
    title: "Complete LeaderShift with 90%+ engagement",
    type: "team",
    category: "People",
    owner: "You",
    ownerRole: "CEO",
    dueDate: "Mar 31, 2026",
    scorecardLink: "Talent & Culture",
    progress: 82,
    currentValue: "Module 7",
    targetValue: "Module 9",
    status: "on-track",
  },
  {
    id: "goal-4",
    title: "Expand distribution to 9,000 retail points",
    type: "company",
    category: "Market Growth",
    owner: "Jennifer Lopez",
    ownerRole: "CMO",
    dueDate: "Dec 31, 2026",
    scorecardLink: "Market Expansion",
    progress: 62,
    currentValue: "8,420",
    targetValue: "9,000",
    status: "on-track",
  },
  {
    id: "goal-5",
    title: "Launch 3 new value-added product SKUs",
    type: "team",
    category: "Innovation",
    owner: "Jennifer Lopez",
    ownerRole: "CMO",
    dueDate: "Sep 30, 2026",
    scorecardLink: "Innovation Pipeline",
    progress: 33,
    currentValue: "1",
    targetValue: "3 products",
    status: "needs-attention",
  },
  {
    id: "goal-6",
    title: "Achieve 80% A-player rating",
    type: "personal",
    category: "People",
    owner: "You",
    ownerRole: "CEO",
    dueDate: "Dec 31, 2026",
    scorecardLink: "Executive Bench Strength",
    progress: 78,
    currentValue: "78%",
    targetValue: "80%",
    status: "on-track",
  },
];

/** KPI categories with metrics */
export const defaultKPICategories: KPICategory[] = [
  {
    id: "kpi-financial",
    name: "Financial Performance",
    icon: "DollarSign",
    columns: 4,
    metrics: [
      {
        id: "metric-1",
        name: "Revenue",
        value: "$62.5M",
        target: "$62M",
        change: "+0.8%",
        changeDirection: "up",
        unit: "Quarterly",
      },
      {
        id: "metric-2",
        name: "EBITDA",
        value: "$24.5M",
        target: "$23M",
        change: "+6.5%",
        changeDirection: "up",
        unit: "Annual Run Rate",
      },
      {
        id: "metric-3",
        name: "Net Margin",
        value: "8.2%",
        target: "8.0%",
        change: "+0.3%",
        changeDirection: "up",
        unit: "%",
      },
      {
        id: "metric-4",
        name: "ROIC",
        value: "14.8%",
        target: "15%",
        change: "-0.5%",
        changeDirection: "down",
        unit: "%",
      },
    ],
  },
  {
    id: "kpi-operational",
    name: "Operational Efficiency",
    icon: "Factory",
    columns: 4,
    metrics: [
      {
        id: "metric-5",
        name: "Plant OEE",
        value: "82.3%",
        target: "85%",
        change: "-2.7%",
        changeDirection: "down",
      },
      {
        id: "metric-6",
        name: "Product Yield",
        value: "94.1%",
        target: "95%",
        change: "0%",
        changeDirection: "neutral",
      },
      {
        id: "metric-7",
        name: "Throughput/Shift",
        value: "12.8K lbs",
        target: "13K lbs",
        change: "+3%",
        changeDirection: "up",
      },
      {
        id: "metric-8",
        name: "Downtime Hours",
        value: "124hrs",
        target: "<100hrs",
        change: "+24%",
        changeDirection: "down",
      },
    ],
  },
  {
    id: "kpi-people",
    name: "People & Culture",
    icon: "Users",
    columns: 3,
    metrics: [
      {
        id: "metric-9",
        name: "A-Player %",
        value: "78%",
        target: "80%",
        change: "+5%",
        changeDirection: "up",
      },
      {
        id: "metric-10",
        name: "Engagement Score",
        value: "87%",
        target: "85%",
        change: "+2%",
        changeDirection: "up",
      },
      {
        id: "metric-11",
        name: "Leadership Retention",
        value: "92%",
        target: "90%",
        change: "+2%",
        changeDirection: "up",
      },
    ],
  },
  {
    id: "kpi-market",
    name: "Market Growth",
    icon: "Award",
    columns: 3,
    metrics: [
      {
        id: "metric-12",
        name: "Market Share",
        value: "18.2%",
        target: "20%",
        change: "+1.5%",
        changeDirection: "up",
      },
      {
        id: "metric-13",
        name: "Distribution Points",
        value: "8,420",
        target: "9,000",
        change: "+12%",
        changeDirection: "up",
      },
      {
        id: "metric-14",
        name: "Brand NPS",
        value: "67",
        target: "70",
        change: "+5",
        changeDirection: "up",
      },
    ],
  },
];

/** Scorecard options for goal linking */
export const defaultScorecardOptions: ScorecardOption[] = [
  {
    id: "scorecard-1",
    name: "Operational Excellence",
    description: "Partner with COO to drive efficiencies",
    score: 78,
    status: "at-risk",
  },
  {
    id: "scorecard-2",
    name: "Revenue & Profit Growth",
    description: "Achieve profitable growth targets",
    score: 88,
    status: "on-track",
  },
  {
    id: "scorecard-3",
    name: "Talent & Culture",
    description: "Build high-performance leadership team",
    score: 90,
    status: "on-track",
  },
];

/** AI suggestions for goal creation */
export const defaultGoalSuggestions: GoalSuggestion[] = [
  {
    id: "suggestion-1",
    title: "Improve Plant OEE from 82.3% to 85%",
    category: "Operational",
    reason: "Your Operational Excellence accountability is at risk (78 score)",
    scorecardLink: "Scorecard: Operational Excellence",
  },
  {
    id: "suggestion-2",
    title: "Close 2 strategic M&A deals in Q2-Q3 2026",
    category: "Growth",
    reason: "Strategic Expansion accountability needs attention (72 score)",
    scorecardLink: "Scorecard: Strategic Expansion",
  },
  {
    id: "suggestion-3",
    title: "Launch innovation lab for new product development",
    category: "Innovation",
    reason: "Innovation Pipeline accountability maintains momentum (85 score)",
    scorecardLink: "Scorecard: Innovation Pipeline",
  },
];

/** Goal owner options */
export const goalOwnerOptions = [
  { value: "you", label: "You (CEO)" },
  { value: "sarah", label: "Sarah Mitchell (President/COO)" },
  { value: "marcus", label: "Marcus Chen (CFO)" },
  { value: "jennifer", label: "Jennifer Lopez (CMO)" },
  { value: "david", label: "David Park (VP Operations)" },
  { value: "amanda", label: "Amanda Brooks (VP Sales)" },
];

/** Goal type options */
export const goalTypeOptions = [
  { value: "company", label: "Company Goal" },
  { value: "team", label: "Team Goal" },
  { value: "personal", label: "Personal Goal" },
];

/** Goal category options */
export const goalCategoryOptions = [
  { value: "financial", label: "Financial" },
  { value: "operational", label: "Operational" },
  { value: "market-growth", label: "Market Growth" },
  { value: "people", label: "People & Culture" },
  { value: "innovation", label: "Innovation" },
  { value: "compliance", label: "Compliance & Safety" },
  { value: "brand", label: "Brand Strength" },
];

/** Measurement frequency options */
export const measurementFrequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

/** Annual plan link options */
export const annualPlanLinkOptions = [
  { value: "none", label: "No link" },
  { value: "profitable-growth", label: "Profitable Growth Pillar" },
  { value: "operational-excellence", label: "Operational Excellence Pillar" },
  { value: "market-leadership", label: "Market Leadership Pillar" },
];

/** Program link options */
export const programLinkOptions = [
  { value: "none", label: "No link" },
  { value: "leadershift", label: "LeaderShift: Leading through Change" },
  { value: "executive-excellence", label: "Executive Excellence Program" },
  { value: "team-building", label: "High-Performance Team Building" },
];

/** Accountability partner options */
export const accountabilityPartnerOptions = [
  { value: "none", label: "No partner" },
  { value: "sarah", label: "Sarah Mitchell (President/COO)" },
  { value: "marcus", label: "Marcus Chen (CFO)" },
  { value: "jennifer", label: "Jennifer Lopez (CMO)" },
  { value: "coach", label: "Your Executive Coach" },
];
