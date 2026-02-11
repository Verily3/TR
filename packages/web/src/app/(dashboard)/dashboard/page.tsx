'use client';

import { useAuth } from '@/hooks/use-auth';
import { useLearnerDashboard } from '@/hooks/api/useLearnerDashboard';
import {
  ProgramTracker,
  WeekAtAGlance,
  RecentComments,
  JourneyHub,
  Leaderboard,
  MySchedule,
  LearningQueue,
} from '@/components/dashboard';
import {
  Trophy,
  TrendingUp,
  BookOpen,
  Flame,
} from 'lucide-react';

const LEARNER_ROLES = ['learner', 'mentor', 'facilitator'];

function LearnerDashboard() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const { data, isLoading } = useLearnerDashboard(tenantId);

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const actionCount = data
    ? data.upcomingItems.length + data.activeGoals.length + data.pendingApprovals.length
    : 0;

  const stats = [
    {
      label: 'Points Earned',
      value: data?.summary.totalPoints.toLocaleString() ?? '0',
      icon: Trophy,
      accent: true,
    },
    {
      label: 'Progress',
      value: `${data?.summary.overallProgress ?? 0}%`,
      icon: TrendingUp,
    },
    {
      label: 'Lessons Done',
      value: `${data?.summary.lessonsCompleted ?? 0}/${data?.summary.totalLessons ?? 0}`,
      icon: BookOpen,
    },
    {
      label: 'Programs',
      value: String(data?.summary.enrolledPrograms ?? 0),
      icon: Flame,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Dashboard Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl text-sidebar-foreground mb-1">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString}
          {actionCount > 0 && (
            <span className="ml-1">
              &middot;{' '}
              <span className="text-accent font-medium">
                {actionCount} action{actionCount > 1 ? 's' : ''} need attention
              </span>
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 h-48 bg-muted/50 rounded-xl animate-pulse" />
            <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 lg:mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-4 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${stat.accent ? 'text-accent' : 'text-muted-foreground'}`} />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </span>
                  </div>
                  <div className={`text-xl sm:text-2xl ${stat.accent ? 'text-accent' : 'text-sidebar-foreground'}`}>
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Program Tracker + My Schedule - side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8">
            <div className="lg:col-span-2">
              <ProgramTracker
                enrollment={data?.enrollments[0] ?? null}
                modules={data?.programModules ?? []}
              />
            </div>
            <div>
              <MySchedule
                meetings={(data?.upcomingItems ?? []).filter(
                  (item) => item.contentType === 'mentor_meeting'
                )}
              />
            </div>
          </div>

          {/* Week at a Glance + Recent Comments - side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8">
            <div className="lg:col-span-3">
              <WeekAtAGlance
                upcomingItems={data?.upcomingItems ?? []}
                activeGoals={data?.activeGoals ?? []}
                pendingApprovals={data?.pendingApprovals ?? []}
              />
            </div>
            {tenantId && (
              <div className="lg:col-span-2">
                <RecentComments
                  tenantId={tenantId}
                  discussions={data?.recentDiscussions ?? []}
                />
              </div>
            )}
          </div>

          {/* Journey Hub + Learning Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <JourneyHub
              enrollment={data?.enrollments[0] ?? null}
              upcomingItems={data?.upcomingItems ?? []}
              activeGoals={data?.activeGoals ?? []}
              pendingApprovals={data?.pendingApprovals ?? []}
              summary={data?.summary ?? { totalPoints: 0, overallProgress: 0 }}
            />
            <LearningQueue />
          </div>

          {/* Leaderboard */}
          <Leaderboard />
        </>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome back, {user?.firstName}
      </h1>
      <p className="mt-2 text-gray-600">
        Here&apos;s what&apos;s happening in your organization.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900">Active Programs</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900">Goals in Progress</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900">Upcoming Sessions</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p><span className="font-medium">Role:</span> {user?.roleSlug}</p>
          <p><span className="font-medium">Permissions:</span> {user?.permissions?.length || 0} granted</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const isLearnerRole = user?.roleSlug && LEARNER_ROLES.includes(user.roleSlug) && !user.agencyId;

  if (isLearnerRole) {
    return <LearnerDashboard />;
  }

  return <AdminDashboard />;
}
