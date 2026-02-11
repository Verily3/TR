import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Agency {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  agencyUsers: number;
}

export interface AgencyUser {
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

export interface CreateAgencyUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  title?: string;
  role: 'agency_admin' | 'agency_owner';
}

export interface UpdateAgencyInput {
  name?: string;
  logo?: string | null;
  primaryColor?: string;
  accentColor?: string;
  domain?: string | null;
  settings?: Record<string, unknown>;
}

export function useAgency() {
  return useQuery({
    queryKey: ['agency'],
    queryFn: async () => {
      const response = await api.get<Agency>('/api/agencies/me') as unknown as { data: Agency };
      return response.data;
    },
  });
}

export function useAgencyStats() {
  return useQuery({
    queryKey: ['agencyStats'],
    queryFn: async () => {
      const response = await api.get<AgencyStats>('/api/agencies/me/stats') as unknown as { data: AgencyStats };
      return response.data;
    },
  });
}

export function useAgencyUsers() {
  return useQuery({
    queryKey: ['agencyUsers'],
    queryFn: async () => {
      const response = await api.get<AgencyUser[]>('/api/agencies/me/users') as unknown as { data: AgencyUser[] };
      return response.data;
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAgencyInput) => {
      const response = await api.put<Agency>('/api/agencies/me', input) as unknown as { data: Agency };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency'] });
    },
  });
}

export interface AgencyUserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  title: string | null;
  status: string;
  tenantId: string;
  tenantName: string;
  roleSlug: string | null;
}

export function useAgencyUserSearch(search: string) {
  return useQuery({
    queryKey: ['agencyUserSearch', search],
    queryFn: async () => {
      const response = await api.get<AgencyUserSearchResult[]>(
        `/api/agencies/me/users/search?search=${encodeURIComponent(search)}&limit=20`
      ) as unknown as { data: AgencyUserSearchResult[] };
      return response.data;
    },
    enabled: search.length >= 2,
  });
}

export function useCreateAgencyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAgencyUserInput) => {
      const response = await api.post<AgencyUser>('/api/agencies/me/users', input) as unknown as { data: AgencyUser };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyUsers'] });
      queryClient.invalidateQueries({ queryKey: ['agencyStats'] });
    },
  });
}
