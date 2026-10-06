import { describe, it, expect } from 'vitest';
import { exercises } from '../src/data';
import { solve } from '../src/engine/solve/core';
import { near, check, parseNumber } from '../src/engine/check';
import { variant } from '../src/engine/variants';
import { widgets } from '../src/components/widgets/catalog';
import { widgetValues } from '../src/components/widgets/calculations';
describe('All 64 original numerical contracts', () => {
  for (const e of exercises) {
    it(`${e.id}: every deck answer`, () => {
      const actual = solve(e.id, e.givens);
      for (const [key, expected] of Object.entries(e.deckSolution)) {
        if (Array.isArray(expected)) {
          expect(actual[key], key).toHaveLength(expected.length);
          expected.forEach((n, i) =>
            expect(
              near(
                (actual[key] as number[])[i],
                n,
                e.steps.find((s) => s.id === key),
              ),
              key + ' cell ' + i,
            ).toBe(true),
          );
        } else if (typeof expected === 'number')
          expect(
            near(
              Number(actual[key]),
              expected,
              e.steps.find((s) => s.id === key),
            ),
            key + ': ' + actual[key] + ' vs ' + expected,
          ).toBe(true);
        else expect(actual[key], key).toEqual(expected);
      }
    });
    it(`${e.id}: stable seeded variants remain finite`, () => {
      for (let seed = 1; seed <= 10; seed++) {
        const g = variant(e.id, e.givens, seed);
        expect(g).toEqual(variant(e.id, e.givens, seed));
        for (const v of Object.values(solve(e.id, g))) {
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
          if (Array.isArray(v)) expect(v.every(Number.isFinite)).toBe(true);
        }
      }
    });
  }
});
describe('Checking student formats', () => {
  it('accepts percentages, currency, and fractions', () => {
    expect(check('9.98%', 0.09975).correct).toBe(true);
    expect(check('$399', 399).correct).toBe(true);
    expect(check('1/3', 1 / 3).correct).toBe(true);
    expect(parseNumber('0')).toBe(0);
    expect(check('', 0).correct).toBe(false);
  });
  it('reports wrong matrix cells', () => {
    expect(check(['15', '30', '5', '945'], [15, 35, 5, 945]).wrongCells).toEqual([1]);
  });
  it('checks negative Q-values', () => expect(check('-3.95', -3.95).correct).toBe(true));
});
describe('Widget default-state fidelity', () => {
  const extra = {
    beta: 2,
    threshold: 0.1,
    cFN: 4000,
    cFP: 450,
    cReview: 18,
    confident: 0,
    width: 20,
    tau: 0.95,
    reverse: 0,
    K: 2,
    account: 0,
    weight: 0.5,
    close: 50.3,
    paths: 2500,
    transactions: 50000000,
    unitCost: 0.003,
    iteration: 0,
  };
  for (const w of widgets)
    it(w.id, () => {
      const e = exercises.find((e) => e.id === w.exercise)!;
      const out = widgetValues(w.id, e.id, e.givens, extra);
      const core = solve(e.id, e.givens);
      if (w.id === 'threshold-explorer') {
        expect(out.AUC).toBeCloseTo(2 / 3);
        expect(out.expectedCost).toBe(1458);
        expect(out.TP).toBe(3);
        expect(out.FP).toBe(3);
      } else {
        for (const s of e.steps) {
          if (s.id in out) expect(out[s.id]).toEqual(core[s.id]);
        }
      }
      expect(Object.values(out).every((v) => typeof v !== 'number' || Number.isFinite(v))).toBe(
        true,
      );
    });
});
