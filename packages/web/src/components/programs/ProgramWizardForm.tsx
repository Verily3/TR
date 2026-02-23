'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Upload, Sparkles, Info, Clock, RotateCcw, X } from 'lucide-react';
import { useCreateAgencyProgram } from '@/hooks/api/useAgencyPrograms';
import { useCreateProgram } from '@/hooks/api/usePrograms';
import { useTenants } from '@/hooks/api/useTenants';
import { api } from '@/lib/api';
import type { Program } from '@/types/programs';
import type { WizardStep, WizardFormData } from './wizard-types';
import { defaultWizardFormData, learningTracks, timeZones } from './wizard-data';

// ============================================
// Constants
// ============================================

const stepTitles: Record<WizardStep, string> = {
  1: 'Basic Information',
  2: 'Learning Objectives',
  3: 'Schedule & Dates',
  4: 'Communication Settings',
  5: 'Target Audience & Prerequisites',
  6: 'Review & Create',
};

// ============================================
// Props
// ============================================

interface ProgramWizardFormProps {
  isAgencyUser: boolean;
  tenantId?: string;
  onSuccess: (program: Program) => void;
  onCancel: () => void;
}

// ============================================
// Component
// ============================================

export function ProgramWizardForm({
  isAgencyUser,
  tenantId,
  onSuccess,
  onCancel,
}: ProgramWizardFormProps) {
  const DRAFT_KEY = 'program-wizard-draft';

  const [currentStep, setCurrentStep] = useState<WizardStep>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return (JSON.parse(saved).step as WizardStep) || 1;
    } catch {}
    return 1;
  });
  const [formData, setFormData] = useState<WizardFormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved).formData as WizardFormData;
    } catch {}
    return {
      ...defaultWizardFormData,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || defaultWizardFormData.timeZone,
    };
  });
  const [draftRestored, setDraftRestored] = useState(() => {
    try {
      return !!localStorage.getItem(DRAFT_KEY);
    } catch {
      return false;
    }
  });
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [error, setError] = useState('');

  // Cover image file upload state (separate from formData — File objects can't be serialized to localStorage)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const createAgencyProgram = useCreateAgencyProgram();
  const createTenantProgram = useCreateProgram(tenantId);
  const { data: tenants } = useTenants();

  const isPending =
    createAgencyProgram.isPending || createTenantProgram.isPending || coverUploading;

  // Persist draft to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step: currentStep, formData }));
    } catch {}
  }, [currentStep, formData]);

  // Generate and clean up object URL for cover image preview
  useEffect(() => {
    if (coverImageFile) {
      const url = URL.createObjectURL(coverImageFile);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreviewUrl(null);
  }, [coverImageFile]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setDraftRestored(false);
  };

  const discardDraft = () => {
    clearDraft();
    setCurrentStep(1);
    setFormData({
      ...defaultWizardFormData,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || defaultWizardFormData.timeZone,
    });
    setCoverImageFile(null);
    setCoverError(null);
  };

  // ---- Form helpers ----

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addObjective = () => {
    const newId = String(formData.objectives.length + 1);
    updateFormData({
      objectives: [...formData.objectives, { id: newId, text: '' }],
    });
  };

  const updateObjective = (id: string, text: string) => {
    updateFormData({
      objectives: formData.objectives.map((obj) => (obj.id === id ? { ...obj, text } : obj)),
    });
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return `${diffWeeks} weeks`;
    }
    return null;
  };

  const [expandedEmailCustomize, setExpandedEmailCustomize] = useState<Set<string>>(new Set());

  const toggleEmailSetting = (emailId: string) => {
    updateFormData({
      emailSettings: formData.emailSettings.map((e) =>
        e.id === emailId ? { ...e, enabled: !e.enabled } : e
      ),
    });
  };

  const updateEmailField = (
    emailId: string,
    patch: Partial<import('./wizard-types').EmailSetting>
  ) => {
    updateFormData({
      emailSettings: formData.emailSettings.map((e) => (e.id === emailId ? { ...e, ...patch } : e)),
    });
  };

  const toggleEmailCustomize = (emailId: string) => {
    setExpandedEmailCustomize((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
  };

  const toggleBeforeReminder = (reminderId: string) => {
    updateFormData({
      beforeDueReminders: formData.beforeDueReminders.map((r) =>
        r.id === reminderId ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  const toggleAfterReminder = (reminderId: string) => {
    updateFormData({
      afterDueReminders: formData.afterDueReminders.map((r) =>
        r.id === reminderId ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  // ---- Navigation ----

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.title.trim();
      case 2:
        return formData.objectives.some((o) => o.text.trim());
      case 3:
        if (formData.programType === 'cohort') {
          if (!formData.startDate || !formData.endDate) return false;
          return new Date(formData.startDate) < new Date(formData.endDate);
        }
        return true;
      default:
        return true;
    }
  };

  // ---- Submit ----

  const handleCreate = async () => {
    if (isPending) return;
    setError('');

    const filteredObjectives = formData.objectives.filter((o) => o.text.trim());

    // Build a flat ProgramEmailSettings object from the wizard email settings array
    const emailSettingsMap = Object.fromEntries(formData.emailSettings.map((e) => [e.id, e]));
    const subjectOverrides: Record<string, string> = {};
    const bodyOverrides: Record<string, string> = {};
    for (const e of formData.emailSettings) {
      if (e.subjectOverride) subjectOverrides[e.id] = e.subjectOverride;
      if (e.bodyOverride) bodyOverrides[e.id] = e.bodyOverride;
    }

    const config = {
      learningTrack: formData.learningTrack || undefined,
      objectives: filteredObjectives.length > 0 ? filteredObjectives : undefined,
      allowIndividualPacing: formData.allowIndividualPacing,
      startOffset: formData.startOffset,
      deadlineFlexibility: formData.deadlineFlexibility,
      estimatedDuration:
        formData.programType === 'self_paced' ? formData.estimatedDuration : undefined,
      allowSelfEnrollment: formData.allowSelfEnrollment,
      requireManagerApproval: formData.requireManagerApproval,
      programCapacity: formData.programCapacity ?? undefined,
      enableWaitlist: formData.enableWaitlist,
      emailSettings: {
        welcome: emailSettingsMap['welcome']?.enabled ?? true,
        kickoff: emailSettingsMap['kickoff']?.enabled ?? true,
        weeklyDigest: emailSettingsMap['weeklyDigest']?.enabled ?? true,
        weeklyDigestDay: emailSettingsMap['weeklyDigest']?.weeklyDigestDay ?? 1,
        inactivityReminders: emailSettingsMap['inactivity']?.enabled ?? true,
        inactivityDays: emailSettingsMap['inactivity']?.inactivityDays ?? 7,
        milestones: emailSettingsMap['milestones']?.enabled ?? true,
        completion: emailSettingsMap['completion']?.enabled ?? true,
        mentorSummary: emailSettingsMap['mentorSummary']?.enabled ?? true,
        mentorSummaryFrequency:
          emailSettingsMap['mentorSummary']?.mentorSummaryFrequency ?? 'weekly',
        beforeDueReminders: formData.beforeDueReminders
          .filter((r) => r.enabled)
          .map((r) => {
            const days: Record<string, number> = {
              '2-weeks': 14,
              '1-week': 7,
              '3-days': 3,
              '1-day': 1,
              'day-of': 0,
            };
            return days[r.id] ?? 0;
          }),
        afterDueReminders: formData.afterDueReminders
          .filter((r) => r.enabled)
          .map((r) => {
            const days: Record<string, number> = {
              '1-day-after': 1,
              '3-days-after': 3,
              '1-week-after': 7,
            };
            return days[r.id] ?? 1;
          }),
        subjectOverrides: Object.keys(subjectOverrides).length > 0 ? subjectOverrides : undefined,
        bodyOverrides: Object.keys(bodyOverrides).length > 0 ? bodyOverrides : undefined,
      },
      targetAudience: formData.targetAudience || undefined,
      prerequisites: formData.prerequisites || undefined,
      recommendedFor: formData.recommendedFor || undefined,
    };

    const baseInput = {
      name: formData.title.trim(),
      internalName: formData.internalName.trim() || undefined,
      description: formData.description.trim() || undefined,
      type: formData.programType as 'cohort' | 'self_paced',
      coverImage: formData.coverImageUrl.trim() || undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      timezone: formData.timeZone,
      config,
    };

    try {
      let created: Program;
      if (isAgencyUser) {
        created = await createAgencyProgram.mutateAsync({
          ...baseInput,
          tenantId: selectedTenantId || undefined,
        });
      } else {
        created = await createTenantProgram.mutateAsync(baseInput);
      }

      // Upload cover image file if one was selected (non-blocking — program already created)
      if (coverImageFile) {
        setCoverUploading(true);
        try {
          const fd = new FormData();
          fd.append('file', coverImageFile);
          await api.uploadFile(`/api/upload/cover/${created.id}`, fd);
        } catch {
          console.warn('Cover image upload failed; program created without cover.');
        } finally {
          setCoverUploading(false);
        }
      }

      clearDraft();
      onSuccess(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create program';
      setError(msg);
    }
  };

  // ============================================
  // Step Indicators
  // ============================================

  const renderStepIndicators = () => (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3, 4, 5, 6] as WizardStep[]).map((step) => (
        <div key={step} className="flex items-center">
          {step < currentStep ? (
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          ) : step === currentStep ? (
            <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
              {step}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
              {step}
            </div>
          )}
          {step < 6 && (
            <div className={`w-8 h-0.5 mx-1 ${step < currentStep ? 'bg-green-200' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ============================================
  // Step 1: Basic Information
  // ============================================

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Assign to Client (agency users only) */}
      {isAgencyUser && tenants && tenants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">
            Assign to Client
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Agency Level (All Clients)</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1.5">
            Leave as Agency Level for a program accessible to all clients, or select a specific
            client.
          </p>
        </div>
      )}

      {/* Internal Name */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Internal Name
        </label>
        <input
          type="text"
          value={formData.internalName}
          onChange={(e) => updateFormData({ internalName: e.target.value })}
          placeholder="e.g., Q1-2026-Leadership-Cohort-A"
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          For internal tracking and reporting (not visible to learners)
        </p>
      </div>

      {/* Program Title */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Program Title <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., LeaderShift"
          autoFocus
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Choose a clear, memorable name for your program
        </p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Cover Image
        </label>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
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
            setCoverImageFile(file);
            updateFormData({ coverImageUrl: '' });
            if (coverInputRef.current) coverInputRef.current.value = '';
          }}
        />

        {coverPreviewUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img src={coverPreviewUrl} alt="Cover preview" className="w-full h-32 object-cover" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-sidebar-foreground shadow-sm"
                title="Change cover image"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoverImageFile(null);
                  setCoverError(null);
                }}
                className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-red-600 shadow-sm"
                title="Remove cover image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg hover:border-accent/50 transition-colors cursor-pointer"
          >
            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-sidebar-foreground">
              Click to upload program cover
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WebP up to 5MB (Recommended: 1200x600px)
            </p>
          </button>
        )}

        {coverError && <p className="text-sm text-red-600 mt-1.5">{coverError}</p>}

        {/* URL paste fallback */}
        {!coverImageFile && (
          <div className="mt-2">
            <input
              type="url"
              value={formData.coverImageUrl}
              onChange={(e) => updateFormData({ coverImageUrl: e.target.value })}
              placeholder="Or paste an image URL..."
              className="w-full px-3 py-1.5 bg-white border border-border rounded text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-1.5">
          {coverImageFile
            ? 'Image will be uploaded when you create the program'
            : 'Upload a file or paste a URL'}
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Description
        </label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe the program's purpose, what learners will gain, and why it matters..."
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
      </div>

      {/* Learning Track */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Learning Track
        </label>
        <select
          value={formData.learningTrack}
          onChange={(e) => updateFormData({ learningTrack: e.target.value })}
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Select track...</option>
          {learningTracks.map((track) => (
            <option key={track} value={track}>
              {track}
            </option>
          ))}
        </select>
      </div>

      {/* AI Smart Builder */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-2">AI Smart Builder</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Let AI analyze your program details and suggest an optimal structure, module sequence,
              and content outline.
            </p>
            <button className="text-sm text-accent hover:text-accent/80 font-medium">
              Generate Program Structure →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // Step 2: Learning Objectives
  // ============================================

  const renderStep2 = () => (
    <div className="space-y-6">
      {formData.objectives.map((objective, index) => (
        <div key={objective.id}>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">
            Objective {index + 1} {index < 3 && <span className="text-accent">*</span>}
          </label>
          <textarea
            rows={2}
            value={objective.text}
            onChange={(e) => updateObjective(objective.id, e.target.value)}
            placeholder={`e.g., ${
              index === 0
                ? 'Distinguish between leadership and management responsibilities'
                : index === 1
                  ? 'Develop self-awareness and emotional intelligence'
                  : 'Build strategic thinking capabilities'
            }`}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>
      ))}

      <button
        onClick={addObjective}
        className="text-sm text-accent hover:text-accent/80 font-medium"
      >
        + Add Another Objective
      </button>

      {/* Best Practice Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">Best Practice</h3>
            <p className="text-sm text-blue-700">
              Start each objective with an action verb (e.g., &quot;Master,&quot;
              &quot;Develop,&quot; &quot;Build,&quot; &quot;Navigate&quot;). Focus on measurable
              outcomes and specific competencies.
            </p>
          </div>
        </div>
      </div>

      {/* AI Objective Optimizer */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
              AI Objective Optimizer
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              AI can refine your objectives to make them more specific, measurable, and aligned with
              best practices.
            </p>
            <button className="text-sm text-accent hover:text-accent/80 font-medium">
              Optimize Objectives →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // Step 3: Schedule & Dates
  // ============================================

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Program Type Selection */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-3">
          Program Type <span className="text-accent">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateFormData({ programType: 'cohort' })}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              formData.programType === 'cohort'
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <div className="font-medium text-sidebar-foreground mb-1">Cohort-Based</div>
            <div className="text-sm text-muted-foreground">
              All learners start and end together with fixed dates
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateFormData({ programType: 'self_paced' })}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              formData.programType === 'self_paced'
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <div className="font-medium text-sidebar-foreground mb-1">Self-Paced</div>
            <div className="text-sm text-muted-foreground">
              Learners can start anytime and progress at their own speed
            </div>
          </button>
        </div>
      </div>

      {formData.programType === 'cohort' ? (
        <>
          {/* Cohort Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Program Start Date <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormData({ startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Program End Date <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormData({ endDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Date validation error */}
          {formData.startDate &&
            formData.endDate &&
            new Date(formData.startDate) >= new Date(formData.endDate) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-700">End date must be after start date.</span>
              </div>
            )}

          {/* Calculated Duration */}
          {calculateDuration() && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">
                  <strong>Program Duration:</strong> {calculateDuration()}
                </span>
              </div>
            </div>
          )}

          {/* Individual Pacing Toggle */}
          <div className="bg-gray-50 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Allow Individual Pacing
                </div>
                <div className="text-sm text-muted-foreground">
                  Let learners start at different times within the cohort period
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateFormData({ allowIndividualPacing: !formData.allowIndividualPacing })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  formData.allowIndividualPacing ? 'bg-accent' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.allowIndividualPacing ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {formData.allowIndividualPacing && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Start Offset (days after enrollment)
                  </label>
                  <input
                    type="number"
                    value={formData.startOffset}
                    onChange={(e) => updateFormData({ startOffset: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Deadline Flexibility (days)
                  </label>
                  <input
                    type="number"
                    value={formData.deadlineFlexibility}
                    onChange={(e) =>
                      updateFormData({ deadlineFlexibility: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">
            Estimated Duration
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) =>
                updateFormData({ estimatedDuration: parseInt(e.target.value) || 12 })
              }
              placeholder="12"
              className="w-32 px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="text-sm text-muted-foreground">weeks</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Typical time for learners to complete this program at their own pace
          </p>
        </div>
      )}

      {/* Time Zone */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">Time Zone</label>
        <select
          value={formData.timeZone}
          onChange={(e) => updateFormData({ timeZone: e.target.value })}
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {timeZones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1.5">
          Used for scheduling emails and displaying deadlines to participants
        </p>
      </div>

      {/* Enrollment Settings */}
      <div className="bg-gray-50 border border-border rounded-lg p-4 space-y-4">
        <div className="font-medium text-sidebar-foreground text-sm">Enrollment Settings</div>

        {/* Self-enrollment toggle */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-sidebar-foreground">Allow Self-Enrollment</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Learners can enroll themselves without an admin
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateFormData({ allowSelfEnrollment: !formData.allowSelfEnrollment })}
            className={`relative w-11 h-6 rounded-full transition-colors ${formData.allowSelfEnrollment ? 'bg-accent' : 'bg-gray-300'}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.allowSelfEnrollment ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        {/* Manager approval (only when self-enrollment on) */}
        {formData.allowSelfEnrollment && (
          <div className="flex items-start justify-between pl-4 border-l-2 border-gray-200">
            <div className="flex-1">
              <div className="text-sm text-sidebar-foreground">Require Manager Approval</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Enrollment requests need manager sign-off
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateFormData({ requireManagerApproval: !formData.requireManagerApproval })
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${formData.requireManagerApproval ? 'bg-accent' : 'bg-gray-300'}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.requireManagerApproval ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        )}

        {/* Capacity */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm text-sidebar-foreground">Program Capacity</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Maximum number of learners (leave blank for unlimited)
            </div>
          </div>
          <input
            type="number"
            min={1}
            value={formData.programCapacity ?? ''}
            onChange={(e) =>
              updateFormData({ programCapacity: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder="Unlimited"
            className="w-28 px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-right"
          />
        </div>

        {/* Waitlist (only when capacity is set) */}
        {formData.programCapacity !== null && (
          <div className="flex items-start justify-between pl-4 border-l-2 border-gray-200">
            <div className="flex-1">
              <div className="text-sm text-sidebar-foreground">Enable Waitlist</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Accept waitlist applications when capacity is full
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateFormData({ enableWaitlist: !formData.enableWaitlist })}
              className={`relative w-11 h-6 rounded-full transition-colors ${formData.enableWaitlist ? 'bg-accent' : 'bg-gray-300'}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.enableWaitlist ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // Step 4: Communication Settings
  // ============================================

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderStep4 = () => (
    <div className="space-y-4">
      {/* Email Settings */}
      {formData.emailSettings.map((email) => {
        const isCustomizeOpen = expandedEmailCustomize.has(email.id);
        const hasOverride = !!(email.subjectOverride || email.bodyOverride);
        return (
          <div key={email.id} className="bg-gray-50 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sidebar-foreground">{email.name}</span>
                  {hasOverride && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200">
                      Customized
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{email.description}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleEmailSetting(email.id)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  email.enabled ? 'bg-accent' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    email.enabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Timing controls — only when enabled */}
            {email.enabled && (
              <div className="mt-3 space-y-2">
                {email.id === 'weeklyDigest' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Send on:</span>
                    <select
                      value={email.weeklyDigestDay ?? 1}
                      onChange={(e) =>
                        updateEmailField(email.id, { weeklyDigestDay: Number(e.target.value) })
                      }
                      className="text-xs border border-border rounded px-2 py-1 bg-white"
                    >
                      {DAY_NAMES.map((d, i) => (
                        <option key={d} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {email.id === 'inactivity' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">After</span>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={email.inactivityDays ?? 7}
                      onChange={(e) =>
                        updateEmailField(email.id, { inactivityDays: Number(e.target.value) })
                      }
                      className="w-16 text-xs border border-border rounded px-2 py-1 bg-white text-center"
                    />
                    <span className="text-xs text-muted-foreground">days of inactivity</span>
                  </div>
                )}
                {email.id === 'mentorSummary' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Frequency:</span>
                    <select
                      value={email.mentorSummaryFrequency ?? 'weekly'}
                      onChange={(e) =>
                        updateEmailField(email.id, {
                          mentorSummaryFrequency: e.target.value as 'weekly' | 'biweekly',
                        })
                      }
                      className="text-xs border border-border rounded px-2 py-1 bg-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Customize subject & body */}
            {email.enabled && (
              <button
                type="button"
                onClick={() => toggleEmailCustomize(email.id)}
                className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors"
              >
                <span>{isCustomizeOpen ? '▾' : '▸'}</span>
                Customize subject &amp; body
              </button>
            )}
            {email.enabled && isCustomizeOpen && (
              <div className="mt-3 space-y-3 pl-3 border-l-2 border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-sidebar-foreground mb-1">
                    Subject line
                  </label>
                  <input
                    type="text"
                    value={email.subjectOverride ?? ''}
                    onChange={(e) =>
                      updateEmailField(email.id, { subjectOverride: e.target.value || undefined })
                    }
                    placeholder="Leave blank to use agency/system default"
                    className="w-full text-xs border border-border rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sidebar-foreground mb-1">
                    Body copy
                  </label>
                  <textarea
                    rows={3}
                    value={email.bodyOverride ?? ''}
                    onChange={(e) =>
                      updateEmailField(email.id, { bodyOverride: e.target.value || undefined })
                    }
                    placeholder="Leave blank to use agency/system default"
                    className="w-full text-xs border border-border rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Use <code>[Name]</code>, <code>[Program]</code> etc. as placeholders.
                  </p>
                </div>
                {hasOverride && (
                  <button
                    type="button"
                    onClick={() =>
                      updateEmailField(email.id, {
                        subjectOverride: undefined,
                        bodyOverride: undefined,
                      })
                    }
                    className="text-xs text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Lesson Due Date Reminders */}
      <div className="bg-gray-50 border border-border rounded-lg p-4">
        <div className="flex-1 mb-3">
          <div className="font-medium text-sidebar-foreground mb-1">Lesson Due Date Reminders</div>
          <div className="text-sm text-muted-foreground">
            Automated reminders before and after lesson due dates
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-sidebar-foreground mb-2">
              Before Due Date
            </label>
            <div className="space-y-2">
              {formData.beforeDueReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-2 bg-white rounded"
                >
                  <span className="text-sm text-sidebar-foreground">{reminder.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleBeforeReminder(reminder.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      reminder.enabled ? 'bg-accent' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        reminder.enabled ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sidebar-foreground mb-2">
              After Due Date (Overdue)
            </label>
            <div className="space-y-2">
              {formData.afterDueReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-2 bg-white rounded"
                >
                  <span className="text-sm text-sidebar-foreground">{reminder.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleAfterReminder(reminder.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      reminder.enabled ? 'bg-accent' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        reminder.enabled ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // Step 5: Target Audience
  // ============================================

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Target Audience
        </label>
        <textarea
          rows={3}
          value={formData.targetAudience}
          onChange={(e) => updateFormData({ targetAudience: e.target.value })}
          placeholder="e.g., Mid-level managers with 2-5 years of experience in sales"
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Define who this program is designed for
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Prerequisites (optional)
        </label>
        <textarea
          rows={2}
          value={formData.prerequisites}
          onChange={(e) => updateFormData({ prerequisites: e.target.value })}
          placeholder="e.g., Completion of Sales Fundamentals program"
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Any required programs or qualifications
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Recommended For (optional)
        </label>
        <textarea
          rows={2}
          value={formData.recommendedFor}
          onChange={(e) => updateFormData({ recommendedFor: e.target.value })}
          placeholder="e.g., Sales representatives looking to move into leadership roles"
          className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Additional context for who benefits most
        </p>
      </div>
    </div>
  );

  // ============================================
  // Step 6: Review & Create
  // ============================================

  const renderStep6 = () => (
    <div className="space-y-4">
      {/* Basic Information Summary */}
      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Basic Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="text-muted-foreground w-32">Title:</span>
            <span className="text-sidebar-foreground">{formData.title || 'Not specified'}</span>
          </div>
          {formData.internalName && (
            <div className="flex">
              <span className="text-muted-foreground w-32">Internal Name:</span>
              <span className="text-sidebar-foreground">{formData.internalName}</span>
            </div>
          )}
          <div className="flex">
            <span className="text-muted-foreground w-32">Track:</span>
            <span className="text-sidebar-foreground">
              {formData.learningTrack || 'Not specified'}
            </span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32">Type:</span>
            <span className="text-sidebar-foreground">
              {formData.programType === 'cohort' ? 'Cohort-Based' : 'Self-Paced'}
            </span>
          </div>
        </div>
      </div>

      {/* Learning Objectives Summary */}
      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Learning Objectives</h3>
        <ul className="space-y-1.5 text-sm text-sidebar-foreground list-disc list-inside">
          {formData.objectives
            .filter((obj) => obj.text)
            .map((obj) => (
              <li key={obj.id}>{obj.text}</li>
            ))}
          {formData.objectives.every((obj) => !obj.text) && (
            <li className="text-muted-foreground">No objectives specified</li>
          )}
        </ul>
      </div>

      {/* Schedule Summary */}
      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Schedule & Dates</h3>
        <div className="space-y-2 text-sm">
          {formData.programType === 'cohort' ? (
            <>
              <div className="flex">
                <span className="text-muted-foreground w-32">Start Date:</span>
                <span className="text-sidebar-foreground">
                  {formData.startDate || 'Not specified'}
                </span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32">End Date:</span>
                <span className="text-sidebar-foreground">
                  {formData.endDate || 'Not specified'}
                </span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32">Duration:</span>
                <span className="text-sidebar-foreground">
                  {calculateDuration() || 'Not specified'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex">
              <span className="text-muted-foreground w-32">Est. Duration:</span>
              <span className="text-sidebar-foreground">{formData.estimatedDuration} weeks</span>
            </div>
          )}
        </div>
      </div>

      {/* Communication Summary */}
      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Communication Settings</h3>
        <div className="flex flex-wrap gap-2">
          {formData.emailSettings
            .filter((e) => e.enabled)
            .map((email) => (
              <span key={email.id} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
                {email.name}
              </span>
            ))}
        </div>
      </div>

      {/* Target Audience Summary */}
      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Target Audience</h3>
        <p className="text-sm text-sidebar-foreground">
          {formData.targetAudience || 'Not specified'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</div>
      )}
    </div>
  );

  // ============================================
  // Step Router
  // ============================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div>
      {/* Draft restored banner */}
      {draftRestored && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span>Draft restored from your last session.</span>
          </div>
          <button
            type="button"
            onClick={discardDraft}
            className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2 flex-shrink-0"
          >
            Start fresh
          </button>
        </div>
      )}

      {/* Step subtitle */}
      <p className="text-sm text-muted-foreground mb-4">
        Step {currentStep} of 6: {stepTitles[currentStep]}
      </p>

      {/* Step Indicators */}
      {renderStepIndicators()}

      {/* Content */}
      <div className="mb-8">{renderStepContent()}</div>

      {/* Footer */}
      <div className="flex justify-between pt-6 border-t border-border">
        {currentStep === 1 ? (
          <button
            onClick={onCancel}
            className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={handleBack}
            className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-100 transition-colors"
          >
            ← Back
          </button>
        )}

        {currentStep < 6 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating...' : 'Create Program'}
          </button>
        )}
      </div>
    </div>
  );
}
