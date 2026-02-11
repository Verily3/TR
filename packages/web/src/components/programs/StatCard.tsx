'use client';

import { memo } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  borderColor?: string;
  valueColor?: string;
  icon?: React.ReactNode;
  subtext?: string;
  /** Animation delay index (0, 1, 2, etc.) - each unit = 50ms delay */
  animationIndex?: number;
}

/**
 * Reusable stat card with CSS-based staggered animation.
 * Uses CSS animation-delay instead of useState/setTimeout for better performance.
 */
export const StatCard = memo(function StatCard({
  label,
  value,
  borderColor = 'border-border',
  valueColor = 'text-sidebar-foreground',
  icon,
  subtext,
  animationIndex = 0,
}: StatCardProps) {
  return (
    <div
      className={`bg-card border ${borderColor} rounded-xl p-4 sm:p-5 transition-shadow duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up`}
      style={{ animationDelay: `${animationIndex * 50}ms` }}
      role="figure"
      aria-label={`${label}: ${value}${subtext ? `, ${subtext}` : ''}`}
    >
      {icon && (
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
      )}
      {!icon && (
        <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</div>
      )}
      <div className={`text-2xl font-semibold ${valueColor} tabular-nums`}>{value}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
    </div>
  );
});

export default StatCard;
