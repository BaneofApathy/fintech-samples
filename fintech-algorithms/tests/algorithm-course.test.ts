import { describe, expect, it } from 'vitest';
import katex from 'katex';
import rawCourse from '../src/data/course.json';
import { algorithmTopics } from '../src/data/algorithm-course';
import type { LessonBlock } from '../src/data/lesson-types';
import { solve, sigmoid } from '../src/engine/solve/core';

const foundationSlugs = new Set([
  'notation',
  'probability',
  'logarithms',
  'vectors',
  'variance',
  'gradients',
  'data-splits',
  'leakage',
  'regularization',
  'algorithm-tracing',
]);
const get = (slug: string) => algorithmTopics.find((topic) => topic.slug === slug)!;
const lesson = (slug: string, suffix: string) =>
  get(slug).lessons.find((item) => item.id === `${slug}:${suffix}`)!;
const prose = (slug: string, suffix: string) =>
  lesson(slug, suffix)
    .blocks.filter((b) => b.kind === 'paragraph')
    .map((b) => b.text)
    .join(' ');
const answer = (slug: string, dimension: string, role: string) => {
  const question = get(slug).questions.find((q) => q.id === `${slug}:${dimension}:${role}`)!;
  return question.choices.find((choice) => choice.id === question.correctChoiceId)!.text;
};

describe('complete authored algorithm course', () => {
  it('preserves all 12 existing algorithm identities and covers every objective in three roles', () => {
    expect(algorithmTopics.map((t) => t.slug)).toEqual(rawCourse.algorithms.map((t) => t.slug));
    expect(algorithmTopics).toHaveLength(12);
    const allIds = new Set<string>();
    for (const topic of algorithmTopics) {
      expect(topic.id).toBe(`algorithm:${topic.slug}`);
      expect(topic.kind).toBe('algorithm');
      expect(topic.lessons).toHaveLength(7);
      expect(topic.questions).toHaveLength(12);
      expect(topic.terms.length).toBeGreaterThanOrEqual(7);
      expect(topic.objectives.map((o) => o.dimension)).toEqual([
        'definition',
        'mechanism',
        'calculation',
        'application',
      ]);
      expect(topic.prerequisites.every((slug) => foundationSlugs.has(slug))).toBe(true);
      for (const objective of topic.objectives) {
        const questions = topic.questions.filter((q) => q.objectiveId === objective.id);
        expect(questions.map((q) => q.role).sort()).toEqual(['guided', 'practice', 'review']);
        expect(questions.every((q) => q.dimension === objective.dimension)).toBe(true);
      }
      for (const item of topic.lessons) {
        expect(topic.questions.some((q) => q.lessonId === item.id)).toBe(true);
        expect(topic.objectives.some((o) => o.id === item.objectiveId)).toBe(true);
      }
      for (const question of topic.questions) {
        expect(allIds.has(question.id)).toBe(false);
        allIds.add(question.id);
        expect(question.topicId).toBe(topic.id);
        expect(topic.lessons.some((l) => l.id === question.lessonId)).toBe(true);
        expect(question.choices.length).toBeGreaterThanOrEqual(3);
        expect(new Set(question.choices.map((c) => c.id)).size).toBe(question.choices.length);
        const correct = question.choices.find((c) => c.id === question.correctChoiceId);
        expect(correct).toBeDefined();
        expect(question.explanation).toBe(correct!.explanation);
        for (const choice of question.choices)
          expect(choice.explanation.length).toBeGreaterThan(35);
        expect(question.hint.length).toBeGreaterThan(15);
      }
    }
  });

  it('provides local formula explanations and symbols, numeric examples, advanced content, and annotated code', () => {
    for (const topic of algorithmTopics) {
      expect(topic.lessons[0].section).toBe('intuition');
      expect(topic.lessons[0].blocks.every((b) => b.kind !== 'visual')).toBe(true);
      expect(prose(topic.slug, 'tiny-example').trim()).not.toBe('');
      expect(prose(topic.slug, 'financial-example').trim()).not.toBe('');
      expect(lesson(topic.slug, 'tiny-example').blocks.some((b) => b.kind === 'table')).toBe(true);
      expect(lesson(topic.slug, 'financial-example').blocks.some((b) => b.kind === 'table')).toBe(
        true,
      );
      expect(lesson(topic.slug, 'code').blocks.some((b) => b.kind === 'code')).toBe(true);
      expect(topic.pseudocode!.length).toBeGreaterThan(200);
      expect(topic.codeWalkthrough!.length).toBeGreaterThanOrEqual(6);
      expect(topic.complexity).toContain('O(');
      expect(lesson(topic.slug, 'formula').advanced!.length).toBeGreaterThan(0);
      const blocks: LessonBlock[] = topic.lessons.flatMap((l) => [
        ...l.blocks,
        ...(l.advanced ?? []).flatMap((s) => s.blocks),
      ]);
      for (const block of blocks)
        if (block.kind === 'math') {
          expect(block.readAloud!.length).toBeGreaterThan(80);
          expect(block.symbols!.length).toBeGreaterThan(1);
          expect(() =>
            katex.renderToString(block.latex, { throwOnError: true, strict: 'error' }),
          ).not.toThrow();
        }
    }
  });

  it('varies the correct-choice position while preserving its feedback', () => {
    const questions = algorithmTopics.flatMap((t) => t.questions);
    for (const id of ['choice-1', 'choice-2', 'choice-3']) {
      const count = questions.filter((q) => q.correctChoiceId === id).length;
      expect(count).toBeGreaterThan(25);
      expect(count).toBeLessThan(75);
    }
  });

  it('keeps authored lending arithmetic consistent with the established score and units', () => {
    const result = solve('A01', { DTI: 35, D: 1, I: 40, loan: 10000, LGD: 0.4, threshold: 0.15 });
    expect(result.z).toBeCloseTo(-1.6);
    expect(result.p).toBeCloseTo(0.1679816149);
    expect(result.EL).toBeCloseTo(671.926459, 5);
    expect(prose('logistic-regression', 'financial-example')).toContain('$671.93');
    expect(answer('logistic-regression', 'calculation', 'practice')).toBe('0.6');
    expect(-1 - 0.1 * (0.5 - 1)).toBeCloseTo(-0.95);
    expect(0.5 - 0.1 * (0.5 - 1) * 2).toBeCloseTo(0.6);
  });

  it('retains weighted tree impurities and the inclusive score threshold', () => {
    const result = solve('A02', { counts: [3, 1, 1, 3], scores: [0.8, 0.6, 0.4], threshold: 0.6 });
    expect(result.parent).toBeCloseTo(0.5);
    expect(result.weighted).toBeCloseTo(0.375);
    expect(result.gain).toBeCloseTo(0.125);
    expect(result.score).toBeCloseTo(0.6);
    expect(result.decision).toBe(true);
    expect(answer('trees-and-forests', 'application', 'guided')).toContain('exactly 0.60');
  });

  it('checks the two-stage boosting and two-iteration K-means examples', () => {
    const boost = solve('A03', { F0: -2, eta: 0.25, h1: 1.2, h2: 0.4, eta2: 0.1, threshold: 0.15 });
    expect(boost.F1).toBeCloseTo(-1.7);
    expect(boost.F2).toBeCloseTo(-1.6);
    expect(boost.smallP).toBeCloseTo(sigmoid(-1.84));
    expect(answer('gradient-boosting', 'calculation', 'review')).toBe('0.125');
    const cluster = solve('A04', { points: [1, 2, 8, 9], centers: [1, 8], newPoint: 5 });
    expect(cluster.c1).toBe(1.5);
    expect(cluster.c2).toBe(8.5);
    expect(cluster.inertia).toBe(1);
    expect(cluster.group).toBe(1);
    expect(answer('k-means', 'calculation', 'practice')).toBe('1');
  });

  it('checks normalized isolation scoring and the recursive differenced forecast', () => {
    const score = solve('A05', { paths: [2, 2, 2, 4, 4, 4, 6, 6, 6], c: 4 });
    expect(score.means).toEqual([2, 4, 6]);
    expect((score.scores as number[])[0]).toBeCloseTo(Math.SQRT1_2);
    expect((score.scores as number[])[1]).toBe(0.5);
    const forecast = solve('A06', { last: 110, previous: 100, phi: 0.5, buffer: 20, actual: 118 });
    expect(forecast.next).toBe(115);
    expect(forecast.second).toBe(117.5);
    expect(forecast.modelError).toBe(3);
    expect(answer('time-series', 'calculation', 'practice')).toBe('117.5');
  });

  it('checks cosine rankings and separates attention from class probabilities', () => {
    const attention = solve('A08', { logits: [0, Math.log(3)], values: [2, 6], threshold: 0.6 });
    expect((attention.weights as number[])[0]).toBeCloseTo(0.25);
    expect((attention.weights as number[])[1]).toBeCloseTo(0.75);
    expect(attention.h).toBeCloseTo(5);
    expect(answer('transformers', 'calculation', 'practice')).toBe('5');
    const retrieval = solve('A09', {
      q: [1, 0],
      docs: [3, 0, 3, 4, 0, 2],
      oldRevenue: 80,
      newRevenue: 100,
    });
    expect(retrieval.similarities).toEqual([1, 0.6, 0]);
    expect(retrieval.growth).toBe(0.25);
    expect(answer('rag', 'application', 'guided')).toBe('25%');
  });

  it('checks graph traversal and the numerical message-passing trace', () => {
    const edges = [
      ['A', 'B'],
      ['A', 'C'],
      ['B', 'D'],
      ['C', 'E'],
    ];
    const adjacency = new Map<string, string[]>();
    for (const [a, b] of edges) {
      adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
      adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
    }
    const queue = ['D'];
    const distance = new Map([['D', 0]]);
    while (queue.length) {
      const node = queue.shift()!;
      for (const neighbor of adjacency.get(node)!)
        if (!distance.has(neighbor)) {
          distance.set(neighbor, distance.get(node)! + 1);
          queue.push(neighbor);
        }
    }
    expect(distance.get('E')).toBe(4);
    expect(distance.size).toBe(5);
    expect([...adjacency.values()].reduce((n, neighbors) => n + neighbors.length, 0)).toBe(8);
    expect(Math.max(0, 0.5 * 2 + 0.5 * ((4 + 6) / 2))).toBe(3.5);
    expect(answer('graph-methods', 'calculation', 'practice')).toBe('4');
    expect(answer('graph-methods', 'calculation', 'review')).toBe('3.5');
  });

  it('includes nonzero covariance and distinguishes listed allocations from continuous optimum', () => {
    const variance = (w: number) =>
      w ** 2 * 0.2 ** 2 + (1 - w) ** 2 * 0.1 ** 2 + 2 * w * (1 - w) * 0.5 * 0.2 * 0.1;
    expect(variance(0.5)).toBeCloseTo(0.0175);
    expect(variance(0.75)).toBeCloseTo(0.026875);
    expect(variance(2 / 3)).toBeCloseTo(0.0233333333);
    expect(prose('optimization', 'financial-example')).toContain('w = 2/3');
    expect(answer('optimization', 'application', 'guided')).toBe('0.75');
  });

  it('distinguishes Q targets from partial updates and includes incomplete-order costs', () => {
    const transition = solve('A11', {
      old: 2,
      reward: 1,
      gamma: 0.5,
      next: [4, 6],
      alpha: 0.25,
      wait: 2,
    });
    expect(transition.target).toBe(4);
    expect(transition.updated).toBe(2.5);
    expect(answer('reinforcement-learning', 'calculation', 'review')).toBe('0.5');
    const cost = solve('S03', {
      shares: [400, 500],
      prices: [50.1, 50.2],
      target: 1000,
      arrival: 50,
      close: 50.3,
      fees: 5,
    });
    expect(cost.completion).toBe(0.9);
    expect(cost.total).toBeCloseTo(175);
    expect(cost.bps).toBeCloseTo(35);
    expect(answer('reinforcement-learning', 'application', 'guided')).toBe('35 bps');
  });

  it('preserves strict draw and breach boundaries and nearest-rank tail conventions', () => {
    const losses = [
      [0.1, 0.8],
      [0.7, 0.9],
      [0.2, 0.15],
      [0.25, 0.6],
    ].map((draws) => draws.reduce((total, u) => total + (u < 0.25 ? 40 : 0), 0));
    expect(losses).toEqual([40, 0, 80, 0]);
    expect(losses.filter((l) => l > 40).length / losses.length).toBe(0.25);
    const tail = solve('M33', { losses, confidence: 0.75, reserve: 40 });
    expect(tail.VaR).toBe(40);
    expect(tail.ES).toBe(80);
    expect(answer('monte-carlo', 'application', 'review')).toBe('$40');
  });
});
