import type { TeachingTopic } from './teaching-types';
import { makeMeasure } from './measure-course/authoring';
import { classificationSeeds } from './measure-course/classification';
import { diagnosticSeeds } from './measure-course/diagnostics';
import { financeSeeds } from './measure-course/finance';

/** Detailed authored teaching overlays. Original extracted lessons and solvers remain intact. */
export const measureTopics: TeachingTopic[] = [
  ...classificationSeeds,
  ...diagnosticSeeds,
  ...financeSeeds,
].map(makeMeasure);
