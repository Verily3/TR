"use client";

import { useState } from "react";
import { Users, Clock } from "lucide-react";
import { Card, ProgressBar } from "../ui";
import type { Goal, GoalStats, GoalType } from "./types";
import { defaultGoals, defaultGoalStats } from "./data";

export interface GoalsTabProps {
  /** Goal stats summary */
  stats?: GoalStats;
  /** Goals list */
  goals?: Goal[];
  /** Callback when a goal is clicked */
  onGoalSelect?: (id: string) => void;
}

type FilterTab = "all" | "my" | "team" | "company";

interface StatCardProps {
  label: string;
  value: number;
  subText: string;
  borderColor?: string;
  valueColor?: string;
  subTextColor?: string;
}

function StatCard({
  label,
  value,
  subText,
  borderColor = "border-border",
  valueColor = "text-sidebar-foreground",
  subTextColor = "text-muted-foreground",
}: StatCardProps) {
  return (
    <Card padding="md" className={borderColor}>
      <div className="text-xs text-muted-foreground mb-2 uppercase">{label}</div>
      <div className={`text-3xl ${valueColor} mb-1 tabular-nums`}>{value}</div>
      <div className={`text-xs ${subTextColor}`}>{subText}</div>
    </Card>
  );
}

interface GoalCardProps {
  goal: Goal;
  onSelect?: (id: string) => void;
}

function GoalCard({ goal, onSelect }: GoalCardProps) {
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

  const typeLabels: Record<GoalType, string> = {
    company: "Company",
    team: "Team",
    personal: "Personal",
  };

  const config = statusConfig[goal.status];

  return (
    <Card
      padding="lg"
      className={`${config.border} hover:border-accent/50 transition-colors cursor-pointer`}
      onClick={() => onSelect?.(goal.id)}
      role="article"
      aria-label={goal.title}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(goal.id);
        }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-sm text-sidebar-foreground">{goal.title}</h4>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="px-2 py-1 bg-muted rounded">{typeLabels[goal.type]}</span>
            <span className="px-2 py-1 bg-muted rounded">{goal.category}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {goal.ownerRole} - {goal.owner}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {goal.dueDate}
            </span>
          </div>
          {goal.scorecardLink && (
            <div className="text-xs text-accent">Scorecard: {goal.scorecardLink}</div>
          )}
        </div>
        <div className="ml-6 text-right">
          <div className="text-2xl text-sidebar-foreground mb-1 tabular-nums">
            {goal.progress}%
          </div>
          <div className={`text-xs ${config.text} mb-2`}>{config.label}</div>
          <div className="text-xs text-muted-foreground">
            {goal.currentValue} / {goal.targetValue}
          </div>
        </div>
      </div>
      <ProgressBar
        value={goal.progress}
        max={100}
        size="md"
        variant={goal.status === "on-track" ? "success" : goal.status === "at-risk" ? "warning" : "danger"}
        aria-label={`Goal progress: ${goal.progress}%`}
      />
    </Card>
  );
}

export function GoalsTab({
  stats = defaultGoalStats,
  goals = defaultGoals,
  onGoalSelect,
}: GoalsTabProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All Goals", count: stats.total },
    { id: "my", label: "My Goals", count: 8 },
    { id: "team", label: "Team Goals", count: 10 },
    { id: "company", label: "Company Goals", count: 6 },
  ];

  const filteredGoals = goals.filter((goal) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "my") return goal.owner === "You";
    if (activeFilter === "team") return goal.type === "team";
    if (activeFilter === "company") return goal.type === "company";
    return true;
  });

  return (
    <div>
      {/* Goals Summary Stats */}
      <div
        className="mb-8 grid grid-cols-4 gap-4"
        role="region"
        aria-label="Goals summary statistics"
      >
        <StatCard
          label="Total Goals"
          value={stats.total}
          subText={`+${stats.newThisQuarter} this quarter`}
          subTextColor="text-green-600"
        />
        <StatCard
          label="On Track"
          value={stats.onTrack}
          subText={`${Math.round((stats.onTrack / stats.total) * 100)}% of total`}
          borderColor="border-green-200"
          valueColor="text-green-600"
        />
        <StatCard
          label="At Risk"
          value={stats.atRisk}
          subText={`${Math.round((stats.atRisk / stats.total) * 100)}% of total`}
          borderColor="border-yellow-200"
          valueColor="text-yellow-600"
        />
        <StatCard
          label="Needs Attention"
          value={stats.needsAttention}
          subText={`${Math.round((stats.needsAttention / stats.total) * 100)}% of total`}
          borderColor="border-accent"
          valueColor="text-accent"
        />
      </div>

      {/* Filter Tabs */}
      <div
        className="mb-6 flex items-center gap-2"
        role="tablist"
        aria-label="Filter goals"
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeFilter === tab.id}
            aria-controls="goals-list"
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeFilter === tab.id
                ? "bg-accent text-accent-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-sidebar-foreground"
            }`}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div
        id="goals-list"
        role="tabpanel"
        aria-label={`${filterTabs.find((t) => t.id === activeFilter)?.label}`}
        className="space-y-4"
      >
        {filteredGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onSelect={onGoalSelect} />
        ))}
        {filteredGoals.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-muted-foreground">No goals found for this filter.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
