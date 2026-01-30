"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: "performance" | "development" | "project" | "okr";
  status: "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";
  progressStatus: "on_track" | "at_risk" | "behind" | "ahead" | null;
  progress: number;
  targetDate: string | null;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  milestoneCount: number;
  completedMilestones: number;
  createdAt: string;
}

export interface GoalDetails {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  description: string | null;
  type: "performance" | "development" | "project" | "okr";
  status: "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";
  progressStatus: "on_track" | "at_risk" | "behind" | "ahead" | null;
  progress: number;
  startDate: string | null;
  targetDate: string | null;
  scorecardId: string | null;
  parentGoalId: string | null;
  metrics: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  milestones: GoalMilestone[];
  updates: GoalUpdate[];
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalUpdate {
  id: string;
  goalId: string;
  authorId: string;
  content: string;
  previousProgress: number | null;
  newProgress: number | null;
  progressChange: number | null;
  statusChange: string | null;
  createdAt: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface GoalStats {
  total: number;
  onTrack: number;
  atRisk: number;
  behind: number;
  completed: number;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface GoalListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: "performance" | "development" | "project" | "okr";
  status?: "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";
  userId?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const goalKeys = {
  all: ["goals"] as const,
  lists: () => [...goalKeys.all, "list"] as const,
  list: (tenantId: string, params: GoalListParams) =>
    [...goalKeys.lists(), tenantId, params] as const,
  details: () => [...goalKeys.all, "detail"] as const,
  detail: (tenantId: string, goalId: string) =>
    [...goalKeys.details(), tenantId, goalId] as const,
  stats: (tenantId: string) => [...goalKeys.all, "stats", tenantId] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch goals for a tenant
 */
export function useGoals(tenantId: string | null, params: GoalListParams = {}) {
  const { page = 1, perPage = 10, search, type, status, userId } = params;

  return useQuery({
    queryKey: goalKeys.list(tenantId || "", params),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) searchParams.set("search", search);
      if (type) searchParams.set("type", type);
      if (status) searchParams.set("status", status);
      if (userId) searchParams.set("userId", userId);

      const response = await api.get<Goal[]>(
        `/tenants/${tenantId}/goals?${searchParams}`,
        { tenantId: tenantId || undefined }
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<Goal>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Fetch single goal with milestones and updates
 */
export function useGoal(tenantId: string | null, goalId: string | null) {
  return useQuery({
    queryKey: goalKeys.detail(tenantId || "", goalId || ""),
    queryFn: async () => {
      const response = await api.get<GoalDetails>(
        `/tenants/${tenantId}/goals/${goalId}`,
        { tenantId: tenantId || undefined }
      );
      return response.data;
    },
    enabled: !!tenantId && !!goalId,
  });
}

/**
 * Fetch goal statistics for dashboard
 */
export function useGoalStats(tenantId: string | null) {
  return useQuery({
    queryKey: goalKeys.stats(tenantId || ""),
    queryFn: async () => {
      // Fetch goals to calculate stats (limited to 100 per API validation)
      // In a real app, this would be a dedicated API endpoint
      const response = await api.get<Goal[]>(
        `/tenants/${tenantId}/goals?perPage=100`,
        { tenantId: tenantId || undefined }
      );

      const goals = response.data || [];
      return {
        total: goals.length,
        onTrack: goals.filter((g) => g.progressStatus === "on_track").length,
        atRisk: goals.filter((g) => g.progressStatus === "at_risk").length,
        behind: goals.filter((g) => g.progressStatus === "behind").length,
        completed: goals.filter((g) => g.status === "completed").length,
      } as GoalStats;
    },
    enabled: !!tenantId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new goal
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: {
        title: string;
        description?: string;
        type?: "performance" | "development" | "project" | "okr";
        startDate?: string;
        targetDate?: string;
        scorecardId?: string;
        parentGoalId?: string;
        metrics?: Record<string, unknown>;
      };
    }) => {
      const response = await api.post<GoalDetails>(
        `/tenants/${tenantId}/goals`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(variables.tenantId) });
    },
  });
}

/**
 * Update a goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      goalId,
      data,
    }: {
      tenantId: string;
      goalId: string;
      data: Partial<{
        title: string;
        description: string;
        type: "performance" | "development" | "project" | "okr";
        status: "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";
        progressStatus: "on_track" | "at_risk" | "behind" | "ahead";
        progress: number;
        startDate: string;
        targetDate: string;
      }>;
    }) => {
      const response = await api.patch<GoalDetails>(
        `/tenants/${tenantId}/goals/${goalId}`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(variables.tenantId, variables.goalId),
      });
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(variables.tenantId) });
    },
  });
}

/**
 * Delete a goal
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      goalId,
    }: {
      tenantId: string;
      goalId: string;
    }) => {
      await api.delete(`/tenants/${tenantId}/goals/${goalId}`, { tenantId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(variables.tenantId) });
    },
  });
}

/**
 * Add a milestone to a goal
 */
export function useAddMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      goalId,
      data,
    }: {
      tenantId: string;
      goalId: string;
      data: {
        title: string;
        targetDate?: string;
      };
    }) => {
      const response = await api.post<GoalMilestone>(
        `/tenants/${tenantId}/goals/${goalId}/milestones`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(variables.tenantId, variables.goalId),
      });
    },
  });
}

/**
 * Mark a milestone as complete
 */
export function useCompleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      goalId,
      milestoneId,
    }: {
      tenantId: string;
      goalId: string;
      milestoneId: string;
    }) => {
      const response = await api.patch<GoalMilestone>(
        `/tenants/${tenantId}/goals/${goalId}/milestones/${milestoneId}/complete`,
        {},
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(variables.tenantId, variables.goalId),
      });
    },
  });
}

/**
 * Add a progress update to a goal
 */
export function useAddGoalUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      goalId,
      data,
    }: {
      tenantId: string;
      goalId: string;
      data: {
        content: string;
        progressChange?: number;
        newProgress?: number;
        statusChange?: "on_track" | "at_risk" | "behind" | "ahead";
      };
    }) => {
      const response = await api.post<GoalUpdate>(
        `/tenants/${tenantId}/goals/${goalId}/updates`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(variables.tenantId, variables.goalId),
      });
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats(variables.tenantId) });
    },
  });
}
