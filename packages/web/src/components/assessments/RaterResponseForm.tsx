'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, Send, Save } from 'lucide-react';

interface Question {
  id: string;
  text: string;
}

interface Competency {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
}

interface ResponseData {
  ratings: Record<string, number>; // questionId → rating
  comments: Record<string, string>; // questionId → comment
  overallComments: string;
}

interface RaterResponseFormProps {
  assessmentName: string;
  subjectName: string;
  competencies: Competency[];
  scaleMin: number;
  scaleMax: number;
  scaleLabels?: string[];
  allowComments: boolean;
  requireComments: boolean;
  showCompetencyNames?: boolean;
  initialData?: Partial<ResponseData>;
  onSaveDraft?: (data: ResponseData) => void;
  onSubmit: (data: ResponseData) => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
}

const defaultScaleLabels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

export function RaterResponseForm({
  assessmentName,
  subjectName,
  competencies,
  scaleMin,
  scaleMax,
  scaleLabels,
  allowComments,
  requireComments,
  showCompetencyNames = false,
  initialData,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  isSaving,
}: RaterResponseFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = competencies.length + 1; // competencies + overall comments

  const [ratings, setRatings] = useState<Record<string, number>>(initialData?.ratings || {});
  const [comments, setComments] = useState<Record<string, string>>(initialData?.comments || {});
  const [overallComments, setOverallComments] = useState(initialData?.overallComments || '');

  const labels = scaleLabels && scaleLabels.length > 0 ? scaleLabels : defaultScaleLabels;

  const scaleRange = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);

  const getResponseData = (): ResponseData => ({
    ratings,
    comments,
    overallComments,
  });

  const handleRating = (questionId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleComment = (questionId: string, value: string) => {
    setComments((prev) => ({ ...prev, [questionId]: value }));
  };

  const isCompetencyComplete = (competency: Competency): boolean => {
    const allRated = competency.questions.every((q) => ratings[q.id] != null);
    if (requireComments) {
      const allCommented = competency.questions.every(
        (q) => comments[q.id] && comments[q.id].trim() !== ''
      );
      return allRated && allCommented;
    }
    return allRated;
  };

  const isFormComplete = (): boolean => {
    return competencies.every(isCompetencyComplete);
  };

  const totalQuestions = competencies.reduce((sum, c) => sum + c.questions.length, 0);
  const answeredQuestions = Object.keys(ratings).length;
  const progressPercent = Math.round((answeredQuestions / totalQuestions) * 100);

  const isLastStep = currentStep === totalSteps - 1;
  const currentCompetency = currentStep < competencies.length ? competencies[currentStep] : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">{assessmentName}</h1>
        <p className="text-gray-500">
          Providing feedback for <span className="font-medium">{subjectName}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span>
            {progressPercent}% complete ({answeredQuestions}/{totalQuestions} questions)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto">
          {competencies.map((c, i) => {
            const complete = isCompetencyComplete(c);
            const active = i === currentStep;
            return (
              <button
                key={c.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-red-600 text-white'
                    : complete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {complete && <CheckCircle2 className="w-3 h-3" />}
                {showCompetencyNames ? c.name : `Section ${i + 1}`}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentStep(totalSteps - 1)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              isLastStep ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Current Competency Questions */}
      {currentCompetency && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {showCompetencyNames && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentCompetency.name}</h2>
              {currentCompetency.description && (
                <p className="text-sm text-gray-500">{currentCompetency.description}</p>
              )}
            </div>
          )}

          <div className="space-y-8">
            {currentCompetency.questions.map((question, qi) => (
              <div
                key={question.id}
                className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium text-gray-900 mb-4">
                  {qi + 1}. {question.text}
                </p>

                {/* Rating Scale */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {scaleRange.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleRating(question.id, value)}
                        className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all flex items-center justify-center ${
                          ratings[question.id] === value
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 px-1 mb-4">
                  <span>{labels[0] || `${scaleMin}`}</span>
                  <span>{labels[labels.length - 1] || `${scaleMax}`}</span>
                </div>

                {/* Optional Comment */}
                {allowComments && (
                  <textarea
                    placeholder={requireComments ? 'Comment required...' : 'Optional comment...'}
                    value={comments[question.id] || ''}
                    onChange={(e) => handleComment(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 resize-none"
                    rows={2}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary / Overall Comments step */}
      {isLastStep && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Submit</h2>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Response Summary</h3>
            <div className="space-y-2">
              {competencies.map((c, i) => {
                const complete = isCompetencyComplete(c);
                const answered = c.questions.filter((q) => ratings[q.id] != null).length;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      {complete ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {showCompetencyNames ? c.name : `Section ${i + 1}`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {answered}/{c.questions.length} answered
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Comments */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Overall Comments (Optional)</h3>
            <p className="text-xs text-gray-500 mb-3">
              Any additional feedback you&apos;d like to share about {subjectName}?
            </p>
            <textarea
              placeholder="Share any additional thoughts, observations, or suggestions..."
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <button
              onClick={() => onSaveDraft(getResponseData())}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Draft
            </button>
          )}

          {isLastStep ? (
            <button
              onClick={() => onSubmit(getResponseData())}
              disabled={!isFormComplete() || isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Response
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
