import { describe, expect, it } from 'vitest';
import labs from '../src/data/labs.json';
import {
  hasRunError,
  labPresentation,
  parseRun,
  PREVIEW_MARKER,
  withDataPreview,
} from '../src/components/python/lab-presentation';
import { defenseExamples } from '../src/components/exercise/defense-examples';

describe('guided lab presentation', () => {
  it('provides accurate setup, questions and reasoning support for every existing lab', () => {
    for (const slug of Object.keys(labs)) {
      expect(labPresentation[slug]?.question).toMatch(/\?$/);
      expect(labPresentation[slug]?.preview.rows.length).toBeGreaterThan(0);
      expect(labPresentation[slug]?.metrics.length).toBeGreaterThan(0);
      expect(defenseExamples[slug]?.limit).toBeTruthy();
    }
  });
  it('extracts comparable metrics without mistaking a displayed array for a scalar', () => {
    const result = parseRun(
      'logistic-regression',
      'ROC-AUC: 0.91\nBrier: 0.052\nBaseline Brier: 0.09\nFirst five PDs: [0.2 0.3 0.4]\n',
    );
    expect(result.metrics.map(({ label, value }) => [label, value])).toEqual([
      ['ROC-AUC', 0.91],
      ['Brier', 0.052],
      ['Baseline Brier', 0.09],
    ]);
    expect(result.stdout).toContain('First five PDs');
  });
  it('distinguishes models when two metrics share an output line', () => {
    const result = parseRun(
      'gradient-boosting',
      'logit AUC: 0.91 Brier: 0.04\nboost AUC: 0.92 Brier: 0.03\n',
    );
    expect(result.metrics.map((item) => item.value)).toEqual([0.91, 0.92, 0.04, 0.03]);
  });
  it('handles scientific notation, negative reward, and cost labels', () => {
    expect(
      parseRun(
        'reinforcement-learning',
        'Reward: -1.2e-3\nDeterministic evaluation cost: 0.0012\nTWAP baseline cost: 0.8',
      ).metrics.map((m) => m.value),
    ).toEqual([0.0012, 0.8, -0.0012]);
    expect(parseRun('monte-carlo', 'P(loss > $200k): 0.012\n').metrics[0].value).toBe(0.012);
  });
  it('extracts and validates actual runtime input rows without leaking metadata into output', () => {
    const preview = { caption: 'First row', columns: ['Feature', 'Label'], rows: [['1.2', '0']] };
    const result = parseRun(
      'logistic-regression',
      `ROC-AUC: 0.9\n${PREVIEW_MARKER}${JSON.stringify(preview)}\n`,
    );
    expect(result.preview).toEqual(preview);
    expect(result.stdout).not.toContain(PREVIEW_MARKER);
    expect(parseRun('logistic-regression', `${PREVIEW_MARKER}{not json}`).preview).toBeUndefined();
    expect(
      parseRun(
        'logistic-regression',
        `${PREVIEW_MARKER}${JSON.stringify({ ...preview, rows: [['bad width']] })}`,
      ).preview,
    ).toBeUndefined();
  });
  it('adds read-only inspection after original code and tolerates renamed data variables', () => {
    const code = 'print("baseline")\n';
    const result = withDataPreview(code, 'logistic-regression');
    expect(result.startsWith(code)).toBe(true);
    expect(result).toContain('except Exception:\n    pass');
    expect(result).not.toContain('model.fit');
    expect(withDataPreview(code, 'unknown')).toBe(code);
  });
  it('keeps non-fatal warnings distinct from failures', () => {
    expect(
      hasRunError('ConvergenceWarning: Maximum Likelihood optimization failed to converge.'),
    ).toBe(false);
    expect(hasRunError('Traceback (most recent call last):\nValueError: invalid input')).toBe(true);
    expect(hasRunError('PythonError: SyntaxError: invalid syntax')).toBe(true);
    expect(hasRunError('Error: Worker cannot load script')).toBe(true);
  });
});
