"use client";

import { useState } from "react";
import {
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Circle,
} from "lucide-react";
import { Card, ProgressBar } from "../ui";
import { PhaseProgressTracker } from "./PhaseProgressTracker";
import type { Program, Phase, Module } from "./types";

export interface ProgramCardProps {
  /** Program data */
  program: Program;
  /** Callback when continue/start button is clicked */
  onContinue?: (programId: string) => void;
  /** Callback when view details is clicked */
  onViewDetails?: (programId: string) => void;
}

const statusConfig = {
  completed: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "COMPLETED",
  },
  "in-progress": {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "IN PROGRESS",
  },
  "not-started": {
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    label: "NOT STARTED",
  },
};

const trackColors: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
};

interface PhaseCardProps {
  phase: Phase;
  defaultExpanded?: boolean;
}

function PhaseCard({ phase, defaultExpanded = false }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const getStatusIcon = (status: Phase["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />;
      case "current":
        return <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />;
    }
  };

  const getModuleStatusIcon = (status: Module["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(phase.status)}
          <div className="text-left">
            <div className="text-sm text-sidebar-foreground mb-1">{phase.name}</div>
            <div className="text-xs text-muted-foreground">
              {phase.modulesCompleted} of {phase.modulesTotal} modules completed
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {expanded && phase.modules.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {phase.modules.map((module) => (
            <div key={module.id} className="pl-8 py-2 border-l-2 border-border">
              <div className="flex items-start gap-2 mb-2">
                {getModuleStatusIcon(module.status)}
                <div className="flex-1">
                  <div className="text-sm text-sidebar-foreground">
                    Module {module.number}: {module.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {module.lessonsCompleted} of {module.lessonsTotal} lessons
                  </div>
                </div>
              </div>

              {module.status === "completed" && module.lessons.length > 0 && (
                <div className="ml-6 mt-2 space-y-1">
                  {module.lessons.slice(0, 3).map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-green-600" aria-hidden="true" />
                      <span className="text-muted-foreground line-through">
                        {lesson.title}
                      </span>
                      <span className="text-muted-foreground">• {lesson.duration}</span>
                    </div>
                  ))}
                  {module.lessons.length > 3 && (
                    <div className="text-xs text-muted-foreground ml-5">
                      +{module.lessons.length - 3} more lessons
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProgramCard({ program, onContinue }: ProgramCardProps) {
  const [showCurriculum, setShowCurriculum] = useState(false);
  const config = statusConfig[program.status];
  const trackColor = trackColors[program.trackColor] || trackColors.purple;

  const currentPhaseIndex = program.phases.findIndex(
    (p) => p.status === "current"
  );

  return (
    <Card padding="none" className={`overflow-hidden ${config.border}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className={`w-5 h-5 ${config.color}`} aria-hidden="true" />
              <h3 className="text-sidebar-foreground">{program.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{program.description}</p>
            <div className={`inline-block px-2 py-1 rounded text-xs ${trackColor}`}>
              {program.track}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
            {config.label}
          </div>
        </div>

        {/* Progress Bar (if not not-started) */}
        {program.status !== "not-started" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-sidebar-foreground tabular-nums">{program.progress}%</span>
            </div>
            <ProgressBar
              value={program.progress}
              max={100}
              size="md"
              variant="default"
              aria-label={`Program progress: ${program.progress}%`}
            />
          </div>
        )}

        {/* Next Action (if in-progress) */}
        {program.status === "in-progress" && program.nextAction && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 mb-1">Next Action</div>
            <div className="text-sm text-sidebar-foreground">{program.nextAction}</div>
          </div>
        )}

        {/* Linked Goals */}
        {program.linkedGoals.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2 uppercase">Linked to Goals</div>
            <div className="flex flex-wrap gap-2">
              {program.linkedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded text-xs text-sidebar-foreground"
                >
                  <Target className="w-3 h-3 text-accent" aria-hidden="true" />
                  {goal.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Due Date & Phases */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Due: {program.dueDate}</span>
          <span>{program.phasesCount} Phases</span>
        </div>

        {/* Action Button */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => onContinue?.(program.id)}
            className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {program.status === "not-started"
              ? "Start Program"
              : program.status === "completed"
              ? "Review Program"
              : "Continue Program"}
          </button>
        </div>

        {/* Expand Button */}
        <button
          className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-3 border-t border-border"
          onClick={() => setShowCurriculum(!showCurriculum)}
          aria-expanded={showCurriculum}
        >
          {showCurriculum ? "Hide Curriculum" : "View Curriculum"}
          {showCurriculum ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Expanded Curriculum Section */}
      {showCurriculum && (
        <div className="border-t border-border bg-muted/20 p-5">
          {/* Phase Progress Tracker */}
          {program.phases.length > 1 && (
            <PhaseProgressTracker
              phases={program.phases.map((p) => ({ name: p.name, status: p.status }))}
              currentPhaseIndex={currentPhaseIndex >= 0 ? currentPhaseIndex : 0}
            />
          )}

          <div className="text-xs text-muted-foreground mb-4 uppercase">
            Curriculum Structure
          </div>

          <div className="space-y-3">
            {program.phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                defaultExpanded={phase.status === "current"}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
