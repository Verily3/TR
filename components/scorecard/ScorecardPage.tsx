"use client";

import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import { RoleMissionCard } from "./RoleMissionCard";
import { KeyAccountabilities } from "./KeyAccountabilities";
import { KPIDashboard } from "./KPIDashboard";
import { APlayerCompetencies } from "./APlayerCompetencies";
import { DirectReportsTable } from "./DirectReportsTable";
import { OrganizationalHealth } from "./OrganizationalHealth";

const PERIOD_OPTIONS = ["Q1 2026", "Q4 2025", "Q3 2025", "Q2 2025"] as const;

type Period = (typeof PERIOD_OPTIONS)[number];

export interface ScorecardPageProps {
  /** Initial selected period */
  initialPeriod?: Period;
  /** Callback when export is requested */
  onExport?: (period: Period) => void;
  /** Callback when an accountability is selected */
  onAccountabilitySelect?: (id: string) => void;
  /** Callback when a direct report is selected */
  onReportSelect?: (id: string) => void;
}

// Default data - in a real app this would come from props or API
const DEFAULT_ROLE = "Chief Executive Officer";
const DEFAULT_MISSION =
  "Lead the company to profitable, scalable growth by setting strategic direction, strengthening operational performance, building a high-performance leadership team, and positioning the brand as a trusted industry leader in both raw and value-added chicken products.";
const DEFAULT_SCORE = 87;
const DEFAULT_TREND = 5;

export function ScorecardPage({
  initialPeriod = "Q1 2026",
  onExport,
  onAccountabilitySelect,
  onReportSelect,
}: ScorecardPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(initialPeriod);

  const handleExport = useCallback(() => {
    onExport?.(selectedPeriod);
  }, [onExport, selectedPeriod]);

  const handlePeriodChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedPeriod(e.target.value as Period);
    },
    []
  );

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sidebar-foreground mb-2">
              Executive Scorecard
            </h1>
            <p className="text-muted-foreground">
              Strategic performance dashboard for organizational leadership
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="period-select" className="sr-only">
              Select reporting period
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      {/* Role & Mission Card */}
      <RoleMissionCard
        role={DEFAULT_ROLE}
        mission={DEFAULT_MISSION}
        overallScore={DEFAULT_SCORE}
        trend={DEFAULT_TREND}
        comparisonPeriod="Q4"
      />

      {/* Key Accountabilities */}
      <KeyAccountabilities onSelect={onAccountabilitySelect} />

      {/* KPI Dashboard */}
      <KPIDashboard />

      {/* A-Player Competencies */}
      <APlayerCompetencies />

      {/* Direct Reports Performance */}
      <DirectReportsTable onSelect={onReportSelect} />

      {/* Organizational Health Score */}
      <OrganizationalHealth />
    </main>
  );
}
