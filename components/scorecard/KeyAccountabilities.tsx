"use client";

import { Card, ProgressBar, StatusBadge, Section } from "../ui";
import type { Accountability, AccountabilityStatus } from "./types";
import { defaultAccountabilities } from "./data";

export interface KeyAccountabilitiesProps {
  /** List of accountabilities to display */
  accountabilities?: Accountability[];
  /** Callback when an accountability is clicked */
  onSelect?: (id: string) => void;
}

const statusMap: Record<AccountabilityStatus, { type: "success" | "warning" | "danger"; label: string }> = {
  "on-track": { type: "success", label: "On Track" },
  "at-risk": { type: "warning", label: "At Risk" },
  "needs-attention": { type: "danger", label: "Needs Attention" },
};

const borderColors: Record<AccountabilityStatus, string> = {
  "on-track": "border-green-200 hover:border-green-300",
  "at-risk": "border-yellow-200 hover:border-yellow-300",
  "needs-attention": "border-red-200 hover:border-red-300",
};

function StatusLegend() {
  return (
    <div className="flex items-center gap-4 text-xs" role="legend">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
        <span className="text-muted-foreground">On Track</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
        <span className="text-muted-foreground">At Risk</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
        <span className="text-muted-foreground">Needs Attention</span>
      </div>
    </div>
  );
}

export function KeyAccountabilities({
  accountabilities = defaultAccountabilities,
  onSelect,
}: KeyAccountabilitiesProps) {
  return (
    <Section
      title="Key Accountabilities"
      headerExtra={<StatusLegend />}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        role="list"
        aria-label="Key accountabilities"
      >
        {accountabilities.map((item) => {
          const status = statusMap[item.status];
          const progressVariant =
            item.status === "on-track"
              ? "success"
              : item.status === "at-risk"
              ? "warning"
              : "danger";

          return (
            <Card
              key={item.id}
              interactive={!!onSelect}
              className={`${borderColors[item.status]} transition-colors`}
              onClick={() => onSelect?.(item.id)}
              role="listitem"
              aria-label={`${item.title}: ${item.score} points, ${status.label}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-sidebar-foreground mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-semibold text-sidebar-foreground mb-1">
                    {item.score}
                  </div>
                  <StatusBadge
                    status={status.type}
                    label={status.label}
                    showIcon={false}
                    size="sm"
                  />
                </div>
              </div>
              <ProgressBar
                value={item.score}
                max={100}
                variant={progressVariant}
                size="md"
                aria-label={`Progress: ${item.score}%`}
              />
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
