"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Settings,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentAgency } from "@/stores/auth-store";
import {
  useTemplate,
  useUpdateTemplate,
  type AgencyTemplateDetails,
  type TemplateCompetency,
} from "@/hooks/api";
import {
  CompetencyList,
  type Competency,
} from "@/components/templates/CompetencyEditor";

const assessmentTypes = [
  { value: "360", label: "360 Assessment", description: "Self + Manager + Peers + Direct Reports" },
  { value: "180", label: "180 Assessment", description: "Self + Manager only" },
  { value: "self", label: "Self Assessment", description: "Self-evaluation only" },
  { value: "custom", label: "Custom", description: "Custom rater configuration" },
];

const defaultScaleLabels: Record<number, string[]> = {
  5: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  7: ["Strongly Disagree", "Disagree", "Somewhat Disagree", "Neutral", "Somewhat Agree", "Agree", "Strongly Agree"],
  10: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
};

function transformToEditorCompetencies(competencies: TemplateCompetency[]): Competency[] {
  return competencies.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    questions: c.questions.map((q) => ({
      id: q.id,
      text: q.text,
    })),
  }));
}

function transformFromEditorCompetencies(competencies: Competency[]): TemplateCompetency[] {
  return competencies.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    questions: c.questions.map((q) => ({
      id: q.id,
      text: q.text,
    })),
  }));
}

export default function TemplateEditPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.templateId as string;
  const { toast } = useToast();

  const currentAgency = useCurrentAgency();
  const agencyId = currentAgency?.id;

  const { data: template, isLoading, error } = useTemplate(agencyId, templateId);
  const updateMutation = useUpdateTemplate();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"180" | "360" | "self" | "custom">("360");
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [scaleMin, setScaleMin] = useState(1);
  const [scaleMax, setScaleMax] = useState(5);
  const [scaleLabels, setScaleLabels] = useState<string[]>([]);
  const [allowComments, setAllowComments] = useState(true);
  const [requireComments, setRequireComments] = useState(false);
  const [anonymizeResponses, setAnonymizeResponses] = useState(true);

  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Initialize form when template loads
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setType(template.type);
      setCompetencies(transformToEditorCompetencies(template.competencies));
      setScaleMin(template.scaleMin);
      setScaleMax(template.scaleMax);
      setScaleLabels(template.scaleLabels);
      setAllowComments(template.allowComments);
      setRequireComments(template.requireComments);
      setAnonymizeResponses(template.anonymizeResponses);
    }
  }, [template]);

  // Track changes
  useEffect(() => {
    if (!template) return;

    const changed =
      name !== template.name ||
      description !== (template.description || "") ||
      type !== template.type ||
      JSON.stringify(competencies) !== JSON.stringify(transformToEditorCompetencies(template.competencies)) ||
      scaleMin !== template.scaleMin ||
      scaleMax !== template.scaleMax ||
      JSON.stringify(scaleLabels) !== JSON.stringify(template.scaleLabels) ||
      allowComments !== template.allowComments ||
      requireComments !== template.requireComments ||
      anonymizeResponses !== template.anonymizeResponses;

    setHasChanges(changed);
  }, [template, name, description, type, competencies, scaleMin, scaleMax, scaleLabels, allowComments, requireComments, anonymizeResponses]);

  const handleSave = useCallback(async () => {
    if (!agencyId || updateMutation.isPending) return;

    // Filter out empty questions before saving
    const cleanedCompetencies = competencies.map((c) => ({
      ...c,
      questions: c.questions.filter((q) => q.text.trim() !== ""),
    }));

    try {
      await updateMutation.mutateAsync({
        agencyId,
        templateId,
        data: {
          name,
          description: description || undefined,
          type,
          competencies: transformFromEditorCompetencies(cleanedCompetencies),
          scaleMin,
          scaleMax,
          scaleLabels,
          allowComments,
          requireComments,
          anonymizeResponses,
        },
      });

      setCompetencies(cleanedCompetencies);
      setHasChanges(false);
      toast({
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Template saved successfully
          </div>
        ),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "There was an error saving your changes. Please try again.",
      });
    }
  }, [agencyId, templateId, name, description, type, competencies, scaleMin, scaleMax, scaleLabels, allowComments, requireComments, anonymizeResponses, updateMutation, toast]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, handleSave]);

  // Handle navigation with unsaved changes
  const handleNavigateBack = () => {
    if (hasChanges) {
      setPendingNavigation(() => () => router.back());
      setShowUnsavedDialog(true);
    } else {
      router.back();
    }
  };

  const confirmNavigation = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleScaleChange = (newMax: number) => {
    setScaleMax(newMax);
    if (defaultScaleLabels[newMax]) {
      setScaleLabels(defaultScaleLabels[newMax]);
    } else {
      // Generate numeric labels
      setScaleLabels(Array.from({ length: newMax }, (_, i) => String(i + 1)));
    }
  };

  const handleScaleLabelChange = (index: number, value: string) => {
    const newLabels = [...scaleLabels];
    newLabels[index] = value;
    setScaleLabels(newLabels);
  };

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto p-8">
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load template</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !template) {
    return (
      <div className="max-w-[1200px] mx-auto p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const totalQuestions = competencies.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <div className="max-w-[1200px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleNavigateBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">
              {competencies.length} competencies, {totalQuestions} questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleNavigateBack}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="competencies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="competencies" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Competencies
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competencies" className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Basic information about this assessment template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Leadership 360"
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
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-xs text-muted-foreground">{t.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this assessment measures..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Competencies */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Competencies & Questions</h2>
            <CompetencyList
              competencies={competencies}
              onChange={setCompetencies}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Scale Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Scale</CardTitle>
              <CardDescription>Configure the rating scale used for questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Scale Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={scaleMin}
                      onChange={(e) => setScaleMin(parseInt(e.target.value) || 1)}
                      min={0}
                      max={scaleMax - 1}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Select
                      value={String(scaleMax)}
                      onValueChange={(v) => handleScaleChange(parseInt(v))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Scale Labels</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Define labels for each point on the scale
                </p>
                <div className="grid gap-2">
                  {scaleLabels.map((label, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium text-muted-foreground text-right">
                        {scaleMin + index}
                      </span>
                      <Input
                        value={label}
                        onChange={(e) => handleScaleLabelChange(index, e.target.value)}
                        placeholder={`Label for ${scaleMin + index}`}
                        className="flex-1 max-w-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Response Settings</CardTitle>
              <CardDescription>Configure how responses are collected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowComments"
                  checked={allowComments}
                  onCheckedChange={(checked) => setAllowComments(checked === true)}
                />
                <Label htmlFor="allowComments" className="cursor-pointer">
                  Allow comments on questions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireComments"
                  checked={requireComments}
                  onCheckedChange={(checked) => setRequireComments(checked === true)}
                  disabled={!allowComments}
                />
                <Label
                  htmlFor="requireComments"
                  className={`cursor-pointer ${!allowComments ? "text-muted-foreground" : ""}`}
                >
                  Require comments on all questions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymize"
                  checked={anonymizeResponses}
                  onCheckedChange={(checked) => setAnonymizeResponses(checked === true)}
                />
                <Label htmlFor="anonymize" className="cursor-pointer">
                  Anonymize rater responses in results
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>How this template is being used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-2xl font-bold">{template.usageCount}</div>
                  <p className="text-sm text-muted-foreground">Assessments created</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{template.completionCount}</div>
                  <p className="text-sm text-muted-foreground">Completed assessments</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {template.usageCount > 0
                      ? Math.round((template.completionCount / template.usageCount) * 100)
                      : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Completion rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
