"use client";

import { forwardRef } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: "default" | "elevated" | "outlined" | "ghost";
  /** Whether the card is interactive (clickable) */
  interactive?: boolean;
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses = {
  default: "bg-card border border-border",
  elevated: "bg-card border border-border shadow-md",
  outlined: "bg-transparent border border-border",
  ghost: "bg-transparent",
} as const;

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      interactive = false,
      padding = "md",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const interactiveClasses = interactive
      ? "cursor-pointer hover:border-accent/30 hover:shadow-md transition-all duration-200"
      : "";

    return (
      <div
        ref={ref}
        className={`rounded-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Action element (e.g., button) */
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, icon, action, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-start justify-between mb-4 ${className}`}
        {...props}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-accent/10 text-accent flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-sidebar-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";
