/**
 * Type definitions for the Planning & Goals module
 */

/** Status for progress tracking */
export type ProgressStatus = "on-track" | "at-risk" | "needs-attention";

/** Goal type classification */
export type GoalType = "company" | "team" | "personal";

/** Goal category */
export type GoalCategory =
  | "financial"
  | "operational"
  | "market-growth"
  | "people"
  | "innovation"
  | "compliance"
  | "brand";

/** Measurement frequency */
export type MeasurementFrequency = "weekly" | "bi-weekly" | "monthly" | "quarterly";

/** Quarter identifier */
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

/** Strategic pillar for annual planning */
export interface Pillar {
  id: string;
  name: string;
  target: string;
  progress: number;
  initiatives: number;
  status: ProgressStatus;
}

/** Annual objective */
export interface Objective {
  id: string;
  title: string;
  owner: string;
  ownerRole: string;
  category: string;
  activeQuarters: Quarter[];
  progress: number;
  status: ProgressStatus;
}

/** Quarterly priority */
export interface Priority {
  id: string;
  title: string;
  category: string;
  owner: string;
  ownerRole: string;
  dueDate: string;
  actionsCompleted: number;
  actionsTotal: number;
  status: ProgressStatus;
}

/** Weekly action item */
export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  completed: boolean;
}

/** Goal with progress tracking */
export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  category: string;
  owner: string;
  ownerRole: string;
  dueDate: string;
  scorecardLink?: string;
  progress: number;
  currentValue: string;
  targetValue: string;
  status: ProgressStatus;
}

/** KPI metric */
export interface KPIMetric {
  id: string;
  name: string;
  value: string;
  target: string;
  change: string;
  changeDirection: "up" | "down" | "neutral";
  unit?: string;
}

/** KPI category */
export interface KPICategory {
  id: string;
  name: string;
  icon: string;
  metrics: KPIMetric[];
  columns: number;
}

/** Scorecard link option */
export interface ScorecardOption {
  id: string;
  name: string;
  description: string;
  score: number;
  status: ProgressStatus;
}

/** AI suggestion for goal creation */
export interface GoalSuggestion {
  id: string;
  title: string;
  category: string;
  reason: string;
  scorecardLink: string;
}

/** Milestone for goal */
export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
}

/** Goal summary stats */
export interface GoalStats {
  total: number;
  newThisQuarter: number;
  onTrack: number;
  atRisk: number;
  needsAttention: number;
}

/** Quarter overview data */
export interface QuarterOverview {
  theme: string;
  prioritiesActive: number;
  actionItemsTotal: number;
  actionItemsComplete: number;
  completionPercent: number;
}

/** Annual plan data */
export interface AnnualPlan {
  year: number;
  completionPercent: number;
  quartersComplete: number;
  totalQuarters: number;
}
