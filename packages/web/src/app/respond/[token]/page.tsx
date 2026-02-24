'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { RaterResponseForm } from '@/components/assessments/RaterResponseForm';
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck, Lock, PenLine } from 'lucide-react';
import { API_URL } from '@/lib/api';

// ─── API response shape ──────────────────────────────────────────────────────

interface ApiResponseItem {
  competencyId: string;
  questionId: string;
  rating?: number;
  text?: string;
  comment?: string;
}

interface ApiResponseData {
  assessment: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    closeDate?: string | null;
    subjectName?: string;
  };
  template: {
    id: string;
    name: string;
    assessmentType: string;
    config: {
      competencies: {
        id: string;
        name: string;
        description?: string;
        questions: { id: string; text: string }[];
      }[];
      scaleMin: number;
      scaleMax: number;
      scaleLabels?: string[];
      allowComments: boolean;
      requireComments: boolean;
      showCompetenciesToRaters?: boolean;
    };
  };
  invitation: {
    id: string;
    raterType: string;
    status: string;
  };
  existingResponse: {
    responses: ApiResponseItem[];
    overallComments?: string | null;
    submittedAt?: string | null;
  } | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PublicRespondPage() {
  const params = useParams();
  const token = params.token as string;

  const [apiData, setApiData] = useState<ApiResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchAssessmentInfo() {
      try {
        const res = await fetch(`${API_URL}/api/assessments/respond/${token}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || 'Invalid or expired access link');
        }
        const json = await res.json();
        setApiData(json.data as ApiResponseData);
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssessmentInfo();
  }, [token]);

  // Derived state
  const config = apiData?.template?.config;
  const assessmentName = apiData?.assessment?.name ?? '';
  const subjectName = apiData?.assessment?.subjectName || assessmentName;
  const assessmentStatus = apiData?.assessment?.status;
  const closeDate = apiData?.assessment?.closeDate;
  const invitationStatus = apiData?.invitation?.status;
  const existingResponse = apiData?.existingResponse;

  const hasExistingResponse = !!existingResponse?.responses?.length;
  const isAssessmentOpen = assessmentStatus === 'open';
  const isPastCloseDate = closeDate ? new Date(closeDate) < new Date() : false;
  const canEdit = isAssessmentOpen && !isPastCloseDate;

  // Convert existing response array [{competencyId, questionId, rating, comment}]
  // into flat maps { ratings: {qId: score}, comments: {qId: text}, overallComments }
  const initialData = useMemo(() => {
    if (!existingResponse?.responses?.length) return undefined;
    const ratings: Record<string, number> = {};
    const comments: Record<string, string> = {};
    for (const item of existingResponse.responses) {
      if (item.rating != null) ratings[item.questionId] = item.rating;
      if (item.comment) comments[item.questionId] = item.comment;
    }
    return {
      ratings,
      comments,
      overallComments: existingResponse.overallComments || '',
    };
  }, [existingResponse]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // ── Error / not found ──
  if (error || !apiData || !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Assessment</h2>
          <p className="text-gray-500">
            {error || 'This assessment link may be invalid or expired.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Just submitted successfully ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {hasExistingResponse ? 'Response Updated!' : 'Thank You!'}
          </h2>
          <p className="text-gray-500 mb-2">
            Your feedback for <span className="font-medium">{subjectName}</span> has been{' '}
            {hasExistingResponse ? 'updated' : 'submitted'} successfully.
          </p>
          {canEdit && (
            <p className="text-xs text-gray-400 mt-3">
              You can revisit this link to update your response before the deadline.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">You can close this page now.</p>
        </div>
      </div>
    );
  }

  // ── Completed + assessment closed (read-only) ──
  if (hasExistingResponse && !canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>
              This assessment is now closed. Your response has been recorded and can no longer be
              edited.
            </span>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Response Submitted</h2>
            <p className="text-sm text-gray-500">
              Thank you for providing feedback for{' '}
              <span className="font-medium">{subjectName}</span>.
            </p>
            {existingResponse?.submittedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Submitted on{' '}
                {new Date(existingResponse.submittedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Submit / update handler ──
  const handleSubmit = async (data: {
    ratings: Record<string, number>;
    comments: Record<string, string>;
    overallComments: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const responses: {
        competencyId: string;
        questionId: string;
        rating?: number;
        comment?: string;
      }[] = [];
      for (const competency of config.competencies) {
        for (const question of competency.questions) {
          if (data.ratings[question.id] != null) {
            responses.push({
              competencyId: competency.id,
              questionId: question.id,
              rating: data.ratings[question.id],
              comment: data.comments[question.id] || undefined,
            });
          }
        }
      }

      const res = await fetch(`${API_URL}/api/assessments/respond/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          overallComments: data.overallComments || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Failed to submit response');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Editable form (first time or returning to edit) ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      {hasExistingResponse ? (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-amber-700">
            <PenLine className="w-4 h-4 flex-shrink-0" />
            <span>
              You previously submitted a response. You can review and update it below
              {closeDate && (
                <>
                  {' '}
                  before{' '}
                  <strong>
                    {new Date(closeDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </>
              )}
              .
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-blue-700">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Your responses are confidential and will be anonymized in the report.</span>
          </div>
        </div>
      )}

      <div className="py-8 px-4">
        {error && (
          <div className="max-w-3xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <RaterResponseForm
          assessmentName={assessmentName}
          subjectName={subjectName}
          competencies={config.competencies}
          scaleMin={config.scaleMin}
          scaleMax={config.scaleMax}
          scaleLabels={config.scaleLabels}
          allowComments={config.allowComments}
          requireComments={config.requireComments}
          showCompetencyNames={config.showCompetenciesToRaters ?? false}
          initialData={initialData}
          isUpdate={hasExistingResponse}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
