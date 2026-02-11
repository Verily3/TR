/**
 * Default mock data for Programs module
 */

import type {
  Program,
  ProgramsStats,
  LearningOutcome,
  ProgramStructureItem,
} from "./types";

/** Programs stats */
export const defaultProgramsStats: ProgramsStats = {
  total: 3,
  inProgress: 1,
  completed: 1,
  notStarted: 1,
};

/** Default programs list */
export const defaultPrograms: Program[] = [
  {
    id: "program-1",
    title: "LeaderShift",
    description:
      "Transform from manager to high-impact leader through 9 comprehensive modules",
    track: "Leadership Track",
    trackColor: "purple",
    status: "in-progress",
    progress: 27,
    dueDate: "April 15, 2026",
    phasesCount: 3,
    modulesCount: 9,
    duration: "~12 weeks",
    totalPoints: 61200,
    earnedPoints: 11800,
    linkedGoals: [
      {
        id: "goal-1",
        title: "Improve Team Engagement Score",
        period: "Q1 2026",
        type: "Individual Goal",
        progress: 72,
      },
      {
        id: "goal-2",
        title: "Develop Coaching Capability",
        period: "H1 2026",
        type: "Development Goal",
        progress: 45,
      },
    ],
    nextAction: "Continue Module 3: Leading Yourself - Lesson 6",
    phases: [
      {
        id: "phase-1",
        name: "Foundation",
        modulesCompleted: 2,
        modulesTotal: 3,
        status: "current",
        modules: [
          {
            id: "module-1",
            number: 1,
            title: "Leadership vs Management",
            lessonsCompleted: 7,
            lessonsTotal: 7,
            progress: 100,
            status: "completed",
            lessons: [
              { id: "l-1-1", title: "Read the Text", type: "reading", duration: "25 min", points: 500, status: "completed" },
              { id: "l-1-2", title: "Watch the Videos", type: "video", duration: "30 min", points: 800, status: "completed" },
              { id: "l-1-3", title: "Mentor Meeting", type: "meeting", duration: "60 min", points: 1500, status: "completed" },
              { id: "l-1-4", title: "Most Useful Idea", type: "submission", duration: "15 min", points: 1000, status: "completed" },
              { id: "l-1-5", title: "How You Used the Idea", type: "submission", duration: "15 min", points: 1200, status: "completed" },
              { id: "l-1-6", title: "Food for Thought", type: "assignment", duration: "20 min", points: 800, status: "completed" },
              { id: "l-1-7", title: "Enter Your Goal", type: "goal", duration: "10 min", points: 1000, status: "completed" },
            ],
          },
          {
            id: "module-2",
            number: 2,
            title: "The Leader and The Manager",
            lessonsCompleted: 7,
            lessonsTotal: 7,
            progress: 100,
            status: "completed",
            lessons: [
              { id: "l-2-1", title: "Read the Text", type: "reading", duration: "25 min", points: 500, status: "completed" },
              { id: "l-2-2", title: "Watch the Videos", type: "video", duration: "30 min", points: 800, status: "completed" },
              { id: "l-2-3", title: "Mentor Meeting", type: "meeting", duration: "60 min", points: 1500, status: "completed" },
              { id: "l-2-4", title: "Most Useful Idea", type: "submission", duration: "15 min", points: 1000, status: "completed" },
              { id: "l-2-5", title: "How You Used the Idea", type: "submission", duration: "15 min", points: 1200, status: "completed" },
              { id: "l-2-6", title: "Food for Thought", type: "assignment", duration: "20 min", points: 800, status: "completed" },
              { id: "l-2-7", title: "Enter Your Goal", type: "goal", duration: "10 min", points: 1000, status: "completed" },
            ],
          },
          {
            id: "module-3",
            number: 3,
            title: "Leading Yourself",
            lessonsCompleted: 5,
            lessonsTotal: 7,
            progress: 71,
            status: "in-progress",
            lessons: [
              { id: "l-3-1", title: "Read the Text", type: "reading", duration: "25 min", points: 500, status: "completed" },
              { id: "l-3-2", title: "Watch the Videos", type: "video", duration: "30 min", points: 800, status: "completed" },
              { id: "l-3-3", title: "Mentor Meeting", type: "meeting", duration: "60 min", points: 1500, status: "completed" },
              { id: "l-3-4", title: "Most Useful Idea", type: "submission", duration: "15 min", points: 1000, status: "completed" },
              { id: "l-3-5", title: "How You Used the Idea", type: "submission", duration: "15 min", points: 1200, status: "completed" },
              { id: "l-3-6", title: "Food for Thought", type: "assignment", duration: "20 min", points: 800, status: "current" },
              { id: "l-3-7", title: "Enter Your Goal", type: "goal", duration: "10 min", points: 1000, status: "locked" },
            ],
          },
        ],
      },
      {
        id: "phase-2",
        name: "Team Leadership",
        modulesCompleted: 0,
        modulesTotal: 3,
        status: "upcoming",
        modules: [
          {
            id: "module-4",
            number: 4,
            title: "Performance Planning",
            lessonsCompleted: 0,
            lessonsTotal: 7,
            progress: 0,
            status: "locked",
            lessons: [],
          },
          {
            id: "module-5",
            number: 5,
            title: "Coaching Your Team",
            lessonsCompleted: 0,
            lessonsTotal: 7,
            progress: 0,
            status: "locked",
            lessons: [],
          },
          {
            id: "module-6",
            number: 6,
            title: "Difficult Conversations",
            lessonsCompleted: 0,
            lessonsTotal: 7,
            progress: 0,
            status: "locked",
            lessons: [],
          },
        ],
      },
      {
        id: "phase-3",
        name: "Strategic Leadership",
        modulesCompleted: 0,
        modulesTotal: 3,
        status: "upcoming",
        modules: [
          {
            id: "module-7",
            number: 7,
            title: "Building High-Performing Teams",
            lessonsCompleted: 0,
            lessonsTotal: 7,
            progress: 0,
            status: "locked",
            lessons: [],
          },
          {
            id: "module-8",
            number: 8,
            title: "Strategic Thinking",
            lessonsCompleted: 0,
            lessonsTotal: 7,
            progress: 0,
            status: "locked",
            lessons: [],
          },
          {
            id: "module-9",
            number: 9,
            title: "Leading Change",
            lessonsCompleted: 0,
            lessonsTotal: 7,
            progress: 0,
            status: "locked",
            lessons: [],
          },
        ],
      },
    ],
  },
  {
    id: "program-2",
    title: "Executive Presence",
    description:
      "Develop commanding presence and influence through communication mastery",
    track: "Leadership Track",
    trackColor: "purple",
    status: "not-started",
    progress: 0,
    dueDate: "June 30, 2026",
    phasesCount: 2,
    modulesCount: 6,
    duration: "~8 weeks",
    totalPoints: 40800,
    earnedPoints: 0,
    linkedGoals: [],
    phases: [
      {
        id: "phase-ep-1",
        name: "Communication Mastery",
        modulesCompleted: 0,
        modulesTotal: 3,
        status: "upcoming",
        modules: [],
      },
      {
        id: "phase-ep-2",
        name: "Personal Brand",
        modulesCompleted: 0,
        modulesTotal: 3,
        status: "upcoming",
        modules: [],
      },
    ],
  },
  {
    id: "program-3",
    title: "Strategic Planning & Execution",
    description:
      "Master the art of strategic planning and driving organizational execution",
    track: "Strategy Track",
    trackColor: "blue",
    status: "completed",
    progress: 100,
    dueDate: "December 15, 2025",
    phasesCount: 1,
    modulesCount: 4,
    duration: "~6 weeks",
    totalPoints: 27200,
    earnedPoints: 27200,
    linkedGoals: [
      {
        id: "goal-3",
        title: "Complete Strategic Plan",
        period: "Q4 2025",
        type: "Company Goal",
        progress: 100,
      },
    ],
    phases: [
      {
        id: "phase-sp-1",
        name: "Strategic Foundation",
        modulesCompleted: 4,
        modulesTotal: 4,
        status: "completed",
        modules: [],
      },
    ],
  },
];

/** Learning outcomes for program detail */
export const defaultLearningOutcomes: LearningOutcome[] = [
  { id: "lo-1", text: "Distinguish between leadership and management responsibilities" },
  { id: "lo-2", text: "Develop self-awareness and emotional intelligence" },
  { id: "lo-3", text: "Master performance planning and coaching frameworks" },
  { id: "lo-4", text: "Build high-performing, accountable teams" },
  { id: "lo-5", text: "Navigate difficult conversations and corrective action" },
  { id: "lo-6", text: "Develop strategic leadership thinking" },
];

/** Program structure items */
export const defaultProgramStructure: ProgramStructureItem[] = [
  { id: "ps-1", text: "Reading materials (20-30 min)" },
  { id: "ps-2", text: "Video content (25-30 min)" },
  { id: "ps-3", text: "Mentor coaching session (60 min)" },
  { id: "ps-4", text: "Reflection submissions" },
  { id: "ps-5", text: "Practical assignments" },
  { id: "ps-6", text: "Goal setting exercise" },
];

/** Filter options */
export const filterOptions = [
  { id: "all", label: "All Programs" },
  { id: "in-progress", label: "In Progress" },
  { id: "not-started", label: "Not Started" },
  { id: "completed", label: "Completed" },
] as const;

export type FilterId = (typeof filterOptions)[number]["id"];
