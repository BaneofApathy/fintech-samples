import { describe, expect, it } from 'vitest';
import queue from '../qa/explanation-queue.json';

describe('editorial batch boundaries', () => {
  it('assigns drawdown to M12 and turnover/tracking error to the separate M13 batch', () => {
    const jobFor = (id: string) => queue.rows.find((row) => row.id === id)?.job;
    expect(jobFor('exercise:M32a:scenario')).toBe('M12');
    expect(jobFor('exercise:M32b:scenario')).toBe('M13');
    expect(jobFor('exercise:M32c:scenario')).toBe('M13');
    expect(jobFor('measure:32:maximum-drawdown-turnover-tracking-error:overview')).toBe('M12');
    expect(jobFor('measure:32:maximum-drawdown-turnover-tracking-error:lesson.0.blocks.0:formula')).toBe('M12');
    expect(jobFor('measure:32:maximum-drawdown-turnover-tracking-error:lesson.0.blocks.1:formula')).toBe('M13');
    expect(queue.rows.filter((row) => row.job === 'M13').length).toBeGreaterThan(0);
  });
  it('keeps M39a/b in operations batch M16 and assigns workflow-cost M39c/d to M17', () => {
    const jobFor = (id: string) => queue.rows.find((row) => row.id === id)?.job;
    expect(jobFor('exercise:M39a:scenario')).toBe('M16');
    expect(jobFor('exercise:M39b:scenario')).toBe('M16');
    expect(jobFor('exercise:M39c:scenario')).toBe('M17');
    expect(jobFor('exercise:M39d:scenario')).toBe('M17');
    expect(queue.rows.filter((row) => row.job === 'M17').length).toBeGreaterThan(0);
  });
  it('inventories every context-specific exercise symbol key', () => {
    const symbols = queue.rows.filter((row) => row.state === 'local-symbol-meaning');
    expect(symbols).toHaveLength(640);
    expect(symbols.some((row) => row.id === 'exercise:A06:symbol:0')).toBe(true);
  });
});
