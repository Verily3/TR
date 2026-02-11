import type {
  OverviewMetrics,
  ProgramMetrics,
  AssessmentMetrics,
  TeamMetrics,
  GoalMetrics,
} from "./types";

export const defaultOverviewMetrics: OverviewMetrics = {
  programs: {
    total: 12,
    change: 20,
    trend: "up",
  },
  assessments: {
    total: 48,
    change: 15,
    trend: "up",
  },
  goals: {
    completionRate: 78,
    change: 5,
    trend: "up",
  },
  engagement: {
    score: 4.2,
    change: -2,
    trend: "down",
  },
};

export const defaultProgramMetrics: ProgramMetrics = {
  totalPrograms: 12,
  activePrograms: 8,
  completedPrograms: 4,
  totalEnrollments: 342,
  activeEnrollments: 256,
  completionRate: 73,
  averageProgress: 62,
  averageTimeToComplete: 45,
  enrollmentTrend: [
    { date: "2024-07", value: 28 },
    { date: "2024-08", value: 35 },
    { date: "2024-09", value: 42 },
    { date: "2024-10", value: 38 },
    { date: "2024-11", value: 52 },
    { date: "2024-12", value: 45 },
    { date: "2025-01", value: 58 },
  ],
  completionTrend: [
    { date: "2024-07", value: 12 },
    { date: "2024-08", value: 18 },
    { date: "2024-09", value: 15 },
    { date: "2024-10", value: 22 },
    { date: "2024-11", value: 28 },
    { date: "2024-12", value: 24 },
    { date: "2025-01", value: 32 },
  ],
  programsByStatus: [
    { label: "Active", value: 8 },
    { label: "Completed", value: 4 },
    { label: "Draft", value: 2 },
    { label: "Archived", value: 1 },
  ],
  topPrograms: [
    { id: "p1", name: "Leadership Excellence", enrollments: 86, completionRate: 82 },
    { id: "p2", name: "Manager to Leader", enrollments: 64, completionRate: 75 },
    { id: "p3", name: "New Manager Bootcamp", enrollments: 52, completionRate: 88 },
    { id: "p4", name: "Executive Presence", enrollments: 45, completionRate: 68 },
    { id: "p5", name: "Strategic Thinking", enrollments: 38, completionRate: 71 },
  ],
};

export const defaultAssessmentMetrics: AssessmentMetrics = {
  totalAssessments: 48,
  activeAssessments: 12,
  completedAssessments: 36,
  totalResponses: 892,
  averageResponseRate: 84,
  averageScore: 3.8,
  assessmentTrend: [
    { date: "2024-07", value: 5 },
    { date: "2024-08", value: 7 },
    { date: "2024-09", value: 6 },
    { date: "2024-10", value: 8 },
    { date: "2024-11", value: 10 },
    { date: "2024-12", value: 6 },
    { date: "2025-01", value: 6 },
  ],
  responseRateTrend: [
    { date: "2024-07", value: 78 },
    { date: "2024-08", value: 82 },
    { date: "2024-09", value: 79 },
    { date: "2024-10", value: 85 },
    { date: "2024-11", value: 88 },
    { date: "2024-12", value: 84 },
    { date: "2025-01", value: 86 },
  ],
  scoresByCompetency: [
    { label: "Communication", value: 4.2 },
    { label: "Leadership", value: 3.9 },
    { label: "Strategic Thinking", value: 3.6 },
    { label: "Team Development", value: 3.8 },
    { label: "Decision Making", value: 3.7 },
    { label: "Innovation", value: 3.5 },
  ],
  assessmentsByStatus: [
    { label: "Completed", value: 36 },
    { label: "Active", value: 12 },
    { label: "Draft", value: 4 },
  ],
  topStrengths: ["Communication", "Collaboration", "Problem Solving"],
  topDevelopmentAreas: ["Strategic Thinking", "Innovation", "Delegation"],
};

export const defaultTeamMetrics: TeamMetrics = {
  totalEmployees: 156,
  activeEmployees: 148,
  newHires: 12,
  turnoverRate: 8.5,
  averageTenure: 28,
  departmentBreakdown: [
    { label: "Engineering", value: 48 },
    { label: "Sales", value: 32 },
    { label: "Marketing", value: 24 },
    { label: "Operations", value: 20 },
    { label: "HR", value: 16 },
    { label: "Finance", value: 16 },
  ],
  headcountTrend: [
    { date: "2024-07", value: 142 },
    { date: "2024-08", value: 145 },
    { date: "2024-09", value: 148 },
    { date: "2024-10", value: 150 },
    { date: "2024-11", value: 152 },
    { date: "2024-12", value: 154 },
    { date: "2025-01", value: 156 },
  ],
  engagementScore: 4.2,
  goalCompletionRate: 78,
  trainingHoursPerEmployee: 24,
};

export const defaultGoalMetrics: GoalMetrics = {
  totalGoals: 234,
  completedGoals: 156,
  inProgressGoals: 62,
  overdueGoals: 16,
  completionRate: 67,
  averageProgress: 72,
  goalsByStatus: [
    { label: "Completed", value: 156 },
    { label: "In Progress", value: 62 },
    { label: "Not Started", value: 24 },
    { label: "Overdue", value: 16 },
  ],
  goalsTrend: [
    { date: "2024-07", value: 18 },
    { date: "2024-08", value: 22 },
    { date: "2024-09", value: 25 },
    { date: "2024-10", value: 28 },
    { date: "2024-11", value: 32 },
    { date: "2024-12", value: 24 },
    { date: "2025-01", value: 28 },
  ],
  goalsByCategory: [
    { label: "Professional Development", value: 68 },
    { label: "Performance", value: 52 },
    { label: "Leadership", value: 45 },
    { label: "Technical Skills", value: 38 },
    { label: "Team Building", value: 31 },
  ],
};

export const timeRangeOptions: { id: string; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "12m", label: "Last 12 months" },
  { id: "all", label: "All time" },
];
