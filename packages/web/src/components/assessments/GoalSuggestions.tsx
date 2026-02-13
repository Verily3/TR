'use client';

import { Target, Plus, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAssessmentGoals, useCreateGoalsFromAssessment } from '@/hooks/api/useAssessments';
import type { ComputedAssessmentResults } from '@/types/assessments';

interface GoalSuggestionsProps {
  tenantId: string;
  assessmentId: string;
  results: ComputedAssessmentResults;
}

export function GoalSuggestions({ tenantId, assessmentId, results }: GoalSuggestionsProps) {
  const { data: goals, isLoading: goalsLoading } = useAssessmentGoals(tenantId, assessmentId);
  const createGoals = useCreateGoalsFromAssessment(tenantId);

  const hasGoals = goals && goals.length > 0;

  const handleCreateGoals = () => {
    createGoals.mutate(assessmentId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              Development Goals
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Goals suggested from your assessment results
            </p>
          </div>
          {!hasGoals && (
            <button
              onClick={handleCreateGoals}
              disabled={createGoals.isPending}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {createGoals.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Generate Goals
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {goalsLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading goals...
          </div>
        ) : hasGoals ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
              >
                <div className="mt-0.5">
                  {goal.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Target className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-gray-900">{goal.title}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        goal.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {goal.priority}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-600">
                      {goal.status}
                    </span>
                    {goal.progress > 0 && (
                      <span className="text-xs text-gray-500">
                        {goal.progress}% complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <AlertTriangle className="h-8 w-8 mx-auto text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-900">No development goals yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Click &quot;Generate Goals&quot; to create development goals based on your{' '}
                {results.developmentAreas.length} development area{results.developmentAreas.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
