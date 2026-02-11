'use client';

import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardEnrollment, DashboardModule } from '@/hooks/api/useLearnerDashboard';

interface ProgramTrackerProps {
  enrollment: DashboardEnrollment | null;
  modules: DashboardModule[];
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

  const completedModules = modules.filter((m) => m.status === 'completed').length;
  const currentModule = modules.find((m) => m.status === 'in-progress');
  const totalTasks = modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const completedTasks = modules.reduce((sum, m) => sum + m.completedLessons, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : enrollment.progress;

  const currentModuleIndex = modules.findIndex((m) => m.status === 'in-progress');
  const progressLinePercent =
    currentModuleIndex >= 0
      ? ((currentModuleIndex + 0.5) / (modules.length - 1)) * 100
      : modules.length > 1
      ? (completedModules / (modules.length - 1)) * 100
      : 0;

  return (
    <div className="h-full p-6 bg-card border border-border rounded-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <h3 className="text-sidebar-foreground">Current Program</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{enrollment.programName}</p>
          <p className="text-xs text-muted-foreground">
            {modules.length}-Module Program
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl text-sidebar-foreground mb-1">{overallProgress}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Module Progress Tracker - hidden on mobile, shown on sm+ */}
      <div className="relative mb-6 hidden sm:block">
        {/* Background Line */}
        <div
          className="absolute top-[26px] left-0 right-0 h-0.5 bg-border"
          style={{ marginLeft: '20px', marginRight: '20px' }}
        />
        {/* Active Progress Line */}
        <div
          className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500"
          style={{
            marginLeft: '20px',
            width: `calc(${progressLinePercent}% - 20px)`,
          }}
        />

        {/* Modules */}
        <div className="relative flex items-start justify-between">
          {modules.map((module, idx) => (
            <div
              key={module.id}
              className="flex flex-col items-center"
              style={{ width: '80px' }}
            >
              <div
                className={`relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all ${
                  module.status === 'completed'
                    ? 'bg-accent border-2 border-accent'
                    : module.status === 'in-progress'
                    ? 'bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20'
                    : 'bg-muted border-2 border-border'
                }`}
              >
                {module.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                ) : (
                  <div
                    className={`text-lg ${
                      module.status === 'in-progress'
                        ? 'text-accent-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </div>
                )}
              </div>

              <div className="text-center">
                <div
                  className={`text-xs mb-1 line-clamp-2 ${
                    module.status === 'in-progress'
                      ? 'text-sidebar-foreground font-medium'
                      : module.status === 'completed'
                      ? 'text-sidebar-foreground'
                      : 'text-muted-foreground'
                  }`}
                  style={{ minHeight: '32px' }}
                >
                  {module.title}
                </div>
                {module.status !== 'not-started' && (
                  <div className="text-xs text-muted-foreground">
                    {module.completedLessons}/{module.totalLessons} tasks
                  </div>
                )}
                {module.status === 'in-progress' && (
                  <div className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
                    In Progress
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Simple progress list */}
      <div className="sm:hidden mb-6 space-y-2">
        {modules.map((module, idx) => (
          <div key={module.id} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                module.status === 'completed'
                  ? 'bg-accent text-accent-foreground'
                  : module.status === 'in-progress'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {module.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                idx + 1
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{module.title}</div>
              {module.status !== 'not-started' && (
                <div className="text-xs text-muted-foreground">
                  {module.completedLessons}/{module.totalLessons} tasks
                </div>
              )}
            </div>
            {module.status === 'in-progress' && (
              <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs shrink-0">
                Current
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Next Action Footer */}
      {currentModule && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground mb-1">NEXT ACTION</div>
            <div className="text-sm text-sidebar-foreground">
              Continue: {currentModule.title}
            </div>
          </div>
          <button
            onClick={() => router.push(`/programs/${enrollment.programId}/learn`)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
          >
            Continue Learning
          </button>
        </div>
      )}
    </div>
  );
}
