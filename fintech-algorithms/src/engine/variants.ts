import type { Givens } from './types';
export function random(seed: number) {
  let x = seed >>> 0;
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function cloneGivens(base: Givens): Givens {
  return Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, Array.isArray(v) ? [...v] : v]),
  );
}
export function variant(id: string, base: Givens, seed: number): Givens {
  const r = random(seed),
    g = cloneGivens(base),
    factor = 1 + Math.floor(r() * 4);
  const n = (k: string) => Number(g[k]);
  const scale = (keys: string[]) =>
    keys.forEach((k) => {
      if (typeof g[k] === 'number') g[k] = n(k) * factor;
      else if (Array.isArray(g[k])) g[k] = (g[k] as number[]).map((x) => x * factor);
    });
  switch (id) {
    case 'A01':
      g.DTI = 20 + Math.round(r() * 40);
      g.D = Math.round(r());
      g.I = 35 + Math.round(r() * 60);
      g.loan = 5000 + Math.round(r() * 10) * 1000;
      g.threshold = [0.05, 0.08, 0.12, 0.2][Math.floor(r() * 4)];
      break;
    case 'A02':
      scale(['counts']);
      g.scores = [0.25 + r() * 0.6, 0.25 + r() * 0.5, 0.1 + r() * 0.6].map(
        (x) => Math.round(x * 100) / 100,
      );
      break;
    case 'A03':
      g.eta = [0.2, 0.3, 0.4, 0.5, 0.6][Math.floor(r() * 5)];
      g.h1 = 0.3 + r();
      g.h2 = 0.1 + r() * 0.5;
      break;
    case 'A04': {
      const off = Math.round(r() * 10);
      g.points = (g.points as number[]).map((x) => x + off);
      g.centers = (g.centers as number[]).map((x) => x + off);
      g.newPoint = 25 + Math.round(r() * 30);
      break;
    }
    case 'A05':
      g.c = 3 + Math.round(r() * 3);
      break;
    case 'A06':
      g.phi = [0.3, 0.4, 0.5, 0.6, 0.7][Math.floor(r() * 5)];
      g.buffer = 5 + Math.round(r() * 15);
      break;
    case 'A07':
      break; // The finite graph is fixed; practice asks a different start node in the widget.
    case 'A08':
      g.logits = [0, Math.log(2 + Math.floor(r() * 4))];
      g.threshold = 0.6 + r() * 0.2;
      break;
    case 'A09':
      g.newRevenue = 110 + Math.round(r() * 10) * 5;
      break;
    case 'A10':
      g.minimum = [0.065, 0.07, 0.075][Math.floor(r() * 3)];
      scale(['portfolio']);
      break;
    case 'A11':
      g.alpha = 0.2 + Math.round(r() * 6) / 10;
      g.reward = -1 - Math.round(r() * 3);
      break;
    case 'A12':
      g.draws = Array.from({ length: 10 }, () => Math.round(r() * 100) / 100);
      break;
    case 'M01':
      scale(['N', 'fraud', 'alerts', 'caught']);
      break;
    case 'M02':
    case 'M03':
      scale(['TP', 'FP', 'FN', 'TN']);
      break;
    case 'M04':
      scale(['reviewCost']);
      break;
    case 'M05':
      scale(['loss']);
      break;
    case 'M06':
      scale(['volume']);
      break;
    case 'M07':
      g.precision = 0.2 + Math.round(r() * 5) / 10;
      g.recall = 0.5 + Math.round(r() * 4) / 10;
      break;
    case 'M08':
      g.thresholds = [0.85, 0.65, 0.25].map((x) =>
        Math.max(0.1, Math.min(0.95, x + (r() - 0.5) * 0.1)),
      );
      break;
    case 'M09':
      g.positive = (g.positive as number[]).map((x) =>
        Math.min(0.99, Math.max(0.01, x + (r() - 0.5) * 0.2)),
      );
      break;
    case 'M10':
      scale(['defaultCounts', 'otherCounts', 'defaults', 'others']);
      break;
    case 'M11a':
      g.labels = r() > 0.5 ? [1, 1, 0, 0, 1, 0] : [0, 1, 1, 0, 0, 1];
      break;
    case 'M11b':
      break;
    case 'M12':
      scale(['cost']);
      break;
    case 'M13':
      scale(['N', 'fraud', 'K', 'caught']);
      break;
    case 'M14':
      scale(['loss']);
      break;
    case 'M15':
      g.baseline = 0.1 + r() * 0.3;
      break;
    case 'M16':
      g.A = [0.8, 0.1, 0.8 + r() * 0.19];
      break;
    case 'M17a':
      scale(['cFN', 'cFP']);
      g.capacity = 50 + Math.round(r() * 70);
      break;
    case 'M17b':
      scale(['cFN']);
      break;
    case 'M18':
      scale(['matrix']);
      break;
    case 'M19':
      scale(['NA', 'NB', 'approvedA', 'approvedB', 'repayA', 'repayB', 'TPA', 'TPB']);
      break;
    case 'M20':
    case 'M22':
    case 'M23':
      scale(['actual', 'predicted', 'baseline', 'history']);
      break;
    case 'M21':
      scale(['A', 'B']);
      break;
    case 'M24':
      g.widen = 5 + Math.round(r() * 10);
      break;
    case 'M25':
      g.tau = [0.8, 0.9, 0.95][Math.floor(r() * 3)];
      break;
    case 'M26':
      scale(['a', 'b']);
      break;
    case 'M27a':
      scale(['values']);
      break;
    case 'M27b':
      scale(['overlap']);
      break;
    case 'M28':
      g.K = 3 + Math.floor(r() * 3);
      break;
    case 'M29a':
      g.newRank = 1 + Math.floor(r() * 4);
      break;
    case 'M29b':
      g.grades = r() > 0.5 ? [0, 3, 1] : [3, 0, 1];
      break;
    case 'M30':
      g.revenueNew = 110 + Math.round(r() * 10) * 5;
      break;
    case 'M31':
      g.rf = 0.01 + Math.round(r() * 3) / 100;
      break;
    case 'M32a':
      scale(['values']);
      break;
    case 'M32b':
      scale(['portfolio']);
      break;
    case 'M32c':
      g.periods = 12;
      g.fund = (g.fund as number[]).map((x) => x * factor);
      break;
    case 'M33':
      scale(['losses']);
      break;
    case 'M34':
      scale(['N', 'breaches', 'newN']);
      break;
    case 'M35':
      g.exceptions = 5 + Math.floor(r() * 10);
      break;
    case 'M36':
      scale(['costs', 'baseline', 'hindsight', 'notional']);
      break;
    case 'M37':
      scale(['tasks', 'completed', 'verified', 'unsafe', 'executed', 'calls', 'errors']);
      break;
    case 'M38': {
      const p = 0.1 + Math.round(r() * 7) / 10;
      g.current = [p, 1 - p];
      break;
    }
    case 'M39a':
      g.deadline = 60 + Math.round(r() * 80);
      break;
    case 'M39b':
      g.arrival = 220 + Math.round(r() * 100);
      g.analysts = 10 + Math.round(r() * 10);
      break;
    case 'M39c':
      scale(['spend']);
      break;
    case 'M39d':
      g.downtime = 30 + Math.round(r() * 150);
      break;
    case 'S01':
      scale(['tables', 'intact', 'sections', 'present', 'cells', 'wrong']);
      break;
    case 'S02':
      g.correct = r() > 0.5 ? [1, 3, 1, 4] : [2, 1, 1, 3];
      break;
    case 'S03':
      scale(['target', 'shares', 'fees']);
      break;
    case 'S04':
      scale(['costs', 'baseline']);
      break;
  }
  return g;
}
