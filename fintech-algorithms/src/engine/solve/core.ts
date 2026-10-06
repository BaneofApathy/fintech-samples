import type { Givens, Value } from '../types';
export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
export const mean = (a: number[]) => sum(a) / a.length;
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);
export const nearestRank = (a: number[], p: number) =>
  [...a].sort((x, y) => x - y)[Math.max(0, Math.min(a.length - 1, Math.ceil(p * a.length) - 1))];
export const fbeta = (p: number, r: number, b = 1) => safeDiv((1 + b * b) * p * r, b * b * p + r);
export function confusion(g: Givens) {
  const TP = +(g.TP ?? g.caught),
    FP = +(g.FP ?? +g.alerts - TP),
    FN = +(g.FN ?? +g.fraud - TP);
  const TN = +(g.TN ?? +g.N - TP - FP - FN);
  const N = TP + FP + FN + TN,
    p = safeDiv(TP, TP + FP),
    r = safeDiv(TP, TP + FN),
    s = safeDiv(TN, TN + FP);
  return {
    TP,
    FP,
    FN,
    TN,
    N,
    accuracy: safeDiv(TP + TN, N),
    precision: p,
    recall: r,
    specificity: s,
    FPR: 1 - s,
    balanced: (r + s) / 2,
    F1: fbeta(p, r),
    F2: fbeta(p, r, 2),
  };
}
export function forecast(
  actual: number[],
  pred: number[],
  history: number[] = [80, 100, 120, 140],
) {
  const errors = actual.map((x, i) => x - pred[i]),
    abs = errors.map(Math.abs),
    mae = mean(abs),
    sse = sum(errors.map((x) => x * x));
  const avg = mean(actual),
    sst = sum(actual.map((x) => (x - avg) ** 2)),
    scale = mean(history.slice(1).map((x, i) => Math.abs(x - history[i])));
  return {
    MAE: mae,
    RMSE: Math.sqrt(mean(errors.map((x) => x * x))),
    MAPE: actual.some((x) => x === 0) ? NaN : mean(abs.map((x, i) => x / Math.abs(actual[i]))),
    WAPE: safeDiv(sum(abs), sum(actual.map(Math.abs))),
    MASE: safeDiv(mae, scale),
    R2: sst === 0 ? NaN : 1 - sse / sst,
    actualMean: avg,
    SSE: sse,
    SST: sst,
    naiveScale: scale,
  };
}
export function solve(id: string, g: Givens): Record<string, Value> {
  const n = (k: string) => Number(g[k]);
  const a = (k: string) => g[k] as number[];
  switch (id) {
    case 'A01': {
      const z = -3 + 0.04 * n('DTI') + 1.2 * n('D') - 0.03 * n('I'),
        p = sigmoid(z),
        loss = n('loan') * n('LGD');
      return {
        z,
        p,
        odds: Math.exp(z),
        lossOnDefault: loss,
        EL: p * loss,
        decision: p >= n('threshold'),
      };
    }
    case 'A02': {
      const counts = a('counts'),
        total = sum(counts),
        f = counts[0] + counts[2],
        l = counts[1] + counts[3];
      const parent = 1 - (f / total) ** 2 - (l / total) ** 2;
      const gn =
          1 -
          (counts[0] / (counts[0] + counts[1])) ** 2 -
          (counts[1] / (counts[0] + counts[1])) ** 2,
        gt =
          1 -
          (counts[2] / (counts[2] + counts[3])) ** 2 -
          (counts[3] / (counts[2] + counts[3])) ** 2;
      const weighted = ((counts[0] + counts[1]) * gn + (counts[2] + counts[3]) * gt) / total,
        score = mean(a('scores'));
      return {
        parent,
        newGini: gn,
        trustedGini: gt,
        weighted,
        gain: parent - weighted,
        score,
        decision: score >= n('threshold'),
        firstDecision: a('scores')[0] >= n('threshold'),
      };
    }
    case 'A03': {
      const F1 = n('F0') + n('eta') * n('h1'),
        F2 = F1 + n('eta') * n('h2'),
        smallF1 = n('F0') + n('eta2') * n('h1'),
        smallF2 = smallF1 + n('eta2') * n('h2');
      return {
        F1,
        F2,
        p: sigmoid(F2),
        smallF1,
        smallF2,
        smallP: sigmoid(smallF2),
        decision: sigmoid(F2) >= n('threshold'),
        smallDecision: sigmoid(smallF2) >= n('threshold'),
      };
    }
    case 'A04': {
      const points = a('points'),
        cs = a('centers');
      const groups = points.map((x) => (Math.abs(x - cs[0]) <= Math.abs(x - cs[1]) ? 1 : 2));
      const c1 = mean(points.filter((x, i) => groups[i] === 1)),
        c2 = mean(points.filter((x, i) => groups[i] === 2));
      return {
        groups,
        c1,
        c2,
        d1: Math.abs(n('newPoint') - c1),
        d2: Math.abs(n('newPoint') - c2),
        group: Math.abs(n('newPoint') - c1) <= Math.abs(n('newPoint') - c2) ? 1 : 2,
        inertia: sum(points.map((x, i) => (x - (groups[i] === 1 ? c1 : c2)) ** 2)),
      };
    }
    case 'A05': {
      const paths = a('paths'),
        means = [mean(paths.slice(0, 3)), mean(paths.slice(3, 6)), mean(paths.slice(6, 9))];
      return {
        means,
        scores: means.map((h) => 2 ** (-h / n('c'))),
        top: means.indexOf(Math.min(...means)) + 1,
      };
    }
    case 'A06': {
      const change = n('last') - n('previous'),
        nextChange = n('phi') * change,
        next = n('last') + nextChange,
        second = next + n('phi') * nextChange;
      return {
        change,
        nextChange,
        next,
        secondChange: n('phi') * nextChange,
        second,
        liquidity: next + n('buffer'),
        modelError: Math.abs(n('actual') - next),
        baselineError: Math.abs(n('actual') - n('last')),
      };
    }
    case 'A07':
      return { components: 2, sizes: [5, 2], degrees: [1, 2, 1, 1], edges: 4, proof: false };
    case 'A08': {
      const ex = a('logits').map(Math.exp),
        weights = ex.map((x) => x / sum(ex)),
        h = sum(weights.map((w, i) => w * a('values')[i]));
      const out = [2 * h, 0, -2 * h].map(Math.exp),
        probs = out.map((x) => x / sum(out));
      return {
        weights,
        h,
        classLogits: [2 * h, 0, -2 * h],
        probabilities: probs,
        decision: Math.max(...probs) >= n('threshold'),
      };
    }
    case 'A09': {
      const q = a('q'),
        d = a('docs'),
        ql = Math.hypot(...q),
        sims = [0, 1, 2].map(
          (i) =>
            (q[0] * d[i * 2] + q[1] * d[i * 2 + 1]) / (ql * Math.hypot(d[i * 2], d[i * 2 + 1])),
        );
      return { similarities: sims, growth: (n('newRevenue') - n('oldRevenue')) / n('oldRevenue') };
    }
    case 'S01':
      return {
        integrity: n('intact') / n('tables'),
        coverage: n('present') / n('sections'),
        error: n('wrong') / n('cells'),
        correct: 1 - n('wrong') / n('cells'),
      };
    case 'S02': {
      const required = a('required'),
        correct = a('correct'),
        complete = required.filter((r, i) => r === correct[i]).length;
      return {
        complete,
        exactness: complete / required.length,
        required: sum(required),
        correct: sum(correct),
        completeness: sum(correct) / sum(required),
      };
    }
    case 'A10': {
      const weights = a('weights'),
        returns = weights.map((w) => n('stockReturn') * w + n('bondReturn') * (1 - w)),
        vars = weights.map((w) => w * w * n('stockVol') ** 2 + (1 - w) ** 2 * n('bondVol') ** 2),
        feasible = returns.map((r) => r + 1e-12 >= n('minimum'));
      const candidates = vars.map((v, i) => (feasible[i] ? v : Infinity)),
        best = candidates.indexOf(Math.min(...candidates));
      return {
        returns,
        variances: vars,
        volatilities: vars.map(Math.sqrt),
        weight: weights[best],
        stockDollars: n('portfolio') * weights[best],
        bondDollars: n('portfolio') * (1 - weights[best]),
      };
    }
    case 'A11': {
      const best = Math.max(...a('next')),
        target = n('reward') + n('gamma') * best,
        error = target - n('old'),
        updated = n('old') + n('alpha') * error;
      return {
        best,
        target,
        error,
        updated,
        decision: updated >= n('wait'),
        terminal: n('reward'),
      };
    }
    case 'S03': {
      const shares = a('shares'),
        prices = a('prices'),
        filled = sum(shares),
        unfilled = n('target') - filled,
        slippage = sum(shares.map((s, i) => s * (prices[i] - n('arrival')))),
        opportunity = unfilled * (n('close') - n('arrival')),
        total = slippage + opportunity + n('fees'),
        notional = n('target') * n('arrival');
      return {
        completion: filled / n('target'),
        slippage,
        opportunity,
        total,
        notional,
        bps: (total / notional) * 10000,
      };
    }
    case 'S04': {
      const costs = a('costs'),
        worst = [...costs].sort((x, y) => y - x).slice(0, Math.ceil(costs.length * n('tail')));
      return {
        mean: mean(costs),
        p90: nearestRank(costs, 0.9),
        p95: nearestRank(costs, 0.95),
        tailMean: mean(worst),
        meanSaving: n('baseline') - mean(costs),
        tailExtra: mean(worst) - n('baseline'),
      };
    }
    case 'A12': {
      const draws = a('draws'),
        loss = n('loan') * n('LGD'),
        losses = Array.from(
          { length: draws.length / 2 },
          (_, i) =>
            loss * ((draws[i * 2] < n('PD') ? 1 : 0) + (draws[i * 2 + 1] < n('PD') ? 1 : 0)),
        );
      return {
        lossOnDefault: loss,
        losses,
        mean: mean(losses),
        breach: losses.filter((x) => x > n('reserve')).length / losses.length,
        analytical: 2 * n('PD') * loss,
        exact: n('PD') ** 2,
      };
    }
    case 'M01': {
      const c = confusion(g);
      return {
        TP: c.TP,
        FP: c.FP,
        FN: c.FN,
        TN: c.TN,
        total: c.N,
        cells: [c.TP, c.FP, c.FN, c.TN],
      };
    }
    case 'M02': {
      const c = confusion(g);
      return {
        accuracy: c.accuracy,
        mistakes: c.FP + c.FN,
        baseline: (c.TN + c.FP) / c.N,
        caught: 0,
        baselineMistakes: c.TP + c.FN,
      };
    }
    case 'M03': {
      const c = confusion(g);
      return { recall: c.recall, specificity: c.specificity, balanced: c.balanced, baseline: 0.5 };
    }
    case 'M04':
      return {
        precisionA: n('caughtA') / n('alertsA'),
        precisionB: n('caughtB') / n('alertsB'),
        costA: n('alertsA') * n('reviewCost'),
        costB: n('alertsB') * n('reviewCost'),
        perA: (n('alertsA') * n('reviewCost')) / n('caughtA'),
        perB: (n('alertsB') * n('reviewCost')) / n('caughtB'),
      };
    case 'M05': {
      const missedA = n('fraud') - n('caughtA'),
        missedB = n('fraud') - n('caughtB');
      return {
        recallA: n('caughtA') / n('fraud'),
        recallB: n('caughtB') / n('fraud'),
        missedA,
        missedB,
        lossA: missedA * n('loss'),
        lossB: missedB * n('loss'),
        saving: (missedB - missedA) * n('loss'),
      };
    }
    case 'M06': {
      const s = n('TN') / (n('TN') + n('FP'));
      return { specificity: s, FPR: 1 - s, total: 1, falseAlerts: (1 - s) * n('volume') };
    }
    case 'M07':
      return {
        F1: fbeta(n('precision'), n('recall')),
        F2: fbeta(n('precision'), n('recall'), n('beta')),
        arithmetic: (n('precision') + n('recall')) / 2,
      };
    case 'M08': {
      const scores = a('scores'),
        labels = a('labels'),
        positive = sum(labels),
        negative = labels.length - positive;
      const counts = a('thresholds').map((t) => {
        const tp = sum(labels.filter((x, i) => scores[i] >= t)),
          fp = scores.filter((s, i) => s >= t && labels[i] === 0).length;
        return [tp, fp, fp / negative, tp / positive];
      });
      return {
        TP: counts.map((x) => x[0]),
        FP: counts.map((x) => x[1]),
        FPR: counts.map((x) => x[2]),
        TPR: counts.map((x) => x[3]),
      };
    }
    case 'M09': {
      let wins = 0;
      for (const p of a('positive'))
        for (const m of a('negative')) wins += p > m ? 1 : p === m ? 0.5 : 0;
      const pairs = a('positive').length * a('negative').length;
      return { wins, pairs, AUC: wins / pairs, gini: (2 * wins) / pairs - 1 };
    }
    case 'M10': {
      const tpr = a('defaultCounts').map((x) => x / n('defaults')),
        fpr = a('otherCounts').map((x) => x / n('others')),
        gaps = tpr.map((r, i) => Math.abs(r - fpr[i]));
      return {
        TPR: tpr,
        FPR: fpr,
        gaps,
        KS: Math.max(...gaps),
        cutoff: gaps.indexOf(Math.max(...gaps)) + 1,
      };
    }
    case 'M11a': {
      let c = 0;
      const captured = a('labels').map((y) => (c += y));
      return {
        captured,
        precision: captured.map((x, i) => x / (i + 1)),
        recall: captured.map((x) => x / n('fraud')),
      };
    }
    case 'M11b': {
      const p = a('precisions'),
        dr = n('delta');
      const areas = a('starts').map((s, i) => ((s + a('ends')[i]) * dr) / 2);
      return { AP: sum(p) * dr, areas, trapezoid: sum(areas) };
    }
    case 'M12':
      return {
        P5: n('caught5') / n('K5'),
        R5: n('caught5') / n('fraud'),
        P10: n('caught10') / n('K10'),
        R10: n('caught10') / n('fraud'),
        extraReviews: n('K10') - n('K5'),
        extraFrauds: n('caught10') - n('caught5'),
        extraCost: (n('K10') - n('K5')) * n('cost'),
        perExtra: ((n('K10') - n('K5')) * n('cost')) / (n('caught10') - n('caught5')),
      };
    case 'M13':
      return {
        prevalence: n('fraud') / n('N'),
        precision: n('caught') / n('K'),
        lift: n('caught') / n('K') / (n('fraud') / n('N')),
        gain: n('caught') / n('fraud'),
        random: (n('K') * n('fraud')) / n('N'),
        reviewShare: n('K') / n('N'),
      };
    case 'M14': {
      const expected = a('counts').map((c, i) => c * a('predicted')[i]),
        observed = a('defaults').map((d, i) => d / a('counts')[i]),
        gap = observed.map((r, i) => r - a('predicted')[i]);
      return {
        expected,
        observed,
        gaps: gap,
        expectedTotal: sum(expected),
        actualTotal: sum(a('defaults')),
        EL: sum(expected) * n('loss'),
        realized: sum(a('defaults')) * n('loss'),
        difference: (sum(a('defaults')) - sum(expected)) * n('loss'),
      };
    }
    case 'M15': {
      const y = a('outcomes'),
        terms = a('predicted').map((p, i) => (p - y[i]) ** 2);
      return {
        terms,
        brier: mean(terms),
        baseline: mean(y.map((t) => (n('baseline') - t) ** 2)),
        largest: Math.max(...terms),
      };
    }
    case 'M16': {
      const y = a('outcomes'),
        ll = (p: number[]) =>
          mean(p.map((x, i) => -Math.log(y[i] ? Math.max(1e-15, x) : Math.max(1e-15, 1 - x))));
      return {
        LLA: ll(a('A')),
        LLB: ll(a('B')),
        errors: a('A').filter((p, i) => Number(p >= n('threshold')) !== y[i]).length,
      };
    }
    case 'M17a': {
      const costA = n('FNA') * n('cFN') + n('FPA') * n('cFP'),
        costB = n('FNB') * n('cFN') + n('FPB') * n('cFP');
      return {
        costA,
        costB,
        savings: costA - costB,
        volumeA: n('TPA') + n('FPA'),
        volumeB: n('TPB') + n('FPB'),
        excess: Math.max(0, n('TPB') + n('FPB') - n('capacity')),
      };
    }
    case 'M17b': {
      const probs = a('probs'),
        pass = probs.map((p) => p * n('cFN')),
        review = probs.map((p) => (1 - p) * n('cFP'));
      return { threshold: n('cFP') / (n('cFN') + n('cFP')), pass, review };
    }
    case 'M18': {
      const m = a('matrix'),
        support = [0, 1, 2].map((i) => sum(m.slice(3 * i, 3 * i + 3))),
        tp = [m[0], m[4], m[8]],
        fp = [0, 1, 2].map((i) => m[i] + m[3 + i] + m[6 + i] - tp[i]),
        fn = support.map((s, i) => s - tp[i]);
      const f = tp.map((t, i) => safeDiv(2 * t, 2 * t + fp[i] + fn[i]));
      return {
        perClass: f,
        macro: mean(f),
        weighted: sum(f.map((x, i) => x * support[i])) / sum(support),
        micro: (2 * sum(tp)) / (2 * sum(tp) + sum(fp) + sum(fn)),
        TP: sum(tp),
        FP: sum(fp),
        FN: sum(fn),
      };
    }
    case 'M19': {
      const selectionA = n('approvedA') / n('NA'),
        selectionB = n('approvedB') / n('NB'),
        tprA = n('TPA') / n('repayA'),
        tprB = n('TPB') / n('repayB');
      return {
        selectionA,
        selectionB,
        ratio: selectionB / selectionA,
        TPRA: tprA,
        TPRB: tprB,
        gap: Math.abs(tprA - tprB),
        FPRA: (n('approvedA') - n('TPA')) / (n('NA') - n('repayA')),
        FPRB: (n('approvedB') - n('TPB')) / (n('NB') - n('repayB')),
      };
    }
    case 'M20': {
      const f = forecast(a('actual'), a('predicted')),
        b = forecast(a('actual'), a('baseline'));
      return {
        MAE: f.MAE,
        baseline: b.MAE,
        reduction: (b.MAE - f.MAE) / b.MAE,
        dollars: (b.MAE - f.MAE) * 1000,
      };
    }
    case 'M21':
      return {
        MAEA: mean(a('A').map(Math.abs)),
        MAEB: mean(a('B').map(Math.abs)),
        RMSEA: Math.sqrt(mean(a('A').map((x) => x * x))),
        RMSEB: Math.sqrt(mean(a('B').map((x) => x * x))),
      };
    case 'M22':
      return { ...forecast(a('actual'), a('predicted'), a('history')) };
    case 'M23':
      return { ...forecast(a('actual'), a('predicted')) };
    case 'M24': {
      const lo = a('lower'),
        hi = a('upper'),
        y = a('actual'),
        wide = n('widen');
      return {
        coverage: y.filter((v, i) => v >= lo[i] && v <= hi[i]).length / y.length,
        width: mean(hi.map((v, i) => v - lo[i])),
        wideCoverage: y.filter((v, i) => v >= lo[i] - wide && v <= hi[i] + wide).length / y.length,
        wideWidth: mean(hi.map((v, i) => v - lo[i] + 2 * wide)),
      };
    }
    case 'M25': {
      const tau = n('tau'),
        losses = a('actual').map((y) =>
          y >= n('forecast') ? tau * (y - n('forecast')) : (1 - tau) * (n('forecast') - y),
        );
      return {
        losses,
        average: mean(losses),
        under: tau * n('equalError'),
        over: (1 - tau) * n('equalError'),
        ratio: tau / (1 - tau),
      };
    }
    case 'M26': {
      const scores = a('a').map((v, i) => (a('b')[i] - v) / Math.max(v, a('b')[i]));
      return { scores, mean: mean(scores) };
    }
    case 'M27a': {
      const v = a('values'),
        c = mean(v),
        c1 = mean(v.slice(0, 2)),
        c2 = mean(v.slice(2)),
        I1 = sum(v.map((x) => (x - c) ** 2)),
        I2 = sum(v.map((x, i) => (x - (i < 2 ? c1 : c2)) ** 2)),
        I3 = sum(v.slice(0, 2).map((x) => (x - c1) ** 2));
      return { c, c1, c2, I1, I2, I3, reduction12: I1 - I2, reduction23: I2 - I3 };
    }
    case 'M27b': {
      const t = a('overlap'),
        choose = (x: number) => (x * (x - 1)) / 2,
        S = sum(t.map(choose)),
        r = [t[0] + t[1], t[2] + t[3]],
        c = [t[0] + t[2], t[1] + t[3]],
        R = sum(r.map(choose)),
        C = sum(c.map(choose)),
        T = choose(sum(t)),
        chance = (R * C) / T;
      return { S, R, C, T, chance, ARI: (S - chance) / ((R + C) / 2 - chance) };
    }
    case 'M28': {
      const recalls = a('found').map((x, i) => x / a('relevant')[i]),
        precision = a('found').map((x) => x / n('K'));
      return { recalls, precision, meanRecall: mean(recalls), meanPrecision: mean(precision) };
    }
    case 'M29a': {
      const rr = a('ranks').map((r) => (r > 0 ? 1 / r : 0)),
        old = mean(rr),
        copy = [...rr];
      copy[copy.length - 1] = 1 / n('newRank');
      return { RR: rr, MRR: old, newMRR: mean(copy), improvement: mean(copy) - old };
    }
    case 'M29b': {
      const grades = a('grades'),
        dcg = (v: number[]) => sum(v.map((r, i) => (2 ** r - 1) / Math.log2(i + 2))),
        D = dcg(grades),
        I = dcg([...grades].sort((x, y) => y - x));
      return { DCG: D, IDCG: I, nDCG: D / I };
    }
    case 'M30':
      return {
        growth: (n('revenueNew') - n('revenueOld')) / n('revenueOld'),
        faithfulness: n('supported') / n('claims'),
        citation: n('correctCitations') / n('citations'),
        numerical: n('correctFigures') / n('figures'),
      };
    case 'M31':
      return {
        excessA: n('returnA') - n('rf'),
        excessB: n('returnB') - n('rf'),
        sharpeA: (n('returnA') - n('rf')) / n('volA'),
        sharpeB: (n('returnB') - n('rf')) / n('volB'),
        sortinoA: (n('returnA') - n('rf')) / n('downA'),
        sortinoB: (n('returnB') - n('rf')) / n('downB'),
      };
    case 'M32a': {
      let high = -Infinity;
      const values = a('values'),
        peaks = values.map((v) => (high = Math.max(high, v))),
        drawdowns = values.map((v, i) => (peaks[i] - v) / peaks[i]);
      return {
        peaks,
        drawdowns,
        MDD: Math.max(...drawdowns),
        finalReturn: (values.at(-1)! - values[0]) / values[0],
      };
    }
    case 'M32b': {
      const changes = a('proposed').map((v, i) => v - a('current')[i]),
        gross = sum(changes.map(Math.abs)) * n('portfolio'),
        violation = Math.max(0, Math.max(...a('alternative')) - n('cap'));
      return {
        changes,
        turnover: sum(changes.map(Math.abs)) / 2,
        gross,
        cost: gross * n('costRate'),
        violation,
        violationDollars: violation * n('portfolio'),
      };
    }
    case 'M32c': {
      const active = a('fund').map((v, i) => v - a('benchmark')[i]),
        m = mean(active),
        squares = sum(active.map((v) => (v - m) ** 2)),
        TE = Math.sqrt(squares / (active.length - 1));
      return { active, mean: m, squares, monthly: TE, annual: TE * Math.sqrt(n('periods')) };
    }
    case 'M33': {
      const losses = a('losses'),
        sorted = [...losses].sort((x, y) => x - y),
        v = nearestRank(losses, n('confidence')),
        tail = sorted.slice(-Math.ceil((1 - n('confidence') - 1e-12) * losses.length));
      return {
        sorted,
        VaR: v,
        ES: mean(tail),
        exceed: losses.filter((x) => x > v).length / losses.length,
      };
    }
    case 'M34': {
      const p = n('breaches') / n('N'),
        SE = Math.sqrt((p * (1 - p)) / n('N'));
      return {
        p,
        SE,
        lower: p - 1.96 * SE,
        upper: p + 1.96 * SE,
        newSE: Math.sqrt((p * (1 - p)) / n('newN')),
      };
    }
    case 'M35': {
      const observed = n('exceptions') / n('days'),
        nominal = 1 - n('confidence');
      return { observed, nominal, expected: n('days') * nominal, ratio: observed / nominal };
    }
    case 'M36': {
      const cost = sum(a('costs')),
        saving = n('baseline') - cost,
        regret = cost - n('hindsight'),
        bp = n('notional') * 0.0001;
      return {
        cost,
        reward: -cost,
        saving,
        regret,
        savingBps: saving / bp,
        regretBps: regret / bp,
      };
    }
    case 'M37':
      return {
        success: n('completed') / n('tasks'),
        verification: n('verified') / n('tasks'),
        unsafeAttempt: n('unsafe') / n('tasks'),
        unsafeExecution: n('executed') / n('tasks'),
        toolError: n('errors') / n('calls'),
      };
    case 'M38': {
      const terms = a('current').map(
        (v, i) => (v - a('reference')[i]) * Math.log(v / a('reference')[i]),
      );
      return { terms, PSI: sum(terms), shift: a('current')[1] - a('reference')[1] };
    }
    case 'M39a': {
      const counts = a('counts'),
        times = a('times'),
        all = counts.flatMap((c, i) => Array.from({ length: c }, () => times[i]));
      const late = sum(counts.filter((c, i) => times[i] > n('deadline')));
      return {
        total: sum(counts.map((c, i) => c * times[i])),
        mean: sum(counts.map((c, i) => c * times[i])) / sum(counts),
        p95: nearestRank(all, 0.95),
        p99: nearestRank(all, 0.99),
        late: late / sum(counts),
        onTime: 1 - late / sum(counts),
      };
    }
    case 'M39b': {
      const capacity = n('perMinute') / 60,
        human = n('analysts') * n('pace');
      return {
        capacity,
        requestBacklog: Math.max(0, n('arrival') - capacity) * n('minutes') * 60,
        human,
        dailyBacklog: Math.max(0, n('alerts') - human),
        alertBacklog: Math.max(0, n('alerts') - human) * n('days'),
        requiredPace: n('alerts') / n('analysts'),
      };
    }
    case 'M39c': {
      const cost = n('spend') + n('abstained') * n('reviewCost'),
        correct = n('autoCorrect') + n('abstained');
      return {
        abstention: n('abstained') / n('requests'),
        coverage: 1 - n('abstained') / n('requests'),
        reviewSpend: n('abstained') * n('reviewCost'),
        totalCost: cost,
        perRequest: cost / n('requests'),
        correct,
        perCorrect: cost / correct,
        autoAccuracy: n('autoCorrect') / (n('requests') - n('abstained')),
      };
    }
    case 'M39d': {
      const scheduled = n('days') * 24 * 60,
        allowed = scheduled * (1 - n('objective'));
      return {
        scheduled,
        available: scheduled - n('downtime'),
        availability: 1 - n('downtime') / scheduled,
        allowed,
        excess: Math.max(0, n('downtime') - allowed),
      };
    }
    default:
      throw new Error(`No solver registered for ${id}`);
  }
}
