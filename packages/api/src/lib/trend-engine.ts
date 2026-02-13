import { eq, and, desc, ne } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type { ComputedAssessmentResults } from '@tr/db/schema';

const { assessments } = schema;

export interface TrendComparison {
  previousAssessmentId: string;
  previousCompletedAt: string;
  competencyChanges: {
    competencyId: string;
    competencyName: string;
    previousScore: number;
    currentScore: number;
    change: number;
    changePercent: number;
    direction: 'improved' | 'declined' | 'stable';
  }[];
  overallChange: number;
  overallDirection: 'improved' | 'declined' | 'stable';
}

/**
 * Find previous completed assessment for the same subject + template
 * and compute a trend comparison.
 */
export async function computeTrend(
  currentAssessmentId: string,
  subjectId: string,
  templateId: string,
  currentResults: ComputedAssessmentResults
): Promise<TrendComparison | null> {
  // Find the most recent completed assessment for the same subject and template
  // that isn't the current one
  const [previous] = await db
    .select({
      id: assessments.id,
      computedResults: assessments.computedResults,
      updatedAt: assessments.updatedAt,
    })
    .from(assessments)
    .where(
      and(
        eq(assessments.subjectId, subjectId),
        eq(assessments.templateId, templateId),
        eq(assessments.status, 'completed'),
        ne(assessments.id, currentAssessmentId)
      )
    )
    .orderBy(desc(assessments.updatedAt))
    .limit(1);

  if (!previous || !previous.computedResults) {
    return null;
  }

  const prevResults = previous.computedResults as ComputedAssessmentResults;

  // Map previous competency scores by ID for quick lookup
  const prevScoreMap = new Map(
    prevResults.competencyScores.map((cs) => [cs.competencyId, cs])
  );

  const competencyChanges = currentResults.competencyScores.map((cs) => {
    const prev = prevScoreMap.get(cs.competencyId);
    const previousScore = prev?.overallAverage ?? cs.overallAverage;
    const change = cs.overallAverage - previousScore;
    const changePercent = previousScore > 0
      ? Math.round((change / previousScore) * 100)
      : 0;

    return {
      competencyId: cs.competencyId,
      competencyName: cs.competencyName,
      previousScore: round2(previousScore),
      currentScore: round2(cs.overallAverage),
      change: round2(change),
      changePercent,
      direction: classifyChange(change),
    };
  });

  const overallChange = currentResults.overallScore - prevResults.overallScore;

  return {
    previousAssessmentId: previous.id,
    previousCompletedAt: previous.updatedAt.toISOString(),
    competencyChanges,
    overallChange: round2(overallChange),
    overallDirection: classifyChange(overallChange),
  };
}

function classifyChange(change: number): 'improved' | 'declined' | 'stable' {
  if (change > 0.15) return 'improved';
  if (change < -0.15) return 'declined';
  return 'stable';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
