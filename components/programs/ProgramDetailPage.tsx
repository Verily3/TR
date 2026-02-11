"use client";

import {
  ChevronLeft,
  BookOpen,
  Award,
  Play,
  Calendar,
  Target,
} from "lucide-react";
import { Card } from "../ui";
import { ModuleProgressTracker } from "./ModuleProgressTracker";
import type { Program, LearningOutcome, ProgramStructureItem } from "./types";
import {
  defaultPrograms,
  defaultLearningOutcomes,
  defaultProgramStructure,
} from "./data";

export interface ProgramDetailPageProps {
  /** Program to display */
  program?: Program;
  /** Learning outcomes */
  learningOutcomes?: LearningOutcome[];
  /** Program structure items */
  programStructure?: ProgramStructureItem[];
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Callback when continue learning is clicked */
  onContinue?: (moduleId: string) => void;
  /** Callback when view goal is clicked */
  onViewGoal?: (goalId: string) => void;
}

const statusConfig = {
  completed: {
    bg: "bg-green-50",
    border: "border-green-200",
    color: "text-green-600",
    label: "COMPLETED",
  },
  "in-progress": {
    bg: "bg-blue-50",
    border: "border-blue-200",
    color: "text-blue-600",
    label: "IN PROGRESS",
  },
  "not-started": {
    bg: "bg-muted",
    border: "border-border",
    color: "text-muted-foreground",
    label: "NOT STARTED",
  },
};

export function ProgramDetailPage({
  program = defaultPrograms[0],
  learningOutcomes = defaultLearningOutcomes,
  programStructure = defaultProgramStructure,
  onBack,
  onContinue,
  onViewGoal,
}: ProgramDetailPageProps) {
  const config = statusConfig[program.status];

  // Calculate stats
  const modulesCompleted = program.phases.reduce(
    (sum, phase) => sum + phase.modulesCompleted,
    0
  );
  const totalModules = program.phases.reduce(
    (sum, phase) => sum + phase.modulesTotal,
    0
  );

  // Find all modules for the tracker
  const allModules = program.phases.flatMap((phase) =>
    phase.modules.map((m) => ({
      id: m.id,
      number: m.number,
      title: m.title,
      status: m.status,
      progress: m.progress,
    }))
  );

  // Find current module index
  const currentModuleIndex = allModules.findIndex((m) => m.status === "in-progress");

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Programs
      </button>

      {/* Program Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {/* Icon Box */}
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent" aria-hidden="true" />
              </div>

              {/* Title & Meta */}
              <div>
                <h1 className="text-2xl font-semibold text-sidebar-foreground mb-1">
                  {program.title}
                </h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{program.track}</span>
                  <span aria-hidden="true">•</span>
                  <span>{program.modulesCount} Modules</span>
                  <span aria-hidden="true">•</span>
                  <span>{program.duration}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground max-w-3xl">
              A comprehensive leadership development program designed to transform
              managers into high-impact leaders. Master essential leadership competencies
              through structured modules, mentor coaching, and practical application.
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`px-4 py-2 ${config.bg} border ${config.border} rounded-lg ${config.color} text-sm`}
          >
            {config.label}
          </div>
        </div>
      </header>

      {/* Program Stats (4-column grid) */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs text-muted-foreground uppercase">Total Points</span>
          </div>
          <div className="text-2xl text-sidebar-foreground tabular-nums">
            {program.earnedPoints.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            of {program.totalPoints.toLocaleString()} available
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs text-muted-foreground uppercase">Progress</span>
          </div>
          <div className="text-2xl text-sidebar-foreground tabular-nums">
            {program.progress}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {modulesCompleted} of {totalModules} modules complete
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs text-muted-foreground uppercase">Time Remaining</span>
          </div>
          <div className="text-2xl text-sidebar-foreground">9 weeks</div>
          <div className="text-xs text-muted-foreground mt-1">Due {program.dueDate}</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs text-muted-foreground uppercase">Linked Goals</span>
          </div>
          <div className="text-2xl text-sidebar-foreground tabular-nums">
            {program.linkedGoals.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Active connections</div>
        </Card>
      </div>

      {/* Module Progress Tracker */}
      {allModules.length > 0 && (
        <div className="mb-8">
          <ModuleProgressTracker
            modules={allModules}
            currentModuleIndex={currentModuleIndex >= 0 ? currentModuleIndex : 0}
            onContinue={onContinue}
          />
        </div>
      )}

      {/* Program Overview (2-column grid) */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* What You'll Learn */}
        <Card padding="lg">
          <h3 className="text-sidebar-foreground mb-4">What You'll Learn</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {learningOutcomes.map((outcome) => (
              <li key={outcome.id} className="flex items-start gap-2">
                <span className="text-accent mt-1" aria-hidden="true">
                  •
                </span>
                <span>{outcome.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Program Structure */}
        <Card padding="lg">
          <h3 className="text-sidebar-foreground mb-4">Program Structure</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-sidebar-foreground mb-2">
                Each module includes:
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {programStructure.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="text-accent mt-1" aria-hidden="true">
                      •
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1 uppercase">
                Estimated Time Commitment
              </div>
              <div className="text-sm text-sidebar-foreground">3-4 hours per module</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Linked Goals Section */}
      {program.linkedGoals.length > 0 && (
        <Card padding="lg">
          <h3 className="text-sidebar-foreground mb-4">Linked Goals</h3>
          <div className="space-y-3">
            {program.linkedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-accent" aria-hidden="true" />
                  <div>
                    <div className="text-sm text-sidebar-foreground">{goal.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {goal.period} • {goal.type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-sidebar-foreground tabular-nums">
                      {goal.progress}%
                    </div>
                    <div className="text-xs text-muted-foreground">Progress</div>
                  </div>
                  <button
                    onClick={() => onViewGoal?.(goal.id)}
                    className="text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    View Goal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
