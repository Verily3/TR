"use client";

import { useState } from "react";
import { Mail, Smartphone, Bell, Save } from "lucide-react";
import { Card } from "../ui";
import type { NotificationSettingsProps } from "./types";
import { defaultNotifications } from "./data";

export function NotificationSettings({
  preferences = defaultNotifications,
  onSave,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (
    category: "email" | "push" | "inApp",
    key: string,
    value: boolean
  ) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(settings);
    setHasChanges(false);
  };

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-muted"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Notification Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose how and when you want to be notified
          </p>
        </div>
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

      {/* Email Notifications */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Mail className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Email Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Receive updates via email
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Program Updates
              </div>
              <div className="text-sm text-muted-foreground">
                New modules, deadlines, and program announcements
              </div>
            </div>
            <Toggle
              checked={settings.email.programUpdates}
              onChange={(v) => handleToggle("email", "programUpdates", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Assessment Reminders
              </div>
              <div className="text-sm text-muted-foreground">
                Pending assessments and feedback requests
              </div>
            </div>
            <Toggle
              checked={settings.email.assessmentReminders}
              onChange={(v) => handleToggle("email", "assessmentReminders", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Goal Deadlines
              </div>
              <div className="text-sm text-muted-foreground">
                Upcoming goal due dates and review reminders
              </div>
            </div>
            <Toggle
              checked={settings.email.goalDeadlines}
              onChange={(v) => handleToggle("email", "goalDeadlines", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Coaching Reminders
              </div>
              <div className="text-sm text-muted-foreground">
                Upcoming sessions and prep reminders
              </div>
            </div>
            <Toggle
              checked={settings.email.coachingReminders}
              onChange={(v) => handleToggle("email", "coachingReminders", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Weekly Digest
              </div>
              <div className="text-sm text-muted-foreground">
                Summary of your weekly activity and progress
              </div>
            </div>
            <Toggle
              checked={settings.email.weeklyDigest}
              onChange={(v) => handleToggle("email", "weeklyDigest", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Marketing Emails
              </div>
              <div className="text-sm text-muted-foreground">
                Product updates, tips, and promotional content
              </div>
            </div>
            <Toggle
              checked={settings.email.marketingEmails}
              onChange={(v) => handleToggle("email", "marketingEmails", v)}
            />
          </div>
        </div>
      </Card>

      {/* Push Notifications */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Push Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Receive notifications on your mobile device
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Program Updates
              </div>
              <div className="text-sm text-muted-foreground">
                New content and program changes
              </div>
            </div>
            <Toggle
              checked={settings.push.programUpdates}
              onChange={(v) => handleToggle("push", "programUpdates", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Assessment Reminders
              </div>
              <div className="text-sm text-muted-foreground">
                Time-sensitive assessment notifications
              </div>
            </div>
            <Toggle
              checked={settings.push.assessmentReminders}
              onChange={(v) => handleToggle("push", "assessmentReminders", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Goal Deadlines
              </div>
              <div className="text-sm text-muted-foreground">
                Urgent deadline notifications
              </div>
            </div>
            <Toggle
              checked={settings.push.goalDeadlines}
              onChange={(v) => handleToggle("push", "goalDeadlines", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Coaching Reminders
              </div>
              <div className="text-sm text-muted-foreground">
                Session start reminders
              </div>
            </div>
            <Toggle
              checked={settings.push.coachingReminders}
              onChange={(v) => handleToggle("push", "coachingReminders", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Direct Messages
              </div>
              <div className="text-sm text-muted-foreground">
                Messages from coaches and team members
              </div>
            </div>
            <Toggle
              checked={settings.push.directMessages}
              onChange={(v) => handleToggle("push", "directMessages", v)}
            />
          </div>
        </div>
      </Card>

      {/* In-App Notifications */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-sidebar-foreground">
              In-App Preferences
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure how notifications appear in the app
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Show Badge Counts
              </div>
              <div className="text-sm text-muted-foreground">
                Display unread notification counts
              </div>
            </div>
            <Toggle
              checked={settings.inApp.showBadges}
              onChange={(v) => handleToggle("inApp", "showBadges", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Sound Effects
              </div>
              <div className="text-sm text-muted-foreground">
                Play sounds for new notifications
              </div>
            </div>
            <Toggle
              checked={settings.inApp.soundEnabled}
              onChange={(v) => handleToggle("inApp", "soundEnabled", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Desktop Notifications
              </div>
              <div className="text-sm text-muted-foreground">
                Show browser notifications when the app is in background
              </div>
            </div>
            <Toggle
              checked={settings.inApp.desktopNotifications}
              onChange={(v) => handleToggle("inApp", "desktopNotifications", v)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
