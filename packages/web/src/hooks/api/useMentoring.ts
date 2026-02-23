import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============ Types ============

export interface MentoringPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string | null;
  avatar?: string | null;
}

export interface MentoringRelationship {
  id: string;
  tenantId: string;
  mentorId: string;
  menteeId: string;
  mentor: MentoringPerson;
  mentee: MentoringPerson;
  type: 'mentor' | 'coach' | 'manager';
  status: 'active' | 'paused' | 'ended';
  meetingFrequency?: string | null;
  notes?: string | null;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPrep {
  id: string;
  sessionId: string;
  userId: string;
  wins: string | null;
  challenges: string | null;
  topicsToDiscuss: string[];
  questionsForMentor: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPrepInput {
  wins?: string;
  challenges?: string;
  topicsToDiscuss?: string[];
  questionsForMentor?: string;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  authorId: string;
  authorName?: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  sessionId?: string | null;
  relationshipId?: string | null;
  tenantId: string;
  title: string;
  description?: string | null;
  ownerId: string;
  ownerName?: string;
  dueDate?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentoringSession {
  id: string;
  relationshipId: string;
  tenantId: string;
  mentor: MentoringPerson;
  mentee: MentoringPerson;
  type: 'mentoring' | 'one_on_one' | 'check_in' | 'review' | 'planning';
  status: 'scheduled' | 'prep_in_progress' | 'ready' | 'completed' | 'cancelled' | 'no_show';
  scheduledAt: string;
  duration: number;
  location?: string | null;
  videoLink?: string | null;
  agenda?: string | null;
  prep?: SessionPrep | null;
  notes: SessionNote[];
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MentoringStats {
  totalRelationships: number;
  activeRelationships: number;
  upcomingSessions: number;
  completedSessions: number;
  pendingActionItems: number;
  overdueActionItems: number;
  totalMentors?: number;
  totalMentees?: number;
}

export interface CreateSessionInput {
  relationshipId: string;
  type: 'mentoring' | 'one_on_one' | 'check_in' | 'review' | 'planning';
  scheduledAt: string;
  duration: number;
  location?: string;
  videoLink?: string;
  agenda?: string;
}

export interface UpdateSessionInput {
  type?: string;
  scheduledAt?: string;
  duration?: number;
  location?: string | null;
  videoLink?: string | null;
  agenda?: string | null;
  status?: string;
}

export interface CreateActionItemInput {
  sessionId?: string;
  relationshipId?: string;
  title: string;
  description?: string;
  ownerId: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateActionItemInput {
  title?: string;
  description?: string | null;
  ownerId?: string;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
}

// ============ Hooks ============

export function useMentoringRelationships(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['mentoringRelationships', tenantId],
    queryFn: async () => {
      const response = (await api.get<MentoringRelationship[]>(
        `/api/tenants/${tenantId}/mentoring/relationships`
      )) as unknown as { data: MentoringRelationship[] };
      return response.data || [];
    },
    enabled: !!tenantId,
  });
}

export function useMentoringSessions(tenantId: string | undefined, relationshipId?: string) {
  return useQuery({
    queryKey: ['mentoringSessions', tenantId, relationshipId],
    queryFn: async () => {
      const url = relationshipId
        ? `/api/tenants/${tenantId}/mentoring/sessions?relationshipId=${relationshipId}`
        : `/api/tenants/${tenantId}/mentoring/sessions`;
      const response = (await api.get<MentoringSession[]>(url)) as unknown as {
        data: MentoringSession[];
      };
      return response.data || [];
    },
    enabled: !!tenantId,
  });
}

export function useMentoringActionItems(tenantId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ['mentoringActionItems', tenantId, status],
    queryFn: async () => {
      const url = status
        ? `/api/tenants/${tenantId}/mentoring/action-items?status=${status}`
        : `/api/tenants/${tenantId}/mentoring/action-items`;
      const response = (await api.get<ActionItem[]>(url)) as unknown as {
        data: ActionItem[];
      };
      return response.data || [];
    },
    enabled: !!tenantId,
  });
}

export function useMentoringStats(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['mentoringStats', tenantId],
    queryFn: async () => {
      const response = (await api.get<MentoringStats>(
        `/api/tenants/${tenantId}/mentoring/stats`
      )) as unknown as { data: MentoringStats };
      return response.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateMentoringSession(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const response = (await api.post<MentoringSession>(
        `/api/tenants/${tenantId}/mentoring/sessions`,
        input
      )) as unknown as { data: MentoringSession };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoringSessions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['mentoringStats', tenantId] });
    },
  });
}

export function useUpdateMentoringSession(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, input }: { sessionId: string; input: UpdateSessionInput }) => {
      const response = (await api.put<MentoringSession>(
        `/api/tenants/${tenantId}/mentoring/sessions/${sessionId}`,
        input
      )) as unknown as { data: MentoringSession };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoringSessions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['mentoringStats', tenantId] });
    },
  });
}

export function useCreateActionItem(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActionItemInput) => {
      const response = (await api.post<ActionItem>(
        `/api/tenants/${tenantId}/mentoring/action-items`,
        input
      )) as unknown as { data: ActionItem };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoringActionItems', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['mentoringStats', tenantId] });
    },
  });
}

export function useUpdateActionItem(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, input }: { itemId: string; input: UpdateActionItemInput }) => {
      const response = (await api.put<ActionItem>(
        `/api/tenants/${tenantId}/mentoring/action-items/${itemId}`,
        input
      )) as unknown as { data: ActionItem };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoringActionItems', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['mentoringStats', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['mentoringSessions', tenantId] });
    },
  });
}

// ─── Session Prep ────────────────────────────────────────────────────────────

export function useSessionPrep(tenantId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: ['sessionPrep', tenantId, sessionId],
    queryFn: async () => {
      const response = (await api.get<SessionPrep | null>(
        `/api/tenants/${tenantId}/mentoring/sessions/${sessionId}/prep`
      )) as unknown as { data: SessionPrep | null };
      return response.data;
    },
    enabled: !!tenantId && !!sessionId,
  });
}

export function useSubmitSessionPrep(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, input }: { sessionId: string; input: SessionPrepInput }) => {
      const response = (await api.post<SessionPrep>(
        `/api/tenants/${tenantId}/mentoring/sessions/${sessionId}/prep`,
        input
      )) as unknown as { data: SessionPrep };
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionPrep', tenantId, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['mentoringSessions', tenantId] });
    },
  });
}

export function useUpdateSessionPrep(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      input,
    }: {
      sessionId: string;
      input: Partial<SessionPrepInput>;
    }) => {
      const response = (await api.put<SessionPrep>(
        `/api/tenants/${tenantId}/mentoring/sessions/${sessionId}/prep`,
        input
      )) as unknown as { data: SessionPrep };
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionPrep', tenantId, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['mentoringSessions', tenantId] });
    },
  });
}
