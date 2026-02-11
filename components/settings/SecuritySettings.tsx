"use client";

import { useState } from "react";
import {
  Shield,
  Key,
  Smartphone,
  Monitor,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { Card } from "../ui";
import type { SecuritySettingsProps } from "./types";
import { defaultSecurity } from "./data";

export function SecuritySettings({
  settings = defaultSecurity,
  onChangePassword,
  onEnable2FA,
  onRevokeSession,
}: SecuritySettingsProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimeSince = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("android")) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-sidebar-foreground">
          Security Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your account security and login settings
        </p>
      </div>

      {/* Password Section */}
      <Card padding="lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Key className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-sidebar-foreground">
                Password
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Last changed {getTimeSince(settings.lastPasswordChange)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(settings.lastPasswordChange)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowPasswordModal(true);
              onChangePassword?.();
            }}
            className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors"
          >
            Change Password
          </button>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium text-sidebar-foreground mb-2">
            Password Requirements
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Minimum 8 characters</li>
            <li>• At least one uppercase letter</li>
            <li>• At least one number</li>
            <li>• At least one special character</li>
          </ul>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card padding="lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${
                settings.twoFactorEnabled ? "bg-green-100" : "bg-yellow-100"
              }`}
            >
              <Shield
                className={`w-6 h-6 ${
                  settings.twoFactorEnabled ? "text-green-600" : "text-yellow-600"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-sidebar-foreground">
                  Two-Factor Authentication
                </h3>
                {settings.twoFactorEnabled ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Enabled
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.twoFactorEnabled
                  ? `Using ${settings.twoFactorMethod === "authenticator" ? "Authenticator App" : settings.twoFactorMethod === "sms" ? "SMS" : "Email"}`
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
          </div>
          <button
            onClick={onEnable2FA}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              settings.twoFactorEnabled
                ? "border border-border text-sidebar-foreground hover:bg-muted"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            }`}
          >
            {settings.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
          </button>
        </div>

        {!settings.twoFactorEnabled && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Your account is less secure
              </h4>
              <p className="text-xs text-yellow-700 mt-1">
                Two-factor authentication adds an extra layer of security. We
                strongly recommend enabling it.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Active Sessions */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-sidebar-foreground">
              Active Sessions
            </h3>
            <p className="text-sm text-muted-foreground">
              Devices currently logged into your account
            </p>
          </div>
          <button className="text-sm text-accent hover:underline">
            Sign out all other sessions
          </button>
        </div>

        <div className="space-y-3">
          {settings.activeSessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border rounded-lg ${
                session.isCurrent
                  ? "border-green-200 bg-green-50"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      session.isCurrent ? "bg-green-100" : "bg-muted"
                    }`}
                  >
                    {getDeviceIcon(session.device)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sidebar-foreground">
                        {session.device}
                      </span>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.browser}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeSince(session.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => onRevokeSession?.(session.id)}
                    className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Login History */}
      <Card padding="lg">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Recent Login Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            Recent sign-in attempts to your account
          </p>
        </div>

        <div className="space-y-2">
          {settings.loginHistory.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                {event.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="text-sm text-sidebar-foreground">
                    {event.device}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.location} • {event.ipAddress}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    event.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {event.success ? "Successful" : "Failed"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(event.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg" className="border-red-200">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <div className="font-medium text-sidebar-foreground">
                Delete Account
              </div>
              <div className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </div>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
