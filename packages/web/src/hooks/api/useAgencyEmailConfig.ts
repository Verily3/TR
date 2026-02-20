import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AgencyEmailTypeConfig {
  subject?: string;
  body?: string;
  enabled?: boolean;
  mandatory?: boolean;
}

export type AgencyEmailConfig = Record<string, AgencyEmailTypeConfig>;

export function useAgencyEmailConfig() {
  return useQuery<AgencyEmailConfig>({
    queryKey: ['agency-email-config'],
    queryFn: async () => {
      const res = await api.get('/agencies/me/email-config');
      return (res.data ?? {}) as AgencyEmailConfig;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — matches server-side cache TTL
  });
}

export function useUpdateAgencyEmailConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: AgencyEmailConfig) => {
      const res = await api.put('/agencies/me/email-config', config);
      return res.data as AgencyEmailConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-email-config'] });
    },
  });
}
