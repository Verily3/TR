"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: "owner" | "admin" | "support" | "analyst";
}

export interface AgencyDetails extends Agency {
  domain: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface AgencyTenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: "active" | "inactive" | "trial";
  users: number;
  activeUsers: number;
  programs: number;
  engagement: number;
  pendingInvites: number;
  createdAt: string;
}

export interface AgencyStats {
  totalTenants: number;
  totalUsers: number;
  totalPrograms: number;
}

export interface AgencyMember {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: "owner" | "admin" | "support" | "analyst";
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface ListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const agencyKeys = {
  all: ["agencies"] as const,
  lists: () => [...agencyKeys.all, "list"] as const,
  details: () => [...agencyKeys.all, "detail"] as const,
  detail: (id: string) => [...agencyKeys.details(), id] as const,
  tenants: (agencyId: string) => [...agencyKeys.detail(agencyId), "tenants"] as const,
  tenantList: (agencyId: string, params: ListParams) =>
    [...agencyKeys.tenants(agencyId), params] as const,
  members: (agencyId: string) => [...agencyKeys.detail(agencyId), "members"] as const,
  memberList: (agencyId: string, params: ListParams) =>
    [...agencyKeys.members(agencyId), params] as const,
  stats: (agencyId: string) => [...agencyKeys.detail(agencyId), "stats"] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch agencies for current user
 */
export function useAgencies() {
  return useQuery({
    queryKey: agencyKeys.lists(),
    queryFn: async () => {
      const response = await api.get<Agency[]>("/agencies");
      return response.data || [];
    },
  });
}

/**
 * Fetch single agency details
 */
export function useAgency(agencyId: string | null) {
  return useQuery({
    queryKey: agencyKeys.detail(agencyId || ""),
    queryFn: async () => {
      const response = await api.get<AgencyDetails>(`/agencies/${agencyId}`);
      return response.data;
    },
    enabled: !!agencyId,
  });
}

/**
 * Fetch tenants (clients) for an agency
 */
export function useAgencyTenants(
  agencyId: string | null,
  params: ListParams = {}
) {
  const { page = 1, perPage = 50, search } = params;

  return useQuery({
    queryKey: agencyKeys.tenantList(agencyId || "", { page, perPage, search }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) searchParams.set("search", search);

      const response = await api.get<AgencyTenant[]>(
        `/agencies/${agencyId}/tenants?${searchParams}`
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<AgencyTenant>;
    },
    enabled: !!agencyId,
  });
}

/**
 * Fetch agency team members
 */
export function useAgencyMembers(
  agencyId: string | null,
  params: ListParams = {}
) {
  const { page = 1, perPage = 50, search } = params;

  return useQuery({
    queryKey: agencyKeys.memberList(agencyId || "", { page, perPage, search }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) searchParams.set("search", search);

      const response = await api.get<AgencyMember[]>(
        `/agencies/${agencyId}/members?${searchParams}`
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<AgencyMember>;
    },
    enabled: !!agencyId,
  });
}

/**
 * Fetch agency statistics
 */
export function useAgencyStats(agencyId: string | null) {
  return useQuery({
    queryKey: agencyKeys.stats(agencyId || ""),
    queryFn: async () => {
      const response = await api.get<AgencyStats>(`/agencies/${agencyId}/stats`);
      return response.data;
    },
    enabled: !!agencyId,
  });
}
