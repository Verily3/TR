"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Clock,
  Calendar,
  Loader2,
  Play,
  CheckCircle2,
  Archive,
  FileText,
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
import { useCurrentTenant } from "@/stores/auth-store";
import { usePrograms, type Program } from "@/hooks/api";

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: FileText,
  },
  active: {
    label: "Active",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: Play,
  },
  completed: {
    label: "Completed",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: CheckCircle2,
  },
  archived: {
    label: "Archived",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: Archive,
  },
};

const defaultStatus = {
  label: "Unknown",
  color: "text-gray-700",
  bgColor: "bg-gray-100",
  icon: FileText,
};

const typeLabels: Record<Program["type"], string> = {
  cohort: "Cohort Program",
  individual: "Self-Paced",
};

export default function ProgramsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Program["status"] | "all">("all");

  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  const { data: programsData, isLoading } = usePrograms(tenantId, {
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    perPage: 50,
  });

  const programs = programsData?.items || [];

  // Calculate stats
  const stats = {
    total: programs.length,
    active: programs.filter((p) => p.status === "active").length,
    draft: programs.filter((p) => p.status === "draft").length,
    completed: programs.filter((p) => p.status === "completed").length,
  };

  const statCards = [
    {
      label: "Total Programs",
      value: stats.total,
      icon: BookOpen,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Active",
      value: stats.active,
      icon: Play,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Draft",
      value: stats.draft,
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Programs</h1>
          <p className="text-muted-foreground">
            Manage learning programs, modules, and learner progress
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Button>
      </div>

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

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as Program["status"] | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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
      {!isLoading && programs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first program"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Program
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Programs Grid */}
      {!isLoading && programs.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => router.push(`/programs/${program.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program, onClick }: { program: Program; onClick: () => void }) {
  const status = statusConfig[program.status] || defaultStatus;
  const StatusIcon = status.icon;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className="hover:border-accent/30 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Program Image/Header */}
      <div className="h-32 bg-gradient-to-br from-accent/20 to-accent/5 rounded-t-lg flex items-center justify-center">
        <BookOpen className="h-12 w-12 text-accent/50" />
      </div>

      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
              {program.name}
            </h3>
            <p className="text-sm text-muted-foreground">{typeLabels[program.type]}</p>
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
                Edit Program
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Manage Participants
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Program
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {program.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {program.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {program.moduleCount} modules
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {program.enrollmentCount} enrolled
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}
          >
            {status.label}
          </span>
          {program.startDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(program.startDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
