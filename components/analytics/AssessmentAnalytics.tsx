"use client";

import {
  ClipboardList,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Card } from "../ui";
import type { AssessmentAnalyticsProps } from "./types";
import { defaultAssessmentMetrics } from "./data";

export function AssessmentAnalytics({
  metrics = defaultAssessmentMetrics,
}: AssessmentAnalyticsProps) {
  const maxScore = 5;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-6 h-6 text-accent" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.totalAssessments}
          </div>
          <div className="text-sm text-muted-foreground">Total Assessments</div>
          <div className="text-xs text-blue-600 mt-1">
            {metrics.activeAssessments} active
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.totalResponses}
          </div>
          <div className="text-sm text-muted-foreground">Total Responses</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.averageResponseRate}%
          </div>
          <div className="text-sm text-muted-foreground">Avg Response Rate</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {metrics.averageScore.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Average Score</div>
          <div className="text-xs text-muted-foreground mt-1">out of 5.0</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Scores by Competency */}
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Scores by Competency
          </h3>
          <div className="space-y-4">
            {metrics.scoresByCompetency.map((comp, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-sidebar-foreground">
                    {comp.label}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      comp.value >= 4
                        ? "text-green-600"
                        : comp.value >= 3.5
                          ? "text-blue-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {comp.value.toFixed(1)}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      comp.value >= 4
                        ? "bg-green-500"
                        : comp.value >= 3.5
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                    }`}
                    style={{ width: `${(comp.value / maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Response Rate Trend */}
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Response Rate Trend
          </h3>
          <div className="h-48 relative">
            <svg viewBox="0 0 300 160" className="w-full h-40">
              {/* Grid */}
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line
                    x1="30"
                    y1={20 + i * 30}
                    x2="290"
                    y2={20 + i * 30}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-border"
                  />
                  <text
                    x="25"
                    y={24 + i * 30}
                    textAnchor="end"
                    className="text-xs fill-muted-foreground"
                  >
                    {100 - i * 10}%
                  </text>
                </g>
              ))}
              {/* Area */}
              <path
                d={`M30,140 ${metrics.responseRateTrend
                  .map((item, i) => {
                    const x =
                      30 + (i * 260) / (metrics.responseRateTrend.length - 1);
                    const y = 140 - ((item.value - 60) / 40) * 120;
                    return `L${x},${y}`;
                  })
                  .join(" ")} L290,140 Z`}
                fill="rgba(59, 130, 246, 0.1)"
              />
              {/* Line */}
              <polyline
                points={metrics.responseRateTrend
                  .map((item, i) => {
                    const x =
                      30 + (i * 260) / (metrics.responseRateTrend.length - 1);
                    const y = 140 - ((item.value - 60) / 40) * 120;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
              {/* Points */}
              {metrics.responseRateTrend.map((item, i) => {
                const x =
                  30 + (i * 260) / (metrics.responseRateTrend.length - 1);
                const y = 140 - ((item.value - 60) / 40) * 120;
                return <circle key={i} cx={x} cy={y} r="4" fill="#3B82F6" />;
              })}
            </svg>
            {/* X-axis labels */}
            <div className="flex justify-between px-8 text-xs text-muted-foreground">
              {metrics.responseRateTrend.map((item, i) => (
                <span key={i}>{item.date.split("-")[1]}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Strengths */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Organizational Strengths
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These competencies consistently score highest across assessments
          </p>
          <div className="space-y-3">
            {metrics.topStrengths.map((strength, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-medium">
                  {i + 1}
                </div>
                <span className="text-sidebar-foreground font-medium">
                  {strength}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Development Areas */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Development Focus Areas
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These areas show opportunity for growth and development
          </p>
          <div className="space-y-3">
            {metrics.topDevelopmentAreas.map((area, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-medium">
                  {i + 1}
                </div>
                <span className="text-sidebar-foreground font-medium">
                  {area}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Assessment Status Breakdown */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Assessment Status Distribution
        </h3>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 h-8 rounded-lg overflow-hidden">
              {metrics.assessmentsByStatus.map((status, i) => {
                const total = metrics.assessmentsByStatus.reduce(
                  (sum, s) => sum + s.value,
                  0
                );
                const percentage = (status.value / total) * 100;
                const colors = ["bg-green-500", "bg-blue-500", "bg-yellow-500"];
                return (
                  <div
                    key={i}
                    className={`h-full ${colors[i]} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-6">
            {metrics.assessmentsByStatus.map((status, i) => {
              const colors = [
                "bg-green-500",
                "bg-blue-500",
                "bg-yellow-500",
              ];
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[i]}`} />
                  <span className="text-sm text-muted-foreground">
                    {status.label}: {status.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
