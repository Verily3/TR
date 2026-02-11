'use client';

import { memo, useState, useCallback, useId } from 'react';
import { isHtmlContent } from '@/lib/html-utils';

interface AssignmentQuestion {
  question: string;
  hint: string;
}

interface AssignmentContentProps {
  title?: string;
  introduction?: string;
  description?: string;
  questions?: AssignmentQuestion[];
  onSubmit?: (responses: string[]) => void;
}

const defaultQuestions: AssignmentQuestion[] = [
  {
    question: 'Reflect on a recent situation where you struggled with self-leadership. What was the outcome?',
    hint: 'Consider the gap between your intended behavior and actual behavior.',
  },
  {
    question: 'What personal accountability gaps exist in your current role?',
    hint: 'Think about areas where you tend to externalize responsibility.',
  },
  {
    question: "How does your emotional state impact your team's performance?",
    hint: 'Identify specific examples from the past week.',
  },
];

/**
 * Assignment lesson content component.
 * Displays reflection questions with text inputs.
 */
export const AssignmentContent = memo(function AssignmentContent({
  title = 'Food for Thought',
  introduction,
  description = "Reflect on these questions to deepen your understanding of the module concepts. Your responses will help you apply these ideas to your specific leadership context.",
  questions = defaultQuestions,
  onSubmit,
}: AssignmentContentProps) {
  const [responses, setResponses] = useState<string[]>(questions.map(() => ''));
  const baseId = useId();

  const handleChange = useCallback((index: number, value: string) => {
    setResponses(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit(responses);
    }
  }, [onSubmit, responses]);

  const allFilled = responses.every(r => r.trim().length > 0);

  return (
    <div>
      <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">{title}</h3>
      {introduction && (
        isHtmlContent(introduction) ? (
          <div className="text-muted-foreground mb-4 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: introduction }} />
        ) : (
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">{introduction}</p>
        )
      )}
      {isHtmlContent(description) ? (
        <div className="text-muted-foreground mb-6 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }} />
      ) : (
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">{description}</p>
      )}

      <div className="space-y-4 sm:space-y-6" role="list" aria-label="Assignment questions">
        {questions.map((item, idx) => {
          const questionId = `${baseId}-question-${idx}`;
          const hintId = `${baseId}-hint-${idx}`;

          return (
            <div
              key={idx}
              className="p-6 bg-card border border-border rounded-xl hover:border-accent/30 transition-colors"
              role="listitem"
            >
              <label
                htmlFor={questionId}
                className="text-sm sm:text-base font-medium text-sidebar-foreground mb-2 block"
              >
                {idx + 1}. {item.question}
              </label>
              <p id={hintId} className="text-xs sm:text-sm text-muted-foreground mb-4">
                {item.hint}
              </p>
              <textarea
                id={questionId}
                value={responses[idx]}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder="Your reflection..."
                className="w-full h-28 sm:h-32 p-3 sm:p-4 bg-muted/30 border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-shadow text-sm"
                aria-describedby={hintId}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          aria-label={allFilled ? 'Submit assignment' : 'Complete all questions to submit'}
        >
          Submit Assignment
        </button>
      </div>
    </div>
  );
});

export default AssignmentContent;
