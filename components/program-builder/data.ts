import type {
  ProgramFormData,
  BuilderModule,
  LessonContent,
  Participant,
  ParticipantStats,
  ProgramSettings,
  EmailSetting,
  ReminderTiming,
} from "./types";

export const learningTracks = [
  "Leadership Track",
  "Management Track",
  "Technical Skills",
  "Professional Development",
  "Executive Development",
];

export const timeZones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

export const defaultEmailSettings: EmailSetting[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Send a welcome message to participants before the program starts",
    enabled: true,
    timing: "7 days before start",
  },
  {
    id: "kickoff",
    name: "Program Kickoff Email",
    description: "Announcement when the program officially begins",
    enabled: true,
  },
  {
    id: "weekly-digest",
    name: "Weekly Progress Digest",
    description: "Weekly summary of progress and upcoming content",
    enabled: true,
    timing: "Monday",
  },
  {
    id: "inactivity",
    name: "Inactivity Reminder",
    description: "Reminder sent to inactive participants",
    enabled: true,
    timing: "7 days inactive",
  },
  {
    id: "milestone",
    name: "Milestone Celebration Emails",
    description: "Celebrate progress at 25%, 50%, 75%, and 100% completion",
    enabled: true,
  },
  {
    id: "completion",
    name: "Completion Email",
    description: "Congratulations email when program is completed",
    enabled: true,
  },
  {
    id: "mentor-summary",
    name: "Mentor/Manager Summary",
    description: "Regular progress reports sent to mentors and managers",
    enabled: true,
    timing: "Weekly",
  },
];

export const defaultBeforeDueReminders: ReminderTiming[] = [
  { id: "2-weeks", label: "2 weeks before due date", enabled: true },
  { id: "1-week", label: "1 week before due date", enabled: true },
  { id: "3-days", label: "3 days before due date", enabled: true },
  { id: "1-day", label: "1 day before due date", enabled: true },
  { id: "day-of", label: "Day of due date", enabled: true },
];

export const defaultAfterDueReminders: ReminderTiming[] = [
  { id: "1-day-after", label: "1 day after due date", enabled: false },
  { id: "3-days-after", label: "3 days after due date", enabled: false },
  { id: "1-week-after", label: "1 week after due date", enabled: false },
];

export const defaultProgramFormData: ProgramFormData = {
  internalName: "",
  title: "",
  description: "",
  learningTrack: "",
  programType: "cohort",
  startDate: "",
  endDate: "",
  estimatedDuration: 12,
  timeZone: "America/New_York",
  allowIndividualPacing: true,
  startOffset: 0,
  deadlineFlexibility: 7,
  objectives: [
    { id: "1", text: "" },
    { id: "2", text: "" },
    { id: "3", text: "" },
  ],
  emailSettings: defaultEmailSettings,
  beforeDueReminders: defaultBeforeDueReminders,
  afterDueReminders: defaultAfterDueReminders,
  targetAudience: "",
  prerequisites: "",
  recommendedFor: "",
};

export const sampleProgramFormData: ProgramFormData = {
  internalName: "LEADER-SHIFT-2025",
  title: "LeaderShift: Manager to Leader Transformation",
  description:
    "A comprehensive leadership development program designed to transform managers into high-impact leaders who can drive organizational change and build high-performing teams.",
  learningTrack: "Leadership Track",
  programType: "cohort",
  startDate: "2025-03-01",
  endDate: "2025-05-24",
  estimatedDuration: 12,
  timeZone: "America/New_York",
  allowIndividualPacing: true,
  startOffset: 0,
  deadlineFlexibility: 7,
  objectives: [
    { id: "1", text: "Develop self-awareness and emotional intelligence as a leader" },
    { id: "2", text: "Master the art of coaching and developing direct reports" },
    { id: "3", text: "Build strategic thinking and decision-making capabilities" },
  ],
  emailSettings: defaultEmailSettings,
  beforeDueReminders: defaultBeforeDueReminders,
  afterDueReminders: defaultAfterDueReminders,
  targetAudience: "Mid-level managers with 2-5 years of experience in sales",
  prerequisites: "Completion of Sales Fundamentals program",
  recommendedFor: "Sales representatives looking to move into leadership roles",
};

export const defaultModules: BuilderModule[] = [
  {
    id: "m1",
    title: "Module 1: Introduction to Leadership",
    lessonCount: 5,
    expanded: true,
    lessons: [
      {
        id: "l1",
        title: "What is Leadership?",
        type: "reading",
        duration: "25 min",
        status: "published",
      },
      {
        id: "l2",
        title: "The Leadership Mindset",
        type: "video",
        duration: "15 min",
        status: "published",
      },
      {
        id: "l3",
        title: "Leadership vs Management",
        type: "reading",
        duration: "20 min",
        status: "draft",
      },
      {
        id: "l4",
        title: "Self-Assessment: Your Leadership Style",
        type: "assignment",
        duration: "30 min",
        status: "draft",
      },
      {
        id: "l5",
        title: "Meet with Your Mentor",
        type: "meeting",
        duration: "45 min",
        status: "published",
      },
    ],
  },
  {
    id: "m2",
    title: "Module 2: Emotional Intelligence",
    lessonCount: 4,
    expanded: false,
    lessons: [
      {
        id: "l6",
        title: "Understanding Emotional Intelligence",
        type: "reading",
        duration: "20 min",
        status: "published",
      },
      {
        id: "l7",
        title: "Self-Awareness Deep Dive",
        type: "video",
        duration: "18 min",
        status: "published",
      },
      {
        id: "l8",
        title: "EQ Assessment",
        type: "assignment",
        duration: "25 min",
        status: "draft",
      },
      {
        id: "l9",
        title: "Reflection: EQ in Practice",
        type: "submission",
        duration: "15 min",
        status: "draft",
      },
    ],
  },
  {
    id: "m3",
    title: "Module 3: Strategic Thinking",
    lessonCount: 3,
    expanded: false,
    lessons: [
      {
        id: "l10",
        title: "Strategic vs Tactical Thinking",
        type: "reading",
        duration: "25 min",
        status: "draft",
      },
      {
        id: "l11",
        title: "Decision-Making Frameworks",
        type: "video",
        duration: "22 min",
        status: "draft",
      },
      {
        id: "l12",
        title: "Create Your Strategic Plan",
        type: "goal",
        duration: "40 min",
        status: "draft",
      },
    ],
  },
];

export const defaultLessonContent: LessonContent = {
  introduction: "",
  mainContent: "",
  keyConcepts: [],
  keyTakeaway: "",
  visibleToLearners: true,
  visibleToMentors: true,
  visibleToFacilitators: true,
};

export const sampleLessonContent: LessonContent = {
  introduction:
    "In this foundational lesson, we'll explore what leadership truly means and how it differs from management. Understanding these distinctions is essential for your transformation journey.",
  mainContent:
    "Leadership is the ability to inspire, motivate, and guide others toward achieving shared goals. Unlike management, which focuses on processes and systems, leadership centers on people and vision.\n\nEffective leaders create environments where others can thrive and do their best work. They communicate a compelling vision, build trust, and empower their teams to achieve remarkable results.",
  keyConcepts: [
    {
      id: "kc1",
      title: "Vision Setting",
      description:
        "Leaders create and communicate a compelling picture of the future that inspires action.",
    },
    {
      id: "kc2",
      title: "Influence vs Authority",
      description:
        "True leadership comes from influence and trust, not just positional authority.",
    },
    {
      id: "kc3",
      title: "People Development",
      description:
        "Great leaders invest in growing others, creating a legacy that outlasts their tenure.",
    },
  ],
  keyTakeaway:
    "Leadership is fundamentally about people, not processes. Your primary role as a leader is to bring out the best in others.",
  visibleToLearners: true,
  visibleToMentors: true,
  visibleToFacilitators: true,
};

export const defaultParticipants: Participant[] = [
  {
    id: "p1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "learner",
    status: "active",
    progress: 65,
  },
  {
    id: "p2",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "learner",
    status: "active",
    progress: 42,
  },
  {
    id: "p3",
    name: "Emily Davis",
    email: "emily.davis@company.com",
    role: "learner",
    status: "active",
    progress: 78,
  },
  {
    id: "p4",
    name: "James Wilson",
    email: "james.wilson@company.com",
    role: "mentor",
    status: "active",
    progress: 100,
  },
  {
    id: "p5",
    name: "Amanda Rodriguez",
    email: "amanda.rodriguez@company.com",
    role: "mentor",
    status: "active",
    progress: 100,
  },
  {
    id: "p6",
    name: "David Kim",
    email: "david.kim@company.com",
    role: "facilitator",
    status: "active",
    progress: 100,
  },
  {
    id: "p7",
    name: "Lisa Thompson",
    email: "lisa.thompson@company.com",
    role: "learner",
    status: "inactive",
    progress: 12,
  },
  {
    id: "p8",
    name: "Robert Martinez",
    email: "robert.martinez@company.com",
    role: "learner",
    status: "completed",
    progress: 100,
  },
];

export const defaultParticipantStats: ParticipantStats = {
  totalEnrolled: 28,
  activeLearners: 24,
  assignedMentors: 3,
  facilitators: 1,
};

export const defaultProgramSettings: ProgramSettings = {
  autoEnrollment: false,
  requireManagerApproval: false,
  allowSelfEnrollment: true,
  linkToGoals: true,
  issueCertificate: true,
  programCapacity: 30,
  enableWaitlist: false,
  sequentialModuleAccess: true,
  trackInScorecard: true,
};

export const contentLibraryTemplates = [
  {
    id: "t1",
    name: "Welcome - Professional",
    description: "Formal welcome message with program overview and expectations",
  },
  {
    id: "t2",
    name: "Welcome - Casual",
    description: "Friendly, approachable welcome with motivational tone",
  },
  {
    id: "t3",
    name: "Reminder - Encouraging",
    description: "Positive reminder focusing on progress and support",
  },
  {
    id: "t4",
    name: "Milestone - Celebration",
    description: "Celebratory message for reaching progress milestones",
  },
  {
    id: "t5",
    name: "Completion - Congratulatory",
    description: "Warm congratulations with next steps guidance",
  },
];

export const lessonTypeIcons: Record<string, string> = {
  reading: "BookOpen",
  video: "Play",
  meeting: "Users",
  submission: "FileText",
  assignment: "ClipboardList",
  goal: "Target",
};
