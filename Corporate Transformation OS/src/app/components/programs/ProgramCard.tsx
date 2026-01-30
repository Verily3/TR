import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Target, CheckCircle2, Circle, Clock } from "lucide-react";
import { PhaseProgressTracker } from "@/app/components/programs/PhaseProgressTracker";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  status: "completed" | "in-progress" | "not-started";
}

interface Module {
  id: string;
  title: string;
  lessonsCompleted: number;
  totalLessons: number;
  status: "completed" | "in-progress" | "not-started";
  lessons: Lesson[];
}

interface Phase {
  id: string;
  title: string;
  modulesCompleted: number;
  totalModules: number;
  status: "completed" | "in-progress" | "not-started";
  modules: Module[];
}

interface Program {
  id: string;
  title: string;
  track: string;
  description: string;
  progress: number;
  dueDate: string;
  status: "completed" | "in-progress" | "not-started";
  linkedGoals: string[];
  phases: Phase[];
  nextAction: string;
}

interface ProgramCardProps {
  program: Program;
  onClick?: () => void;
}

export function ProgramCard({ program, onClick }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const statusConfig = {
    completed: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    "in-progress": { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    "not-started": { color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  };

  const config = statusConfig[program.status];

  const getStatusIcon = (status: "completed" | "in-progress" | "not-started") => {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === "in-progress") return <Clock className="w-4 h-4 text-blue-600" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className={`bg-card border ${config.border} rounded-lg overflow-hidden`}>
      {/* Main Card Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className={`w-5 h-5 ${config.color}`} />
              <h3 className="text-sidebar-foreground">{program.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{program.description}</p>
            <div className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              {program.track}
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
            {program.status === "in-progress" ? "IN PROGRESS" : program.status === "completed" ? "COMPLETED" : "NOT STARTED"}
          </div>
        </div>

        {/* Progress Bar */}
        {program.status !== "not-started" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-sidebar-foreground">{program.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${program.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Next Action */}
        {program.status === "in-progress" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 mb-1">Next Action</div>
            <div className="text-sm text-sidebar-foreground">{program.nextAction}</div>
          </div>
        )}

        {/* Linked Goals */}
        {program.linkedGoals.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">LINKED TO GOALS</div>
            <div className="flex flex-wrap gap-2">
              {program.linkedGoals.map((goal) => (
                <div key={goal} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded text-xs text-sidebar-foreground">
                  <Target className="w-3 h-3 text-accent" />
                  {goal}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Due Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Due: {program.dueDate}</span>
          <span>{program.phases.length} Phases</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          {onClick && (
            <button
              onClick={onClick}
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              {program.status === "in-progress" ? "Continue Program" : program.status === "completed" ? "Review Program" : "Start Program"}
            </button>
          )}
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-3 border-t border-border"
        >
          {expanded ? "Hide Curriculum" : "View Curriculum"}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Curriculum */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-5">
          {/* Phase Progress Tracker */}
          <PhaseProgressTracker 
            phases={program.phases.map(p => ({
              id: p.id,
              title: p.title,
              status: p.status
            }))} 
          />

          <div className="text-xs text-muted-foreground mb-4">CURRICULUM STRUCTURE</div>
          <div className="space-y-3">
            {program.phases.map((phase) => (
              <div key={phase.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(phase.status)}
                    <div className="text-left">
                      <div className="text-sm text-sidebar-foreground mb-1">{phase.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {phase.modulesCompleted} of {phase.totalModules} modules completed
                      </div>
                    </div>
                  </div>
                  {expandedPhase === phase.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {expandedPhase === phase.id && (
                  <div className="px-4 pb-4 space-y-2">
                    {phase.modules.map((module) => (
                      <div key={module.id} className="pl-8 py-2 border-l-2 border-border">
                        <div className="flex items-start gap-2 mb-2">
                          {getStatusIcon(module.status)}
                          <div className="flex-1">
                            <div className="text-sm text-sidebar-foreground">{module.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {module.lessonsCompleted} of {module.totalLessons} lessons
                            </div>
                          </div>
                        </div>

                        {/* Lessons */}
                        <div className="ml-6 mt-2 space-y-1">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-2 text-xs">
                              {getStatusIcon(lesson.status)}
                              <span className={lesson.status === "completed" ? "text-muted-foreground line-through" : "text-sidebar-foreground"}>
                                {lesson.title}
                              </span>
                              <span className="text-muted-foreground">• {lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}