import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Tenant {
  id: string;
  agencyId: string;
  name: string;
  slug: string;
  domain: string | null;
  industry: string | null;
  status: 'active' | 'trial' | 'suspended' | 'churned';
  logo: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  usersLimit: number;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  userCount?: number;
}

export interface TenantWithUserCount extends Tenant {
  userCount: number;
}

export interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  usersLimit: number;
  usersRemaining: number;
}

export interface CreateTenantInput {
  name: string;
  slug?: string;
  domain?: string;
  industry?: string;
  status?: 'active' | 'trial' | 'suspended';
  usersLimit?: number;
  settings?: Record<string, unknown>;
}

export interface UpdateTenantInput {
  name?: string;
  slug?: string;
  domain?: string;
  industry?: string;
  status?: 'active' | 'trial' | 'suspended' | 'churned';
  usersLimit?: number;
  settings?: Record<string, unknown>;
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await api.get<Tenant[]>('/api/tenants') as unknown as {
        data: Tenant[];
        meta?: { pagination?: { total?: number } };
      };
      return response.data || [];
    },
  });
}

export function useTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await api.get<TenantWithUserCount>(
        `/api/tenants/${tenantId}`
      ) as unknown as { data: TenantWithUserCount };
      return response.data;
    },
    enabled: !!tenantId,
  });
}

export function useTenantStats(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenantStats', tenantId],
    queryFn: async () => {
      const response = await api.get<TenantStats>(
        `/api/tenants/${tenantId}/stats`
      ) as unknown as { data: TenantStats };
      return response.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      const response = await api.post<Tenant>('/api/tenants', input) as unknown as { data: Tenant };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['agencyStats'] });
    },
  });
}

export function useUpdateTenant(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTenantInput) => {
      const response = await api.put<Tenant>(
        `/api/tenants/${tenantId}`,
        input
      ) as unknown as { data: Tenant };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      await api.delete(`/api/tenants/${tenantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['agencyStats'] });
    },
  });
}
