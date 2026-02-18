'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useProgram, useMyEnrollment, useLearnerProgress, useEnrollmentGoals } from '@/hooks/api/usePrograms';
import { useTenants } from '@/hooks/api/useTenants';
import type { ModuleProgressData, LessonProgressStatus } from '@/types/programs';
import {
  BookOpen,
  ChevronLeft,
  Award,
  Play,
  Calendar,
  Target,
  ArrowRight,
} from 'lucide-react';
import { StatCard, ModuleProgressTracker } from '@/components/programs';

// ============================================
// Types & Constants
// ============================================

const CONTENT_TYPE_LABELS: Record<string, string> = {
  lesson: 'Reading materials',
  quiz: 'Quizzes',
  assignment: 'Practical assignments',
  mentor_meeting: 'Mentoring sessions',
  text_form: 'Reflection submissions',
  goal: 'Goal setting exercises',
};

const STATUS_CONFIG = {
  active: {
    label: 'IN PROGRESS',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
  },
  draft: {
    label: 'NOT STARTED',
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
  archived: {
    label: 'COMPLETED',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-600',
  },
} as const;

// ============================================
// Loading Skeleton Component
// ============================================

function LoadingSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8" role="status" aria-label="Loading program details">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-6" />
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 bg-muted rounded-xl" />
          <div className="flex-1">
            <div className="h-8 bg-muted rounded w-64 mb-2" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-muted rounded-xl" />
      </div>
      <span className="sr-only">Loading program details...</span>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = params.programId as string;
  const queryTenantId = searchParams.get('tenantId');
  const { user } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(queryTenantId);

  // For agency users, fetch their tenants
  const { data: tenants, isLoading: tenantsLoading } = useTenants();
  const isAgencyUser = user?.agencyId && !user?.tenantId;

  // Use selected tenant for agency users, or user's tenant for tenant users
  const activeTenantId = isAgencyUser ? selectedTenantId : user?.tenantId;

  // Auto-select first tenant for agency users (only if no tenantId from query)
  useEffect(() => {
    if (isAgencyUser && tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isAgencyUser, tenants, selectedTenantId]);

  const { data: program, isLoading, error } = useProgram(activeTenantId || undefined, programId);

  // Get user's enrollment
  const { data: myEnrollment } = useMyEnrollment(
    activeTenantId || undefined,
    programId,
    user?.id
  );

  // Get progress data for the enrollment
  const { data: progressData } = useLearnerProgress(
    activeTenantId || undefined,
    programId,
    myEnrollment?.id
  );

  // Get goals linked to this program via enrollment
  const { data: enrollmentGoals } = useEnrollmentGoals(
    activeTenantId || undefined,
    programId,
    myEnrollment?.id
  );

  const handleContinueLearning = useCallback(() => {
    const tenantParam = activeTenantId ? `?tenantId=${activeTenantId}` : '';
    router.push(`/programs/${programId}/learn${tenantParam}`);
  }, [router, programId, activeTenantId]);

  // Transform modules with progress data
  const modulesWithProgress: ModuleProgressData[] = useMemo(() => {
    if (!program?.modules) return [];

    // Create a map of lesson progress by lessonId
    const lessonProgressMap = new Map<string, LessonProgressStatus>();
    progressData?.lessons?.forEach((lesson) => {
      lessonProgressMap.set(lesson.id, lesson.status);
    });

    let foundInProgress = false;
    const isSequential = program.config?.sequentialAccess !== false;

    return program.modules
      .filter((m) => m.depth === 0) // Only top-level modules
      .sort((a, b) => a.order - b.order)
      .map((module, index) => {
        const lessons = module.lessons || [];
        const lessonsCompleted = lessons.filter(
          (l) => lessonProgressMap.get(l.id) === 'completed'
        ).length;
        const totalLessons = lessons.length;
        const moduleProgress = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

        // Determine module status
        let status: 'completed' | 'in-progress' | 'locked' = 'locked';
        if (lessonsCompleted === totalLessons && totalLessons > 0) {
          status = 'completed';
        } else if (lessonsCompleted > 0 || (index === 0 && !isSequential)) {
          status = 'in-progress';
          foundInProgress = true;
        } else if (!foundInProgress && index === 0) {
          // First module is always unlocked
          status = 'in-progress';
          foundInProgress = true;
        } else if (!isSequential) {
          // Non-sequential: all modules are unlocked
          status = lessonsCompleted > 0 ? 'in-progress' : 'locked';
        } else {
          // Sequential: check if previous module is complete
          const prevModulesComplete = program.modules
            .filter((m) => m.depth === 0 && m.order < module.order)
            .every((m) => {
              const prevLessons = m.lessons || [];
              return prevLessons.every((l) => lessonProgressMap.get(l.id) === 'completed');
            });

          if (prevModulesComplete && !foundInProgress) {
            status = 'in-progress';
            foundInProgress = true;
          }
        }

        return {
          id: module.id,
          number: index + 1,
          title: module.title,
          status,
          lessonsCompleted,
          totalLessons,
          progress: moduleProgress,
          lessons: lessons.map((l) => ({
            id: l.id,
            title: l.title,
            contentType: l.contentType,
            points: l.points,
            durationMinutes: l.durationMinutes,
            status: lessonProgressMap.get(l.id) || 'not_started',
            completed: lessonProgressMap.get(l.id) === 'completed',
          })),
        };
      });
  }, [program?.modules, program?.config?.sequentialAccess, progressData?.lessons]);

  // Calculate stats from real data
  const { totalModules, completedModules, overallProgress, pointsEarned, totalPointsAvailable } = useMemo(() => {
    const total = modulesWithProgress.length || program?.modules?.length || 0;
    const completed = modulesWithProgress.filter((m) => m.status === 'completed').length;
    const currentModule = modulesWithProgress.find((m) => m.status === 'in-progress');
    const progress = progressData?.progress?.percentage ||
      (total > 0 ? Math.round((completed / total) * 100 + (currentModule?.progress || 0) / total) : 0);
    const totalPoints = progressData?.progress?.totalPoints ||
      modulesWithProgress.reduce((sum, m) => sum + m.lessons.reduce((s, l) => s + l.points, 0), 0);
    const earned = progressData?.progress?.pointsEarned || 0;

    return {
      totalModules: total,
      completedModules: completed,
      overallProgress: progress,
      pointsEarned: earned,
      totalPointsAvailable: totalPoints,
    };
  }, [modulesWithProgress, program?.modules?.length, progressData?.progress]);

  // Derive learning outcomes from module titles/descriptions
  const learningOutcomes = useMemo(() => {
    if (!program?.modules) return [];
    return program.modules
      .filter(m => m.depth === 0)
      .sort((a, b) => a.order - b.order)
      .map(m => m.description || m.title)
      .slice(0, 8);
  }, [program?.modules]);

  // Derive program structure from content types with average durations
  const programStructure = useMemo(() => {
    if (!program?.modules) return [];
    const allLessons = program.modules.flatMap(m => m.lessons || []);
    const typeData = new Map<string, { count: number; totalDuration: number }>();
    allLessons.forEach(lesson => {
      const type = lesson.contentType;
      const existing = typeData.get(type) || { count: 0, totalDuration: 0 };
      existing.count += 1;
      existing.totalDuration += lesson.durationMinutes || 0;
      typeData.set(type, existing);
    });
    const items: string[] = [];
    for (const [type, data] of typeData) {
      const label = CONTENT_TYPE_LABELS[type];
      if (!label) continue;
      const avgDuration = data.count > 0 ? Math.round(data.totalDuration / data.count) : 0;
      items.push(avgDuration > 0 ? `${label} (${avgDuration} min)` : label);
    }
    return items;
  }, [program?.modules]);

  // Calculate program duration from dates
  const programDuration = useMemo(() => {
    if (program?.startDate && program?.endDate) {
      const weeks = Math.ceil(
        (new Date(program.endDate).getTime() - new Date(program.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      return `~${weeks} weeks`;
    }
    return null;
  }, [program?.startDate, program?.endDate]);

  // Calculate time remaining
  const { dueDate, weeksRemaining } = useMemo(() => {
    const date = program?.endDate
      ? new Date(program.endDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'No due date';

    const weeks = program?.endDate
      ? Math.max(0, Math.ceil((new Date(program.endDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
      : null;

    return { dueDate: date, weeksRemaining: weeks };
  }, [program?.endDate]);

  // Loading states
  if (isAgencyUser && tenantsLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!activeTenantId) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <p className="text-muted-foreground" role="status">No tenant context available.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !program) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="p-6 bg-red-50 rounded-xl text-red-700 text-center" role="alert">
          Failed to load program. Please try again.
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[program.status] || STATUS_CONFIG.draft;

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group focus:outline-none focus:text-accent"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            Back to Programs
          </Link>
        </nav>

        {/* Program Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 sm:gap-4 mb-3">
                {/* Icon Box */}
                <div
                  className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>

                {/* Title & Meta */}
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1 truncate">
                    {program.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                    <span>{program.type === 'cohort' ? 'Leadership Track' : 'Self-Paced'}</span>
                    <span aria-hidden="true">&bull;</span>
                    <span>{totalModules} Modules</span>
                    {programDuration && (
                      <>
                        <span aria-hidden="true">&bull;</span>
                        <span>{programDuration}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {program.description && (
                <p className="text-muted-foreground max-w-3xl text-sm sm:text-base">
                  {program.description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            <div
              className={`self-start px-4 py-2 ${status.bg} border ${status.border} rounded-lg ${status.text} text-sm font-medium flex-shrink-0`}
              role="status"
              aria-label={`Program status: ${status.label}`}
            >
              {status.label}
            </div>
          </div>
        </header>

        {/* Program Stats */}
        <section className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" aria-label="Program statistics">
          <StatCard
            icon={<Award className="w-4 h-4 text-accent" />}
            label="Total Points"
            value={pointsEarned.toLocaleString()}
            subtext={`of ${totalPointsAvailable.toLocaleString()} available`}
            animationIndex={0}
          />
          <StatCard
            icon={<Play className="w-4 h-4 text-accent" />}
            label="Progress"
            value={`${overallProgress}%`}
            subtext={`${(completedModules + (modulesWithProgress.find(m => m.status === 'in-progress') ? 0.7 : 0)).toFixed(1)} of ${totalModules} modules`}
            animationIndex={1}
          />
          <StatCard
            icon={<Calendar className="w-4 h-4 text-accent" />}
            label="Time Remaining"
            value={weeksRemaining !== null ? `${weeksRemaining} weeks` : 'No deadline'}
            subtext={weeksRemaining !== null ? `Due ${dueDate}` : 'No due date set'}
            animationIndex={2}
          />
          <StatCard
            icon={<Target className="w-4 h-4 text-accent" />}
            label="Linked Goals"
            value={enrollmentGoals?.length || 0}
            subtext="Active connections"
            animationIndex={3}
          />
        </section>

        {/* Module Progress Tracker */}
        <ModuleProgressTracker modules={modulesWithProgress} programName={program.name} onContinue={handleContinueLearning} />

        {/* Program Overview (2-column grid) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8" aria-label="Program overview">
          {/* What You'll Learn */}
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6 transition-all hover:shadow-md animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
              What You'll Learn
            </h2>
            <ul className="space-y-3" aria-label="Learning outcomes">
              {learningOutcomes.map((outcome, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground group">
                  <span
                    className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5"
                    aria-hidden="true"
                  />
                  <span className="group-hover:text-sidebar-foreground transition-colors">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Program Structure */}
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6 transition-all hover:shadow-md animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
              Program Structure
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-sidebar-foreground font-medium mb-3">Each module includes:</div>
                <ul className="space-y-2" aria-label="Module structure">
                  {programStructure.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground group">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" aria-hidden="true" />
                      <span className="group-hover:text-sidebar-foreground transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Estimated Time Commitment</div>
                <div className="text-sm text-sidebar-foreground font-medium">3-4 hours per module</div>
              </div>
            </div>
          </div>
        </section>

        {/* Linked Goals Section */}
        {enrollmentGoals && enrollmentGoals.length > 0 && (
          <section className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">Linked Goals</h2>
              <div className="space-y-3">
                {enrollmentGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-sidebar-foreground truncate">{goal.statement}</div>
                      <div className="text-xs text-muted-foreground">
                        {goal.targetDate
                          ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'No deadline'}{' '}
                        &bull; {goal.status === 'completed' ? 'Completed' : goal.status === 'active' ? 'Active' : 'Draft'} Goal
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-sidebar-foreground">{goal.progress}%</div>
                        <div className="text-xs text-muted-foreground">Progress</div>
                      </div>
                      <Link
                        href={`/planning?goalId=${goal.id}`}
                        className="text-sm text-accent font-medium hover:underline flex items-center gap-1 group"
                      >
                        View Goal
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
