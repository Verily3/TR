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
      // Best-effort server-side cleanup — ignore failures since the
      // client-side token removal is what actually ends the session.
      try {
        await api.post<{ success: boolean }>('/api/admin/impersonate/end');
      } catch {
        // Swallow — we still clear the token below
      }
    },
    onSettled: () => {
      sessionStorage.removeItem('impersonation_token');
      window.location.href = '/dashboard';
    },
  });
}
