"use client";

import { useState } from "react";
import { Camera, Save } from "lucide-react";
import { Card } from "../ui";
import type { ProfileSettingsProps } from "./types";
import { defaultProfile, timezones, languages } from "./data";

export function ProfileSettings({
  profile = defaultProfile,
  onSave,
}: ProfileSettingsProps) {
  const [formData, setFormData] = useState(profile);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(formData);
    setHasChanges(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Profile Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Update your personal information and preferences
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

      {/* Avatar Section */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Profile Photo
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-accent/10 text-accent flex items-center justify-center text-3xl font-medium">
              {getInitials(formData.name)}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="text-sm text-sidebar-foreground mb-2">
              Upload a new profile photo
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ""}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </Card>

      {/* Bio */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          About You
        </h3>
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio || ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            rows={4}
            placeholder="Tell us a bit about yourself..."
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will be visible to other users in your organization.
          </p>
        </div>
      </Card>

      {/* Preferences */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Preferences
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleChange("language", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
