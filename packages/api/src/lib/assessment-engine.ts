import { eq, and, inArray } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type {
  ComputedAssessmentResults,
  ComputedCompetencyScore,
  ComputedItemScore,
  RankedItem,
  GapEntry,
  AssessmentResponseData,
  CCIResult,
  CurrentCeiling,
} from '@tr/db/schema';
import type { TemplateConfig, TemplateQuestion } from '@tr/db/schema';
import { computeTrend } from './trend-engine';

const {
  assessments,
  assessmentInvitations,
  assessmentResponses,
  assessmentTemplates,
} = schema;

/**
 * Compute aggregated results for a completed assessment.
 *
 * Steps:
 *  1. Fetch all completed responses with rater types
 *  2. Build score matrix: competencyId → questionId → raterType → number[]
 *  3. Per-question scores (avg per rater type, overall, gap)
 *  4. Per-competency scores (avg across questions, distribution, agreement)
 *  5. Overall score
 *  6. Rank and classify strengths / development areas
 *  7. Johari Window
 *  8. Store in assessments.computed_results
 */
export async function computeAssessmentResults(
  assessmentId: string
): Promise<ComputedAssessmentResults> {
  // 1. Fetch the assessment + template config
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) throw new Error(`Assessment ${assessmentId} not found`);

  const [template] = await db
    .select()
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.id, assessment.templateId))
    .limit(1);

  if (!template) throw new Error(`Template ${assessment.templateId} not found`);

  const config = template.config as TemplateConfig;

  // 2. Fetch all invitations with their responses
  const invitations = await db
    .select()
    .from(assessmentInvitations)
    .where(eq(assessmentInvitations.assessmentId, assessmentId));

  const completedInvIds = invitations
    .filter((inv) => inv.status === 'completed')
    .map((inv) => inv.id);

  // Build rater type map: invitationId → raterType
  const raterTypeMap = new Map<string, string>();
  for (const inv of invitations) {
    raterTypeMap.set(inv.id, inv.raterType);
  }

  // Fetch responses
  let allResponses: {
    invitationId: string;
    responses: AssessmentResponseData[];
    overallComments: string | null;
  }[] = [];

  if (completedInvIds.length > 0) {
    allResponses = await db
      .select({
        invitationId: assessmentResponses.invitationId,
        responses: assessmentResponses.responses,
        overallComments: assessmentResponses.overallComments,
      })
      .from(assessmentResponses)
      .where(
        and(
          inArray(assessmentResponses.invitationId, completedInvIds),
          eq(assessmentResponses.isComplete, true)
        )
      );
  }

  // 2b. Build question lookup map for reverse scoring and CCI flags
  const questionLookup = new Map<string, TemplateQuestion>();
  for (const comp of config.competencies) {
    for (const q of comp.questions) {
      questionLookup.set(`${comp.id}:${q.id}`, q);
    }
  }

  // 3. Build score matrix
  // competencyId → questionId → raterType → ratings[]
  const scoreMatrix = new Map<
    string,
    Map<string, Map<string, number[]>>
  >();

  // Also collect comments
  const collectedComments: {
    competencyId: string;
    raterType: string;
    comment: string;
  }[] = [];

  for (const resp of allResponses) {
    const raterType = raterTypeMap.get(resp.invitationId);
    if (!raterType) continue;

    const responseData = resp.responses as AssessmentResponseData[];
    for (const item of responseData) {
      if (item.rating != null) {
        // Apply reverse scoring if flagged
        const qDef = questionLookup.get(`${item.competencyId}:${item.questionId}`);
        const effectiveRating = qDef?.reverseScored
          ? config.scaleMax + config.scaleMin - item.rating
          : item.rating;

        if (!scoreMatrix.has(item.competencyId)) {
          scoreMatrix.set(item.competencyId, new Map());
        }
        const compMap = scoreMatrix.get(item.competencyId)!;
        if (!compMap.has(item.questionId)) {
          compMap.set(item.questionId, new Map());
        }
        const qMap = compMap.get(item.questionId)!;
        if (!qMap.has(raterType)) {
          qMap.set(raterType, []);
        }
        qMap.get(raterType)!.push(effectiveRating);
      }

      if (item.comment) {
        collectedComments.push({
          competencyId: item.competencyId,
          raterType,
          comment: item.comment,
        });
      }
    }
  }

  // 4. Compute per-question scores
  const itemScores: ComputedItemScore[] = [];

  for (const comp of config.competencies) {
    for (const q of comp.questions) {
      const compMap = scoreMatrix.get(comp.id);
      const qMap = compMap?.get(q.id);

      const scores: Record<string, number> = {};
      let selfScore: number | null = null;
      const allRatings: number[] = [];
      const othersRatings: number[] = [];

      if (qMap) {
        for (const [rType, ratings] of qMap) {
          const avg = mean(ratings);
          scores[rType] = avg;
          allRatings.push(...ratings);
          if (rType === 'self') {
            selfScore = avg;
          } else {
            othersRatings.push(...ratings);
          }
        }
      }

      const overallAverage = allRatings.length > 0 ? mean(allRatings) : 0;
      const othersAvg = othersRatings.length > 0 ? mean(othersRatings) : 0;

      itemScores.push({
        competencyId: comp.id,
        questionId: q.id,
        questionText: q.text,
        scores,
        overallAverage: round2(overallAverage),
        selfScore: selfScore != null ? round2(selfScore) : null,
        gap: selfScore != null ? round2(selfScore - othersAvg) : 0,
      });
    }
  }

  // 5. Compute per-competency scores
  const competencyScores: ComputedCompetencyScore[] = [];

  for (const comp of config.competencies) {
    // Aggregate scores by rater type
    const raterTypeScores: Record<string, number[]> = {};
    const allCompRatings: number[] = [];
    const othersCompRatings: number[] = [];
    let selfCompRatings: number[] = [];
    const responseDistribution: Record<number, number> = {};

    // Initialize distribution
    for (let i = config.scaleMin; i <= config.scaleMax; i++) {
      responseDistribution[i] = 0;
    }

    const compMap = scoreMatrix.get(comp.id);
    if (compMap) {
      for (const [, qMap] of compMap) {
        for (const [rType, ratings] of qMap) {
          if (!raterTypeScores[rType]) raterTypeScores[rType] = [];
          raterTypeScores[rType].push(...ratings);
          allCompRatings.push(...ratings);

          if (rType === 'self') {
            selfCompRatings.push(...ratings);
          } else {
            othersCompRatings.push(...ratings);
          }

          // Build distribution
          for (const r of ratings) {
            const rounded = Math.round(r);
            if (responseDistribution[rounded] !== undefined) {
              responseDistribution[rounded]++;
            }
          }
        }
      }
    }

    const scores: Record<string, number> = {};
    for (const [rType, ratings] of Object.entries(raterTypeScores)) {
      scores[rType] = round2(mean(ratings));
    }

    const overallAverage =
      allCompRatings.length > 0 ? round2(mean(allCompRatings)) : 0;
    const othersAverage =
      othersCompRatings.length > 0 ? round2(mean(othersCompRatings)) : 0;
    const selfScore =
      selfCompRatings.length > 0 ? round2(mean(selfCompRatings)) : null;

    // Rater agreement = stdDev across all individual rater averages (excluding self)
    const raterAgreement =
      othersCompRatings.length > 1
        ? round2(stdDev(othersCompRatings))
        : 0;

    competencyScores.push({
      competencyId: comp.id,
      competencyName: comp.name,
      scores,
      overallAverage,
      othersAverage,
      selfScore,
      gap: selfScore != null ? round2(selfScore - othersAverage) : 0,
      responseDistribution,
      raterAgreement,
    });
  }

  // 6. Overall score
  const overallScore =
    competencyScores.length > 0
      ? round2(
          mean(competencyScores.map((c) => c.overallAverage).filter((v) => v > 0))
        )
      : 0;

  // 7. Response rate by type
  const responseRateByType: Record<
    string,
    { invited: number; completed: number; rate: number }
  > = {};

  for (const inv of invitations) {
    if (!responseRateByType[inv.raterType]) {
      responseRateByType[inv.raterType] = {
        invited: 0,
        completed: 0,
        rate: 0,
      };
    }
    responseRateByType[inv.raterType].invited++;
    if (inv.status === 'completed') {
      responseRateByType[inv.raterType].completed++;
    }
  }
  for (const entry of Object.values(responseRateByType)) {
    entry.rate =
      entry.invited > 0
        ? Math.round((entry.completed / entry.invited) * 100)
        : 0;
  }

  // 8. Rank strengths and development areas (by others avg)
  const sortedByOthers = [...competencyScores]
    .filter((c) => c.othersAverage > 0)
    .sort((a, b) => b.othersAverage - a.othersAverage);

  const strengths = sortedByOthers.slice(0, 2).map((c) => c.competencyName);
  const developmentAreas = sortedByOthers
    .slice(-2)
    .reverse()
    .map((c) => c.competencyName);

  // 9. Top and bottom 5 items
  const sortedItems = [...itemScores]
    .filter((i) => i.overallAverage > 0)
    .sort((a, b) => b.overallAverage - a.overallAverage);

  const topItems: RankedItem[] = sortedItems.slice(0, 5).map((i) => ({
    competencyId: i.competencyId,
    competencyName:
      config.competencies.find((c) => c.id === i.competencyId)?.name || '',
    questionId: i.questionId,
    questionText: i.questionText,
    overallAverage: i.overallAverage,
    selfScore: i.selfScore,
    gap: i.gap,
  }));

  const bottomItems: RankedItem[] = sortedItems
    .slice(-5)
    .reverse()
    .map((i) => ({
      competencyId: i.competencyId,
      competencyName:
        config.competencies.find((c) => c.id === i.competencyId)?.name || '',
      questionId: i.questionId,
      questionText: i.questionText,
      overallAverage: i.overallAverage,
      selfScore: i.selfScore,
      gap: i.gap,
    }));

  // 10. Gap analysis
  const midpoint = (config.scaleMin + config.scaleMax) / 2;
  const gapAnalysis: GapEntry[] = competencyScores
    .filter((c) => c.selfScore != null)
    .map((c) => {
      const gap = round2(c.selfScore! - c.othersAverage);
      let classification: GapEntry['classification'];
      let interpretation: string;

      if (gap > 0.5) {
        classification = 'blind_spot';
        interpretation = `You rated yourself higher than others on ${c.competencyName}. This may indicate an area where self-perception differs from how others experience you.`;
      } else if (gap < -0.5) {
        classification = 'hidden_strength';
        interpretation = `Others rated you higher than you rated yourself on ${c.competencyName}. This is a strength that others see in you that you may not fully recognize.`;
      } else {
        classification = 'aligned';
        interpretation = `Your self-assessment and others' ratings on ${c.competencyName} are well-aligned.`;
      }

      return {
        competencyId: c.competencyId,
        competencyName: c.competencyName,
        selfScore: c.selfScore!,
        othersAverage: c.othersAverage,
        gap,
        classification,
        interpretation,
      };
    });

  // 11. Johari Window
  const johariWindow = {
    openArea: [] as string[],
    blindSpot: [] as string[],
    hiddenArea: [] as string[],
    unknownArea: [] as string[],
  };

  for (const comp of competencyScores) {
    if (comp.selfScore == null) continue;
    const selfHigh = comp.selfScore >= midpoint;
    const othersHigh = comp.othersAverage >= midpoint;

    if (selfHigh && othersHigh) {
      johariWindow.openArea.push(comp.competencyName);
    } else if (!selfHigh && othersHigh) {
      johariWindow.blindSpot.push(comp.competencyName);
    } else if (selfHigh && !othersHigh) {
      johariWindow.hiddenArea.push(comp.competencyName);
    } else {
      johariWindow.unknownArea.push(comp.competencyName);
    }
  }

  // 12. CCI (Coaching Capacity Index) computation
  let cciResult: CCIResult | undefined;
  const cciItems: CCIResult['items'] = [];

  for (const comp of config.competencies) {
    const cciQuestion = comp.questions.find((q) => q.isCCI);
    if (!cciQuestion) continue;

    // Find the item score for this CCI question
    const itemScore = itemScores.find(
      (is) => is.competencyId === comp.id && is.questionId === cciQuestion.id
    );
    if (!itemScore) continue;

    // Use others' average if available, otherwise overall
    const othersRatings: number[] = [];
    const compMap = scoreMatrix.get(comp.id);
    const qMap = compMap?.get(cciQuestion.id);
    if (qMap) {
      for (const [rType, ratings] of qMap) {
        if (rType !== 'self') othersRatings.push(...ratings);
      }
    }
    const effectiveScore = othersRatings.length > 0
      ? round2(mean(othersRatings))
      : itemScore.overallAverage;

    cciItems.push({
      competencyId: comp.id,
      competencyName: comp.name,
      questionId: cciQuestion.id,
      questionText: cciQuestion.text,
      rawScore: itemScore.overallAverage,
      effectiveScore,
    });
  }

  if (cciItems.length > 0) {
    const cciScore = round2(mean(cciItems.map((i) => i.effectiveScore)));
    let band: CCIResult['band'];
    if (cciScore <= 2.0) band = 'Low';
    else if (cciScore <= 3.0) band = 'Moderate';
    else if (cciScore <= 4.0) band = 'High';
    else band = 'Very High';

    cciResult = { score: cciScore, band, items: cciItems };
  }

  // 13. Current Ceiling — lowest-scoring competency
  let currentCeiling: CurrentCeiling | undefined;
  const scoredCompetencies = competencyScores.filter((c) => c.overallAverage > 0);
  if (scoredCompetencies.length > 0) {
    const lowest = scoredCompetencies.reduce((min, c) =>
      c.overallAverage < min.overallAverage ? c : min
    );
    const compDef = config.competencies.find((c) => c.id === lowest.competencyId);
    const subtitle = compDef?.subtitle || '';

    const narrative = subtitle
      ? `The data suggests that ${lowest.competencyName} — ${subtitle} — represents the current constraint on leadership capacity. Until this area is addressed, growth in other dimensions may be limited.`
      : `The data suggests that ${lowest.competencyName} represents the current constraint on leadership capacity. Until this area is addressed, growth in other dimensions may be limited.`;

    currentCeiling = {
      competencyId: lowest.competencyId,
      competencyName: lowest.competencyName,
      subtitle,
      score: lowest.overallAverage,
      narrative,
    };
  }

  // 14. Trend comparison (previous assessment for same subject + template)
  let trend;
  try {
    trend = await computeTrend(
      assessmentId,
      assessment.subjectId,
      assessment.templateId,
      { overallScore, competencyScores } as ComputedAssessmentResults
    );
  } catch {
    // Trend is non-critical — proceed without it
  }

  // 15. Assemble the result
  const results: ComputedAssessmentResults = {
    computedAt: new Date().toISOString(),
    overallScore,
    responseRateByType,
    competencyScores,
    itemScores,
    gapAnalysis,
    topItems,
    bottomItems,
    strengths,
    developmentAreas,
    comments: collectedComments,
    johariWindow,
    cciResult,
    currentCeiling,
    trend: trend || undefined,
  };

  // 16. Store in database
  await db
    .update(assessments)
    .set({
      computedResults: results,
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessmentId));

  return results;
}

// ========== Utility functions ==========

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const sqDiffs = arr.map((v) => (v - avg) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (arr.length - 1));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
