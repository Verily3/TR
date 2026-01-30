import { CheckCircle2, Circle, Clock } from "lucide-react";

interface ActionItemCardProps {
  item: {
    id: string;
    directReport: string;
    avatar: string;
    action: string;
    dueDate: string;
    isOverdue: boolean;
    sessionDate: string;
    status: "pending" | "overdue" | "completed";
  };
  compact?: boolean;
}

export function ActionItemCard({
  item,
  compact = false,
}: ActionItemCardProps) {
  const getStatusIcon = () => {
    switch (item.status) {
      case "completed":
        return (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        );
      case "overdue":
        return <Circle className="w-5 h-5 text-red-600" />;
      case "pending":
        return (
          <Circle className="w-5 h-5 text-muted-foreground" />
        );
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "completed":
        return "border-green-200 bg-green-50/50";
      case "overdue":
        return "border-red-200 bg-red-50/50";
      case "pending":
        return "border-border bg-card";
    }
  };

  if (compact) {
    return (
      <div
        className={`border rounded-lg p-3 flex items-center gap-3 ${getStatusColor()}`}
      >
        <button className="flex-shrink-0">
          {getStatusIcon()}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-sidebar-foreground">
              {item.action}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{item.directReport}</span>
            <span>•</span>
            <span
              className={item.isOverdue ? "text-red-600" : ""}
            >
              Due {item.dueDate}
            </span>
          </div>
        </div>
        <button className="px-3 py-1.5 border border-border rounded text-xs text-sidebar-foreground hover:bg-background transition-colors">
          Follow Up
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-4 ${getStatusColor()}`}
    >
      <div className="flex items-start gap-3">
        <button className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-sm text-sidebar-foreground mb-1">
                {item.action}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs">
                  {item.avatar}
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.directReport}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>From session on {item.sessionDate}</span>
            </div>
            <span>•</span>
            <span
              className={
                item.isOverdue ? "text-red-600 font-medium" : ""
              }
            >
              Due {item.dueDate}
              {item.isOverdue && " (Overdue)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {item.status !== "completed" && (
              <>
                <button className="px-3 py-1.5 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90 transition-colors">
                  Mark Complete
                </button>
                <button className="px-3 py-1.5 border border-border rounded text-sm text-sidebar-foreground hover:bg-background transition-colors">
                  Follow Up
                </button>
              </>
            )}
            {item.status === "completed" && (
              <span className="text-sm text-green-600 font-medium">
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}