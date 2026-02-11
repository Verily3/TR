"use client";

import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Card } from "../ui";
import type { AssessmentResults, CompetencyScore } from "./types";
import { raterTypeLabels } from "./data";

interface ResultsViewProps {
  results: AssessmentResults;
}

export function ResultsView({ results }: ResultsViewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGapIndicator = (gap: number | undefined) => {
    if (!gap) return null;
    if (gap > 0.5) {
      return (
        <span className="flex items-center gap-1 text-yellow-600 text-xs">
          <TrendingUp className="w-3 h-3" />
          Self-rating higher
        </span>
      );
    }
    if (gap < -0.5) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-xs">
          <TrendingDown className="w-3 h-3" />
          Others rate higher
        </span>
      );
    }
    return (
      <span className="text-muted-foreground text-xs">Aligned ratings</span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 4) return "bg-green-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-accent" />
            <span className="text-3xl font-bold text-sidebar-foreground">
              {results.overallScore.toFixed(1)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Overall Score</div>
          <div className="text-xs text-muted-foreground mt-1">out of 5.0</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span className="text-3xl font-bold text-sidebar-foreground">
              {results.totalResponses}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Total Responses</div>
          <div className="text-xs text-muted-foreground mt-1">
            Completed {formatDate(results.completedAt)}
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-green-600" />
            <span className="text-3xl font-bold text-sidebar-foreground">
              {results.strengths.length}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Key Strengths</div>
          <div className="text-xs text-green-600 mt-1">
            {results.strengths.join(", ")}
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <span className="text-3xl font-bold text-sidebar-foreground">
              {results.developmentAreas.length}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Development Areas</div>
          <div className="text-xs text-yellow-600 mt-1">
            {results.developmentAreas.join(", ")}
          </div>
        </Card>
      </div>

      {/* Response Breakdown */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Response Breakdown by Rater Type
        </h3>
        <div className="flex items-center gap-6">
          {Object.entries(results.responsesByType).map(([type, count]) => {
            if (count === 0) return null;
            return (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-sidebar-foreground">
                  {count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {raterTypeLabels[type]}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Competency Scores */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-6">
          Competency Scores
        </h3>
        <div className="space-y-6">
          {results.competencyScores.map((score) => (
            <CompetencyScoreRow key={score.competencyId} score={score} />
          ))}
        </div>
      </Card>

      {/* Radar Chart Placeholder */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Competency Comparison
        </h3>
        <div className="aspect-square max-w-md mx-auto relative">
          {/* Simple radar chart visualization */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background circles */}
            {[1, 2, 3, 4, 5].map((level) => (
              <circle
                key={level}
                cx="100"
                cy="100"
                r={level * 18}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-border"
              />
            ))}

            {/* Axes */}
            {results.competencyScores.map((_, index) => {
              const angle =
                (index * 360) / results.competencyScores.length - 90;
              const x2 = 100 + 90 * Math.cos((angle * Math.PI) / 180);
              const y2 = 100 + 90 * Math.sin((angle * Math.PI) / 180);
              return (
                <line
                  key={index}
                  x1="100"
                  y1="100"
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
              );
            })}

            {/* Self score polygon */}
            <polygon
              points={results.competencyScores
                .map((score, index) => {
                  const angle =
                    (index * 360) / results.competencyScores.length - 90;
                  const value = (score.selfScore || 0) / 5;
                  const x = 100 + value * 90 * Math.cos((angle * Math.PI) / 180);
                  const y = 100 + value * 90 * Math.sin((angle * Math.PI) / 180);
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="rgba(229, 62, 62, 0.2)"
              stroke="#E53E3E"
              strokeWidth="2"
            />

            {/* Average score polygon */}
            <polygon
              points={results.competencyScores
                .map((score, index) => {
                  const angle =
                    (index * 360) / results.competencyScores.length - 90;
                  const value = score.averageScore / 5;
                  const x = 100 + value * 90 * Math.cos((angle * Math.PI) / 180);
                  const y = 100 + value * 90 * Math.sin((angle * Math.PI) / 180);
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3B82F6"
              strokeWidth="2"
            />

            {/* Labels */}
            {results.competencyScores.map((score, index) => {
              const angle =
                (index * 360) / results.competencyScores.length - 90;
              const x = 100 + 105 * Math.cos((angle * Math.PI) / 180);
              const y = 100 + 105 * Math.sin((angle * Math.PI) / 180);
              return (
                <text
                  key={score.competencyId}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-muted-foreground"
                >
                  {score.competencyName.split(" ")[0]}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-sm text-muted-foreground">Self</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-muted-foreground">Others Avg</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Gap Analysis */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Self vs Others Gap Analysis
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Understanding the gap between self-perception and how others perceive
          you can reveal blind spots and hidden strengths.
        </p>
        <div className="space-y-4">
          {results.competencyScores.map((score) => {
            const gap = score.gap || 0;
            const absGap = Math.abs(gap);
            return (
              <div key={score.competencyId} className="flex items-center gap-4">
                <div className="w-40 text-sm text-sidebar-foreground">
                  {score.competencyName}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-20 text-right text-sm text-muted-foreground">
                    Self: {score.selfScore?.toFixed(1)}
                  </div>
                  <div className="flex-1 h-4 bg-muted rounded-full relative">
                    <div
                      className={`absolute top-0 h-full rounded-full ${
                        gap > 0 ? "bg-yellow-400" : "bg-green-400"
                      }`}
                      style={{
                        left: gap > 0 ? "50%" : `${50 - absGap * 10}%`,
                        width: `${absGap * 10}%`,
                      }}
                    />
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-border" />
                  </div>
                  <div className="w-20 text-sm text-muted-foreground">
                    Avg: {score.averageScore.toFixed(1)}
                  </div>
                </div>
                <div className="w-32">
                  {gap > 0.5 ? (
                    <span className="text-xs text-yellow-600">
                      Potential blind spot
                    </span>
                  ) : gap < -0.5 ? (
                    <span className="text-xs text-green-600">Hidden strength</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Well aligned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function CompetencyScoreRow({ score }: { score: CompetencyScore }) {
  const getScoreBarColor = (value: number) => {
    if (value >= 4) return "bg-green-500";
    if (value >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const scores = [
    { label: "Self", value: score.selfScore, color: "bg-purple-500" },
    { label: "Manager", value: score.managerScore, color: "bg-blue-500" },
    { label: "Peers", value: score.peerScore, color: "bg-green-500" },
    {
      label: "Direct Reports",
      value: score.directReportScore,
      color: "bg-orange-500",
    },
  ].filter((s) => s.value !== undefined);

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-sidebar-foreground">
          {score.competencyName}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-sidebar-foreground">
            {score.averageScore.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">/ 5.0</span>
        </div>
      </div>

      {/* Score bars by rater type */}
      <div className="space-y-2">
        {scores.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-24 text-sm text-muted-foreground">{s.label}</div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${s.color}`}
                style={{ width: `${((s.value || 0) / 5) * 100}%` }}
              />
            </div>
            <div className="w-10 text-sm text-sidebar-foreground text-right">
              {s.value?.toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      {/* Gap indicator */}
      {score.gap !== undefined && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Self vs Others Gap
            </span>
            <span
              className={`text-sm font-medium ${
                Math.abs(score.gap) > 0.5
                  ? score.gap > 0
                    ? "text-yellow-600"
                    : "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              {score.gap > 0 ? "+" : ""}
              {score.gap.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
