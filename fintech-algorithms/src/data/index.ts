import json from './course.json';
import type { Exercise, Slide } from '../engine/types';
import type { AlgorithmLesson, LessonSection } from './lesson-types';
import { applyAlgorithmLessons } from './algorithm-lessons';
import { applyMeasureLessons } from './measure-lessons';
import { applyExerciseCopy } from '../engine/exercise-copy';
import labs from './labs.json';

function standaloneCopy<T>(value: T, key = ''): T {
  if (key === 'source' || key === 'formulaSource' || key === 'code') return value;
  if (typeof value === 'string') {
    const copy = value
      .replace(
        /\bN, n sample count Number of evaluated items; the local slide states which items\./gi,
        'N and n count the observations included in this particular evaluation.',
      )
      .replace(
        /Average Precision \(AP\), the calculation used by the deck’s classification code, is:/gi,
        'Average Precision (AP) adds each increase in recall, weighted by precision at that rank:',
      )
      .replace(/\b(?:lecture|deck)\b/gi, 'course')
      .replace(/\s*·\s*p{1,2}\.[ \t]*\d+(?:[ \t]*[,–-][ \t]*\d+)*\.?/gi, '')
      .replace(/\bSource:\s*(?:course\s+)?p{1,2}\.[ \t]+\d+(?:[ \t]*[,–-][ \t]*\d+)*\.?/gi, '')
      .replace(/\b(?:course|source)\s+pages?\s+\d+(?:[ \t]*[,–-][ \t]*\d+)*\.?/gi, '')
      .replace(/\bp{1,2}\.[ \t]+\d+(?:[ \t]*[,–-][ \t]*\d+)*\.?/gi, '')
      .replace(/\bpages?\s+\d+(?:[ \t]*[,–-][ \t]*\d+)*\.?/gi, '')
      .replace(/\bSource:\s*/gi, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/ *\n */g, '\n');
    return copy as T;
  }
  if (Array.isArray(value)) return value.map((item) => standaloneCopy(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, standaloneCopy(child, childKey)]),
    ) as T;
  }
  return value;
}

type Course = Omit<typeof json, 'algorithms' | 'measures' | 'glossary'> & {
  algorithms: ((typeof json.algorithms)[number] & { lesson: AlgorithmLesson })[];
  measures: ((typeof json.measures)[number] & {
    lessonSections: LessonSection[];
    relatedExplorer?: { href: string; title: string; description: string };
  })[];
  glossary: Record<
    string,
    {
      exercise: string;
      meaning: string;
      source: { pages: number[]; verbatim: boolean };
      exercises?: string[];
    }[]
  >;
};
export const course = standaloneCopy(json) as unknown as Course;
applyAlgorithmLessons(course);
for (const e of course.exercises) applyExerciseCopy(e as unknown as Exercise);
applyMeasureLessons(course);
for (const a of course.algorithms) {
  const lab = labs[a.slug as keyof typeof labs];
  a.lab.dataset = lab.dataset;
  a.lab.task = lab.task;
  a.lab.requiredComparison = lab.comparison;
}
export const algorithms = course.algorithms;
export const measures = course.measures;
export const exercises = course.exercises as unknown as Exercise[];
export const exercise = (id: string) => exercises.find((e) => e.id === id)!;
export const href = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const sections = [
  ['problem', 'Problem'],
  ['intuition', 'Intuition'],
  ['formula', 'Formula'],
  ['worked', 'Worked example'],
  ['practice', 'Practice'],
  ['measures', 'Measures'],
  ['defend', 'Build & defend'],
] as const;
export const shortTitles = [
  'Logistic regression',
  'Trees & forests',
  'Gradient boosting',
  'K-means clustering',
  'Isolation Forest',
  'Time-series forecasting',
  'Graph methods',
  'Transformers & FinBERT',
  'Embeddings & RAG',
  'Optimization',
  'Reinforcement learning',
  'Monte Carlo',
];
export type Algorithm = (typeof algorithms)[number];
export type Measure = (typeof measures)[number];
export type { Exercise, Slide };
