"use client";

import { useState, useCallback } from "react";
import {
  X,
  Sparkles,
  Target,
  TrendingUp,
  Link as LinkIcon,
} from "lucide-react";
import { ProgressBar } from "../ui";
import type { GoalSuggestion, ScorecardOption, Milestone } from "./types";
import {
  defaultGoalSuggestions,
  defaultScorecardOptions,
  goalTypeOptions,
  goalCategoryOptions,
  goalOwnerOptions,
  measurementFrequencyOptions,
  annualPlanLinkOptions,
  programLinkOptions,
  accountabilityPartnerOptions,
} from "./data";

export interface NewGoalModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when goal is created */
  onCreate?: (goalData: GoalFormData) => void;
  /** Callback when goal is saved as draft */
  onSaveDraft?: (goalData: GoalFormData) => void;
  /** AI goal suggestions */
  suggestions?: GoalSuggestion[];
  /** Scorecard options for linking */
  scorecardOptions?: ScorecardOption[];
}

export interface GoalFormData {
  statement: string;
  type: string;
  category: string;
  owner: string;
  startDate: string;
  targetDate: string;
  activeQuarters: string[];
  currentValue: string;
  currentUnit: string;
  targetValue: string;
  targetUnit: string;
  measurementFrequency: string;
  milestones: Milestone[];
  scorecardLink: string;
  annualPlanLink: string;
  programLink: string;
  visibleToReports: boolean;
  addToDashboard: boolean;
  enableAICoaching: boolean;
  accountabilityPartner: string;
}

const STEPS = [
  { number: 1, label: "Define Goal" },
  { number: 2, label: "Set Targets" },
  { number: 3, label: "Link & Finalize" },
] as const;

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="px-8 pt-6">
      <div className="flex items-center gap-2">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className={`flex-1 h-1 rounded-full transition-colors ${
              step.number <= currentStep ? "bg-accent" : "bg-muted"
            }`}
            role="progressbar"
            aria-valuenow={step.number <= currentStep ? 100 : 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Step ${step.number}: ${step.label}`}
          />
        ))}
      </div>
    </div>
  );
}

interface Step1Props {
  formData: GoalFormData;
  onChange: (field: keyof GoalFormData, value: unknown) => void;
  suggestions: GoalSuggestion[];
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
  onSelectSuggestion: (suggestion: GoalSuggestion) => void;
}

function Step1({
  formData,
  onChange,
  suggestions,
  showSuggestions,
  onToggleSuggestions,
  onSelectSuggestion,
}: Step1Props) {
  return (
    <div className="space-y-6">
      {/* AI Assistance Banner */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h4 className="text-sm text-sidebar-foreground mb-1">AI Goal Assistant</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Get smart suggestions based on your Scorecard metrics and annual plan
            </p>
            <button
              className="text-xs text-accent hover:text-accent/80 transition-colors"
              onClick={onToggleSuggestions}
            >
              {showSuggestions ? "Hide suggestions" : "Show AI suggestions"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-2 uppercase">
            Suggested Goals from Your Scorecard
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
              onClick={() => onSelectSuggestion(suggestion)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm text-sidebar-foreground pr-4">{suggestion.title}</h4>
                <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground whitespace-nowrap">
                  {suggestion.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{suggestion.reason}</p>
              <div className="flex items-center gap-1 text-xs text-accent">
                <LinkIcon className="w-3 h-3" aria-hidden="true" />
                <span>{suggestion.scorecardLink}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Goal Statement */}
      <div>
        <label htmlFor="goal-statement" className="block text-xs text-muted-foreground mb-2 uppercase">
          Goal Statement <span className="text-accent">*</span>
        </label>
        <textarea
          id="goal-statement"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
          rows={3}
          placeholder="e.g., Achieve 85% OEE across all manufacturing plants by end of Q2 2026"
          value={formData.statement}
          onChange={(e) => onChange("statement", e.target.value)}
        />
        <div className="text-xs text-muted-foreground mt-2">
          Tip: Use specific, measurable language that clearly defines success
        </div>
      </div>

      {/* Goal Type & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="goal-type" className="block text-xs text-muted-foreground mb-2 uppercase">
            Goal Type <span className="text-accent">*</span>
          </label>
          <select
            id="goal-type"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={formData.type}
            onChange={(e) => onChange("type", e.target.value)}
          >
            <option value="">Select type...</option>
            {goalTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="goal-category" className="block text-xs text-muted-foreground mb-2 uppercase">
            Category <span className="text-accent">*</span>
          </label>
          <select
            id="goal-category"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={formData.category}
            onChange={(e) => onChange("category", e.target.value)}
          >
            <option value="">Select category...</option>
            {goalCategoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Goal Owner */}
      <div>
        <label htmlFor="goal-owner" className="block text-xs text-muted-foreground mb-2 uppercase">
          Goal Owner <span className="text-accent">*</span>
        </label>
        <select
          id="goal-owner"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={formData.owner}
          onChange={(e) => onChange("owner", e.target.value)}
        >
          {goalOwnerOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-xs text-muted-foreground mb-2 uppercase">
            Start Date <span className="text-accent">*</span>
          </label>
          <input
            id="start-date"
            type="date"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={formData.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="target-date" className="block text-xs text-muted-foreground mb-2 uppercase">
            Target Date <span className="text-accent">*</span>
          </label>
          <input
            id="target-date"
            type="date"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={formData.targetDate}
            onChange={(e) => onChange("targetDate", e.target.value)}
          />
        </div>
      </div>

      {/* Active Quarters */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3 uppercase">
          Active Quarters <span className="text-accent">*</span>
        </label>
        <div className="flex gap-3" role="group" aria-label="Select active quarters">
          {QUARTERS.map((quarter) => (
            <button
              key={quarter}
              type="button"
              className={`flex-1 px-4 py-3 bg-background border-2 rounded-lg text-sm text-sidebar-foreground hover:border-accent transition-colors ${
                formData.activeQuarters.includes(quarter) ? "border-accent" : "border-border"
              }`}
              onClick={() => {
                const quarters = formData.activeQuarters.includes(quarter)
                  ? formData.activeQuarters.filter((q) => q !== quarter)
                  : [...formData.activeQuarters, quarter];
                onChange("activeQuarters", quarters);
              }}
              aria-pressed={formData.activeQuarters.includes(quarter)}
            >
              {quarter}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Select all quarters where this goal will be actively tracked
        </div>
      </div>
    </div>
  );
}

interface Step2Props {
  formData: GoalFormData;
  onChange: (field: keyof GoalFormData, value: unknown) => void;
  onAddMilestone: () => void;
  onRemoveMilestone: (id: string) => void;
  onUpdateMilestone: (id: string, field: keyof Milestone, value: string) => void;
}

function Step2({
  formData,
  onChange,
  onAddMilestone,
  onRemoveMilestone,
  onUpdateMilestone,
}: Step2Props) {
  const progressPercent =
    formData.currentValue && formData.targetValue
      ? Math.round(
          ((parseFloat(formData.currentValue) || 0) /
            (parseFloat(formData.targetValue) || 1)) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Instructions Banner */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="text-sm text-sidebar-foreground mb-1">Define Success Metrics</h4>
            <p className="text-xs text-muted-foreground">
              Set measurable targets so progress can be tracked automatically
            </p>
          </div>
        </div>
      </div>

      {/* Current State / Baseline */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2 uppercase">
          Current State / Baseline <span className="text-accent">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g., 82.3"
              value={formData.currentValue}
              onChange={(e) => onChange("currentValue", e.target.value)}
              aria-label="Current value"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Unit (e.g., %)"
              value={formData.currentUnit}
              onChange={(e) => onChange("currentUnit", e.target.value)}
              aria-label="Current value unit"
            />
          </div>
        </div>
      </div>

      {/* Target State / Goal */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2 uppercase">
          Target State / Goal <span className="text-accent">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g., 85"
              value={formData.targetValue}
              onChange={(e) => onChange("targetValue", e.target.value)}
              aria-label="Target value"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Unit (e.g., %)"
              value={formData.targetUnit}
              onChange={(e) => onChange("targetUnit", e.target.value)}
              aria-label="Target value unit"
            />
          </div>
        </div>
      </div>

      {/* Progress Calculation Preview */}
      {formData.currentValue && formData.targetValue && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h4 className="text-sm text-sidebar-foreground mb-1">Progress Preview</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Based on your baseline and target, here's how progress will be calculated
              </p>
              <div className="bg-white border border-green-200 rounded p-3">
                <div className="text-xs text-muted-foreground mb-2">Current Progress</div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl text-sidebar-foreground tabular-nums">{progressPercent}%</div>
                  <div className="text-xs text-muted-foreground">
                    {formData.currentValue}
                    {formData.currentUnit} → {formData.targetValue}
                    {formData.targetUnit}
                  </div>
                </div>
                <ProgressBar
                  value={progressPercent}
                  max={100}
                  size="md"
                  variant="default"
                  aria-label={`Progress preview: ${progressPercent}%`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Frequency */}
      <div>
        <label htmlFor="measurement-frequency" className="block text-xs text-muted-foreground mb-2 uppercase">
          Measurement Frequency <span className="text-accent">*</span>
        </label>
        <select
          id="measurement-frequency"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={formData.measurementFrequency}
          onChange={(e) => onChange("measurementFrequency", e.target.value)}
        >
          {measurementFrequencyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground mt-2">
          How often will you update progress on this goal?
        </div>
      </div>

      {/* Key Milestones */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2 uppercase">
          Key Milestones (Optional)
        </label>
        <div className="space-y-3">
          {formData.milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3">
              <input
                type="text"
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={milestone.title}
                onChange={(e) => onUpdateMilestone(milestone.id, "title", e.target.value)}
                placeholder="Milestone description"
                aria-label="Milestone description"
              />
              <input
                type="date"
                className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={milestone.dueDate}
                onChange={(e) => onUpdateMilestone(milestone.id, "dueDate", e.target.value)}
                aria-label="Milestone due date"
              />
              <button
                className="p-2 text-muted-foreground hover:text-accent transition-colors"
                onClick={() => onRemoveMilestone(milestone.id)}
                aria-label="Remove milestone"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            className="text-xs text-accent hover:text-accent/80 transition-colors"
            onClick={onAddMilestone}
          >
            + Add milestone
          </button>
        </div>
      </div>
    </div>
  );
}

interface Step3Props {
  formData: GoalFormData;
  onChange: (field: keyof GoalFormData, value: unknown) => void;
  scorecardOptions: ScorecardOption[];
}

function Step3({ formData, onChange, scorecardOptions }: Step3Props) {
  return (
    <div className="space-y-6">
      {/* Instructions Banner */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <LinkIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="text-sm text-sidebar-foreground mb-1">Connect to Strategic Framework</h4>
            <p className="text-xs text-muted-foreground">
              Link this goal to your Scorecard, Annual Plan, or Leadership Program for visibility
            </p>
          </div>
        </div>
      </div>

      {/* Link to Scorecard */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3 uppercase">
          Link to Scorecard (Recommended)
        </label>
        <div className="space-y-2" role="radiogroup" aria-label="Scorecard options">
          {scorecardOptions.map((option) => {
            const statusConfig = {
              "on-track": { text: "text-green-600", label: "On Track" },
              "at-risk": { text: "text-yellow-600", label: "At Risk" },
              "needs-attention": { text: "text-accent", label: "Needs Attention" },
            };
            const config = statusConfig[option.status];

            return (
              <button
                key={option.id}
                type="button"
                className={`w-full text-left bg-card border rounded-lg p-4 hover:border-accent transition-colors ${
                  formData.scorecardLink === option.id ? "border-accent" : "border-border"
                }`}
                onClick={() => onChange("scorecardLink", option.id)}
                role="radio"
                aria-checked={formData.scorecardLink === option.id}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm text-sidebar-foreground mb-1">{option.name}</h4>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg text-sidebar-foreground mb-1 tabular-nums">{option.score}</div>
                    <div className={`text-xs ${config.text}`}>{config.label}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Link to Annual Plan */}
      <div>
        <label htmlFor="annual-plan-link" className="block text-xs text-muted-foreground mb-3 uppercase">
          Link to Annual Plan (Optional)
        </label>
        <select
          id="annual-plan-link"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={formData.annualPlanLink}
          onChange={(e) => onChange("annualPlanLink", e.target.value)}
        >
          {annualPlanLinkOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Link to Program */}
      <div>
        <label htmlFor="program-link" className="block text-xs text-muted-foreground mb-3 uppercase">
          Link to Leadership Program (Optional)
        </label>
        <select
          id="program-link"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={formData.programLink}
          onChange={(e) => onChange("programLink", e.target.value)}
        >
          {programLinkOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Visibility & Collaboration */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3 uppercase">
          Visibility & Collaboration
        </label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
              checked={formData.visibleToReports}
              onChange={(e) => onChange("visibleToReports", e.target.checked)}
            />
            <div>
              <div className="text-sm text-sidebar-foreground mb-1">Visible to direct reports</div>
              <div className="text-xs text-muted-foreground">
                Your leadership team can see and contribute to this goal
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
              checked={formData.addToDashboard}
              onChange={(e) => onChange("addToDashboard", e.target.checked)}
            />
            <div>
              <div className="text-sm text-sidebar-foreground mb-1">Add to Dashboard</div>
              <div className="text-xs text-muted-foreground">
                Show this goal in your Journey Hub for quick access
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
              checked={formData.enableAICoaching}
              onChange={(e) => onChange("enableAICoaching", e.target.checked)}
            />
            <div>
              <div className="text-sm text-sidebar-foreground mb-1">Enable AI coaching suggestions</div>
              <div className="text-xs text-muted-foreground">
                Receive weekly insights and recommendations to stay on track
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Accountability Partner */}
      <div>
        <label htmlFor="accountability-partner" className="block text-xs text-muted-foreground mb-3 uppercase">
          Accountability Partner (Optional)
        </label>
        <select
          id="accountability-partner"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={formData.accountabilityPartner}
          onChange={(e) => onChange("accountabilityPartner", e.target.value)}
        >
          {accountabilityPartnerOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground mt-2">
          This person will receive progress updates and can provide guidance
        </div>
      </div>

      {/* Goal Summary */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-5">
        <h4 className="text-sm text-sidebar-foreground mb-3">Goal Summary</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Goal:</span>
            <span className="text-sidebar-foreground text-right max-w-[300px] truncate">
              {formData.statement || "Not specified"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner:</span>
            <span className="text-sidebar-foreground">
              {goalOwnerOptions.find((o) => o.value === formData.owner)?.label || "Not specified"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timeline:</span>
            <span className="text-sidebar-foreground">
              {formData.activeQuarters.length > 0
                ? formData.activeQuarters.sort().join("-").replace(/2026/g, "").replace(/-/g, "-")
                : "Not specified"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target:</span>
            <span className="text-sidebar-foreground">
              {formData.currentValue && formData.targetValue
                ? `${formData.currentValue}${formData.currentUnit} → ${formData.targetValue}${formData.targetUnit}`
                : "Not specified"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Linked to:</span>
            <span className="text-sidebar-foreground">
              {formData.scorecardLink
                ? `Scorecard: ${scorecardOptions.find((o) => o.id === formData.scorecardLink)?.name}`
                : "None"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewGoalModal({
  isOpen,
  onClose,
  onCreate,
  onSaveDraft,
  suggestions = defaultGoalSuggestions,
  scorecardOptions = defaultScorecardOptions,
}: NewGoalModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    statement: "",
    type: "",
    category: "",
    owner: "you",
    startDate: "2026-01-14",
    targetDate: "",
    activeQuarters: [],
    currentValue: "",
    currentUnit: "",
    targetValue: "",
    targetUnit: "",
    measurementFrequency: "weekly",
    milestones: [],
    scorecardLink: "",
    annualPlanLink: "none",
    programLink: "none",
    visibleToReports: true,
    addToDashboard: false,
    enableAICoaching: true,
    accountabilityPartner: "none",
  });

  const handleChange = useCallback((field: keyof GoalFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: GoalSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      statement: suggestion.title,
      category: suggestion.category.toLowerCase(),
    }));
    setShowSuggestions(false);
  }, []);

  const handleAddMilestone = useCallback(() => {
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: "",
      dueDate: "",
    };
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));
  }, []);

  const handleRemoveMilestone = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }));
  }, []);

  const handleUpdateMilestone = useCallback((id: string, field: keyof Milestone, value: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleContinue = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onCreate?.(formData);
      onClose();
    }
  }, [currentStep, formData, onCreate, onClose]);

  const handleSaveDraft = useCallback(() => {
    onSaveDraft?.(formData);
    onClose();
  }, [formData, onSaveDraft, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div>
            <h2 id="modal-title" className="text-sidebar-foreground mb-1">
              Create New Goal
            </h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of 3 &bull; {STEPS[currentStep - 1].label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 1 && (
            <Step1
              formData={formData}
              onChange={handleChange}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
              onSelectSuggestion={handleSelectSuggestion}
            />
          )}
          {currentStep === 2 && (
            <Step2
              formData={formData}
              onChange={handleChange}
              onAddMilestone={handleAddMilestone}
              onRemoveMilestone={handleRemoveMilestone}
              onUpdateMilestone={handleUpdateMilestone}
            />
          )}
          {currentStep === 3 && (
            <Step3
              formData={formData}
              onChange={handleChange}
              scorecardOptions={scorecardOptions}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-border bg-muted/30">
          <button
            className="px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
            onClick={currentStep === 1 ? onClose : handleBack}
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-3">
            {currentStep < 3 && (
              <button
                className="px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
                onClick={handleSaveDraft}
              >
                Save as Draft
              </button>
            )}
            <button
              className="px-6 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              onClick={handleContinue}
            >
              {currentStep === 3 ? "Create Goal" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
