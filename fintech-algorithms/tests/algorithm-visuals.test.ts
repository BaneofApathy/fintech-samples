import { describe, expect, it } from 'vitest';
import { exercises } from '../src/data';
import {
  algorithmValues,
  algorithmVisualCatalog,
  algorithmVisualGivens,
  algorithmVisuals,
  densityNeighborhoods,
  exactLoanDistribution,
  graphMetrics,
  graphEdges,
  kmeansFrames,
  logisticContributions,
  portfolioPoints,
  seasonalNaive,
  simulateLoanLosses,
  visualStepIndex,
} from '../src/data/algorithm-visuals';
import { variant } from '../src/engine/variants';

describe('Algorithm visual coverage and example provenance', () => {
  it('covers all twelve units with a complete guided explanation and prediction check', () => {
    expect(algorithmVisualCatalog).toHaveLength(12);
    expect(new Set(algorithmVisualCatalog.map((v) => v.id)).size).toBe(12);
    for (const item of algorithmVisualCatalog) {
      expect(item.steps.length).toBeGreaterThanOrEqual(3);
      expect(item.steps.length).toBeLessThanOrEqual(5);
      expect(item.prediction.options).toHaveLength(2);
      expect(item.prediction.correct).toBeLessThan(2);
      expect(item.takeaway.length).toBeGreaterThan(35);
      for (const s of item.steps) {
        expect(s.formula).toBeTruthy();
        expect(s.terms.length).toBeGreaterThan(0);
      }
    }
  });
  it('keeps the small client fixtures equal to their canonical numerical exercises', () => {
    for (const [id, givens] of Object.entries(algorithmVisualGivens)) {
      expect(givens, id).toEqual(exercises.find((e) => e.id === id)!.givens);
    }
  });
  it('focuses only matching exercise steps and retains deliberate section defaults', () => {
    expect(visualStepIndex('logistic-regression', 'EL')).toBe(3);
    expect(visualStepIndex('reinforcement-learning', 'terminal')).toBe(1);
    expect(visualStepIndex('k-means', undefined, 'measures')).toBe(4);
    expect(visualStepIndex('rag', 'unknown')).toBe(0);
  });
  it('accepts fresh parent-provided practice givens without mutating them', () => {
    for (const visual of algorithmVisualCatalog) {
      const g = variant(visual.exercise, algorithmVisualGivens[visual.exercise], 37);
      const before = structuredClone(g);
      const result = algorithmValues(visual.slug, g);
      expect(g).toEqual(before);
      for (const value of Object.values(result).flat())
        if (typeof value === 'number') expect(Number.isFinite(value), visual.slug).toBe(true);
    }
  });
});

describe('Mechanism calculations and financial interpretations', () => {
  it('adds the exact logistic feature contributions while keeping policy downstream', () => {
    const g = algorithmVisualGivens.A01;
    const original = algorithmValues('logistic-regression', g);
    expect(logisticContributions(g).reduce((s, c) => s + c.value, 0)).toBeCloseTo(
      Number(original.z),
      12,
    );
    const changed = algorithmValues('logistic-regression', { ...g, threshold: 0.5 });
    expect(changed.p).toBe(original.p);
    expect(changed.EL).toBe(original.EL);
    expect(changed.decision).not.toBe(original.decision);
  });
  it('updates K-means centers and never increases the objective across completed updates', () => {
    const frames = kmeansFrames([0, 2, 3, 8, 10], [0, 3]);
    expect(frames.length).toBeGreaterThan(1);
    for (let i = 1; i < frames.length; i++)
      expect(frames[i].inertia).toBeLessThanOrEqual(frames[i - 1].inertia + 1e-10);
    const original = kmeansFrames([10, 20, 60, 70], [10, 60]);
    expect(original[0].next).toEqual([15, 65]);
    expect(original[0].inertia).toBe(100);
    expect(kmeansFrames([1, 2], [0, 100])[0].next).toEqual([1.5, 100]);
  });
  it('distinguishes DBSCAN core, border, and noise using an inclusive self-neighborhood', () => {
    const density = densityNeighborhoods(0.8);
    expect(density.labels[0]).toBe('core');
    expect(density.labels[3]).toBe('border');
    expect(density.labels[7]).toBe('noise');
    density.neighbors.forEach((neighbors, i) => expect(neighbors).toContain(i));
  });
  it('preserves graph components, degrees, and normalized PageRank mass', () => {
    const a = graphMetrics(0),
      d = graphMetrics(5);
    expect(a.component).toEqual([0, 1, 2, 3, 4]);
    expect(d.component).toEqual([5, 6]);
    expect(graphMetrics(2).degree).toBe(2);
    expect(a.ranks.reduce((sum, x) => sum + x, 0)).toBeCloseTo(1, 10);
    const historical = graphMetrics(
      0,
      graphEdges.filter((_, i) => i !== 2 && i !== 3),
    );
    expect(historical.component).toEqual([0, 1, 2]);
    expect(historical.ranks.reduce((sum, x) => sum + x, 0)).toBeCloseTo(1, 10);
  });
  it('repeats only the last observed season beyond one forecast period', () => {
    const history = [9, 100, 105, 120, 130, 125, 90, 80];
    const future = seasonalNaive(history, 7, 28);
    expect(future).toHaveLength(28);
    expect(future.slice(0, 7)).toEqual(history.slice(-7));
    expect(future[14]).toBe(100);
    expect(seasonalNaive([1, 2], 7, 28)).toEqual([]);
  });
  it('reports no feasible portfolio rather than labeling the first choice an optimum', () => {
    const normal = portfolioPoints(algorithmVisualGivens.A10);
    expect(normal.map((p) => p.feasible)).toEqual([false, true, true]);
    expect(
      [...normal.filter((p) => p.feasible)].sort((a, b) => a.variance - b.variance)[0].weight,
    ).toBe(0.5);
    expect(
      portfolioPoints({ ...algorithmVisualGivens.A10, minimum: 0.15 }).filter((p) => p.feasible),
    ).toEqual([]);
  });
  it('a valid correlation stress changes risk without changing return or feasibility', () => {
    const base = portfolioPoints(algorithmVisualGivens.A10),
      stress = portfolioPoints(algorithmVisualGivens.A10, 0.8);
    base.forEach((p, i) => {
      expect(stress[i].expectedReturn).toBe(p.expectedReturn);
      expect(stress[i].feasible).toBe(p.feasible);
      expect(stress[i].variance).toBeGreaterThan(p.variance);
    });
  });
  it('keeps default marginals and expected loss fixed while dependence changes the tail', () => {
    const g = algorithmVisualGivens.A12;
    const independent = exactLoanDistribution(g),
      shared = exactLoanDistribution(g, true);
    expect(independent.probabilities.reduce((s, x) => s + x, 0)).toBeCloseTo(1);
    expect(shared.probabilities.reduce((s, x) => s + x, 0)).toBeCloseTo(1);
    expect(independent.mean).toBeCloseTo(2000);
    expect(shared.mean).toBeCloseTo(independent.mean);
    expect(independent.breach).toBeCloseTo(0.04);
    expect(shared.breach).toBeCloseTo(0.2);
  });
  it('handles strict reserve boundaries and exact discrete 5% tail mass', () => {
    const g = algorithmVisualGivens.A12;
    expect(exactLoanDistribution({ ...g, reserve: 0 }).breach).toBeCloseTo(0.36);
    expect(exactLoanDistribution({ ...g, reserve: 10000 }).breach).toBe(0);
    expect(exactLoanDistribution(g).valueAtRisk).toBe(5000);
    expect(exactLoanDistribution(g).expectedShortfall).toBeCloseTo(9000);
  });
  it('uses deterministic independent draws and converges near the analytical two-loan model', () => {
    const g = algorithmVisualGivens.A12;
    const simulation = simulateLoanLosses(g, 10000);
    expect(simulation).toEqual(simulateLoanLosses(g, 10000));
    expect(simulation.counts.reduce((s, x) => s + x, 0)).toBe(10000);
    expect(Math.abs(simulation.mean - exactLoanDistribution(g).mean)).toBeLessThan(120);
    expect(Math.abs(simulation.breach - 0.04)).toBeLessThan(0.012);
    expect(simulation.checkpoints.at(-1)?.mean).toBe(simulation.mean);
    expect(simulateLoanLosses({ ...g, reserve: 10000 }, 1000).breach).toBe(0);
  });
  it('retains meaningful named-method coverage beyond the twelve unit names', () => {
    expect(algorithmVisuals['k-means'].methods.join(' ')).toContain('DBSCAN');
    expect(algorithmVisuals['time-series'].methods.join(' ')).toMatch(/SARIMA.*GARCH/);
    expect(algorithmVisuals['graph-methods'].methods.join(' ')).toMatch(/PageRank.*GNN/);
    expect(algorithmVisuals['gradient-boosting'].methods.join(' ')).toContain('CatBoost');
    expect(algorithmVisuals['reinforcement-learning'].methods.join(' ')).toContain('VWAP');
  });
});
