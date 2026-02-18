import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type TimeRange = '7d' | '30d' | '90d' | '12m';

interface TrendPoint { label: string; value: number; }
interface StatusBreakdown { label: string; value: number; }

export interface AnalyticsData {
  overview: {
    programs:    { total: number; change: number; trend: string };
    assessments: { total: number; active: number; trend: string };
    enrollments: { total: number; newInPeriod: number; trend: string };
    goals:       { completionRate: number; total: number; trend: string };
  };
  programs: {
    totalPrograms: number;
    activePrograms: number;
    draftPrograms: number;
    archivedPrograms: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completionRate: number;
    averageProgress: number;
    enrollmentTrend: TrendPoint[];
    completionTrend: TrendPoint[];
    programsByStatus: StatusBreakdown[];
    topPrograms: { id: string; name: string; enrollments: number; completionRate: number }[];
  };
  assessments: {
    totalAssessments: number;
    activeAssessments: number;
    completedAssessments: number;
    draftAssessments: number;
    averageResponseRate: number;
    responseRateTrend: TrendPoint[];
    assessmentsByStatus: StatusBreakdown[];
  };
  team: {
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
    departmentBreakdown: StatusBreakdown[];
    headcountTrend: TrendPoint[];
  };
  goals: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    overdueGoals: number;
    completionRate: number;
    averageProgress: number;
    goalsByStatus: StatusBreakdown[];
    goalsByCategory: StatusBreakdown[];
    goalsTrend: TrendPoint[];
  };
}

export function useAnalytics(timeRange: TimeRange, tenantId?: string) {
  const params = new URLSearchParams({ timeRange });
  if (tenantId && tenantId !== 'all') params.set('tenantId', tenantId);

  return useQuery({
    queryKey: ['analytics', timeRange, tenantId ?? 'all'],
    queryFn: async () => {
      const response = await api.get<AnalyticsData>(`/api/analytics?${params.toString()}`) as unknown as { data: AnalyticsData };
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
