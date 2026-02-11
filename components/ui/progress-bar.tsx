"use client";

import { forwardRef } from "react";

export interface ProgressBarProps {
  /** Current value */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Height variant */
  size?: "sm" | "md" | "lg";
  /** Color variant */
  variant?: "default" | "success" | "warning" | "danger" | "auto";
  /** Whether to show percentage label */
  showLabel?: boolean;
  /** Additional class name */
  className?: string;
  /** Accessible label for screen readers */
  "aria-label"?: string;
}

const sizeClasses = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2",
} as const;

const variantClasses = {
  default: "bg-accent",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
} as const;

function getAutoVariant(value: number, max: number): keyof typeof variantClasses {
  const percent = (value / max) * 100;
  if (percent >= 80) return "success";
  if (percent >= 50) return "warning";
  return "danger";
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      size = "md",
      variant = "default",
      showLabel = false,
      className = "",
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const colorVariant = variant === "auto" ? getAutoVariant(value, max) : variant;

    return (
      <div ref={ref} className={`flex items-center gap-2 ${className}`}>
        <div
          className={`flex-1 ${sizeClasses[size]} bg-muted rounded-full overflow-hidden`}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={ariaLabel || `Progress: ${Math.round(percentage)}%`}
        >
          <div
            className={`h-full ${variantClasses[colorVariant]} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
