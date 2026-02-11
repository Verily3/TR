import type { SearchResult, RecentSearch, QuickAction, SearchCategory } from "./types";

export const searchableItems: SearchResult[] = [
  // Pages
  {
    id: "page-dashboard",
    type: "page",
    title: "Dashboard",
    subtitle: "Home",
    description: "Your personalized dashboard with goals, programs, and activity",
    icon: "Home",
    url: "/dashboard",
    category: "pages",
    keywords: ["home", "overview", "main", "start"],
  },
  {
    id: "page-scorecard",
    type: "page",
    title: "Scorecard",
    subtitle: "Performance",
    description: "View your performance scorecard and metrics",
    icon: "BarChart3",
    url: "/scorecard",
    category: "pages",
    keywords: ["performance", "metrics", "kpi", "scores"],
  },
  {
    id: "page-planning",
    type: "page",
    title: "Planning & Goals",
    subtitle: "Goals",
    description: "Set and track your personal and professional goals",
    icon: "Target",
    url: "/planning",
    category: "pages",
    keywords: ["goals", "objectives", "okr", "planning", "targets"],
  },
  {
    id: "page-programs",
    type: "page",
    title: "Programs",
    subtitle: "Learning",
    description: "Browse and enroll in learning programs",
    icon: "BookOpen",
    url: "/programs",
    category: "pages",
    keywords: ["learning", "courses", "training", "development"],
  },
  {
    id: "page-coaching",
    type: "page",
    title: "Coaching",
    subtitle: "Mentoring",
    description: "Manage coaching sessions and mentoring relationships",
    icon: "Users",
    url: "/coaching",
    category: "pages",
    keywords: ["coaching", "mentoring", "sessions", "1:1", "one on one"],
  },
  {
    id: "page-assessments",
    type: "page",
    title: "360 Assessments",
    subtitle: "Feedback",
    description: "Complete and review 360-degree assessments",
    icon: "ClipboardList",
    url: "/assessments",
    category: "pages",
    keywords: ["360", "feedback", "assessment", "review", "evaluation"],
  },
  {
    id: "page-people",
    type: "page",
    title: "People",
    subtitle: "Team",
    description: "View and manage team members and organization",
    icon: "UserCircle",
    url: "/people",
    category: "pages",
    keywords: ["team", "people", "employees", "org chart", "directory"],
  },
  {
    id: "page-analytics",
    type: "page",
    title: "Analytics",
    subtitle: "Reports",
    description: "View analytics and reports",
    icon: "PieChart",
    url: "/analytics",
    category: "pages",
    keywords: ["analytics", "reports", "data", "insights", "metrics"],
  },
  {
    id: "page-settings",
    type: "page",
    title: "Settings",
    subtitle: "Preferences",
    description: "Manage your account settings and preferences",
    icon: "Settings",
    url: "/settings",
    category: "pages",
    keywords: ["settings", "preferences", "account", "profile", "configuration"],
  },
  {
    id: "page-notifications",
    type: "page",
    title: "Notifications",
    subtitle: "Alerts",
    description: "View and manage your notifications",
    icon: "Bell",
    url: "/notifications",
    category: "pages",
    keywords: ["notifications", "alerts", "messages", "updates"],
  },
  {
    id: "page-help",
    type: "page",
    title: "Help & Support",
    subtitle: "Documentation",
    description: "Get help and browse documentation",
    icon: "HelpCircle",
    url: "/help",
    category: "pages",
    keywords: ["help", "support", "documentation", "faq", "guide"],
  },

  // Programs
  {
    id: "program-1",
    type: "program",
    title: "Leadership Fundamentals",
    subtitle: "8 weeks • In Progress",
    description: "Build essential leadership skills for new managers",
    icon: "BookOpen",
    url: "/programs/leadership-fundamentals",
    category: "programs",
    keywords: ["leadership", "management", "fundamentals", "basics"],
    metadata: { status: "in_progress", progress: 65 },
  },
  {
    id: "program-2",
    type: "program",
    title: "Executive Presence",
    subtitle: "12 weeks • Not Started",
    description: "Develop your executive presence and influence",
    icon: "BookOpen",
    url: "/programs/executive-presence",
    category: "programs",
    keywords: ["executive", "presence", "influence", "communication"],
    metadata: { status: "not_started", progress: 0 },
  },
  {
    id: "program-3",
    type: "program",
    title: "Strategic Thinking",
    subtitle: "10 weeks • Completed",
    description: "Master strategic thinking and decision making",
    icon: "BookOpen",
    url: "/programs/strategic-thinking",
    category: "programs",
    keywords: ["strategy", "thinking", "decision", "planning"],
    metadata: { status: "completed", progress: 100 },
  },

  // Goals
  {
    id: "goal-1",
    type: "goal",
    title: "Improve Team Communication",
    subtitle: "Q1 2025 • On Track",
    description: "Enhance team communication through weekly standups and documentation",
    icon: "Target",
    url: "/goals/improve-team-communication",
    category: "goals",
    keywords: ["communication", "team", "collaboration"],
    metadata: { status: "on_track", progress: 72 },
  },
  {
    id: "goal-2",
    type: "goal",
    title: "Complete Leadership Certification",
    subtitle: "Q2 2025 • At Risk",
    description: "Obtain leadership certification by end of Q2",
    icon: "Target",
    url: "/goals/leadership-certification",
    category: "goals",
    keywords: ["certification", "leadership", "training"],
    metadata: { status: "at_risk", progress: 35 },
  },
  {
    id: "goal-3",
    type: "goal",
    title: "Launch New Product Feature",
    subtitle: "Q1 2025 • Completed",
    description: "Successfully launch the new dashboard feature",
    icon: "Target",
    url: "/goals/launch-product-feature",
    category: "goals",
    keywords: ["product", "launch", "feature", "release"],
    metadata: { status: "completed", progress: 100 },
  },

  // People
  {
    id: "person-1",
    type: "person",
    title: "Sarah Chen",
    subtitle: "Engineering Manager",
    description: "Engineering • Reports to you",
    icon: "UserCircle",
    url: "/people/sarah-chen",
    category: "people",
    keywords: ["sarah", "chen", "engineering", "manager"],
  },
  {
    id: "person-2",
    type: "person",
    title: "Michael Roberts",
    subtitle: "Product Lead",
    description: "Product • Your team",
    icon: "UserCircle",
    url: "/people/michael-roberts",
    category: "people",
    keywords: ["michael", "roberts", "product", "lead"],
  },
  {
    id: "person-3",
    type: "person",
    title: "Emily Watson",
    subtitle: "UX Designer",
    description: "Design • Your team",
    icon: "UserCircle",
    url: "/people/emily-watson",
    category: "people",
    keywords: ["emily", "watson", "design", "ux"],
  },

  // Coaching Sessions
  {
    id: "session-1",
    type: "coaching_session",
    title: "Weekly 1:1 with Sarah Chen",
    subtitle: "Tomorrow at 2:00 PM",
    description: "Regular coaching session",
    icon: "Users",
    url: "/coaching/sessions/session-1",
    category: "coaching",
    keywords: ["coaching", "sarah", "1:1", "weekly"],
    metadata: { date: "2025-02-03" },
  },
  {
    id: "session-2",
    type: "coaching_session",
    title: "Career Development Discussion",
    subtitle: "Feb 10 at 10:00 AM",
    description: "Quarterly career planning session",
    icon: "Users",
    url: "/coaching/sessions/session-2",
    category: "coaching",
    keywords: ["career", "development", "planning"],
    metadata: { date: "2025-02-10" },
  },

  // Assessments
  {
    id: "assessment-1",
    type: "assessment",
    title: "Q1 Leadership 360",
    subtitle: "Due in 5 days",
    description: "Complete your quarterly leadership assessment",
    icon: "ClipboardList",
    url: "/assessments/q1-leadership-360",
    category: "assessments",
    keywords: ["360", "leadership", "quarterly", "feedback"],
    metadata: { status: "pending" },
  },
  {
    id: "assessment-2",
    type: "assessment",
    title: "Team Effectiveness Survey",
    subtitle: "Completed",
    description: "Annual team effectiveness assessment",
    icon: "ClipboardList",
    url: "/assessments/team-effectiveness",
    category: "assessments",
    keywords: ["team", "effectiveness", "survey", "annual"],
    metadata: { status: "completed" },
  },

  // Help Articles
  {
    id: "article-1",
    type: "article",
    title: "Getting Started Guide",
    subtitle: "Help • 5 min read",
    description: "Learn the basics of Transformation OS",
    icon: "FileText",
    url: "/help/getting-started",
    category: "help",
    keywords: ["getting started", "guide", "basics", "tutorial"],
  },
  {
    id: "article-2",
    type: "article",
    title: "How to Set Goals",
    subtitle: "Help • 4 min read",
    description: "Best practices for setting effective goals",
    icon: "FileText",
    url: "/help/setting-goals",
    category: "help",
    keywords: ["goals", "setting", "smart", "objectives"],
  },

  // Settings
  {
    id: "setting-profile",
    type: "setting",
    title: "Profile Settings",
    subtitle: "Settings",
    description: "Update your profile information",
    icon: "User",
    url: "/settings/profile",
    category: "settings",
    keywords: ["profile", "name", "photo", "bio"],
  },
  {
    id: "setting-notifications",
    type: "setting",
    title: "Notification Preferences",
    subtitle: "Settings",
    description: "Manage your notification settings",
    icon: "Bell",
    url: "/settings/notifications",
    category: "settings",
    keywords: ["notifications", "email", "push", "alerts"],
  },
  {
    id: "setting-security",
    type: "setting",
    title: "Security Settings",
    subtitle: "Settings",
    description: "Password and security options",
    icon: "Shield",
    url: "/settings/security",
    category: "settings",
    keywords: ["security", "password", "2fa", "authentication"],
  },

  // Quick Actions
  {
    id: "action-create-goal",
    type: "action",
    title: "Create New Goal",
    subtitle: "Quick Action",
    description: "Start tracking a new goal",
    icon: "Plus",
    url: "/goals/new",
    category: "actions",
    keywords: ["create", "new", "goal", "add"],
  },
  {
    id: "action-schedule-session",
    type: "action",
    title: "Schedule Coaching Session",
    subtitle: "Quick Action",
    description: "Book a new coaching session",
    icon: "Calendar",
    url: "/coaching/new",
    category: "actions",
    keywords: ["schedule", "book", "coaching", "session", "meeting"],
  },
  {
    id: "action-invite-member",
    type: "action",
    title: "Invite Team Member",
    subtitle: "Quick Action",
    description: "Add someone to your team",
    icon: "UserPlus",
    url: "/people/invite",
    category: "actions",
    keywords: ["invite", "add", "team", "member", "user"],
  },
];

export const defaultRecentSearches: RecentSearch[] = [
  {
    id: "rs1",
    query: "leadership program",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    resultCount: 5,
  },
  {
    id: "rs2",
    query: "sarah chen",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    resultCount: 1,
  },
  {
    id: "rs3",
    query: "goal tracking",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resultCount: 8,
  },
];

export const categoryLabels: Record<SearchCategory, string> = {
  all: "All Results",
  pages: "Pages",
  programs: "Programs",
  goals: "Goals",
  people: "People",
  coaching: "Coaching",
  assessments: "Assessments",
  help: "Help Articles",
  settings: "Settings",
  actions: "Quick Actions",
};

export const categoryIcons: Record<SearchCategory, string> = {
  all: "Search",
  pages: "Layout",
  programs: "BookOpen",
  goals: "Target",
  people: "Users",
  coaching: "MessageSquare",
  assessments: "ClipboardList",
  help: "HelpCircle",
  settings: "Settings",
  actions: "Zap",
};

export const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  in_progress: { label: "In Progress", bg: "bg-blue-100", text: "text-blue-700" },
  not_started: { label: "Not Started", bg: "bg-gray-100", text: "text-gray-700" },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700" },
  on_track: { label: "On Track", bg: "bg-green-100", text: "text-green-700" },
  at_risk: { label: "At Risk", bg: "bg-yellow-100", text: "text-yellow-700" },
  behind: { label: "Behind", bg: "bg-red-100", text: "text-red-700" },
  pending: { label: "Pending", bg: "bg-yellow-100", text: "text-yellow-700" },
};

// Search function
export function searchItems(query: string, category: SearchCategory = "all"): SearchResult[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);

  return searchableItems
    .filter((item) => {
      // Filter by category
      if (category !== "all" && item.category !== category) {
        return false;
      }

      // Search in title, subtitle, description, and keywords
      const searchText = [
        item.title,
        item.subtitle,
        item.description,
        ...item.keywords,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Check if all words match
      return words.every((word) => searchText.includes(word));
    })
    .map((item) => {
      // Calculate relevance score
      let score = 0;
      const titleLower = item.title.toLowerCase();

      // Exact title match gets highest score
      if (titleLower === normalizedQuery) {
        score += 100;
      } else if (titleLower.startsWith(normalizedQuery)) {
        score += 75;
      } else if (titleLower.includes(normalizedQuery)) {
        score += 50;
      }

      // Keyword matches
      words.forEach((word) => {
        if (item.keywords.some((k) => k.toLowerCase() === word)) {
          score += 25;
        }
      });

      // Type priority (pages and actions first)
      if (item.type === "page") score += 20;
      if (item.type === "action") score += 15;

      return { ...item, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 20); // Limit results
}
