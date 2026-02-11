"use client";

import { useState } from "react";
import {
  X,
  Check,
  Upload,
  Sparkles,
  Info,
  Clock,
} from "lucide-react";
import type { CreateProgramWizardProps, WizardStep, ProgramFormData, ProgramType } from "./types";
import {
  defaultProgramFormData,
  learningTracks,
  timeZones,
  defaultEmailSettings,
  defaultBeforeDueReminders,
  defaultAfterDueReminders,
} from "./data";

const stepTitles: Record<WizardStep, string> = {
  1: "Basic Information",
  2: "Learning Objectives",
  3: "Schedule & Dates",
  4: "Communication Settings",
  5: "Target Audience & Prerequisites",
  6: "Review & Create",
};

export function CreateProgramWizard({
  isOpen,
  onClose,
  onCreate,
}: CreateProgramWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<ProgramFormData>(defaultProgramFormData);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleCreate = () => {
    onCreate?.(formData);
    onClose();
  };

  const updateFormData = (updates: Partial<ProgramFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addObjective = () => {
    const newId = String(formData.objectives.length + 1);
    updateFormData({
      objectives: [...formData.objectives, { id: newId, text: "" }],
    });
  };

  const updateObjective = (id: string, text: string) => {
    updateFormData({
      objectives: formData.objectives.map((obj) =>
        obj.id === id ? { ...obj, text } : obj
      ),
    });
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return `${diffWeeks} weeks`;
    }
    return null;
  };

  const renderStepIndicators = () => (
    <div className="flex items-center gap-2 mb-6">
      {([1, 2, 3, 4, 5, 6] as WizardStep[]).map((step) => (
        <div key={step} className="flex items-center">
          {step < currentStep ? (
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          ) : step === currentStep ? (
            <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
              {step}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
              {step}
            </div>
          )}
          {step < 6 && (
            <div
              className={`w-8 h-0.5 mx-1 ${
                step < currentStep ? "bg-green-200" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Internal Name */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Internal Name <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={formData.internalName}
          onChange={(e) => updateFormData({ internalName: e.target.value })}
          placeholder="e.g., Q1-2026-Leadership-Cohort-A"
          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          For internal tracking and reporting (not visible to learners)
        </p>
      </div>

      {/* Program Title */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Program Title <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., LeaderShift"
          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Choose a clear, memorable name for your program
        </p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Cover Image
        </label>
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
          <Upload className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm text-sidebar-foreground mb-1">
            Click to upload program cover
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG up to 5MB (Recommended: 1200x600px)
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          This image appears on the program overview and in program listings
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Description <span className="text-accent">*</span>
        </label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe the program's purpose, what learners will gain, and why it matters..."
          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          This will appear on the program overview and in program listings
        </p>
      </div>

      {/* Learning Track */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Learning Track <span className="text-accent">*</span>
        </label>
        <select
          value={formData.learningTrack}
          onChange={(e) => updateFormData({ learningTrack: e.target.value })}
          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Select track...</option>
          {learningTracks.map((track) => (
            <option key={track} value={track}>
              {track}
            </option>
          ))}
        </select>
      </div>

      {/* AI Smart Builder */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
              AI Smart Builder
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Let AI analyze your program details and suggest an optimal
              structure, module sequence, and content outline.
            </p>
            <button className="text-sm text-accent hover:text-accent/80 font-medium">
              Generate Program Structure →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {formData.objectives.map((objective, index) => (
        <div key={objective.id}>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">
            Objective {index + 1} {index < 3 && <span className="text-accent">*</span>}
          </label>
          <textarea
            rows={2}
            value={objective.text}
            onChange={(e) => updateObjective(objective.id, e.target.value)}
            placeholder={`e.g., ${
              index === 0
                ? "Distinguish between leadership and management responsibilities"
                : index === 1
                ? "Develop self-awareness and emotional intelligence"
                : "Build strategic thinking capabilities"
            }`}
            className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>
      ))}

      <button
        onClick={addObjective}
        className="text-sm text-accent hover:text-accent/80 font-medium"
      >
        + Add Another Objective
      </button>

      {/* Best Practice Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">Best Practice</h3>
            <p className="text-sm text-blue-700">
              Start each objective with an action verb (e.g., "Master," "Develop,"
              "Build," "Navigate"). Focus on measurable outcomes and specific
              competencies.
            </p>
          </div>
        </div>
      </div>

      {/* AI Objective Optimizer */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
              AI Objective Optimizer
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              AI can refine your objectives to make them more specific, measurable,
              and aligned with best practices.
            </p>
            <button className="text-sm text-accent hover:text-accent/80 font-medium">
              Optimize Objectives →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Program Type Selection */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-3">
          Program Type <span className="text-accent">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateFormData({ programType: "cohort" as ProgramType })}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              formData.programType === "cohort"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="font-medium text-sidebar-foreground mb-1">Cohort-Based</div>
            <div className="text-sm text-muted-foreground">
              All learners start and end together with fixed dates
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateFormData({ programType: "self-paced" as ProgramType })}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              formData.programType === "self-paced"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="font-medium text-sidebar-foreground mb-1">Self-Paced</div>
            <div className="text-sm text-muted-foreground">
              Learners can start anytime and progress at their own speed
            </div>
          </button>
        </div>
      </div>

      {formData.programType === "cohort" ? (
        <>
          {/* Cohort Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Program Start Date <span className="text-accent">*</span>
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
                Program End Date <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormData({ endDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Calculated Duration */}
          {calculateDuration() && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">
                  <strong>Program Duration:</strong> {calculateDuration()}
                </span>
              </div>
            </div>
          )}

          {/* Individual Pacing Toggle */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sidebar-foreground mb-1">
                  Allow Individual Pacing
                </div>
                <div className="text-sm text-muted-foreground">
                  Let learners start at different times within the cohort period
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateFormData({ allowIndividualPacing: !formData.allowIndividualPacing })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  formData.allowIndividualPacing ? "bg-accent" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.allowIndividualPacing ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {formData.allowIndividualPacing && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Start Offset (days after enrollment)
                  </label>
                  <input
                    type="number"
                    value={formData.startOffset}
                    onChange={(e) =>
                      updateFormData({ startOffset: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Deadline Flexibility (days)
                  </label>
                  <input
                    type="number"
                    value={formData.deadlineFlexibility}
                    onChange={(e) =>
                      updateFormData({ deadlineFlexibility: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">
            Estimated Duration
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) =>
                updateFormData({ estimatedDuration: parseInt(e.target.value) || 12 })
              }
              placeholder="12"
              className="w-32 px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="text-sm text-muted-foreground">weeks</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Typical time for learners to complete this program at their own pace
          </p>
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
        <p className="text-xs text-muted-foreground mt-1.5">
          Used for scheduling emails and displaying deadlines to participants
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Email Settings */}
      {defaultEmailSettings.map((email) => (
        <div key={email.id} className="bg-muted/30 border border-border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium text-sidebar-foreground mb-1">{email.name}</div>
              <div className="text-sm text-muted-foreground">{email.description}</div>
            </div>
            <button
              type="button"
              className="relative w-11 h-6 rounded-full bg-accent"
            >
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
            </button>
          </div>
          {email.timing && (
            <div className="mt-3 text-xs text-muted-foreground">
              Timing: {email.timing}
            </div>
          )}
        </div>
      ))}

      {/* Lesson Due Date Reminders */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="font-medium text-sidebar-foreground mb-1">
              Lesson Due Date Reminders
            </div>
            <div className="text-sm text-muted-foreground">
              Automated reminders before and after lesson due dates
            </div>
          </div>
          <button
            type="button"
            className="relative w-11 h-6 rounded-full bg-accent"
          >
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-sidebar-foreground mb-2">
              Before Due Date
            </label>
            <div className="space-y-2">
              {defaultBeforeDueReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-2 bg-background rounded"
                >
                  <span className="text-sm text-sidebar-foreground">{reminder.label}</span>
                  <button
                    type="button"
                    className={`relative w-11 h-6 rounded-full ${
                      reminder.enabled ? "bg-accent" : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full ${
                        reminder.enabled ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sidebar-foreground mb-2">
              After Due Date (Overdue)
            </label>
            <div className="space-y-2">
              {defaultAfterDueReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-2 bg-background rounded"
                >
                  <span className="text-sm text-sidebar-foreground">{reminder.label}</span>
                  <button
                    type="button"
                    className={`relative w-11 h-6 rounded-full ${
                      reminder.enabled ? "bg-accent" : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full ${
                        reminder.enabled ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Target Audience <span className="text-accent">*</span>
        </label>
        <textarea
          rows={3}
          value={formData.targetAudience}
          onChange={(e) => updateFormData({ targetAudience: e.target.value })}
          placeholder="e.g., Mid-level managers with 2-5 years of experience in sales"
          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Define who this program is designed for
        </p>
      </div>

      {/* Prerequisites */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Prerequisites (optional)
        </label>
        <textarea
          rows={2}
          value={formData.prerequisites}
          onChange={(e) => updateFormData({ prerequisites: e.target.value })}
          placeholder="e.g., Completion of Sales Fundamentals program"
          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Any required programs or qualifications
        </p>
      </div>

      {/* Recommended For */}
      <div>
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Recommended For (optional)
        </label>
        <textarea
          rows={2}
          value={formData.recommendedFor}
          onChange={(e) => updateFormData({ recommendedFor: e.target.value })}
          placeholder="e.g., Sales representatives looking to move into leadership roles"
          className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Additional context for who benefits most
        </p>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Basic Information Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
          Basic Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="text-muted-foreground w-32">Title:</span>
            <span className="text-sidebar-foreground">
              {formData.title || "Not specified"}
            </span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32">Track:</span>
            <span className="text-sidebar-foreground">
              {formData.learningTrack || "Not specified"}
            </span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32">Type:</span>
            <span className="text-sidebar-foreground">
              {formData.programType === "cohort" ? "Cohort-Based" : "Self-Paced"}
            </span>
          </div>
        </div>
      </div>

      {/* Learning Objectives Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
          Learning Objectives
        </h3>
        <ul className="space-y-1.5 text-sm text-sidebar-foreground list-disc list-inside">
          {formData.objectives
            .filter((obj) => obj.text)
            .map((obj) => (
              <li key={obj.id}>{obj.text}</li>
            ))}
          {formData.objectives.every((obj) => !obj.text) && (
            <li className="text-muted-foreground">No objectives specified</li>
          )}
        </ul>
      </div>

      {/* Schedule Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
          Schedule & Dates
        </h3>
        <div className="space-y-2 text-sm">
          {formData.programType === "cohort" ? (
            <>
              <div className="flex">
                <span className="text-muted-foreground w-32">Start Date:</span>
                <span className="text-sidebar-foreground">
                  {formData.startDate || "Not specified"}
                </span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32">End Date:</span>
                <span className="text-sidebar-foreground">
                  {formData.endDate || "Not specified"}
                </span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32">Duration:</span>
                <span className="text-sidebar-foreground">
                  {calculateDuration() || "Not specified"}
                </span>
              </div>
            </>
          ) : (
            <div className="flex">
              <span className="text-muted-foreground w-32">Est. Duration:</span>
              <span className="text-sidebar-foreground">
                {formData.estimatedDuration} weeks
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Communication Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
          Communication Settings
        </h3>
        <div className="flex flex-wrap gap-2">
          {defaultEmailSettings
            .filter((e) => e.enabled)
            .map((email) => (
              <span
                key={email.id}
                className="px-2 py-1 bg-accent/10 text-accent rounded text-xs"
              >
                {email.name}
              </span>
            ))}
        </div>
      </div>

      {/* Target Audience Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
          Target Audience
        </h3>
        <p className="text-sm text-sidebar-foreground">
          {formData.targetAudience || "Not specified"}
        </p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl mx-4 shadow-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Create New Program
            </h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of 6: {stepTitles[currentStep]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-6 pt-6 flex-shrink-0">{renderStepIndicators()}</div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-6 pb-6">{renderStepContent()}</div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-between flex-shrink-0">
          {currentStep === 1 ? (
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Back
            </button>
          )}

          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              Create Program
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
