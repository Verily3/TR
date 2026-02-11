'use client';

import { memo, useState, useCallback, useId } from 'react';
import { isHtmlContent } from '@/lib/html-utils';

interface SubmissionContentProps {
  title?: string;
  introduction?: string;
  description?: string;
  reflectionPrompts?: string[];
  minCharacters?: number;
  maxCharacters?: number;
  onSubmit?: (text: string) => void;
}

/**
 * Submission lesson content component.
 * Displays a text input for learner reflections/responses.
 */
export const SubmissionContent = memo(function SubmissionContent({
  title = 'Most Useful Idea',
  introduction,
  description = "Reflect on this module's content and share the single most useful idea that resonated with you. Be specific about why this concept is valuable for your leadership development.",
  reflectionPrompts = [],
  minCharacters = 50,
  maxCharacters,
  onSubmit,
}: SubmissionContentProps) {
  const [text, setText] = useState('');
  const textareaId = useId();
  const characterCountId = useId();

  const isValid = text.length >= minCharacters && (!maxCharacters || text.length <= maxCharacters);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isValid && onSubmit) {
      onSubmit(text);
    }
  }, [isValid, onSubmit, text]);

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

      {reflectionPrompts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-sidebar-foreground mb-3">Reflection Prompts</h4>
          <ul className="space-y-2 text-muted-foreground list-none p-0">
            {reflectionPrompts.map((prompt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-3 bg-muted/30 rounded-lg border border-border/50">
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      <label htmlFor={textareaId} className="sr-only">
        Your response
      </label>
      <textarea
        id={textareaId}
        value={text}
        onChange={handleChange}
        placeholder="Enter your response here..."
        className="w-full h-48 sm:h-64 p-4 bg-card border border-border rounded-xl text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-shadow text-sm sm:text-base"
        aria-describedby={characterCountId}
        aria-invalid={text.length > 0 && !isValid}
      />

      <div className="flex items-center justify-between mt-4">
        <span
          id={characterCountId}
          className={`text-sm ${isValid ? 'text-accent' : 'text-muted-foreground'}`}
          aria-live="polite"
        >
          {text.length} characters
          {text.length < minCharacters && <span className="text-xs"> (min {minCharacters})</span>}
          {maxCharacters && text.length > maxCharacters && <span className="text-xs text-red-500"> (max {maxCharacters})</span>}
          {maxCharacters && text.length <= maxCharacters && <span className="text-xs"> / {maxCharacters}</span>}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          aria-label={`Submit response (${text.length} of ${minCharacters} minimum characters)`}
        >
          Submit Response
        </button>
      </div>
    </div>
  );
});

export default SubmissionContent;
