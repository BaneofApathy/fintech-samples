<script lang="ts">
  import VisualFrame from './VisualFrame.svelte';
  import type { Givens } from '../../engine/types';
  import { solve } from '../../engine/solve/core';
  import { supplementVisuals } from '../../data/supplement-visuals';
  let { id, givens, focusStep }: { id: string; givens?: Givens; focusStep?: string } = $props();
  const spec = $derived(supplementVisuals.find((v) => v.id === id)!);
  const base: Givens = $derived(givens ?? (spec.givens as Givens));
  let changed = $state(false),
    selected = $state(0),
    close = $state<number | undefined>(undefined),
    tail = $state<number | undefined>(undefined),
    feedback = $state(false);
  const g: Givens = $derived.by(() => {
    const v: Givens = structuredClone($state.snapshot(base));
    if (id === 'S01' && changed) v.intact = Math.max(0, Number(v.intact) - 1);
    if (id === 'S02' && changed) {
      const c = [...(v.correct as number[])];
      c[selected] = Math.max(0, c[selected] - 1);
      v.correct = c;
    }
    if (id === 'S03' && close !== undefined) v.close = close;
    if (id === 'S04' && tail !== undefined) v.tail = tail;
    return v;
  });
  const results = $derived(solve(id, g));
  const num = (key: string) => Number(g[key]);
  const arr = (key: string) => g[key] as number[];
  const f = (v: unknown) =>
    typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 3 }) : String(v);
  function reset() {
    changed = false;
    selected = 0;
    close = undefined;
    tail = undefined;
    feedback = false;
  }
</script>

<div data-supplement-visual={id}>
  <VisualFrame
    title={spec.title}
    question={spec.question}
    takeaway={spec.takeaway}
    source={`${id} · ${givens ? 'current exercise inputs' : 'example inputs'}${focusStep ? ` · calculation: ${focusStep}` : ''}`}
  >
    {#if id === 'S01'}
      <div class="visual-controls">
        <label
          ><input type="checkbox" bind:checked={changed} /> Drop the unit and year from one previously
          intact table</label
        >
      </div>
      <div class="visual-flow">
        <div class="visual-node">
          <strong>Original source table</strong>
          <table>
            <caption>Revenue · $ millions</caption><thead><tr><th>2023</th><th>2024</th></tr></thead
            ><tbody><tr><td>80</td><td>100</td></tr></tbody>
          </table>
        </div>
        <div class="visual-node" class:warning={changed}>
          <strong>Extracted evidence</strong>
          <table>
            <caption>{changed ? 'Unit missing' : 'Revenue · $ millions'}</caption><thead
              ><tr
                ><th>{changed ? 'Column A' : '2023'}</th><th>{changed ? 'Column B' : '2024'}</th
                ></tr
              ></thead
            ><tbody><tr><td>80</td><td>100</td></tr></tbody>
          </table>
        </div>
      </div>
      <p class="visual-caption">
        This illustrative table explains the failure type; the audit totals below come from {id}. {changed
          ? 'One additional table failed integrity. The numeric-cell audit stays fixed.'
          : 'The audit already contains other failures.'}
      </p>
      <div class="visual-readouts">
        <div><span>Intact tables</span><strong>{f(g.intact)} / {f(g.tables)}</strong></div>
        <div>
          <span>Required sections present</span><strong>{f(g.present)} / {f(g.sections)}</strong>
        </div>
        <div>
          <span>Wrong numeric cells or units</span><strong>{f(g.wrong)} / {f(g.cells)}</strong>
        </div>
      </div>
    {:else if id === 'S02'}
      <div class="visual-controls">
        <label
          >Question<select bind:value={selected}
            >{#each arr('required') as _, i}<option value={i}>Question {i + 1}</option
              >{/each}</select
          ></label
        ><label
          ><input type="checkbox" bind:checked={changed} /> Remove one correct supplied component</label
        >
      </div>
      <div class="components">
        {#each arr('required') as count, i}<div class="question-row" class:active={selected === i}>
            <strong>Q{i + 1}</strong>
            <div>
              {#each Array.from({ length: count }) as _, j}<span
                  class:present={j < arr('correct')[i]}
                  >{j < arr('correct')[i] ? '✓ supplied' : '— missing'}</span
                >{/each}
            </div>
            <small>{arr('correct')[i] === count ? 'Complete answer' : 'Incomplete answer'}</small>
          </div>{/each}
      </div>
      <div class="visual-readouts">
        <div>
          <span>Whole questions answered completely</span><strong
            >{f(results.complete)} / {arr('required').length}</strong
          >
        </div>
        <div>
          <span>Correct components / all required components</span><strong
            >{f(results.correct)} / {f(results.required)}</strong
          >
        </div>
      </div>
    {:else if id === 'S03'}
      <div class="visual-controls">
        <label
          >Closing price ($ per share)<input
            type="number"
            min="0"
            step="0.1"
            value={close ?? num('close')}
            oninput={(e) => {
              const v = e.currentTarget.valueAsNumber;
              if (Number.isFinite(v) && v >= 0) close = v;
            }}
          /></label
        >
      </div>
      <div class="execution-strip" aria-label="Target order, fills, and unfilled shares">
        {#each arr('shares') as shares, i}<div style:flex={shares}>
            <strong>{shares} filled</strong><span>@ ${f(arr('prices')[i])}</span>
          </div>{/each}
        <div
          class="unfilled"
          style:flex={Math.max(0, num('target') - arr('shares').reduce((a, b) => a + b, 0))}
        >
          <strong>{num('target') - arr('shares').reduce((a, b) => a + b, 0)} unfilled</strong><span
            >Marked at ${f(g.close)}</span
          >
        </div>
      </div>
      <p class="visual-caption">
        Arrival benchmark: ${f(g.arrival)} per share. Target: {f(g.target)} shares. Fees: ${f(
          g.fees,
        )}.
      </p>
      <p class="visual-caption">
        Filled shares show what was bought. The remaining shares are valued against the closing price to estimate missed opportunity; that amount is a comparison, not a cash fee. Change the closing price above to see this estimate change while the fills and arrival price stay fixed.
      </p>
      <div class="visual-readouts">
        {#each [['slippage', 'Paid slippage'], ['opportunity', 'Unfilled opportunity cost'], ['total', 'Total shortfall'], ['bps', 'Shortfall in basis points']] as [key, label]}<div
          >
            <span>{label}</span><strong
              >{key === 'bps' ? '' : '$'}{f(results[key])}{key === 'bps' ? ' bps' : ''}</strong
            >
          </div>{/each}
      </div>
    {:else}
      <div class="visual-controls">
        <label
          >Worst-tail share<select
            value={tail ?? num('tail')}
            onchange={(e) => (tail = Number(e.currentTarget.value))}
            ><option value={0.1}>Worst 10%</option><option value={0.2}>Worst 20%</option><option
              value={0.3}>Worst 30%</option
            ></select
          ></label
        >
      </div>
      {@const sorted = [...arr('costs')].sort((a, b) => a - b)}
      {@const limit = sorted.length - Math.ceil(sorted.length * num('tail'))}
      <figure>
        <div class="cost-columns">
          {#each sorted as cost, i}<div>
              <span>{cost}</span><i
                class:tail={i >= limit}
                style:height={`${Math.max(2, (cost / Math.max(...sorted)) * 120)}px`}
              ></i><small>{i >= limit ? 'Tail' : 'Order'}</small>
            </div>{/each}
        </div>
        <figcaption>
          Same {sorted.length} order costs, sorted for inspection · basis points. Patterned bars are the
          worst {Math.ceil(sorted.length * num('tail'))} orders.
        </figcaption>
      </figure>
      <p class="visual-caption">
        Changing the tail share changes how many of the highest-cost orders are averaged. It does not change any order’s cost. The sample has only ten orders, so the tail average demonstrates the calculation rather than predicting rare future costs.
      </p>
      <div class="visual-readouts">
        <div><span>Average policy cost</span><strong>{f(results.mean)} bps</strong></div>
        <div><span>Baseline cost per order</span><strong>{f(g.baseline)} bps</strong></div>
        <div><span>Worst-tail average</span><strong>{f(results.tailMean)} bps</strong></div>
      </div>
    {/if}
    <div class="visual-navigation">
      <button onclick={reset}>Reset visual</button><button onclick={() => (feedback = !feedback)}
        >{feedback ? 'Hide explanation' : 'Explain the change'}</button
      >
    </div>
    {#if feedback}<p class="visual-feedback" aria-live="polite">{spec.takeaway}</p>{/if}
    <details>
      <summary>Current calculation values</summary>
      <table>
        <thead><tr><th>Quantity</th><th>Value</th></tr></thead><tbody
          >{#each Object.entries(results) as [key, value]}<tr class:focused={focusStep === key}
              ><th scope="row">{key}</th><td
                >{Array.isArray(value) ? value.map(f).join(', ') : f(value)}</td
              ></tr
            >{/each}</tbody
        >
      </table>
    </details>
  </VisualFrame>
</div>

<style>
  .question-row {
    display: grid;
    grid-template-columns: 35px 1fr;
    gap: 0.5rem;
    border: 1px solid var(--line);
    padding: 0.65rem;
    border-radius: 6px;
    margin: 0.5rem 0;
  }
  .question-row.active {
    border-color: var(--green);
  }
  .question-row > div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .question-row span {
    padding: 0.3rem 0.5rem;
    background: var(--warning-bg);
    font-size: 0.8rem;
    border: 1px dashed var(--warning);
    border-radius: 4px;
  }
  .question-row .present {
    background: var(--green-soft);
    border: 1px solid var(--green);
  }
  .question-row small {
    grid-column: 2;
    color: var(--muted);
  }
  .execution-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .execution-strip > div {
    background: var(--green-soft);
    padding: 1rem;
    min-width: 100px;
    border: 1px solid var(--green);
    border-radius: 6px;
  }
  .execution-strip span {
    display: block;
    font-size: 0.8rem;
  }
  .execution-strip .unfilled {
    border: 2px dashed var(--warning);
    background: var(--warning-bg);
  }
  .cost-columns {
    display: flex;
    gap: 0.4rem;
    align-items: flex-end;
    padding-top: 1rem;
  }
  .cost-columns > div {
    flex: 1;
    min-width: 0;
    text-align: center;
    font-size: 0.78rem;
  }
  .cost-columns i {
    display: block;
    background: var(--blue);
    margin: 0.3rem 0;
  }
  .cost-columns i.tail {
    background: repeating-linear-gradient(
      45deg,
      var(--warning),
      var(--warning) 4px,
      var(--warning-bg) 4px,
      var(--warning-bg) 7px
    );
  }
  .cost-columns small {
    font-size: 0.65rem;
  }
  .focused {
    background: var(--green-soft);
  }
</style>
