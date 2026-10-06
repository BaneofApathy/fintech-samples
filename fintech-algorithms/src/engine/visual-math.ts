/** Numerical primitives for teaching diagrams. Null means the denominator is unavailable. */
export const total = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
export const average = (xs: number[]) => (xs.length ? total(xs) / xs.length : null);
export const ratio = (a: number, b: number): number | null =>
  b > 0 && Number.isFinite(a) && Number.isFinite(b) ? a / b : null;
export const pct = (x: number | null, digits = 1) =>
  x === null || !Number.isFinite(x) ? 'Undefined' : `${(100 * x).toFixed(digits)}%`;
export const fmt = (x: number | null, digits = 3) =>
  x === null || !Number.isFinite(x)
    ? 'Undefined'
    : x.toLocaleString('en-US', { maximumFractionDigits: digits });
export function classification(TP: number, FP: number, FN: number, TN: number) {
  const n = TP + FP + FN + TN,
    precision = ratio(TP, TP + FP),
    recall = ratio(TP, TP + FN),
    specificity = ratio(TN, TN + FP);
  return {
    TP,
    FP,
    FN,
    TN,
    n,
    precision,
    recall,
    specificity,
    fpr: ratio(FP, TN + FP),
    accuracy: ratio(TP + TN, n),
    balanced: recall === null || specificity === null ? null : (recall + specificity) / 2,
  };
}
export function fScore(p: number | null, r: number | null, beta = 1) {
  return p === null || r === null
    ? null
    : p + r === 0
      ? 0
      : ratio((1 + beta ** 2) * p * r, beta ** 2 * p + r);
}
export function thresholds(scores: number[], labels: number[]) {
  const positives = total(labels),
    negatives = labels.length - positives;
  return [Infinity, ...Array.from(new Set(scores)).sort((a, b) => b - a)].map((cut) => {
    const TP = scores.filter((s, i) => s >= cut && labels[i] === 1).length;
    const FP = scores.filter((s, i) => s >= cut && labels[i] === 0).length;
    return { cut, ...classification(TP, FP, positives - TP, negatives - FP) };
  });
}
export function averagePrecision(scores: number[], labels: number[]) {
  if (!total(labels)) return null;
  const curve = thresholds(scores, labels);
  let last = 0,
    ap = 0;
  for (const point of curve.slice(1)) {
    const r = point.recall!;
    ap += (r - last) * (point.precision ?? 0);
    last = r;
  }
  return ap;
}
export function pairAuc(positive: number[], negative: number[]) {
  return ratio(
    total(positive.flatMap((p) => negative.map((n) => (p > n ? 1 : p === n ? 0.5 : 0)))),
    positive.length * negative.length,
  );
}
export function trapezoid(x: number[], y: number[]) {
  return total(x.slice(1).map((v, i) => ((v - x[i]) * (y[i] + y[i + 1])) / 2));
}
export function probabilityScores(p: number[], y: number[]) {
  return {
    brier: average(p.map((v, i) => (v - y[i]) ** 2)),
    logLoss: average(p.map((v, i) => -Math.log(Math.max(1e-12, y[i] ? v : 1 - v)))),
  };
}
export function forecastMetrics(actual: number[], predicted: number[], trainingScale = 20) {
  const error = actual.map((a, i) => a - predicted[i]),
    abs = error.map(Math.abs),
    mean = average(actual)!;
  const mae = average(abs),
    sse = total(error.map((e) => e ** 2)),
    sst = total(actual.map((a) => (a - mean) ** 2));
  return {
    error,
    abs,
    mae,
    rmse: actual.length ? Math.sqrt(sse / actual.length) : null,
    mape: actual.some((a) => a === 0) ? null : average(abs.map((e, i) => e / Math.abs(actual[i]))),
    wape: ratio(total(abs), total(actual.map(Math.abs))),
    mase: mae === null ? null : ratio(mae, trainingScale),
    sse,
    sst,
    r2: sst ? 1 - sse / sst : null,
  };
}
export const pinball = (actual: number, predicted: number, tau: number) =>
  actual >= predicted ? tau * (actual - predicted) : (1 - tau) * (predicted - actual);
export function multiclass(matrix: number[][]) {
  const support = matrix.map(total),
    N = total(support),
    correct = total(matrix.map((r, i) => r[i]));
  const f1 = matrix.map((row, i) => {
    const tp = row[i],
      fp = total(matrix.map((r) => r[i])) - tp,
      fn = support[i] - tp;
    return ratio(2 * tp, 2 * tp + fp + fn) ?? 0;
  });
  return {
    f1,
    support,
    macro: average(f1),
    weighted: ratio(total(f1.map((f, i) => f * support[i])), N),
    micro: ratio(correct, N),
  };
}
export function adjustedRand(a: number[], b: number[]) {
  const choose2 = (n: number) => (n * (n - 1)) / 2;
  if (a.length !== b.length || a.length < 2) return null;
  const cells = new Map<string, number>(),
    rows = new Map<number, number>(),
    cols = new Map<number, number>();
  a.forEach((v, i) => {
    const key = `${v}:${b[i]}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
    rows.set(v, (rows.get(v) ?? 0) + 1);
    cols.set(b[i], (cols.get(b[i]) ?? 0) + 1);
  });
  const index = total([...cells.values()].map(choose2)),
    row = total([...rows.values()].map(choose2)),
    col = total([...cols.values()].map(choose2)),
    expected = (row * col) / choose2(a.length),
    max = (row + col) / 2;
  return max === expected ? 1 : (index - expected) / (max - expected);
}
export function ndcg(grades: number[]) {
  const dcg = (g: number[]) => total(g.map((v, i) => (2 ** v - 1) / Math.log2(i + 2)));
  return ratio(dcg(grades), dcg([...grades].sort((a, b) => b - a)));
}
export function tailRisk(losses: number[], confidence: number) {
  if (!losses.length || confidence <= 0 || confidence >= 1)
    return { var: null, es: null, tailCount: 0, rank: 0, sorted: [] };
  const sorted = [...losses].sort((a, b) => a - b),
    rank = Math.ceil(sorted.length * confidence),
    tailCount = Math.max(1, Math.ceil(sorted.length * (1 - confidence) - 1e-10));
  return { var: sorted[rank - 1], es: average(sorted.slice(-tailCount)), tailCount, rank, sorted };
}
export function wilson(success: number, n: number) {
  if (n <= 0) return { low: null, high: null, se: null, p: null };
  const p = success / n,
    z = 1.96,
    d = 1 + (z * z) / n,
    center = (p + (z * z) / (2 * n)) / d,
    margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return {
    p,
    se: Math.sqrt((p * (1 - p)) / n),
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
  };
}
export function seeded(seed = 17) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function drawdowns(wealth: number[]) {
  let peak = -Infinity;
  return wealth.map((w) => {
    peak = Math.max(peak, w);
    return peak > 0 ? (peak - w) / peak : 0;
  });
}
export function stdev(xs: number[]) {
  if (xs.length < 2) return null;
  const m = average(xs)!;
  return Math.sqrt(total(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
}
export function psi(expected: number[], actual: number[]) {
  return expected.some((e, i) => e <= 0 || actual[i] <= 0)
    ? null
    : total(expected.map((e, i) => (actual[i] - e) * Math.log(actual[i] / e)));
}
