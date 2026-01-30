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
  avatarUrl: string | null;
}

export interface CoachingRelationship {
  id: string;
  relationshipType: "mentor" | "coach" | "manager";
  isActive: boolean;
  defaultDurationMinutes: number;
  preferredDay: string | null;
  preferredTime: string | null;
  meetingFrequency: "weekly" | "biweekly" | "monthly" | null;
  coach: UserInfo;
  coachee: UserInfo;
  isCoach: boolean;
  createdAt: string;
}

export interface CoachingSession {
  id: string;
  title: string | null;
  type: "coaching" | "one_on_one" | "check_in" | "review" | "planning";
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "prep_in_progress" | "ready" | "completed" | "cancelled" | "no_show";
  prepStatus: "not_started" | "in_progress" | "ready";
  meetingUrl: string | null;
  meetingProvider: "zoom" | "teams" | "meet" | "other" | null;
  coach: UserInfo;
  coachee: UserInfo;
  isCoach: boolean;
  createdAt: string;
}

export interface SessionPrep {
  id: string;
  sessionId: string;
  userId: string;
  progressSummary: string | null;
  wins: string[];
  challenges: string[];
  topicsToDiscuss: string[];
  reflections: Array<{ question: string; answer: string }>;
  goalsOnTrack: number;
  goalsAtRisk: number;
  isComplete: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionNote {
  id: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  session: {
    id: string;
    title: string | null;
    scheduledAt: string;
  } | null;
}

export interface SessionDetails extends CoachingSession {
  relationshipId: string | null;
  timezone: string | null;
  completedAt: string | null;
  prep: SessionPrep[];
  notes: SessionNote[];
  actionItems: ActionItem[];
}

export interface CoachingStats {
  upcomingSessions: number;
  activeRelationships: number;
  pendingActionItems: number;
  completedThisMonth: number;
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

interface SessionListParams extends ListParams {
  status?: "upcoming" | "past" | "all";
  coachId?: string;
  coacheeId?: string;
}

interface ActionItemListParams extends ListParams {
  status?: "pending" | "in_progress" | "completed" | "blocked" | "cancelled" | "all";
  ownerId?: string;
  sessionId?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const coachingKeys = {
  all: ["coaching"] as const,

  // Relationships
  relationships: () => [...coachingKeys.all, "relationships"] as const,
  relationshipList: (tenantId: string, params: ListParams) =>
    [...coachingKeys.relationships(), tenantId, params] as const,
  relationshipDetail: (tenantId: string, relationshipId: string) =>
    [...coachingKeys.relationships(), tenantId, relationshipId] as const,

  // Sessions
  sessions: () => [...coachingKeys.all, "sessions"] as const,
  sessionList: (tenantId: string, params: SessionListParams) =>
    [...coachingKeys.sessions(), tenantId, params] as const,
  sessionDetail: (tenantId: string, sessionId: string) =>
    [...coachingKeys.sessions(), tenantId, sessionId] as const,

  // Session prep
  sessionPrep: (tenantId: string, sessionId: string) =>
    [...coachingKeys.sessionDetail(tenantId, sessionId), "prep"] as const,

  // Session notes
  sessionNotes: (tenantId: string, sessionId: string) =>
    [...coachingKeys.sessionDetail(tenantId, sessionId), "notes"] as const,

  // Action items
  actionItems: () => [...coachingKeys.all, "action-items"] as const,
  actionItemList: (tenantId: string, params: ActionItemListParams) =>
    [...coachingKeys.actionItems(), tenantId, params] as const,

  // Stats
  stats: (tenantId: string) => [...coachingKeys.all, "stats", tenantId] as const,
};

// ============================================================================
// RELATIONSHIP QUERIES
// ============================================================================

/**
 * Fetch coaching relationships for current user
 */
export function useCoachingRelationships(
  tenantId: string | null,
  params: ListParams = {}
) {
  const { page = 1, perPage = 20 } = params;

  return useQuery({
    queryKey: coachingKeys.relationshipList(tenantId || "", { page, perPage }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });

      const response = await api.get<CoachingRelationship[]>(
        `/tenants/${tenantId}/coaching/relationships?${searchParams}`,
        { tenantId: tenantId || undefined }
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<CoachingRelationship>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Fetch single coaching relationship
 */
export function useCoachingRelationship(
  tenantId: string | null,
  relationshipId: string | null
) {
  return useQuery({
    queryKey: coachingKeys.relationshipDetail(tenantId || "", relationshipId || ""),
    queryFn: async () => {
      const response = await api.get<CoachingRelationship>(
        `/tenants/${tenantId}/coaching/relationships/${relationshipId}`,
        { tenantId: tenantId || undefined }
      );
      return response.data;
    },
    enabled: !!tenantId && !!relationshipId,
  });
}

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Fetch coaching sessions for current user
 */
export function useCoachingSessions(
  tenantId: string | null,
  params: SessionListParams = {}
) {
  const { page = 1, perPage = 20, status = "all", coachId, coacheeId } = params;

  return useQuery({
    queryKey: coachingKeys.sessionList(tenantId || "", {
      page,
      perPage,
      status,
      coachId,
      coacheeId,
    }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        status,
      });
      if (coachId) searchParams.set("coachId", coachId);
      if (coacheeId) searchParams.set("coacheeId", coacheeId);

      const response = await api.get<CoachingSession[]>(
        `/tenants/${tenantId}/coaching/sessions?${searchParams}`,
        { tenantId: tenantId || undefined }
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<CoachingSession>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Fetch single session with prep, notes, and action items
 */
export function useCoachingSession(
  tenantId: string | null,
  sessionId: string | null
) {
  return useQuery({
    queryKey: coachingKeys.sessionDetail(tenantId || "", sessionId || ""),
    queryFn: async () => {
      const response = await api.get<SessionDetails>(
        `/tenants/${tenantId}/coaching/sessions/${sessionId}`,
        { tenantId: tenantId || undefined }
      );
      return response.data;
    },
    enabled: !!tenantId && !!sessionId,
  });
}

/**
 * Fetch session prep for current user
 */
export function useSessionPrep(tenantId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: coachingKeys.sessionPrep(tenantId || "", sessionId || ""),
    queryFn: async () => {
      const response = await api.get<SessionPrep | null>(
        `/tenants/${tenantId}/coaching/sessions/${sessionId}/prep`,
        { tenantId: tenantId || undefined }
      );
      return response.data;
    },
    enabled: !!tenantId && !!sessionId,
  });
}

/**
 * Fetch session notes
 */
export function useSessionNotes(tenantId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: coachingKeys.sessionNotes(tenantId || "", sessionId || ""),
    queryFn: async () => {
      const response = await api.get<SessionNote[]>(
        `/tenants/${tenantId}/coaching/sessions/${sessionId}/notes`,
        { tenantId: tenantId || undefined }
      );
      return response.data || [];
    },
    enabled: !!tenantId && !!sessionId,
  });
}

// ============================================================================
// ACTION ITEM QUERIES
// ============================================================================

/**
 * Fetch action items
 */
export function useActionItems(
  tenantId: string | null,
  params: ActionItemListParams = {}
) {
  const { page = 1, perPage = 20, status = "all", ownerId, sessionId } = params;

  return useQuery({
    queryKey: coachingKeys.actionItemList(tenantId || "", {
      page,
      perPage,
      status,
      ownerId,
      sessionId,
    }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        status,
      });
      if (ownerId) searchParams.set("ownerId", ownerId);
      if (sessionId) searchParams.set("sessionId", sessionId);

      const response = await api.get<ActionItem[]>(
        `/tenants/${tenantId}/coaching/action-items?${searchParams}`,
        { tenantId: tenantId || undefined }
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<ActionItem>;
    },
    enabled: !!tenantId,
  });
}

// ============================================================================
// STATS QUERY
// ============================================================================

/**
 * Fetch coaching stats for dashboard
 */
export function useCoachingStats(tenantId: string | null) {
  return useQuery({
    queryKey: coachingKeys.stats(tenantId || ""),
    queryFn: async () => {
      const response = await api.get<CoachingStats>(
        `/tenants/${tenantId}/coaching/stats`,
        { tenantId: tenantId || undefined }
      );
      return response.data;
    },
    enabled: !!tenantId,
  });
}

// ============================================================================
// RELATIONSHIP MUTATIONS
// ============================================================================

export interface CreateRelationshipData {
  coachId: string;
  coacheeId: string;
  relationshipType?: "mentor" | "coach" | "manager";
  defaultDurationMinutes?: number;
  preferredDay?: string;
  preferredTime?: string;
  meetingFrequency?: "weekly" | "biweekly" | "monthly";
}

/**
 * Create a coaching relationship
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateRelationshipData;
    }) => {
      const response = await api.post<CoachingRelationship>(
        `/tenants/${tenantId}/coaching/relationships`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.relationships() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.stats("") });
    },
  });
}

/**
 * Update a coaching relationship
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      relationshipId,
      data,
    }: {
      tenantId: string;
      relationshipId: string;
      data: Partial<{
        isActive: boolean;
        defaultDurationMinutes: number;
        preferredDay: string;
        preferredTime: string;
        meetingFrequency: "weekly" | "biweekly" | "monthly";
      }>;
    }) => {
      const response = await api.patch<CoachingRelationship>(
        `/tenants/${tenantId}/coaching/relationships/${relationshipId}`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: coachingKeys.relationshipDetail(
          variables.tenantId,
          variables.relationshipId
        ),
      });
      queryClient.invalidateQueries({ queryKey: coachingKeys.relationships() });
    },
  });
}

/**
 * Deactivate a coaching relationship
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      relationshipId,
    }: {
      tenantId: string;
      relationshipId: string;
    }) => {
      await api.delete(
        `/tenants/${tenantId}/coaching/relationships/${relationshipId}`,
        { tenantId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.relationships() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.stats("") });
    },
  });
}

// ============================================================================
// SESSION MUTATIONS
// ============================================================================

export interface CreateSessionData {
  relationshipId?: string;
  coachId: string;
  coacheeId: string;
  title?: string;
  type?: "coaching" | "one_on_one" | "check_in" | "review" | "planning";
  scheduledAt: string;
  durationMinutes?: number;
  timezone?: string;
  meetingUrl?: string;
  meetingProvider?: "zoom" | "teams" | "meet" | "other";
}

/**
 * Schedule a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateSessionData;
    }) => {
      const response = await api.post<CoachingSession>(
        `/tenants/${tenantId}/coaching/sessions`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.stats("") });
    },
  });
}

/**
 * Update a session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      sessionId,
      data,
    }: {
      tenantId: string;
      sessionId: string;
      data: Partial<{
        title: string;
        type: "coaching" | "one_on_one" | "check_in" | "review" | "planning";
        scheduledAt: string;
        durationMinutes: number;
        status: "scheduled" | "prep_in_progress" | "ready" | "completed" | "cancelled" | "no_show";
        meetingUrl: string;
        meetingProvider: "zoom" | "teams" | "meet" | "other";
      }>;
    }) => {
      const response = await api.patch<CoachingSession>(
        `/tenants/${tenantId}/coaching/sessions/${sessionId}`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: coachingKeys.sessionDetail(variables.tenantId, variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.stats("") });
    },
  });
}

/**
 * Cancel a session
 */
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      sessionId,
    }: {
      tenantId: string;
      sessionId: string;
    }) => {
      await api.delete(`/tenants/${tenantId}/coaching/sessions/${sessionId}`, {
        tenantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.stats("") });
    },
  });
}

// ============================================================================
// SESSION PREP MUTATIONS
// ============================================================================

export interface UpdatePrepData {
  progressSummary?: string;
  wins?: string[];
  challenges?: string[];
  topicsToDiscuss?: string[];
  reflections?: Array<{ question: string; answer: string }>;
  goalsOnTrack?: number;
  goalsAtRisk?: number;
  isComplete?: boolean;
}

/**
 * Create or update session prep
 */
export function useUpdateSessionPrep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      sessionId,
      data,
    }: {
      tenantId: string;
      sessionId: string;
      data: UpdatePrepData;
    }) => {
      const response = await api.post<SessionPrep>(
        `/tenants/${tenantId}/coaching/sessions/${sessionId}/prep`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: coachingKeys.sessionPrep(variables.tenantId, variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: coachingKeys.sessionDetail(variables.tenantId, variables.sessionId),
      });
    },
  });
}

// ============================================================================
// SESSION NOTES MUTATIONS
// ============================================================================

/**
 * Add a note to a session
 */
export function useAddSessionNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      sessionId,
      data,
    }: {
      tenantId: string;
      sessionId: string;
      data: {
        content: string;
        isPrivate?: boolean;
      };
    }) => {
      const response = await api.post<SessionNote>(
        `/tenants/${tenantId}/coaching/sessions/${sessionId}/notes`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: coachingKeys.sessionNotes(variables.tenantId, variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: coachingKeys.sessionDetail(variables.tenantId, variables.sessionId),
      });
    },
  });
}

// ============================================================================
// ACTION ITEM MUTATIONS
// ============================================================================

export interface CreateActionItemData {
  sessionId?: string;
  ownerId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  goalId?: string;
}

/**
 * Create an action item
 */
export function useCreateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateActionItemData;
    }) => {
      const response = await api.post<ActionItem>(
        `/tenants/${tenantId}/coaching/action-items`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.actionItems() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.stats("") });
      if (variables.data.sessionId) {
        queryClient.invalidateQueries({
          queryKey: coachingKeys.sessionDetail(variables.tenantId, variables.data.sessionId),
        });
      }
    },
  });
}

/**
 * Update an action item
 */
export function useUpdateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      actionItemId,
      data,
    }: {
      tenantId: string;
      actionItemId: string;
      data: Partial<{
        title: string;
        description: string;
        dueDate: string;
        status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
        priority: "low" | "medium" | "high";
      }>;
    }) => {
      const response = await api.patch<ActionItem>(
        `/tenants/${tenantId}/coaching/action-items/${actionItemId}`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.actionItems() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.stats("") });
    },
  });
}

/**
 * Delete an action item
 */
export function useDeleteActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      actionItemId,
    }: {
      tenantId: string;
      actionItemId: string;
    }) => {
      await api.delete(
        `/tenants/${tenantId}/coaching/action-items/${actionItemId}`,
        { tenantId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.actionItems() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
    },
  });
}
