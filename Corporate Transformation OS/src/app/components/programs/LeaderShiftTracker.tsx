import { CheckCircle2, Circle, Clock, BookOpen } from "lucide-react";

interface Module {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "not-started";
  tasksCompleted: number;
  totalTasks: number;
}

interface LeaderShiftTrackerProps {
  onContinue: () => void;
}

const modules: Module[] = [
  { id: 1, title: "Kick-off", status: "completed", tasksCompleted: 1, totalTasks: 1 },
  { id: 2, title: "The Leader and The Manager", status: "completed", tasksCompleted: 7, totalTasks: 7 },
  { id: 3, title: "Leading Yourself", status: "in-progress", tasksCompleted: 5, totalTasks: 7 },
  { id: 4, title: "Planning Performance", status: "not-started", tasksCompleted: 0, totalTasks: 7 },
  { id: 5, title: "Coaching to Improve Performance", status: "not-started", tasksCompleted: 0, totalTasks: 7 },
  { id: 6, title: "Coaching For Development", status: "not-started", tasksCompleted: 0, totalTasks: 7 },
  { id: 7, title: "Leading A Team", status: "not-started", tasksCompleted: 0, totalTasks: 7 },
  { id: 8, title: "Counselling and Corrective Action", status: "not-started", tasksCompleted: 0, totalTasks: 7 },
  { id: 9, title: "Leadership Thinking", status: "not-started", tasksCompleted: 0, totalTasks: 7 },
];

export function LeaderShiftTracker({ onContinue }: LeaderShiftTrackerProps) {
  const currentModuleIndex = modules.findIndex((m) => m.status === "in-progress");
  const completedModules = modules.filter((m) => m.status === "completed").length;
  const totalProgress = Math.round((completedModules / modules.length) * 100 + (100 / modules.length) * 0.71); // 2 complete + 71% of module 3

  return (
    <div className="mb-8 p-6 bg-card border border-border rounded-lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <h3 className="text-sidebar-foreground">Current Program</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">LeaderShift</p>
          <p className="text-xs text-muted-foreground">9-Module Leadership Development Program</p>
        </div>
        <div className="text-right">
          <div className="text-3xl text-sidebar-foreground mb-1">{totalProgress}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Module Progress Tracker */}
      <div className="relative mb-6">
        {/* Background Line */}
        <div className="absolute top-[26px] left-0 right-0 h-0.5 bg-border" style={{ marginLeft: "20px", marginRight: "20px" }} />

        {/* Active Progress Line */}
        <div
          className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500"
          style={{
            marginLeft: "20px",
            width: `calc(${(currentModuleIndex / (modules.length - 1)) * 100}% - 20px)`,
          }}
        />

        {/* Modules */}
        <div className="relative flex items-start justify-between">
          {modules.map((module, index) => {
            const isCompleted = module.status === "completed";
            const isCurrent = module.status === "in-progress";
            const isUpcoming = module.status === "not-started";

            return (
              <div key={module.id} className="flex flex-col items-center" style={{ width: "80px" }}>
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
                    <div className="text-lg text-accent-foreground">{module.id}</div>
                  ) : (
                    <div className="text-lg text-muted-foreground">{module.id}</div>
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <div
                    className={`text-xs mb-1 line-clamp-2 ${
                      isCurrent
                        ? "text-sidebar-foreground font-medium"
                        : isCompleted
                        ? "text-sidebar-foreground"
                        : "text-muted-foreground"
                    }`}
                    style={{ minHeight: "32px" }}
                  >
                    {module.title}
                  </div>

                  {/* Task Progress */}
                  {(isCompleted || isCurrent) && (
                    <div className="text-xs text-muted-foreground">
                      {module.tasksCompleted}/{module.totalTasks} tasks
                    </div>
                  )}

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
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${totalProgress}%` }} />
        </div>
      </div>

      {/* Next Action */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <div className="text-xs text-muted-foreground mb-1">NEXT ACTION</div>
          <div className="text-sm text-sidebar-foreground">Complete Module 3: Leading Yourself</div>
        </div>
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
}
