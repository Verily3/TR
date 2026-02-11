"use client";

import { forwardRef } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, LucideIcon } from "lucide-react";

export type StatusType = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusBadgeProps {
  /** Status type */
  status: StatusType;
  /** Label text */
  label: string;
  /** Whether to show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { icon: LucideIcon; bg: string; text: string; border: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  danger: {
    icon: AlertCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  neutral: {
    icon: Info,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

const sizeClasses = {
  sm: {
    container: "px-2 py-0.5 text-xs",
    icon: "w-3 h-3",
  },
  md: {
    container: "px-2.5 py-1 text-sm",
    icon: "w-4 h-4",
  },
} as const;

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, label, showIcon = true, size = "sm", className = "" }, ref) => {
    const config = statusConfig[status];
    const sizes = sizeClasses[size];
    const Icon = config.icon;

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizes.container} ${className}`}
      >
        {showIcon && <Icon className={sizes.icon} aria-hidden="true" />}
        <span>{label}</span>
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";
