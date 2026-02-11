"use client";

import {
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card } from "../ui";
import type { SessionCardProps } from "./types";
import { sessionTypeLabels, sessionStatusConfig } from "./data";

export function SessionCard({
  session,
  onViewSession,
  onStartPrep,
}: SessionCardProps) {
  const statusConfig = sessionStatusConfig[session.status];
  const typeLabel = sessionTypeLabels[session.type];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isPast = session.status === "completed" || session.status === "cancelled" || session.status === "no_show";
  const needsPrep = session.status === "scheduled" && !session.prep;
  const prepInProgress = session.status === "prep_in_progress";

  return (
    <Card
      padding="lg"
      className={`hover:border-accent/30 transition-colors cursor-pointer ${
        isPast ? "opacity-75" : ""
      }`}
      onClick={() => onViewSession?.(session.id)}
    >
      <div className="flex items-start justify-between">
        {/* Left: Session info */}
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className="flex flex-col items-center justify-center w-16 h-16 bg-accent/10 rounded-lg">
            <span className="text-xs text-accent uppercase">
              {new Date(session.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-xl font-semibold text-accent">
              {new Date(session.scheduledAt).getDate()}
            </span>
          </div>

          {/* Session details */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sidebar-foreground font-medium">{typeLabel}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
              >
                {statusConfig.label}
              </span>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">
                  {getInitials(session.coach.name)}
                </div>
                <span className="text-sm text-muted-foreground">{session.coach.name}</span>
              </div>
              <span className="text-muted-foreground">↔</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                  {getInitials(session.coachee.name)}
                </div>
                <span className="text-sm text-muted-foreground">{session.coachee.name}</span>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(session.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{session.duration} min</span>
              </div>
              {session.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{session.location}</span>
                </div>
              )}
              {session.videoLink && (
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  <span>Video call</span>
                </div>
              )}
            </div>

            {/* Agenda preview */}
            {session.agenda && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                {session.agenda}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions and indicators */}
        <div className="flex flex-col items-end gap-2">
          {/* Prep status */}
          {needsPrep && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartPrep?.(session.id);
              }}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200 transition-colors flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              Start Prep
            </button>
          )}

          {prepInProgress && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Prep in Progress
            </span>
          )}

          {session.status === "ready" && (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Ready
            </span>
          )}

          {/* Action items count */}
          {session.actionItems.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {session.actionItems.filter((a) => a.status !== "completed").length} pending actions
            </div>
          )}

          {/* Notes count for past sessions */}
          {isPast && session.notes.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {session.notes.length} notes
            </div>
          )}

          {/* View arrow */}
          <ArrowRight className="w-5 h-5 text-accent mt-2" />
        </div>
      </div>
    </Card>
  );
}
