import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProgramResource } from '@/types/resources';

export function useResources(tenantId: string | null, programId: string | null, lessonId?: string) {
  return useQuery({
    queryKey: ['resources', tenantId, programId, lessonId],
    queryFn: async () => {
      const params = lessonId ? `?lessonId=${lessonId}` : '';
      const res = await api.get<ProgramResource[]>(
        `/api/tenants/${tenantId}/programs/${programId}/resources${params}`
      );
      return (res as unknown as { data: ProgramResource[] }).data;
    },
    enabled: !!tenantId && !!programId,
  });
}

export function useUploadResource(tenantId: string | null, programId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.uploadFile<ProgramResource>(
        `/api/tenants/${tenantId}/programs/${programId}/resources`,
        formData
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', tenantId, programId] });
    },
  });
}

export function useAddResourceLink(tenantId: string | null, programId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      externalUrl: string;
      category?: string;
      lessonId?: string;
    }) => {
      const res = await api.post<ProgramResource>(
        `/api/tenants/${tenantId}/programs/${programId}/resources/link`,
        data
      );
      return (res as unknown as { data: ProgramResource }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', tenantId, programId] });
    },
  });
}

export function useUpdateResource(tenantId: string | null, programId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceId,
      ...data
    }: {
      resourceId: string;
      name?: string;
      category?: string;
      lessonId?: string | null;
      order?: number;
    }) => {
      const res = await api.put<ProgramResource>(
        `/api/tenants/${tenantId}/programs/${programId}/resources/${resourceId}`,
        data
      );
      return (res as unknown as { data: ProgramResource }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', tenantId, programId] });
    },
  });
}

export function useDeleteResource(tenantId: string | null, programId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      await api.delete(`/api/tenants/${tenantId}/programs/${programId}/resources/${resourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', tenantId, programId] });
    },
  });
}
