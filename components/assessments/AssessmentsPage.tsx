"use client";

import { useState } from "react";
import {
  ClipboardList,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Card } from "../ui";
import { AssessmentCard } from "./AssessmentCard";
import { CreateAssessmentModal } from "./CreateAssessmentModal";
import type { AssessmentsPageProps, AssessmentStatus } from "./types";
import {
  defaultAssessments,
  defaultAssessmentStats,
  defaultTemplates,
} from "./data";

type FilterStatus = "all" | AssessmentStatus;

const filterOptions: { id: FilterStatus; label: string }[] = [
  { id: "all", label: "All Assessments" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "completed", label: "Completed" },
];

export function AssessmentsPage({
  assessments = defaultAssessments,
  stats = defaultAssessmentStats,
  templates = defaultTemplates,
  onViewAssessment,
}: AssessmentsPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredAssessments =
    activeFilter === "all"
      ? assessments
      : assessments.filter((a) => a.status === activeFilter);

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Page Header */}
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sidebar-foreground mb-2">
            360 Assessments
          </h1>
          <p className="text-muted-foreground">
            Manage feedback assessments and view comprehensive performance insights
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Assessment
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            <span className="text-2xl font-medium text-sidebar-foreground">
              {stats.totalAssessments}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Total Assessments</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-medium text-sidebar-foreground">
              {stats.activeAssessments}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-medium text-sidebar-foreground">
              {stats.completedAssessments}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-yellow-600" />
            <span className="text-2xl font-medium text-sidebar-foreground">
              {stats.pendingResponses}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Pending Responses</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-medium text-sidebar-foreground">
              {stats.averageResponseRate}%
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Avg Response Rate</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(option.id)}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                activeFilter === option.id
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-background"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredAssessments.length} of {assessments.length} assessments
        </div>
      </div>

      {/* Assessments List */}
      {filteredAssessments.length > 0 ? (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onView={onViewAssessment}
            />
          ))}
        </div>
      ) : (
        <Card padding="lg">
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sidebar-foreground mb-2">No Assessments Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeFilter === "all"
                ? "Create your first 360 assessment to gather feedback"
                : `No ${activeFilter} assessments found`}
            </p>
            {activeFilter === "all" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
              >
                Create Assessment
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Create Assessment Modal */}
      <CreateAssessmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        templates={templates}
      />
    </main>
  );
}
