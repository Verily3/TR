import type {
  UserProfile,
  NotificationPreferences,
  SecuritySettings,
  Integration,
  OrganizationSettings,
  BillingInfo,
} from "./types";

export const defaultProfile: UserProfile = {
  id: "u1",
  name: "John Doe",
  email: "john.doe@company.com",
  title: "Senior Manager",
  department: "Operations",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  timezone: "America/Los_Angeles",
  language: "en",
  bio: "Passionate about leadership development and organizational transformation. 10+ years of experience in operations and team management.",
};

export const defaultNotifications: NotificationPreferences = {
  email: {
    programUpdates: true,
    assessmentReminders: true,
    goalDeadlines: true,
    coachingReminders: true,
    weeklyDigest: true,
    marketingEmails: false,
  },
  push: {
    programUpdates: true,
    assessmentReminders: true,
    goalDeadlines: false,
    coachingReminders: true,
    directMessages: true,
  },
  inApp: {
    showBadges: true,
    soundEnabled: false,
    desktopNotifications: true,
  },
};

export const defaultSecurity: SecuritySettings = {
  twoFactorEnabled: true,
  twoFactorMethod: "authenticator",
  lastPasswordChange: "2024-11-15T10:00:00Z",
  activeSessions: [
    {
      id: "s1",
      device: "MacBook Pro",
      browser: "Chrome 120",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.100",
      lastActive: "2025-01-30T14:30:00Z",
      isCurrent: true,
    },
    {
      id: "s2",
      device: "iPhone 15 Pro",
      browser: "Safari Mobile",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.101",
      lastActive: "2025-01-30T10:15:00Z",
      isCurrent: false,
    },
    {
      id: "s3",
      device: "Windows Desktop",
      browser: "Edge 120",
      location: "New York, NY",
      ipAddress: "10.0.0.50",
      lastActive: "2025-01-28T16:45:00Z",
      isCurrent: false,
    },
  ],
  loginHistory: [
    {
      id: "l1",
      device: "MacBook Pro",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.100",
      timestamp: "2025-01-30T08:00:00Z",
      success: true,
    },
    {
      id: "l2",
      device: "iPhone 15 Pro",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.101",
      timestamp: "2025-01-29T19:30:00Z",
      success: true,
    },
    {
      id: "l3",
      device: "Unknown Device",
      location: "Moscow, Russia",
      ipAddress: "185.220.100.240",
      timestamp: "2025-01-28T03:15:00Z",
      success: false,
    },
    {
      id: "l4",
      device: "Windows Desktop",
      location: "New York, NY",
      ipAddress: "10.0.0.50",
      timestamp: "2025-01-28T09:00:00Z",
      success: true,
    },
  ],
};

export const defaultIntegrations: Integration[] = [
  {
    id: "int1",
    name: "Slack",
    description: "Send notifications and updates to Slack channels",
    icon: "slack",
    category: "communication",
    connected: true,
    connectedAt: "2024-10-15T10:00:00Z",
  },
  {
    id: "int2",
    name: "Microsoft Teams",
    description: "Integrate with Microsoft Teams for messaging and meetings",
    icon: "teams",
    category: "communication",
    connected: false,
  },
  {
    id: "int3",
    name: "Google Calendar",
    description: "Sync coaching sessions and program events",
    icon: "google-calendar",
    category: "calendar",
    connected: true,
    connectedAt: "2024-09-20T14:30:00Z",
  },
  {
    id: "int4",
    name: "Outlook Calendar",
    description: "Sync with Microsoft Outlook calendar",
    icon: "outlook",
    category: "calendar",
    connected: false,
  },
  {
    id: "int5",
    name: "Google Drive",
    description: "Store and share program resources",
    icon: "google-drive",
    category: "storage",
    connected: false,
  },
  {
    id: "int6",
    name: "Dropbox",
    description: "Connect Dropbox for file storage",
    icon: "dropbox",
    category: "storage",
    connected: false,
  },
  {
    id: "int7",
    name: "Workday",
    description: "Sync employee data from Workday",
    icon: "workday",
    category: "hr",
    connected: true,
    connectedAt: "2024-08-01T09:00:00Z",
  },
  {
    id: "int8",
    name: "BambooHR",
    description: "Import employee information from BambooHR",
    icon: "bamboohr",
    category: "hr",
    connected: false,
  },
  {
    id: "int9",
    name: "Tableau",
    description: "Export analytics data to Tableau",
    icon: "tableau",
    category: "analytics",
    connected: false,
  },
  {
    id: "int10",
    name: "Power BI",
    description: "Connect to Microsoft Power BI for reporting",
    icon: "powerbi",
    category: "analytics",
    connected: false,
  },
];

export const defaultOrganization: OrganizationSettings = {
  id: "org1",
  name: "Acme Corporation",
  domain: "acme.com",
  industry: "Technology",
  size: "500-1000",
  timezone: "America/Los_Angeles",
  dateFormat: "MM/DD/YYYY",
  fiscalYearStart: "January",
  features: {
    programs: true,
    assessments: true,
    coaching: true,
    goals: true,
    analytics: true,
  },
};

export const defaultBilling: BillingInfo = {
  plan: "professional",
  billingCycle: "annual",
  nextBillingDate: "2025-03-01",
  paymentMethod: {
    type: "card",
    last4: "4242",
    brand: "Visa",
  },
  usage: {
    users: 156,
    usersLimit: 200,
    storage: 45,
    storageLimit: 100,
  },
};

export const timezones = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

export const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

export const planFeatures: Record<string, string[]> = {
  free: ["Up to 10 users", "Basic programs", "Email support"],
  starter: [
    "Up to 50 users",
    "Programs & Goals",
    "Basic analytics",
    "Email support",
  ],
  professional: [
    "Up to 200 users",
    "All features",
    "Advanced analytics",
    "Priority support",
    "API access",
  ],
  enterprise: [
    "Unlimited users",
    "All features",
    "Custom integrations",
    "Dedicated support",
    "SLA guarantee",
    "SSO/SAML",
  ],
};
