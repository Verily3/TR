"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Calendar,
  CheckSquare,
  Loader2,
  Clock,
  Video,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentTenant } from "@/stores/auth-store";
import {
  useCoachingSessions,
  useCoachingRelationships,
  useActionItems,
  useCoachingStats,
  type CoachingSession,
  type CoachingRelationship,
  type ActionItem,
} from "@/hooks/api";
import { NewSessionModal } from "@/components/coaching/new-session-modal";

const sessionTypeLabels: Record<CoachingSession["type"], string> = {
  coaching: "Coaching",
  one_on_one: "1:1",
  check_in: "Check-in",
  review: "Review",
  planning: "Planning",
};

const sessionStatusConfig: Record<
  CoachingSession["status"],
  { label: string; color: string; bgColor: string }
> = {
  scheduled: { label: "Scheduled", color: "text-blue-700", bgColor: "bg-blue-100" },
  prep_in_progress: { label: "Prep Started", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  ready: { label: "Ready", color: "text-green-700", bgColor: "bg-green-100" },
  completed: { label: "Completed", color: "text-gray-700", bgColor: "bg-gray-100" },
  cancelled: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-100" },
  no_show: { label: "No Show", color: "text-red-700", bgColor: "bg-red-100" },
};

export default function CoachingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sessions");
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);

  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  const { data: stats, isLoading: statsLoading } = useCoachingStats(tenantId);
  const { data: upcomingSessions, isLoading: sessionsLoading } = useCoachingSessions(
    tenantId,
    { status: "upcoming", perPage: 10 }
  );
  const { data: relationships, isLoading: relationshipsLoading } = useCoachingRelationships(
    tenantId,
    { perPage: 20 }
  );
  const { data: actionItems, isLoading: actionsLoading } = useActionItems(
    tenantId,
    { status: "pending", perPage: 5 }
  );

  const isLoading = statsLoading;

  const statCards = [
    {
      label: "Upcoming Sessions",
      value: stats?.upcomingSessions || 0,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Active Relationships",
      value: stats?.activeRelationships || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Pending Actions",
      value: stats?.pendingActionItems || 0,
      icon: CheckSquare,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Completed This Month",
      value: stats?.completedThisMonth || 0,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  // Split relationships into my coaches and my coachees
  const myCoaches = relationships?.items.filter((r) => !r.isCoach && r.isActive) || [];
  const myCoachees = relationships?.items.filter((r) => r.isCoach && r.isActive) || [];

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Coaching</h1>
          <p className="text-muted-foreground">
            Manage your coaching sessions, relationships, and action items
          </p>
        </div>
        <Button onClick={() => setIsNewSessionOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* New Session Modal */}
      <NewSessionModal
        open={isNewSessionOpen}
        onOpenChange={setIsNewSessionOpen}
        relationships={relationships?.items || []}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="hover:border-accent/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="sessions">My Sessions</TabsTrigger>
          <TabsTrigger value="coachees">My Coachees ({myCoachees.length})</TabsTrigger>
          <TabsTrigger value="coaches">My Coaches ({myCoaches.length})</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Upcoming Sessions */}
            <Card className="md:col-span-2 hover:border-accent/30 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>
                  {upcomingSessions?.meta.total || 0} sessions scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : upcomingSessions?.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No upcoming sessions</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setIsNewSessionOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions?.items.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        onClick={() => router.push(`/coaching/sessions/${session.id}`)}
                      />
                    ))}
                    {(upcomingSessions?.meta.total || 0) > 10 && (
                      <Button
                        variant="ghost"
                        className="w-full text-accent"
                        onClick={() => {}}
                      >
                        View all sessions
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="hover:border-accent/30 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-accent" />
                  Action Items
                </CardTitle>
                <CardDescription>
                  {actionItems?.meta.total || 0} pending
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : actionItems?.items.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      No pending action items
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionItems?.items.map((item) => (
                      <ActionItemRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Coachees Tab */}
        <TabsContent value="coachees">
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                My Coachees
              </CardTitle>
              <CardDescription>
                People you are coaching or mentoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relationshipsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myCoachees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No coachees yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCoachees.map((rel) => (
                    <RelationshipRow
                      key={rel.id}
                      relationship={rel}
                      person={rel.coachee}
                      role="Coachee"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coaches Tab */}
        <TabsContent value="coaches">
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                My Coaches
              </CardTitle>
              <CardDescription>
                People who are coaching or mentoring you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relationshipsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myCoaches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No coaches assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCoaches.map((rel) => (
                    <RelationshipRow
                      key={rel.id}
                      relationship={rel}
                      person={rel.coach}
                      role="Coach"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionRow({
  session,
  onClick,
}: {
  session: CoachingSession;
  onClick: () => void;
}) {
  const status = sessionStatusConfig[session.status];
  const otherPerson = session.isCoach ? session.coachee : session.coach;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateLabel = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (date.toDateString() === today.toDateString()) {
      dateLabel = "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateLabel = "Tomorrow";
    }

    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${dateLabel} at ${timeLabel}`;
  };

  const getInitials = () => {
    const first = otherPerson.firstName?.[0] || "";
    const last = otherPerson.lastName?.[0] || "";
    return (first + last).toUpperCase() || otherPerson.email[0].toUpperCase();
  };

  const getName = () => {
    const name = [otherPerson.firstName, otherPerson.lastName]
      .filter(Boolean)
      .join(" ");
    return name || otherPerson.email;
  };

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border hover:border-accent/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={otherPerson.avatarUrl || undefined} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">
            {session.title || `Session with ${getName()}`}
          </h4>
          {session.prepStatus === "ready" && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
              Prep Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDateTime(session.scheduledAt)}</span>
          <span>·</span>
          <span>{session.durationMinutes} min</span>
          <span>·</span>
          <span>{sessionTypeLabels[session.type]}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {session.meetingUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(session.meetingUrl!, "_blank");
            }}
          >
            <Video className="h-4 w-4 mr-1" />
            Join
          </Button>
        )}
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const priorityColors = {
    low: "text-gray-500",
    medium: "text-yellow-600",
    high: "text-red-600",
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return { text: "Overdue", color: "text-red-600" };
    if (diffDays === 0) return { text: "Due today", color: "text-yellow-600" };
    if (diffDays === 1) return { text: "Due tomorrow", color: "text-yellow-600" };
    return {
      text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      color: "text-muted-foreground",
    };
  };

  const dueInfo = formatDueDate(item.dueDate);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:border-accent/30 transition-all">
      <div
        className={`mt-0.5 h-4 w-4 rounded border-2 ${
          item.status === "completed"
            ? "bg-green-500 border-green-500"
            : "border-gray-300"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            item.status === "completed" ? "line-through text-muted-foreground" : ""
          }`}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs font-medium ${priorityColors[item.priority]}`}
          >
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </span>
          {dueInfo && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className={`text-xs ${dueInfo.color}`}>{dueInfo.text}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RelationshipRow({
  relationship,
  person,
  role,
}: {
  relationship: CoachingRelationship;
  person: CoachingRelationship["coach"];
  role: string;
}) {
  const getInitials = () => {
    const first = person.firstName?.[0] || "";
    const last = person.lastName?.[0] || "";
    return (first + last).toUpperCase() || person.email[0].toUpperCase();
  };

  const getName = () => {
    const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
    return name || person.email;
  };

  const relationshipTypeLabels = {
    mentor: "Mentor",
    coach: "Coach",
    manager: "Manager",
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-accent/30 transition-all">
      <Avatar className="h-10 w-10">
        <AvatarImage src={person.avatarUrl || undefined} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{getName()}</h4>
        <p className="text-sm text-muted-foreground">{person.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          {relationshipTypeLabels[relationship.relationshipType]}
        </span>
        {relationship.meetingFrequency && (
          <span className="text-xs text-muted-foreground">
            {relationship.meetingFrequency}
          </span>
        )}
      </div>
    </div>
  );
}
