import { describe, expect, it } from 'vitest';
import { recommendMeasures } from '../src/engine/measure-recommendations';
import { measures } from '../src/data';

describe('A useful short list of measures', () => {
  it('keeps expected cost when both kinds of error need comparison', () => {
    const selected = recommendMeasures('rare', 'rare', 'both');
    expect(selected.map((m) => m.number)).toEqual([17, 12, 5]);
    expect(selected[0].reason).toContain('missed events and unnecessary interventions');
  });
  it('uses review capacity when customer friction matters', () => {
    expect(recommendMeasures('rare', 'rare', 'review').map((m) => m.number)).toEqual([12, 4, 17]);
  });
  it('distinguishes ranking a rare event from balanced classification', () => {
    expect(recommendMeasures('rank', 'rare', 'miss')[0].number).toBe(11);
    expect(recommendMeasures('rank', 'balanced', 'miss')[0].number).toBe(9);
  });
  it('offers three distinct, available measures with reasons for each task', () => {
    for (const question of [
      'rare',
      'rank',
      'probability',
      'forecast',
      'retrieve',
      'act',
      'operate',
    ]) {
      for (const rarity of ['rare', 'balanced', 'na'])
        for (const cost of ['miss', 'review', 'both']) {
          const selected = recommendMeasures(question, rarity, cost);
          expect(new Set(selected.map((m) => m.number)).size).toBe(3);
          for (const item of selected) {
            expect(measures.some((m) => m.number === item.number)).toBe(true);
            expect(item.reason.length).toBeGreaterThan(30);
          }
        }
    }
  });
});
