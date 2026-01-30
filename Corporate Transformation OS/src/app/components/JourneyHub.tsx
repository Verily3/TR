import { ArrowRight, PlayCircle, Target, FileText, TrendingUp, BookOpen, Award } from "lucide-react";
import { LeaderShiftTracker } from "@/app/components/programs/LeaderShiftTracker";

interface DynamicBlock {
  id: string;
  type: "onboarding" | "program" | "execution";
  title: string;
  description: string;
  action: string;
  progress?: number;
  icon: any;
  accentColor?: string;
  onClick?: () => void;
}

export function JourneyHub({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const journeyBlocks: DynamicBlock[] = [
    {
      id: "1",
      type: "program",
      title: "LeaderShift: Module 3 - Leading Yourself",
      description: "5 of 7 tasks complete • 1,200 points earned",
      action: "Continue Module",
      progress: 71,
      icon: PlayCircle,
      onClick: () => onNavigate?.("module-view"),
    },
    {
      id: "2",
      type: "execution",
      title: "Submit Module 3 Goal",
      description: "Due tomorrow • Worth 1,000 points",
      action: "Enter Goal",
      icon: Target,
      onClick: () => onNavigate?.("module-view"),
    },
    {
      id: "3",
      type: "program",
      title: "Mentor Meeting Scheduled",
      description: "Thursday 2pm with Sarah Chen",
      action: "View Details",
      icon: FileText,
    },
    {
      id: "4",
      type: "execution",
      title: "2 Team KPIs Need Update",
      description: "Weekly review due Friday",
      action: "Update KPIs",
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sidebar-foreground">Journey Hub</h2>
        <p className="text-sm text-muted-foreground mt-1">Your next actions to accelerate progress</p>
      </div>

      {/* LeaderShift Program Progress Tracker */}
      <LeaderShiftTracker onContinue={() => onNavigate?.("program-detail")} />

      <div className="grid grid-cols-2 gap-4">
        {journeyBlocks.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.id}
              className="bg-card border border-border rounded-lg p-5 hover:border-accent/30 transition-all cursor-pointer group"
              onClick={block.onClick}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm mb-1">{block.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{block.description}</p>

                  {block.progress !== undefined && (
                    <div className="mb-4">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${block.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{block.progress}% complete</div>
                    </div>
                  )}

                  <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                    {block.action}
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