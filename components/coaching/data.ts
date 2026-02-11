import type {
  Person,
  CoachingRelationship,
  CoachingSession,
  CoachingStats,
  SessionPrep,
  SessionNote,
  ActionItem,
} from "./types";

// People
export const defaultPeople: Person[] = [
  {
    id: "p1",
    name: "John Doe",
    email: "john.doe@company.com",
    role: "Senior Manager",
  },
  {
    id: "p2",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Executive Coach",
  },
  {
    id: "p3",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "Director",
  },
  {
    id: "p4",
    name: "Emily Davis",
    email: "emily.davis@company.com",
    role: "Team Lead",
  },
  {
    id: "p5",
    name: "James Wilson",
    email: "james.wilson@company.com",
    role: "VP Operations",
  },
];

export const defaultRelationships: CoachingRelationship[] = [
  {
    id: "r1",
    coach: defaultPeople[1], // Sarah Johnson
    coachee: defaultPeople[0], // John Doe
    type: "coach",
    startDate: "2024-09-01",
    meetingFrequency: "Bi-weekly",
    nextSession: "2025-02-05",
    totalSessions: 12,
    status: "active",
  },
  {
    id: "r2",
    coach: defaultPeople[4], // James Wilson
    coachee: defaultPeople[0], // John Doe
    type: "mentor",
    startDate: "2024-06-15",
    meetingFrequency: "Monthly",
    nextSession: "2025-02-15",
    totalSessions: 8,
    status: "active",
  },
  {
    id: "r3",
    coach: defaultPeople[2], // Michael Chen
    coachee: defaultPeople[3], // Emily Davis
    type: "manager",
    startDate: "2024-01-10",
    meetingFrequency: "Weekly",
    nextSession: "2025-02-03",
    totalSessions: 45,
    status: "active",
  },
];

export const defaultSessionPrep: SessionPrep = {
  id: "prep1",
  sessionId: "s1",
  wins: [
    "Successfully led the Q4 project review meeting",
    "Received positive feedback from stakeholders on the new process",
    "Team engagement scores improved by 15%",
  ],
  challenges: [
    "Struggling with time management across multiple projects",
    "Difficult conversation with underperforming team member",
  ],
  topicsToDiscuss: [
    "Strategies for better delegation",
    "How to have effective performance conversations",
    "Career development planning for Q2",
  ],
  submittedAt: "2025-02-04T10:30:00Z",
};

export const defaultSessionNotes: SessionNote[] = [
  {
    id: "n1",
    sessionId: "s2",
    authorId: "p2",
    authorName: "Sarah Johnson",
    content:
      "John showed great progress in applying the feedback framework we discussed. He mentioned the team responded well to the new approach. We identified three key areas to focus on: delegation, strategic thinking, and stakeholder management.",
    isPrivate: false,
    createdAt: "2025-01-22T15:30:00Z",
  },
  {
    id: "n2",
    sessionId: "s2",
    authorId: "p2",
    authorName: "Sarah Johnson",
    content:
      "Private note: John seems hesitant about the upcoming leadership transition. May need to address confidence issues in future sessions.",
    isPrivate: true,
    createdAt: "2025-01-22T15:45:00Z",
  },
];

export const defaultActionItems: ActionItem[] = [
  {
    id: "a1",
    sessionId: "s2",
    title: "Create delegation framework document",
    description: "Document the delegation process and share with the team",
    ownerId: "p1",
    ownerName: "John Doe",
    dueDate: "2025-02-10",
    priority: "high",
    status: "in_progress",
  },
  {
    id: "a2",
    sessionId: "s2",
    title: "Schedule 1:1s with direct reports",
    description: "Set up recurring 1:1 meetings with each team member",
    ownerId: "p1",
    ownerName: "John Doe",
    dueDate: "2025-02-07",
    priority: "medium",
    status: "completed",
    completedAt: "2025-02-01T09:00:00Z",
  },
  {
    id: "a3",
    sessionId: "s2",
    title: "Review leadership book chapters 5-7",
    description: "Read and take notes on assigned chapters",
    ownerId: "p1",
    ownerName: "John Doe",
    dueDate: "2025-02-05",
    priority: "low",
    status: "pending",
  },
  {
    id: "a4",
    sessionId: "s1",
    title: "Practice feedback conversation",
    description: "Role-play the upcoming performance conversation",
    ownerId: "p1",
    ownerName: "John Doe",
    dueDate: "2025-02-04",
    priority: "high",
    status: "pending",
  },
];

export const defaultSessions: CoachingSession[] = [
  {
    id: "s1",
    relationshipId: "r1",
    coach: defaultPeople[1],
    coachee: defaultPeople[0],
    type: "coaching",
    status: "ready",
    scheduledAt: "2025-02-05T14:00:00Z",
    duration: 60,
    location: "Conference Room A",
    videoLink: "https://zoom.us/j/123456789",
    agenda: "Review progress on delegation, discuss performance conversation approach",
    prep: defaultSessionPrep,
    notes: [],
    actionItems: [defaultActionItems[3]],
  },
  {
    id: "s2",
    relationshipId: "r1",
    coach: defaultPeople[1],
    coachee: defaultPeople[0],
    type: "coaching",
    status: "completed",
    scheduledAt: "2025-01-22T14:00:00Z",
    duration: 60,
    location: "Conference Room A",
    notes: defaultSessionNotes,
    actionItems: [defaultActionItems[0], defaultActionItems[1], defaultActionItems[2]],
  },
  {
    id: "s3",
    relationshipId: "r2",
    coach: defaultPeople[4],
    coachee: defaultPeople[0],
    type: "one_on_one",
    status: "scheduled",
    scheduledAt: "2025-02-15T10:00:00Z",
    duration: 45,
    videoLink: "https://teams.microsoft.com/l/meetup-join/123",
    agenda: "Quarterly career development review",
    notes: [],
    actionItems: [],
  },
  {
    id: "s4",
    relationshipId: "r3",
    coach: defaultPeople[2],
    coachee: defaultPeople[3],
    type: "check_in",
    status: "prep_in_progress",
    scheduledAt: "2025-02-03T09:00:00Z",
    duration: 30,
    location: "Michael's Office",
    notes: [],
    actionItems: [],
  },
];

export const defaultCoachingStats: CoachingStats = {
  totalRelationships: 3,
  activeRelationships: 3,
  upcomingSessions: 3,
  completedSessions: 24,
  pendingActionItems: 3,
  overdueActionItems: 1,
};

export const sessionTypeLabels: Record<string, string> = {
  coaching: "Coaching Session",
  one_on_one: "1:1 Meeting",
  check_in: "Check-in",
  review: "Review",
  planning: "Planning Session",
};

export const sessionStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  scheduled: { label: "Scheduled", bg: "bg-blue-100", text: "text-blue-700" },
  prep_in_progress: { label: "Prep in Progress", bg: "bg-yellow-100", text: "text-yellow-700" },
  ready: { label: "Ready", bg: "bg-green-100", text: "text-green-700" },
  completed: { label: "Completed", bg: "bg-gray-100", text: "text-gray-700" },
  cancelled: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" },
  no_show: { label: "No Show", bg: "bg-red-100", text: "text-red-700" },
};

export const relationshipTypeLabels: Record<string, string> = {
  mentor: "Mentor",
  coach: "Coach",
  manager: "Manager",
};

export const priorityConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  low: { label: "Low", bg: "bg-gray-100", text: "text-gray-700" },
  medium: { label: "Medium", bg: "bg-yellow-100", text: "text-yellow-700" },
  high: { label: "High", bg: "bg-red-100", text: "text-red-700" },
};

export const actionStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pending", bg: "bg-gray-100", text: "text-gray-700" },
  in_progress: { label: "In Progress", bg: "bg-blue-100", text: "text-blue-700" },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700" },
};
