"use client";

import { useState } from "react";
import { Users, Loader2, Search, Plus, Trash2 } from "lucide-react";
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
import { useAddInvitations, useTenantMembers } from "@/hooks/api";

interface AddRatersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  assessmentType: string;
}

interface RaterToAdd {
  id: string;
  raterId?: string;
  raterEmail: string;
  raterName?: string;
  raterType: "self" | "manager" | "peer" | "direct_report" | "external";
}

const raterTypes = [
  { value: "self", label: "Self" },
  { value: "manager", label: "Manager" },
  { value: "peer", label: "Peer" },
  { value: "direct_report", label: "Direct Report" },
  { value: "external", label: "External" },
] as const;

export function AddRatersModal({
  open,
  onOpenChange,
  assessmentId,
  assessmentType,
}: AddRatersModalProps) {
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  // Form state
  const [ratersToAdd, setRatersToAdd] = useState<RaterToAdd[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedType, setSelectedType] = useState<RaterToAdd["raterType"]>("peer");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const [showExternalForm, setShowExternalForm] = useState(false);

  // Fetch members
  const { data: members, isLoading: membersLoading } = useTenantMembers(
    tenantId,
    { perPage: 100 }
  );

  // Mutation
  const addInvitations = useAddInvitations();

  // Filter members
  const filteredMembers = members?.items.filter((member) => {
    const name = `${member.user.firstName || ""} ${member.user.lastName || ""} ${member.user.email}`.toLowerCase();
    const matchesSearch = name.includes(memberSearch.toLowerCase());
    const notAlreadyAdded = !ratersToAdd.some((r) => r.raterId === member.user.id);
    return matchesSearch && notAlreadyAdded;
  }) || [];

  // Reset form
  const resetForm = () => {
    setRatersToAdd([]);
    setMemberSearch("");
    setSelectedType("peer");
    setExternalEmail("");
    setExternalName("");
    setShowExternalForm(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const addMemberAsRater = (memberId: string, email: string, name: string) => {
    const newRater: RaterToAdd = {
      id: crypto.randomUUID(),
      raterId: memberId,
      raterEmail: email,
      raterName: name,
      raterType: selectedType,
    };
    setRatersToAdd([...ratersToAdd, newRater]);
    setMemberSearch("");
  };

  const addExternalRater = () => {
    if (!externalEmail) return;
    const newRater: RaterToAdd = {
      id: crypto.randomUUID(),
      raterEmail: externalEmail,
      raterName: externalName || undefined,
      raterType: "external",
    };
    setRatersToAdd([...ratersToAdd, newRater]);
    setExternalEmail("");
    setExternalName("");
    setShowExternalForm(false);
  };

  const removeRater = (id: string) => {
    setRatersToAdd(ratersToAdd.filter((r) => r.id !== id));
  };

  const handleSubmit = async () => {
    if (!tenantId || ratersToAdd.length === 0) return;

    try {
      await addInvitations.mutateAsync({
        tenantId,
        assessmentId,
        data: {
          raters: ratersToAdd.map((r) => ({
            raterId: r.raterId,
            raterEmail: r.raterEmail,
            raterName: r.raterName,
            raterType: r.raterType,
          })),
        },
      });
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to add raters:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Add Raters
          </DialogTitle>
          <DialogDescription>
            Add people to provide feedback for this {assessmentType} assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rater Type Selection */}
          <div className="space-y-2">
            <Label>Rater Type</Label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {raterTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Member Search */}
          {selectedType !== "external" && (
            <div className="space-y-2">
              <Label>Search Members</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {memberSearch && (
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
                    filteredMembers.slice(0, 8).map((member) => (
                      <button
                        key={member.user.id}
                        type="button"
                        onClick={() =>
                          addMemberAsRater(
                            member.user.id,
                            member.user.email,
                            `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim()
                          )
                        }
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
              )}
            </div>
          )}

          {/* External Rater Form */}
          {(selectedType === "external" || showExternalForm) && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label>External Rater</Label>
              <Input
                placeholder="Email address"
                type="email"
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
              />
              <Input
                placeholder="Name (optional)"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
              />
              <Button size="sm" onClick={addExternalRater} disabled={!externalEmail}>
                <Plus className="h-4 w-4 mr-1" />
                Add External Rater
              </Button>
            </div>
          )}

          {selectedType !== "external" && !showExternalForm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExternalForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add External Rater
            </Button>
          )}

          {/* Raters to Add */}
          {ratersToAdd.length > 0 && (
            <div className="space-y-2">
              <Label>Raters to Add ({ratersToAdd.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {ratersToAdd.map((rater) => (
                  <div
                    key={rater.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {rater.raterName || rater.raterEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rater.raterType} · {rater.raterEmail}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRater(rater.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={ratersToAdd.length === 0 || addInvitations.isPending}
          >
            {addInvitations.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${ratersToAdd.length} Rater${ratersToAdd.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
