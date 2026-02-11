"use client";

import { Users } from "lucide-react";
import { Card, ProgressBar } from "../ui";
import type { Pillar, Objective, AnnualPlan, Quarter } from "./types";
import { defaultPillars, defaultObjectives, defaultAnnualPlan } from "./data";

export interface AnnualPlanningTabProps {
  /** Annual plan data */
  plan?: AnnualPlan;
  /** Strategic pillars */
  pillars?: Pillar[];
  /** Annual objectives */
  objectives?: Objective[];
  /** Total objectives count */
  totalObjectives?: number;
  /** Callback when an objective is clicked */
  onObjectiveSelect?: (id: string) => void;
}

interface PillarCardProps {
  pillar: Pillar;
}

function PillarCard({ pillar }: PillarCardProps) {
  const statusConfig = {
    "on-track": {
      border: "border-green-200",
      progressBg: "bg-green-500",
      text: "text-green-600",
      label: "On Track",
    },
    "at-risk": {
      border: "border-yellow-200",
      progressBg: "bg-yellow-500",
      text: "text-yellow-600",
      label: "At Risk",
    },
    "needs-attention": {
      border: "border-accent/30",
      progressBg: "bg-accent",
      text: "text-accent",
      label: "Needs Attention",
    },
  };

  const config = statusConfig[pillar.status];

  return (
    <Card
      padding="lg"
      className={`${config.border}`}
      role="article"
      aria-label={`${pillar.name} pillar`}
    >
      <h4 className="text-sidebar-foreground mb-2">{pillar.name}</h4>
      <p className="text-xs text-muted-foreground mb-4">{pillar.target}</p>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{pillar.progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${config.progressBg} rounded-full transition-all duration-300`}
            style={{ width: `${pillar.progress}%` }}
            role="progressbar"
            aria-valuenow={pillar.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pillar.name} progress: ${pillar.progress}%`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{pillar.initiatives} initiatives</span>
        <span className={config.text}>{config.label}</span>
      </div>
    </Card>
  );
}

interface ObjectiveCardProps {
  objective: Objective;
  onSelect?: (id: string) => void;
}

function ObjectiveCard({ objective, onSelect }: ObjectiveCardProps) {
  const statusConfig = {
    "on-track": {
      border: "border-border",
      progressBg: "bg-green-500",
      text: "text-green-600",
      label: "On Track",
    },
    "at-risk": {
      border: "border-yellow-200",
      progressBg: "bg-yellow-500",
      text: "text-yellow-600",
      label: "At Risk",
    },
    "needs-attention": {
      border: "border-accent/30",
      progressBg: "bg-accent",
      text: "text-accent",
      label: "Needs Attention",
    },
  };

  const config = statusConfig[objective.status];
  const allQuarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <Card
      padding="md"
      className={`${config.border} hover:border-accent/50 transition-colors cursor-pointer`}
      onClick={() => onSelect?.(objective.id)}
      role="article"
      aria-label={objective.title}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(objective.id);
        }
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-sm text-sidebar-foreground">{objective.title}</h4>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {objective.owner}
            </span>
            <span className="px-2 py-1 bg-muted rounded text-xs">{objective.category}</span>
            <span className="flex items-center gap-1">
              {allQuarters.map((q) => (
                <span
                  key={q}
                  className={`px-2 py-1 rounded text-xs ${
                    objective.activeQuarters.includes(q)
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted/50"
                  }`}
                >
                  {q}
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="ml-6 text-right">
          <div className="text-2xl text-sidebar-foreground mb-1 tabular-nums">
            {objective.progress}%
          </div>
          <div className={`text-xs ${config.text}`}>{config.label}</div>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${config.progressBg} rounded-full transition-all duration-300`}
          style={{ width: `${objective.progress}%` }}
          role="progressbar"
          aria-valuenow={objective.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </Card>
  );
}

export function AnnualPlanningTab({
  plan = defaultAnnualPlan,
  pillars = defaultPillars,
  objectives = defaultObjectives,
  totalObjectives = 24,
  onObjectiveSelect,
}: AnnualPlanningTabProps) {
  return (
    <div>
      {/* Planning Year Header */}
      <Card padding="lg" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sidebar-foreground mb-2">{plan.year} Annual Plan</h2>
            <p className="text-sm text-muted-foreground">
              Strategic priorities and objectives for the fiscal year
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1 uppercase">Plan Completion</div>
            <div className="text-3xl text-sidebar-foreground mb-1 tabular-nums">
              {plan.completionPercent}%
            </div>
            <div className="text-xs text-muted-foreground">
              {plan.quartersComplete} of {plan.totalQuarters} quarters complete
            </div>
          </div>
        </div>
        <ProgressBar
          value={plan.completionPercent}
          max={100}
          size="md"
          variant="default"
          aria-label={`Annual plan progress: ${plan.completionPercent}%`}
        />
      </Card>

      {/* Strategic Pillars */}
      <section className="mb-8" aria-labelledby="pillars-heading">
        <h3 id="pillars-heading" className="text-sidebar-foreground mb-4">
          Strategic Pillars
        </h3>
        <div
          className="grid grid-cols-3 gap-6"
          role="list"
          aria-label="Strategic pillars"
        >
          {pillars.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </section>

      {/* Annual Objectives */}
      <section aria-labelledby="objectives-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="objectives-heading" className="text-sidebar-foreground">
            Annual Objectives
          </h3>
          <button className="text-sm text-accent hover:text-accent/80 transition-colors">
            View All ({totalObjectives})
          </button>
        </div>
        <div className="space-y-3" role="list" aria-label="Annual objectives">
          {objectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              onSelect={onObjectiveSelect}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
