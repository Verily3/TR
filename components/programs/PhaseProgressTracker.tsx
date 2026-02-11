"use client";

import { CheckCircle2, Clock, Circle } from "lucide-react";
import type { PhaseStatus } from "./types";

export interface PhaseProgressTrackerProps {
  /** Phases to display */
  phases: { name: string; status: PhaseStatus }[];
  /** Current phase index (0-based) */
  currentPhaseIndex: number;
}

export function PhaseProgressTracker({
  phases,
  currentPhaseIndex,
}: PhaseProgressTrackerProps) {
  const progressWidth =
    phases.length > 1
      ? `calc(${(currentPhaseIndex / (phases.length - 1)) * 100}% - 18px)`
      : "0%";

  return (
    <div
      className="mb-6 p-5 bg-muted/30 rounded-lg"
      role="navigation"
      aria-label="Program phases"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1 uppercase">Program Phases</div>
        <div className="text-sm text-sidebar-foreground">
          Phase {currentPhaseIndex + 1} of {phases.length}
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="relative">
        {/* Background Line */}
        <div
          className="absolute top-[18px] left-0 right-0 h-0.5 bg-border"
          style={{ marginLeft: "18px", marginRight: "18px" }}
          aria-hidden="true"
        />

        {/* Active Progress Line */}
        <div
          className="absolute top-[18px] left-0 h-0.5 bg-accent transition-all duration-500"
          style={{ marginLeft: "18px", width: progressWidth }}
          aria-hidden="true"
        />

        {/* Phases */}
        <div className="relative flex items-start justify-between">
          {phases.map((phase) => {
            const isCompleted = phase.status === "completed";
            const isCurrent = phase.status === "current";

            return (
              <div
                key={phase.name}
                className="flex flex-col items-center"
                style={{ flex: 1 }}
              >
                {/* Icon Circle */}
                <div
                  className={`relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center mb-2 transition-all ${
                    isCompleted
                      ? "bg-accent border-2 border-accent"
                      : isCurrent
                      ? "bg-accent border-[3px] border-accent/20 shadow-md shadow-accent/20"
                      : "bg-card border-2 border-border"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      className="w-4 h-4 text-accent-foreground"
                      aria-hidden="true"
                    />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-accent-foreground" aria-hidden="true" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center px-1">
                  <div
                    className={`text-xs ${
                      isCurrent
                        ? "text-sidebar-foreground font-medium"
                        : isCompleted
                        ? "text-sidebar-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {phase.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
