'use client';

import { BookOpen, CheckCircle2, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardEnrollment, DashboardModule } from '@/hooks/api/useLearnerDashboard';

interface ProgramTrackerProps {
  enrollment: DashboardEnrollment | null;
  modules: DashboardModule[];
}

function segmentColor(status: DashboardModule['status']) {
  if (status === 'completed') return 'bg-accent';
  if (status === 'in-progress') return 'bg-accent/40';
  return 'bg-muted';
}

export function ProgramTracker({ enrollment, modules }: ProgramTrackerProps) {
  const router = useRouter();

  if (!enrollment || modules.length === 0) {
    return (
      <div className="h-full p-6 bg-card border border-border rounded-xl text-center flex flex-col items-center justify-center">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sidebar-foreground mb-1">No Active Program</h3>
        <p className="text-sm text-muted-foreground">
          You are not currently enrolled in any programs.
        </p>
      </div>
    );
  }

  const N = modules.length;
  const completedModules = modules.filter((m) => m.status === 'completed').length;
  const currentModule = modules.find((m) => m.status === 'in-progress');
  const currentModuleIndex = modules.findIndex((m) => m.status === 'in-progress');
  const nextModule = currentModuleIndex >= 0 ? modules[currentModuleIndex + 1] : null;

  const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.completedLessons, 0);
  const overallProgress =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : Math.round(enrollment.progress ?? 0);

  const remainingModules = N - completedModules - (currentModule ? 1 : 0);

  return (
    <div className="h-full p-6 bg-card border border-border rounded-xl flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-accent shrink-0" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Current Program</span>
          </div>
          <h3 className="text-sm font-semibold text-sidebar-foreground leading-snug line-clamp-2">
            {enrollment.programName}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-semibold text-sidebar-foreground leading-none mb-1">
            {overallProgress}%
          </div>
          <div className="text-xs text-muted-foreground">complete</div>
        </div>
      </div>

      {/* ── Segmented Module Bar ── */}
      <div className="mb-3">
        {/* Segments */}
        <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-2">
          {modules.map((m) => (
            <div
              key={m.id}
              className={`flex-1 transition-all duration-300 ${segmentColor(m.status)}`}
              title={`${m.title} — ${m.status.replace('-', ' ')}`}
            />
          ))}
        </div>

        {/* Legend row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {completedModules > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-accent" />
                {completedModules} done
              </span>
            )}
            {currentModule && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-accent/40" />
                1 active
              </span>
            )}
            {remainingModules > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-muted border border-border" />
                {remainingModules} ahead
              </span>
            )}
          </div>
          <span>{N} modules total</span>
        </div>
      </div>

      {/* ── Current module detail ── */}
      {currentModule ? (
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-accent font-medium uppercase tracking-wide mb-1">
                Module {currentModuleIndex + 1} · In Progress
              </div>
              <div className="text-sm font-medium text-sidebar-foreground leading-snug">
                {currentModule.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {currentModule.completedLessons} of {currentModule.totalLessons} lessons complete
              </div>
            </div>
            {currentModule.totalLessons > 0 && (
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold text-sidebar-foreground">
                  {Math.round(
                    (currentModule.completedLessons / currentModule.totalLessons) * 100
                  )}%
                </div>
                <div className="text-xs text-muted-foreground">this module</div>
              </div>
            )}
          </div>
          {/* Thin lesson-level bar inside the module card */}
          {currentModule.totalLessons > 0 && (
            <div className="mt-2.5 h-1 bg-accent/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(
                    (currentModule.completedLessons / currentModule.totalLessons) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      ) : completedModules === N ? (
        /* All done state */
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 mb-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <div className="text-sm font-medium text-green-800">Program Complete!</div>
            <div className="text-xs text-green-600 mt-0.5">
              All {N} modules finished · {completedLessons} lessons
            </div>
          </div>
        </div>
      ) : (
        /* Not started state */
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 mb-4">
          <div className="text-sm text-muted-foreground">
            Start with <span className="font-medium text-sidebar-foreground">{modules[0]?.title}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {modules[0]?.totalLessons ?? 0} lessons · Module 1 of {N}
          </div>
        </div>
      )}

      {/* ── Overall lesson progress bar ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Lesson Progress</span>
          <span className="text-xs text-muted-foreground">
            {completedLessons} / {totalLessons} lessons
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: totalLessons > 0 ? `${overallProgress}%` : '0%' }}
          />
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3">
        <div className="min-w-0">
          {nextModule && currentModule ? (
            <>
              <div className="text-xs text-muted-foreground mb-0.5">Up next</div>
              <div className="text-xs text-sidebar-foreground truncate">{nextModule.title}</div>
            </>
          ) : currentModule ? (
            <div className="text-xs text-muted-foreground">Keep going — you&apos;re making progress</div>
          ) : completedModules === N ? (
            <div className="text-xs text-muted-foreground">Review your completed program</div>
          ) : (
            <div className="text-xs text-muted-foreground">Begin your learning journey</div>
          )}
        </div>
        <button
          onClick={() => router.push(`/programs/${enrollment.programId}/learn`)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          {completedModules === N ? 'Review' : currentModule ? 'Continue' : 'Start'}
        </button>
      </div>
    </div>
  );
}
