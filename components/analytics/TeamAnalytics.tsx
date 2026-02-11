"use client";

import {
  Users,
  UserPlus,
  TrendingDown,
  Clock,
  Building2,
  Heart,
  Target,
  BookOpen,
} from "lucide-react";
import { Card } from "../ui";
import type { TeamAnalyticsProps } from "./types";
import { defaultTeamMetrics } from "./data";

export function TeamAnalytics({
  metrics = defaultTeamMetrics,
}: TeamAnalyticsProps) {
  const maxDeptValue = Math.max(...metrics.departmentBreakdown.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.totalEmployees}
          </div>
          <div className="text-sm text-muted-foreground">Total Employees</div>
          <div className="text-xs text-green-600 mt-1">
            {metrics.activeEmployees} active
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            +{metrics.newHires}
          </div>
          <div className="text-sm text-muted-foreground">New Hires</div>
          <div className="text-xs text-muted-foreground mt-1">this month</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.turnoverRate}%
          </div>
          <div className="text-sm text-muted-foreground">Turnover Rate</div>
          <div className="text-xs text-muted-foreground mt-1">annualized</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.averageTenure}
          </div>
          <div className="text-sm text-muted-foreground">Avg Tenure (months)</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Headcount by Department
            </h3>
          </div>
          <div className="space-y-4">
            {metrics.departmentBreakdown.map((dept, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-sidebar-foreground">
                    {dept.label}
                  </span>
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {dept.value}
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${(dept.value / maxDeptValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Headcount Trend */}
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Headcount Trend
          </h3>
          <div className="h-48 relative">
            <svg viewBox="0 0 300 160" className="w-full h-40">
              {/* Grid */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="30"
                  y1={20 + i * 30}
                  x2="290"
                  y2={20 + i * 30}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
              ))}
              {/* Area */}
              <path
                d={`M30,140 ${metrics.headcountTrend
                  .map((item, i) => {
                    const x =
                      30 + (i * 260) / (metrics.headcountTrend.length - 1);
                    const minVal = 140;
                    const maxVal = 160;
                    const y = 140 - ((item.value - minVal) / (maxVal - minVal)) * 120;
                    return `L${x},${y}`;
                  })
                  .join(" ")} L290,140 Z`}
                fill="rgba(229, 62, 62, 0.1)"
              />
              {/* Line */}
              <polyline
                points={metrics.headcountTrend
                  .map((item, i) => {
                    const x =
                      30 + (i * 260) / (metrics.headcountTrend.length - 1);
                    const minVal = 140;
                    const maxVal = 160;
                    const y = 140 - ((item.value - minVal) / (maxVal - minVal)) * 120;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#E53E3E"
                strokeWidth="2"
              />
              {/* Points */}
              {metrics.headcountTrend.map((item, i) => {
                const x = 30 + (i * 260) / (metrics.headcountTrend.length - 1);
                const minVal = 140;
                const maxVal = 160;
                const y = 140 - ((item.value - minVal) / (maxVal - minVal)) * 120;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#E53E3E" />
                    <text
                      x={x}
                      y={y - 10}
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
            <div className="flex justify-between px-8 text-xs text-muted-foreground">
              {metrics.headcountTrend.map((item, i) => (
                <span key={i}>{item.date.split("-")[1]}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Engagement Score
            </h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="10"
                  strokeDasharray={`${(metrics.engagementScore / 5) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-sidebar-foreground">
                  {metrics.engagementScore}
                </span>
                <span className="text-xs text-muted-foreground">out of 5</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Based on latest employee survey
          </p>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Goal Completion
            </h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="10"
                  strokeDasharray={`${(metrics.goalCompletionRate / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-sidebar-foreground">
                  {metrics.goalCompletionRate}%
                </span>
                <span className="text-xs text-muted-foreground">completed</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Company-wide goal achievement
          </p>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Training Hours
            </h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="10"
                  strokeDasharray={`${(metrics.trainingHoursPerEmployee / 40) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-sidebar-foreground">
                  {metrics.trainingHoursPerEmployee}
                </span>
                <span className="text-xs text-muted-foreground">hrs/person</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Average training hours per employee
          </p>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Quick Team Stats
        </h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-sidebar-foreground">
              {Math.round(metrics.totalEmployees * 0.48)}
            </div>
            <div className="text-sm text-muted-foreground">Remote Workers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-sidebar-foreground">
              {Math.round(metrics.totalEmployees * 0.35)}
            </div>
            <div className="text-sm text-muted-foreground">In Management</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-sidebar-foreground">6</div>
            <div className="text-sm text-muted-foreground">Departments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-sidebar-foreground">12</div>
            <div className="text-sm text-muted-foreground">Teams</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
