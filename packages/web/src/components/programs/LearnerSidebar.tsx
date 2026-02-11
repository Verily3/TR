'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Clock,
  Lock,
  BookOpen,
  Video,
  Users,
  Lightbulb,
  FileText,
  Target,
  ClipboardList,
  CheckSquare,
  MessageSquare,
  X,
} from 'lucide-react';

// Lesson types
type LessonType = 'reading' | 'video' | 'meeting' | 'submission' | 'assignment' | 'goal' | 'quiz' | 'approval' | 'discussion';

type FilterMode = 'all' | 'remaining';

interface LessonData {
  id: string;
  type: LessonType;
  title: string;
  duration: number;
  points: number;
  completed: boolean;
}

interface ModuleData {
  id: string;
  number: number;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  lessons: LessonData[];
}

interface LearnerSidebarProps {
  programId: string;
  programName: string;
  modules: ModuleData[];
  currentModuleIndex: number;
  currentLessonIndex: number;
  expandedModules: Set<string>;
  isOpen: boolean;
  onClose: () => void;
  onToggleModule: (moduleId: string) => void;
  onSelectLesson: (moduleIndex: number, lessonIndex: number) => void;
}

const lessonIcons: Record<LessonType, typeof BookOpen> = {
  reading: BookOpen,
  video: Video,
  meeting: Users,
  submission: Lightbulb,
  assignment: FileText,
  goal: Target,
  quiz: ClipboardList,
  approval: CheckSquare,
  discussion: MessageSquare,
};

/**
 * Sidebar component for the learner LMS view.
 * Displays course outline with expandable modules and lesson list.
 * Mobile-responsive with drawer pattern.
 */
export const LearnerSidebar = memo(function LearnerSidebar({
  programId,
  programName,
  modules,
  currentModuleIndex,
  currentLessonIndex,
  expandedModules,
  isOpen,
  onClose,
  onToggleModule,
  onSelectLesson,
}: LearnerSidebarProps) {
  void programId; // Keep prop in interface for future use
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const { overallProgress, completedLessons, totalLessons } = useMemo(() => {
    const total = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completed = modules.reduce((acc, m) => acc + m.lessons.filter(l => l.completed).length, 0);
    return {
      overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
      completedLessons: completed,
      totalLessons: total,
    };
  }, [modules]);

  const getModuleStatusIcon = useCallback((status: ModuleData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-accent" aria-hidden="true" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-accent" aria-hidden="true" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />;
    }
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleModuleKeyDown = useCallback((e: React.KeyboardEvent, moduleId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleModule(moduleId);
    }
  }, [onToggleModule]);

  const handleLessonKeyDown = useCallback((
    e: React.KeyboardEvent,
    moduleIndex: number,
    lessonIndex: number
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectLesson(moduleIndex, lessonIndex);
    }
  }, [onSelectLesson]);

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Course navigation"
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/programs"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group focus:outline-none focus:text-accent"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              Back to Programs
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <h2 className="text-sidebar-foreground font-semibold mb-1 truncate">{programName}</h2>
          <p className="text-sm text-muted-foreground">{modules.length}-Module Leadership Program</p>

          {/* Overall Progress */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-sidebar-foreground font-medium">{overallProgress}%</span>
            </div>
            <div
              className="h-1.5 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall progress: ${completedLessons} of ${totalLessons} lessons completed`}
            >
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {([
            { mode: 'all' as FilterMode, label: 'All' },
            { mode: 'remaining' as FilterMode, label: 'Remaining' },
          ]).map((tab) => (
            <button
              key={tab.mode}
              onClick={() => setFilterMode(tab.mode)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                filterMode === tab.mode
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-sidebar-foreground'
              }`}
            >
              {tab.label}
              {tab.mode === 'remaining' && (
                <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  {totalLessons - completedLessons}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Module List */}
        <nav className="flex-1 overflow-y-auto" aria-label="Course modules">
          <ul role="list">
            {modules.map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.id);
              const completedLessonsCount = module.lessons.filter(l => l.completed).length;
              const remainingCount = module.lessons.filter(l => !l.completed).length;
              const progress = Math.round((completedLessonsCount / module.lessons.length) * 100);

              // In "remaining" mode, hide fully completed modules
              if (filterMode === 'remaining' && remainingCount === 0) return null;

              return (
                <li
                  key={module.id}
                  className={`border-b border-border ${module.status === 'in-progress' ? 'bg-muted/30' : ''}`}
                >
                  <button
                    onClick={() => onToggleModule(module.id)}
                    onKeyDown={(e) => handleModuleKeyDown(e, module.id)}
                    disabled={module.status === 'locked'}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-muted/50"
                    aria-expanded={isExpanded}
                    aria-controls={`module-${module.id}-lessons`}
                    aria-label={`Module ${module.number}: ${module.title}. ${completedLessonsCount} of ${module.lessons.length} lessons completed. ${
                      module.status === 'locked' ? 'Locked' : module.status === 'completed' ? 'Completed' : 'In progress'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="mt-0.5">{getModuleStatusIcon(module.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Module {module.number}</div>
                        <div className="text-sm font-medium text-sidebar-foreground mb-1 truncate">{module.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{completedLessonsCount}/{module.lessons.length} complete</span>
                          <span aria-hidden="true">&bull;</span>
                          <span>{progress}%</span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="h-1 bg-muted rounded-full overflow-hidden ml-8"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>

                  {/* Expanded Lesson List */}
                  <ul
                    id={`module-${module.id}-lessons`}
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded && module.status !== 'locked' ? 'max-h-[500px]' : 'max-h-0'
                    }`}
                    role="list"
                    aria-label={`Lessons in Module ${module.number}`}
                  >
                    <li className="bg-muted/20">
                      {module.lessons.map((lesson, lessonIndex) => {
                        // In "remaining" mode, hide completed lessons
                        if (filterMode === 'remaining' && lesson.completed) return null;

                        const LessonIcon = lessonIcons[lesson.type];
                        const isCurrentLesson =
                          moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onSelectLesson(moduleIndex, lessonIndex)}
                            onKeyDown={(e) => handleLessonKeyDown(e, moduleIndex, lessonIndex)}
                            className={`w-full p-3 pl-14 text-left border-t border-border/50 hover:bg-muted/50 transition-all focus:outline-none focus:bg-muted/50 ${
                              isCurrentLesson ? 'bg-accent/10 border-l-2 border-l-accent' : ''
                            }`}
                            aria-current={isCurrentLesson ? 'true' : undefined}
                            aria-label={`${lesson.title}. ${lesson.duration} minutes. ${lesson.points} points. ${
                              lesson.completed ? 'Completed' : 'Not completed'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <LessonIcon
                                className={`w-3.5 h-3.5 ${isCurrentLesson ? 'text-accent' : 'text-muted-foreground'}`}
                                aria-hidden="true"
                              />
                              <span
                                className={`text-xs truncate ${
                                  isCurrentLesson ? 'text-accent font-medium' : 'text-sidebar-foreground'
                                }`}
                              >
                                {lesson.title}
                              </span>
                              {lesson.completed && (
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-accent ml-auto flex-shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-5">
                              <span>{lesson.duration} min</span>
                              <span aria-hidden="true">&bull;</span>
                              <span>{lesson.points} pts</span>
                            </div>
                          </button>
                        );
                      })}
                    </li>
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
});

export default LearnerSidebar;
