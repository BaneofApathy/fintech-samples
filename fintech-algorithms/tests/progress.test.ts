import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  empty,
  importProgress,
  mark,
  noteHelp,
  practiceSummary,
  read,
  valid,
  visit,
  type Attempt,
} from '../src/engine/progress';

const sample = (status: Attempt['status'], extra: Partial<Attempt> = {}): Attempt => ({
  id: 'A01',
  step: 'p',
  seed: 0,
  status,
  time: '2026-10-01T12:00:00.000Z',
  ...extra,
});

describe('Compatible learner progress', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('imports version 1 records without requiring new resume or help fields', () => {
    const old = {
      ...empty(),
      answers: { 'loan-defense': 'Review because expected loss exceeds the budget.' },
      sections: { 'logistic-regression:problem': true },
      exerciseSteps: { 'A01:0': ['z'] },
      attempts: [sample('correct', { step: 'z' })],
    };
    expect(valid(old)).toBe(true);
    importProgress(JSON.stringify(old));
    visit('logistic-regression', 'intuition');
    expect(read().answers).toEqual(old.answers);
    expect(read().attempts).toEqual(old.attempts);
    expect(read().exerciseSteps).toEqual(old.exerciseSteps);
    expect(read().resume).toMatchObject({ slug: 'logistic-regression', section: 'intuition' });
  });

  it('records reading and help separately from completed answers', () => {
    mark('logistic-regression:problem');
    noteHelp('A01', 12, 'p');
    noteHelp('A01', 12, 'p');
    const p = read();
    expect(p.sections['logistic-regression:problem']).toBe(true);
    expect(p.helpUsed).toEqual({ 'A01:12': ['p'] });
    expect(p.attempts).toEqual([]);
    expect(p.exerciseSteps).toEqual({});
    expect(practiceSummary(p.attempts, p.helpUsed)).toEqual({ independent: 0, assisted: 0 });
  });

  it('keeps successful work after hints or solutions distinct from independent answers', () => {
    const attempts = [
      sample('shown'),
      sample('correct'),
      sample('correct', { step: 'z' }),
      sample('correct', { step: 'z' }),
      sample('correct', { seed: 1, pattern: 'hint-used' }),
      sample('correct', { seed: 2, pattern: 'solution-viewed' }),
      sample('incorrect', { seed: 3 }),
      sample('correct', { seed: 4 }),
    ];
    expect(practiceSummary(attempts, { 'A01:4': ['p'] })).toEqual({ independent: 1, assisted: 4 });
  });

  it('rejects invalid resume links without replacing saved progress', () => {
    mark('logistic-regression:problem');
    const malformed = {
      ...empty(),
      resume: { slug: '../../elsewhere', section: 'practice', time: '2026-10-01' },
    };
    expect(() => importProgress(JSON.stringify(malformed))).toThrow('compatible');
    expect(read().sections['logistic-regression:problem']).toBe(true);
    visit('logistic-regression', 'unknown-section');
    expect(read().resume).toBeUndefined();
  });
});
