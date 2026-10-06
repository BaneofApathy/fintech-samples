<script lang="ts">
  import { untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import {
    classification,
    fScore,
    fmt,
    pct,
    pairAuc,
    thresholds,
    averagePrecision,
    trapezoid,
  } from '../../../engine/visual-math';
  let { number, givens, focusStep }: { number: number; givens?: Givens; focusStep?: string } =
    $props();
  let choice = $state(
      untrack(() =>
        number === 2 && focusStep?.startsWith('baseline')
          ? 1
          : number === 6 && focusStep === 'FPR'
            ? 1
            : 0,
      ),
    ),
    beta = $state(
      untrack(() => (focusStep === 'F1' ? 1 : focusStep === 'F2' ? 2 : Number(givens?.beta ?? 1))),
    ),
    count = $state(0),
    volume = $state(1),
    detector = $state(untrack(() => (focusStep?.endsWith('B') ? 1 : 0))),
    nextFraud = $state(false),
    future = $state(untrack(() => focusStep === 'falseAlerts' || focusStep === 'total')),
    cutoff = $state(1),
    cursor = $state(2),
    tie = $state(false),
    capacity = $state(
      untrack(() =>
        Number(focusStep?.includes('10') ? (givens?.K10 ?? 100) : (givens?.K5 ?? givens?.K ?? 100)),
      ),
    );
  const read = (name: string, fallback: number) =>
    typeof givens?.[name] === 'number' ? (givens[name] as number) : fallback;
  let initial = $derived.by(() => {
    if (givens?.caught !== undefined && givens?.alerts !== undefined) {
      const tp = read('caught', 60),
        fp = read('alerts', 200) - tp,
        f = read('fraud', 100),
        n = read('N', 10000);
      return classification(tp, fp, f - tp, n - f - fp);
    }
    if (number === 4 && givens?.caughtA !== undefined)
      return classification(
        read(detector ? 'caughtB' : 'caughtA', 15),
        read(detector ? 'alertsB' : 'alertsA', 50) - read(detector ? 'caughtB' : 'caughtA', 15),
        0,
        0,
      );
    if (number === 5 && givens?.caughtA !== undefined)
      return classification(
        read(detector ? 'caughtB' : 'caughtA', 15),
        0,
        read('fraud', 20) - read(detector ? 'caughtB' : 'caughtA', 15),
        0,
      );
    return classification(read('TP', 60), read('FP', 140), read('FN', 40), read('TN', 9760));
  });
  let lossPerEvent = $derived(read('loss', 500));
  let c = $derived(
    number === 2 && choice === 1
      ? classification(0, 0, initial.TP + initial.FN, initial.TN + initial.FP)
      : classification(
          initial.TP +
            (number === 1 || number === 5 ? count : number === 4 && nextFraud ? count : 0),
          initial.FP + (number === 4 && !nextFraud ? count : 0),
          initial.FN - (number === 1 || number === 5 ? count : 0),
          Math.max(0, initial.TN - (number === 4 && !nextFraud ? count : 0)),
        ),
  );
  let pp = $derived(read('precision', c.precision ?? 0)),
    rr = $derived(read('recall', c.recall ?? 0));
  let fraud = $derived(c.TP + c.FN),
    legit = $derived(c.FP + c.TN);
  let positives = $derived((givens?.positive as number[] | undefined) ?? [0.9, 0.8, 0.6, 0.4, 0.2]);
  let negatives = $derived((givens?.negative as number[] | undefined) ?? [0.5, 0.3, 0.1, 0.05, 0]);
  let pos = $derived(tie ? positives.map((v, i) => (i === 0 ? negatives[0] : v)) : positives);
  let auc = $derived(pairAuc(pos, negatives));
  let customCurve = $derived.by(() => {
    if (!givens?.scores || !givens.labels) return null;
    const scores = givens.scores as number[],
      labels = givens.labels as number[],
      positives = labels.reduce((s, v) => s + v, 0);
    return [
      Infinity,
      ...Array.from(
        new Set([...scores, ...((givens.thresholds as number[] | undefined) ?? [])]),
      ).sort((a, b) => b - a),
    ].map((cut) => {
      const TP = scores.filter((s, i) => s >= cut && labels[i] === 1).length,
        FP = scores.filter((s, i) => s >= cut && labels[i] === 0).length;
      return { cut, ...classification(TP, FP, positives - TP, labels.length - positives - FP) };
    });
  });
  let roc = $derived(
    customCurve ?? [
      { cut: Infinity, ...classification(0, 0, 100, 9900) },
      { cut: 0.8, ...classification(40, 20, 60, 9880) },
      { cut: 0.5, ...classification(70, 180, 30, 9720) },
      { cut: 0, ...classification(100, 9900, 0, 0) },
    ],
  );
  let point = $derived(roc[Math.min(cutoff, roc.length - 1)]);
  let ksScores = $derived(
    givens?.defaultCounts
      ? [
          0,
          ...(givens.defaultCounts as number[]).map(
            (_, i) => (i + 1) / (givens.defaultCounts as number[]).length,
          ),
        ]
      : [0, 0.2, 0.4, 0.6, 0.8, 1],
  );
  let dcdf = $derived(
    givens?.defaultCounts
      ? [0, ...(givens.defaultCounts as number[]).map((n) => n / read('defaults', 20))]
      : [0, 0.1, 0.28, 0.7, 0.9, 1],
  );
  let lcdf = $derived(
    givens?.otherCounts
      ? [0, ...(givens.otherCounts as number[]).map((n) => n / read('others', 80))]
      : [0, 0.4, 0.82, 0.9, 0.98, 1],
  );
  let ksMax = $derived(Math.max(...dcdf.map((v, i) => Math.abs(v - lcdf[i]))));
  const ranks = [0.94, 0.9, 0.84, 0.79, 0.72, 0.68, 0.55, 0.43, 0.24, 0.08],
    labels = [1, 0, 1, 1, 0, 0, 1, 0, 0, 0];
  let prLabels = $derived((givens?.labels as number[] | undefined) ?? labels);
  let prScores = $derived(
    (givens?.scores as number[] | undefined) ??
      (givens?.labels ? prLabels.map((_, i) => 1 - i / prLabels.length) : ranks),
  );
  let pr = $derived(thresholds(prScores, prLabels));
  let ap = $derived(averagePrecision(prScores, prLabels));
  let queueChoices = $derived(
    givens?.K5
      ? [read('K5', 5), read('K10', 10)]
      : givens?.K
        ? [read('K', 50), read('N', 1000)]
        : [100, 200, 500, 10000],
  );
  let population = $derived(read('N', 10000)),
    totalFraud = $derived(read('fraud', 100));
  let found = $derived(
    givens?.K5
      ? capacity === read('K5', 5)
        ? read('caught5', 3)
        : read('caught10', 5)
      : givens?.K
        ? capacity === read('K', 50)
          ? read('caught', 15)
          : totalFraud
        : capacity === 100
          ? 45
          : capacity === 200
            ? 60
            : capacity === 500
              ? 80
              : 100,
  );
  const line = (xs: number[], ys: number[]) =>
    xs.map((x, i) => `${40 + 420 * x},${230 - 190 * ys[i]}`).join(' ');
</script>

{#if number === 1}
  <label class="vm-control"
    >Move known fraud from passed to flagged <input
      type="range"
      min="0"
      max={Math.min(10, initial.FN)}
      step="1"
      bind:value={count}
    /><output>{count} cases</output></label
  >
  <div class="vm-matrix" aria-label="Confusion matrix">
    {#each [['Caught fraud · TP', c.TP], ['False alert · FP', c.FP], ['Missed fraud · FN', c.FN], ['Legitimate passed · TN', c.TN]] as cell, i}<div
        class:vm-highlight={count > 0 && (i === 0 || i === 2)}
      >
        <span>{cell[0]}</span><strong>{fmt(Number(cell[1]), 0)}</strong>
      </div>{/each}
  </div>
  <p class="vm-equation">{c.TP} + {c.FP} + {c.FN} + {c.TN} = {fmt(c.n, 0)} transactions</p>
  <p>
    Changing the action on an actual fraud moves one case from FN to TP. Its actual class stays
    fraud.
  </p>
{:else if number === 2}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Existing detector</button
    ><button aria-pressed={choice === 1} onclick={() => (choice = 1)}>Always legitimate</button>
  </div>
  <div
    class="vm-population"
    aria-label={`100 population tiles; each represents one percent of ${c.n} transactions`}
  >
    {#each Array(100) as _, i}<span
        class:vm-bad={i < Math.round((100 * fraud) / c.n)}
        title={i < Math.round((100 * fraud) / c.n) ? 'Fraud population' : 'Legitimate population'}
        >{i < Math.round((100 * fraud) / c.n) ? 'F' : '·'}</span
      >{/each}
  </div>
  <div class="visual-readouts">
    <div><span>All decisions correct</span><strong>{pct(c.accuracy)}</strong></div>
    <div><span>Frauds caught</span><strong>{c.TP} / {fraud}</strong></div>
  </div>
  <p>
    The always-legitimate baseline wins on accuracy by passing every case, but loses all fraud
    capture.
  </p>
{:else if number === 3}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Equal class weights</button
    ><button aria-pressed={choice === 1} onclick={() => (choice = 1)}>Population weights</button>
  </div>
  {#each [['Fraud', c.recall, choice === 0 ? 0.5 : fraud / c.n], ['Legitimate', c.specificity, choice === 0 ? 0.5 : legit / c.n]] as row}<div
      class="vm-bar-row"
    >
      <span>{row[0]} · weight {pct(Number(row[2]))}</span>
      <div class="vm-track">
        <span style:width={`${Number(row[1]) * 100}%`}>{pct(Number(row[1]))}</span>
      </div>
    </div>{/each}
  <p class="vm-equation">
    {choice === 0 ? 'Balanced accuracy' : 'Accuracy'} = {pct(
      choice === 0 ? c.balanced : c.accuracy,
    )}
  </p>
  <p>Both class rates stay fixed; only the averaging weights change.</p>
{:else if number === 4}
  {#if givens?.alertsA}<div class="visual-tabs">
      <button
        aria-pressed={detector === 0}
        onclick={() => {
          detector = 0;
          count = 0;
        }}>Queue A</button
      ><button
        aria-pressed={detector === 1}
        onclick={() => {
          detector = 1;
          count = 0;
        }}>Queue B</button
      >
    </div>{/if}
  <label class="vm-check"
    ><input type="checkbox" bind:checked={nextFraud} /> Next lower-ranked case is confirmed fraud (otherwise
    legitimate)</label
  >
  <label class="vm-control"
    >Admit additional lower-ranked cases to the tray <input
      type="range"
      min="0"
      max="20"
      bind:value={count}
    /><output>{count}</output></label
  >
  <div class="vm-tray">
    <div class="vm-node">Confirmed fraud<strong>{c.TP}</strong></div>
    <span>+</span>
    <div class="vm-node">False alerts<strong>{c.FP}</strong></div>
    <span>→</span>
    <div class="vm-node">Review tray<strong>{c.TP + c.FP}</strong></div>
  </div>
  <p class="vm-equation">Precision = {c.TP} / {c.TP + c.FP} = {pct(c.precision)}</p>
  <p>
    {givens?.alertsA
      ? 'The unreviewed population is not supplied.'
      : `${c.FN} missed frauds remain outside this denominator.`} Admitting legitimate cases dilutes precision;
    admitting confirmed fraud increases it. These added cases are a teaching comparison, not new exercise
    evidence.
  </p>
  {#if givens?.reviewCost}<p>
      Review spending = {c.TP + c.FP} × ${read('reviewCost', 4)} = ${fmt(
        (c.TP + c.FP) * read('reviewCost', 4),
        2,
      )}; cost per confirmed fraud = ${fmt(((c.TP + c.FP) * read('reviewCost', 4)) / c.TP, 2)}.
    </p>{/if}
{:else if number === 5}
  {#if givens?.caughtA}<div class="visual-tabs">
      <button
        aria-pressed={detector === 0}
        onclick={() => {
          detector = 0;
          count = 0;
        }}>Detector A</button
      ><button
        aria-pressed={detector === 1}
        onclick={() => {
          detector = 1;
          count = 0;
        }}>Detector B</button
      >
    </div>{/if}
  <label class="vm-control"
    >Catch additional fraud events <input
      type="range"
      min="0"
      max={Math.min(20, initial.FN)}
      bind:value={count}
    /><output>{count}</output></label
  >
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}
      >Every fraud costs ${lossPerEvent}</button
    ><button aria-pressed={choice === 1} onclick={() => (choice = 1)}
      >Misses cost ${lossPerEvent * 4}</button
    >
  </div>
  <div class="vm-track vm-wide">
    <span style:width={`${(100 * c.TP) / fraud}%`}>Caught {c.TP}</span><b>Missed {c.FN}</b>
  </div>
  <div class="visual-readouts">
    <div><span>Event recall</span><strong>{pct(c.recall)}</strong></div>
    <div>
      <span>Fraud dollars captured</span><strong
        >{pct(
          (c.TP * lossPerEvent) /
            (c.TP * lossPerEvent + c.FN * (choice ? lossPerEvent * 4 : lossPerEvent)),
        )}</strong
      >
    </div>
    <div>
      <span>Missed-dollar loss</span><strong
        >${fmt(c.FN * (choice ? lossPerEvent * 4 : lossPerEvent), 0)}</strong
      >
    </div>
  </div>
  <p>
    The unequal-value comparison is a teaching scenario. It changes event values while preserving
    event counts.
  </p>
  {#if givens?.caughtA}<p>
      At the original equal loss per event, A misses {read('fraud', 20) - read('caughtA', 15)} and B misses
      {read('fraud', 20) - read('caughtB', 8)}. Using A saves ${fmt(
        (read('caughtA', 15) - read('caughtB', 8)) * lossPerEvent,
        0,
      )} in missed-fraud loss.
    </p>{/if}
{:else if number === 6}
  {#if givens?.volume}<label class="vm-check"
      ><input type="checkbox" bind:checked={future} /> Project the same rates onto {fmt(
        read('volume', 1000000),
        0,
      )} legitimate transactions</label
    >{/if}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Specificity</button><button
      aria-pressed={choice === 1}
      onclick={() => (choice = 1)}>False-positive rate</button
    >
  </div>
  <label class="vm-control"
    >Legitimate transaction volume multiplier <input
      type="range"
      min="1"
      max="1000"
      bind:value={volume}
    /><output>× {volume}</output></label
  >
  <div class="vm-track vm-wide">
    <span style:width={`${100 * (c.specificity ?? 0)}%`}>Passed {pct(c.specificity)}</span>
  </div>
  <p>Flagged share: {pct(c.fpr)}. Passed share + flagged share = 100%.</p>
  <p class="vm-equation">
    {choice ? 'False alerts' : 'Legitimate passed'} = {fmt(
      (choice ? c.FP : c.TN) * (future ? read('volume', 1000000) / legit : volume),
      0,
    )} of {fmt(legit * volume, 0)}
  </p>
  <p>The false-alert count grows with volume even when its rate stays unchanged.</p>
{:else if number === 7}
  <label class="vm-control"
    >Beta <select bind:value={beta}
      ><option value={0.5}>0.5 · emphasize precision</option><option value={1}
        >1 · balanced emphasis</option
      ><option value={2}>2 · emphasize recall</option></select
    ></label
  >
  <div class="vm-tray">
    <div class="vm-node">Precision<strong>{pct(pp)}</strong></div>
    <span>↘</span>
    <div class="vm-node">F{beta}<strong>{fmt(fScore(pp, rr, beta))}</strong></div>
    <span>↗</span>
    <div class="vm-node">Recall<strong>{pct(rr)}</strong></div>
  </div>
  <p class="vm-equation">Fβ = (1 + β²) P R / (β² P + R)</p>
  <p>The underlying predictions remain fixed at every beta.</p>
  <p>
    For comparison, the arithmetic mean of precision and recall is {fmt((pp + rr) / 2, 3)}. F1 uses
    the harmonic mean.
  </p>
{:else if number === 8}
  {#if givens?.thresholds}<div class="visual-tabs">
      {#each givens.thresholds as number[] as t}<button
          aria-pressed={point.cut === t}
          onclick={() => (cutoff = roc.findIndex((p) => p.cut === t))}>Cutoff {t}</button
        >{/each}
    </div>{/if}
  <label class="vm-control"
    >Operating point <input type="range" min="0" max={roc.length - 1} bind:value={cutoff} /><output
      >{point.cut === Infinity ? 'No alerts' : `Score ≥ ${point.cut}`}</output
    ></label
  >
  <svg
    class="vm-plot"
    viewBox="0 0 500 280"
    role="img"
    aria-label="ROC curve: horizontal false positive rate, vertical true positive rate"
    ><path d="M40 25V230H475" class="vm-axis" /><line
      x1="40"
      y1="230"
      x2="460"
      y2="40"
      class="vm-dash"
    /><polyline
      points={line(
        roc.map((p) => p.fpr ?? 0),
        roc.map((p) => p.recall ?? 0),
      )}
      class="vm-line"
    /><circle
      cx={40 + 420 * (point.fpr ?? 0)}
      cy={230 - 190 * (point.recall ?? 0)}
      r="7"
      class="vm-dot"
    /><text x="180" y="266">False-positive rate (0 → 100%)</text><text x="50" y="25"
      >True-positive rate (0 → 100%)</text
    ></svg
  >
  <div class="visual-readouts">
    <div><span>Fraud caught</span><strong>{point.TP} / {point.TP + point.FN}</strong></div>
    <div><span>False alerts</span><strong>{point.FP} / {point.FP + point.TN}</strong></div>
    <div><span>Review cases</span><strong>{point.TP + point.FP}</strong></div>
  </div>
  <p>
    The endpoints include no alerts and all alerts. Lowering the cutoff changes workload as well as
    capture.
  </p>
  {#if givens?.thresholds}<div class="vm-table-wrap">
      <table>
        <thead><tr><th>Cutoff</th><th>TP</th><th>FP</th><th>TPR</th><th>FPR</th></tr></thead><tbody
          >{#each givens.thresholds as number[] as cut}{@const p = roc.find(
              (p) => p.cut === cut,
            )!}<tr class:vm-highlight={point.cut === cut}
              ><td>{cut}</td><td>{p.TP}</td><td>{p.FP}</td><td>{pct(p.recall)}</td><td
                >{pct(p.fpr)}</td
              ></tr
            >{/each}</tbody
        >
      </table>
    </div>{/if}
{:else if number === 9}
  <label class="vm-check"
    ><input type="checkbox" bind:checked={tie} /> Move the highest fraud score to {negatives[0]} and create
    a tie</label
  >
  <div class="vm-table-wrap">
    <table>
      <caption
        >Each cell compares one fraud with one legitimate score: 1 correct order, ½ tie, 0 reversed.</caption
      ><thead
        ><tr
          ><th>Fraud \ legitimate</th>{#each negatives as n}<th>{n}</th>{/each}</tr
        ></thead
      ><tbody
        >{#each pos as p}<tr
            ><th>{p}</th>{#each negatives as n}<td class:vm-highlight={p === n}
                >{p > n ? '1' : p === n ? '½' : '0'}</td
              >{/each}</tr
          >{/each}</tbody
      >
    </table>
  </div>
  <div class="visual-readouts">
    <div><span>ROC-AUC</span><strong>{fmt(auc)}</strong></div>
    <div>
      <span>AUC-derived Gini = 2 AUC − 1</span><strong
        >{fmt(auc === null ? null : 2 * auc - 1)}</strong
      >
    </div>
  </div>
{:else if number === 10}
  <label class="vm-control"
    >Score cursor <input
      type="range"
      min="0"
      max={ksScores.length - 1}
      bind:value={cursor}
    /><output>{ksScores[cursor]}</output></label
  >
  <svg
    class="vm-plot"
    viewBox="0 0 500 280"
    role="img"
    aria-label="Two cumulative score distributions and their gap"
    ><path d="M40 25V230H475" class="vm-axis" /><polyline
      points={line(ksScores, dcdf)}
      class="vm-line"
    /><polyline points={line(ksScores, lcdf)} class="vm-line vm-secondary" /><line
      x1={40 + 420 * ksScores[cursor]}
      x2={40 + 420 * ksScores[cursor]}
      y1={230 - 190 * dcdf[cursor]}
      y2={230 - 190 * lcdf[cursor]}
      class="vm-gap"
    /><text x="65" y="25">Cumulative share (0 → 100%)</text><text x="200" y="266"
      >Score (0 → 1)</text
    ></svg
  >
  <p>
    Solid: defaults; dashed: non-defaults. {givens?.defaultCounts
      ? 'Exercise cutoffs ordered from stricter to looser; the vertical quantities are cumulative flagged class shares.'
      : 'These supplied distributions reproduce the lesson’s maximum gap.'}
  </p>
  <div class="visual-readouts">
    <div>
      <span>Gap at cursor</span><strong>{pct(Math.abs(dcdf[cursor] - lcdf[cursor]))}</strong>
    </div>
    <div><span>Maximum gap · KS</span><strong>{fmt(ksMax * 100, 1)} percentage points</strong></div>
  </div>
  {#if givens?.defaultCounts}<div class="vm-table-wrap">
      <table>
        <thead
          ><tr><th>Ordered cutoff</th><th>Default capture</th><th>Other capture</th><th>Gap</th></tr
          ></thead
        ><tbody
          >{#each dcdf.slice(1) as d, i}<tr
              ><td>{i + 1}</td><td>{pct(d)}</td><td>{pct(lcdf[i + 1])}</td><td
                >{pct(Math.abs(d - lcdf[i + 1]))}</td
              ></tr
            >{/each}</tbody
        >
      </table>
    </div>{/if}
{:else if number === 11}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Average precision</button
    ><button aria-pressed={choice === 1} onclick={() => (choice = 1)}>Trapezoidal area</button>
  </div>
  <p class="visual-caption">
    {givens?.labels
      ? 'Ranked labels from this exercise.'
      : 'Small ranked demonstration: 10 transactions, 4 frauds (40% prevalence). This differs from the lesson’s 1% population; do not compare their AP values.'}
  </p>
  <svg
    class="vm-plot"
    viewBox="0 0 500 280"
    role="img"
    aria-label="Precision recall curve with the chosen area convention"
    ><path d="M40 25V230H475" class="vm-axis" />{#each pr.slice(1) as p, i}{#if choice === 0}<rect
          x={40 + 420 * (pr[i].recall ?? 0)}
          y={230 - 190 * (p.precision ?? 0)}
          width={420 * ((p.recall ?? 0) - (pr[i].recall ?? 0))}
          height={190 * (p.precision ?? 0)}
          class="vm-area"
        />{/if}{/each}<polyline
      points={line(
        pr.map((p) => p.recall ?? 0),
        pr.map((p, i) => (i === 0 ? 1 : (p.precision ?? 0))),
      )}
      class="vm-line"
    /><line
      x1="40"
      x2="460"
      y1={230 - (190 * prLabels.filter(Boolean).length) / prLabels.length}
      y2={230 - (190 * prLabels.filter(Boolean).length) / prLabels.length}
      class="vm-dash"
    /><text x="150" y="266">Recall (0 → 100%)</text><text x="60" y="25">Precision (0 → 100%)</text
    ></svg
  >
  <p class="vm-equation">
    {choice === 0 ? 'AP' : 'Trapezoidal PR area'} = {fmt(
      choice === 0
        ? ap
        : trapezoid(
            pr.map((p) => p.recall ?? 0),
            pr.map((p, i) => (i === 0 ? 1 : (p.precision ?? 0))),
          ),
    )}
  </p>
  <p>Scores tied at one cutoff are admitted together. The horizontal reference is prevalence.</p>
{:else}
  <label class="vm-control"
    >Daily review capacity <select bind:value={capacity}
      >{#each queueChoices as k}<option value={k}>{k} cases</option>{/each}</select
    ></label
  >
  {#if number === 12}<div class="vm-tray">
      <div class="vm-node">
        Inside queue<strong>{found} frauds</strong>{capacity - found} legitimate
      </div>
      <span>│ capacity {capacity} │</span>
      <div class="vm-node">
        Outside queue<strong>{totalFraud - found} frauds</strong>{givens?.K5
          ? 'Unspecified'
          : population - capacity - (totalFraud - found)} legitimate
      </div>
    </div>
    <div class="visual-readouts">
      <div><span>Precision@{capacity}</span><strong>{pct(found / capacity)}</strong></div>
      <div><span>Recall@{capacity}</span><strong>{pct(found / totalFraud)}</strong></div>
    </div>
  {:else}<svg
      class="vm-plot"
      viewBox="0 0 500 280"
      role="img"
      aria-label="Cumulative gain compared with random review"
      ><path d="M40 25V230H475" class="vm-axis" /><line
        x1="40"
        y1="230"
        x2="460"
        y2="40"
        class="vm-dash"
      /><polyline
        points={givens
          ? line([0, capacity / population, 1], [0, found / totalFraud, 1])
          : line([0, 0.01, 0.02, 0.05, 1], [0, 0.45, 0.6, 0.8, 1])}
        class="vm-line"
      /><circle
        cx={40 + (420 * capacity) / population}
        cy={230 - (190 * found) / totalFraud}
        r="7"
        class="vm-dot"
      /><text x="100" y="266">Population reviewed (0 → 100%)</text><text x="50" y="25"
        >Fraud captured (0 → 100%)</text
      ></svg
    >
    <div class="visual-readouts">
      <div><span>Cumulative gain</span><strong>{pct(found / totalFraud)}</strong></div>
      <div>
        <span>Lift versus {pct(totalFraud / population)} prevalence</span><strong
          >{fmt(found / capacity / (totalFraud / population))}×</strong
        >
      </div>
    </div>{/if}
  {#if givens?.K5}<p>
      Moving from {read('K5', 5)} to {read('K10', 10)} reviews adds {read('caught10', 5) -
        read('caught5', 3)} captured frauds and costs ${(read('K10', 10) - read('K5', 5)) *
        read('cost', 2)} in extra review spending.
    </p>{/if}
  {#if givens?.K}<p>
      Random review would find {fmt((capacity * totalFraud) / population, 2)} frauds on average. The selected
      queue covers {pct(capacity / population)} of this population.
    </p>{/if}
  <p>
    {givens
      ? `Queue counts use the exercise; ${totalFraud} total frauds. Unspecified portions of the population are not inferred.`
      : 'Population: 10,000 daily transactions including 100 frauds. The top-100 case matches the lesson; larger queues are supplied teaching extensions.'}
  </p>
{/if}
