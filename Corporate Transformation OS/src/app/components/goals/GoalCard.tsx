import { useState } from "react";
import { Target, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, Calendar, User } from "lucide-react";

interface KPI {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: "up" | "down";
  trendValue: string;
}

interface Goal {
  id: string;
  title: string;
  owner: string;
  type: "personal" | "team" | "org";
  status: "on-track" | "at-risk" | "behind" | "completed";
  progress: number;
  dueDate: string;
  nextAction: string;
  confidenceLevel: number;
  kpis: KPI[];
  lastUpdate: string;
}

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    "on-track": { color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    "at-risk": { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    "behind": { color: "text-accent", bg: "bg-red-50", border: "border-red-200" },
    "completed": { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  };

  const typeColors = {
    personal: "bg-purple-100 text-purple-700",
    team: "bg-blue-100 text-blue-700",
    org: "bg-green-100 text-green-700",
  };

  const config = statusConfig[goal.status];

  return (
    <div className={`bg-card border ${config.border} rounded-lg overflow-hidden transition-all`}>
      {/* Main Card Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sidebar-foreground">{goal.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs ${typeColors[goal.type]}`}>
                {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {goal.owner}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {goal.dueDate}
              </span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
            {goal.status.replace("-", " ").toUpperCase()}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-sidebar-foreground">{goal.progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>

        {/* Next Action */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Next Action</div>
          <div className="text-sm text-sidebar-foreground">{goal.nextAction}</div>
        </div>

        {/* KPI Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-muted-foreground">
            {goal.kpis.length} Linked KPI{goal.kpis.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-6 h-1.5 rounded ${
                    level <= goal.confidenceLevel ? "bg-accent" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-sidebar-foreground">{goal.confidenceLevel}/5</span>
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-3 border-t border-border"
        >
          {expanded ? "Hide Details" : "View KPI Details"}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded KPI Details */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-5">
          <div className="text-xs text-muted-foreground mb-3">LINKED KPIs</div>
          <div className="space-y-3">
            {goal.kpis.map((kpi) => {
              const isPositiveTrend = kpi.trend === "up";
              const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

              return (
                <div key={kpi.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm text-sidebar-foreground mb-1">{kpi.name}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl text-sidebar-foreground">
                          {kpi.current}
                          {kpi.unit}
                        </span>
                        <span className="text-xs text-muted-foreground">of {kpi.target}{kpi.unit}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${isPositiveTrend ? "text-green-600" : "text-accent"}`}>
                      <TrendIcon className="w-3.5 h-3.5" />
                      {kpi.trendValue}
                    </div>
                  </div>

                  {/* Progress to target */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${(kpi.current / kpi.target) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            Last updated: {goal.lastUpdate}
          </div>
        </div>
      )}
    </div>
  );
}
