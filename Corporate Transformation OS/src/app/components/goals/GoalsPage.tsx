import { useState } from "react";
import { Plus, Filter, Download } from "lucide-react";
import { GoalCard } from "@/app/components/goals/GoalCard";
import { NeedsAttention } from "@/app/components/goals/NeedsAttention";
import { TransformationTracker } from "@/app/components/TransformationTracker";

type TimeFrame = "quarterly" | "monthly" | "weekly" | "all";
type GoalType = "all" | "personal" | "team" | "org";

// Mock data
const mockGoals = [
  {
    id: "1",
    title: "Increase team engagement score to 8.5+",
    owner: "You",
    type: "team" as const,
    status: "on-track" as const,
    progress: 84,
    dueDate: "Mar 31, 2026",
    nextAction: "Schedule team feedback session",
    confidenceLevel: 4,
    kpis: [
      {
        id: "k1",
        name: "Team Engagement Score",
        current: 8.4,
        target: 8.5,
        unit: "/10",
        trend: "up" as const,
        trendValue: "+12%",
      },
      {
        id: "k2",
        name: "Employee Satisfaction",
        current: 87,
        target: 90,
        unit: "%",
        trend: "up" as const,
        trendValue: "+5%",
      },
    ],
    lastUpdate: "2 hours ago",
    timeframe: "quarterly",
  },
  {
    id: "2",
    title: "Complete leadership certification program",
    owner: "You",
    type: "personal" as const,
    status: "at-risk" as const,
    progress: 65,
    dueDate: "Jan 31, 2026",
    nextAction: "Complete Module 4 and submit field application",
    confidenceLevel: 3,
    kpis: [
      {
        id: "k3",
        name: "Program Progress",
        current: 65,
        target: 100,
        unit: "%",
        trend: "up" as const,
        trendValue: "+15%",
      },
    ],
    lastUpdate: "1 day ago",
    timeframe: "monthly",
  },
  {
    id: "3",
    title: "Achieve 95% 1:1 completion rate",
    owner: "You",
    type: "team" as const,
    status: "on-track" as const,
    progress: 94,
    dueDate: "Jan 17, 2026",
    nextAction: "Schedule 2 pending 1:1s",
    confidenceLevel: 5,
    kpis: [
      {
        id: "k4",
        name: "1:1 Completion Rate",
        current: 94,
        target: 95,
        unit: "%",
        trend: "up" as const,
        trendValue: "+8%",
      },
    ],
    lastUpdate: "3 hours ago",
    timeframe: "weekly",
  },
  {
    id: "4",
    title: "Drive organizational revenue growth to $50M",
    owner: "Executive Team",
    type: "org" as const,
    status: "on-track" as const,
    progress: 72,
    dueDate: "Dec 31, 2026",
    nextAction: "Review Q1 forecast with finance team",
    confidenceLevel: 4,
    kpis: [
      {
        id: "k5",
        name: "Annual Revenue",
        current: 36,
        target: 50,
        unit: "M",
        trend: "up" as const,
        trendValue: "+18%",
      },
      {
        id: "k6",
        name: "Revenue per Employee",
        current: 245,
        target: 300,
        unit: "K",
        trend: "up" as const,
        trendValue: "+12%",
      },
    ],
    lastUpdate: "5 hours ago",
    timeframe: "quarterly",
  },
  {
    id: "5",
    title: "Improve customer retention to 92%",
    owner: "Sarah Johnson",
    type: "org" as const,
    status: "behind" as const,
    progress: 45,
    dueDate: "Jun 30, 2026",
    nextAction: "Analyze churn data and develop action plan",
    confidenceLevel: 2,
    kpis: [
      {
        id: "k7",
        name: "Customer Retention Rate",
        current: 85,
        target: 92,
        unit: "%",
        trend: "down" as const,
        trendValue: "-3%",
      },
    ],
    lastUpdate: "1 day ago",
    timeframe: "quarterly",
  },
];

export function GoalsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>("all");
  const [selectedType, setSelectedType] = useState<GoalType>("all");

  // Filter goals
  const filteredGoals = mockGoals.filter((goal) => {
    const timeframeMatch = selectedTimeframe === "all" || goal.timeframe === selectedTimeframe;
    const typeMatch = selectedType === "all" || goal.type === selectedType;
    return timeframeMatch && typeMatch;
  });

  // Stats
  const totalGoals = filteredGoals.length;
  const onTrack = filteredGoals.filter((g) => g.status === "on-track").length;
  const atRisk = filteredGoals.filter((g) => g.status === "at-risk").length;
  const behind = filteredGoals.filter((g) => g.status === "behind").length;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-sidebar-foreground mb-2">Goals & KPIs</h1>
            <p className="text-muted-foreground">
              Track progress across personal, team, and organizational objectives
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted/50 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Goal
            </button>
          </div>
        </div>

        {/* Transformation Stage Tracker */}
        <TransformationTracker />

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Goals</div>
            <div className="text-2xl text-sidebar-foreground">{totalGoals}</div>
          </div>
          <div className="bg-card border border-green-200 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">On Track</div>
            <div className="text-2xl text-green-600">{onTrack}</div>
          </div>
          <div className="bg-card border border-yellow-200 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">At Risk</div>
            <div className="text-2xl text-yellow-600">{atRisk}</div>
          </div>
          <div className="bg-card border border-red-200 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Behind</div>
            <div className="text-2xl text-accent">{behind}</div>
          </div>
        </div>

        {/* Needs Attention */}
        <NeedsAttention />

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          {/* Timeframe Tabs */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            {[
              { value: "all", label: "All" },
              { value: "quarterly", label: "Quarterly" },
              { value: "monthly", label: "Monthly" },
              { value: "weekly", label: "Weekly" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTimeframe(tab.value as TimeFrame)}
                className={`px-4 py-2 rounded text-sm transition-colors ${
                  selectedTimeframe === tab.value
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-background"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as GoalType)}
              className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground bg-card hover:bg-muted/50 transition-colors"
            >
              <option value="all">All Goals</option>
              <option value="personal">Personal</option>
              <option value="team">Team</option>
              <option value="org">Organization</option>
            </select>
          </div>

          <div className="flex-1" />

          <div className="text-sm text-muted-foreground">
            Showing {filteredGoals.length} of {mockGoals.length} goals
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}

          {filteredGoals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No goals found for the selected filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}