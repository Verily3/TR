import { eq, and } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type {
  BenchmarkData,
  CompetencyBenchmark,
  ComputedAssessmentResults,
  TemplateConfig,
} from '@tr/db/schema';

const {
  assessments,
  assessmentTemplates,
  assessmentBenchmarks,
} = schema;

/**
 * Compute agency-level benchmarks for a given template.
 *
 * Aggregates all completed assessments across the agency's tenants
 * that used the same template. Produces per-competency statistics:
 *   mean, median, p25, p75, stdDev, sampleSize
 */
export async function computeBenchmarks(
  agencyId: string,
  templateId: string
): Promise<BenchmarkData> {
  // 1. Get template to know competency IDs
  const [template] = await db
    .select()
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.id, templateId))
    .limit(1);

  if (!template) {
    throw new Error('Template not found');
  }

  const config = template.config as TemplateConfig;
  const competencyIds = config.competencies.map((c) => c.id);

  // 2. Fetch all completed assessments with results for this template across the agency
  //    We get the agency's tenants implicitly — the template is owned by the agency,
  //    and assessments reference the template.
  const completedAssessments = await db
    .select({
      id: assessments.id,
      computedResults: assessments.computedResults,
    })
    .from(assessments)
    .where(
      and(
        eq(assessments.templateId, templateId),
        eq(assessments.status, 'completed')
      )
    );

  // Only use assessments that have computed results
  const withResults = completedAssessments.filter(
    (a) => a.computedResults != null
  );

  if (withResults.length === 0) {
    // Return empty benchmarks
    const empty: BenchmarkData = {};
    for (const cid of competencyIds) {
      empty[cid] = { mean: 0, median: 0, p25: 0, p75: 0, stdDev: 0, sampleSize: 0 };
    }
    return empty;
  }

  // 3. Collect per-competency "othersAverage" scores across all assessments
  const scoresByCompetency: Record<string, number[]> = {};
  for (const cid of competencyIds) {
    scoresByCompetency[cid] = [];
  }

  for (const a of withResults) {
    const results = a.computedResults as ComputedAssessmentResults;
    for (const cs of results.competencyScores) {
      if (scoresByCompetency[cs.competencyId]) {
        scoresByCompetency[cs.competencyId].push(cs.overallAverage);
      }
    }
  }

  // 4. Compute statistics per competency
  const benchmarkData: BenchmarkData = {};
  for (const cid of competencyIds) {
    const scores = scoresByCompetency[cid];
    if (scores.length === 0) {
      benchmarkData[cid] = { mean: 0, median: 0, p25: 0, p75: 0, stdDev: 0, sampleSize: 0 };
      continue;
    }

    scores.sort((a, b) => a - b);
    benchmarkData[cid] = {
      mean: round2(mean(scores)),
      median: round2(percentile(scores, 50)),
      p25: round2(percentile(scores, 25)),
      p75: round2(percentile(scores, 75)),
      stdDev: round2(stdDev(scores)),
      sampleSize: scores.length,
    };
  }

  // 5. Upsert benchmark record
  const existing = await db
    .select({ id: assessmentBenchmarks.id })
    .from(assessmentBenchmarks)
    .where(
      and(
        eq(assessmentBenchmarks.agencyId, agencyId),
        eq(assessmentBenchmarks.templateId, templateId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(assessmentBenchmarks)
      .set({
        benchmarkData,
        sampleSize: withResults.length,
        computedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assessmentBenchmarks.id, existing[0].id));
  } else {
    await db.insert(assessmentBenchmarks).values({
      agencyId,
      templateId,
      sampleSize: withResults.length,
      benchmarkData,
      computedAt: new Date(),
    });
  }

  return benchmarkData;
}

/**
 * Get percentile rank for a given score within benchmark data.
 */
export function getPercentileRank(
  score: number,
  benchmark: CompetencyBenchmark
): number {
  if (benchmark.sampleSize === 0 || benchmark.stdDev === 0) return 50;

  // Use z-score approximation with normal distribution
  const z = (score - benchmark.mean) / benchmark.stdDev;
  // Approximate CDF using logistic approximation
  const percentile = 100 / (1 + Math.exp(-1.7 * z));
  return Math.round(Math.min(Math.max(percentile, 1), 99));
}

// ---- Utility functions ----

function mean(arr: number[]): number {
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const avg = mean(arr);
  const variance =
    arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const frac = idx - lower;
  return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
