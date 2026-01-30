"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  Users,
  Building2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentAgency } from "@/stores/auth-store";
import {
  useTemplates,
  useDuplicateTemplate,
  useDeleteTemplate,
  type AgencyTemplate,
} from "@/hooks/api";
import { CreateTemplateModal } from "@/components/templates";

function getTypeBadgeClass(type: string) {
  switch (type) {
    case "360":
      return "bg-purple-100 text-purple-700";
    case "180":
      return "bg-blue-100 text-blue-700";
    case "self":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  isDuplicating,
  isDeleting,
}: {
  template: AgencyTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDuplicating: boolean;
  isDeleting: boolean;
}) {
  return (
    <Card className="hover:border-accent/30 transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-accent/10">
              <ClipboardList className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{template.name}</h3>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeClass(
                    template.type
                  )}`}
                >
                  {template.type}
                </span>
                {!template.isActive && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {template.competencyCount} competencies · {template.questionCount} questions
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {template.usageCount} assessments
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {template.completionCount} completions
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isDuplicating || isDeleting}>
                {isDuplicating || isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Building2 className="h-4 w-4 mr-2" />
                Manage Publishing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No assessment frameworks yet</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Create your first assessment framework to start gathering 180/360 feedback
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Framework
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [actionTemplateId, setActionTemplateId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentAgency = useCurrentAgency();
  const agencyId = currentAgency?.id;

  const { data: templatesData, isLoading, error } = useTemplates(agencyId, {
    isActive: "all",
  });

  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  const templates = templatesData?.data || [];
  const meta = templatesData?.meta;

  // Calculate stats from templates
  const totalCompetencies = templates.reduce((sum, t) => sum + t.competencyCount, 0);
  const totalQuestions = templates.reduce((sum, t) => sum + t.questionCount, 0);
  const totalCompletions = templates.reduce((sum, t) => sum + t.completionCount, 0);
  const type360Count = templates.filter((t) => t.type === "360").length;
  const type180Count = templates.filter((t) => t.type === "180").length;

  const handleEdit = (templateId: string) => {
    router.push(`/agency/assessments/${templateId}`);
  };

  const handleDuplicate = async (templateId: string) => {
    if (!agencyId) return;
    setActionTemplateId(templateId);
    try {
      await duplicateMutation.mutateAsync({ agencyId, templateId });
    } finally {
      setActionTemplateId(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!agencyId) return;
    setActionTemplateId(templateId);
    try {
      await deleteMutation.mutateAsync({ agencyId, templateId });
    } finally {
      setActionTemplateId(null);
    }
  };

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load templates</h3>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assessment Frameworks</h1>
          <p className="text-muted-foreground">
            Create and manage 180/360 assessment blueprints
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Framework
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-10">
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Frameworks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : templates.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {type360Count} 360s, {type180Count} 180s
            </p>
          </CardContent>
        </Card>
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Competencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCompetencies}
            </div>
            <p className="text-xs text-muted-foreground">{totalQuestions} questions</p>
          </CardContent>
        </Card>
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assessments Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                templates.reduce((sum, t) => sum + t.usageCount, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">From all templates</p>
          </CardContent>
        </Card>
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCompletions}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Frameworks List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Assessment Frameworks</h2>
          {isLoading ? (
            <LoadingSkeleton />
          ) : templates.length === 0 ? (
            <EmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
          ) : (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEdit(template.id)}
                onDuplicate={() => handleDuplicate(template.id)}
                onDelete={() => handleDelete(template.id)}
                isDuplicating={
                  actionTemplateId === template.id && duplicateMutation.isPending
                }
                isDeleting={actionTemplateId === template.id && deleteMutation.isPending}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick Stats</h2>
          </div>
          <Card className="hover:border-accent/30 transition-all">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active frameworks</span>
                  <span className="text-sm font-medium">
                    {templates.filter((t) => t.isActive).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Archived</span>
                  <span className="text-sm text-muted-foreground">
                    {templates.filter((t) => !t.isActive).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. competencies</span>
                  <span className="text-sm text-muted-foreground">
                    {templates.length > 0
                      ? Math.round(totalCompetencies / templates.length)
                      : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. questions</span>
                  <span className="text-sm text-muted-foreground">
                    {templates.length > 0
                      ? Math.round(totalQuestions / templates.length)
                      : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold pt-4">Scoring Scales</h2>
          <Card className="hover:border-accent/30 transition-all">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">5-Point Likert</span>
                  <span className="text-xs text-muted-foreground">Default</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">7-Point Scale</span>
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">10-Point NPS</span>
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Template Modal */}
      {agencyId && (
        <CreateTemplateModal
          agencyId={agencyId}
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      )}
    </div>
  );
}
