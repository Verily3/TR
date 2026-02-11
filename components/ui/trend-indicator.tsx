"use client";

import { forwardRef } from "react";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";

export type TrendDirection = "up" | "down" | "neutral";

export interface TrendIndicatorProps {
  /** Trend direction */
  direction: TrendDirection;
  /** Value to display (e.g., "+5%", "-2") */
  value?: string;
  /** Visual style variant */
  variant?: "default" | "pill" | "minimal";
  /** Icon style */
  iconStyle?: "trending" | "arrow";
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

const iconMap = {
  trending: {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  },
  arrow: {
    up: ArrowUpRight,
    down: ArrowDownRight,
    neutral: Minus,
  },
} as const;

const colorMap = {
  up: {
    text: "text-green-600",
    bg: "bg-green-100",
  },
  down: {
    text: "text-red-600",
    bg: "bg-red-100",
  },
  neutral: {
    text: "text-muted-foreground",
    bg: "bg-muted",
  },
} as const;

const sizeClasses = {
  sm: {
    icon: "w-3 h-3",
    text: "text-xs",
    padding: "px-1.5 py-0.5",
  },
  md: {
    icon: "w-4 h-4",
    text: "text-sm",
    padding: "px-2 py-1",
  },
} as const;

export const TrendIndicator = forwardRef<HTMLDivElement, TrendIndicatorProps>(
  (
    {
      direction,
      value,
      variant = "default",
      iconStyle = "trending",
      size = "sm",
      className = "",
    },
    ref
  ) => {
    const Icon = iconMap[iconStyle][direction];
    const colors = colorMap[direction];
    const sizes = sizeClasses[size];

    if (variant === "minimal") {
      return (
        <div ref={ref} className={`flex items-center gap-1 ${colors.text} ${className}`}>
          <Icon className={sizes.icon} aria-hidden="true" />
          {value && <span className={sizes.text}>{value}</span>}
        </div>
      );
    }

    if (variant === "pill") {
      return (
        <div
          ref={ref}
          className={`inline-flex items-center gap-1 ${sizes.padding} rounded-full ${colors.bg} ${colors.text} ${sizes.text} font-medium ${className}`}
        >
          <Icon className={sizes.icon} aria-hidden="true" />
          {value && <span>{value}</span>}
        </div>
      );
    }

    // Default variant
    return (
      <div ref={ref} className={`flex items-center gap-1 ${colors.text} ${className}`}>
        <Icon className={sizes.icon} aria-hidden="true" />
        {value && <span className={`${sizes.text} font-medium`}>{value}</span>}
      </div>
    );
  }
);

TrendIndicator.displayName = "TrendIndicator";
