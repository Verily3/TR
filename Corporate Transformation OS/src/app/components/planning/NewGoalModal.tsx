import { X, Sparkles, Link as LinkIcon, Target, Calendar, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewGoalModal({ isOpen, onClose }: NewGoalModalProps) {
  const [step, setStep] = useState(1);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div>
            <h2 className="text-sidebar-foreground mb-1">Create New Goal</h2>
            <p className="text-sm text-muted-foreground">
              Step {step} of 3 • {step === 1 ? "Define Goal" : step === 2 ? "Set Targets" : "Link & Finalize"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-8 pt-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 1 && <Step1Content showAISuggestions={showAISuggestions} setShowAISuggestions={setShowAISuggestions} />}
          {step === 2 && <Step2Content />}
          {step === 3 && <Step3Content />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-border bg-muted/30">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-3">
            {step < 3 && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
              >
                Save as Draft
              </button>
            )}
            <button
              onClick={() => step < 3 ? setStep(step + 1) : onClose()}
              className="px-6 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              {step === 3 ? "Create Goal" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1Content({ showAISuggestions, setShowAISuggestions }: { showAISuggestions: boolean; setShowAISuggestions: (show: boolean) => void }) {
  return (
    <div className="space-y-6">
      {/* AI Assistance Banner */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm text-sidebar-foreground mb-1">AI Goal Assistant</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Get smart suggestions based on your Scorecard metrics and annual plan
            </p>
            <button
              onClick={() => setShowAISuggestions(!showAISuggestions)}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              {showAISuggestions ? "Hide suggestions" : "Show AI suggestions"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      {showAISuggestions && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-2">SUGGESTED GOALS FROM YOUR SCORECARD</div>
          {[
            {
              title: "Improve Plant OEE from 82.3% to 85%",
              reason: "Your Operational Excellence accountability is at risk (78 score)",
              category: "Operational",
              linkedTo: "Scorecard: Operational Excellence",
            },
            {
              title: "Close 2 strategic M&A deals in Q2-Q3 2026",
              reason: "M&A/Strategic Partnerships needs attention (72 score)",
              category: "Growth",
              linkedTo: "Scorecard: M&A/Strategic Partnerships",
            },
            {
              title: "Launch innovation lab for new product development",
              reason: "Supports Brand Expansion (85 score) and maintains momentum",
              category: "Innovation",
              linkedTo: "Scorecard: Brand Expansion",
            },
          ].map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm text-sidebar-foreground pr-4">{suggestion.title}</h4>
                <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground whitespace-nowrap">
                  {suggestion.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{suggestion.reason}</p>
              <div className="flex items-center gap-1 text-xs text-accent">
                <LinkIcon className="w-3 h-3" />
                <span>{suggestion.linkedTo}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Goal Statement */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">
          GOAL STATEMENT <span className="text-accent">*</span>
        </label>
        <textarea
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
          rows={3}
          placeholder="e.g., Achieve 85% OEE across all manufacturing plants by end of Q2 2026"
        />
        <div className="text-xs text-muted-foreground mt-2">
          Tip: Use specific, measurable language that clearly defines success
        </div>
      </div>

      {/* Goal Type & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            GOAL TYPE <span className="text-accent">*</span>
          </label>
          <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option>Select type...</option>
            <option>Company Goal</option>
            <option>Team Goal</option>
            <option>Personal Goal</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            CATEGORY <span className="text-accent">*</span>
          </label>
          <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option>Select category...</option>
            <option>Financial</option>
            <option>Operational</option>
            <option>Market Growth</option>
            <option>People & Culture</option>
            <option>Innovation</option>
            <option>Compliance & Safety</option>
            <option>Brand Strength</option>
          </select>
        </div>
      </div>

      {/* Goal Owner */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">
          GOAL OWNER <span className="text-accent">*</span>
        </label>
        <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option>You (CEO)</option>
          <option>Sarah Mitchell (President/COO)</option>
          <option>Marcus Chen (CFO)</option>
          <option>Jennifer Lopez (CMO)</option>
          <option>David Park (VP Operations)</option>
          <option>Amanda Brooks (VP Sales)</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            START DATE <span className="text-accent">*</span>
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            defaultValue="2026-01-14"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            TARGET DATE <span className="text-accent">*</span>
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>

      {/* Quarters */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3">
          ACTIVE QUARTERS <span className="text-accent">*</span>
        </label>
        <div className="flex gap-3">
          {["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"].map((quarter) => (
            <button
              key={quarter}
              className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-sidebar-foreground hover:border-accent transition-colors"
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

function Step2Content() {
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm text-sidebar-foreground mb-1">Define Success Metrics</h4>
            <p className="text-xs text-muted-foreground">
              Set measurable targets so progress can be tracked automatically
            </p>
          </div>
        </div>
      </div>

      {/* Current State */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">
          CURRENT STATE / BASELINE <span className="text-accent">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g., 82.3"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Unit (e.g., %)"
            />
          </div>
        </div>
      </div>

      {/* Target State */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">
          TARGET STATE / GOAL <span className="text-accent">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g., 85"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Unit (e.g., %)"
            />
          </div>
        </div>
      </div>

      {/* Progress Calculation Preview */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm text-sidebar-foreground mb-1">Progress Preview</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Based on your baseline and target, here's how progress will be calculated
            </p>
            <div className="bg-white border border-green-200 rounded p-3">
              <div className="text-xs text-muted-foreground mb-2">Current Progress</div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl text-sidebar-foreground">0%</div>
                <div className="text-xs text-muted-foreground">82.3% → 85%</div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "0%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Measurement Frequency */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">
          MEASUREMENT FREQUENCY <span className="text-accent">*</span>
        </label>
        <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option>Weekly</option>
          <option>Bi-weekly</option>
          <option>Monthly</option>
          <option>Quarterly</option>
        </select>
        <div className="text-xs text-muted-foreground mt-2">
          How often will you update progress on this goal?
        </div>
      </div>

      {/* Key Milestones */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">KEY MILESTONES (OPTIONAL)</label>
        <div className="space-y-3">
          {[
            { milestone: "Complete operational audit", date: "Feb 15, 2026" },
            { milestone: "Implement first round of improvements", date: "Mar 31, 2026" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                defaultValue={item.milestone}
              />
              <input
                type="date"
                className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <button className="p-2 text-muted-foreground hover:text-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button className="text-xs text-accent hover:text-accent/80 transition-colors">
            + Add milestone
          </button>
        </div>
      </div>
    </div>
  );
}

function Step3Content() {
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <LinkIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
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
        <label className="block text-xs text-muted-foreground mb-3">LINK TO SCORECARD (RECOMMENDED)</label>
        <div className="space-y-2">
          {[
            { title: "Operational Excellence", description: "Partner with COO to drive efficiencies", score: 78, status: "at-risk" },
            { title: "Revenue & Profit Growth", description: "Achieve YoY revenue growth", score: 88, status: "on-track" },
            { title: "Talent & Culture", description: "Attract and retain A-player executives", score: 90, status: "on-track" },
          ].map((item, index) => (
            <button
              key={index}
              className={`w-full text-left bg-card border rounded-lg p-4 hover:border-accent transition-colors ${
                index === 0 ? "border-accent" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm text-sidebar-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-lg text-sidebar-foreground mb-1">{item.score}</div>
                  <div className={`text-xs ${item.status === "on-track" ? "text-green-600" : "text-yellow-600"}`}>
                    {item.status === "on-track" ? "On Track" : "At Risk"}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Link to Annual Plan */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3">LINK TO ANNUAL PLAN (OPTIONAL)</label>
        <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option>No link</option>
          <option>Profitable Growth Pillar</option>
          <option>Operational Excellence Pillar</option>
          <option>Market Leadership Pillar</option>
        </select>
      </div>

      {/* Link to Program */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3">LINK TO LEADERSHIP PROGRAM (OPTIONAL)</label>
        <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option>No link</option>
          <option>LeaderShift: Leading through Change</option>
          <option>Executive Excellence Program</option>
          <option>High-Performance Team Building</option>
        </select>
      </div>

      {/* Visibility & Collaboration */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3">VISIBILITY & COLLABORATION</label>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
              defaultChecked
            />
            <div>
              <div className="text-sm text-sidebar-foreground mb-1">Visible to direct reports</div>
              <div className="text-xs text-muted-foreground">
                Your leadership team can see and contribute to this goal
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
            />
            <div>
              <div className="text-sm text-sidebar-foreground mb-1">Add to Dashboard</div>
              <div className="text-xs text-muted-foreground">
                Show this goal in your Journey Hub for quick access
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
              defaultChecked
            />
            <div>
              <div className="text-sm text-sidebar-foreground mb-1">Enable AI coaching suggestions</div>
              <div className="text-xs text-muted-foreground">
                Receive weekly insights and recommendations to stay on track
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accountability Partner */}
      <div>
        <label className="block text-xs text-muted-foreground mb-3">ACCOUNTABILITY PARTNER (OPTIONAL)</label>
        <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option>No partner</option>
          <option>Sarah Mitchell (President/COO)</option>
          <option>Marcus Chen (CFO)</option>
          <option>Jennifer Lopez (CMO)</option>
          <option>Your Executive Coach</option>
        </select>
        <div className="text-xs text-muted-foreground mt-2">
          This person will receive progress updates and can provide guidance
        </div>
      </div>

      {/* Summary */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-5">
        <h4 className="text-sm text-sidebar-foreground mb-3">Goal Summary</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Goal:</span>
            <span className="text-sidebar-foreground">Achieve 85% OEE across all plants</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner:</span>
            <span className="text-sidebar-foreground">You (CEO)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timeline:</span>
            <span className="text-sidebar-foreground">Q1-Q2 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target:</span>
            <span className="text-sidebar-foreground">82.3% → 85%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Linked to:</span>
            <span className="text-sidebar-foreground">Scorecard: Operational Excellence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
