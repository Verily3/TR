"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Card } from "../ui";
import { ProgramCard } from "./ProgramCard";
import type { Program, ProgramsStats } from "./types";
import { defaultPrograms, defaultProgramsStats, filterOptions, FilterId } from "./data";

export interface ProgramsPageProps {
  /** Programs list */
  programs?: Program[];
  /** Programs stats */
  stats?: ProgramsStats;
  /** Callback when enroll button is clicked */
  onEnroll?: () => void;
  /** Callback when continue program is clicked */
  onContinueProgram?: (programId: string) => void;
  /** Callback when view program details is clicked */
  onViewProgram?: (programId: string) => void;
}

interface StatCardProps {
  label: string;
  value: number;
  borderColor?: string;
  valueColor?: string;
}

function StatCard({
  label,
  value,
  borderColor = "border-border",
  valueColor = "text-sidebar-foreground",
}: StatCardProps) {
  return (
    <Card padding="sm" className={borderColor}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl ${valueColor} tabular-nums`}>{value}</div>
    </Card>
  );
}

export function ProgramsPage({
  programs = defaultPrograms,
  stats = defaultProgramsStats,
  onEnroll,
  onContinueProgram,
  onViewProgram,
}: ProgramsPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const filteredPrograms = useMemo(() => {
    if (activeFilter === "all") return programs;
    return programs.filter((p) => p.status === activeFilter);
  }, [programs, activeFilter]);

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Page Header */}
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sidebar-foreground mb-2">Programs</h1>
          <p className="text-muted-foreground">
            Structured learning paths to develop capabilities and drive results
          </p>
        </div>
        <button
          onClick={onEnroll}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Enroll in Program
        </button>
      </header>

      {/* Stats Bar */}
      <div
        className="mb-8 grid grid-cols-4 gap-4"
        role="region"
        aria-label="Programs statistics"
      >
        <StatCard label="Total Programs" value={stats.total} />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          borderColor="border-blue-200"
          valueColor="text-blue-600"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          borderColor="border-green-200"
          valueColor="text-green-600"
        />
        <StatCard label="Not Started" value={stats.notStarted} />
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex items-center gap-2 p-1 bg-muted rounded-lg"
          role="tablist"
          aria-label="Filter programs"
        >
          {filterOptions.map((option) => (
            <button
              key={option.id}
              role="tab"
              aria-selected={activeFilter === option.id}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                activeFilter === option.id
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-background"
              }`}
              onClick={() => setActiveFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="text-sm text-muted-foreground">
          Showing {filteredPrograms.length} of {programs.length} programs
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid gap-4" role="list" aria-label="Programs list">
        {filteredPrograms.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            onContinue={onContinueProgram}
            onViewDetails={onViewProgram}
          />
        ))}

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No programs found for the selected filter
          </div>
        )}
      </div>
    </main>
  );
}
