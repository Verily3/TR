'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAssessment } from '@/hooks/api/useAssessments';
import { RaterResponseForm } from '@/components/assessments/RaterResponseForm';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface TemplateConfig {
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
}

export default function RespondPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const assessmentId = params.assessmentId as string;

  const tenantId = user?.tenantId;
  const { data: assessment, isLoading } = useAssessment(tenantId ?? undefined, assessmentId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Loading assessment...</p>
      </div>
    );
  }

  if (!assessment || !assessment.template) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Assessment Not Found</h2>
        <p className="text-gray-500">This assessment does not exist or you don&apos;t have access.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Response Submitted</h2>
        <p className="text-gray-500 mb-6">
          Thank you for providing your feedback. Your response has been recorded.
        </p>
        <button
          onClick={() => router.push('/assessments')}
          className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const config = assessment.template.config as TemplateConfig;
  const subjectName = assessment.subject
    ? `${assessment.subject.firstName} ${assessment.subject.lastName}`
    : 'Unknown';

  const handleSaveDraft = async (data: {
    ratings: Record<string, number>;
    comments: Record<string, string>;
    overallComments: string;
  }) => {
    setIsSaving(true);
    try {
      await api.post(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/responses`,
        {
          responseData: {
            ratings: data.ratings,
            comments: data.comments,
            overallComments: data.overallComments,
          },
        }
      );
    } catch (err) {
      setError('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (data: {
    ratings: Record<string, number>;
    comments: Record<string, string>;
    overallComments: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(
        `/api/tenants/${tenantId}/assessments/${assessmentId}/responses/submit`,
        {
          responseData: {
            ratings: data.ratings,
            comments: data.comments,
            overallComments: data.overallComments,
          },
        }
      );
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <RaterResponseForm
        assessmentName={assessment.name || 'Assessment'}
        subjectName={subjectName}
        competencies={config.competencies}
        scaleMin={config.scaleMin}
        scaleMax={config.scaleMax}
        scaleLabels={config.scaleLabels}
        allowComments={config.allowComments}
        requireComments={config.requireComments}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isSaving={isSaving}
      />
    </div>
  );
}
