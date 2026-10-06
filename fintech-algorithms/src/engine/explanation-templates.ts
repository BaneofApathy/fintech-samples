import type { Givens, Step, Value } from './types';
import { format } from './check';

type Scope = { inputs: string[]; results: string[] };
const placeholders = /\{\{(input|result)\.([A-Za-z0-9_-]+)\}\}/g;

/** Check authored template keys before an explanation reaches a renderer. */
export function validateExplanationTemplate(text: string, id: string, scope: Scope): void {
  const recognized = text.replace(placeholders, (_match, kind: 'input' | 'result', key: string) => {
    const allowed = kind === 'input' ? scope.inputs : scope.results;
    if (!allowed.includes(key)) throw new Error(`Unknown ${kind} placeholder ${id}:{{${kind}.${key}}}`);
    return '';
  });
  if (recognized.includes('{{') || recognized.includes('}}'))
    throw new Error(`Malformed or unsupported explanation placeholder in ${id}`);
}

function inputUnit(label: string): string {
  if (/\(\s*proportion\s*\)|\bprobability\s*\(0\s*to\s*1\)/i.test(label)) return 'proportion';
  if (/\(\s*\$\s*\)|\bdollars?\b/i.test(label) && !/thousand|million/i.test(label)) return '$';
  return '';
}

/** Resolve only current case inputs and solver results; never authored example constants. */
export function resolveExplanation(
  text: string,
  id: string,
  labels: Record<string, string>,
  givens: Givens,
  solution: Record<string, Value>,
  steps: Step[],
): string {
  const scope = { inputs: Object.keys(givens), results: Object.keys(solution) };
  validateExplanationTemplate(text, id, scope);
  return text.replace(placeholders, (_match, kind: 'input' | 'result', key: string) => {
    if (kind === 'input') return format(givens[key], inputUnit(labels[key] ?? ''));
    const step = steps.find((candidate) => candidate.id === key);
    return format(solution[key], step?.unit);
  });
}
