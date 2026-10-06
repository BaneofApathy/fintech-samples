<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import {
    algorithmValues,
    algorithmVisualGivens,
    algorithmVisuals,
    visualStepIndex,
  } from '../../../data/algorithm-visuals';
  import VisualFrame from '../VisualFrame.svelte';
  import ScoreDiagrams from './ScoreDiagrams.svelte';
  import GroupingDiagrams from './GroupingDiagrams.svelte';
  import SequenceDiagrams from './SequenceDiagrams.svelte';
  import DecisionDiagrams from './DecisionDiagrams.svelte';
  import { number as f, percent as pct } from './helpers';
  import './algorithm-diagrams.css';

  let {
    slug,
    mode = 'intuition',
    givens,
    exerciseId,
    focusStep,
  }: {
    slug: string;
    mode?: string;
    givens?: Givens;
    exerciseId?: string;
    focusStep?: string;
  } = $props();
  const config = $derived(algorithmVisuals[slug]);
  const matching = $derived(!exerciseId || exerciseId === config?.exercise);
  const base = $derived(matching && givens ? givens : algorithmVisualGivens[config?.exercise]);
  let overrides = $state<Givens>({});
  let activeStep = $state<number | null>(null);
  let method = $state(0);
  let choice = $state<number | null>(null);
  let term = $state('');
  let ready = $state(false);
  let prediction = $state<number | null>(null);
  let revealed = $state(false);
  let predictionOpen = $state(untrack(() => mode === 'practice'));
  const step = $derived(activeStep ?? visualStepIndex(slug, focusStep, mode));
  const selected = $derived(choice ?? (slug === 'rag' ? 2 : 0));
  const g = $derived({ ...base, ...overrides });
  const values = $derived(config ? algorithmValues(slug, g) : {});
  const current = $derived(config?.steps[step]);
  const source = $derived(
    `${config?.exercise} · ${matching && givens ? 'current exercise inputs' : 'example inputs'}${Object.keys(overrides).length ? ' · modified inputs' : ''}`,
  );

  $effect(() => {
    // Read only incoming example identity here; local controls remain independent.
    void givens;
    void exerciseId;
    void slug;
    untrack(() => {
      overrides = {};
      activeStep = null;
      method = 0;
      choice = null;
      term = '';
      prediction = null;
      revealed = false;
    });
  });
  $effect(() => {
    void focusStep;
    untrack(() => {
      activeStep = null;
    });
  });

  function reset() {
    overrides = {};
    activeStep = null;
    method = 0;
    choice = null;
    term = '';
    prediction = null;
    revealed = false;
  }
  function move(next: number) {
    activeStep = Math.max(0, Math.min(config.steps.length - 1, next));
    term = '';
  }
  function changeMethod(next: number) {
    method = next;
    choice =
      slug === 'rag'
        ? 2
        : slug === 'optimization' && next === 1
          ? 50
          : slug === 'monte-carlo' && next === 4
            ? 1000
            : 0;
    term = '';
  }
  function numberInput(key: string, value: number) {
    if (Number.isFinite(value)) overrides = { ...overrides, [key]: value };
  }
  function attentionInput(value: number) {
    if (Number.isFinite(value))
      overrides = { ...overrides, logits: [(g.logits as number[])[0], value] };
  }
  function startingCenters(preset: number) {
    const points = [...(base.points as number[])].sort((a, b) => a - b);
    overrides = {
      ...overrides,
      centers: preset === 0 ? [...(base.centers as number[])] : [points[0], points[1]],
    };
  }
  function focusSymbol(symbol: string) {
    const normalized = symbol.replace(/\\(?:mathrm|text|operatorname)|[{}_$]/g, '').trim();
    const options: [RegExp, string[]][] = [
      [/^(p|PD|P\(.*)$/i, ['probability', 'probabilities', 'PD']],
      [/^z$/, ['score']],
      [/DTI/i, ['DTI']],
      [/LGD/i, ['LGD']],
      [/EAD|loan|exposure/i, ['exposure']],
      [/^I$/, ['income']],
      [/^D$/, ['delinquency']],
      [/threshold|^t$/i, ['threshold']],
      [/eta|η|alpha|α/i, ['learning rate']],
      [/gamma|γ/i, ['discount']],
      [/phi|φ/i, ['coefficient']],
      [/mu|μ/i, ['centers', 'return']],
      [/sigma|Σ|σ/i, ['variance', 'volatility']],
      [/^w|weights/i, ['weights']],
      [/^Q|target/i, ['old value', 'target']],
      [/^h|E\[h\]/, ['representation', 'mean', 'path']],
      [/^c$/, ['normalization']],
      [/logit/i, ['logits']],
      [/cos|theta|θ/i, ['direction', 'similarity']],
      [/reserve/i, ['reserve']],
      [/^q$/, ['query']],
      [/^v$/, ['values', 'nodes']],
    ];
    const terms = new Set(config.steps.flatMap((s) => s.terms));
    const mapped = options
      .find(([pattern]) => pattern.test(normalized))?.[1]
      .find((candidate) => terms.has(candidate));
    if (mapped) term = mapped;
  }
  onMount(() => {
    ready = true;
    const listener = (event: Event) => {
      const symbol = (event as CustomEvent<{ symbol?: string }>).detail?.symbol;
      if (symbol) focusSymbol(symbol);
    };
    window.addEventListener('course-formula-focus', listener);
    return () => window.removeEventListener('course-formula-focus', listener);
  });
</script>

{#if config}
  <div
    class="algorithm-walkthrough"
    data-algorithm-visual={slug}
    data-ready={ready}
    data-visual-id={`algorithm-${slug}`}
    data-exercise-id={config.exercise}
    data-step={step}
  >
    <VisualFrame
      title={config.title}
      question={config.question}
      takeaway={config.takeaway}
      {source}
    >
      <div class="av-step-heading" aria-live="polite" aria-atomic="true">
        <span class="av-step-count">Step {step + 1} of {config.steps.length}</span>
        <h4>{current.title}</h4>
        <p>{current.explanation}</p>
      </div>
      <div class="av-controls">
        {#if slug === 'logistic-regression'}
          <label
            >Debt-to-income ratio: <strong>{g.DTI} percentage points</strong><input
              aria-label="Walkthrough debt-to-income ratio"
              type="range"
              min="0"
              max="100"
              step="1"
              value={Number(g.DTI)}
              oninput={(e) => numberInput('DTI', e.currentTarget.valueAsNumber)}
            /></label
          >
          <label
            >Review threshold: <strong>{pct(g.threshold)}</strong><input
              aria-label="Walkthrough review threshold"
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={Number(g.threshold)}
              oninput={(e) => numberInput('threshold', e.currentTarget.valueAsNumber)}
            /></label
          >
        {:else if slug === 'trees-and-forests'}
          <label
            >Trace a branch<select
              aria-label="Trace a tree branch"
              value={selected}
              onchange={(e) => (choice = Number(e.currentTarget.value))}
              ><option value="0">New device</option><option value="1">Trusted device</option
              ></select
            ></label
          >
        {:else if slug === 'gradient-boosting'}
          <label
            >Learning rate η: <strong>{f(g.eta)}</strong><input
              aria-label="Walkthrough boosting learning rate"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={Number(g.eta)}
              oninput={(e) => numberInput('eta', e.currentTarget.valueAsNumber)}
            /></label
          >
        {:else if slug === 'k-means'}
          {#if method === 1}<label
              >Density neighborhood<select
                aria-label="DBSCAN epsilon"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">ε = 0.8</option><option value="1">ε = 1.2</option></select
              ></label
            >{:else}<label
              >New customer savings: <strong>{g.newPoint}%</strong><input
                aria-label="Walkthrough new customer savings rate"
                type="range"
                min="0"
                max="100"
                step="1"
                value={Number(g.newPoint)}
                oninput={(e) => numberInput('newPoint', e.currentTarget.valueAsNumber)}
              /></label
            ><label
              >Starting centers<select
                aria-label="K-means starting centers"
                value={JSON.stringify(g.centers) === JSON.stringify(base.centers) ? 0 : 1}
                onchange={(e) => startingCenters(Number(e.currentTarget.value))}
                ><option value="0">Supplied exercise centers</option><option value="1"
                  >Two nearby starting points</option
                ></select
              ></label
            >{/if}
        {:else if slug === 'isolation-forest'}
          <label
            >Transaction to follow<select
              aria-label="Isolation transaction"
              value={selected}
              onchange={(e) => (choice = Number(e.currentTarget.value))}
              ><option value="0">A</option><option value="1">B</option><option value="2">C</option
              ></select
            ></label
          >
        {:else if slug === 'time-series'}
          {#if method === 3}<label
              >Previous volatility shock<select
                aria-label="GARCH shock comparison"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">Small shock · 0.1</option><option value="1"
                  >Larger shock · 0.5</option
                ></select
              ></label
            >{:else if method === 4}<label
              >Forecast origin<select
                aria-label="Walk-forward origin"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">After day 7 → forecast days 8–14</option><option value="1"
                  >After day 14 → forecast days 15–21</option
                ></select
              ></label
            >{:else}<label
              >AR coefficient φ: <strong>{f(g.phi)}</strong><input
                aria-label="Walkthrough autoregressive coefficient"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={Number(g.phi)}
                oninput={(e) => numberInput('phi', e.currentTarget.valueAsNumber)}
              /></label
            >{/if}
        {:else if slug === 'graph-methods'}
          {#if method === 7}<label
              >Historical decision cutoff<select
                aria-label="Graph historical cutoff"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">Day 1 · device links only</option><option value="1"
                  >Day 2 · merchant links available</option
                ></select
              ></label
            >{:else}<label
              >Account to inspect<select
                aria-label="Walkthrough account selection"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">A</option><option value="1">B</option><option value="2">C</option
                ><option value="3">D</option></select
              ></label
            >{/if}
        {:else if slug === 'transformers'}
          <label
            >“Narrowed” attention logit: <strong>{f((g.logits as number[])[1], 3)}</strong><input
              aria-label="Second token attention logit"
              type="range"
              min="-2"
              max="3"
              step="0.1"
              value={(g.logits as number[])[1]}
              oninput={(e) => attentionInput(e.currentTarget.valueAsNumber)}
            /></label
          >
        {:else if slug === 'rag'}
          <label
            >Passages to retrieve: <strong>{selected}</strong><input
              aria-label="Walkthrough retrieved passage count"
              type="range"
              min="1"
              max="3"
              step="1"
              value={selected}
              oninput={(e) => (choice = e.currentTarget.valueAsNumber)}
            /></label
          >
        {:else if slug === 'optimization'}
          {#if method === 1}<label
              >Continuous stock weight: <strong>{selected}%</strong><input
                aria-label="Continuous stock weight"
                type="range"
                min="0"
                max="100"
                step="1"
                value={selected}
                oninput={(e) => (choice = e.currentTarget.valueAsNumber)}
              /></label
            >
          {:else if method === 2}<label
              >Each asset cap<select
                aria-label="Asset cap comparison"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">20% · infeasible sum</option><option value="1"
                  >30% · enough cap capacity</option
                ></select
              ></label
            >
          {:else if method === 3}<label
              >Stock–bond correlation<select
                aria-label="Correlation stress"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">0 · exercise assumption</option><option value="1"
                  >0.8 · stress</option
                ></select
              ></label
            >
          {:else if method === 4}<label
              >Expected-return estimate<select
                aria-label="Portfolio input sensitivity"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="0">Original estimates</option><option value="1"
                  >Bond return +1 percentage point</option
                ></select
              ></label
            >
          {:else}<label
              >Required return: <strong>{pct(g.minimum)}</strong><input
                aria-label="Walkthrough required portfolio return"
                type="range"
                min="0"
                max="0.15"
                step="0.005"
                value={Number(g.minimum)}
                oninput={(e) => numberInput('minimum', e.currentTarget.valueAsNumber)}
              /></label
            >{/if}
        {:else if slug === 'reinforcement-learning'}
          <label
            >Learning rate α: <strong>{f(g.alpha)}</strong><input
              aria-label="Q-learning update rate"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={Number(g.alpha)}
              oninput={(e) => numberInput('alpha', e.currentTarget.valueAsNumber)}
            /></label
          >
        {:else if slug === 'monte-carlo'}
          {#if method === 4}<label
              >Independent simulation runs<select
                aria-label="Monte Carlo simulation runs"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                ><option value="100">100</option><option value="1000">1,000</option><option
                  value="10000">10,000</option
                ></select
              ></label
            >
          {:else if method === 0}<label
              >Inspect supplied run<select
                aria-label="Monte Carlo supplied run"
                value={selected}
                onchange={(e) => (choice = Number(e.currentTarget.value))}
                >{#each Array.from({ length: (g.draws as number[]).length / 2 }, (_, i) => i) as i}<option
                    value={i}>Run {i + 1}</option
                  >{/each}</select
              ></label
            >{:else}<label
              >Reserve: <strong>${f(g.reserve, 0)}</strong><input
                aria-label="Walkthrough reserve"
                type="range"
                min="0"
                max={2 * Number(g.loan) * Number(g.LGD)}
                step={Math.max(1, (Number(g.loan) * Number(g.LGD)) / 20)}
                value={Number(g.reserve)}
                oninput={(e) => numberInput('reserve', e.currentTarget.valueAsNumber)}
              /></label
            >{/if}
        {/if}
      </div>

      <p class="av-scroll-hint">
        ↔ Scroll a wide diagram sideways to see every part. Keyboard users can focus it and use the
        arrow keys.
      </p>
      {#if ['logistic-regression', 'trees-and-forests', 'gradient-boosting'].includes(slug)}<ScoreDiagrams
          {slug}
          {g}
          {values}
          {step}
          {method}
          choice={selected}
          {term}
        />
      {:else if ['k-means', 'isolation-forest', 'graph-methods'].includes(slug)}<GroupingDiagrams
          {slug}
          {g}
          {values}
          {step}
          {method}
          choice={selected}
          {term}
        />
      {:else if ['time-series', 'transformers', 'rag'].includes(slug)}<SequenceDiagrams
          {slug}
          {g}
          {values}
          {step}
          {method}
          choice={selected}
          {term}
        />
      {:else}<DecisionDiagrams {slug} {g} {values} {step} {method} choice={selected} {term} />{/if}

      <div class="av-formula">
        <span class="av-label">Read the current step</span>
        <p>{current.formula}</p>
        <div class="av-terms" role="group" aria-label="Highlight a formula term">
          {#each current.terms as item}<button
              type="button"
              aria-pressed={term === item}
              onclick={() => (term = term === item ? '' : item)}>{item}</button
            >{/each}
        </div>
        {#if term}<p class="av-term-note" aria-live="polite">
            Inspect <strong>{term}</strong> in the labeled diagram and calculation. Blue outlines identify
            linked objects where applicable.
          </p>{/if}
      </div>

      <div class="av-navigation" aria-label="Walkthrough controls">
        <button type="button" disabled={step === 0} onclick={() => move(step - 1)}>← Back</button
        ><span aria-hidden="true">{step + 1} / {config.steps.length}</span><button
          type="button"
          disabled={step === config.steps.length - 1}
          onclick={() => move(step + 1)}>Next →</button
        ><button type="button" class="av-reset" onclick={reset}>Reset</button>
      </div>

      <details class="av-comparisons">
        <summary>Compare methods and assumptions</summary><label
          >Show a focused comparison<select
            aria-label={`${config.title} comparison`}
            value={method}
            onchange={(e) => changeMethod(Number(e.currentTarget.value))}
            >{#each config.methods as label, i}<option value={i}>{label}</option>{/each}</select
          ></label
        >
        <p>
          The selected comparison appears in the diagram above. Numerical exercise calculations
          retain their stated source unless the comparison explicitly changes an input.
        </p>
      </details>

      <details class="av-prediction" bind:open={predictionOpen}>
        <summary>Predict, then explain</summary>
        <fieldset>
          <legend>{config.prediction.question}</legend
          >{#each config.prediction.options as option, i}<label class="av-choice"
              ><input
                type="radio"
                name={`prediction-${slug}-${mode}`}
                checked={prediction === i}
                onchange={() => {
                  prediction = i;
                  revealed = false;
                }}
              />{option}</label
            >{/each}
        </fieldset>
        <button type="button" disabled={prediction === null} onclick={() => (revealed = true)}
          >Reveal explanation</button
        >{#if revealed}<p class="av-feedback" role="status">
            <strong
              >{prediction === config.prediction.correct
                ? 'That follows the mechanism.'
                : 'Revisit the highlighted mechanism.'}</strong
            >
            {config.prediction.explanation}
          </p>{/if}
      </details>
      {#if !matching}<p class="av-note">
          This diagram uses {config.exercise}. {exerciseId} has a separate numerical walkthrough so its
          inputs are not mixed with this example.
        </p>{/if}
      <noscript
        ><p>
          The labeled diagram and numerical explanation above are available without JavaScript. Step
          controls and comparisons require JavaScript.
        </p></noscript
      >
    </VisualFrame>
  </div>
{/if}

<style>
  .algorithm-walkthrough {
    min-width: 0;
  }
  .av-scroll-hint {
    display: none;
  }
  .av-step-heading h4 {
    margin: 0.25rem 0;
    font-size: 1.1rem;
  }
  .av-step-heading p {
    line-height: 1.55;
    margin: 0.5rem 0 1rem;
  }
  .av-step-count,
  .av-label {
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--av-a);
  }
  .av-controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .av-controls label {
    display: block;
    width: 100%;
    max-width: 28rem;
    font-size: 0.92rem;
  }
  input[type='range'] {
    display: block;
    width: 100%;
    min-height: 44px;
    accent-color: var(--av-a);
  }
  select {
    display: block;
    margin-top: 0.35rem;
    width: 100%;
    max-width: 30rem;
    min-height: 44px;
    border: 1px solid var(--line, #ddd);
    border-radius: 6px;
    padding: 0.5rem;
    color: inherit;
    background: var(--av-paper);
    font: inherit;
  }
  .av-formula {
    padding: 0.8rem;
    background: var(--green-soft, #edf5ee);
    border-radius: 8px;
  }
  .av-formula > p {
    margin: 0.5rem 0;
    overflow-wrap: anywhere;
  }
  .av-terms {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  button {
    min-height: 44px;
    padding: 0.5rem 0.8rem;
    border: 1px solid var(--line, #ced9cd);
    border-radius: 6px;
    color: inherit;
    background: var(--av-paper);
    font: inherit;
    cursor: pointer;
  }
  button:hover {
    border-color: var(--av-a);
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  summary:focus-visible {
    outline: 3px solid var(--av-c);
    outline-offset: 3px;
  }
  button[aria-pressed='true'] {
    background: var(--av-c);
    color: white;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .av-terms button {
    font-size: 0.85rem;
  }
  .av-navigation {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    flex-wrap: wrap;
    margin: 1rem 0;
  }
  .av-navigation > span {
    font-size: 0.86rem;
  }
  .av-reset {
    margin-left: auto;
  }
  details {
    border-top: 1px solid var(--line, #ddd);
    margin-top: 0.8rem;
    padding: 0.5rem 0;
  }
  summary {
    padding: 0.5rem 0;
    min-height: 44px;
    cursor: pointer;
    font-weight: 600;
  }
  .av-comparisons p,
  .av-note,
  .av-term-note {
    font-size: 0.85rem;
    line-height: 1.5;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0.5rem 0;
  }
  legend {
    margin-bottom: 0.7rem;
    line-height: 1.5;
  }
  .av-choice {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    padding: 0.65rem;
    border: 1px solid var(--line, #ddd);
    border-radius: 6px;
    margin: 0.4rem 0;
    min-height: 44px;
    line-height: 1.45;
  }
  .av-choice input {
    margin-top: 0.3rem;
    accent-color: var(--av-a);
  }
  .av-feedback {
    padding: 0.8rem;
    border-left: 3px solid var(--av-a);
    line-height: 1.55;
    background: var(--green-soft, #edf5ee);
  }
  @media (max-width: 520px) {
    .av-scroll-hint {
      display: block;
      font-size: 0.82rem;
      line-height: 1.5;
      color: var(--muted);
    }
    .av-navigation {
      gap: 0.35rem;
    }
    .av-navigation button {
      font-size: 0.84rem;
      padding: 0.5rem 0.65rem;
    }
  }
</style>
