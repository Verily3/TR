import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";

interface KPICard {
  id: string;
  title: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "flat";
  trendValue: string;
  trendPeriod: string;
  target?: string;
}

const kpiData: KPICard[] = [
  {
    id: "1",
    title: "Team Engagement Score",
    value: "8.4",
    unit: "/10",
    trend: "up",
    trendValue: "+12%",
    trendPeriod: "vs last quarter",
    target: "8.5",
  },
  {
    id: "2",
    title: "1:1 Completion Rate",
    value: "94",
    unit: "%",
    trend: "up",
    trendValue: "+8%",
    trendPeriod: "vs last month",
    target: "95",
  },
  {
    id: "3",
    title: "Goal Achievement",
    value: "76",
    unit: "%",
    trend: "flat",
    trendValue: "0%",
    trendPeriod: "vs last week",
    target: "80",
  },
  {
    id: "4",
    title: "Program Progress",
    value: "65",
    unit: "%",
    trend: "up",
    trendValue: "+15%",
    trendPeriod: "this month",
    target: "100",
  },
];

export function Scoreboard() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sidebar-foreground">My Scoreboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Key performance indicators at a glance</p>
        </div>
        <button className="text-sm text-accent flex items-center gap-1 hover:gap-2 transition-all">
          View Full Report
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
          const trendColor =
            kpi.trend === "up" ? "text-green-600" : kpi.trend === "down" ? "text-accent" : "text-muted-foreground";

          return (
            <div key={kpi.id} className="bg-card border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-3">{kpi.title}</div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl text-sidebar-foreground">{kpi.value}</span>
                <span className="text-sm text-muted-foreground">{kpi.unit}</span>
              </div>

              {kpi.target && (
                <div className="text-xs text-muted-foreground mb-3">Target: {kpi.target}</div>
              )}

              <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span>{kpi.trendValue}</span>
                <span className="text-muted-foreground">{kpi.trendPeriod}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
