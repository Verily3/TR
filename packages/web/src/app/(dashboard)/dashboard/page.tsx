'use client';

import Link from 'next/link';
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
  Users,
  Building2,
  BarChart3,
  MessageSquare,
  CalendarCheck,
  Target,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  UserCheck,
} from 'lucide-react';
import { useAgencyStats, useAgencyUsers } from '@/hooks/api/useAgency';
import { useTenantStats, useTenants } from '@/hooks/api/useTenants';
import { useAgencyPrograms } from '@/hooks/api/useAgencyPrograms';
import { usePrograms } from '@/hooks/api/usePrograms';
import { useUsers } from '@/hooks/api/useUsers';
import { useMentoringStats } from '@/hooks/api/useMentoring';
import { useAssessmentStats } from '@/hooks/api/useAssessments';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEARNER_ROLES = ['learner', 'mentor', 'facilitator'];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
  sub?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-accent/30 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? 'text-accent' : 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      {isLoading ? (
        <div className="h-8 w-16 bg-muted/60 rounded animate-pulse" />
      ) : (
        <div className={`text-2xl font-semibold ${accent ? 'text-accent' : 'text-sidebar-foreground'}`}>
          {value}
        </div>
      )}
      {sub && !isLoading && (
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      )}
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-sidebar-foreground">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-accent hover:gap-2 transition-all"
        >
          {linkLabel ?? 'View all'}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-50 text-green-700' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
    archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500' },
    trial: { label: 'Trial', className: 'bg-blue-50 text-blue-700' },
    suspended: { label: 'Suspended', className: 'bg-red-50 text-red-600' },
    churned: { label: 'Churned', className: 'bg-gray-100 text-gray-500' },
  };
  const c = config[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.className}`}>{c.label}</span>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ─── Tenant Admin Dashboard ───────────────────────────────────────────────────

function TenantAdminDashboard() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const { data: tenantStats, isLoading: statsLoading } = useTenantStats(tenantId);
  const { data: mentoringStats, isLoading: mentoringLoading } = useMentoringStats(tenantId);
  const { data: assessmentStats, isLoading: assessmentLoading } = useAssessmentStats(tenantId);
  const { data: programsData, isLoading: programsLoading } = usePrograms(tenantId, { limit: 5 });
  const { data: usersData, isLoading: usersLoading } = useUsers(tenantId, { limit: 6 });

  const programs = programsData?.programs ?? [];
  const users = (usersData?.data ?? []) as Array<{
    id: string; firstName: string; lastName: string; email: string;
    roleSlug?: string | null; roleName?: string | null; status: string; lastLoginAt?: string | null;
  }>;

  const quickLinks = [
    { label: 'Manage Users', href: '/people', icon: Users },
    { label: 'View Programs', href: '/programs', icon: Layers },
    { label: 'Assessments', href: '/assessments', icon: ClipboardList },
    { label: 'Mentoring', href: '/mentoring', icon: MessageSquare },
    { label: 'Goals', href: '/planning', icon: Target },
    { label: 'Permissions', href: '/settings/permissions', icon: UserCheck },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{dateString}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 lg:mb-8">
        <StatCard
          label="Total Users"
          value={tenantStats?.totalUsers ?? 0}
          icon={Users}
          accent
          sub={`${tenantStats?.usersRemaining ?? '–'} seats remaining`}
          isLoading={statsLoading}
        />
        <StatCard
          label="Active Users"
          value={tenantStats?.activeUsers ?? 0}
          icon={UserCheck}
          sub={tenantStats ? `${Math.round((tenantStats.activeUsers / (tenantStats.totalUsers || 1)) * 100)}% of total` : undefined}
          isLoading={statsLoading}
        />
        <StatCard
          label="Mentoring Sessions"
          value={mentoringStats?.upcomingSessions ?? 0}
          icon={CalendarCheck}
          sub={`${mentoringStats?.pendingActionItems ?? 0} action items pending`}
          isLoading={mentoringLoading}
        />
        <StatCard
          label="Assessments"
          value={assessmentStats?.totalAssessments ?? 0}
          icon={BarChart3}
          sub={`${assessmentStats?.activeAssessments ?? 0} active`}
          isLoading={assessmentLoading}
        />
      </div>

      {/* Programs + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8">
        {/* Programs List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <SectionHeader title="Programs" href="/programs" linkLabel="All programs" />
          {programsLoading ? (
            <SkeletonRows count={4} />
          ) : programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No programs yet.{' '}
              <Link href="/program-builder" className="text-accent hover:underline">Create one</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {programs.map((p) => {
                const prog = p as {
                  id: string; name: string; status: string;
                  enrollmentCount?: number; avgProgress?: number;
                  learnerCount?: number;
                };
                return (
                  <div
                    key={prog.id}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/program-builder/${prog.id}`}
                        className="font-medium text-sm text-sidebar-foreground hover:text-accent transition-colors truncate block"
                      >
                        {prog.name}
                      </Link>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {prog.enrollmentCount ?? prog.learnerCount ?? 0} enrolled
                        </span>
                        {prog.avgProgress != null && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(prog.avgProgress)}% avg progress
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={prog.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links + Mentoring Summary */}
        <div className="space-y-4">
          {/* Quick Links */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-sidebar-foreground mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-all group text-center"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  <span className="text-xs text-sidebar-foreground leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mentoring Summary */}
          {!mentoringLoading && mentoringStats && (
            <div className="bg-card border border-border rounded-xl p-5">
              <SectionHeader title="Mentoring" href="/mentoring" />
              <div className="space-y-2">
                {[
                  { label: 'Active Relationships', value: mentoringStats.activeRelationships, icon: Users },
                  { label: 'Upcoming Sessions', value: mentoringStats.upcomingSessions, icon: CalendarCheck },
                  { label: 'Action Items Due', value: mentoringStats.overdueActionItems, icon: AlertCircle, warn: mentoringStats.overdueActionItems > 0 },
                  { label: 'Completed Sessions', value: mentoringStats.completedSessions, icon: CheckCircle2 },
                ].map(({ label, value, icon: Icon, warn }) => (
                  <div key={label} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${warn ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${warn ? 'text-amber-600' : 'text-sidebar-foreground'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assessments Summary + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        {/* Assessment Stats */}
        {!assessmentLoading && assessmentStats && (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <SectionHeader title="Assessments" href="/assessments" />
            <div className="space-y-3">
              {[
                { label: 'Total', value: assessmentStats.totalAssessments, icon: ClipboardList },
                { label: 'Active', value: assessmentStats.activeAssessments, icon: Clock },
                { label: 'Completed', value: assessmentStats.completedAssessments, icon: CheckCircle2 },
                { label: 'Pending Responses', value: assessmentStats.pendingResponses, icon: AlertCircle, warn: assessmentStats.pendingResponses > 0 },
                { label: 'Avg Response Rate', value: `${Math.round(assessmentStats.averageResponseRate ?? 0)}%`, icon: TrendingUp },
              ].map(({ label, value, icon: Icon, warn }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${warn ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${warn ? 'text-amber-600' : 'text-sidebar-foreground'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Users */}
        <div className={`${assessmentStats ? 'lg:col-span-3' : 'lg:col-span-5'} bg-card border border-border rounded-xl p-5`}>
          <SectionHeader title="Team Members" href="/people" linkLabel="Manage people" />
          {usersLoading ? (
            <SkeletonRows count={5} />
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => {
                const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
                return (
                  <div key={u.id} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-accent flex items-center justify-center text-xs font-medium shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.roleName && (
                        <span className="text-xs text-muted-foreground hidden sm:block">{u.roleName}</span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Agency Dashboard ─────────────────────────────────────────────────────────

function AgencyDashboard() {
  const { user } = useAuth();

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const { data: agencyStats, isLoading: statsLoading } = useAgencyStats();
  const { data: agencyUsers, isLoading: usersLoading } = useAgencyUsers();
  const { data: programsData, isLoading: programsLoading } = useAgencyPrograms({ limit: 6, status: 'active' });
  const { data: tenants, isLoading: tenantsLoading } = useTenants();

  const programs = programsData?.programs ?? [];
  const clientList = (tenants ?? []).slice(0, 6);

  const quickLinks = [
    { label: 'Clients', href: '/agency', icon: Building2 },
    { label: 'Programs', href: '/program-builder', icon: Layers },
    { label: 'Templates', href: '/agency/assessments', icon: ClipboardList },
    { label: 'Team', href: '/agency', icon: Users },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{dateString}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 lg:mb-8">
        <StatCard
          label="Total Clients"
          value={agencyStats?.totalTenants ?? 0}
          icon={Building2}
          accent
          sub={`${agencyStats?.activeTenants ?? 0} active`}
          isLoading={statsLoading}
        />
        <StatCard
          label="Active Clients"
          value={agencyStats?.activeTenants ?? 0}
          icon={CheckCircle2}
          sub={agencyStats ? `${agencyStats.totalTenants - agencyStats.activeTenants} inactive` : undefined}
          isLoading={statsLoading}
        />
        <StatCard
          label="Total Users"
          value={agencyStats?.totalUsers ?? 0}
          icon={Users}
          sub="across all clients"
          isLoading={statsLoading}
        />
        <StatCard
          label="Agency Team"
          value={agencyStats?.agencyUsers ?? 0}
          icon={UserCheck}
          sub="agency staff"
          isLoading={statsLoading}
        />
      </div>

      {/* Programs + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8">
        {/* Active Programs */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <SectionHeader title="Active Programs" href="/program-builder" linkLabel="All programs" />
          {programsLoading ? (
            <SkeletonRows count={4} />
          ) : programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No active programs.{' '}
              <Link href="/program-builder" className="text-accent hover:underline">Create one</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {programs.map((p) => {
                const prog = p as {
                  id: string; name: string; status: string;
                  enrollmentCount?: number; avgProgress?: number;
                  learnerCount?: number; moduleCount?: number;
                };
                const progress = prog.avgProgress ?? 0;
                return (
                  <div key={prog.id} className="py-3">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <Link
                        href={`/program-builder/${prog.id}`}
                        className="font-medium text-sm text-sidebar-foreground hover:text-accent transition-colors truncate"
                      >
                        {prog.name}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {prog.enrollmentCount ?? prog.learnerCount ?? 0} learners
                        </span>
                        <StatusBadge status={prog.status} />
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 w-10 text-right">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-sidebar-foreground mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-all group text-center"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  <span className="text-xs text-sidebar-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Agency Team */}
          {!usersLoading && agencyUsers && agencyUsers.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold text-sidebar-foreground mb-4">Agency Team</h2>
              <div className="space-y-3">
                {agencyUsers.slice(0, 4).map((u) => {
                  const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || 'A';
                  return (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 text-accent flex items-center justify-center text-xs font-medium shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.roleName ?? u.roleSlug}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Tenants */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader title="Client Tenants" href="/agency" linkLabel="Manage clients" />
        {tenantsLoading ? (
          <SkeletonRows count={3} />
        ) : clientList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No clients yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientList.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-accent/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-sidebar-foreground truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {t.userCount ?? 0} users
                    </span>
                    {t.industry && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground truncate">{t.industry}</span>
                      </>
                    )}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Learner Dashboard (unchanged) ───────────────────────────────────────────

function LearnerDashboard() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const { data, isLoading } = useLearnerDashboard(tenantId);

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const actionCount = data
    ? data.upcomingItems.length + data.activeGoals.length + data.pendingApprovals.length
    : 0;

  const stats = [
    { label: 'Points Earned', value: data?.summary.totalPoints.toLocaleString() ?? '0', icon: Trophy, accent: true },
    { label: 'Progress', value: `${data?.summary.overallProgress ?? 0}%`, icon: TrendingUp },
    { label: 'Lessons Done', value: `${data?.summary.lessonsCompleted ?? 0}/${data?.summary.totalLessons ?? 0}`, icon: BookOpen },
    { label: 'Programs', value: String(data?.summary.enrolledPrograms ?? 0), icon: Flame },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
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
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <div className={`text-xl sm:text-2xl ${stat.accent ? 'text-accent' : 'text-sidebar-foreground'}`}>
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>

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

          <Leaderboard />
        </>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const isAgencyUser = !!(user?.agencyId && !user?.tenantId);
  const isLearnerRole = !!user?.roleSlug && LEARNER_ROLES.includes(user.roleSlug) && !user.agencyId;

  if (isAgencyUser) return <AgencyDashboard />;
  if (isLearnerRole) return <LearnerDashboard />;
  return <TenantAdminDashboard />;
}
