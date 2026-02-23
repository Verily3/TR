'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { RaterResponseForm } from '@/components/assessments/RaterResponseForm';
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '@/lib/api';

// Shape returned by the API
interface ApiResponseData {
  assessment: {
    id: string;
    name: string;
    description: string | null;
    status: string;
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
    };
  };
  invitation: {
    id: string;
    raterType: string;
    status: string;
  };
  existingResponse: {
    responseData?: {
      ratings?: Record<string, number>;
      comments?: Record<string, string>;
      overallComments?: string;
    };
  } | null;
}

// Flattened shape used by the component
interface AssessmentInfo {
  assessmentName: string;
  subjectName: string;
  raterType: string;
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
}

export default function PublicRespondPage() {
  const params = useParams();
  const token = params.token as string;

  const [assessmentInfo, setAssessmentInfo] = useState<AssessmentInfo | null>(null);
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
        const apiData = json.data as ApiResponseData;

        // Map API response to the shape the component expects
        setAssessmentInfo({
          assessmentName: apiData.assessment.name,
          subjectName: apiData.assessment.subjectName || apiData.assessment.name,
          raterType: apiData.invitation.raterType,
          config: apiData.template.config,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssessmentInfo();
  }, [token]);

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

  if (error || !assessmentInfo) {
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500 mb-2">
            Your feedback for <span className="font-medium">{assessmentInfo.subjectName}</span> has
            been submitted successfully.
          </p>
          <p className="text-xs text-gray-400">You can close this page now.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: {
    ratings: Record<string, number>;
    comments: Record<string, string>;
    overallComments: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Transform flat ratings/comments maps into the array format the API expects:
      // { responses: [{ competencyId, questionId, rating, comment }], overallComments }
      const responses: {
        competencyId: string;
        questionId: string;
        rating?: number;
        comment?: string;
      }[] = [];
      for (const competency of assessmentInfo!.config.competencies) {
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

  const { config } = assessmentInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confidentiality banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-blue-700">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Your responses are confidential and will be anonymized in the report.</span>
        </div>
      </div>

      <div className="py-8 px-4">
        {error && (
          <div className="max-w-3xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <RaterResponseForm
          assessmentName={assessmentInfo.assessmentName}
          subjectName={assessmentInfo.subjectName}
          competencies={config.competencies}
          scaleMin={config.scaleMin}
          scaleMax={config.scaleMax}
          scaleLabels={config.scaleLabels}
          allowComments={config.allowComments}
          requireComments={config.requireComments}
          showCompetencyNames={config.showCompetenciesToRaters ?? false}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
