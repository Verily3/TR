import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  priority: string;
  status: 'unread' | 'read' | 'archived';
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  emailDigest: 'instant' | 'daily' | 'weekly' | 'never';
  inAppEnabled: boolean;
  preferences?: Record<string, unknown>;
  quietHoursEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useNotifications(params?: {
  status?: 'unread' | 'read' | 'archived';
  type?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.type) qs.set('type', params.type);
      if (params?.page) qs.set('page', params.page.toString());
      if (params?.limit) qs.set('limit', params.limit.toString());
      const url = `/api/notifications${qs.toString() ? `?${qs}` : ''}`;
      const res = await api.get<Notification[]>(url) as unknown as {
        data: Notification[];
        meta?: { pagination: { total: number; page: number; limit: number; totalPages: number } };
      };
      return { notifications: res.data ?? [], pagination: res.meta?.pagination };
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get<{ count: number }>('/api/notifications/unread-count');
      return res.data.count;
    },
    refetchInterval: 30_000, // Poll every 30 seconds
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => {
      const res = await api.get<NotificationPreferences>('/api/notifications/preferences');
      return res.data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/api/notifications/read-all', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useArchiveNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) =>
      api.put('/api/notifications/preferences', prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });
}
