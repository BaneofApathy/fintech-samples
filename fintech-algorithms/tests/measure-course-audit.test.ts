import { describe, expect, it } from 'vitest';
import { solve } from '../src/engine/solve/core';
import type { Givens } from '../src/engine/types';
import { diagnosticSeeds } from '../src/data/measure-course/diagnostics';
import { financeSeeds } from '../src/data/measure-course/finance';
import { classificationSeeds } from '../src/data/measure-course/classification';

// Independent hand-calculated fixtures validate the grouped worked traces,
// including constituent scores not covered by the single MCQ correct option.
type Fixture = {
  number: number;
  solver: string;
  givens: Givens;
  expected: Record<string, number | number[]>;
  trace: string[];
};
const fixtures: Fixture[] = [
  {
    number: 18,
    solver: 'M18',
    givens: { matrix: [8, 1, 1, 1, 3, 0, 2, 0, 0] },
    expected: {
      perClass: [16 / 21, 3 / 4, 0],
      macro: 127 / 252,
      weighted: 223 / 336,
      micro: 11 / 16,
      TP: 11,
      FP: 5,
      FN: 5,
    },
    trace: ['0.504', '0.6637', '0.6875'],
  },
  {
    number: 19,
    solver: 'M19',
    givens: { approvedA: 6, NA: 10, TPA: 6, repayA: 8, approvedB: 4, NB: 10, TPB: 3, repayB: 5 },
    expected: {
      selectionA: 0.6,
      selectionB: 0.4,
      ratio: 2 / 3,
      TPRA: 0.75,
      TPRB: 0.6,
      gap: 0.15,
      FPRA: 0,
      FPRB: 0.2,
    },
    trace: ['0.15', '0.20'],
  },
  {
    number: 22,
    solver: 'M22',
    givens: { actual: [10, 20], predicted: [12, 18], history: [5, 10, 15] },
    expected: { MAE: 2, MAPE: 0.15, WAPE: 2 / 15, MASE: 0.4, naiveScale: 5 },
    trace: ['0.15', '0.1333', '2/5=0.4'],
  },
  {
    number: 23,
    solver: 'M23',
    givens: { actual: [10, 20], predicted: [12, 18] },
    expected: { SSE: 8, SST: 50, R2: 0.84, actualMean: 15 },
    trace: ['25+25=50', '4+4=8', '0.84'],
  },
  {
    number: 24,
    solver: 'M24',
    givens: { lower: [9, 19, 25], upper: [11, 21, 29], actual: [10, 22, 27], widen: 1 },
    expected: { coverage: 2 / 3, width: 8 / 3, wideCoverage: 1, wideWidth: 14 / 3 },
    trace: ['8/3', '14/3', '3/3=100%'],
  },
  {
    number: 25,
    solver: 'M25',
    givens: { tau: 0.9, forecast: 20, actual: [30, 10, 20], equalError: 10 },
    expected: { losses: [9, 1, 0], average: 10 / 3, under: 9, over: 1, ratio: 9 },
    trace: ['.9×10=9', '.1×10=1', '10/3'],
  },
  {
    number: 26,
    solver: 'M26',
    givens: { a: [2, 4, 6], b: [5, 4, 3] },
    expected: { scores: [0.6, 0, -0.5], mean: 1 / 30 },
    trace: ['(5−2)/5=.6', '(3−6)/6=−.5', '.0333'],
  },
  {
    number: 27,
    solver: 'M27a',
    givens: { values: [1, 2, 8, 9] },
    expected: { c: 5, c1: 1.5, c2: 8.5, I1: 50, I2: 1 },
    trace: ['16+9+9+16=50', 'sum1'],
  },
  {
    number: 27,
    solver: 'M27b',
    givens: { overlap: [2, 1, 1, 2] },
    expected: { S: 2, R: 6, C: 6, T: 15, chance: 2.4, ARI: -1 / 9 },
    trace: ['T=choose(6,2)=15', '−1/9'],
  },
  {
    number: 28,
    solver: 'M28',
    givens: { found: [1, 1], relevant: [2, 1], K: 3 },
    expected: {
      recalls: [0.5, 1],
      precision: [1 / 3, 1 / 3],
      meanRecall: 0.75,
      meanPrecision: 1 / 3,
    },
    trace: ['(.5+1)/2=.75', 'total3=2/3'],
  },
  {
    number: 29,
    solver: 'M29a',
    givens: { ranks: [1, 2, 4, 0], newRank: 1 },
    expected: { RR: [1, 0.5, 0.25, 0], MRR: 0.4375 },
    trace: ['miss', '(1+.5+.25+0)/4=.4375'],
  },
  {
    number: 29,
    solver: 'M29b',
    givens: { grades: [1, 3, 0] },
    expected: { DCG: 5.416508275000202, IDCG: 7.630929753571458, nDCG: 0.7098097413968655 },
    trace: ['5.4165', '7.6309', '.7098'],
  },
  {
    number: 30,
    solver: 'M30',
    givens: {
      revenueNew: 120,
      revenueOld: 100,
      supported: 3,
      claims: 5,
      correctCitations: 2,
      citations: 4,
      correctFigures: 3,
      figures: 4,
    },
    expected: { growth: 0.2, faithfulness: 0.6, citation: 0.5, numerical: 0.75 },
    trace: ['claims=.60', 'pairs=.50', 'figures=.75', '=20%'],
  },
  {
    number: 31,
    solver: 'M31',
    givens: {
      returnA: 0.09,
      returnB: 0.11,
      rf: 0.03,
      volA: 0.12,
      volB: 0.2,
      downA: 0.06,
      downB: 0.08,
    },
    expected: { sharpeA: 0.5, sharpeB: 0.4, sortinoA: 1, sortinoB: 1 },
    trace: ['Sharpe=(.09−.03)/.12=.5', 'Sortino=.08/.08=1'],
  },
  {
    number: 32,
    solver: 'M32a',
    givens: { values: [100, 120, 90, 125] },
    expected: {
      peaks: [100, 120, 120, 125],
      drawdowns: [0, 0, 0.25, 0],
      MDD: 0.25,
      finalReturn: 0.25,
    },
    trace: ['drawdowns0,0,.25,0'],
  },
  {
    number: 32,
    solver: 'M32b',
    givens: {
      current: [0.6, 0.4],
      proposed: [0.4, 0.6],
      portfolio: 1e6,
      costRate: 0.001,
      alternative: [0.4, 0.6],
      cap: 1,
    },
    expected: { turnover: 0.2, gross: 400000, cost: 400 },
    trace: ['gross=$400k', 'gives$400'],
  },
  {
    number: 32,
    solver: 'M32c',
    givens: { fund: [0.01, -0.01, 0.01, -0.01], benchmark: [0, 0, 0, 0], periods: 12 },
    expected: { mean: 0, squares: 0.0004, monthly: 0.011547005383792516, annual: 0.04 },
    trace: ['√(.0004/3)=.011547', '.04annual'],
  },
  {
    number: 33,
    solver: 'M33',
    givens: { losses: [0, 1, 2, 3, 4, 5, 6, 7, 10, 20], confidence: 0.8 },
    expected: { VaR: 7, ES: 15, exceed: 0.2 },
    trace: ['L_(8)=7', 'ES=(10+20)/2=15', '2/10=.20'],
  },
  {
    number: 34,
    solver: 'M34',
    givens: { breaches: 10, N: 100, newN: 400 },
    expected: { p: 0.1, SE: 0.03, lower: 0.0412, upper: 0.1588, newSE: 0.015 },
    trace: ['[.0412,.1588]', '=.015'],
  },
  {
    number: 35,
    solver: 'M35',
    givens: { exceptions: 10, days: 250, confidence: 0.99 },
    expected: { observed: 0.04, nominal: 0.01, expected: 2.5, ratio: 4 },
    trace: ['250×.01=2.5', '.04/.01=4'],
  },
  {
    number: 36,
    solver: 'M36',
    givens: { costs: [300, 200, 400], baseline: 1200, hindsight: 700, notional: 1e6 },
    expected: { cost: 900, reward: -900, saving: 300, regret: 200, savingBps: 3, regretBps: 2 },
    trace: ['$900−$700=$200', '3bps', '2bps'],
  },
  {
    number: 37,
    solver: 'M37',
    givens: {
      completed: 90,
      tasks: 100,
      verified: 95,
      unsafe: 4,
      executed: 0,
      errors: 10,
      calls: 200,
    },
    expected: {
      success: 0.9,
      verification: 0.95,
      unsafeAttempt: 0.04,
      unsafeExecution: 0,
      toolError: 0.05,
    },
    trace: ['100=.95', '0executed/100=0', '10/200=.05'],
  },
  {
    number: 38,
    solver: 'M38',
    givens: { current: [0.2, 0.8], reference: [0.5, 0.5] },
    expected: {
      terms: [0.2748872195622465, 0.1410010887737207],
      PSI: 0.4158883083359672,
      shift: 0.3,
    },
    trace: ['.274887', '.141001', '.415888'],
  },
  {
    number: 39,
    solver: 'M39a',
    givens: { counts: [95, 4, 1], times: [40, 180, 1000], deadline: 100 },
    expected: { total: 5520, mean: 55.2, p95: 40, p99: 180, late: 0.05, onTime: 0.95 },
    trace: ['mean=55.2ms', 'p99rank99=180ms', '5/100over100ms=5%'],
  },
  {
    number: 39,
    solver: 'M39b',
    givens: {
      perMinute: 12000,
      analysts: 15,
      pace: 20,
      arrival: 250,
      minutes: 10,
      alerts: 500,
      days: 3,
    },
    expected: {
      capacity: 200,
      requestBacklog: 30000,
      human: 300,
      dailyBacklog: 200,
      alertBacklog: 600,
    },
    trace: ['50×600=30,000', '3days=600'],
  },
  {
    number: 39,
    solver: 'M39c',
    givens: { spend: 500, abstained: 100, reviewCost: 3, requests: 1000, autoCorrect: 800 },
    expected: {
      coverage: 0.9,
      reviewSpend: 300,
      totalCost: 800,
      perRequest: 0.8,
      correct: 900,
      perCorrect: 8 / 9,
      autoAccuracy: 8 / 9,
    },
    trace: ['model$500+100×$3=$800', '900total', '88.9%'],
  },
  {
    number: 39,
    solver: 'M39d',
    givens: { days: 30, objective: 0.999, downtime: 90 },
    expected: {
      scheduled: 43200,
      available: 43110,
      availability: 479 / 480,
      allowed: 43.2,
      excess: 46.8,
    },
    trace: ['99.7917%', 'allows43.2min', '46.8min'],
  },
];
const seeds = [...classificationSeeds, ...diagnosticSeeds, ...financeSeeds];
const compact = (text: string) => text.replace(/\s/g, '');

describe('independent grouped-measure worked-example audit', () => {
  for (const fixture of fixtures) {
    it(`${fixture.solver} all grouped numerical constituents agree with the authored trace`, () => {
      const result = solve(fixture.solver, fixture.givens);
      for (const [key, expected] of Object.entries(fixture.expected)) {
        if (Array.isArray(expected))
          expected.forEach((value, index) =>
            expect((result[key] as number[])[index], key).toBeCloseTo(value, 8),
          );
        else expect(result[key], key).toBeCloseTo(expected, 8);
      }
      const trace = compact(
        seeds
          .find((seed) => seed.number === fixture.number)!
          .trace.flat()
          .join(' '),
      );
      for (const marker of fixture.trace) expect(trace).toContain(compact(marker));
    });
  }
  it('uses all-period downside deviation and sample standard deviation distinctly', () => {
    const seed = seeds.find((seed) => seed.number === 31)!;
    const trace = compact(seed.trace.flat().join(' '));
    expect(Math.sqrt(0.0004 / 2)).toBeCloseTo(0.01414213562373095, 12);
    expect(Math.sqrt(0.0018 / (2 - 1))).toBeCloseTo(0.04242640687119285, 12);
    expect(trace).toContain('d=√(.0004/2)≈.01414');
    expect(trace).toContain('SD=√((.0009+.0009)/(2−1))≈.04243');
  });
  it('each authored distractor has its own misconception diagnosis before the shared correction', () => {
    for (const seed of seeds)
      for (const checks of [seed.mechanismChecks, seed.calculations, seed.applications])
        for (const check of checks) {
          const diagnoses = check.slice(3, 5).map((option) => option!.split('|')[1]);
          expect(diagnoses.every(Boolean), seed.title).toBe(true);
          expect(diagnoses[0], seed.title).not.toBe(diagnoses[1]);
        }
  });
});
