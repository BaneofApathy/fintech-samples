import type { LessonBlock } from '../lesson-types';
import type { TeachingTopic, PracticeQuestion, QuestionDimension } from '../teaching-types';

export type CheckSeed = [
  prompt: string,
  answer: string,
  reasoning: string,
  wrong1: string,
  wrong2: string,
  hint?: string,
];
export interface MeasureSeed {
  number: number;
  slug: string;
  title: string;
  definition: string;
  precise: string;
  prerequisites: string[];
  terms: [term: string, definition: string, example: string][];
  mechanics: string[];
  formulas: { latex: string; explanation: string; symbols: [string, string][] }[];
  trace: [operation: string, calculation: string, interpretation: string][];
  interpretation: string;
  comparison: string;
  boundaries: string;
  mechanismChecks: [CheckSeed, CheckSeed, CheckSeed];
  calculations: [CheckSeed, CheckSeed, CheckSeed];
  applications: [CheckSeed, CheckSeed, CheckSeed];
}
export const c = (
  prompt: string,
  answer: string,
  reasoning: string,
  wrong1: string,
  wrong2: string,
  hint?: string,
): CheckSeed => [prompt, answer, reasoning, wrong1, wrong2, hint];
export const f = (latex: string, explanation: string, ...symbols: [string, string][]) => ({
  latex,
  explanation,
  symbols,
});
const p = (text: string): LessonBlock => ({ kind: 'paragraph', text });
const roles = ['guided', 'practice', 'review'] as const;
const titles: Record<QuestionDimension, string> = {
  definition: 'Define the measure and its vocabulary',
  mechanism: 'Explain its computation and conventions',
  calculation: 'Calculate a small example',
  application: 'Interpret financial evidence and limitations',
};
const descriptions: Record<QuestionDimension, string> = {
  definition: 'Distinguish the measure from nearby concepts and define its terminology.',
  mechanism: 'Identify the population, denominator, units, direction and aggregation.',
  calculation:
    'Trace substitutions and arithmetic without skipping the meaning of intermediate results.',
  application:
    'Use the result to compare financial decisions while explaining what it cannot establish.',
};

export function makeMeasure(seed: MeasureSeed): TeachingTopic {
  const id = 'measure:' + seed.slug;
  const objective = (dimension: QuestionDimension) => id + ':' + dimension;
  const lesson = (key: string) => id + ':' + key;
  const terms = seed.terms.map(([term, definition, example]) => ({ term, definition, example }));
  const definitionChecks: [CheckSeed, CheckSeed, CheckSeed] = [
    c(
      `Which statement defines ${seed.title} most precisely?`,
      seed.precise,
      seed.definition,
      seed.mechanismChecks[0][3],
      seed.mechanismChecks[0][4],
      `Identify the quantity being measured before choosing a statement.`,
    ),
    c(
      `In ${seed.title}, what does “${terms[0].term}” mean?`,
      terms[0].definition,
      `${terms[0].definition} Example: ${terms[0].example}`,
      `${terms[1].definition}|This defines ${terms[1].term}, rather than ${terms[0].term}.`,
      `${terms[2].definition}|This defines ${terms[2].term}, rather than ${terms[0].term}.`,
      `Recall the example: ${terms[0].example}`,
    ),
    c(
      `Which explanation of “${terms[1].term}” is correct for ${seed.title}?`,
      terms[1].definition,
      `${terms[1].definition} Example: ${terms[1].example}`,
      `${terms[2].definition}|This describes ${terms[2].term}.`,
      `${terms[0].definition}|This describes ${terms[0].term}.`,
      `Compare the roles of ${terms[0].term} and ${terms[1].term}.`,
    ),
  ];
  const groups: [QuestionDimension, CheckSeed[]][] = [
    ['definition', definitionChecks],
    ['mechanism', seed.mechanismChecks],
    ['calculation', seed.calculations],
    ['application', seed.applications],
  ];
  const questions: PracticeQuestion[] = groups.flatMap(([dimension, checks]) =>
    checks.map((check, index) => {
      const [prompt, answer, arithmeticOrReason, wrong1, wrong2, hint] = check;
      const reasoning =
        dimension === 'calculation'
          ? `${arithmeticOrReason} ${seed.interpretation}`
          : arithmeticOrReason;
      const rows = [
        { id: 'correct', text: answer, explanation: reasoning },
        ...[wrong1, wrong2].map((wrong, i) => {
          const [text, feedback] = wrong.split('|');
          if (!feedback?.trim())
            throw new Error(`${seed.slug}: missing misconception feedback for “${text}”`);
          return { id: 'alternative-' + (i + 1), text, explanation: `${feedback} ${reasoning}` };
        }),
      ];
      // Stable choice identities survive presentation order and progress reloads.
      const offset = (seed.number + index) % rows.length;
      const ordered = rows.slice(offset).concat(rows.slice(0, offset));
      const lessonKey =
        dimension === 'definition'
          ? 'meaning'
          : dimension === 'mechanism'
            ? index === 2
              ? 'formula'
              : 'mechanics'
            : dimension === 'calculation'
              ? 'worked'
              : 'decisions';
      return {
        id: `${id}:${dimension}:${roles[index]}`,
        topicId: id,
        objectiveId: objective(dimension),
        dimension,
        difficulty: index === 0 ? 'introductory' : index === 1 ? 'standard' : 'challenge',
        role: roles[index],
        prompt,
        choices: ordered,
        correctChoiceId: 'correct',
        hint: hint ?? seed.mechanics[Math.min(index, seed.mechanics.length - 1)],
        explanation: reasoning,
        lessonId: lesson(lessonKey),
      };
    }),
  );
  return {
    id,
    kind: 'measure',
    slug: seed.slug,
    title: seed.title,
    definition: seed.definition,
    preciseDefinition: seed.precise,
    prerequisites: seed.prerequisites,
    terms,
    objectives: (['definition', 'mechanism', 'calculation', 'application'] as const).map(
      (dimension) => ({
        id: objective(dimension),
        dimension,
        title: titles[dimension],
        description: descriptions[dimension],
      }),
    ),
    lessons: [
      {
        id: lesson('meaning'),
        title: 'Meaning and vocabulary',
        section: 'learn',
        objectiveId: objective('definition'),
        blocks: [
          p(seed.definition),
          p(seed.precise),
          {
            kind: 'table',
            headers: ['Term', 'Precise meaning', 'Tiny financial example'],
            rows: seed.terms,
          },
        ],
      },
      {
        id: lesson('mechanics'),
        title: 'How the measure is constructed',
        section: 'learn',
        objectiveId: objective('mechanism'),
        blocks: seed.mechanics.map(p),
      },
      {
        id: lesson('formula'),
        title: 'Read each formula and its units',
        section: 'calculate',
        objectiveId: objective('mechanism'),
        blocks: seed.formulas.flatMap((formula) => [
          {
            kind: 'math',
            latex: formula.latex,
            readAloud: formula.explanation,
            symbols: formula.symbols.map(([symbol, meaning]) => ({ symbol, meaning })),
          } as LessonBlock,
          p(formula.explanation),
        ]),
      },
      {
        id: lesson('worked'),
        title: 'A small example, traced completely',
        section: 'calculate',
        objectiveId: objective('calculation'),
        blocks: [
          {
            kind: 'table',
            headers: ['Step', 'Substitution and arithmetic', 'What this result means'],
            rows: seed.trace,
          },
          p(seed.interpretation),
        ],
      },
      {
        id: lesson('decisions'),
        title: 'Interpret, compare, and check the boundaries',
        section: 'interpret',
        objectiveId: objective('application'),
        blocks: [
          p(seed.interpretation),
          p(seed.comparison),
          p(seed.boundaries),
          {
            kind: 'list',
            items: [
              'Keep the population, time horizon, and units fixed when comparing results.',
              'Inspect the underlying observations and assumptions before turning a score into a financial action.',
            ],
          },
        ],
      },
    ],
    questions,
  };
}
