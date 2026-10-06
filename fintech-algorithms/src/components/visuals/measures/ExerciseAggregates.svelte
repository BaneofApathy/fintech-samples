<script lang="ts">
  import { untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import {
    total,
    average,
    fmt,
    pct,
    probabilityScores,
    adjustedRand,
    ndcg,
    stdev,
    wilson,
  } from '../../../engine/visual-math';
  let { id, givens, focusStep }: { id: string; givens: Givens; focusStep?: string } = $props();
  const n = (k: string) => Number(givens[k]);
  const a = (k: string) => givens[k] as number[];
  let choice = $state(
      untrack(() =>
        (id === 'M11b' && focusStep === 'trapezoid') ||
        (id === 'M16' && focusStep === 'LLB') ||
        (id === 'M21' && focusStep?.endsWith('B')) ||
        (id === 'M31' && focusStep?.startsWith('sortino')) ||
        (id === 'M32b' && focusStep?.startsWith('violation'))
          ? 1
          : 0,
      ),
    ),
    selected = $state(0),
    changed = $state(
      untrack(
        () =>
          (id === 'M29a' && (focusStep === 'newMRR' || focusStep === 'improvement')) ||
          (id === 'M34' && focusStep === 'newSE'),
      ),
    ),
    clusters = $state(
      untrack(() =>
        id === 'M27a'
          ? focusStep === 'I3' || focusStep === 'reduction23'
            ? 3
            : focusStep === 'I2' ||
                focusStep === 'c1' ||
                focusStep === 'c2' ||
                focusStep === 'reduction12'
              ? 2
              : 1
          : 1,
      ),
    ),
    step = $state(3);
  let logP = $derived(id === 'M16' ? a(choice ? 'B' : 'A') : []);
  let errors = $derived(id === 'M21' ? a(choice ? 'B' : 'A') : []);
  let values = $derived(id === 'M27a' ? a('values') : []);
  let centers = $derived(
    id === 'M27a'
      ? values.map((v, i) =>
          clusters === 1
            ? average(values)!
            : clusters === 2
              ? average(i < 2 ? values.slice(0, 2) : values.slice(2))!
              : i < 2
                ? average(values.slice(0, 2))!
                : v,
        )
      : [],
  );
  let overlap = $derived(id === 'M27b' ? a('overlap') : []);
  let groupA = $derived(
    id === 'M27b'
      ? overlap.flatMap((count, index) => Array(count).fill(Math.floor(index / 2)))
      : [],
  );
  let groupB = $derived(
    id === 'M27b'
      ? overlap.flatMap((count, index) => Array(count).fill(changed ? 1 - (index % 2) : index % 2))
      : [],
  );
  let ranks = $derived(
    id === 'M29a'
      ? a('ranks').map((r, i) => (changed && i === a('ranks').length - 1 ? n('newRank') : r))
      : [],
  );
  let grades = $derived(
    id === 'M29b' ? (changed ? [...a('grades')].sort((x, y) => y - x) : a('grades')) : [],
  );
  let target = $derived(id === 'M32b' ? a(choice ? 'alternative' : 'proposed') : []);
  let active = $derived(id === 'M32c' ? a('fund').map((r, i) => r - a('benchmark')[i]) : []);
  let p = $derived(id === 'M34' ? n('breaches') / n('N') : 0);
  let runs = $derived(id === 'M34' ? n(changed ? 'newN' : 'N') : 0);
  let se = $derived(id === 'M34' ? Math.sqrt((p * (1 - p)) / runs) : 0);
  let costs = $derived(id === 'M36' ? a('costs') : []);
  let claims = $derived(
    id === 'M30'
      ? [
          {
            text: `Revenue in 2025 was $${n('revenueNew')}m.`,
            cite: 'A',
            support: 'A',
            valid: true,
            citation: true,
            detail: 'Source A contains this revenue figure.',
          },
          {
            text: `Revenue grew ${pct((n('revenueNew') - n('revenueOld')) / n('revenueOld'), 1)}.`,
            cite: 'A',
            support: 'A',
            valid: true,
            citation: true,
            detail: `(${n('revenueNew')} − ${n('revenueOld')}) / ${n('revenueOld')} is the growth calculation.`,
          },
          {
            text: '2025 net profit was $12m.',
            cite: 'C',
            support: 'B',
            valid: true,
            citation: false,
            detail: 'The claim is supported by B, but its attached citation C describes debt.',
          },
          {
            text: '2025 debt was $30m.',
            cite: 'C',
            support: 'C',
            valid: false,
            citation: false,
            detail: 'Source C reports $40m; the copied amount is incorrect.',
          },
          {
            text: 'Debt will fall next year.',
            cite: 'None',
            support: 'None',
            valid: false,
            citation: false,
            detail: 'No retrieved passage supports this future prediction.',
          },
        ]
      : [],
  );
</script>

{#if id === 'M11b'}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>AP rectangles</button><button
      aria-pressed={choice === 1}
      onclick={() => (choice = 1)}>Trapezoids</button
    >
  </div>
  <svg
    class="vm-plot"
    viewBox="0 0 500 270"
    role="img"
    aria-label="Recall intervals and their precision area contributions"
    ><path d="M40 20V220H470" class="vm-axis" />{#each a('precisions') as value, i}{@const x =
        40 + i * 420 * n('delta')}{@const w = 420 * n('delta')}{#if choice === 0}<rect
          {x}
          y={220 - value * 180}
          width={w}
          height={value * 180}
          class="vm-area"
        />{:else}<polygon
          points={`${x},220 ${x},${220 - a('starts')[i] * 180} ${x + w},${220 - a('ends')[i] * 180} ${x + w},220`}
          class="vm-area"
        />{/if}<text x={x + 8} y="245">ΔR={fmt(n('delta'), 3)}</text>{/each}<text x="50" y="20"
      >Precision, 0 → 1</text
    ></svg
  >
  <div class="vm-tray">
    {#each a('precisions') as value, i}<div class="vm-node">
        <span>Recall interval {i + 1}</span><strong
          >{fmt(n('delta') * (choice ? (a('starts')[i] + a('ends')[i]) / 2 : value), 4)}</strong
        ><span
          >{fmt(n('delta'), 3)} × {choice
            ? `(${fmt(a('starts')[i], 3)} + ${fmt(a('ends')[i], 3)}) / 2`
            : fmt(value, 3)}</span
        >
      </div>{/each}
  </div>
  <p class="vm-equation">
    {choice ? 'Trapezoidal area' : 'Average precision'} = {fmt(
      total(
        a('precisions').map(
          (v, i) => n('delta') * (choice ? (a('starts')[i] + a('ends')[i]) / 2 : v),
        ),
      ),
      4,
    )}
  </p>
  <p>
    Both use the supplied recall widths. Rectangle height is the precision after the recall
    increase; trapezoids average the supplied start and end heights.
  </p>
{:else if id === 'M16'}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Model A</button><button
      aria-pressed={choice === 1}
      onclick={() => (choice = 1)}>Model B</button
    >
  </div>
  <div class="vm-card-grid">
    {#each logP as value, i}{@const actual = a('outcomes')[i]}
      <div class="vm-node" class:vm-highlight={i === 2}>
        <strong>Transaction {i + 1}</strong><span
          >Fraud p = {fmt(value, 3)}; actual y = {actual}</span
        ><span>Actual-outcome p = {fmt(actual ? value : 1 - value, 3)}</span>
        <div class="vm-track">
          <span style:width={`${100 * (actual ? value : 1 - value)}%`}></span>
        </div>
        <strong>Loss {fmt(-Math.log(Math.max(1e-12, actual ? value : 1 - value)), 4)}</strong><span
          >{value >= n('threshold') ? 'Flag' : 'Pass'} at cutoff {n('threshold')}</span
        >
      </div>{/each}
  </div>
  <p class="vm-equation">
    Average log loss = {fmt(probabilityScores(logP, a('outcomes')).logLoss, 4)}
  </p>
  <p>
    Switching models changes the confidence of transaction 3; both still flag it at the supplied
    threshold. Probabilities of the observed outcome are clipped at 10⁻¹² for numerical evaluation.
  </p>
{:else if id === 'M21'}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Forecast A residuals</button
    ><button aria-pressed={choice === 1} onclick={() => (choice = 1)}>Forecast B residuals</button>
  </div>
  <div class="vm-card-grid">
    {#each errors as value, i}<div class="vm-node">
        <strong>Day {i + 1}: {value}</strong><svg
          viewBox="0 0 110 110"
          role="img"
          aria-label={`Squared error ${value * value}`}
          ><rect
            x="5"
            y="5"
            width={Math.abs(value) * 3}
            height={Math.abs(value) * 3}
            class="vm-area"
          /></svg
        ><span>Squared error {value * value}</span>
      </div>{/each}
  </div>
  <div class="visual-readouts">
    <div>
      <span>MAE · $ thousands</span><strong>{fmt(average(errors.map(Math.abs)), 2)}</strong>
    </div>
    <div>
      <span>RMSE · $ thousands</span><strong
        >{fmt(Math.sqrt(average(errors.map((e) => e * e))!), 2)}</strong
      >
    </div>
  </div>
  <p>
    The exercise supplies signed residuals directly. The same area scale applies to both forecasts:
    a single large miss can dominate RMSE even when MAE is lower.
  </p>
{:else if id === 'M26'}
  <label class="vm-control"
    >Customer <select bind:value={selected}
      >{#each a('a') as _, i}<option value={i}>Customer {i + 1}</option>{/each}</select
    ></label
  >
  <div class="vm-tray">
    <div class="vm-node">Own-cluster mean distance<strong>a = {a('a')[selected]}</strong></div>
    <span>←</span>
    <div class="vm-node">
      <strong>Customer {selected + 1}</strong><span>Supplied mean distances</span>
    </div>
    <span>→</span>
    <div class="vm-node">Nearest other-cluster mean<strong>b = {a('b')[selected]}</strong></div>
  </div>
  <svg
    class="vm-plot"
    viewBox="0 0 500 180"
    role="img"
    aria-label="Lengths compare the supplied mean within and alternative cluster distances"
    ><line
      x1="50"
      x2={50 + (350 * a('a')[selected]) / Math.max(...a('a'), ...a('b'))}
      y1="55"
      y2="55"
      class="vm-gap"
    /><line
      x1="50"
      x2={50 + (350 * a('b')[selected]) / Math.max(...a('a'), ...a('b'))}
      y1="115"
      y2="115"
      class="vm-line vm-secondary"
    /><text x="50" y="35">a · average to own members</text><text x="50" y="95"
      >b · average to nearest alternative group</text
    ></svg
  >
  <p class="vm-equation">
    Silhouette = ({a('b')[selected]} − {a('a')[selected]}) / {Math.max(
      a('a')[selected],
      a('b')[selected],
    )} = {fmt(
      (a('b')[selected] - a('a')[selected]) / Math.max(a('a')[selected], a('b')[selected]),
      3,
    )}
  </p>
{:else if id === 'M27a'}
  <label class="vm-control"
    >Number of clusters <input type="range" min="1" max="3" step="1" bind:value={clusters} /><output
      >{clusters}</output
    ></label
  >
  <svg
    class="vm-plot"
    viewBox="0 0 500 240"
    role="img"
    aria-label="Points and assigned cluster centers on the same feature axis"
    ><path d="M40 180H460" class="vm-axis" />{#each values as value, i}{@const xpos =
        40 +
        (420 * (value - Math.min(...values))) /
          (Math.max(...values) - Math.min(...values))}{@const cpos =
        40 +
        (420 * (centers[i] - Math.min(...values))) /
          (Math.max(...values) - Math.min(...values))}<line
        x1={xpos}
        x2={cpos}
        y1="80"
        y2="145"
        class="vm-dash"
      /><circle cx={xpos} cy="80" r="8" class="vm-dot" /><rect
        x={cpos - 5}
        y="140"
        width="10"
        height="10"
        class="vm-square"
      /><text x={xpos - 6} y="58">{value}</text>{/each}<text x="50" y="210"
      >Circle = observation; square = assigned mean</text
    ></svg
  >
  <div class="vm-tray">
    {#each values as value, i}<div class="vm-node">
        <span>Point {value} → center {fmt(centers[i], 2)}</span><strong
          >({value} − {fmt(centers[i], 2)})² = {fmt((value - centers[i]) ** 2, 2)}</strong
        >
      </div>{/each}
  </div>
  <p class="vm-equation">Inertia = {fmt(total(values.map((v, i) => (v - centers[i]) ** 2)), 3)}</p>
  <p>
    K=1: one mean. K=2: first two and last two observations form groups. K=3: first two remain
    together; the other observations are singletons. These are the exercise’s supplied groupings.
  </p>
{:else if id === 'M27b'}
  <label class="vm-check"
    ><input type="checkbox" bind:checked={changed} /> Rename rerun clusters X ↔ Y</label
  >
  <div class="vm-matrix">
    {#each [0, 1] as row}{#each [0, 1] as col}<div>
          <span>Original {row ? 'B' : 'A'} ∩ rerun {col ? 'Y' : 'X'}</span><strong
            >{groupA.filter((v, i) => v === row && groupB[i] === col).length}</strong
          >
        </div>{/each}{/each}
  </div>
  <div class="vm-card-grid">
    {#each groupA as group, i}<div class="vm-node">
        <span>Customer {i + 1}</span><strong>{group ? 'B' : 'A'} → {groupB[i] ? 'Y' : 'X'}</strong>
      </div>{/each}
  </div>
  <p class="vm-equation">Adjusted Rand index = {fmt(adjustedRand(groupA, groupB), 6)}</p>
  <p>
    Customer IDs are illustrative identifiers reconstructed from the supplied overlap counts. Each
    cell and total is preserved. Renaming the second grouping changes its names but no pairwise
    membership agreement.
  </p>
{:else if id === 'M28'}
  <label class="vm-control"
    >Question <select bind:value={selected} onchange={() => (changed = false)}
      >{#each a('found') as _, i}<option value={i}>Question {i + 1}</option>{/each}</select
    ></label
  ><label class="vm-check"
    ><input
      type="checkbox"
      bind:checked={changed}
      disabled={a('found')[selected] >= a('relevant')[selected]}
    /> Retrieve one missing required passage in an extra slot</label
  >{@const found = a('found')[selected] + (changed ? 1 : 0)}{@const K = n('K') + (changed ? 1 : 0)}
  <div class="vm-tray">
    <div class="vm-node">
      <strong>All required evidence</strong>{#each Array(a('relevant')[selected]) as _, i}<span
          >{i < found ? '✓ found' : '○ missing'} · required passage {i + 1}</span
        >{/each}
    </div>
    <span>→</span>
    <div class="vm-node">
      <strong>Retrieved tray · {K} slots</strong>{#each Array(K) as _, i}<span
          >{i < found ? '✓ relevant' : '○ unrelated'} · retrieved slot {i + 1}</span
        >{/each}
    </div>
  </div>
  <div class="visual-readouts">
    <div>
      <span>Question recall</span><strong
        >{found}/{a('relevant')[selected]} = {pct(found / a('relevant')[selected])}</strong
      >
    </div>
    <div>
      <span>Question context precision</span><strong>{found}/{K} = {pct(found / K)}</strong>
    </div>
    <div>
      <span>Original mean recall</span><strong
        >{pct(average(a('found').map((v, i) => v / a('relevant')[i])))}</strong
      >
    </div>
    <div>
      <span>Original mean precision</span><strong
        >{pct(average(a('found').map((v) => v / n('K'))))}</strong
      >
    </div>
  </div>
  <p>
    Slots and required-passage counts derive from the exercise. A hit on every question does not
    guarantee all required evidence was found.
  </p>
{:else if id === 'M29a'}
  <label class="vm-check"
    ><input type="checkbox" bind:checked={changed} /> Resolve the final missed question at rank {n(
      'newRank',
    )}</label
  >
  <div class="vm-card-grid">
    {#each ranks as rank, i}<div class="vm-node">
        <strong>Question {i + 1}</strong><span
          >{rank ? `First useful result: rank ${rank}` : 'No useful result'}</span
        ><strong>Reciprocal rank {rank ? fmt(1 / rank, 3) : 0}</strong>
      </div>{/each}
  </div>
  <p class="vm-equation">MRR = {fmt(average(ranks.map((r) => (r ? 1 / r : 0))), 4)}</p>
  <p>
    Every question remains in the denominator. A missed question contributes zero until evidence is
    found.
  </p>
{:else if id === 'M29b'}
  <label class="vm-check"
    ><input type="checkbox" bind:checked={changed} /> Reorder passages into ideal relevance order</label
  >
  <div class="vm-tray">
    {#each grades as grade, i}<div class="vm-node">
        <span>Rank {i + 1}</span><strong>Grade {grade}</strong><span
          >Gain {2 ** grade - 1} / log₂({i + 2})</span
        ><strong>{fmt((2 ** grade - 1) / Math.log2(i + 2), 3)}</strong>
      </div>{/each}
  </div>
  <p class="vm-equation">nDCG = {fmt(ndcg(grades), 4)}</p>
  <p>The denominator is the discounted gain from the same grades sorted highest first.</p>
{:else if id === 'M30'}
  <div class="vm-card-grid">
    <div class="vm-node">
      <strong>Source A · revenue</strong><span>2024: ${n('revenueOld')}m</span><span
        >2025: ${n('revenueNew')}m</span
      >
    </div>
    <div class="vm-node"><strong>Source B · profit</strong><span>2025: $12m</span></div>
    <div class="vm-node"><strong>Source C · debt</strong><span>2025: $40m</span></div>
  </div>
  <label class="vm-control"
    >Inspect answer claim <select bind:value={selected}
      >{#each claims as _, i}<option value={i}>Claim {i + 1}</option>{/each}</select
    ></label
  >
  <div class="vm-tray">
    <div class="vm-node">
      <strong>{claims[selected].text}</strong><span>Attached citation: {claims[selected].cite}</span
      >
    </div>
    <span>→</span>
    <div class="vm-node" class:vm-highlight={claims[selected].valid}>
      <strong>Supporting source: {claims[selected].support}</strong><span
        >{claims[selected].detail}</span
      >
    </div>
  </div>
  <div class="visual-readouts">
    <div>
      <span>Faithfulness</span><strong
        >{n('supported')}/{n('claims')} = {pct(n('supported') / n('claims'))}</strong
      >
    </div>
    <div>
      <span>Citation correctness</span><strong
        >{n('correctCitations')}/{n('citations')} = {pct(
          n('correctCitations') / n('citations'),
        )}</strong
      >
    </div>
    <div>
      <span>Numerical accuracy</span><strong
        >{n('correctFigures')}/{n('figures')} = {pct(n('correctFigures') / n('figures'))}</strong
      >
    </div>
  </div>
  <p>
    The four financial figures are revenue, growth, profit, and debt. Claim 3 demonstrates correct
    content with an incorrect citation. Claim 4 has an incorrect figure; claim 5 is unsupported and
    has no attached citation.
  </p>
{:else if id === 'M31'}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Sharpe</button><button
      aria-pressed={choice === 1}
      onclick={() => (choice = 1)}>Sortino</button
    >
  </div>
  <div class="vm-card-grid">
    {#each ['A', 'B'] as fund}<div class="vm-node">
        <strong>Fund {fund}</strong><span>Mean return {pct(n(`return${fund}`))}</span><span
          >Reference / target {pct(n('rf'))}</span
        ><span
          >{choice ? 'Downside' : 'Total'} deviation {pct(
            n(`${choice ? 'down' : 'vol'}${fund}`),
          )}</span
        ><strong
          >{fmt((n(`return${fund}`) - n('rf')) / n(`${choice ? 'down' : 'vol'}${fund}`), 3)}</strong
        >
        <div class="vm-track">
          <span
            style:width={`${Math.min(100, (100 * n(`${choice ? 'down' : 'vol'}${fund}`)) / 0.25)}%`}
          ></span>
        </div>
      </div>{/each}
  </div>
  <p class="vm-equation">
    Ratio = (annual mean return − {pct(n('rf'))}) / {choice
      ? 'annualized downside deviation'
      : 'annualized total volatility'}
  </p>
  <p>
    These are supplied annualized estimates for the same period. Downside deviations are defined
    relative to the supplied target. The bands use one scale (25 percentage points = full width).
  </p>
{:else if id === 'M32b'}
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}>Proposed rebalance</button
    ><button aria-pressed={choice === 1} onclick={() => (choice = 1)}>Alternative allocation</button
    >
  </div>
  <div class="vm-card-grid">
    {#each a('current') as weight, i}<div class="vm-node">
        <strong>Asset {i + 1}</strong><span>{pct(weight)} → {pct(target[i])}</span><strong
          >{target[i] >= weight ? 'Buy' : 'Sell'} ${fmt(
            Math.abs(target[i] - weight) * n('portfolio'),
            0,
          )}</strong
        ><span>{target[i] > n('cap') ? 'Exceeds asset cap' : 'Within cap'}</span>
      </div>{/each}
  </div>
  {@const gross = total(target.map((w, i) => Math.abs(w - a('current')[i]))) * n('portfolio')}
  <div class="visual-readouts">
    <div><span>One-way turnover</span><strong>{pct(gross / n('portfolio') / 2)}</strong></div>
    <div><span>Gross dollars traded</span><strong>${fmt(gross, 0)}</strong></div>
    <div><span>Trading cost</span><strong>${fmt(gross * n('costRate'), 2)}</strong></div>
    <div>
      <span>Largest cap excess</span><strong
        >{pct(Math.max(0, Math.max(...target) - n('cap')))}</strong
      >
    </div>
  </div>
  <p>
    Portfolio ${fmt(n('portfolio'), 0)}; charge {pct(n('costRate'), 2)} on gross trading. Every target
    weight must be ≤ {pct(n('cap'))}. The allocations sum to 100%; no external flows or market
    movements are assumed.
  </p>
{:else if id === 'M32c'}
  <label class="vm-control"
    >Inspect period <select bind:value={selected}
      >{#each active as _, i}<option value={i}>Period {i + 1}</option>{/each}</select
    ></label
  ><svg class="vm-plot" viewBox="0 0 500 230" role="img" aria-label="Active returns and their mean"
    ><line
      x1="40"
      x2="460"
      y1="110"
      y2="110"
      class="vm-axis"
    />{#each active as value, i}{@const px = 65 + (i * 370) / (active.length - 1)}<line
        x1={px}
        x2={px}
        y1={110 - (average(active)! / Math.max(...active.map(Math.abs), 0.01)) * 75}
        y2={110 - (value / Math.max(...active.map(Math.abs), 0.01)) * 75}
        class="vm-gap"
      /><circle
        cx={px}
        cy={110 - (value / Math.max(...active.map(Math.abs), 0.01)) * 75}
        r={selected === i ? 9 : 5}
        class="vm-dot"
      /><text x={px - 15} y="210">{i + 1}</text>{/each}<line
      x1="40"
      x2="460"
      y1={110 - (average(active)! / Math.max(...active.map(Math.abs), 0.01)) * 75}
      y2={110 - (average(active)! / Math.max(...active.map(Math.abs), 0.01)) * 75}
      class="vm-dash"
    /><text x="45" y="20">Active return; dashed line = sample mean</text></svg
  >
  <p class="vm-equation">
    Period {selected + 1}: {pct(a('fund')[selected])} − {pct(a('benchmark')[selected])} = {pct(
      active[selected],
    )}
  </p>
  <div class="visual-readouts">
    <div><span>Per-period sample tracking error</span><strong>{pct(stdev(active), 4)}</strong></div>
    <div>
      <span>Annualized · √{n('periods')}</span><strong
        >{pct(stdev(active)! * Math.sqrt(n('periods')), 4)}</strong
      >
    </div>
  </div>
  <p>
    Sample variance divides by n − 1. Annualization uses the supplied number of periods and the
    exercise’s time-scaling assumption.
  </p>
{:else if id === 'M34'}
  <label class="vm-check"
    ><input type="checkbox" bind:checked={changed} /> Use {n('newN')} runs while holding the estimated
    probability fixed</label
  >
  <div class="vm-tray">
    <div class="vm-node">Original breaches / runs<strong>{n('breaches')} / {n('N')}</strong></div>
    <span>→</span>
    <div class="vm-node">Estimated probability<strong>{pct(p)}</strong></div>
    <span>→</span>
    <div class="vm-node">Current run count<strong>{fmt(runs, 0)}</strong></div>
  </div>
  <div class="visual-tabs">
    <button aria-pressed={choice === 0} onclick={() => (choice = 0)}
      >Exercise normal approximation</button
    ><button aria-pressed={choice === 1} onclick={() => (choice = 1)}>Wilson comparison</button>
  </div>
  {@const wi = wilson(p * runs, runs)}<svg
    class="vm-plot"
    viewBox="0 0 500 160"
    role="img"
    aria-label="Simulation interval contracts as the run count increases"
    ><line x1="40" x2="460" y1="80" y2="80" class="vm-axis" /><line
      x1={40 + (choice ? wi.low! : p - 1.96 * se) * 2100}
      x2={40 + (choice ? wi.high! : p + 1.96 * se) * 2100}
      y1="80"
      y2="80"
      class="vm-gap"
    /><circle cx={40 + p * 2100} cy="80" r="7" class="vm-dot" /><text x="40" y="125">0%</text><text
      x="425"
      y="125">20%</text
    ></svg
  >
  <p class="vm-equation">
    SE = {fmt(se, 6)}; 95% {choice ? 'Wilson' : 'normal-approximation'} interval = {pct(
      choice ? wi.low : p - 1.96 * se,
      3,
    )} – {pct(choice ? wi.high : p + 1.96 * se, 3)}
  </p>
  <p>
    This is the exercise’s same-estimate comparison, not a newly drawn sample. More runs reduce
    simulation noise while model-assumption uncertainty remains outside the interval.
  </p>
{:else if id === 'M36'}
  <label class="vm-control"
    >Accumulate policy cost intervals <input
      type="range"
      min="0"
      max={costs.length}
      step="1"
      bind:value={step}
    /><output>{step}/{costs.length}</output></label
  >
  <div class="vm-tray">
    {#each costs as cost, i}<div class="vm-node" class:vm-muted={i >= step}>
        <span>Interval {i + 1}</span><strong>Cost ${fmt(cost, 0)}</strong><span
          >Reward −${fmt(cost, 0)}</span
        >
      </div>{/each}
  </div>
  <div class="visual-readouts">
    <div><span>Cumulative cost</span><strong>${fmt(total(costs.slice(0, step)), 0)}</strong></div>
    <div>
      <span>Cumulative reward</span><strong>−${fmt(total(costs.slice(0, step)), 0)}</strong>
    </div>
  </div>
  {#if step === costs.length}<div class="vm-tray">
      <div class="vm-node">TWAP baseline<strong>${n('baseline')}</strong></div>
      <span>versus</span>
      <div class="vm-node">Policy<strong>${total(costs)}</strong></div>
      <span>versus</span>
      <div class="vm-node">Feasible hindsight<strong>${n('hindsight')}</strong></div>
    </div>
    <p class="vm-equation">
      Saving {fmt(((n('baseline') - total(costs)) / n('notional')) * 10000, 2)} bps; hindsight regret
      {fmt(((total(costs) - n('hindsight')) / n('notional')) * 10000, 2)} bps
    </p>{:else}<p>
      Not all cost intervals have been included. Compare completed totals before evaluating a
      policy.
    </p>{/if}
  <p>
    One basis point on ${fmt(n('notional'), 0)} equals ${fmt(n('notional') * 0.0001, 2)}. Baseline
    and hindsight refer to the same order and cost accounting.
  </p>
{/if}
