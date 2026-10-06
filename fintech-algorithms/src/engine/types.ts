export type Value = number | boolean | string | number[];
export type Givens = Record<string, number | number[]>;
export interface Step {
  id: string;
  title: string;
  expects: 'number' | 'integer' | 'boolean' | 'choice' | 'cells';
  unit?: string;
  choices?: string[];
  tolerance?: { abs?: number; rel?: number };
  hints: string[];
  /** Plain-language reasoning shown after the result, separate from a hint. */
  explanation?: string;
  mistakes: { pattern: string; message: string }[];
}
export interface Spec {
  givens: Givens;
  labels: Record<string, string>;
  steps: Step[];
  deckSolution: Record<string, Value>;
  latex: string[];
  symbols: { symbol: string; meaning: string }[];
}
export interface Slide {
  page: number;
  title: string;
  text: string;
  paragraphs: string[];
  source: { pages: number[]; verbatim: boolean };
}
export interface Exercise extends Spec {
  learning?: import('./exercise-copy').ExerciseCopy;
  id: string;
  title: string;
  minutes: number;
  kind: 'algorithm' | 'measure' | 'skill';
  parent: string;
  question: string;
  questionPages: Slide[];
  formulaPages: Slide[];
  symbolPages: Slide[];
  solutionPages: Slide[];
  interpretationPages: Slide[];
  source: { pages: number[]; verbatim: boolean };
  readAloud: string[];
  siteAuthored: boolean;
  formulaSource: { pages: number[]; verbatim: boolean; reviewed: boolean };
  formulaSymbols?: { symbol: string; meaning: string }[][];
}
