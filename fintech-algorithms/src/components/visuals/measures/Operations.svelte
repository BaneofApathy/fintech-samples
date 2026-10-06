<script lang="ts">
  import { untrack } from 'svelte';
  import type { Givens } from '../../../engine/types';
  import { average, total, fmt, pct, ratio, psi } from '../../../engine/visual-math';
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
        exerciseId === 'M39b'
          ? 1
          : exerciseId === 'M39c'
            ? 2
            : exerciseId === 'M39d'
              ? 3
              : number === 37
                ? Math.max(
                    0,
                    [
                      'success',
                      'verification',
                      'unsafeAttempt',
                      'unsafeExecution',
                      'toolError',
                    ].indexOf(focusStep ?? 'success'),
                  )
                : 0,
      ),
    ),
    step = $state(3),
    selected = $state(0),
    transfer = $state(0),
    slow = $state(false),
    queueKind = $state(
      untrack(() => (focusStep === 'capacity' || focusStep === 'requestBacklog' ? 1 : 0)),
    ),
    analystChange = $state(0),
    arrivalChange = $state(0),
    reviewChange = $state(0),
    objective = $state(untrack(() => val('objective', 0.999)));
  let policy = $derived(
    givens?.costs
      ? (givens.costs as number[]).map((c) => (c / val('notional', 1000000)) * 10000)
      : [4, 5, 6],
  );
  let twap = $derived(
    givens?.baseline
      ? policy.map(
          () => ((val('baseline', 1200) / val('notional', 1000000)) * 10000) / policy.length,
        )
      : [6, 6, 6],
  );
  let hindsight = $derived(
    givens?.hindsight
      ? policy.map(
          () => ((val('hindsight', 700) / val('notional', 1000000)) * 10000) / policy.length,
        )
      : [3, 4, 4],
  );
  let rewards = $derived(policy.slice(0, step).map((v) => -v));
  let tasks = $derived(val('tasks', 500)),
    completed = $derived(val('completed', 460)),
    verified = $derived(val('verified', 475)),
    unsafe = $derived(val('unsafe', 5)),
    executed = $derived(val('executed', 0));
  const traces = [
    {
      name: 'Invoice A',
      done: true,
      verified: true,
      attempt: false,
      error: false,
      detail: 'Read invoice → match purchase order → verify fields → complete approved workflow.',
    },
    {
      name: 'Invoice B',
      done: false,
      verified: true,
      attempt: false,
      error: true,
      detail: 'Fields verified → payment tool returned an error → workflow remains unfinished.',
    },
    {
      name: 'Invoice C',
      done: false,
      verified: false,
      attempt: true,
      error: false,
      detail:
        'Attempt to exceed authorization → control blocked action → request remained unresolved.',
    },
    {
      name: 'Invoice D',
      done: true,
      verified: true,
      attempt: true,
      error: false,
      detail:
        'Unauthorized attempt blocked → allowed workflow resumed → task completed with checks.',
    },
  ];
  let expected = $derived(arr('reference', [0.2, 0.3, 0.3, 0.2])),
    actual = $derived(
      arr('current', [0.1, 0.25, 0.35, 0.3]).map(
        (v, i) =>
          v +
          (i === 0
            ? -transfer
            : i === arr('current', [0.1, 0.25, 0.35, 0.3]).length - 1
              ? transfer
              : 0),
      ),
    );
  let contributions = $derived(
    expected.map((e, i) =>
      e > 0 && actual[i] > 0 ? (actual[i] - e) * Math.log(actual[i] / e) : null,
    ),
  );
  let latencies = $derived(
    arr('counts', [94, 5, 1])
      .flatMap((n, i) => Array(n).fill(slow && i > 0 ? 1000 : arr('times', [30, 180, 280])[i]))
      .sort((a, b) => a - b),
  );
  const percentile = (xs: number[], q: number) => xs[Math.ceil(xs.length * q) - 1];
  let analysts = $derived(Math.max(0, val('analysts', 400) + analystChange)),
    pace = $derived(val('pace', 20)),
    alerts = $derived(Math.max(0, val('alerts', 25000) + arrivalChange));
  let apiCapacity = $derived(val('perMinute', 12000) / 60),
    apiArrival = $derived(val('arrival', 250));
  let requests = $derived(val('requests', 1000)),
    abstained = $derived(val('abstained', 100)),
    spend = $derived(val('spend', 500)),
    reviewCost = $derived(Math.max(0, val('reviewCost', 3) + reviewChange));
  let cost = $derived(spend + abstained * reviewCost),
    correct = $derived(val('autoCorrect', 800) + abstained);
  let scheduled = $derived((exerciseId === 'M39d' ? val('days', 30) : 30) * 24 * 60),
    downtime = $derived(val('downtime', 90));
</script>

{#if number === 36}
  <div class="visual-tabs">
    <button aria-pressed={tab === 0} onclick={() => (tab = 0)}>Cumulative reward</button><button
      aria-pressed={tab === 1}
      onclick={() => (tab = 1)}>Regret</button
    >
  </div>
  <label class="vm-control"
    >Completed execution steps <input
      type="range"
      min="0"
      max="3"
      step="1"
      bind:value={step}
    /><output>{step}/3</output></label
  >
  <div class="vm-tray">
    {#each policy as cost, i}<div class="vm-node" class:vm-muted={i >= step}>
        <span>Step {i + 1}</span><strong
          >{i < step ? `Cost ${cost} bps` : 'Not executed yet'}</strong
        ><span>{i < step ? `Reward −${cost}` : 'Inventory still open'}</span><span
          >{i < step ? `${Math.round(((2 - i) / 3) * 100)}% inventory remains` : ''}</span
        >
      </div>{/each}
  </div>
  <div class="visual-readouts">
    <div><span>Policy reward so far</span><strong>{total(rewards)} bps</strong></div>
    <div><span>TWAP cost so far</span><strong>{total(twap.slice(0, step))} bps</strong></div>
    <div>
      <span>Hindsight cost so far</span><strong>{total(hindsight.slice(0, step))} bps</strong>
    </div>
  </div>
  {#if step === 3}<p class="vm-equation">
      TWAP improvement = {fmt(total(twap) - total(policy), 2)} bps. Feasible hindsight regret = {fmt(
        total(policy) - total(hindsight),
        2,
      )} bps.
    </p>{:else}<p class="visual-feedback">
      The order is incomplete. A smaller accumulated cost at this point cannot establish a better
      completed-order policy.
    </p>{/if}
  <p>
    {givens?.costs
      ? 'Policy costs use this exercise, converted from dollars to basis points. Baseline and hindsight totals are allocated evenly across steps for illustration.'
      : 'The per-step cost decomposition is a supplied illustration matching the lesson totals.'} All
    schedules execute the same order; the hindsight comparator has later information.
  </p>
{:else if number === 37}
  <div class="visual-tabs">
    {#each ['Task success', 'Verification', 'Unsafe attempts', 'Unsafe execution', 'Tool errors'] as label, i}<button
        aria-pressed={tab === i}
        onclick={() => (tab = i)}>{label}</button
      >{/each}
  </div>
  <div class="visual-readouts">
    <div>
      <span
        >{[
          'Correct completion and checks',
          'Passed field checks',
          'Tasks with unsafe attempt',
          'Tasks with unsafe execution',
          'Errors per tool call',
        ][tab]}</span
      ><strong
        >{tab === 0
          ? `${completed}/${tasks} = ${pct(completed / tasks)}`
          : tab === 1
            ? `${verified}/${tasks} = ${pct(verified / tasks)}`
            : tab === 2
              ? `${unsafe}/${tasks} = ${pct(unsafe / tasks)}`
              : tab === 3
                ? `${executed}/${tasks} = ${pct(executed / tasks)}`
                : givens?.calls
                  ? `${val('errors', 0)}/${val('calls', 1)} = ${pct(val('errors', 0) / val('calls', 1))}`
                  : 'Tool-call total not supplied'}</strong
      >
    </div>
  </div>
  <p>
    Illustrative traces below explain the overlap; they are not a sample from which the aggregate
    rates above were computed.
  </p>
  <div class="vm-audit">
    {#each traces as trace, i}<button aria-pressed={selected === i} onclick={() => (selected = i)}
        ><strong>{trace.name}</strong><span>{trace.done ? '✓ Complete' : '○ Unfinished'}</span><span
          >{trace.verified ? '✓ Fields verified' : '× Verification incomplete'}</span
        ><span>{trace.attempt ? '! Unsafe attempt BLOCKED' : 'No unsafe attempt'}</span><span
          >{trace.error ? '× Tool error' : 'No tool error'}</span
        ></button
      >{/each}
  </div>
  <p class="visual-feedback">{traces[selected].detail}</p>
  <p>
    Zero unauthorized executions can coexist with unsafe attempts. Field verification can succeed
    while completion fails.
  </p>
{:else if number === 38}
  <label class="vm-control"
    >Move share from current bin 1 into the last bin <input
      type="range"
      min="-.1"
      max=".1"
      step=".01"
      bind:value={transfer}
    /><output>{fmt(transfer * 100, 0)} percentage points</output></label
  >
  <div class="vm-bin-grid">
    {#each expected as e, i}<div class="vm-node">
        <strong>Fixed bin {i + 1}</strong>
        <div class="vm-pairbars">
          <div style:height={`${e * 180}px`}><span>E {pct(e, 0)}</span></div>
          <div style:height={`${actual[i] * 180}px`}><span>A {pct(actual[i], 0)}</span></div>
        </div>
        <span>Contribution {fmt(contributions[i], 4)}</span>
      </div>{/each}
  </div>
  <p class="vm-equation">PSI = Σ (A − E) ln(A / E) = {fmt(psi(expected, actual), 4)}</p>
  <p>
    Reference E sums to {pct(total(expected), 0)}; current A sums to {pct(total(actual), 0)}. Bin
    boundaries stay fixed. {actual.some((a) => a <= 0)
      ? 'A bin is zero: PSI is undefined here. Choose and disclose a smoothing or bin-merging rule before calculation.'
      : 'All shares are positive; no smoothing is applied.'}
  </p>
{:else}
  <div class="visual-tabs">
    {#each ['Latency', 'Throughput and review load', 'Cost', 'Availability'] as label, i}<button
        aria-pressed={tab === i}
        onclick={() => (tab = i)}>{label}</button
      >{/each}
  </div>
  {#if tab === 0}<label class="vm-check"
      ><input type="checkbox" bind:checked={slow} /> Slow every tail request to 1,000 ms</label
    >
    <svg
      class="vm-plot"
      viewBox="0 0 500 275"
      role="img"
      aria-label="Sorted response times with the caller deadline"
      ><path d="M35 20V220H470" class="vm-axis" /><polyline
        points={latencies
          .map(
            (v, i) =>
              `${40 + (420 * i) / (latencies.length - 1)},${220 - (v * 180) / Math.max(...latencies)}`,
          )
          .join(' ')}
        class="vm-line"
      /><line
        x1="40"
        x2="460"
        y1={220 - (val('deadline', 100) * 180) / Math.max(...latencies)}
        y2={220 - (val('deadline', 100) * 180) / Math.max(...latencies)}
        class="vm-dash"
      /><text x="45" y="20">Latency ms; dashed deadline {val('deadline', 100)} ms</text><text
        x="130"
        y="256">Requests sorted fastest → slowest</text
      ></svg
    >
    <div class="visual-readouts">
      <div><span>Mean</span><strong>{fmt(average(latencies), 1)} ms</strong></div>
      <div><span>p95</span><strong>{percentile(latencies, 0.95)} ms</strong></div>
      <div><span>p99</span><strong>{percentile(latencies, 0.99)} ms</strong></div>
      <div>
        <span>After deadline</span><strong
          >{pct(
            latencies.filter((t) => t > val('deadline', 100)).length / latencies.length,
          )}</strong
        >
      </div>
    </div>
    <p>
      Nearest-rank percentile = sorted position ceil(p × N). {givens?.counts
        ? 'This exercise supplies the latency groups.'
        : 'Initial teaching distribution: 94 at 30 ms, 5 at 180 ms, 1 at 280 ms; mean 40 ms and p95 180 ms match the lesson.'}
    </p>
  {:else if tab === 1}<div class="visual-tabs">
      <button aria-pressed={queueKind === 0} onclick={() => (queueKind = 0)}>Human queue</button
      ><button aria-pressed={queueKind === 1} onclick={() => (queueKind = 1)}>API queue</button>
    </div>
    {#if queueKind === 0}<label class="vm-control"
        >Change analyst count <input
          type="range"
          min={-val('analysts', 400)}
          max="1000"
          step="1"
          bind:value={analystChange}
        /><output>{analysts} analysts</output></label
      >
      <div class="vm-tray">
        <div class="vm-node">New alerts<strong>{fmt(alerts, 0)} / day</strong></div>
        <span>→</span>
        <div class="vm-node">
          Human capacity<strong>{analysts} × {pace} = {fmt(analysts * pace, 0)} / day</strong>
        </div>
        <span>→</span>
        <div class="vm-node">
          New daily backlog<strong>{fmt(Math.max(0, alerts - analysts * pace), 0)}</strong>
        </div>
      </div>
      <p>
        With no initial backlog, {val('days', 3)} days add {fmt(
          Math.max(0, alerts - analysts * pace) * val('days', 3),
          0,
        )} cases. Faster API responses cannot clear this human queue.
      </p>
      <p>Required cases per analyst per day to keep up = {fmt(ratio(alerts, analysts), 2)}.</p>
    {:else}<label class="vm-control"
        >Add incoming API requests per second <input
          type="range"
          min="-100"
          max="200"
          bind:value={arrivalChange}
        /><output>{apiArrival + arrivalChange} requests/s</output></label
      >
      <div class="vm-tray">
        <div class="vm-node">Arrivals<strong>{apiArrival + arrivalChange}/s</strong></div>
        <span>→</span>
        <div class="vm-node">Service capacity<strong>{apiCapacity}/s</strong></div>
        <span>→</span>
        <div class="vm-node">
          Backlog after {val('minutes', 10)} min<strong
            >{fmt(
              Math.max(0, apiArrival + arrivalChange - apiCapacity) * val('minutes', 10) * 60,
              0,
            )}</strong
          >
        </div>
      </div>
      <p>
        Empty initial queue, no drops, and constant sustained capacity. Time conversions use 60
        seconds per minute.
      </p>{/if}
  {:else if tab === 2}<label class="vm-control"
      >Change cost per manual review <input
        type="range"
        min="-3"
        max="7"
        step=".5"
        bind:value={reviewChange}
      /><output>${fmt(reviewCost, 2)}</output></label
    >
    <div class="vm-tray">
      <div class="vm-node">
        {requests} requests<strong>Model spend ${spend}</strong><span>Includes abstentions</span>
      </div>
      <span>→</span>
      <div class="vm-node">
        {requests - abstained} automatic answers<strong>{val('autoCorrect', 800)} correct</strong>
      </div>
      <span>+</span>
      <div class="vm-node">
        {abstained} human reviews<strong>${fmt(abstained * reviewCost, 2)}</strong><span
          >All reviewed cases correct (assumed)</span
        >
      </div>
    </div>
    <div class="visual-readouts">
      <div><span>Total workflow cost</span><strong>${fmt(cost, 2)}</strong></div>
      <div><span>Per incoming request</span><strong>${fmt(cost / requests, 3)}</strong></div>
      <div>
        <span>Per correctly resolved request</span><strong>${fmt(cost / correct, 3)}</strong>
      </div>
      <div>
        <span>Automatic-answer accuracy</span><strong
          >{pct(val('autoCorrect', 800) / (requests - abstained))}</strong
        >
      </div>
    </div>
    <p>
      Abstention: {pct(abstained / requests)}. Automatic coverage: {pct(1 - abstained / requests)}.
      These M39c exercise values illustrate full workflow accounting; downstream harm is excluded.
      Separately, the lesson’s monthly inference-only budget is 50 million × $0.003 = $150,000.
    </p>
  {:else}<label class="vm-control"
      >Monthly availability target <select bind:value={objective}
        ><option value={0.99}>99%</option><option value={0.999}>99.9%</option><option value={0.9999}
          >99.99%</option
        ></select
      ></label
    >
    <div
      class="vm-days vm-month"
      aria-label="Thirty day month; final day contains the ninety-minute outage"
    >
      {#each Array.from({ length: 30 }) as _, i}<span
          class:vm-bad={i === 29}
          title={i === 29 ? `${downtime} minutes unavailable` : 'Available day'}>{i + 1}</span
        >{/each}
    </div>
    <div class="vm-tray">
      <div class="vm-node">Scheduled time<strong>{fmt(scheduled, 0)} min</strong></div>
      <span>−</span>
      <div class="vm-node">Unavailable<strong>{downtime} min</strong></div>
      <span>→</span>
      <div class="vm-node">
        Time availability<strong>{pct((scheduled - downtime) / scheduled, 4)}</strong>
      </div>
    </div>
    <p class="vm-equation">
      Allowed downtime = {fmt(scheduled * (1 - objective), 2)} min; excess = {fmt(
        Math.max(0, downtime - scheduled * (1 - objective)),
        2,
      )} min.
    </p>
    <p>
      The timeline places the supplied outage in the last day for illustration. This is time-based
      availability over a continuously scheduled month, not request success rate.
    </p>{/if}
{/if}
