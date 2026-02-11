'use client';

import { memo, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CompletionModalProps {
  points: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal for confirming lesson completion.
 * Includes proper focus management and keyboard navigation.
 */
export const CompletionModal = memo(function CompletionModal({
  points,
  onCancel,
  onConfirm,
}: CompletionModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    // Focus the confirm button when modal opens
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      // Trap focus within modal
      if (e.key === 'Tab') {
        const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-modal-title"
      aria-describedby="completion-modal-description"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-scale-in"
        role="document"
      >
        <div className="p-6 sm:p-8">
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-7 h-7 text-accent" />
          </div>
          <h3
            id="completion-modal-title"
            className="text-center text-lg font-semibold text-sidebar-foreground mb-2"
          >
            Mark as Complete?
          </h3>
          <p
            id="completion-modal-description"
            className="text-center text-sm text-muted-foreground mb-6"
          >
            You'll earn <span className="text-accent font-semibold">{points} points</span> and move to the next lesson.
          </p>
          <div className="flex gap-3">
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-sidebar-foreground transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label="Cancel and stay on current lesson"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label={`Mark lesson complete and earn ${points} points`}
            >
              Mark Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CompletionModal;
