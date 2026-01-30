import { User, ClipboardCheck, Target, BookOpen, Users, Rocket, CheckCircle2 } from "lucide-react";

interface OnboardingStep {
  id: string;
  label: string;
  icon: typeof User;
  status: "completed" | "current" | "upcoming";
}

const onboardingSteps: OnboardingStep[] = [
  { id: "profile", label: "Profile Setup", icon: User, status: "completed" },
  { id: "assessment", label: "Assessment", icon: ClipboardCheck, status: "completed" },
  { id: "goals", label: "Goal Setting", icon: Target, status: "current" },
  { id: "programs", label: "Program Selection", icon: BookOpen, status: "upcoming" },
  { id: "team", label: "Team Connection", icon: Users, status: "upcoming" },
  { id: "launch", label: "Ready to Launch", icon: Rocket, status: "upcoming" },
];

export function OnboardingTracker() {
  const currentStepIndex = onboardingSteps.findIndex(s => s.status === "current");
  const completedSteps = onboardingSteps.filter(s => s.status === "completed").length;
  const totalSteps = onboardingSteps.length;
  const progressPercentage = (completedSteps / (totalSteps - 1)) * 100;

  return (
    <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sidebar-foreground mb-1">Welcome to Results Tracking System</h3>
            <p className="text-sm text-muted-foreground">Complete your onboarding to unlock the full platform</p>
          </div>
          <div className="text-right">
            <div className="text-2xl text-sidebar-foreground">{completedSteps}/{totalSteps}</div>
            <div className="text-xs text-muted-foreground">Steps Complete</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute top-[26px] left-0 right-0 h-0.5 bg-blue-200" style={{ marginLeft: "32px", marginRight: "32px" }} />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500" 
          style={{ 
            marginLeft: "32px",
            width: `calc(${progressPercentage}% - 32px)`
          }} 
        />

        {/* Steps */}
        <div className="relative flex items-start justify-between">
          {onboardingSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";
            const isUpcoming = step.status === "upcoming";

            return (
              <div key={step.id} className="flex flex-col items-center" style={{ width: "110px" }}>
                {/* Icon Circle */}
                <div
                  className={`relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all ${
                    isCompleted
                      ? "bg-accent border-2 border-accent"
                      : isCurrent
                      ? "bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20 animate-pulse"
                      : "bg-white border-2 border-blue-200"
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
                    className={`text-xs mb-1 ${
                      isCurrent
                        ? "text-sidebar-foreground font-medium"
                        : isCompleted
                        ? "text-sidebar-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </div>
                  
                  {/* Step Number */}
                  <div className="text-xs text-muted-foreground">
                    Step {index + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step CTA */}
      {currentStepIndex >= 0 && (
        <div className="mt-6 pt-6 border-t border-blue-200 flex items-center justify-between">
          <div>
            <div className="text-sm text-sidebar-foreground mb-1">
              Next: {onboardingSteps[currentStepIndex].label}
            </div>
            <div className="text-xs text-muted-foreground">
              Set your quarterly goals to align your learning with results
            </div>
          </div>
          <button className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors shadow-sm">
            Continue Setup
          </button>
        </div>
      )}
    </div>
  );
}
