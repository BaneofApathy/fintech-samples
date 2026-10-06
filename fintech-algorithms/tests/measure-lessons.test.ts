import { describe, expect, it } from 'vitest';
import katex from 'katex';
import rawCourse from '../src/data/course.json';
import { applyMeasureLessons } from '../src/data/measure-lessons';
import { exerciseCopies } from '../src/engine/exercise-copy';
import {
  widgetNotice,
  widgetReadoutLabel,
  widgetReadoutUnit,
  widgets,
} from '../src/components/widgets/catalog';
import { widgetValues } from '../src/components/widgets/calculations';
import type { Givens } from '../src/engine/types';
import { solve } from '../src/engine/solve/core';
import { measureVisuals } from '../src/data/measure-visuals';
import { financialCases } from '../src/data/financial-cases';
import { visualRegistry } from '../src/data/visual-registry';

const defaults = {
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

function authoredCourse(): any {
  const course = structuredClone(rawCourse);
  applyMeasureLessons(course);
  return course;
}

describe('authored measure lessons', () => {
  it('defines group-rate denominators and states fairness differences in percentage points', () => {
    const fairness = measureVisuals.find((visual) => visual.number === 19)!;
    expect(fairness.takeaway).toContain('60% versus 50% is 10 points');
    const lesson = authoredCourse().measures.find((measure: any) => measure.number === 19)!;
    expect(lesson.financialInterpretation).toContain('percentage points');
    expect(lesson.lessonSections[0].blocks[3].text).toContain('not an 8% relative change');
  });

  it('gives the first three and ROC/ranking measure diagrams useful text descriptions', () => {
    expect(measureVisuals[0].textAlternative).toContain('true positive is a fraud correctly flagged');
    expect(measureVisuals[1].textAlternative).toContain('baseline that passes everyone');
    expect(measureVisuals[2].textAlternative).toContain('equal weighting is not the same');
    expect(measureVisuals[7].textAlternative).toContain('horizontal value is the share of legitimate transactions');
    expect(measureVisuals[8].textAlternative).toContain('AUC of 0.88 means the fraud score is higher');
    expect(measureVisuals[9].textAlternative).toContain('54 percentage-point gap');
    expect(measureVisuals[10].textAlternative).toContain('report which one you used');
    expect(measureVisuals[11].textAlternative).toContain('precision@K is the share of reviews');
    expect(measureVisuals[12].textAlternative).toContain('does not promise 15 times the profit');
    expect(measureVisuals[13].textAlternative).toContain('predicted 20% but observed 30%');
    expect(measureVisuals[14].textAlternative).toContain('does not isolate calibration');
    expect(measureVisuals[15].textAlternative).toContain('uses a 10⁻¹⁵ floor');
  });
  it('explains the meaning and evidence limits in every state of the two tree cases', () => {
    const underwriting = financialCases.find((item) => item.slug === 'credit-underwriting')!;
    expect(underwriting.frames[0].caption).toContain('Both applicants have 25% DTI');
    expect(underwriting.frames[1].result).toContain('A review is a request for human assessment');
    expect(underwriting.frames[2].result).toContain('Different routes do not prove who will repay');
    const claim = financialCases.find((item) => item.slug === 'claims-fraud')!;
    expect(new Set(claim.frames.map((frame) => frame.result)).size).toBe(3);
    expect(claim.frames[0].result).toContain('No supporting evidence has been checked');
    expect(claim.frames[1].result).toContain('provider confirmation is still pending');
    expect(claim.frames[2].rows.at(-1)?.value).toBe('Legitimate treatment confirmed');
  });
  it('explains threshold tradeoffs and policy-boundary changes with correct state counts', () => {
    const links = financialCases.find((item) => item.slug === 'entity-resolution-and-link-prediction')!;
    expect(links.frames.map((frame) => frame.metric.value)).toEqual([0, 1, 1]);
    expect(links.frames[0].result).toContain('Only the 0.95 pair meets this cutoff');
    expect(links.frames[1].result).toContain('one true match and one false match');
    expect(links.frames[2].result).toContain('two true matches and one false match');
    expect(links.frames[0].result).toContain('Similarity is a ranking score, not the chance');
    expect(links.frames[1].result).toContain('accepted pair remains a hypothesis');
    expect(links.frames[2].result).toContain('Similarity is not identity probability');
    const policy = financialCases.find((item) => item.slug === 'regulatory-change-triage')!;
    expect(policy.frames.map((frame) => frame.metric.value)).toEqual([2, 3, 1]);
    expect(policy.frames[0].caption).toContain('starting rule: review transfers above $10,000');
    expect(policy.frames[0].result).toContain('excludes the transfer at exactly $10,000');
    expect(policy.frames[1].result).toContain('all three examples meet the amount test');
    expect(policy.frames[2].result).toContain('removes internal transfers');
  });
  it('defines ROC and precision–recall rates where the lessons first use them', () => {
    const course = authoredCourse();
    const roc = course.measures.find((item: any) => item.slug === 'roc-curve')!;
    expect(roc.financialInterpretation).toContain('share of all actual fraud caught');
    expect(roc.financialInterpretation).toContain('share of all legitimate transactions flagged');
    const auc = course.measures.find((item: any) => item.slug === 'roc-auc-and-gini')!;
    expect(auc.financialInterpretation).toContain('“positive” means fraud and “negative” means legitimate');
    const pr = course.measures.find((item: any) => item.slug === 'precision-recall-curve-and-pr-auc')!;
    expect(pr.financialInterpretation).toContain('Precision is the share of flagged transactions');
    expect(pr.workingExample).toContain('event prevalence—the share of the whole group that is fraud');
  });
  it('keeps M03-linked financial visual descriptions state-specific and evidence-bounded', () => {
    const visuals = new Map(visualRegistry.map((visual) => [visual.id, visual]));
    expect(visuals.get('trees-and-forests-chargeback-prediction')!.textAlternative).toContain(
      'using them as approval inputs would reveal future information',
    );
    expect(visuals.get('trees-and-forests-customer-churn')!.textAlternative).toContain(
      'do not show that tenure or a pause caused churn',
    );
    const queue = visuals.get('gradient-boosting-fraud-and-chargebacks')!.textAlternative;
    expect(queue).toContain('unrevealed result is still unknown');
    expect(queue).toContain('three confirmed frauds and the baseline has two');
    const subgroup = visuals.get('gradient-boosting-customer-churn')!.textAlternative;
    expect(subgroup).toContain('These counts cover 10 held-back customers');
    expect(subgroup).toContain('too few to establish a dependable group-wide advantage');
  });
  it('uses correct queue-capacity grammar in the collections visual', () => {
    const collections = financialCases.find((item) => item.slug === 'collections-prioritization')!;
    expect(collections.frames.map((frame) => frame.label)).toEqual(['1 hour', '3 hours', '7 hours']);
  });
  it('explains and preserves the log-loss floor and inclusive classification cutoff', () => {
    const exercise = rawCourse.exercises.find((item) => item.id === 'M16')!;
    const givens = {
      ...exercise.givens,
      outcomes: [1, 0, 1],
      A: [0, 0.5, 1],
      B: [0, 0.5, 1],
      threshold: 0.5,
    } as unknown as Givens;
    const result = solve('M16', givens);
    expect(Number.isFinite(result.LLA)).toBe(true);
    expect(result.LLA).toBeGreaterThan(10);
    expect(result.errors).toBe(2); // p = 0 is clipped for loss; equality at 0.5 flags the legitimate case.
    expect(exerciseCopies.M16.interpretation).toContain('10⁻¹⁵');
  });
  it('keeps queue states, reference-range dollars, and offer response rates mathematically consistent', () => {
    const visuals = new Map(visualRegistry.map((visual) => [visual.id, visual]));
    const aml = visuals.get('logistic-regression-aml-alert-prioritization')!.textAlternative;
    expect(aml).toContain('1 means investigators confirmed fraud');
    expect(aml).toContain('queue precision is 3/4');
    const score = visuals.get('gradient-boosting-aml-alert-ranking')!.textAlternative;
    expect(score).toContain('C reaches 0.50, still below A at 0.80 and B at 0.60');
    expect(score).toContain('outside the two review slots');
    const ranges = visuals.get('isolation-forest-aml-transaction-screening')!.textAlternative;
    expect(ranges).toContain('$0 above that upper end');
    expect(ranges).not.toContain('$0,000');
    const offers = visuals.get('logistic-regression-offer-response-conversion-propensity')!.textAlternative;
    expect(offers).toContain('50 expected responses from 200 offers, an estimated 25% rate');
    expect(offers).toContain('60 expected responses from 300 offers, an estimated 20% rate');
  });
  it('explains calibration, Brier error, and log-loss behavior beside their measure diagrams', () => {
    expect(measureVisuals[13].textAlternative).toContain('points on the diagonal match');
    expect(measureVisuals[14].textAlternative).toContain('average probability errors');
    expect(measureVisuals[15].textAlternative).toContain('penalty is infinite at zero');
    const risk = financialCases.find((item) => item.slug === 'merchant-risk-scoring')!;
    expect(risk.frames.map((frame) => frame.label)).toEqual(['1 tree', '2 trees', '3 trees']);
    expect(risk.frames.map((frame) => frame.metric.value)).toEqual([0.9, 0.6, 0.5]);
  });
  it('explains the distinct document outcome in every merchant-onboarding state', () => {
    const onboarding = financialCases.find((item) => item.slug === 'merchant-onboarding-risk')!;
    expect(onboarding.frames[0].result).toContain('may proceed to a human risk review');
    expect(onboarding.frames[0].result).toContain('not automatic approval');
    expect(onboarding.frames[1].result).toContain('Bank verification is missing');
    expect(onboarding.frames[2].result).toContain('ownership evidence is supplied');
  });
  it('keeps every measure, exercise reference, numerical input, and private source record', () => {
    const course = authoredCourse();
    expect(course.measures).toHaveLength(39);
    const withoutSymbols = (exercises: { symbols: unknown; [key: string]: unknown }[]) =>
      exercises.map(({ symbols: _symbols, ...exercise }) => exercise);
    expect(withoutSymbols(course.exercises)).toEqual(withoutSymbols(rawCourse.exercises));
    for (const [index, measure] of course.measures.entries()) {
      expect(measure.slug).toBe(rawCourse.measures[index].slug);
      expect(measure.exercises).toEqual(rawCourse.measures[index].exercises);
      expect(measure.slides).toEqual(rawCourse.measures[index].slides);
      expect(measure.whatItMisses.trim()).not.toBe('');
      expect(measure.lessonSections.length).toBeGreaterThan(0);
    }
  });

  it('renders all authored mathematics and has no raw-extraction control characters', () => {
    for (const measure of authoredCourse().measures) {
      const text = JSON.stringify([
        measure.financialInterpretation,
        measure.workingExample,
        measure.whatItMisses,
        measure.lessonSections,
      ]);
      expect(text).not.toMatch(/\\u00(?:0[0-8bcdef]|1[0-9a-f])/i);
      expect(text).not.toMatch(
        /next slides|Read the local definition|EVALUATION MEASURE|Formula explained \(/i,
      );
      for (const section of measure.lessonSections) {
        for (const block of section.blocks) {
          if (block.kind === 'math')
            expect(() => katex.renderToString(block.latex, { throwOnError: true })).not.toThrow();
          if (block.kind === 'table')
            for (const row of block.rows) expect(row).toHaveLength(block.headers.length);
        }
      }
    }
  });

  it('states the conventions that distinguish similarly named measures', () => {
    const course = authoredCourse();
    const text = (slug: string) =>
      JSON.stringify(course.measures.find((measure: any) => measure.slug === slug).lessonSections);
    expect(text('mape-wape-mase')).toContain('compare both forecasts on the same test period');
    expect(text('retrieval-recall-k-and-context-precision')).toContain(
      'exactly one relevant passage',
    );
    expect(text('precision-recall-curve-and-pr-auc')).toContain('interchangeable labels');
    expect(text('value-at-risk-and-expected-shortfall')).toContain(
      'strictly greater than VaR can select the wrong tail size',
    );
  });

  it('keeps contextual explorers available as related practice', () => {
    const course = authoredCourse();
    const related = course.measures.filter((measure: any) => measure.relatedExplorer);
    expect(related.map((measure: any) => measure.number)).toEqual([18, 30, 31, 32, 35, 36, 37]);
    for (const measure of related) {
      expect(
        widgets.some((widget) => measure.relatedExplorer.href === `/explorers/${widget.id}/`),
      ).toBe(true);
    }
  });
});

describe('glossary publication', () => {
  it('uses the same repaired meanings in local formula keys and the glossary', () => {
    const course = authoredCourse();
    for (const exercise of course.exercises) {
      for (const symbol of exercise.symbols) {
        expect(
          course.glossary[symbol.symbol].some(
            (definition: any) =>
              definition.meaning === symbol.meaning && definition.exercises.includes(exercise.id),
          ),
          `${exercise.id}: ${symbol.symbol}`,
        ).toBe(true);
      }
    }
    expect(course.glossary['eᵢ²']).toBeDefined();
    expect(course.glossary['β²']).toBeDefined();
    expect(course.glossary['gainᵢ'][0].meaning).toContain('2^(relᵢ) − 1');
  });
  it('repairs split definitions and keeps sums separate from ordinary symbols', () => {
    const { glossary } = authoredCourse();
    expect(glossary.point).toBeUndefined();
    expect(glossary['Basis point; percentage point'][0].meaning).toContain(
      'five percentage points',
    );
    expect(glossary['1 in Specificity + FPR = 1'][0].meaning).toContain('100%');
    expect(
      glossary.b.some(
        (definition: any) =>
          definition.exercise === 'M14' && definition.meaning.startsWith('Index'),
      ),
    ).toBe(true);
    expect(
      glossary['Σ over bands'].every((definition: any) => definition.meaning.startsWith('Add')),
    ).toBe(true);
    expect(glossary['Σ'].some((definition: any) => definition.exercise === 'A08')).toBe(true);
    expect(glossary.P.every((definition: any) => definition.exercise !== 'A08')).toBe(true);
  });

  it('groups repeated definitions while retaining all exercise links', () => {
    const course = authoredCourse();
    const duplicate = course.glossary.TP.find((definition: any) =>
      definition.meaning.startsWith('True positives:'),
    );
    expect(duplicate.exercises).toEqual(['M01', 'M02', 'M03', 'M08']);
    const before = structuredClone(course.glossary);
    applyMeasureLessons(course);
    expect(course.glossary).toEqual(before);
  });
});

describe('explorer explanations', () => {
  it('updates expected-loss wording with the edited inputs', () => {
    const exercise = rawCourse.exercises.find((item) => item.id === 'A01')!;
    const givens = { ...exercise.givens, loan: 20000 } as unknown as Givens;
    const values = widgetValues('sigmoid-el', exercise.id, givens, defaults);
    const notice = widgetNotice('sigmoid-el', givens, values, defaults);
    expect(notice).toContain('$798');
    expect(notice).not.toContain('$399');
  });

  it('describes the current calibration gap and the scope of the comparison toggle', () => {
    const exercise = rawCourse.exercises.find((item) => item.id === 'M14')!;
    const givens = { ...exercise.givens, predicted: [0.05, 0.1, 0.4] } as unknown as Givens;
    const values = widgetValues('calibration-lab', exercise.id, givens, defaults);
    expect(widgetNotice('calibration-lab', givens, values, defaults)).toContain(
      '10 percentage points above',
    );
    expect(
      widgetNotice('calibration-lab', givens, values, { ...defaults, confident: 1 }),
    ).toContain('69 percentage points above');
    expect(
      widgetNotice('calibration-lab', givens, values, { ...defaults, confident: 1 }),
    ).toContain(
      'expected counts, expected loss, Brier score, log loss, and ECE from the same active probabilities',
    );
    const changed = widgetValues('calibration-lab', exercise.id, givens, {
      ...defaults,
      confident: 1,
    });
    expect(changed).toMatchObject(solve('M14', { ...givens, predicted: [0.05, 0.1, 0.99] }));
  });

  it('labels every default readout without exposing an internal identifier', () => {
    for (const widget of widgets) {
      const exercise = rawCourse.exercises.find((item) => item.id === widget.exercise)!;
      const values = widgetValues(
        widget.id,
        exercise.id,
        exercise.givens as unknown as Givens,
        defaults,
      );
      for (const key of Object.keys(values)) {
        expect(widgetReadoutLabel(widget.id, key), `${widget.id}: ${key}`).not.toBe(key);
      }
    }
  });

  it('does not display boosting log-odds or Gini impurity as percentage rates', () => {
    expect(widgetReadoutUnit('boosting-steps', 'F1')).toBe('');
    expect(widgetReadoutUnit('boosting-steps', 'F2')).toBe('');
    expect(widgetReadoutUnit('gini-split', 'gain')).toBe('');
    expect(widgetReadoutLabel('attention-mini', 'decision')).toBe(
      'Accept the automatic sentiment label?',
    );
    expect(widgetReadoutLabel('execution-update', 'decision')).toBe(
      'Does the updated action outrank waiting?',
    );
  });
});
