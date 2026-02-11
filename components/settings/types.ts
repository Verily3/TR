// Settings Types

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  department: string;
  phone?: string;
  location?: string;
  timezone: string;
  language: string;
  bio?: string;
}

export interface NotificationPreferences {
  email: {
    programUpdates: boolean;
    assessmentReminders: boolean;
    goalDeadlines: boolean;
    coachingReminders: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
  };
  push: {
    programUpdates: boolean;
    assessmentReminders: boolean;
    goalDeadlines: boolean;
    coachingReminders: boolean;
    directMessages: boolean;
  };
  inApp: {
    showBadges: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
  };
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: "authenticator" | "sms" | "email";
  lastPasswordChange: string;
  activeSessions: Session[];
  loginHistory: LoginEvent[];
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginEvent {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  timestamp: string;
  success: boolean;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "communication" | "calendar" | "storage" | "hr" | "analytics";
  connected: boolean;
  connectedAt?: string;
  settings?: Record<string, unknown>;
}

export interface OrganizationSettings {
  id: string;
  name: string;
  logo?: string;
  domain: string;
  industry: string;
  size: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  features: {
    programs: boolean;
    assessments: boolean;
    coaching: boolean;
    goals: boolean;
    analytics: boolean;
  };
}

export interface BillingInfo {
  plan: "free" | "starter" | "professional" | "enterprise";
  billingCycle: "monthly" | "annual";
  nextBillingDate: string;
  paymentMethod?: {
    type: "card" | "invoice";
    last4?: string;
    brand?: string;
  };
  usage: {
    users: number;
    usersLimit: number;
    storage: number;
    storageLimit: number;
  };
}

// Props interfaces
export interface SettingsPageProps {
  profile?: UserProfile;
  notifications?: NotificationPreferences;
  security?: SecuritySettings;
  integrations?: Integration[];
  organization?: OrganizationSettings;
  billing?: BillingInfo;
}

export interface ProfileSettingsProps {
  profile?: UserProfile;
  onSave?: (profile: Partial<UserProfile>) => void;
}

export interface NotificationSettingsProps {
  preferences?: NotificationPreferences;
  onSave?: (preferences: Partial<NotificationPreferences>) => void;
}

export interface SecuritySettingsProps {
  settings?: SecuritySettings;
  onChangePassword?: () => void;
  onEnable2FA?: () => void;
  onRevokeSession?: (sessionId: string) => void;
}

export interface IntegrationSettingsProps {
  integrations?: Integration[];
  onConnect?: (integrationId: string) => void;
  onDisconnect?: (integrationId: string) => void;
}

export interface AccountSettingsProps {
  organization?: OrganizationSettings;
  billing?: BillingInfo;
  onSave?: (settings: Partial<OrganizationSettings>) => void;
}
