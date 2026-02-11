"use client";

import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
} from "lucide-react";
import { Card } from "../ui";
import type { AssessmentCardProps } from "./types";
import {
  assessmentStatusConfig,
  raterTypeLabels,
  raterTypeColors,
} from "./data";

export function AssessmentCard({
  assessment,
  onView,
  onSendReminder,
}: AssessmentCardProps) {
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

  const ratersByType = assessment.raters.reduce(
    (acc, rater) => {
      acc[rater.type] = (acc[rater.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const completedRaters = assessment.raters.filter(
    (r) => r.status === "completed"
  ).length;
  const totalRaters = assessment.raters.length;
  const pendingRaters = assessment.raters.filter(
    (r) => r.status === "pending" || r.status === "in_progress"
  ).length;

  const isOverdue =
    assessment.status === "active" &&
    new Date(assessment.dueDate) < new Date();

  return (
    <Card
      padding="lg"
      className="hover:border-accent/30 transition-colors cursor-pointer"
      onClick={() => onView?.(assessment.id)}
    >
      <div className="flex items-start justify-between">
        {/* Left: Assessment info */}
        <div className="flex items-start gap-4">
          {/* Subject avatar */}
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center text-lg font-medium">
            {getInitials(assessment.subject.name)}
          </div>

          {/* Assessment details */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sidebar-foreground font-medium">
                {assessment.subject.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
              >
                {statusConfig.label}
              </span>
              {isOverdue && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              {assessment.subject.role} • {assessment.templateName}
            </div>

            {/* Rater breakdown */}
            <div className="flex items-center gap-2 mb-2">
              {Object.entries(ratersByType).map(([type, count]) => {
                const colors = raterTypeColors[type];
                return (
                  <span
                    key={type}
                    className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
                  >
                    {raterTypeLabels[type]}: {count}
                  </span>
                );
              })}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
              {assessment.status === "active" && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{pendingRaters} pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Progress and actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Response rate */}
          <div className="text-right">
            <div className="text-2xl font-medium text-sidebar-foreground">
              {assessment.responseRate}%
            </div>
            <div className="text-xs text-muted-foreground">Response Rate</div>
          </div>

          {/* Progress bar */}
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                assessment.responseRate === 100
                  ? "bg-green-500"
                  : assessment.responseRate >= 50
                    ? "bg-accent"
                    : "bg-yellow-500"
              }`}
              style={{ width: `${assessment.responseRate}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {assessment.status === "active" && pendingRaters > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder?.(assessment.id);
                }}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                Send Reminder
              </button>
            )}

            {assessment.hasResults && (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Results Ready
              </span>
            )}

            <ArrowRight className="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>
    </Card>
  );
}
