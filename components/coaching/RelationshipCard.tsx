"use client";

import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Card } from "../ui";
import type { RelationshipCardProps } from "./types";
import { relationshipTypeLabels } from "./data";

export function RelationshipCard({
  relationship,
  onScheduleSession,
  onViewDetails,
}: RelationshipCardProps) {
  const typeLabel = relationshipTypeLabels[relationship.type];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusColors = {
    active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
    paused: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Paused" },
    ended: { bg: "bg-gray-100", text: "text-gray-700", label: "Ended" },
  };

  const statusConfig = statusColors[relationship.status];

  return (
    <Card
      padding="lg"
      className="hover:border-accent/30 transition-colors cursor-pointer"
      onClick={() => onViewDetails?.(relationship.id)}
    >
      <div className="flex items-center justify-between">
        {/* Left: Relationship info */}
        <div className="flex items-center gap-4">
          {/* Avatars */}
          <div className="flex -space-x-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-medium border-2 border-background">
              {getInitials(relationship.coach.name)}
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium border-2 border-background">
              {getInitials(relationship.coachee.name)}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sidebar-foreground font-medium">
                {relationship.coach.name}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sidebar-foreground font-medium">
                {relationship.coachee.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
              >
                {statusConfig.label}
              </span>
              <span className="text-muted-foreground">{typeLabel}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{relationship.meetingFrequency}</span>
            </div>
          </div>
        </div>

        {/* Right: Stats and actions */}
        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-sidebar-foreground font-medium">
                {relationship.totalSessions}
              </div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>

            <div className="text-center">
              <div className="text-sidebar-foreground font-medium">
                {formatDate(relationship.startDate)}
              </div>
              <div className="text-xs text-muted-foreground">Started</div>
            </div>

            {relationship.nextSession && (
              <div className="text-center">
                <div className="text-sidebar-foreground font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-accent" />
                  {formatDate(relationship.nextSession)}
                </div>
                <div className="text-xs text-muted-foreground">Next Session</div>
              </div>
            )}
          </div>

          {/* Schedule button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScheduleSession?.(relationship.id);
            }}
            className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Schedule
          </button>

          <ArrowRight className="w-5 h-5 text-accent" />
        </div>
      </div>
    </Card>
  );
}
