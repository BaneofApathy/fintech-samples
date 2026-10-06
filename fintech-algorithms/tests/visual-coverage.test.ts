import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { visualRegistry, visualCoverage } from '../src/data/visual-registry';
import { exerciseVisualLinks } from '../src/data/visual-links';
import { financialCases } from '../src/data/financial-cases';
import { algorithmVisualGivens } from '../src/data/algorithm-visuals';
import { supplementVisuals } from '../src/data/supplement-visuals';
import { solve } from '../src/engine/solve/core';
const course = JSON.parse(
  readFileSync(new URL('../src/data/course.json', import.meta.url), 'utf8'),
);
describe('Complete visual learning coverage', () => {
  it('covers the approved inventory with unique identifiers', () => {
    expect(visualCoverage).toEqual({
      algorithms: 12,
      measures: 39,
      financialApplications: 96,
      foundations: 11,
      supplements: 4,
      exercises: 64,
    });
    expect(new Set(visualRegistry.map((v) => v.id)).size).toBe(visualRegistry.length);
    for (const v of visualRegistry) {
      expect(v.question.length, v.id).toBeGreaterThan(10);
      expect(v.takeaway.length, v.id).toBeGreaterThan(20);
      expect(v.states.length, v.id).toBeGreaterThan(0);
    }
  });
  it('maps every original exercise and preserves its small numerical fixture', () => {
    for (const e of course.exercises) {
      expect(exerciseVisualLinks[e.id], e.id).toBeDefined();
      const fixture =
        algorithmVisualGivens[e.id] ?? supplementVisuals.find((v) => v.id === e.id)?.givens;
      if (fixture) {
        expect(fixture, e.id).toEqual(e.givens);
        expect(solve(e.id, fixture), e.id).toEqual(solve(e.id, e.givens));
      }
    }
  });
  it('keeps all eight application-map appearances for every algorithm', () => {
    for (const a of course.algorithms) {
      const entries = financialCases.filter((c) => c.algorithmSlug === a.slug);
      expect(entries, a.slug).toHaveLength(8);
      expect(entries.map((c) => c.sourceRef.application).sort((a, b) => a - b)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8,
      ]);
    }
  });
  it('gives each application a real state change, explanation, and measured population', () => {
    for (const c of financialCases) {
      expect(c.frames, c.title).toHaveLength(3);
      expect(new Set(c.frames.map((f) => JSON.stringify(f.marks))).size, c.title).toBeGreaterThan(
        1,
      );
      expect(new Set(c.frames.map((f) => f.label)).size, c.title).toBe(3);
      for (const f of c.frames) {
        expect(f.marks.length, c.title).toBeGreaterThan(2);
        expect(f.rows.length, c.title).toBeGreaterThan(0);
        expect(f.metric.denominator.length, c.title).toBeGreaterThan(0);
        expect(Number.isFinite(f.metric.value), c.title).toBe(true);
      }
    }
  });
});
