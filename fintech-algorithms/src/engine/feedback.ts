import type { Step, Givens, Value } from './types';
import { near } from './check';
import { solve } from './solve/core';
export function feedback(
  id: string,
  step: Step,
  answer: Value,
  expected: Value,
  g: Givens,
): { pattern: string; message: string } {
  if (
    id === 'A01' &&
    step.id === 'z' &&
    typeof answer === 'number' &&
    near(answer, Number(solve(id, { ...g, DTI: Number(g.DTI) / 100 }).z))
  )
    return {
      pattern: 'DTI-fraction',
      message: `DTI is in percentage points. Use ${g.DTI} in this model, rather than ${Number(g.DTI) / 100}.`,
    };
  if (
    typeof answer === 'number' &&
    typeof expected === 'number' &&
    expected !== 0 &&
    step.unit === 'proportion' &&
    (near(answer, expected * 100) || near(answer, expected / 100))
  )
    return {
      pattern: 'percent-scale',
      message: 'Check the scale. Enter a proportion or add the percent sign to a percentage.',
    };
  if (
    id === 'M03' &&
    step.id === 'recall' &&
    typeof answer === 'number' &&
    near(answer, Number(g.TP) / (Number(g.TP) + Number(g.FP)))
  )
    return {
      pattern: 'denominator',
      message: 'That is precision. Recall divides caught frauds by all actual frauds.',
    };
  if (Array.isArray(expected))
    return {
      pattern: 'cells',
      message:
        'Check each cell in order and keep the stated units; only the marked cells need another attempt.',
    };
  return {
    pattern: 'recompute',
    message: `Not quite. ${step.hints[0] ?? `Check ${step.title.toLowerCase()} using the displayed inputs.`}`,
  };
}
