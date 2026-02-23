import { describe, it, expect } from 'vitest';
import { getPercentileRank } from './benchmark-engine.js';
import type { CompetencyBenchmark } from '@tr/db/schema';

function makeBenchmark(overrides: Partial<CompetencyBenchmark> = {}): CompetencyBenchmark {
  return {
    mean: 3.5,
    median: 3.5,
    p25: 3.0,
    p75: 4.0,
    stdDev: 0.8,
    sampleSize: 50,
    ...overrides,
  };
}

describe('getPercentileRank', () => {
  it('returns 50 when sampleSize is 0', () => {
    expect(getPercentileRank(4.0, makeBenchmark({ sampleSize: 0 }))).toBe(50);
  });

  it('returns 50 when stdDev is 0', () => {
    expect(getPercentileRank(4.0, makeBenchmark({ stdDev: 0 }))).toBe(50);
  });

  it('returns ~50 when score equals mean', () => {
    const result = getPercentileRank(3.5, makeBenchmark());
    expect(result).toBe(50);
  });

  it('returns > 50 when score is above mean', () => {
    const result = getPercentileRank(4.5, makeBenchmark());
    expect(result).toBeGreaterThan(50);
  });

  it('returns < 50 when score is below mean', () => {
    const result = getPercentileRank(2.5, makeBenchmark());
    expect(result).toBeLessThan(50);
  });

  it('higher scores produce higher percentiles', () => {
    const bench = makeBenchmark();
    const low = getPercentileRank(2.0, bench);
    const mid = getPercentileRank(3.5, bench);
    const high = getPercentileRank(5.0, bench);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  it('clamps to minimum 1 for very low scores', () => {
    // Score far below mean: mean=3.5, stdDev=0.1, score=0
    const result = getPercentileRank(0, makeBenchmark({ stdDev: 0.1 }));
    expect(result).toBe(1);
  });

  it('clamps to maximum 99 for very high scores', () => {
    // Score far above mean: mean=3.5, stdDev=0.1, score=7
    const result = getPercentileRank(7, makeBenchmark({ stdDev: 0.1 }));
    expect(result).toBe(99);
  });

  it('returns an integer', () => {
    const result = getPercentileRank(3.7, makeBenchmark());
    expect(Number.isInteger(result)).toBe(true);
  });

  it('handles 1 stdDev above mean (~85th percentile)', () => {
    // score = mean + 1*stdDev → z=1 → ~85th percentile
    const bench = makeBenchmark({ mean: 3.0, stdDev: 1.0 });
    const result = getPercentileRank(4.0, bench);
    expect(result).toBeGreaterThanOrEqual(80);
    expect(result).toBeLessThanOrEqual(90);
  });
});
