import { Calendar, TrendingUp, TrendingDown, Minus, BookOpen } from "lucide-react";

interface DirectReportCardProps {
  report: {
    id: string;
    name: string;
    title: string;
    avatar: string;
    nextSession: string;
    lastSession: string;
    goalsOnTrack: number;
    goalsAtRisk: number;
    programProgress: number;
    programTitle: string;
    keyMetrics: Array<{
      label: string;
      value: string;
      trend: "up" | "down" | "stable";
    }>;
  };
}

export function DirectReportCard({ report }: DirectReportCardProps) {
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      case "stable":
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "stable":
        return "text-muted-foreground";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-accent/50 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
          {report.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sidebar-foreground mb-1">{report.name}</h3>
          <p className="text-sm text-muted-foreground">{report.title}</p>
        </div>
      </div>

      {/* Sessions */}
      <div className="mb-4 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Next Session</span>
          <span className="text-sm text-sidebar-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {report.nextSession}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Last Session</span>
          <span className="text-sm text-muted-foreground">{report.lastSession}</span>
        </div>
      </div>

      {/* Goals Status */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-2">Goals Status</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="text-sm text-sidebar-foreground">{report.goalsOnTrack} on track</span>
          </div>
          {report.goalsAtRisk > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span className="text-sm text-sidebar-foreground">{report.goalsAtRisk} at risk</span>
            </div>
          )}
        </div>
      </div>

      {/* Program Progress */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-2">Current Program</div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-sidebar-foreground">{report.programTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${report.programProgress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{report.programProgress}%</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-2">Key Metrics</div>
        <div className="space-y-2">
          {report.keyMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                  {metric.value}
                </span>
                {getTrendIcon(metric.trend)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
        View Full Profile
      </button>
    </div>
  );
}
