import { solve, confusion, forecast, sum, mean, nearestRank, fbeta } from '../../engine/solve/core';
import type { Givens, Value } from '../../engine/types';
import { random } from '../../engine/variants';
import { averagePrecision, thresholds } from '../../engine/visual-math';
export function scored(g: Givens, t: number, cFN = 4000, cFP = 450, cReview = 18) {
  const scores = g.scores as number[],
    labels = g.labels as number[];
  const tp = sum(labels.filter((y, i) => scores[i] >= t)),
    fp = scores.filter((s, i) => s >= t && !labels[i]).length,
    F = sum(labels),
    N = labels.length;
  const c = confusion({ TP: tp, FP: fp, FN: F - tp, TN: N - F - fp });
  return { ...c, cost: (F - tp) * cFN + fp * cFP + (tp + fp) * cReview };
}
export function widgetValues(
  id: string,
  exercise: string,
  g: Givens,
  extra: Record<string, number>,
): Record<string, Value> {
  const base = solve(exercise, g);
  if (id === 'confusion-builder')
    return {
      ...confusion(g),
      Fbeta: fbeta(confusion(g).precision, confusion(g).recall, extra.beta),
      FNR: 1 - confusion(g).recall,
    };
  if (id === 'threshold-explorer') {
    const c = scored(g, extra.threshold, extra.cFN, extra.cFP, extra.cReview),
      pos = (g.scores as number[]).filter((x, i) => (g.labels as number[])[i]),
      neg = (g.scores as number[]).filter((x, i) => !(g.labels as number[])[i]);
    const auc = solve('M09', { positive: pos, negative: neg }).AUC;
    const ap = averagePrecision(g.scores as number[], g.labels as number[]) ?? 0;
    const gaps = thresholds(g.scores as number[], g.labels as number[]).map((p) =>
      Math.abs((p.recall ?? 0) - (p.fpr ?? 0)),
    );
    return {
      threshold: extra.threshold,
      TP: c.TP,
      FP: c.FP,
      FN: c.FN,
      TN: c.TN,
      precision: c.precision,
      recall: c.recall,
      AUC: auc,
      AP: ap,
      KS: Math.max(...gaps),
      lift: c.precision / (pos.length / (pos.length + neg.length)),
      expectedCost: c.cost,
      reviewLoad: c.TP + c.FP,
    };
  }
  if (id === 'calibration-lab') {
    const counts = g.counts as number[],
      p = g.predicted as number[],
      ds = g.defaults as number[],
      total = sum(counts);
    let brier = 0,
      ll = 0,
      ece = 0;
    counts.forEach((n, i) => {
      const prob = extra.confident && i === 2 ? 0.99 : p[i],
        d = ds[i],
        rate = d / n;
      brier += d * (1 - prob) ** 2 + (n - d) * prob ** 2;
      ll -= d * Math.log(Math.max(1e-12, prob)) + (n - d) * Math.log(Math.max(1e-12, 1 - prob));
      ece += n * Math.abs(prob - rate);
    });
    const edited = p.map((prob, i) => (extra.confident && i === 2 ? 0.99 : prob));
    const consistentBase = solve(exercise, { ...g, predicted: edited });
    return { ...consistentBase, Brier: brier / total, logLoss: ll / total, ECE: ece / total };
  }
  if (id === 'forecast-eval') {
    const a = g.actual as number[],
      p = g.predicted as number[],
      f = forecast(a, p),
      b = forecast(a, g.baseline as number[]),
      lo = p.map((x) => x - extra.width),
      hi = p.map((x) => x + extra.width),
      coverage = a.filter((x, i) => x >= lo[i] && x <= hi[i]).length / a.length;
    return {
      ...f,
      baselineMAE: b.MAE,
      coverage,
      intervalWidth: extra.width * 2,
      pinball: mean(
        a.map((x, i) => (x >= p[i] ? extra.tau * (x - p[i]) : (1 - extra.tau) * (p[i] - x))),
      ),
    };
  }
  if (id === 'retrieval-rank') {
    const order = extra.reverse ? [2, 0, 1] : [1, 0, 2],
      K = Math.min(3, extra.K),
      found = order.slice(0, K).filter((i) => i !== 2).length,
      first = order.findIndex((i) => i !== 2) + 1,
      grades = order.map((i) => (i === 2 ? 0 : i === 1 ? 3 : 1)),
      rank = solve('M29b', { grades });
    return {
      ...base,
      recallAtK: found / 2,
      contextPrecision: found / K,
      MRR: 1 / first,
      nDCG: rank.nDCG,
    };
  }
  if (id === 'entity-graph') {
    const neighbours = [[1], [0, 2], [1, 3], [2, 4], [3], [6], [5]];
    let rank = Array(7).fill(1 / 7);
    for (let iteration = 0; iteration < 60; iteration++) {
      const next = Array(7).fill(0.15 / 7);
      rank.forEach((r, i) =>
        neighbours[i].forEach((j) => (next[j] += (0.85 * r) / neighbours[i].length)),
      );
      rank = next;
    }
    const accountNodes = [0, 2, 4, 5];
    return {
      ...base,
      selectedDegree: (base.degrees as number[])[extra.account],
      selectedComponent: extra.account === 3 ? 2 : 5,
      selectedPageRank: rank[accountNodes[extra.account]],
      accountPageRanks: accountNodes.map((i) => rank[i]),
    };
  }
  if (id === 'kmeans-anim') {
    const points = g.points as number[],
      groups = base.groups as number[];
    const silhouettes = points.map((p, i) => {
      const own = points.filter((_, j) => j !== i && groups[j] === groups[i]);
      if (!own.length) return 0;
      const a = mean(own.map((x) => Math.abs(x - p))),
        b = mean(points.filter((_, j) => groups[j] !== groups[i]).map((x) => Math.abs(x - p)));
      return (b - a) / Math.max(a, b);
    });
    return { ...base, silhouettes, silhouette: mean(silhouettes) };
  }
  if (id === 'portfolio-feasible') {
    const w = extra.weight,
      r = Number(g.stockReturn) * w + Number(g.bondReturn) * (1 - w),
      v = w * w * Number(g.stockVol) ** 2 + (1 - w) ** 2 * Number(g.bondVol) ** 2;
    return {
      ...base,
      selectedReturn: r,
      selectedVolatility: Math.sqrt(v),
      feasible: r >= Number(g.minimum),
      selectedStocks: Number(g.portfolio) * w,
    };
  }
  if (id === 'execution-update') {
    const short = solve('S03', {
      target: 1000,
      arrival: 50,
      shares: [400, 400],
      prices: [50.1, 50.2],
      close: extra.close,
      fees: 20,
    });
    return {
      ...base,
      shortfall: short.total,
      shortfallBps: short.bps,
      completion: short.completion,
    };
  }
  if (id === 'monte-carlo-loss') {
    const rng = random(7),
      N = extra.paths,
      loss = Number(g.loan) * Number(g.LGD);
    const vals = Array.from(
      { length: N },
      () => loss * ((rng() < Number(g.PD) ? 1 : 0) + (rng() < Number(g.PD) ? 1 : 0)),
    );
    const p = vals.filter((x) => x > Number(g.reserve)).length / N;
    const sorted = [...vals].sort((a, b) => a - b),
      v = nearestRank(vals, 0.95),
      es = mean(sorted.slice(-Math.max(1, Math.ceil(N * 0.05))));
    return {
      ...base,
      simulationMean: mean(vals),
      reserveBreach: p,
      simulationSE: Math.sqrt((p * (1 - p)) / N),
      VaR95: v,
      ES95: es,
    };
  }
  if (id === 'ops-budget')
    return {
      ...base,
      monthlyInference: extra.transactions * extra.unitCost,
      costPerCorrect: solve('M39c', {
        requests: 1000,
        spend: 500,
        abstained: 100,
        reviewCost: 3,
        autoCorrect: 800,
      }).perCorrect,
    };
  return base;
}
