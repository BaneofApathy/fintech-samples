import { describe, expect, it } from 'vitest';
import raw from '../src/data/course.json';
import { applyExerciseCopy, exerciseCopies, exerciseSummary } from '../src/engine/exercise-copy';
import { checkpointQuestions } from '../src/engine/checkpoint-questions';
import { feedback } from '../src/engine/feedback';
import { format } from '../src/engine/check';
import { variant } from '../src/engine/variants';
import { solve } from '../src/engine/solve/core';
import type { Exercise } from '../src/engine/types';

const fresh = (id: string) =>
  applyExerciseCopy(structuredClone(raw.exercises.find((e) => e.id === id)) as unknown as Exercise);

describe('authored exercise copy', () => {
  it('covers every exercise, input and step without a shared-ID fallback', () => {
    expect(Object.keys(exerciseCopies).sort()).toEqual(raw.exercises.map((e) => e.id).sort());
    expect(raw.exercises.reduce((count, e) => count + e.steps.length, 0)).toBe(322);
    for (const original of raw.exercises) {
      const copy = exerciseCopies[original.id];
      expect(Object.keys(copy.labels).sort(), original.id).toEqual(
        Object.keys(original.givens).sort(),
      );
      expect(Object.keys(copy.steps).sort(), original.id).toEqual(
        original.steps.map((s) => s.id).sort(),
      );
      for (const step of Object.values(copy.steps)) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.hints.join(' ')).not.toMatch(
          /Identify the inputs in the formula above|Use the local symbol key|Negate the score in the exponential/,
        );
      }
      expect(copy.readAloud.length, original.id).toBeGreaterThan(0);
      expect(copy.workedExplanation.length, original.id).toBeGreaterThan(0);
      expect(copy.workedArithmetic.length, original.id).toBeGreaterThan(0);
      expect(copy.workedArithmetic.join(' '), original.id).not.toMatch(
        /[\u0000-\u001f]|<pre|Worked solution —/,
      );
    }
  });

  it('updates presentation in place while preserving numerical and storage contracts', () => {
    const original = structuredClone(
      raw.exercises.find((e) => e.id === 'M07'),
    ) as unknown as Exercise;
    const contracts = {
      id: original.id,
      givens: original.givens,
      latex: original.latex,
      deckSolution: original.deckSolution,
      source: original.source,
      stepIds: original.steps.map((s) => s.id),
    };
    expect(applyExerciseCopy(original)).toBe(original);
    expect(original.givens).toBe(contracts.givens);
    expect(original.latex).toBe(contracts.latex);
    expect(original.deckSolution).toBe(contracts.deckSolution);
    expect(original.source).toBe(contracts.source);
    expect(original.id).toBe(contracts.id);
    expect(original.steps.map((s) => s.id)).toEqual(contracts.stepIds);
  });

  it('keeps overlapping step IDs in their mathematical context', () => {
    const title = (id: string, step: string) => fresh(id).steps.find((s) => s.id === step)!.title;
    expect(title('A03', 'F1')).toBe('Score after tree 1');
    expect(title('M07', 'F1')).toBe('F1 score');
    expect(title('M13', 'gain')).toBe('Cumulative gain');
    expect(title('M18', 'weighted')).toBe('Support-weighted F1');
    expect(title('A08', 'decision')).toBe('Assign a label automatically?');
    expect(title('A11', 'decision')).toBe('Does the greedy policy choose buy now?');
    expect(fresh('M34').steps[0].hints[0]).toContain('breach runs');
  });

  it('resolves every result summary from the active solver output across seeded variants', () => {
    for (const original of raw.exercises) {
      const e = fresh(original.id);
      for (const seed of [0, 1, 4, 19]) {
        const givens = seed === 0 ? e.givens : variant(e.id, e.givens, seed);
        const summary = exerciseSummary(e, solve(e.id, givens));
        expect(summary, `${e.id} seed ${seed}`).not.toMatch(/\{\w+\}|undefined|NaN/);
      }
    }
  });

  it('does not repeat original worked answers in the practice interpretation', () => {
    for (const id of ['A01', 'M25', 'M31']) {
      const e = fresh(id);
      const result = solve(id, variant(id, e.givens, 1));
      const summary = exerciseSummary(e, result);
      const key = id === 'A01' ? 'EL' : id === 'M25' ? 'ratio' : 'sortinoA';
      expect(summary).toContain(format(result[key], exerciseCopies[id].steps[key].unit));
      if (id === 'A01') expect(summary).not.toContain('$399');
      if (id === 'M25') expect(summary).not.toContain('19');
      if (id === 'M31') expect(exerciseCopies[id].interpretation).not.toMatch(/same ratio|tie/);
    }
  });

  it('explains a DTI scale mistake using the displayed variant rather than fixed 35', () => {
    const e = fresh('A01');
    const g = variant(e.id, e.givens, 1);
    const step = e.steps.find((s) => s.id === 'z')!;
    const wrong = solve(e.id, { ...g, DTI: Number(g.DTI) / 100 }).z;
    const answer = feedback(e.id, step, wrong, solve(e.id, g).z, g);
    expect(answer.pattern).toBe('DTI-fraction');
    expect(answer.message).toContain(`Use ${g.DTI} in this model`);
    expect(answer.message).not.toContain('Use 35');
  });

  it('explains expected-cost assumptions and why cost and review capacity are separate', () => {
    const thresholds = fresh('M17a');
    expect(exerciseCopies.M17a.scenario).toContain('false negative (FN)');
    expect(exerciseCopies.M17a.scenario).toContain('false positive (FP)');
    expect(exerciseCopies.M17a.interpretation).toContain('larger than the team can review');
    const reviewed = solve('M17a', thresholds.givens);
    expect(reviewed.volumeA).toBe(50);
    expect(reviewed.volumeB).toBe(100);
    expect(reviewed.excess).toBe(25);

    const cutoff = fresh('M17b');
    expect(exerciseCopies.M17b.scenario).toContain('among many comparable cases');
    expect(exerciseCopies.M17b.task).toContain('not a bill guaranteed for one transaction');
    expect(solve('M17b', cutoff.givens).threshold).toBeCloseTo(4 / 504);
  });

  it('distinguishes multiclass F1 averages and fairness gaps from ratios', () => {
    const multiclass = fresh('M18');
    expect(exerciseCopies.M18.scenario).toContain('each row is what a person actually wrote');
    expect(exerciseCopies.M18.interpretation).toContain('A high overall score can still hide a class');
    expect(solve('M18', multiclass.givens).macro).not.toBe(solve('M18', multiclass.givens).weighted);

    const fairness = fresh('M19');
    expect(exerciseCopies.M19.scenario).toContain('real lender usually cannot observe repayment');
    expect(exerciseCopies.M19.steps.gap.explanation).toContain('percentage-point gap');
    expect(solve('M19', fairness.givens).gap).toBeCloseTo(0.1);
    expect(exerciseCopies.M19.workedArithmetic[1]).toContain('10 percentage points');
  });

  it('explains forecast-error denominators, signed misses, and R-squared limits', () => {
    expect(exerciseCopies.M20.scenario).toContain('simpler reference forecast, called the baseline');
    expect(exerciseCopies.M21.scenario).toContain('negative error means the forecast was too low');
    expect(exerciseCopies.M22.scenario).toContain('separate earlier training history');
    expect(exerciseCopies.M22.interpretation).toContain('MAPE is undefined if an actual is zero');
    expect(exerciseCopies.M23.task).toContain('not a future forecast known to treasury');
    expect(solve('M22', fresh('M22').givens).MASE).toBeCloseTo(0.625);
    expect(solve('M23', fresh('M23').givens).R2).toBeCloseTo(0.7383, 3);
  });

  it('defines interval coverage and quantile scoring assumptions before calculation', () => {
    expect(exerciseCopies.M24.scenario).toContain('one sample can land above or below 90% by chance');
    expect(exerciseCopies.M24.task).toContain('average to get interval width');
    expect(exerciseCopies.M25.scenario).toContain('A 95th-percentile forecast');
    expect(exerciseCopies.M25.interpretation).toContain('not realized cash loss');
    expect(solve('M24', fresh('M24').givens).coverage).toBeCloseTo(0.8);
    expect(solve('M25', fresh('M25').givens).ratio).toBeCloseTo(19);
  });

  it('explains cluster-distance, inertia, and repeatability measures in context', () => {
    expect(exerciseCopies.M26.scenario).toContain('scaled so dollar amounts and percentages');
    expect(exerciseCopies.M27a.scenario).toContain('A centroid is each group’s average value');
    expect(exerciseCopies.M27a.task).toContain('more groups can always make a tighter fit');
    expect(exerciseCopies.M27b.task).toContain('chance-level agreement');
    expect(solve('M26', fresh('M26').givens).scores).toEqual([0.6, 0, -0.5]);
    expect(solve('M27b', fresh('M27b').givens).ARI).toBeDefined();
  });

  it('defines retrieval denominators, ranking rewards, and evidence audit counts', () => {
    expect(exerciseCopies.M28.scenario).toContain('Reviewers have already marked which passages contain the needed evidence');
    expect(exerciseCopies.M28.task).toContain('the useful share of returned passages');
    expect(exerciseCopies.M29a.scenario).toContain('rank 1 is first, rank 2 is second');
    expect(exerciseCopies.M29a.interpretation).toContain('ignores additional relevant passages');
    expect(exerciseCopies.M29b.interpretation).toContain('or the probability that an answer is correct');
    expect(exerciseCopies.M30.interpretation).toContain('all claims, claim–citation pairs, or financial figures');
    expect(solve('M29b', fresh('M29b').givens).nDCG).toBeCloseTo(0.7098, 3);
  });

  it('separates risk-adjusted ratios, peak loss, turnover, and tracking error', () => {
    expect(exerciseCopies.M31.scenario).toContain('supplied 3% reference rate');
    expect(exerciseCopies.M32a.scenario).toContain('highest value seen up to that date');
    expect(exerciseCopies.M32b.scenario).toContain('gross trading counts both the dollars sold and dollars bought');
    expect(exerciseCopies.M32c.interpretation).toContain('does not tell whether the fund outperformed');
    expect(solve('M31', fresh('M31').givens).sharpeA).toBeCloseTo(0.5);
    expect(solve('M32a', fresh('M32a').givens).MDD).toBeCloseTo(1 / 3);
    expect(solve('M32c', fresh('M32c').givens).annual).toBeCloseTo(0.04);
    expect(exerciseCopies.M32b.steps.gross.explanation).toContain('then double it to count both purchases and sales');
    expect(exerciseCopies.M32c.steps.monthly.explanation).toContain('one fewer than the number of periods');
  });
});

describe('unit checkpoint scenarios', () => {
  it('has three distinct explained scenarios for each of the twelve units', () => {
    expect(Object.keys(checkpointQuestions).sort()).toEqual(
      raw.algorithms.map((a) => a.slug).sort(),
    );
    const prompts: string[] = [];
    for (const questions of Object.values(checkpointQuestions)) {
      expect(questions).toHaveLength(3);
      for (const q of questions) {
        prompts.push(q.q);
        expect(new Set(q.choices).size).toBe(3);
        expect(q.choices[q.answer]).toBeTruthy();
        expect(q.explanation.length).toBeGreaterThan(35);
      }
    }
    expect(new Set(prompts).size).toBe(36);
    expect(prompts.join(' ')).not.toMatch(
      /Which use condition comes from this unit|What is required before deployment/,
    );
  });
});
