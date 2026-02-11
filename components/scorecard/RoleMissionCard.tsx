"use client";

import { Target } from "lucide-react";
import { Card, CircularProgress, TrendIndicator } from "../ui";

export interface RoleMissionCardProps {
  /** Executive role title */
  role: string;
  /** Mission statement */
  mission: string;
  /** Overall scorecard score */
  overallScore: number;
  /** Maximum possible score */
  maxScore?: number;
  /** Change from previous period */
  trend: number;
  /** Period being compared to (e.g., "Q4") */
  comparisonPeriod: string;
}

export function RoleMissionCard({
  role,
  mission,
  overallScore,
  maxScore = 100,
  trend,
  comparisonPeriod,
}: RoleMissionCardProps) {
  const trendDirection = trend > 0 ? "up" : trend < 0 ? "down" : "neutral";
  const trendValue = `${trend > 0 ? "+" : ""}${trend} vs ${comparisonPeriod}`;

  return (
    <Card padding="lg" className="mb-8">
      <div className="flex items-start justify-between gap-8">
        {/* Left: Role & Mission */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Role
            </span>
          </div>
          <h2 className="text-xl font-semibold text-sidebar-foreground mb-4">
            {role}
          </h2>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Mission
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {mission}
          </p>
        </div>

        {/* Right: Score Gauge */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 text-center">
            Overall Score
          </div>
          <CircularProgress
            value={overallScore}
            max={maxScore}
            size={120}
            strokeWidth={10}
            variant="auto"
            label={
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-sidebar-foreground">
                  {overallScore}
                </span>
                <span className="text-xs text-muted-foreground">/ {maxScore}</span>
              </div>
            }
            aria-label={`Overall score: ${overallScore} out of ${maxScore}`}
          />
          <div className="mt-3">
            <TrendIndicator
              direction={trendDirection}
              value={trendValue}
              variant="pill"
              size="md"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
