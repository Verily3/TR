"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Target,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  User,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentTenant } from "@/stores/auth-store";
import {
  useGoal,
  useAddMilestone,
  useCompleteMilestone,
  useAddGoalUpdate,
  type GoalDetails,
  type GoalMilestone,
  type GoalUpdate,
} from "@/hooks/api";

const progressStatusConfig: Record<
  NonNullable<GoalDetails["progressStatus"]>,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  on_track: {
    label: "On Track",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  at_risk: {
    label: "At Risk",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: AlertTriangle,
  },
  behind: {
    label: "Behind",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
  ahead: {
    label: "Ahead",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: TrendingUp,
  },
};

const typeLabels: Record<GoalDetails["type"], string> = {
  performance: "Performance Goal",
  development: "Development Goal",
  project: "Project Goal",
  okr: "OKR",
};

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;

  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  const { data: goal, isLoading, error } = useGoal(tenantId, goalId);

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Goal not found</h3>
            <p className="text-muted-foreground mb-4">
              The goal you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => router.push("/goals")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Goals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressStatus = goal.progressStatus
    ? progressStatusConfig[goal.progressStatus]
    : null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressColor = (progress: number, status: GoalDetails["status"]) => {
    if (status === "completed") return "bg-blue-500";
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getOwnerName = () => {
    const first = goal.owner?.firstName || "";
    const last = goal.owner?.lastName || "";
    return [first, last].filter(Boolean).join(" ") || "Unknown";
  };

  const getOwnerInitials = () => {
    const first = goal.owner?.firstName?.[0] || "";
    const last = goal.owner?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/goals")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Goals
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${progressStatus?.bgColor || "bg-gray-100"}`}>
            {progressStatus ? (
              <progressStatus.icon className={`h-6 w-6 ${progressStatus.color}`} />
            ) : (
              <Target className="h-6 w-6 text-gray-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{goal.title}</h1>
              {progressStatus && (
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${progressStatus.bgColor} ${progressStatus.color}`}
                >
                  {progressStatus.label}
                </span>
              )}
              {goal.status === "completed" && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
                  Completed
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {typeLabels[goal.type]}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Due {formatDate(goal.targetDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {goal.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{goal.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{goal.progress}%</span>
                  <span className="text-muted-foreground">
                    {goal.milestones?.length || 0} milestones
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColor(
                      goal.progress,
                      goal.status
                    )}`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <MilestonesCard
            milestones={goal.milestones || []}
            tenantId={tenantId}
            goalId={goalId}
          />

          {/* Updates */}
          <UpdatesCard
            updates={goal.updates || []}
            tenantId={tenantId}
            goalId={goalId}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={goal.owner?.avatarUrl || undefined} />
                  <AvatarFallback>{getOwnerInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getOwnerName()}</p>
                  <p className="text-sm text-muted-foreground">Goal Owner</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(goal.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Date</p>
                <p className="font-medium">{formatDate(goal.targetDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(goal.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MilestonesCard({
  milestones,
  tenantId,
  goalId,
}: {
  milestones: GoalMilestone[];
  tenantId: string | null;
  goalId: string;
}) {
  const [newMilestone, setNewMilestone] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addMilestone = useAddMilestone();
  const completeMilestone = useCompleteMilestone();

  const handleAddMilestone = async () => {
    if (!tenantId || !newMilestone.trim()) return;

    try {
      await addMilestone.mutateAsync({
        tenantId,
        goalId,
        data: { title: newMilestone.trim() },
      });
      setNewMilestone("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add milestone:", error);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!tenantId) return;

    try {
      await completeMilestone.mutateAsync({
        tenantId,
        goalId,
        milestoneId,
      });
    } catch (error) {
      console.error("Failed to complete milestone:", error);
    }
  };

  const completedCount = milestones.filter((m) => m.isCompleted).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Milestones
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <CardDescription>
          {completedCount} of {milestones.length} completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.length === 0 && !isAdding && (
            <p className="text-muted-foreground text-center py-4">
              No milestones yet. Add milestones to track progress.
            </p>
          )}

          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-3 p-3 rounded-lg border"
            >
              <button
                onClick={() => !milestone.isCompleted && handleCompleteMilestone(milestone.id)}
                disabled={milestone.isCompleted || completeMilestone.isPending}
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  milestone.isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-muted-foreground hover:border-accent"
                }`}
              >
                {milestone.isCompleted && <CheckCircle2 className="h-3 w-3" />}
              </button>
              <div className="flex-1">
                <p className={milestone.isCompleted ? "line-through text-muted-foreground" : ""}>
                  {milestone.title}
                </p>
                {milestone.targetDate && (
                  <p className="text-xs text-muted-foreground">
                    Target: {new Date(milestone.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isAdding && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Milestone title..."
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleAddMilestone}
                disabled={!newMilestone.trim() || addMilestone.isPending}
              >
                {addMilestone.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewMilestone("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UpdatesCard({
  updates,
  tenantId,
  goalId,
}: {
  updates: GoalUpdate[];
  tenantId: string | null;
  goalId: string;
}) {
  const [newNote, setNewNote] = useState("");
  const addUpdate = useAddGoalUpdate();

  const handleAddUpdate = async () => {
    if (!tenantId || !newNote.trim()) return;

    try {
      await addUpdate.mutateAsync({
        tenantId,
        goalId,
        data: { content: newNote.trim() },
      });
      setNewNote("");
    } catch (error) {
      console.error("Failed to add update:", error);
    }
  };

  const getAuthorName = (update: GoalUpdate) => {
    const first = update.author?.firstName || "";
    const last = update.author?.lastName || "";
    return [first, last].filter(Boolean).join(" ") || "Unknown";
  };

  const getAuthorInitials = (update: GoalUpdate) => {
    const first = update.author?.firstName?.[0] || "";
    const last = update.author?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          Updates
        </CardTitle>
        <CardDescription>Progress notes and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Update Form */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a progress update..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleAddUpdate}
              disabled={!newNote.trim() || addUpdate.isPending}
              className="self-end"
            >
              {addUpdate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post"
              )}
            </Button>
          </div>

          {/* Updates List */}
          {updates.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No updates yet.
            </p>
          ) : (
            <div className="space-y-4 pt-4 border-t">
              {updates.map((update) => (
                <div key={update.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={update.author?.avatarUrl || undefined} />
                    <AvatarFallback>{getAuthorInitials(update)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getAuthorName(update)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {update.newProgress !== null && update.previousProgress !== null && (
                      <p className="text-sm text-green-600">
                        Progress: {update.previousProgress}% → {update.newProgress}%
                      </p>
                    )}
                    {update.content && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {update.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
