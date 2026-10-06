<script lang="ts">
  import type { MetricValue } from '../python/lab-presentation';
  let { rows }: { rows: { label: string; baseline?: MetricValue; current?: MetricValue }[] } =
    $props();
  const display = (n: number) => n.toLocaleString('en-US', { maximumSignificantDigits: 4 });
  const bounds = (a: number, b: number) => ({
    min: Math.min(0, a, b),
    max: Math.max(0, a, b) || 1,
  });
  const x = (v: number, a: number, b: number) => {
    const d = bounds(a, b);
    return 35 + ((v - d.min) / (d.max - d.min)) * 430;
  };
</script>

<figure
  class="lab-comparison-visual"
  aria-label="Original and current run on the same metric scales"
>
  <figcaption>
    <strong>See the change</strong> Each pair uses its own labeled scale. Hollow circle: original baseline.
    Filled diamond: latest successful run.
  </figcaption>
  {#each rows.slice(0, 3) as row}
    {#if row.baseline && row.current && Number.isFinite(row.baseline.value) && Number.isFinite(row.current.value)}
      {@const a = row.baseline.value}{@const b = row.current.value}
      <div class="metric-pair">
        <strong>{row.label}</strong><svg
          viewBox="0 0 500 64"
          role="img"
          aria-label={`${row.label}: baseline ${display(a)}, current ${display(b)}, change ${display(b - a)}`}
          ><line x1="35" y1="24" x2="465" y2="24" stroke="var(--line)" stroke-width="3" /><line
            x1={x(a, a, b)}
            y1="24"
            x2={x(b, a, b)}
            y2="24"
            stroke="var(--blue)"
            stroke-width="4"
          /><circle
            cx={x(a, a, b)}
            cy="24"
            r="7"
            stroke="var(--green)"
            fill="var(--paper)"
            stroke-width="3"
          /><path d={`M ${x(b, a, b)} 14 l 10 10 -10 10 -10 -10 Z`} fill="var(--blue)" /><text
            x="35"
            y="57">{display(bounds(a, b).min)}</text
          ><text x="465" y="57" text-anchor="end">{display(bounds(a, b).max)}</text></svg
        >
        <p>
          Original {display(a)} → latest {display(b)} · change {b - a >= 0 ? '+' : ''}{display(
            b - a,
          )}
        </p>
      </div>
    {/if}
  {/each}
  <p class="small muted">
    These are actual captured outputs. Interpret changes only when the evaluation data, split,
    units, and horizon remain comparable. No combined “model quality” score is calculated.
  </p>
</figure>

<style>
  .lab-comparison-visual {
    margin: 1rem 0;
    padding: 1rem;
    background: var(--canvas);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .lab-comparison-visual figcaption {
    font-size: 0.84rem;
    color: var(--muted);
  }
  .metric-pair {
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--line);
  }
  .metric-pair strong {
    font-size: 0.85rem;
  }
  .metric-pair svg {
    display: block;
    width: 100%;
    max-width: 650px;
    height: auto;
  }
  .metric-pair text {
    font: 16px system-ui;
    fill: var(--muted);
  }
  .metric-pair p {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0.2rem 0;
  }
  .lab-comparison-visual > p {
    margin: 0.75rem 0 0;
  }
</style>
