import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Program, ProgramWithModules, ProgramConfig, UpdateProgramInput, UpdateLessonInput } from '@/types/programs';

interface AgencyProgramsListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export function useAgencyPrograms(params?: AgencyProgramsListParams) {
  return useQuery({
    queryKey: ['agencyPrograms', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.type) searchParams.set('type', params.type);

      const queryString = searchParams.toString();
      const url = `/api/agencies/me/programs${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<Program[]>(url) as unknown as {
        data: Program[];
        meta?: { pagination?: { total?: number; page?: number; limit?: number } };
      };

      return {
        programs: response.data || [],
        total: response.meta?.pagination?.total || 0,
        page: response.meta?.pagination?.page || 1,
        limit: response.meta?.pagination?.limit || 20,
      };
    },
  });
}

interface CreateAgencyProgramInput {
  name: string;
  internalName?: string;
  description?: string;
  type?: 'cohort' | 'self_paced';
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  tenantId?: string;
  allowedTenantIds?: string[];
  config?: ProgramConfig;
}

export function useCreateAgencyProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAgencyProgramInput) => {
      const response = await api.post<Program>('/api/agencies/me/programs', input) as unknown as { data: Program };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}

export function useDeleteAgencyProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      await api.delete(`/api/agencies/me/programs/${programId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}

export function useDuplicateAgencyProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      const response = await api.post<Program>(`/api/agencies/me/programs/${programId}/duplicate`) as unknown as { data: Program };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}

export function useAgencyProgram(programId: string | undefined) {
  return useQuery({
    queryKey: ['agencyProgram', programId],
    queryFn: async () => {
      const response = await api.get<ProgramWithModules>(
        `/api/agencies/me/programs/${programId}`
      ) as unknown as { data: ProgramWithModules };
      return response.data;
    },
    enabled: !!programId,
  });
}

export function useUpdateAgencyProgram(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProgramInput) => {
      const response = await api.put<Program>(
        `/api/agencies/me/programs/${programId}`,
        input
      ) as unknown as { data: Program };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyProgram', programId] });
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}

// ============ Agency Modules ============

export function useCreateAgencyModule(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; description?: string; parentModuleId?: string; order?: number }) => {
      const response = await api.post(`/api/agencies/me/programs/${programId}/modules`, input);
      return (response as unknown as { data: unknown }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyProgram', programId] });
    },
  });
}

export function useUpdateAgencyModule(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, input }: { moduleId: string; input: Record<string, unknown> }) => {
      const response = await api.put(`/api/agencies/me/programs/${programId}/modules/${moduleId}`, input);
      return (response as unknown as { data: unknown }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyProgram', programId] });
    },
  });
}

export function useDeleteAgencyModule(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      await api.delete(`/api/agencies/me/programs/${programId}/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyProgram', programId] });
    },
  });
}

export function useUpdateAgencyLesson(programId: string | undefined, moduleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, input }: { lessonId: string; input: UpdateLessonInput }) => {
      const response = await api.put(
        `/api/agencies/me/programs/${programId}/modules/${moduleId}/lessons/${lessonId}`,
        input
      );
      return (response as unknown as { data: unknown }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyProgram', programId] });
    },
  });
}

export function useDeleteAgencyLesson(programId: string | undefined, moduleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/api/agencies/me/programs/${programId}/modules/${moduleId}/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyProgram', programId] });
    },
  });
}

export function usePublishAgencyProgram(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.put<Program>(
        `/api/agencies/me/programs/${programId}`,
        { status: 'active' }
      ) as unknown as { data: Program };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyProgram', programId] });
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}
