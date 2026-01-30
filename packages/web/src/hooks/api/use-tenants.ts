"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: "admin" | "user";
  joinedAt: string;
}

export interface TenantDetails extends Tenant {
  agencyId: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface TenantMember {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: "admin" | "user";
  joinedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const tenantKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantKeys.all, "list"] as const,
  list: (params: ListParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, "detail"] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  members: (tenantId: string) => [...tenantKeys.detail(tenantId), "members"] as const,
  memberList: (tenantId: string, params: ListParams) =>
    [...tenantKeys.members(tenantId), params] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch paginated list of tenants for current user
 */
export function useTenants(params: ListParams = {}) {
  const { page = 1, perPage = 10, search } = params;

  return useQuery({
    queryKey: tenantKeys.list({ page, perPage, search }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) searchParams.set("search", search);

      const response = await api.get<Tenant[]>(`/tenants?${searchParams}`);
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<Tenant>;
    },
  });
}

/**
 * Fetch single tenant details
 */
export function useTenant(tenantId: string | null) {
  return useQuery({
    queryKey: tenantKeys.detail(tenantId || ""),
    queryFn: async () => {
      const response = await api.get<TenantDetails>(`/tenants/${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId,
  });
}

/**
 * Fetch tenant members
 */
export function useTenantMembers(
  tenantId: string | null,
  params: ListParams = {}
) {
  const { page = 1, perPage = 10, search } = params;

  return useQuery({
    queryKey: tenantKeys.memberList(tenantId || "", { page, perPage, search }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) searchParams.set("search", search);

      const response = await api.get<TenantMember[]>(
        `/tenants/${tenantId}/members?${searchParams}`,
        { tenantId: tenantId || undefined }
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<TenantMember>;
    },
    enabled: !!tenantId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update tenant details
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: { name?: string; logoUrl?: string | null; settings?: Record<string, unknown> };
    }) => {
      const response = await api.patch<TenantDetails>(
        `/tenants/${tenantId}`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.tenantId) });
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
}

/**
 * Invite a new member to tenant
 */
export function useInviteTenantMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: {
        email: string;
        role: "admin" | "user";
        firstName?: string;
        lastName?: string;
      };
    }) => {
      const response = await api.post<{ invitationId: string }>(
        `/tenants/${tenantId}/members/invite`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.members(variables.tenantId) });
    },
  });
}

/**
 * Update member role
 */
export function useUpdateTenantMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      memberId,
      role,
    }: {
      tenantId: string;
      memberId: string;
      role: "admin" | "user";
    }) => {
      const response = await api.patch<TenantMember>(
        `/tenants/${tenantId}/members/${memberId}`,
        { role },
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.members(variables.tenantId) });
    },
  });
}

/**
 * Remove member from tenant
 */
export function useRemoveTenantMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      memberId,
    }: {
      tenantId: string;
      memberId: string;
    }) => {
      await api.delete(`/tenants/${tenantId}/members/${memberId}`, { tenantId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.members(variables.tenantId) });
    },
  });
}
