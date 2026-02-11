"use client";

import { useState } from "react";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Card } from "../ui";
import { SessionCard } from "./SessionCard";
import { RelationshipCard } from "./RelationshipCard";
import { NewSessionModal } from "./NewSessionModal";
import type { CoachingPageProps } from "./types";
import {
  defaultCoachingStats,
  defaultRelationships,
  defaultSessions,
} from "./data";

type CoachingTab = "sessions" | "relationships";

export function CoachingPage({
  stats = defaultCoachingStats,
  relationships = defaultRelationships,
  sessions = defaultSessions,
  onViewSession,
}: CoachingPageProps) {
  const [activeTab, setActiveTab] = useState<CoachingTab>("sessions");
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // Filter sessions
  const upcomingSessions = sessions.filter(
    (s) => s.status !== "completed" && s.status !== "cancelled" && s.status !== "no_show"
  );
  const pastSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled" || s.status === "no_show"
  );

  return (
    <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1 sm:mb-2">
            Coaching
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your coaching relationships, sessions, and development conversations
          </p>
        </div>
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Session
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.activeRelationships}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Active Relationships</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.upcomingSessions}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Upcoming Sessions</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.completedSessions}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Completed Sessions</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.pendingActionItems}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Pending Actions</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.overdueActionItems}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Overdue Actions</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.totalRelationships}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total Relationships</div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 p-1 bg-muted rounded-lg w-full sm:w-fit mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm transition-colors ${
            activeTab === "sessions"
              ? "bg-accent text-accent-foreground"
              : "text-sidebar-foreground hover:bg-background"
          }`}
        >
          Sessions
        </button>
        <button
          onClick={() => setActiveTab("relationships")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm transition-colors ${
            activeTab === "relationships"
              ? "bg-accent text-accent-foreground"
              : "text-sidebar-foreground hover:bg-background"
          }`}
        >
          Relationships
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <div>
            <h3 className="text-sidebar-foreground mb-4">
              Upcoming Sessions ({upcomingSessions.length})
            </h3>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} onViewSession={onViewSession} />
                ))}
              </div>
            ) : (
              <Card padding="lg">
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming sessions</p>
                  <button
                    onClick={() => setShowNewSessionModal(true)}
                    className="mt-4 text-sm text-accent hover:text-accent/80"
                  >
                    Schedule a session
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-sidebar-foreground mb-4">
                Past Sessions ({pastSessions.length})
              </h3>
              <div className="space-y-3">
                {pastSessions.map((session) => (
                  <SessionCard key={session.id} session={session} onViewSession={onViewSession} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "relationships" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sidebar-foreground">
              Your Coaching Relationships ({relationships.length})
            </h3>
            <button className="text-sm text-accent hover:text-accent/80">
              + Add Relationship
            </button>
          </div>
          {relationships.length > 0 ? (
            <div className="grid gap-4">
              {relationships.map((relationship) => (
                <RelationshipCard
                  key={relationship.id}
                  relationship={relationship}
                  onScheduleSession={() => setShowNewSessionModal(true)}
                />
              ))}
            </div>
          ) : (
            <Card padding="lg">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No coaching relationships</p>
                <button className="mt-4 text-sm text-accent hover:text-accent/80">
                  Add a relationship
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* New Session Modal */}
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        relationships={relationships}
      />
    </main>
  );
}
