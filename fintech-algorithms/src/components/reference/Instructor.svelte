<script lang="ts">
  import { onMount } from 'svelte';
  import {
    read,
    empty,
    exportProgress,
    importProgress,
    analyticsCSV,
    type Progress,
  } from '../../engine/progress';
  import Timer from '../exercise/Timer.svelte';
  let {
    algorithms,
    exerciseLabels,
    base,
  }: {
    algorithms: { slug: string; title: string }[];
    exerciseLabels: Record<string, { title: string; steps: Record<string, string> }>;
    base: string;
  } = $props();
  let p = $state<Progress>(empty()),
    message = $state(''),
    selected = $state('logistic-regression');
  const count = (status: string) => p.attempts.filter((a) => a.status === status).length;
  const mistakeDescriptions: Record<string, string> = {
    'DTI-fraction': 'DTI entered as a fraction rather than percentage points',
    'percent-scale': 'Percentage and decimal scales differ',
    denominator: 'Check which observations belong in the denominator',
    zero: 'Zero entered when the expected result is nonzero',
    cells: 'One or more table cells need correction',
    recompute: 'Calculation or decision needs another attempt',
  };
  const mistakes = $derived.by(() => {
    const grouped = new Map<
      string,
      { id: string; step: string; pattern?: string; count: number }
    >();
    for (const attempt of p.attempts) {
      if (attempt.status !== 'incorrect') continue;
      const key = JSON.stringify([attempt.id, attempt.step, attempt.pattern ?? '']);
      const row = grouped.get(key);
      if (row) row.count += 1;
      else grouped.set(key, { ...attempt, count: 1 });
    }
    return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 15);
  });
  const pattern = [
    { minutes: 5, title: 'Problem', text: 'Present the decision, data, and cost of being wrong' },
    { minutes: 5, title: 'Intuition', text: 'One visual and one hand-worked example' },
    { minutes: 8, title: 'Demo', text: 'Run a prepared baseline and the target method' },
    {
      minutes: 12,
      title: 'Modify',
      text: 'Students change one assumption, parameter, or threshold',
    },
    {
      minutes: 5,
      title: 'Break it',
      text: 'Introduce leakage, imbalance, drift, or bad assumptions',
    },
    {
      minutes: 5,
      title: 'Defend',
      text: 'One student explains method choice, metric, and stop condition',
    },
  ];
  onMount(() => {
    p = read();
    const handler = () => (p = read());
    window.addEventListener('course-progress', handler);
    return () => window.removeEventListener('course-progress', handler);
  });
  async function importFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    try {
      const file = input.files?.[0];
      if (!file) return;
      importProgress(await file.text());
      message = 'Progress imported.';
    } catch (err) {
      message = String(err);
    }
    input.value = '';
  }
</script>

<div class="callout">
  <div class="callout-label">Progress tools</div>
  <p>
    Instructor mode hides solutions until you reveal them. Attempts shown here were made or imported
    on this device. Export a copy before importing; an import replaces the current progress.
  </p>
</div>
<div class="button-row">
  <button class="button secondary" onclick={exportProgress}>Export progress JSON</button><label
    class="button secondary"
    >Import progress JSON<input
      aria-label="Import progress JSON"
      type="file"
      accept="application/json,.json"
      onchange={importFile}
      style="width:1px;height:1px;opacity:0;position:absolute"
    /></label
  ><button class="button secondary" onclick={analyticsCSV}>Export attempts CSV</button><button
    class="button quiet"
    onclick={() => window.print()}>Print handout</button
  >
</div>
{#if message}<p role="status" class="small">{message}</p>{/if}
<h2>Present a unit</h2>
<div class="filter-row">
  <select aria-label="Unit to present" bind:value={selected}
    >{#each algorithms as a}<option value={a.slug}>{a.title}</option>{/each}</select
  ><a class="button" href={`${base}instructor/present/${selected}/`} target="_blank" rel="noopener"
    >Present slides</a
  ><a class="button secondary" href={`${base}algorithms/${selected}/?instructor=1`}
    >Open with solutions hidden</a
  >
</div>
<h2>Attempt analytics</h2>
<div class="analytics-grid">
  <div class="analytics-card"><strong>{count('correct')}</strong><span>Correct steps</span></div>
  <div class="analytics-card">
    <strong>{count('incorrect')}</strong><span>Incorrect attempts</span>
  </div>
  <div class="analytics-card"><strong>{count('shown')}</strong><span>Shown steps</span></div>
</div>
{#if !p.attempts.length}<p class="muted small">
    Complete an exercise to see the steps that needed another attempt.
  </p>{:else if !mistakes.length}<p class="muted small">
    No incorrect attempts have been recorded.
  </p>{:else}<h3>Steps to revisit</h3>
  <div class="table-scroll">
    <table>
      <thead><tr><th>Exercise</th><th>Step</th><th>Feedback</th><th>Attempts</th></tr></thead>
      <tbody>
        {#each mistakes as row}
          <tr>
            <td>
              {#if exerciseLabels[row.id]}
                <a href={`${base}exercises/${row.id}/`}>{exerciseLabels[row.id].title}</a>
              {:else}
                Exercise unavailable in this version
              {/if}
            </td>
            <td>{exerciseLabels[row.id]?.steps[row.step] ?? 'Step unavailable in this version'}</td>
            <td>
              {row.pattern
                ? (mistakeDescriptions[row.pattern] ?? 'Incorrect answer; review the worked steps')
                : 'Incorrect answer; no diagnostic recorded'}
            </td>
            <td>{row.count}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>{/if}
<h2>Unit progress</h2>
<div class="table-scroll">
  <table>
    <thead><tr><th>Unit</th><th>Sections complete</th><th>Checkpoint</th></tr></thead><tbody
      >{#each algorithms as a}<tr
          ><td><a href={`${base}algorithms/${a.slug}/`}>{a.title}</a></td><td
            >{Object.keys(p.sections).filter((k) => k.startsWith(a.slug + ':') && p.sections[k])
              .length}/7</td
          ><td
            >{p.checkpoints[a.slug] !== undefined
              ? Math.round(p.checkpoints[a.slug] * 100) + '%'
              : 'Not attempted'}</td
          ></tr
        >{/each}</tbody
    >
  </table>
</div>
<h2>40-minute lesson plan</h2>
{#each pattern as segment}<div class="classroom-row">
    <span>{segment.minutes} min</span><strong>{segment.title}</strong><span>{segment.text}</span
    ><Timer minutes={segment.minutes} />
  </div>{/each}
