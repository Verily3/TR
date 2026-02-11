"use client";

import { CheckCircle2, User, ClipboardCheck, Target, BookOpen, Users, Rocket } from "lucide-react";

interface OnboardingStep {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "completed" | "current" | "upcoming";
}

const defaultSteps: OnboardingStep[] = [
  { id: 1, label: "Profile Setup", icon: User, status: "completed" },
  { id: 2, label: "Assessment", icon: ClipboardCheck, status: "completed" },
  { id: 3, label: "Goal Setting", icon: Target, status: "current" },
  { id: 4, label: "Program Selection", icon: BookOpen, status: "upcoming" },
  { id: 5, label: "Team Connection", icon: Users, status: "upcoming" },
  { id: 6, label: "Ready to Launch", icon: Rocket, status: "upcoming" },
];

interface OnboardingTrackerProps {
  steps?: OnboardingStep[];
  onContinue?: () => void;
}

export function OnboardingTracker({ steps = defaultSteps, onContinue }: OnboardingTrackerProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const currentStep = steps.find((s) => s.status === "current");
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sidebar-foreground mb-1">Welcome to Results Tracking System</h3>
            <p className="text-sm text-muted-foreground">
              Complete your onboarding to unlock the full platform
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl text-sidebar-foreground">
              {completedCount}/{steps.length}
            </div>
            <div className="text-xs text-muted-foreground">Steps Complete</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Background Line */}
        <div
          className="absolute top-[26px] left-0 right-0 h-0.5 bg-blue-200"
          style={{ marginLeft: "32px", marginRight: "32px" }}
        />

        {/* Active Progress Line */}
        <div
          className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500"
          style={{
            marginLeft: "32px",
            width: `calc(${progressPercent}% - 32px)`,
          }}
        />

        {/* Steps Container */}
        <div className="relative flex items-start justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex flex-col items-center"
                style={{ width: "110px" }}
              >
                {/* Icon Circle */}
                <div
                  className={`relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all ${
                    step.status === "completed"
                      ? "bg-accent border-2 border-accent"
                      : step.status === "current"
                      ? "bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20 animate-pulse"
                      : "bg-white border-2 border-blue-200"
                  }`}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                  ) : (
                    <Icon
                      className={`w-6 h-6 ${
                        step.status === "current"
                          ? "text-accent-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <div
                    className={`text-xs mb-1 ${
                      step.status === "current"
                        ? "text-sidebar-foreground font-medium"
                        : step.status === "completed"
                        ? "text-sidebar-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground">Step {step.id}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Footer */}
      {currentStep && (
        <div className="mt-6 pt-6 border-t border-blue-200 flex items-center justify-between">
          <div>
            <div className="text-sm text-sidebar-foreground mb-1">
              Next: {currentStep.label}
            </div>
            <div className="text-xs text-muted-foreground">
              Set your quarterly goals to align your learning with results
            </div>
          </div>
          <button
            onClick={onContinue}
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors shadow-sm"
          >
            Continue Setup
          </button>
        </div>
      )}
    </div>
  );
}
