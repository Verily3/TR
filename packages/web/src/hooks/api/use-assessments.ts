"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface UserInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AssessmentCompetency {
  id: string;
  name: string;
  description: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  scaleMin: number;
  scaleMax: number;
  scaleLabels: string[];
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string | null;
  type: "180" | "360" | "self" | "custom";
  competencies: AssessmentCompetency[];
  scaleMin: number;
  scaleMax: number;
  scaleLabels: string[];
  allowComments: boolean;
  requireComments: boolean;
  anonymizeResponses: boolean;
  isActive: boolean;
}

export interface Assessment {
  id: string;
  name: string;
  description: string | null;
  type: "180" | "360" | "self" | "custom";
  status: "draft" | "active" | "closed" | "archived";
  startDate: string | null;
  endDate: string | null;
  anonymizeResponses: boolean;
  totalInvitations: number;
  completedResponses: number;
  resultsReleasedAt: string | null;
  subject: UserInfo;
  template: { id: string; name: string } | null;
  createdBy: UserInfo | null;
  createdAt: string;
}

export interface AssessmentInvitation {
  id: string;
  raterEmail: string;
  raterName: string | null;
  raterType: "self" | "manager" | "peer" | "direct_report" | "external";
  status: "pending" | "started" | "completed" | "declined" | "expired";
  token: string;
  rater: UserInfo | null;
  invitedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  reminderSentAt: string | null;
}

export interface AssessmentResult {
  id: string;
  competencyId: string;
  competencyName: string;
  selfScore: string | null;
  managerScore: string | null;
  peerScore: string | null;
  directReportScore: string | null;
  overallScore: string | null;
  selfCount: number;
  managerCount: number;
  peerCount: number;
  directReportCount: number;
  selfVsOthersGap: string | null;
}

export interface GoalSuggestion {
  id: string;
  competencyId: string | null;
  competencyName: string | null;
  suggestedGoal: string;
  reason: string | null;
  suggestedProgramId: string | null;
  status: "pending" | "accepted" | "dismissed";
  acceptedAt: string | null;
  dismissedAt: string | null;
  createdGoalId: string | null;
  createdAt: string;
}

export interface AssessmentDetails extends Assessment {
  template: AssessmentTemplate | null;
  invitations: AssessmentInvitation[];
  results: AssessmentResult[];
  goalSuggestions: GoalSuggestion[];
}

export interface AssessmentStats {
  activeAssessments: number;
  pendingResponses: number;
  completedThisMonth: number;
  avgCompletionRate: number;
}

export interface PendingAssessment {
  invitation: {
    id: string;
    status: string;
    raterType: string;
    token: string;
  };
  assessment: {
    id: string;
    name: string;
    type: string;
    endDate: string | null;
    subject: UserInfo;
  };
}

// Public rater types
export interface RaterAssessmentForm {
  invitation: {
    id: string;
    raterType: string;
    raterName: string | null;
    status: string;
  };
  assessment: {
    name: string;
    description: string | null;
    subjectName: string;
    anonymized: boolean;
    endDate: string | null;
  };
  template: {
    competencies: AssessmentCompetency[];
    scaleMin: number;
    scaleMax: number;
    scaleLabels: string[];
    allowComments: boolean;
    requireComments: boolean;
  };
  existingResponses: Array<{
    competencyId: string;
    questionId: string;
    score: number;
    comment: string | null;
  }>;
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

interface ListParams {
  page?: number;
  perPage?: number;
}

interface AssessmentListParams extends ListParams {
  status?: "draft" | "active" | "closed" | "archived" | "all";
  type?: "180" | "360" | "self" | "custom" | "all";
  subjectId?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const assessmentKeys = {
  all: ["assessments"] as const,

  // Lists
  lists: () => [...assessmentKeys.all, "list"] as const,
  list: (tenantId: string, params?: AssessmentListParams) =>
    [...assessmentKeys.lists(), tenantId, params] as const,

  // Details
  details: () => [...assessmentKeys.all, "detail"] as const,
  detail: (tenantId: string, assessmentId: string) =>
    [...assessmentKeys.details(), tenantId, assessmentId] as const,

  // Results
  results: (tenantId: string, assessmentId: string) =>
    [...assessmentKeys.detail(tenantId, assessmentId), "results"] as const,

  // Suggestions
  suggestions: (tenantId: string, assessmentId: string) =>
    [...assessmentKeys.detail(tenantId, assessmentId), "suggestions"] as const,

  // Invitations
  invitations: (tenantId: string, assessmentId: string) =>
    [...assessmentKeys.detail(tenantId, assessmentId), "invitations"] as const,

  // My assessments
  mine: (tenantId: string) => [...assessmentKeys.all, "mine", tenantId] as const,

  // Pending (where I'm a rater)
  pending: (tenantId: string) => [...assessmentKeys.all, "pending", tenantId] as const,

  // Stats
  stats: (tenantId: string) => [...assessmentKeys.all, "stats", tenantId] as const,

  // Public (no tenant)
  publicForm: (token: string) => ["assessment-public", token] as const,
  publicStatus: (token: string) => ["assessment-public", token, "status"] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * List assessments in tenant
 */
export function useAssessments(
  tenantId: string | null,
  params?: AssessmentListParams
) {
  return useQuery({
    queryKey: assessmentKeys.list(tenantId || "", params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.perPage) searchParams.set("perPage", String(params.perPage));
      if (params?.status) searchParams.set("status", params.status);
      if (params?.type) searchParams.set("type", params.type);
      if (params?.subjectId) searchParams.set("subjectId", params.subjectId);

      const response = await api.get<{ data: Assessment[]; meta: any }>(
        `/tenants/${tenantId}/assessments?${searchParams.toString()}`
      );
      return {
        items: response.data,
        meta: response.meta,
      } as PaginatedResponse<Assessment>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Get single assessment with details
 */
export function useAssessment(
  tenantId: string | null,
  assessmentId: string | null
) {
  return useQuery({
    queryKey: assessmentKeys.detail(tenantId || "", assessmentId || ""),
    queryFn: async () => {
      const response = await api.get<{ data: AssessmentDetails }>(
        `/tenants/${tenantId}/assessments/${assessmentId}`
      );
      return response.data;
    },
    enabled: !!tenantId && !!assessmentId,
  });
}

/**
 * Get assessment results
 */
export function useAssessmentResults(
  tenantId: string | null,
  assessmentId: string | null
) {
  return useQuery({
    queryKey: assessmentKeys.results(tenantId || "", assessmentId || ""),
    queryFn: async () => {
      const response = await api.get<{ data: AssessmentResult[] }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/results`
      );
      return response.data;
    },
    enabled: !!tenantId && !!assessmentId,
  });
}

/**
 * Get assessment goal suggestions
 */
export function useAssessmentSuggestions(
  tenantId: string | null,
  assessmentId: string | null
) {
  return useQuery({
    queryKey: assessmentKeys.suggestions(tenantId || "", assessmentId || ""),
    queryFn: async () => {
      const response = await api.get<{ data: GoalSuggestion[] }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/suggestions`
      );
      return response.data;
    },
    enabled: !!tenantId && !!assessmentId,
  });
}

/**
 * Get invitations for an assessment
 */
export function useAssessmentInvitations(
  tenantId: string | null,
  assessmentId: string | null
) {
  return useQuery({
    queryKey: assessmentKeys.invitations(tenantId || "", assessmentId || ""),
    queryFn: async () => {
      const response = await api.get<{ data: AssessmentInvitation[] }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/invitations`
      );
      return response.data;
    },
    enabled: !!tenantId && !!assessmentId,
  });
}

/**
 * Assessments where current user is the subject
 */
export function useMyAssessments(tenantId: string | null, params?: ListParams) {
  return useQuery({
    queryKey: assessmentKeys.mine(tenantId || ""),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.perPage) searchParams.set("perPage", String(params.perPage));

      const response = await api.get<{ data: Assessment[]; meta: any }>(
        `/tenants/${tenantId}/assessments/mine?${searchParams.toString()}`
      );
      return {
        items: response.data,
        meta: response.meta,
      } as PaginatedResponse<Assessment>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Assessments where current user needs to respond as rater
 */
export function usePendingAssessments(tenantId: string | null, params?: ListParams) {
  return useQuery({
    queryKey: assessmentKeys.pending(tenantId || ""),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.perPage) searchParams.set("perPage", String(params.perPage));

      const response = await api.get<{ data: PendingAssessment[]; meta: any }>(
        `/tenants/${tenantId}/assessments/pending?${searchParams.toString()}`
      );
      return {
        items: response.data,
        meta: response.meta,
      } as PaginatedResponse<PendingAssessment>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Assessment stats for dashboard
 */
export function useAssessmentStats(tenantId: string | null) {
  return useQuery({
    queryKey: assessmentKeys.stats(tenantId || ""),
    queryFn: async () => {
      const response = await api.get<{ data: AssessmentStats }>(
        `/tenants/${tenantId}/assessments/stats`
      );
      return response.data;
    },
    enabled: !!tenantId,
  });
}

/**
 * Public rater form (no auth required)
 */
export function usePublicAssessmentForm(token: string | null) {
  return useQuery({
    queryKey: assessmentKeys.publicForm(token || ""),
    queryFn: async () => {
      const response = await api.get<{ data: RaterAssessmentForm }>(
        `/assessments/respond/${token}`,
        { noAuth: true }
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export interface CreateAssessmentData {
  templateId?: string;
  subjectId: string;
  name: string;
  description?: string;
  type: "180" | "360" | "self" | "custom";
  startDate?: string;
  endDate?: string;
  anonymizeResponses?: boolean;
}

export interface UpdateAssessmentData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: "draft" | "active" | "closed" | "archived";
  anonymizeResponses?: boolean;
}

export interface AddInvitationsData {
  raters: Array<{
    raterId?: string;
    raterEmail: string;
    raterName?: string;
    raterType: "self" | "manager" | "peer" | "direct_report" | "external";
  }>;
}

export interface SubmitResponsesData {
  responses: Array<{
    competencyId: string;
    questionId: string;
    score: number;
    comment?: string;
  }>;
}

/**
 * Create assessment
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateAssessmentData;
    }) => {
      const response = await api.post<{ data: Assessment }>(
        `/tenants/${tenantId}/assessments`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.stats(variables.tenantId),
      });
    },
  });
}

/**
 * Update assessment
 */
export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
      data,
    }: {
      tenantId: string;
      assessmentId: string;
      data: UpdateAssessmentData;
    }) => {
      const response = await api.patch<{ data: Assessment }>(
        `/tenants/${tenantId}/assessments/${assessmentId}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.lists(),
      });
    },
  });
}

/**
 * Launch assessment
 */
export function useLaunchAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
    }: {
      tenantId: string;
      assessmentId: string;
    }) => {
      const response = await api.post<{ data: Assessment }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/launch`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.stats(variables.tenantId),
      });
    },
  });
}

/**
 * Close assessment
 */
export function useCloseAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
    }: {
      tenantId: string;
      assessmentId: string;
    }) => {
      const response = await api.post<{ data: Assessment }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/close`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.stats(variables.tenantId),
      });
    },
  });
}

/**
 * Release assessment results to subject
 */
export function useReleaseResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
    }: {
      tenantId: string;
      assessmentId: string;
    }) => {
      const response = await api.post<{ data: Assessment }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/release`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
    },
  });
}

/**
 * Add invitations to assessment
 */
export function useAddInvitations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
      data,
    }: {
      tenantId: string;
      assessmentId: string;
      data: AddInvitationsData;
    }) => {
      const response = await api.post<{ data: AssessmentInvitation[] }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/invitations`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.invitations(variables.tenantId, variables.assessmentId),
      });
    },
  });
}

/**
 * Remove invitation
 */
export function useRemoveInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
      inviteId,
    }: {
      tenantId: string;
      assessmentId: string;
      inviteId: string;
    }) => {
      await api.delete(
        `/tenants/${tenantId}/assessments/${assessmentId}/invitations/${inviteId}`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.invitations(variables.tenantId, variables.assessmentId),
      });
    },
  });
}

/**
 * Send reminder to rater
 */
export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
      inviteId,
    }: {
      tenantId: string;
      assessmentId: string;
      inviteId: string;
    }) => {
      const response = await api.post<{ data: AssessmentInvitation }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/invitations/${inviteId}/remind`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.invitations(variables.tenantId, variables.assessmentId),
      });
    },
  });
}

/**
 * Accept goal suggestion
 */
export function useAcceptSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
      suggestionId,
    }: {
      tenantId: string;
      assessmentId: string;
      suggestionId: string;
    }) => {
      const response = await api.post<{ data: { suggestion: GoalSuggestion; goal: any } }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/suggestions/${suggestionId}/accept`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.suggestions(variables.tenantId, variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
      // Also invalidate goals
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

/**
 * Dismiss goal suggestion
 */
export function useDismissSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
      suggestionId,
    }: {
      tenantId: string;
      assessmentId: string;
      suggestionId: string;
    }) => {
      const response = await api.post<{ data: GoalSuggestion }>(
        `/tenants/${tenantId}/assessments/${assessmentId}/suggestions/${suggestionId}/dismiss`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.suggestions(variables.tenantId, variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.detail(variables.tenantId, variables.assessmentId),
      });
    },
  });
}

/**
 * Delete/archive assessment
 */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      assessmentId,
    }: {
      tenantId: string;
      assessmentId: string;
    }) => {
      await api.delete(`/tenants/${tenantId}/assessments/${assessmentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.stats(variables.tenantId),
      });
    },
  });
}

// ============================================================================
// PUBLIC MUTATIONS (no auth)
// ============================================================================

/**
 * Submit responses as public rater
 */
export function useSubmitResponses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: SubmitResponsesData;
    }) => {
      const response = await api.post<{ data: { status: string; message: string } }>(
        `/assessments/respond/${token}`,
        data,
        { noAuth: true }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.publicForm(variables.token),
      });
    },
  });
}

/**
 * Decline invitation as public rater
 */
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      reason,
    }: {
      token: string;
      reason?: string;
    }) => {
      const response = await api.post<{ data: { status: string; message: string } }>(
        `/assessments/respond/${token}/decline`,
        { reason },
        { noAuth: true }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentKeys.publicForm(variables.token),
      });
    },
  });
}
