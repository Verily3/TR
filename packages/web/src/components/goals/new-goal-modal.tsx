"use client";

import { useState } from "react";
import { Target, Loader2 } from "lucide-react";
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
import { useCreateGoal } from "@/hooks/api";
import { useCurrentTenant } from "@/stores/auth-store";

interface NewGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const goalTypes = [
  { value: "performance", label: "Performance", description: "Track performance metrics" },
  { value: "development", label: "Development", description: "Personal or team development" },
  { value: "project", label: "Project", description: "Project-based objectives" },
  { value: "okr", label: "OKR", description: "Objectives and Key Results" },
];

export function NewGoalModal({ open, onOpenChange }: NewGoalModalProps) {
  const currentTenant = useCurrentTenant();
  const createGoal = useCreateGoal();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"performance" | "development" | "project" | "okr">("performance");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTenant?.id) return;

    try {
      await createGoal.mutateAsync({
        tenantId: currentTenant.id,
        data: {
          title,
          description: description || undefined,
          type,
          targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        },
      });

      // Reset form and close
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("performance");
    setTargetDate("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Create New Goal
          </DialogTitle>
          <DialogDescription>
            Define a new goal to track your progress and measure success.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Improve team communication"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you want to achieve..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Goal Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <span className="font-medium">{t.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        - {t.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title || createGoal.isPending}>
              {createGoal.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Goal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
