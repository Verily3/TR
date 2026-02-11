'use client';

import { memo } from 'react';

/**
 * Loading skeleton for program cards.
 * Provides visual feedback while program data is being fetched.
 */
export const ProgramCardSkeleton = memo(function ProgramCardSkeleton() {
  return (
    <div
      className="bg-card border border-border rounded-xl p-5 sm:p-6 animate-pulse"
      role="status"
      aria-label="Loading program"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted" aria-hidden="true" />
        <div className="flex-1">
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
        <div className="h-6 bg-muted rounded-full w-24" />
      </div>
      <div className="h-2 bg-muted rounded-full mb-4" />
      <div className="h-16 bg-muted rounded-lg mb-4" />
      <div className="h-10 bg-muted rounded-lg" />
      <span className="sr-only">Loading program information...</span>
    </div>
  );
});

export default ProgramCardSkeleton;
