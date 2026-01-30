"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useCurrentTenant } from "@/stores/auth-store";
import {
  useEnrollUser,
  useProgramMentors,
  useProgramLearners,
  useTenantMembers,
  type MentorOption,
  type LearnerOption,
} from "@/hooks/api";

interface AddParticipantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
}

type Role = "learner" | "mentor" | "facilitator";

const roleLabels: Record<Role, { label: string; description: string }> = {
  learner: {
    label: "Learner",
    description: "Enrolled participant who completes the program content",
  },
  mentor: {
    label: "Mentor",
    description: "Guides and supports learners through the program",
  },
  facilitator: {
    label: "Facilitator",
    description: "Administers and leads the program",
  },
};

export function AddParticipantModal({
  open,
  onOpenChange,
  programId,
}: AddParticipantModalProps) {
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  // Tab state
  const [mode, setMode] = useState<"new" | "existing">("new");

  // New user form
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Existing user selection
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Role and assignments
  const [role, setRole] = useState<Role>("learner");
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);

  // Queries
  const { data: mentors = [] } = useProgramMentors(tenantId, programId);
  const { data: learners = [] } = useProgramLearners(tenantId, programId);
  const { data: membersData } = useTenantMembers(tenantId, { perPage: 100 });
  const members = membersData?.items || [];

  // Mutation
  const enrollMutation = useEnrollUser();

  // Reset selections when role changes
  useEffect(() => {
    setSelectedMentorIds([]);
    setSelectedLearnerIds([]);
  }, [role]);

  // Reset form when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMode("new");
      setEmail("");
      setFirstName("");
      setLastName("");
      setOrganization("");
      setTitle("");
      setPhone("");
      setNotes("");
      setSelectedUserId("");
      setRole("learner");
      setSelectedMentorIds([]);
      setSelectedLearnerIds([]);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!tenantId) return;

    try {
      if (mode === "new") {
        await enrollMutation.mutateAsync({
          tenantId,
          programId,
          data: {
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            organization: organization || undefined,
            title: title || undefined,
            phone: phone || undefined,
            notes: notes || undefined,
            role,
            mentorEnrollmentIds: role === "learner" ? selectedMentorIds : undefined,
            learnerEnrollmentIds: role === "mentor" ? selectedLearnerIds : undefined,
          },
        });
      } else {
        await enrollMutation.mutateAsync({
          tenantId,
          programId,
          data: {
            userId: selectedUserId,
            role,
            mentorEnrollmentIds: role === "learner" ? selectedMentorIds : undefined,
            learnerEnrollmentIds: role === "mentor" ? selectedLearnerIds : undefined,
          },
        });
      }
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to enroll user:", error);
    }
  };

  const canSubmit =
    (mode === "new" && email.trim()) || (mode === "existing" && selectedUserId);

  const mentorOptions = mentors.map((m: MentorOption) => ({
    value: m.enrollmentId,
    label: [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email,
    description: m.email,
  }));

  const learnerOptions = learners.map((l: LearnerOption) => ({
    value: l.enrollmentId,
    label: [l.firstName, l.lastName].filter(Boolean).join(" ") || l.email,
    description: l.email,
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            Add Participant
          </DialogTitle>
          <DialogDescription>
            Add a new participant to this program. You can create a new user or
            select an existing team member.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "new" | "existing")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">New User</TabsTrigger>
            <TabsTrigger value="existing">Existing Member</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 mt-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                placeholder="Acme Corp"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Senior Manager"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this participant..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Team Member</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team member..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {[member.firstName, member.lastName].filter(Boolean).join(" ") ||
                        member.email}
                      <span className="text-muted-foreground ml-2">
                        ({member.email})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {/* Role Selection */}
        <div className="space-y-2 pt-4 border-t">
          <Label>
            Role <span className="text-destructive">*</span>
          </Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([key, { label, description }]) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mentor Assignment (for Learners) */}
        {role === "learner" && mentors.length > 0 && (
          <div className="space-y-2">
            <Label>Assign Mentor(s)</Label>
            <MultiSelect
              options={mentorOptions}
              selected={selectedMentorIds}
              onChange={setSelectedMentorIds}
              placeholder="Select mentors..."
              searchPlaceholder="Search mentors..."
              emptyMessage="No mentors available"
            />
          </div>
        )}

        {/* Learner Assignment (for Mentors) */}
        {role === "mentor" && learners.length > 0 && (
          <div className="space-y-2">
            <Label>Assign Learner(s)</Label>
            <MultiSelect
              options={learnerOptions}
              selected={selectedLearnerIds}
              onChange={setSelectedLearnerIds}
              placeholder="Select learners..."
              searchPlaceholder="Search learners..."
              emptyMessage="No learners available"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || enrollMutation.isPending}
          >
            {enrollMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Participant"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
