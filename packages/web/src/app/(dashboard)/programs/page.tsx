'use client';

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePrograms, useProgram, useLearnerProgress } from '@/hooks/api/usePrograms';
import { useTenants } from '@/hooks/api/useTenants';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  Circle,
  Search,
  Loader2,
} from 'lucide-react';
import { StatCard, ProgramCardSkeleton } from '@/components/programs';
import type { Program, LessonProgressStatus } from '@/types/programs';

// ============================================
// Types & Constants
// ============================================

type FilterId = 'all' | 'in-progress' | 'not-started' | 'completed';

const FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All Programs' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'not-started', label: 'Not Started' },
  { id: 'completed', label: 'Completed' },
];

const STATUS_CONFIG = {
  active: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'IN PROGRESS',
    filterKey: 'in-progress' as FilterId,
    iconBg: 'bg-blue-100',
  },
  draft: {
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    label: 'NOT STARTED',
    filterKey: 'not-started' as FilterId,
    iconBg: 'bg-muted',
  },
  archived: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'COMPLETED',
    filterKey: 'completed' as FilterId,
    iconBg: 'bg-green-100',
  },
} as const;

// ============================================
// Phase Progress Tracker Component
// ============================================

interface Phase {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'not-started';
  modules: {
    id: string;
    name: string;
    lessonsCompleted: number;
    totalLessons: number;
    status: 'completed' | 'in-progress' | 'not-started';
  }[];
}

const PhaseProgressTracker = memo(function PhaseProgressTracker({ phases }: { phases: Phase[] }) {
  const currentPhaseIndex = phases.findIndex(p => p.status === 'in-progress');
  const progressWidth = phases.length > 1
    ? `${(Math.max(0, currentPhaseIndex) / (phases.length - 1)) * 100}%`
    : '0%';

  return (
    <div className="mb-6 p-4 sm:p-5 bg-muted/30 rounded-xl">
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Program Phases</div>
        <div className="text-sm text-sidebar-foreground font-medium">
          Phase {currentPhaseIndex + 1 || 1} of {phases.length}
        </div>
      </div>

      {/* Phase Tracker */}
      <div
        className="relative"
        role="progressbar"
        aria-valuenow={currentPhaseIndex + 1}
        aria-valuemin={1}
        aria-valuemax={phases.length}
        aria-label={`Program phase ${currentPhaseIndex + 1} of ${phases.length}`}
      >
        <div
          className="absolute top-[18px] left-0 right-0 h-0.5 bg-border"
          style={{ marginLeft: '18px', marginRight: '18px' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[18px] left-0 h-0.5 bg-accent transition-all duration-700"
          style={{ marginLeft: '18px', width: `calc(${progressWidth} - 18px)` }}
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between">
          {phases.map((phase, idx) => (
            <div
              key={phase.id}
              className="flex flex-col items-center"
              style={{ flex: 1 }}
            >
              <div
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  phase.status === 'completed'
                    ? 'bg-accent border-2 border-accent shadow-sm'
                    : phase.status === 'in-progress'
                    ? 'bg-accent border-[3px] border-accent/20 shadow-lg shadow-accent/20 scale-110'
                    : 'bg-card border-2 border-border'
                }`}
                aria-label={`Phase ${idx + 1}: ${phase.name} - ${phase.status.replace('-', ' ')}`}
              >
                {phase.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-accent-foreground" aria-hidden="true" />
                ) : phase.status === 'in-progress' ? (
                  <Clock className="w-4 h-4 text-accent-foreground" aria-hidden="true" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="text-center px-1">
                <div
                  className={`text-xs transition-colors ${
                    phase.status === 'not-started'
                      ? 'text-muted-foreground'
                      : phase.status === 'in-progress'
                      ? 'text-sidebar-foreground font-semibold'
                      : 'text-sidebar-foreground'
                  }`}
                >
                  <span className="hidden sm:inline">{phase.name}</span>
                  <span className="sm:hidden">P{idx + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================
// Program Card Component
// ============================================

interface ProgramCardProps {
  program: Program;
  tenantId: string;
  userId: string | undefined;
  animationIndex: number;
}

const ProgramCard = memo(function ProgramCard({ program, tenantId, animationIndex }: ProgramCardProps) {
  const [showCurriculum, setShowCurriculum] = useState(false);
  const config = STATUS_CONFIG[program.status] || STATUS_CONFIG.draft;

  // Real enrollment data from enhanced list API
  const progress = program.myProgress ?? 0;

  const dueDate = program.endDate
    ? new Date(program.endDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No due date';

  // Lazy-load program detail with modules when curriculum is expanded
  const { data: programDetail, isLoading: detailLoading } = useProgram(
    tenantId,
    showCurriculum ? program.id : undefined
  );

  // Lazy-load learner progress for curriculum display
  const { data: progressData } = useLearnerProgress(
    tenantId,
    showCurriculum ? program.id : undefined,
    showCurriculum ? (program.myEnrollmentId ?? undefined) : undefined
  );

  // Build phases from real module + progress data
  const phases: Phase[] = useMemo(() => {
    if (!programDetail?.modules) return [];

    const lessonProgressMap = new Map<string, LessonProgressStatus>();
    if (progressData?.lessons) {
      for (const lp of progressData.lessons) {
        lessonProgressMap.set(lp.id, lp.status as LessonProgressStatus);
      }
    }

    const topModules = programDetail.modules
      .filter(m => m.depth === 0)
      .sort((a, b) => a.order - b.order);

    let prevCompleted = true;
    return topModules.map((mod) => {
      const totalLessons = mod.lessons?.length ?? 0;
      const completedLessons = mod.lessons?.filter(
        l => lessonProgressMap.get(l.id) === 'completed'
      ).length ?? 0;

      let status: 'completed' | 'in-progress' | 'not-started';
      if (totalLessons > 0 && completedLessons === totalLessons) {
        status = 'completed';
      } else if (completedLessons > 0 || prevCompleted) {
        status = 'in-progress';
      } else {
        status = 'not-started';
      }

      prevCompleted = status === 'completed';

      return {
        id: mod.id,
        name: mod.title,
        status,
        modules: [{
          id: mod.id,
          name: `Module ${mod.order}: ${mod.title}`,
          lessonsCompleted: completedLessons,
          totalLessons,
          status,
        }],
      };
    });
  }, [programDetail?.modules, progressData?.lessons]);

  const toggleCurriculum = useCallback(() => {
    setShowCurriculum(prev => !prev);
  }, []);

  const handleCurriculumKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCurriculum();
    }
  }, [toggleCurriculum]);

  const getStatusIcon = useCallback((status: 'completed' | 'in-progress' | 'not-started') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />;
    }
  }, []);

  return (
    <article
      className={`bg-card border ${config.border} rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-lg group animate-fade-in-up`}
      style={{ animationDelay: `${100 + animationIndex * 50}ms` }}
      aria-labelledby={`program-${program.id}-title`}
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}
                aria-hidden="true"
              >
                <BookOpen className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="min-w-0">
                <h3 id={`program-${program.id}-title`} className="text-sidebar-foreground font-medium truncate">
                  {program.name}
                </h3>
                <div className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs mt-1">
                  {program.type === 'cohort' ? 'Leadership Track' : 'Self-Paced'}
                </div>
              </div>
            </div>
            {program.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
            )}
          </div>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color} flex-shrink-0`}
            role="status"
          >
            {config.label}
          </div>
        </header>

        {/* Progress Bar */}
        {program.status !== 'draft' && program.myEnrollmentId && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-sidebar-foreground font-medium tabular-nums">{progress}%</span>
            </div>
            <div
              className="h-2 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Program progress: ${progress}% complete`}
            >
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full animate-progress-grow"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Next Action */}
        {program.myEnrollmentStatus === 'active' && progress > 0 && progress < 100 && (
          <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg transition-all hover:bg-blue-100/50">
            <div className="text-xs text-blue-600 font-medium mb-1">Next Action</div>
            <div className="text-sm text-sidebar-foreground">
              Continue where you left off ({progress}% complete)
            </div>
          </div>
        )}

        {/* Due Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Due: {dueDate}</span>
          {program.myRole && (
            <span className="capitalize">{program.myRole}</span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex gap-3 mb-4">
          <Link
            href={`/programs/${program.id}?tenantId=${tenantId}`}
            className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-md active:scale-[0.98] text-center focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {!program.myEnrollmentId
              ? 'View Program'
              : program.myEnrollmentStatus === 'completed'
              ? 'Review Program'
              : progress > 0
              ? 'Continue Program'
              : 'Start Program'}
          </Link>
        </div>

        {/* Expand Button */}
        <button
          className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-all pt-4 border-t border-border focus:outline-none focus:text-accent/80"
          onClick={toggleCurriculum}
          onKeyDown={handleCurriculumKeyDown}
          aria-expanded={showCurriculum}
          aria-controls={`program-${program.id}-curriculum`}
        >
          <span>{showCurriculum ? 'Hide Curriculum' : 'View Curriculum'}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${showCurriculum ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Expanded Curriculum */}
      <div
        id={`program-${program.id}-curriculum`}
        className={`border-t border-border bg-muted/20 overflow-hidden transition-all duration-500 ease-in-out ${
          showCurriculum ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!showCurriculum}
      >
        <div className="p-5 sm:p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <span className="sr-only">Loading curriculum...</span>
            </div>
          ) : phases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No curriculum available yet.</p>
          ) : (
            <>
              <PhaseProgressTracker phases={phases} />

              <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Curriculum Structure</div>

              <div className="space-y-3" role="list" aria-label="Program curriculum">
                {phases.map((phase) => (
                  <div key={phase.id} className="bg-card border border-border rounded-xl overflow-hidden" role="listitem">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(phase.status)}
                        <div>
                          <div className="text-sm text-sidebar-foreground font-medium mb-0.5">{phase.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {phase.modules.filter(m => m.status === 'completed').length} of {phase.modules.length} modules completed
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modules */}
                    <ul className="px-4 pb-4 space-y-2" role="list" aria-label={`Modules in ${phase.name}`}>
                      {phase.modules.map((module) => (
                        <li key={module.id} className="pl-7 py-2 border-l-2 border-border ml-2">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(module.status)}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-sidebar-foreground truncate">{module.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {module.lessonsCompleted} of {module.totalLessons} lessons
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
});

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  searchQuery: string;
  activeFilter: FilterId;
  onClearFilters: () => void;
}

const EmptyState = memo(function EmptyState({ searchQuery, activeFilter, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-16" role="status">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4" aria-hidden="true">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-sidebar-foreground mb-2">No programs found</h3>
      <p className="text-muted-foreground mb-4">
        {searchQuery ? 'Try adjusting your search or filter' : 'No programs match the selected filter'}
      </p>
      {activeFilter !== 'all' && (
        <button
          onClick={onClearFilters}
          className="text-accent hover:text-accent/80 text-sm font-medium focus:outline-none focus:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
});

// ============================================
// Main Page Component
// ============================================

export default function ProgramsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // For agency users, fetch their tenants
  const { data: tenants, isLoading: tenantsLoading } = useTenants();
  const isAgencyUser = user?.agencyId && !user?.tenantId;

  // Use selected tenant for agency users, or user's tenant for tenant users
  const activeTenantId = isAgencyUser ? selectedTenantId : user?.tenantId;

  // Auto-select first tenant for agency users
  useEffect(() => {
    if (isAgencyUser && tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isAgencyUser, tenants, selectedTenantId]);

  const { data, isLoading, error } = usePrograms(activeTenantId || undefined);

  // Calculate stats
  const stats = useMemo(() => {
    const programs = data?.programs || [];
    return {
      total: programs.length,
      inProgress: programs.filter((p) => p.status === 'active').length,
      completed: programs.filter((p) => p.status === 'archived').length,
      notStarted: programs.filter((p) => p.status === 'draft').length,
    };
  }, [data?.programs]);

  // Filter programs
  const filteredPrograms = useMemo(() => {
    let programs = data?.programs || [];

    // Apply status filter
    if (activeFilter !== 'all') {
      programs = programs.filter((p) => {
        const config = STATUS_CONFIG[p.status];
        return config?.filterKey === activeFilter;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      programs = programs.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    return programs;
  }, [data?.programs, activeFilter, searchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleTenantChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTenantId(e.target.value);
  }, []);

  const handleFilterChange = useCallback((filterId: FilterId) => {
    setActiveFilter(filterId);
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilter('all');
    setSearchQuery('');
  }, []);

  // Loading states
  if (isAgencyUser && tenantsLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" aria-hidden="true"></div>
        <span className="sr-only">Loading tenants...</span>
      </div>
    );
  }

  if (isAgencyUser && (!tenants || tenants.length === 0)) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <p className="text-muted-foreground" role="status">No client tenants found.</p>
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

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1 sm:mb-2">Programs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Structured learning paths to develop capabilities and drive results
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tenant selector for agency users */}
          {isAgencyUser && tenants && tenants.length > 0 && (
            <label className="sr-only" htmlFor="tenant-select">Select tenant</label>
          )}
          {isAgencyUser && tenants && tenants.length > 0 && (
            <select
              id="tenant-select"
              value={selectedTenantId || ''}
              onChange={handleTenantChange}
              className="px-3 sm:px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          )}
          <Link
            href={isAgencyUser ? '/program-builder' : '/programs/new'}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-md active:scale-[0.98] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {isAgencyUser ? (
              <span>Program Builder</span>
            ) : (
              <>
                <span className="hidden sm:inline">New Program</span>
                <span className="sm:hidden">New</span>
              </>
            )}
          </Link>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" aria-label="Program statistics">
        <StatCard label="Total Programs" value={stats.total} animationIndex={0} />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          borderColor="border-blue-200"
          valueColor="text-blue-600"
          animationIndex={1}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          borderColor="border-green-200"
          valueColor="text-green-600"
          animationIndex={2}
        />
        <StatCard
          label="Not Started"
          value={stats.notStarted}
          valueColor="text-muted-foreground"
          animationIndex={3}
        />
      </section>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <label htmlFor="program-search" className="sr-only">Search programs</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            id="program-search"
            type="search"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg overflow-x-auto" role="tablist" aria-label="Filter programs by status">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              role="tab"
              aria-selected={activeFilter === option.id}
              aria-controls="programs-list"
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset ${
                activeFilter === option.id
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-background'
              }`}
              onClick={() => handleFilterChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:block flex-1" aria-hidden="true" />

        <div className="text-sm text-muted-foreground text-center sm:text-right" role="status" aria-live="polite">
          Showing {filteredPrograms.length} of {stats.total} programs
        </div>
      </div>

      {/* Programs List */}
      <section id="programs-list" aria-label="Programs list">
        {isLoading || (isAgencyUser && !activeTenantId) ? (
          <div className="grid gap-4" role="status" aria-label="Loading programs">
            <ProgramCardSkeleton />
            <ProgramCardSkeleton />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-xl text-red-700 text-center" role="alert">
            Failed to load programs. Please try again.
          </div>
        ) : filteredPrograms.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div className="grid gap-4">
            {filteredPrograms.map((program, index) => (
              <ProgramCard key={program.id} program={program} tenantId={activeTenantId} userId={user?.id} animationIndex={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
