"use client";

import { forwardRef } from "react";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Section title */
  title: string;
  /** Section subtitle/description */
  subtitle?: string;
  /** Icon to display next to title */
  icon?: React.ReactNode;
  /** Action element (e.g., button, link) displayed on the right */
  action?: React.ReactNode;
  /** Additional header content (e.g., legend, filters) */
  headerExtra?: React.ReactNode;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      title,
      subtitle,
      icon,
      action,
      headerExtra,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <section ref={ref} className={`mb-8 ${className}`} {...props}>
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon && (
                <span className="text-accent" aria-hidden="true">
                  {icon}
                </span>
              )}
              <div>
                <h2 className="text-sidebar-foreground font-semibold">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {action && <div>{action}</div>}
          </div>
          {headerExtra && <div className="mt-3">{headerExtra}</div>}
        </header>
        {children}
      </section>
    );
  }
);

Section.displayName = "Section";
