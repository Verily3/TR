import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ActiveSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  expiresAt: string;
  isCurrent: boolean;
}

export function useActiveSessions() {
  return useQuery<ActiveSession[]>({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      const r = await api.get<ActiveSession[]>('/api/auth/sessions');
      return r.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete<{ success: boolean }>(`/api/auth/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const r = await api.post<{ success: boolean }>('/api/auth/change-password', data);
      return r.data;
    },
  });
}
