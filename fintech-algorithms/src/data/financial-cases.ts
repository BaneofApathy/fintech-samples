import { predictionCases } from './financial-cases/prediction';
import { discoveryCases } from './financial-cases/discovery';
import { evidenceCases } from './financial-cases/evidence';
import { actionCases } from './financial-cases/action';
import { applyCaseStoryboards } from './financial-cases/storyboards';
import type { FinancialCase } from './financial-cases/types';
export type { FinancialCase, CaseFrame, CaseMark } from './financial-cases/types';

export const financialCases: FinancialCase[] = applyCaseStoryboards([
  ...predictionCases,
  ...discoveryCases,
  ...evidenceCases,
  ...actionCases,
]);
export const financialCasesForAlgorithm = (slug: string) =>
  financialCases.filter((item) => item.algorithmSlug === slug);
export function financialCaseHref(
  item: Pick<FinancialCase, 'algorithmSlug' | 'slug'>,
  base = import.meta.env.BASE_URL,
) {
  return `${base.replace(/\/$/, '')}/financial-problems/${item.algorithmSlug}/${item.slug}/`;
}
