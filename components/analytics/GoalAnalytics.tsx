"use client";

import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card } from "../ui";
import type { GoalAnalyticsProps } from "./types";
import { defaultGoalMetrics } from "./data";

export function GoalAnalytics({
  metrics = defaultGoalMetrics,
}: GoalAnalyticsProps) {
  const maxCategoryValue = Math.max(
    ...metrics.goalsByCategory.map((d) => d.value)
  );

  const statusColors: Record<string, string> = {
    Completed: "bg-green-500",
    "In Progress": "bg-blue-500",
    "Not Started": "bg-gray-400",
    Overdue: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-accent" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.totalGoals}
          </div>
          <div className="text-sm text-muted-foreground">Total Goals</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.completedGoals}
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-xs text-green-600 mt-1">
            {metrics.completionRate}% completion rate
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.inProgressGoals}
          </div>
          <div className="text-sm text-muted-foreground">In Progress</div>
          <div className="text-xs text-muted-foreground mt-1">
            {metrics.averageProgress}% avg progress
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.overdueGoals}
          </div>
          <div className="text-sm text-muted-foreground">Overdue</div>
          <div className="text-xs text-red-600 mt-1">requires attention</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Goals by Status */}
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Goals by Status
          </h3>
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {(() => {
                  const total = metrics.goalsByStatus.reduce(
                    (sum, d) => sum + d.value,
                    0
                  );
                  let currentAngle = -90;
                  const colors = ["#22C55E", "#3B82F6", "#9CA3AF", "#EF4444"];

                  return metrics.goalsByStatus.map((item, i) => {
                    const percentage = item.value / total;
                    const angle = percentage * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle = endAngle;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);

                    const largeArc = angle > 180 ? 1 : 0;

                    return (
                      <path
                        key={i}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={colors[i]}
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="25" fill="hsl(var(--background))" />
                <text
                  x="50"
                  y="46"
                  textAnchor="middle"
                  className="text-lg font-bold fill-sidebar-foreground"
                >
                  {metrics.completionRate}%
                </text>
                <text
                  x="50"
                  y="58"
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  complete
                </text>
              </svg>
            </div>
            <div className="space-y-3">
              {metrics.goalsByStatus.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${statusColors[item.label]}`}
                  />
                  <span className="text-sm text-sidebar-foreground min-w-[100px]">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Goals by Category */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Goals by Category
            </h3>
          </div>
          <div className="space-y-4">
            {metrics.goalsByCategory.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-sidebar-foreground">
                    {cat.label}
                  </span>
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {cat.value}
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{
                      width: `${(cat.value / maxCategoryValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Goals Completion Trend */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Goal Completions Over Time
          </h3>
        </div>
        <div className="h-48 relative">
          <svg viewBox="0 0 700 180" className="w-full h-full">
            {/* Grid */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="40"
                y1={30 + i * 40}
                x2="680"
                y2={30 + i * 40}
                stroke="currentColor"
                strokeWidth="1"
                className="text-border"
              />
            ))}
            {/* Bars */}
            {metrics.goalsTrend.map((item, i) => {
              const barWidth = 60;
              const gap = (640 - barWidth * metrics.goalsTrend.length) / (metrics.goalsTrend.length - 1);
              const x = 40 + i * (barWidth + gap);
              const maxVal = 40;
              const height = (item.value / maxVal) * 120;
              const y = 150 - height;

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    fill="#22C55E"
                    rx="4"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {item.value}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* X-axis labels */}
          <div className="flex justify-between px-10 text-xs text-muted-foreground">
            {metrics.goalsTrend.map((item, i) => (
              <span key={i}>{item.date.split("-")[1]}</span>
            ))}
          </div>
        </div>
      </Card>

      {/* Progress Distribution */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Progress Distribution (In-Progress Goals)
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {[
            { range: "0-20%", count: 8, color: "bg-red-500" },
            { range: "21-40%", count: 12, color: "bg-orange-500" },
            { range: "41-60%", count: 18, color: "bg-yellow-500" },
            { range: "61-80%", count: 15, color: "bg-blue-500" },
            { range: "81-99%", count: 9, color: "bg-green-500" },
          ].map((bucket, i) => (
            <div
              key={i}
              className="text-center p-4 border border-border rounded-lg"
            >
              <div className={`w-4 h-4 rounded-full ${bucket.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-sidebar-foreground">
                {bucket.count}
              </div>
              <div className="text-sm text-muted-foreground">{bucket.range}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-6">
        <Card padding="lg" className="border-yellow-200 bg-yellow-50/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-sidebar-foreground mb-1">
                Goals Needing Attention
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {metrics.overdueGoals} goals are past their due date and{" "}
                {Math.round(metrics.inProgressGoals * 0.2)} goals have less than
                20% progress.
              </p>
              <button className="text-sm text-yellow-700 font-medium hover:underline">
                View at-risk goals →
              </button>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="border-green-200 bg-green-50/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-sidebar-foreground mb-1">
                Recent Achievements
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {metrics.goalsTrend[metrics.goalsTrend.length - 1].value} goals
                were completed this month, a{" "}
                {Math.round(
                  ((metrics.goalsTrend[metrics.goalsTrend.length - 1].value -
                    metrics.goalsTrend[metrics.goalsTrend.length - 2].value) /
                    metrics.goalsTrend[metrics.goalsTrend.length - 2].value) *
                    100
                )}
                % increase from last month.
              </p>
              <button className="text-sm text-green-700 font-medium hover:underline">
                Celebrate wins →
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
