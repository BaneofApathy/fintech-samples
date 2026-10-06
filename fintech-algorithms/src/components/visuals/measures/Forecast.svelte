<script lang="ts">
  import { untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import { total, average, fmt, pct, forecastMetrics, pinball } from '../../../engine/visual-math';
  let { number, givens, focusStep }: { number: number; givens?: Givens; focusStep?: string } =
    $props();
  const arr = (key: string, a: number[]) =>
    Array.isArray(givens?.[key]) ? (givens[key] as number[]) : a;
  let delta = $state(0),
    tab = $state(
      untrack(() =>
        number === 22
          ? focusStep === 'WAPE'
            ? 1
            : focusStep === 'MASE' || focusStep === 'naiveScale'
              ? 2
              : 0
          : focusStep?.toLowerCase().includes('width')
            ? 1
            : 0,
      ),
    ),
    mode = $state(0),
    small = $state(false),
    scale = $state(
      untrack(() => {
        const h = arr('history', [80, 100, 120, 140]);
        return average(h.slice(1).map((v, i) => Math.abs(v - h[i]))) ?? 0;
      }),
    ),
    width = $state(
      untrack(() => (focusStep?.startsWith('wide') ? Number(givens?.widen ?? 10) : 0)),
    ),
    tau = $state(untrack(() => Number(givens?.tau ?? 0.95))),
    actualNeed = $state(
      untrack(() => Number((givens?.actual as number[] | undefined)?.[0] ?? 150)),
    );
  let actual = $derived(
    arr('actual', [100, 120, 80, 150]).map((v, i) => (number === 22 && small && i === 0 ? 0 : v)),
  );
  let original = $derived(arr('predicted', [90, 130, 100, 140]));
  let predictions = $derived(
    original.map((p, i) =>
      number === 23
        ? mode === 1
          ? average(actual)!
          : mode === 2
            ? 30
            : p
        : p + (i === 2 ? delta : 0),
    ),
  );
  let metrics = $derived(forecastMetrics(actual, predictions, scale));
  let intervalActual = $derived(
    arr(
      'actual',
      Array.from({ length: 50 }, (_, i) => 100 + (i % 5) * 4 + (i < 37 ? 0 : 25)),
    ),
  );
  let lower = $derived(
    arr(
      'lower',
      Array.from({ length: 50 }, (_, i) => 90 + (i % 5) * 4),
    ).map((v) => v - width),
  );
  let upper = $derived(
    arr(
      'upper',
      Array.from({ length: 50 }, (_, i) => 110 + (i % 5) * 4),
    ).map((v) => v + width),
  );
  let coverage = $derived(
    intervalActual.filter((a, i) => a >= lower[i] && a <= upper[i]).length / intervalActual.length,
  );
  let plotMax = $derived(Math.max(...actual, ...predictions, 160) + 20);
  let quantileForecast = $derived(Number(givens?.forecast ?? 130));
  const x = (i: number) => 70 + i * 100;
  const y = (value: number, max: number) => 220 - (value / max) * 180;
</script>

{#if number <= 23}
  {#if number === 22}<div class="visual-tabs">
      {#each ['MAPE', 'WAPE', 'MASE'] as label, i}<button
          aria-pressed={tab === i}
          onclick={() => (tab = i)}>{label}</button
        >{/each}
    </div>
    <label class="vm-check"
      ><input type="checkbox" bind:checked={small} /> Set day 1 actual to zero</label
    >{#if tab === 2}<label class="vm-control"
        >Separate training naive-error scale <input
          type="range"
          min="0"
          max="40"
          step="1"
          bind:value={scale}
        /><output>{scale} thousand dollars</output></label
      >{/if}
  {:else if number === 23}<label class="vm-control"
      >Forecast choice <select bind:value={mode}
        ><option value={0}>Model forecasts</option><option value={1}>Evaluation-sample mean</option
        ><option value={2}>Worse-than-mean forecasts</option></select
      ></label
    >
  {:else}<label class="vm-control"
      >Change day 3 forecast <input
        type="range"
        min="-80"
        max="80"
        step="5"
        bind:value={delta}
      /><output>{predictions[2]} thousand dollars</output></label
    >{/if}
  {#if number === 21}<div class="vm-card-grid">
      {#each metrics.error as e, i}<div class="vm-node">
          <strong>Day {i + 1}</strong><span>Error {fmt(e, 1)} ($ thousands)</span><svg
            viewBox="0 0 100 100"
            role="img"
            aria-label={`Squared error ${e * e}`}
            ><rect
              x="4"
              y="4"
              width={Math.min(90, Math.abs(e))}
              height={Math.min(90, Math.abs(e))}
              class="vm-area"
            /></svg
          ><span>{fmt(e * e, 0)} squared units</span>
        </div>{/each}
    </div>
    <p class="vm-equation">
      √({fmt(total(metrics.error.map((e) => e * e)), 0)} / {actual.length}) = {fmt(metrics.rmse, 2)} thousand
      dollars
    </p>
    <p>
      Square side represents absolute error (same scale on every card); area represents squared
      error. MAE = {fmt(metrics.mae, 2)}.
    </p>
  {:else if number === 23}<div class="vm-tray">
      <div class="vm-node">Model squared error<strong>{fmt(metrics.sse, 1)}</strong></div>
      <span>÷</span>
      <div class="vm-node">Mean-reference squared error<strong>{fmt(metrics.sst, 1)}</strong></div>
      <span>→</span>
      <div class="vm-node">1 − ratio<strong>R² = {fmt(metrics.r2, 4)}</strong></div>
    </div>
    <svg
      class="vm-plot"
      viewBox="0 0 500 270"
      role="img"
      aria-label="Forecast residuals compared with sample mean residuals"
      ><path d="M40 20V220H460" class="vm-axis" /><line
        x1="40"
        x2="460"
        y1={y(average(actual)!, plotMax)}
        y2={y(average(actual)!, plotMax)}
        class="vm-dash"
      />{#each actual as a, i}<line
          x1={x(i)}
          x2={x(i)}
          y1={y(a, plotMax)}
          y2={y(predictions[i], plotMax)}
          class="vm-gap"
        /><circle cx={x(i)} cy={y(a, plotMax)} r="6" class="vm-dot" /><rect
          x={x(i) - 4}
          y={y(predictions[i], plotMax) - 4}
          width="8"
          height="8"
          class="vm-square"
        /><text x={x(i) - 18} y="249">Day {i + 1}</text>{/each}</svg
    >
    <p>
      Circle: actual. Square: forecast. Dashed line: evaluation mean {fmt(average(actual), 1)}.
      Error units are $ thousands; squared errors use squared units.
    </p>
  {:else}<svg
      class="vm-plot"
      viewBox="0 0 500 270"
      role="img"
      aria-label="Actual outflow and forecast connected by error gaps"
      ><path d="M40 20V220H460" class="vm-axis" />{#each actual as a, i}<line
          x1={x(i)}
          x2={x(i)}
          y1={y(a, plotMax)}
          y2={y(predictions[i], plotMax)}
          class="vm-gap"
        /><circle cx={x(i)} cy={y(a, plotMax)} r="6" class="vm-dot" /><rect
          x={x(i) - 4}
          y={y(predictions[i], plotMax) - 4}
          width="8"
          height="8"
          class="vm-square"
        /><text x={x(i) + 8} y={y((a + predictions[i]) / 2, plotMax)}
          >{fmt(metrics.error[i], 1)}</text
        ><text x={x(i) - 18} y="250">Day {i + 1}</text>{/each}<text x="45" y="18"
        >Outflow ($ thousands)</text
      ></svg
    >
    <p>
      Circle: actual. Square: forecast. Signed error = actual − forecast; positive means
      underforecasting.
    </p>
  {/if}
  <div class="vm-table-wrap">
    <table>
      <thead
        ><tr
          ><th>Day</th><th>Actual</th><th>Forecast</th><th>Signed error</th><th>Absolute error</th
          ></tr
        ></thead
      ><tbody
        >{#each actual as a, i}<tr
            ><th>{i + 1}</th><td>{a}</td><td>{predictions[i]}</td><td>{metrics.error[i]}</td><td
              >{metrics.abs[i]}</td
            ></tr
          >{/each}</tbody
      >
    </table>
  </div>
  {#if number === 20}<p class="vm-equation">
      MAE = {metrics.abs.join(' + ')} divided by {actual.length} = {fmt(metrics.mae, 2)} thousand dollars
    </p>
    {#if givens?.baseline}<p>
        Baseline MAE = {fmt(forecastMetrics(actual, arr('baseline', [])).mae, 2)} thousand dollars. Model
        error reduction = {pct(
          1 - (metrics.mae ?? 0) / (forecastMetrics(actual, arr('baseline', [])).mae ?? 1),
        )}.
      </p>{/if}
  {:else if number === 22}<div class="vm-node">
      <span
        >{[
          'Each absolute error ÷ its own actual value',
          'Total absolute error ÷ total absolute actual volume',
          'Test MAE ÷ training-period naive-error scale',
        ][tab]}</span
      ><strong
        >{['MAPE', 'WAPE', 'MASE'][tab]} = {tab === 2
          ? fmt(metrics.mase)
          : pct(tab === 0 ? metrics.mape : metrics.wape)}</strong
      >
    </div>
    <p>
      {tab === 0 && small
        ? 'MAPE is undefined because one actual value is zero.'
        : tab === 2
          ? `Training history [${arr('history', [80, 100, 120, 140]).join(', ')}] supplies the initial naive scale; the control supplies an alternative training scale. No evaluated outcomes are used to fit that scale.`
          : `Use $ thousands consistently in numerator and denominator.`}
    </p>{/if}
{:else if number === 24}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Coverage</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Width</button
    >
  </div>
  <label class="vm-control"
    >Extend each end of every interval <input
      type="range"
      min="0"
      max="30"
      step="1"
      bind:value={width}
    /><output>{width} $ million</output></label
  >
  <p class="visual-caption">
    {givens
      ? 'This exercise’s dated intervals.'
      : 'Constructed 50-day example reproducing the lesson’s 37/50 initial coverage. Starting intervals are 20 million dollars wide.'}
    Nominal coverage: 90%. Boundary observations count as covered.
  </p>
  <svg
    class="vm-plot"
    viewBox="0 0 500 280"
    role="img"
    aria-label="Daily intervals and actual outflows"
    ><path d="M35 20V230H470" class="vm-axis" />{#each intervalActual as a, i}{@const px =
        45 + (i * 410) / Math.max(1, intervalActual.length - 1)}<line
        x1={px}
        x2={px}
        y1={230 - upper[i]}
        y2={230 - lower[i]}
        class="vm-interval"
      /><circle
        cx={px}
        cy={230 - a}
        r={intervalActual.length > 10 ? 2.5 : 5}
        class={a >= lower[i] && a <= upper[i] ? 'vm-dot' : 'vm-miss'}
      />{/each}<text x="60" y="20">Outflow ($ million); × / outlined points miss</text><text
      x="140"
      y="265">Days 1–{intervalActual.length}</text
    ></svg
  >
  <div class="visual-readouts">
    <div><span>Nominal coverage</span><strong>90%</strong></div>
    <div class:vm-highlight={tab === 0}>
      <span>Observed coverage</span><strong>{pct(coverage)}</strong>
    </div>
    <div class:vm-highlight={tab === 1}>
      <span>Average interval width</span><strong
        >{fmt(average(upper.map((hi, i) => hi - lower[i])), 1)} $m</strong
      >
    </div>
  </div>
  <p>
    Actuals and interval centers stay fixed. Broadening intervals changes both coverage and
    usefulness.
  </p>
  <details>
    <summary>Read every interval as a table</summary>
    <div class="vm-table-wrap">
      <table>
        <thead
          ><tr><th>Day</th><th>Lower</th><th>Actual</th><th>Upper</th><th>Covered</th></tr></thead
        ><tbody
          >{#each intervalActual as a, i}<tr
              ><td>{i + 1}</td><td>{lower[i]}</td><td>{a}</td><td>{upper[i]}</td><td
                >{a >= lower[i] && a <= upper[i] ? 'Yes' : 'No'}</td
              ></tr
            >{/each}</tbody
        >
      </table>
    </div>
  </details>
{:else}
  {#if givens?.actual}<div class="visual-tabs">
      {#each givens.actual as number[] as value}<button
          aria-pressed={actualNeed === value}
          onclick={() => (actualNeed = value)}>Actual ${value}m</button
        >{/each}
    </div>{/if}
  <label class="vm-control"
    >Quantile <select bind:value={tau}
      ><option value={0.5}>0.50</option><option value={0.8}>0.80</option><option value={0.9}
        >0.90</option
      ><option value={0.95}>0.95</option></select
    ></label
  ><label class="vm-control"
    >Actual liquidity requirement ($m) <input
      type="range"
      min={quantileForecast - 50}
      max={quantileForecast + 50}
      bind:value={actualNeed}
    /><output>{actualNeed}</output></label
  >
  <svg
    class="vm-plot"
    viewBox="0 0 500 270"
    role="img"
    aria-label={`Asymmetric V: pinball loss around a ${quantileForecast} million dollar forecast`}
    ><path d="M40 25V225H460" class="vm-axis" /><polyline
      points={Array.from(
        { length: 101 },
        (_, i) =>
          `${40 + i * 4.2},${225 - pinball(quantileForecast - 50 + i, quantileForecast, tau) * 3.6}`,
      ).join(' ')}
      class="vm-line"
    /><line x1="250" x2="250" y1="25" y2="225" class="vm-dash" /><circle
      cx={40 + (actualNeed - (quantileForecast - 50)) * 4.2}
      cy={225 - pinball(actualNeed, quantileForecast, tau) * 3.6}
      r="7"
      class="vm-dot"
    /><text x="65" y="20">Weighted error ($ million)</text><text x="45" y="255"
      >{quantileForecast - 50}</text
    ><text x="210" y="255">Forecast {quantileForecast}</text><text x="435" y="255"
      >{quantileForecast + 50}</text
    ></svg
  >
  <p class="vm-equation">
    Loss = {fmt(actualNeed >= quantileForecast ? tau : 1 - tau, 2)} × |{actualNeed} − {quantileForecast}|
    = {fmt(pinball(actualNeed, quantileForecast, tau), 2)}
  </p>
  {#if givens?.actual}<div class="vm-table-wrap">
      <table>
        <thead><tr><th>Actual ($m)</th><th>Actual − forecast</th><th>Pinball loss</th></tr></thead
        ><tbody
          >{#each givens.actual as number[] as value}<tr
              ><td>{value}</td><td>{value - quantileForecast}</td><td
                >{fmt(pinball(value, quantileForecast, tau), 3)}</td
              ></tr
            >{/each}</tbody
        >
      </table>
    </div>
    <p>
      Mean loss = {fmt(
        average((givens.actual as number[]).map((value) => pinball(value, quantileForecast, tau))),
        3,
      )} weighted $ million.
    </p>{/if}
  <p>
    For equal error sizes, underforecasting receives {fmt(tau / (1 - tau), 0)} times the weight of overforecasting.
    This is a scoring rule, not the realized borrowing cost.
  </p>
{/if}
