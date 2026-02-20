import type { ReactNode } from 'react';

/**
 * Minimal public layout for the assessment subject portal.
 * No sidebar, header, or auth required.
 */
export default function AssessmentSetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Slim branding header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-xs">T</span>
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">Transformation OS</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
