import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MyProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  title: string | null;
  department: string | null;
  phone: string | null;
  timezone: string;
  status: string;
  agencyId: string | null;
  tenantId: string | null;
  managerId: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  metadata: {
    bio?: string;
    skills?: string[];
    location?: string;
    preferences?: {
      language?: string;
      dateFormat?: string;
      theme?: 'light' | 'dark' | 'system';
    };
  } | null;
  roles: {
    roleId: string;
    roleName: string;
    roleSlug: string;
    roleLevel: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const response = await api.get<MyProfile>('/api/users/me') as unknown as { data: MyProfile };
      return response.data;
    },
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      title?: string;
      department?: string;
      avatar?: string | null;
    }) => {
      const response = await api.patch<MyProfile>(
        '/api/users/me',
        data
      ) as unknown as { data: MyProfile };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
