"use client";

import { forwardRef } from "react";

export interface CircularProgressProps {
  /** Current value */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Size in pixels (default: 100) */
  size?: number;
  /** Stroke width in pixels (default: 8) */
  strokeWidth?: number;
  /** Color variant */
  variant?: "default" | "success" | "warning" | "danger" | "auto";
  /** Whether to show the value label */
  showLabel?: boolean;
  /** Custom label (overrides value display) */
  label?: React.ReactNode;
  /** Additional class name for the container */
  className?: string;
  /** Accessible label for screen readers */
  "aria-label"?: string;
}

const variantColors = {
  default: "stroke-accent",
  success: "stroke-green-500",
  warning: "stroke-yellow-500",
  danger: "stroke-red-500",
} as const;

function getAutoVariant(value: number, max: number): keyof typeof variantColors {
  const percent = (value / max) * 100;
  if (percent >= 85) return "success";
  if (percent >= 70) return "warning";
  return "danger";
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      value,
      max = 100,
      size = 100,
      strokeWidth = 8,
      variant = "default",
      showLabel = true,
      label,
      className = "",
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const colorVariant = variant === "auto" ? getAutoVariant(value, max) : variant;
    const strokeColor = variantColors[colorVariant];

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel || `Progress: ${Math.round(percentage)}%`}
      >
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            className="stroke-muted"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={`${strokeColor} transition-[stroke-dashoffset] duration-500 ease-out`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {label ?? (
              <span className="text-lg font-semibold text-sidebar-foreground">
                {Math.round(value)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";
