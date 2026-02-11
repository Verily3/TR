import type { TrendDirection } from "../ui";

// Shared types for scorecard components

export type AccountabilityStatus = "on-track" | "at-risk" | "needs-attention";

export interface Accountability {
  id: string;
  title: string;
  description: string;
  score: number;
  status: AccountabilityStatus;
}

export interface KPI {
  id: string;
  label: string;
  value: string;
  target: string;
  change: string;
  trend: TrendDirection;
  /** If true, a downward trend is considered positive (e.g., reducing incidents) */
  invertTrend?: boolean;
}

export interface KPICategory {
  id: string;
  name: string;
  iconName: string;
  kpis: KPI[];
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  selfRating: number;
  mentorRating: number;
}

export interface DirectReport {
  id: string;
  name: string;
  role: string;
  scorecardScore: number;
  scorecardTrend: TrendDirection;
  goalsCompleted: number;
  goalsTotal: number;
  programsActive: number;
  rating: "A" | "A-" | "B+" | "B" | "B-";
}

export interface HealthCategory {
  id: string;
  name: string;
  score: number;
  change: number;
  trend: TrendDirection;
}

export interface ScorecardData {
  role: string;
  mission: string;
  overallScore: number;
  scoreTrend: number;
  comparisonPeriod: string;
  accountabilities: Accountability[];
  kpiCategories: KPICategory[];
  competencies: Competency[];
  directReports: DirectReport[];
  healthCategories: HealthCategory[];
}
