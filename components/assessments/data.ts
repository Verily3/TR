import type {
  AssessmentTemplate,
  Assessment,
  AssessmentStats,
  AssessmentResults,
  Person,
  Rater,
  CompetencyScore,
} from "./types";

// Sample people
export const samplePeople: Person[] = [
  { id: "p1", name: "John Doe", email: "john.doe@company.com", role: "Senior Manager" },
  { id: "p2", name: "Sarah Johnson", email: "sarah.johnson@company.com", role: "Director" },
  { id: "p3", name: "Michael Chen", email: "michael.chen@company.com", role: "Team Lead" },
  { id: "p4", name: "Emily Davis", email: "emily.davis@company.com", role: "Manager" },
  { id: "p5", name: "James Wilson", email: "james.wilson@company.com", role: "VP Operations" },
  { id: "p6", name: "Amanda Rodriguez", email: "amanda.rodriguez@company.com", role: "Analyst" },
  { id: "p7", name: "David Kim", email: "david.kim@company.com", role: "Engineer" },
  { id: "p8", name: "Lisa Thompson", email: "lisa.thompson@company.com", role: "Coordinator" },
];

// Sample templates
export const defaultTemplates: AssessmentTemplate[] = [
  {
    id: "t1",
    name: "Leadership 360",
    description: "Comprehensive leadership assessment covering core competencies",
    competencies: [
      {
        id: "c1",
        name: "Strategic Thinking",
        description: "Ability to think long-term and see the big picture",
        questions: [
          { id: "q1", text: "Demonstrates clear vision for the future" },
          { id: "q2", text: "Makes decisions aligned with organizational strategy" },
          { id: "q3", text: "Anticipates challenges and opportunities" },
        ],
      },
      {
        id: "c2",
        name: "Communication",
        description: "Effectiveness in conveying information and ideas",
        questions: [
          { id: "q4", text: "Communicates clearly and concisely" },
          { id: "q5", text: "Actively listens to others" },
          { id: "q6", text: "Adapts communication style to audience" },
        ],
      },
      {
        id: "c3",
        name: "Team Development",
        description: "Ability to build and develop high-performing teams",
        questions: [
          { id: "q7", text: "Provides regular feedback and coaching" },
          { id: "q8", text: "Recognizes and develops talent" },
          { id: "q9", text: "Creates an inclusive team environment" },
        ],
      },
      {
        id: "c4",
        name: "Decision Making",
        description: "Quality and timeliness of decisions",
        questions: [
          { id: "q10", text: "Makes timely decisions" },
          { id: "q11", text: "Considers multiple perspectives before deciding" },
          { id: "q12", text: "Takes accountability for decisions" },
        ],
      },
    ],
    scale: {
      min: 1,
      max: 5,
      labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    },
    allowComments: true,
    requireComments: false,
    anonymizeResponses: true,
  },
  {
    id: "t2",
    name: "Manager Effectiveness",
    description: "Assessment for evaluating management capabilities",
    competencies: [
      {
        id: "c5",
        name: "Goal Setting",
        description: "Ability to set clear and achievable goals",
        questions: [
          { id: "q13", text: "Sets clear expectations for the team" },
          { id: "q14", text: "Aligns team goals with organizational objectives" },
        ],
      },
      {
        id: "c6",
        name: "Performance Management",
        description: "Effectiveness in managing team performance",
        questions: [
          { id: "q15", text: "Provides constructive feedback regularly" },
          { id: "q16", text: "Addresses performance issues promptly" },
        ],
      },
    ],
    scale: {
      min: 1,
      max: 5,
      labels: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    },
    allowComments: true,
    requireComments: true,
    anonymizeResponses: true,
  },
];

// Sample raters
const createRaters = (): Rater[] => [
  {
    id: "r1",
    person: samplePeople[0],
    type: "self",
    status: "completed",
    invitedAt: "2025-01-15T10:00:00Z",
    completedAt: "2025-01-16T14:30:00Z",
    reminderCount: 0,
  },
  {
    id: "r2",
    person: samplePeople[4],
    type: "manager",
    status: "completed",
    invitedAt: "2025-01-15T10:00:00Z",
    completedAt: "2025-01-20T09:15:00Z",
    reminderCount: 1,
  },
  {
    id: "r3",
    person: samplePeople[1],
    type: "peer",
    status: "completed",
    invitedAt: "2025-01-15T10:00:00Z",
    completedAt: "2025-01-18T11:00:00Z",
    reminderCount: 0,
  },
  {
    id: "r4",
    person: samplePeople[2],
    type: "peer",
    status: "in_progress",
    invitedAt: "2025-01-15T10:00:00Z",
    reminderCount: 2,
  },
  {
    id: "r5",
    person: samplePeople[5],
    type: "direct_report",
    status: "completed",
    invitedAt: "2025-01-15T10:00:00Z",
    completedAt: "2025-01-17T16:45:00Z",
    reminderCount: 0,
  },
  {
    id: "r6",
    person: samplePeople[6],
    type: "direct_report",
    status: "pending",
    invitedAt: "2025-01-15T10:00:00Z",
    reminderCount: 1,
  },
];

// Sample assessments
export const defaultAssessments: Assessment[] = [
  {
    id: "a1",
    templateId: "t1",
    templateName: "Leadership 360",
    subject: samplePeople[0],
    status: "active",
    createdAt: "2025-01-15T10:00:00Z",
    dueDate: "2025-02-15",
    raters: createRaters(),
    responseRate: 67,
    hasResults: false,
  },
  {
    id: "a2",
    templateId: "t1",
    templateName: "Leadership 360",
    subject: samplePeople[1],
    status: "completed",
    createdAt: "2024-11-01T10:00:00Z",
    dueDate: "2024-12-01",
    completedAt: "2024-11-28T15:00:00Z",
    raters: [
      { id: "r7", person: samplePeople[1], type: "self", status: "completed", invitedAt: "2024-11-01T10:00:00Z", completedAt: "2024-11-05T10:00:00Z", reminderCount: 0 },
      { id: "r8", person: samplePeople[4], type: "manager", status: "completed", invitedAt: "2024-11-01T10:00:00Z", completedAt: "2024-11-10T10:00:00Z", reminderCount: 0 },
      { id: "r9", person: samplePeople[0], type: "peer", status: "completed", invitedAt: "2024-11-01T10:00:00Z", completedAt: "2024-11-12T10:00:00Z", reminderCount: 0 },
      { id: "r10", person: samplePeople[2], type: "peer", status: "completed", invitedAt: "2024-11-01T10:00:00Z", completedAt: "2024-11-15T10:00:00Z", reminderCount: 1 },
    ],
    responseRate: 100,
    hasResults: true,
  },
  {
    id: "a3",
    templateId: "t2",
    templateName: "Manager Effectiveness",
    subject: samplePeople[2],
    status: "draft",
    createdAt: "2025-01-28T10:00:00Z",
    dueDate: "2025-03-01",
    raters: [],
    responseRate: 0,
    hasResults: false,
  },
];

export const defaultAssessmentStats: AssessmentStats = {
  totalAssessments: 3,
  activeAssessments: 1,
  completedAssessments: 1,
  pendingResponses: 2,
  averageResponseRate: 72,
};

export const sampleCompetencyScores: CompetencyScore[] = [
  {
    competencyId: "c1",
    competencyName: "Strategic Thinking",
    selfScore: 4.2,
    managerScore: 3.8,
    peerScore: 4.0,
    directReportScore: 3.5,
    averageScore: 3.88,
    gap: 0.32,
  },
  {
    competencyId: "c2",
    competencyName: "Communication",
    selfScore: 3.8,
    managerScore: 4.2,
    peerScore: 4.1,
    directReportScore: 4.3,
    averageScore: 4.10,
    gap: -0.30,
  },
  {
    competencyId: "c3",
    competencyName: "Team Development",
    selfScore: 4.0,
    managerScore: 3.5,
    peerScore: 3.7,
    directReportScore: 3.2,
    averageScore: 3.60,
    gap: 0.40,
  },
  {
    competencyId: "c4",
    competencyName: "Decision Making",
    selfScore: 3.5,
    managerScore: 4.0,
    peerScore: 3.9,
    directReportScore: 3.8,
    averageScore: 3.80,
    gap: -0.30,
  },
];

export const sampleResults: AssessmentResults = {
  assessmentId: "a2",
  subjectName: "Sarah Johnson",
  completedAt: "2024-11-28T15:00:00Z",
  totalResponses: 4,
  responsesByType: {
    self: 1,
    manager: 1,
    peer: 2,
    direct_report: 0,
    other: 0,
  },
  competencyScores: sampleCompetencyScores,
  overallScore: 3.85,
  strengths: ["Communication", "Decision Making"],
  developmentAreas: ["Team Development", "Strategic Thinking"],
};

export const assessmentStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-700" },
  active: { label: "Active", bg: "bg-blue-100", text: "text-blue-700" },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700" },
  cancelled: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" },
};

export const raterStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pending", bg: "bg-gray-100", text: "text-gray-700" },
  in_progress: { label: "In Progress", bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700" },
  declined: { label: "Declined", bg: "bg-red-100", text: "text-red-700" },
};

export const raterTypeLabels: Record<string, string> = {
  self: "Self",
  manager: "Manager",
  peer: "Peer",
  direct_report: "Direct Report",
  other: "Other",
};

export const raterTypeColors: Record<string, { bg: string; text: string }> = {
  self: { bg: "bg-purple-100", text: "text-purple-700" },
  manager: { bg: "bg-blue-100", text: "text-blue-700" },
  peer: { bg: "bg-green-100", text: "text-green-700" },
  direct_report: { bg: "bg-orange-100", text: "text-orange-700" },
  other: { bg: "bg-gray-100", text: "text-gray-700" },
};
