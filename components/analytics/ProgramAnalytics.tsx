"use client";

import {
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";
import { Card } from "../ui";
import type { ProgramAnalyticsProps } from "./types";
import { defaultProgramMetrics } from "./data";

export function ProgramAnalytics({
  metrics = defaultProgramMetrics,
}: ProgramAnalyticsProps) {
  const maxEnrollment = Math.max(
    ...metrics.enrollmentTrend.map((d) => d.value)
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-accent" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.totalPrograms}
          </div>
          <div className="text-sm text-muted-foreground">Total Programs</div>
          <div className="text-xs text-green-600 mt-1">
            {metrics.activePrograms} active
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.totalEnrollments}
          </div>
          <div className="text-sm text-muted-foreground">Total Enrollments</div>
          <div className="text-xs text-blue-600 mt-1">
            {metrics.activeEnrollments} currently active
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.completionRate}%
          </div>
          <div className="text-sm text-muted-foreground">Completion Rate</div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg progress: {metrics.averageProgress}%
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.averageTimeToComplete}
          </div>
          <div className="text-sm text-muted-foreground">
            Avg Days to Complete
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Enrollment Trend
          </h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {metrics.enrollmentTrend.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <div className="text-xs text-muted-foreground mb-1">
                    {item.value}
                  </div>
                  <div
                    className="w-full max-w-[40px] bg-accent rounded-t transition-all"
                    style={{ height: `${(item.value / maxEnrollment) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.date.split("-")[1]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Programs by Status */}
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Programs by Status
          </h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <DonutChart data={metrics.programsByStatus} />
            </div>
            <div className="ml-8 space-y-2">
              {metrics.programsByStatus.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      ["bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-gray-400"][i]
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.label}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top Programs Table */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Top Performing Programs
          </h3>
          <Award className="w-5 h-5 text-accent" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Program Name
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Enrollments
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Completion Rate
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.topPrograms.map((program, i) => (
                <tr
                  key={program.id}
                  className="border-b border-border hover:bg-muted/50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </div>
                      <span className="text-sidebar-foreground">
                        {program.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sidebar-foreground">
                    {program.enrollments}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-medium ${
                        program.completionRate >= 80
                          ? "text-green-600"
                          : program.completionRate >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {program.completionRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            program.completionRate >= 80
                              ? "bg-green-500"
                              : program.completionRate >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${program.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Completion Trend */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Completions Over Time
          </h3>
          <TrendingUp className="w-5 h-5 text-green-600" />
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
            {/* Area */}
            <path
              d={`M40,150 ${metrics.completionTrend
                .map((item, i) => {
                  const x = 40 + (i * 640) / (metrics.completionTrend.length - 1);
                  const y = 150 - (item.value / 40) * 120;
                  return `L${x},${y}`;
                })
                .join(" ")} L680,150 Z`}
              fill="rgba(34, 197, 94, 0.1)"
            />
            {/* Line */}
            <polyline
              points={metrics.completionTrend
                .map((item, i) => {
                  const x = 40 + (i * 640) / (metrics.completionTrend.length - 1);
                  const y = 150 - (item.value / 40) * 120;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#22C55E"
              strokeWidth="2"
            />
            {/* Points */}
            {metrics.completionTrend.map((item, i) => {
              const x = 40 + (i * 640) / (metrics.completionTrend.length - 1);
              const y = 150 - (item.value / 40) * 120;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#22C55E" />
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
          <div className="flex justify-between px-10 text-xs text-muted-foreground">
            {metrics.completionTrend.map((item, i) => (
              <span key={i}>{item.date.split("-")[1]}</span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Donut Chart Component
function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ["#22C55E", "#3B82F6", "#EAB308", "#9CA3AF"];
  let currentAngle = -90;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {data.map((item, i) => {
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
      })}
      <circle cx="50" cy="50" r="25" fill="hsl(var(--background))" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-lg font-bold fill-sidebar-foreground"
      >
        {total}
      </text>
    </svg>
  );
}
