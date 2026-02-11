"use client";

import {
  DollarSign,
  Factory,
  TrendingUp,
  Users,
  Shield,
  Award,
  LucideIcon,
} from "lucide-react";
import { Card, Section, TrendIndicator, ProgressBar } from "../ui";
import type { KPICategory, KPI } from "./types";
import { defaultKPICategories } from "./data";

export interface KPIDashboardProps {
  /** KPI categories to display */
  categories?: KPICategory[];
}

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Factory,
  TrendingUp,
  Users,
  Shield,
  Award,
};

interface KPICardProps {
  kpi: KPI;
}

function KPICard({ kpi }: KPICardProps) {
  // Determine if this is a positive trend
  const isPositive = kpi.invertTrend
    ? kpi.trend === "down"
    : kpi.trend === "up";

  const progressVariant = isPositive
    ? "success"
    : kpi.trend === "neutral"
    ? "default"
    : "danger";

  return (
    <div
      className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
      role="article"
      aria-label={`${kpi.label}: ${kpi.value}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {kpi.label}
        </span>
        <TrendIndicator
          direction={kpi.trend}
          value={kpi.change}
          variant="pill"
          iconStyle="arrow"
          size="sm"
        />
      </div>
      <div className="text-2xl font-semibold text-sidebar-foreground mb-3">
        {kpi.value}
      </div>
      <div className="flex items-center gap-2">
        <ProgressBar
          value={75}
          max={100}
          size="sm"
          variant={progressVariant}
          className="flex-1"
          aria-hidden="true"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {kpi.target}
        </span>
      </div>
    </div>
  );
}

interface KPICategoryCardProps {
  category: KPICategory;
}

function KPICategoryCard({ category }: KPICategoryCardProps) {
  const Icon = iconMap[category.iconName] || DollarSign;
  const columns = category.kpis.length === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <Card padding="lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10" aria-hidden="true">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <h4 className="text-sm font-medium text-sidebar-foreground">
          {category.name}
        </h4>
      </div>
      <div
        className={`grid gap-4 ${columns}`}
        role="list"
        aria-label={`${category.name} KPIs`}
      >
        {category.kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </Card>
  );
}

export function KPIDashboard({ categories = defaultKPICategories }: KPIDashboardProps) {
  return (
    <Section title="Key Performance Indicators">
      <div className="space-y-6" role="list" aria-label="KPI categories">
        {categories.map((category) => (
          <KPICategoryCard key={category.id} category={category} />
        ))}
      </div>
    </Section>
  );
}
