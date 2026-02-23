'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Archive,
  Globe,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useTemplate, useUpdateTemplate } from '@/hooks/api/useTemplates';
import type { TemplateConfig, TemplateCompetency, TemplateQuestion } from '@/types/assessments';
import { RaterResponseForm } from '@/components/assessments/RaterResponseForm';

// ── helpers ──────────────────────────────────────────────────────────────────

const RATER_LABELS: Record<string, string> = {
  self: 'Self',
  manager: 'Manager',
  peer: 'Peer',
  direct_report: 'Direct Report',
};

// ── main component ────────────────────────────────────────────────────────────

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const { data: template, isLoading } = useTemplate(templateId);
  const updateTemplate = useUpdateTemplate();

  // Local draft state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  // Track first-load so expandedIds are only seeded once (not reset after every save)
  const hasInitialized = useRef(false);

  // Initialise from API data on first load; after saves only sync name/desc/config
  useEffect(() => {
    if (!template) return;
    if (!hasInitialized.current) {
      setName(template.name);
      setDescription(template.description ?? '');
      setConfig(template.config);
      if (template.config.competencies.length > 0) {
        setExpandedIds(new Set([template.config.competencies[0].id]));
      }
      hasInitialized.current = true;
      return;
    }
    // After a save: server data is canonical, but don't touch expandedIds
    if (!isDirty) {
      setName(template.name);
      setDescription(template.description ?? '');
      setConfig(template.config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // Warn on unload when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void doSave();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, config, isDirty]);

  // ── config helpers ────────────────────────────────────────────────────────

  const updateConfig = useCallback((updater: (c: TemplateConfig) => TemplateConfig) => {
    setConfig((prev) => (prev ? updater(prev) : prev));
    setIsDirty(true);
  }, []);

  // ── validation ────────────────────────────────────────────────────────────

  const validateConfig = useCallback((n: string, cfg: TemplateConfig): string[] => {
    const errors: string[] = [];
    if (!n.trim()) errors.push('Template name is required.');
    if (cfg.competencies.length === 0) errors.push('At least one competency is required.');
    if (cfg.raterTypes.length === 0) errors.push('At least one rater type must be selected.');
    cfg.competencies.forEach((comp, ci) => {
      if (!comp.name.trim()) errors.push(`Competency ${ci + 1}: name is required.`);
      if (comp.questions.length === 0) {
        errors.push(`Competency ${ci + 1} ("${comp.name || '?'}"): needs at least one question.`);
      }
      comp.questions.forEach((q, qi) => {
        if (!q.text.trim()) {
          errors.push(`Competency ${ci + 1}, Q${qi + 1}: question text cannot be empty.`);
        }
      });
    });
    return errors;
  }, []);

  // ── save / publish ────────────────────────────────────────────────────────

  const doSave = useCallback(
    async (extraFields?: { status?: 'draft' | 'published' | 'archived' }) => {
      if (!config) return;
      const errors = validateConfig(name, config);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors([]);
      try {
        await updateTemplate.mutateAsync({
          templateId,
          name,
          description: description || undefined,
          config,
          ...extraFields,
        });
        setIsDirty(false);
        setSaveMsg('Saved');
        setTimeout(() => setSaveMsg(null), 2500);
      } catch {
        // error shown via mutation.isError
      }
    },
    [config, description, name, templateId, updateTemplate, validateConfig]
  );

  const handlePublishToggle = useCallback(async () => {
    if (!template) return;
    const next = template.status === 'published' ? 'archived' : 'published';
    await doSave({ status: next });
  }, [doSave, template]);

  // ── competency operations ─────────────────────────────────────────────────

  const addCompetency = useCallback(() => {
    const id = crypto.randomUUID();
    const newComp: TemplateCompetency = {
      id,
      name: 'New Competency',
      questions: [{ id: crypto.randomUUID(), text: '' }],
    };
    updateConfig((c) => ({ ...c, competencies: [...c.competencies, newComp] }));
    setExpandedIds((prev) => new Set([...prev, id]));
  }, [updateConfig]);

  const deleteCompetency = useCallback(
    (compId: string) => {
      updateConfig((c) => {
        if (c.competencies.length <= 1) return c; // guard in UI, belt-and-suspenders here
        return { ...c, competencies: c.competencies.filter((x) => x.id !== compId) };
      });
      setExpandedIds((prev) => {
        const n = new Set(prev);
        n.delete(compId);
        return n;
      });
    },
    [updateConfig]
  );

  const updateCompetency = useCallback(
    (compId: string, patch: Partial<TemplateCompetency>) => {
      updateConfig((c) => ({
        ...c,
        competencies: c.competencies.map((x) => (x.id === compId ? { ...x, ...patch } : x)),
      }));
    },
    [updateConfig]
  );

  const moveCompetency = useCallback(
    (compId: string, dir: 'up' | 'down') => {
      updateConfig((c) => {
        const arr = [...c.competencies];
        const i = arr.findIndex((x) => x.id === compId);
        const j = dir === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length) return c;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        return { ...c, competencies: arr };
      });
    },
    [updateConfig]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  // ── question operations ───────────────────────────────────────────────────

  const addQuestion = useCallback(
    (compId: string) => {
      const newQ: TemplateQuestion = { id: crypto.randomUUID(), text: '' };
      updateConfig((c) => ({
        ...c,
        competencies: c.competencies.map((x) =>
          x.id === compId ? { ...x, questions: [...x.questions, newQ] } : x
        ),
      }));
    },
    [updateConfig]
  );

  const updateQuestion = useCallback(
    (compId: string, qId: string, patch: Partial<TemplateQuestion>) => {
      updateConfig((c) => ({
        ...c,
        competencies: c.competencies.map((x) =>
          x.id === compId
            ? { ...x, questions: x.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)) }
            : x
        ),
      }));
    },
    [updateConfig]
  );

  const deleteQuestion = useCallback(
    (compId: string, qId: string) => {
      updateConfig((c) => ({
        ...c,
        competencies: c.competencies.map((x) =>
          x.id === compId ? { ...x, questions: x.questions.filter((q) => q.id !== qId) } : x
        ),
      }));
    },
    [updateConfig]
  );

  // CCI: only one per competency
  const toggleCCI = useCallback(
    (compId: string, qId: string) => {
      updateConfig((c) => ({
        ...c,
        competencies: c.competencies.map((x) => {
          if (x.id !== compId) return x;
          return {
            ...x,
            questions: x.questions.map((q) =>
              q.id === qId ? { ...q, isCCI: !q.isCCI } : { ...q, isCCI: false }
            ),
          };
        }),
      }));
    },
    [updateConfig]
  );

  // ── guards ────────────────────────────────────────────────────────────────

  if (isLoading || !template) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!config) return null;

  const { status } = template;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => {
              if (isDirty && !confirm('You have unsaved changes. Leave without saving?')) return;
              router.push('/agency?tab=templates');
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Back to templates"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Name (inline edit) */}
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsDirty(true);
            }}
            className="flex-1 text-base font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-2 focus:ring-accent/30 rounded px-1 min-w-0"
            placeholder="Template name"
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status badge */}
            {status === 'published' && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" /> Published
              </span>
            )}
            {status === 'draft' && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                <Clock className="w-3 h-3" /> Draft
              </span>
            )}
            {status === 'archived' && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                <Archive className="w-3 h-3" /> Archived
              </span>
            )}

            {/* Preview */}
            <button
              onClick={() => {
                setPreviewSubmitted(false);
                setShowPreview(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            {/* Publish / Archive toggle */}
            <button
              onClick={handlePublishToggle}
              disabled={updateTemplate.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {status === 'published' ? (
                <>
                  <Archive className="w-3.5 h-3.5" /> Archive
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" /> Publish
                </>
              )}
            </button>

            {/* Save */}
            <button
              onClick={() => void doSave()}
              disabled={!isDirty || updateTemplate.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors"
            >
              {updateTemplate.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saveMsg ?? (isDirty ? 'Save' : 'Saved')}
            </button>
          </div>
        </div>

        {/* Dirty indicator */}
        {isDirty && validationErrors.length === 0 && (
          <p className="max-w-5xl mx-auto text-xs text-amber-600 flex items-center gap-1 mt-1 px-1">
            <AlertTriangle className="w-3 h-3" />
            Unsaved changes · Ctrl+S to save
          </p>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="max-w-5xl mx-auto mt-1 px-1">
            {validationErrors.map((err, i) => (
              <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                {err}
              </p>
            ))}
          </div>
        )}

        {updateTemplate.isError && (
          <p className="max-w-5xl mx-auto text-xs text-red-600 flex items-center gap-1 mt-1 px-1">
            <AlertTriangle className="w-3 h-3" />
            {(updateTemplate.error as Error)?.message ?? 'Save failed — please try again'}
          </p>
        )}
      </header>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4 pb-16">
        {/* Meta */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Description <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              rows={2}
              placeholder="What is this template used for?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none resize-none"
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>
              Type:{' '}
              <span className="font-medium text-gray-600 uppercase">{template.assessmentType}</span>
            </span>
            <span>Version {template.version}</span>
            <span>
              {config.competencies.length} competencies ·{' '}
              {config.competencies.reduce((n, c) => n + c.questions.length, 0)} questions
            </span>
          </div>
        </div>

        {/* ── Settings (collapsible) ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <span>Settings — rater types, scale &amp; comments</span>
            {showSettings ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showSettings && (
            <div className="border-t border-gray-100 px-4 py-5 space-y-6">
              {/* Rater types */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Rater Types
                </p>
                <div className="flex flex-wrap gap-4">
                  {(['self', 'manager', 'peer', 'direct_report'] as const).map((rt) => {
                    const checked = config.raterTypes.includes(rt);
                    return (
                      <label
                        key={rt}
                        className={`flex items-center gap-2 select-none ${checked && config.raterTypes.length <= 1 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={checked && config.raterTypes.length <= 1}
                          title={
                            checked && config.raterTypes.length <= 1
                              ? 'At least one rater type is required'
                              : undefined
                          }
                          onChange={() =>
                            updateConfig((c) => ({
                              ...c,
                              raterTypes: checked
                                ? c.raterTypes.filter((r) => r !== rt)
                                : [...c.raterTypes, rt],
                            }))
                          }
                          className="accent-red-600 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-700">{RATER_LABELS[rt]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scale */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Rating Scale
                </p>
                <div className="flex items-end gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Min</label>
                    <input
                      type="number"
                      value={config.scaleMin}
                      min={1}
                      max={config.scaleMax - 1}
                      onChange={(e) =>
                        updateConfig((c) => ({
                          ...c,
                          scaleMin: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max</label>
                    <input
                      type="number"
                      value={config.scaleMax}
                      min={config.scaleMin + 1}
                      max={10}
                      onChange={(e) =>
                        updateConfig((c) => ({
                          ...c,
                          scaleMax: Math.min(10, parseInt(e.target.value) || 5),
                        }))
                      }
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 pb-2">
                    {config.scaleMin} = lowest · {config.scaleMax} = highest
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Comments &amp; Anonymity
                </p>
                <div className="space-y-2">
                  {[
                    { key: 'allowComments', label: 'Allow open-text comments' },
                    {
                      key: 'requireComments',
                      label: 'Require comments (only applies if allowed)',
                      disabled: !config.allowComments,
                    },
                    { key: 'anonymizeResponses', label: 'Anonymize rater responses' },
                    { key: 'showCompetenciesToRaters', label: 'Show competency names to raters' },
                  ].map(({ key, label, disabled }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={config[key as keyof TemplateConfig] as boolean}
                        disabled={disabled}
                        onChange={() =>
                          updateConfig((c) => ({
                            ...c,
                            [key]: !c[key as keyof TemplateConfig],
                          }))
                        }
                        className="accent-red-600 disabled:opacity-50"
                      />
                      <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Competencies ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Competencies ({config.competencies.length})
            </h2>
            <button
              onClick={addCompetency}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Add Competency
            </button>
          </div>

          {config.competencies.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-sm text-gray-500 mb-3">No competencies yet.</p>
              <button
                onClick={addCompetency}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Add First Competency
              </button>
            </div>
          )}

          <div className="space-y-3">
            {config.competencies.map((comp, compIdx) => {
              const isExpanded = expandedIds.has(comp.id);
              const cciCount = comp.questions.filter((q) => q.isCCI).length;

              return (
                <div key={comp.id} className="bg-white rounded-xl border border-gray-200">
                  {/* ── Competency header ── */}
                  <div className="flex items-center gap-2 px-4 py-3">
                    {/* Move up/down */}
                    <div className="flex flex-col flex-shrink-0">
                      <button
                        onClick={() => moveCompetency(comp.id, 'up')}
                        disabled={compIdx === 0}
                        className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveCompetency(comp.id, 'down')}
                        disabled={compIdx === config.competencies.length - 1}
                        className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Index */}
                    <span className="text-xs font-medium text-gray-400 w-5 text-center flex-shrink-0">
                      {compIdx + 1}
                    </span>

                    {/* Name (inline edit) */}
                    <input
                      value={comp.name}
                      onChange={(e) => updateCompetency(comp.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-0 outline-none focus:ring-2 focus:ring-accent/20 rounded px-1 min-w-0"
                      placeholder="Competency name"
                    />

                    {/* Meta */}
                    <span className="hidden sm:block text-xs text-gray-400 flex-shrink-0">
                      {comp.questions.length} {comp.questions.length === 1 ? 'q' : 'qs'}
                      {cciCount > 0 && ' · CCI'}
                    </span>

                    {/* Expand */}
                    <button
                      onClick={() => toggleExpand(comp.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (config.competencies.length <= 1) {
                          alert('A template must have at least one competency.');
                          return;
                        }
                        deleteCompetency(comp.id);
                      }}
                      className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors flex-shrink-0"
                      aria-label="Delete competency"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ── Questions (expanded) ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pt-3 pb-4 space-y-3">
                      {/* Description */}
                      <input
                        value={comp.description ?? ''}
                        onChange={(e) => updateCompetency(comp.id, { description: e.target.value })}
                        className="w-full text-xs text-gray-500 bg-transparent border-0 border-b border-gray-100 outline-none focus:border-gray-300 pb-2 px-0"
                        placeholder="Competency description (optional)…"
                      />

                      {/* Column headers */}
                      <div
                        className="grid items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide px-6"
                        style={{ gridTemplateColumns: '1fr 44px 44px 28px' }}
                      >
                        <span>Question text</span>
                        {/* [R] header tooltip */}
                        <span className="relative flex justify-center group/rh">
                          <span className="cursor-default">[R]</span>
                          <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover/rh:opacity-100 transition-opacity z-50 normal-case tracking-normal font-normal leading-relaxed">
                            <strong className="font-semibold block mb-0.5">Reverse Scored</strong>
                            The rating is inverted during computation. On a 1–5 scale, a raw score
                            of 2 becomes 4. Use for negatively-phrased questions where a low rating
                            means high performance.
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                          </span>
                        </span>
                        {/* CCI header tooltip */}
                        <span className="relative flex justify-center group/ccih">
                          <span className="cursor-default">CCI</span>
                          <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover/ccih:opacity-100 transition-opacity z-50 normal-case tracking-normal font-normal leading-relaxed">
                            <strong className="font-semibold block mb-0.5">
                              Coaching Capacity Index (CCI)
                            </strong>
                            Marks this question as the CCI item for this competency. CCI scores are
                            averaged across all competencies and classified as Low / Moderate / High
                            / Very High. Only one CCI question is allowed per competency.
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                          </span>
                        </span>
                        <span />
                      </div>

                      {/* Question rows */}
                      {comp.questions.map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="grid items-center gap-2"
                          style={{ gridTemplateColumns: '1fr 44px 44px 28px' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-300 w-4 flex-shrink-0 text-right">
                              {qIdx + 1}.
                            </span>
                            <input
                              value={q.text}
                              onChange={(e) =>
                                updateQuestion(comp.id, q.id, { text: e.target.value })
                              }
                              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                              placeholder="Question text…"
                            />
                          </div>

                          {/* [R] — reverse scored */}
                          <div className="relative flex justify-center group/rb">
                            <button
                              onClick={() =>
                                updateQuestion(comp.id, q.id, { reverseScored: !q.reverseScored })
                              }
                              className={`w-9 py-1 rounded text-xs font-semibold transition-colors ${
                                q.reverseScored
                                  ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              [R]
                            </button>
                            <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover/rb:opacity-100 transition-opacity z-50 leading-relaxed">
                              <strong className="font-semibold block mb-0.5">Reverse Scored</strong>
                              Rating is inverted during scoring. On a 1–5 scale, a raw score of 2
                              becomes 4. Use for negatively-phrased questions.
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </span>
                          </div>

                          {/* CCI */}
                          <div className="relative flex justify-center group/ccib">
                            <button
                              onClick={() => toggleCCI(comp.id, q.id)}
                              className={`w-9 py-1 rounded text-xs font-semibold transition-colors ${
                                q.isCCI
                                  ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              CCI
                            </button>
                            <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 group-hover/ccib:opacity-100 transition-opacity z-50 leading-relaxed">
                              <strong className="font-semibold block mb-0.5">
                                Coaching Capacity Index
                              </strong>
                              Marks this as the CCI question for this competency. CCI scores are
                              averaged across competencies and rated Low → Very High. One per
                              competency only.
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </span>
                          </div>

                          {/* Delete question */}
                          <button
                            onClick={() => {
                              if (comp.questions.length <= 1) {
                                alert('A competency must have at least one question.');
                                return;
                              }
                              deleteQuestion(comp.id, q.id);
                            }}
                            className="flex justify-center p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                            aria-label="Delete question"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add question */}
                      <button
                        onClick={() => addQuestion(comp.id)}
                        className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium ml-6 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Question
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Rater Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Preview banner */}
          <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Rater Preview — responses are not saved.</span>
            </div>
            <div className="flex items-center gap-2">
              {previewSubmitted && (
                <button
                  onClick={() => setPreviewSubmitted(false)}
                  className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 border border-amber-300 rounded-md px-2 py-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Restart preview
                </button>
              )}
              <button
                onClick={() => setShowPreview(false)}
                className="text-amber-700 hover:text-amber-900 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Post-submission confirmation */}
          {previewSubmitted ? (
            <div className="flex-1 bg-gray-50 flex items-center justify-center px-4">
              <div className="text-center max-w-md">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-500 mb-2">
                  Your feedback for <span className="font-medium">Sample Participant</span> has been
                  submitted successfully.
                </p>
                <p className="text-xs text-gray-400">You can close this page now.</p>
              </div>
            </div>
          ) : (
            /* Active form */
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {/* Confidentiality banner — same as real rater page */}
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-blue-700">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Your responses are confidential and will be anonymized in the report.</span>
                </div>
              </div>
              <div className="px-4 py-8">
                <RaterResponseForm
                  assessmentName={name || template.name}
                  subjectName="Sample Participant"
                  competencies={config.competencies}
                  scaleMin={config.scaleMin}
                  scaleMax={config.scaleMax}
                  scaleLabels={config.scaleLabels}
                  allowComments={config.allowComments}
                  requireComments={config.requireComments}
                  onSubmit={() => setPreviewSubmitted(true)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
