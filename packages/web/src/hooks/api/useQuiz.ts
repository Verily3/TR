import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { QuizAttempt, QuizBreakdownItem } from '@/types/programs';

interface SubmitQuizInput {
  tenantId: string;
  programId: string;
  lessonId: string;
  answers: Record<string, string | number>;
}

interface GradeQuizInput {
  tenantId: string;
  programId: string;
  lessonId: string;
  attemptId: string;
  questionGrades: { questionId: string; pointsAwarded: number }[];
}

interface QuizSubmitResult {
  attempt: QuizAttempt;
  score: number;
  passed: boolean | null;
  gradingStatus: string;
  breakdown: QuizBreakdownItem[];
}

interface QuizStats {
  totalAttempts: number;
  passRate: number;
  avgScore: number;
  pendingGrade: number;
}

export function useMyQuizAttempts(
  tenantId: string | null,
  programId: string,
  lessonId: string,
  enrollmentId?: string | null
) {
  return useQuery<QuizAttempt[]>({
    queryKey: ['quiz-attempts', lessonId, enrollmentId],
    queryFn: async () => {
      if (!tenantId) return [];
      const res = await api.get(
        `/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/quiz/attempts`
      );
      return (res.data ?? []) as QuizAttempt[];
    },
    enabled: !!tenantId && !!lessonId,
    staleTime: 30 * 1000,
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation<QuizSubmitResult, Error, SubmitQuizInput>({
    mutationFn: async ({ tenantId, programId, lessonId, answers }) => {
      const res = await api.post(
        `/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/quiz/submit`,
        { answers }
      );
      return res.data as QuizSubmitResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', variables.lessonId] });
      // Also invalidate lesson progress
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useQuizStats(
  tenantId: string | null,
  programId: string,
  lessonId: string
) {
  return useQuery<QuizStats>({
    queryKey: ['quiz-stats', lessonId],
    queryFn: async () => {
      const res = await api.get(
        `/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/quiz/stats`
      );
      return res.data as QuizStats;
    },
    enabled: !!tenantId && !!lessonId,
    staleTime: 60 * 1000,
  });
}

export function useGradeQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation<QuizAttempt, Error, GradeQuizInput>({
    mutationFn: async ({ tenantId, programId, lessonId, attemptId, questionGrades }) => {
      const res = await api.put(
        `/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/quiz/attempts/${attemptId}/grade`,
        { questionGrades }
      );
      return res.data as QuizAttempt;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', variables.lessonId] });
    },
  });
}
