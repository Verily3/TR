"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Lock,
  Award,
  BookOpen,
  Video,
  Users,
  FileText,
  Target,
  Lightbulb,
  Play,
} from "lucide-react";
import { Card } from "../ui";
import type { Program, Module, Lesson, LessonType } from "./types";
import { defaultPrograms } from "./data";

export interface ModuleViewLMSProps {
  /** Program data */
  program?: Program;
  /** Current module ID */
  currentModuleId?: string;
  /** Current lesson ID */
  currentLessonId?: string;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Callback when lesson is completed */
  onLessonComplete?: (lessonId: string) => void;
  /** Callback when navigating to a lesson */
  onNavigateToLesson?: (moduleId: string, lessonId: string) => void;
}

const lessonIcons: Record<LessonType, React.ComponentType<{ className?: string }>> = {
  reading: BookOpen,
  video: Video,
  meeting: Users,
  submission: Lightbulb,
  assignment: FileText,
  goal: Target,
};

interface SidebarModuleProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  currentLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
}

function SidebarModule({
  module,
  isExpanded,
  onToggle,
  currentLessonId,
  onSelectLesson,
}: SidebarModuleProps) {
  const getStatusIcon = () => {
    switch (module.status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-accent" aria-hidden="true" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-accent" aria-hidden="true" />;
      default:
        return <Lock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />;
    }
  };

  const bgClass = module.status === "in-progress" ? "bg-muted/30" : "";

  return (
    <div className={`border-b border-border ${bgClass}`}>
      <button
        className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
        onClick={onToggle}
        aria-expanded={isExpanded}
        disabled={module.status === "locked"}
      >
        <div className="flex items-start gap-3 mb-2">
          <div className="mt-1">{getStatusIcon()}</div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">Module {module.number}</div>
            <div className="text-sm text-sidebar-foreground mb-2">{module.title}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {module.lessonsCompleted}/{module.lessonsTotal} complete
              </span>
              <span aria-hidden="true">•</span>
              <span>{module.progress}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${module.progress}%` }}
          />
        </div>
      </button>

      {/* Expanded Lesson List */}
      {isExpanded && module.lessons.length > 0 && (
        <div className="bg-background/50">
          {module.lessons.map((lesson) => {
            const Icon = lessonIcons[lesson.type];
            const isCurrent = lesson.id === currentLessonId;
            const isCompleted = lesson.status === "completed";
            const isLocked = lesson.status === "locked";

            return (
              <button
                key={lesson.id}
                className={`w-full p-3 pl-16 text-left border-t border-border/50 hover:bg-muted/30 transition-colors ${
                  isCurrent ? "bg-accent/5 border-l-2 border-l-accent" : ""
                }`}
                onClick={() => !isLocked && onSelectLesson(lesson.id)}
                disabled={isLocked}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  <span
                    className={`text-xs ${
                      isCompleted
                        ? "text-muted-foreground line-through"
                        : isLocked
                        ? "text-muted-foreground"
                        : "text-sidebar-foreground"
                    }`}
                  >
                    {lesson.title}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="w-3 h-3 text-accent ml-auto" aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{lesson.duration}</span>
                  <span aria-hidden="true">•</span>
                  <span>{lesson.points} pts</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  const [charCount, setCharCount] = useState(0);

  // Render different content based on lesson type
  switch (lesson.type) {
    case "reading":
      return (
        <div className="prose prose-sm max-w-none">
          <h3 className="text-sidebar-foreground mb-4">Module 3: Leading Yourself</h3>
          <p className="text-muted-foreground mb-6">
            Leadership begins with self-leadership. Before you can effectively guide
            others, you must first master yourself. This module explores the critical
            components of leading yourself effectively.
          </p>

          <h4 className="text-sidebar-foreground mt-6 mb-3">Key Concepts</h4>
          <div className="space-y-4 text-muted-foreground">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="text-sidebar-foreground mb-2">1. Self-Awareness</h5>
              <p>
                Understanding your leadership style, strengths, and development areas is
                the foundation of effective leadership. Self-aware leaders make better
                decisions and build stronger relationships.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="text-sidebar-foreground mb-2">2. Personal Accountability</h5>
              <p>
                Great leaders take ownership of their results and their impact on others.
                Accountability means stopping the excuses and focusing on what you can
                control.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="text-sidebar-foreground mb-2">3. Emotional Intelligence</h5>
              <p>
                Your emotional state directly impacts your team's performance. Leaders who
                master their emotions create more productive, engaged teams.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h4 className="text-sidebar-foreground mb-2">Key Takeaway</h4>
                <p className="text-muted-foreground">
                  The most effective leaders invest as much time developing themselves as
                  they do developing their teams. Self-leadership isn't selfish—it's
                  essential.
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    case "video":
      return (
        <div>
          <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10 text-accent ml-1" aria-hidden="true" />
              </div>
              <p className="text-muted-foreground">Video Player Placeholder</p>
              <p className="text-sm text-muted-foreground">30 min</p>
            </div>
          </div>

          <h3 className="text-sidebar-foreground mb-3">Video Overview</h3>
          <p className="text-muted-foreground mb-6">
            In this video series, you'll explore practical techniques for developing
            self-leadership. Watch expert interviews, real-world examples, and actionable
            strategies you can apply immediately.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Card padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-accent" aria-hidden="true" />
                <span className="text-sm text-sidebar-foreground">Part 1: Self-Awareness</span>
              </div>
              <p className="text-xs text-muted-foreground">
                12:34 • Discover your leadership style
              </p>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-accent" aria-hidden="true" />
                <span className="text-sm text-sidebar-foreground">Part 2: Accountability</span>
              </div>
              <p className="text-xs text-muted-foreground">
                15:22 • Taking ownership of results
              </p>
            </Card>
          </div>
        </div>
      );

    case "meeting":
      return (
        <div>
          <div className="p-6 bg-muted/30 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-accent" aria-hidden="true" />
              <h3 className="text-sidebar-foreground">Mentor Meeting</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Schedule a 60-minute meeting with your assigned mentor to discuss this
              module's concepts and how they apply to your specific leadership challenges.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Mentor</div>
                <div className="text-sidebar-foreground">Sarah Chen</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Next Available</div>
                <div className="text-sidebar-foreground">Thursday 2:00 PM</div>
              </div>
            </div>
          </div>

          <h4 className="text-sidebar-foreground mb-3">Discussion Topics</h4>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1" aria-hidden="true">•</span>
              <span>How do you currently practice self-leadership?</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1" aria-hidden="true">•</span>
              <span>What accountability gaps exist in your current role?</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1" aria-hidden="true">•</span>
              <span>How does your emotional state impact your team?</span>
            </li>
          </ul>

          <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
            Schedule Meeting
          </button>
        </div>
      );

    case "submission":
      return (
        <div>
          <h3 className="text-sidebar-foreground mb-3">Most Useful Idea</h3>
          <p className="text-muted-foreground mb-6">
            Reflect on this module's content and share the single most useful idea that
            resonated with you. Be specific about why this concept is valuable for your
            leadership development.
          </p>

          <textarea
            placeholder="Enter your response here..."
            className="w-full h-64 p-4 bg-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-4"
            onChange={(e) => setCharCount(e.target.value.length)}
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{charCount} characters</span>
            <button
              disabled={charCount < 50}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Response
            </button>
          </div>
        </div>
      );

    case "assignment":
      return (
        <div>
          <h3 className="text-sidebar-foreground mb-3">Food for Thought</h3>
          <p className="text-muted-foreground mb-6">
            Reflect on these questions to deepen your understanding of the module concepts.
            Your responses will help you apply these ideas to your specific leadership
            context.
          </p>

          <div className="space-y-6">
            <Card padding="lg">
              <h4 className="text-sidebar-foreground mb-3">
                1. Reflect on a recent situation where you struggled with self-leadership.
                What was the outcome?
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Consider the gap between your intended behavior and actual behavior.
              </p>
              <textarea
                placeholder="Your reflection..."
                className="w-full h-32 p-4 bg-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </Card>

            <Card padding="lg">
              <h4 className="text-sidebar-foreground mb-3">
                2. What personal accountability gaps exist in your current role?
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Think about areas where you tend to externalize responsibility.
              </p>
              <textarea
                placeholder="Your reflection..."
                className="w-full h-32 p-4 bg-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </Card>

            <Card padding="lg">
              <h4 className="text-sidebar-foreground mb-3">
                3. How does your emotional state impact your team's performance?
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Identify specific examples from the past week.
              </p>
              <textarea
                placeholder="Your reflection..."
                className="w-full h-32 p-4 bg-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
              Submit Assignment
            </button>
          </div>
        </div>
      );

    case "goal":
      return (
        <div>
          <h3 className="text-sidebar-foreground mb-3">Set Your Goal for This Period</h3>
          <p className="text-muted-foreground mb-6">
            Based on what you've learned in this module, set a specific, measurable goal
            that you'll work toward over the next 30 days. This goal should directly relate
            to the module's content.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-sidebar-foreground mb-2">
                Goal Statement
              </label>
              <input
                type="text"
                placeholder="e.g., Improve self-awareness by journaling daily reflections"
                className="w-full p-3 bg-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-sidebar-foreground mb-2">
                Success Metric
              </label>
              <input
                type="text"
                placeholder="How will you measure success?"
                className="w-full p-3 bg-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sidebar-foreground mb-2">Action Steps</label>
              <textarea
                placeholder="List specific actions you'll take to achieve this goal..."
                className="w-full h-32 p-4 bg-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-sidebar-foreground mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-sidebar-foreground mb-2">
                  Review Frequency
                </label>
                <select className="w-full p-3 bg-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
              Save Goal
            </button>
          </div>
        </div>
      );

    default:
      return <div className="text-muted-foreground">Content not available</div>;
  }
}

export function ModuleViewLMS({
  program = defaultPrograms[0],
  currentModuleId,
  currentLessonId,
  onBack,
  onLessonComplete,
  onNavigateToLesson,
}: ModuleViewLMSProps) {
  // Find all modules
  const allModules = program.phases.flatMap((phase) => phase.modules);

  // Set initial states based on props or defaults
  const initialModuleIndex = currentModuleId
    ? allModules.findIndex((m) => m.id === currentModuleId)
    : allModules.findIndex((m) => m.status === "in-progress");

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    allModules[initialModuleIndex >= 0 ? initialModuleIndex : 0]?.id || null
  );

  const currentModule = allModules.find((m) => m.id === expandedModuleId) || allModules[0];

  const initialLessonId = currentLessonId ||
    currentModule?.lessons.find((l) => l.status === "current")?.id ||
    currentModule?.lessons[0]?.id;

  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(
    initialLessonId
  );

  const currentLesson = currentModule?.lessons.find((l) => l.id === selectedLessonId);
  const currentLessonIndex = currentModule?.lessons.findIndex(
    (l) => l.id === selectedLessonId
  );

  const handleModuleToggle = useCallback((moduleId: string) => {
    setExpandedModuleId((prev) => (prev === moduleId ? null : moduleId));
  }, []);

  const handleSelectLesson = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
    onNavigateToLesson?.(expandedModuleId || "", lessonId);
  }, [expandedModuleId, onNavigateToLesson]);

  const handlePrevious = useCallback(() => {
    if (currentLessonIndex !== undefined && currentLessonIndex > 0) {
      const prevLesson = currentModule?.lessons[currentLessonIndex - 1];
      if (prevLesson) {
        handleSelectLesson(prevLesson.id);
      }
    }
  }, [currentLessonIndex, currentModule, handleSelectLesson]);

  const handleNext = useCallback(() => {
    if (
      currentLessonIndex !== undefined &&
      currentModule &&
      currentLessonIndex < currentModule.lessons.length - 1
    ) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      if (nextLesson) {
        handleSelectLesson(nextLesson.id);
      }
    }
  }, [currentLessonIndex, currentModule, handleSelectLesson]);

  const handleMarkComplete = useCallback(() => {
    if (currentLesson) {
      onLessonComplete?.(currentLesson.id);
      handleNext();
    }
  }, [currentLesson, onLessonComplete, handleNext]);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Course Outline */}
      <div className="w-80 bg-card border-r border-border flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back to Programs
          </button>
          <h3 className="text-sidebar-foreground mb-1">{program.title}</h3>
          <p className="text-sm text-muted-foreground">
            {program.modulesCount}-Module Leadership Program
          </p>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto">
          {allModules.map((module) => (
            <SidebarModule
              key={module.id}
              module={module}
              isExpanded={expandedModuleId === module.id}
              onToggle={() => handleModuleToggle(module.id)}
              currentLessonId={selectedLessonId}
              onSelectLesson={handleSelectLesson}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        {currentLesson && currentModule && (
          <div className="flex-shrink-0 border-b border-border bg-card px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Module {currentModule.number} • Lesson{" "}
                  {(currentLessonIndex ?? 0) + 1} of {currentModule.lessons.length}
                </div>
                <h2 className="text-sidebar-foreground">{currentLesson.title}</h2>
              </div>
              <div className="flex items-center gap-4">
                {/* Points Badge */}
                <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
                  <Award className="w-4 h-4 text-accent" aria-hidden="true" />
                  <span className="text-sm text-accent">{currentLesson.points} points</span>
                </div>

                {/* Completed Badge */}
                {currentLesson.status === "completed" && (
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lesson Content (Scrollable) */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {currentLesson ? (
              <LessonContent lesson={currentLesson} />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Select a lesson to begin
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        {currentLesson && currentModule && (
          <div className="flex-shrink-0 border-t border-border bg-card px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <button
                disabled={currentLessonIndex === 0}
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Previous
              </button>

              {/* Lesson Counter */}
              <div className="text-sm text-muted-foreground">
                Lesson {(currentLessonIndex ?? 0) + 1} of {currentModule.lessons.length}
              </div>

              {/* Next / Mark Complete Button */}
              <button
                onClick={
                  currentLesson.status === "completed" ? handleNext : handleMarkComplete
                }
                disabled={
                  currentLesson.status === "completed" &&
                  currentLessonIndex === currentModule.lessons.length - 1
                }
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentLesson.status === "completed" ? "Next" : "Mark Complete & Continue"}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
