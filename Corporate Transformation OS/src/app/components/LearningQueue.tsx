import { BookOpen, FileText, Video, ArrowRight } from "lucide-react";

interface LearningItem {
  id: string;
  type: "video" | "article" | "template";
  title: string;
  description: string;
  duration?: string;
  linkedTo?: string;
}

const learningQueue: LearningItem[] = [
  {
    id: "1",
    type: "video",
    title: "Communicating Vision Under Pressure",
    description: "Recommended based on your Team Engagement KPI",
    duration: "12 min",
    linkedTo: "Team Engagement Score",
  },
  {
    id: "2",
    type: "article",
    title: "The Science of Goal Achievement",
    description: "Align with your Q1 strategic objectives",
    duration: "8 min read",
    linkedTo: "Goal Achievement",
  },
  {
    id: "3",
    type: "template",
    title: "1:1 Coaching Conversation Framework",
    description: "Prepare for your upcoming coaching session",
    linkedTo: "1:1 Completion Rate",
  },
];

export function LearningQueue() {
  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "template":
        return FileText;
      default:
        return BookOpen;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sidebar-foreground">Learning Queue</h2>
        <p className="text-sm text-muted-foreground mt-1">Personalized content to accelerate your growth</p>
      </div>

      <div className="space-y-3">
        {learningQueue.map((item) => {
          const Icon = getIcon(item.type);
          return (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-accent/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-5 h-5 text-accent" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm">{item.title}</h4>
                    {item.duration && (
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">{item.description}</p>

                  {item.linkedTo && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs mb-3">
                      Linked to: {item.linkedTo}
                    </div>
                  )}

                  <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all mt-2">
                    {item.type === "template" ? "Download" : "Start Learning"}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
