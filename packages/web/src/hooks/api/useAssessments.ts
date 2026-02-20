import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Assessment,
  AssessmentListItem,
  AssessmentDetail,
  AssessmentStats,
  AssessmentsListParams,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  AddInvitationsInput,
  AssessmentInvitation,
  ComputedAssessmentResults,
  AssessmentSetupInfo,
} from '@/types/assessments';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// ============ Assessment Queries ============

export function useAssessments(tenantId: string | undefined, params?: AssessmentsListParams) {
  return useQuery({
    queryKey: ['assessments', tenantId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.subjectId) searchParams.set('subjectId', params.subjectId);

      const queryString = searchParams.toString();
      const url = `/api/tenants/${tenantId}/assessments${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<AssessmentListItem[]>(url) as unknown as {
        data: AssessmentListItem[];
        pagination?: { total: number; page: number; limit: number; totalPages: number };
      };

      return {
        assessments: response.data || [],
        total: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 20,
        totalPages: response.pagination?.totalPages || 0,
      };
    },
    enabled: !!tenantId,
  });
}

export function useAssessment(tenantId: string | undefined, assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessment', tenantId, assessmentId],
    queryFn: async () => {
      const response = await api.get<AssessmentDetail>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}`
      ) as unknown as { data: AssessmentDetail };
      return response.data;
    },
    enabled: !!tenantId && !!assessmentId,
  });
}

export function useAssessmentStats(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentStats', tenantId],
    queryFn: async () => {
      const response = await api.get<AssessmentStats>(
        `/api/tenants/${tenantId}/assessments/stats`
      ) as unknown as { data: AssessmentStats };
      return response.data;
    },
    enabled: !!tenantId,
  });
}

export function useAssessmentResults(tenantId: string | undefined, assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentResults', tenantId, assessmentId],
    queryFn: async () => {
      const response = await api.get<ComputedAssessmentResults>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/results`
      ) as unknown as { data: ComputedAssessmentResults };
      return response.data;
    },
    enabled: !!tenantId && !!assessmentId,
    retry: false,
  });
}

export function useAssessmentInvitations(tenantId: string | undefined, assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentInvitations', tenantId, assessmentId],
    queryFn: async () => {
      const response = await api.get<AssessmentInvitation[]>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/invitations`
      ) as unknown as { data: AssessmentInvitation[] };
      return response.data || [];
    },
    enabled: !!tenantId && !!assessmentId,
  });
}

// ============ Assessment Mutations ============

export function useCreateAssessment(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssessmentInput) => {
      const response = await api.post<Assessment>(
        `/api/tenants/${tenantId}/assessments`,
        data
      ) as unknown as { data: Assessment };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['assessmentStats', tenantId] });
    },
  });
}

export function useUpdateAssessment(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, ...data }: UpdateAssessmentInput & { assessmentId: string }) => {
      const response = await api.put<Assessment>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}`,
        data
      ) as unknown as { data: Assessment };
      return response.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['assessment', tenantId, vars.assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessmentStats', tenantId] });
    },
  });
}

export function useDeleteAssessment(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      await api.delete(`/api/tenants/${tenantId}/assessments/${assessmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['assessmentStats', tenantId] });
    },
  });
}

export function useAddInvitations(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, ...data }: AddInvitationsInput & { assessmentId: string }) => {
      const response = await api.post<AssessmentInvitation[]>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/invitations`,
        data
      ) as unknown as { data: AssessmentInvitation[] };
      return response.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['assessmentInvitations', tenantId, vars.assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment', tenantId, vars.assessmentId] });
    },
  });
}

export function useRemoveInvitation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, invitationId }: { assessmentId: string; invitationId: string }) => {
      await api.delete(`/api/tenants/${tenantId}/assessments/${assessmentId}/invitations/${invitationId}`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['assessmentInvitations', tenantId, vars.assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment', tenantId, vars.assessmentId] });
    },
  });
}

export function useSendReminders(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await api.post<{ reminded: number }>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/invitations/remind`
      ) as unknown as { data: { reminded: number } };
      return response.data;
    },
    onSuccess: (_, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assessmentInvitations', tenantId, assessmentId] });
    },
  });
}

export function useCloseAssessment(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await api.post<{ status: string; results: ComputedAssessmentResults }>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/close`
      ) as unknown as { data: { status: string; results: ComputedAssessmentResults } };
      return response.data;
    },
    onSuccess: (_, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['assessment', tenantId, assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessmentResults', tenantId, assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessmentStats', tenantId] });
    },
  });
}

export function useComputeResults(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await api.post<ComputedAssessmentResults>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/results/compute`
      ) as unknown as { data: ComputedAssessmentResults };
      return response.data;
    },
    onSuccess: (_, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assessmentResults', tenantId, assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment', tenantId, assessmentId] });
    },
  });
}

// ============ Goal Integration ============

interface IndividualGoal {
  id: string;
  userId: string;
  tenantId: string;
  assessmentId: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  progress: number;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useAssessmentGoals(tenantId: string | undefined, assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentGoals', tenantId, assessmentId],
    queryFn: async () => {
      const response = await api.get<IndividualGoal[]>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/goals`
      ) as unknown as { data: IndividualGoal[] };
      return response.data || [];
    },
    enabled: !!tenantId && !!assessmentId,
  });
}

export function useCreateGoalsFromAssessment(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await api.post<IndividualGoal[]>(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/goals`
      ) as unknown as { data: IndividualGoal[] };
      return response.data;
    },
    onSuccess: (_, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assessmentGoals', tenantId, assessmentId] });
    },
  });
}

// ============ PDF Download ============

export function useDownloadReport(tenantId: string | undefined) {
  return useMutation({
    mutationFn: async ({ assessmentId, filename }: { assessmentId: string; filename: string }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/tenants/${tenantId}/assessments/${assessmentId}/report/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'Assessment_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

// ============ Subject Setup Portal (Public — no auth) ============

export function useAssessmentSetup(token: string | undefined) {
  return useQuery({
    queryKey: ['assessmentSetup', token],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/assessments/setup/${token}`);
      if (!response.ok) throw new Error('Invalid or expired setup link');
      const json = await response.json() as { data: AssessmentSetupInfo };
      return json.data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useSubmitSetupRaters(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raters: { firstName: string; lastName: string; email: string; raterType: string }[]) => {
      const response = await fetch(`${API_BASE}/api/assessments/setup/${token}/raters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raters }),
      });
      if (!response.ok) {
        const err = await response.json() as { error?: { message?: string } };
        throw new Error(err.error?.message || 'Failed to submit raters');
      }
      const json = await response.json() as { data: { added: number } };
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentSetup', token] });
    },
  });
}

// ============ Benchmarks ============

export function useAssessmentBenchmarks(templateId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentBenchmarks', templateId],
    queryFn: async () => {
      const response = await api.get<any>(
        `/api/agencies/me/benchmarks/${templateId}`
      ) as unknown as { data: any };
      return response.data;
    },
    enabled: !!templateId,
    retry: false,
  });
}
