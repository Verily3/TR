"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Loader2,
  MessageSquare,
  Plus,
  CheckSquare,
  Video,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentTenant, useUser } from "@/stores/auth-store";
import {
  useCoachingSession,
  useUpdateSession,
  useAddSessionNote,
  useCreateActionItem,
  useUpdateActionItem,
  type SessionDetails,
  type SessionNote,
  type ActionItem,
} from "@/hooks/api";

const sessionTypeLabels: Record<SessionDetails["type"], string> = {
  coaching: "Coaching Session",
  one_on_one: "1:1 Meeting",
  check_in: "Check-in",
  review: "Review",
  planning: "Planning",
};

const sessionStatusConfig: Record<
  SessionDetails["status"],
  { label: string; color: string; bgColor: string }
> = {
  scheduled: { label: "Scheduled", color: "text-blue-700", bgColor: "bg-blue-100" },
  prep_in_progress: { label: "Prep In Progress", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  ready: { label: "Ready", color: "text-green-700", bgColor: "bg-green-100" },
  completed: { label: "Completed", color: "text-gray-700", bgColor: "bg-gray-100" },
  cancelled: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-100" },
  no_show: { label: "No Show", color: "text-red-700", bgColor: "bg-red-100" },
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const currentTenant = useCurrentTenant();
  const currentUser = useUser();
  const tenantId = currentTenant?.id || null;

  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);

  const { data: session, isLoading, error } = useCoachingSession(tenantId, sessionId);
  const updateSessionMutation = useUpdateSession();
  const addNoteMutation = useAddSessionNote();
  const createActionMutation = useCreateActionItem();
  const updateActionMutation = useUpdateActionItem();

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Session not found</h3>
            <p className="text-muted-foreground mb-4">
              The session you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => router.push("/coaching")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coaching
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = sessionStatusConfig[session.status];
  const otherPerson = session.isCoach ? session.coachee : session.coach;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  };

  const { date, time } = formatDateTime(session.scheduledAt);

  const getPersonName = (person: typeof session.coach) => {
    const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
    return name || person.email;
  };

  const getInitials = (person: typeof session.coach) => {
    const first = person.firstName?.[0] || "";
    const last = person.lastName?.[0] || "";
    return (first + last).toUpperCase() || person.email[0].toUpperCase();
  };

  const handleMarkComplete = async () => {
    if (!tenantId) return;
    await updateSessionMutation.mutateAsync({
      tenantId,
      sessionId,
      data: { status: "completed" },
    });
  };

  const handleCancelSession = async () => {
    if (!tenantId) return;
    await updateSessionMutation.mutateAsync({
      tenantId,
      sessionId,
      data: { status: "cancelled" },
    });
  };

  const toggleActionStatus = async (actionItem: ActionItem) => {
    if (!tenantId) return;
    const newStatus = actionItem.status === "completed" ? "pending" : "completed";
    await updateActionMutation.mutateAsync({
      tenantId,
      actionItemId: actionItem.id,
      data: { status: newStatus },
    });
  };

  // Get current user's prep (if any)
  const myPrep = session.prep.find((p) => p.userId === currentUser?.id);

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/coaching")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Coaching
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={otherPerson.avatarUrl || undefined} />
            <AvatarFallback className="text-lg">
              {getInitials(otherPerson)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {session.title || `Session with ${getPersonName(otherPerson)}`}
              </h1>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${status.bgColor} ${status.color}`}
              >
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {time} ({session.durationMinutes} min)
              </span>
              <span>·</span>
              <span>{sessionTypeLabels[session.type]}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.meetingUrl && session.status === "scheduled" && (
            <Button
              variant="outline"
              onClick={() => window.open(session.meetingUrl!, "_blank")}
            >
              <Video className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
          )}
          {session.status === "scheduled" && (
            <>
              <Button
                variant="outline"
                onClick={handleMarkComplete}
                disabled={updateSessionMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelSession}
                disabled={updateSessionMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Session Prep */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Session Prep
                </CardTitle>
                {myPrep?.isComplete && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Complete
                  </span>
                )}
              </div>
              <CardDescription>
                Prepare for your session by reflecting on progress and topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myPrep ? (
                <div className="space-y-4">
                  {myPrep.progressSummary && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Progress Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {myPrep.progressSummary}
                      </p>
                    </div>
                  )}

                  {myPrep.wins && myPrep.wins.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Wins</h4>
                      <div className="flex flex-wrap gap-2">
                        {myPrep.wins.map((win, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                          >
                            {win}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {myPrep.challenges && myPrep.challenges.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Challenges</h4>
                      <div className="flex flex-wrap gap-2">
                        {myPrep.challenges.map((challenge, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full"
                          >
                            {challenge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {myPrep.topicsToDiscuss && myPrep.topicsToDiscuss.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Topics to Discuss</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {myPrep.topicsToDiscuss.map((topic, i) => (
                          <li key={i}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No prep completed yet
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Start Prep
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  Notes
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddNote(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
              <CardDescription>
                {session.notes.length} notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session.notes.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {session.notes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-accent" />
                  Action Items
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAction(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Action
                </Button>
              </div>
              <CardDescription>
                {session.actionItems.length} action items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session.actionItems.length === 0 ? (
                <div className="text-center py-6">
                  <CheckSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No action items yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {session.actionItems.map((item) => (
                    <ActionItemCard
                      key={item.id}
                      item={item}
                      onToggle={() => toggleActionStatus(item)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.coach.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(session.coach)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {getPersonName(session.coach)}
                  </p>
                  <p className="text-xs text-muted-foreground">Coach</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.coachee.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(session.coachee)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {getPersonName(session.coachee)}
                  </p>
                  <p className="text-xs text-muted-foreground">Coachee</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Details */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-accent" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{session.durationMinutes} minutes</p>
              </div>
              {session.meetingProvider && (
                <div>
                  <p className="text-sm text-muted-foreground">Platform</p>
                  <p className="font-medium capitalize">
                    {session.meetingProvider}
                  </p>
                </div>
              )}
              {session.meetingUrl && (
                <Button
                  className="w-full mt-2"
                  onClick={() => window.open(session.meetingUrl!, "_blank")}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Note Modal */}
      <AddNoteModal
        open={showAddNote}
        onOpenChange={setShowAddNote}
        tenantId={tenantId}
        sessionId={sessionId}
        onSubmit={async (content, isPrivate) => {
          if (!tenantId) return;
          await addNoteMutation.mutateAsync({
            tenantId,
            sessionId,
            data: { content, isPrivate },
          });
          setShowAddNote(false);
        }}
        isPending={addNoteMutation.isPending}
      />

      {/* Add Action Modal */}
      <AddActionModal
        open={showAddAction}
        onOpenChange={setShowAddAction}
        tenantId={tenantId}
        sessionId={sessionId}
        coach={session.coach}
        coachee={session.coachee}
        onSubmit={async (data) => {
          if (!tenantId) return;
          await createActionMutation.mutateAsync({
            tenantId,
            data: {
              sessionId,
              ...data,
            },
          });
          setShowAddAction(false);
        }}
        isPending={createActionMutation.isPending}
      />
    </div>
  );
}

function NoteCard({ note }: { note: SessionNote }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getInitials = () => {
    const first = note.author.firstName?.[0] || "";
    const last = note.author.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getName = () => {
    const name = [note.author.firstName, note.author.lastName]
      .filter(Boolean)
      .join(" ");
    return name || "Unknown";
  };

  return (
    <div className="p-4 rounded-lg border">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={note.author.avatarUrl || undefined} />
          <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium">{getName()}</p>
            <span className="text-xs text-muted-foreground">
              {formatDate(note.createdAt)}
            </span>
            {note.isPrivate && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                Private
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {note.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionItemCard({
  item,
  onToggle,
}: {
  item: ActionItem;
  onToggle: () => void;
}) {
  const priorityColors = {
    low: "text-gray-500",
    medium: "text-yellow-600",
    high: "text-red-600",
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = () => {
    const first = item.owner.firstName?.[0] || "";
    const last = item.owner.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:border-accent/30 transition-all">
      <button
        className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
          item.status === "completed"
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-accent"
        }`}
        onClick={onToggle}
      >
        {item.status === "completed" && (
          <CheckCircle2 className="h-3 w-3" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            item.status === "completed" ? "line-through text-muted-foreground" : ""
          }`}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={item.owner.avatarUrl || undefined} />
            <AvatarFallback className="text-[10px]">{getInitials()}</AvatarFallback>
          </Avatar>
          <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </span>
          {item.dueDate && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                Due {formatDueDate(item.dueDate)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddNoteModal({
  open,
  onOpenChange,
  tenantId,
  sessionId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
  sessionId: string;
  onSubmit: (content: string, isPrivate: boolean) => Promise<void>;
  isPending: boolean;
}) {
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit(content, isPrivate);
    setContent("");
    setIsPrivate(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note to this session. Private notes are only visible to you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">Note</Label>
            <Textarea
              id="note-content"
              placeholder="Write your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="note-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="note-private" className="text-sm font-normal">
              Make this note private (only visible to you)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddActionModal({
  open,
  onOpenChange,
  tenantId,
  sessionId,
  coach,
  coachee,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
  sessionId: string;
  coach: SessionDetails["coach"];
  coachee: SessionDetails["coachee"];
  onSubmit: (data: {
    ownerId: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(coachee.id);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleSubmit = async () => {
    if (!title.trim() || !ownerId) return;
    await onSubmit({
      ownerId,
      title,
      description: description || undefined,
      dueDate: dueDate || undefined,
      priority,
    });
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
  };

  const getPersonName = (person: typeof coach) => {
    const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
    return name || person.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Action Item</DialogTitle>
          <DialogDescription>
            Create a follow-up action item from this session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="action-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-description">Description</Label>
            <Textarea
              id="action-description"
              placeholder="Additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-owner">Assigned To</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={coachee.id}>
                  {getPersonName(coachee)} (Coachee)
                </SelectItem>
                <SelectItem value={coach.id}>
                  {getPersonName(coach)} (Coach)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-due">Due Date</Label>
              <Input
                id="action-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as typeof priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !ownerId || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add Action"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
