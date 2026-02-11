'use client';

import { memo, useMemo, useCallback } from 'react';
import { BookOpen, Check, ArrowRight } from 'lucide-react';

interface ModuleProgress {
  id: string;
  number: number;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  lessonsCompleted: number;
  totalLessons: number;
  progress: number;
}

interface ModuleProgressTrackerProps {
  modules: ModuleProgress[];
  programName: string;
  onContinue: () => void;
}

/**
 * Redesigned horizontal module progress tracker component.
 *
 * Layout:
 *  - Header: BookOpen icon + "Current Program" / program name (left), large % (right)
 *  - Horizontal badge timeline with connecting lines
 *  - Full-width progress bar
 *  - "Next Action" section with continue button
 */
export const ModuleProgressTracker = memo(function ModuleProgressTracker({
  modules,
  programName,
  onContinue,
}: ModuleProgressTrackerProps) {
  // ---------- derived data ----------
  const { nextModule, completedCount, totalProgress } = useMemo(() => {
    const current = modules.find((m) => m.status === 'in-progress');
    const completed = modules.filter((m) => m.status === 'completed').length;

    // overall progress: completed modules count fully, in-progress module contributes its own %
    const progress =
      modules.length > 0
        ? Math.round(
            (completed / modules.length) * 100 +
              (current ? current.progress / modules.length : 0),
          )
        : 0;

    // The next module the learner should tackle
    const next = current || modules.find((m) => m.status === 'locked');

    return {
      nextModule: next,
      completedCount: completed,
      totalProgress: Math.min(progress, 100),
    };
  }, [modules]);

  // Width of the accent portion of the connecting line between badges.
  // Spans from the first badge centre to the last completed badge centre.
  const progressLinePercent = useMemo(() => {
    if (modules.length <= 1) return 0;
    return (completedCount / (modules.length - 1)) * 100;
  }, [completedCount, modules.length]);

  const handleContinueClick = useCallback(() => {
    onContinue();
  }, [onContinue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    },
    [onContinue],
  );

  // ---------- render ----------
  return (
    <section
      className="bg-card border border-border rounded-xl p-5 sm:p-6 mb-6 sm:mb-8 animate-fade-in-up"
      style={{ animationDelay: '200ms' }}
      aria-labelledby="module-progress-title"
    >
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-4 mb-6">
        {/* Left: icon + titles */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Current Program
            </p>
            <h3
              id="module-progress-title"
              className="text-base sm:text-lg font-semibold text-sidebar-foreground leading-snug truncate"
            >
              {programName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {modules.length}-Module Leadership Development Program
            </p>
          </div>
        </div>

        {/* Right: large percentage */}
        <div className="flex-shrink-0 text-right">
          <div className="text-3xl font-bold text-sidebar-foreground leading-none">
            {totalProgress}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">Complete</div>
        </div>
      </div>

      {/* ---- Module Badge Timeline ---- */}
      <div
        className="relative mb-5"
        role="progressbar"
        aria-valuenow={totalProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Program progress: ${totalProgress}% complete`}
      >
        {/* Connecting line (gray background) */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-border"
          style={{ top: '26px' }}
          aria-hidden="true"
        />

        {/* Connecting line (accent filled portion) */}
        <div
          className="absolute left-0 h-0.5 bg-accent rounded-full transition-all duration-1000 ease-out"
          style={{ top: '26px', width: `${progressLinePercent}%` }}
          aria-hidden="true"
        />

        {/* Badge nodes */}
        <div className="relative flex justify-between" role="list" aria-label="Module progress nodes">
          {modules.map((mod, idx) => {
            const isCompleted = mod.status === 'completed';
            const isInProgress = mod.status === 'in-progress';

            return (
              <div
                key={mod.id}
                className="flex flex-col items-center animate-fade-in-up"
                style={{
                  width: `${100 / modules.length}%`,
                  animationDelay: `${300 + idx * 50}ms`,
                }}
                role="listitem"
                aria-label={`Module ${mod.number}: ${mod.title} - ${
                  isCompleted ? 'Completed' : isInProgress ? 'In progress' : 'Not started'
                }`}
              >
                {/* Badge circle */}
                <div
                  className={`
                    relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-accent border-2 border-accent'
                        : isInProgress
                          ? 'bg-accent border-4 border-accent/30 shadow-lg shadow-accent/25'
                          : 'bg-muted border-2 border-border'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-accent-foreground" strokeWidth={3} aria-hidden="true" />
                  ) : isInProgress ? (
                    <span className="text-base font-bold text-accent-foreground" aria-hidden="true">
                      {mod.number}
                    </span>
                  ) : (
                    <span className="text-base font-medium text-muted-foreground" aria-hidden="true">
                      {mod.number}
                    </span>
                  )}
                </div>

                {/* Label area below badge */}
                <div className="text-center mt-2 hidden sm:flex flex-col items-center gap-0.5">
                  <span
                    className={`text-[11px] leading-tight max-w-[80px] line-clamp-2 ${
                      isInProgress
                        ? 'text-sidebar-foreground font-semibold'
                        : isCompleted
                          ? 'text-sidebar-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {mod.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {mod.lessonsCompleted}/{mod.totalLessons} tasks
                  </span>
                  {isInProgress && (
                    <span className="mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-semibold leading-none">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Overall Progress Bar ---- */}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-5" aria-hidden="true">
        <div
          className="h-full bg-accent rounded-full transition-all duration-1000 ease-out animate-progress-grow"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* ---- Next Action ---- */}
      {nextModule && (
        <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Next Action
            </p>
            <p className="text-sm text-sidebar-foreground font-medium truncate">
              Complete Module {nextModule.number}: {nextModule.title}
            </p>
          </div>
          <button
            onClick={handleContinueClick}
            onKeyDown={handleKeyDown}
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] flex items-center gap-2 justify-center group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex-shrink-0"
            aria-label="Continue learning from where you left off"
          >
            Continue Learning
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </section>
  );
});

export default ModuleProgressTracker;
