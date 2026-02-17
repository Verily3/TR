'use client';

import { useState, useEffect, useMemo } from 'react';
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

const CONTENT_TYPE_CONFIG: Partial<Record<ContentType, ContentTypeConfig>> = {
  lesson: { icon: BookOpen, label: 'Reading', color: 'text-blue-600' },
  quiz: { icon: HelpCircle, label: 'Quiz', color: 'text-purple-600' },
  assignment: { icon: ClipboardList, label: 'Assignment', color: 'text-orange-600' },
  text_form: { icon: FileText, label: 'Text Form', color: 'text-cyan-600' },
  goal: { icon: Target, label: 'Goal', color: 'text-yellow-600' },
};

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
    learner: true, mentor: true, facilitator: true,
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
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  // Mutation hooks — use agency or tenant variants based on context
  const tenantCreateModule = useCreateModule(tenantId, program.id);
  const tenantUpdateModule = useUpdateModule(tenantId, program.id);
  const tenantDeleteModule = useDeleteModule(tenantId, program.id);
  const tenantUpdateLesson = useUpdateLesson(tenantId, program.id, selectedLessonModuleId || undefined);
  const tenantDeleteLesson = useDeleteLesson(tenantId, program.id, selectedLessonModuleId || undefined);

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

  // Auto-expand all modules on first load
  useEffect(() => {
    if (program?.modules && Object.keys(expandedModules).length === 0) {
      const expanded: Record<string, boolean> = {};
      program.modules.forEach((m) => { expanded[m.id] = true; });
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
        else { setSelectedLesson(null); setSelectedLessonModuleId(null); }
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

      setEditVisibleTo(selectedLesson.visibleTo || { learner: true, mentor: true, facilitator: true });
      setEditDuration(selectedLesson.durationMinutes ?? '');
      setEditPoints(selectedLesson.points ?? '');
      setEditApprovalRequired(selectedLesson.approvalRequired || 'none');
    }
  }, [selectedLesson]);

  // ---- Handlers ----

  const handleSelectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLesson(null);
    setSelectedLessonModuleId(null);
    setExpandedModules((prev) => ({ ...prev, [moduleId]: true }));
  };

  const handleSelectLesson = (lesson: Lesson, moduleId: string) => {
    setSelectedLesson(lesson);
    setSelectedLessonModuleId(moduleId);
    setSelectedModuleId(null);
  };

  const handleBackToOverview = () => {
    setSelectedModuleId(null);
    setSelectedLesson(null);
    setSelectedLessonModuleId(null);
  };

  const handleBackToProgram = () => {
    if (selectedLessonModuleId) setSelectedModuleId(selectedLessonModuleId);
    setSelectedLesson(null);
    setSelectedLessonModuleId(null);
  };

  const handleToggleModule = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleAddModule = () => {
    createModule.mutate({ title: 'New Module' }, {
      onSuccess: (data: unknown) => {
        const newModule = data as { id?: string };
        if (newModule?.id) {
          setSelectedModuleId(newModule.id);
          setSelectedLesson(null);
          setSelectedLessonModuleId(null);
          setExpandedModules((prev) => ({ ...prev, [newModule.id!]: true }));
        }
      },
    });
  };

  const handleAddEvent = () => {
    createModule.mutate({ title: 'New Event', type: 'event' }, {
      onSuccess: (data: unknown) => {
        const newEvent = data as { id?: string };
        if (newEvent?.id) {
          setSelectedModuleId(newEvent.id);
          setSelectedLesson(null);
          setSelectedLessonModuleId(null);
        }
      },
    });
  };

  const handleSaveEvent = (input: UpdateModuleInput) => {
    if (!selectedModuleId) return;
    updateModule.mutate({ moduleId: selectedModuleId, input });
  };

  const handleDeleteEvent = () => {
    if (!selectedModuleId) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    deleteModule.mutate(selectedModuleId);
    setSelectedModuleId(null);
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
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) return;
    deleteModule.mutate(selectedModuleId);
    setSelectedModuleId(null);
  };

  const handleAddLesson = async (contentType: ContentType) => {
    const moduleId = selectedModuleId;
    if (!moduleId) return;
    setShowAddLessonMenu(false);
    setIsCreatingLesson(true);
    try {
      const typeConfig = CONTENT_TYPE_CONFIG[contentType];
      const title = contentType === 'sub_module' ? 'New Sub-Module' : `New ${typeConfig?.label || 'Lesson'}`;
      const basePath = isAgencyContext
        ? `/api/agencies/me/programs/${program.id}/modules/${moduleId}/lessons`
        : `/api/tenants/${tenantId}/programs/${program.id}/modules/${moduleId}/lessons`;
      await api.post(basePath, { title, contentType });
      if (isAgencyContext) {
        queryClient.invalidateQueries({ queryKey: ['agencyProgram', program.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['program', tenantId, program.id] });
      }
    } catch {
      // silent fail
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
    updateLesson.mutate({ lessonId: selectedLesson.id, input });
  };

  const handleDeleteLesson = () => {
    if (!selectedLesson || !selectedLessonModuleId) return;
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    deleteLesson.mutate(selectedLesson.id);
    setSelectedModuleId(selectedLessonModuleId);
    setSelectedLesson(null);
    setSelectedLessonModuleId(null);
  };

  const getModulePoints = (mod: Module) =>
    (mod.lessons || []).reduce((sum, l) => sum + (l.points || 0), 0);

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
    setRoleContentStore(prev => ({ ...prev, [activeRoleTab]: editContent }));
    // Load new role's content
    setEditContent(roleContentStore[newRole]);
    setActiveRoleTab(newRole);
  };

  const handleCopyFromRole = (sourceRole: EnrollmentRole) => {
    const sourceContent = sourceRole === activeRoleTab
      ? editContent
      : roleContentStore[sourceRole];
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
              <textarea
                value={editContent.introduction || ''}
                onChange={(e) => setEditContent({ ...editContent, introduction: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="Introduce the lesson and its importance..."
              />
            </div>

            {/* Video Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Video Source</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg text-center opacity-50 cursor-not-allowed"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload Video</p>
                    <p className="text-xs text-gray-500">MP4, MOV up to 500MB</p>
                  </div>
                </div>
                <div
                  className="flex flex-col items-center gap-2 p-4 border-2 border-red-500 bg-red-50/50 rounded-lg text-center cursor-default"
                >
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
                {editContent.videoUrl && (() => {
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
                          const concepts = (editContent.keyConcepts || []).filter((_, idx) => idx !== i);
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
              <textarea
                value={editContent.keyTakeaway || ''}
                onChange={(e) => setEditContent({ ...editContent, keyTakeaway: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="Summarize the main insight or action from this reading..."
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
              <textarea
                value={editContent.introduction || ''}
                onChange={(e) => setEditContent({ ...editContent, introduction: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="Introduce the lesson and its importance..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignment Instructions</label>
              <textarea
                value={editContent.instructions || ''}
                onChange={(e) => setEditContent({ ...editContent, instructions: e.target.value })}
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="Describe what learners need to do for this assignment..."
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Assignment Questions</label>
                <button
                  onClick={() => setEditContent({ ...editContent, questions: [...(editContent.questions || []), ''] })}
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
                    onClick={() => setEditContent({ ...editContent, questions: (editContent.questions || []).filter((_, idx) => idx !== i) })}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Submission Types</label>
              <p className="text-xs text-gray-500 mb-3">Select which submission methods learners can use for this assignment.</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'text', label: 'Text Entry', desc: 'Written response in a text box', icon: Type },
                  { value: 'file_upload', label: 'File Upload', desc: 'Upload PDF, Word, or other files', icon: Upload },
                  { value: 'url', label: 'URL / Link', desc: 'Submit a link to external work', icon: Link },
                  { value: 'video', label: 'Video', desc: 'Record or upload a video response', icon: Video },
                  { value: 'presentation', label: 'Presentation', desc: 'Upload slides (PPT, PDF)', icon: Presentation },
                  { value: 'spreadsheet', label: 'Spreadsheet', desc: 'Upload Excel or CSV files', icon: Table },
                ] as { value: string; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[]).map((opt) => {
                  const selected = (editContent.submissionTypes || []).includes(opt.value as 'text');
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
                      <OptIcon className={`w-4 h-4 mt-0.5 shrink-0 ${selected ? 'text-red-500' : 'text-gray-400'}`} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={editContent.maxFileSize || ''}
                    onChange={(e) => setEditContent({ ...editContent, maxFileSize: e.target.value === '' ? undefined : Number(e.target.value) })}
                    min={1}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                    placeholder="e.g., 25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Allowed File Types</label>
                  <input
                    type="text"
                    value={(editContent.allowedFileTypes || []).join(', ')}
                    onChange={(e) => setEditContent({ ...editContent, allowedFileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
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
        return (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <HelpCircle className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <h4 className="text-base font-medium text-gray-900 mb-1">Quiz Builder Coming Soon</h4>
            <p className="text-sm text-gray-500">
              The interactive quiz builder is currently in development.
            </p>
          </div>
        );

      case 'goal':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Introduction</label>
              <textarea
                value={editContent.introduction || ''}
                onChange={(e) => setEditContent({ ...editContent, introduction: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="Introduce the lesson and its importance..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal Statement Template</label>
              <textarea
                value={editContent.goalPrompt || ''}
                onChange={(e) => setEditContent({ ...editContent, goalPrompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="e.g., I will [action] by [date] as measured by [metric]..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Success Metric Guidance</label>
              <textarea
                value={editContent.metricsGuidance || ''}
                onChange={(e) => setEditContent({ ...editContent, metricsGuidance: e.target.value, requireMetrics: !!e.target.value.trim() })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="How will learners measure success? (e.g., Number of 1-on-1s conducted, feedback score, etc.)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Action Steps Template</label>
              <textarea
                value={editContent.actionStepsGuidance || ''}
                onChange={(e) => setEditContent({ ...editContent, actionStepsGuidance: e.target.value, requireActionSteps: !!e.target.value.trim() })}
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
              <textarea
                value={editContent.introduction || ''}
                onChange={(e) => setEditContent({ ...editContent, introduction: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none bg-gray-50"
                placeholder="Introduce the lesson and its importance..."
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
                  onClick={() => setEditContent({ ...editContent, reflectionPrompts: [...(editContent.reflectionPrompts || []), ''] })}
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
                    onClick={() => setEditContent({ ...editContent, reflectionPrompts: (editContent.reflectionPrompts || []).filter((_, idx) => idx !== i) })}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Length (characters)</label>
                <input
                  type="number"
                  value={editContent.minLength || ''}
                  onChange={(e) => setEditContent({ ...editContent, minLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                  min={0}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Length (characters)</label>
                <input
                  type="number"
                  value={editContent.maxLength || ''}
                  onChange={(e) => setEditContent({ ...editContent, maxLength: e.target.value === '' ? undefined : Number(e.target.value) })}
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
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* ======== LEFT SIDEBAR ======== */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-white shrink-0">
        {/* Back to Overview */}
        <button
          onClick={handleBackToOverview}
          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors border-b border-gray-100"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Back to Overview
        </button>

        {/* Stats */}
        <div className="flex gap-3 px-4 py-4 border-b border-gray-100">
          <div className="flex-1 text-center border border-gray-200 rounded-lg py-3">
            <div className="text-xl font-semibold text-gray-900">{totalModules}</div>
            <div className="text-xs text-gray-500">Modules</div>
          </div>
          <div className="flex-1 text-center border border-gray-200 rounded-lg py-3">
            <div className="text-xl font-semibold text-gray-900">{totalLessons}</div>
            <div className="text-xs text-gray-500">Lessons</div>
          </div>
          {totalEvents > 0 && (
            <div className="flex-1 text-center border border-gray-200 rounded-lg py-3">
              <div className="text-xl font-semibold text-gray-900">{totalEvents}</div>
              <div className="text-xs text-gray-500">Events</div>
            </div>
          )}
        </div>

        {/* Module Tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {sortedModules.map((mod) => {
            const isEvent = mod.type === 'event';
            const isExpanded = expandedModules[mod.id] ?? false;
            const isModSelected = selectedModuleId === mod.id && !selectedLesson;
            const sortedLessons = [...(mod.lessons || [])].sort((a, b) => a.order - b.order);
            const modulePoints = getModulePoints(mod);

            // Event rendering
            if (isEvent) {
              return (
                <div key={mod.id}>
                  <button
                    onClick={() => handleSelectModule(mod.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                      isModSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="p-0.5 w-5" />
                    <Calendar className={`w-4 h-4 shrink-0 ${isModSelected ? 'text-blue-500' : 'text-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 leading-none mb-0.5">Event</p>
                      <p className={`text-sm font-medium truncate ${isModSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        {mod.title}
                      </p>
                      {mod.eventConfig?.date && (
                        <p className="text-xs text-gray-400">{mod.eventConfig.date}</p>
                      )}
                    </div>
                  </button>
                </div>
              );
            }

            return (
              <div key={mod.id}>
                {/* Module Header */}
                <button
                  onClick={() => handleSelectModule(mod.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                    isModSelected ? 'bg-red-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleToggleModule(e, mod.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleModule(e as unknown as React.MouseEvent, mod.id); } }}
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <FolderOpen className={`w-4 h-4 shrink-0 ${isModSelected ? 'text-red-500' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isModSelected ? 'text-red-600' : 'text-gray-900'}`}>
                      {mod.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''} &bull; {modulePoints} pts
                    </p>
                  </div>
                </button>

                {/* Lesson List */}
                {isExpanded && (
                  <>
                    {sortedLessons.map((lesson) => {
                      const typeConfig = CONTENT_TYPE_CONFIG[lesson.contentType] || CONTENT_TYPE_CONFIG.lesson!;
                      const TypeIcon = typeConfig!.icon;
                      const isLessonSelected = selectedLesson?.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleSelectLesson(lesson, mod.id)}
                          className={`w-full flex items-center gap-2.5 pl-12 pr-3 py-2 text-left transition-colors ${
                            isLessonSelected ? 'bg-red-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <TypeIcon className={`w-4 h-4 shrink-0 ${isLessonSelected ? 'text-red-500' : typeConfig!.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isLessonSelected ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {lesson.points} pts
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    {/* Inline Add Lesson */}
                    <div className="relative pl-12 pr-3 py-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Set this module as selected for lesson creation
                          setSelectedModuleId(mod.id);
                          setSelectedLesson(null);
                          setSelectedLessonModuleId(null);
                          setExpandedModules((prev) => ({ ...prev, [mod.id]: true }));
                          // Toggle dropdown
                          setShowAddLessonMenu((prev) => !(prev && selectedModuleId === mod.id));
                        }}
                        disabled={isCreatingLesson}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add lesson
                      </button>
                      {showAddLessonMenu && selectedModuleId === mod.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowAddLessonMenu(false)} />
                          <div className="absolute left-12 top-full mt-0.5 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-64 overflow-y-auto">
                            <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Content type
                            </div>
                            {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => {
                              if (!config) return null;
                              const TypeIcon = config.icon;
                              return (
                                <button
                                  key={key}
                                  onClick={() => handleAddLesson(key as ContentType)}
                                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <TypeIcon className={`w-3.5 h-3.5 ${config.color}`} />
                                  {config.label}
                                </button>
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

        {/* Add Module / Event Buttons */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={handleAddModule}
            disabled={createModule.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {createModule.isPending ? 'Adding...' : 'Add Module'}
          </button>
          <button
            onClick={handleAddEvent}
            disabled={createModule.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* ======== RIGHT PANEL ======== */}
      <div className="flex-1 overflow-y-auto">
        {/* --- Edit Lesson View --- */}
        {selectedLesson ? (
          <div className="p-6 space-y-6">
            {/* Back link */}
            <button
              onClick={handleBackToProgram}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              Back to Program
            </button>

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  {(() => {
                    const TypeIcon = CONTENT_TYPE_CONFIG[selectedLesson.contentType]?.icon || BookOpen;
                    return <TypeIcon className="w-5 h-5 text-red-600" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Edit Lesson</h2>
                  <p className="text-sm text-gray-500">Configure lesson content and role-specific settings</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updateLesson.isPending ? 'Saving...' : 'Save Lesson'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lesson Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                    placeholder="Lesson title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lesson Type</label>
                  <select
                    value={editContentType}
                    onChange={(e) => setEditContentType(e.target.value as ContentType)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                  >
                    {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config!.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Points</label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Duration</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value === '' ? '' : Number(e.target.value))}
                      min={0}
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">min</span>
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
                {([
                  { value: 'none', label: 'No Approval', desc: 'Learner completes on their own' },
                  { value: 'mentor', label: 'Mentor Approval', desc: 'Mentor must approve completion' },
                  { value: 'facilitator', label: 'Facilitator Approval', desc: 'Facilitator must approve completion' },
                  { value: 'both', label: 'Both Required', desc: 'Both mentor and facilitator must approve' },
                ] as { value: ApprovalRequired; label: string; desc: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEditApprovalRequired(opt.value)}
                    className={`flex items-start gap-3 p-3 border-2 rounded-lg text-left transition-colors ${
                      editApprovalRequired === opt.value
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      editApprovalRequired === opt.value ? 'border-red-500' : 'border-gray-300'
                    }`}>
                      {editApprovalRequired === opt.value && <div className="w-2 h-2 rounded-full bg-red-500" />}
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
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    contentMode === 'shared' ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    {contentMode === 'shared' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Shared Content</p>
                    <p className="text-xs text-gray-500 mt-0.5">All roles (Learners, Mentors, Facilitators) see the same lesson content</p>
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
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    contentMode === 'role-specific' ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    {contentMode === 'role-specific' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Role-Specific Content</p>
                    <p className="text-xs text-gray-500 mt-0.5">Customize lesson content separately for each role (ideal for mentor meetings, facilitated sessions)</p>
                  </div>
                </button>
              </div>
              {contentMode === 'role-specific' ? (
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-800">
                    <span className="font-medium">Role-Specific Mode Active:</span> You&apos;re now customizing content for each role. Use the tabs below to edit content for Learners, Mentors, and Facilitators separately.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">Best Practice:</span> Most lessons use shared content (readings, videos, assignments). Use role-specific only when different participants need completely different materials.
                  </p>
                </div>
              )}
            </div>

            {/* Role Tabs Card (only in role-specific mode) */}
            {contentMode === 'role-specific' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {/* Role tabs */}
                <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
                  {([
                    { role: 'learner' as EnrollmentRole, label: 'Learner Content', icon: GraduationCap },
                    { role: 'mentor' as EnrollmentRole, label: 'Mentor Content', icon: Users },
                    { role: 'facilitator' as EnrollmentRole, label: 'Facilitator Content', icon: ShieldCheck },
                  ]).map((tab) => (
                    <button
                      key={tab.role}
                      onClick={() => handleRoleTabChange(tab.role)}
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
                  <h3 className="text-base font-semibold text-gray-900">Resources &amp; Attachments</h3>
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
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
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
                              resources[i] = { ...resources[i], type: e.target.value as 'pdf' | 'doc' | 'video' | 'link' | 'spreadsheet' };
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
                      </div>
                      <button
                        onClick={() => {
                          setEditContent({
                            ...editContent,
                            resources: (editContent.resources || []).filter((_, idx) => idx !== i),
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
                  No resources added yet. Click &quot;+ Add Resource&quot; to attach worksheets, links, or files.
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <TaskEditor
              tasks={selectedLesson.tasks || []}
              onCreateTask={(input: CreateTaskInput) => createTask.mutate(input)}
              onUpdateTask={(taskId: string, input: UpdateTaskInput) => updateTask.mutate({ taskId, input })}
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
                      <p className="text-xs text-gray-500">Learners will see this lesson in their program</p>
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
                      <p className="text-xs text-gray-500">Mentors will see this lesson for coaching preparation</p>
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
                      <p className="text-xs text-gray-500">Facilitators will see this lesson for session planning</p>
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
                  <span className="font-medium">Best Practice:</span> Most lessons are visible to all roles. Hide lessons from specific roles only when the content is truly irrelevant (e.g., hide learner prep materials from facilitators).
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Module Title</label>
                  <input
                    type="text"
                    value={editModuleTitle}
                    onChange={(e) => setEditModuleTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50"
                    placeholder="Module title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
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
              <div className="grid grid-cols-3 gap-4">
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
          /* --- Empty State --- */
          <div className="h-full flex items-center justify-center p-12">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Structure & Content</h3>
              <p className="text-sm text-gray-500 mb-4">
                Select a module from the left panel to configure its settings, or click a lesson to edit its content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
