"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentTenant } from "@/stores/auth-store";
import { useGoals, useGoalStats, type Goal } from "@/hooks/api";
import { NewGoalModal } from "@/components/goals/new-goal-modal";

// Progress status config for visual display
const progressStatusConfig: Record<
  NonNullable<Goal["progressStatus"]>,
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

// Status config for workflow status
const statusConfig: Record<Goal["status"], { label: string }> = {
  not_started: { label: "Not Started" },
  in_progress: { label: "In Progress" },
  completed: { label: "Completed" },
  on_hold: { label: "On Hold" },
  cancelled: { label: "Cancelled" },
};

const typeLabels: Record<Goal["type"], string> = {
  performance: "Performance",
  development: "Development",
  project: "Project",
  okr: "OKR",
};

export default function GoalsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Goal["status"] | "all">("all");
  const [typeFilter, setTypeFilter] = useState<Goal["type"] | "all">("all");
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);

  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  const { data: stats, isLoading: statsLoading } = useGoalStats(tenantId);
  const { data: goalsData, isLoading: goalsLoading } = useGoals(tenantId, {
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    perPage: 50,
  });

  const goals = goalsData?.items || [];
  const isLoading = statsLoading || goalsLoading;

  const statCards = [
    {
      label: "Total Goals",
      value: stats?.total || 0,
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "On Track",
      value: stats?.onTrack || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "At Risk",
      value: stats?.atRisk || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Behind",
      value: stats?.behind || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Goals</h1>
          <p className="text-muted-foreground">
            Track and manage your performance, development, and project goals
          </p>
        </div>
        <Button onClick={() => setIsNewGoalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* New Goal Modal */}
      <NewGoalModal open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen} />

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
                    {statsLoading ? "..." : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as Goal["status"] | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as Goal["type"] | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="okr">OKR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No goals found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first goal"}
            </p>
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <Button onClick={() => setIsNewGoalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {!isLoading && goals.length > 0 && (
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Goals
            </CardTitle>
            <CardDescription>
              {goalsData?.meta.total || goals.length} goals total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} onClick={() => router.push(`/goals/${goal.id}`)} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GoalRow({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const progressStatus = goal.progressStatus
    ? progressStatusConfig[goal.progressStatus]
    : null;

  const getProgressColor = (progress: number, status: Goal["status"]) => {
    if (status === "completed") return "bg-blue-500";
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No due date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
    <div
      className="flex items-start gap-4 p-4 rounded-lg border hover:border-accent/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback>{getOwnerInitials()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{goal.title}</h3>
              {progressStatus && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${progressStatus.bgColor} ${progressStatus.color}`}
                >
                  {progressStatus.label}
                </span>
              )}
              {goal.status === "completed" && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  Completed
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{typeLabels[goal.type]}</span>
              <span>·</span>
              <span>{getOwnerName()}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(goal.targetDate)}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {goal.progress}% ({goal.completedMilestones}/{goal.milestoneCount} milestones)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor(
                goal.progress,
                goal.status
              )}`}
              style={{ width: `${Math.min(goal.progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
