"use client";

import { useState } from "react";
import {
  Mail,
  Bell,
  Smartphone,
  Moon,
  Save,
  RotateCcw,
} from "lucide-react";
import { Card } from "../ui";
import type { NotificationPreferencesProps, NotificationPreferences as NotificationPreferencesType } from "./types";
import { defaultPreferences } from "./data";

const notificationTypeLabels: Record<string, { label: string; description: string }> = {
  program_updates: {
    label: "Program Updates",
    description: "New modules, content releases, and program changes",
  },
  goal_reminders: {
    label: "Goal Reminders",
    description: "Check-in reminders and deadline notifications",
  },
  assessment_invites: {
    label: "Assessment Invitations",
    description: "Invitations to complete or provide feedback",
  },
  coaching_sessions: {
    label: "Coaching Sessions",
    description: "Session reminders, notes, and scheduling updates",
  },
  feedback: {
    label: "Feedback",
    description: "When someone provides feedback on your work",
  },
  achievements: {
    label: "Achievements",
    description: "Badges, certificates, and milestone completions",
  },
  mentions: {
    label: "Mentions",
    description: "When someone mentions you in discussions",
  },
  system: {
    label: "System Notifications",
    description: "Maintenance, updates, and system announcements",
  },
};

export function NotificationPreferencesPanel({
  preferences = defaultPreferences,
  onSave,
}: NotificationPreferencesProps) {
  const [config, setConfig] = useState<NotificationPreferencesType>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEmailToggle = (key: keyof typeof config.email.types) => {
    setConfig({
      ...config,
      email: {
        ...config.email,
        types: {
          ...config.email.types,
          [key]: !config.email.types[key],
        },
      },
    });
    setHasChanges(true);
  };

  const handlePushToggle = (key: keyof typeof config.push.types) => {
    setConfig({
      ...config,
      push: {
        ...config.push,
        types: {
          ...config.push.types,
          [key]: !config.push.types[key],
        },
      },
    });
    setHasChanges(true);
  };

  const handleInAppToggle = (key: keyof typeof config.inApp.types) => {
    setConfig({
      ...config,
      inApp: {
        ...config.inApp,
        types: {
          ...config.inApp.types,
          [key]: !config.inApp.types[key],
        },
      },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(config);
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(defaultPreferences);
    setHasChanges(true);
  };

  const Toggle = ({
    enabled,
    onChange,
  }: {
    enabled: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-muted"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? "left-5" : "left-1"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Notification Preferences
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose how and when you want to be notified
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Email Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Toggle
            enabled={config.email.enabled}
            onChange={() => {
              setConfig({
                ...config,
                email: { ...config.email, enabled: !config.email.enabled },
              });
              setHasChanges(true);
            }}
          />
        </div>

        {config.email.enabled && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Email Digest Frequency
              </label>
              <select
                value={config.email.digest}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    email: {
                      ...config.email,
                      digest: e.target.value as "instant" | "daily" | "weekly" | "never",
                    },
                  });
                  setHasChanges(true);
                }}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="space-y-4">
              {Object.entries(notificationTypeLabels).map(([key, { label, description }]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-sidebar-foreground">
                      {label}
                    </div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                  <Toggle
                    enabled={config.email.types[key as keyof typeof config.email.types]}
                    onChange={() => handleEmailToggle(key as keyof typeof config.email.types)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Push Notifications */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Push Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Receive notifications on your device
            </p>
          </div>
          <Toggle
            enabled={config.push.enabled}
            onChange={() => {
              setConfig({
                ...config,
                push: { ...config.push, enabled: !config.push.enabled },
              });
              setHasChanges(true);
            }}
          />
        </div>

        {config.push.enabled && (
          <div className="space-y-4">
            {Object.entries(notificationTypeLabels).map(([key, { label, description }]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-sidebar-foreground">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
                <Toggle
                  enabled={config.push.types[key as keyof typeof config.push.types]}
                  onChange={() => handlePushToggle(key as keyof typeof config.push.types)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* In-App Notifications */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Bell className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-sidebar-foreground">
              In-App Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Notifications within the application
            </p>
          </div>
          <Toggle
            enabled={config.inApp.enabled}
            onChange={() => {
              setConfig({
                ...config,
                inApp: { ...config.inApp, enabled: !config.inApp.enabled },
              });
              setHasChanges(true);
            }}
          />
        </div>

        {config.inApp.enabled && (
          <>
            <div className="flex items-center gap-6 mb-6 pb-4 border-b border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.inApp.showBadge}
                  onChange={() => {
                    setConfig({
                      ...config,
                      inApp: { ...config.inApp, showBadge: !config.inApp.showBadge },
                    });
                    setHasChanges(true);
                  }}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm text-sidebar-foreground">Show badge count</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.inApp.playSound}
                  onChange={() => {
                    setConfig({
                      ...config,
                      inApp: { ...config.inApp, playSound: !config.inApp.playSound },
                    });
                    setHasChanges(true);
                  }}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm text-sidebar-foreground">Play sound</span>
              </label>
            </div>

            <div className="space-y-4">
              {Object.entries(notificationTypeLabels).map(([key, { label, description }]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-sidebar-foreground">
                      {label}
                    </div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                  <Toggle
                    enabled={config.inApp.types[key as keyof typeof config.inApp.types]}
                    onChange={() => handleInAppToggle(key as keyof typeof config.inApp.types)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Quiet Hours */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Moon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Quiet Hours
            </h3>
            <p className="text-sm text-muted-foreground">
              Pause notifications during specific hours
            </p>
          </div>
          <Toggle
            enabled={config.quietHours.enabled}
            onChange={() => {
              setConfig({
                ...config,
                quietHours: {
                  ...config.quietHours,
                  enabled: !config.quietHours.enabled,
                },
              });
              setHasChanges(true);
            }}
          />
        </div>

        {config.quietHours.enabled && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={config.quietHours.start}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    quietHours: { ...config.quietHours, start: e.target.value },
                  });
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                End Time
              </label>
              <input
                type="time"
                value={config.quietHours.end}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    quietHours: { ...config.quietHours, end: e.target.value },
                  });
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Timezone
              </label>
              <select
                value={config.quietHours.timezone}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    quietHours: { ...config.quietHours, timezone: e.target.value },
                  });
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
      </Card>
    </div>
  );
}
