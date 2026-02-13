'use client';

import { MessageSquare, ChevronRight } from 'lucide-react';
import type { ComputedAssessmentResults } from '@/types/assessments';

interface MentoringGuideProps {
  results: ComputedAssessmentResults;
  subjectName: string;
}

export function MentoringGuide({ results, subjectName }: MentoringGuideProps) {
  const firstName = subjectName.split(' ')[0];

  // Build discussion topics from results
  const topics: { title: string; description: string; category: string }[] = [];

  // From blind spots
  for (const gap of results.gapAnalysis) {
    if (gap.classification === 'blind_spot') {
      topics.push({
        title: `Explore perception gap in ${gap.competencyName}`,
        description: `${firstName} rates themselves higher than others (+${gap.gap.toFixed(1)} gap). Discuss specific situations where this manifests and explore how to close the gap.`,
        category: 'Blind Spot',
      });
    }
  }

  // From hidden strengths
  for (const gap of results.gapAnalysis) {
    if (gap.classification === 'hidden_strength') {
      topics.push({
        title: `Recognize hidden strength in ${gap.competencyName}`,
        description: `Others rate ${firstName} higher than self-assessment (${Math.abs(gap.gap).toFixed(1)} gap). Help them recognize and leverage this strength more intentionally.`,
        category: 'Hidden Strength',
      });
    }
  }

  // From development areas
  for (const area of results.developmentAreas) {
    const cs = results.competencyScores.find((c) => c.competencyName === area);
    if (cs) {
      topics.push({
        title: `Develop action plan for ${area}`,
        description: `Current score: ${cs.overallAverage.toFixed(1)}. Discuss specific behaviors to improve, resources needed, and milestones to track progress.`,
        category: 'Development',
      });
    }
  }

  // From top strengths
  for (const strength of results.strengths.slice(0, 2)) {
    topics.push({
      title: `Leverage strength in ${strength}`,
      description: `This is one of ${firstName}'s top-rated competencies. Discuss how to use this strength to mentor others and support team development.`,
      category: 'Strength',
    });
  }

  // General reflection
  topics.push({
    title: 'Overall reflection and goal setting',
    description: `Review the full results together. What resonated? What was surprising? Set 2-3 concrete goals for the next quarter.`,
    category: 'Reflection',
  });

  const categoryColors: Record<string, string> = {
    'Blind Spot': 'text-red-600 bg-red-50',
    'Hidden Strength': 'text-green-600 bg-green-50',
    Development: 'text-yellow-600 bg-yellow-50',
    Strength: 'text-blue-600 bg-blue-50',
    Reflection: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-red-600" />
          Mentoring Discussion Guide
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Suggested conversation topics for 1:1 mentoring sessions based on assessment results
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {topics.map((topic, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm text-gray-900">{topic.title}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      categoryColors[topic.category] || 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    {topic.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{topic.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
