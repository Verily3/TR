"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Users,
  BarChart3,
  Target,
  Loader2,
  MoreHorizontal,
  Play,
  XCircle,
  Eye,
  Send,
  Trash2,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentTenant } from "@/stores/auth-store";
import {
  useAssessment,
  useLaunchAssessment,
  useCloseAssessment,
  useReleaseResults,
  useRemoveInvitation,
  useSendReminder,
  useAcceptSuggestion,
  useDismissSuggestion,
  type AssessmentInvitation,
  type AssessmentResult,
  type GoalSuggestion,
} from "@/hooks/api";
import { AddRatersModal } from "@/components/assessments/add-raters-modal";

const assessmentTypeLabels: Record<string, string> = {
  "180": "180 Assessment",
  "360": "360 Assessment",
  self: "Self Assessment",
  custom: "Custom Assessment",
};

const assessmentStatusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-gray-700", bgColor: "bg-gray-100" },
  active: { label: "Active", color: "text-blue-700", bgColor: "bg-blue-100" },
  closed: { label: "Closed", color: "text-green-700", bgColor: "bg-green-100" },
  archived: { label: "Archived", color: "text-gray-500", bgColor: "bg-gray-50" },
};

const invitationStatusConfig: Record<
  AssessmentInvitation["status"],
  { label: string; color: string; icon: typeof Check }
> = {
  pending: { label: "Pending", color: "text-yellow-600", icon: Clock },
  started: { label: "In Progress", color: "text-blue-600", icon: AlertCircle },
  completed: { label: "Completed", color: "text-green-600", icon: CheckCircle2 },
  declined: { label: "Declined", color: "text-red-600", icon: XCircle },
  expired: { label: "Expired", color: "text-gray-500", icon: XCircle },
};

const raterTypeLabels: Record<string, string> = {
  self: "Self",
  manager: "Manager",
  peer: "Peer",
  direct_report: "Direct Report",
  external: "External",
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

interface InvitationRowProps {
  invitation: AssessmentInvitation;
  assessmentId: string;
  tenantId: string;
  canRemove: boolean;
}

function InvitationRow({ invitation, assessmentId, tenantId, canRemove }: InvitationRowProps) {
  const removeInvitation = useRemoveInvitation();
  const sendReminder = useSendReminder();
  const statusConfig = invitationStatusConfig[invitation.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-accent/10 text-accent">
          {invitation.rater
            ? getInitials(invitation.rater.firstName, invitation.rater.lastName)
            : invitation.raterName?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {invitation.rater
              ? `${invitation.rater.firstName || ""} ${invitation.rater.lastName || ""}`.trim()
              : invitation.raterName || invitation.raterEmail}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted">
            {raterTypeLabels[invitation.raterType]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{invitation.raterEmail}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1 text-sm ${statusConfig.color}`}>
          <StatusIcon className="h-4 w-4" />
          {statusConfig.label}
        </span>
        {(invitation.status === "pending" || invitation.status === "started") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendReminder.mutate({ tenantId, assessmentId, inviteId: invitation.id })}
            disabled={sendReminder.isPending}
          >
            <Mail className="h-4 w-4" />
          </Button>
        )}
        {canRemove && invitation.status !== "completed" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeInvitation.mutate({ tenantId, assessmentId, inviteId: invitation.id })}
            disabled={removeInvitation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface ResultRowProps {
  result: AssessmentResult;
}

function ResultRow({ result }: ResultRowProps) {
  const selfScore = result.selfScore ? parseFloat(result.selfScore) : null;
  const managerScore = result.managerScore ? parseFloat(result.managerScore) : null;
  const peerScore = result.peerScore ? parseFloat(result.peerScore) : null;
  const directReportScore = result.directReportScore ? parseFloat(result.directReportScore) : null;
  const overallScore = result.overallScore ? parseFloat(result.overallScore) : null;
  const gap = result.selfVsOthersGap ? parseFloat(result.selfVsOthersGap) : null;

  const renderScore = (score: number | null, count: number) => {
    if (score === null || count === 0) return <span className="text-muted-foreground">-</span>;
    return (
      <span className="font-medium">
        {score.toFixed(1)}
        <span className="text-xs text-muted-foreground ml-1">({count})</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-7 gap-4 p-4 border-b items-center text-sm">
      <div className="col-span-2 font-medium">{result.competencyName}</div>
      <div className="text-center">{renderScore(selfScore, result.selfCount)}</div>
      <div className="text-center">{renderScore(managerScore, result.managerCount)}</div>
      <div className="text-center">{renderScore(peerScore, result.peerCount)}</div>
      <div className="text-center">{renderScore(directReportScore, result.directReportCount)}</div>
      <div className="text-center">
        {gap !== null ? (
          <span className={gap > 0.5 ? "text-yellow-600" : gap < -0.5 ? "text-red-600" : "text-green-600"}>
            {gap > 0 ? "+" : ""}{gap.toFixed(1)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: GoalSuggestion;
  assessmentId: string;
  tenantId: string;
}

function SuggestionCard({ suggestion, assessmentId, tenantId }: SuggestionCardProps) {
  const acceptSuggestion = useAcceptSuggestion();
  const dismissSuggestion = useDismissSuggestion();

  if (suggestion.status !== "pending") {
    return (
      <Card className="opacity-60">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium line-through">{suggestion.suggestedGoal}</p>
              <p className="text-sm text-muted-foreground">
                {suggestion.status === "accepted" ? "Goal created" : "Dismissed"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-accent/30 transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-accent/10">
            <Target className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{suggestion.suggestedGoal}</p>
            {suggestion.reason && (
              <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
            )}
            {suggestion.competencyName && (
              <p className="text-xs text-muted-foreground mt-2">
                Based on: {suggestion.competencyName}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => dismissSuggestion.mutate({ tenantId, assessmentId, suggestionId: suggestion.id })}
              disabled={dismissSuggestion.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => acceptSuggestion.mutate({ tenantId, assessmentId, suggestionId: suggestion.id })}
              disabled={acceptSuggestion.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Create Goal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;

  const [activeTab, setActiveTab] = useState("overview");
  const [isAddRatersOpen, setIsAddRatersOpen] = useState(false);

  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  const { data: assessment, isLoading } = useAssessment(tenantId, assessmentId);
  const launchAssessment = useLaunchAssessment();
  const closeAssessment = useCloseAssessment();
  const releaseResults = useReleaseResults();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assessment not found</h2>
          <p className="text-muted-foreground mb-4">
            The assessment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/assessments">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = assessmentStatusConfig[assessment.status];
  const progress =
    assessment.totalInvitations > 0
      ? Math.round((assessment.completedResponses / assessment.totalInvitations) * 100)
      : 0;

  const invitationsByType = {
    self: assessment.invitations.filter((i) => i.raterType === "self"),
    manager: assessment.invitations.filter((i) => i.raterType === "manager"),
    peer: assessment.invitations.filter((i) => i.raterType === "peer"),
    direct_report: assessment.invitations.filter((i) => i.raterType === "direct_report"),
    external: assessment.invitations.filter((i) => i.raterType === "external"),
  };

  const pendingSuggestions = assessment.goalSuggestions.filter((s) => s.status === "pending");

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/assessments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-accent/10 text-accent text-lg">
                {getInitials(assessment.subject.firstName, assessment.subject.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{assessment.name}</h1>
                <span className={`px-2 py-0.5 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">
                {assessmentTypeLabels[assessment.type]} for {assessment.subject.firstName} {assessment.subject.lastName}
                {assessment.endDate && ` · Due ${formatDate(assessment.endDate)}`}
              </p>
              {assessment.status === "active" && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {assessment.completedResponses}/{assessment.totalInvitations} responses ({progress}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {assessment.status === "draft" && (
                <DropdownMenuItem
                  onClick={() => launchAssessment.mutate({ tenantId: tenantId!, assessmentId })}
                  disabled={assessment.invitations.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Launch Assessment
                </DropdownMenuItem>
              )}
              {assessment.status === "active" && (
                <DropdownMenuItem
                  onClick={() => closeAssessment.mutate({ tenantId: tenantId!, assessmentId })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Assessment
                </DropdownMenuItem>
              )}
              {assessment.status === "closed" && !assessment.resultsReleasedAt && (
                <DropdownMenuItem
                  onClick={() => releaseResults.mutate({ tenantId: tenantId!, assessmentId })}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Release Results
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Archive Assessment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Add Raters Modal */}
      <AddRatersModal
        open={isAddRatersOpen}
        onOpenChange={setIsAddRatersOpen}
        assessmentId={assessmentId}
        assessmentType={assessment.type}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="raters">
            Raters ({assessment.invitations.length})
          </TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="suggestions">
            Suggestions ({pendingSuggestions.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Progress by Rater Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(invitationsByType).map(([type, invitations]) => {
                  if (invitations.length === 0) return null;
                  const completed = invitations.filter((i) => i.status === "completed").length;
                  const pct = Math.round((completed / invitations.length) * 100);
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{raterTypeLabels[type]}</span>
                        <span className="text-muted-foreground">
                          {completed}/{invitations.length} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{assessmentTypeLabels[assessment.type]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(assessment.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>{formatDate(assessment.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span>{formatDate(assessment.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anonymized</span>
                  <span>{assessment.anonymizeResponses ? "Yes" : "No"}</span>
                </div>
                {assessment.resultsReleasedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Results Released</span>
                    <span>{formatDate(assessment.resultsReleasedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Raters Tab */}
        <TabsContent value="raters">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Assessment Raters
                </CardTitle>
                <CardDescription>
                  {assessment.completedResponses} of {assessment.totalInvitations} have completed
                </CardDescription>
              </div>
              {(assessment.status === "draft" || assessment.status === "active") && (
                <Button onClick={() => setIsAddRatersOpen(true)}>
                  Add Raters
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {assessment.invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No raters added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsAddRatersOpen(true)}
                  >
                    Add Raters
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessment.invitations.map((invitation) => (
                    <InvitationRow
                      key={invitation.id}
                      invitation={invitation}
                      assessmentId={assessmentId}
                      tenantId={tenantId!}
                      canRemove={assessment.status === "draft" || assessment.status === "active"}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Competency Results
              </CardTitle>
              <CardDescription>
                Aggregated scores by competency and rater type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment.results.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Results will appear once responses are collected
                  </p>
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50 rounded-t-lg text-sm font-medium">
                    <div className="col-span-2">Competency</div>
                    <div className="text-center">Self</div>
                    <div className="text-center">Manager</div>
                    <div className="text-center">Peers</div>
                    <div className="text-center">Reports</div>
                    <div className="text-center">Gap</div>
                  </div>
                  {/* Rows */}
                  {assessment.results.map((result) => (
                    <ResultRow key={result.id} result={result} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Goal Suggestions
              </CardTitle>
              <CardDescription>
                Recommended goals based on assessment results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment.goalSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Goal suggestions will appear after results are calculated
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessment.goalSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      assessmentId={assessmentId}
                      tenantId={tenantId!}
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
