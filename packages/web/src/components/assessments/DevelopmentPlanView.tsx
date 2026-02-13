'use client';

import { GoalSuggestions } from './GoalSuggestions';
import { MentoringGuide } from './MentoringGuide';
import type { ComputedAssessmentResults } from '@/types/assessments';

interface DevelopmentPlanViewProps {
  tenantId: string;
  assessmentId: string;
  results: ComputedAssessmentResults;
  subjectName: string;
}

export function DevelopmentPlanView({
  tenantId,
  assessmentId,
  results,
  subjectName,
}: DevelopmentPlanViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Development Plan</h3>
        <p className="text-sm text-gray-500">
          Recommended actions and goals based on assessment results for {subjectName}.
        </p>
      </div>

      <GoalSuggestions
        tenantId={tenantId}
        assessmentId={assessmentId}
        results={results}
      />

      <MentoringGuide
        results={results}
        subjectName={subjectName}
      />
    </div>
  );
}
