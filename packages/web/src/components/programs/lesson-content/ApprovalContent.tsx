'use client';

import { memo, useState, useCallback, useId } from 'react';
import { CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import type { ApprovalSubmission } from '@/types/programs';

interface ApprovalContentProps {
  lessonTitle: string;
  contentType: 'mentor_approval' | 'facilitator_approval';
  instructions?: string;
  submission?: ApprovalSubmission | null;
  onSubmit: (text: string) => void;
  isSubmitting?: boolean;
}

/**
 * Approval lesson content component.
 * Handles both mentor_approval (textarea + submit) and facilitator_approval (mark as done).
 * Shows four states: not submitted, pending, approved, rejected.
 */
export const ApprovalContent = memo(function ApprovalContent({
  lessonTitle,
  contentType,
  instructions,
  submission,
  onSubmit,
  isSubmitting = false,
}: ApprovalContentProps) {
  const [text, setText] = useState('');
  const [showResubmit, setShowResubmit] = useState(false);
  const textareaId = useId();

  const isMentorApproval = contentType === 'mentor_approval';
  const status = submission?.status;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isMentorApproval && text.length === 0) return;
    onSubmit(isMentorApproval ? text : 'Marked as complete');
  }, [isMentorApproval, text, onSubmit]);

  const handleResubmit = useCallback(() => {
    setShowResubmit(true);
  }, []);

  // Rejected + resubmit mode: show the form again
  if (status === 'rejected' && showResubmit) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">{lessonTitle}</h3>
        {instructions && (
          <div className="text-muted-foreground mb-6 text-sm sm:text-base prose-a" dangerouslySetInnerHTML={{ __html: instructions }} />
        )}

        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl mb-6">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">Previous submission was rejected</p>
          {submission?.feedback && (
            <p className="text-sm text-red-600 dark:text-red-400/80">Feedback: {submission.feedback}</p>
          )}
        </div>

        {isMentorApproval ? (
          <>
            <label htmlFor={textareaId} className="sr-only">Your resubmission</label>
            <textarea
              id={textareaId}
              value={text}
              onChange={handleChange}
              placeholder="Enter your updated response..."
              className="w-full h-48 sm:h-64 p-4 bg-card border border-border rounded-xl text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-shadow text-sm sm:text-base"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                disabled={text.length === 0 || isSubmitting}
                className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Resubmitting...' : 'Resubmit for Review'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {isSubmitting ? 'Resubmitting...' : 'Resubmit'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Approved state
  if (status === 'approved') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">{lessonTitle}</h3>
        <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-400 font-semibold text-lg">Approved</span>
          </div>
          {submission?.feedback && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-900/30">
              <p className="text-sm text-muted-foreground mb-1">Reviewer Feedback</p>
              <p className="text-sm text-sidebar-foreground">{submission.feedback}</p>
            </div>
          )}
          {submission?.reviewedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Approved on {new Date(submission.reviewedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Pending state
  if (status === 'pending') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">{lessonTitle}</h3>
        <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-400 font-semibold text-lg">Submitted &mdash; Awaiting Review</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your submission has been sent for {isMentorApproval ? 'mentor' : 'facilitator'} review. You'll be notified when it's been reviewed.
          </p>
          {submission?.submittedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Rejected state (no resubmit clicked yet)
  if (status === 'rejected') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">{lessonTitle}</h3>
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-400 font-semibold text-lg">Changes Requested</span>
          </div>
          {submission?.feedback && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900/30">
              <p className="text-sm text-muted-foreground mb-1">Reviewer Feedback</p>
              <p className="text-sm text-sidebar-foreground">{submission.feedback}</p>
            </div>
          )}
          <button
            onClick={handleResubmit}
            className="mt-4 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Resubmit
          </button>
        </div>
      </div>
    );
  }

  // Not submitted state
  return (
    <div>
      <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">{lessonTitle}</h3>
      {instructions && (
        <div className="text-muted-foreground mb-6 text-sm sm:text-base prose-a" dangerouslySetInnerHTML={{ __html: instructions }} />
      )}

      {isMentorApproval ? (
        <>
          <label htmlFor={textareaId} className="sr-only">Your submission</label>
          <textarea
            id={textareaId}
            value={text}
            onChange={handleChange}
            placeholder="Describe what you've completed or enter your response..."
            className="w-full h-48 sm:h-64 p-4 bg-card border border-border rounded-xl text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-shadow text-sm sm:text-base"
          />
          <div className="flex items-center justify-between mt-4">
            <span className={`text-sm ${text.length > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
              {text.length} characters
            </span>
            <button
              onClick={handleSubmit}
              disabled={text.length === 0 || isSubmitting}
              className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </>
      ) : (
        <div className="p-6 bg-muted/50 border border-border rounded-xl">
          <p className="text-muted-foreground mb-4 text-sm">
            Mark this activity as complete to submit it for facilitator review.
          </p>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {isSubmitting ? 'Submitting...' : 'Mark as Done'}
          </button>
        </div>
      )}
    </div>
  );
});

export default ApprovalContent;
