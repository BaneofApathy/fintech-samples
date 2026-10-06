// Build-time catalog. Components receive only the definition needed for their page.
import { algorithmVisualCatalog } from './algorithm-visuals';
import { measureVisuals } from './measure-visuals';
import { financialCases } from './financial-cases';
import { foundationVisuals } from './foundation-visuals';
import { supplementVisuals } from './supplement-visuals';
import { exerciseVisualLinks } from './visual-links';
import { algorithms, measures } from './index';

export interface VisualDefinition {
  id: string;
  category: 'algorithm' | 'measure' | 'financial' | 'foundation' | 'supplement';
  title: string;
  question: string;
  states: string[];
  takeaway: string;
  exampleReference: string;
  controls: string[];
  measureLinks: string[];
  textAlternative: string;
}
export const visualRegistry: VisualDefinition[] = [
  ...algorithmVisualCatalog.map((v) => ({
    id: v.id,
    category: 'algorithm' as const,
    title: v.title,
    question: v.question,
    states: v.steps.map((s) => s.title),
    takeaway: v.takeaway,
    exampleReference: v.exercise,
    controls: ['Previous step', 'Next step', 'Reset', ...v.methods],
    measureLinks: algorithms.find((a) => a.slug === v.slug)!.measures,
    textAlternative: v.steps.map((s) => `${s.title}. ${s.explanation} ${s.formula}`).join('\n'),
  })),
  ...measureVisuals.map((v) => ({
    id: v.id,
    category: 'measure' as const,
    title: v.title,
    question: v.question,
    states: v.views,
    takeaway: v.takeaway,
    exampleReference: v.exampleReference,
    controls: v.controls,
    measureLinks: [measures.find((m) => m.number === v.number)!.slug],
    textAlternative: v.textAlternative,
  })),
  ...financialCases.map((v) => ({
    id: v.visualId,
    category: 'financial' as const,
    title: v.title,
    question: v.question,
    states: v.frames.map((s) => s.label),
    takeaway: v.takeaway,
    exampleReference: `${v.algorithmSlug} · application ${v.sourceRef.application}`,
    controls: [v.controlLabel, 'Reset example'],
    measureLinks: v.measureSlugs,
    textAlternative: v.frames.map((f) => `${f.label}. ${f.caption} ${f.result}`).join('\n'),
  })),
  ...foundationVisuals.map((v) => ({
    id: `foundation-${v.id}`,
    category: 'foundation' as const,
    title: v.title,
    question: v.question,
    states: ['Inspect', 'Change', 'Explain'],
    takeaway: v.takeaway,
    exampleReference: 'Foundations teaching example',
    controls: ['Select a labeled input or assumption', 'Reset visual'],
    measureLinks: [],
    textAlternative: `${v.question} ${v.takeaway}`,
  })),
  ...supplementVisuals.map((v) => ({
    id: `supplement-${v.id}`,
    category: 'supplement' as const,
    title: v.title,
    question: v.question,
    states: ['Inspect', 'Change', 'Explain'],
    takeaway: v.takeaway,
    exampleReference: v.id,
    controls: [
      v.id === 'S01'
        ? 'Remove a table header'
        : v.id === 'S02'
          ? 'Remove an answer component'
          : v.id === 'S03'
            ? 'Change closing price'
            : 'Select worst-tail share',
      'Reset visual',
    ],
    measureLinks:
      v.id === 'S01' || v.id === 'S02'
        ? ['faithfulness-citation-correctness-numerical-accuracy']
        : ['cumulative-reward-and-regret'],
    textAlternative: `${v.question} ${v.takeaway}`,
  })),
];
export const visualCoverage = {
  algorithms: algorithmVisualCatalog.length,
  measures: measureVisuals.length,
  financialApplications: financialCases.length,
  foundations: foundationVisuals.length,
  supplements: supplementVisuals.length,
  exercises: Object.keys(exerciseVisualLinks).length,
};
