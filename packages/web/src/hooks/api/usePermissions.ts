import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============ Types ============

export interface RolePermissionConfig {
  roleSlug: string;
  roleName: string;
  roleLevel: number;
  navItems: string[];
  isCustomised: boolean;
}

export interface UserPermissionOverride {
  userId: string;
  grantedNavItems: string[];
  revokedNavItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRoleNavInput {
  navItems: string[];
}

export interface UpdateUserPermissionsInput {
  grantedNavItems: string[];
  revokedNavItems: string[];
}

// ============ Hooks ============

/** Returns the effective nav item slugs for the current user (5 min stale time). */
export function useMyNav(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['myNav', tenantId],
    queryFn: async () => {
      const response = await api.get<string[]>(
        `/api/tenants/${tenantId}/permissions/my-nav`
      ) as unknown as { data: string[] };
      return response.data || [];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Returns all role permission configs for the tenant. */
export function useRolePermissions(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['rolePermissions', tenantId],
    queryFn: async () => {
      const response = await api.get<RolePermissionConfig[]>(
        `/api/tenants/${tenantId}/permissions/roles`
      ) as unknown as { data: RolePermissionConfig[] };
      return response.data || [];
    },
    enabled: !!tenantId,
  });
}

/** Updates nav items for a specific role. */
export function useUpdateRolePermissions(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleSlug, navItems }: { roleSlug: string; navItems: string[] }) => {
      const response = await api.put<RolePermissionConfig>(
        `/api/tenants/${tenantId}/permissions/roles/${roleSlug}`,
        { navItems }
      ) as unknown as { data: RolePermissionConfig };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['myNav', tenantId] });
    },
  });
}

/** Resets a role to its default nav items. */
export function useResetRolePermissions(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleSlug: string) => {
      await api.delete(`/api/tenants/${tenantId}/permissions/roles/${roleSlug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['myNav', tenantId] });
    },
  });
}

/** Returns all user-level permission overrides for the tenant. */
export function useUserPermissionOverrides(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['userPermissionOverrides', tenantId],
    queryFn: async () => {
      const response = await api.get<UserPermissionOverride[]>(
        `/api/tenants/${tenantId}/permissions/users`
      ) as unknown as { data: UserPermissionOverride[] };
      return response.data || [];
    },
    enabled: !!tenantId,
  });
}

/** Sets granted/revoked nav items for a specific user. */
export function useUpdateUserPermissions(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      grantedNavItems,
      revokedNavItems,
    }: {
      userId: string;
      grantedNavItems: string[];
      revokedNavItems: string[];
    }) => {
      const response = await api.put<UserPermissionOverride>(
        `/api/tenants/${tenantId}/permissions/users/${userId}`,
        { grantedNavItems, revokedNavItems }
      ) as unknown as { data: UserPermissionOverride };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissionOverrides', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['myNav', tenantId] });
    },
  });
}

/** Removes all permission overrides for a specific user. */
export function useDeleteUserPermissions(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/tenants/${tenantId}/permissions/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissionOverrides', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['myNav', tenantId] });
    },
  });
}
