'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useNotifications,
  useNotificationPreferences,
  useMarkRead,
  useMarkAllRead,
  useArchiveNotification,
  useUpdatePreferences,
} from '@/hooks/api/useNotifications';
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  Search,
  Settings,
  Inbox,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  BookOpen,
  Target,
  ClipboardList,
  Users,
  MessageSquare,
  Award,
  AtSign,
  CheckCircle,
  Mail,
  Smartphone,
  Moon,
  Save,
  RotateCcw,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

type NotificationType =
  | 'program_update'
  | 'goal_reminder'
  | 'assessment_invite'
  | 'assessment_reminder'
  | 'coaching_session'
  | 'feedback_received'
  | 'achievement'
  | 'mention'
  | 'system'
  | 'deadline'
  | 'approval_request'
  | 'enrollment';

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
type NotificationStatus = 'unread' | 'read' | 'archived';

interface Notification {
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
  };
}

interface NotificationPreferences {
  email: {
    enabled: boolean;
    digest: 'instant' | 'daily' | 'weekly' | 'never';
    types: Record<string, boolean>;
  };
  push: {
    enabled: boolean;
    types: Record<string, boolean>;
  };
  inApp: {
    enabled: boolean;
    showBadge: boolean;
    playSound: boolean;
    types: Record<string, boolean>;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

// ─── Preferences Defaults ─────────────────────────────────────────────────────

const initialPreferences: NotificationPreferences = {
  email: {
    enabled: true,
    digest: 'daily',
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
    start: '22:00',
    end: '08:00',
    timezone: 'America/New_York',
  },
};

const notificationTypeConfig: Record<
  string,
  { label: string; icon: string; bg: string; text: string }
> = {
  program_update: {
    label: 'Program Update',
    icon: 'BookOpen',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  goal_reminder: {
    label: 'Goal Reminder',
    icon: 'Target',
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  assessment_invite: {
    label: 'Assessment',
    icon: 'ClipboardList',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  coaching_session: {
    label: 'Mentoring',
    icon: 'Users',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
  },
  feedback_received: {
    label: 'Feedback',
    icon: 'MessageSquare',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
  },
  achievement: {
    label: 'Achievement',
    icon: 'Award',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
  mention: { label: 'Mention', icon: 'AtSign', bg: 'bg-pink-100', text: 'text-pink-700' },
  system: { label: 'System', icon: 'Settings', bg: 'bg-gray-100', text: 'text-gray-700' },
  deadline: { label: 'Deadline', icon: 'Clock', bg: 'bg-red-100', text: 'text-red-700' },
  approval_request: {
    label: 'Approval',
    icon: 'CheckCircle',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
  },
  enrollment: { label: 'Enrollment', icon: 'BookOpen', bg: 'bg-blue-100', text: 'text-blue-700' },
  assessment_reminder: {
    label: 'Assessment',
    icon: 'ClipboardList',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
};

const priorityConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  low: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  medium: { label: 'Medium', bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-400' },
  high: { label: 'High', bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-400' },
  urgent: { label: 'Urgent', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' },
};

const preferenceTypeLabels: Record<string, { label: string; description: string }> = {
  program_updates: {
    label: 'Program Updates',
    description: 'New modules, content releases, and program changes',
  },
  goal_reminders: {
    label: 'Goal Reminders',
    description: 'Check-in reminders and deadline notifications',
  },
  assessment_invites: {
    label: 'Assessment Invitations',
    description: 'Invitations to complete or provide feedback',
  },
  coaching_sessions: {
    label: 'Mentoring Sessions',
    description: 'Session reminders, notes, and scheduling updates',
  },
  feedback: { label: 'Feedback', description: 'When someone provides feedback on your work' },
  achievements: {
    label: 'Achievements',
    description: 'Badges, certificates, and milestone completions',
  },
  mentions: { label: 'Mentions', description: 'When someone mentions you in discussions' },
  system: {
    label: 'System Notifications',
    description: 'Maintenance, updates, and system announcements',
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Target,
  ClipboardList,
  Users,
  MessageSquare,
  Award,
  AtSign,
  Settings,
  Clock,
  CheckCircle,
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupNotificationsByDate(notifications: Notification[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const groups: { label: string; notifications: Notification[] }[] = [
    { label: 'Today', notifications: [] },
    { label: 'Yesterday', notifications: [] },
    { label: 'This Week', notifications: [] },
    { label: 'Earlier', notifications: [] },
  ];

  notifications.forEach((n) => {
    const date = new Date(n.timestamp);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      groups[0].notifications.push(n);
    } else if (date.getTime() === yesterday.getTime()) {
      groups[1].notifications.push(n);
    } else if (date >= thisWeek) {
      groups[2].notifications.push(n);
    } else {
      groups[3].notifications.push(n);
    }
  });

  return groups.filter((g) => g.notifications.length > 0);
}

function computeStats(notifications: Notification[]) {
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  notifications.forEach((n) => {
    byType[n.type] = (byType[n.type] || 0) + 1;
    byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
  });

  return {
    total: notifications.length,
    unread: notifications.filter((n) => n.status === 'unread').length,
    byType,
    byPriority,
  };
}

// ─── Toggle Component ───────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
        enabled ? 'bg-red-600' : 'bg-gray-200'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'left-5' : 'left-1'
        }`}
      />
    </button>
  );
}

// ─── NotificationCard Component ─────────────────────────────────────────────────

function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const typeConfig = notificationTypeConfig[notification.type] ?? notificationTypeConfig.system;
  const prioConfig = priorityConfig[notification.priority] ?? priorityConfig.medium;
  const Icon = iconMap[typeConfig.icon] || Settings;

  const handleClick = () => {
    if (notification.status === 'unread') {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`relative p-4 border-b border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer ${
        notification.status === 'unread' ? 'bg-red-50/40' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${typeConfig.bg} shrink-0`}>
          <Icon className={`w-5 h-5 ${typeConfig.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-medium ${
                  notification.status === 'unread' ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {notification.title}
              </h4>
              {notification.status === 'unread' && (
                <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              )}
              {(notification.priority === 'high' || notification.priority === 'urgent') && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${prioConfig.bg} ${prioConfig.text}`}
                >
                  {prioConfig.label}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatTimeAgo(notification.timestamp)}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>

          {/* Sender & Action */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {notification.sender && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-medium">
                    {notification.sender.name.slice(0, 1)}
                  </div>
                  <span className="text-xs text-gray-500">{notification.sender.name}</span>
                </div>
              )}
              <span className={`px-1.5 py-0.5 rounded text-xs ${typeConfig.bg} ${typeConfig.text}`}>
                {typeConfig.label}
              </span>
            </div>

            {notification.actionLabel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="text-xs text-red-600 hover:underline flex items-center gap-1"
              >
                {notification.actionLabel}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                {notification.status === 'unread' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(notification.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Preferences Panel Component ────────────────────────────────────────────────

function PreferencesPanel({
  preferences,
  onBack,
  onSave,
}: {
  preferences: NotificationPreferences;
  onBack: () => void;
  onSave?: (prefs: NotificationPreferences) => void;
}) {
  const updatePreferences = useUpdatePreferences();
  const [config, setConfig] = useState<NotificationPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when real preferences load from API
  useEffect(() => {
    setConfig(preferences);
    setHasChanges(false);
  }, [preferences]);

  const handleToggle = (channel: 'email' | 'push' | 'inApp', key: string) => {
    setConfig((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        types: {
          ...prev[channel].types,
          [key]: !prev[channel].types[key],
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Serialize per-type channel toggles + extra booleans into flat JSONB preferences
    const perTypePreferences: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(config.email.types)) {
      perTypePreferences[`email_${key}`] = val;
    }
    for (const [key, val] of Object.entries(config.push.types)) {
      perTypePreferences[`push_${key}`] = val;
    }
    for (const [key, val] of Object.entries(config.inApp.types)) {
      perTypePreferences[`inApp_${key}`] = val;
    }
    // Extra settings not covered by top-level API fields
    perTypePreferences['push_enabled'] = config.push.enabled;
    perTypePreferences['showBadge'] = config.inApp.showBadge;
    perTypePreferences['playSound'] = config.inApp.playSound;

    updatePreferences.mutate({
      emailEnabled: config.email.enabled,
      emailDigest: config.email.digest,
      inAppEnabled: config.inApp.enabled,
      quietHoursEnabled: config.quietHours.enabled,
      quietHoursStart: config.quietHours.start,
      quietHoursEnd: config.quietHours.end,
      timezone: config.quietHours.timezone,
      preferences: perTypePreferences,
    });
    setHasChanges(false);
    onSave?.(config);
  };

  const handleReset = () => {
    setConfig(initialPreferences);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm text-red-600 hover:underline flex items-center gap-1"
      >
        <Bell className="w-4 h-4" />
        Back to Notifications
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-sm text-gray-500">Choose how and when you want to be notified</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <Toggle
            enabled={config.email.enabled}
            onChange={() => {
              setConfig((prev) => ({
                ...prev,
                email: { ...prev.email, enabled: !prev.email.enabled },
              }));
              setHasChanges(true);
            }}
          />
        </div>

        {config.email.enabled && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email Digest Frequency
              </label>
              <select
                value={config.email.digest}
                onChange={(e) => {
                  setConfig((prev) => ({
                    ...prev,
                    email: {
                      ...prev.email,
                      digest: e.target.value as 'instant' | 'daily' | 'weekly' | 'never',
                    },
                  }));
                  setHasChanges(true);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="space-y-4">
              {Object.entries(preferenceTypeLabels).map(([key, { label, description }]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                  <Toggle
                    enabled={config.email.types[key] ?? false}
                    onChange={() => handleToggle('email', key)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications on your device</p>
          </div>
          <Toggle
            enabled={config.push.enabled}
            onChange={() => {
              setConfig((prev) => ({
                ...prev,
                push: { ...prev.push, enabled: !prev.push.enabled },
              }));
              setHasChanges(true);
            }}
          />
        </div>

        {config.push.enabled && (
          <div className="space-y-4">
            {Object.entries(preferenceTypeLabels).map(([key, { label, description }]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
                <Toggle
                  enabled={config.push.types[key] ?? false}
                  onChange={() => handleToggle('push', key)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-App Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Bell className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">In-App Notifications</h3>
            <p className="text-sm text-gray-500">Notifications within the application</p>
          </div>
          <Toggle
            enabled={config.inApp.enabled}
            onChange={() => {
              setConfig((prev) => ({
                ...prev,
                inApp: { ...prev.inApp, enabled: !prev.inApp.enabled },
              }));
              setHasChanges(true);
            }}
          />
        </div>

        {config.inApp.enabled && (
          <>
            <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.inApp.showBadge}
                  onChange={() => {
                    setConfig((prev) => ({
                      ...prev,
                      inApp: { ...prev.inApp, showBadge: !prev.inApp.showBadge },
                    }));
                    setHasChanges(true);
                  }}
                  className="w-4 h-4 rounded border-gray-200 text-red-600 focus:ring-red-600"
                />
                <span className="text-sm text-gray-900">Show badge count</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.inApp.playSound}
                  onChange={() => {
                    setConfig((prev) => ({
                      ...prev,
                      inApp: { ...prev.inApp, playSound: !prev.inApp.playSound },
                    }));
                    setHasChanges(true);
                  }}
                  className="w-4 h-4 rounded border-gray-200 text-red-600 focus:ring-red-600"
                />
                <span className="text-sm text-gray-900">Play sound</span>
              </label>
            </div>

            <div className="space-y-4">
              {Object.entries(preferenceTypeLabels).map(([key, { label, description }]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                  <Toggle
                    enabled={config.inApp.types[key] ?? false}
                    onChange={() => handleToggle('inApp', key)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Moon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Quiet Hours</h3>
            <p className="text-sm text-gray-500">Pause notifications during specific hours</p>
          </div>
          <Toggle
            enabled={config.quietHours.enabled}
            onChange={() => {
              setConfig((prev) => ({
                ...prev,
                quietHours: {
                  ...prev.quietHours,
                  enabled: !prev.quietHours.enabled,
                },
              }));
              setHasChanges(true);
            }}
          />
        </div>

        {config.quietHours.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Start Time</label>
              <input
                type="time"
                value={config.quietHours.start}
                onChange={(e) => {
                  setConfig((prev) => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, start: e.target.value },
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">End Time</label>
              <input
                type="time"
                value={config.quietHours.end}
                onChange={(e) => {
                  setConfig((prev) => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, end: e.target.value },
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Timezone</label>
              <select
                value={config.quietHours.timezone}
                onChange={(e) => {
                  setConfig((prev) => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, timezone: e.target.value },
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────────

type ViewMode = 'all' | 'unread' | 'archived';
type PageMode = 'notifications' | 'preferences';

export default function NotificationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [pageMode, setPageMode] = useState<PageMode>('notifications');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Real API data ────────────────────────────────────────────────────────────
  const { data: apiData, isLoading } = useNotifications();
  const { data: apiPrefs } = useNotificationPreferences();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const archiveNotification = useArchiveNotification();

  // Map API notifications to the local shape (createdAt → timestamp)
  const notificationList: Notification[] = useMemo(
    () =>
      (apiData?.notifications ?? []).map((n) => ({
        id: n.id,
        type: (n.type as NotificationType) ?? 'system',
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        status: n.status,
        priority: (n.priority as NotificationPriority) ?? 'medium',
        actionUrl: n.actionUrl ?? undefined,
        actionLabel: n.actionLabel ?? undefined,
      })),
    [apiData]
  );

  // Map API preferences (flat DB shape) to the nested local shape used by PreferencesPanel
  const loadedPreferences = useMemo((): NotificationPreferences => {
    if (!apiPrefs) return initialPreferences;
    const raw = (apiPrefs.preferences ?? {}) as Record<string, boolean>;

    const extractTypes = (prefix: string) =>
      Object.fromEntries(
        Object.keys(preferenceTypeLabels).map((key) => [
          key,
          raw[`${prefix}_${key}`] ?? initialPreferences.email.types[key] ?? true,
        ])
      );

    return {
      email: {
        enabled: apiPrefs.emailEnabled,
        digest: apiPrefs.emailDigest,
        types: extractTypes('email'),
      },
      push: {
        enabled: raw['push_enabled'] ?? true,
        types: extractTypes('push'),
      },
      inApp: {
        enabled: apiPrefs.inAppEnabled,
        showBadge: raw['showBadge'] ?? true,
        playSound: raw['playSound'] ?? false,
        types: extractTypes('inApp'),
      },
      quietHours: {
        enabled: apiPrefs.quietHoursEnabled,
        start: apiPrefs.quietHoursStart ?? '22:00',
        end: apiPrefs.quietHoursEnd ?? '08:00',
        timezone: apiPrefs.timezone ?? 'America/New_York',
      },
    };
  }, [apiPrefs]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleMarkAsRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllRead.mutate();
  };

  const handleArchive = (id: string) => {
    archiveNotification.mutate(id);
  };

  const handleDelete = (id: string) => {
    archiveNotification.mutate(id);
  };

  // ── Computed Values ─────────────────────────────────────────────────────────

  const filteredNotifications = notificationList
    .filter((n) => {
      if (viewMode === 'unread') return n.status === 'unread';
      if (viewMode === 'archived') return n.status === 'archived';
      return n.status !== 'archived';
    })
    .filter((n) => (typeFilter === 'all' ? true : n.type === typeFilter))
    .filter((n) => (priorityFilter === 'all' ? true : n.priority === priorityFilter))
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const unreadCount = notificationList.filter((n) => n.status === 'unread').length;
  const stats = computeStats(notificationList);
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 text-sm">Loading notifications...</div>
        </div>
      </div>
    );
  }

  // ── Preferences View ────────────────────────────────────────────────────────

  if (pageMode === 'preferences') {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <PreferencesPanel
          preferences={loadedPreferences}
          onBack={() => setPageMode('notifications')}
          onSave={() => {
            /* preferences saved via PreferencesPanel internal logic */
          }}
        />
      </div>
    );
  }

  // ── Notifications View ──────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Notifications</h1>
              <p className="text-gray-500 text-sm">Stay up to date with your activities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark All Read</span>
                <span className="sm:hidden">Read All</span>
              </button>
            )}
            <button
              onClick={() => setPageMode('preferences')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Inbox className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{unreadCount}</div>
              <div className="text-sm text-gray-500">Unread</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {(stats.byPriority.high || 0) + (stats.byPriority.urgent || 0)}
              </div>
              <div className="text-sm text-gray-500">High Priority</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {(stats.byType.deadline || 0) + (stats.byType.goal_reminder || 0)}
              </div>
              <div className="text-sm text-gray-500">Action Required</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: 3-column grid on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content (3/4) */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === 'all' ? 'bg-red-600 text-white' : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('unread')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  viewMode === 'unread' ? 'bg-red-600 text-white' : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${
                      viewMode === 'unread' ? 'bg-white/20' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('archived')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === 'archived'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                Archived
              </button>
            </div>

            {/* Search and Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 text-sm w-40 sm:w-48 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Types</option>
                {Object.entries(notificationTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Priority</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {groupedNotifications.length > 0 ? (
              groupedNotifications.map((group) => (
                <div key={group.label}>
                  <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {group.notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-gray-900 font-medium mb-1">No Notifications</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : viewMode === 'unread'
                      ? "You're all caught up!"
                      : "You don't have any notifications yet"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (1/4) */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Quick Filters by Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Type</h3>
            <div className="space-y-2">
              {Object.entries(notificationTypeConfig).map(([key, config]) => {
                const count = stats.byType[key] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      typeFilter === key
                        ? 'bg-red-50 text-red-600'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <span className="text-sm">{config.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.text}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Filters by Priority */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Priority</h3>
            <div className="space-y-2">
              {Object.entries(priorityConfig).map(([key, config]) => {
                const count = stats.byPriority[key] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setPriorityFilter(priorityFilter === key ? 'all' : key)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      priorityFilter === key
                        ? 'bg-red-50 text-red-600'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Mark all as read</span>
              </button>
              <button
                onClick={() => setPageMode('preferences')}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Notification settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
