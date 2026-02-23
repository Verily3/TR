import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Program,
  ProgramWithModules,
  CreateProgramInput,
  UpdateProgramInput,
  ProgramsListParams,
  Module,
  CreateModuleInput,
  UpdateModuleInput,
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
  Enrollment,
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
  EnrollmentsListParams,
  EnrollmentProgress,
  LessonProgress as LessonProgressType,
  GoalResponse,
  GoalWithProgress,
  CreateGoalInput,
  ApprovalSubmission,
  DiscussionPost,
  LessonTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskProgressData,
  TaskWithProgress,
} from '@/types/programs';

// ============ Programs ============

export function usePrograms(tenantId: string | undefined, params?: ProgramsListParams) {
  return useQuery({
    queryKey: ['programs', tenantId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.search) searchParams.set('search', params.search);

      const queryString = searchParams.toString();
      const url = `/api/tenants/${tenantId}/programs${queryString ? `?${queryString}` : ''}`;

      // API returns { data: Program[], meta: { pagination: {...} } }
      // api.get returns the raw JSON response directly
      const response = (await api.get<Program[]>(url)) as unknown as {
        data: Program[];
        meta?: { pagination?: { total?: number; page?: number; limit?: number } };
      };

      return {
        programs: response.data || [],
        total: response.meta?.pagination?.total || 0,
        page: response.meta?.pagination?.page || 1,
        limit: response.meta?.pagination?.limit || 20,
      };
    },
    enabled: !!tenantId,
  });
}

export function useProgram(tenantId: string | undefined, programId: string | undefined) {
  return useQuery({
    queryKey: ['program', tenantId, programId],
    queryFn: async () => {
      // API returns { data: ProgramWithModules }
      const response = (await api.get<ProgramWithModules>(
        `/api/tenants/${tenantId}/programs/${programId}`
      )) as unknown as {
        data: ProgramWithModules;
      };
      return response.data;
    },
    enabled: !!tenantId && !!programId,
  });
}

export interface ProgramStats {
  totalEnrolled: number;
  avgCompletion: number;
  completedCount: number;
  weeksRemaining: number | null;
  modulePerformance: { name: string; completionPct: number }[];
  recentActivity: { userName: string; action: string; completedAt: string | null }[];
}

export function useProgramStats(tenantId: string | undefined, programId: string | undefined) {
  return useQuery({
    queryKey: ['program-stats', tenantId, programId],
    queryFn: async () => {
      const response = (await api.get<{ data: ProgramStats }>(
        `/api/tenants/${tenantId}/programs/${programId}/stats`
      )) as unknown as { data: ProgramStats };
      return response.data;
    },
    enabled: !!tenantId && !!programId,
    staleTime: 60_000,
  });
}

export interface ProgramGoal {
  id: string;
  statement: string;
  status: 'draft' | 'active' | 'completed';
  targetDate: string | null;
  reviewFrequency: string;
  createdAt: string;
  lessonTitle: string;
  learnerName: string;
  learnerInitials: string;
  latestProgress: number | null;
  latestReviewDate: string | null;
  reviewCount: number;
}

export interface ProgramGoalsData {
  stats: {
    total: number;
    active: number;
    completed: number;
    draft: number;
    avgProgress: number;
  };
  goals: ProgramGoal[];
}

export function useProgramGoals(tenantId: string | undefined, programId: string | undefined) {
  return useQuery({
    queryKey: ['program-goals', tenantId, programId],
    queryFn: async () => {
      const response = (await api.get<{ data: ProgramGoalsData }>(
        `/api/tenants/${tenantId}/programs/${programId}/goals`
      )) as unknown as { data: ProgramGoalsData };
      return response.data;
    },
    enabled: !!tenantId && !!programId,
    staleTime: 60_000,
  });
}

export function useCreateProgram(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProgramInput) => {
      const response = (await api.post<Program>(
        `/api/tenants/${tenantId}/programs`,
        input
      )) as unknown as { data: Program };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', tenantId] });
    },
  });
}

export function useUpdateProgram(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProgramInput) => {
      const response = await api.put<Program>(
        `/api/tenants/${tenantId}/programs/${programId}`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useDeleteProgram(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      await api.delete(`/api/tenants/${tenantId}/programs/${programId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', tenantId] });
    },
  });
}

export function usePublishProgram(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Program>(
        `/api/tenants/${tenantId}/programs/${programId}/publish`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useDuplicateProgram(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      const response = await api.post<Program>(
        `/api/tenants/${tenantId}/programs/${programId}/duplicate`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', tenantId] });
    },
  });
}

// ============ Modules ============

export function useCreateModule(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateModuleInput) => {
      const response = await api.post<Module>(
        `/api/tenants/${tenantId}/programs/${programId}/modules`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useUpdateModule(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, input }: { moduleId: string; input: UpdateModuleInput }) => {
      const response = await api.put<Module>(
        `/api/tenants/${tenantId}/programs/${programId}/modules/${moduleId}`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useDeleteModule(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      await api.delete(`/api/tenants/${tenantId}/programs/${programId}/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useReorderModules(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleIds: string[]) => {
      await api.put(`/api/tenants/${tenantId}/programs/${programId}/modules/reorder`, {
        moduleIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

// ============ Lessons ============

export function useCreateLesson(
  tenantId: string | undefined,
  programId: string | undefined,
  moduleId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLessonInput) => {
      const response = await api.post<Lesson>(
        `/api/tenants/${tenantId}/programs/${programId}/modules/${moduleId}/lessons`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useUpdateLesson(
  tenantId: string | undefined,
  programId: string | undefined,
  moduleId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, input }: { lessonId: string; input: UpdateLessonInput }) => {
      const response = await api.put<Lesson>(
        `/api/tenants/${tenantId}/programs/${programId}/modules/${moduleId}/lessons/${lessonId}`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useDeleteLesson(
  tenantId: string | undefined,
  programId: string | undefined,
  moduleId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(
        `/api/tenants/${tenantId}/programs/${programId}/modules/${moduleId}/lessons/${lessonId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useReorderLessons(
  tenantId: string | undefined,
  programId: string | undefined,
  moduleId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonIds: string[]) => {
      await api.put(
        `/api/tenants/${tenantId}/programs/${programId}/modules/${moduleId}/lessons/reorder`,
        { lessonIds }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

// ============ Enrollments ============

export function useEnrollments(
  tenantId: string | undefined,
  programId: string | undefined,
  params?: EnrollmentsListParams
) {
  return useQuery({
    queryKey: ['enrollments', tenantId, programId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.role) searchParams.set('role', params.role);
      if (params?.status) searchParams.set('status', params.status);

      const queryString = searchParams.toString();
      const url = `/api/tenants/${tenantId}/programs/${programId}/enrollments${queryString ? `?${queryString}` : ''}`;

      // API returns { data: Enrollment[], meta: { pagination: {...} } }
      const response = (await api.get<Enrollment[]>(url)) as unknown as {
        data: Enrollment[];
        meta?: { pagination?: { total?: number; page?: number; limit?: number } };
      };

      return {
        enrollments: response.data || [],
        total: response.meta?.pagination?.total || 0,
        page: response.meta?.pagination?.page || 1,
        limit: response.meta?.pagination?.limit || 20,
      };
    },
    enabled: !!tenantId && !!programId,
  });
}

export function useCreateEnrollment(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEnrollmentInput) => {
      const response = await api.post<Enrollment>(
        `/api/tenants/${tenantId}/programs/${programId}/enrollments`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useUpdateEnrollment(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      input,
    }: {
      enrollmentId: string;
      input: UpdateEnrollmentInput;
    }) => {
      const response = await api.put<Enrollment>(
        `/api/tenants/${tenantId}/programs/${programId}/enrollments/${enrollmentId}`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useDeleteEnrollment(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      await api.delete(
        `/api/tenants/${tenantId}/programs/${programId}/enrollments/${enrollmentId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

// ============ My Enrollment (Current User) ============

export function useMyEnrollment(
  tenantId: string | undefined,
  programId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: ['myEnrollment', tenantId, programId, userId],
    queryFn: async () => {
      // Fetch all enrollments and find the current user's enrollment
      const response = (await api.get<Enrollment[]>(
        `/api/tenants/${tenantId}/programs/${programId}/enrollments`
      )) as unknown as { data: Enrollment[] };

      const myEnrollment = response.data?.find((e) => e.userId === userId);
      return myEnrollment || null;
    },
    enabled: !!tenantId && !!programId && !!userId,
  });
}

// ============ Progress ============

export function useLearnerProgress(
  tenantId: string | undefined,
  programId: string | undefined,
  enrollmentId: string | undefined
) {
  return useQuery({
    queryKey: ['learnerProgress', tenantId, programId, enrollmentId],
    queryFn: async () => {
      const response = (await api.get<EnrollmentProgress>(
        `/api/tenants/${tenantId}/programs/${programId}/enrollments/${enrollmentId}/progress`
      )) as unknown as { data: EnrollmentProgress };
      return response.data;
    },
    enabled: !!tenantId && !!programId && !!enrollmentId,
  });
}

export function useEnrollmentGoals(
  tenantId: string | undefined,
  programId: string | undefined,
  enrollmentId: string | undefined
) {
  return useQuery({
    queryKey: ['enrollmentGoals', tenantId, programId, enrollmentId],
    queryFn: async () => {
      const response = (await api.get<GoalWithProgress[]>(
        `/api/tenants/${tenantId}/programs/${programId}/enrollments/${enrollmentId}/goals`
      )) as unknown as { data: GoalWithProgress[] };
      return response.data;
    },
    enabled: !!tenantId && !!programId && !!enrollmentId,
  });
}

export function useCompleteLesson(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      submissionData,
    }: {
      lessonId: string;
      submissionData?: Record<string, unknown>;
    }) => {
      const response = await api.put<LessonProgressType>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/complete`,
        { submissionData }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['myEnrollment', tenantId, programId] });
    },
  });
}

// ============ Goals ============

export function useCreateGoal(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, input }: { lessonId: string; input: CreateGoalInput }) => {
      const response = await api.post<GoalResponse>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/goals`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['myEnrollment', tenantId, programId] });
    },
  });
}

export function useUpdateGoal(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      input,
    }: {
      goalId: string;
      input: Partial<CreateGoalInput> & { status?: 'draft' | 'active' | 'completed' };
    }) => {
      const response = await api.put<GoalResponse>(
        `/api/tenants/${tenantId}/programs/${programId}/goals/${goalId}`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
    },
  });
}

// ============ Approvals ============

export function useApprovalSubmission(
  tenantId: string | undefined,
  programId: string | undefined,
  lessonId: string | undefined
) {
  return useQuery({
    queryKey: ['approvalSubmission', tenantId, programId, lessonId],
    queryFn: async () => {
      const response = await api.get<ApprovalSubmission[]>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/submission`
      );
      return response.data;
    },
    enabled: !!tenantId && !!programId && !!lessonId,
  });
}

export function useSubmitForApproval(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      submissionText,
    }: {
      lessonId: string;
      submissionText: string;
    }) => {
      const response = await api.post<ApprovalSubmission>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/submit`,
        { submissionText }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
      queryClient.invalidateQueries({
        queryKey: ['approvalSubmission', tenantId, programId, variables.lessonId],
      });
    },
  });
}

export function useApproveSubmission(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      enrollmentId,
      reviewerRole,
      status,
      feedback,
    }: {
      lessonId: string;
      enrollmentId: string;
      reviewerRole: 'mentor' | 'facilitator';
      status: 'approved' | 'rejected';
      feedback?: string;
    }) => {
      const response = await api.post<ApprovalSubmission>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/approve?enrollmentId=${enrollmentId}`,
        { status, reviewerRole, feedback }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', tenantId, programId] });
    },
  });
}

// ============ Discussions ============

export function useLessonDiscussions(
  tenantId: string | undefined,
  programId: string | undefined,
  lessonId: string | undefined
) {
  return useQuery({
    queryKey: ['lessonDiscussions', tenantId, programId, lessonId],
    queryFn: async () => {
      const response = await api.get<DiscussionPost[]>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/discussions`
      );
      return response.data;
    },
    enabled: !!tenantId && !!programId && !!lessonId,
  });
}

export function useCreateDiscussionPost(
  tenantId: string | undefined,
  programId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, content }: { lessonId: string; content: string }) => {
      const response = await api.post<DiscussionPost>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/discussions`,
        { content }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lessonDiscussions', tenantId, programId, variables.lessonId],
      });
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
    },
  });
}

// ============ Tasks ============

export function useCreateTask(
  tenantId: string | undefined,
  programId: string | undefined,
  lessonId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const response = await api.post<LessonTask>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/tasks`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useUpdateTask(
  tenantId: string | undefined,
  programId: string | undefined,
  lessonId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => {
      const response = await api.patch<LessonTask>(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/tasks/${taskId}`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useDeleteTask(
  tenantId: string | undefined,
  programId: string | undefined,
  lessonId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/tasks/${taskId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

export function useReorderTasks(
  tenantId: string | undefined,
  programId: string | undefined,
  lessonId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      await api.put(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/tasks/reorder`,
        { items }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', tenantId, programId] });
    },
  });
}

// ============ Task Progress ============

export function useCompleteTask(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      submissionData,
    }: {
      taskId: string;
      submissionData?: Record<string, unknown>;
    }) => {
      const response = await api.put<TaskProgressData>(
        `/api/tenants/${tenantId}/programs/${programId}/tasks/${taskId}/complete`,
        { submissionData }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['taskProgress', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['myEnrollment', tenantId, programId] });
    },
  });
}

export function useSubmitTaskForApproval(
  tenantId: string | undefined,
  programId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      submissionText,
      submissionData,
    }: {
      taskId: string;
      submissionText: string;
      submissionData?: Record<string, unknown>;
    }) => {
      const response = await api.post<ApprovalSubmission[]>(
        `/api/tenants/${tenantId}/programs/${programId}/tasks/${taskId}/submit`,
        { submissionText, submissionData }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['taskProgress', tenantId, programId] });
    },
  });
}

export function useApproveTask(tenantId: string | undefined, programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      enrollmentId,
      reviewerRole,
      status,
      feedback,
    }: {
      taskId: string;
      enrollmentId: string;
      reviewerRole: 'mentor' | 'facilitator';
      status: 'approved' | 'rejected';
      feedback?: string;
    }) => {
      const response = await api.post<ApprovalSubmission>(
        `/api/tenants/${tenantId}/programs/${programId}/tasks/${taskId}/approve?enrollmentId=${enrollmentId}`,
        { status, reviewerRole, feedback }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProgress', tenantId, programId] });
      queryClient.invalidateQueries({ queryKey: ['taskProgress', tenantId, programId] });
    },
  });
}

export function useTaskProgress(
  tenantId: string | undefined,
  programId: string | undefined,
  enrollmentId: string | undefined
) {
  return useQuery({
    queryKey: ['taskProgress', tenantId, programId, enrollmentId],
    queryFn: async () => {
      const response = (await api.get<TaskWithProgress[]>(
        `/api/tenants/${tenantId}/programs/${programId}/enrollments/${enrollmentId}/task-progress`
      )) as unknown as { data: TaskWithProgress[] };
      return response.data;
    },
    enabled: !!tenantId && !!programId && !!enrollmentId,
  });
}
