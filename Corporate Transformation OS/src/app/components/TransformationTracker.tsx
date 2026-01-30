import { Target, FileCheck, TrendingUp, BarChart3, MessageSquare, Trophy, CheckCircle2 } from "lucide-react";

interface Stage {
  id: string;
  label: string;
  icon: typeof Target;
  status: "completed" | "current" | "upcoming";
}

const stages: Stage[] = [
  { id: "clarity", label: "Clarity", icon: Target, status: "completed" },
  { id: "commitment", label: "Commitment", icon: FileCheck, status: "completed" },
  { id: "execution", label: "Execution", icon: TrendingUp, status: "current" },
  { id: "measurement", label: "Measurement", icon: BarChart3, status: "upcoming" },
  { id: "coaching", label: "Coaching", icon: MessageSquare, status: "upcoming" },
  { id: "results", label: "Results", icon: Trophy, status: "upcoming" },
];

export function TransformationTracker() {
  return (
    <div className="mb-8 p-6 bg-card border border-border rounded-lg">
      <div className="mb-4">
        <h3 className="text-sm text-sidebar-foreground mb-1">Your Transformation Journey</h3>
        <p className="text-xs text-muted-foreground">Track your progress through the complete results framework</p>
      </div>

      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute top-[26px] left-0 right-0 h-0.5 bg-border" style={{ marginLeft: "32px", marginRight: "32px" }} />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500" 
          style={{ 
            marginLeft: "32px",
            width: `calc(${(stages.findIndex(s => s.status === "current") / (stages.length - 1)) * 100}% - 32px)`
          }} 
        />

        {/* Stages */}
        <div className="relative flex items-start justify-between">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = stage.status === "completed";
            const isCurrent = stage.status === "current";
            const isUpcoming = stage.status === "upcoming";

            return (
              <div key={stage.id} className="flex flex-col items-center" style={{ width: "120px" }}>
                {/* Icon Circle */}
                <div
                  className={`relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all ${
                    isCompleted
                      ? "bg-accent border-2 border-accent"
                      : isCurrent
                      ? "bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20"
                      : "bg-muted border-2 border-border"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                  ) : (
                    <Icon
                      className={`w-6 h-6 ${
                        isCurrent ? "text-accent-foreground" : "text-muted-foreground"
                      }`}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <div
                    className={`text-sm mb-1 ${
                      isCurrent
                        ? "text-sidebar-foreground font-medium"
                        : isCompleted
                        ? "text-sidebar-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                  </div>
                  
                  {/* Status Badge */}
                  {isCurrent && (
                    <div className="inline-block px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
                      In Progress
                    </div>
                  )}
                  {isCompleted && (
                    <div className="inline-block px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">
                      Complete
                    </div>
                  )}
                  {isUpcoming && (
                    <div className="text-xs text-muted-foreground">
                      Upcoming
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Description */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="text-sm text-sidebar-foreground mb-1">Current Stage: Execution</div>
            <div className="text-xs text-muted-foreground">
              You're actively working on your programs and goals. Focus on consistent progress and building momentum.
            </div>
          </div>
          <button className="px-4 py-2 text-xs text-accent hover:text-accent/80 transition-colors">
            View Framework Guide
          </button>
        </div>
      </div>
    </div>
  );
}
