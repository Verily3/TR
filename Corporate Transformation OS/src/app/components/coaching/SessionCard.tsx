import { Calendar, Clock, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SessionCardProps {
  session: {
    id: string;
    directReport: {
      name: string;
      title: string;
      avatar: string;
    };
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    isPrepared: boolean;
    lastSession: string;
    context: {
      goalsOnTrack: number;
      goalsAtRisk: number;
      programProgress: number;
      recentWin: string | null;
      concern: string | null;
    };
  };
}

export function SessionCard({ session }: SessionCardProps) {
  const { directReport, scheduledDate, scheduledTime, duration, isPrepared, context } = session;

  return (
    <div className={`bg-card border rounded-lg p-6 hover:border-accent/50 transition-colors ${
      isPrepared ? 'border-green-200' : 'border-border'
    }`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
          {directReport.avatar}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sidebar-foreground mb-1">{directReport.name}</h3>
              <p className="text-sm text-muted-foreground">{directReport.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {isPrepared && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  Prepared
                </span>
              )}
              <div className="text-right">
                <div className="text-sm text-sidebar-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {scheduledDate}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4" />
                  {scheduledTime} ({duration} min)
                </div>
              </div>
            </div>
          </div>

          {/* Context Snapshot */}
          <div className="bg-muted rounded-lg p-4 mb-3">
            <div className="text-xs text-muted-foreground mb-3">Quick Context</div>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Goals Status</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">{context.goalsOnTrack} on track</span>
                  {context.goalsAtRisk > 0 && (
                    <span className="text-sm text-red-600">{context.goalsAtRisk} at risk</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Program Progress</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${context.programProgress}%` }}
                    />
                  </div>
                  <span className="text-sm text-sidebar-foreground">{context.programProgress}%</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Session</div>
                <div className="text-sm text-sidebar-foreground">{session.lastSession}</div>
              </div>
            </div>

            {/* Recent Win or Concern */}
            {(context.recentWin || context.concern) && (
              <div className="space-y-2">
                {context.recentWin && (
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-sidebar-foreground">{context.recentWin}</span>
                  </div>
                )}
                {context.concern && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-sidebar-foreground">{context.concern}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
              {isPrepared ? 'Review Prep' : 'Prepare Session'}
            </button>
            <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors">
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
