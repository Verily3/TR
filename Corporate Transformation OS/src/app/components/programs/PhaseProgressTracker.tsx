import { CheckCircle2, Circle, Clock } from "lucide-react";

interface Phase {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "not-started";
}

interface PhaseProgressTrackerProps {
  phases: Phase[];
}

export function PhaseProgressTracker({ phases }: PhaseProgressTrackerProps) {
  const currentPhaseIndex = phases.findIndex(p => p.status === "in-progress");
  const progressPercentage = currentPhaseIndex >= 0 
    ? (currentPhaseIndex / (phases.length - 1)) * 100 
    : 0;

  return (
    <div className="mb-6 p-5 bg-muted/30 rounded-lg">
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1">PROGRAM PHASES</div>
        <div className="text-sm text-sidebar-foreground">
          Phase {currentPhaseIndex + 1} of {phases.length}
        </div>
      </div>

      <div className="relative">
        {/* Progress Line Background */}
        <div 
          className="absolute top-[18px] left-0 right-0 h-0.5 bg-border" 
          style={{ marginLeft: "18px", marginRight: "18px" }} 
        />
        
        {/* Active Progress Line */}
        {currentPhaseIndex >= 0 && (
          <div 
            className="absolute top-[18px] left-0 h-0.5 bg-accent transition-all duration-500" 
            style={{ 
              marginLeft: "18px",
              width: `calc(${progressPercentage}% - 18px)`
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
                  className={`relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center mb-2 transition-all ${
                    isCompleted
                      ? "bg-accent border-2 border-accent"
                      : isCurrent
                      ? "bg-accent border-3 border-accent/20 shadow-md shadow-accent/20"
                      : "bg-card border-2 border-border"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-accent-foreground" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center px-1">
                  <div
                    className={`text-xs ${
                      isCurrent
                        ? "text-sidebar-foreground font-medium"
                        : isCompleted
                        ? "text-sidebar-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {phase.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
