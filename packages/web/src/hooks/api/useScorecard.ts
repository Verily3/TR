import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScorecardItemStatus = 'on_track' | 'at_risk' | 'needs_attention';
export type MetricTrend = 'up' | 'down' | 'neutral';

export interface ScorecardItem {
  id: string;
  tenantId: string;
  userId: string;
  ordinal: number;
  title: string;
  description: string | null;
  score: number;
  status: ScorecardItemStatus;
  period: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardMetric {
  id: string;
  tenantId: string;
  userId: string;
  scorecardItemId: string | null;
  category: string;
  ordinal: number;
  name: string;
  targetValue: string;
  actualValue: string;
  actualNumeric: number | null;
  targetNumeric: number | null;
  changeLabel: string | null;
  trend: MetricTrend;
  invertTrend: number;
  period: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricCategory {
  category: string;
  metrics: ScorecardMetric[];
}

export interface ScorecardCompetency {
  id: string;
  tenantId: string;
  userId: string;
  reviewerId: string | null;
  ordinal: number;
  name: string;
  description: string | null;
  selfRating: number;
  managerRating: number;
  period: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardData {
  userId: string;
  period: string;
  overallScore: number;
  items: ScorecardItem[];
  metricCategories: MetricCategory[];
  competencies: ScorecardCompetency[];
}

export interface CreateItemData {
  title: string;
  description?: string;
  score?: number;
  status?: ScorecardItemStatus;
  period?: string;
  ordinal?: number;
}

export interface CreateMetricData {
  category: string;
  name: string;
  targetValue?: string;
  actualValue?: string;
  targetNumeric?: number;
  actualNumeric?: number;
  changeLabel?: string;
  trend?: MetricTrend;
  invertTrend?: boolean;
  period?: string;
  ordinal?: number;
  scorecardItemId?: string;
}

export interface CreateCompetencyData {
  name: string;
  description?: string;
  selfRating?: number;
  managerRating?: number;
  period?: string;
  ordinal?: number;
  reviewerId?: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useScorecard(tenantId: string | null, period?: string, userId?: string) {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  if (userId) params.set('userId', userId);

  return useQuery<ScorecardData>({
    queryKey: ['scorecard', tenantId, period, userId],
    queryFn: async () => {
      const r = await api.get<ScorecardData>(
        `/api/tenants/${tenantId}/scorecard?${params.toString()}`
      );
      return r.data;
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  });
}

export interface OrgHealthCategory {
  id: string;
  name: string;
  score: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export function useOrgHealth(tenantId: string | null, period?: string) {
  const qs = period ? `?period=${encodeURIComponent(period)}` : '';
  return useQuery<OrgHealthCategory[]>({
    queryKey: ['scorecard', 'org-health', tenantId, period],
    queryFn: async () => {
      const r = await api.get<OrgHealthCategory[]>(
        `/api/tenants/${tenantId}/scorecard/org-health${qs}`
      );
      return r.data;
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useScorecardPeriods(tenantId: string | null) {
  return useQuery<string[]>({
    queryKey: ['scorecard', 'periods', tenantId],
    queryFn: async () => {
      const r = await api.get<string[]>(`/api/tenants/${tenantId}/scorecard/periods`);
      return r.data;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Item mutations ────────────────────────────────────────────────────────────

export function useCreateScorecardItem(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      const r = await api.post<ScorecardItem>(`/api/tenants/${tenantId}/scorecard/items`, data);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecard', tenantId] });
    },
  });
}

export function useUpdateScorecardItem(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<CreateItemData> }) => {
      const r = await api.put<ScorecardItem>(
        `/api/tenants/${tenantId}/scorecard/items/${itemId}`,
        data
      );
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecard', tenantId] });
    },
  });
}

export function useDeleteScorecardItem(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete<{ success: boolean }>(`/api/tenants/${tenantId}/scorecard/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecard', tenantId] });
    },
  });
}

// ─── Metric mutations ──────────────────────────────────────────────────────────

export function useUpdateScorecardMetric(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      metricId,
      data,
    }: {
      metricId: string;
      data: Partial<CreateMetricData>;
    }) => {
      const r = await api.put<ScorecardMetric>(
        `/api/tenants/${tenantId}/scorecard/metrics/${metricId}`,
        data
      );
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecard', tenantId] });
    },
  });
}

// ─── Competency mutations ──────────────────────────────────────────────────────

export function useUpdateScorecardCompetency(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      competencyId,
      data,
    }: {
      competencyId: string;
      data: Partial<CreateCompetencyData>;
    }) => {
      const r = await api.put<ScorecardCompetency>(
        `/api/tenants/${tenantId}/scorecard/competencies/${competencyId}`,
        data
      );
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecard', tenantId] });
    },
  });
}
