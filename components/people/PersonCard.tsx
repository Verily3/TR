"use client";

import {
  Mail,
  Phone,
  MapPin,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Card } from "../ui";
import type { PersonCardProps } from "./types";
import { employmentStatusConfig } from "./data";

export function PersonCard({ person, onView, variant = "grid" }: PersonCardProps) {
  const statusConfig = employmentStatusConfig[person.employmentStatus];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (variant === "list") {
    return (
      <Card
        padding="md"
        className="hover:border-accent/30 transition-colors cursor-pointer"
        onClick={() => onView?.(person.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center text-lg font-medium">
              {getInitials(person.name)}
            </div>

            {/* Basic Info */}
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sidebar-foreground">
                  {person.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">{person.title}</div>
            </div>

            {/* Department & Team */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{person.department}</span>
              </div>
              {person.team && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{person.team}</span>
                </div>
              )}
              {person.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{person.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {person.directReports && person.directReports > 0 && (
              <span className="text-sm text-muted-foreground">
                {person.directReports} direct report{person.directReports > 1 ? "s" : ""}
              </span>
            )}
            <ArrowRight className="w-5 h-5 text-accent" />
          </div>
        </div>
      </Card>
    );
  }

  // Grid variant
  return (
    <Card
      padding="lg"
      className="hover:border-accent/30 transition-colors cursor-pointer"
      onClick={() => onView?.(person.id)}
    >
      <div className="flex flex-col items-center text-center mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl font-medium mb-3">
          {getInitials(person.name)}
        </div>

        {/* Name & Status */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sidebar-foreground">
            {person.name}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} mb-2`}
        >
          {statusConfig.label}
        </span>

        {/* Title */}
        <div className="text-sm text-muted-foreground mb-1">{person.title}</div>

        {/* Department */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="w-3 h-3" />
          <span>{person.department}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span className="truncate">{person.email}</span>
        </div>
        {person.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{person.location}</span>
          </div>
        )}
        {person.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{person.phone}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {(person.directReports || person.managerName) && (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          {person.managerName && (
            <span>Reports to: {person.managerName}</span>
          )}
          {person.directReports && person.directReports > 0 && (
            <span>{person.directReports} reports</span>
          )}
        </div>
      )}
    </Card>
  );
}
