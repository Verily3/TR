import { useState } from "react";
import { Plus, Filter, TrendingUp } from "lucide-react";
import { ProgramCard } from "@/app/components/programs/ProgramCard";

type ProgramStatus = "all" | "in-progress" | "not-started" | "completed";

interface ProgramsPageProps {
  onNavigateToProgram?: (programId: string) => void;
}

// Mock program data for the catalog
const mockPrograms = [
  {
    id: "leadershift",
    title: "LeaderShift",
    track: "Leadership Track",
    description: "Transform from manager to high-impact leader through 9 comprehensive modules",
    progress: 27,
    dueDate: "April 15, 2026",
    status: "in-progress" as const,
    linkedGoals: ["Improve Team Engagement Score", "Develop Coaching Capability"],
    nextAction: "Continue Module 3: Leading Yourself - Lesson 6",
    phases: [
      {
        id: "phase-1",
        title: "Foundation",
        modulesCompleted: 2,
        totalModules: 3,
        status: "in-progress" as const,
        modules: [
          {
            id: "mod-1",
            title: "Module 1: Leadership vs Management",
            lessonsCompleted: 7,
            totalLessons: 7,
            status: "completed" as const,
            lessons: [
              { id: "l1", title: "Reading: Leadership Fundamentals", duration: "20 min", status: "completed" as const },
              { id: "l2", title: "Video: The Leadership Mindset", duration: "25 min", status: "completed" as const },
              { id: "l3", title: "Mentor Session", duration: "60 min", status: "completed" as const },
              { id: "l4", title: "Reflection Submission", duration: "15 min", status: "completed" as const },
              { id: "l5", title: "Assignment: Leadership Audit", duration: "30 min", status: "completed" as const },
              { id: "l6", title: "Goal Setting", duration: "20 min", status: "completed" as const },
              { id: "l7", title: "Module Assessment", duration: "15 min", status: "completed" as const },
            ],
          },
          {
            id: "mod-2",
            title: "Module 2: Self-Awareness",
            lessonsCompleted: 7,
            totalLessons: 7,
            status: "completed" as const,
            lessons: [
              { id: "l1", title: "Reading: Emotional Intelligence", duration: "25 min", status: "completed" as const },
              { id: "l2", title: "Video: Understanding Your Impact", duration: "30 min", status: "completed" as const },
              { id: "l3", title: "Mentor Session", duration: "60 min", status: "completed" as const },
              { id: "l4", title: "Reflection Submission", duration: "15 min", status: "completed" as const },
              { id: "l5", title: "Assignment: 360 Analysis", duration: "30 min", status: "completed" as const },
              { id: "l6", title: "Goal Setting", duration: "20 min", status: "completed" as const },
              { id: "l7", title: "Module Assessment", duration: "15 min", status: "completed" as const },
            ],
          },
          {
            id: "mod-3",
            title: "Module 3: Leading Yourself",
            lessonsCompleted: 5,
            totalLessons: 7,
            status: "in-progress" as const,
            lessons: [
              { id: "l1", title: "Reading: Personal Leadership", duration: "20 min", status: "completed" as const },
              { id: "l2", title: "Video: Building Resilience", duration: "25 min", status: "completed" as const },
              { id: "l3", title: "Mentor Session", duration: "60 min", status: "completed" as const },
              { id: "l4", title: "Reflection Submission", duration: "15 min", status: "completed" as const },
              { id: "l5", title: "Assignment: Development Plan", duration: "30 min", status: "completed" as const },
              { id: "l6", title: "Goal Setting", duration: "20 min", status: "in-progress" as const },
              { id: "l7", title: "Module Assessment", duration: "15 min", status: "not-started" as const },
            ],
          },
        ],
      },
      {
        id: "phase-2",
        title: "Team Leadership",
        modulesCompleted: 0,
        totalModules: 3,
        status: "not-started" as const,
        modules: [
          {
            id: "mod-4",
            title: "Module 4: Performance Planning",
            lessonsCompleted: 0,
            totalLessons: 7,
            status: "not-started" as const,
            lessons: [],
          },
          {
            id: "mod-5",
            title: "Module 5: Coaching & Development",
            lessonsCompleted: 0,
            totalLessons: 7,
            status: "not-started" as const,
            lessons: [],
          },
          {
            id: "mod-6",
            title: "Module 6: Building High-Performing Teams",
            lessonsCompleted: 0,
            totalLessons: 7,
            status: "not-started" as const,
            lessons: [],
          },
        ],
      },
      {
        id: "phase-3",
        title: "Strategic Leadership",
        modulesCompleted: 0,
        totalModules: 3,
        status: "not-started" as const,
        modules: [
          {
            id: "mod-7",
            title: "Module 7: Difficult Conversations",
            lessonsCompleted: 0,
            totalLessons: 7,
            status: "not-started" as const,
            lessons: [],
          },
          {
            id: "mod-8",
            title: "Module 8: Corrective Action",
            lessonsCompleted: 0,
            totalLessons: 7,
            status: "not-started" as const,
            lessons: [],
          },
          {
            id: "mod-9",
            title: "Module 9: Strategic Thinking",
            lessonsCompleted: 0,
            totalLessons: 7,
            status: "not-started" as const,
            lessons: [],
          },
        ],
      },
    ],
  },
  {
    id: "executive-presence",
    title: "Executive Presence",
    track: "Leadership Track",
    description: "Develop gravitas, communication skills, and executive-level influence",
    progress: 0,
    dueDate: "June 30, 2026",
    status: "not-started" as const,
    linkedGoals: [],
    nextAction: "",
    phases: [
      {
        id: "phase-1",
        title: "Communication Mastery",
        modulesCompleted: 0,
        totalModules: 2,
        status: "not-started" as const,
        modules: [
          {
            id: "mod-1",
            title: "Module 1: Executive Communication",
            lessonsCompleted: 0,
            totalLessons: 6,
            status: "not-started" as const,
            lessons: [],
          },
          {
            id: "mod-2",
            title: "Module 2: Influential Storytelling",
            lessonsCompleted: 0,
            totalLessons: 6,
            status: "not-started" as const,
            lessons: [],
          },
        ],
      },
      {
        id: "phase-2",
        title: "Personal Brand",
        modulesCompleted: 0,
        totalModules: 2,
        status: "not-started" as const,
        modules: [
          {
            id: "mod-3",
            title: "Module 3: Building Credibility",
            lessonsCompleted: 0,
            totalLessons: 6,
            status: "not-started" as const,
            lessons: [],
          },
          {
            id: "mod-4",
            title: "Module 4: Executive Presence",
            lessonsCompleted: 0,
            totalLessons: 6,
            status: "not-started" as const,
            lessons: [],
          },
        ],
      },
    ],
  },
  {
    id: "strategic-planning",
    title: "Strategic Planning & Execution",
    track: "Strategy Track",
    description: "Master strategic thinking, planning frameworks, and execution methodologies",
    progress: 100,
    dueDate: "December 15, 2025",
    status: "completed" as const,
    linkedGoals: ["Develop Strategic Planning Skills"],
    nextAction: "",
    phases: [
      {
        id: "phase-1",
        title: "Strategic Foundation",
        modulesCompleted: 3,
        totalModules: 3,
        status: "completed" as const,
        modules: [
          {
            id: "mod-1",
            title: "Module 1: Strategic Thinking",
            lessonsCompleted: 5,
            totalLessons: 5,
            status: "completed" as const,
            lessons: [],
          },
          {
            id: "mod-2",
            title: "Module 2: Market Analysis",
            lessonsCompleted: 5,
            totalLessons: 5,
            status: "completed" as const,
            lessons: [],
          },
          {
            id: "mod-3",
            title: "Module 3: Strategy Development",
            lessonsCompleted: 5,
            totalLessons: 5,
            status: "completed" as const,
            lessons: [],
          },
        ],
      },
    ],
  },
];

export function ProgramsPage({ onNavigateToProgram }: ProgramsPageProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProgramStatus>("all");

  // Filter programs
  const filteredPrograms = mockPrograms.filter((program) => {
    if (selectedStatus === "all") return true;
    return program.status === selectedStatus;
  });

  // Stats
  const totalPrograms = mockPrograms.length;
  const inProgress = mockPrograms.filter((p) => p.status === "in-progress").length;
  const completed = mockPrograms.filter((p) => p.status === "completed").length;
  const notStarted = mockPrograms.filter((p) => p.status === "not-started").length;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-sidebar-foreground mb-2">Programs</h1>
            <p className="text-muted-foreground">
              Structured learning paths to develop capabilities and drive results
            </p>
          </div>

          <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Enroll in Program
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Programs</div>
            <div className="text-2xl text-sidebar-foreground">{totalPrograms}</div>
          </div>
          <div className="bg-card border border-blue-200 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">In Progress</div>
            <div className="text-2xl text-blue-600">{inProgress}</div>
          </div>
          <div className="bg-card border border-green-200 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Completed</div>
            <div className="text-2xl text-green-600">{completed}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Not Started</div>
            <div className="text-2xl text-muted-foreground">{notStarted}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            {[
              { value: "all", label: "All Programs" },
              { value: "in-progress", label: "In Progress" },
              { value: "not-started", label: "Not Started" },
              { value: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value as ProgramStatus)}
                className={`px-4 py-2 rounded text-sm transition-colors ${
                  selectedStatus === tab.value
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-background"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="text-sm text-muted-foreground">
            Showing {filteredPrograms.length} of {totalPrograms} programs
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-4">
          {filteredPrograms.map((program) => (
            <ProgramCard 
              key={program.id} 
              program={program} 
              onClick={() => onNavigateToProgram?.(program.id)}
            />
          ))}

          {filteredPrograms.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No programs found for the selected filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}