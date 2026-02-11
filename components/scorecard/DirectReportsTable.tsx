"use client";

import { ChevronRight, Users } from "lucide-react";
import { Section, Card, Avatar, CircularProgress, ProgressBar, TrendIndicator } from "../ui";
import type { DirectReport } from "./types";
import { defaultDirectReports } from "./data";

export interface DirectReportsTableProps {
  /** List of direct reports */
  reports?: DirectReport[];
  /** Callback when a report row is clicked */
  onSelect?: (id: string) => void;
}

type Rating = DirectReport["rating"];

const ratingStyles: Record<Rating, string> = {
  "A": "bg-green-100 text-green-700 ring-green-500/20",
  "A-": "bg-green-50 text-green-600 ring-green-500/20",
  "B+": "bg-blue-100 text-blue-700 ring-blue-500/20",
  "B": "bg-blue-50 text-blue-600 ring-blue-500/20",
  "B-": "bg-slate-100 text-slate-600 ring-slate-500/20",
};

interface ReportRowProps {
  report: DirectReport;
  onSelect?: (id: string) => void;
}

function ReportRow({ report, onSelect }: ReportRowProps) {
  const goalsPercent = (report.goalsCompleted / report.goalsTotal) * 100;
  const goalsVariant = goalsPercent >= 80 ? "success" : goalsPercent >= 50 ? "warning" : "danger";

  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
      onClick={() => onSelect?.(report.id)}
      role="row"
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(report.id);
        }
      }}
      style={{ cursor: onSelect ? "pointer" : undefined }}
    >
      {/* Name & Role */}
      <td className="px-6 py-4" role="cell">
        <div className="flex items-center gap-3">
          <Avatar name={report.name} size="md" />
          <div>
            <div className="text-sm font-medium text-sidebar-foreground">
              {report.name}
            </div>
            <div className="text-xs text-muted-foreground">{report.role}</div>
          </div>
        </div>
      </td>

      {/* Scorecard */}
      <td className="px-6 py-4" role="cell">
        <div className="flex items-center gap-2">
          <CircularProgress
            value={report.scorecardScore}
            max={100}
            size={48}
            strokeWidth={4}
            variant="auto"
            label={
              <span className="text-xs font-semibold text-sidebar-foreground">
                {report.scorecardScore}
              </span>
            }
            aria-label={`Scorecard score: ${report.scorecardScore}`}
          />
          <TrendIndicator
            direction={report.scorecardTrend}
            variant="minimal"
            size="sm"
          />
        </div>
      </td>

      {/* Goals Progress */}
      <td className="px-6 py-4" role="cell">
        <div className="w-32">
          <div className="text-xs text-muted-foreground mb-1">
            {report.goalsCompleted}/{report.goalsTotal} complete
          </div>
          <ProgressBar
            value={report.goalsCompleted}
            max={report.goalsTotal}
            size="md"
            variant={goalsVariant}
            aria-label={`Goals progress: ${report.goalsCompleted} of ${report.goalsTotal}`}
          />
        </div>
      </td>

      {/* Programs */}
      <td className="px-6 py-4" role="cell">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full">
          <span
            className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
            aria-hidden="true"
          />
          <span className="text-sm text-sidebar-foreground">
            {report.programsActive} Active
          </span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-6 py-4" role="cell">
        <span
          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ring-2 ${ratingStyles[report.rating]}`}
          aria-label={`Rating: ${report.rating}`}
        >
          {report.rating}
        </span>
      </td>

      {/* Action */}
      <td className="px-6 py-4 text-right" role="cell">
        {onSelect && (
          <button
            className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
            aria-label={`View details for ${report.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(report.id);
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </td>
    </tr>
  );
}

export function DirectReportsTable({
  reports = defaultDirectReports,
  onSelect,
}: DirectReportsTableProps) {
  return (
    <Section
      title="Direct Reports Performance"
      icon={<Users className="w-5 h-5" />}
    >
      <Card padding="none" className="overflow-hidden">
        <table className="w-full" role="table">
          <thead className="bg-muted/50 border-b border-border">
            <tr role="row">
              <th
                className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                role="columnheader"
                scope="col"
              >
                Name
              </th>
              <th
                className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                role="columnheader"
                scope="col"
              >
                Scorecard
              </th>
              <th
                className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                role="columnheader"
                scope="col"
              >
                Goals Progress
              </th>
              <th
                className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                role="columnheader"
                scope="col"
              >
                Programs
              </th>
              <th
                className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                role="columnheader"
                scope="col"
              >
                Rating
              </th>
              <th className="px-6 py-4" role="columnheader" scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}
