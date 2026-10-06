import type { Exercise, Value } from './types';
import { format } from './check';

/** Uses only the active exercise's server-authored copy, never the whole course catalog. */
export function exerciseSummary(exercise: Exercise, solution: Record<string, Value>): string {
  const copy = exercise.learning;
  if (!copy) throw new Error(`Missing authored copy for ${exercise.id}`);
  return copy.summary.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in solution)) throw new Error(`Missing summary result ${exercise.id}:${key}`);
    return format(solution[key], copy.steps[key]?.unit);
  });
}
