"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Puzzle,
  Building2,
} from "lucide-react";
import { ProfileSettings } from "./ProfileSettings";
import { NotificationSettings } from "./NotificationSettings";
import { SecuritySettings } from "./SecuritySettings";
import { IntegrationSettings } from "./IntegrationSettings";
import { AccountSettings } from "./AccountSettings";
import type { SettingsPageProps } from "./types";
import {
  defaultProfile,
  defaultNotifications,
  defaultSecurity,
  defaultIntegrations,
  defaultOrganization,
  defaultBilling,
} from "./data";

type Tab = "profile" | "notifications" | "security" | "integrations" | "account";

const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    description: "Manage your personal information",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    description: "Configure notification preferences",
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield className="w-5 h-5" />,
    description: "Password, 2FA, and sessions",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: <Puzzle className="w-5 h-5" />,
    description: "Connect third-party services",
  },
  {
    id: "account",
    label: "Account",
    icon: <Building2 className="w-5 h-5" />,
    description: "Organization and billing",
  },
];

export function SettingsPage({
  profile = defaultProfile,
  notifications = defaultNotifications,
  security = defaultSecurity,
  integrations = defaultIntegrations,
  organization = defaultOrganization,
  billing = defaultBilling,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-accent" />
          <h1 className="text-2xl font-semibold text-sidebar-foreground">
            Settings
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </header>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                <div className="mt-0.5">{tab.icon}</div>
                <div>
                  <div className="font-medium">{tab.label}</div>
                  <div
                    className={`text-xs ${
                      activeTab === tab.id
                        ? "text-accent-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tab.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileSettings profile={profile} />}
          {activeTab === "notifications" && (
            <NotificationSettings preferences={notifications} />
          )}
          {activeTab === "security" && <SecuritySettings settings={security} />}
          {activeTab === "integrations" && (
            <IntegrationSettings integrations={integrations} />
          )}
          {activeTab === "account" && (
            <AccountSettings organization={organization} billing={billing} />
          )}
        </div>
      </div>
    </main>
  );
}
