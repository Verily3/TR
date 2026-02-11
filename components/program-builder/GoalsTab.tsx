"use client";

import { Target, Plus } from "lucide-react";

export function GoalsTab() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-sidebar-foreground mb-2">
              Program Goals
            </h2>
            <p className="text-muted-foreground">
              Link organizational goals to this program and track alignment
            </p>
          </div>
          <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Link Goal
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-card border border-border rounded-lg p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-medium text-sidebar-foreground mb-2">
              No Goals Linked
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Link organizational goals to this program to track how learning
              initiatives contribute to business objectives.
            </p>
            <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
              Link Your First Goal
            </button>
          </div>
        </div>

        {/* Goal Categories Info */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-sidebar-foreground mb-1">
              Strategic Goals
            </div>
            <div className="text-xs text-muted-foreground">
              Company-wide objectives this program supports
            </div>
            <div className="mt-3 text-2xl font-medium text-sidebar-foreground">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-sidebar-foreground mb-1">
              Team Goals
            </div>
            <div className="text-xs text-muted-foreground">
              Department or team-level objectives
            </div>
            <div className="mt-3 text-2xl font-medium text-sidebar-foreground">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-sidebar-foreground mb-1">
              Individual Goals
            </div>
            <div className="text-xs text-muted-foreground">
              Personal development goals from participants
            </div>
            <div className="mt-3 text-2xl font-medium text-sidebar-foreground">0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
