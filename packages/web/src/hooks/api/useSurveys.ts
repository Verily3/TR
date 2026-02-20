import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Survey,
  SurveyWithQuestions,
  SurveyResults,
  SurveyResponse,
  CreateSurveyInput,
  UpdateSurveyInput,
  CreateSurveyQuestionInput,
  UpdateSurveyQuestionInput,
} from '@/types/surveys';

// ── List ───────────────────────────────────────────────────────────────────────

export function useSurveys(tenantId: string | null, status?: string) {
  return useQuery<Survey[]>({
    queryKey: ['surveys', tenantId, status],
    queryFn: async () => {
      if (!tenantId) return [];
      const params = status ? `?status=${status}` : '';
      const res = await api.get(`/tenants/${tenantId}/surveys${params}`);
      return (res.data ?? []) as Survey[];
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
  });
}

export function useAgencySurveys() {
  return useQuery<Survey[]>({
    queryKey: ['agency-surveys'],
    queryFn: async () => {
      const res = await api.get('/agencies/me/surveys');
      return (res.data ?? []) as Survey[];
    },
    staleTime: 30 * 1000,
  });
}

// ── Detail ─────────────────────────────────────────────────────────────────────

export function useSurvey(tenantId: string | null, surveyId: string | null) {
  return useQuery<SurveyWithQuestions>({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/surveys/${surveyId}`);
      return res.data as SurveyWithQuestions;
    },
    enabled: !!tenantId && !!surveyId,
    staleTime: 15 * 1000,
  });
}

export function useAgencySurvey(surveyId: string | null) {
  return useQuery<SurveyWithQuestions>({
    queryKey: ['agency-survey', surveyId],
    queryFn: async () => {
      const res = await api.get(`/agencies/me/surveys/${surveyId}`);
      return res.data as SurveyWithQuestions;
    },
    enabled: !!surveyId,
    staleTime: 15 * 1000,
  });
}

// ── Results ────────────────────────────────────────────────────────────────────

export function useSurveyResults(tenantId: string | null, surveyId: string | null) {
  return useQuery<SurveyResults>({
    queryKey: ['survey-results', surveyId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/surveys/${surveyId}/results`);
      return res.data as SurveyResults;
    },
    enabled: !!tenantId && !!surveyId,
    staleTime: 60 * 1000,
  });
}

export function useSurveyResponses(tenantId: string | null, surveyId: string | null) {
  return useQuery<SurveyResponse[]>({
    queryKey: ['survey-responses', surveyId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/surveys/${surveyId}/responses`);
      return (res.data ?? []) as SurveyResponse[];
    },
    enabled: !!tenantId && !!surveyId,
    staleTime: 30 * 1000,
  });
}

export function useMyExistingSurveyResponse(tenantId: string | null, surveyId: string | null) {
  return useQuery<SurveyResponse | null>({
    queryKey: ['my-survey-response', surveyId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/surveys/${surveyId}/my-response`);
      return res.data as SurveyResponse | null;
    },
    enabled: !!tenantId && !!surveyId,
    staleTime: 30 * 1000,
  });
}

// ── Public (no auth) ───────────────────────────────────────────────────────────

export function usePublicSurvey(shareToken: string | null) {
  return useQuery<SurveyWithQuestions>({
    queryKey: ['public-survey', shareToken],
    queryFn: async () => {
      const res = await api.get(`/surveys/${shareToken}`);
      return res.data as SurveyWithQuestions;
    },
    enabled: !!shareToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateSurvey(tenantId: string | null) {
  const qc = useQueryClient();
  return useMutation<Survey, Error, CreateSurveyInput>({
    mutationFn: async (input) => {
      const res = await api.post(`/tenants/${tenantId}/surveys`, input);
      return res.data as Survey;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys', tenantId] });
    },
  });
}

export function useUpdateSurvey(tenantId: string | null, surveyId: string) {
  const qc = useQueryClient();
  return useMutation<Survey, Error, UpdateSurveyInput>({
    mutationFn: async (input) => {
      const res = await api.put(`/tenants/${tenantId}/surveys/${surveyId}`, input);
      return res.data as Survey;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['survey', surveyId] });
      qc.invalidateQueries({ queryKey: ['surveys', tenantId] });
    },
  });
}

export function useDeleteSurvey(tenantId: string | null) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (surveyId) => {
      await api.delete(`/tenants/${tenantId}/surveys/${surveyId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys', tenantId] });
    },
  });
}

export function useCreateSurveyQuestion(tenantId: string | null, surveyId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, CreateSurveyQuestionInput>({
    mutationFn: async (input) => {
      const res = await api.post(`/tenants/${tenantId}/surveys/${surveyId}/questions`, input);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['survey', surveyId] });
    },
  });
}

export function useUpdateSurveyQuestion(tenantId: string | null, surveyId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { questionId: string } & UpdateSurveyQuestionInput>({
    mutationFn: async ({ questionId, ...input }) => {
      const res = await api.put(
        `/tenants/${tenantId}/surveys/${surveyId}/questions/${questionId}`,
        input
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['survey', surveyId] });
    },
  });
}

export function useDeleteSurveyQuestion(tenantId: string | null, surveyId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (questionId) => {
      await api.delete(`/tenants/${tenantId}/surveys/${surveyId}/questions/${questionId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['survey', surveyId] });
    },
  });
}

export function useReorderSurveyQuestions(tenantId: string | null, surveyId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: async (orderedIds) => {
      await api.post(`/tenants/${tenantId}/surveys/${surveyId}/questions/reorder`, { orderedIds });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['survey', surveyId] });
    },
  });
}

export function useSubmitSurveyResponse(tenantId: string | null, surveyId: string) {
  const qc = useQueryClient();
  return useMutation<SurveyResponse, Error, { answers: Record<string, unknown>; enrollmentId?: string }>({
    mutationFn: async (input) => {
      const res = await api.post(`/tenants/${tenantId}/surveys/${surveyId}/respond`, input);
      return res.data as SurveyResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-survey-response', surveyId] });
      qc.invalidateQueries({ queryKey: ['survey-results', surveyId] });
    },
  });
}

export function useSubmitPublicSurveyResponse() {
  return useMutation<
    { data: SurveyResponse; surveyResults?: SurveyResults },
    Error,
    { shareToken: string; answers: Record<string, unknown>; sessionToken?: string }
  >({
    mutationFn: async ({ shareToken, answers, sessionToken }) => {
      const res = await api.post(`/surveys/${shareToken}/respond`, { answers, sessionToken });
      return res as { data: SurveyResponse; surveyResults?: SurveyResults };
    },
  });
}
