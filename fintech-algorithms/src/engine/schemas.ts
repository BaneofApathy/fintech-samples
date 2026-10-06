import { z } from 'zod';
export const sourceSchema = z.object({
  pages: z.array(z.number().int().min(1).max(689)).min(1),
  verbatim: z.boolean().optional(),
});
export const stepSchema = z.object({
  id: z.string(),
  title: z.string(),
  expects: z.enum(['number', 'integer', 'boolean', 'choice', 'cells']),
  unit: z.string().optional(),
  hints: z.array(z.string()).min(1),
  mistakes: z.array(z.object({ pattern: z.string(), message: z.string() })).min(1),
  tolerance: z.object({ rel: z.number(), abs: z.number() }).optional(),
  choices: z.array(z.string()).optional(),
});
export const exerciseSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(['algorithm', 'measure', 'skill']),
    parent: z.string(),
    minutes: z.number(),
    question: z.string(),
    source: sourceSchema,
    steps: z.array(stepSchema).min(1),
    givens: z.record(z.string(), z.union([z.number(), z.array(z.number())])),
    deckSolution: z.record(
      z.string(),
      z.union([z.number(), z.boolean(), z.string(), z.array(z.number())]),
    ),
    latex: z.array(z.string()).min(1),
    symbols: z
      .array(z.object({ symbol: z.string(), meaning: z.string(), source: sourceSchema }))
      .min(1),
  })
  .passthrough();
export const algorithmSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    number: z.number().int(),
    group: z.string(),
    source: sourceSchema,
    measures: z.array(z.string()),
    exercises: z.array(z.string()),
    defenseQuestions: z.array(z.object({ text: z.string(), source: sourceSchema })),
  })
  .passthrough();
export const measureSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    number: z.number().int(),
    source: sourceSchema,
    usedBy: z.array(z.string()),
    exercises: z.array(z.string()),
    question: z.enum(['rank', 'probability', 'rare', 'forecast', 'retrieve', 'act', 'operate']),
  })
  .passthrough();
