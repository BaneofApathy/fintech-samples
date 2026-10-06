import { describe, expect, it } from 'vitest';
import course from '../src/data/course.json';
import {
  financialCases,
  financialCaseHref,
  financialCasesForAlgorithm,
} from '../src/data/financial-cases';

const scenario = (algorithm: string, application: number) =>
  financialCases.find(
    (item) => item.algorithmSlug === algorithm && item.sourceRef.application === application,
  )!;
const values = (algorithm: string, application: number) =>
  scenario(algorithm, application).frames.map((frame) => frame.metric.value);
const row = (algorithm: string, application: number, state: number, label: string) =>
  scenario(algorithm, application).frames[state].rows.find((item) => item.label === label)!.value;

describe('Financial application coverage', () => {
  it('preserves all 96 distinct application appearances and source-map positions', () => {
    expect(financialCases).toHaveLength(96);
    expect(new Set(financialCases.map((item) => item.visualId)).size).toBe(96);
    expect(new Set(financialCases.map((item) => financialCaseHref(item, '/'))).size).toBe(96);
    for (const algorithm of course.algorithms) {
      const cases = financialCasesForAlgorithm(algorithm.slug);
      expect(cases).toHaveLength(8);
      expect(cases.map((item) => item.sourceRef.application)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      for (const item of cases) expect(item.sourceRef.page).toBe(algorithm.primerSlides[3].page);
    }
  });

  it('provides three meaningful states with data, units, people, comparisons, and non-text visual change', () => {
    for (const item of financialCases) {
      expect(item.owner.length, item.visualId).toBeGreaterThan(5);
      expect(item.timing.length, item.visualId).toBeGreaterThan(30);
      expect(item.baseline.length, item.visualId).toBeGreaterThan(30);
      expect(item.takeaway.length, item.visualId).toBeGreaterThan(30);
      expect(item.frames, item.visualId).toHaveLength(3);
      expect(new Set(item.frames.map((frame) => frame.label)).size, item.visualId).toBe(3);
      const scenes = item.frames.map((frame) =>
        JSON.stringify(frame.marks.filter((mark) => mark.kind !== 'text')),
      );
      expect(new Set(scenes).size, item.visualId).toBeGreaterThan(1);
      for (const frame of item.frames) {
        expect(Number.isFinite(frame.metric.value), item.visualId).toBe(true);
        expect(frame.metric.unit.length, item.visualId).toBeGreaterThan(0);
        expect(frame.metric.denominator.length, item.visualId).toBeGreaterThan(5);
        expect(frame.rows.length, item.visualId).toBeGreaterThan(1);
        for (const mark of frame.marks) {
          for (const [key, value] of Object.entries(mark)) {
            if (typeof value === 'number')
              expect(Number.isFinite(value), `${item.visualId}/${key}`).toBe(true);
          }
          if (mark.kind === 'rect') {
            expect(mark.width, item.visualId).toBeGreaterThanOrEqual(0);
            expect(mark.height, item.visualId).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it('keeps links valid under a deployment prefix without importing course data into the renderer', () => {
    const first = financialCases[0];
    expect(financialCaseHref(first, '/course/')).toBe(
      `/course/financial-problems/${first.algorithmSlug}/${first.slug}/`,
    );
    expect(financialCaseHref(first, '/')).toBe(
      `/financial-problems/${first.algorithmSlug}/${first.slug}/`,
    );
    for (const item of financialCases)
      for (const slug of item.measureSlugs)
        expect(
          course.measures.some((measure) => measure.slug === slug),
          `${item.visualId}: ${slug}`,
        ).toBe(true);
  });
});

describe('Financial consequences, independently checked arithmetic', () => {
  it('separates outcome windows, action cutoffs, and expected-receipt objectives', () => {
    expect(values('logistic-regression', 1)).toEqual([2, 5, 9]);
    const windowCase = scenario('logistic-regression', 1);
    expect(windowCase.frames.map((frame) => frame.caption)).toEqual([
      expect.stringContaining('By 3 months, 2 have defaulted'),
      expect.stringContaining('By 6 months, 5 have defaulted'),
      expect.stringContaining('By 12 months, 9 have defaulted'),
    ]);
    expect(windowCase.frames[0].caption).not.toContain('5, and 9');
    expect(windowCase.frames[2].result).toContain('small example');
    expect(values('logistic-regression', 2)).toEqual([1, 0, 0]);
    expect(values('logistic-regression', 5)).toEqual([0.8 * 100, 0.2 * 2000, 0.5 * 400]);
    expect(row('logistic-regression', 5, 1, 'Rank')).toBe('C → B → A');
    expect(values('logistic-regression', 7)).toEqual([90, 60, 30]);
  });
  it('checks fair model comparisons and changing evaluation objectives', () => {
    expect(values('gradient-boosting', 1)).toEqual([10 - 8, 12 - 9, 15 - 17]);
    expect(values('gradient-boosting', 3)[0]).toBeCloseTo(0.3);
    expect(values('gradient-boosting', 3)[2]).toBeCloseTo(0.8);
    expect(values('gradient-boosting', 5)).toEqual([80, 400, 200]);
    expect(values('gradient-boosting', 6)).toEqual([8, 4, 2]);
    expect(values('gradient-boosting', 7)).toEqual([160, 180, 220]);
  });
  it('preserves scale invariance and distinguishes missing, duplicate, and wrong amounts', () => {
    expect(values('k-means', 6)).toEqual([0, 4, 4]);
    expect(values('isolation-forest', 8)).toEqual([
      Math.abs(600 - 400),
      Math.abs(600 - 900),
      Math.abs(600 - 570),
    ]);
  });
  it('carries queues through time and distinguishes mix from volume', () => {
    expect(values('time-series', 2)).toEqual([60, 20, 0]);
    expect(values('time-series', 5)).toEqual([40, 0, 40]);
    expect(values('time-series', 6)).toEqual([200, 500, 800]);
    expect(values('time-series', 7)).toEqual([-40, 40, 30]);
    const queueCase = financialCases.find((item) => item.visualId === 'time-series-payment-transaction-volume')!;
    expect(queueCase.frames.map((frame) => frame.result)).toEqual([
      expect.stringContaining('backlog is 0, 40, 60'),
      expect.stringContaining('backlog is 0, 20, 20'),
      expect.stringContaining('backlog is 0, 0, 0'),
    ]);
    expect(queueCase.frames[1].result).not.toContain('capacity is 80');
    const cashCase = financialCases.find((item) => item.visualId === 'time-series-deposit-and-withdrawal-demand')!;
    expect(cashCase.frames.map((frame) => frame.result)).toEqual([
      expect.stringContaining('$70k'),
      expect.stringContaining('$30k'),
      expect.stringContaining('−$30k'),
    ]);
  });
  it('uses directed-path arrivals rather than double-counting intermediary transfers', () => {
    expect(values('graph-methods', 3)).toEqual([90, 180, 90 + 180]);
    expect(values('graph-methods', 6)).toEqual([0, 15, 30]);
    expect(values('graph-methods', 8)).toEqual([0, 1, 1]);
  });
  it('respects missing evidence, exception dates, and matching governance versions', () => {
    expect(values('transformers', 3)).toEqual([3, 2, 1]);
    expect(values('transformers', 4)).toEqual([3 - 3.5, 4 - 3.5, 3 - 3.5]);
    expect(values('rag', 5)).toEqual([0, 1, 1]);
    expect(values('rag', 8)).toEqual([4, 3, 1]);
  });
  it('checks feasibility and converts basis points to routing dollars', () => {
    expect(values('optimization', 1)).toEqual([4, 2, 0]);
    expect(values('optimization', 2)).toEqual([0, 0, 5]);
    expect(values('optimization', 3)[0]).toBeCloseTo(20 * 0.1 + 80 * 0.06);
    expect(values('optimization', 3)[2]).toBeCloseTo(40 * 0.1 + 60 * 0.06);
    values('optimization', 4).forEach((value, i) => expect(value).toBeCloseTo([10, 18, 26][i]));
    expect(values('optimization', 5)).toEqual([100, 90, 75]);
    expect(values('optimization', 6)).toEqual([0, 5, 20]);
    const returnCase = financialCases.find((item) => item.visualId === 'optimization-portfolio-construction')!;
    expect(returnCase.frames.map((frame) => frame.metric.value)).toEqual([4, 2, 0]);
    expect(returnCase.frames[0].result).toContain('5% estimated return with 4% estimated volatility');
    expect(returnCase.frames[0].result).not.toContain('4% estimated return');
    expect(returnCase.frames[1].result).toContain('8% estimated return with 13% estimated volatility');
    expect(returnCase.frames[2].result).toContain('No candidate meets it');
  });
  it('accounts for sequential execution costs, blocked actions, and temporary cash shortfalls', () => {
    expect(values('reinforcement-learning', 1)).toEqual([2.5, 5, 2]);
    expect(values('reinforcement-learning', 2)).toEqual([10, 0, -10]);
    expect(values('reinforcement-learning', 3)).toEqual([0, 0, 1]);
    expect(values('reinforcement-learning', 6)[0]).toBeCloseTo(100);
    expect(row('reinforcement-learning', 6, 2, 'Applied limit')).toBe('40');
    expect(values('reinforcement-learning', 8)).toEqual([5, 10, -5]);
  });
  it('keeps expected loss constant while changing tails and applies payoff discounting', () => {
    expect(values('monte-carlo', 1)).toEqual([0, 10, 20]);
    for (let i = 0; i < 3; i++) expect(row('monte-carlo', 1, i, 'Mean loss')).toBe('10');
    expect(values('monte-carlo', 2)).toEqual([(6 + 7 + 10 + 20) / 4, (10 + 20) / 2, 20]);
    expect(values('monte-carlo', 3)[0]).toBeCloseTo(((0 + 10 + 30) / 3) * 0.95);
    expect(values('monte-carlo', 4)[0]).toBe(0);
    expect(values('monte-carlo', 4)[1]).toBeCloseTo(200 / 3);
    expect(values('monte-carlo', 5)).toEqual([20, 0, -20]);
    expect(values('monte-carlo', 7)[2]).toBeCloseTo(200 / 3);
    expect(values('monte-carlo', 8)).toEqual([0, 25, 50]);
  });

  it('describes each liquidity buffer outcome with clear negative-dollar notation', () => {
    const bufferCase = financialCases.find((item) => item.visualId === 'time-series-cash-flow-and-liquidity-forecasting')!;
    expect(bufferCase.frames.map((frame) => frame.result)).toEqual([
      expect.stringContaining('−$15m'),
      expect.stringContaining('−$5m'),
      expect.stringContaining('$10m'),
    ]);
    expect(bufferCase.frames[0].result).not.toContain('$-15m');
  });
});
