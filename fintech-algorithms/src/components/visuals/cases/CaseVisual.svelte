<script lang="ts">
  import VisualFrame from '../VisualFrame.svelte';
  import type { FinancialCase } from '../../../data/financial-cases/types';
  let { scenario }: { scenario: FinancialCase } = $props();
  let selected = $state(0);
  let prediction = $state('');
  let revealed = $state(false);
  const current = $derived(scenario.frames[selected]);
  const metric = $derived(
    Number.isInteger(current.metric.value)
      ? current.metric.value.toLocaleString('en-US')
      : current.metric.value.toLocaleString('en-US', { maximumFractionDigits: 2 }),
  );
  function reset() {
    selected = 0;
    prediction = '';
    revealed = false;
  }
  function choose(i: number) {
    selected = i;
    revealed = false;
  }
  $effect(() => {
    void scenario.visualId;
    reset();
  });
  function lines(text: string, x = 0, maxWidth?: number) {
    const available = maxWidth ?? Math.max(70, 590 - x);
    const length = Math.max(9, Math.floor(available / 6.8));
    const result: string[] = [];
    for (const word of text.split(' ')) {
      if (!result.length || `${result[result.length - 1]} ${word}`.length > length)
        result.push(word);
      else result[result.length - 1] += ` ${word}`;
    }
    return result;
  }
</script>

<VisualFrame
  title={scenario.title}
  question={scenario.question}
  takeaway={scenario.takeaway}
>
  <fieldset class="case-controls">
    <legend>{scenario.controlLabel}</legend>
    <div class="case-options">
      {#each scenario.frames as option, i}
        <button
          type="button"
          class:chosen={selected === i}
          aria-pressed={selected === i}
          onclick={() => choose(i)}>{option.label}</button
        >
      {/each}
      <button type="button" class="case-reset" onclick={reset}>Reset example</button>
    </div>
  </fieldset>
  <p class="case-caption">{current.caption}</p>
  <p class="case-scroll-hint">
    Scroll the diagram sideways to see every stage. The data and explanation follow below.
  </p>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (The locally overflowing diagram must be keyboard scrollable.) -->
  <div
    class="case-scroll"
    tabindex="0"
    role="region"
    aria-label="Case diagram. On a narrow screen, scroll horizontally; the data table below contains the same figures."
  >
    <svg
      class="case-scene"
      viewBox="0 0 600 370"
      role="img"
      aria-label={`${scenario.title}: ${current.label}. ${current.result}`}
    >
      <title>{scenario.title} — {current.label}</title>
      <desc
        >{current.caption}
        {current.result}
        {current.marks
          .filter((mark) => mark.description)
          .map((mark) => mark.description)
          .join('. ')} Diagram labels: {current.marks
          .filter((mark) => mark.kind === 'text')
          .map((mark) => mark.text)
          .join('; ')}.</desc
      >
      <defs
        ><marker
          id={`arrow-${scenario.visualId}`}
          markerWidth="9"
          markerHeight="9"
          refX="18"
          refY="4.5"
          orient="auto"
          markerUnits="userSpaceOnUse"><path d="M1,1 L7,4.5 L1,8" class="tone-ink" /></marker
        ></defs
      >
      {#each current.marks as mark}
        {#if mark.kind === 'text'}
          <text x={mark.x} y={mark.y} class={`tone-${mark.tone ?? 'ink'}`} class:small={mark.small}>
            {#each lines(mark.text ?? '', mark.x, mark.maxWidth) as part, j}<tspan
                x={mark.x}
                dy={j ? 15 : 0}>{part}</tspan
              >{/each}
          </text>
        {:else if mark.kind === 'rect'}
          <rect
            x={mark.x}
            y={mark.y}
            width={mark.width}
            height={mark.height}
            rx="4"
            class={`tone-${mark.tone ?? 'blue'}`}
          />
        {:else if mark.kind === 'circle'}
          <circle cx={mark.x} cy={mark.y} r={mark.r} class={`tone-${mark.tone ?? 'blue'}`} />
        {:else if mark.kind === 'line'}
          <line
            x1={mark.x}
            y1={mark.y}
            x2={mark.x2}
            y2={mark.y2}
            class={`tone-${mark.tone ?? 'muted'}`}
            class:dashed={mark.dashed}
            marker-end={mark.arrow ? `url(#arrow-${scenario.visualId})` : undefined}
          />
        {:else if mark.kind === 'path'}
          <path d={mark.d} class={`tone-${mark.tone ?? 'blue'}`} class:dashed={mark.dashed} />
        {/if}
      {/each}
    </svg>
  </div>
  <div class="case-result" aria-live="polite" aria-atomic="true">
    <strong>{current.metric.label}: {metric} {current.metric.unit}</strong>
    <span>{current.metric.denominator}</span>
    <p>{current.result}</p>
  </div>
  <details class="case-data" open>
    <summary>Read the diagram as data</summary>
    <table>
      <caption>{current.label}: quantities and assumptions</caption><thead
        ><tr><th scope="col">Item</th><th scope="col">Value</th></tr></thead
      ><tbody>
        {#each current.rows as row}<tr><th scope="row">{row.label}</th><td>{row.value}</td></tr
          >{/each}
      </tbody>
    </table>
  </details>
  <div class="case-predict">
    <label for={`prediction-${scenario.visualId}`}>{scenario.prediction}</label>
    <select id={`prediction-${scenario.visualId}`} bind:value={prediction}>
      <option value="">Choose your prediction</option><option value="increase">Increase</option
      ><option value="decrease">Decrease</option><option value="same">Stay the same</option>
    </select>
    <button
      type="button"
      onclick={() => {
        selected = 2;
        revealed = true;
      }}>Compare first and last states</button
    >
    {#if revealed}
      {@const first = scenario.frames[0].metric.value}
      {@const last = scenario.frames[2].metric.value}
      {@const direction = last > first ? 'increase' : last < first ? 'decrease' : 'same'}
      <p role="status">
        {prediction
          ? prediction === direction
            ? 'Your prediction matches the example. '
            : 'Compare the change with your prediction. '
          : ''}{scenario.frames[0].metric.label} changes from {first.toLocaleString('en-US', {
          maximumFractionDigits: 2,
        })} to {last.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        {current.metric.unit}. {scenario.frames[2].result}
      </p>
    {/if}
  </div>
</VisualFrame>

<style>
  .case-controls {
    border: 0;
    padding: 0;
    margin: 0 0 0.8rem;
    min-width: 0;
  }
  legend {
    font-weight: 700;
    margin-bottom: 0.45rem;
  }
  .case-options {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }
  button,
  select {
    color: var(--sl-color-text, var(--ink, #182a36));
    background: var(--sl-color-bg);
    border: 1px solid var(--sl-color-gray-4);
    border-radius: 0.5rem;
    padding: 0.55rem 0.7rem;
    font: inherit;
    min-height: 44px;
    max-width: 100%;
  }
  button {
    cursor: pointer;
  }
  button.chosen {
    background: var(--sl-color-accent-low);
    border-color: var(--sl-color-accent);
    font-weight: 700;
  }
  button:focus-visible,
  select:focus-visible,
  .case-scroll:focus-visible {
    outline: 3px solid var(--sl-color-accent);
    outline-offset: 3px;
  }
  .case-reset {
    margin-inline-start: auto;
  }
  .case-caption {
    font-size: 0.95rem;
  }
  .case-scroll-hint {
    display: none;
    font-size: 0.85rem;
  }
  .case-scroll {
    max-width: 100%;
    overflow-x: auto;
    border: 1px solid var(--sl-color-gray-5);
    border-radius: 0.65rem;
    background: var(--sl-color-bg);
  }
  .case-scene {
    display: block;
    width: 100%;
    min-width: 560px;
    height: auto;
  }
  svg text {
    font:
      16px system-ui,
      sans-serif;
    fill: var(--sl-color-text, var(--ink, #182a36));
  }
  svg text.small {
    font-size: 13px;
  }
  svg rect,
  svg circle {
    fill-opacity: 0.2;
    stroke: currentColor;
    stroke-width: 1.5;
  }
  svg line,
  svg path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
  }
  svg .tone-ink {
    color: var(--sl-color-text, var(--ink, #182a36));
    fill: var(--sl-color-text, var(--ink, #182a36));
  }
  svg .tone-muted {
    color: var(--sl-color-gray-3);
    fill: var(--sl-color-gray-3);
  }
  svg .tone-blue {
    color: #397fd0;
    fill: #397fd0;
  }
  svg .tone-green {
    color: #25876f;
    fill: #25876f;
  }
  svg .tone-amber {
    color: #a86b12;
    fill: #a86b12;
  }
  svg .tone-red {
    color: #cf5261;
    fill: #cf5261;
  }
  svg .tone-paper {
    color: var(--sl-color-text, var(--ink, #182a36));
    fill: transparent;
  }
  svg text.tone-blue,
  svg text.tone-green,
  svg text.tone-amber,
  svg text.tone-red,
  svg text.tone-muted {
    fill: var(--sl-color-text, var(--ink, #182a36));
  }
  svg path {
    fill: none !important;
  }
  .dashed {
    stroke-dasharray: 6 4;
  }
  .case-result {
    display: grid;
    gap: 0.25rem;
    padding: 0.9rem 0;
  }
  .case-result span {
    font-size: 0.88rem;
    color: var(--sl-color-gray-2);
  }
  .case-result p {
    margin: 0.2rem 0;
  }
  .case-data {
    margin-block: 0.5rem 1rem;
  }
  .case-data table {
    width: 100%;
    font-size: 0.92rem;
  }
  .case-data caption {
    text-align: start;
    margin: 0.75rem 0;
  }
  .case-data td,
  .case-data th {
    overflow-wrap: anywhere;
  }
  .case-predict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    border-top: 1px solid var(--sl-color-gray-5);
    padding-top: 1rem;
  }
  .case-predict label,
  .case-predict p {
    flex-basis: 100%;
  }
  @media (max-width: 480px) {
    .case-scroll-hint {
      display: block;
    }
    .case-reset {
      margin-inline-start: 0;
    }
  }
  @media print {
    .case-controls,
    .case-scroll-hint,
    .case-predict {
      display: none !important;
    }
    .case-scroll {
      overflow: visible;
      border: 0;
    }
    .case-scene {
      min-width: 0;
      max-width: 100%;
    }
    .case-data {
      display: block !important;
    }
    .case-data::details-content {
      display: block !important;
      content-visibility: visible !important;
    }
    .case-data summary {
      display: none;
    }
    .case-data table {
      display: table !important;
    }
    .case-result,
    .case-data {
      break-inside: avoid;
    }
  }
</style>
