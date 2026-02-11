import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

export interface CompletedStep {
  stepId: string;
  completedAt: string;
}

export interface OnboardingPath {
  onboardingType: 'program_only' | 'strategic_planning' | 'full_platform';
  steps: OnboardingStep[];
  currentStep: string;
  completedSteps: CompletedStep[];
  formData: Record<string, Record<string, unknown>>;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
}

export interface OnboardingProgress {
  id: string;
  userId: string;
  tenantId: string | null;
  programId: string | null;
  onboardingType: string;
  currentStep: string;
  completedSteps: CompletedStep[];
  formData: Record<string, Record<string, unknown>>;
  status: string;
  startedAt: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
}

export interface UpdateProgressInput {
  currentStep: string;
  completedSteps?: CompletedStep[];
  formData?: Record<string, Record<string, unknown>>;
  status?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
}

/**
 * Get onboarding path/steps for current user
 */
export function useOnboardingPath(programId?: string) {
  return useQuery({
    queryKey: ['onboarding', 'path', programId],
    queryFn: async () => {
      const url = programId
        ? `/api/onboarding/path?programId=${programId}`
        : '/api/onboarding/path';

      const response = (await api.get<OnboardingPath>(url)) as unknown as {
        data: OnboardingPath;
      };
      return response.data;
    },
  });
}

/**
 * Get resume position for onboarding
 */
export function useOnboardingResume(programId?: string) {
  return useQuery({
    queryKey: ['onboarding', 'resume', programId],
    queryFn: async () => {
      const url = programId
        ? `/api/onboarding/resume?programId=${programId}`
        : '/api/onboarding/resume';

      const response = (await api.get(url)) as unknown as {
        data: {
          hasProgress: boolean;
          currentStep: string | null;
          completedSteps?: CompletedStep[];
          formData?: Record<string, Record<string, unknown>>;
          status?: string;
          lastActivityAt?: string;
          steps?: OnboardingStep[];
        };
      };
      return response.data;
    },
  });
}

/**
 * Update onboarding progress (auto-save)
 */
export function useUpdateOnboardingProgress(programId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProgressInput) => {
      const url = programId
        ? `/api/onboarding/progress?programId=${programId}`
        : '/api/onboarding/progress';

      const response = (await api.put<OnboardingProgress>(
        url,
        input
      )) as unknown as { data: OnboardingProgress };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'path', programId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'resume', programId] });
    },
  });
}

/**
 * Complete onboarding
 */
export function useCompleteOnboarding(programId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const url = programId
        ? `/api/onboarding/complete?programId=${programId}`
        : '/api/onboarding/complete';

      const response = (await api.post<OnboardingProgress>(url)) as unknown as {
        data: OnboardingProgress;
      };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Skip onboarding
 */
export function useSkipOnboarding(programId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const url = programId
        ? `/api/onboarding/skip?programId=${programId}`
        : '/api/onboarding/skip';

      const response = (await api.post<OnboardingProgress>(url)) as unknown as {
        data: OnboardingProgress;
      };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}
