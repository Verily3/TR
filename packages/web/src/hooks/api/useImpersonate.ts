import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ImpersonationTarget {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface StartImpersonationInput {
  targetUserId: string;
  reason?: string;
  durationMinutes?: number;
}

interface StartImpersonationResponse {
  impersonationId: string;
  token: string;
  targetUser: ImpersonationTarget;
  expiresAt: string;
}

export function useStartImpersonation() {
  return useMutation({
    mutationFn: async (input: StartImpersonationInput) => {
      const response = await api.post<StartImpersonationResponse>(
        '/api/admin/impersonate',
        input
      );
      return response.data;
    },
    onSuccess: (data) => {
      sessionStorage.setItem('impersonation_token', data.token);
      // Full page reload to switch user context
      window.location.href = '/dashboard';
    },
  });
}

export function useEndImpersonation() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean }>(
        '/api/admin/impersonate/end'
      );
      return response.data;
    },
    onSuccess: () => {
      sessionStorage.removeItem('impersonation_token');
      window.location.reload();
    },
  });
}
