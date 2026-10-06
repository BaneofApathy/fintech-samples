import { describe, expect, it } from 'vitest';
import { exercises } from '../src/data';
import { widgets } from '../src/components/widgets/catalog';
import { widgetValues } from '../src/components/widgets/calculations';
import {
  signedChartDomain,
  widgetDefaults,
  widgetGuides,
  widgetInterpretation,
} from '../src/components/widgets/guidance';

const exercise = (id: string) => exercises.find((item) => item.id === id)!;

describe('Guided explorer learning contracts', () => {
  for (const widget of widgets) {
    it(`${widget.id} exposes usable controls, results, and interpretation`, () => {
      const e = exercise(widget.exercise);
      const guide = widgetGuides[widget.id];
      const output = widgetValues(widget.id, e.id, e.givens, widgetDefaults);
      expect(guide.primaryControls.length).toBeGreaterThanOrEqual(1);
      expect(guide.primaryControls.length).toBeLessThanOrEqual(2);
      expect(guide.primaryResults.length).toBeGreaterThanOrEqual(2);
      expect(guide.primaryResults.length).toBeLessThanOrEqual(3);
      for (const key of guide.primaryControls) {
        expect(
          key.startsWith('extra.') ? key.slice(6) in widgetDefaults : key in e.givens,
          key,
        ).toBe(true);
      }
      for (const key of guide.primaryResults) expect(output[key], key).toBeDefined();
      const interpretation = widgetInterpretation(widget.id, e.givens, output, widgetDefaults);
      expect(interpretation).not.toMatch(/undefined|NaN|Infinity/);
      expect(interpretation.length).toBeGreaterThan(60);
    });
  }

  it('raising only the loan review threshold changes the action, not estimated risk or loss', () => {
    const e = exercise('A01');
    const baseline = widgetValues('sigmoid-el', e.id, e.givens, widgetDefaults);
    const nextGivens = { ...e.givens, threshold: 0.12 };
    const next = widgetValues('sigmoid-el', e.id, nextGivens, widgetDefaults);
    expect(baseline.decision).toBe(true);
    expect(next.decision).toBe(false);
    expect(next.p).toBe(baseline.p);
    expect(next.EL).toBe(baseline.EL);
    expect(widgetInterpretation('sigmoid-el', nextGivens, next, widgetDefaults)).toContain(
      'below the review threshold',
    );
    expect(e.givens.threshold).toBe(0.08);
  });

  it('explains the confusion matrix counts and the two different rate denominators', () => {
    const e = exercise('M01');
    const values = widgetValues('confusion-builder', e.id, e.givens, widgetDefaults);
    const explanation = widgetInterpretation('confusion-builder', e.givens, values, widgetDefaults);
    expect(explanation).toContain('actual frauds were caught');
    expect(explanation).toContain('of flagged transactions that were fraud');
    expect(explanation).toContain('of all actual fraud that was caught');
    expect(explanation).toContain('not calibrated probabilities');
    expect(widgetGuides['confusion-builder'].experiment).toContain('keeping the total alerts and actual fraud count fixed');
    expect(widgetGuides['confusion-builder'].prediction).toContain('frauds among alerts');
    const changed = widgetValues('confusion-builder', e.id, { ...e.givens, caught: 16 }, widgetDefaults);
    expect(changed.TP).toBe(16);
    expect(changed.FP).toBe(34);
    expect(changed.FN).toBe(4);
    expect(changed.precision).toBeCloseTo(0.32);
    expect(changed.recall).toBeCloseTo(0.8);
  });

  it('reports fairness rate gaps in percentage points, not relative percent', () => {
    const e = exercise('M19');
    const values = widgetValues('fairness-rates', e.id, e.givens, widgetDefaults);
    const explanation = widgetInterpretation('fairness-rates', e.givens, values, widgetDefaults);
    expect(explanation).toContain('percentage points');
    expect(explanation).toContain('10.0 percentage points');
    expect(explanation).not.toContain('gap is 10%');
  });

  it('widening forecast intervals increases coverage without changing point accuracy', () => {
    const e = exercise('M20');
    const narrow = widgetValues('forecast-eval', e.id, e.givens, { ...widgetDefaults, width: 5 });
    const wide = widgetValues('forecast-eval', e.id, e.givens, { ...widgetDefaults, width: 60 });
    expect(Number(wide.coverage)).toBeGreaterThan(Number(narrow.coverage));
    expect(wide.MAE).toBe(narrow.MAE);
    expect(wide.intervalWidth).toBe(120);
    expect(narrow.intervalWidth).toBe(10);
  });

  it('adding analysts changes human capacity without changing API capacity', () => {
    const e = exercise('M39b');
    const baseline = widgetValues('ops-budget', e.id, e.givens, widgetDefaults);
    const updated = widgetValues('ops-budget', e.id, { ...e.givens, analysts: 25 }, widgetDefaults);
    expect(Number(updated.dailyBacklog)).toBeLessThan(Number(baseline.dailyBacklog));
    expect(updated.capacity).toBe(baseline.capacity);
    expect(updated.requestBacklog).toBe(baseline.requestBacklog);
  });
});

describe('Signed chart scale', () => {
  it('retains a visible zero baseline for negative Q-values', () => {
    const [low, high] = signedChartDomain([-5, -2.9, -3.95, -4.2]);
    expect(low).toBeLessThan(-5);
    expect(high).toBe(0);
  });
  it('keeps positive and negative values on opposite sides of zero', () => {
    const [low, high] = signedChartDomain([-2, 3]);
    expect(low).toBeLessThan(-2);
    expect(high).toBeGreaterThan(3);
  });
  it('gives all-zero results a finite nonzero range', () => {
    expect(signedChartDomain([0, 0])).toEqual([0, 1]);
  });
});
