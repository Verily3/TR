'use client';

import { memo, useState, useCallback, useId } from 'react';
import type { LessonContent } from '@/types/programs';
import { isHtmlContent } from '@/lib/html-utils';

interface GoalFormData {
  statement: string;
  successMetric: string;
  actionSteps: string;
  targetDate: string;
  reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
}

interface GoalContentProps {
  content?: LessonContent;
  lessonTitle?: string;
  onSubmit?: (data: GoalFormData) => void;
}

const DEFAULT_INSTRUCTIONS =
  "Based on what you've learned in this module, set a specific, measurable goal that you'll work toward over the next 30 days. This goal should directly relate to the module's content.";

/**
 * Goal setting lesson content component.
 * Displays form for creating SMART goals with action steps.
 */
export const GoalContent = memo(function GoalContent({
  content,
  lessonTitle,
  onSubmit,
}: GoalContentProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    statement: '',
    successMetric: '',
    actionSteps: '',
    targetDate: '',
    reviewFrequency: 'weekly',
  });

  const baseId = useId();

  const requireMetrics = content?.requireMetrics ?? false;
  const requireActionSteps = content?.requireActionSteps ?? false;
  const metricsGuidance = content?.metricsGuidance;
  const actionStepsGuidance = content?.actionStepsGuidance;

  const handleChange = useCallback((field: keyof GoalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!onSubmit || !formData.statement.trim()) return;
    if (requireMetrics && !formData.successMetric.trim()) return;
    if (requireActionSteps && !formData.actionSteps.trim()) return;
    onSubmit(formData);
  }, [onSubmit, formData, requireMetrics, requireActionSteps]);

  const isValid =
    formData.statement.trim().length > 0 &&
    (!requireMetrics || formData.successMetric.trim().length > 0) &&
    (!requireActionSteps || formData.actionSteps.trim().length > 0);

  return (
    <div>
      <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">
        {lessonTitle || 'Set Your Goal for This Period'}
      </h3>
      {content?.introduction &&
        (isHtmlContent(content.introduction) ? (
          <div
            className="text-muted-foreground mb-4 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content.introduction }}
          />
        ) : (
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">{content.introduction}</p>
        ))}
      {(() => {
        const promptText = content?.goalPrompt || DEFAULT_INSTRUCTIONS;
        return isHtmlContent(promptText) ? (
          <div
            className="text-muted-foreground mb-6 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: promptText }}
          />
        ) : (
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">{promptText}</p>
        );
      })()}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        aria-label="Goal setting form"
      >
        <div>
          <label
            htmlFor={`${baseId}-statement`}
            className="block text-sm font-medium text-sidebar-foreground mb-2"
          >
            Goal Statement <span className="text-accent">*</span>
          </label>
          <input
            id={`${baseId}-statement`}
            type="text"
            value={formData.statement}
            onChange={(e) => handleChange('statement', e.target.value)}
            placeholder="e.g., Improve self-awareness by journaling daily reflections"
            className="w-full p-3 bg-card border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label
            htmlFor={`${baseId}-metric`}
            className="block text-sm font-medium text-sidebar-foreground mb-1"
          >
            Success Metric{requireMetrics && <span className="text-accent"> *</span>}
          </label>
          {metricsGuidance && (
            <p className="text-xs text-muted-foreground mb-2">{metricsGuidance}</p>
          )}
          <input
            id={`${baseId}-metric`}
            type="text"
            value={formData.successMetric}
            onChange={(e) => handleChange('successMetric', e.target.value)}
            placeholder="How will you measure success?"
            className="w-full p-3 bg-card border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
            required={requireMetrics}
            aria-required={requireMetrics}
          />
        </div>

        <div>
          <label
            htmlFor={`${baseId}-actions`}
            className="block text-sm font-medium text-sidebar-foreground mb-1"
          >
            Action Steps{requireActionSteps && <span className="text-accent"> *</span>}
          </label>
          {actionStepsGuidance && (
            <p className="text-xs text-muted-foreground mb-2">{actionStepsGuidance}</p>
          )}
          <textarea
            id={`${baseId}-actions`}
            value={formData.actionSteps}
            onChange={(e) => handleChange('actionSteps', e.target.value)}
            placeholder="List specific actions you'll take to achieve this goal..."
            className="w-full h-28 sm:h-32 p-3 sm:p-4 bg-card border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-shadow text-sm"
            required={requireActionSteps}
            aria-required={requireActionSteps}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={`${baseId}-date`}
              className="block text-sm font-medium text-sidebar-foreground mb-2"
            >
              Target Date
            </label>
            <input
              id={`${baseId}-date`}
              type="date"
              value={formData.targetDate}
              onChange={(e) => handleChange('targetDate', e.target.value)}
              className="w-full p-3 bg-card border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
            />
          </div>
          <div>
            <label
              htmlFor={`${baseId}-frequency`}
              className="block text-sm font-medium text-sidebar-foreground mb-2"
            >
              Review Frequency
            </label>
            <select
              id={`${baseId}-frequency`}
              value={formData.reviewFrequency}
              onChange={(e) =>
                handleChange('reviewFrequency', e.target.value as GoalFormData['reviewFrequency'])
              }
              className="w-full p-3 bg-card border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!isValid}
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Save Goal
          </button>
        </div>
      </form>
    </div>
  );
});

export default GoalContent;
