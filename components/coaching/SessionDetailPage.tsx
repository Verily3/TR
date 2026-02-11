"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  MessageSquare,
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
  MoreVertical,
} from "lucide-react";
import { Card } from "../ui";
import type { SessionDetailPageProps, ActionItem } from "./types";
import {
  defaultSessions,
  sessionTypeLabels,
  sessionStatusConfig,
  priorityConfig,
  actionStatusConfig,
} from "./data";

type DetailTab = "prep" | "notes" | "actions";

export function SessionDetailPage({
  session = defaultSessions[0],
  onBack,
}: SessionDetailPageProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("prep");
  const [newNote, setNewNote] = useState("");
  const [isPrivateNote, setIsPrivateNote] = useState(false);

  const statusConfig = sessionStatusConfig[session.status];
  const typeLabel = sessionTypeLabels[session.type];

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
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

  const pendingActions = session.actionItems.filter((a) => a.status !== "completed");
  const completedActions = session.actionItems.filter((a) => a.status === "completed");

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Coaching
      </button>

      {/* Session Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-sidebar-foreground">
                {typeLabel}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}
              >
                {statusConfig.label}
              </span>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-medium">
                  {getInitials(session.coach.name)}
                </div>
                <div>
                  <div className="text-sm font-medium text-sidebar-foreground">
                    {session.coach.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{session.coach.role}</div>
                </div>
              </div>
              <span className="text-muted-foreground">↔</span>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                  {getInitials(session.coachee.name)}
                </div>
                <div>
                  <div className="text-sm font-medium text-sidebar-foreground">
                    {session.coachee.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{session.coachee.role}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {session.videoLink && (
              <a
                href={session.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Join Video Call
              </a>
            )}
            <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors">
              Reschedule
            </button>
          </div>
        </div>

        {/* Session Meta */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDateTime(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{session.duration} minutes</span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{session.location}</span>
            </div>
          )}
        </div>

        {/* Agenda */}
        {session.agenda && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground uppercase mb-1">Agenda</div>
            <p className="text-sm text-sidebar-foreground">{session.agenda}</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab("prep")}
          className={`px-4 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
            activeTab === "prep"
              ? "bg-accent text-accent-foreground"
              : "text-sidebar-foreground hover:bg-background"
          }`}
        >
          <FileText className="w-4 h-4" />
          Prep
          {session.prep && (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
            activeTab === "notes"
              ? "bg-accent text-accent-foreground"
              : "text-sidebar-foreground hover:bg-background"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Notes
          {session.notes.length > 0 && (
            <span className="text-xs bg-muted px-1.5 rounded">
              {session.notes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={`px-4 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
            activeTab === "actions"
              ? "bg-accent text-accent-foreground"
              : "text-sidebar-foreground hover:bg-background"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Actions
          {pendingActions.length > 0 && (
            <span className="text-xs bg-muted px-1.5 rounded">
              {pendingActions.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "prep" && (
        <div className="space-y-6">
          {session.prep ? (
            <>
              {/* Wins */}
              <Card padding="lg">
                <h3 className="text-sidebar-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Wins & Accomplishments
                </h3>
                <ul className="space-y-2">
                  {session.prep.wins.map((win, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-sidebar-foreground"
                    >
                      <span className="text-green-600 mt-1">•</span>
                      {win}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Challenges */}
              <Card padding="lg">
                <h3 className="text-sidebar-foreground mb-4 flex items-center gap-2">
                  <Circle className="w-5 h-5 text-yellow-600" />
                  Challenges & Blockers
                </h3>
                <ul className="space-y-2">
                  {session.prep.challenges.map((challenge, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-sidebar-foreground"
                    >
                      <span className="text-yellow-600 mt-1">•</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Topics to Discuss */}
              <Card padding="lg">
                <h3 className="text-sidebar-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Topics to Discuss
                </h3>
                <ul className="space-y-2">
                  {session.prep.topicsToDiscuss.map((topic, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-sidebar-foreground"
                    >
                      <span className="text-blue-600 mt-1">•</span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </Card>

              {session.prep.submittedAt && (
                <p className="text-xs text-muted-foreground">
                  Prep submitted on{" "}
                  {new Date(session.prep.submittedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </>
          ) : (
            <Card padding="lg">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sidebar-foreground mb-2">No Prep Submitted</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pre-session preparation helps make the most of your coaching time.
                </p>
                <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                  Start Prep
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-6">
          {/* Add Note Form */}
          <Card padding="lg">
            <h3 className="text-sidebar-foreground mb-4">Add Note</h3>
            <textarea
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your session notes here..."
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-3"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-sidebar-foreground">
                <input
                  type="checkbox"
                  checked={isPrivateNote}
                  onChange={(e) => setIsPrivateNote(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
                />
                Private note (only visible to you)
              </label>
              <button
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </Card>

          {/* Notes List */}
          {session.notes.length > 0 ? (
            <div className="space-y-4">
              {session.notes.map((note) => (
                <Card key={note.id} padding="lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">
                        {getInitials(note.authorName)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-sidebar-foreground">
                          {note.authorName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {note.isPrivate && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Private
                        </span>
                      )}
                      <button className="p-1 hover:bg-muted rounded">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-sidebar-foreground whitespace-pre-wrap">
                    {note.content}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="lg">
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No notes yet</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "actions" && (
        <div className="space-y-6">
          {/* Add Action Button */}
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Action Item
            </button>
          </div>

          {/* Pending Actions */}
          {pendingActions.length > 0 && (
            <div>
              <h3 className="text-sidebar-foreground mb-4">
                Pending ({pendingActions.length})
              </h3>
              <div className="space-y-3">
                {pendingActions.map((action) => (
                  <ActionItemCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <div>
              <h3 className="text-sidebar-foreground mb-4">
                Completed ({completedActions.length})
              </h3>
              <div className="space-y-3">
                {completedActions.map((action) => (
                  <ActionItemCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}

          {session.actionItems.length === 0 && (
            <Card padding="lg">
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No action items yet</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}

function ActionItemCard({ action }: { action: ActionItem }) {
  const priorityCfg = priorityConfig[action.priority];
  const statusCfg = actionStatusConfig[action.status];

  const isOverdue =
    action.status !== "completed" && new Date(action.dueDate) < new Date();

  return (
    <Card padding="lg" className={isOverdue ? "border-red-200" : ""}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              action.status === "completed"
                ? "bg-green-500 border-green-500 text-white"
                : "border-border hover:border-accent"
            }`}
          >
            {action.status === "completed" && (
              <CheckCircle2 className="w-3 h-3" />
            )}
          </button>
          <div>
            <div
              className={`font-medium ${
                action.status === "completed"
                  ? "text-muted-foreground line-through"
                  : "text-sidebar-foreground"
              }`}
            >
              {action.title}
            </div>
            {action.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {action.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className={`px-2 py-0.5 rounded ${priorityCfg.bg} ${priorityCfg.text}`}>
                {priorityCfg.label}
              </span>
              <span className={`px-2 py-0.5 rounded ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
              <span className="text-muted-foreground">
                Assigned to {action.ownerName}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-sm ${
              isOverdue ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            Due: {new Date(action.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
          {isOverdue && (
            <div className="text-xs text-red-600 mt-1">Overdue</div>
          )}
          {action.completedAt && (
            <div className="text-xs text-green-600 mt-1">
              Completed{" "}
              {new Date(action.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
