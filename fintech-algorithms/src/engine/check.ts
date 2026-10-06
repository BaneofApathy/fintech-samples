import type { Value, Step } from './types';
export function parseNumber(raw: string, unit = ''): number {
  let s = raw.trim().replace(/[$,\s]/g, '');
  const percent = s.endsWith('%');
  if (percent) s = s.slice(0, -1);
  if (s.includes('/')) {
    const parts = s.split('/').map(Number);
    return parts.length === 2 && parts[1] !== 0 ? parts[0] / parts[1] : NaN;
  }
  const num = Number(s);
  return s === '' ? NaN : percent ? num / 100 : num;
}
export function near(a: number, b: number, step: Partial<Step> = {}): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const t = step.tolerance ?? { rel: 0.005, abs: 0.00005 };
  return Math.abs(a - b) <= Math.max(t.abs ?? 0.00005, Math.abs(b) * (t.rel ?? 0.005));
}
export function check(
  raw: string | boolean | string[],
  expected: Value,
  step: Partial<Step> = {},
): { correct: boolean; wrongCells: number[]; value: Value } {
  if (typeof expected === 'boolean') {
    const value =
      typeof raw === 'boolean' ? raw : String(raw).toLowerCase() === 'yes' || raw === 'true';
    return { correct: raw !== '' && value === expected, wrongCells: [], value };
  }
  if (Array.isArray(expected)) {
    const entries = Array.isArray(raw) ? raw : String(raw).split(/[;,]/),
      values = entries.map((x) => parseNumber(x, step.unit));
    const wrong = expected.map((v, i) => (near(values[i], v, step) ? -1 : i)).filter((i) => i >= 0);
    return {
      correct: entries.length === expected.length && wrong.length === 0,
      wrongCells: wrong,
      value: values,
    };
  }
  if (typeof expected === 'string')
    return {
      correct: String(raw).trim().toLowerCase() === expected.toLowerCase(),
      wrongCells: [],
      value: String(raw),
    };
  const value = parseNumber(String(raw), step.unit);
  return { correct: near(value, expected, step), wrongCells: [], value };
}
export function format(value: Value, unit = ''): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((v) => format(v, unit)).join(', ');
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return 'Undefined for these inputs';
  if (unit === 'proportion')
    return `${(value * 100).toLocaleString('en-US', { maximumFractionDigits: 3 })}%`;
  if (unit === '$')
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });
  return (
    value.toLocaleString('en-US', { maximumFractionDigits: 5 }) +
    (unit && unit !== 'proportion' ? ` ${unit}` : '')
  );
}
