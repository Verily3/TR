"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateQuestion {
  id: string;
  text: string;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
}

export interface TemplateCompetency {
  id: string;
  name: string;
  description?: string;
  questions: TemplateQuestion[];
}

export interface GoalSuggestionRule {
  competencyId: string;
  threshold: number;
  operator: "less_than" | "less_than_equal" | "equals" | "greater_than";
  suggestedGoal: string;
  suggestedProgram?: string;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string | null;
  type: "180" | "360" | "self" | "custom";
  competencyCount: number;
  questionCount: number;
  scaleMin: number;
  scaleMax: number;
  isActive: boolean;
  usageCount: number;
  completionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentTemplateDetails {
  id: string;
  name: string;
  description: string | null;
  type: "180" | "360" | "self" | "custom";
  competencies: TemplateCompetency[];
  scaleMin: number;
  scaleMax: number;
  scaleLabels: string[];
  goalSuggestionRules: GoalSuggestionRule[];
  allowComments: boolean;
  requireComments: boolean;
  anonymizeResponses: boolean;
  isActive: boolean;
  usageCount: number;
  completionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStats {
  totalAssessments: number;
  byStatus: {
    draft: number;
    active: number;
    closed: number;
    archived: number;
  };
  tenantCount: number;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  type?: "180" | "360" | "self" | "custom";
  competencies?: TemplateCompetency[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
  goalSuggestionRules?: GoalSuggestionRule[];
  allowComments?: boolean;
  requireComments?: boolean;
  anonymizeResponses?: boolean;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  isActive?: boolean;
}

export interface TemplateQueryParams {
  page?: number;
  perPage?: number;
  type?: "180" | "360" | "self" | "custom" | "all";
  isActive?: "true" | "false" | "all";
  search?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (agencyId: string, params?: TemplateQueryParams) =>
    [...templateKeys.lists(), agencyId, params] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (agencyId: string, templateId: string) =>
    [...templateKeys.details(), agencyId, templateId] as const,
  stats: (agencyId: string, templateId: string) =>
    [...templateKeys.all, "stats", agencyId, templateId] as const,
};

// ============================================================================
// LIST TEMPLATES
// ============================================================================

export function useTemplates(
  agencyId: string | undefined,
  params?: TemplateQueryParams
) {
  return useQuery({
    queryKey: templateKeys.list(agencyId || "", params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.perPage) searchParams.set("perPage", params.perPage.toString());
      if (params?.type) searchParams.set("type", params.type);
      if (params?.isActive) searchParams.set("isActive", params.isActive);
      if (params?.search) searchParams.set("search", params.search);

      const url = `/agencies/${agencyId}/templates${searchParams.toString() ? `?${searchParams}` : ""}`;
      const response = await api.get<PaginatedResponse<AssessmentTemplate>>(url);
      return response;
    },
    enabled: !!agencyId,
  });
}

// ============================================================================
// GET TEMPLATE DETAIL
// ============================================================================

export function useTemplate(
  agencyId: string | undefined,
  templateId: string | undefined
) {
  return useQuery({
    queryKey: templateKeys.detail(agencyId || "", templateId || ""),
    queryFn: async () => {
      const response = await api.get<{ data: AssessmentTemplateDetails }>(
        `/agencies/${agencyId}/templates/${templateId}`
      );
      return response.data;
    },
    enabled: !!agencyId && !!templateId,
  });
}

// ============================================================================
// GET TEMPLATE STATS
// ============================================================================

export function useTemplateStats(
  agencyId: string | undefined,
  templateId: string | undefined
) {
  return useQuery({
    queryKey: templateKeys.stats(agencyId || "", templateId || ""),
    queryFn: async () => {
      const response = await api.get<{ data: TemplateStats }>(
        `/agencies/${agencyId}/templates/${templateId}/stats`
      );
      return response.data;
    },
    enabled: !!agencyId && !!templateId,
  });
}

// ============================================================================
// CREATE TEMPLATE
// ============================================================================

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      data,
    }: {
      agencyId: string;
      data: CreateTemplateData;
    }) => {
      const response = await api.post<{ data: AssessmentTemplate }>(
        `/agencies/${agencyId}/templates`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
    },
  });
}

// ============================================================================
// UPDATE TEMPLATE
// ============================================================================

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      templateId,
      data,
    }: {
      agencyId: string;
      templateId: string;
      data: UpdateTemplateData;
    }) => {
      const response = await api.patch<{ data: AssessmentTemplateDetails }>(
        `/agencies/${agencyId}/templates/${templateId}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: templateKeys.detail(variables.agencyId, variables.templateId),
      });
    },
  });
}

// ============================================================================
// DELETE (ARCHIVE) TEMPLATE
// ============================================================================

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      templateId,
    }: {
      agencyId: string;
      templateId: string;
    }) => {
      await api.delete(`/agencies/${agencyId}/templates/${templateId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
    },
  });
}

// ============================================================================
// DUPLICATE TEMPLATE
// ============================================================================

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      templateId,
    }: {
      agencyId: string;
      templateId: string;
    }) => {
      const response = await api.post<{ data: AssessmentTemplate }>(
        `/agencies/${agencyId}/templates/${templateId}/duplicate`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
    },
  });
}
