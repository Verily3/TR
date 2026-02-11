"use client";

import { CheckCircle2, Clock, Lock } from "lucide-react";
import { Card, ProgressBar } from "../ui";
import type { ModuleStatus } from "./types";

export interface ModuleProgressTrackerProps {
  /** Modules to display */
  modules: {
    id: string;
    number: number;
    title: string;
    status: ModuleStatus;
    progress: number;
  }[];
  /** Current module index (0-based) */
  currentModuleIndex: number;
  /** Callback when continue button is clicked */
  onContinue?: (moduleId: string) => void;
}

export function ModuleProgressTracker({
  modules,
  currentModuleIndex,
  onContinue,
}: ModuleProgressTrackerProps) {
  const completedCount = modules.filter((m) => m.status === "completed").length;
  const overallProgress = Math.round((completedCount / modules.length) * 100);
  const currentModule = modules[currentModuleIndex];

  return (
    <Card padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sidebar-foreground mb-1">Module Progress</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {modules.length} modules completed
          </p>
        </div>
        {currentModule && (
          <button
            onClick={() => onContinue?.(currentModule.id)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Continue Learning
          </button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="text-sidebar-foreground tabular-nums">{overallProgress}%</span>
        </div>
        <ProgressBar
          value={overallProgress}
          max={100}
          size="md"
          variant="default"
          aria-label={`Overall program progress: ${overallProgress}%`}
        />
      </div>

      {/* Module Tracker */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2"
        role="list"
        aria-label="Module progress"
      >
        {modules.map((module, index) => {
          const isCompleted = module.status === "completed";
          const isCurrent = module.status === "in-progress";
          const isLocked = module.status === "locked";

          return (
            <div
              key={module.id}
              className="flex flex-col items-center min-w-[100px]"
              role="listitem"
            >
              {/* Module Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isCompleted
                    ? "bg-accent"
                    : isCurrent
                    ? "bg-accent/20 border-2 border-accent"
                    : "bg-muted border-2 border-border"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <CheckCircle2
                    className="w-5 h-5 text-accent-foreground"
                    aria-hidden="true"
                  />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5 text-accent" aria-hidden="true" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>

              {/* Module Info */}
              <div className="text-center">
                <div
                  className={`text-xs mb-0.5 ${
                    isCurrent
                      ? "text-accent font-medium"
                      : isCompleted
                      ? "text-sidebar-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Module {module.number}
                </div>
                <div
                  className={`text-xs truncate max-w-[90px] ${
                    isLocked ? "text-muted-foreground" : "text-sidebar-foreground"
                  }`}
                  title={module.title}
                >
                  {module.title}
                </div>
              </div>

              {/* Connector Line */}
              {index < modules.length - 1 && (
                <div
                  className={`absolute h-0.5 w-6 top-5 ${
                    isCompleted ? "bg-accent" : "bg-border"
                  }`}
                  style={{ left: "calc(100% - 8px)" }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
