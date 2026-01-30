"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface Program {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: "cohort" | "individual";
  status: "draft" | "active" | "completed" | "archived";
  startDate: string | null;
  endDate: string | null;
  moduleCount: number;
  enrollmentCount: number;
  createdAt: string;
}

export interface ProgramDetails extends Program {
  tenantId: string;
  settings: Record<string, unknown>;
  modules: Module[];
}

export interface Module {
  id: string;
  programId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: "draft" | "published";
  lessonCount: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  type: "reading" | "video" | "meeting" | "submission" | "assignment" | "assessment" | "goal" | "reflection";
  orderIndex: number;
  durationMinutes: number | null;
  points: number;
  content: Record<string, unknown> | null;
}

export interface Enrollment {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  organization: string | null;
  title: string | null;
  role: "facilitator" | "mentor" | "learner";
  status: "invited" | "active" | "completed" | "dropped";
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
}

export interface MentorOption {
  id: string;
  enrollmentId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface LearnerOption extends MentorOption {
  progress: number;
}

export interface LessonProgress {
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  completedAt: string | null;
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
  status?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const programKeys = {
  all: ["programs"] as const,
  lists: () => [...programKeys.all, "list"] as const,
  list: (tenantId: string, params: ListParams) =>
    [...programKeys.lists(), tenantId, params] as const,
  details: () => [...programKeys.all, "detail"] as const,
  detail: (tenantId: string, programId: string) =>
    [...programKeys.details(), tenantId, programId] as const,
  enrollments: (tenantId: string, programId: string) =>
    [...programKeys.detail(tenantId, programId), "enrollments"] as const,
  enrollmentList: (tenantId: string, programId: string, params: ListParams) =>
    [...programKeys.enrollments(tenantId, programId), params] as const,
  myProgress: (tenantId: string, programId: string) =>
    [...programKeys.detail(tenantId, programId), "my-progress"] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch programs for a tenant
 */
export function usePrograms(tenantId: string | null, params: ListParams = {}) {
  const { page = 1, perPage = 10, search, status } = params;

  return useQuery({
    queryKey: programKeys.list(tenantId || "", { page, perPage, search, status }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) searchParams.set("search", search);
      if (status) searchParams.set("status", status);

      const response = await api.get<Program[]>(
        `/tenants/${tenantId}/programs?${searchParams}`,
        { tenantId: tenantId || undefined }
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<Program>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Fetch single program with modules
 */
export function useProgram(tenantId: string | null, programId: string | null) {
  return useQuery({
    queryKey: programKeys.detail(tenantId || "", programId || ""),
    queryFn: async () => {
      const response = await api.get<ProgramDetails>(
        `/tenants/${tenantId}/programs/${programId}`,
        { tenantId: tenantId || undefined }
      );
      return response.data;
    },
    enabled: !!tenantId && !!programId,
  });
}

/**
 * Fetch program enrollments
 */
export function useProgramEnrollments(
  tenantId: string | null,
  programId: string | null,
  params: ListParams = {}
) {
  const { page = 1, perPage = 10, search } = params;

  return useQuery({
    queryKey: programKeys.enrollmentList(tenantId || "", programId || "", {
      page,
      perPage,
      search,
    }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) searchParams.set("search", search);

      const response = await api.get<Enrollment[]>(
        `/tenants/${tenantId}/programs/${programId}/enrollments?${searchParams}`,
        { tenantId: tenantId || undefined }
      );
      return {
        items: response.data || [],
        meta: response.meta || { page, perPage, total: 0, totalPages: 0 },
      } as PaginatedResponse<Enrollment>;
    },
    enabled: !!tenantId && !!programId,
  });
}

/**
 * Fetch mentors in a program
 */
export function useProgramMentors(tenantId: string | null, programId: string | null) {
  return useQuery({
    queryKey: [...programKeys.enrollments(tenantId || "", programId || ""), "mentors"],
    queryFn: async () => {
      const response = await api.get<MentorOption[]>(
        `/tenants/${tenantId}/programs/${programId}/enrollments/mentors`,
        { tenantId: tenantId || undefined }
      );
      return response.data || [];
    },
    enabled: !!tenantId && !!programId,
  });
}

/**
 * Fetch learners in a program
 */
export function useProgramLearners(tenantId: string | null, programId: string | null) {
  return useQuery({
    queryKey: [...programKeys.enrollments(tenantId || "", programId || ""), "learners"],
    queryFn: async () => {
      const response = await api.get<LearnerOption[]>(
        `/tenants/${tenantId}/programs/${programId}/enrollments/learners`,
        { tenantId: tenantId || undefined }
      );
      return response.data || [];
    },
    enabled: !!tenantId && !!programId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new program
 */
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: {
        name: string;
        description?: string;
        type: "cohort" | "individual";
        startDate?: string;
        endDate?: string;
      };
    }) => {
      const response = await api.post<Program>(
        `/tenants/${tenantId}/programs`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: programKeys.lists(),
      });
    },
  });
}

/**
 * Update a program
 */
export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      programId,
      data,
    }: {
      tenantId: string;
      programId: string;
      data: Partial<{
        name: string;
        description: string;
        status: "draft" | "active" | "completed" | "archived";
        startDate: string;
        endDate: string;
      }>;
    }) => {
      const response = await api.patch<ProgramDetails>(
        `/tenants/${tenantId}/programs/${programId}`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: programKeys.detail(variables.tenantId, variables.programId),
      });
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}

/**
 * Delete a program
 */
export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      programId,
    }: {
      tenantId: string;
      programId: string;
    }) => {
      await api.delete(`/tenants/${tenantId}/programs/${programId}`, {
        tenantId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}

export interface EnrollUserData {
  // Option A: Existing user
  userId?: string;

  // Option B: New user
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  organization?: string;
  notes?: string;

  // Role
  role: "facilitator" | "mentor" | "learner";

  // Mentor/Learner assignments
  mentorEnrollmentIds?: string[];
  learnerEnrollmentIds?: string[];
}

/**
 * Enroll a user in a program
 * Supports both existing users (by userId) and new users (by email + details)
 */
export function useEnrollUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      programId,
      data,
    }: {
      tenantId: string;
      programId: string;
      data: EnrollUserData;
    }) => {
      const response = await api.post<Enrollment>(
        `/tenants/${tenantId}/programs/${programId}/enrollments`,
        data,
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: programKeys.enrollments(variables.tenantId, variables.programId),
      });
      // Also invalidate mentors/learners lists
      queryClient.invalidateQueries({
        queryKey: [...programKeys.enrollments(variables.tenantId, variables.programId), "mentors"],
      });
      queryClient.invalidateQueries({
        queryKey: [...programKeys.enrollments(variables.tenantId, variables.programId), "learners"],
      });
    },
  });
}

/**
 * Mark a lesson as complete
 */
export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      programId,
      lessonId,
    }: {
      tenantId: string;
      programId: string;
      lessonId: string;
    }) => {
      const response = await api.post<LessonProgress>(
        `/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/complete`,
        {},
        { tenantId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: programKeys.detail(variables.tenantId, variables.programId),
      });
      queryClient.invalidateQueries({
        queryKey: programKeys.myProgress(variables.tenantId, variables.programId),
      });
    },
  });
}
