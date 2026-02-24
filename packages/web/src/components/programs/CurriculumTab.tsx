'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  FolderOpen,
  HelpCircle,
  ClipboardList,
  Users,
  FileText,
  Target,
  ShieldCheck,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Save,
  Trash2,
  Eye,
  Sparkles,
  Info,
  GraduationCap,
  X,
  Upload,
  Link,
  Video,
  Presentation,
  Table,
  Type,
  Copy,
  AlertCircle,
  Calendar,
  Lightbulb,
  Brain,
  Layers,
  ClipboardCheck,
  Menu,
  Check,
} from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { getEmbedUrl, getVideoProvider } from '@/lib/video-utils';
import { api } from '@/lib/api';
import {
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useUpdateLesson,
  useDeleteLesson,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/hooks/api/usePrograms';
import {
  useCreateAgencyModule,
  useUpdateAgencyModule,
  useDeleteAgencyModule,
  useUpdateAgencyLesson,
  useDeleteAgencyLesson,
  useCreateAgencyTask,
  useUpdateAgencyTask,
  useDeleteAgencyTask,
} from '@/hooks/api/useAgencyPrograms';
import { EventEditor } from './EventEditor';
import { TaskEditor } from './TaskEditor';
import { QuizEditor } from './QuizEditor';
import type {
  ProgramWithModules,
  Module,
  Lesson,
  ContentType,
  LessonContent,
  VisibilitySettings,
  UpdateLessonInput,
  UpdateModuleInput,
  ApprovalRequired,
  EnrollmentRole,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/types/programs';

// ============================================
// Content Type Configuration
// ============================================

type ContentTypeConfig = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
};

// Display config — used for showing icons/labels on existing lessons by contentType
const CONTENT_TYPE_CONFIG: Partial<Record<ContentType, ContentTypeConfig>> = {
  lesson: { icon: BookOpen, label: 'Reading', color: 'text-blue-600' },
  quiz: { icon: HelpCircle, label: 'Quiz', color: 'text-purple-600' },
  assignment: { icon: ClipboardList, label: 'Assignment', color: 'text-orange-600' },
  text_form: { icon: FileText, label: 'Text Form', color: 'text-cyan-600' },
  goal: { icon: Target, label: 'Goal', color: 'text-yellow-600' },
  survey: { icon: ClipboardCheck, label: 'Survey', color: 'text-teal-600' },
};

type AddMenuKey =
  | ContentType
  | 'video'
  | 'key_concepts'
  | 'most_useful_idea'
  | 'how_you_used'
  | 'food_for_thought';

// Maps add-menu keys to their DB contentType, default lesson title, and optional mediaType.
// Multiple menu entries can share the same DB contentType (e.g. Reading + Video = lesson).
// mediaType is stored in content JSON to distinguish subtypes for icon/label display.
const ADD_MENU_MAP: Record<
  AddMenuKey,
  { contentType: ContentType; defaultTitle: string; mediaType?: string }
> = {
  lesson: { contentType: 'lesson', defaultTitle: 'New Reading' },
  video: { contentType: 'lesson', defaultTitle: 'New Video', mediaType: 'video' },
  key_concepts: { contentType: 'lesson', defaultTitle: 'Key Concepts', mediaType: 'key_concepts' },
  quiz: { contentType: 'quiz', defaultTitle: 'New Quiz' },
  assignment: { contentType: 'assignment', defaultTitle: 'New Assignment' },
  food_for_thought: { contentType: 'assignment', defaultTitle: 'Food for Thought' },
  text_form: { contentType: 'text_form', defaultTitle: 'New Text Form' },
  most_useful_idea: { contentType: 'text_form', defaultTitle: 'Most Useful Idea' },
  how_you_used: { contentType: 'text_form', defaultTitle: 'How You Used This Idea' },
  goal: { contentType: 'goal', defaultTitle: 'New Goal' },
  survey: { contentType: 'survey', defaultTitle: 'New Survey' },
};

/** Get the display icon and label for a lesson, accounting for subtypes */
function getLessonDisplay(lesson: { contentType: string; content?: unknown }): ContentTypeConfig {
  if (lesson.contentType === 'lesson') {
    const c = lesson.content as LessonContent | undefined;
    if (c?.mediaType === 'video' || c?.videoUrl) {
      return { icon: Video, label: 'Video', color: 'text-indigo-600' };
    }
    if (c?.mediaType === 'key_concepts') {
      return { icon: Layers, label: 'Key Concepts', color: 'text-violet-600' };
    }
  }
  return CONTENT_TYPE_CONFIG[lesson.contentType as ContentType] || CONTENT_TYPE_CONFIG.lesson!;
}

// Add menu config — displayed in the "Add lesson" dropdown in the builder.
const ADD_MENU_CONFIG: {
  key: AddMenuKey;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  group: string;
}[] = [
  // Content
  { key: 'lesson', icon: BookOpen, label: 'Reading', color: 'text-blue-600', group: 'Content' },
  { key: 'video', icon: Video, label: 'Video', color: 'text-indigo-600', group: 'Content' },
  {
    key: 'key_concepts',
    icon: Layers,
    label: 'Key Concepts',
    color: 'text-violet-600',
    group: 'Content',
  },
  { key: 'quiz', icon: HelpCircle, label: 'Quiz', color: 'text-purple-600', group: 'Content' },
  // Reflections
  {
    key: 'most_useful_idea',
    icon: Lightbulb,
    label: 'Most Useful Idea',
    color: 'text-amber-600',
    group: 'Reflection',
  },
  {
    key: 'how_you_used',
    icon: GraduationCap,
    label: 'How You Used This Idea',
    color: 'text-teal-600',
    group: 'Reflection',
  },
  {
    key: 'text_form',
    icon: FileText,
    label: 'Text Form',
    color: 'text-cyan-600',
    group: 'Reflection',
  },
  // Activities
  {
    key: 'assignment',
    icon: ClipboardList,
    label: 'Assignment',
    color: 'text-orange-600',
    group: 'Activity',
  },
  {
    key: 'food_for_thought',
    icon: Brain,
    label: 'Food for Thought',
    color: 'text-rose-600',
    group: 'Activity',
  },
  { key: 'goal', icon: Target, label: 'Goal', color: 'text-yellow-600', group: 'Activity' },
  {
    key: 'survey',
    icon: ClipboardCheck,
    label: 'Survey',
    color: 'text-teal-600',
    group: 'Activity',
  },
];

// ============================================
// Toggle Switch Component
// ============================================

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-red-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ============================================
// Confirm Dialog Component
// ============================================

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  confirmColor = 'bg-red-600 hover:bg-red-700',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CurriculumTab
// ============================================

interface CurriculumTabProps {
  program: ProgramWithModules;
  tenantId: string | undefined;
  isAgencyContext?: boolean;
}

export function CurriculumTab({ program, tenantId, isAgencyContext }: CurriculumTabProps) {
  const queryClient = useQueryClient();

  // Selection state
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedLessonModuleId, setSelectedLessonModuleId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Module form state
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');

  // Lesson form state
  const [editTitle, setEditTitle] = useState('');
  const [editContentType, setEditContentType] = useState<ContentType>('lesson');
  const [editContent, setEditContent] = useState<LessonContent>({});
  const [editVisibleTo, setEditVisibleTo] = useState<VisibilitySettings>({
    learner: true,
    mentor: true,
    facilitator: true,
  });
  const [editDuration, setEditDuration] = useState<number | ''>('');
  const [editPoints, setEditPoints] = useState<number | ''>('');
  const [editApprovalRequired, setEditApprovalRequired] = useState<ApprovalRequired>('none');
  const [contentMode, setContentMode] = useState<'shared' | 'role-specific'>('shared');
  const [activeRoleTab, setActiveRoleTab] = useState<EnrollmentRole>('learner');
  const [previewRole, setPreviewRole] = useState<EnrollmentRole>('learner');
  const [roleContentStore, setRoleContentStore] = useState<Record<EnrollmentRole, LessonContent>>({
    learner: {},
    mentor: {},
    facilitator: {},
  });

  // Add lesson menu
  const [showAddLessonMenu, setShowAddLessonMenu] = useState(false);
  const [addLessonMenuPos, setAddLessonMenuPos] = useState({ top: 0, left: 0 });
  const addLessonBtnRef = useRef<HTMLButtonElement>(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  // Mobile sidebar & action bar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showMobileFab, setShowMobileFab] = useState(false);

  // Save feedback & confirmations
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'lesson' | 'module' | 'event';
    id: string;
    title: string;
  } | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Mutation hooks — use agency or tenant variants based on context
  const tenantCreateModule = useCreateModule(tenantId, program.id);
  const tenantUpdateModule = useUpdateModule(tenantId, program.id);
  const tenantDeleteModule = useDeleteModule(tenantId, program.id);
  const tenantUpdateLesson = useUpdateLesson(
    tenantId,
    program.id,
    selectedLessonModuleId || undefined
  );
  const tenantDeleteLesson = useDeleteLesson(
    tenantId,
    program.id,
    selectedLessonModuleId || undefined
  );

  const agencyCreateModule = useCreateAgencyModule(program.id);
  const agencyUpdateModule = useUpdateAgencyModule(program.id);
  const agencyDeleteModule = useDeleteAgencyModule(program.id);
  const agencyUpdateLesson = useUpdateAgencyLesson(program.id, selectedLessonModuleId || undefined);
  const agencyDeleteLesson = useDeleteAgencyLesson(program.id, selectedLessonModuleId || undefined);

  // Task mutation hooks
  const tenantCreateTask = useCreateTask(tenantId, program.id, selectedLesson?.id);
  const tenantUpdateTask = useUpdateTask(tenantId, program.id, selectedLesson?.id);
  const tenantDeleteTask = useDeleteTask(tenantId, program.id, selectedLesson?.id);
  const agencyCreateTask = useCreateAgencyTask(program.id, selectedLesson?.id);
  const agencyUpdateTask = useUpdateAgencyTask(program.id, selectedLesson?.id);
  const agencyDeleteTask = useDeleteAgencyTask(program.id, selectedLesson?.id);

  const createModule = isAgencyContext ? agencyCreateModule : tenantCreateModule;
  const updateModule = isAgencyContext ? agencyUpdateModule : tenantUpdateModule;
  const deleteModule = isAgencyContext ? agencyDeleteModule : tenantDeleteModule;
  const updateLesson = isAgencyContext ? agencyUpdateLesson : tenantUpdateLesson;
  const deleteLesson = isAgencyContext ? agencyDeleteLesson : tenantDeleteLesson;
  const createTask = isAgencyContext ? agencyCreateTask : tenantCreateTask;
  const updateTask = isAgencyContext ? agencyUpdateTask : tenantUpdateTask;
  const deleteTask = isAgencyContext ? agencyDeleteTask : tenantDeleteTask;

  // Reorder: called directly via api.put in handlers (tenant/agency have different param shapes)

  // Sorted modules
  const sortedModules = useMemo(
    () => [...(program.modules || [])].sort((a, b) => a.order - b.order),
    [program.modules]
  );

  // Stats
  const moduleItems = sortedModules.filter((m) => m.type !== 'event');
  const eventItems = sortedModules.filter((m) => m.type === 'event');
  const totalModules = moduleItems.length;
  const totalEvents = eventItems.length;
  const totalLessons = moduleItems.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

  // Auto-expand first 3 modules on first load
  useEffect(() => {
    if (program?.modules && Object.keys(expandedModules).length === 0) {
      const expanded: Record<string, boolean> = {};
      const sorted = [...program.modules].sort((a, b) => a.order - b.order);
      sorted.slice(0, 3).forEach((m) => {
        expanded[m.id] = true;
      });
      setExpandedModules(expanded);
    }
  }, [program?.modules]);

  // Sync selected lesson with program data after mutations
  useEffect(() => {
    if (selectedLesson && program) {
      const mod = program.modules?.find((m) => m.id === selectedLessonModuleId);
      if (mod) {
        const updated = mod.lessons?.find((l) => l.id === selectedLesson.id);
        if (updated) setSelectedLesson(updated);
        else {
          setSelectedLesson(null);
          setSelectedLessonModuleId(null);
        }
      }
    }
  }, [program, selectedLessonModuleId, selectedLesson?.id]);

  // Sync module form when module changes
  useEffect(() => {
    if (selectedModuleId) {
      const mod = sortedModules.find((m) => m.id === selectedModuleId);
      if (mod) {
        setEditModuleTitle(mod.title);
        setEditModuleDescription(mod.description || '');
      }
    }
  }, [selectedModuleId, sortedModules]);

  // Sync lesson form when lesson changes
  useEffect(() => {
    if (selectedLesson) {
      setEditTitle(selectedLesson.title);
      setEditContentType(selectedLesson.contentType);
      const content = selectedLesson.content || {};
      const mode = content.contentMode || 'shared';
      setContentMode(mode);
      setActiveRoleTab('learner');

      if (mode === 'role-specific' && content.roleContent) {
        const rc = content.roleContent;
        setRoleContentStore({
          learner: rc.learner || {},
          mentor: rc.mentor || {},
          facilitator: rc.facilitator || {},
        });
        setEditContent(rc.learner || {});
      } else {
        // Strip contentMode/roleContent from shared edit content
        const { contentMode: _cm, roleContent: _rc, ...sharedContent } = content;
        setEditContent(sharedContent);
        setRoleContentStore({ learner: {}, mentor: {}, facilitator: {} });
      }

      setEditVisibleTo(
        selectedLesson.visibleTo || { learner: true, mentor: true, facilitator: true }
      );
      setEditDuration(selectedLesson.durationMinutes ?? '');
      setEditPoints(selectedLesson.points ?? '');
      setEditApprovalRequired(selectedLesson.approvalRequired || 'none');
    }
  }, [selectedLesson]);

  // ---- Dirty state detection ----
  const isDirty = useMemo(() => {
    if (!selectedLesson) return false;
    return (
      editTitle !== selectedLesson.title ||
      editContentType !== selectedLesson.contentType ||
      JSON.stringify(editContent) !== JSON.stringify(selectedLesson.content || {}) ||
      (editDuration !== '' ? Number(editDuration) : undefined) !==
        (selectedLesson.durationMinutes ?? undefined) ||
      (editPoints !== '' ? Number(editPoints) : undefined) !==
        (selectedLesson.points ?? undefined) ||
      editApprovalRequired !== (selectedLesson.approvalRequired || 'none')
    );
  }, [
    editTitle,
    editContentType,
    editContent,
    editDuration,
    editPoints,
    editApprovalRequired,
    selectedLesson,
  ]);

  // Clear error after 5s
  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // ---- Handlers ----

  const navigateWithDirtyCheck = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setPendingNavigation(() => action);
      } else {
        action();
      }
    },
    [isDirty]
  );

  const doNavigate = (fn: () => void) => {
    setSaveStatus('idle');
    fn();
  };

  const handleSelectModule = (moduleId: string) => {
    const nav = () => {
      doNavigate(() => {
        setSelectedModuleId(moduleId);
        setSelectedLesson(null);
        setSelectedLessonModuleId(null);
        setExpandedModules((prev) => ({ ...prev, [moduleId]: true }));
        setSidebarOpen(false);
      });
    };
    if (selectedLesson && isDirty) {
      navigateWithDirtyCheck(nav);
    } else {
      nav();
    }
  };

  const handleSelectLesson = (lesson: Lesson, moduleId: string) => {
    const nav = () => {
      doNavigate(() => {
        setSelectedLesson(lesson);
        setSelectedLessonModuleId(moduleId);
        setSelectedModuleId(null);
        setSidebarOpen(false);
      });
    };
    if (selectedLesson && selectedLesson.id !== lesson.id && isDirty) {
      navigateWithDirtyCheck(nav);
    } else {
      nav();
    }
  };

  const handleBackToOverview = () => {
    const nav = () =>
      doNavigate(() => {
        setSelectedModuleId(null);
        setSelectedLesson(null);
        setSelectedLessonModuleId(null);
      });
    if (selectedLesson && isDirty) {
      navigateWithDirtyCheck(nav);
    } else {
      nav();
    }
  };

  const handleBackToProgram = () => {
    const nav = () =>
      doNavigate(() => {
        if (selectedLessonModuleId) setSelectedModuleId(selectedLessonModuleId);
        setSelectedLesson(null);
        setSelectedLessonModuleId(null);
      });
    if (isDirty) {
      navigateWithDirtyCheck(nav);
    } else {
      nav();
    }
  };

  const handleToggleModule = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleAddModule = () => {
    createModule.mutate(
      { title: 'New Module' },
      {
        onSuccess: (data: unknown) => {
          const newModule = data as { id?: string };
          if (newModule?.id) {
            setSelectedModuleId(newModule.id);
            setSelectedLesson(null);
            setSelectedLessonModuleId(null);
            setExpandedModules((prev) => ({ ...prev, [newModule.id!]: true }));
          }
        },
        onError: (err: Error) => setErrorMessage(err.message || 'Failed to add module'),
      }
    );
  };

  const handleAddEvent = () => {
    createModule.mutate(
      { title: 'New Event', type: 'event' },
      {
        onSuccess: (data: unknown) => {
          const newEvent = data as { id?: string };
          if (newEvent?.id) {
            setSelectedModuleId(newEvent.id);
            setSelectedLesson(null);
            setSelectedLessonModuleId(null);
          }
        },
        onError: (err: Error) => setErrorMessage(err.message || 'Failed to add event'),
      }
    );
  };

  const handleSaveEvent = (input: UpdateModuleInput) => {
    if (!selectedModuleId) return;
    updateModule.mutate({ moduleId: selectedModuleId, input });
  };

  const handleDeleteEvent = () => {
    if (!selectedModuleId) return;
    const mod = sortedModules.find((m) => m.id === selectedModuleId);
    setDeleteTarget({ type: 'event', id: selectedModuleId, title: mod?.title || 'this event' });
  };

  const handleSaveModuleSettings = () => {
    if (!selectedModuleId) return;
    updateModule.mutate({
      moduleId: selectedModuleId,
      input: {
        title: editModuleTitle.trim() || 'Untitled Module',
        description: editModuleDescription.trim() || undefined,
      },
    });
  };

  const handleDeleteModule = () => {
    if (!selectedModuleId) return;
    const mod = sortedModules.find((m) => m.id === selectedModuleId);
    setDeleteTarget({ type: 'module', id: selectedModuleId, title: mod?.title || 'this module' });
  };

  const handleAddLesson = async (menuKey: AddMenuKey) => {
    const moduleId = selectedModuleId;
    if (!moduleId) return;
    setShowAddLessonMenu(false);
    setIsCreatingLesson(true);
    const { contentType, defaultTitle, mediaType } = ADD_MENU_MAP[menuKey];
    try {
      const title = defaultTitle;
      const basePath = isAgencyContext
        ? `/api/agencies/me/programs/${program.id}/modules/${moduleId}/lessons`
        : `/api/tenants/${tenantId}/programs/${program.id}/modules/${moduleId}/lessons`;
      const body: Record<string, unknown> = { title, contentType };
      if (mediaType) body.content = { mediaType };
      await api.post(basePath, body);
      if (isAgencyContext) {
        queryClient.invalidateQueries({ queryKey: ['agencyProgram', program.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['program', tenantId, program.id] });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add lesson');
    } finally {
      setIsCreatingLesson(false);
    }
  };

  const handleSaveLesson = () => {
    if (!selectedLesson || !selectedLessonModuleId) return;

    let contentToSave: LessonContent;
    if (contentMode === 'role-specific') {
      // Merge current tab's editContent into the store
      const updatedRoleContent = { ...roleContentStore, [activeRoleTab]: editContent };
      contentToSave = {
        contentMode: 'role-specific',
        roleContent: updatedRoleContent,
      };
    } else {
      // Strip any roleContent/contentMode when saving shared
      const { contentMode: _cm, roleContent: _rc, ...sharedContent } = editContent;
      contentToSave = sharedContent;
    }

    const input: UpdateLessonInput = {
      title: editTitle.trim() || selectedLesson.title,
      contentType: editContentType,
      content: contentToSave,
      visibleTo: editVisibleTo,
      durationMinutes: editDuration === '' ? undefined : Number(editDuration),
      points: editPoints === '' ? undefined : Number(editPoints),
      approvalRequired: editApprovalRequired,
    };
    updateLesson.mutate(
      { lessonId: selectedLesson.id, input },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        },
      }
    );
  };

  const handleDeleteLesson = () => {
    if (!selectedLesson || !selectedLessonModuleId) return;
    setDeleteTarget({ type: 'lesson', id: selectedLesson.id, title: selectedLesson.title });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'lesson') {
      deleteLesson.mutate(deleteTarget.id);
      if (selectedLessonModuleId) setSelectedModuleId(selectedLessonModuleId);
      setSelectedLesson(null);
      setSelectedLessonModuleId(null);
    } else if (deleteTarget.type === 'module' || deleteTarget.type === 'event') {
      deleteModule.mutate(deleteTarget.id);
      setSelectedModuleId(null);
    }
    setDeleteTarget(null);
  };

  const getModulePoints = (mod: Module) =>
    (mod.lessons || []).reduce((sum, l) => sum + (l.points || 0), 0);

  // ---- Reorder handlers ----

  const doReorder = async (path: string, items: { id: string; order: number }[], label: string) => {
    try {
      await api.put(path, { items });
      if (isAgencyContext) {
        queryClient.invalidateQueries({ queryKey: ['agencyProgram', program.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['program', tenantId, program.id] });
      }
    } catch (err: unknown) {
      console.error(`Reorder ${label} error:`, err);
      setErrorMessage(err instanceof Error ? err.message : `Failed to reorder ${label}`);
    }
  };

  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const idx = sortedModules.findIndex((m) => m.id === moduleId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedModules.length) return;
    const a = sortedModules[idx];
    const b = sortedModules[swapIdx];
    const items = [
      { id: a.id, order: Math.round(b.order) },
      { id: b.id, order: Math.round(a.order) },
    ];
    const basePath = isAgencyContext
      ? `/api/agencies/me/programs/${program.id}/modules/reorder`
      : `/api/tenants/${tenantId}/programs/${program.id}/modules/reorder`;
    await doReorder(basePath, items, 'modules');
  };

  const handleMoveLesson = async (moduleId: string, lessonId: string, direction: 'up' | 'down') => {
    const mod = sortedModules.find((m) => m.id === moduleId);
    if (!mod) return;
    const sorted = [...(mod.lessons || [])].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === lessonId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const items = [
      { id: a.id, order: Math.round(b.order) },
      { id: b.id, order: Math.round(a.order) },
    ];
    const basePath = isAgencyContext
      ? `/api/agencies/me/programs/${program.id}/modules/${moduleId}/lessons/reorder`
      : `/api/tenants/${tenantId}/programs/${program.id}/modules/${moduleId}/lessons/reorder`;
    await doReorder(basePath, items, 'lessons');
  };

  // ---- Role-specific content helpers ----

  const handleContentModeChange = (mode: 'shared' | 'role-specific') => {
    if (mode === contentMode) return;
    if (mode === 'role-specific') {
      // Copy current shared content to all roles
      setRoleContentStore({
        learner: { ...editContent },
        mentor: { ...editContent },
        facilitator: { ...editContent },
      });
      setActiveRoleTab('learner');
    } else {
      // Going back to shared: save current tab, use learner content as base
      const mergedStore = { ...roleContentStore, [activeRoleTab]: editContent };
      setEditContent(mergedStore.learner || {});
      setRoleContentStore({ learner: {}, mentor: {}, facilitator: {} });
    }
    setContentMode(mode);
  };

  const handleRoleTabChange = (newRole: EnrollmentRole) => {
    if (newRole === activeRoleTab) return;
    // Save current editContent to store for the current tab
    setRoleContentStore((prev) => ({ ...prev, [activeRoleTab]: editContent }));
    // Load new role's content
    setEditContent(roleContentStore[newRole]);
    setActiveRoleTab(newRole);
  };

  const handleCopyFromRole = (sourceRole: EnrollmentRole) => {
    const sourceContent = sourceRole === activeRoleTab ? editContent : roleContentStore[sourceRole];
    setEditContent({ ...sourceContent });
  };

  // ---- Content type-specific editor ----

  const renderLessonContent = () => {
    switch (editContentType) {
      case 'lesson':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Introduction</label>
              <RichTextEditor
                value={editContent.introduction || ''}
                onChange={(html) => setEditContent({ ...editContent, introduction: html })}
                placeholder="Introduce the lesson and its importance..."
                minHeight={120}
              />
            </div>

            {/* Video Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Video Source</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg text-center opacity-50 cursor-not-allowed">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload Video</p>
                    <p className="text-xs text-gray-500">MP4, MOV up to 500MB</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 border-2 border-red-500 bg-red-50/50 rounded-lg text-center cursor-default">
                  <Link className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Embed URL</p>
                    <p className="text-xs text-gray-500">YouTube, Vimeo, etc.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL</label>
                <input
                  type="url"
                  value={editContent.videoUrl || ''}
                  onChange={(e) => setEditContent({ ...editContent, videoUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                />
                {/* Live Video Preview */}
                {editContent.videoUrl &&
                  (() => {
                    const embedUrl = getEmbedUrl(editContent.videoUrl);
                    const provider = getVideoProvider(editContent.videoUrl);
                    if (embedUrl && provider) {
                      return (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                          <div className="aspect-video bg-black">
                            <iframe
                              src={embedUrl}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Video preview"
                            />
                          </div>
                          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                            <Video className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500 capitalize">{provider}</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="text-xs text-amber-600 mt-1.5">
                        Could not recognize video URL. Paste a YouTube or Vimeo link.
                      </p>
                    );
                  })()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Main Content</label>
              <RichTextEditor
                value={editContent.mainContent || ''}
                onChange={(html) => setEditContent({ ...editContent, mainContent: html })}
                placeholder="Write the main lesson content here..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Key Concepts</label>
                <button
                  onClick={() => {
                    const concepts = editContent.keyConcepts || [];
                    setEditContent({
                      ...editContent,
                      keyConcepts: [...concepts, { title: '', description: '' }],
                    });
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  + Add Concept
                </button>
              </div>
              <div className="space-y-4">
                {(editContent.keyConcepts || []).map((concept, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={concept.title}
                        onChange={(e) => {
                          const concepts = [...(editContent.keyConcepts || [])];
                          concepts[i] = { ...concepts[i], title: e.target.value };
                          setEditContent({ ...editContent, keyConcepts: concepts });
                        }}
                        placeholder={`Concept ${i + 1} Title`}
                        className="flex-1 px-4 py-2.5 text-sm border-b border-gray-200 focus:border-red-500 focus:ring-0 outline-none bg-gray-50"
                      />
                      <button
                        onClick={() => {
                          const concepts = (editContent.keyConcepts || []).filter(
                            (_, idx) => idx !== i
                          );
                          setEditContent({ ...editContent, keyConcepts: concepts });
                        }}
                        className="p-2.5 text-gray-400 hover:text-red-600 transition-colors border-b border-l border-gray-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={concept.description}
                      onChange={(e) => {
                        const concepts = [...(editContent.keyConcepts || [])];
                        concepts[i] = { ...concepts[i], description: e.target.value };
                        setEditContent({ ...editContent, keyConcepts: concepts });
                      }}
                      rows={2}
                      placeholder="Explain the concept..."
                      className="w-full px-4 py-2.5 text-sm focus:border-red-500 focus:ring-0 outline-none resize-none bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Takeaway</label>
              <RichTextEditor
                value={editContent.keyTakeaway || ''}
                onChange={(html) => setEditContent({ ...editContent, keyTakeaway: html })}
                placeholder="Summarize the main insight or action from this reading..."
                minHeight={100}
              />
            </div>

            {/* AI Content Generator */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Content Generator</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Generate lesson content based on learning objectives and L&D best practices
                  </p>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium mt-2">
                    Generate Content &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'assignment':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Introduction</label>
              <RichTextEditor
                value={editContent.introduction || ''}
                onChange={(html) => setEditContent({ ...editContent, introduction: html })}
                placeholder="Introduce the lesson and its importance..."
                minHeight={120}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Assignment Instructions
              </label>
              <RichTextEditor
                value={editContent.instructions || ''}
                onChange={(html) => setEditContent({ ...editContent, instructions: html })}
                placeholder="Describe what learners need to do for this assignment..."
                minHeight={160}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Assignment Questions</label>
                <button
                  onClick={() =>
                    setEditContent({
                      ...editContent,
                      questions: [...(editContent.questions || []), ''],
                    })
                  }
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  + Add Question
                </button>
              </div>
              {(editContent.questions || []).map((q, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 w-6 text-right">{i + 1}.</span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => {
                      const qs = [...(editContent.questions || [])];
                      qs[i] = e.target.value;
                      setEditContent({ ...editContent, questions: qs });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                  />
                  <button
                    onClick={() =>
                      setEditContent({
                        ...editContent,
                        questions: (editContent.questions || []).filter((_, idx) => idx !== i),
                      })
                    }
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Submission Types
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select which submission methods learners can use for this assignment.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: 'text',
                      label: 'Text Entry',
                      desc: 'Written response in a text box',
                      icon: Type,
                    },
                    {
                      value: 'file_upload',
                      label: 'File Upload',
                      desc: 'Upload PDF, Word, or other files',
                      icon: Upload,
                    },
                    {
                      value: 'url',
                      label: 'URL / Link',
                      desc: 'Submit a link to external work',
                      icon: Link,
                    },
                    {
                      value: 'video',
                      label: 'Video',
                      desc: 'Record or upload a video response',
                      icon: Video,
                    },
                    {
                      value: 'presentation',
                      label: 'Presentation',
                      desc: 'Upload slides (PPT, PDF)',
                      icon: Presentation,
                    },
                    {
                      value: 'spreadsheet',
                      label: 'Spreadsheet',
                      desc: 'Upload Excel or CSV files',
                      icon: Table,
                    },
                  ] as {
                    value: string;
                    label: string;
                    desc: string;
                    icon: React.ComponentType<{ className?: string }>;
                  }[]
                ).map((opt) => {
                  const selected = (editContent.submissionTypes || []).includes(
                    opt.value as 'text'
                  );
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const current = editContent.submissionTypes || [];
                        const updated = selected
                          ? current.filter((t) => t !== opt.value)
                          : [...current, opt.value as 'text'];
                        setEditContent({ ...editContent, submissionTypes: updated });
                      }}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg text-left transition-colors ${
                        selected
                          ? 'border-red-500 bg-red-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <OptIcon
                        className={`w-4 h-4 mt-0.5 shrink-0 ${selected ? 'text-red-500' : 'text-gray-400'}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {(editContent.submissionTypes || []).includes('file_upload') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={editContent.maxFileSize || ''}
                    onChange={(e) =>
                      setEditContent({
                        ...editContent,
                        maxFileSize: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    min={1}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                    placeholder="e.g., 25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    value={(editContent.allowedFileTypes || []).join(', ')}
                    onChange={(e) =>
                      setEditContent({
                        ...editContent,
                        allowedFileTypes: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                    placeholder="e.g., .pdf, .docx, .pptx"
                  />
                </div>
              </div>
            )}

            {/* AI Content Generator */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Content Generator</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Generate lesson content based on learning objectives and L&D best practices
                  </p>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium mt-2">
                    Generate Content &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'quiz':
        return <QuizEditor content={editContent} onChange={(updated) => setEditContent(updated)} />;

      case 'survey':
        return (
          <div className="space-y-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-teal-600" />
              <div>
                <p className="font-medium text-gray-800">Survey Lesson</p>
                <p className="text-sm text-gray-500">
                  Learners will complete a survey as part of this lesson.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Survey ID (optional)
              </label>
              <input
                type="text"
                value={(editContent as { surveyId?: string })?.surveyId ?? ''}
                onChange={(e) => setEditContent((prev) => ({ ...prev, surveyId: e.target.value }))}
                placeholder="Link to an existing survey by ID"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave blank to prompt learners to complete any active survey.
              </p>
            </div>
          </div>
        );

      case 'goal':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Introduction</label>
              <RichTextEditor
                value={editContent.introduction || ''}
                onChange={(html) => setEditContent({ ...editContent, introduction: html })}
                placeholder="Introduce the goal-setting activity..."
                minHeight={120}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Goal Statement Template
              </label>
              <textarea
                value={editContent.goalPrompt || ''}
                onChange={(e) => setEditContent({ ...editContent, goalPrompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="e.g., I will [action] by [date] as measured by [metric]..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Success Metric Guidance
              </label>
              <textarea
                value={editContent.metricsGuidance || ''}
                onChange={(e) =>
                  setEditContent({
                    ...editContent,
                    metricsGuidance: e.target.value,
                    requireMetrics: !!e.target.value.trim(),
                  })
                }
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="How will learners measure success? (e.g., Number of 1-on-1s conducted, feedback score, etc.)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Action Steps Template
              </label>
              <textarea
                value={editContent.actionStepsGuidance || ''}
                onChange={(e) =>
                  setEditContent({
                    ...editContent,
                    actionStepsGuidance: e.target.value,
                    requireActionSteps: !!e.target.value.trim(),
                  })
                }
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="Guide learners on breaking down their goal into specific actions..."
              />
            </div>

            {/* AI Content Generator */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Content Generator</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Generate lesson content based on learning objectives and L&D best practices
                  </p>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium mt-2">
                    Generate Content &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'text_form':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Introduction</label>
              <RichTextEditor
                value={editContent.introduction || ''}
                onChange={(html) => setEditContent({ ...editContent, introduction: html })}
                placeholder="Introduce the reflection activity..."
                minHeight={120}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Form Prompt</label>
              <textarea
                value={editContent.formPrompt || ''}
                onChange={(e) => setEditContent({ ...editContent, formPrompt: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="e.g., What was the most useful idea from this module?"
              />
              <p className="text-xs text-gray-400 mt-1">
                The main prompt shown to the learner above the text input area.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Reflection Prompts</label>
                <button
                  onClick={() =>
                    setEditContent({
                      ...editContent,
                      reflectionPrompts: [...(editContent.reflectionPrompts || []), ''],
                    })
                  }
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  + Add Prompt
                </button>
              </div>
              {(editContent.reflectionPrompts || []).map((p, i) => (
                <div key={i} className="flex items-start gap-2 mb-3">
                  <textarea
                    value={p}
                    onChange={(e) => {
                      const ps = [...(editContent.reflectionPrompts || [])];
                      ps[i] = e.target.value;
                      setEditContent({ ...editContent, reflectionPrompts: ps });
                    }}
                    rows={3}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                    placeholder={`Reflection prompt ${i + 1}...`}
                  />
                  <button
                    onClick={() =>
                      setEditContent({
                        ...editContent,
                        reflectionPrompts: (editContent.reflectionPrompts || []).filter(
                          (_, idx) => idx !== i
                        ),
                      })
                    }
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min Length (characters)
                </label>
                <input
                  type="number"
                  value={editContent.minLength || ''}
                  onChange={(e) =>
                    setEditContent({
                      ...editContent,
                      minLength: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  min={0}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max Length (characters)
                </label>
                <input
                  type="number"
                  value={editContent.maxLength || ''}
                  onChange={(e) =>
                    setEditContent({
                      ...editContent,
                      maxLength: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  min={0}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                  placeholder="e.g., 500"
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Enable Discussion</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Allow learners to see and respond to each other&apos;s submissions
                </p>
              </div>
              <ToggleSwitch
                enabled={!!editContent.enableDiscussion}
                onChange={(v) => setEditContent({ ...editContent, enableDiscussion: v })}
              />
            </div>

            {/* AI Content Generator */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Content Generator</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Generate lesson content based on learning objectives and L&D best practices
                  </p>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium mt-2">
                    Generate Content &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ---- Get selected module object ----
  const selectedModule = selectedModuleId
    ? sortedModules.find((m) => m.id === selectedModuleId)
    : null;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] border border-gray-200 rounded-xl overflow-hidden bg-white relative">
      {/* ======== MOBILE SIDEBAR BACKDROP ======== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======== LEFT SIDEBAR ======== */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-80 lg:relative lg:inset-auto lg:z-auto lg:w-72
          border-r border-gray-200 flex flex-col bg-white shrink-0
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Back to Overview + Mobile Close */}
        <div className="flex items-center justify-between border-b border-gray-100">
          <button
            onClick={handleBackToOverview}
            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Back to Overview
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 mr-2 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex-1 text-center border border-gray-200 rounded-lg py-2">
            <div className="text-lg font-semibold text-gray-900">{totalModules}</div>
            <div className="text-xs text-gray-500">Modules</div>
          </div>
          <div className="flex-1 text-center border border-gray-200 rounded-lg py-2">
            <div className="text-lg font-semibold text-gray-900">{totalLessons}</div>
            <div className="text-xs text-gray-500">Lessons</div>
          </div>
          {totalEvents > 0 && (
            <div className="flex-1 text-center border border-gray-200 rounded-lg py-2">
              <div className="text-lg font-semibold text-gray-900">{totalEvents}</div>
              <div className="text-xs text-gray-500">Events</div>
            </div>
          )}
        </div>

        {/* ===== STICKY ACTION BAR ===== */}
        <div className="px-3 py-2.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-1.5">
            {/* Primary: Add Module */}
            <button
              onClick={handleAddModule}
              disabled={createModule.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {createModule.isPending ? 'Adding...' : 'Add Module'}
            </button>
            {/* Dropdown trigger: more add options */}
            <div className="relative">
              <button
                onClick={() => setShowAddDropdown((prev) => !prev)}
                className="px-2.5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                aria-label="More add options"
                aria-expanded={showAddDropdown}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showAddDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              {showAddDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAddDropdown(false)} />
                  <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
                    {/* Structure section */}
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Structure
                    </div>
                    <button
                      onClick={() => {
                        handleAddModule();
                        setShowAddDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FolderOpen className="w-4 h-4 text-red-500" />
                      Add Module
                    </button>
                    <button
                      onClick={() => {
                        handleAddEvent();
                        setShowAddDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Add Event
                    </button>
                    <div className="my-1.5 border-t border-gray-100" />

                    {/* Lesson types — only when a module is selected */}
                    {selectedModuleId && moduleItems.some((m) => m.id === selectedModuleId) ? (
                      <>
                        {(['Content', 'Reflection', 'Activity'] as const).map((group) => {
                          const items = ADD_MENU_CONFIG.filter((c) => c.group === group);
                          return (
                            <div key={group}>
                              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                {group}
                              </div>
                              {items.map((item) => {
                                const TypeIcon = item.icon;
                                return (
                                  <button
                                    key={item.key}
                                    onClick={() => {
                                      handleAddLesson(item.key);
                                      setShowAddDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <TypeIcon className={`w-3.5 h-3.5 ${item.color}`} />
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <p className="px-3 py-2 text-xs text-gray-400 italic">
                        Select a module to add lessons
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-3 mb-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 flex-1">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Module Tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {sortedModules.map((mod, modIdx) => {
            const isEvent = mod.type === 'event';
            const isExpanded = expandedModules[mod.id] ?? false;
            const isModSelected = selectedModuleId === mod.id && !selectedLesson;
            const sortedLessons = [...(mod.lessons || [])].sort((a, b) => a.order - b.order);
            const modulePoints = getModulePoints(mod);
            const moduleNumber = isEvent ? 0 : moduleItems.findIndex((m) => m.id === mod.id) + 1;

            // Event rendering
            if (isEvent) {
              return (
                <div key={mod.id} className="group/event border-l-[3px] border-blue-400">
                  <div
                    className={`flex items-center gap-2 px-3 py-3 transition-colors cursor-pointer ${
                      isModSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectModule(mod.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <Calendar
                        className={`w-4 h-4 shrink-0 ${isModSelected ? 'text-blue-500' : 'text-blue-400'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 leading-none mb-0.5">
                          Event
                        </p>
                        <p
                          className={`text-sm font-semibold truncate ${isModSelected ? 'text-blue-600' : 'text-gray-900'}`}
                        >
                          {mod.title}
                        </p>
                        {mod.eventConfig?.date && (
                          <p className="text-xs text-gray-400">{mod.eventConfig.date}</p>
                        )}
                      </div>
                    </button>
                    {/* Reorder buttons */}
                    <div className="flex flex-col opacity-0 group-hover/event:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveModule(mod.id, 'up');
                        }}
                        disabled={modIdx === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveModule(mod.id, 'down');
                        }}
                        disabled={modIdx === sortedModules.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={mod.id} className="border-l-[3px] border-red-500">
                {/* Module Header */}
                <div
                  className={`group/mod flex items-center gap-2 px-3 py-3 bg-gray-50/80 transition-colors cursor-pointer ${
                    isModSelected ? 'bg-red-50' : 'hover:bg-gray-100/80'
                  }`}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleToggleModule(e, mod.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleModule(e as unknown as React.MouseEvent, mod.id);
                      }
                    }}
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  {/* Module number badge */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isModSelected ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {moduleNumber}
                  </span>
                  <button
                    onClick={() => handleSelectModule(mod.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p
                      className={`text-sm font-semibold truncate ${isModSelected ? 'text-red-600' : 'text-gray-900'}`}
                    >
                      {mod.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''} &bull;{' '}
                      {modulePoints} pts
                    </p>
                  </button>
                  {/* Reorder buttons */}
                  <div className="flex flex-col opacity-0 group-hover/mod:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveModule(mod.id, 'up');
                      }}
                      disabled={modIdx === 0}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
                      aria-label="Move module up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveModule(mod.id, 'down');
                      }}
                      disabled={modIdx === sortedModules.length - 1}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
                      aria-label="Move module down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lesson List */}
                {isExpanded && (
                  <>
                    {sortedLessons.map((lesson, lessonIdx) => {
                      const display = getLessonDisplay(lesson);
                      const TypeIcon = display.icon;
                      const isLessonSelected = selectedLesson?.id === lesson.id;

                      return (
                        <div
                          key={lesson.id}
                          className={`group/lesson flex items-center gap-2.5 pl-12 pr-3 py-2 transition-colors ${
                            isLessonSelected ? 'bg-red-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <button
                            onClick={() => handleSelectLesson(lesson, mod.id)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                          >
                            <TypeIcon
                              className={`w-4 h-4 shrink-0 ${isLessonSelected ? 'text-red-500' : display.color}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-sm truncate ${isLessonSelected ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                                >
                                  {lesson.title}
                                </p>
                                {lesson.status === 'draft' && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full shrink-0">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{lesson.points} pts</p>
                            </div>
                          </button>
                          {/* Reorder buttons */}
                          <div className="flex flex-col opacity-0 group-hover/lesson:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(mod.id, lesson.id, 'up');
                              }}
                              disabled={lessonIdx === 0}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
                              aria-label="Move lesson up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(mod.id, lesson.id, 'down');
                              }}
                              disabled={lessonIdx === sortedLessons.length - 1}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
                              aria-label="Move lesson down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {/* Inline Add Lesson */}
                    <div className="pl-12 pr-3 py-1.5">
                      <button
                        ref={selectedModuleId === mod.id ? addLessonBtnRef : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Set this module as selected for lesson creation
                          setSelectedModuleId(mod.id);
                          setSelectedLesson(null);
                          setSelectedLessonModuleId(null);
                          setExpandedModules((prev) => ({ ...prev, [mod.id]: true }));
                          // Calculate position from button
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuHeight = 320; // max-h-80 = 20rem = 320px
                          const spaceBelow = window.innerHeight - rect.bottom;
                          setAddLessonMenuPos({
                            top:
                              spaceBelow < menuHeight
                                ? Math.max(8, rect.top - menuHeight)
                                : rect.bottom + 2,
                            left: rect.left,
                          });
                          // Toggle dropdown
                          setShowAddLessonMenu((prev) => !(prev && selectedModuleId === mod.id));
                        }}
                        disabled={isCreatingLesson}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add lesson
                      </button>
                      {showAddLessonMenu && selectedModuleId === mod.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowAddLessonMenu(false)}
                          />
                          <div
                            className="fixed w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-80 overflow-y-auto"
                            style={{ top: addLessonMenuPos.top, left: addLessonMenuPos.left }}
                          >
                            {(['Content', 'Reflection', 'Activity'] as const).map((group) => {
                              const items = ADD_MENU_CONFIG.filter((c) => c.group === group);
                              return (
                                <div key={group}>
                                  <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {group}
                                  </div>
                                  {items.map((item) => {
                                    const TypeIcon = item.icon;
                                    return (
                                      <button
                                        key={item.key}
                                        onClick={() => handleAddLesson(item.key)}
                                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                      >
                                        <TypeIcon className={`w-3.5 h-3.5 ${item.color}`} />
                                        {item.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom buttons removed — actions now in sticky action bar at top */}
      </div>

      {/* ======== RIGHT PANEL ======== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
            aria-label="Open curriculum sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 truncate">
            {selectedLesson?.title ||
              (selectedModuleId
                ? sortedModules.find((m) => m.id === selectedModuleId)?.title
                : 'Structure & Content')}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* --- Edit Lesson View --- */}
          {selectedLesson ? (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Back link */}
              <button
                onClick={handleBackToProgram}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                Back to Program
              </button>

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    {(() => {
                      const { icon: TypeIcon } = getLessonDisplay(selectedLesson);
                      return <TypeIcon className="w-5 h-5 text-red-600" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Edit Lesson</h2>
                    <p className="text-sm text-gray-500">
                      Configure lesson content and role-specific settings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Preview with role selector */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (tenantId) params.set('tenantId', tenantId);
                        if (previewRole) params.set('previewRole', previewRole);
                        const qs = params.toString();
                        window.open(`/programs/${program.id}/learn${qs ? `?${qs}` : ''}`, '_blank');
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <select
                      value={previewRole}
                      onChange={(e) => setPreviewRole(e.target.value as EnrollmentRole)}
                      className="border-l border-gray-200 px-2 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 outline-none cursor-pointer"
                      title="Preview as role"
                    >
                      <option value="learner">as Learner</option>
                      <option value="mentor">as Mentor</option>
                      <option value="facilitator">as Facilitator</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSaveLesson}
                    disabled={updateLesson.isPending}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      saveStatus === 'saved'
                        ? 'bg-green-600 text-white'
                        : saveStatus === 'error'
                          ? 'bg-red-800 text-white'
                          : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {saveStatus === 'saved' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {updateLesson.isPending
                      ? 'Saving...'
                      : saveStatus === 'saved'
                        ? 'Saved'
                        : saveStatus === 'error'
                          ? 'Save Failed'
                          : 'Save Lesson'}
                    {isDirty && saveStatus === 'idle' && !updateLesson.isPending && (
                      <span className="w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </button>
                  <button
                    onClick={handleDeleteLesson}
                    disabled={deleteLesson.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteLesson.isPending ? 'Deleting...' : 'Delete Lesson'}
                  </button>
                </div>
              </div>

              {/* Lesson Settings Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Lesson Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Lesson Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                      placeholder="Lesson title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Lesson Type
                    </label>
                    <select
                      value={editContentType}
                      onChange={(e) => setEditContentType(e.target.value as ContentType)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                    >
                      {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {key === 'lesson' && selectedLesson
                            ? getLessonDisplay(selectedLesson).label
                            : config!.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Points</label>
                    <input
                      type="number"
                      value={editPoints}
                      onChange={(e) =>
                        setEditPoints(
                          e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                        )
                      }
                      min={0}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Estimated Duration
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) =>
                          setEditDuration(
                            e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                          )
                        }
                        min={0}
                        className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Required Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-gray-500" />
                  <h3 className="text-base font-semibold text-gray-900">Approval Workflow</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Require mentor or facilitator approval before this lesson is marked as complete.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: 'none',
                        label: 'No Approval',
                        desc: 'Learner completes on their own',
                      },
                      {
                        value: 'mentor',
                        label: 'Mentor Approval',
                        desc: 'Mentor must approve completion',
                      },
                      {
                        value: 'facilitator',
                        label: 'Facilitator Approval',
                        desc: 'Facilitator must approve completion',
                      },
                      {
                        value: 'both',
                        label: 'Both Required',
                        desc: 'Both mentor and facilitator must approve',
                      },
                    ] as { value: ApprovalRequired; label: string; desc: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEditApprovalRequired(opt.value)}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg text-left transition-colors ${
                        editApprovalRequired === opt.value
                          ? 'border-red-500 bg-red-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          editApprovalRequired === opt.value ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {editApprovalRequired === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Mode Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Content Mode</h3>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={() => handleContentModeChange('shared')}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                      contentMode === 'shared'
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        contentMode === 'shared' ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {contentMode === 'shared' && (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Shared Content</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        All roles (Learners, Mentors, Facilitators) see the same lesson content
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleContentModeChange('role-specific')}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                      contentMode === 'role-specific'
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        contentMode === 'role-specific' ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {contentMode === 'role-specific' && (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Role-Specific Content</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Customize lesson content separately for each role (ideal for mentor
                        meetings, facilitated sessions)
                      </p>
                    </div>
                  </button>
                </div>
                {contentMode === 'role-specific' ? (
                  <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-800">
                      <span className="font-medium">Role-Specific Mode Active:</span> You&apos;re
                      now customizing content for each role. Use the tabs below to edit content for
                      Learners, Mentors, and Facilitators separately.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800">
                      <span className="font-medium">Best Practice:</span> Most lessons use shared
                      content (readings, videos, assignments). Use role-specific only when different
                      participants need completely different materials.
                    </p>
                  </div>
                )}
              </div>

              {/* Role Tabs Card (only in role-specific mode) */}
              {contentMode === 'role-specific' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  {/* Role tabs */}
                  <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
                    {[
                      {
                        role: 'learner' as EnrollmentRole,
                        label: 'Learner Content',
                        icon: GraduationCap,
                      },
                      { role: 'mentor' as EnrollmentRole, label: 'Mentor Content', icon: Users },
                      {
                        role: 'facilitator' as EnrollmentRole,
                        label: 'Facilitator Content',
                        icon: ShieldCheck,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.role}
                        onClick={() => handleRoleTabChange(tab.role)}
                        role="tab"
                        aria-selected={activeRoleTab === tab.role}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                          activeRoleTab === tab.role
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {/* Copy buttons */}
                  {activeRoleTab !== 'learner' && (
                    <div className="flex items-center gap-2">
                      {activeRoleTab === 'mentor' && (
                        <button
                          onClick={() => handleCopyFromRole('learner')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy from Learner
                        </button>
                      )}
                      {activeRoleTab === 'facilitator' && (
                        <>
                          <button
                            onClick={() => handleCopyFromRole('learner')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy from Learner
                          </button>
                          <button
                            onClick={() => handleCopyFromRole('mentor')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy from Mentor
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Content Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-gray-900">
                    {contentMode === 'role-specific'
                      ? `${activeRoleTab.charAt(0).toUpperCase() + activeRoleTab.slice(1)} Content`
                      : 'Lesson Content'}
                  </h3>
                  {contentMode === 'shared' && (
                    <span className="text-xs text-gray-400">Shared across all roles</span>
                  )}
                </div>
                {renderLessonContent()}
              </div>

              {/* Resources / Attachments Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Link className="w-5 h-5 text-gray-500" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Resources &amp; Attachments
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      const resources = editContent.resources || [];
                      setEditContent({
                        ...editContent,
                        resources: [...resources, { title: '', url: '', type: 'link' as const }],
                      });
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    + Add Resource
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Add downloadable files, links, or reference materials for this lesson.
                </p>
                {(editContent.resources || []).length > 0 ? (
                  <div className="space-y-3">
                    {(editContent.resources || []).map((res, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={res.title}
                            onChange={(e) => {
                              const resources = [...(editContent.resources || [])];
                              resources[i] = { ...resources[i], title: e.target.value };
                              setEditContent({ ...editContent, resources });
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
                            placeholder="Resource title..."
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={res.url}
                              onChange={(e) => {
                                const resources = [...(editContent.resources || [])];
                                resources[i] = { ...resources[i], url: e.target.value };
                                setEditContent({ ...editContent, resources });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
                              placeholder="URL or file link..."
                            />
                            <select
                              value={res.type || 'link'}
                              onChange={(e) => {
                                const resources = [...(editContent.resources || [])];
                                resources[i] = {
                                  ...resources[i],
                                  type: e.target.value as
                                    | 'pdf'
                                    | 'doc'
                                    | 'video'
                                    | 'link'
                                    | 'spreadsheet',
                                };
                                setEditContent({ ...editContent, resources });
                              }}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white w-32"
                            >
                              <option value="link">Link</option>
                              <option value="pdf">PDF</option>
                              <option value="doc">Document</option>
                              <option value="video">Video</option>
                              <option value="spreadsheet">Spreadsheet</option>
                            </select>
                          </div>
                          {/* Video preview for video-type resources */}
                          {res.type === 'video' &&
                            res.url &&
                            (() => {
                              const embedUrl = getEmbedUrl(res.url);
                              const provider = getVideoProvider(res.url);
                              if (embedUrl && provider) {
                                return (
                                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                                    <div className="aspect-video bg-black">
                                      <iframe
                                        src={embedUrl}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={res.title || 'Video preview'}
                                      />
                                    </div>
                                    <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                                      <Video className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="text-xs text-gray-500 capitalize">
                                        {provider}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              if (res.url) {
                                return (
                                  <p className="text-xs text-amber-600 mt-1.5">
                                    Could not recognize video URL. Paste a YouTube or Vimeo link.
                                  </p>
                                );
                              }
                              return null;
                            })()}
                        </div>
                        <button
                          onClick={() => {
                            setEditContent({
                              ...editContent,
                              resources: (editContent.resources || []).filter(
                                (_, idx) => idx !== i
                              ),
                            });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors mt-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    No resources added yet. Click &quot;+ Add Resource&quot; to attach worksheets,
                    links, or files.
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <TaskEditor
                tasks={selectedLesson.tasks || []}
                onCreateTask={(input: CreateTaskInput) => createTask.mutate(input)}
                onUpdateTask={(taskId: string, input: UpdateTaskInput) =>
                  updateTask.mutate({ taskId, input })
                }
                onDeleteTask={(taskId: string) => deleteTask.mutate(taskId)}
                isCreating={createTask.isPending}
              />

              {/* Lesson Visibility Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <h3 className="text-base font-semibold text-gray-900">Lesson Visibility</h3>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>

                <div className="space-y-4">
                  {/* Visible to Learners */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Visible to Learners</p>
                        <p className="text-xs text-gray-500">
                          Learners will see this lesson in their program
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={editVisibleTo.learner}
                      onChange={(v) => setEditVisibleTo({ ...editVisibleTo, learner: v })}
                    />
                  </div>

                  {/* Visible to Mentors */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Visible to Mentors</p>
                        <p className="text-xs text-gray-500">
                          Mentors will see this lesson for coaching preparation
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={editVisibleTo.mentor}
                      onChange={(v) => setEditVisibleTo({ ...editVisibleTo, mentor: v })}
                    />
                  </div>

                  {/* Visible to Facilitators */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Visible to Facilitators</p>
                        <p className="text-xs text-gray-500">
                          Facilitators will see this lesson for session planning
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={editVisibleTo.facilitator}
                      onChange={(v) => setEditVisibleTo({ ...editVisibleTo, facilitator: v })}
                    />
                  </div>
                </div>

                {/* Best Practice */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 italic">
                    <span className="font-medium">Best Practice:</span> Most lessons are visible to
                    all roles. Hide lessons from specific roles only when the content is truly
                    irrelevant (e.g., hide learner prep materials from facilitators).
                  </p>
                </div>
              </div>
            </div>
          ) : selectedModule?.type === 'event' ? (
            /* --- Event Editor View --- */
            <EventEditor
              event={selectedModule}
              onSave={handleSaveEvent}
              onDelete={handleDeleteEvent}
              isSaving={updateModule.isPending}
              isDeleting={deleteModule.isPending}
            />
          ) : selectedModule ? (
            /* --- Module Settings View --- */
            <div className="p-6 space-y-6">
              {/* Header with actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Module Settings</h2>
                    <p className="text-sm text-gray-500">Configure module details and structure</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveModuleSettings}
                    disabled={updateModule.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updateModule.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleDeleteModule}
                    disabled={deleteModule.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Module Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Module Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Module Title
                    </label>
                    <input
                      type="text"
                      value={editModuleTitle}
                      onChange={(e) => setEditModuleTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                      placeholder="Module title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={editModuleDescription}
                      onChange={(e) => setEditModuleDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                      placeholder="Describe this module..."
                    />
                  </div>
                </div>
              </div>

              {/* Module Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Module Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center py-3 border border-gray-200 rounded-lg">
                    <div className="text-xl font-semibold text-gray-900">
                      {(selectedModule.lessons || []).length}
                    </div>
                    <div className="text-xs text-gray-500">Lessons</div>
                  </div>
                  <div className="text-center py-3 border border-gray-200 rounded-lg">
                    <div className="text-xl font-semibold text-gray-900">
                      {getModulePoints(selectedModule)}
                    </div>
                    <div className="text-xs text-gray-500">Total Points</div>
                  </div>
                  <div className="text-center py-3 border border-gray-200 rounded-lg">
                    <div className="text-xl font-semibold text-gray-900">
                      {selectedModule.status === 'active' ? 'Published' : 'Draft'}
                    </div>
                    <div className="text-xs text-gray-500">Status</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- Curriculum Overview --- */
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Curriculum Overview</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Click a module or lesson in the sidebar to edit it
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Menu className="w-4 h-4" />
                  Sidebar
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FolderOpen className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Modules</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">{totalModules}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Lessons</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">{totalLessons}</div>
                </div>
                {totalEvents > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Events</span>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{totalEvents}</div>
                  </div>
                )}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Points</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {sortedModules.reduce(
                      (sum, m) => sum + (m.lessons || []).reduce((s, l) => s + (l.points || 0), 0),
                      0
                    )}
                  </div>
                </div>
              </div>

              {/* Program Outline */}
              {sortedModules.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                    <Plus className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">No Modules Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your first module to start building the curriculum.
                  </p>
                  <button
                    onClick={handleAddModule}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Module
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedModules.map((mod) => {
                    const isEvent = mod.type === 'event';
                    const sortedLessonsForMod = [...(mod.lessons || [])].sort(
                      (a, b) => a.order - b.order
                    );
                    const modPoints = (mod.lessons || []).reduce((s, l) => s + (l.points || 0), 0);
                    const moduleNum = isEvent
                      ? 0
                      : moduleItems.findIndex((m) => m.id === mod.id) + 1;

                    return (
                      <div
                        key={mod.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
                      >
                        {/* Module Header */}
                        <button
                          onClick={() => handleSelectModule(mod.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                            isEvent
                              ? 'border-l-[3px] border-blue-400'
                              : 'border-l-[3px] border-red-500'
                          }`}
                        >
                          {isEvent ? (
                            <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {moduleNum}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            {isEvent && (
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 leading-none mb-0.5">
                                Event
                              </p>
                            )}
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {mod.title}
                            </p>
                            {mod.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {mod.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {!isEvent && sortedLessonsForMod.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {sortedLessonsForMod.length} lesson
                                {sortedLessonsForMod.length !== 1 ? 's' : ''} &bull; {modPoints} pts
                              </span>
                            )}
                            {isEvent && mod.eventConfig?.date && (
                              <span className="text-xs text-gray-400">{mod.eventConfig.date}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
                        </button>

                        {/* Lesson list (non-events only, max 5 shown) */}
                        {!isEvent && sortedLessonsForMod.length > 0 && (
                          <div className="border-t border-gray-100">
                            {sortedLessonsForMod.slice(0, 5).map((lesson) => {
                              const display = getLessonDisplay(lesson);
                              const TypeIcon = display.icon;
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => handleSelectLesson(lesson, mod.id)}
                                  className="w-full flex items-center gap-2.5 pl-14 pr-4 py-2 text-left hover:bg-gray-50 transition-colors"
                                >
                                  <TypeIcon className={`w-3.5 h-3.5 shrink-0 ${display.color}`} />
                                  <span className="text-sm text-gray-700 truncate flex-1">
                                    {lesson.title}
                                  </span>
                                  {lesson.status === 'draft' && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full shrink-0">
                                      Draft
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400 shrink-0">
                                    {lesson.points} pts
                                  </span>
                                </button>
                              );
                            })}
                            {sortedLessonsForMod.length > 5 && (
                              <div className="pl-14 pr-4 py-2 text-xs text-gray-400">
                                +{sortedLessonsForMod.length - 5} more lesson
                                {sortedLessonsForMod.length - 5 !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======== MOBILE FAB ======== */}
        {!sidebarOpen && (
          <div className="fixed bottom-6 right-6 z-30 lg:hidden">
            <button
              onClick={() => setShowMobileFab((prev) => !prev)}
              className="w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all flex items-center justify-center active:scale-95"
              aria-label="Add content"
            >
              <Plus
                className={`w-6 h-6 transition-transform duration-200 ${showMobileFab ? 'rotate-45' : ''}`}
              />
            </button>
          </div>
        )}

        {/* Mobile FAB Bottom Sheet */}
        {showMobileFab && !sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setShowMobileFab(false)}
            />
            <div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto lg:hidden"
              style={{ animation: 'slideUp 0.3s ease-out' }}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
              <div className="px-4 pb-6 pt-2">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Add Content</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      handleAddModule();
                      setShowMobileFab(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FolderOpen className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Add Module</p>
                      <p className="text-xs text-gray-500">Create a new content module</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleAddEvent();
                      setShowMobileFab(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Add Event</p>
                      <p className="text-xs text-gray-500">Schedule a live event</p>
                    </div>
                  </button>
                  {selectedModuleId && moduleItems.some((m) => m.id === selectedModuleId) && (
                    <>
                      <div className="my-2 border-t border-gray-100" />
                      <p className="text-xs font-medium text-gray-400 uppercase px-3 mb-1">
                        Add Lesson to &ldquo;
                        {sortedModules.find((m) => m.id === selectedModuleId)?.title}&rdquo;
                      </p>
                      {ADD_MENU_CONFIG.map((item) => {
                        const TypeIcon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              handleAddLesson(item.key);
                              setShowMobileFab(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <TypeIcon className={`w-4 h-4 ${item.color}`} />
                            <span className="text-sm text-gray-700">{item.label}</span>
                            <span className="text-[10px] text-gray-400 ml-auto">{item.group}</span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ======== DELETE CONFIRM DIALOG ======== */}
        {deleteTarget && (
          <ConfirmDialog
            title={`Delete ${deleteTarget.type === 'event' ? 'Event' : deleteTarget.type === 'module' ? 'Module' : 'Lesson'}`}
            message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {/* ======== UNSAVED CHANGES DIALOG ======== */}
        {pendingNavigation && (
          <ConfirmDialog
            title="Unsaved Changes"
            message="You have unsaved changes. Discard them and continue?"
            confirmLabel="Discard"
            confirmColor="bg-amber-600 hover:bg-amber-700"
            onConfirm={() => {
              const nav = pendingNavigation;
              setPendingNavigation(null);
              nav();
            }}
            onCancel={() => setPendingNavigation(null)}
          />
        )}
      </div>
    </div>
  );
}
