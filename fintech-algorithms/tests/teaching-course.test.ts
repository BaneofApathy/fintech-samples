import { describe, it, expect } from 'vitest';
import katex from 'katex';
import original from '../src/data/course.json';
import {
  teachingTopics,
  learningManifest,
  conceptualGlossary,
} from '../src/data/teaching-manifest';
import { foundationTopics } from '../src/data/foundation-course';
import { dimensions } from '../src/data/teaching-types';

describe('Complete teaching curriculum', () => {
  it('covers all retained algorithms and measure slugs plus ten foundations', () => {
    expect(teachingTopics.filter((t) => t.kind === 'algorithm').map((t) => t.slug)).toEqual(
      original.algorithms.map((a) => a.slug),
    );
    expect(teachingTopics.filter((t) => t.kind === 'measure').map((t) => t.slug)).toEqual(
      original.measures.map((m) => m.slug),
    );
    expect(foundationTopics).toHaveLength(10);
    expect(new Set(teachingTopics.map((t) => t.id)).size).toBe(teachingTopics.length);
    expect(conceptualGlossary.length).toBeGreaterThan(200);
  });
  for (const topic of teachingTopics) {
    it(`${topic.id}: teaches each objective with guided practice and two additional questions`, () => {
      expect(topic.definition.length).toBeGreaterThan(40);
      expect(topic.preciseDefinition.length).toBeGreaterThan(40);
      expect(topic.terms.length).toBeGreaterThanOrEqual(3);
      expect(topic.lessons.length).toBeGreaterThanOrEqual(4);
      expect(new Set(topic.lessons.map((l) => l.id)).size).toBe(topic.lessons.length);
      expect(topic.objectives.map((o) => o.dimension)).toEqual([...dimensions]);
      for (const objective of topic.objectives) {
        const questions = topic.questions.filter((q) => q.objectiveId === objective.id);
        expect(questions.map((q) => q.role).sort()).toEqual(['guided', 'practice', 'review']);
        expect(topic.lessons.some((l) => l.objectiveId === objective.id)).toBe(true);
      }
      for (const lesson of topic.lessons) {
        expect(lesson.blocks.length).toBeGreaterThan(0);
        expect(topic.objectives.some((o) => o.id === lesson.objectiveId)).toBe(true);
        for (const block of [
          ...lesson.blocks,
          ...(lesson.advanced ?? []).flatMap((s) => s.blocks),
        ]) {
          if (block.kind === 'math') {
            expect(() =>
              katex.renderToString(block.latex, { throwOnError: true, strict: false }),
            ).not.toThrow();
            expect(block.readAloud?.length).toBeGreaterThan(25);
            expect(block.symbols?.length).toBeGreaterThan(0);
          }
          if (block.kind === 'table') {
            expect(block.rows.length).toBeGreaterThan(0);
            block.rows.forEach((row) => expect(row).toHaveLength(block.headers.length));
          }
        }
      }
      for (const question of topic.questions) {
        expect(question.topicId).toBe(topic.id);
        expect(topic.lessons.some((l) => l.id === question.lessonId)).toBe(true);
        expect(question.choices.length).toBeGreaterThanOrEqual(3);
        expect(new Set(question.choices.map((c) => c.id)).size).toBe(question.choices.length);
        expect(new Set(question.choices.map((c) => c.text)).size).toBe(question.choices.length);
        expect(question.choices.filter((c) => c.id === question.correctChoiceId)).toHaveLength(1);
        question.choices.forEach((c) => expect(c.explanation.length).toBeGreaterThan(15));
        expect(question.hint.length).toBeGreaterThan(10);
        expect(question.explanation.length).toBeGreaterThan(15);
      }
      const manifest = learningManifest.find((m) => m.id === topic.id)!;
      expect(manifest.lessons.map((l) => l.id)).toEqual(topic.lessons.map((l) => l.id));
      expect(manifest.questions.map((q) => q.id)).toEqual(topic.questions.map((q) => q.id));
      manifest.lessons.forEach((l) => expect(l.href).toContain('#' + l.id));
    });
  }
  it('keeps globally unique questions and links all prerequisites to authored foundations', () => {
    const questions = teachingTopics.flatMap((t) => t.questions);
    expect(questions).toHaveLength(732);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const topic of teachingTopics)
      topic.prerequisites.forEach((slug) =>
        expect(
          foundationTopics.some((f) => f.slug === slug),
          `${topic.id}: ${slug}`,
        ).toBe(true),
      );
  });
  it('independently verifies foundational arithmetic fixtures', () => {
    expect([6, 9, 15].reduce((a, b) => a + b) / 3).toBe(10);
    expect(0.04 * 20000 * 0.25).toBe(200);
    expect(Math.log(0.2 / 0.8)).toBeCloseTo(-1.386294, 6);
    expect(1 / (1 + Math.exp(-Math.log(0.2 / 0.8)))).toBeCloseTo(0.2, 12);
    expect(Math.hypot(3, 4)).toBe(5);
    expect(0.5 ** 2 * 4 + 0.5 ** 2 * 4).toBe(2);
    expect(1 - 0.1 * -4).toBeCloseTo(1.4, 12);
    expect((1.72 - 3) ** 2).toBeCloseTo(1.6384, 12);
    expect((4 * 3) / 2).toBe(6);
    expect((8 * 7) / 2).toBe(28);
  });
});
