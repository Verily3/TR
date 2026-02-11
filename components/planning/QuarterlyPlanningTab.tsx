"use client";

import { useState, useCallback } from "react";
import { Users, Clock, ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { Card, ProgressBar } from "../ui";
import type { Priority, ActionItem, QuarterOverview } from "./types";
import { defaultPriorities, defaultActionItems, defaultQuarterOverview } from "./data";

export interface QuarterlyPlanningTabProps {
  /** Quarter overview data */
  overview?: QuarterOverview;
  /** Current quarter label */
  currentQuarter?: string;
  /** Date range for the quarter */
  dateRange?: string;
  /** Quarterly priorities */
  priorities?: Priority[];
  /** Weekly action items */
  actionItems?: ActionItem[];
  /** Callback when an action item is toggled */
  onActionToggle?: (id: string, completed: boolean) => void;
  /** Callback when starting next quarter planning */
  onStartNextQuarter?: () => void;
}

const QUARTER_OPTIONS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"] as const;

interface PriorityCardProps {
  priority: Priority;
}

function PriorityCard({ priority }: PriorityCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    "on-track": {
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      label: "On Track",
    },
    "at-risk": {
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      label: "At Risk",
    },
    "needs-attention": {
      bgColor: "bg-red-50",
      textColor: "text-accent",
      label: "Needs Attention",
    },
  };

  const config = statusConfig[priority.status];

  return (
    <Card padding="md" role="article" aria-label={priority.title}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-sm text-sidebar-foreground mb-3">{priority.title}</h4>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">{priority.category}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {priority.ownerRole} - {priority.owner}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {priority.dueDate}
            </span>
          </div>
        </div>
        <div className="ml-6">
          <span
            className={`inline-block px-3 py-1 rounded text-xs ${config.bgColor} ${config.textColor}`}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Action Items Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Action Items</span>
          <span>
            {priority.actionsCompleted} of {priority.actionsTotal} complete
          </span>
        </div>
        <ProgressBar
          value={priority.actionsCompleted}
          max={priority.actionsTotal}
          size="sm"
          variant="default"
          aria-label={`Action items progress: ${priority.actionsCompleted} of ${priority.actionsTotal}`}
        />
      </div>

      {/* Expandable Action Items */}
      <button
        className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`priority-actions-${priority.id}`}
      >
        <span>View action items</span>
        {expanded ? (
          <ChevronDown className="w-3 h-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div
          id={`priority-actions-${priority.id}`}
          className="mt-3 pt-3 border-t border-border space-y-2"
        >
          <p className="text-xs text-muted-foreground">
            Action items for this priority would be displayed here.
          </p>
        </div>
      )}
    </Card>
  );
}

interface ActionItemCardProps {
  item: ActionItem;
  onToggle?: (id: string, completed: boolean) => void;
}

function ActionItemCard({ item, onToggle }: ActionItemCardProps) {
  const handleToggle = useCallback(() => {
    onToggle?.(item.id, !item.completed);
  }, [item.id, item.completed, onToggle]);

  return (
    <Card
      padding="sm"
      className={`flex items-center gap-4 ${item.completed ? "opacity-50" : ""}`}
      role="listitem"
    >
      <button
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          item.completed
            ? "bg-accent border-accent"
            : "border-border hover:border-accent"
        }`}
        onClick={handleToggle}
        aria-label={item.completed ? `Mark "${item.title}" as incomplete` : `Mark "${item.title}" as complete`}
        aria-pressed={item.completed}
      >
        {item.completed && (
          <CheckCircle2 className="w-4 h-4 text-accent-foreground" aria-hidden="true" />
        )}
      </button>
      <div className="flex-1">
        <div
          className={`text-sm ${
            item.completed ? "line-through text-muted-foreground" : "text-sidebar-foreground"
          }`}
        >
          {item.title}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{item.owner}</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {item.dueDate}
      </div>
    </Card>
  );
}

export function QuarterlyPlanningTab({
  overview = defaultQuarterOverview,
  currentQuarter = "Q1 2026",
  dateRange = "January 1 - March 31, 2026",
  priorities = defaultPriorities,
  actionItems = defaultActionItems,
  onActionToggle,
  onStartNextQuarter,
}: QuarterlyPlanningTabProps) {
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  return (
    <div>
      {/* Quarter Selector */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label htmlFor="quarter-select" className="sr-only">
            Select quarter
          </label>
          <select
            id="quarter-select"
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            {QUARTER_OPTIONS.map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter}
              </option>
            ))}
          </select>
          <div className="text-sm text-muted-foreground">{dateRange}</div>
        </div>
        <button
          onClick={onStartNextQuarter}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Start Q2 Planning
        </button>
      </div>

      {/* Quarter Overview */}
      <Card padding="lg" className="mb-8">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-muted-foreground mb-2 uppercase">Quarterly Theme</div>
            <div className="text-sm text-sidebar-foreground">{overview.theme}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2 uppercase">Priorities</div>
            <div className="text-sm text-sidebar-foreground">{overview.prioritiesActive} Active</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2 uppercase">Action Items</div>
            <div className="text-sm text-sidebar-foreground">
              {overview.actionItemsTotal} Total &bull; {overview.actionItemsComplete} Complete
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2 uppercase">Completion</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar
                  value={overview.completionPercent}
                  max={100}
                  size="md"
                  variant="default"
                  aria-label={`Quarter completion: ${overview.completionPercent}%`}
                />
              </div>
              <span className="text-sm text-sidebar-foreground tabular-nums">
                {overview.completionPercent}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quarterly Priorities */}
      <section className="mb-8" aria-labelledby="priorities-heading">
        <h3 id="priorities-heading" className="text-sidebar-foreground mb-4">
          {selectedQuarter} Priorities
        </h3>
        <div className="space-y-4" role="list" aria-label="Quarterly priorities">
          {priorities.map((priority) => (
            <PriorityCard key={priority.id} priority={priority} />
          ))}
        </div>
      </section>

      {/* Weekly Action Items */}
      <section aria-labelledby="actions-heading">
        <h3 id="actions-heading" className="text-sidebar-foreground mb-4">
          This Week's Action Items
        </h3>
        <div className="space-y-2" role="list" aria-label="Weekly action items">
          {actionItems.map((item) => (
            <ActionItemCard key={item.id} item={item} onToggle={onActionToggle} />
          ))}
        </div>
      </section>
    </div>
  );
}
