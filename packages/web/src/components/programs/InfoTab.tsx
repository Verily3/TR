'use client';

import { useState, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  CircleDot,
  Calendar,
  Mail,
  Settings,
  Plus,
  Upload,
  Clock,
  Info,
  Sparkles,
  Library,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  ProgramWithModules,
  ProgramConfig,
  ProgramType,
  UpdateProgramInput,
} from '@/types/programs';
import {
  learningTracks,
  timeZones,
  defaultBeforeDueReminders,
  defaultAfterDueReminders,
} from './wizard-data';

type InfoSection = 'basic' | 'objectives' | 'schedule' | 'communication' | 'settings';

const SECTION_TABS: {
  id: InfoSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'basic', label: 'Basic\nInformation', icon: LayoutDashboard },
  { id: 'objectives', label: 'Learning\nObjectives', icon: CircleDot },
  { id: 'schedule', label: 'Schedule &\nDates', icon: Calendar },
  { id: 'communication', label: 'Communication', icon: Mail },
  { id: 'settings', label: 'Settings &\nConfig', icon: Settings },
];

interface InfoTabProps {
  program: ProgramWithModules;
  onSave: (input: UpdateProgramInput) => Promise<unknown>;
  isSaving: boolean;
}

// ============================================
// Shared UI Components
// ============================================

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
        enabled ? 'bg-red-600' : 'bg-gray-300'
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

function SettingRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children} <span className="text-red-500">*</span>
    </label>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500 mt-1.5">{children}</p>;
}

const INPUT_CLASS =
  'w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none';
const SELECT_CLASS =
  'w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none';

// ============================================
// Main InfoTab Component
// ============================================

export function InfoTab({ program, onSave, isSaving }: InfoTabProps) {
  const [activeSection, setActiveSection] = useState<InfoSection>('basic');
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Top-level program fields
  const [formName, setFormName] = useState(program.name || '');
  const [formInternalName, setFormInternalName] = useState(program.internalName || '');
  const [formDescription, setFormDescription] = useState(program.description || '');
  const [formType, setFormType] = useState<ProgramType>(program.type || 'cohort');
  const [formStartDate, setFormStartDate] = useState(program.startDate?.split('T')[0] || '');
  const [formEndDate, setFormEndDate] = useState(program.endDate?.split('T')[0] || '');
  const [formTimezone, setFormTimezone] = useState(program.timezone || 'America/New_York');
  const [formCoverImage, setFormCoverImage] = useState(program.coverImage || '');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Config fields (JSONB)
  const [formConfig, setFormConfig] = useState<ProgramConfig>(() => {
    const cfg = program.config || {};
    return {
      ...cfg,
      objectives: cfg.objectives?.length
        ? cfg.objectives
        : [
            { id: '1', text: '' },
            { id: '2', text: '' },
            { id: '3', text: '' },
          ],
      emailSettings: cfg.emailSettings ?? {},
      beforeDueReminders: cfg.beforeDueReminders?.length
        ? cfg.beforeDueReminders
        : defaultBeforeDueReminders,
      afterDueReminders: cfg.afterDueReminders?.length
        ? cfg.afterDueReminders
        : defaultAfterDueReminders,
    };
  });

  const updateConfig = (updates: Partial<ProgramConfig>) => {
    setFormConfig((prev) => ({ ...prev, ...updates }));
  };

  // Computed program duration in weeks
  const computedDuration = useMemo(() => {
    if (formStartDate && formEndDate) {
      const start = new Date(formStartDate);
      const end = new Date(formEndDate);
      const diffMs = end.getTime() - start.getTime();
      const weeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
      return weeks > 0 ? weeks : null;
    }
    return null;
  }, [formStartDate, formEndDate]);

  const handleSave = async () => {
    // Normalize date-only strings to ISO 8601 datetime for Zod .datetime() validation
    const normalizeDate = (d: string) => (d ? new Date(d).toISOString() : undefined);

    const input: UpdateProgramInput = {
      name: formName.trim() || program.name,
      internalName: formInternalName.trim() || undefined,
      description: formDescription.trim() || undefined,
      type: formType,
      coverImage: formCoverImage || undefined,
      startDate: normalizeDate(formStartDate),
      endDate: normalizeDate(formEndDate),
      timezone: formTimezone || undefined,
      config: formConfig,
    };

    setSaveMessage(null);
    try {
      await onSave(input);
      setSaveMessage({ type: 'success', text: 'Changes saved successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Section Navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-4 mb-6 overflow-x-auto">
        {SECTION_TABS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-pre-line leading-tight">{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* Basic Information */}
      {/* ============================================ */}
      {activeSection === 'basic' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <p className="text-sm text-gray-500 mt-1">Set up the core details of your program</p>
          </div>

          <div className="space-y-5">
            {/* Internal Name */}
            <div>
              <RequiredLabel>Internal Name</RequiredLabel>
              <input
                type="text"
                value={formInternalName}
                onChange={(e) => setFormInternalName(e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. LEADER-SHIFT-2025"
              />
              <HelperText>For internal tracking and reporting (not visible to learners)</HelperText>
            </div>

            {/* Program Title */}
            <div>
              <RequiredLabel>Program Title</RequiredLabel>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. LeaderShift: Manager to Leader Transformation"
              />
              <HelperText>Choose a clear, memorable name for your program</HelperText>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCoverError(null);

                  if (!file.type.startsWith('image/')) {
                    setCoverError('Please select an image file (JPG, PNG, or WebP).');
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setCoverError(
                      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 5 MB.`
                    );
                    return;
                  }

                  setCoverUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const result = await api.uploadFile<{ key: string; url: string }>(
                      `/api/upload/cover/${program.id}`,
                      formData
                    );
                    setFormCoverImage(result.data.url);
                  } catch (err) {
                    setCoverError(err instanceof Error ? err.message : 'Upload failed');
                  } finally {
                    setCoverUploading(false);
                    if (coverInputRef.current) coverInputRef.current.value = '';
                  }
                }}
              />

              {formCoverImage ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formCoverImage}
                    alt="Program cover"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-gray-700 shadow-sm"
                      title="Change cover image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setCoverUploading(true);
                        try {
                          await api.delete(`/api/upload/cover/${program.id}`);
                          setFormCoverImage('');
                        } catch {
                          setCoverError('Failed to remove cover image.');
                        } finally {
                          setCoverUploading(false);
                        }
                      }}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-red-600 shadow-sm"
                      title="Remove cover image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {coverUploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {coverUploading ? (
                    <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium text-gray-700">Click to upload program cover</p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP up to 5MB (Recommended: 1200x600px)
                  </p>
                </button>
              )}

              {coverError && <p className="text-sm text-red-600 mt-1.5">{coverError}</p>}
              <HelperText>
                This image appears on the program overview and in program listings
              </HelperText>
            </div>

            {/* Description */}
            <div>
              <RequiredLabel>Description</RequiredLabel>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="A comprehensive leadership development program designed to..."
              />
              <HelperText>
                This will appear on the program overview and in program listings
              </HelperText>
            </div>

            {/* Learning Track */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Learning Track
              </label>
              <select
                value={formConfig.learningTrack || ''}
                onChange={(e) => updateConfig({ learningTrack: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="">Select a learning track...</option>
                {learningTracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Smart Builder callout */}
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Smart Builder</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Let AI analyze your program details and suggest an optimal structure, module
                  sequence, and content outline.
                </p>
                <button className="text-sm text-red-600 font-medium mt-1 hover:text-red-700">
                  Generate Program Structure →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Learning Objectives */}
      {/* ============================================ */}
      {activeSection === 'objectives' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Learning Objectives</h3>
            <p className="text-sm text-gray-500 mt-1">
              Define what learners will be able to do after completing this program
            </p>
          </div>

          <div className="space-y-5">
            {(formConfig.objectives || []).map((objective, index) => (
              <div key={objective.id}>
                <RequiredLabel>Objective {index + 1}</RequiredLabel>
                <textarea
                  rows={2}
                  value={objective.text}
                  onChange={(e) => {
                    const updated = [...(formConfig.objectives || [])];
                    updated[index] = { ...objective, text: e.target.value };
                    updateConfig({ objectives: updated });
                  }}
                  className={`${INPUT_CLASS} resize-none`}
                  placeholder={`e.g. Develop self-awareness and emotional intelligence as a leader`}
                />
              </div>
            ))}

            <button
              onClick={() => {
                const objectives = [
                  ...(formConfig.objectives || []),
                  { id: String(Date.now()), text: '' },
                ];
                updateConfig({ objectives });
              }}
              className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Another Objective
            </button>
          </div>

          {/* Best Practice callout */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Best Practice</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  Start each objective with an action verb (e.g., &quot;Master,&quot;
                  &quot;Develop,&quot; &quot;Build,&quot; &quot;Navigate&quot;). Focus on measurable
                  outcomes and specific competencies.
                </p>
              </div>
            </div>
          </div>

          {/* AI Optimizer callout */}
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Objective Optimizer</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  AI can refine your objectives to make them more specific, measurable, and aligned
                  with best practices.
                </p>
                <button className="text-sm text-red-600 font-medium mt-1 hover:text-red-700">
                  Optimize Objectives →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Schedule & Dates */}
      {/* ============================================ */}
      {activeSection === 'schedule' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Schedule & Dates</h3>
            <p className="text-sm text-gray-500 mt-1">Configure program timeline and pacing</p>
          </div>

          {/* Program Type */}
          <div>
            <RequiredLabel>Program Type</RequiredLabel>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <button
                onClick={() => setFormType('cohort')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formType === 'cohort'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${formType === 'cohort' ? 'text-gray-900' : 'text-gray-900'}`}
                >
                  Cohort-Based
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  All learners start and end together with fixed dates
                </p>
              </button>
              <button
                onClick={() => setFormType('self_paced')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formType === 'self_paced'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${formType === 'self_paced' ? 'text-gray-900' : 'text-gray-900'}`}
                >
                  Self-Paced
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Learners can start anytime and progress at their own speed
                </p>
              </button>
            </div>
          </div>

          {/* Dates (cohort only) */}
          {formType === 'cohort' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <RequiredLabel>Program Start Date</RequiredLabel>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <RequiredLabel>Program End Date</RequiredLabel>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          {/* Computed Duration Banner */}
          {formType === 'cohort' && computedDuration && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Program Duration: {computedDuration} weeks
              </span>
            </div>
          )}

          {/* Allow Individual Pacing */}
          {formType === 'cohort' && (
            <div className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Allow Individual Pacing</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Let learners start at different times within the cohort period
                </p>
              </div>
              <Toggle
                enabled={!!formConfig.allowIndividualPacing}
                onToggle={() =>
                  updateConfig({ allowIndividualPacing: !formConfig.allowIndividualPacing })
                }
              />
            </div>
          )}

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Zone</label>
            <select
              value={formTimezone}
              onChange={(e) => setFormTimezone(e.target.value)}
              className={SELECT_CLASS}
            >
              {timeZones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <HelperText>
              Used for scheduling emails and displaying deadlines to participants
            </HelperText>
          </div>

          {/* AI Duration Calculator */}
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Duration Calculator</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Based on your objectives and typical completion patterns, AI suggests optimal
                  program length.
                </p>
                <button className="text-sm text-red-600 font-medium mt-1 hover:text-red-700">
                  Calculate Optimal Duration →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Communication */}
      {/* ============================================ */}
      {activeSection === 'communication' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Communication Settings</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure automated emails and notifications
            </p>
          </div>

          {/* Welcome Email */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Welcome Email</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sent before program starts to prepare learners
                </p>
              </div>
              <Toggle
                enabled={formConfig.emailSettings?.welcome !== false}
                onToggle={() => {
                  updateConfig({
                    emailSettings: {
                      ...formConfig.emailSettings,
                      welcome: formConfig.emailSettings?.welcome === false,
                    },
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Days before start
              </label>
              <input type="number" defaultValue={7} className={INPUT_CLASS} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">
                  Custom message (optional)
                </label>
                <div className="flex gap-3">
                  <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                    <Library className="w-3 h-3" /> Content Library
                  </button>
                  <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Draft
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Add a personalized message to the welcome email..."
              />
            </div>
          </div>

          {/* Program Kickoff Email */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Program Kickoff Email</p>
                <p className="text-sm text-gray-500 mt-0.5">Sent on program start date</p>
              </div>
              <Toggle
                enabled={formConfig.emailSettings?.kickoff !== false}
                onToggle={() => {
                  updateConfig({
                    emailSettings: {
                      ...formConfig.emailSettings,
                      kickoff: formConfig.emailSettings?.kickoff === false,
                    },
                  });
                }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">
                  Custom message (optional)
                </label>
                <div className="flex gap-3">
                  <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                    <Library className="w-3 h-3" /> Content Library
                  </button>
                  <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Draft
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Add a personalized message to the kickoff email..."
              />
            </div>
          </div>

          {/* Lesson Due Date Reminders */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Lesson Due Date Reminders</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Automated reminders before and after lesson due dates
                </p>
              </div>
              <Toggle enabled={true} onToggle={() => {}} />
            </div>

            {/* Before Due Date */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Before Due Date</h4>
              <div className="space-y-1">
                {(formConfig.beforeDueReminders || []).map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{reminder.label}</span>
                    <Toggle
                      enabled={reminder.enabled}
                      onToggle={() => {
                        const updated = [...(formConfig.beforeDueReminders || [])];
                        updated[index] = { ...reminder, enabled: !reminder.enabled };
                        updateConfig({ beforeDueReminders: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* After Due Date */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">After Due Date (Overdue)</h4>
              <div className="space-y-1">
                {(formConfig.afterDueReminders || []).map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{reminder.label}</span>
                    <Toggle
                      enabled={reminder.enabled}
                      onToggle={() => {
                        const updated = [...(formConfig.afterDueReminders || [])];
                        updated[index] = { ...reminder, enabled: !reminder.enabled };
                        updateConfig({ afterDueReminders: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">
                  Custom reminder message (optional)
                </label>
                <div className="flex gap-3">
                  <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                    <Library className="w-3 h-3" /> Content Library
                  </button>
                  <button className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Draft
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Add a personalized message for lesson reminders..."
              />
            </div>
          </div>

          {/* Weekly Progress Digest */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Weekly Progress Digest</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Weekly summary of progress and upcoming content
                </p>
              </div>
              <Toggle
                enabled={formConfig.emailSettings?.weeklyDigest !== false}
                onToggle={() => {
                  updateConfig({
                    emailSettings: {
                      ...formConfig.emailSettings,
                      weeklyDigest: formConfig.emailSettings?.weeklyDigest === false,
                    },
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Day of week</label>
              <select defaultValue="Monday" className={SELECT_CLASS}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Inactivity Reminder */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Inactivity Reminder</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Re-engage learners who haven&apos;t logged in recently
                </p>
              </div>
              <Toggle
                enabled={formConfig.emailSettings?.inactivityReminders !== false}
                onToggle={() => {
                  updateConfig({
                    emailSettings: {
                      ...formConfig.emailSettings,
                      inactivityReminders: formConfig.emailSettings?.inactivityReminders === false,
                    },
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Days inactive threshold
              </label>
              <input type="number" defaultValue={7} className={INPUT_CLASS} />
            </div>
          </div>

          {/* Milestone Celebration Emails */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Milestone Celebration Emails</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Celebrate progress at key completion milestones
                </p>
              </div>
              <Toggle
                enabled={formConfig.emailSettings?.milestones !== false}
                onToggle={() => {
                  updateConfig({
                    emailSettings: {
                      ...formConfig.emailSettings,
                      milestones: formConfig.emailSettings?.milestones === false,
                    },
                  });
                }}
              />
            </div>
            <div className="flex gap-2">
              {['25%', '50%', '75%', '100%'].map((milestone) => (
                <span
                  key={milestone}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {milestone}
                </span>
              ))}
            </div>
          </div>

          {/* Completion Email */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Completion Email</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Congratulate learners on program completion
                </p>
              </div>
              <Toggle
                enabled={formConfig.emailSettings?.completion !== false}
                onToggle={() => {
                  updateConfig({
                    emailSettings: {
                      ...formConfig.emailSettings,
                      completion: formConfig.emailSettings?.completion === false,
                    },
                  });
                }}
              />
            </div>
          </div>

          {/* Mentor/Manager Summary */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Mentor/Manager Summary</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Send progress reports to mentors and managers
                </p>
              </div>
              <Toggle
                enabled={formConfig.emailSettings?.mentorSummary !== false}
                onToggle={() => {
                  updateConfig({
                    emailSettings: {
                      ...formConfig.emailSettings,
                      mentorSummary: formConfig.emailSettings?.mentorSummary === false,
                    },
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Report frequency
              </label>
              <select defaultValue="Weekly" className={SELECT_CLASS}>
                {['Weekly', 'Bi-Weekly', 'Monthly'].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Settings & Config */}
      {/* ============================================ */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Settings & Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure enrollment, access controls, and program behavior
            </p>
          </div>

          {/* Enrollment & Access */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Enrollment & Access</h4>
            <div className="space-y-3">
              <SettingRow
                label="Auto-Enrollment"
                description="Automatically enroll users who meet the target audience criteria"
                enabled={!!formConfig.autoEnrollment}
                onToggle={() => updateConfig({ autoEnrollment: !formConfig.autoEnrollment })}
              />
              <SettingRow
                label="Require Manager Approval"
                description="Users must get manager approval before enrolling"
                enabled={!!formConfig.requireManagerApproval}
                onToggle={() =>
                  updateConfig({ requireManagerApproval: !formConfig.requireManagerApproval })
                }
              />
              <SettingRow
                label="Allow Self-Enrollment"
                description="Users can enroll themselves without admin approval"
                enabled={!!formConfig.allowSelfEnrollment}
                onToggle={() =>
                  updateConfig({ allowSelfEnrollment: !formConfig.allowSelfEnrollment })
                }
              />
              <SettingRow
                label="Link to Goals"
                description="Allow learners to link this program to their development goals"
                enabled={!!formConfig.linkToGoals}
                onToggle={() => updateConfig({ linkToGoals: !formConfig.linkToGoals })}
              />
              <SettingRow
                label="Issue Certificate"
                description="Award a completion certificate when learners finish the program"
                enabled={!!formConfig.issueCertificate}
                onToggle={() => updateConfig({ issueCertificate: !formConfig.issueCertificate })}
              />
            </div>
          </div>

          {/* Capacity Management */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Capacity Management</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Program Capacity (optional)
                </label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  min={1}
                  value={formConfig.programCapacity || ''}
                  onChange={(e) =>
                    updateConfig({
                      programCapacity: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className={INPUT_CLASS}
                />
                <HelperText>Maximum number of participants</HelperText>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Waitlist</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Enable Waitlist</span>
                    <Toggle
                      enabled={!!formConfig.enableWaitlist}
                      onToggle={() => updateConfig({ enableWaitlist: !formConfig.enableWaitlist })}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">When capacity is reached</p>
                </div>
              </div>
            </div>
          </div>

          {/* Program Behavior */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Program Behavior</h4>
            <div className="space-y-3">
              <SettingRow
                label="Sequential Module Access"
                description="Lock modules until previous modules are completed"
                enabled={!!formConfig.sequentialAccess}
                onToggle={() => updateConfig({ sequentialAccess: !formConfig.sequentialAccess })}
              />
              <SettingRow
                label="Track Completion in Scorecard"
                description="Show program completion in executive scorecard"
                enabled={!!formConfig.trackInScorecard}
                onToggle={() => updateConfig({ trackInScorecard: !formConfig.trackInScorecard })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Footer Actions */}
      {/* ============================================ */}
      {saveMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mt-6 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {saveMessage.text}
        </div>
      )}
      <div className="flex justify-center gap-3 pt-6 border-t border-gray-200 mt-8">
        <button
          type="button"
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
