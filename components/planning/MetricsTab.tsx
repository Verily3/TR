"use client";

import { useState } from "react";
import { DollarSign, Factory, Users, Award } from "lucide-react";
import { Card } from "../ui";
import type { KPICategory, KPIMetric } from "./types";
import { defaultKPICategories } from "./data";

export interface MetricsTabProps {
  /** KPI categories with metrics */
  categories?: KPICategory[];
  /** Current period for display */
  currentPeriod?: string;
}

const PERIOD_OPTIONS = ["Q1 2026", "Q4 2025", "Q3 2025"] as const;

const iconMap: Record<string, React.ReactNode> = {
  DollarSign: <DollarSign className="w-5 h-5 text-accent" aria-hidden="true" />,
  Factory: <Factory className="w-5 h-5 text-accent" aria-hidden="true" />,
  Users: <Users className="w-5 h-5 text-accent" aria-hidden="true" />,
  Award: <Award className="w-5 h-5 text-accent" aria-hidden="true" />,
};

interface MetricCardProps {
  metric: KPIMetric;
}

function MetricCard({ metric }: MetricCardProps) {
  const changeColor =
    metric.changeDirection === "up"
      ? "text-green-600"
      : metric.changeDirection === "down"
      ? "text-accent"
      : "text-muted-foreground";

  return (
    <Card padding="md" role="article" aria-label={`${metric.name} metric`}>
      <div className="text-xs text-muted-foreground mb-2">{metric.name}</div>
      <div className="text-2xl text-sidebar-foreground mb-2 tabular-nums">{metric.value}</div>
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-muted-foreground">Target: {metric.target}</span>
        <span className={changeColor}>{metric.change}</span>
      </div>
      {metric.unit && <div className="text-xs text-muted-foreground">{metric.unit}</div>}
    </Card>
  );
}

interface CategorySectionProps {
  category: KPICategory;
}

function CategorySection({ category }: CategorySectionProps) {
  const gridCols = category.columns === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <section className="mb-8" aria-labelledby={`category-${category.id}`}>
      <div className="flex items-center gap-2 mb-4">
        {iconMap[category.icon]}
        <h4 id={`category-${category.id}`} className="text-sm text-sidebar-foreground">
          {category.name}
        </h4>
      </div>
      <div
        className={`grid ${gridCols} gap-4`}
        role="list"
        aria-label={`${category.name} metrics`}
      >
        {category.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}

export function MetricsTab({
  categories = defaultKPICategories,
  currentPeriod = "Q1 2026",
}: MetricsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);

  return (
    <div>
      {/* KPI Performance Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sidebar-foreground">KPI Performance Dashboard</h3>
          <div className="flex items-center gap-3">
            <label htmlFor="kpi-period-select" className="sr-only">
              Select period
            </label>
            <select
              id="kpi-period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Categories */}
      {categories.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}
