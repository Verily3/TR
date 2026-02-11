import type {
  Notification,
  NotificationPreferences,
  NotificationStats,
} from "./types";

export const defaultNotifications: Notification[] = [
  {
    id: "n1",
    type: "coaching_session",
    title: "Coaching Session Reminder",
    message: "Your coaching session with Sarah Chen starts in 30 minutes",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    status: "unread",
    priority: "high",
    actionUrl: "/coaching/sessions/s1",
    actionLabel: "Join Session",
    sender: {
      id: "u2",
      name: "Sarah Chen",
    },
    metadata: {
      sessionId: "s1",
    },
  },
  {
    id: "n2",
    type: "assessment_invite",
    title: "360 Assessment Invitation",
    message: "You've been invited to provide feedback for Michael Roberts",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: "unread",
    priority: "medium",
    actionUrl: "/assessments/a1/respond",
    actionLabel: "Provide Feedback",
    sender: {
      id: "u3",
      name: "Michael Roberts",
    },
    metadata: {
      assessmentId: "a1",
    },
  },
  {
    id: "n3",
    type: "goal_reminder",
    title: "Goal Check-in Due",
    message: "Your weekly check-in for 'Improve Team Communication' is due today",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    status: "unread",
    priority: "medium",
    actionUrl: "/goals/g1",
    actionLabel: "Update Progress",
    metadata: {
      goalId: "g1",
    },
  },
  {
    id: "n4",
    type: "achievement",
    title: "Achievement Unlocked!",
    message: "Congratulations! You've completed the 'Leadership Fundamentals' program",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    status: "unread",
    priority: "low",
    actionUrl: "/programs/p1/certificate",
    actionLabel: "View Certificate",
    metadata: {
      programId: "p1",
    },
  },
  {
    id: "n5",
    type: "feedback_received",
    title: "New Feedback Received",
    message: "Emily Watson left feedback on your recent presentation",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    status: "read",
    priority: "medium",
    actionUrl: "/feedback/f1",
    actionLabel: "View Feedback",
    sender: {
      id: "u4",
      name: "Emily Watson",
    },
  },
  {
    id: "n6",
    type: "program_update",
    title: "New Module Available",
    message: "Module 5: 'Strategic Thinking' is now available in Leadership Mastery",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    status: "read",
    priority: "low",
    actionUrl: "/programs/p2/modules/m5",
    actionLabel: "Start Learning",
    metadata: {
      programId: "p2",
    },
  },
  {
    id: "n7",
    type: "mention",
    title: "You were mentioned",
    message: "Alex Kim mentioned you in a discussion about Q1 planning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 26 hours ago
    status: "read",
    priority: "low",
    actionUrl: "/discussions/d1#comment-42",
    actionLabel: "View Discussion",
    sender: {
      id: "u5",
      name: "Alex Kim",
    },
  },
  {
    id: "n8",
    type: "approval_request",
    title: "Approval Required",
    message: "Jennifer Lee submitted a goal for your approval: 'Launch new product line'",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), // 28 hours ago
    status: "unread",
    priority: "high",
    actionUrl: "/approvals/ap1",
    actionLabel: "Review & Approve",
    sender: {
      id: "u6",
      name: "Jennifer Lee",
    },
    metadata: {
      goalId: "g5",
    },
  },
  {
    id: "n9",
    type: "deadline",
    title: "Deadline Approaching",
    message: "Your 'Complete Leadership Assessment' task is due in 2 days",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    status: "read",
    priority: "medium",
    actionUrl: "/assessments/a2",
    actionLabel: "Complete Now",
    metadata: {
      assessmentId: "a2",
    },
  },
  {
    id: "n10",
    type: "system",
    title: "System Maintenance",
    message: "Scheduled maintenance on Sunday, Feb 9th from 2-4 AM EST",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    status: "read",
    priority: "low",
  },
  {
    id: "n11",
    type: "coaching_session",
    title: "Session Notes Available",
    message: "Notes from your session with David Miller are now available",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    status: "read",
    priority: "low",
    actionUrl: "/coaching/sessions/s2/notes",
    actionLabel: "View Notes",
    sender: {
      id: "u7",
      name: "David Miller",
    },
    metadata: {
      sessionId: "s2",
    },
  },
  {
    id: "n12",
    type: "program_update",
    title: "Program Enrollment Confirmed",
    message: "You've been enrolled in 'Executive Presence Program' starting Feb 15",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    status: "read",
    priority: "medium",
    actionUrl: "/programs/p3",
    actionLabel: "View Program",
    metadata: {
      programId: "p3",
    },
  },
];

export const defaultPreferences: NotificationPreferences = {
  email: {
    enabled: true,
    digest: "daily",
    types: {
      program_updates: true,
      goal_reminders: true,
      assessment_invites: true,
      coaching_sessions: true,
      feedback: true,
      achievements: true,
      mentions: true,
      system: true,
    },
  },
  push: {
    enabled: true,
    types: {
      program_updates: true,
      goal_reminders: true,
      assessment_invites: true,
      coaching_sessions: true,
      feedback: false,
      achievements: true,
      mentions: true,
      system: false,
    },
  },
  inApp: {
    enabled: true,
    showBadge: true,
    playSound: false,
    types: {
      program_updates: true,
      goal_reminders: true,
      assessment_invites: true,
      coaching_sessions: true,
      feedback: true,
      achievements: true,
      mentions: true,
      system: true,
    },
  },
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "08:00",
    timezone: "America/New_York",
  },
};

export const defaultStats: NotificationStats = {
  total: 12,
  unread: 5,
  byType: {
    program_update: 2,
    goal_reminder: 1,
    assessment_invite: 1,
    coaching_session: 2,
    feedback_received: 1,
    achievement: 1,
    mention: 1,
    system: 1,
    deadline: 1,
    approval_request: 1,
  },
  byPriority: {
    low: 5,
    medium: 4,
    high: 2,
    urgent: 1,
  },
};

export const notificationTypeConfig: Record<
  string,
  { label: string; icon: string; bg: string; text: string }
> = {
  program_update: {
    label: "Program Update",
    icon: "BookOpen",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  goal_reminder: {
    label: "Goal Reminder",
    icon: "Target",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  assessment_invite: {
    label: "Assessment",
    icon: "ClipboardList",
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  coaching_session: {
    label: "Coaching",
    icon: "Users",
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  feedback_received: {
    label: "Feedback",
    icon: "MessageSquare",
    bg: "bg-teal-100",
    text: "text-teal-700",
  },
  achievement: {
    label: "Achievement",
    icon: "Award",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  mention: {
    label: "Mention",
    icon: "AtSign",
    bg: "bg-pink-100",
    text: "text-pink-700",
  },
  system: {
    label: "System",
    icon: "Settings",
    bg: "bg-gray-100",
    text: "text-gray-700",
  },
  deadline: {
    label: "Deadline",
    icon: "Clock",
    bg: "bg-red-100",
    text: "text-red-700",
  },
  approval_request: {
    label: "Approval",
    icon: "CheckCircle",
    bg: "bg-indigo-100",
    text: "text-indigo-700",
  },
};

export const priorityConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  low: {
    label: "Low",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  medium: {
    label: "Medium",
    bg: "bg-blue-100",
    text: "text-blue-600",
    dot: "bg-blue-400",
  },
  high: {
    label: "High",
    bg: "bg-orange-100",
    text: "text-orange-600",
    dot: "bg-orange-400",
  },
  urgent: {
    label: "Urgent",
    bg: "bg-red-100",
    text: "text-red-600",
    dot: "bg-red-500",
  },
};
