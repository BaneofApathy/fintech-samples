import { describe, expect, it } from 'vitest';
import raw from '../src/data/course.json';
import { resolveExplanation, validateExplanationTemplate } from '../src/engine/explanation-templates';
import { variant } from '../src/engine/variants';
import { solve } from '../src/engine/solve/core';
import type { Exercise } from '../src/engine/types';

describe('dynamic explanation templates', () => {
  it('uses the active practice inputs and solver results', () => {
    const exercise = raw.exercises.find((item) => item.id === 'A01') as unknown as Exercise;
    const labels = Object.fromEntries(Object.keys(exercise.givens).map((key) => [key, key === 'DTI' ? 'Debt-to-income (%)' : key]));
    const template = 'For DTI {{input.DTI}}, the estimated probability is {{result.p}}.';
    const render = (seed: number) => {
      const givens = variant('A01', exercise.givens, seed);
      const result = solve('A01', givens);
      return resolveExplanation(template, 'A01:p', labels, givens, result, exercise.steps);
    };
    const first = render(1);
    const second = render(4);
    expect(first).toContain(String(variant('A01', exercise.givens, 1).DTI));
    expect(second).toContain(String(variant('A01', exercise.givens, 4).DTI));
    expect(first).not.toBe(second);
    expect(first).not.toContain('{{');
    expect(second).not.toContain('{{');
  });

  it('rejects unknown keys and malformed placeholders before rendering', () => {
    expect(() => validateExplanationTemplate('Chance {{result.missing}}', 'A01', { inputs: ['DTI'], results: ['p'] })).toThrow(/Unknown result placeholder/);
    expect(() => validateExplanationTemplate('Chance {{input.unknown}}', 'A01', { inputs: ['DTI'], results: ['p'] })).toThrow(/Unknown input placeholder/);
    expect(() => validateExplanationTemplate('Chance {{result.p', 'A01', { inputs: ['DTI'], results: ['p'] })).toThrow(/Malformed/);
  });
});
