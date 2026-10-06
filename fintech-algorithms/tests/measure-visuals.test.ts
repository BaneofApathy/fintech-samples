import { describe, it, expect } from 'vitest';
import { measureVisuals } from '../src/data/measure-visuals';
describe('measure visual coverage', () => {
  it('assigns a concept-specific question, takeaway and example to every measure', () => {
    expect(measureVisuals.map((m) => m.number)).toEqual(
      Array.from({ length: 39 }, (_, i) => i + 1),
    );
    expect(new Set(measureVisuals.map((m) => m.question)).size).toBe(39);
    for (const m of measureVisuals) {
      expect(m.exampleReference).toContain(`M${String(m.number).padStart(2, '0')}`);
      expect(m.takeaway.length).toBeGreaterThan(30);
      expect(m.views.length).toBeGreaterThan(0);
    }
  });
  it('exposes every separately evaluated bundled measure', () => {
    const expected: Record<number, number> = {
      6: 2,
      7: 3,
      9: 2,
      11: 2,
      12: 2,
      13: 2,
      17: 2,
      18: 3,
      19: 3,
      22: 3,
      24: 2,
      27: 2,
      28: 2,
      29: 2,
      30: 3,
      31: 2,
      32: 3,
      33: 2,
      34: 2,
      35: 2,
      36: 2,
      37: 5,
      39: 4,
    };
    for (const [id, n] of Object.entries(expected))
      expect(measureVisuals[Number(id) - 1].views.length).toBe(n);
  });
});

// Exercise adapters must preserve numbers, not merely render a related picture.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { beforeAll, afterAll } from 'vitest';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { compile } from 'svelte/compiler';
import YAML from 'yaml';
import { solve } from '../src/engine/solve/core';
import { variant } from '../src/engine/variants';
import { fmt, pct } from '../src/engine/visual-math';
import type { Givens } from '../src/engine/types';

let component: Component<{
  number: number;
  givens?: Givens;
  exerciseId?: string;
  focusStep?: string;
}>;
let generated: string;
const root = process.cwd();
const requireAtRoot = createRequire(path.join(root, 'package.json'));
const examples = fs
  .readdirSync(path.join(root, 'content/exercises'))
  .filter((f) => /^M.*\.yaml$/.test(f))
  .map((file) => YAML.parse(fs.readFileSync(path.join(root, 'content/exercises', file), 'utf8')));
beforeAll(async () => {
  generated = fs.mkdtempSync(path.join(os.tmpdir(), 'fintech-measure-render-'));
  for (const relative of ['src/engine/visual-math.ts', 'src/data/measure-visuals.ts']) {
    const code = transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
      compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
    }).outputText;
    fs.writeFileSync(path.join(generated, path.basename(relative).replace('.ts', '.mjs')), code);
  }
  const folder = path.join(root, 'src/components/visuals/measures');
  const files = [
    path.join(root, 'src/components/visuals/VisualFrame.svelte'),
    ...fs
      .readdirSync(folder)
      .filter((f) => f.endsWith('.svelte'))
      .map((f) => path.join(folder, f)),
  ];
  for (const file of files) {
    let code = compile(fs.readFileSync(file, 'utf8'), { filename: file, generate: 'server' }).js
      .code;
    code = code
      .replace(/import ['"][^'"]+\.css['"];?/g, '')
      .replace(/from (['"])([^'"]+)\1/g, (original, _quote, spec: string) => {
        if (spec.endsWith('.svelte'))
          return `from '${pathToFileURL(path.join(generated, path.basename(spec).replace('.svelte', '.mjs'))).href}'`;
        if (spec.startsWith('.'))
          return `from '${pathToFileURL(path.join(generated, path.basename(spec) + '.mjs')).href}'`;
        if (spec.startsWith('svelte'))
          return `from '${pathToFileURL(requireAtRoot.resolve(spec)).href}'`;
        return original;
      });
    fs.writeFileSync(path.join(generated, path.basename(file).replace('.svelte', '.mjs')), code);
  }
  component = (
    await import(/* @vite-ignore */ pathToFileURL(path.join(generated, 'MeasureVisual.mjs')).href)
  ).default;
});
afterAll(() => {
  if (generated) fs.rmSync(generated, { recursive: true, force: true });
});
function output(id: string, givens: Givens, focusStep?: string) {
  return render(component, {
    props: { number: Number(id.match(/\d+/)![0]), exerciseId: id, givens, focusStep },
  })
    .body.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('exact measure exercise diagrams', () => {
  it('renders all 39 standalone concepts and all 48 exercise inputs, including fresh variants', () => {
    for (let number = 1; number <= 39; number++)
      expect(render(component, { props: { number } }).body).toContain(
        `data-measure-visual="${number}"`,
      );
    expect(examples).toHaveLength(48);
    for (const e of examples) {
      for (const givens of [e.givens, variant(e.id, e.givens, 7)]) {
        for (const focusStep of [e.steps[0].id, e.steps.at(-1).id]) {
          const html = render(component, {
            props: { number: Number(e.id.match(/\d+/)[0]), exerciseId: e.id, givens, focusStep },
          }).body;
          expect(html, `${e.id}/${focusStep}`).not.toMatch(
            /(?:cx|cy|x|y|width|height)="(?:NaN|Infinity|-Infinity)/,
          );
          expect(html, `${e.id}/${focusStep}`).toContain('Reset starting example');
        }
      }
    }
  });
  const checks: [string, string, string, (v: Record<string, any>) => string][] = [
    ['M11b', 'AP', 'Average precision = ', (v) => fmt(v.AP, 4)],
    ['M11b', 'trapezoid', 'Trapezoidal area = ', (v) => fmt(v.trapezoid, 4)],
    ['M16', 'LLA', 'Average log loss = ', (v) => fmt(v.LLA, 4)],
    ['M16', 'LLB', 'Average log loss = ', (v) => fmt(v.LLB, 4)],
    ['M21', 'RMSEA', 'RMSE · $ thousands ', (v) => fmt(v.RMSEA, 2)],
    ['M21', 'RMSEB', 'RMSE · $ thousands ', (v) => fmt(v.RMSEB, 2)],
    ['M27a', 'I1', 'Inertia = ', (v) => fmt(v.I1, 3)],
    ['M27a', 'I2', 'Inertia = ', (v) => fmt(v.I2, 3)],
    ['M27a', 'I3', 'Inertia = ', (v) => fmt(v.I3, 3)],
    ['M27b', 'ARI', 'Adjusted Rand index = ', (v) => fmt(v.ARI, 6)],
    ['M29a', 'MRR', 'MRR = ', (v) => fmt(v.MRR, 4)],
    ['M29a', 'newMRR', 'MRR = ', (v) => fmt(v.newMRR, 4)],
    ['M29b', 'nDCG', 'nDCG = ', (v) => fmt(v.nDCG, 4)],
    ['M32b', 'cost', 'Trading cost $', (v) => fmt(v.cost, 2)],
    ['M32c', 'monthly', 'Per-period sample tracking error ', (v) => pct(v.monthly, 4)],
    ['M32c', 'annual', 'Annualized · √12 ', (v) => pct(v.annual, 4)],
    ['M34', 'SE', 'SE = ', (v) => fmt(v.SE, 6)],
    ['M34', 'newSE', 'SE = ', (v) => fmt(v.newSE, 6)],
    ['M38', 'PSI', 'PSI = Σ (A − E) ln(A / E) = ', (v) => fmt(v.PSI, 4)],
    ['M39a', 'mean', 'Mean ', (v) => `${fmt(v.mean, 1)} ms`],
    ['M39c', 'totalCost', 'Total workflow cost $', (v) => fmt(v.totalCost, 2)],
  ];
  for (const [id, step, label, expected] of checks)
    it(`${id}/${step} matches the solver on original and changed givens`, () => {
      const e = examples.find((e) => e.id === id);
      for (const givens of [e.givens, variant(id, e.givens, 7)]) {
        const result = solve(id, givens);
        expect(output(id, givens, step)).toContain(label + expected(result));
      }
    });
});
