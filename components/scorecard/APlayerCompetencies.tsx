"use client";

import { Star } from "lucide-react";
import { Section, Card, TrendIndicator } from "../ui";
import type { Competency } from "./types";
import { defaultCompetencies } from "./data";

export interface APlayerCompetenciesProps {
  /** List of competencies to display */
  competencies?: Competency[];
  /** Maximum rating value */
  maxRating?: number;
}

interface RatingBarProps {
  value: number;
  max: number;
  variant: "self" | "mentor";
  label: string;
}

function RatingBar({ value, max, variant, label }: RatingBarProps) {
  const percentage = (value / max) * 100;
  const bgColor = variant === "self" ? "bg-accent" : "bg-blue-500";
  const trackColor = variant === "self" ? "bg-accent/20" : "bg-blue-500/20";

  return (
    <div className="flex items-center gap-2" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={`w-20 h-2 rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full ${bgColor} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-sidebar-foreground w-4 text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}

interface CompetencyRowProps {
  competency: Competency;
  maxRating: number;
  isLast: boolean;
}

function CompetencyRow({ competency, maxRating, isLast }: CompetencyRowProps) {
  const gap = competency.mentorRating - competency.selfRating;
  const gapDirection = gap > 0 ? "up" : gap < 0 ? "down" : "neutral";
  const gapLabel = gap === 0 ? "Aligned" : `${gap > 0 ? "+" : ""}${gap}`;

  return (
    <div
      className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors ${
        !isLast ? "border-b border-border" : ""
      }`}
      role="row"
    >
      <div className="col-span-6" role="cell">
        <div className="text-sm font-medium text-sidebar-foreground mb-1">
          {competency.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {competency.description}
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center" role="cell">
        <RatingBar
          value={competency.selfRating}
          max={maxRating}
          variant="self"
          label={`Self rating: ${competency.selfRating} out of ${maxRating}`}
        />
      </div>
      <div className="col-span-2 flex items-center justify-center" role="cell">
        <RatingBar
          value={competency.mentorRating}
          max={maxRating}
          variant="mentor"
          label={`Mentor rating: ${competency.mentorRating} out of ${maxRating}`}
        />
      </div>
      <div className="col-span-2 flex items-center justify-center" role="cell">
        <TrendIndicator
          direction={gapDirection}
          value={gapLabel}
          variant="pill"
          size="sm"
        />
      </div>
    </div>
  );
}

export function APlayerCompetencies({
  competencies = defaultCompetencies,
  maxRating = 5,
}: APlayerCompetenciesProps) {
  // Calculate summary statistics
  const avgSelf =
    competencies.reduce((sum, c) => sum + c.selfRating, 0) / competencies.length;
  const avgMentor =
    competencies.reduce((sum, c) => sum + c.mentorRating, 0) / competencies.length;
  const overallGap = avgMentor - avgSelf;
  const gapDirection = overallGap > 0 ? "up" : overallGap < 0 ? "down" : "neutral";

  const summaryStats = (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-accent" aria-hidden="true" />
        <span className="text-muted-foreground">Self Avg:</span>
        <span className="font-medium text-sidebar-foreground tabular-nums">
          {avgSelf.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" aria-hidden="true" />
        <span className="text-muted-foreground">Mentor Avg:</span>
        <span className="font-medium text-sidebar-foreground tabular-nums">
          {avgMentor.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TrendIndicator direction={gapDirection} size="sm" />
        <span className="text-muted-foreground">Gap:</span>
        <span className={`font-medium tabular-nums ${
          overallGap > 0 ? "text-green-600" : overallGap < 0 ? "text-red-600" : "text-muted-foreground"
        }`}>
          {overallGap > 0 ? "+" : ""}{overallGap.toFixed(1)}
        </span>
      </div>
    </div>
  );

  return (
    <Section
      title="A-Player Competencies"
      icon={<Star className="w-5 h-5" />}
      action={summaryStats}
    >
      <Card padding="none" className="overflow-hidden">
        {/* Table Header */}
        <div
          className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border"
          role="row"
        >
          <div className="col-span-6 text-xs font-medium text-muted-foreground uppercase tracking-wide" role="columnheader">
            Competency
          </div>
          <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wide text-center" role="columnheader">
            Self
          </div>
          <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wide text-center" role="columnheader">
            Mentor
          </div>
          <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wide text-center" role="columnheader">
            Gap
          </div>
        </div>

        {/* Table Body */}
        <div role="rowgroup">
          {competencies.map((competency, index) => (
            <CompetencyRow
              key={competency.id}
              competency={competency}
              maxRating={maxRating}
              isLast={index === competencies.length - 1}
            />
          ))}
        </div>
      </Card>
    </Section>
  );
}
