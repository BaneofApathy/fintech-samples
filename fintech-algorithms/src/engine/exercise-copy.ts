import authored from '../../scripts/exercise-copy.json';
import type { Exercise, Value } from './types';
import { exerciseSummary as summarize } from './exercise-summary';
import { isSubstantiveExplanation } from './explanation-quality';
import { validateExplanationTemplate } from './explanation-templates';

export interface ExerciseCopy {
  title: string;
  scenario: string;
  task: string;
  interpretation: string;
  summary: string;
  labels: Record<string, string>;
  steps: Record<string, { title: string; hints: string[]; unit: string; explanation?: string }>;
  readAloud: string[];
  formulas?: { readAloud: string; symbols: { symbol: string; meaning: string }[] }[];
  workedExplanation: string[];
  workedArithmetic: string[];
  workedDetails?: string[];
}

export const exerciseCopies: Record<string, ExerciseCopy> = authored;

export function applyExerciseCopy(exercise: Exercise): Exercise {
  const copy = exerciseCopies[exercise.id];
  if (!copy) throw new Error(`Missing authored copy for ${exercise.id}`);
  if (copy.formulas && copy.formulas.length !== exercise.latex.length)
    throw new Error(`Formula metadata count does not match expressions for ${exercise.id}`);
  return Object.assign(exercise, {
    ...exercise,
    title: copy.title,
    question: [copy.scenario, copy.task].join('\n\n'),
    readAloud: copy.formulas?.map((formula) => formula.readAloud) ?? copy.readAloud,
    formulaSymbols: copy.formulas?.map((formula) => formula.symbols),
    labels: copy.labels,
    learning: copy,
    steps: exercise.steps.map((step) => {
      const authoredStep = copy.steps[step.id];
      if (!authoredStep) throw new Error(`Missing copy for ${exercise.id}:${step.id}`);
      if (authoredStep.explanation !== undefined && !isSubstantiveExplanation(authoredStep.explanation))
        throw new Error(`Generic or empty worked-step explanation: ${exercise.id}:${step.id}`);
      if (authoredStep.explanation)
        validateExplanationTemplate(authoredStep.explanation, `${exercise.id}:${step.id}`, {
          inputs: Object.keys(exercise.givens),
          results: exercise.steps.map((candidate) => candidate.id),
        });
      return {
        ...step,
        ...authoredStep,
        explanation: authoredStep.explanation,
        mistakes: authoredStep.hints.map((message) => ({ pattern: 'recompute', message })),
      };
    }),
  });
}

/** Every result is resolved from the current solution, including seeded practice. */
export function exerciseSummary(exercise: Exercise, solution: Record<string, Value>): string {
  return summarize(
    { ...exercise, learning: exercise.learning ?? exerciseCopies[exercise.id] },
    solution,
  );
}
