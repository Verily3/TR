import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardEnrollment {
  id: string;
  programId: string;
  role: string;
  status: string;
  progress: number;
  pointsEarned: number;
  enrolledAt: string;
  programName: string;
  programDescription: string | null;
  programStatus: string;
  programStartDate: string | null;
  programEndDate: string | null;
  programCoverImage: string | null;
}

export interface DashboardModule {
  id: string;
  programId: string;
  title: string;
  order: number;
  depth: number;
  totalLessons: number;
  completedLessons: number;
  status: 'completed' | 'in-progress' | 'not-started';
}

export interface DashboardDiscussion {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  createdAt: string;
  authorFirstName: string | null;
  authorLastName: string | null;
  authorAvatar: string | null;
  lessonTitle: string;
  lessonContentType: string;
  programId: string;
  programName: string;
}

export interface DashboardUpcomingItem {
  lessonId: string;
  lessonTitle: string;
  contentType: string;
  points: number;
  durationMinutes: number | null;
  moduleTitle: string;
  moduleOrder: number;
  lessonOrder: number;
  programId: string;
  programName: string;
  progressStatus: string | null;
}

export interface DashboardGoal {
  id: string;
  statement: string;
  successMetrics: string | null;
  targetDate: string | null;
  reviewFrequency: string;
  status: string;
  createdAt: string;
  lessonTitle: string;
  programName: string;
  latestReviewDate: string | null;
  latestProgress: number | null;
}

export interface DashboardApproval {
  id: string;
  lessonId: string;
  submissionText: string;
  submittedAt: string;
  reviewerRole: string;
  status: string;
  lessonTitle: string;
  programName: string;
  programId: string;
}

export interface DashboardSummary {
  enrolledPrograms: number;
  overallProgress: number;
  totalPoints: number;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface LearnerDashboardData {
  enrollments: DashboardEnrollment[];
  programModules: DashboardModule[];
  recentDiscussions: DashboardDiscussion[];
  upcomingItems: DashboardUpcomingItem[];
  activeGoals: DashboardGoal[];
  pendingApprovals: DashboardApproval[];
  summary: DashboardSummary;
}

export interface LeaderboardParticipant {
  id: string;
  name: string;
  initials: string;
  role: string;
  points: number;
  progress: number;
  change: number;
  isCurrentUser: boolean;
}

export function useLeaderboard(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['leaderboard', tenantId],
    queryFn: async () => {
      const response = (await api.get<{ data: LeaderboardParticipant[] }>(
        `/api/tenants/${tenantId}/dashboard/leaderboard`
      )) as unknown as { data: LeaderboardParticipant[] };
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

export function useLearnerDashboard(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['learnerDashboard', tenantId],
    queryFn: async () => {
      const response = (await api.get<LearnerDashboardData>(
        `/api/tenants/${tenantId}/dashboard/learner`
      )) as unknown as { data: LearnerDashboardData };
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}
