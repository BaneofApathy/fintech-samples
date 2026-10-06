<script lang="ts">
  import type { Measure } from '../../data';
  import { recommendMeasures } from '../../engine/measure-recommendations';
  let {
    measures,
    evaluation,
    base,
  }: {
    measures: Measure[];
    evaluation: { id: string; title: string; interpretation: string; measures: string[] }[];
    base: string;
  } = $props();
  let question = $state('rare'),
    rarity = $state('rare'),
    cost = $state('miss');
  const selected = $derived(recommendMeasures(question, rarity, cost).map((recommendation) => ({
    ...recommendation,
    measure: measures.find((m) => m.number === recommendation.number)!,
  })));
</script>

<div class="picker-grid">
  <div class="picker-field">
    <label for="picker-question">1. What is the financial question?</label><select
      id="picker-question"
      bind:value={question}
      >{#each evaluation as q}<option value={q.id}>{q.title}</option>{/each}</select
    >
  </div>
  <div class="picker-field">
    <label for="picker-rarity">2. How rare is the event?</label><select
      id="picker-rarity"
      bind:value={rarity}
      ><option value="rare">Rare · fraud or default</option><option value="balanced"
        >Classes are reasonably balanced</option
      ><option value="na">This is not an event prediction</option></select
    >
  </div>
  <div class="picker-field">
    <label for="picker-cost">3. What does a wrong decision cost?</label><select
      id="picker-cost"
      bind:value={cost}
      ><option value="miss">Missed loss or risk matters most</option><option value="review"
        >Customer friction and review load matter</option
      ><option value="both">Both need explicit comparison</option></select
    >
  </div>
</div>
<div class="callout">
  <div class="callout-label">Recommended evidence</div>
  <p>
    {evaluation.find((q) => q.id === question)?.interpretation}
    {rarity === 'rare' && ['rank', 'rare'].includes(question)
      ? 'Inspect precision and recall at the actual review capacity. Accuracy alone can favor a model that catches no fraud.'
      : ''}
    {cost === 'both'
      ? 'Use a stated cost table and check capacity before choosing an operating point.'
      : ''}
  </p>
</div>
{#if question === 'act'}<p class="small muted">These are starting checks for decision policies and financial losses. For clustering, allocation, or execution, also use the measures in your algorithm unit.</p>{/if}
<div class="measure-recommendations" aria-live="polite" aria-label="Recommended measures">
  {#each selected as item, index}
    <article class:primary-measure={index === 0}>
      <p class="recommendation-role">{index === 0 ? 'Start with this measure' : 'Supporting check'}</p>
      <h2><a href={`${base}measures/${item.measure.slug}/`}>{item.measure.title}</a></h2>
      <p>{item.reason}</p>
    </article>
  {/each}
</div>
<details class="all-measures">
  <summary>Browse all {measures.length} measures</summary>
  <div class="measure-list">
    {#each measures as m}<a class="measure-link" href={`${base}measures/${m.slug}/`}>
      <span><strong>{m.title}</strong><small>{m.financialInterpretation}</small></span>
    </a>{/each}
  </div>
</details>

<style>
  .measure-recommendations { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
  .measure-recommendations article { padding: 1rem 0; border-top: 1px solid var(--line); }
  .measure-recommendations .primary-measure { grid-column: 1 / -1; padding: 1.25rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--green-soft); }
  .recommendation-role { font-size: .875rem; color: var(--muted); margin: 0 0 .4rem; }
  .measure-recommendations h2 { font-family: var(--sl-font); font-size: 1.15rem; margin: 0 0 .5rem; }
  .measure-recommendations article > p:last-child { margin-bottom: 0; }
  .all-measures { margin-top: 1.5rem; }
  .all-measures summary { padding: .75rem 0; }
  @media (max-width: 600px) { .measure-recommendations { grid-template-columns: 1fr; } }
</style>
