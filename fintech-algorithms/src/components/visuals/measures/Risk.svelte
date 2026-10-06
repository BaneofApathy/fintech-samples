<script lang="ts">
  import { untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import {
    average,
    total,
    fmt,
    pct,
    ratio,
    tailRisk,
    wilson,
    seeded,
    drawdowns,
    stdev,
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
        exerciseId === 'M32b'
          ? 1
          : exerciseId === 'M32c'
            ? 2
            : number === 33 && focusStep === 'ES'
              ? 1
              : 0,
      ),
    ),
    shift = $state(0),
    day = $state(3),
    rebalance = $state(0),
    compare = $state(false),
    confidence = $state(untrack(() => val('confidence', 0.99))),
    tied = $state(false),
    runCount = $state(10000),
    simulate = $state(false),
    clustered = $state(false);
  let ret = $derived(val('returnA', 0.09) + shift),
    reference = $derived(val('rf', 0.04)),
    vol = $derived(val('volA', 0.1)),
    down = $derived(val('downA', 0.06));
  let wealth = $derived(arr('values', [100, 120, 110, 90, 115]));
  let dd = $derived(drawdowns(wealth));
  let oldWeights = $derived(arr('current', [0.5, 0.3, 0.2]));
  let newWeights = $derived(
    arr('proposed', [0.3, 0.5, 0.2]).map(
      (w, i) => w + (i === 0 ? rebalance : i === 1 ? -rebalance : 0),
    ),
  );
  let active = $derived(
    givens?.fund
      ? (givens.fund as number[]).map((v, i) =>
          compare ? 0 : v - (givens.benchmark as number[])[i],
        )
      : compare
        ? [0, 0, 0]
        : [-0.03, 0, 0.03],
  );
  let baseLosses = $derived(
    arr(
      'losses',
      Array.from({ length: 10000 }, (_, i) => (i < 9900 ? (2 * i) / 9899 : 3.4)),
    ),
  );
  let tieFraction = $derived(baseLosses.length < 100 ? 0.8 : 0.98);
  let tieBoundary = $derived(tailRisk(baseLosses, tieFraction).var ?? 2);
  let losses = $derived(
    tied
      ? [...baseLosses]
          .sort((a, b) => a - b)
          .map((v, i) =>
            i >= Math.floor(baseLosses.length * (baseLosses.length < 100 ? 0.8 : 0.98))
              ? tieBoundary
              : v,
          )
      : baseLosses,
  );
  let tail = $derived(tailRisk(losses, confidence));
  let bins = $derived(
    Array.from({ length: Math.min(100, losses.length) }, (_, i) => {
      const from = Math.floor((i * losses.length) / Math.min(100, losses.length)),
        to = Math.floor(((i + 1) * losses.length) / Math.min(100, losses.length));
      return {
        value: average(tail.sorted.slice(from, to))!,
        tail: to > losses.length - tail.tailCount,
      };
    }),
  );
  let baseN = $derived(val('N', 10000)),
    baseBreaches = $derived(val('breaches', 1200));
  let sampled = $derived.by(() => {
    const rng = seeded(71);
    let n = 0;
    for (let i = 0; i < runCount; i++) if (rng() < baseBreaches / baseN) n++;
    return n;
  });
  let interval = $derived(wilson(simulate ? sampled : baseBreaches, simulate ? runCount : baseN));
  let observedDays = $derived(val('days', 250)),
    exceptionCount = $derived(val('exceptions', 12)),
    nominal = $derived(1 - val('confidence', 0.99));
  let breaches = $derived(
    Array.from({ length: observedDays }, (_, i) =>
      clustered
        ? i >= Math.floor(observedDays * 0.4) && i < Math.floor(observedDays * 0.4) + exceptionCount
        : Array.from({ length: exceptionCount }, (_, j) =>
            Math.floor((j * observedDays) / exceptionCount),
          ).includes(i),
    ),
  );
  let lossScale = $derived(Math.max(...losses, 1));
</script>

{#if number === 31}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Sharpe · total variability</button
    ><button aria-pressed={tab === 1} onclick={() => (tab = 1)}
      >Sortino · downside variability</button
    >
  </div>
  <label class="vm-control"
    >Change annual mean return (percentage points) <input
      type="range"
      min="-.08"
      max=".08"
      step=".01"
      bind:value={shift}
    /><output>{pct(ret)}</output></label
  >
  <div class="vm-tray">
    <div class="vm-node">Annual mean return<strong>{pct(ret)}</strong></div>
    <span>−</span>
    <div class="vm-node">
      {tab ? 'Minimum acceptable return' : 'Risk-free rate'}<strong>{pct(reference)}</strong>
    </div>
    <span>÷</span>
    <div class="vm-node">
      {tab ? 'Downside deviation' : 'Total volatility'}<strong>{pct(tab ? down : vol)}</strong>
    </div>
  </div>
  <p class="vm-equation">
    {tab ? 'Sortino' : 'Sharpe'} = ({pct(ret)} − {pct(reference)}) / {pct(tab ? down : vol)} = {fmt(
      ratio(ret - reference, tab ? down : vol),
      3,
    )}
  </p>
  <svg
    class="vm-plot"
    viewBox="0 0 500 160"
    role="img"
    aria-label="Annual excess return and selected risk denominator"
    ><line x1="60" x2="440" y1="80" y2="80" class="vm-axis" /><line
      x1={250 - (tab ? down : vol) * 1100}
      x2={250 + (tab ? down : vol) * 1100}
      y1="80"
      y2="80"
      class="vm-gap"
    /><circle cx={250 + (ret - reference) * 1100} cy="80" r="8" class="vm-dot" /><text
      x="205"
      y="115">Zero excess</text
    ><text x="55" y="25">Risk band ± {pct(tab ? down : vol)}; point = excess mean</text></svg
  >
  <p>
    All quantities use consistently annualized estimates. The supplied risk estimates and target
    stay fixed while mean return changes; this is a sensitivity illustration, not a refitted return
    series.
  </p>
{:else if number === 32}
  <div class="visual-tabs">
    {#each ['Maximum drawdown', 'Turnover', 'Tracking error'] as label, i}<button
        aria-pressed={tab === i}
        onclick={() => (tab = i)}>{label}</button
      >{/each}
  </div>
  {#if tab === 0}<label class="vm-control"
      >Inspect observation <input
        type="range"
        min="0"
        max={wealth.length - 1}
        bind:value={day}
      /><output>{day + 1}</output></label
    ><svg
      class="vm-plot"
      viewBox="0 0 500 270"
      role="img"
      aria-label="Wealth path with running peak and selected drawdown"
      ><path d="M40 20V220H460" class="vm-axis" /><polyline
        points={wealth
          .map((v, i) => `${50 + (i * 400) / (wealth.length - 1)},${220 - v}`)
          .join(' ')}
        class="vm-line"
      /><polyline
        points={wealth
          .map(
            (_, i) =>
              `${50 + (i * 400) / (wealth.length - 1)},${220 - Math.max(...wealth.slice(0, i + 1))}`,
          )
          .join(' ')}
        class="vm-line vm-secondary"
      /><line
        x1={50 + (day * 400) / (wealth.length - 1)}
        x2={50 + (day * 400) / (wealth.length - 1)}
        y1={220 - wealth[day]}
        y2={220 - Math.max(...wealth.slice(0, day + 1))}
        class="vm-gap"
      /><text x="50" y="245">Observation 1 → {wealth.length}</text><text x="50" y="20"
        >Wealth index · solid wealth, dashed running peak</text
      ></svg
    >
    <div class="visual-readouts">
      <div><span>Selected drawdown</span><strong>{pct(dd[day])}</strong></div>
      <div><span>Maximum drawdown</span><strong>{pct(Math.max(...dd))}</strong></div>
    </div>
    {#if givens?.values}<p>
        Ending wealth versus the initial observation: {pct(wealth.at(-1)! / wealth[0] - 1)}. A
        positive final return can coexist with a large drawdown.
      </p>{/if}
  {:else if tab === 1}<label class="vm-control"
      >Move target weight from B to A <input
        type="range"
        min="-.2"
        max=".2"
        step=".05"
        bind:value={rebalance}
      /><output>{fmt(rebalance * 100, 0)} percentage points</output></label
    >
    <div class="vm-table-wrap">
      <table>
        <thead><tr><th>Asset</th><th>Before</th><th>After</th><th>Trade</th></tr></thead><tbody
          >{#each oldWeights as w, i}<tr
              ><th>{String.fromCharCode(65 + i)}</th><td>{pct(w)}</td><td>{pct(newWeights[i])}</td
              ><td>{newWeights[i] - w >= 0 ? 'Buy' : 'Sell'} {pct(Math.abs(newWeights[i] - w))}</td
              ></tr
            >{/each}</tbody
        >
      </table>
    </div>
    <div class="visual-readouts">
      <div>
        <span>Gross trading</span><strong
          >{pct(total(newWeights.map((w, i) => Math.abs(w - oldWeights[i]))))}</strong
        >
      </div>
      <div>
        <span>One-way turnover · ½ gross</span><strong
          >{pct(total(newWeights.map((w, i) => Math.abs(w - oldWeights[i]))) / 2)}</strong
        >
      </div>
    </div>
    <p>
      Fully invested portfolio; no market movement or external cash flows during this rebalance.
    </p>
  {:else}<label class="vm-check"
      ><input type="checkbox" bind:checked={compare} /> Match benchmark returns every period</label
    ><svg
      class="vm-plot"
      viewBox="0 0 500 220"
      role="img"
      aria-label="Active returns around their mean"
      ><line x1="40" x2="460" y1="110" y2="110" class="vm-axis" />{#each active as value, i}<line
          x1={100 + i * 140}
          x2={100 + i * 140}
          y1="110"
          y2={110 - value * 2200}
          class="vm-gap"
        /><circle cx={100 + i * 140} cy={110 - value * 2200} r="7" class="vm-dot" /><text
          x={70 + i * 140}
          y="205">Period {i + 1}</text
        >{/each}<text x="50" y="20">Active return = fund − benchmark</text></svg
    >
    <p class="vm-equation">
      Sample standard deviation of [{active.map((p) => pct(p)).join(', ')}] = {pct(stdev(active))}
    </p>
    <p>
      {givens?.fund
        ? 'Active returns use the exercise’s fund and benchmark observations.'
        : 'These illustrative per-period active returns reproduce the lesson’s 3% tracking error.'} Use
      sample standard deviation (n − 1); no annualization is applied here.
    </p>{/if}
{:else if number === 33}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>VaR boundary</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Expected shortfall tail</button
    >
  </div>
  <label class="vm-control"
    >Confidence <select bind:value={confidence}
      ><option value={0.8}>80%</option><option value={0.9}>90%</option><option value={0.95}
        >95%</option
      ><option value={0.99}>99%</option></select
    ></label
  ><label class="vm-check"
    ><input type="checkbox" bind:checked={tied} /> Teaching comparison: tie the largest 2% of losses at
    the initial 98% boundary</label
  >
  <svg
    class="vm-plot"
    viewBox="0 0 500 270"
    role="img"
    aria-label="Sorted scenario losses with fixed-size worst tail highlighted"
    ><path d="M35 20V220H470" class="vm-axis" />{#each bins as bin, i}<circle
        cx={40 + (i * 420) / Math.max(1, bins.length - 1)}
        cy={220 - (bin.value / lossScale) * 180}
        r={bin.tail ? 4 : 2}
        class={bin.tail ? 'vm-miss' : 'vm-dot'}
      />{/each}<line
      x1={40 + 420 * confidence}
      x2={40 + 420 * confidence}
      y1="20"
      y2="225"
      class="vm-dash"
    /><text x="50" y="20">One-day loss ($ million), increasing rank →</text><text x="40" y="257"
      >{losses.length} scenarios; plotted dots average blocks</text
    ></svg
  >
  <div class="visual-readouts">
    <div class:vm-highlight={tab === 0}>
      <span>VaR · rank {tail.rank}</span><strong>${fmt(tail.var, 2)}m</strong>
    </div>
    <div class:vm-highlight={tab === 1}>
      <span>ES · worst {tail.tailCount} scenarios</span><strong>${fmt(tail.es, 2)}m</strong>
    </div>
  </div>
  {#if givens?.losses}<p>
      Fraction strictly exceeding VaR: {pct(
        losses.filter((v) => v > (tail.var ?? 0)).length / losses.length,
      )}. The ES tail includes exactly {tail.tailCount} observations, including ties when needed.
    </p>{/if}
  <p>
    {givens?.losses
      ? 'Losses and initial confidence come from this exercise.'
      : 'Initial constructed distribution matches the lesson: 10,000 one-day scenarios, 99% VaR $2m and ES $3.4m.'}
    Tail count = ceil(N × (1 − confidence)); ties never change that count.
  </p>
{:else if number === 34}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Shortfall probability</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Monte Carlo uncertainty</button
    >
  </div>
  <label class="vm-check"
    ><input type="checkbox" bind:checked={simulate} /> Draw a new reproducible simulation under the same
    breach probability</label
  ><label class="vm-control"
    >Runs in new sample <select bind:value={runCount}
      ><option value={100}>100</option><option value={1000}>1,000</option><option value={10000}
        >10,000</option
      ><option value={40000}>40,000</option></select
    ></label
  >
  <div class="vm-tray">
    <div class="vm-node">Breaches<strong>{simulate ? sampled : baseBreaches}</strong></div>
    <span>÷</span>
    <div class="vm-node">
      Independent runs<strong>{fmt(simulate ? runCount : baseN, 0)}</strong>
    </div>
    <span>=</span>
    <div class="vm-node">Estimated probability<strong>{pct(interval.p, 2)}</strong></div>
  </div>
  <svg
    class="vm-plot"
    viewBox="0 0 500 150"
    role="img"
    aria-label="95 percent Wilson interval for breach probability"
    ><line x1="40" x2="460" y1="70" y2="70" class="vm-axis" /><line
      x1={40 + (420 * (interval.low ?? 0)) / 0.25}
      x2={40 + (420 * (interval.high ?? 0)) / 0.25}
      y1="70"
      y2="70"
      class="vm-gap"
    /><circle cx={40 + (420 * (interval.p ?? 0)) / 0.25} cy="70" r="7" class="vm-dot" /><text
      x="40"
      y="115">0%</text
    ><text x="420" y="115">25%</text></svg
  >
  <div class="visual-readouts">
    <div>
      <span>95% Wilson interval</span><strong
        >{pct(interval.low, 2)} – {pct(interval.high, 2)}</strong
      >
    </div>
    <div><span>Monte Carlo standard error</span><strong>{pct(interval.se, 3)}</strong></div>
  </div>
  <p>
    {simulate
      ? 'New fixed-seed Bernoulli sample; assumed breach probability stays at'
      : 'Supplied starting sample implies'}
    {pct(baseBreaches / baseN)}. The new chart uses a Wilson interval. The original exercise’s
    normal-approximation interval remains unchanged.
  </p>
{:else}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Exception rate</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Breach timing</button
    >
  </div>
  <label class="vm-check"
    ><input type="checkbox" bind:checked={clustered} /> Put the same {exceptionCount} breaches in consecutive
    days</label
  >
  <div
    class="vm-days"
    aria-label={`${observedDays} chronological trading-day tiles; × marks a VaR breach`}
  >
    {#each breaches as breach, i}<span
        class:vm-bad={breach}
        title={`Day ${i + 1}: ${breach ? 'loss exceeded its prior VaR forecast' : 'within VaR forecast'}`}
        >{breach ? '×' : '·'}</span
      >{/each}
  </div>
  <div class="visual-readouts">
    <div>
      <span>Observed exceptions</span><strong
        >{exceptionCount} / {observedDays} = {pct(exceptionCount / observedDays)}</strong
      >
    </div>
    <div>
      <span>Nominal {pct(1 - nominal, 0)} VaR</span><strong
        >{pct(nominal)} exception probability</strong
      >
    </div>
    <div>
      <span>Expected count</span><strong
        >{observedDays} × {pct(nominal)} = {fmt(observedDays * nominal, 1)}</strong
      >
    </div>
  </div>
  <p>
    Days run left to right, then down. {clustered
      ? 'The same count now occurs in a concentrated stress episode.'
      : 'Breaches are spread across the year.'} Count and timing answer separate diagnostic questions;
    each day compares its own prior forecast with its later loss.
  </p>
{/if}
