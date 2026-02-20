'use client';

import { useState, useEffect, useId } from 'react';
import { useParams } from 'next/navigation';
import { usePublicSurvey, useSubmitPublicSurveyResponse } from '@/hooks/api/useSurveys';
import { SurveyResults } from '@/components/surveys/SurveyResults';
import { ClipboardCheck, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import type { SurveyQuestionConfig, SurveyResults as SurveyResultsData } from '@/types/surveys';

// ── Session token for anonymous dedup ─────────────────────────────────────────

function getSessionToken(): string {
  const KEY = 'survey_session_token';
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}

// ── Question renderer (public) ────────────────────────────────────────────────

function PublicQuestion({
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
        <div className="space-y-2" aria-label="Drag to rank items">
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

// ── Main public survey page ───────────────────────────────────────────────────

export default function PublicSurveyPage() {
  const params = useParams();
  const token = params.token as string;
  const baseId = useId();

  const { data: survey, isLoading, error } = usePublicSurvey(token);
  const submitMutation = useSubmitPublicSurveyResponse();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [surveyResults, setSurveyResults] = useState<SurveyResultsData | null>(null);

  // Initialise ranking questions with default order
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionToken = getSessionToken();
    try {
      const result = await submitMutation.mutateAsync({ shareToken: token, answers, sessionToken });
      setSurveyResults(result.surveyResults ?? null);
      setSubmitted(true);
    } catch {
      // Error handled via mutation
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" role="status">
          <span className="sr-only">Loading survey...</span>
        </div>
      </div>
    );
  }

  // Error states
  if (error || !survey) {
    const message =
      (error as Error & { status?: number })?.status === 410
        ? 'This survey is closed and no longer accepting responses.'
        : (error as Error & { status?: number })?.status === 401
          ? 'This survey requires you to log in.'
          : 'Survey not found. The link may be invalid or expired.';

    const icon =
      (error as Error & { status?: number })?.status === 401
        ? <Lock className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        : <AlertCircle className="w-8 h-8 text-muted-foreground" aria-hidden="true" />;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    );
  }

  // Thank you screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-sidebar-foreground mb-2">Thank you!</h1>
            <p className="text-muted-foreground text-sm">Your response has been submitted.</p>
          </div>
          {surveyResults && (
            <div>
              <h2 className="text-base font-semibold text-sidebar-foreground mb-4">Survey Results</h2>
              <SurveyResults results={surveyResults} />
            </div>
          )}
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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">{survey.title}</h1>
              {survey.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{survey.description}</p>
              )}
            </div>
          </div>
          <div className="h-1 bg-muted rounded-full">
            <div className="h-full bg-accent rounded-full w-0" style={{ width: '0%' }} aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {survey.anonymous && ' · Anonymous'}
          </p>
        </div>

        {/* Survey form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-5">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Question {idx + 1}</p>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {q.text}
                  {q.required && <span className="text-accent ml-1" aria-label="required">*</span>}
                </p>
              </div>
              <PublicQuestion
                question={q}
                answer={answers[q.id]}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                baseId={`${baseId}-q`}
              />
            </div>
          ))}

          {/* Submit error */}
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
    </div>
  );
}
