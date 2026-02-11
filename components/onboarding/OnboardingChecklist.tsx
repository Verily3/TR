"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  X,
  Sparkles,
  User,
  Target,
  Users,
  BookOpen,
  Compass,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card } from "../ui";
import type { OnboardingChecklistProps } from "./types";
import { defaultOnboardingSteps, stepIconConfig } from "./data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  User,
  Target,
  Users,
  BookOpen,
  Compass,
  CheckCircle,
};

export function OnboardingChecklist({
  steps = defaultOnboardingSteps,
  progress,
  onStepClick,
  onDismiss,
}: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalSteps = steps.length;
  const percentComplete = Math.round((completedCount / totalSteps) * 100);
  const remainingMinutes = steps
    .filter((s) => s.status !== "completed")
    .reduce((acc, s) => acc + s.estimatedMinutes, 0);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Compact version when collapsed
  if (!isExpanded) {
    return (
      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground">
                Complete Your Setup
              </h3>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {totalSteps} steps completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-sm font-medium text-sidebar-foreground">
              {percentComplete}%
            </span>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1 text-muted-foreground hover:text-sidebar-foreground rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium text-sidebar-foreground">
              Complete Your Setup
            </h3>
            <p className="text-sm text-muted-foreground">
              Finish these steps to get the most out of the platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
            title="Minimize"
          >
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-sidebar-foreground">
              {completedCount}/{totalSteps} complete
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
        {remainingMinutes > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            ~{remainingMinutes} min left
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps
          .filter((step) => step.type !== "welcome" && step.type !== "complete")
          .map((step, index) => {
            const config = stepIconConfig[step.type];
            const Icon = iconMap[step.icon] || Sparkles;
            const isCompleted = step.status === "completed";
            const isSkipped = step.status === "skipped";

            return (
              <button
                key={step.id}
                onClick={() => onStepClick?.(step.id)}
                disabled={isCompleted}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCompleted
                    ? "bg-green-50 cursor-default"
                    : "hover:bg-muted cursor-pointer"
                }`}
              >
                {/* Status Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isSkipped
                        ? "bg-gray-200 text-gray-400"
                        : `${config.bg} ${config.text}`
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div
                    className={`text-sm font-medium ${
                      isCompleted
                        ? "text-green-700 line-through"
                        : "text-sidebar-foreground"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isCompleted
                      ? "Completed"
                      : isSkipped
                        ? "Skipped"
                        : `~${step.estimatedMinutes} min`}
                  </div>
                </div>

                {/* Action */}
                {!isCompleted && !isSkipped && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            );
          })}
      </div>

      {/* All Done Message */}
      {percentComplete === 100 && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">
            Awesome! You've completed all setup steps.
          </p>
          <button
            onClick={handleDismiss}
            className="mt-2 text-sm text-green-600 hover:underline"
          >
            Dismiss this checklist
          </button>
        </div>
      )}
    </Card>
  );
}

// Minimal inline version for use in headers or sidebars
export function OnboardingProgress({
  completedSteps = 0,
  totalSteps = 7,
  onClick,
}: {
  completedSteps?: number;
  totalSteps?: number;
  onClick?: () => void;
}) {
  const percent = Math.round((completedSteps / totalSteps) * 100);

  if (percent === 100) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full hover:bg-accent/20 transition-colors"
    >
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-accent">{percent}%</span>
    </button>
  );
}
