"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { useCreateTemplate } from "@/hooks/api";

interface CreateTemplateModalProps {
  agencyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const assessmentTypes = [
  { value: "360", label: "360 Assessment", description: "Self + Manager + Peers + Direct Reports" },
  { value: "180", label: "180 Assessment", description: "Self + Manager only" },
  { value: "self", label: "Self Assessment", description: "Self-evaluation only" },
  { value: "custom", label: "Custom", description: "Custom rater configuration" },
];

export function CreateTemplateModal({
  agencyId,
  open,
  onOpenChange,
}: CreateTemplateModalProps) {
  const router = useRouter();
  const createMutation = useCreateTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"180" | "360" | "self" | "custom">("360");

  const handleCreate = async () => {
    const result = await createMutation.mutateAsync({
      agencyId,
      data: {
        name,
        description: description || undefined,
        type,
        competencies: [],
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      },
    });

    // Reset form
    setName("");
    setDescription("");
    setType("360");
    onOpenChange(false);

    // Navigate to edit page
    router.push(`/agency/assessments/${result.id}`);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setType("360");
    onOpenChange(false);
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Assessment Framework</DialogTitle>
          <DialogDescription>
            Create a new assessment template. You can add competencies and questions after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Leadership 360"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Assessment Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assessmentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex flex-col">
                      <span>{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this assessment measures..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Create & Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
