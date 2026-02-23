import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  title: string | null;
  department: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  roleSlug: string | null;
  roleName: string | null;
  roleLevel: number | null;
}

export interface TenantUserDetail extends TenantUser {
  phone: string | null;
  timezone: string;
  managerId: string | null;
  metadata: Record<string, unknown>;
  roles: {
    roleId: string;
    roleName: string;
    roleSlug: string;
    roleLevel: number;
  }[];
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  title?: string;
  department?: string;
  role: 'learner' | 'mentor' | 'facilitator' | 'tenant_admin';
  managerId?: string | null;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'suspended';
  managerId?: string | null;
}

export interface ChangeRoleInput {
  role: 'learner' | 'mentor' | 'facilitator' | 'tenant_admin';
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export function useUsers(tenantId: string | undefined, params?: UsersListParams) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['users', tenantId, params],
    queryFn: async () => {
      const response = (await api.get<TenantUser[]>(
        `/api/users/tenants/${tenantId}${qs ? `?${qs}` : ''}`
      )) as unknown as {
        data: TenantUser[];
        meta?: { pagination?: { total?: number; page?: number; totalPages?: number } };
      };
      return response;
    },
    enabled: !!tenantId,
  });
}

export function useUser(tenantId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['user', tenantId, userId],
    queryFn: async () => {
      const response = (await api.get<TenantUserDetail>(
        `/api/users/tenants/${tenantId}/${userId}`
      )) as unknown as { data: TenantUserDetail };
      return response.data;
    },
    enabled: !!tenantId && !!userId,
  });
}

export function useCreateUser(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = (await api.post<TenantUser>(
        `/api/users/tenants/${tenantId}`,
        input
      )) as unknown as { data: TenantUser };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['agencyStats'] });
    },
  });
}

export function useUpdateUser(tenantId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const response = (await api.put<TenantUser>(
        `/api/users/tenants/${tenantId}/${userId}`,
        input
      )) as unknown as { data: TenantUser };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['user', tenantId, userId] });
    },
  });
}

export function useDeleteUser(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/users/tenants/${tenantId}/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['agencyStats'] });
    },
  });
}

export function useChangeUserRole(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: ChangeRoleInput['role'] }) => {
      const response = (await api.put<{
        userId: string;
        roleSlug: string;
        roleName: string;
        roleLevel: number;
      }>(`/api/users/tenants/${tenantId}/${userId}/role`, { role })) as unknown as {
        data: { userId: string; roleSlug: string; roleName: string; roleLevel: number };
      };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
    },
  });
}

export function useDepartments(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['users', 'departments', tenantId],
    queryFn: async () => {
      const response = (await api.get<string[]>(
        `/api/users/tenants/${tenantId}/departments`
      )) as unknown as { data: string[] };
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export interface DirectReportData {
  id: string;
  name: string;
  role: string;
  scorecardScore: number;
  scorecardTrend: 'up' | 'down' | 'neutral';
  goalsCompleted: number;
  goalsTotal: number;
  programsActive: number;
  rating: 'A' | 'A-' | 'B+' | 'B' | 'B-';
}

export function useDirectReports(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: ['direct-reports', tenantId],
    queryFn: async () => {
      const response = (await api.get<{ data: DirectReportData[] }>(
        `/api/users/tenants/${tenantId}/me/direct-reports`
      )) as unknown as { data: DirectReportData[] };
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}
