import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Enrollment, EnrollmentRole, EnrollmentStatus } from '@/types/programs';

interface AgencyEnrollmentsListParams {
  page?: number;
  limit?: number;
  role?: EnrollmentRole;
  status?: EnrollmentStatus;
  tenantId?: string;
  search?: string;
}

export interface AgencyEnrollment extends Enrollment {
  tenantName: string | null;
}

interface AgencyEnrollmentsResponse {
  data: AgencyEnrollment[];
  meta?: { pagination?: { total?: number; page?: number; limit?: number } };
}

export function useAgencyEnrollments(
  programId: string | undefined,
  params?: AgencyEnrollmentsListParams
) {
  return useQuery({
    queryKey: ['agencyEnrollments', programId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.role) searchParams.set('role', params.role);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.tenantId) searchParams.set('tenantId', params.tenantId);
      if (params?.search) searchParams.set('search', params.search);

      const queryString = searchParams.toString();
      const url = `/api/agencies/me/programs/${programId}/enrollments${queryString ? `?${queryString}` : ''}`;

      const response = (await api.get<AgencyEnrollment[]>(url)) as unknown as AgencyEnrollmentsResponse;

      return {
        enrollments: response.data || [],
        total: response.meta?.pagination?.total || 0,
        page: response.meta?.pagination?.page || 1,
        limit: response.meta?.pagination?.limit || 20,
      };
    },
    enabled: !!programId,
  });
}

export function useCreateAgencyEnrollment(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; role: EnrollmentRole }) => {
      const response = await api.post<Enrollment>(
        `/api/agencies/me/programs/${programId}/enrollments`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyEnrollments', programId] });
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}

interface BulkEnrollParticipant {
  email: string;
  firstName: string;
  lastName: string;
  role: EnrollmentRole;
  tenantId?: string;
}

interface BulkEnrollResult {
  results: {
    success: boolean;
    email: string;
    error?: string;
    userCreated?: boolean;
  }[];
  summary: {
    enrolled: number;
    created: number;
    errors: number;
    total: number;
  };
}

export function useBulkEnrollAgency(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participants: BulkEnrollParticipant[]) => {
      const response = await api.post<BulkEnrollResult>(
        `/api/agencies/me/programs/${programId}/enrollments/bulk`,
        { participants }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyEnrollments', programId] });
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}

export function useDeleteAgencyEnrollment(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      await api.delete(
        `/api/agencies/me/programs/${programId}/enrollments/${enrollmentId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyEnrollments', programId] });
      queryClient.invalidateQueries({ queryKey: ['agencyPrograms'] });
    },
  });
}

// Agency user search for enrollment
interface UserSearchResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  title: string | null;
  status: string;
  tenantId: string | null;
  tenantName: string | null;
}

export function useAgencyUserSearch(search: string, tenantId?: string) {
  return useQuery({
    queryKey: ['agencyUserSearch', search, tenantId],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('search', search);
      if (tenantId) searchParams.set('tenantId', tenantId);
      searchParams.set('includeUnaffiliated', 'true');

      const response = await api.get<UserSearchResult[]>(
        `/api/agencies/me/users/search?${searchParams.toString()}`
      );
      return (response as unknown as { data: UserSearchResult[] }).data || [];
    },
    enabled: search.length >= 2,
  });
}
