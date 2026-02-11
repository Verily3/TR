'use client';

import { memo, useState, useCallback, useId } from 'react';
import type { LessonContent } from '@/types/programs';
import { ClipboardCheck, Info } from 'lucide-react';

interface QuizContentProps {
  content: LessonContent;
  lessonTitle?: string;
  onSubmit?: (answers: Record<string, string | number>) => void;
}

/**
 * Quiz lesson content component.
 * Renders multiple-choice, true/false, and short-answer questions
 * with local answer tracking and a submit button.
 */
export const QuizContent = memo(function QuizContent({
  content,
  lessonTitle,
  onSubmit,
}: QuizContentProps) {
  const questions = content.quizQuestions;
  const passingScore = content.passingScore;
  const allowRetakes = content.allowRetakes;
  const maxAttempts = content.maxAttempts;

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const baseId = useId();

  const handleAnswer = useCallback(
    (questionId: string, value: string | number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit(answers);
    }
  }, [onSubmit, answers]);

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

  // Empty state when no quiz questions are provided
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <ClipboardCheck className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-sidebar-foreground mb-2">
          No Quiz Questions
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This quiz has not been configured with any questions yet. Please check back later.
        </p>
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
          <div className="text-sm text-muted-foreground">
            Total points: {totalPoints}
          </div>
        )}
        {allowRetakes && maxAttempts != null && (
          <div className="text-sm text-muted-foreground">
            Max attempts: {maxAttempts}
          </div>
        )}
        {allowRetakes && maxAttempts == null && (
          <div className="text-sm text-muted-foreground">
            Retakes allowed
          </div>
        )}
      </div>

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
                  <legend className="sr-only">
                    Select an answer for: {q.question}
                  </legend>
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
                  <legend className="sr-only">
                    Select True or False for: {q.question}
                  </legend>
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
          disabled={!allAnswered}
          className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          aria-label={allAnswered ? 'Submit quiz' : 'Answer all questions to submit'}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
});

export default QuizContent;
