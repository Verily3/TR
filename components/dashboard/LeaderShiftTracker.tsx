"use client";

import { BookOpen, CheckCircle2 } from "lucide-react";

interface Module {
  id: number;
  name: string;
  tasksCompleted: number;
  totalTasks: number;
  status: "completed" | "in-progress" | "not-started";
}

const defaultModules: Module[] = [
  { id: 1, name: "Kick-off", tasksCompleted: 1, totalTasks: 1, status: "completed" },
  { id: 2, name: "The Leader and The Manager", tasksCompleted: 6, totalTasks: 6, status: "completed" },
  { id: 3, name: "Leading Yourself", tasksCompleted: 5, totalTasks: 7, status: "in-progress" },
  { id: 4, name: "Planning Performance", tasksCompleted: 0, totalTasks: 5, status: "not-started" },
  { id: 5, name: "Coaching to Improve Performance", tasksCompleted: 0, totalTasks: 6, status: "not-started" },
  { id: 6, name: "Coaching For Development", tasksCompleted: 0, totalTasks: 5, status: "not-started" },
  { id: 7, name: "Leading A Team", tasksCompleted: 0, totalTasks: 7, status: "not-started" },
  { id: 8, name: "Counselling and Corrective Action", tasksCompleted: 0, totalTasks: 4, status: "not-started" },
  { id: 9, name: "Leadership Thinking", tasksCompleted: 0, totalTasks: 5, status: "not-started" },
];

interface LeaderShiftTrackerProps {
  programName?: string;
  modules?: Module[];
  onContinue?: () => void;
}

export function LeaderShiftTracker({
  programName = "LeaderShift",
  modules = defaultModules,
  onContinue,
}: LeaderShiftTrackerProps) {
  const completedModules = modules.filter((m) => m.status === "completed").length;
  const currentModule = modules.find((m) => m.status === "in-progress");
  const totalTasks = modules.reduce((sum, m) => sum + m.totalTasks, 0);
  const completedTasks = modules.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const overallProgress = Math.round((completedTasks / totalTasks) * 100);

  // Calculate progress line width based on current module position
  const currentModuleIndex = modules.findIndex((m) => m.status === "in-progress");
  const progressLinePercent =
    currentModuleIndex >= 0
      ? ((currentModuleIndex + 0.5) / (modules.length - 1)) * 100
      : (completedModules / (modules.length - 1)) * 100;

  return (
    <div className="mb-8 p-6 bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <h3 className="text-sidebar-foreground">Current Program</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{programName}</p>
          <p className="text-xs text-muted-foreground">
            {modules.length}-Module Leadership Development Program
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl text-sidebar-foreground mb-1">{overallProgress}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Module Progress Tracker */}
      <div className="relative mb-6">
        {/* Background Line */}
        <div
          className="absolute top-[26px] left-0 right-0 h-0.5 bg-border"
          style={{ marginLeft: "20px", marginRight: "20px" }}
        />

        {/* Active Progress Line */}
        <div
          className="absolute top-[26px] left-0 h-0.5 bg-accent transition-all duration-500"
          style={{
            marginLeft: "20px",
            width: `calc(${progressLinePercent}% - 20px)`,
          }}
        />

        {/* Modules */}
        <div className="relative flex items-start justify-between">
          {modules.map((module) => (
            <div
              key={module.id}
              className="flex flex-col items-center"
              style={{ width: "80px" }}
            >
              {/* Icon Circle */}
              <div
                className={`relative z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3 transition-all ${
                  module.status === "completed"
                    ? "bg-accent border-2 border-accent"
                    : module.status === "in-progress"
                    ? "bg-accent border-4 border-accent/30 shadow-lg shadow-accent/20"
                    : "bg-muted border-2 border-border"
                }`}
              >
                {module.status === "completed" ? (
                  <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                ) : (
                  <div
                    className={`text-lg ${
                      module.status === "in-progress"
                        ? "text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {module.id}
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <div
                  className={`text-xs mb-1 line-clamp-2 ${
                    module.status === "in-progress"
                      ? "text-sidebar-foreground font-medium"
                      : module.status === "completed"
                      ? "text-sidebar-foreground"
                      : "text-muted-foreground"
                  }`}
                  style={{ minHeight: "32px" }}
                >
                  {module.name}
                </div>
                {module.status !== "not-started" && (
                  <div className="text-xs text-muted-foreground">
                    {module.tasksCompleted}/{module.totalTasks} tasks
                  </div>
                )}
                {module.status === "in-progress" && (
                  <div className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
                    In Progress
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Next Action Footer */}
      {currentModule && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground mb-1">NEXT ACTION</div>
            <div className="text-sm text-sidebar-foreground">
              Complete Module {currentModule.id}: {currentModule.name}
            </div>
          </div>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
          >
            Continue Learning
          </button>
        </div>
      )}
    </div>
  );
}
