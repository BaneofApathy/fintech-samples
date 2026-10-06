import { describe, it, expect } from 'vitest';
import {
  classification,
  fScore,
  thresholds,
  averagePrecision,
  pairAuc,
  forecastMetrics,
  multiclass,
  adjustedRand,
  ndcg,
  tailRisk,
  wilson,
  probabilityScores,
  drawdowns,
  stdev,
  psi,
  pinball,
  ratio,
} from '../src/engine/visual-math';
describe('visual calculation contracts', () => {
  it('conserves class counts and exposes undefined denominators', () => {
    const c = classification(60, 140, 40, 9760);
    expect(c.n).toBe(10000);
    expect(c.specificity! + c.fpr!).toBe(1);
    expect(c.precision).toBe(0.3);
    expect(c.recall).toBe(0.6);
    expect(fScore(c.precision, c.recall, 2)).toBeCloseTo(0.5);
    expect(classification(0, 0, 5, 20).precision).toBeNull();
    expect(ratio(0, 0)).toBeNull();
  });
  it('starts with no alerts even when a score equals one', () => {
    const curve = thresholds([1, 0.5, 0], [1, 0, 1]);
    expect(curve[0].cut).toBe(Infinity);
    expect(curve[0].TP + curve[0].FP).toBe(0);
    expect(curve.at(-1)?.recall).toBe(1);
  });
  it('groups tied scores, making AP independent of within-tie order', () => {
    expect(averagePrecision([0.9, 0.9, 0.1], [1, 0, 1])).toBeCloseTo(7 / 12);
    expect(averagePrecision([0.9, 0.9, 0.1], [0, 1, 1])).toBeCloseTo(7 / 12);
    expect(averagePrecision([0.9, 0.3], [0, 0])).toBeNull();
  });
  it('pairwise AUC gives ties half-credit without a threshold', () => {
    expect(pairAuc([0.9, 0.8, 0.6, 0.4, 0.2], [0.5, 0.3, 0.1, 0.05, 0])).toBeCloseTo(0.88);
    expect(pairAuc([0.5], [0.5])).toBe(0.5);
  });
  it('uses actual minus forecast and keeps scaling denominators explicit', () => {
    const f = forecastMetrics([100, 120, 80, 150], [90, 130, 100, 140], 20);
    expect(f.error).toEqual([10, -10, -20, 10]);
    expect(f.mae).toBe(12.5);
    expect(f.rmse).toBeCloseTo(Math.sqrt(175));
    expect(f.mape).toBeCloseTo(0.125);
    expect(f.mase).toBe(0.625);
    expect(f.r2).toBeCloseTo(1 - 700 / 2675);
    expect(forecastMetrics([0], [2], 0).mape).toBeNull();
    expect(forecastMetrics([0], [2], 0).mase).toBeNull();
    expect(pinball(150, 130, 0.95)).toBe(19);
  });
  it('pools multiclass counts instead of averaging class F1 for micro', () => {
    const r = multiclass([
      [8, 1, 1],
      [1, 3, 0],
      [2, 0, 0],
    ]);
    expect(r.micro).toBe(11 / 16);
    expect(r.macro).not.toBe(r.micro);
    expect(r.weighted).not.toBe(r.macro);
  });
  it('keeps ARI invariant to arbitrary cluster names', () => {
    const a = [0, 0, 0, 1, 1, 1],
      b = [0, 0, 1, 0, 1, 1];
    expect(adjustedRand(a, b)).toBeCloseTo(-1 / 9);
    expect(
      adjustedRand(
        a,
        b.map((v) => 1 - v),
      ),
    ).toBeCloseTo(-1 / 9);
    expect(
      adjustedRand(
        a,
        a.map((v) => 1 - v),
      ),
    ).toBe(1);
  });
  it('uses graded relevance for nDCG', () => {
    expect(ndcg([3, 1, 0])).toBe(1);
    expect(ndcg([1, 3, 0])).toBeCloseTo(0.7098097414);
    expect(ndcg([0, 0])).toBeNull();
  });
  it('selects a fixed tail count with ties at VaR', () => {
    const r = tailRisk([0, 1, 2, 2, 2, 2, 3, 3, 3, 3], 0.8);
    expect(r.var).toBe(3);
    expect(r.tailCount).toBe(2);
    expect(r.es).toBe(3);
    expect(tailRisk([], 0.95).var).toBeNull();
  });
  it('uses bounded Wilson intervals even at zero or all breaches', () => {
    expect(wilson(0, 100).low).toBe(0);
    expect(wilson(0, 100).high).toBeGreaterThan(0);
    expect(wilson(100, 100).high).toBeCloseTo(1);
    expect(wilson(1200, 10000).se).toBeCloseTo(Math.sqrt((0.12 * 0.88) / 10000));
    expect(wilson(0, 0).p).toBeNull();
  });
  it('agrees with the authored probability, drawdown, and drift examples', () => {
    expect(probabilityScores([0.1, 0.8, 0.6, 0.2], [0, 1, 0, 0]).brier).toBeCloseTo(0.1125);
    expect(Math.max(...drawdowns([100, 120, 110, 90, 115]))).toBe(0.25);
    expect(stdev([-0.03, 0, 0.03])).toBe(0.03);
    expect(psi([0.2, 0.3, 0.3, 0.2], [0.1, 0.25, 0.35, 0.3])).toBeCloseTo(0.1266848406978716, 10);
    expect(psi([0.5, 0.5], [0, 1])).toBeNull();
  });
});
