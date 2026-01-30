"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Users,
  CheckCircle2,
  TrendingUp,
  Loader2,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentTenant } from "@/stores/auth-store";
import {
  useAssessments,
  useMyAssessments,
  usePendingAssessments,
  useAssessmentStats,
  type Assessment,
  type PendingAssessment,
} from "@/hooks/api";
import { NewAssessmentModal } from "@/components/assessments/new-assessment-modal";

const assessmentTypeLabels: Record<Assessment["type"], string> = {
  "180": "180",
  "360": "360",
  self: "Self",
  custom: "Custom",
};

const assessmentStatusConfig: Record<
  Assessment["status"],
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-gray-700", bgColor: "bg-gray-100" },
  active: { label: "Active", color: "text-blue-700", bgColor: "bg-blue-100" },
  closed: { label: "Closed", color: "text-green-700", bgColor: "bg-green-100" },
  archived: { label: "Archived", color: "text-gray-500", bgColor: "bg-gray-50" },
};

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface AssessmentRowProps {
  assessment: Assessment;
  onClick: () => void;
}

function AssessmentRow({ assessment, onClick }: AssessmentRowProps) {
  const progress =
    assessment.totalInvitations > 0
      ? Math.round((assessment.completedResponses / assessment.totalInvitations) * 100)
      : 0;
  const statusConfig = assessmentStatusConfig[assessment.status];

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-lg border hover:border-accent/30 hover:bg-muted/30 cursor-pointer transition-all"
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-accent/10 text-accent">
          {getInitials(assessment.subject.firstName, assessment.subject.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{assessment.name}</span>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              assessment.type === "360"
                ? "bg-purple-100 text-purple-700"
                : assessment.type === "180"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {assessmentTypeLabels[assessment.type]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Subject: {assessment.subject.firstName} {assessment.subject.lastName}
          {assessment.endDate && ` · Due ${formatDate(assessment.endDate)}`}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        {assessment.status === "active" && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-muted-foreground whitespace-nowrap">
              {assessment.completedResponses}/{assessment.totalInvitations}
            </span>
          </div>
        )}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

interface PendingAssessmentRowProps {
  item: PendingAssessment;
}

function PendingAssessmentRow({ item }: PendingAssessmentRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-accent/30 transition-all">
      <div className="p-2 rounded-lg bg-yellow-100">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.assessment.name}</p>
        <p className="text-sm text-muted-foreground">
          For: {item.assessment.subject.firstName} {item.assessment.subject.lastName}
          {item.assessment.endDate && ` · Due ${formatDate(item.assessment.endDate)}`}
        </p>
      </div>
      <Link href={`/assessments/respond/${item.invitation.token}`}>
        <Button size="sm">
          Complete Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState(false);

  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  const { data: stats, isLoading: statsLoading } = useAssessmentStats(tenantId);
  const { data: allAssessments, isLoading: assessmentsLoading } = useAssessments(
    tenantId,
    { perPage: 20 }
  );
  const { data: myAssessments, isLoading: myLoading } = useMyAssessments(tenantId);
  const { data: pendingAssessments, isLoading: pendingLoading } = usePendingAssessments(tenantId);

  const isLoading = statsLoading;

  const statCards = [
    {
      label: "Active Assessments",
      value: stats?.activeAssessments || 0,
      icon: ClipboardList,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Pending Responses",
      value: stats?.pendingResponses || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Completed This Month",
      value: stats?.completedThisMonth || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Avg Completion Rate",
      value: `${stats?.avgCompletionRate || 0}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assessments</h1>
          <p className="text-muted-foreground">
            Manage 180 and 360 degree assessments
          </p>
        </div>
        <Button onClick={() => setIsNewAssessmentOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {/* New Assessment Modal */}
      <NewAssessmentModal
        open={isNewAssessmentOpen}
        onOpenChange={setIsNewAssessmentOpen}
      />

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

      {/* Pending Responses Alert */}
      {(pendingAssessments?.items.length || 0) > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Pending Responses
            </CardTitle>
            <CardDescription className="text-yellow-700">
              You have {pendingAssessments?.items.length} assessment(s) waiting for your feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAssessments?.items.slice(0, 3).map((item) => (
                <PendingAssessmentRow key={item.invitation.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Assessments</TabsTrigger>
          <TabsTrigger value="mine">
            My Assessments ({myAssessments?.meta?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* All Assessments Tab */}
        <TabsContent value="all">
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-accent" />
                All Assessments
              </CardTitle>
              <CardDescription>
                {allAssessments?.meta?.total || 0} assessments in this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : allAssessments?.items.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No assessments yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsNewAssessmentOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {allAssessments?.items.map((assessment) => (
                    <AssessmentRow
                      key={assessment.id}
                      assessment={assessment}
                      onClick={() => router.push(`/assessments/${assessment.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Assessments Tab */}
        <TabsContent value="mine">
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                My Assessments
              </CardTitle>
              <CardDescription>
                Assessments where you are the subject being evaluated
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myAssessments?.items.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    You don&apos;t have any assessments yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myAssessments?.items.map((assessment) => (
                    <AssessmentRow
                      key={assessment.id}
                      assessment={assessment}
                      onClick={() => router.push(`/assessments/${assessment.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
