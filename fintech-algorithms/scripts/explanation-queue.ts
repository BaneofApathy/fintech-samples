/** Item-level editorial work queue. Run with `node --import tsx scripts/explanation-queue.ts --init`. */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { course } from '../src/data/index';
import { algorithmLessons } from '../src/data/algorithm-lessons';
import { algorithmVisuals } from '../src/data/algorithm-visuals';
import { financialCases } from '../src/data/financial-cases';
import { visualRegistry } from '../src/data/visual-registry';
import { exerciseCopies } from '../src/engine/exercise-copy';
import { measures } from '../src/data/index';
import { widgetGuides } from '../src/components/widgets/guidance';
import labs from '../src/data/labs.json';
import { checkpointQuestions } from '../src/engine/checkpoint-questions';
import { notationLessons } from '../src/data/overview-lessons';

type Row = {
  id: string;
  job: string;
  source: string;
  field: string;
  route: string;
  state: string;
  sourceHash: string;
  before: string;
  current?: string;
  auditValue?: unknown;
  editorial: 'pending' | 'rewritten' | 'reviewed-unchanged';
  beforeAfter?: { before: string; after: string };
  rationale?: string;
  verification: 'pending' | 'verified';
  evidence: string[];
  staleFrom?: string;
};
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value) ?? 'undefined').digest('hex').slice(0, 16);
const rows: Row[] = [];
function add(id: string, job: string, source: string, field: string, route: string, state: string, value: unknown) {
  const before = typeof value === 'string' ? value : JSON.stringify(value);
  rows.push({ id, job, source, field, route, state, sourceHash: hash(value), before: (before ?? 'undefined').slice(0, 240), ...(state === 'formula' ? { auditValue: value } : {}), editorial: 'pending', verification: 'pending', evidence: [] });
}
const jobs = [
  ...Array.from({ length: 12 }, (_, i) => [`U${String(i + 1).padStart(2, '0')}-A`, `U${String(i + 1).padStart(2, '0')}-B`, `U${String(i + 1).padStart(2, '0')}-C`, `U${String(i + 1).padStart(2, '0')}-D`]).flat(),
  'S-RAG', 'S-RL', ...Array.from({ length: 17 }, (_, i) => `M${String(i + 1).padStart(2, '0')}`),
  'F-FOUNDATIONS', 'P-HOME', 'P-MEASURE-DIRECTORY', ...Array.from({ length: Math.ceil(Object.values(course.glossary as Record<string, any[]>).reduce((count, definitions) => count + definitions.length, 0) / 40) }, (_, i) => `P-GLOSSARY-${String(i + 1).padStart(2, '0')}`), 'P-PROGRESS', 'P-SYNTHESIS', 'P-INSTRUCTOR',
];
const slugToUnit = new Map(course.algorithms.map((a: any, i: number) => [a.slug, `U${String(i + 1).padStart(2, '0')}`]));
function lessonBlocks(value: any, id: string, job: string, src: string, route: string, path: string) {
  if (Array.isArray(value)) value.forEach((v, i) => lessonBlocks(v, id, job, src, route, `${path}.${i}`));
  else if (value && typeof value === 'object') {
    if (value.kind === 'paragraph') add(`${id}:${path}`, job, src, path, route, 'initial', value.text);
    if (value.kind === 'math') add(`${id}:${path}:formula`, job, src, path, route, 'formula', { latex: value.latex, readAloud: value.readAloud, symbols: value.symbols });
    if (value.kind === 'table') add(`${id}:${path}:table`, job, src, path, route, 'table', value);
    if (value.kind === 'list') value.items.forEach((item: string, i: number) => add(`${id}:${path}:item:${i + 1}`, job, src, `${path}.items[${i}]`, route, 'list-item', item));
    for (const [key, child] of Object.entries(value)) lessonBlocks(child, id, job, src, route, `${path}.${key}`);
  }
}
for (const a of course.algorithms as any[]) {
  const unit = slugToUnit.get(a.slug)!;
  const authored = algorithmLessons[a.slug];
  for (const key of ['definition', 'intuition', 'financialProblem', 'available', 'costs', 'decision', 'baseline', 'prerequisites', 'learningOutcomes', 'useWhen', 'avoidWhen', 'question']) {
    const value = (authored as any)[key] ?? a[key];
    if (value !== undefined) add(`algorithm:${a.slug}:${key}`, `${unit}-A`, 'src/data/algorithm-lessons.ts', key, `/algorithms/${a.slug}/`, 'content', value);
  }
  lessonBlocks(authored, `algorithm:${a.slug}`, `${unit}-A`, 'src/data/algorithm-lessons.ts', `/algorithms/${a.slug}/`, 'lesson');
  for (const section of a.defenseQuestions ?? []) add(`defense:${a.slug}:${section.id ?? hash(section)}`, `${unit}-D`, 'src/data/course.json + src/data/algorithm-lessons.ts', 'defenseQuestions', `/algorithms/${a.slug}/defend/`, 'prompt', section.text ?? section);
  for (const [i, q] of ((checkpointQuestions as any)[a.slug] ?? []).entries()) add(`checkpoint:${a.slug}:${i + 1}`, `${unit}-A`, 'src/engine/checkpoint-questions.ts', `${a.slug}[${i}]`, `/algorithms/${a.slug}/check/`, 'question-feedback', q);
  for (const e of a.exercises ?? []) void e;
}
for (const e of course.exercises as any[]) {
  const copy: any = exerciseCopies[e.id];
  const parent = e.parent;
  const unit = slugToUnit.get(parent);
  const measure = (course.measures as any[]).find((m) => m.exercises?.includes(e.id));
  const measureNumber = Number(measure?.number ?? 1);
  const measureJob = e.id === 'M32b' || e.id === 'M32c' ? 13
    : e.id === 'M39c' || e.id === 'M39d' ? 17
      : measureNumber <= 3 ? 1 : measureNumber <= 7 ? 2 : measureNumber <= 11 ? 3 : measureNumber <= 13 ? 4 : measureNumber <= 16 ? 5 : measureNumber <= 17 ? 6 : measureNumber <= 19 ? 7 : measureNumber <= 23 ? 8 : measureNumber <= 25 ? 9 : measureNumber <= 27 ? 10 : measureNumber <= 30 ? 11 : measureNumber <= 32 ? 12 : measureNumber <= 35 ? 14 : measureNumber <= 37 ? 15 : measureNumber <= 39 ? 16 : 17;
  const job = e.id === 'M32b' || e.id === 'M32c'
    ? 'M13'
    : measure ? `M${String(measureJob).padStart(2, '0')}` : unit ? `${unit}-A` : e.id === 'S01' || e.id === 'S02' ? 'S-RAG' : e.id === 'S03' || e.id === 'S04' ? 'S-RL' : 'P-SYNTHESIS';
  const route = `/exercises/${e.id}/`;
  for (const step of e.steps) {
    const text = copy.steps[step.id];
    add(`exercise:${e.id}:step:${step.id}`, job, 'scripts/exercise-copy.json', `steps.${step.id}.explanation`, route, 'worked-result', text.explanation);
    add(`exercise:${e.id}:step:${step.id}:title`, job, 'scripts/exercise-copy.json', `steps.${step.id}.title/unit`, route, 'label', { title: text.title, unit: text.unit });
    text.hints.forEach((hint: string, i: number) => add(`exercise:${e.id}:step:${step.id}:hint:${i + 1}`, job, 'scripts/exercise-copy.json', `steps.${step.id}.hints[${i}]`, route, 'hint', hint));
  }
  e.latex.forEach((latex: string, i: number) => add(`exercise:${e.id}:formula:${i}`, job, 'scripts/exercise-copy.json + course formula source', `latex[${i}]/formulas[${i}]`, route, 'formula', { latex, ...(copy.formulas?.[i] ?? { readAloud: copy.readAloud[i], symbols: undefined }) }));
  for (const [i, symbol] of (e.symbols ?? []).entries())
    add(`exercise:${e.id}:symbol:${i}`, job, 'src/data/course.json', `symbols[${i}]`, route, 'local-symbol-meaning', symbol);
  for (const [key, value] of Object.entries(copy.labels)) add(`exercise:${e.id}:label:${key}`, job, 'scripts/exercise-copy.json', `labels.${key}`, route, 'input-label-and-units', value);
  for (const key of ['scenario', 'task', 'interpretation', 'summary']) add(`exercise:${e.id}:${key}`, job, 'scripts/exercise-copy.json', key, route, 'content', copy[key]);
  copy.workedExplanation.forEach((text: string, i: number) => add(`exercise:${e.id}:worked-explanation:${i + 1}`, job, 'scripts/exercise-copy.json', `workedExplanation[${i}]`, route, 'worked-interpretation', text));
  copy.workedArithmetic.forEach((text: string, i: number) => add(`exercise:${e.id}:worked-arithmetic:${i + 1}`, job, 'scripts/exercise-copy.json', `workedArithmetic[${i}]`, route, 'worked-calculation', text));
}
for (const a of course.algorithms as any[]) {
  const unit = slugToUnit.get(a.slug)!;
  for (let i = 0; i < 8; i++) {
    const item = financialCases.filter((c: any) => c.algorithmSlug === a.slug)[i];
    if (!item) continue;
    const job = `${unit}-${i < 4 ? 'B' : 'C'}`;
    const route = `/financial-problems/${a.slug}/${item.slug}/`;
    for (const field of ['question','controlLabel','takeaway'] as const) add(`case:${a.slug}:${i + 1}:${field}`, job, 'src/data/financial-cases/* + storyboards.ts', `${item.slug}.${field}`, route, 'case-introduction', item[field]);
    for (let state = 0; state < 3; state++) {
      const frame = item.frames[state];
      add(`case:${a.slug}:${i + 1}:state:${state + 1}`, job, 'src/data/financial-cases/* + storyboards.ts', `case[${item.slug}].frames[${state}]`, route, String(frame.label), frame);
      for (const field of ['label','caption','result','metric','rows'] as const) add(`case:${a.slug}:${i + 1}:state:${state + 1}:${field}`, job, 'src/data/financial-cases/* + storyboards.ts', `frames[${state}].${field}`, route, String(frame.label), frame[field]);
      for (const [j, mark] of (frame.marks ?? []).entries()) if (mark.kind === 'text') add(`case:${a.slug}:${i + 1}:state:${state + 1}:diagram-label:${j + 1}`, job, 'src/data/financial-cases/* + storyboards.ts', `frames[${state}].marks[${j}].text`, route, String(frame.label), mark.text);
    }
  }
}
for (const [slug, visual] of Object.entries(algorithmVisuals) as [string, any][]) {
  const unit = slugToUnit.get(slug)!;
  const route = `/algorithms/${slug}/intuition/#algorithm-visual`;
  visual.steps.forEach((step: any, i: number) => {
    const prefix = `visual:algorithm:${slug}:step:${i + 1}`;
    for (const field of ['title', 'explanation', 'formula'] as const)
      add(`${prefix}:${field}`, `${unit}-A`, 'src/data/algorithm-visuals.ts', `steps[${i}].${field}`, route, `walkthrough-step-${i + 1}`, step[field]);
    step.terms.forEach((term: string, j: number) =>
      add(`${prefix}:term:${j + 1}`, `${unit}-A`, 'src/data/algorithm-visuals.ts', `steps[${i}].terms[${j}]`, route, `walkthrough-step-${i + 1}`, term),
    );
    step.exerciseSteps.forEach((exerciseStep: string, j: number) =>
      add(`${prefix}:exercise-step:${j + 1}`, `${unit}-A`, 'src/data/algorithm-visuals.ts', `steps[${i}].exerciseSteps[${j}]`, route, `walkthrough-step-${i + 1}`, exerciseStep),
    );
  });
  add(`visual:algorithm:${slug}:prediction:question`, `${unit}-A`, 'src/data/algorithm-visuals.ts', 'prediction.question', route, 'prediction-before-answer', visual.prediction.question);
  visual.prediction.options.forEach((option: string, i: number) =>
    add(`visual:algorithm:${slug}:prediction:option:${i + 1}`, `${unit}-A`, 'src/data/algorithm-visuals.ts', `prediction.options[${i}]`, route, 'prediction-before-answer', option),
  );
  add(`visual:algorithm:${slug}:prediction:explanation`, `${unit}-A`, 'src/data/algorithm-visuals.ts', 'prediction.explanation', route, 'prediction-after-reveal', visual.prediction.explanation);
}
for (const v of visualRegistry as any[]) {
  const example = (course.exercises as any[]).find((e) => e.id === v.exampleReference);
  const algorithm = (course.algorithms as any[]).find((a) => a.slug === example?.parent);
  const measure = (course.measures as any[]).find((m) => m.slug === v.measureLinks?.[0]);
  const unit = algorithm && slugToUnit.get(algorithm.slug);
  const number = Number(measure?.number ?? 1);
  const measureBatch = number <= 3 ? 1 : number <= 7 ? 2 : number <= 11 ? 3 : number <= 13 ? 4 : number <= 16 ? 5 : number <= 17 ? 6 : number <= 19 ? 7 : number <= 23 ? 8 : number <= 25 ? 9 : number <= 27 ? 10 : number <= 30 ? 11 : number <= 32 ? 12 : number <= 35 ? 14 : number <= 37 ? 15 : 16;
  const job = unit ? `${unit}-A` : measure ? `M${String(measureBatch).padStart(2, '0')}` : 'F-FOUNDATIONS';
  const route = v.href ?? '/visuals/';
  add(`visual:${v.category}:${v.id}:overview`, job, 'src/data/visual-registry.ts', `${v.id}.question/takeaway/textAlternative`, route, 'overview', { question: v.question, takeaway: v.takeaway, textAlternative: v.textAlternative });
  for (const [i, state] of (v.states ?? []).entries()) add(`visual:${v.category}:${v.id}:state:${i + 1}`, job, 'src/data/visual-registry.ts + visual source', `${v.id}.states[${i}]`, route, String(state), state);
  for (const control of v.controls ?? []) add(`visual:${v.category}:${v.id}:control:${hash(control)}`, job, 'src/data/visual-registry.ts + visual source', `${v.id}.controls`, route, String(control), control);
}
for (const m of measures as any[]) {
  const src: any = m.lessonSections;
  const n = Number(m.number);
  const batchNo = n <= 3 ? 1 : n <= 7 ? 2 : n <= 11 ? 3 : n <= 13 ? 4 : n <= 16 ? 5 : n <= 17 ? 6 : n <= 19 ? 7 : n <= 23 ? 8 : n <= 25 ? 9 : n <= 27 ? 10 : n <= 30 ? 11 : n <= 32 ? 12 : n <= 35 ? 14 : n <= 37 ? 15 : n <= 39 ? 16 : 17;
  const batch = `M${String(batchNo).padStart(2, '0')}`;
  add(`measure:${String(n).padStart(2,'0')}:${m.slug}:overview`, batch, 'src/data/measure-lessons.ts', 'financialInterpretation/workingExample/whatItMisses', `/measures/${m.slug}/`, 'overview', [m.financialInterpretation, m.workingExample, m.whatItMisses]);
  if (n === 32) {
    for (const [sectionIndex, section] of src.entries()) {
      for (const [blockIndex, block] of (section.blocks ?? []).entries()) {
        lessonBlocks(
          block,
          `measure:${String(n).padStart(2,'0')}:${m.slug}`,
          blockIndex === 0 ? 'M12' : 'M13',
          'src/data/measure-lessons.ts',
          `/measures/${m.slug}/`,
          `lesson.${sectionIndex}.blocks.${blockIndex}`,
        );
      }
    }
  } else lessonBlocks(src, `measure:${String(n).padStart(2,'0')}:${m.slug}`, batch, 'src/data/measure-lessons.ts', `/measures/${m.slug}/`, 'lesson');
}
for (const category of ['F-FOUNDATIONS','P-HOME','P-MEASURE-DIRECTORY','P-GLOSSARY-01','P-PROGRESS','P-SYNTHESIS','P-INSTRUCTOR'])
  add(`support:${category}:source-review`, category, 'src/pages/** + src/data/**', 'learner-facing text and states', '/', 'all-visible-and-interactive-states', 'manual source scan required');
lessonBlocks(notationLessons, 'foundation:notation', 'F-FOUNDATIONS', 'src/data/overview-lessons.ts', '/foundations/', 'notation');
add('foundation:formula:logistic', 'F-FOUNDATIONS', 'src/pages/foundations.astro', 'Formula readAloud/symbols', '/foundations/#formula', 'visible-equation', {
  latex: String.raw`p=\frac{1}{1+e^{-z}}`,
  readAloud: 'The score z can be negative or positive, but a probability stays between 0 and 1. The sigmoid converts the score to that range. A score of zero gives 0.50, or a 50% estimated chance; a negative score gives less than 50%. This is an estimate, not a lending decision.',
  symbols: ['p','z','e'],
});
add('foundation:quiz:all-concepts', 'F-FOUNDATIONS', 'src/components/exercise/StartQuiz.svelte', 'question, options, feedback and retry states', '/foundations/#quiz', 'before-answer-and-after-answer', 'manual component review required');
for (const [id, guide] of Object.entries(widgetGuides)) {
  const algorithm = (course.algorithms as any[]).find((a) => a.widgets?.includes(id));
  const measure = (course.measures as any[]).find((m) => m.widget === id);
  const unit = algorithm && slugToUnit.get(algorithm.slug);
  const number = Number(measure?.number ?? 1);
  const batchNo = number <= 3 ? 1 : number <= 7 ? 2 : number <= 11 ? 3 : number <= 13 ? 4 : number <= 16 ? 5 : number <= 17 ? 6 : number <= 19 ? 7 : number <= 23 ? 8 : number <= 25 ? 9 : number <= 27 ? 10 : number <= 30 ? 11 : number <= 32 ? 12 : number <= 35 ? 14 : number <= 37 ? 15 : 16;
  const job = unit ? `${unit}-A` : measure ? `M${String(batchNo).padStart(2, '0')}` : 'P-SYNTHESIS';
  for (const field of ['question','experiment','prediction','primaryControls','primaryResults','axisLabel'] as const)
    add(`explorer:${id}:${field}`, job, 'src/components/widgets/guidance.ts', field, `/explorers/${id}/`, field, guide[field]);
}
for (const [slug, lab] of Object.entries(labs as Record<string, any>)) {
  const unit = slugToUnit.get(slug) ?? 'P-SYNTHESIS';
  for (const [field, value] of Object.entries(lab)) add(`lab:${slug}:${field}`, `${unit}-D`, 'src/data/labs.json + scripts/lab_content.py', field, `/algorithms/${slug}/build/`, 'lab-guide', value);
}
const glossaryEntries = Object.entries(course.glossary as Record<string, any>);
let glossaryDefinitionIndex = 0;
glossaryEntries.forEach(([term, definitions]) => {
  const job = `P-GLOSSARY-${String(Math.floor(glossaryDefinitionIndex / 40) + 1).padStart(2, '0')}`;
  add(`glossary:${term}`, job, 'src/data/course.json + src/data/index.ts', term, '/glossary/', 'term-and-local-meanings', definitions);
  for (const [context, definition] of (definitions as any[]).entries()) {
    const contextJob = `P-GLOSSARY-${String(Math.floor(glossaryDefinitionIndex / 40) + 1).padStart(2, '0')}`;
    add(`glossary:${term}:context:${context}`, contextJob, 'src/data/course.json + src/data/index.ts', `${term}[${context}]`, '/glossary/', definition.exercise ?? 'local-context', definition);
    glossaryDefinitionIndex++;
  }
});
for (const [source, route, job] of [
  ['src/pages/index.astro','/','P-HOME'], ['src/data/learning-path.ts','/','P-HOME'],
  ['src/pages/library.astro','/library/','P-HOME'], ['src/pages/measures/index.astro','/measures/','P-MEASURE-DIRECTORY'],
  ['src/pages/measure-picker.astro','/measure-picker/','P-MEASURE-DIRECTORY'], ['src/pages/progress.astro','/progress/','P-PROGRESS'],
  ['src/pages/synthesis/index.astro','/synthesis/','P-SYNTHESIS'], ['src/pages/instructor/index.astro','/instructor/','P-INSTRUCTOR'],
  ['src/pages/instructor/present/[slug].astro','/instructor/present/','P-INSTRUCTOR'], ['src/pages/foundations.astro','/foundations/','F-FOUNDATIONS'],
]) add(`page:${source}`, job, source, 'all learner-facing copy, export and accessibility states', route, 'rendered-states', source);

const queuePath = new URL('../qa/explanation-queue.json', import.meta.url);
const command = process.argv[2];
if (command === '--generate') {
  await writeFile(queuePath, JSON.stringify({ schemaVersion: 1, jobs, rows }) + '\n');
  console.log(`Generated ${rows.length} editorial inventory items.`);
} else if (command === '--init') {
  try {
    await readFile(queuePath, 'utf8');
    throw new Error('Queue already exists; use --refresh so completed review records are preserved.');
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(queuePath, JSON.stringify({ schemaVersion: 1, created: new Date().toISOString(), jobs, rows }, null, 2) + '\n');
  console.log(`Created ${rows.length} pending review items across ${jobs.length} jobs.`);
} else {
  const saved = JSON.parse(await readFile(queuePath, 'utf8'));
  const stale = saved.rows.filter((r: Row) => {
    const current = rows.find((n) => n.id === r.id);
    return !current || current.sourceHash !== r.sourceHash || current.job !== r.job;
  });
  const pending = saved.rows.filter((r: Row) => r.editorial === 'pending' || r.verification !== 'verified');
  if (command === '--refresh') {
    const old = new Map(saved.rows.map((r: Row) => [r.id, r]));
    const merged: Row[] = rows.map((current): Row => {
      const previous = old.get(current.id) as Row | undefined;
      if (!previous) return current;
      if (previous.job !== current.job) return { ...current, before: previous.before, current: current.before, editorial: 'pending', verification: 'pending', evidence: [], staleFrom: previous.sourceHash };
      if (previous.sourceHash !== current.sourceHash) return { ...current, before: previous.before, current: current.before, editorial: 'pending', verification: 'pending', evidence: [], staleFrom: previous.sourceHash };
      return { ...current, before: previous.before, editorial: previous.editorial, verification: previous.verification, evidence: previous.evidence, ...(previous.beforeAfter ? { beforeAfter: previous.beforeAfter } : {}), ...(previous.rationale ? { rationale: previous.rationale } : {}), ...(previous.current ? { current: previous.current } : {}), ...(previous.staleFrom ? { staleFrom: previous.staleFrom } : {}) };
    });
    await writeFile(queuePath, JSON.stringify({ ...saved, updated: new Date().toISOString(), jobs, rows: merged }, null, 2) + '\n');
    console.log(JSON.stringify({ items: merged.length, new: merged.filter((r: Row) => !old.has(r.id)).length, resetForEdits: merged.filter((r: any) => r.staleFrom).length }, null, 2));
  } else if (command === '--mark-rewritten' || command === '--mark-unchanged') {
    const id = process.argv[3];
    const flag = command === '--mark-rewritten' ? '--after' : '--because';
    const detailIndex = process.argv.indexOf(flag, 4);
    const beforeIndex = process.argv.indexOf('--before', 4);
    const detail = detailIndex >= 0 ? process.argv[detailIndex + 1]?.trim() : '';
    const row = saved.rows.find((r: Row) => r.id === id);
    if (!row || !detail) throw new Error('Provide an exact item ID and --after/--because text.');
    if (beforeIndex >= 0 && process.argv[beforeIndex + 1]) row.before = process.argv[beforeIndex + 1].trim();
    if (command === '--mark-rewritten') row.beforeAfter = { before: row.before, after: detail };
    else row.rationale = detail;
    row.editorial = command === '--mark-rewritten' ? 'rewritten' : 'reviewed-unchanged';
    row.verification = 'pending';
    await writeFile(queuePath, JSON.stringify({ ...saved, updated: new Date().toISOString() }, null, 2) + '\n');
  } else if (command === '--verify') {
    const id = process.argv[3];
    const evidence = process.argv.slice(4).join(' ').replace(/^--evidence\s+/, '').trim();
    const row = saved.rows.find((r: Row) => r.id === id);
    if (!row || !evidence || row.editorial === 'pending') throw new Error('Review the exact item first, then provide browser/test evidence.');
    if (stale.some((item: Row) => item.id === id)) throw new Error(`Item is stale and must be reviewed again: ${id}`);
    row.verification = 'verified';
    row.evidence.push(evidence);
    await writeFile(queuePath, JSON.stringify({ ...saved, updated: new Date().toISOString() }, null, 2) + '\n');
  } else if (command === '--batch') {
    const job = process.argv[3];
    const jobRows = saved.rows.filter((r: Row) => r.job === job);
    const claimed = jobRows.filter((r: Row) => r.editorial !== 'pending');
    const invalid = claimed.filter((r: Row) => r.verification !== 'verified' || stale.includes(r) || (!r.beforeAfter && !r.rationale) || !r.evidence.length);
    console.log(JSON.stringify({ job, items: jobRows.length, claimedComplete: claimed.length, verified: claimed.length - invalid.length, remainingPending: jobRows.length - claimed.length, invalidClaims: invalid.map((r: Row) => r.id) }, null, 2));
    if (!job || invalid.length || (process.argv.includes('--complete') && claimed.length !== jobRows.length)) process.exitCode = 1;
  } else if (command === '--final') {
    const missingStepExplanations = rows.filter((r) => r.id.startsWith('exercise:') && r.id.includes(':step:') && !r.id.includes(':hint:') && !r.id.includes(':title') && r.before === 'undefined');
    const missingExerciseFormulaMetadata = rows.filter((r) => {
      if (!r.id.startsWith('exercise:') || !r.id.includes(':formula:')) return false;
      const formula: any = r.auditValue;
      return !formula?.readAloud || !Array.isArray(formula.symbols);
    });
    const lessonFormulaRows = rows.filter((r) => r.id.includes(':formula') && r.state === 'formula' && !r.id.startsWith('exercise:'));
    const missingLessonFormulaNarration = lessonFormulaRows.filter((r) => !(r.auditValue as any)?.readAloud);
    const missingLessonFormulaSymbols = lessonFormulaRows.filter((r) => !Array.isArray((r.auditValue as any)?.symbols));
    const missingAlgorithmDefinitions = rows.filter((r) => r.id.startsWith('algorithm:') && r.id.endsWith(':definition') && r.before === 'undefined');
    const authoredGaps = [ ...missingStepExplanations, ...missingExerciseFormulaMetadata, ...missingLessonFormulaNarration, ...missingLessonFormulaSymbols, ...missingAlgorithmDefinitions ];
    const boilerplate = rows.filter((r) => /identify each supplied value, perform the operation shown|turns the supplied inputs into .* first identify the values|compare your operation and units/i.test(r.before));
    const orphaned = saved.rows.filter((r: Row) => !rows.some((n) => n.id === r.id));
    console.log(JSON.stringify({ total: saved.rows.length, pendingOrUnverified: pending.length, stale: stale.length, orphaned: orphaned.length, missingAuthoredFields: { stepExplanations: missingStepExplanations.length, exerciseFormulaMetadata: missingExerciseFormulaMetadata.length, lessonFormulaNarration: missingLessonFormulaNarration.length, lessonFormulaSymbolLists: missingLessonFormulaSymbols.length, algorithmDefinitions: missingAlgorithmDefinitions.length }, boilerplateCandidates: boilerplate.length }, null, 2));
    if (pending.length || stale.length || orphaned.length || authoredGaps.length || boilerplate.length) process.exitCode = 1;
  } else throw new Error('Use --init, --batch JOB, or --final');
}
