'use client';

import { memo, useState, useCallback, useId } from 'react';
import type { LessonContent, QuizAttempt } from '@/types/programs';
import { ClipboardCheck, Info, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useMyQuizAttempts, useSubmitQuiz } from '@/hooks/api/useQuiz';

interface QuizContentProps {
  content: LessonContent;
  lessonTitle?: string;
  tenantId?: string | null;
  programId?: string;
  lessonId?: string;
  enrollmentId?: string | null;
  onQuizPassed?: () => void;
}

// ── Results View ──────────────────────────────────────────────────────────────

function QuizResults({
  attempt,
  content,
  onRetake,
  canRetake,
}: {
  attempt: QuizAttempt;
  content: LessonContent;
  onRetake: () => void;
  canRetake: boolean;
}) {
  const score = attempt.score != null ? parseFloat(attempt.score) : null;
  const isPending = attempt.gradingStatus === 'pending_grade';
  const passed = attempt.passed;
  const passingScore = content.passingScore;

  return (
    <div>
      {/* Pending grade banner */}
      {isPending && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-amber-800">Pending Facilitator Review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              One or more of your answers requires manual grading. Your score will be updated once reviewed.
            </p>
          </div>
        </div>
      )}

      {/* Score card */}
      {score != null && (
        <div
          className={`mb-6 p-5 rounded-xl border-2 text-center ${
            passed === true
              ? 'bg-green-50 border-green-300'
              : passed === false
                ? 'bg-red-50 border-red-300'
                : 'bg-muted/50 border-border'
          }`}
          role="status"
          aria-label={`Quiz score: ${Math.round(score)}%`}
        >
          <div
            className={`text-4xl font-bold mb-1 ${
              passed === true ? 'text-green-700' : passed === false ? 'text-red-700' : 'text-sidebar-foreground'
            }`}
          >
            {Math.round(score)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {attempt.pointsEarned} points earned
            {passingScore != null && ` · Passing score: ${passingScore}%`}
          </div>
          {passed === true && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Passed
            </div>
          )}
          {passed === false && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-red-700 text-sm font-medium">
              <XCircle className="w-4 h-4" aria-hidden="true" />
              Did not pass
            </div>
          )}
        </div>
      )}

      {/* Per-question breakdown */}
      {attempt.breakdown && attempt.breakdown.length > 0 && (
        <div className="space-y-3" role="list" aria-label="Question results">
          {attempt.breakdown.map((item, idx) => {
            const isPendingItem = item.gradingMode === 'manual' && !item.isCorrect && item.pointsEarned === 0;
            const earned = item.pointsEarned;
            const possible = item.pointsPossible;

            return (
              <div
                key={item.questionId}
                className={`p-4 rounded-xl border ${
                  isPendingItem
                    ? 'border-amber-200 bg-amber-50/50'
                    : item.isCorrect
                      ? 'border-green-200 bg-green-50/50'
                      : item.gradingMode === 'auto_complete'
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-red-200 bg-red-50/50'
                }`}
                role="listitem"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isPendingItem ? (
                      <Clock className="w-4 h-4 text-amber-500" aria-label="Pending review" />
                    ) : item.isCorrect || item.gradingMode === 'auto_complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" aria-label="Correct" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" aria-label="Incorrect" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground mb-2">
                      {idx + 1}. {item.question}
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Your answer: </span>
                        {item.yourAnswer != null
                          ? String(item.yourAnswer)
                          : <span className="italic">No answer</span>}
                      </div>
                      {item.correctAnswer != null && item.type !== 'short_answer' && (
                        <div>
                          <span className="font-medium">Correct answer: </span>
                          {String(item.correctAnswer)}
                        </div>
                      )}
                      {isPendingItem && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          Pending manual review
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs font-medium text-muted-foreground">
                    {earned}/{possible} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Retake button */}
      {canRetake && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card rounded-lg text-sm font-medium text-sidebar-foreground hover:border-accent/30 hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            aria-label="Retake quiz"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}

// ── Quiz Form ─────────────────────────────────────────────────────────────────

/**
 * Quiz lesson content component.
 * Connects to the quiz API to track attempts, scores, and support retakes.
 */
export const QuizContent = memo(function QuizContent({
  content,
  lessonTitle,
  tenantId,
  programId,
  lessonId,
  enrollmentId,
  onQuizPassed,
}: QuizContentProps) {
  const questions = content.quizQuestions;
  const passingScore = content.passingScore;
  const allowRetakes = content.allowRetakes;
  const maxAttempts = content.maxAttempts;

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [view, setView] = useState<'form' | 'results'>('form');
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const baseId = useId();

  const canCallApi = !!tenantId && !!programId && !!lessonId;

  // Load prior attempts
  const { data: attempts, isLoading: isLoadingAttempts } = useMyQuizAttempts(
    tenantId ?? null,
    programId ?? '',
    lessonId ?? '',
    enrollmentId
  );

  const submitQuizMutation = useSubmitQuiz();

  // Determine the best prior attempt to display
  const priorPassingAttempt = attempts?.find((a) => a.passed === true);
  const lastAttempt = attempts && attempts.length > 0 ? attempts[attempts.length - 1] : null;

  // On first load, if there's a passing attempt show results view
  // (only flip once from default 'form')
  const [initialized, setInitialized] = useState(false);
  if (!initialized && attempts !== undefined) {
    setInitialized(true);
    if (priorPassingAttempt) {
      setView('results');
      setLatestAttempt(priorPassingAttempt);
    } else if (lastAttempt) {
      setView('results');
      setLatestAttempt(lastAttempt);
    }
  }

  const displayedAttempt = latestAttempt ?? priorPassingAttempt ?? lastAttempt;
  const attemptCount = attempts?.length ?? 0;
  const canRetake =
    !!(allowRetakes && (maxAttempts == null || attemptCount < maxAttempts)) &&
    displayedAttempt?.passed !== true;

  const handleAnswer = useCallback(
    (questionId: string, value: string | number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const allAnswered =
    questions != null &&
    questions.length > 0 &&
    questions.every((q) => {
      const answer = answers[q.id];
      if (answer == null) return false;
      if (typeof answer === 'string' && answer.trim().length === 0) return false;
      return true;
    });

  const totalPoints = questions?.reduce((sum, q) => sum + (q.points ?? 0), 0) ?? 0;

  const handleSubmit = useCallback(async () => {
    if (!canCallApi || !tenantId || !programId || !lessonId) return;
    try {
      const result = await submitQuizMutation.mutateAsync({
        tenantId,
        programId,
        lessonId,
        answers,
      });
      setLatestAttempt(result.attempt);
      setView('results');
      if (result.passed && onQuizPassed) {
        onQuizPassed();
      }
    } catch {
      // Error handled by mutation
    }
  }, [canCallApi, tenantId, programId, lessonId, answers, submitQuizMutation, onQuizPassed]);

  const handleRetake = useCallback(() => {
    setAnswers({});
    setView('form');
  }, []);

  // Empty state
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <ClipboardCheck className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-sidebar-foreground mb-2">No Quiz Questions</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This quiz has not been configured with any questions yet. Please check back later.
        </p>
      </div>
    );
  }

  // Loading prior attempts
  if (canCallApi && isLoadingAttempts && !initialized) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" aria-hidden="true" />
        <span className="sr-only">Loading quiz...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Quiz header */}
      <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">
        {lessonTitle || 'Quiz'}
      </h3>

      {/* Meta info row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {passingScore != null && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Info className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Passing score: {passingScore}%</span>
          </div>
        )}
        {totalPoints > 0 && (
          <div className="text-sm text-muted-foreground">Total points: {totalPoints}</div>
        )}
        {allowRetakes && maxAttempts != null && (
          <div className="text-sm text-muted-foreground">Max attempts: {maxAttempts}</div>
        )}
        {allowRetakes && maxAttempts == null && (
          <div className="text-sm text-muted-foreground">Retakes allowed</div>
        )}
        {attemptCount > 0 && (
          <div className="text-sm text-muted-foreground">
            Attempt {attemptCount}{maxAttempts != null ? ` of ${maxAttempts}` : ''}
          </div>
        )}
      </div>

      {/* No API context warning (preview mode) */}
      {!canCallApi && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-blue-800">
            Quiz submission is not available in preview mode. Enroll in the program to take this quiz.
          </p>
        </div>
      )}

      {/* Results view */}
      {view === 'results' && displayedAttempt && (
        <QuizResults
          attempt={displayedAttempt}
          content={content}
          onRetake={handleRetake}
          canRetake={canRetake}
        />
      )}

      {/* Form view */}
      {view === 'form' && (
        <>
          {/* Submit error */}
          {submitQuizMutation.isError && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-800">
                {(submitQuizMutation.error as Error)?.message ?? 'Failed to submit quiz. Please try again.'}
              </p>
            </div>
          )}

          {/* Questions list */}
          <div className="space-y-4 sm:space-y-6" role="list" aria-label="Quiz questions">
            {questions.map((q, idx) => {
              const questionFieldId = `${baseId}-q-${q.id}`;

              return (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 bg-card border border-border rounded-xl hover:border-accent/30 transition-colors"
                  role="listitem"
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <p className="text-sm sm:text-base font-medium text-sidebar-foreground">
                      {idx + 1}. {q.question}
                    </p>
                    {q.points != null && q.points > 0 && (
                      <span className="flex-shrink-0 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {q.points} {q.points === 1 ? 'pt' : 'pts'}
                      </span>
                    )}
                  </div>

                  {/* Multiple choice options */}
                  {q.type === 'multiple_choice' && q.options && (
                    <fieldset aria-label={`Options for question ${idx + 1}`}>
                      <legend className="sr-only">Select an answer for: {q.question}</legend>
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => {
                          const optionId = `${questionFieldId}-opt-${optIdx}`;
                          const isSelected = answers[q.id] === optIdx;

                          return (
                            <label
                              key={optIdx}
                              htmlFor={optionId}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                                isSelected
                                  ? 'border-accent bg-accent/5'
                                  : 'border-border bg-muted/30 hover:border-accent/30'
                              }`}
                            >
                              <input
                                id={optionId}
                                type="radio"
                                name={`${baseId}-q-${q.id}`}
                                value={optIdx}
                                checked={isSelected}
                                onChange={() => handleAnswer(q.id, optIdx)}
                                className="w-4 h-4 text-accent border-border focus:ring-2 focus:ring-accent focus:ring-offset-0"
                              />
                              <span className="text-sidebar-foreground">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {/* True / False options */}
                  {q.type === 'true_false' && (
                    <fieldset aria-label={`Options for question ${idx + 1}`}>
                      <legend className="sr-only">Select True or False for: {q.question}</legend>
                      <div className="space-y-2">
                        {['True', 'False'].map((option) => {
                          const optionId = `${questionFieldId}-${option.toLowerCase()}`;
                          const isSelected = answers[q.id] === option;

                          return (
                            <label
                              key={option}
                              htmlFor={optionId}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                                isSelected
                                  ? 'border-accent bg-accent/5'
                                  : 'border-border bg-muted/30 hover:border-accent/30'
                              }`}
                            >
                              <input
                                id={optionId}
                                type="radio"
                                name={`${baseId}-q-${q.id}`}
                                value={option}
                                checked={isSelected}
                                onChange={() => handleAnswer(q.id, option)}
                                className="w-4 h-4 text-accent border-border focus:ring-2 focus:ring-accent focus:ring-offset-0"
                              />
                              <span className="text-sidebar-foreground">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {/* Short answer input */}
                  {q.type === 'short_answer' && (
                    <div>
                      <label htmlFor={questionFieldId} className="sr-only">
                        Your answer for question {idx + 1}
                      </label>
                      <input
                        id={questionFieldId}
                        type="text"
                        value={(answers[q.id] as string) ?? ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full p-3 bg-muted/30 border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
                        aria-label={`Answer for question ${idx + 1}`}
                      />
                      {q.gradingMode === 'manual' && (
                        <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          This question requires facilitator review
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitQuizMutation.isPending || !canCallApi}
              className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label={allAnswered ? 'Submit quiz' : 'Answer all questions to submit'}
            >
              {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default QuizContent;
