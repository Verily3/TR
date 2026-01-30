"use client";

import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentTenant } from "@/stores/auth-store";
import { useCreateSession, type CoachingRelationship } from "@/hooks/api";

interface NewSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationships: CoachingRelationship[];
}

const sessionTypes = [
  { value: "coaching", label: "Coaching Session" },
  { value: "one_on_one", label: "1:1 Meeting" },
  { value: "check_in", label: "Check-in" },
  { value: "review", label: "Review" },
  { value: "planning", label: "Planning" },
] as const;

const durations = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export function NewSessionModal({
  open,
  onOpenChange,
  relationships,
}: NewSessionModalProps) {
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  // Form state
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof sessionTypes)[number]["value"]>("coaching");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState("");

  // Mutation
  const createMutation = useCreateSession();

  // Get selected relationship
  const selectedRelationship = relationships.find(
    (r) => r.id === selectedRelationshipId
  );

  // Reset form
  const resetForm = () => {
    setSelectedRelationshipId("");
    setTitle("");
    setType("coaching");
    setDate("");
    setTime("");
    setDuration(60);
    setMeetingUrl("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!tenantId || !selectedRelationship || !date || !time) return;

    const scheduledAt = new Date(`${date}T${time}`).toISOString();

    try {
      await createMutation.mutateAsync({
        tenantId,
        data: {
          relationshipId: selectedRelationshipId,
          coachId: selectedRelationship.coach.id,
          coacheeId: selectedRelationship.coachee.id,
          title: title || undefined,
          type,
          scheduledAt,
          durationMinutes: duration,
          meetingUrl: meetingUrl || undefined,
        },
      });
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const getPersonName = (person: CoachingRelationship["coach"]) => {
    const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
    return name || person.email;
  };

  const canSubmit = selectedRelationshipId && date && time;

  // Get default date (tomorrow)
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Schedule Session
          </DialogTitle>
          <DialogDescription>
            Schedule a new coaching or 1:1 session with your coach or coachee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Person Selection */}
          <div className="space-y-2">
            <Label htmlFor="relationship">
              Meeting With <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedRelationshipId}
              onValueChange={setSelectedRelationshipId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person..." />
              </SelectTrigger>
              <SelectContent>
                {relationships.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No coaching relationships found
                  </div>
                ) : (
                  relationships.map((rel) => {
                    const otherPerson = rel.isCoach ? rel.coachee : rel.coach;
                    const roleLabel = rel.isCoach ? "Coachee" : "Coach";
                    return (
                      <SelectItem key={rel.id} value={rel.id}>
                        {getPersonName(otherPerson)} ({roleLabel})
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              placeholder="e.g., Weekly Check-in"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Session Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((st) => (
                  <SelectItem key={st.value} value={st.value}>
                    {st.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting URL */}
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting Link</Label>
            <Input
              id="meetingUrl"
              type="url"
              placeholder="https://zoom.us/j/..."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Add a Zoom, Teams, or Google Meet link
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
