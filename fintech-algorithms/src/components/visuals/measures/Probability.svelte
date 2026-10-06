<script lang="ts">
  import { untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import {
    total,
    average,
    ratio,
    fmt,
    pct,
    probabilityScores,
    multiclass,
  } from '../../../engine/visual-math';
  let {
    number,
    givens,
    exerciseId,
    focusStep,
  }: { number: number; givens?: Givens; exerciseId?: string; focusStep?: string } = $props();
  const val = (key: string, n: number) =>
    typeof givens?.[key] === 'number' ? (givens[key] as number) : n;
  const arr = (key: string, a: number[]) =>
    Array.isArray(givens?.[key]) ? (givens[key] as number[]) : a;
  let tab = $state(
      untrack(() =>
        exerciseId === 'M17b'
          ? 1
          : number === 18
            ? focusStep === 'micro'
              ? 2
              : focusStep === 'weighted'
                ? 1
                : 0
            : number === 19
              ? focusStep?.startsWith('FPR')
                ? 2
                : focusStep?.startsWith('TPR') || focusStep === 'gap'
                  ? 1
                  : 0
              : 0,
      ),
    ),
    change = $state(0),
    outcome = $state(0),
    selected = $state(2),
    corrected = $state(false),
    costDelta = $state(0),
    capacityDelta = $state(0),
    probability = $state(0.01);
  let counts = $derived(arr('counts', [100, 100, 100])),
    defaults = $derived(arr('defaults', [3, 10, 30]));
  let predicted = $derived(
    arr('predicted', [0.05, 0.1, 0.2]).map((p, i) =>
      Math.max(0.001, Math.min(0.999, p + (i === selected ? change : 0))),
    ),
  );
  let loss = $derived(val('loss', 4000)),
    expected = $derived(predicted.map((p, i) => p * counts[i]));
  let bandBrier = $derived(
    total(predicted.map((p, i) => defaults[i] * (1 - p) ** 2 + (counts[i] - defaults[i]) * p * p)) /
      total(counts),
  );
  let brierP = $derived(
      arr('predicted', [0.1, 0.8, 0.6, 0.2]).map((p, i) =>
        Math.max(0, Math.min(1, p + (i === 2 ? change : 0))),
      ),
    ),
    outcomes = $derived(arr('outcomes', [0, 1, 0, 0]));
  let singleP = $derived(Math.max(0.001, Math.min(0.999, 0.6 + change)));
  let cFN = $derived(val('cFN', 500) + costDelta),
    cFP = $derived(val('cFP', 4)),
    cap = $derived(val('capacity', 300) + capacityDelta);
  let scenarios = $derived([
    { name: 'A', tp: val('TPA', 60), fp: val('FPA', 140), fn: val('FNA', 40) },
    { name: 'B', tp: val('TPB', 75), fp: val('FPB', 500), fn: val('FNB', 25) },
  ]);
  let rawMatrix = $derived(arr('matrix', [8, 1, 1, 1, 3, 0, 2, 0, 0]));
  let matrix = $derived(
    [rawMatrix.slice(0, 3), rawMatrix.slice(3, 6), rawMatrix.slice(6, 9)].map((row, i) =>
      row.map((v, j) => (corrected && i === 2 ? (j === 0 ? v - 1 : j === 2 ? v + 1 : v) : v)),
    ),
  );
  let metrics = $derived(multiclass(matrix));
  let groups = $derived([
    {
      name: 'A',
      n: val('NA', 1000),
      approved: val('approvedA', 600),
      repayers: val('repayA', 700),
      tp: val('TPA', 560),
    },
    {
      name: 'B',
      n: val('NB', 1000),
      approved: val('approvedB', 420) + (corrected ? 1 : 0),
      repayers: val('repayB', 500),
      tp: val('TPB', 360) + (corrected ? 1 : 0),
    },
  ]);
  const points = (p: number[]) => p.map((v, i) => `${45 + i * 100},${215 - v * 160}`).join(' ');
</script>

{#if number === 14}
  <div class="vm-controls">
    <label class="vm-control"
      >Loan band <select bind:value={selected} onchange={() => (change = 0)}
        >{#each counts as _, i}<option value={i}
            >{['Low', 'Medium', 'High'][i] ?? `Band ${i + 1}`}</option
          >{/each}</select
      ></label
    ><label class="vm-control"
      >Change its probability (percentage points) <input
        type="range"
        min="-0.04"
        max="0.7"
        step="0.01"
        bind:value={change}
      /><output>{fmt(change * 100, 0)} points</output></label
    >
  </div>
  <svg
    class="vm-plot"
    viewBox="0 0 500 285"
    role="img"
    aria-label="Reliability diagram: predicted probability horizontally, observed frequency vertically"
    ><path d="M40 25V230H470" class="vm-axis" /><line
      x1="40"
      y1="230"
      x2="450"
      y2="30"
      class="vm-dash"
    />{#each predicted as p, i}<circle
        cx={40 + 410 * p}
        cy={230 - (200 * defaults[i]) / counts[i]}
        r={i === selected ? 9 : 6}
        class="vm-dot"
      /><text x={45 + 410 * p} y={219 - (200 * defaults[i]) / counts[i]}>{i + 1}</text>{/each}<text
      x="135"
      y="270">Predicted probability (0 → 100%)</text
    ><text x="50" y="20">Observed default rate (0 → 100%)</text></svg
  >
  <div class="vm-table-wrap">
    <table>
      <thead
        ><tr><th>Band / loans</th><th>Predicted</th><th>Expected defaults</th><th>Observed</th></tr
        ></thead
      ><tbody
        >{#each predicted as p, i}<tr class:vm-highlight={selected === i}
            ><th>{i + 1} / {counts[i]}</th><td>{pct(p)}</td><td>{fmt(expected[i], 1)}</td><td
              >{defaults[i]} ({pct(defaults[i] / counts[i])})</td
            ></tr
          >{/each}</tbody
      >
    </table>
  </div>
  <div class="visual-readouts">
    <div><span>Expected loss</span><strong>${fmt(total(expected) * loss, 0)}</strong></div>
    <div><span>Realized loss</span><strong>${fmt(total(defaults) * loss, 0)}</strong></div>
    <div><span>Brier score</span><strong>{fmt(bandBrier, 4)}</strong></div>
  </div>
  <p>
    Each default loses ${fmt(loss, 0)}. Editing a probability moves its point horizontally; observed
    outcomes stay fixed.
  </p>
{:else if number === 15}
  <label class="vm-control"
    >Change loan C probability <input
      type="range"
      min="-.6"
      max=".4"
      step=".01"
      bind:value={change}
    /><output>{pct(brierP[2])}</output></label
  >
  <div class="vm-card-grid">
    {#each brierP as p, i}<div class="vm-node">
        <strong>Loan {String.fromCharCode(65 + i)}</strong><span
          >p = {fmt(p, 2)} · y = {outcomes[i]}</span
        ><svg
          viewBox="0 0 110 110"
          role="img"
          aria-label={`Squared error ${fmt((p - outcomes[i]) ** 2, 4)}`}
          ><rect x="5" y="5" width="100" height="100" class="vm-outline" /><rect
            x="5"
            y="5"
            width={100 * Math.abs(p - outcomes[i])}
            height={100 * Math.abs(p - outcomes[i])}
            class="vm-area"
          /></svg
        ><span>Area = {fmt((p - outcomes[i]) ** 2, 4)}</span>
      </div>{/each}
  </div>
  <div class="visual-readouts">
    <div>
      <span>Model Brier</span><strong>{fmt(probabilityScores(brierP, outcomes).brier, 4)}</strong>
    </div>
    <div>
      <span>Constant {pct(val('baseline', 0.25))} baseline</span><strong
        >{fmt(
          probabilityScores(
            outcomes.map(() => val('baseline', 0.25)),
            outcomes,
          ).brier,
          4,
        )}</strong
      >
    </div>
  </div>
{:else if number === 16}
  <label class="vm-control"
    >Fraud probability <input
      type="range"
      min="-.599"
      max=".399"
      step=".001"
      bind:value={change}
    /><output>{pct(singleP, 1)}</output></label
  ><label class="vm-control"
    >Actual outcome <select bind:value={outcome}
      ><option value={0}>Legitimate</option><option value={1}>Fraud</option></select
    ></label
  >
  <svg
    class="vm-plot"
    viewBox="0 0 500 280"
    role="img"
    aria-label="Log loss versus probability assigned to the observed outcome"
    ><path d="M40 20V230H465" class="vm-axis" /><polyline
      points={Array.from({ length: 100 }, (_, i) => {
        const p = (i + 1) / 100;
        return `${40 + 420 * p},${230 - 27 * -Math.log(p)}`;
      }).join(' ')}
      class="vm-line"
    /><circle
      cx={40 + 420 * (outcome ? singleP : 1 - singleP)}
      cy={230 - 27 * -Math.log(outcome ? singleP : 1 - singleP)}
      r="7"
      class="vm-dot"
    /><text x="55" y="20">Loss</text><text x="60" y="267"
      >Probability of actual outcome (0 → 100%)</text
    ></svg
  >
  <p class="vm-equation">
    −ln({fmt(outcome ? singleP : 1 - singleP, 3)}) = {fmt(
      -Math.log(outcome ? singleP : 1 - singleP),
      3,
    )}
  </p>
  <p>
    At zero probability of the actual outcome, theoretical loss is infinite. This control stops at
    0.1%; numerical batch calculations clip probabilities at 10⁻¹².
  </p>
{:else if number === 17}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Error-cost stack</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Action-cost cutoff</button
    >
  </div>
  <label class="vm-control"
    >Missed-fraud cost <input
      type="range"
      min="-400"
      max="1500"
      step="25"
      bind:value={costDelta}
    /><output>${cFN}</output></label
  >
  {#if tab === 0}<label class="vm-control"
      >Review capacity change <input
        type="range"
        min="-50"
        max="400"
        step="25"
        bind:value={capacityDelta}
      /><output>{cap} alerts</output></label
    >{#each scenarios as s}<div class="vm-bar-row">
        <span
          >Threshold {s.name} · {s.tp + s.fp} reviews · {s.tp + s.fp > cap
            ? 'OVER CAPACITY'
            : 'fits'}</span
        >
        <div class="vm-tray">
          <div class="vm-node">Missed-fraud cost<strong>${fmt(s.fn * cFN, 0)}</strong></div>
          <span>+</span>
          <div class="vm-node">False-alert cost<strong>${fmt(s.fp * cFP, 0)}</strong></div>
          <span>=</span>
          <div class="vm-node"><strong>${fmt(s.fn * cFN + s.fp * cFP, 0)}</strong></div>
        </div>
      </div>{/each}
    <p>
      Other outcomes have zero incremental cost. No extra review charge is added to this lesson’s
      cost table.
    </p>
  {:else}{#if givens?.probs}<div class="visual-tabs">
        {#each givens.probs as number[] as prob}<button
            aria-pressed={probability === prob}
            onclick={() => (probability = prob)}>{pct(prob)}</button
          >{/each}
      </div>{/if}<label class="vm-control"
      >Calibrated fraud probability <input
        type="range"
        min="0"
        max=".1"
        step=".001"
        bind:value={probability}
      /><output>{pct(probability)}</output></label
    ><svg
      class="vm-plot"
      viewBox="0 0 500 270"
      role="img"
      aria-label="Pass and flag expected action costs cross at the economic cutoff"
      ><path d="M40 25V225H470" class="vm-axis" /><polyline
        points={`40,225 460,${225 - 190}`}
        class="vm-line"
      /><polyline
        points={`40,${225 - (190 * cFP) / (cFN * 0.1)} 460,${225 - (190 * 0.9 * cFP) / (cFN * 0.1)}`}
        class="vm-line vm-secondary"
      /><line
        x1={40 + (420 * probability) / 0.1}
        x2={40 + (420 * probability) / 0.1}
        y1="25"
        y2="225"
        class="vm-dash"
      /><text x="70" y="20">Cost ($); solid: pass, dashed: flag</text><text x="150" y="260"
        >Probability (0 → 10%)</text
      ></svg
    >
    <div class="visual-readouts">
      <div><span>Equal-cost cutoff</span><strong>{pct(cFP / (cFN + cFP), 3)}</strong></div>
      <div><span>Pass cost</span><strong>${fmt(cFN * probability, 2)}</strong></div>
      <div><span>Flag cost</span><strong>${fmt(cFP * (1 - probability), 2)}</strong></div>
    </div>
    <p>
      Flagging is assumed to prevent the fraud loss. At this probability, {cFN * probability >
      cFP * (1 - probability)
        ? 'flag'
        : 'pass'} has the lower modeled cost. This comparison excludes capacity constraints.
    </p>{/if}
{:else if number === 18}
  <div class="visual-tabs">
    {#each ['Macro-F1', 'Weighted-F1', 'Micro-F1'] as label, i}<button
        aria-pressed={tab === i}
        onclick={() => (tab = i)}>{label}</button
      >{/each}
  </div>
  {#if !givens}<p>
      The lesson’s supplied per-class scores are [0.95, 0.80, 0.20] with supports [70, 20, 10]:
      macro = 0.650, weighted = 0.845. A micro score cannot be reconstructed from these summaries
      alone.
    </p>{/if}
  <p class="visual-caption">
    Underlying-count demonstration {exerciseId ? 'from this exercise' : 'from exercise M18'}: 16
    sentiment records. Rows are actual; columns predicted.
  </p>
  <label class="vm-check"
    ><input type="checkbox" bind:checked={corrected} /> Correct one negative record currently labeled
    neutral</label
  >
  <div class="vm-table-wrap">
    <table>
      <thead
        ><tr
          ><th>Actual \ predicted</th><th>Neutral</th><th>Positive</th><th>Negative</th><th
            >Class F1</th
          ></tr
        ></thead
      ><tbody
        >{#each matrix as row, i}<tr
            ><th>{['Neutral', 'Positive', 'Negative'][i]}</th>{#each row as v, j}<td
                class:vm-highlight={i === j}>{v}</td
              >{/each}<td>{fmt(metrics.f1[i])}</td></tr
          >{/each}</tbody
      >
    </table>
  </div>
  <div class="vm-tray">
    {#each metrics.f1 as f, i}<div class="vm-node">
        {['Neutral', 'Positive', 'Negative'][i]}<strong
          >{tab === 0
            ? '⅓ class weight'
            : tab === 1
              ? pct(metrics.support[i] / total(metrics.support))
              : 'Pool all TP, FP, FN'}</strong
        >
      </div>{/each}
  </div>
  <p class="vm-equation">
    {['Macro-F1', 'Weighted-F1', 'Micro-F1'][tab]} = {fmt(
      [metrics.macro, metrics.weighted, metrics.micro][tab],
    )}
  </p>
{:else}
  <div class="visual-tabs">
    {#each ['Selection rate', 'Repayer approval', 'False-positive rate'] as label, i}<button
        aria-pressed={tab === i}
        onclick={() => (tab = i)}>{label}</button
      >{/each}
  </div>
  <label class="vm-check"
    ><input type="checkbox" bind:checked={corrected} /> Approve one additional known repayer in B</label
  >
  <p>
    Retrospective benchmark: outcomes known for every applicant; approval is the positive decision,
    repayment the positive outcome. {givens
      ? 'Counts use the exercise.'
      : 'The lesson approval and repayer rates are completed with 700 known repayers in A and 500 in B for this illustration.'}
  </p>
  {#each groups as g}{@const numerator =
      tab === 0 ? g.approved : tab === 1 ? g.tp : g.approved - g.tp}{@const denominator =
      tab === 0 ? g.n : tab === 1 ? g.repayers : g.n - g.repayers}
    <div class="vm-bar-row">
      <span
        >Group {g.name}: {numerator} / {denominator}
        {['applicants', 'actual repayers', 'actual non-repayers'][tab]}</span
      >
      <div class="vm-track">
        <span style:width={`${(100 * numerator) / denominator}%`}
          >{pct(numerator / denominator)}</span
        >
      </div>
    </div>{/each}
  <p class="vm-equation">
    {tab === 0
      ? `Selection-rate ratio B/A = ${fmt(groups[1].approved / groups[1].n / (groups[0].approved / groups[0].n))}`
      : tab === 1
        ? `Repayer approval gap = ${fmt(100 * (groups[0].tp / groups[0].repayers - groups[1].tp / groups[1].repayers), 2)} percentage points`
        : 'False positives are approvals among known non-repayers.'}
  </p>
{/if}
