'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  useSurvey,
  useUpdateSurvey,
  useCreateSurveyQuestion,
  useUpdateSurveyQuestion,
  useDeleteSurveyQuestion,
  useSurveyResults,
} from '@/hooks/api/useSurveys';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Link as LinkIcon,
  BarChart2,
  Settings2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type {
  SurveyQuestion,
  SurveyQuestionType,
  SurveyQuestionConfig,
  SurveyStatus,
} from '@/types/surveys';
import { SurveyResults } from '@/components/surveys/SurveyResults';

// ── Question type labels ───────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  text: 'Open Text',
  rating: 'Rating Scale',
  nps: 'NPS Score',
  yes_no: 'Yes / No',
  ranking: 'Ranking',
};

// ── Question editor ────────────────────────────────────────────────────────────

function QuestionEditor({
  question,
  onUpdate,
  onDelete,
}: {
  question: SurveyQuestion;
  onUpdate: (q: SurveyQuestion) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = question.config ?? {};

  const updateField = (field: Partial<SurveyQuestion>) =>
    onUpdate({ ...question, ...field });

  const updateConfig = (newConfig: Partial<SurveyQuestionConfig>) =>
    onUpdate({ ...question, config: { ...config, ...newConfig } });

  const updateOption = (idx: number, value: string) => {
    const opts = [...(config.options ?? [])];
    opts[idx] = value;
    updateConfig({ options: opts });
  };

  const addOption = () => updateConfig({ options: [...(config.options ?? []), ''] });

  const removeOption = (idx: number) => {
    const opts = [...(config.options ?? [])];
    opts.splice(idx, 1);
    updateConfig({ options: opts });
  };

  const updateItem = (idx: number, value: string) => {
    const items = [...(config.items ?? [])];
    items[idx] = value;
    updateConfig({ items });
  };

  const addItem = () => updateConfig({ items: [...(config.items ?? []), ''] });

  const removeItem = (idx: number) => {
    const items = [...(config.items ?? [])];
    items.splice(idx, 1);
    updateConfig({ items });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Question header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-muted-foreground hover:text-sidebar-foreground transition-colors"
          aria-label={expanded ? 'Collapse question' : 'Expand question'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
          aria-label="Delete question"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Question</label>
            <input
              type="text"
              value={question.text}
              onChange={(e) => updateField({ text: e.target.value })}
              placeholder="Enter your question..."
              className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>

          {/* Question type */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={question.type}
                onChange={(e) => updateField({ type: e.target.value as SurveyQuestionType })}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id={`req-${question.id}`}
                checked={question.required}
                onChange={(e) => updateField({ required: e.target.checked })}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <label htmlFor={`req-${question.id}`} className="text-sm text-muted-foreground whitespace-nowrap">
                Required
              </label>
            </div>
          </div>

          {/* Single/multiple choice options */}
          {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Options</label>
              <div className="space-y-2">
                {(config.options ?? []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button onClick={() => removeOption(idx)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors" aria-label="Remove option">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Add option
                </button>
              </div>
            </div>
          )}

          {/* Rating config */}
          {question.type === 'rating' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Min value</label>
                <input
                  type="number"
                  value={config.min ?? 1}
                  onChange={(e) => updateConfig({ min: parseInt(e.target.value) })}
                  min={1} max={5}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Max value</label>
                <input
                  type="number"
                  value={config.max ?? 5}
                  onChange={(e) => updateConfig({ max: parseInt(e.target.value) })}
                  min={2} max={10}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Min label</label>
                <input
                  type="text"
                  value={config.minLabel ?? ''}
                  onChange={(e) => updateConfig({ minLabel: e.target.value })}
                  placeholder="e.g. Not at all"
                  className="w-full px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Max label</label>
                <input
                  type="text"
                  value={config.maxLabel ?? ''}
                  onChange={(e) => updateConfig({ maxLabel: e.target.value })}
                  placeholder="e.g. Extremely"
                  className="w-full px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {/* NPS info */}
          {question.type === 'nps' && (
            <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              NPS uses a fixed 0–10 scale. Respondents rate likelihood to recommend.
            </p>
          )}

          {/* Ranking items */}
          {question.type === 'ranking' && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Items to rank</label>
              <div className="space-y-2">
                {(config.items ?? []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(idx, e.target.value)}
                      placeholder={`Item ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors" aria-label="Remove item">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Add item
                </button>
              </div>
            </div>
          )}

          {/* Text placeholder */}
          {question.type === 'text' && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Placeholder hint (optional)</label>
              <input
                type="text"
                value={config.placeholder ?? ''}
                onChange={(e) => updateConfig({ placeholder: e.target.value })}
                placeholder="Type your answer..."
                className="w-full px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main editor page ───────────────────────────────────────────────────────────

export default function SurveyEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [_savedMsg, setSavedMsg] = useState('');

  const surveyId = params.surveyId as string;
  const tenantId = user?.tenantId ?? null;
  const defaultTab = searchParams.get('tab') === 'results' ? 'results' : 'questions';
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'results'>(defaultTab);

  const { data: survey, isLoading } = useSurvey(tenantId, surveyId);
  const { data: results } = useSurveyResults(
    activeTab === 'results' ? tenantId : null,
    activeTab === 'results' ? surveyId : null
  );
  const updateMutation = useUpdateSurvey(tenantId, surveyId);
  const createQuestionMutation = useCreateSurveyQuestion(tenantId, surveyId);
  const updateQuestionMutation = useUpdateSurveyQuestion(tenantId, surveyId);
  const deleteQuestionMutation = useDeleteSurveyQuestion(tenantId, surveyId);

  const handleAddQuestion = async (type: SurveyQuestionType) => {
    const defaults: Record<SurveyQuestionType, Partial<SurveyQuestionConfig>> = {
      single_choice: { options: ['Option A', 'Option B'] },
      multiple_choice: { options: ['Option A', 'Option B'] },
      text: {},
      rating: { min: 1, max: 5 },
      nps: {},
      yes_no: { options: ['Yes', 'No'] },
      ranking: { items: ['Item 1', 'Item 2'] },
    };
    await createQuestionMutation.mutateAsync({
      text: '',
      type,
      required: true,
      config: defaults[type],
    });
  };

  const handleUpdateQuestion = useCallback(async (q: SurveyQuestion) => {
    try {
      await updateQuestionMutation.mutateAsync({
        questionId: q.id,
        text: q.text,
        type: q.type,
        required: q.required,
        config: q.config ?? undefined,
      });
    } catch {
      // Silently retry on next change
    }
  }, [updateQuestionMutation]);

  const handleDeleteQuestion = async (questionId: string) => {
    await deleteQuestionMutation.mutateAsync(questionId);
  };

  const handleUpdateSettings = async (field: string, value: unknown) => {
    try {
      await updateMutation.mutateAsync({ [field]: value });
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch {
      setSavedMsg('Failed to save');
      setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const copyShareLink = () => {
    if (!survey?.shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/survey/${survey.shareToken}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-48" />
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 text-center">
        <p className="text-muted-foreground">Survey not found.</p>
        <button onClick={() => router.push('/surveys')} className="mt-4 text-accent hover:underline text-sm">
          Back to Surveys
        </button>
      </div>
    );
  }

  const questions = survey.questions ?? [];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => router.push('/surveys')}
          className="mt-1 p-1.5 text-muted-foreground hover:text-sidebar-foreground transition-colors"
          aria-label="Back to surveys"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-sidebar-foreground truncate">{survey.title}</h1>
            <StatusChip status={survey.status} />
          </div>
          <div className="flex items-center gap-3">
            {/* Status toggle */}
            <select
              value={survey.status}
              onChange={(e) => handleUpdateSettings('status', e.target.value)}
              className="px-2 py-1 text-xs border border-border rounded-lg bg-card text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Change survey status"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            {/* Share link (active only) */}
            {survey.status === 'active' && survey.shareToken && (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-accent border border-accent/30 rounded-lg hover:bg-accent/5 transition-colors"
              >
                <LinkIcon className="w-3 h-3" aria-hidden="true" />
                {linkCopied ? 'Copied!' : 'Copy share link'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {([
          { id: 'questions', label: 'Questions', icon: null },
          { id: 'settings', label: 'Settings', icon: Settings2 },
          { id: 'results', label: `Results (${survey.responseCount ?? 0})`, icon: BarChart2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === id
                ? 'text-accent border-b-2 border-accent -mb-px'
                : 'text-muted-foreground hover:text-sidebar-foreground'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
            {label}
          </button>
        ))}
      </div>

      {/* Questions tab */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question list */}
          <div className="lg:col-span-2 space-y-3">
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-4">No questions yet. Add your first question.</p>
              </div>
            ) : (
              questions.map((q) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  onUpdate={handleUpdateQuestion}
                  onDelete={() => handleDeleteQuestion(q.id)}
                />
              ))
            )}
          </div>

          {/* Add question panel */}
          <div>
            <div className="bg-card border border-border rounded-xl p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-sidebar-foreground mb-3">Add Question</h3>
              <div className="space-y-1.5">
                {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => handleAddQuestion(type as SurveyQuestionType)}
                    disabled={createQuestionMutation.isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-muted/50 hover:text-sidebar-foreground transition-colors text-left disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-accent flex-shrink-0" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-sidebar-foreground">Survey Details</h3>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
              <input
                type="text"
                defaultValue={survey.title}
                onBlur={(e) => handleUpdateSettings('title', e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description (optional)</label>
              <textarea
                defaultValue={survey.description ?? ''}
                onBlur={(e) => handleUpdateSettings('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-sidebar-foreground">Response Settings</h3>

            {[
              { field: 'anonymous', label: 'Anonymous responses', desc: 'Do not collect respondent identity' },
              { field: 'requireLogin', label: 'Require login', desc: 'Respondents must be logged in to submit' },
              { field: 'allowMultipleResponses', label: 'Allow multiple responses', desc: 'Same person can submit more than once' },
              { field: 'showResultsToRespondent', label: 'Show results to respondent', desc: 'Respondent sees aggregate results after submitting' },
            ].map(({ field, label, desc }) => (
              <div key={field} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={survey[field as keyof typeof survey] as boolean}
                  onChange={(e) => handleUpdateSettings(field, e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
              </div>
            ))}
          </div>

          {/* Share link */}
          {survey.shareToken && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-sidebar-foreground mb-2">Share Link</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Anyone with this link can access the survey
                {survey.requireLogin ? ' (requires login)' : ' (public access)'}.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted/50 px-3 py-2 rounded-lg text-muted-foreground truncate">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/survey/${survey.shareToken}`
                    : `/survey/${survey.shareToken}`}
                </code>
                <button
                  onClick={copyShareLink}
                  className="px-3 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-medium hover:bg-accent/90 transition-all"
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results tab */}
      {activeTab === 'results' && (
        <div>
          {!results ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart2 className="w-10 h-10 text-muted-foreground mb-4" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">No responses yet.</p>
            </div>
          ) : (
            <SurveyResults results={results} />
          )}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: SurveyStatus }) {
  const config = {
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', icon: Clock },
    active: { label: 'Active', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    closed: { label: 'Closed', className: 'bg-gray-100 text-gray-500', icon: AlertCircle },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
