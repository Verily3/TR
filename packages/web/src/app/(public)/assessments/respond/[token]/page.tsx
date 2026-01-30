"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  usePublicAssessmentForm,
  useSubmitResponses,
  useDeclineInvitation,
  type AssessmentCompetency,
} from "@/hooks/api";

interface ResponseData {
  competencyId: string;
  questionId: string;
  score: number;
  comment?: string;
}

function ScoreSelector({
  value,
  onChange,
  min,
  max,
  labels,
}: {
  value: number | null;
  onChange: (score: number) => void;
  min: number;
  max: number;
  labels: string[];
}) {
  const scores = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`flex-1 py-3 rounded-lg border-2 transition-all font-medium ${
              value === score
                ? "border-accent bg-accent text-white"
                : "border-gray-200 hover:border-accent/50"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      {labels.length > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{labels[0]}</span>
          {labels.length > 2 && <span>{labels[Math.floor(labels.length / 2)]}</span>}
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

export default function PublicAssessmentFormPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [currentCompetencyIndex, setCurrentCompetencyIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseData>>({});
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const { data: formData, isLoading, error } = usePublicAssessmentForm(token);
  const submitResponses = useSubmitResponses();
  const declineInvitation = useDeclineInvitation();

  // Initialize responses from existing data
  useEffect(() => {
    if (formData?.existingResponses) {
      const existing: Record<string, ResponseData> = {};
      formData.existingResponses.forEach((r) => {
        const key = `${r.competencyId}_${r.questionId}`;
        existing[key] = {
          competencyId: r.competencyId,
          questionId: r.questionId,
          score: r.score,
          comment: r.comment || undefined,
        };
      });
      setResponses(existing);
    }
  }, [formData?.existingResponses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid or Expired Link</h2>
          <p className="text-muted-foreground">
            This assessment link is no longer valid. It may have expired or been completed already.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if already completed or declined
  if (formData.invitation.status === "completed") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
          <p className="text-muted-foreground">
            You have already completed this assessment. Your feedback has been recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (formData.invitation.status === "declined") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assessment Declined</h2>
          <p className="text-muted-foreground">
            You have declined this assessment invitation.
          </p>
        </CardContent>
      </Card>
    );
  }

  const competencies = formData.template.competencies;
  const currentCompetency = competencies[currentCompetencyIndex];
  const totalQuestions = competencies.reduce((sum, c) => sum + c.questions.length, 0);
  const answeredQuestions = Object.keys(responses).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const isLastCompetency = currentCompetencyIndex === competencies.length - 1;
  const isFirstCompetency = currentCompetencyIndex === 0;

  const getCurrentCompetencyResponses = () => {
    return currentCompetency.questions.filter((q) => {
      const key = `${currentCompetency.id}_${q.id}`;
      return responses[key]?.score !== undefined;
    }).length;
  };

  const isCurrentCompetencyComplete = getCurrentCompetencyResponses() === currentCompetency.questions.length;

  const handleScoreChange = (questionId: string, score: number) => {
    const key = `${currentCompetency.id}_${questionId}`;
    setResponses((prev) => ({
      ...prev,
      [key]: {
        competencyId: currentCompetency.id,
        questionId,
        score,
        comment: prev[key]?.comment,
      },
    }));
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    const key = `${currentCompetency.id}_${questionId}`;
    setResponses((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        competencyId: currentCompetency.id,
        questionId,
        comment: comment || undefined,
      },
    }));
  };

  const handleSubmit = async () => {
    const allResponses = Object.values(responses).filter((r) => r.score !== undefined);
    try {
      const result = await submitResponses.mutateAsync({
        token,
        data: { responses: allResponses },
      });
      if (result.status === "completed") {
        // Refresh the page to show completion message
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to submit responses:", error);
    }
  };

  const handleDecline = async () => {
    try {
      await declineInvitation.mutateAsync({
        token,
        reason: declineReason || undefined,
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    }
  };

  // Decline confirmation
  if (showDeclineConfirm) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Decline Assessment</CardTitle>
          <CardDescription>
            Are you sure you want to decline this assessment invitation?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please share why you're unable to complete this assessment..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeclineConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDecline}
              disabled={declineInvitation.isPending}
            >
              {declineInvitation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Decline"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <ClipboardList className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <CardTitle>{formData.assessment.name}</CardTitle>
              <CardDescription className="mt-1">
                You&apos;re providing feedback for <strong>{formData.assessment.subjectName}</strong> as a{" "}
                <strong>{formData.invitation.raterType}</strong>
              </CardDescription>
              {formData.assessment.anonymized && (
                <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Your responses are anonymous
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="text-muted-foreground">
                {answeredQuestions}/{totalQuestions} questions ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competency Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {competencies.map((comp, index) => {
          const answered = comp.questions.filter((q) => {
            const key = `${comp.id}_${q.id}`;
            return responses[key]?.score !== undefined;
          }).length;
          const isComplete = answered === comp.questions.length;
          const isCurrent = index === currentCompetencyIndex;

          return (
            <button
              key={comp.id}
              onClick={() => setCurrentCompetencyIndex(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap transition-all ${
                isCurrent
                  ? "border-accent bg-accent/5"
                  : isComplete
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 hover:border-accent/30"
              }`}
            >
              {isComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              <span className="text-sm font-medium">{comp.name}</span>
              <span className="text-xs text-muted-foreground">
                {answered}/{comp.questions.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentCompetency.name}</CardTitle>
          {currentCompetency.description && (
            <CardDescription>{currentCompetency.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {currentCompetency.questions.map((question, qIndex) => {
            const key = `${currentCompetency.id}_${question.id}`;
            const response = responses[key];

            return (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-sm font-medium">
                    {qIndex + 1}
                  </span>
                  <p className="flex-1 font-medium">{question.text}</p>
                </div>

                <ScoreSelector
                  value={response?.score || null}
                  onChange={(score) => handleScoreChange(question.id, score)}
                  min={formData.template.scaleMin}
                  max={formData.template.scaleMax}
                  labels={formData.template.scaleLabels}
                />

                {formData.template.allowComments && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Comments {formData.template.requireComments ? "(required)" : "(optional)"}
                    </Label>
                    <Textarea
                      placeholder="Add any additional feedback..."
                      value={response?.comment || ""}
                      onChange={(e) => handleCommentChange(question.id, e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentCompetencyIndex((prev) => prev - 1)}
          disabled={isFirstCompetency}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setShowDeclineConfirm(true)}
          >
            I cannot provide feedback
          </Button>
        </div>

        {isLastCompetency ? (
          <Button
            onClick={handleSubmit}
            disabled={answeredQuestions < totalQuestions || submitResponses.isPending}
          >
            {submitResponses.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Feedback
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentCompetencyIndex((prev) => prev + 1)}
            disabled={!isCurrentCompetencyComplete}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Progress hint */}
      {answeredQuestions < totalQuestions && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Please answer all questions before submitting. {totalQuestions - answeredQuestions} questions remaining.
          </p>
        </div>
      )}
    </div>
  );
}
