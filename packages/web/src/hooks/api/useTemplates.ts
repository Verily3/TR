import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AssessmentTemplate,
  TemplateStats,
  TemplatesListParams,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@/types/assessments';

// ============ Template Queries ============

export function useTemplates(params?: TemplatesListParams) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.type) searchParams.set('type', params.type);

      const queryString = searchParams.toString();
      const url = `/api/agencies/me/templates${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<AssessmentTemplate[]>(url) as unknown as {
        data: AssessmentTemplate[];
        pagination?: { total: number; page: number; limit: number; totalPages: number };
      };

      return {
        templates: response.data || [],
        total: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 20,
        totalPages: response.pagination?.totalPages || 0,
      };
    },
  });
}

export function useTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      const response = await api.get<AssessmentTemplate>(
        `/api/agencies/me/templates/${templateId}`
      ) as unknown as { data: AssessmentTemplate };
      return response.data;
    },
    enabled: !!templateId,
  });
}

export function useTemplateStats() {
  return useQuery({
    queryKey: ['templateStats'],
    queryFn: async () => {
      const response = await api.get<TemplateStats>(
        '/api/agencies/me/templates/stats'
      ) as unknown as { data: TemplateStats };
      return response.data;
    },
  });
}

// ============ Template Mutations ============

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateInput) => {
      const response = await api.post<AssessmentTemplate>(
        '/api/agencies/me/templates',
        data
      ) as unknown as { data: AssessmentTemplate };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templateStats'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, ...data }: UpdateTemplateInput & { templateId: string }) => {
      const response = await api.put<AssessmentTemplate>(
        `/api/agencies/me/templates/${templateId}`,
        data
      ) as unknown as { data: AssessmentTemplate };
      return response.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', vars.templateId] });
      queryClient.invalidateQueries({ queryKey: ['templateStats'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      await api.delete(`/api/agencies/me/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templateStats'] });
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post<AssessmentTemplate>(
        `/api/agencies/me/templates/${templateId}/duplicate`
      ) as unknown as { data: AssessmentTemplate };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templateStats'] });
    },
  });
}
