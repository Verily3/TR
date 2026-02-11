// Analytics & Reports Types

export type TimeRange = "7d" | "30d" | "90d" | "12m" | "all";

export type MetricTrend = "up" | "down" | "stable";

export interface MetricCard {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  trend?: MetricTrend;
  format?: "number" | "percent" | "currency" | "duration";
}

export interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface ProgramMetrics {
  totalPrograms: number;
  activePrograms: number;
  completedPrograms: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageTimeToComplete: number; // days
  enrollmentTrend: TimeSeriesData[];
  completionTrend: TimeSeriesData[];
  programsByStatus: ChartDataPoint[];
  topPrograms: {
    id: string;
    name: string;
    enrollments: number;
    completionRate: number;
  }[];
}

export interface AssessmentMetrics {
  totalAssessments: number;
  activeAssessments: number;
  completedAssessments: number;
  totalResponses: number;
  averageResponseRate: number;
  averageScore: number;
  assessmentTrend: TimeSeriesData[];
  responseRateTrend: TimeSeriesData[];
  scoresByCompetency: ChartDataPoint[];
  assessmentsByStatus: ChartDataPoint[];
  topStrengths: string[];
  topDevelopmentAreas: string[];
}

export interface TeamMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  turnoverRate: number;
  averageTenure: number; // months
  departmentBreakdown: ChartDataPoint[];
  headcountTrend: TimeSeriesData[];
  engagementScore: number;
  goalCompletionRate: number;
  trainingHoursPerEmployee: number;
}

export interface GoalMetrics {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  overdueGoals: number;
  completionRate: number;
  averageProgress: number;
  goalsByStatus: ChartDataPoint[];
  goalsTrend: TimeSeriesData[];
  goalsByCategory: ChartDataPoint[];
}

export interface OverviewMetrics {
  programs: {
    total: number;
    change: number;
    trend: MetricTrend;
  };
  assessments: {
    total: number;
    change: number;
    trend: MetricTrend;
  };
  goals: {
    completionRate: number;
    change: number;
    trend: MetricTrend;
  };
  engagement: {
    score: number;
    change: number;
    trend: MetricTrend;
  };
}

// Props interfaces
export interface AnalyticsPageProps {
  overview?: OverviewMetrics;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
}

export interface ProgramAnalyticsProps {
  metrics?: ProgramMetrics;
  timeRange?: TimeRange;
}

export interface AssessmentAnalyticsProps {
  metrics?: AssessmentMetrics;
  timeRange?: TimeRange;
}

export interface TeamAnalyticsProps {
  metrics?: TeamMetrics;
  timeRange?: TimeRange;
}

export interface GoalAnalyticsProps {
  metrics?: GoalMetrics;
  timeRange?: TimeRange;
}
