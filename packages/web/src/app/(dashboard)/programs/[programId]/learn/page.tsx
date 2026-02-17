'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  useProgram,
  useMyEnrollment,
  useLearnerProgress,
  useCompleteLesson,
  useCompleteTask,
  useTaskProgress,
  useLessonDiscussions,
  useCreateDiscussionPost,
} from '@/hooks/api/usePrograms';
import { useTenants } from '@/hooks/api/useTenants';
import { getEmbedUrl, getVideoProvider } from '@/lib/video-utils';
import type { ContentType, LessonContent, LessonProgressStatus, ApprovalRequired, EnrollmentRole, DiscussionPost, EventConfig, LessonTask, TaskWithProgress } from '@/types/programs';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Menu,
  FileText,
  ExternalLink,
  ClipboardCheck,
  Download,
  Video as VideoIcon,
  Table2,
} from 'lucide-react';
import {
  LearnerSidebar,
  CompletionModal,
  ReadingContent,
  VideoContent,
  SubmissionContent,
  AssignmentContent,
  GoalContent,
  QuizContent,
  DiscussionContent,
  EventContent,
  TaskList,
} from '@/components/programs';

// ============================================
// Types & Constants
// ============================================

type LessonType = 'reading' | 'video' | 'submission' | 'assignment' | 'goal' | 'quiz' | 'discussion';

interface LessonData {
  id: string;
  type: LessonType;
  contentType: ContentType;
  title: string;
  duration: number;
  points: number;
  completed: boolean;
  content: LessonContent;
  approvalRequired: ApprovalRequired;
  tasks: LessonTask[];
}

interface ModuleData {
  id: string;
  number: number;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  lessons: LessonData[];
  isEvent?: boolean;
  eventConfig?: EventConfig;
}

// Resolve role-specific content based on enrollment role
const resolveContent = (content: LessonContent, role?: EnrollmentRole): LessonContent => {
  if (content.contentMode === 'role-specific' && role && content.roleContent) {
    return content.roleContent[role] || content;
  }
  return content;
};

// Map content types to lesson types for the UI
const contentTypeToLessonType = (contentType: ContentType, content?: LessonContent): LessonType => {
  switch (contentType) {
    case 'lesson':
      return content?.videoUrl ? 'video' : 'reading';
    case 'quiz':
      return 'quiz';
    case 'assignment':
      return 'assignment';
    case 'text_form':
      return content?.enableDiscussion ? 'discussion' : 'submission';
    case 'goal':
      return 'goal';
    default:
      return 'reading';
  }
};

// ============================================
// Lesson Content Renderer
// ============================================

interface LessonContentRendererProps {
  lessonType: LessonType;
  contentType: ContentType;
  moduleNumber: number;
  moduleTitle: string;
  content: LessonContent;
  lessonTitle: string;
  durationMinutes?: number;
  // Discussion props
  discussionPosts?: DiscussionPost[];
  isLoadingDiscussions?: boolean;
  currentUserId?: string;
  onSubmitDiscussion?: (content: string) => void;
  isSubmittingDiscussion?: boolean;
}

function LessonContentRenderer({
  lessonType,
  contentType,
  moduleNumber,
  moduleTitle,
  content,
  lessonTitle,
  durationMinutes,
  discussionPosts,
  isLoadingDiscussions,
  currentUserId,
  onSubmitDiscussion,
  isSubmittingDiscussion,
}: LessonContentRendererProps) {
  switch (lessonType) {
    case 'reading':
      return (
        <ReadingContent
          moduleNumber={moduleNumber}
          moduleTitle={moduleTitle}
          content={content}
        />
      );
    case 'video':
      return <VideoContent content={content} durationMinutes={durationMinutes} />;
    case 'submission':
      return (
        <SubmissionContent
          title={lessonTitle}
          introduction={content.introduction}
          description={content.formPrompt || content.instructions}
          reflectionPrompts={content.reflectionPrompts}
          minCharacters={content.minLength}
          maxCharacters={content.maxLength}
        />
      );
    case 'assignment':
      return (
        <AssignmentContent
          title={lessonTitle}
          introduction={content.introduction}
          description={content.instructions}
          questions={content.questions?.map((q, i) => ({
            question: q,
            hint: content.reflectionPrompts?.[i] || '',
          }))}
        />
      );
    case 'goal':
      return (
        <GoalContent
          content={content}
          lessonTitle={lessonTitle}
        />
      );
    case 'quiz':
      return (
        <QuizContent
          content={content}
          lessonTitle={lessonTitle}
        />
      );
    case 'discussion':
      return (
        <DiscussionContent
          lessonTitle={lessonTitle}
          prompt={content.formPrompt || content.instructions}
          minCharacters={content.minLength}
          posts={discussionPosts || []}
          isLoading={isLoadingDiscussions}
          currentUserId={currentUserId}
          onSubmit={onSubmitDiscussion || (() => {})}
          isSubmitting={isSubmittingDiscussion}
        />
      );
    default:
      return null;
  }
}

// ============================================
// Main Page Component
// ============================================

export default function ModuleViewLMS() {
  const params = useParams();
  const searchParams = useSearchParams();
  const programId = params.programId as string;
  const queryTenantId = searchParams.get('tenantId');
  const queryPreviewRole = searchParams.get('previewRole') as EnrollmentRole | null;
  const { user } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(queryTenantId);

  // Current module/lesson state
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initializedRef = useRef(false);

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

  const { data: program, isLoading } = useProgram(activeTenantId || undefined, programId);

  // Get user's enrollment
  const { data: myEnrollment } = useMyEnrollment(
    activeTenantId || undefined,
    programId,
    user?.id
  );

  // Get progress data
  const { data: progressData, refetch: refetchProgress } = useLearnerProgress(
    activeTenantId || undefined,
    programId,
    myEnrollment?.id
  );

  // Complete lesson mutation
  const completeLessonMutation = useCompleteLesson(activeTenantId || undefined, programId);

  // Task completion and progress
  const completeTaskMutation = useCompleteTask(activeTenantId || undefined, programId);
  const { data: taskProgressData, refetch: refetchTaskProgress } = useTaskProgress(
    activeTenantId || undefined,
    programId,
    myEnrollment?.id
  );

  // User's enrollment role for visibility filtering (previewRole overrides for builder preview)
  const userRole = queryPreviewRole || (myEnrollment?.role as EnrollmentRole | undefined);


  // Transform API data to ModuleData format
  const modulesData: ModuleData[] = useMemo(() => {
    if (!program?.modules) return [];

    // Create progress map
    const lessonProgressMap = new Map<string, LessonProgressStatus>();
    progressData?.lessons?.forEach((lesson) => {
      lessonProgressMap.set(lesson.id, lesson.status);
    });

    let foundInProgress = false;
    // In preview mode or when user has no enrollment (admin/builder viewing), unlock all modules
    const isPreview = !!queryPreviewRole || !myEnrollment;
    const isSequential = !isPreview && program.config?.sequentialAccess !== false;

    return program.modules
      .filter((m) => m.depth === 0) // Only top-level modules
      .sort((a, b) => a.order - b.order)
      .map((module, index) => {
        const isEvent = module.type === 'event';

        // Events don't have lessons — they render event content directly
        if (isEvent) {
          return {
            id: module.id,
            number: index + 1,
            title: module.title,
            status: 'in-progress' as const,
            lessons: [],
            isEvent: true,
            eventConfig: module.eventConfig || undefined,
          };
        }

        const allLessons = (module.lessons || []).sort((a, b) => a.order - b.order);

        // Filter lessons by role visibility
        const lessons = allLessons.filter((l) => {
          if (!userRole) return true; // Show all if no enrollment role (admin viewing)
          const vis = l.visibleTo;
          if (!vis) return true; // No visibility settings = visible to all
          return vis[userRole] !== false;
        });

        const lessonsCompleted = lessons.filter(
          (l) => lessonProgressMap.get(l.id) === 'completed'
        ).length;
        const totalLessons = lessons.length;

        // Determine module status
        let status: 'completed' | 'in-progress' | 'locked' = 'locked';
        if (lessonsCompleted === totalLessons && totalLessons > 0) {
          status = 'completed';
        } else if (lessonsCompleted > 0) {
          status = 'in-progress';
          foundInProgress = true;
        } else if (!foundInProgress && index === 0) {
          status = 'in-progress';
          foundInProgress = true;
        } else if (!isSequential) {
          status = 'in-progress';
        } else {
          // Sequential: check if previous modules are complete
          const allPrevComplete = program.modules
            .filter((m) => m.depth === 0 && m.order < module.order)
            .every((m) => {
              const prevLessons = m.lessons || [];
              return prevLessons.every((l) => lessonProgressMap.get(l.id) === 'completed');
            });

          if (allPrevComplete && !foundInProgress) {
            status = 'in-progress';
            foundInProgress = true;
          }
        }

        return {
          id: module.id,
          number: index + 1,
          title: module.title,
          status,
          lessons: lessons.map((l) => {
            const rawContent = (l.content as LessonContent) || {};
            const resolved = resolveContent(rawContent, userRole);
            return {
              id: l.id,
              type: contentTypeToLessonType(l.contentType, resolved),
              contentType: l.contentType,
              title: l.title,
              duration: l.durationMinutes || 15,
              points: l.points,
              completed: lessonProgressMap.get(l.id) === 'completed',
              content: resolved,
              approvalRequired: l.approvalRequired || 'none',
              tasks: l.tasks || [],
            };
          }),
        };
      });
  }, [program?.modules, program?.config?.sequentialAccess, progressData?.lessons, userRole, myEnrollment, queryPreviewRole]);

  // Find the first incomplete lesson and set initial state (only once)
  useEffect(() => {
    if (modulesData.length > 0 && !initializedRef.current) {
      initializedRef.current = true;

      // Find the first in-progress module
      const inProgressIndex = modulesData.findIndex((m) => m.status === 'in-progress');
      const moduleIdx = inProgressIndex >= 0 ? inProgressIndex : 0;
      const module = modulesData[moduleIdx];

      // Find the first incomplete lesson in that module
      const incompleteLessonIdx = module?.lessons.findIndex((l) => !l.completed) ?? 0;
      const lessonIdx = incompleteLessonIdx >= 0 ? incompleteLessonIdx : 0;

      setCurrentModuleIndex(moduleIdx);
      setCurrentLessonIndex(lessonIdx);
      setExpandedModules(new Set([module?.id || '']));
    }
  }, [modulesData]);

  const currentModule = modulesData[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];

  // Determine if current lesson is discussion type
  const isDiscussionLesson = currentLesson?.type === 'discussion';

  // Discussion data
  const { data: discussionPosts, isLoading: isLoadingDiscussions } = useLessonDiscussions(
    activeTenantId || undefined,
    programId,
    isDiscussionLesson ? currentLesson?.id : undefined
  );
  const createDiscussionMutation = useCreateDiscussionPost(activeTenantId || undefined, programId);

  const handleSubmitDiscussion = useCallback((content: string) => {
    if (!currentLesson) return;
    createDiscussionMutation.mutate({ lessonId: currentLesson.id, content });
  }, [currentLesson, createDiscussionMutation]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      await completeTaskMutation.mutateAsync({ taskId });
      await refetchTaskProgress();
      await refetchProgress();
    } catch {
      // Error handled by mutation state
    }
  }, [completeTaskMutation, refetchTaskProgress, refetchProgress]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentModuleIndex, currentLessonIndex]);

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  const selectLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    const module = modulesData[moduleIndex];
    if (!module || module.status === 'locked') return;
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setExpandedModules((prev) => new Set([...prev, module.id]));
  }, [modulesData]);

  const goToPrevious = useCallback(() => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      const prevModule = modulesData[currentModuleIndex - 1];
      if (prevModule && prevModule.status !== 'locked') {
        setCurrentModuleIndex(currentModuleIndex - 1);
        setCurrentLessonIndex(prevModule.lessons.length - 1);
      }
    }
  }, [currentLessonIndex, currentModuleIndex, modulesData]);

  const goToNext = useCallback(() => {
    if (!currentModule) return;
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < modulesData.length - 1) {
      const nextModule = modulesData[currentModuleIndex + 1];
      if (nextModule && nextModule.status !== 'locked') {
        setCurrentModuleIndex(currentModuleIndex + 1);
        setCurrentLessonIndex(0);
      }
    }
  }, [currentLessonIndex, currentModule, currentModuleIndex, modulesData]);

  const handleMarkComplete = useCallback(() => {
    setShowCompleteModal(true);
  }, []);

  const confirmComplete = useCallback(async () => {
    if (!currentLesson) return;

    try {
      await completeLessonMutation.mutateAsync({ lessonId: currentLesson.id });
      await refetchProgress();
      setShowCompleteModal(false);
      goToNext();
    } catch {
      // Error handling - mutation will show error state
      setShowCompleteModal(false);
    }
  }, [currentLesson, completeLessonMutation, refetchProgress, goToNext]);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleCancelComplete = useCallback(() => {
    setShowCompleteModal(false);
  }, []);

  const isFirstLesson = currentModuleIndex === 0 && currentLessonIndex === 0;
  const isLastLesson = useMemo(() => {
    return (
      currentModuleIndex === modulesData.length - 1 &&
      currentLessonIndex === (currentModule?.lessons.length ?? 0) - 1
    );
  }, [currentModuleIndex, currentLessonIndex, currentModule?.lessons.length, modulesData.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft' && !isFirstLesson) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && !isLastLesson) {
        if (currentLesson?.completed) {
          goToNext();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFirstLesson, isLastLesson, currentLesson?.completed, goToPrevious, goToNext]);

  // Loading states
  if (isAgencyUser && tenantsLoading) {
    return (
      <div className="flex h-screen items-center justify-center" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!activeTenantId || isLoading || modulesData.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" aria-hidden="true"></div>
        <span className="sr-only">Loading lesson content...</span>
      </div>
    );
  }

  // Safety check for current module
  if (!currentModule) {
    return (
      <div className="flex h-screen items-center justify-center" role="status">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No lessons available in this program yet.</p>
          <a href={`/programs/${programId}`} className="text-accent hover:underline">
            Back to Program
          </a>
        </div>
      </div>
    );
  }

  // Check if current module is an event
  const isEventView = currentModule.isEvent;
  const hasTasks = currentLesson?.tasks && currentLesson.tasks.length > 0;

  // Safety check: non-event modules need a current lesson
  if (!isEventView && !currentLesson) {
    return (
      <div className="flex h-screen items-center justify-center" role="status">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No lessons available in this module.</p>
          <a href={`/programs/${programId}`} className="text-accent hover:underline">
            Back to Program
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Learner Sidebar */}
      <LearnerSidebar
        programId={programId}
        programName={program?.name || 'Program'}
        modules={modulesData}
        currentModuleIndex={currentModuleIndex}
        currentLessonIndex={currentLessonIndex}
        expandedModules={expandedModules}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onToggleModule={toggleModule}
        onSelectLesson={selectLesson}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Role Banner */}
        {queryPreviewRole && (
          <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2 text-center">
            <span className="text-xs font-medium text-amber-800">
              Preview Mode: Viewing as <span className="capitalize">{queryPreviewRole}</span>
            </span>
          </div>
        )}

        {/* Top Navigation Bar */}
        <header className="flex-shrink-0 border-b border-border bg-card px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu button */}
              <button
                onClick={handleOpenSidebar}
                className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent flex-shrink-0"
                aria-label="Open course navigation menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                {isEventView ? (
                  <div className="text-xs text-blue-600 font-medium mb-0.5">Program Event</div>
                ) : (
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Module {currentModule?.number} &bull; Lesson {currentLessonIndex + 1} of {currentModule?.lessons.length}
                  </div>
                )}
                <h1 className="text-sm sm:text-base font-semibold text-sidebar-foreground truncate">
                  {isEventView ? currentModule.title : currentLesson?.title}
                </h1>
              </div>
            </div>
            {!isEventView && (
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Points Badge */}
                <div
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-accent rounded-full"
                  role="status"
                  aria-label={`${currentLesson?.points} points available for this lesson`}
                >
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-foreground" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-medium text-accent-foreground">{currentLesson?.points} points</span>
                </div>

                {/* Completed Badge */}
                {currentLesson?.completed && (
                  <div
                    className="flex items-center gap-1.5 text-sm text-accent font-medium"
                    role="status"
                    aria-label="Lesson completed"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Done</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Event Content */}
            {isEventView && currentModule.eventConfig && (
              <EventContent
                title={currentModule.title}
                eventConfig={currentModule.eventConfig}
              />
            )}

            {/* Lesson Content */}
            {!isEventView && currentLesson && currentModule && (
              <LessonContentRenderer
                lessonType={currentLesson.type}
                contentType={currentLesson.contentType}
                moduleNumber={currentModule.number}
                moduleTitle={currentModule.title}
                content={currentLesson.content}
                lessonTitle={currentLesson.title}
                durationMinutes={currentLesson.duration}
                discussionPosts={discussionPosts || []}
                isLoadingDiscussions={isLoadingDiscussions}
                currentUserId={user?.id}
                onSubmitDiscussion={handleSubmitDiscussion}
                isSubmittingDiscussion={createDiscussionMutation.isPending}
              />
            )}

            {/* Tasks Section (new task-based system) */}
            {!isEventView && hasTasks && currentLesson && (
              <TaskList
                tasks={currentLesson.tasks}
                taskProgress={taskProgressData as TaskWithProgress[] | undefined}
                onCompleteTask={handleCompleteTask}
                isCompleting={completeTaskMutation.isPending}
              />
            )}

            {/* Legacy Task Section (old single-task-in-content approach) */}
            {!isEventView && !hasTasks && currentLesson?.content?.taskTitle && (
              <div className="mt-8 p-5 sm:p-6 bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/30 rounded-xl">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <ClipboardCheck className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sidebar-foreground font-semibold mb-1">{currentLesson.content.taskTitle}</h4>
                    {currentLesson.content.taskDescription && (
                      <p className="text-muted-foreground text-sm">{currentLesson.content.taskDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Resources Section */}
            {currentLesson?.content?.resources && currentLesson.content.resources.length > 0 && (
              <div className="mt-8">
                <h4 className="text-base font-semibold text-sidebar-foreground mb-3">Resources &amp; Attachments</h4>
                <div className="space-y-2">
                  {currentLesson.content.resources.map((resource, index) => {
                    // Video resources render as inline embeds, not download links
                    if (resource.type === 'video' && resource.url) {
                      const embedUrl = getEmbedUrl(resource.url);
                      const provider = getVideoProvider(resource.url);
                      return (
                        <div key={index} className="rounded-xl overflow-hidden border border-border">
                          {embedUrl && provider ? (
                            <>
                              <div className="aspect-video bg-black">
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={resource.title || 'Video resource'}
                                />
                              </div>
                              <div className="px-4 py-2.5 bg-card border-t border-border flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                  <VideoIcon className="w-3.5 h-3.5 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {resource.title || 'Video'}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">{provider}</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-sm text-muted-foreground">
                              Could not load video: {resource.url}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // All other resource types render as links
                    const iconMap: Record<string, typeof FileText> = {
                      pdf: FileText,
                      doc: FileText,
                      link: ExternalLink,
                      spreadsheet: Table2,
                    };
                    const ResourceIcon = iconMap[resource.type || 'link'] || ExternalLink;
                    const typeColors: Record<string, string> = {
                      pdf: 'bg-red-50 text-red-600',
                      doc: 'bg-blue-50 text-blue-600',
                      link: 'bg-gray-100 text-gray-600',
                      spreadsheet: 'bg-green-50 text-green-600',
                    };
                    const colorClass = typeColors[resource.type || 'link'] || typeColors.link;

                    return (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 sm:p-4 bg-card border border-border rounded-xl hover:border-accent/30 hover:shadow-sm transition-all group"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <ResourceIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sidebar-foreground truncate group-hover:text-accent transition-colors">
                            {resource.title || resource.url}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{resource.type || 'link'}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar (hidden for events) */}
        {!isEventView && (
          <footer className="flex-shrink-0 border-t border-border bg-card px-4 sm:px-8 py-3 sm:py-4">
            <nav className="flex items-center justify-between" aria-label="Lesson navigation">
              {/* Previous Button */}
              <button
                onClick={goToPrevious}
                disabled={isFirstLesson}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:text-sidebar-foreground"
                aria-label="Go to previous lesson"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Lesson Counter */}
              <div className="text-xs sm:text-sm text-muted-foreground" role="status">
                <span className="hidden sm:inline">Lesson </span>{currentLessonIndex + 1} of {currentModule?.lessons.length}
              </div>

              {/* Next / Mark Complete Button */}
              {currentLesson?.completed ? (
                <button
                  onClick={goToNext}
                  disabled={isLastLesson}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  aria-label="Go to next lesson"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              ) : hasTasks ? (
                <div className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 text-sm text-muted-foreground">
                  <span>Complete all tasks to finish</span>
                </div>
              ) : (
                <button
                  onClick={handleMarkComplete}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  aria-label={`Mark lesson complete and earn ${currentLesson?.points} points`}
                >
                  <span className="hidden sm:inline">Mark Complete &amp; Continue</span>
                  <span className="sm:hidden">Complete</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              )}
            </nav>
          </footer>
        )}
      </main>

      {/* Completion Modal */}
      {showCompleteModal && currentLesson && (
        <CompletionModal
          points={currentLesson.points}
          onCancel={handleCancelComplete}
          onConfirm={confirmComplete}
        />
      )}
    </div>
  );
}
