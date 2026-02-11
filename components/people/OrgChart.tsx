"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { Card } from "../ui";
import type { OrgChartProps, Person } from "./types";
import { defaultPeople, employmentStatusConfig } from "./data";

interface OrgNodeProps {
  person: Person;
  people: Person[];
  level: number;
  onViewPerson?: (personId: string) => void;
}

function OrgNode({ person, people, level, onViewPerson }: OrgNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const directReports = people.filter((p) => p.managerId === person.id);
  const hasReports = directReports.length > 0;
  const statusConfig = employmentStatusConfig[person.employmentStatus];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      {/* Connection line from parent */}
      {level > 0 && (
        <div className="absolute -top-4 left-8 w-0.5 h-4 bg-border" />
      )}

      <div className="flex items-start gap-2">
        {/* Expand/collapse button */}
        {hasReports ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 p-1 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Person card */}
        <div
          onClick={() => onViewPerson?.(person.id)}
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors cursor-pointer min-w-[250px]"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium">
            {getInitials(person.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sidebar-foreground truncate">
                {person.name}
              </span>
              {person.employmentStatus !== "active" && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {person.title}
            </div>
            {hasReports && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {directReports.length} direct report{directReports.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasReports && isExpanded && (
        <div className="ml-8 mt-2 pl-4 border-l border-border space-y-2">
          {directReports.map((report) => (
            <OrgNode
              key={report.id}
              person={report}
              people={people}
              level={level + 1}
              onViewPerson={onViewPerson}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgChart({
  rootPerson,
  people = defaultPeople,
  onViewPerson,
}: OrgChartProps) {
  // Find the CEO/root person if not provided
  const root = rootPerson || people.find((p) => !p.managerId);

  if (!root) {
    return (
      <Card padding="lg">
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sidebar-foreground mb-2">No Organization Data</h3>
          <p className="text-sm text-muted-foreground">
            Add people to see the org chart
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <h3 className="text-lg font-medium text-sidebar-foreground mb-6">
        Organization Chart
      </h3>
      <div className="overflow-auto pb-4">
        <OrgNode
          person={root}
          people={people}
          level={0}
          onViewPerson={onViewPerson}
        />
      </div>
    </Card>
  );
}
