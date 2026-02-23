import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalStatus = 'draft' | 'active' | 'completed' | 'on_hold' | 'cancelled';
export type GoalCategory =
  | 'professional'
  | 'personal'
  | 'leadership'
  | 'strategic'
  | 'performance'
  | 'development';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface PlanningGoal {
  id: string;
  userId: string;
  tenantId: string;
  title: string;
  description: string | null;
  successMetrics: string | null;
  actionSteps: string[];
  category: GoalCategory;
  priority: GoalPriority;
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  status: GoalStatus;
  parentGoalId: string | null;
  assessmentId: string | null;
  reviewFrequency: string;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerName: string | null;
}

export interface GoalListResponse {
  data: PlanningGoal[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PlanningSummary {
  goals: {
    total: number;
    active: number;
    completed: number;
    draft: number;
    onHold: number;
    avgProgress: number;
    byCategory: { category: GoalCategory; count: number }[];
  };
  plans: { total: number; active: number };
}

export interface CreateGoalData {
  title: string;
  description?: string;
  successMetrics?: string;
  actionSteps?: string[];
  category?: GoalCategory;
  priority?: GoalPriority;
  startDate?: string;
  targetDate?: string;
  reviewFrequency?: string;
  parentGoalId?: string;
  assessmentId?: string;
  strategicPlanId?: string;
}

export interface UpdateGoalData extends Partial<CreateGoalData> {
  progress?: number;
  status?: GoalStatus;
}

// ─── Goal Hooks ───────────────────────────────────────────────────────────────

export function useGoals(
  tenantId: string | null,
  params?: {
    status?: GoalStatus;
    category?: GoalCategory;
    userId?: string;
    page?: number;
    limit?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.category) query.set('category', params.category);
  if (params?.userId) query.set('userId', params.userId);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  return useQuery<GoalListResponse>({
    queryKey: ['planning', 'goals', tenantId, params],
    queryFn: async () => {
      const r = await api.get<unknown>(
        `/api/tenants/${tenantId}/planning/goals?${query.toString()}`
      );
      return r as unknown as GoalListResponse;
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateGoal(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateGoalData) => {
      const r = await api.post<PlanningGoal>(`/api/tenants/${tenantId}/planning/goals`, data);
      return r as unknown as { data: PlanningGoal };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'goals', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['planning', 'summary', tenantId] });
    },
  });
}

export function useUpdateGoal(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: UpdateGoalData }) => {
      const r = await api.put<PlanningGoal>(
        `/api/tenants/${tenantId}/planning/goals/${goalId}`,
        data
      );
      return r as unknown as { data: PlanningGoal };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'goals', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['planning', 'summary', tenantId] });
    },
  });
}

export function useDeleteGoal(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: string) => {
      await api.delete<{ success: boolean }>(`/api/tenants/${tenantId}/planning/goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'goals', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['planning', 'summary', tenantId] });
    },
  });
}

export function usePlanningSummary(tenantId: string | null) {
  return useQuery<PlanningSummary>({
    queryKey: ['planning', 'summary', tenantId],
    queryFn: async () => {
      const r = await api.get<PlanningSummary>(`/api/tenants/${tenantId}/planning/summary`);
      return r.data;
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Strategic Plan Hooks ─────────────────────────────────────────────────────

export type PlanType = '3hag' | 'bhag' | 'annual' | 'quarterly';
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface StrategicPlan {
  id: string;
  tenantId: string;
  createdBy: string | null;
  name: string;
  description: string | null;
  planType: PlanType;
  startDate: string | null;
  targetDate: string | null;
  status: PlanStatus;
  config: Record<string, unknown>;
  parentPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useStrategicPlans(
  tenantId: string | null,
  params?: { status?: PlanStatus; planType?: PlanType }
) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.planType) query.set('planType', params.planType);

  return useQuery<{ data: StrategicPlan[]; meta: object }>({
    queryKey: ['planning', 'plans', tenantId, params],
    queryFn: async () => {
      const r = await api.get<unknown>(
        `/api/tenants/${tenantId}/planning/plans?${query.toString()}`
      );
      return r as unknown as { data: StrategicPlan[]; meta: object };
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStrategicPlan(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      planType: PlanType;
      description?: string;
      startDate?: string;
      targetDate?: string;
      config?: Record<string, unknown>;
      parentPlanId?: string;
    }) => {
      const r = await api.post<StrategicPlan>(`/api/tenants/${tenantId}/planning/plans`, data);
      return r as unknown as { data: StrategicPlan };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'plans', tenantId] });
    },
  });
}
