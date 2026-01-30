import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Award,
  Video,
  FileText,
  Users,
  Lightbulb,
  Target,
  Clock,
  Play,
  Lock,
} from "lucide-react";

// Define lesson types
type LessonType = "reading" | "video" | "meeting" | "submission" | "assignment" | "goal";

interface Lesson {
  id: string;
  type: LessonType;
  title: string;
  points: number;
  completed: boolean;
  duration?: string;
}

interface Module {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "locked";
  lessons: Lesson[];
  progress: number;
}

const modules: Module[] = [
  {
    id: 1,
    title: "Kick-off",
    status: "completed",
    progress: 100,
    lessons: [
      {
        id: "1-1",
        type: "reading",
        title: "Program Overview & Welcome",
        points: 500,
        completed: true,
        duration: "15 min",
      },
    ],
  },
  {
    id: 2,
    title: "The Leader and The Manager",
    status: "completed",
    progress: 100,
    lessons: [
      { id: "2-1", type: "reading", title: "Read the Text", points: 500, completed: true, duration: "25 min" },
      { id: "2-2", type: "video", title: "Watch the Videos", points: 800, completed: true, duration: "30 min" },
      { id: "2-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: true, duration: "60 min" },
      {
        id: "2-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: true,
        duration: "15 min",
      },
      {
        id: "2-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: true,
        duration: "15 min",
      },
      {
        id: "2-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: true,
        duration: "20 min",
      },
      { id: "2-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: true, duration: "10 min" },
    ],
  },
  {
    id: 3,
    title: "Leading Yourself",
    status: "in-progress",
    progress: 71,
    lessons: [
      { id: "3-1", type: "reading", title: "Read the Text", points: 500, completed: true, duration: "25 min" },
      { id: "3-2", type: "video", title: "Watch the Videos", points: 800, completed: true, duration: "30 min" },
      { id: "3-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: true, duration: "60 min" },
      {
        id: "3-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: true,
        duration: "15 min",
      },
      {
        id: "3-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: true,
        duration: "15 min",
      },
      {
        id: "3-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: false,
        duration: "20 min",
      },
      { id: "3-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: false, duration: "10 min" },
    ],
  },
  {
    id: 4,
    title: "Planning Performance",
    status: "locked",
    progress: 0,
    lessons: [
      { id: "4-1", type: "reading", title: "Read the Text", points: 500, completed: false, duration: "25 min" },
      { id: "4-2", type: "video", title: "Watch the Videos", points: 800, completed: false, duration: "30 min" },
      { id: "4-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: false, duration: "60 min" },
      {
        id: "4-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: false,
        duration: "15 min",
      },
      {
        id: "4-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: false,
        duration: "15 min",
      },
      {
        id: "4-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: false,
        duration: "20 min",
      },
      { id: "4-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: false, duration: "10 min" },
    ],
  },
  {
    id: 5,
    title: "Coaching to Improve Performance",
    status: "locked",
    progress: 0,
    lessons: [
      { id: "5-1", type: "reading", title: "Read the Text", points: 500, completed: false, duration: "25 min" },
      { id: "5-2", type: "video", title: "Watch the Videos", points: 800, completed: false, duration: "30 min" },
      { id: "5-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: false, duration: "60 min" },
      {
        id: "5-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: false,
        duration: "15 min",
      },
      {
        id: "5-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: false,
        duration: "15 min",
      },
      {
        id: "5-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: false,
        duration: "20 min",
      },
      { id: "5-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: false, duration: "10 min" },
    ],
  },
  {
    id: 6,
    title: "Coaching For Development",
    status: "locked",
    progress: 0,
    lessons: [
      { id: "6-1", type: "reading", title: "Read the Text", points: 500, completed: false, duration: "25 min" },
      { id: "6-2", type: "video", title: "Watch the Videos", points: 800, completed: false, duration: "30 min" },
      { id: "6-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: false, duration: "60 min" },
      {
        id: "6-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: false,
        duration: "15 min",
      },
      {
        id: "6-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: false,
        duration: "15 min",
      },
      {
        id: "6-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: false,
        duration: "20 min",
      },
      { id: "6-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: false, duration: "10 min" },
    ],
  },
  {
    id: 7,
    title: "Leading A Team",
    status: "locked",
    progress: 0,
    lessons: [
      { id: "7-1", type: "reading", title: "Read the Text", points: 500, completed: false, duration: "25 min" },
      { id: "7-2", type: "video", title: "Watch the Videos", points: 800, completed: false, duration: "30 min" },
      { id: "7-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: false, duration: "60 min" },
      {
        id: "7-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: false,
        duration: "15 min",
      },
      {
        id: "7-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: false,
        duration: "15 min",
      },
      {
        id: "7-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: false,
        duration: "20 min",
      },
      { id: "7-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: false, duration: "10 min" },
    ],
  },
  {
    id: 8,
    title: "Counselling and Corrective Action",
    status: "locked",
    progress: 0,
    lessons: [
      { id: "8-1", type: "reading", title: "Read the Text", points: 500, completed: false, duration: "25 min" },
      { id: "8-2", type: "video", title: "Watch the Videos", points: 800, completed: false, duration: "30 min" },
      { id: "8-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: false, duration: "60 min" },
      {
        id: "8-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: false,
        duration: "15 min",
      },
      {
        id: "8-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: false,
        duration: "15 min",
      },
      {
        id: "8-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: false,
        duration: "20 min",
      },
      { id: "8-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: false, duration: "10 min" },
    ],
  },
  {
    id: 9,
    title: "Leadership Thinking",
    status: "locked",
    progress: 0,
    lessons: [
      { id: "9-1", type: "reading", title: "Read the Text", points: 500, completed: false, duration: "25 min" },
      { id: "9-2", type: "video", title: "Watch the Videos", points: 800, completed: false, duration: "30 min" },
      { id: "9-3", type: "meeting", title: "Mentor Meeting", points: 1500, completed: false, duration: "60 min" },
      {
        id: "9-4",
        type: "submission",
        title: "Most Useful Idea",
        points: 1000,
        completed: false,
        duration: "15 min",
      },
      {
        id: "9-5",
        type: "submission",
        title: "How You Used the Idea",
        points: 1200,
        completed: false,
        duration: "15 min",
      },
      {
        id: "9-6",
        type: "assignment",
        title: "Food for Thought",
        points: 800,
        completed: false,
        duration: "20 min",
      },
      { id: "9-7", type: "goal", title: "Enter Your Goal", points: 1000, completed: false, duration: "10 min" },
    ],
  },
];

interface ModuleViewLMSProps {
  onBack: () => void;
}

export function ModuleViewLMS({ onBack }: ModuleViewLMSProps) {
  const [currentModuleId, setCurrentModuleId] = useState(3);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(5); // Food for Thought
  const [submissionText, setSubmissionText] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const currentModule = modules.find((m) => m.id === currentModuleId)!;
  const currentLesson = currentModule.lessons[currentLessonIndex];

  const getLessonIcon = (type: LessonType) => {
    switch (type) {
      case "reading":
        return BookOpen;
      case "video":
        return Video;
      case "meeting":
        return Users;
      case "submission":
        return Lightbulb;
      case "assignment":
        return FileText;
      case "goal":
        return Target;
      default:
        return FileText;
    }
  };

  const handleNext = () => {
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else {
      // Move to next module
      const nextModule = modules.find((m) => m.id === currentModuleId + 1);
      if (nextModule && nextModule.status !== "locked") {
        setCurrentModuleId(currentModuleId + 1);
        setCurrentLessonIndex(0);
      }
    }
  };

  const handlePrevious = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else {
      // Move to previous module
      const prevModule = modules.find((m) => m.id === currentModuleId - 1);
      if (prevModule) {
        setCurrentModuleId(currentModuleId - 1);
        setCurrentLessonIndex(prevModule.lessons.length - 1);
      }
    }
  };

  const handleMarkComplete = () => {
    setShowCompleteModal(false);
    // In real app, would update lesson status
    handleNext();
  };

  const isFirstLesson = currentModuleId === 1 && currentLessonIndex === 0;
  const isLastLesson = currentModuleId === 9 && currentLessonIndex === currentModule.lessons.length - 1;

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Course Outline */}
      <div className="w-80 bg-card border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Programs
          </button>
          <h3 className="text-sidebar-foreground mb-1">LeaderShift</h3>
          <p className="text-sm text-muted-foreground">9-Module Leadership Program</p>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-auto">
          {modules.map((module) => {
            const isCurrentModule = module.id === currentModuleId;
            const completedLessons = module.lessons.filter((l) => l.completed).length;
            const totalLessons = module.lessons.length;

            return (
              <div key={module.id} className={`border-b border-border ${isCurrentModule ? "bg-muted/30" : ""}`}>
                <button
                  onClick={() => {
                    if (module.status !== "locked") {
                      setCurrentModuleId(module.id);
                      setCurrentLessonIndex(0);
                    }
                  }}
                  disabled={module.status === "locked"}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="mt-1">
                      {module.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                      ) : module.status === "in-progress" ? (
                        <Clock className="w-5 h-5 text-accent" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">Module {module.id}</div>
                      <div className="text-sm text-sidebar-foreground mb-2">{module.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {completedLessons}/{totalLessons} complete
                        </span>
                        {module.status !== "locked" && (
                          <>
                            <span>•</span>
                            <span>{module.progress}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {module.status !== "locked" && (
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${module.progress}%` }} />
                    </div>
                  )}
                </button>

                {/* Lesson List - Only show for current module */}
                {isCurrentModule && (
                  <div className="bg-background/50">
                    {module.lessons.map((lesson, index) => {
                      const Icon = getLessonIcon(lesson.type);
                      const isCurrentLesson = index === currentLessonIndex;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLessonIndex(index)}
                          className={`w-full p-3 pl-16 text-left border-t border-border/50 hover:bg-muted/30 transition-colors ${
                            isCurrentLesson ? "bg-accent/5 border-l-2 border-l-accent" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-sidebar-foreground">{lesson.title}</span>
                            {lesson.completed && <CheckCircle2 className="w-3 h-3 text-accent ml-auto" />}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{lesson.duration}</span>
                            <span>•</span>
                            <span>{lesson.points} pts</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="flex-shrink-0 border-b border-border bg-card px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Module {currentModuleId} • Lesson {currentLessonIndex + 1} of {currentModule.lessons.length}
              </div>
              <h2 className="text-sidebar-foreground">{currentLesson.title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-sm text-accent">{currentLesson.points} points</span>
              </div>
              {currentLesson.completed && (
                <div className="flex items-center gap-2 text-sm text-accent">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Reading Content */}
            {currentLesson.type === "reading" && (
              <div className="prose prose-sm max-w-none">
                <h3 className="text-sidebar-foreground mb-4">Module {currentModuleId}: {currentModule.title}</h3>
                <p className="text-muted-foreground mb-6">
                  Leadership begins with self-leadership. Before you can effectively guide others, you must first master
                  yourself. This module explores the critical components of leading yourself effectively.
                </p>

                <h4 className="text-sidebar-foreground mt-6 mb-3">Key Concepts</h4>
                <div className="space-y-4 text-muted-foreground">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h5 className="text-sidebar-foreground mb-2">1. Self-Awareness</h5>
                    <p>
                      Understanding your leadership style, strengths, and development areas is the foundation of effective
                      leadership. Self-aware leaders make better decisions and build stronger relationships.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h5 className="text-sidebar-foreground mb-2">2. Personal Accountability</h5>
                    <p>
                      Great leaders take ownership of their results and their impact on others. Accountability means
                      stopping the excuses and focusing on what you can control.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h5 className="text-sidebar-foreground mb-2">3. Emotional Intelligence</h5>
                    <p>
                      Your emotional state directly impacts your team's performance. Leaders who master their emotions
                      create more productive, engaged teams.
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-sidebar-foreground mb-2">Key Takeaway</h4>
                      <p className="text-muted-foreground">
                        The most effective leaders invest as much time developing themselves as they do developing their
                        teams. Self-leadership isn't selfish—it's essential.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Content */}
            {currentLesson.type === "video" && (
              <div>
                <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                      <Play className="w-10 h-10 text-accent ml-1" />
                    </div>
                    <p className="text-muted-foreground">Video Player Placeholder</p>
                    <p className="text-sm text-muted-foreground">{currentLesson.duration}</p>
                  </div>
                </div>

                <h3 className="text-sidebar-foreground mb-3">Video Overview</h3>
                <p className="text-muted-foreground mb-6">
                  In this video series, you'll explore practical techniques for developing self-leadership. Watch expert
                  interviews, real-world examples, and actionable strategies you can apply immediately.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4 text-accent" />
                      <span className="text-sm text-sidebar-foreground">Part 1: Self-Awareness</span>
                    </div>
                    <p className="text-xs text-muted-foreground">12:34 • Discover your leadership style</p>
                  </div>
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4 text-accent" />
                      <span className="text-sm text-sidebar-foreground">Part 2: Accountability</span>
                    </div>
                    <p className="text-xs text-muted-foreground">15:22 • Taking ownership of results</p>
                  </div>
                </div>
              </div>
            )}

            {/* Meeting Content */}
            {currentLesson.type === "meeting" && (
              <div>
                <div className="p-6 bg-muted/30 rounded-lg mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-accent" />
                    <h3 className="text-sidebar-foreground">Mentor Meeting</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Schedule a 60-minute meeting with your assigned mentor to discuss this module's concepts and how they
                    apply to your specific leadership challenges.
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
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>How do you currently practice self-leadership?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>What accountability gaps exist in your current role?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>How does your emotional state impact your team?</span>
                  </li>
                </ul>

                <div className="mt-6">
                  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                    Schedule Meeting
                  </button>
                </div>
              </div>
            )}

            {/* Submission Content */}
            {currentLesson.type === "submission" && (
              <div>
                <h3 className="text-sidebar-foreground mb-3">{currentLesson.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {currentLesson.id.includes("-4")
                    ? "Reflect on this module's content and share the single most useful idea that resonated with you. Be specific about why this concept is valuable for your leadership development."
                    : "Describe a specific situation where you applied the idea you identified. What was the context? What did you do? What was the outcome?"}
                </p>

                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Enter your response here..."
                  className="w-full h-64 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-4"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{submissionText.length} characters</span>
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    disabled={submissionText.length < 50}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            )}

            {/* Assignment Content */}
            {currentLesson.type === "assignment" && (
              <div>
                <h3 className="text-sidebar-foreground mb-3">Food for Thought</h3>
                <p className="text-muted-foreground mb-6">
                  Reflect on these questions to deepen your understanding of the module concepts. Your responses will help
                  you apply these ideas to your specific leadership context.
                </p>

                <div className="space-y-6">
                  <div className="p-6 bg-card border border-border rounded-lg">
                    <h4 className="text-sidebar-foreground mb-3">
                      1. Reflect on a recent situation where you struggled with self-leadership. What was the outcome?
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Consider the gap between your intended behavior and actual behavior.
                    </p>
                    <textarea
                      placeholder="Your reflection..."
                      className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>

                  <div className="p-6 bg-card border border-border rounded-lg">
                    <h4 className="text-sidebar-foreground mb-3">
                      2. What personal accountability gaps exist in your current role?
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Think about areas where you tend to externalize responsibility.
                    </p>
                    <textarea
                      placeholder="Your reflection..."
                      className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>

                  <div className="p-6 bg-card border border-border rounded-lg">
                    <h4 className="text-sidebar-foreground mb-3">
                      3. How does your emotional state impact your team's performance?
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">Identify specific examples from the past week.</p>
                    <textarea
                      placeholder="Your reflection..."
                      className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
                  >
                    Submit Assignment
                  </button>
                </div>
              </div>
            )}

            {/* Goal Content */}
            {currentLesson.type === "goal" && (
              <div>
                <h3 className="text-sidebar-foreground mb-3">Set Your Goal for This Period</h3>
                <p className="text-muted-foreground mb-6">
                  Based on what you've learned in this module, set a specific, measurable goal that you'll work toward over
                  the next 30 days. This goal should directly relate to the module's content.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-sidebar-foreground mb-2">Goal Statement</label>
                    <input
                      type="text"
                      placeholder="e.g., Improve self-awareness by journaling daily reflections"
                      className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-sidebar-foreground mb-2">Success Metric</label>
                    <input
                      type="text"
                      placeholder="How will you measure success?"
                      className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sidebar-foreground mb-2">Action Steps</label>
                    <textarea
                      placeholder="List specific actions you'll take to achieve this goal..."
                      className="w-full h-32 p-4 bg-input-background border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-sidebar-foreground mb-2">Target Date</label>
                      <input
                        type="date"
                        className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-sidebar-foreground mb-2">Review Frequency</label>
                      <select className="w-full p-3 bg-input-background border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
                  >
                    Save Goal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 border-t border-border bg-card px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirstLesson}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-sm text-muted-foreground">
              Lesson {currentLessonIndex + 1} of {currentModule.lessons.length}
            </div>

            {!currentLesson.completed ? (
              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                Mark Complete & Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isLastLesson}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-md mx-4 shadow-lg">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-center text-sidebar-foreground mb-2">Mark as Complete?</h3>
              <p className="text-center text-sm text-muted-foreground mb-6">
                You'll earn {currentLesson.points} points and move to the next lesson.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkComplete}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
                >
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
