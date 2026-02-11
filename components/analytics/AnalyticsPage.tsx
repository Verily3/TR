"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  ClipboardList,
  Target,
  Users,
  Calendar,
  Download,
} from "lucide-react";
import { Card } from "../ui";
import { ProgramAnalytics } from "./ProgramAnalytics";
import { AssessmentAnalytics } from "./AssessmentAnalytics";
import { TeamAnalytics } from "./TeamAnalytics";
import { GoalAnalytics } from "./GoalAnalytics";
import type { AnalyticsPageProps, TimeRange } from "./types";
import { defaultOverviewMetrics, timeRangeOptions } from "./data";

type Tab = "overview" | "programs" | "assessments" | "team" | "goals";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "programs", label: "Programs", icon: <BookOpen className="w-4 h-4" /> },
  { id: "assessments", label: "Assessments", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "team", label: "Team", icon: <Users className="w-4 h-4" /> },
  { id: "goals", label: "Goals", icon: <Target className="w-4 h-4" /> },
];

export function AnalyticsPage({
  overview = defaultOverviewMetrics,
}: AnalyticsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable", positive = true) => {
    if (trend === "stable") return "text-muted-foreground";
    if (positive) {
      return trend === "up" ? "text-green-600" : "text-red-600";
    }
    return trend === "up" ? "text-red-600" : "text-green-600";
  };

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Page Header */}
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sidebar-foreground mb-2">
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground">
            Track performance metrics and gain insights across your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-background"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card padding="lg">
              <div className="flex items-start justify-between mb-2">
                <BookOpen className="w-6 h-6 text-accent" />
                {getTrendIcon(overview.programs.trend)}
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {overview.programs.total}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Active Programs
              </div>
              <div
                className={`text-sm ${getTrendColor(overview.programs.trend)}`}
              >
                {overview.programs.change > 0 ? "+" : ""}
                {overview.programs.change}% from last period
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-start justify-between mb-2">
                <ClipboardList className="w-6 h-6 text-blue-600" />
                {getTrendIcon(overview.assessments.trend)}
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {overview.assessments.total}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Assessments Completed
              </div>
              <div
                className={`text-sm ${getTrendColor(overview.assessments.trend)}`}
              >
                {overview.assessments.change > 0 ? "+" : ""}
                {overview.assessments.change}% from last period
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-start justify-between mb-2">
                <Target className="w-6 h-6 text-green-600" />
                {getTrendIcon(overview.goals.trend)}
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {overview.goals.completionRate}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Goal Completion Rate
              </div>
              <div className={`text-sm ${getTrendColor(overview.goals.trend)}`}>
                {overview.goals.change > 0 ? "+" : ""}
                {overview.goals.change}% from last period
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-start justify-between mb-2">
                <Users className="w-6 h-6 text-purple-600" />
                {getTrendIcon(overview.engagement.trend)}
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {overview.engagement.score}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Engagement Score
              </div>
              <div
                className={`text-sm ${getTrendColor(overview.engagement.trend)}`}
              >
                {overview.engagement.change > 0 ? "+" : ""}
                {overview.engagement.change}% from last period
              </div>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-2 gap-6">
            <Card padding="lg">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Program Enrollment Trend
              </h3>
              <SimpleBarChart
                data={[
                  { label: "Jul", value: 28 },
                  { label: "Aug", value: 35 },
                  { label: "Sep", value: 42 },
                  { label: "Oct", value: 38 },
                  { label: "Nov", value: 52 },
                  { label: "Dec", value: 45 },
                  { label: "Jan", value: 58 },
                ]}
                color="accent"
              />
            </Card>

            <Card padding="lg">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Assessment Response Rate
              </h3>
              <SimpleLineChart
                data={[
                  { label: "Jul", value: 78 },
                  { label: "Aug", value: 82 },
                  { label: "Sep", value: 79 },
                  { label: "Oct", value: 85 },
                  { label: "Nov", value: 88 },
                  { label: "Dec", value: 84 },
                  { label: "Jan", value: 86 },
                ]}
                color="blue"
                suffix="%"
              />
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6">
            <Card padding="lg">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Top Programs
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Leadership Excellence", value: 86 },
                  { name: "Manager to Leader", value: 64 },
                  { name: "New Manager Bootcamp", value: 52 },
                ].map((program, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-sidebar-foreground">
                      {program.name}
                    </span>
                    <span className="text-sm font-medium text-accent">
                      {program.value} enrollments
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Top Competencies
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Communication", value: 4.2 },
                  { name: "Leadership", value: 3.9 },
                  { name: "Team Development", value: 3.8 },
                ].map((comp, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-sidebar-foreground">
                      {comp.name}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {comp.value}/5.0
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Development Areas
              </h3>
              <div className="space-y-3">
                {["Strategic Thinking", "Innovation", "Delegation"].map(
                  (area, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-sidebar-foreground"
                    >
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      {area}
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "programs" && <ProgramAnalytics timeRange={timeRange} />}
      {activeTab === "assessments" && <AssessmentAnalytics timeRange={timeRange} />}
      {activeTab === "team" && <TeamAnalytics timeRange={timeRange} />}
      {activeTab === "goals" && <GoalAnalytics timeRange={timeRange} />}
    </main>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({
  data,
  color = "accent",
}: {
  data: { label: string; value: number }[];
  color?: "accent" | "blue" | "green" | "purple";
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const colorClass = {
    accent: "bg-accent",
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  }[color];

  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex flex-col items-center justify-end h-32">
            <div className="text-xs text-muted-foreground mb-1">
              {item.value}
            </div>
            <div
              className={`w-full max-w-[40px] ${colorClass} rounded-t transition-all`}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Simple Line Chart Component
function SimpleLineChart({
  data,
  color = "accent",
  suffix = "",
}: {
  data: { label: string; value: number }[];
  color?: "accent" | "blue" | "green" | "purple";
  suffix?: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const strokeColor = {
    accent: "#E53E3E",
    blue: "#3B82F6",
    green: "#22C55E",
    purple: "#A855F7",
  }[color];

  const points = data
    .map((item, i) => {
      const x = (i / (data.length - 1)) * 280 + 10;
      const y = 120 - ((item.value - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative h-40">
      <svg viewBox="0 0 300 140" className="w-full h-32">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="10"
            y1={20 + i * 25}
            x2="290"
            y2={20 + i * 25}
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />
        ))}
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((item, i) => {
          const x = (i / (data.length - 1)) * 280 + 10;
          const y = 120 - ((item.value - minValue) / range) * 100;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={strokeColor}
              className="cursor-pointer"
            />
          );
        })}
      </svg>
      {/* Labels */}
      <div className="flex justify-between px-2 text-xs text-muted-foreground">
        {data.map((item, i) => (
          <span key={i}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}
