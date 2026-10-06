import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import katex from 'katex';
import original from '../src/data/course.json';
import labs from '../src/data/labs.json';
import { algorithms, exercises, measures } from '../src/data';
import { notationLessons } from '../src/data/overview-lessons';
import type { LessonSection } from '../src/data/lesson-types';
import { exerciseCopies } from '../src/engine/exercise-copy';
import { annotateFormula } from '../src/components/math/annotate';
import { widgets } from '../src/components/widgets/catalog';
import { algorithmLessons } from '../src/data/algorithm-lessons';
import { isSubstantiveExplanation } from '../src/engine/explanation-quality';

const lessonGroups: { name: string; sections: LessonSection[] }[] = [
  { name: 'Notation', sections: notationLessons },
  ...algorithms.flatMap((algorithm) =>
    (['method', 'worked', 'evaluation'] as const).map((part) => ({
      name: `${algorithm.slug}: ${part}`,
      sections: algorithm.lesson[part],
    })),
  ),
  ...measures.map((measure) => ({ name: measure.slug, sections: measure.lessonSections })),
];

function renderMath(latex: string) {
  return katex.renderToString(latex, {
    displayMode: true,
    output: 'htmlAndMathml',
    throwOnError: true,
    trust: true,
    strict: false,
  });
}

function prose(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(prose);
  if (value && typeof value === 'object') return Object.values(value).flatMap(prose);
  return [];
}

describe('Course coverage survives editorial cleanup', () => {
  it('keeps glossary source references while identifying rewritten definitions as authored', () => {
    const definitions = Object.values(original.glossary).flat();
    expect(definitions.length).toBeGreaterThan(0);
    for (const definition of definitions) {
      expect(definition.source?.pages.length).toBeGreaterThan(0);
      expect(definition.source?.verbatim).toBe(false);
    }
  });

  it('retains every algorithm, measure, exercise, and explorer', () => {
    expect(algorithms).toHaveLength(12);
    expect(measures).toHaveLength(39);
    expect(exercises).toHaveLength(64);
    expect(widgets).toHaveLength(18);
    expect(algorithms.map((a) => a.slug)).toEqual(original.algorithms.map((a) => a.slug));
    expect(measures.map((m) => m.slug)).toEqual(original.measures.map((m) => m.slug));
    expect(exercises.map((e) => e.id)).toEqual(original.exercises.map((e) => e.id));
    expect(exercises.flatMap((e) => e.steps)).toHaveLength(322);
    for (const exercise of exercises) {
      expect(
        exercise.steps.map((step) => step.id),
        exercise.id,
      ).toEqual(
        original.exercises
          .find((candidate) => candidate.id === exercise.id)!
          .steps.map((step) => step.id),
      );
    }
  });

  for (const algorithm of algorithms) {
    it(`${algorithm.slug}: supplies the problem, decision-time inputs, and costs`, () => {
      for (const text of [
        algorithm.financialProblem,
        algorithm.definition,
        algorithm.intuition,
        algorithm.baseline,
        algorithm.lesson.available,
        algorithm.lesson.costs,
        algorithm.lesson.decision,
      ]) {
        expect(text.trim()).not.toBe('');
      }
      expect(algorithm.useWhen.length).toBeGreaterThan(0);
      expect(algorithm.avoidWhen.length).toBeGreaterThan(0);
      expect(algorithm.useWhen.every((text) => text.trim())).toBe(true);
      expect(algorithm.avoidWhen.every((text) => text.trim())).toBe(true);
    });
  }

  it('keeps lab descriptions consistent between the units and generated labs', () => {
    for (const algorithm of algorithms) {
      const lab = labs[algorithm.slug as keyof typeof labs];
      expect(algorithm.lab.dataset, algorithm.slug).toBe(lab.dataset);
      expect(algorithm.lab.task, algorithm.slug).toBe(lab.task);
      expect(algorithm.lab.requiredComparison, algorithm.slug).toBe(lab.comparison);
    }
  });
});

describe('Mathematical rendering', () => {
  it('retains all 121 original exercise expressions', () => {
    expect(original.exercises.flatMap((exercise) => exercise.latex)).toHaveLength(121);
    for (const exercise of exercises) {
      expect(exercise.latex, exercise.id).toEqual(
        original.exercises.find((candidate) => candidate.id === exercise.id)!.latex,
      );
    }
  });

  for (const exercise of exercises) {
    it(`${exercise.id}: every expression renders before and after symbol annotation`, () => {
      for (const latex of exercise.latex) {
        expect(() => renderMath(latex), latex).not.toThrow();
        const { annotated } = annotateFormula(latex, exercise.symbols);
        expect(() => renderMath(annotated), `${exercise.id}: ${annotated}`).not.toThrow();
      }
    });
  }

  it('keeps annotations valid in single-token subscripts and fraction arguments', () => {
    const symbols = [
      { symbol: 't', meaning: 'Time index' },
      { symbol: 'a', meaning: 'First input' },
      { symbol: 'b', meaning: 'Second input' },
    ];
    const { annotated, meanings } = annotateFormula(String.raw`r_t+\frac a b`, symbols);
    expect(meanings.size).toBe(3);
    expect(() => renderMath(annotated)).not.toThrow();
    expect(renderMath(annotated)).toContain('sym-s0');
  });

  for (const group of lessonGroups) {
    it(`${group.name}: structured lesson expressions render`, () => {
      for (const section of group.sections) {
        for (const block of section.blocks) {
          if (block.kind === 'math') {
            expect(() => renderMath(block.latex), `${section.title}: ${block.latex}`).not.toThrow();
          }
        }
      }
    });
  }
});

describe('Readable, complete lesson content', () => {
  for (const group of lessonGroups) {
    it(`${group.name}: has populated sections and well-formed tables`, () => {
      expect(group.sections.length).toBeGreaterThan(0);
      for (const section of group.sections) {
        expect(section.title.trim()).not.toBe('');
        expect(section.blocks.length).toBeGreaterThan(0);
        for (const block of section.blocks) {
          if (block.kind === 'paragraph') expect(block.text.trim()).not.toBe('');
          if (block.kind === 'math') expect(block.latex.trim()).not.toBe('');
          if (block.kind === 'list') {
            expect(block.items.length).toBeGreaterThan(0);
            expect(block.items.every((item) => item.trim())).toBe(true);
          }
          if (block.kind === 'table') {
            expect(block.headers.length).toBeGreaterThan(0);
            expect(block.rows.length).toBeGreaterThan(0);
            expect(block.headers.every((header) => header.trim())).toBe(true);
            for (const row of block.rows) {
              expect(row, section.title).toHaveLength(block.headers.length);
              expect(
                row.every((cell) => cell.trim()),
                section.title,
              ).toBe(true);
            }
          }
        }
      }
    });
  }

  it('keeps generic fallback prompts and extraction debris out of displayed copy', () => {
    // Raw extraction and provenance records intentionally remain in course.json.
    // Check the fields presented to learners, not the maintenance archive.
    const displayed = [
      ...algorithms.map((a) => ({
        problem: a.financialProblem,
        definition: a.definition,
        intuition: a.intuition,
        baseline: a.baseline,
        useWhen: a.useWhen,
        avoidWhen: a.avoidWhen,
        lesson: a.lesson,
        questions: a.defenseQuestions.map((q) => q.text),
      })),
      ...measures.map((m) => ({
        meaning: m.financialInterpretation,
        example: m.workingExample,
        limitation: m.whatItMisses,
        lessons: m.lessonSections,
      })),
      ...Object.values(exerciseCopies),
      ...Object.values(labs).map((lab) => ({
        dataset: lab.dataset,
        task: lab.task,
        comparison: lab.comparison,
        runtime: lab.siteEdits,
        extension: lab.extension,
        edits: lab.edits.map((edit) => ({ label: edit.label, description: edit.description })),
      })),
      notationLessons,
      widgets.map((widget) => widget.notice),
    ];
    const filler =
      /Read the local definition|on the next slides?|the local slide|the source specifies|Control to teach|Can the student|Do not start with a blank notebook|Provide runnable scaffolding|Choose\. Test\. Defend\.|One decision\. One calculation|Evaluation reminder|The same model can look excellent or poor|Identify the inputs in the formula above|Use the local symbol key|Keep the denominator tied to the population|Compute a fraction between zero and one|Smart quotes repaired|without changing the source method/i;
    for (const text of prose(displayed)) {
      expect(text, text).not.toMatch(filler);
      expect(text, text).not.toMatch(/\bSource:\s*p\.|\/source\/|\bEVALUATION MEASURE \d+ OF 39/i);
      expect(text, text).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/);
    }
  });

  it('requires authored definitions, formula narration, local symbol keys, and independent worked-step reasoning', () => {
    const formulaGaps: string[] = [];
    const symbolGaps: string[] = [];
    for (const algorithm of algorithms) {
      expect(algorithm.definition.length, algorithm.slug).toBeGreaterThan(40);
      expect(algorithmLessons[algorithm.slug]?.definition, `authored definition: ${algorithm.slug}`).toBeTruthy();
      for (const part of ['method', 'worked', 'evaluation'] as const) {
        for (const section of algorithm.lesson[part]) {
          for (const block of section.blocks) {
            if (block.kind === 'math') {
              if (!block.readAloud?.trim()) formulaGaps.push(`${algorithm.slug}: ${block.latex}`);
              if (!Array.isArray(block.symbols)) symbolGaps.push(`${algorithm.slug}: ${block.latex}`);
            }
          }
        }
      }
    }
    for (const measure of measures) {
      for (const section of measure.lessonSections) {
        for (const block of section.blocks) {
          if (block.kind === 'math') {
            if (!block.readAloud?.trim()) formulaGaps.push(`${measure.slug}: ${block.latex}`);
            if (!Array.isArray(block.symbols)) symbolGaps.push(`${measure.slug}: ${block.latex}`);
          }
        }
      }
    }
    const stepGaps = exercises.flatMap((exercise) => exercise.steps
      .filter((step) => !exerciseCopies[exercise.id].steps[step.id].explanation?.trim())
      .map((step) => `${exercise.id}:${step.id}`));
    const exerciseFormulaGaps = exercises.flatMap((exercise) => exercise.latex
      .map((_, index) => `${exercise.id}:${index}`)
      .filter((id) => {
        const [exerciseId, index] = id.split(':');
        const copy = exerciseCopies[exerciseId];
        return !copy.formulas?.[Number(index)]?.readAloud?.trim() || !Array.isArray(copy.formulas?.[Number(index)]?.symbols);
      }));
    expect({
      lessonFormulasWithoutNarration: formulaGaps.length,
      lessonFormulasWithoutSymbolLists: symbolGaps.length,
      exerciseStepsWithoutReasoning: stepGaps.length,
      exerciseFormulasWithoutSpecificMetadata: exerciseFormulaGaps.length,
      examples: [...formulaGaps, ...symbolGaps, ...stepGaps, ...exerciseFormulaGaps].slice(0, 6),
    }).toEqual({
      lessonFormulasWithoutNarration: 0,
      lessonFormulasWithoutSymbolLists: 0,
      exerciseStepsWithoutReasoning: 0,
      exerciseFormulasWithoutSpecificMetadata: 0,
      examples: [],
    });
  });

  it('rejects the retired generic explanation templates', () => {
    expect(isSubstantiveExplanation('This step turns the supplied inputs into a score. First identify the values the formula uses, then carry out the operation and check that the units still make sense.')).toBe(false);
    expect(isSubstantiveExplanation('Read this expression from left to right: identify each supplied value, perform the operation shown, and check that the result has the expected units.')).toBe(false);
    expect(isSubstantiveExplanation('The sigmoid turns a score into a probability between zero and one; zero maps to 50 percent.')).toBe(true);
  });

  it('keeps every delivered notebook synchronized with its runnable lab', () => {
    for (const [slug, lab] of Object.entries(labs)) {
      const copies = ['labs', 'public/notebooks', 'public/labs/files'].map((directory) =>
        readFileSync(new URL(`../${directory}/${slug}.ipynb`, import.meta.url), 'utf8'),
      );
      expect(new Set(copies).size, slug).toBe(1);
      const notebook = JSON.parse(copies[0]);
      expect(notebook.cells[1].source.join(''), slug).toBe(lab.code);
      for (const edit of lab.edits) {
        expect(lab.code.split(edit.find).length - 1, `${slug}: ${edit.label}`).toBe(1);
      }
    }
  });
});
