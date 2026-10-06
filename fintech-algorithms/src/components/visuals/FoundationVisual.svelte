<script lang="ts">
  import { untrack } from 'svelte';
  import VisualFrame from './VisualFrame.svelte';
  import { foundationVisuals, type FoundationId } from '../../data/foundation-visuals';
  let { id, notation = false }: { id: FoundationId; notation?: boolean } = $props();
  let topic = $state<FoundationId>(untrack(() => id));
  let selected = $state(0),
    step = $state(0),
    amount = $state(10),
    changed = $state(false);
  let operator = $state('absolute'),
    notationKind = $state('conditions');
  let symbol = $state('p'),
    answer = $state(''),
    feedback = $state(false);
  const definition = $derived(foundationVisuals.find((v) => v.id === topic)!);
  const fields = [
    'Debt-to-income at application',
    'Missed payments before application',
    'Default in the next 12 months',
    'Income verified before decision',
  ];
  const errors = [10, -10, -20, 10];
  const values = $derived(
    operator === 'square'
      ? errors.map((v) => v * v)
      : operator === 'absolute'
        ? errors.map(Math.abs)
        : errors,
  );
  const threshold = $derived(changed ? 12 : 8);
  const rate = $derived(amount / 100);
  const percentChange = $derived(amount + 20);
  function reset() {
    selected = 0;
    step = 0;
    amount = 10;
    changed = false;
    operator = 'absolute';
    notationKind = 'conditions';
    symbol = 'p';
    answer = '';
    feedback = false;
  }
  const dollars = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
</script>

<div data-foundation-visual={topic}>
  <VisualFrame
    title={definition.title}
    question={definition.question}
    takeaway={definition.takeaway}
  >
    {#if notation}
      <div class="visual-controls">
        <label
          >Notation topic<select bind:value={topic} onchange={reset}
            >{#each foundationVisuals.slice(6) as v}<option value={v.id}>{v.title}</option
              >{/each}</select
          ></label
        >
      </div>
    {/if}
    {#if topic === 'features'}
      <div class="visual-controls">
        <label
          >Inspect a field<select bind:value={selected}
            >{#each fields as field, i}<option value={i}>{field}</option>{/each}</select
          ></label
        >
      </div>
      <div class="time-lanes" aria-label="Decision-time boundary">
        <div>
          <span class="eyebrow">Available now</span>{#each fields as field, i}{#if i !== 2}<div
                class="field"
                class:chosen={i === selected}
              >
                {field}
              </div>{/if}{/each}
        </div>
        <div class="cutoff">LOAN DECISION</div>
        <div>
          <span class="eyebrow">Learned later</span>
          <div class="field" class:chosen={selected === 2}>{fields[2]}</div>
          <p>Repayment or default becomes a historical label.</p>
        </div>
      </div>
      <p class="visual-feedback" aria-live="polite">
        {selected === 2
          ? 'This field crosses the time boundary: it reveals the future label and must not enter this prediction.'
          : 'This field is available before the decision and can be considered as an input, subject to the data contract.'}
      </p>
    {:else if topic === 'training'}
      <div class="visual-flow">
        <div class="visual-node" class:active={step === 0}>
          <strong>Past applicants</strong><small>Features + later known labels</small>
          <p>Loan A: repaid<br />Loan B: defaulted<br />Loan C: repaid</p>
        </div>
        <div class="visual-node" class:active={step === 1}>
          <strong>Fit a relationship →</strong><small
            >Estimate parameters from the historical sample.</small
          >
        </div>
        <div class="visual-node" class:active={step === 2}>
          <strong>New application</strong><small>Available features → estimated risk</small>
          <p>Future repayment: <strong>unknown</strong></p>
        </div>
      </div>
      <div class="visual-navigation">
        <button onclick={() => (step = Math.max(0, step - 1))} disabled={step === 0}
          >Previous step</button
        ><span>Step {step + 1} of 3</span><button
          onclick={() => (step = Math.min(2, step + 1))}
          disabled={step === 2}>Next step</button
        >
      </div>
      <p class="visual-feedback">
        {[
          'Only outcomes already observed can supply training labels.',
          'The model summarizes patterns in these labeled examples.',
          'The fitted relationship is applied without knowing the new applicant’s future outcome.',
        ][step]}
      </p>
    {:else if topic === 'splits'}
      <div class="visual-flow">
        <div class="visual-node">
          <strong>Earlier: training</strong><small>Fit parameters</small>
        </div>
        <div class="visual-node" class:active={!changed}>
          <strong>Later: validation</strong><small>Choose settings and threshold</small>
        </div>
        <div class="visual-node" class:warning={changed}>
          <strong>Latest: test</strong><small
            >{changed
              ? 'Used to choose → now development data'
              : 'Report final performance once'}</small
          >
        </div>
      </div>
      <div class="visual-controls">
        <label
          ><span>Where do we choose the threshold?</span><select bind:value={changed}
            ><option value={false}>Validation sample</option><option value={true}
              >Final test sample</option
            ></select
          ></label
        >
      </div>
      <p class="visual-feedback" aria-live="polite">
        {changed
          ? 'The test result influenced a choice. It is no longer an untouched estimate of that choice’s performance.'
          : 'The final test remains untouched while the validation set supports the threshold choice.'}
      </p>
    {:else if topic === 'probability'}
      <div class="visual-controls">
        <label
          >Review threshold<select bind:value={changed}
            ><option value={false}>8%</option><option value={true}>12%</option></select
          ></label
        >
      </div>
      <div class="probability-track">
        <div class="risk-marker">◆ 10% estimated risk</div>
        <div class="ruler">
          <div class="threshold-marker" style:left={`${(threshold / 20) * 100}%`}>
            │<span>{threshold}% cutoff</span>
          </div>
        </div>
        <div class="axis-labels"><span>0%</span><span>20%</span></div>
      </div>
      <div class="visual-readouts">
        <div><span>Model estimate</span><strong>10%</strong></div>
        <div>
          <span>Policy: review if risk ≥ cutoff</span><strong
            >{changed ? 'Below threshold' : 'Send to review'}</strong
          >
        </div>
      </div>
    {:else if topic === 'expected-loss'}
      <div class="visual-controls">
        <label
          >Default probability (%)<input
            type="range"
            min="5"
            max="25"
            step="5"
            bind:value={amount}
          /><select aria-label="Default probability numeric alternative" bind:value={amount}
            >{#each [5, 10, 15, 20, 25] as n}<option value={n}>{n}%</option>{/each}</select
          ></label
        >
      </div>
      <div class="visual-flow">
        <div class="visual-node">
          <strong>{100 - amount}% chance</strong><small>Repaid → $0 loss</small>
        </div>
        <div class="visual-node warning">
          <strong>{amount}% chance</strong><small>Default → $5,000 loss</small>
        </div>
        <div class="visual-node active">
          <strong>{dollars(rate * 5000)} average</strong><small>{amount}% × 50% × $10,000</small>
        </div>
      </div>
      <div
        class="cohort"
        role="img"
        aria-label={`${amount} of 100 equivalent probability units represent default risk`}
      >
        {#each Array.from({ length: 100 }) as _, i}<span class:loss={i < amount} aria-hidden="true"
            >{i < amount ? '×' : '·'}</span
          >{/each}
      </div>
      <p class="visual-caption">
        Each tile represents 1 percentage point of probability. This is not a claim that exactly {amount}
        of the next 100 borrowers will default.
      </p>
    {:else if topic === 'formula'}
      <div class="visual-tabs" role="group" aria-label="Expected loss symbols">
        {#each ['p', 'LGD', 'EAD', 'EL'] as term}<button
            aria-pressed={symbol === term}
            onclick={() => (symbol = term)}>{term}</button
          >{/each}
      </div>
      <div class="visual-flow">
        {#each [{ key: 'p', name: 'Default probability', value: '10% = 0.10', unit: 'Unitless fraction' }, { key: 'LGD', name: 'Loss fraction on default', value: '50% = 0.50', unit: 'Unitless fraction' }, { key: 'EAD', name: 'Exposure at default', value: '$10,000', unit: 'Dollars' }, { key: 'EL', name: 'Expected loss', value: '$500', unit: 'Dollars per comparable loan' }] as term}<div
            class="visual-node"
            class:active={symbol === term.key}
          >
            <strong>{term.key} · {term.value}</strong><small>{term.name}</small>
            <p>{term.unit}</p>
          </div>{/each}
      </div>
      <p class="visual-feedback">EL = p × LGD × EAD = 0.10 × 0.50 × $10,000 = $500</p>
    {:else if topic === 'counts'}
      <div class="visual-tabs" role="group" aria-label="Observation">
        {#each [2, 4, 6] as n, i}<button
            aria-pressed={selected === i}
            onclick={() => (selected = i)}>Observation {i + 1}</button
          >{/each}
      </div>
      <div class="visual-flow">
        {#each [2, 4, 6] as n, i}<div class="visual-node" class:active={selected === i}>
            <strong>x{i + 1} = {n}</strong><small>Observed value</small>
            <p>Prediction x̂{i + 1} = {n + 1}</p>
          </div>{/each}
      </div>
      <p class="visual-feedback">
        For i = {selected + 1}, xᵢ = {[2, 4, 6][selected]}; x̂ᵢ = {[3, 5, 7][selected]}. The mean x̄ =
        (2 + 4 + 6) / 3 = 4.
      </p>
    {:else if topic === 'operators'}
      <div class="visual-controls">
        <label
          >Operation<select bind:value={operator}
            ><option value="signed">Add signed errors</option><option value="absolute"
              >Absolute values</option
            ><option value="square">Square each error</option></select
          ></label
        >
      </div>
      <div class="visual-flow">
        {#each values as v, i}<div class="visual-node">
            <small>Error {i + 1}: {errors[i]} ($ thousands)</small><strong>{v}</strong><small
              >{operator === 'square' ? 'Squared units' : '$ thousands'}</small
            >
          </div>{/each}
        <div class="visual-node active">
          <small>Sum</small><strong>{values.reduce((a, b) => a + b, 0)}</strong>
        </div>
      </div>
      <p class="visual-feedback">
        Residual = actual − forecast. {operator === 'signed'
          ? 'The signed sum is −10; cancellation hides the sizes of the individual misses.'
          : operator === 'absolute'
            ? 'The total absolute error is 50; MAE is 50 / 4 = 12.5 thousand dollars.'
            : 'The squared errors total 700; RMSE = √(700 / 4) ≈ 13.23 thousand dollars.'}
      </p>
    {:else if topic === 'logs'}
      <div class="visual-controls">
        <label
          >Notation example<select bind:value={notationKind}
            ><option value="conditions">Strict versus inclusive boundary</option><option
              value="sets">Set overlap</option
            ><option value="log">Logarithm and exponent</option></select
          ></label
        >
      </div>
      {#if notationKind === 'conditions'}<div class="visual-tabs">
          <button aria-pressed={!changed} onclick={() => (changed = false)}
            >Loss &gt; reserve</button
          ><button aria-pressed={changed} onclick={() => (changed = true)}>Loss ≥ reserve</button>
        </div>
        <div class="visual-flow">
          <div class="visual-node"><strong>Loss = $100</strong></div>
          <div class="visual-node"><strong>Reserve = $100</strong></div>
          <div class="visual-node" class:warning={changed}>
            <strong>{changed ? 'Counts as a breach' : 'Does not count as a breach'}</strong>
          </div>
        </div>
      {:else if notationKind === 'sets'}<div class="visual-controls">
          <label><input type="checkbox" bind:checked={changed} /> Add customer B to both sets</label
          >
        </div>
        <div class="visual-flow">
          <div class="visual-node">
            <strong>Uses savings</strong>
            <p>A, B, C</p>
          </div>
          <div class="visual-node active">
            <strong>Intersection ∩</strong>
            <p>{changed ? 'B, C' : 'C'}</p>
            <small>{changed ? 2 : 1} shared customers</small>
          </div>
          <div class="visual-node">
            <strong>Uses credit</strong>
            <p>{changed ? 'B, C, D' : 'C, D'}</p>
          </div>
        </div>
      {:else}<div class="visual-controls">
          <label
            >Exponent<select bind:value={selected}
              >{#each [0, 1, 2, 3, 4] as n}<option value={n}>{n}</option>{/each}</select
            ></label
          >
        </div>
        <div class="visual-flow">
          <div class="visual-node"><strong>{selected}</strong><small>Exponent</small></div>
          <div class="visual-node active">
            <strong>2^{selected} = {2 ** selected}</strong><small>Raise 2 to this power →</small>
          </div>
          <div class="visual-node">
            <strong>log₂({2 ** selected}) = {selected}</strong><small>← Recover the exponent</small>
          </div>
        </div>{/if}
    {:else if topic === 'percentages'}
      <div class="visual-controls">
        <label
          >New percentage<select bind:value={amount}
            >{#each [0, 5, 10, 15, 20] as n}<option value={n}>{n + 20}%</option>{/each}</select
          ></label
        >
      </div>
      <div class="percent-bars">
        <div><span>Original 20%</span><i style:width="20%"></i></div>
        <div><span>New {percentChange}%</span><i style:width={`${percentChange}%`}></i></div>
      </div>
      <div class="visual-readouts">
        <div><span>Percentage-point change</span><strong>+{amount} points</strong></div>
        <div><span>Relative to original 20%</span><strong>+{(amount / 20) * 100}%</strong></div>
        <div><span>Basis-point change</span><strong>{amount * 100} bps</strong></div>
        <div><span>Change on $1 million</span><strong>{dollars((amount / 100) * 1e6)}</strong></div>
      </div>
    {:else}
      <div class="visual-controls">
        <label
          >Population<select bind:value={selected}
            ><option value={0}>200 alerts → precision</option><option value={1}
              >100 actual frauds → recall</option
            ><option value={2}>10,000 transactions → caught fraud share</option><option value={3}
              >No alerts → precision undefined</option
            ></select
          ></label
        >
      </div>
      <div class="fraction">
        <strong>{selected === 3 ? 0 : 60} caught frauds</strong>
        <hr />
        <strong
          >{[200, 100, 10000, 0][selected]}
          {['alerts', 'actual frauds', 'transactions', 'alerts'][selected]}</strong
        >
      </div>
      <p class="visual-feedback" aria-live="polite">
        {selected === 3
          ? 'Not defined: there are no alerts to evaluate.'
          : `${((60 / [200, 100, 10000][selected]) * 100).toLocaleString('en-US')}% — the population under the fraction determines the question.`}
      </p>
    {/if}
    <div class="visual-navigation"><button onclick={reset}>Reset visual</button></div>
    <details class="visual-predict">
      <summary>Check your understanding</summary><label
        >Explain what changed<textarea
          bind:value={answer}
          placeholder="Name the changed input and its effect."></textarea></label
      ><button class="button secondary" onclick={() => (feedback = !feedback)}
        >{feedback ? 'Hide explanation' : 'Compare with the explanation'}</button
      >{#if feedback}<p class="visual-feedback">{definition.takeaway}</p>{/if}
    </details>
  </VisualFrame>
</div>

<style>
  .time-lanes {
    display: grid;
    grid-template-columns: 1fr 30px 1fr;
    gap: 0.6rem;
    margin: 1rem 0;
  }
  .time-lanes > div {
    min-width: 0;
  }
  .field {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 0.7rem;
    margin: 0.6rem 0;
    font-size: 0.85rem;
  }
  .field.chosen {
    border: 2px solid var(--green);
    background: var(--green-soft);
  }
  .cutoff {
    writing-mode: vertical-rl;
    border-left: 2px dashed var(--gold);
    padding-left: 0.3rem;
    color: var(--warning);
    font-size: 0.7rem;
    font-weight: 700;
  }
  .time-lanes p {
    font-size: 0.82rem;
  }
  .cohort {
    display: grid;
    grid-template-columns: repeat(20, 1fr);
    gap: 3px;
  }
  .cohort span {
    text-align: center;
    background: var(--canvas);
    border: 1px solid var(--line);
    font-size: 0.8rem;
  }
  .cohort .loss {
    background: var(--warning-bg);
    color: var(--warning);
    font-weight: bold;
  }
  .probability-track {
    padding: 1rem 0 2rem;
  }
  .risk-marker {
    text-align: center;
    color: var(--green);
    font-weight: 700;
  }
  .ruler {
    height: 8px;
    background: var(--line);
    position: relative;
    margin: 1.4rem 0 0.5rem;
  }
  .threshold-marker {
    position: absolute;
    top: -1rem;
    color: var(--warning);
    font-weight: 800;
    line-height: 2;
  }
  .threshold-marker span {
    position: absolute;
    top: 1.4rem;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.8rem;
  }
  .axis-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }
  .percent-bars > div {
    padding: 0.6rem 0;
  }
  .percent-bars span {
    display: block;
    font-size: 0.82rem;
  }
  .percent-bars i {
    display: block;
    min-height: 18px;
    background: var(--blue);
    border-radius: 3px;
    margin: 0.4rem 0;
  }
  .fraction {
    display: table;
    text-align: center;
    margin: 1rem auto;
  }
  .fraction hr {
    border: 1px solid var(--green);
  }
  @media (max-width: 600px) {
    .cohort {
      grid-template-columns: repeat(10, 1fr);
    }
    .time-lanes {
      grid-template-columns: 1fr 24px 1fr;
    }
    .field {
      font-size: 0.78rem;
      padding: 0.45rem;
    }
    .time-lanes .eyebrow {
      font-size: 0.6rem;
    }
  }
</style>
