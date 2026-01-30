import { CheckCircle2, Circle, Clock, BookOpen } from "lucide-react";

interface Phase {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "not-started";
  modulesCompleted: number;
  totalModules: number;
}

interface CurrentProgramTrackerProps {
  programTitle: string;
  phases: Phase[];
  progress: number;
  nextAction: string;
}

export function CurrentProgramTracker({ 
  programTitle, 
  phases, 
  progress, 
  nextAction 
}: CurrentProgramTrackerProps) {
  const currentPhaseIndex = phases.findIndex(p => p.status === "in-progress");
  const progressPercentage = currentPhaseIndex >= 0 
    ? (currentPhaseIndex / (phases.length - 1)) * 100 
    : 0;

  return (
    <div className="mb-8 p-6 bg-card border border-border rounded-lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <h3 className="text-sidebar-foreground">Current Program</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{programTitle}</p>
          <p className="text-xs text-muted-foreground">Your learning journey progress</p>
        </div>
        <div className="text-right">
          <div className="text-3xl text-sidebar-foreground mb-1">{progress}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      <div className="relative mb-6">
        {/* Progress Line Background */}
        <div 
          className="absolute top-[26px] left-0 right-0 h-0.5 bg-border" 
          style={{ marginLeft: "40px", marginRight: "40px" }} 
        />
        
        {/* Active Progress Line */}
        {currentPhaseIndex >= 0 && (
          <div 
            className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500" 
            style={{ 
              marginLeft: "40px",
              width: `calc(${progressPercentage}% - 40px)`
            }} 
          />
        )}

        {/* Phases */}
        <div className="relative flex items-start justify-between">
          {phases.map((phase, index) => {
            const isCompleted = phase.status === "completed";
            const isCurrent = phase.status === "in-progress";
            const isUpcoming = phase.status === "not-started";

            return (
              <div key={phase.id} className="flex flex-col items-center" style={{ flex: 1 }}>
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
                  ) : isCurrent ? (
                    <Clock className="w-6 h-6 text-accent-foreground" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center px-2">
                  <div
                    className={`text-sm mb-1 ${
                      isCurrent
                        ? "text-sidebar-foreground font-medium"
                        : isCompleted
                        ? "text-sidebar-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {phase.title}
                  </div>
                  
                  {/* Module Progress */}
                  <div className="text-xs text-muted-foreground">
                    {phase.modulesCompleted}/{phase.totalModules} modules
                  </div>

                  {/* Status Badge */}
                  {isCurrent && (
                    <div className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Next Action */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <div className="text-xs text-muted-foreground mb-1">NEXT ACTION</div>
          <div className="text-sm text-sidebar-foreground">{nextAction}</div>
        </div>
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
          Continue Learning
        </button>
      </div>
    </div>
  );
}
