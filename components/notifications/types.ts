// Notifications Types

export type NotificationType =
  | "program_update"
  | "goal_reminder"
  | "assessment_invite"
  | "coaching_session"
  | "feedback_received"
  | "achievement"
  | "mention"
  | "system"
  | "deadline"
  | "approval_request";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationStatus = "unread" | "read" | "archived";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: {
    programId?: string;
    goalId?: string;
    assessmentId?: string;
    sessionId?: string;
    [key: string]: string | undefined;
  };
}

export interface NotificationGroup {
  date: string;
  label: string;
  notifications: Notification[];
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    digest: "instant" | "daily" | "weekly" | "never";
    types: {
      program_updates: boolean;
      goal_reminders: boolean;
      assessment_invites: boolean;
      coaching_sessions: boolean;
      feedback: boolean;
      achievements: boolean;
      mentions: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      program_updates: boolean;
      goal_reminders: boolean;
      assessment_invites: boolean;
      coaching_sessions: boolean;
      feedback: boolean;
      achievements: boolean;
      mentions: boolean;
      system: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    showBadge: boolean;
    playSound: boolean;
    types: {
      program_updates: boolean;
      goal_reminders: boolean;
      assessment_invites: boolean;
      coaching_sessions: boolean;
      feedback: boolean;
      achievements: boolean;
      mentions: boolean;
      system: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Props interfaces
export interface NotificationsPageProps {
  notifications?: Notification[];
  preferences?: NotificationPreferences;
  stats?: NotificationStats;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdatePreferences?: (preferences: Partial<NotificationPreferences>) => void;
}

export interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export interface NotificationDropdownProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onViewAll?: () => void;
}

export interface NotificationPreferencesProps {
  preferences?: NotificationPreferences;
  onSave?: (preferences: Partial<NotificationPreferences>) => void;
}
