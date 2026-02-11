"use client";

import { Activity } from "lucide-react";
import { Section, Card, CircularProgress, TrendIndicator } from "../ui";
import type { HealthCategory } from "./types";
import { defaultHealthCategories } from "./data";

export interface OrganizationalHealthProps {
  /** Health categories to display */
  categories?: HealthCategory[];
}

interface HealthCardProps {
  category: HealthCategory;
}

function HealthCard({ category }: HealthCardProps) {
  const trendValue =
    category.trend === "neutral"
      ? "0"
      : `${category.change > 0 ? "+" : ""}${category.change}`;

  return (
    <Card
      variant="elevated"
      padding="md"
      className="flex flex-col items-center"
    >
      <CircularProgress
        value={category.score}
        max={100}
        size={80}
        strokeWidth={6}
        variant="auto"
        aria-label={`${category.name} score: ${category.score}`}
      />
      <div className="mt-3 text-sm font-medium text-sidebar-foreground">
        {category.name}
      </div>
      <div className="mt-2">
        <TrendIndicator
          direction={category.trend}
          value={trendValue}
          variant="pill"
          size="sm"
        />
      </div>
    </Card>
  );
}

export function OrganizationalHealth({
  categories = defaultHealthCategories,
}: OrganizationalHealthProps) {
  const avgScore = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  );

  const overallBadge = (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border">
      <span className="text-sm text-muted-foreground">Overall:</span>
      <span className="text-lg font-bold text-sidebar-foreground tabular-nums">
        {avgScore}
      </span>
    </div>
  );

  return (
    <Section
      title="Organizational Health Score"
      icon={<Activity className="w-5 h-5" />}
      action={overallBadge}
    >
      <div
        className="grid grid-cols-5 gap-4"
        role="list"
        aria-label="Organizational health categories"
      >
        {categories.map((category) => (
          <HealthCard key={category.id} category={category} />
        ))}
      </div>
    </Section>
  );
}
