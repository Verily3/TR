'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { RaterResponseForm } from '@/components/assessments/RaterResponseForm';
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
        const data = await res.json();
        setAssessmentInfo(data.data);
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
      const res = await fetch(`${API_URL}/api/assessments/respond/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseData: {
            ratings: data.ratings,
            comments: data.comments,
            overallComments: data.overallComments,
          },
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
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
