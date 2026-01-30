import { AlertCircle, Clock, TrendingDown } from "lucide-react";

interface AttentionItem {
  id: string;
  type: "overdue" | "at-risk" | "stalled";
  goalTitle: string;
  issue: string;
  owner: string;
}

const attentionItems: AttentionItem[] = [
  {
    id: "1",
    type: "at-risk",
    goalTitle: "Increase team productivity by 15%",
    issue: "KPI trending down for 2 weeks",
    owner: "You",
  },
  {
    id: "2",
    type: "overdue",
    goalTitle: "Complete Q4 strategic review",
    issue: "Due 3 days ago",
    owner: "Sarah Johnson",
  },
];

export function NeedsAttention() {
  if (attentionItems.length === 0) return null;

  const typeConfig = {
    overdue: { icon: Clock, color: "text-accent", bg: "bg-red-50", border: "border-red-200" },
    "at-risk": { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    stalled: { icon: TrendingDown, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  };

  return (
    <div className="mb-8 p-5 bg-red-50/50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-accent" />
        <h3 className="text-sidebar-foreground">Needs Attention</h3>
        <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs">
          {attentionItems.length}
        </span>
      </div>

      <div className="space-y-2">
        {attentionItems.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className={`bg-card border ${config.border} rounded-lg p-4 flex items-start gap-3`}
            >
              <div className={`p-2 rounded-lg ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>

              <div className="flex-1">
                <h4 className="text-sm text-sidebar-foreground mb-1">{item.goalTitle}</h4>
                <div className="text-xs text-muted-foreground mb-2">{item.issue}</div>
                <div className="text-xs text-muted-foreground">Owner: {item.owner}</div>
              </div>

              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                Review
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
