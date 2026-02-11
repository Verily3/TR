import type {
  HelpArticle,
  FAQ,
  HelpCategory,
  SupportTicket,
  ArticleCategory,
} from "./types";

export const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Learn the basics and set up your account",
    icon: "Rocket",
    articleCount: 8,
  },
  {
    id: "programs",
    name: "Programs & Learning",
    description: "Manage and participate in learning programs",
    icon: "BookOpen",
    articleCount: 12,
  },
  {
    id: "goals",
    name: "Goals & Planning",
    description: "Set, track, and achieve your objectives",
    icon: "Target",
    articleCount: 9,
  },
  {
    id: "coaching",
    name: "Coaching & Mentoring",
    description: "Schedule sessions and manage relationships",
    icon: "Users",
    articleCount: 7,
  },
  {
    id: "assessments",
    name: "360 Assessments",
    description: "Create and complete feedback assessments",
    icon: "ClipboardList",
    articleCount: 10,
  },
  {
    id: "people",
    name: "Team & People",
    description: "Manage your team and organization",
    icon: "UserCircle",
    articleCount: 6,
  },
  {
    id: "settings",
    name: "Account Settings",
    description: "Configure your profile and preferences",
    icon: "Settings",
    articleCount: 8,
  },
  {
    id: "billing",
    name: "Billing & Subscriptions",
    description: "Manage payments and subscription plans",
    icon: "CreditCard",
    articleCount: 5,
  },
  {
    id: "integrations",
    name: "Integrations",
    description: "Connect with third-party tools",
    icon: "Plug",
    articleCount: 6,
  },
  {
    id: "troubleshooting",
    name: "Troubleshooting",
    description: "Solve common issues and errors",
    icon: "Wrench",
    articleCount: 11,
  },
];

export const defaultArticles: HelpArticle[] = [
  {
    id: "a1",
    title: "Getting Started with Transformation OS",
    slug: "getting-started-guide",
    excerpt: "A comprehensive guide to help you navigate and make the most of the platform",
    content: `
# Getting Started with Transformation OS

Welcome to Transformation OS! This guide will walk you through the essential features and help you get started on your transformation journey.

## Setting Up Your Profile

1. Navigate to Settings > Profile
2. Upload your profile photo
3. Fill in your job title and department
4. Set your timezone and language preferences

## Exploring the Dashboard

Your dashboard is your home base. Here you'll find:
- **Quick Actions**: Fast access to common tasks
- **Progress Overview**: Track your goals and programs
- **Upcoming Sessions**: See your scheduled coaching meetings
- **Recent Activity**: Stay updated on team activities

## Your First Steps

1. Complete your profile setup
2. Set your first goal
3. Explore available programs
4. Connect with your manager or mentor

Need help? Contact our support team anytime.
    `,
    category: "getting-started",
    tags: ["basics", "setup", "profile", "dashboard"],
    views: 1523,
    helpful: 234,
    notHelpful: 12,
    createdAt: "2024-01-15",
    updatedAt: "2025-01-20",
    readingTime: 5,
    relatedArticles: ["a2", "a3"],
  },
  {
    id: "a2",
    title: "How to Set and Track Goals",
    slug: "setting-tracking-goals",
    excerpt: "Learn how to create SMART goals and monitor your progress effectively",
    content: `
# How to Set and Track Goals

Setting clear goals is essential for your development. Here's how to make the most of the goal-setting features.

## Creating a New Goal

1. Navigate to Planning & Goals
2. Click "Create Goal"
3. Define your objective using the SMART framework
4. Set milestones and deadlines
5. Assign reviewers if needed

## The SMART Framework

- **Specific**: Clearly define what you want to achieve
- **Measurable**: Include metrics to track progress
- **Achievable**: Set realistic targets
- **Relevant**: Align with your role and career path
- **Time-bound**: Set clear deadlines

## Tracking Progress

Use the progress tracker to:
- Log updates and achievements
- Upload supporting evidence
- Request feedback from managers
- Celebrate milestones
    `,
    category: "goals",
    tags: ["goals", "planning", "SMART", "tracking"],
    views: 892,
    helpful: 156,
    notHelpful: 8,
    createdAt: "2024-02-10",
    updatedAt: "2025-01-15",
    readingTime: 4,
    relatedArticles: ["a1", "a4"],
  },
  {
    id: "a3",
    title: "Navigating Learning Programs",
    slug: "navigating-programs",
    excerpt: "Discover how to enroll in programs and track your learning journey",
    content: `
# Navigating Learning Programs

Learning programs are structured courses designed to help you develop specific skills.

## Finding Programs

1. Go to the Programs page
2. Browse by category or search
3. Filter by duration, difficulty, or topic
4. Read program descriptions and reviews

## Enrolling in a Program

Click "Enroll" on any program card to join. You'll receive:
- Access to all program content
- Progress tracking
- Completion certificates
- Mentor assignments (if applicable)

## Completing Modules

Each program contains modules with:
- Video lessons
- Reading materials
- Quizzes and assessments
- Practical assignments
    `,
    category: "programs",
    tags: ["programs", "learning", "enrollment", "modules"],
    views: 756,
    helpful: 134,
    notHelpful: 5,
    createdAt: "2024-03-05",
    updatedAt: "2025-01-10",
    readingTime: 3,
    relatedArticles: ["a1", "a5"],
  },
  {
    id: "a4",
    title: "Scheduling Coaching Sessions",
    slug: "scheduling-coaching",
    excerpt: "Learn how to book, prepare for, and get the most out of coaching sessions",
    content: `
# Scheduling Coaching Sessions

Coaching sessions are 1:1 meetings with mentors or coaches to support your development.

## Booking a Session

1. Navigate to Coaching
2. Click "New Session"
3. Select your coach or mentor
4. Choose available time slots
5. Add agenda items or discussion topics

## Preparing for Sessions

Use session prep to:
- Reflect on recent wins and challenges
- List topics you want to discuss
- Set intentions for the meeting
- Review notes from previous sessions

## After the Session

- Review session notes
- Complete action items
- Provide feedback
- Schedule follow-up if needed
    `,
    category: "coaching",
    tags: ["coaching", "sessions", "mentoring", "scheduling"],
    views: 543,
    helpful: 98,
    notHelpful: 3,
    createdAt: "2024-04-12",
    updatedAt: "2025-01-05",
    readingTime: 4,
    relatedArticles: ["a2", "a5"],
  },
  {
    id: "a5",
    title: "Understanding 360 Assessments",
    slug: "understanding-360-assessments",
    excerpt: "A complete guide to 360-degree feedback assessments and how to use them",
    content: `
# Understanding 360 Assessments

360 assessments gather feedback from multiple perspectives to provide comprehensive insights.

## What is a 360 Assessment?

A 360-degree assessment collects feedback from:
- Self-evaluation
- Manager feedback
- Peer reviews
- Direct report feedback

## Participating as a Rater

When invited to provide feedback:
1. Complete the assessment honestly
2. Provide specific examples
3. Focus on behaviors, not personality
4. Submit before the deadline

## Reviewing Your Results

Your results will show:
- Scores across competencies
- Gap analysis (self vs. others)
- Strengths and development areas
- Trend comparisons over time
    `,
    category: "assessments",
    tags: ["assessments", "360", "feedback", "reviews"],
    views: 678,
    helpful: 112,
    notHelpful: 6,
    createdAt: "2024-05-20",
    updatedAt: "2024-12-15",
    readingTime: 5,
    relatedArticles: ["a2", "a4"],
  },
  {
    id: "a6",
    title: "Managing Notification Settings",
    slug: "notification-settings",
    excerpt: "Customize how and when you receive notifications",
    content: `
# Managing Notification Settings

Control your notification preferences to stay informed without being overwhelmed.

## Email Notifications

Choose your email frequency:
- Instant: Receive emails immediately
- Daily Digest: One summary per day
- Weekly Digest: One summary per week
- Never: Disable email notifications

## Push Notifications

Enable or disable push notifications for:
- Session reminders
- Goal deadlines
- New feedback
- Program updates

## Quiet Hours

Set quiet hours to pause notifications:
1. Go to Settings > Notifications
2. Enable Quiet Hours
3. Set start and end times
4. Choose your timezone
    `,
    category: "settings",
    tags: ["notifications", "settings", "preferences", "email"],
    views: 345,
    helpful: 67,
    notHelpful: 2,
    createdAt: "2024-06-10",
    updatedAt: "2024-11-20",
    readingTime: 3,
    relatedArticles: ["a1", "a7"],
  },
  {
    id: "a7",
    title: "Troubleshooting Login Issues",
    slug: "login-issues",
    excerpt: "Solutions for common login problems and account access issues",
    content: `
# Troubleshooting Login Issues

Having trouble logging in? Here are solutions to common problems.

## Forgot Password

1. Click "Forgot Password" on the login page
2. Enter your email address
3. Check your inbox for reset link
4. Create a new password

## Account Locked

Your account may be locked after multiple failed attempts:
- Wait 30 minutes and try again
- Or contact support for immediate unlock

## Browser Issues

Try these steps:
1. Clear your browser cache
2. Disable browser extensions
3. Try a different browser
4. Check for JavaScript errors

## Still Having Issues?

Contact support with:
- Your email address
- Error messages (if any)
- Browser and device info
    `,
    category: "troubleshooting",
    tags: ["login", "password", "access", "troubleshooting"],
    views: 1234,
    helpful: 189,
    notHelpful: 15,
    createdAt: "2024-07-05",
    updatedAt: "2025-01-25",
    readingTime: 4,
    relatedArticles: ["a6", "a8"],
  },
  {
    id: "a8",
    title: "Connecting Integrations",
    slug: "connecting-integrations",
    excerpt: "How to connect Transformation OS with your favorite tools",
    content: `
# Connecting Integrations

Enhance your experience by connecting with external tools.

## Available Integrations

- **Slack**: Get notifications in your workspace
- **Google Calendar**: Sync sessions and deadlines
- **Microsoft Teams**: Collaborate with your team
- **Zoom**: Join coaching sessions directly

## Setting Up an Integration

1. Go to Settings > Integrations
2. Find the integration you want
3. Click "Connect"
4. Authorize the connection
5. Configure preferences

## Managing Connections

You can:
- View connected apps
- Update permissions
- Disconnect integrations
- Troubleshoot sync issues
    `,
    category: "integrations",
    tags: ["integrations", "slack", "calendar", "zoom"],
    views: 456,
    helpful: 78,
    notHelpful: 4,
    createdAt: "2024-08-15",
    updatedAt: "2024-12-10",
    readingTime: 3,
    relatedArticles: ["a6", "a7"],
  },
];

export const defaultFAQs: FAQ[] = [
  {
    id: "f1",
    question: "How do I reset my password?",
    answer: "Click 'Forgot Password' on the login page, enter your email, and follow the instructions in the reset email. The link expires after 24 hours.",
    category: "troubleshooting",
    order: 1,
  },
  {
    id: "f2",
    question: "Can I change my email address?",
    answer: "Yes, go to Settings > Profile > Account and click 'Change Email'. You'll need to verify the new email address before the change takes effect.",
    category: "settings",
    order: 2,
  },
  {
    id: "f3",
    question: "How do I enroll in a learning program?",
    answer: "Navigate to the Programs page, browse available programs, and click 'Enroll' on the program you want to join. Some programs may require manager approval.",
    category: "programs",
    order: 3,
  },
  {
    id: "f4",
    question: "What happens when I complete a program?",
    answer: "Upon completion, you'll receive a certificate of completion, your progress will be recorded in your profile, and any associated goals will be updated.",
    category: "programs",
    order: 4,
  },
  {
    id: "f5",
    question: "How often should I update my goals?",
    answer: "We recommend updating goal progress at least weekly. Set up reminders in your notification preferences to stay on track.",
    category: "goals",
    order: 5,
  },
  {
    id: "f6",
    question: "Can I reschedule a coaching session?",
    answer: "Yes, you can reschedule sessions up to 24 hours before the scheduled time. Go to Coaching, find the session, and click 'Reschedule'.",
    category: "coaching",
    order: 6,
  },
  {
    id: "f7",
    question: "Who can see my 360 assessment results?",
    answer: "By default, only you and your direct manager can see your results. Some assessments may be shared with HR or coaches based on your organization's settings.",
    category: "assessments",
    order: 7,
  },
  {
    id: "f8",
    question: "How do I invite team members?",
    answer: "Go to People > Invite Members, enter their email addresses, select their role, and send invitations. They'll receive an email to create their account.",
    category: "people",
    order: 8,
  },
  {
    id: "f9",
    question: "Is my data secure?",
    answer: "Yes, we use industry-standard encryption, regular security audits, and comply with GDPR and SOC 2 requirements. Your data is never shared without consent.",
    category: "settings",
    order: 9,
  },
  {
    id: "f10",
    question: "How do I cancel my subscription?",
    answer: "Contact your account administrator or our support team to discuss subscription changes. We offer flexible options including plan downgrades.",
    category: "billing",
    order: 10,
  },
];

export const defaultTickets: SupportTicket[] = [
  {
    id: "t1",
    subject: "Unable to access program materials",
    description: "I enrolled in Leadership Fundamentals but cannot view the video content in Module 3.",
    category: "bug",
    priority: "high",
    status: "in_progress",
    createdAt: "2025-01-28T10:30:00Z",
    updatedAt: "2025-01-29T14:15:00Z",
    assignedTo: "Support Team",
    messages: [
      {
        id: "m1",
        ticketId: "t1",
        sender: "user",
        senderName: "John Doe",
        message: "I enrolled in Leadership Fundamentals but cannot view the video content in Module 3. The video player shows a loading spinner but never loads.",
        timestamp: "2025-01-28T10:30:00Z",
      },
      {
        id: "m2",
        ticketId: "t1",
        sender: "support",
        senderName: "Sarah (Support)",
        message: "Hi John, thank you for reporting this issue. We've identified a temporary problem with video streaming and our team is working on a fix. In the meantime, try clearing your browser cache or using a different browser.",
        timestamp: "2025-01-29T14:15:00Z",
      },
    ],
  },
  {
    id: "t2",
    subject: "Request for additional user seats",
    description: "We need to add 5 more users to our team plan.",
    category: "account",
    priority: "medium",
    status: "resolved",
    createdAt: "2025-01-20T09:00:00Z",
    updatedAt: "2025-01-21T11:30:00Z",
    assignedTo: "Billing Team",
    messages: [
      {
        id: "m3",
        ticketId: "t2",
        sender: "user",
        senderName: "John Doe",
        message: "We need to add 5 more users to our team plan. Can you help with this upgrade?",
        timestamp: "2025-01-20T09:00:00Z",
      },
      {
        id: "m4",
        ticketId: "t2",
        sender: "support",
        senderName: "Mike (Billing)",
        message: "Hi John, I've added 5 additional seats to your account. The prorated charge will appear on your next invoice. You can now invite new team members from the People section.",
        timestamp: "2025-01-21T11:30:00Z",
      },
    ],
  },
];

export const categoryConfig: Record<ArticleCategory, { bg: string; text: string }> = {
  "getting-started": { bg: "bg-purple-100", text: "text-purple-700" },
  programs: { bg: "bg-blue-100", text: "text-blue-700" },
  goals: { bg: "bg-green-100", text: "text-green-700" },
  coaching: { bg: "bg-orange-100", text: "text-orange-700" },
  assessments: { bg: "bg-pink-100", text: "text-pink-700" },
  people: { bg: "bg-cyan-100", text: "text-cyan-700" },
  settings: { bg: "bg-gray-100", text: "text-gray-700" },
  billing: { bg: "bg-yellow-100", text: "text-yellow-700" },
  integrations: { bg: "bg-indigo-100", text: "text-indigo-700" },
  troubleshooting: { bg: "bg-red-100", text: "text-red-700" },
};

export const ticketStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  open: { label: "Open", bg: "bg-blue-100", text: "text-blue-700" },
  in_progress: { label: "In Progress", bg: "bg-yellow-100", text: "text-yellow-700" },
  waiting: { label: "Waiting", bg: "bg-purple-100", text: "text-purple-700" },
  resolved: { label: "Resolved", bg: "bg-green-100", text: "text-green-700" },
  closed: { label: "Closed", bg: "bg-gray-100", text: "text-gray-700" },
};

export const ticketPriorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: "Low", bg: "bg-gray-100", text: "text-gray-600" },
  medium: { label: "Medium", bg: "bg-blue-100", text: "text-blue-600" },
  high: { label: "High", bg: "bg-orange-100", text: "text-orange-600" },
  urgent: { label: "Urgent", bg: "bg-red-100", text: "text-red-600" },
};
