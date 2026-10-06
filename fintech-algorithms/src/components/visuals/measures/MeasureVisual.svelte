<script lang="ts">
  import type { Givens } from '../../../engine/types';
  import VisualFrame from '../VisualFrame.svelte';
  import { measureVisual } from '../../../data/measure-visuals';
  import Classification from './Classification.svelte';
  import Probability from './Probability.svelte';
  import Forecast from './Forecast.svelte';
  import Evidence from './Evidence.svelte';
  import Risk from './Risk.svelte';
  import Operations from './Operations.svelte';
  import ExerciseAggregates from './ExerciseAggregates.svelte';
  const aggregateIds = [
    'M11b',
    'M16',
    'M21',
    'M26',
    'M27a',
    'M27b',
    'M28',
    'M29a',
    'M29b',
    'M30',
    'M31',
    'M32b',
    'M32c',
    'M34',
    'M36',
  ];
  import './measures.css';
  let {
    number,
    givens,
    exerciseId,
    focusStep,
  }: { number: number; givens?: Givens; exerciseId?: string; focusStep?: string } = $props();
  let definition = $derived(measureVisual(number));
  let resetKey = $state(0),
    prediction = $state(''),
    revealed = $state(false);
</script>

{#if definition}
  <VisualFrame
    title={`M${String(number).padStart(2, '0')} · ${definition.title}`}
    question={definition.question}
    takeaway={definition.takeaway}
    source={exerciseId
      ? `${exerciseId} · ${givens ? 'current exercise inputs' : 'example inputs'}`
      : definition.exampleReference}
  >
    <div class="vm-measure" data-measure-visual={number}>
      {#if focusStep}<p class="visual-caption">
          Current exercise step: {focusStep}. Use the diagram to explain the operation before
          calculating your answer.
        </p>{/if}
      {#key `${number}-${exerciseId ?? ''}-${JSON.stringify(givens)}-${resetKey}-${focusStep ?? ''}`}
        {#if exerciseId && givens && aggregateIds.includes(exerciseId)}
          <ExerciseAggregates id={exerciseId} {givens} {focusStep} />
        {:else if number <= 13}<Classification {number} {givens} {focusStep} />
        {:else if number <= 19}<Probability {number} {givens} {exerciseId} {focusStep} />
        {:else if number <= 25}<Forecast {number} {givens} {focusStep} />
        {:else if number <= 30}<Evidence {number} {givens} {exerciseId} {focusStep} />
        {:else if number <= 35}<Risk {number} {givens} {exerciseId} {focusStep} />
        {:else}<Operations {number} {givens} {exerciseId} {focusStep} />{/if}
      {/key}
      <p class="vm-description"><strong>Diagram description:</strong> {definition.textAlternative}</p>
      <div class="vm-reset">
        <button
          onclick={() => {
            resetKey++;
            revealed = false;
            prediction = '';
          }}>Reset starting example</button
        ><span>Exploration does not mark an exercise complete.</span>
      </div>
      <details class="vm-understanding">
        <summary>Predict, then explain</summary><label
          >Before changing a control, predict the consequence. What should stay fixed?<textarea
            rows="2"
            bind:value={prediction}
            placeholder="I expect … because …"></textarea></label
        ><button onclick={() => (revealed = !revealed)}
          >{revealed ? 'Hide explanation' : 'Compare with the key idea'}</button
        >{#if revealed}<p class="visual-feedback">
            {definition.takeaway} Trace the highlighted numerator, denominator, observation, or decision
            back to its stated source.
          </p>{/if}
      </details>
      {#if exerciseId && givens}<details>
          <summary>Exercise input reference</summary>
          <p>
            These are the current exercise givens. Any smaller or reconstructed illustration above
            has its own stated population and must not be substituted for these values.
          </p>
          <dl>
            {#each Object.entries(givens) as [key, value]}<dt>{key}</dt>
              <dd>{Array.isArray(value) ? value.join(', ') : value}</dd>{/each}
          </dl>
        </details>{/if}
    </div>
  </VisualFrame>
{/if}
