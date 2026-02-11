"use client";

import { useState } from "react";
import {
  BookOpen,
  Target,
  Calendar,
  Mail,
  Settings,
} from "lucide-react";
import type { InfoSection, ProgramSettings } from "./types";
import {
  sampleProgramFormData,
  learningTracks,
  timeZones,
  defaultEmailSettings,
  defaultProgramSettings,
} from "./data";

const sectionConfig: {
  id: InfoSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "basic", label: "Basic Information", icon: BookOpen },
  { id: "objectives", label: "Learning Objectives", icon: Target },
  { id: "schedule", label: "Schedule & Dates", icon: Calendar },
  { id: "communication", label: "Communication", icon: Mail },
  { id: "settings", label: "Settings & Config", icon: Settings },
];

export function InfoTab() {
  const [activeSection, setActiveSection] = useState<InfoSection>("basic");
  const [formData, setFormData] = useState(sampleProgramFormData);
  const [settings, setSettings] = useState<ProgramSettings>(defaultProgramSettings);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateSettings = (updates: Partial<ProgramSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sidebar-foreground mb-4">Program Details</h3>

        <div className="space-y-4">
          {/* Internal Name */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Internal Name
            </label>
            <input
              type="text"
              value={formData.internalName}
              onChange={(e) => updateFormData({ internalName: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Program Title */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Program Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Learning Track */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Learning Track
            </label>
            <select
              value={formData.learningTrack}
              onChange={(e) => updateFormData({ learningTrack: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {learningTracks.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLearningObjectives = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sidebar-foreground mb-4">Learning Objectives</h3>

        <div className="space-y-4">
          {formData.objectives.map((objective, index) => (
            <div key={objective.id}>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Objective {index + 1}
              </label>
              <textarea
                rows={2}
                value={objective.text}
                onChange={(e) => {
                  const newObjectives = [...formData.objectives];
                  newObjectives[index] = { ...objective, text: e.target.value };
                  updateFormData({ objectives: newObjectives });
                }}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          ))}

          <button className="text-sm text-accent hover:text-accent/80 font-medium">
            + Add Another Objective
          </button>
        </div>
      </div>
    </div>
  );

  const renderScheduleDates = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sidebar-foreground mb-4">Schedule & Dates</h3>

        <div className="space-y-4">
          {/* Program Type */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Program Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateFormData({ programType: "cohort" })}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  formData.programType === "cohort"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className="font-medium text-sidebar-foreground mb-1">
                  Cohort-Based
                </div>
                <div className="text-sm text-muted-foreground">
                  Fixed start and end dates
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ programType: "self-paced" })}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  formData.programType === "self-paced"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className="font-medium text-sidebar-foreground mb-1">
                  Self-Paced
                </div>
                <div className="text-sm text-muted-foreground">
                  Learners progress at own speed
                </div>
              </button>
            </div>
          </div>

          {formData.programType === "cohort" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData({ startDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData({ endDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {/* Time Zone */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Time Zone
            </label>
            <select
              value={formData.timeZone}
              onChange={(e) => updateFormData({ timeZone: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {timeZones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sidebar-foreground mb-4">Email Settings</h3>

        <div className="space-y-3">
          {defaultEmailSettings.map((email) => (
            <div
              key={email.id}
              className="bg-muted/30 border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sidebar-foreground mb-1">
                    {email.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {email.description}
                  </div>
                </div>
                <button
                  type="button"
                  className="relative w-11 h-6 rounded-full bg-accent"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettingsConfig = () => (
    <div className="space-y-6">
      {/* Enrollment & Access */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sidebar-foreground mb-4">Enrollment & Access</h3>
        <div className="space-y-4">
          {/* Auto-Enrollment */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Auto-Enrollment
                </div>
                <div className="text-sm text-muted-foreground">
                  Automatically enroll users who meet the target audience criteria
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ autoEnrollment: !settings.autoEnrollment })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.autoEnrollment ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.autoEnrollment ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Require Manager Approval */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Require Manager Approval
                </div>
                <div className="text-sm text-muted-foreground">
                  Users must get manager approval before enrolling
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    requireManagerApproval: !settings.requireManagerApproval,
                  })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.requireManagerApproval ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.requireManagerApproval ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Allow Self-Enrollment */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Allow Self-Enrollment
                </div>
                <div className="text-sm text-muted-foreground">
                  Users can enroll themselves without admin approval
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ allowSelfEnrollment: !settings.allowSelfEnrollment })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.allowSelfEnrollment ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.allowSelfEnrollment ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Link to Goals */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Link to Goals
                </div>
                <div className="text-sm text-muted-foreground">
                  Allow learners to link this program to their development goals
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ linkToGoals: !settings.linkToGoals })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.linkToGoals ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.linkToGoals ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Issue Certificate */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Issue Certificate
                </div>
                <div className="text-sm text-muted-foreground">
                  Award a completion certificate when learners finish the program
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ issueCertificate: !settings.issueCertificate })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.issueCertificate ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.issueCertificate ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Management */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sidebar-foreground mb-4">Capacity Management</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Program Capacity */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Program Capacity (optional)
            </label>
            <input
              type="number"
              placeholder="Unlimited"
              value={settings.programCapacity || ""}
              onChange={(e) =>
                updateSettings({
                  programCapacity: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Maximum number of participants
            </p>
          </div>

          {/* Waitlist */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Waitlist
            </label>
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sidebar-foreground">Enable Waitlist</span>
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({ enableWaitlist: !settings.enableWaitlist })
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.enableWaitlist ? "bg-accent" : "bg-border"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.enableWaitlist ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                When capacity is reached
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Program Behavior */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sidebar-foreground mb-4">Program Behavior</h3>
        <div className="space-y-4">
          {/* Sequential Module Access */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Sequential Module Access
                </div>
                <div className="text-sm text-muted-foreground">
                  Lock modules until previous modules are completed
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    sequentialModuleAccess: !settings.sequentialModuleAccess,
                  })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.sequentialModuleAccess ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.sequentialModuleAccess ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Track Completion in Scorecard */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Track Completion in Scorecard
                </div>
                <div className="text-sm text-muted-foreground">
                  Show program completion in executive scorecard
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ trackInScorecard: !settings.trackInScorecard })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.trackInScorecard ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.trackInScorecard ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "basic":
        return renderBasicInformation();
      case "objectives":
        return renderLearningObjectives();
      case "schedule":
        return renderScheduleDates();
      case "communication":
        return renderCommunication();
      case "settings":
        return renderSettingsConfig();
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Section Navigation */}
        <div className="flex gap-2 border-b border-border pb-4 mb-6 overflow-x-auto">
          {sectionConfig.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        {renderSectionContent()}

        {/* Save Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
          <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            Reset to Defaults
          </button>
          <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
