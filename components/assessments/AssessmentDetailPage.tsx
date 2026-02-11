"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Mail,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";
import { Card } from "../ui";
import type { AssessmentDetailPageProps, Rater } from "./types";
import {
  assessmentStatusConfig,
  raterStatusConfig,
  raterTypeLabels,
  raterTypeColors,
  sampleResults,
  defaultTemplates,
  defaultAssessments,
} from "./data";
import { ResultsView } from "./ResultsView";

type Tab = "overview" | "raters" | "results" | "settings";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <FileText className="w-4 h-4" /> },
  { id: "raters", label: "Raters", icon: <Users className="w-4 h-4" /> },
  { id: "results", label: "Results", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

export function AssessmentDetailPage({
  assessment = defaultAssessments[0],
  template = defaultTemplates[0],
  results = sampleResults,
  onBack,
}: AssessmentDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const statusConfig = assessmentStatusConfig[assessment.status];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const completedRaters = assessment.raters.filter(
    (r) => r.status === "completed"
  ).length;
  const totalRaters = assessment.raters.length;

  const ratersByType = assessment.raters.reduce(
    (acc, rater) => {
      if (!acc[rater.type]) {
        acc[rater.type] = [];
      }
      acc[rater.type].push(rater);
      return acc;
    },
    {} as Record<string, Rater[]>
  );

  const isOverdue =
    assessment.status === "active" &&
    new Date(assessment.dueDate) < new Date();

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-sidebar-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assessments
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl font-medium">
              {getInitials(assessment.subject.name)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-sidebar-foreground">
                  {assessment.subject.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
                {isOverdue && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                {assessment.subject.role} • {assessment.templateName}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due {formatDate(assessment.dueDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {completedRaters}/{totalRaters} responses
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Created {formatDate(assessment.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {assessment.status === "active" && (
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Reminders
              </button>
            )}
            {assessment.status === "draft" && (
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                Launch Assessment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-background"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Progress Card */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Response Progress
            </h3>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-accent">
                {assessment.responseRate}%
              </div>
              <div className="text-sm text-muted-foreground">
                Response Rate
              </div>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${
                  assessment.responseRate === 100
                    ? "bg-green-500"
                    : "bg-accent"
                }`}
                style={{ width: `${assessment.responseRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedRaters} completed
              </span>
              <span className="text-muted-foreground">
                {totalRaters - completedRaters} remaining
              </span>
            </div>
          </Card>

          {/* Rater Breakdown */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Rater Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(ratersByType).map(([type, raters]) => {
                const completed = raters.filter(
                  (r) => r.status === "completed"
                ).length;
                const colors = raterTypeColors[type];
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded text-xs ${colors.bg} ${colors.text}`}
                    >
                      {raterTypeLabels[type]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {completed}/{raters.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Template Info */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Template Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Competencies</span>
                <span className="font-medium text-sidebar-foreground">
                  {template.competencies.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Questions</span>
                <span className="font-medium text-sidebar-foreground">
                  {template.competencies.reduce(
                    (acc, c) => acc + c.questions.length,
                    0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Scale</span>
                <span className="font-medium text-sidebar-foreground">
                  {template.scale.min} - {template.scale.max}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span className="font-medium text-sidebar-foreground">
                  {template.requireComments
                    ? "Required"
                    : template.allowComments
                      ? "Optional"
                      : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Anonymous</span>
                <span className="font-medium text-sidebar-foreground">
                  {template.anonymizeResponses ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </Card>

          {/* Competencies */}
          <Card padding="lg" className="col-span-3">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Competencies Being Assessed
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {template.competencies.map((competency) => (
                <div
                  key={competency.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <h4 className="font-medium text-sidebar-foreground mb-1">
                    {competency.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {competency.description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {competency.questions.length} questions
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "raters" && (
        <div className="space-y-6">
          {Object.entries(ratersByType).map(([type, raters]) => {
            const colors = raterTypeColors[type];
            return (
              <Card key={type} padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${colors.bg} ${colors.text}`}
                    >
                      {raterTypeLabels[type]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {raters.filter((r) => r.status === "completed").length}/
                      {raters.length} completed
                    </span>
                  </div>
                  {raters.some(
                    (r) => r.status === "pending" || r.status === "in_progress"
                  ) && (
                    <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Send Reminder
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {raters.map((rater) => {
                    const raterStatus = raterStatusConfig[rater.status];
                    return (
                      <div
                        key={rater.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium">
                            {getInitials(rater.person.name)}
                          </div>
                          <div>
                            <div className="font-medium text-sidebar-foreground">
                              {rater.person.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {rater.person.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {rater.reminderCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {rater.reminderCount} reminder
                              {rater.reminderCount > 1 ? "s" : ""} sent
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${raterStatus.bg} ${raterStatus.text}`}
                          >
                            {raterStatus.label}
                          </span>
                          {rater.status === "completed" && rater.completedAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(rater.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {/* Add Raters */}
          <Card padding="lg" className="border-dashed">
            <button className="w-full flex items-center justify-center gap-2 text-accent hover:text-accent/80 transition-colors py-4">
              <Users className="w-5 h-5" />
              <span>Add More Raters</span>
            </button>
          </Card>
        </div>
      )}

      {activeTab === "results" && (
        <div>
          {assessment.hasResults ? (
            <ResultsView results={results} />
          ) : (
            <Card padding="lg">
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sidebar-foreground mb-2">
                  Results Not Available Yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Results will be available once the assessment is completed
                </p>
                <div className="text-sm text-muted-foreground">
                  Current progress: {assessment.responseRate}% (
                  {completedRaters}/{totalRaters} responses)
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-6">
            Assessment Settings
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Due Date
              </label>
              <input
                type="date"
                defaultValue={assessment.dueDate}
                className="w-full max-w-xs px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Status
              </label>
              <select className="w-full max-w-xs px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-medium text-sidebar-foreground mb-4">
                Danger Zone
              </h4>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                  Cancel Assessment
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                  Delete Assessment
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}
