"use client";

import { useState } from "react";
import { ClipboardList, Loader2, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentTenant } from "@/stores/auth-store";
import { useCreateAssessment, useTenantMembers } from "@/hooks/api";

interface NewAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const assessmentTypes = [
  { value: "360", label: "360 Assessment", description: "Self, Manager, Peers, Direct Reports" },
  { value: "180", label: "180 Assessment", description: "Self + Manager only" },
  { value: "self", label: "Self Assessment", description: "Self-evaluation only" },
] as const;

export function NewAssessmentModal({
  open,
  onOpenChange,
}: NewAssessmentModalProps) {
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"180" | "360" | "self">("360");
  const [subjectId, setSubjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [anonymize, setAnonymize] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");

  // Fetch members
  const { data: members, isLoading: membersLoading } = useTenantMembers(
    tenantId,
    { perPage: 100 }
  );

  // Mutation
  const createMutation = useCreateAssessment();

  // Filter members
  const filteredMembers = members?.items.filter((member) => {
    const name = `${member.user.firstName || ""} ${member.user.lastName || ""} ${member.user.email}`.toLowerCase();
    return name.includes(memberSearch.toLowerCase());
  }) || [];

  // Selected member
  const selectedMember = members?.items.find((m) => m.user.id === subjectId);

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setType("360");
    setSubjectId("");
    setStartDate("");
    setEndDate("");
    setAnonymize(true);
    setMemberSearch("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!tenantId || !subjectId || !name) return;

    try {
      await createMutation.mutateAsync({
        tenantId,
        data: {
          name,
          description: description || undefined,
          type,
          subjectId,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          anonymizeResponses: anonymize,
        },
      });
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to create assessment:", error);
    }
  };

  const canSubmit = name && subjectId;

  // Auto-generate name when subject changes
  const handleSubjectChange = (userId: string) => {
    setSubjectId(userId);
    const member = members?.items.find((m) => m.user.id === userId);
    if (member && !name) {
      const subjectName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim();
      setName(`${subjectName} ${type === "360" ? "360" : type === "180" ? "180" : "Self"} Assessment`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-accent" />
            Create Assessment
          </DialogTitle>
          <DialogDescription>
            Create a new 180 or 360 assessment for a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Assessment Type */}
          <div className="space-y-2">
            <Label>Assessment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {assessmentTypes.map((at) => (
                <button
                  key={at.value}
                  type="button"
                  onClick={() => setType(at.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    type === at.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/30"
                  }`}
                >
                  <p className="font-medium text-sm">{at.label}</p>
                  <p className="text-xs text-muted-foreground">{at.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Person Being Assessed <span className="text-destructive">*</span>
            </Label>
            {selectedMember ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="font-medium">
                    {selectedMember.user.firstName} {selectedMember.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedMember.user.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSubjectId("")}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {membersLoading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No members found
                    </div>
                  ) : (
                    filteredMembers.slice(0, 10).map((member) => (
                      <button
                        key={member.user.id}
                        type="button"
                        onClick={() => handleSubjectChange(member.user.id)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                      >
                        <p className="font-medium text-sm">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Assessment Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Assessment Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., John Smith Q1 360 Assessment"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description or context for this assessment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          {/* Anonymize Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="anonymize"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="anonymize" className="text-sm font-normal cursor-pointer">
              Anonymize responses (recommended for honest feedback)
            </Label>
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
                Creating...
              </>
            ) : (
              "Create Assessment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
