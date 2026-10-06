import { describe, expect, it } from 'vitest';
import course from '../src/data/course.json';
import { measureTopics } from '../src/data/measure-course';
import { dimensions } from '../src/data/teaching-types';

const correct = (slug: string, dimension: string, role = 'guided') => {
  const question = measureTopics
    .find((t) => t.slug === slug)!
    .questions.find((q) => q.dimension === dimension && q.role === role)!;
  return question.choices.find((c) => c.id === question.correctChoiceId)!.text;
};

describe('complete authored measure teaching', () => {
  it('covers the exact original 39 measure identities without replacing source records', () => {
    expect(measureTopics.map((t) => t.slug)).toEqual(course.measures.map((m) => m.slug));
    expect(new Set(measureTopics.map((t) => t.id)).size).toBe(39);
  });
  for (const topic of measureTopics) {
    it(`${topic.slug} has five substantive lessons and each objective has all three question roles`, () => {
      expect(topic.id).toBe('measure:' + topic.slug);
      expect(topic.kind).toBe('measure');
      expect(topic.definition.length).toBeGreaterThan(50);
      expect(topic.preciseDefinition.length).toBeGreaterThan(60);
      expect(topic.terms.length).toBeGreaterThanOrEqual(3);
      expect(topic.lessons).toHaveLength(5);
      expect(new Set(topic.lessons.map((l) => l.section))).toEqual(
        new Set(['learn', 'calculate', 'interpret']),
      );
      expect(topic.questions).toHaveLength(12);
      expect(new Set(topic.questions.map((q) => q.id)).size).toBe(12);
      for (const dimension of dimensions) {
        const qs = topic.questions.filter((q) => q.dimension === dimension);
        expect(qs.map((q) => q.role)).toEqual(['guided', 'practice', 'review']);
        expect(new Set(qs.map((q) => q.prompt)).size).toBe(3);
      }
      for (const lesson of topic.lessons) {
        expect(lesson.blocks.length).toBeGreaterThanOrEqual(2);
        expect(topic.questions.some((q) => q.lessonId === lesson.id)).toBe(true);
        for (const block of lesson.blocks) {
          if (block.kind === 'math') {
            expect(block.readAloud!.length).toBeGreaterThan(70);
            expect(block.symbols!.length).toBeGreaterThanOrEqual(2);
            for (const symbol of block.symbols!) expect(symbol.meaning.length).toBeGreaterThan(8);
          }
        }
      }
      for (const question of topic.questions) {
        expect(
          topic.objectives.some(
            (o) => o.id === question.objectiveId && o.dimension === question.dimension,
          ),
        ).toBe(true);
        expect(topic.lessons.some((l) => l.id === question.lessonId)).toBe(true);
        expect(question.choices).toHaveLength(3);
        expect(new Set(question.choices.map((c) => c.text)).size).toBe(3);
        expect(question.choices.filter((c) => c.id === question.correctChoiceId)).toHaveLength(1);
        expect(question.hint.length).toBeGreaterThan(25);
        expect(question.explanation.length).toBeGreaterThan(25);
        for (const choice of question.choices) {
          expect(choice.explanation.length).toBeGreaterThan(25);
          expect(choice.explanation).not.toContain('does not follow');
        }
      }
    });
  }
});

// Independent numerical checks for the new tiny examples, paired with the
// authored correct option so the UI cannot silently teach a different result.
const cases: [
  slug: string,
  role: string,
  choice: string,
  calculate: () => number,
  expected: number,
][] = [
  ['confusion-matrix', 'guided', '2', () => 5 - 3, 2],
  ['accuracy', 'guided', '85%', () => (3 + 14) / 20, 0.85],
  ['balanced-accuracy', 'guided', '0.8125', () => (3 / 4 + 14 / 16) / 2, 0.8125],
  ['precision', 'guided', '60%', () => 3 / 5, 0.6],
  ['recall', 'guided', '75%', () => 3 / 4, 0.75],
  ['specificity-and-false-positive-rate', 'guided', '12.5%', () => 2 / 16, 0.125],
  ['f1-and-f-beta', 'guided', '0.667', () => (2 * 0.6 * 0.75) / (0.6 + 0.75), 2 / 3],
  ['roc-curve', 'guided', '(0.5,0.5)', () => 1 / 2, 0.5],
  ['roc-auc-and-gini', 'guided', '0.75', () => 3 / 4, 0.75],
  ['roc-auc-and-gini', 'review', '0.625', () => (4 + 0.5 * 2) / 8, 0.625],
  ['ks-statistic', 'guided', '0.45', () => Math.abs(0.6 - 0.15), 0.45],
  [
    'precision-recall-curve-and-pr-auc',
    'guided',
    '5/6≈0.8333',
    () => 0.5 * 1 + 0.5 * (2 / 3),
    5 / 6,
  ],
  ['precision-recall-curve-and-pr-auc', 'review', '0.14', () => (0.2 * (0.8 + 0.6)) / 2, 0.14],
  ['precision-k-and-recall-k', 'guided', '37.5%', () => 3 / 8, 0.375],
  ['lift-and-cumulative-gain', 'guided', '3', () => 3 / 5 / (4 / 20), 3],
  ['calibration-curve', 'guided', '1', () => 10 * 0.1, 1],
  ['brier-score', 'guided', '0.04', () => Math.pow(0.2 - 0, 2), 0.04],
  ['log-loss', 'guided', 'About 0.693', () => -Math.log(0.5), 0.6931471805599453],
  ['expected-cost', 'guided', '$508', () => 500 * 1 + 4 * 2, 508],
  ['macro-f1-micro-f1-weighted-f1', 'guided', '0.5', () => (0.8 + 0.6 + 0.1) / 3, 0.5],
  ['macro-f1-micro-f1-weighted-f1', 'practice', '0.74', () => (9 * 0.8 + 1 * 0.2) / 10, 0.74],
  ['macro-f1-micro-f1-weighted-f1', 'review', '0.6875', () => 22 / (22 + 5 + 5), 0.6875],
  ['fairness-measures', 'guided', '2/3≈0.667', () => 0.4 / 0.6, 2 / 3],
  [
    'mean-absolute-error',
    'guided',
    '2 thousand dollars',
    () => (Math.abs(2) + Math.abs(-2)) / 2,
    2,
  ],
  ['root-mean-squared-error', 'practice', '3', () => Math.sqrt(36 / 4), 3],
  ['mape-wape-mase', 'guided', '15%', () => (2 / 10 + 2 / 20) / 2, 0.15],
  ['mape-wape-mase', 'practice', '13.33%', () => 4 / 30, 2 / 15],
  ['mape-wape-mase', 'review', '0.4', () => 2 / 5, 0.4],
  ['r', 'guided', '0.84', () => 1 - 8 / 50, 0.84],
  ['prediction-interval-coverage-and-width', 'guided', '2/3≈66.7%', () => 2 / 3, 2 / 3],
  ['pinball-loss', 'guided', '9', () => 0.9 * (30 - 20), 9],
  ['silhouette-score', 'guided', '0.6', () => (5 - 2) / Math.max(2, 5), 0.6],
  [
    'inertia-and-stability',
    'guided',
    '0.5',
    () => Math.pow(1 - 1.5, 2) + Math.pow(2 - 1.5, 2),
    0.5,
  ],
  ['inertia-and-stability', 'review', '−1/9≈−0.1111', () => (2 - 36 / 15) / (6 - 36 / 15), -1 / 9],
  ['retrieval-recall-k-and-context-precision', 'review', '0.75', () => (0.5 + 1) / 2, 0.75],
  ['mrr-and-ndcg', 'guided', '0.25', () => 1 / 4, 0.25],
  ['mrr-and-ndcg', 'practice', '0.4375', () => (1 + 0.5 + 0.25 + 0) / 4, 0.4375],
  [
    'mrr-and-ndcg',
    'review',
    '0.7098',
    () => (1 + 7 / Math.log2(3)) / (7 + 1 / Math.log2(3)),
    0.7098097413968655,
  ],
  [
    'faithfulness-citation-correctness-numerical-accuracy',
    'review',
    '20%',
    () => (120 - 100) / 100,
    0.2,
  ],
  ['sharpe-and-sortino-ratios', 'guided', '0.5', () => (0.09 - 0.03) / 0.12, 0.5],
  ['maximum-drawdown-turnover-tracking-error', 'guided', '25%', () => (120 - 90) / 120, 0.25],
  [
    'maximum-drawdown-turnover-tracking-error',
    'practice',
    '20%',
    () => (Math.abs(0.4 - 0.6) + Math.abs(0.6 - 0.4)) / 2,
    0.2,
  ],
  [
    'maximum-drawdown-turnover-tracking-error',
    'review',
    '4%',
    () => Math.sqrt(0.0004 / 3) * Math.sqrt(12),
    0.04,
  ],
  [
    'value-at-risk-and-expected-shortfall',
    'guided',
    '7',
    () => [0, 1, 2, 3, 4, 5, 6, 7, 10, 20][Math.ceil(0.8 * 10) - 1],
    7,
  ],
  ['value-at-risk-and-expected-shortfall', 'practice', '15', () => (10 + 20) / 2, 15],
  [
    'probability-of-shortfall-and-monte-carlo-error',
    'practice',
    '0.03',
    () => Math.sqrt((0.1 * 0.9) / 100),
    0.03,
  ],
  ['var-exception-rate', 'guided', '4%', () => 10 / 250, 0.04],
  ['cumulative-reward-and-regret', 'guided', '−$900', () => -(300 + 200 + 400), -900],
  ['task-success-verification-unsafe-actions', 'review', '5%', () => 10 / 200, 0.05],
  [
    'population-stability-index',
    'review',
    'About 0.415888',
    () => (0.2 - 0.5) * Math.log(0.2 / 0.5) + (0.8 - 0.5) * Math.log(0.8 / 0.5),
    0.4158883083359672,
  ],
  [
    'latency-throughput-review-load-cost',
    'guided',
    '55.2 ms',
    () => (95 * 40 + 4 * 180 + 1000) / 100,
    55.2,
  ],
];
describe('new numerical teaching fixtures', () => {
  for (const [slug, role, choice, calculate, expected] of cases) {
    it(`${slug} ${role} arithmetic and correct choice agree`, () => {
      expect(calculate()).toBeCloseTo(expected, 8);
      expect(correct(slug, 'calculation', role)).toBe(choice);
    });
  }
});
