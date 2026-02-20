'use client';

import { useState, useEffect, useId } from 'react';
import { ClipboardCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useSurvey, useMyExistingSurveyResponse, useSubmitSurveyResponse } from '@/hooks/api/useSurveys';
import type { SurveyQuestionConfig } from '@/types/surveys';

// ── Question renderer (same logic as public survey page) ───────────────────────

function SurveyQuestion({
  question,
  answer,
  onChange,
  baseId,
}: {
  question: { id: string; text: string; type: string; required: boolean; config: SurveyQuestionConfig | null };
  answer: unknown;
  onChange: (value: unknown) => void;
  baseId: string;
}) {
  const config = question.config ?? {};
  const fieldId = `${baseId}-${question.id}`;

  switch (question.type) {
    case 'single_choice':
    case 'yes_no': {
      const options = config.options ?? (question.type === 'yes_no' ? ['Yes', 'No'] : []);
      return (
        <fieldset>
          <legend className="sr-only">Select one option</legend>
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                  answer === opt ? 'border-accent bg-accent/5' : 'border-border bg-muted/30 hover:border-accent/30'
                }`}
              >
                <input
                  type="radio"
                  name={fieldId}
                  value={opt}
                  checked={answer === opt}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 text-accent border-border focus:ring-accent"
                />
                <span className="text-sidebar-foreground">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    case 'multiple_choice': {
      const options = config.options ?? [];
      const selected = Array.isArray(answer) ? (answer as string[]) : [];
      const toggle = (opt: string) => {
        onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
      };
      return (
        <div className="space-y-2" role="group" aria-label="Select all that apply">
          {options.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                selected.includes(opt) ? 'border-accent bg-accent/5' : 'border-border bg-muted/30 hover:border-accent/30'
              }`}
            >
              <input
                type="checkbox"
                value={opt}
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-4 h-4 rounded text-accent border-border focus:ring-accent"
              />
              <span className="text-sidebar-foreground">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'text': {
      return (
        <textarea
          id={fieldId}
          value={(answer as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder ?? 'Type your answer...'}
          rows={4}
          className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
          aria-label="Text response"
        />
      );
    }

    case 'rating': {
      const min = config.min ?? 1;
      const max = config.max ?? 5;
      const values = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {values.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={`w-10 h-10 rounded-lg border font-medium text-sm transition-all ${
                  answer === v
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border hover:border-accent/30 text-sidebar-foreground'
                }`}
                aria-label={`Rating: ${v}`}
                aria-pressed={answer === v}
              >
                {v}
              </button>
            ))}
          </div>
          {(config.minLabel || config.maxLabel) && (
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>{config.minLabel ?? ''}</span>
              <span>{config.maxLabel ?? ''}</span>
            </div>
          )}
        </div>
      );
    }

    case 'nps': {
      const npsValues = Array.from({ length: 11 }, (_, i) => i);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {npsValues.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={`w-9 h-9 rounded-lg border font-medium text-sm transition-all ${
                  answer === v
                    ? 'border-accent bg-accent text-accent-foreground'
                    : v <= 6
                      ? 'border-red-200 text-red-700 hover:border-red-400'
                      : v <= 8
                        ? 'border-amber-200 text-amber-700 hover:border-amber-400'
                        : 'border-green-200 text-green-700 hover:border-green-400'
                }`}
                aria-label={`NPS score: ${v}`}
                aria-pressed={answer === v}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Not likely</span>
            <span>Extremely likely</span>
          </div>
        </div>
      );
    }

    case 'ranking': {
      const items = (config.items ?? []) as string[];
      const ranked = Array.isArray(answer) ? (answer as string[]) : [...items];
      const moveUp = (idx: number) => {
        if (idx === 0) return;
        const r = [...ranked];
        [r[idx - 1], r[idx]] = [r[idx], r[idx - 1]];
        onChange(r);
      };
      const moveDown = (idx: number) => {
        if (idx === ranked.length - 1) return;
        const r = [...ranked];
        [r[idx], r[idx + 1]] = [r[idx + 1], r[idx]];
        onChange(r);
      };
      return (
        <div className="space-y-2" aria-label="Rank items">
          {ranked.map((item, idx) => (
            <div key={item} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-medium flex-shrink-0">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm text-sidebar-foreground">{item}</span>
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-sidebar-foreground disabled:opacity-30" aria-label="Move up">↑</button>
                <button type="button" onClick={() => moveDown(idx)} disabled={idx === ranked.length - 1} className="p-0.5 text-muted-foreground hover:text-sidebar-foreground disabled:opacity-30" aria-label="Move down">↓</button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

interface SurveyContentProps {
  surveyId: string | null | undefined;
  tenantId: string | null | undefined;
  enrollmentId: string | null | undefined;
  lessonTitle: string;
  onSurveyCompleted?: () => void;
}

export function SurveyContent({ surveyId, tenantId, enrollmentId, lessonTitle, onSurveyCompleted }: SurveyContentProps) {
  const baseId = useId();
  const { data: survey, isLoading } = useSurvey(tenantId ?? null, surveyId ?? null);
  const { data: existingResponse, isLoading: isLoadingResponse } = useMyExistingSurveyResponse(
    tenantId ?? null,
    surveyId ?? null
  );
  const submitMutation = useSubmitSurveyResponse(tenantId ?? null, surveyId ?? '');

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);

  // Initialise ranking defaults
  useEffect(() => {
    if (survey?.questions) {
      const defaults: Record<string, unknown> = {};
      for (const q of survey.questions) {
        if (q.type === 'ranking' && q.config?.items) {
          defaults[q.id] = [...q.config.items];
        }
      }
      if (Object.keys(defaults).length > 0) {
        setAnswers((prev) => ({ ...defaults, ...prev }));
      }
    }
  }, [survey?.questions]);

  const canCallApi = !!(tenantId && surveyId);

  if (!surveyId) {
    return (
      <div className="py-12 text-center">
        <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No survey linked to this lesson.</p>
      </div>
    );
  }

  if (!canCallApi || isLoading || isLoadingResponse) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" role="status" aria-label="Loading survey..." />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Survey not found.</p>
      </div>
    );
  }

  if (survey.status === 'closed') {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">This survey is closed and no longer accepting responses.</p>
      </div>
    );
  }

  // Already submitted
  const alreadySubmitted = submitted || !!existingResponse;
  if (alreadySubmitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-green-800">Survey completed</p>
            <p className="text-xs text-green-700 mt-0.5">Your response has been recorded.</p>
          </div>
        </div>
      </div>
    );
  }

  const questions = survey.questions ?? [];
  const allRequired = questions.filter((q) => q.required);
  const allAnswered = allRequired.every((q) => {
    const ans = answers[q.id];
    if (ans == null) return false;
    if (typeof ans === 'string') return ans.trim().length > 0;
    if (Array.isArray(ans)) return ans.length > 0;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitMutation.mutateAsync({
        answers,
        enrollmentId: enrollmentId ?? undefined,
      });
      setSubmitted(true);
      onSurveyCompleted?.();
    } catch {
      // Error handled via mutation state
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
          <ClipboardCheck className="w-5 h-5 text-teal-600" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-sidebar-foreground">{survey.title || lessonTitle}</h2>
          {survey.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{survey.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {survey.anonymous && ' · Anonymous'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-card border border-border rounded-xl p-5">
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Question {idx + 1}</p>
              <p className="text-sm font-medium text-sidebar-foreground">
                {q.text}
                {q.required && <span className="text-accent ml-1" aria-label="required">*</span>}
              </p>
            </div>
            <SurveyQuestion
              question={q}
              answer={answers[q.id]}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              baseId={`${baseId}-q`}
            />
          </div>
        ))}

        {submitMutation.isError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-red-800">
              {(submitMutation.error as Error)?.message ?? 'Failed to submit. Please try again.'}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!allAnswered || submitMutation.isPending}
            className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </form>
    </div>
  );
}
