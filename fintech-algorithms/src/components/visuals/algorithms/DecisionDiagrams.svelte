<script lang="ts">
  import type { Givens, Value } from '../../../engine/types';
  import {
    exactLoanDistribution,
    portfolioPoints,
    simulateLoanLosses,
  } from '../../../data/algorithm-visuals';
  import { number as f, percent as pct, money } from './helpers';
  let {
    slug,
    g,
    values: v,
    step = 0,
    method = 0,
    choice = 0,
    term = '',
  }: {
    slug: string;
    g: Givens;
    values: Record<string, Value>;
    step?: number;
    method?: number;
    choice?: number;
    term?: string;
  } = $props();
  const correlation = $derived(method === 3 && choice === 1 ? 0.8 : 0);
  const allocationGivens = $derived(
    method === 4 && choice === 1 ? { ...g, bondReturn: Number(g.bondReturn) + 0.01 } : g,
  );
  const originalBest = $derived(
    slug === 'optimization'
      ? portfolioPoints(g)
          .filter((p) => p.feasible)
          .sort((a, b) => a.variance - b.variance)[0]
      : undefined,
  );
  const allocations = $derived(
    slug === 'optimization' ? portfolioPoints(allocationGivens, correlation) : [],
  );
  const feasible = $derived(allocations.filter((p) => p.feasible));
  const best = $derived([...feasible].sort((a, b) => a.variance - b.variance)[0]);
  const continuous = $derived(
    slug === 'optimization'
      ? portfolioPoints(
          { ...allocationGivens, weights: Array.from({ length: 41 }, (_, i) => i / 40) },
          correlation,
        )
      : [],
  );
  const xr = (risk: number) =>
    55 + (risk / Math.max(Number(g.stockVol) || 0.2, Number(g.bondVol) || 0.05)) * 435;
  const returnMin = $derived(Math.min(0, Number(g.stockReturn ?? 0), Number(g.bondReturn ?? 0)));
  const returnMax = $derived(
    Math.max(0.01, Number(g.stockReturn ?? 0), Number(g.bondReturn ?? 0), Number(g.minimum ?? 0)) *
      1.1,
  );
  const yr = (ret: number) => 245 - ((ret - returnMin) / (returnMax - returnMin)) * 180;
  const qTarget = $derived(method === 1 ? Number(g.reward) : Number(v.target));
  const qUpdated = $derived(Number(g.old) + Number(g.alpha) * (qTarget - Number(g.old)));
  const qNums = $derived([Number(g.old ?? 0), qTarget, qUpdated, Number(g.wait ?? 0)]);
  const qMin = $derived(Math.min(0, ...qNums) - 1);
  const qMax = $derived(Math.max(0, ...qNums) + 1);
  const qx = (n: number) => 45 + ((n - qMin) / (qMax - qMin)) * 470;
  const distribution = $derived(
    slug === 'monte-carlo' ? exactLoanDistribution(g, method === 2) : null,
  );
  const independent = $derived(slug === 'monte-carlo' ? exactLoanDistribution(g, false) : null);
  const draws = $derived((g.draws as number[]) ?? []);
  const run = $derived(Math.min(Math.floor(draws.length / 2) - 1, Math.max(0, choice)));
  const losses = $derived((v.losses as number[]) ?? []);
  const countLoss = $derived(
    distribution?.losses.map((loss) => losses.filter((v) => v === loss).length) ?? [],
  );
  const maxProbability = $derived(Math.max(0.01, ...(distribution?.probabilities ?? [])));
  const simulation = $derived(
    slug === 'monte-carlo' && method === 4 ? simulateLoanLosses(g, Math.max(100, choice)) : null,
  );
  const convergenceMax = $derived(
    Math.max(
      1,
      Number(v.analytical ?? 0) * 1.2,
      ...(simulation?.checkpoints.map((p) => p.mean) ?? []),
    ),
  );
</script>

<div class="algorithm-diagram">
  {#if slug === 'optimization'}
    {#if method === 2}
      {@const cap = choice === 1 ? 0.3 : 0.2}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Allocation caps and infeasibility"
      >
        <svg
          viewBox="0 0 560 290"
          role="img"
          aria-label="Four asset caps are stacked against the fully invested requirement"
        >
          <text x="25" y="28" class="bold">Four asset caps of {pct(cap)} each</text>
          {#each [0, 1, 2, 3] as i}<rect
              x={45 + i * cap * 370}
              y="105"
              width={cap * 370 - 2}
              height="58"
              class={i % 2 ? 'b' : 'a'}
            /><text x={45 + (i + 0.5) * cap * 370} y="140" text-anchor="middle" class="white"
              >{pct(cap)}</text
            >{/each}
          <line x1="415" x2="415" y1="70" y2="190" class="link-gold dash" /><text x="386" y="215"
            >100%</text
          ><text x="45" y="215">0%</text>
          <text x="280" y="260" text-anchor="middle"
            >{cap * 4 < 1
              ? 'Only 80% capacity: full investment is impossible.'
              : '120% total capacity: the cap conflict is removed.'}</text
          >
        </svg>
      </div>
      <p class="diagram-note">
        This is a separate four-asset constraint illustration. Total cap capacity of at least 100%
        removes this conflict but does not guarantee that every other return, risk, and liquidity
        requirement is feasible.
      </p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Risk return feasible allocation diagram"
      >
        <svg
          viewBox="0 0 560 330"
          role="img"
          aria-label="Portfolio choices in risk return space with the required return separating feasible and infeasible choices"
        >
          <text x="25" y="27" class="bold">Expected return vs volatility</text>
          <rect
            x="45"
            y="48"
            width="465"
            height={Math.max(0, yr(Number(g.minimum)) - 48)}
            fill="var(--green-soft,#edf5ee)"
          />
          <line x1="45" x2="510" y1="245" y2="245" class="axis" /><line
            x1="45"
            x2="45"
            y1="48"
            y2="245"
            class="axis"
          />
          <line
            x1="45"
            x2="510"
            y1={yr(Number(g.minimum))}
            y2={yr(Number(g.minimum))}
            class="link-gold dash"
            class:selected={term === 'constraint'}
          /><text x="225" y={yr(Number(g.minimum)) - 9} class="tiny"
            >Required return {pct(g.minimum)}</text
          >
          <path
            d={continuous
              .map((p, i) => `${i ? 'L' : 'M'}${xr(p.volatility)},${yr(p.expectedReturn)}`)
              .join(' ')}
            class="link"
          />
          {#each allocations as p}
            <circle
              cx={xr(p.volatility)}
              cy={yr(p.expectedReturn)}
              r={best?.weight === p.weight ? 9 : 6}
              class={p.feasible ? 'a' : 'b'}
              class:selected={best?.weight === p.weight && step >= 3}
            /><text x={xr(p.volatility) + 14} y={yr(p.expectedReturn) + 5} class="tiny"
              >{pct(p.weight)} stocks</text
            >
          {/each}
          {#if method === 1}
            {@const p = portfolioPoints({ ...g, weights: [choice / 100] }, 0)[0]}
            <path
              d={`M${xr(p.volatility)},${yr(p.expectedReturn) - 10} l10,10 l-10,10 l-10,-10 Z`}
              class="c"
            />
          {/if}
          <text x="50" y="273" class="tiny">0% risk</text><text x="390" y="273" class="tiny"
            >Volatility →</text
          ><text x="25" y="300" class="tiny">Green: feasible · gold: below return requirement</text>
        </svg>
      </div>
      <div class="diagram-table">
        <table>
          <caption>Allowed choices · covariance assumption: correlation {correlation}</caption
          ><thead
            ><tr
              ><th>Stocks</th><th>Return</th><th>Variance</th><th>Volatility</th><th>Status</th></tr
            ></thead
          ><tbody
            >{#each allocations as p}<tr class:emphasis={best?.weight === p.weight}
                ><td>{pct(p.weight)}</td><td>{pct(p.expectedReturn)}</td><td>{f(p.variance, 5)}</td
                ><td>{pct(p.volatility)}</td><td
                  >{!p.feasible
                    ? 'Below required return'
                    : best?.weight === p.weight
                      ? 'Least variance among feasible choices'
                      : 'Feasible'}</td
                ></tr
              >{/each}</tbody
          >
        </table>
      </div>
      <p class="diagram-note">
        {best
          ? `Selected allowed allocation: ${pct(best.weight)} stocks (${money(best.weight * Number(g.portfolio))}) and ${pct(1 - best.weight)} bonds (${money((1 - best.weight) * Number(g.portfolio))}).`
          : 'No allowed allocation meets the return requirement. Report infeasibility instead of interpreting a returned weight as a solution.'}
        The curve supplies context; the exercise chooses only among its listed weights.
      </p>
      {#if method === 4 && originalBest && best}<p class="method-context">
          Bond expected return: {pct(g.bondReturn)} → {pct(allocationGivens.bondReturn)}. The
          required return remains {pct(g.minimum)}. Selected stock weight changes from {pct(
            originalBest.weight,
          )} to {pct(best.weight)}; maximum absolute weight change = {pct(
            Math.abs(best.weight - originalBest.weight),
          )}; one-way turnover = {pct(Math.abs(best.weight - originalBest.weight))}, defined as half
          the sum of absolute stock and bond weight changes. This sensitivity result reflects an
          estimate change, not a realized return.
        </p>{/if}
      {#if method === 1}<p class="diagram-note">
          Blue diamond: separate continuous exploration at {choice}% stocks. It does not change the
          exercise’s finite allowed set or its selected optimum.
        </p>{/if}
      {#if method === 3}<p class="diagram-note">
          The correlation comparison adds 2w(1−w)σstockσbondρ to variance. With two assets, ρ = 0
          and ρ = 0.8 are valid covariance models. Return constraints stay unchanged while
          diversification benefit changes.
        </p>{/if}
    {/if}
  {:else if slug === 'reinforcement-learning'}
    {#if method === 2}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Execution inventory schedule"
      >
        <svg
          viewBox="0 0 560 315"
          role="img"
          aria-label="TWAP executes equal quantities while a supplied VWAP schedule follows interval volumes"
        >
          <text x="25" y="28" class="bold"
            >Separate illustration · 10 inventory units, 5 intervals</text
          >
          {#each [2, 2, 2, 2, 2] as quantity, i}
            <rect
              x={55 + i * 97}
              y={139 - quantity * 22}
              width="30"
              height={quantity * 22}
              class="a"
            />
            <rect
              x={91 + i * 97}
              y={139 - [1, 1, 2, 3, 3][i] * 22}
              width="30"
              height={[1, 1, 2, 3, 3][i] * 22}
              class="b"
            />
            <text x={85 + i * 97} y="161" text-anchor="middle" class="tiny">Interval {i + 1}</text>
            <text x={85 + i * 97} y="202" text-anchor="middle" class="tiny"
              >{10 - (i + 1) * 2} / {10 -
                [1, 1, 2, 3, 3].slice(0, i + 1).reduce((s, x) => s + x, 0)}</text
            >
          {/each}
          <text x="30" y="235" class="tiny">Remaining inventory: TWAP / supplied VWAP</text><text
            x="30"
            y="265"
            class="tiny">Green: equal slices · gold: shares follow known volume weights</text
          ><text x="30" y="294" class="tiny"
            >The Q-update below is separate; this is not a learned execution policy.</text
          >
        </svg>
      </div>
    {:else if method === 3}
      <div class="process-cards">
        <div>
          <strong>Execute quickly</strong><span>Can increase immediate market impact.</span>
        </div>
        <div>
          <strong>Wait</strong><span>Changes future inventory, prices, and completion risk.</span>
        </div>
        <div class="active">
          <strong>Reward must capture the objective</strong><span
            >− execution cost − impact − incomplete-order penalty</span
          ><span>Add an explicit risk penalty if risk is part of the objective.</span>
        </div>
      </div>
      <p class="diagram-note">
        Removing an incomplete-order penalty can reward doing too little. Zero-mean inventory noise
        alone does not make a risk-neutral expected-reward objective penalize variance. Compare
        completion and tail costs across many seeds.
      </p>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
    <div
      class="diagram-scroll"
      role="region"
      tabindex="0"
      aria-label="Q-learning target and update"
    >
      <svg
        viewBox="0 0 560 335"
        role="img"
        aria-label="An old Q-value moves toward a target by alpha times the temporal difference error"
      >
        <text x="25" y="27" class="bold"
          >{method === 1 ? 'Terminal' : 'Nonterminal'} Q-learning update · reward units</text
        >
        <rect
          x="30"
          y="47"
          width="225"
          height="73"
          rx="8"
          class="node"
          class:selected={step === 0 || term === 'reward'}
        /><text x="45" y="72">Immediate reward: {g.reward}</text><text x="45" y="98" class="tiny"
          >{method === 1
            ? 'No next action after termination'
            : `Best next Q: ${f(v.best)} × γ ${g.gamma}`}</text
        >
        <path d="M257,82 L307,82" class="link" /><text x="277" y="75">→</text><rect
          x="313"
          y="47"
          width="218"
          height="73"
          rx="8"
          class="gold-node"
          class:selected={step === 1 || term === 'target'}
        /><text x="332" y="75">Target = {f(qTarget)}</text><text x="332" y="101" class="tiny"
          >{method === 1 ? 'reward only' : `${g.reward} + ${g.gamma} × ${f(v.best)}`}</text
        >
        <line x1="40" x2="520" y1="202" y2="202" class="axis" />
        <line x1={qx(0)} x2={qx(0)} y1="179" y2="218" class="axis" /><text
          x={qx(0)}
          y="240"
          text-anchor="middle">0</text
        >
        <line x1={qx(Number(g.old))} x2={qx(qTarget)} y1="165" y2="165" class="link-gold" /><text
          x={(qx(Number(g.old)) + qx(qTarget)) / 2}
          y="148"
          text-anchor="middle"
          class="tiny">Error {f(qTarget - Number(g.old))}</text
        >
        {#each [{ name: 'Old', value: Number(g.old), row: 0 }, { name: 'Updated', value: qUpdated, row: 1 }, { name: 'Target', value: qTarget, row: 2 }] as item}
          <circle
            cx={qx(item.value)}
            cy="202"
            r={item.name === 'Updated' ? 9 : 6}
            class={item.name === 'Updated' ? 'c' : item.name === 'Old' ? 'a' : 'b'}
          /><line
            x1={qx(item.value)}
            x2={qx(item.value)}
            y1="210"
            y2={247 + item.row * 26}
            class="axis"
          /><text x={qx(item.value)} y={264 + item.row * 26} text-anchor="middle" class="tiny"
            >{item.name}: {f(item.value)}</text
          >
        {/each}
      </svg>
    </div>
    <div class="diagram-metrics">
      <span>Learning rate<strong>α = {g.alpha}</strong></span><span
        >Update<strong>{g.old} + {g.alpha} × {f(qTarget - Number(g.old))} = {f(qUpdated)}</strong
        ></span
      ><span
        >Compared with waiting ({g.wait})<strong
          >{qUpdated >= Number(g.wait)
            ? 'Updated action is at least as valuable'
            : 'Waiting has greater value'}</strong
        ></span
      >
    </div>
    <p class="diagram-note">
      Q-values are in the reward’s units, not probabilities. The illustrative single update does not
      establish a profitable or safe policy. Terminal mode changes the bootstrap target to reward
      only and recomputes the update.
    </p>
  {:else if distribution && independent}
    {#if method === 0}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Default draws and scenario loss"
      >
        <svg
          viewBox="0 0 560 275"
          role="img"
          aria-label="Each supplied uniform draw is compared to PD; defaulting loans contribute exposure times LGD to the selected scenario"
        >
          <text x="25" y="27" class="bold">Supplied run {run + 1} of {draws.length / 2}</text>
          {#each [0, 1] as i}
            {@const draw = draws[run * 2 + i]}
            {@const defaults = draw < Number(g.PD)}
            <text x="25" y={76 + i * 91}>Loan {i ? 'B' : 'A'}</text><rect
              x="115"
              y={57 + i * 91}
              width="330"
              height="15"
              fill="var(--green-soft,#edf5ee)"
            /><rect
              x="115"
              y={57 + i * 91}
              width={Number(g.PD) * 330}
              height="15"
              fill="var(--gold-soft,#f8ebcc)"
            />
            <line
              x1={115 + Number(g.PD) * 330}
              x2={115 + Number(g.PD) * 330}
              y1={44 + i * 91}
              y2={85 + i * 91}
              class="link-gold"
            /><circle cx={115 + draw * 330} cy={64 + i * 91} r="7" class={defaults ? 'b' : 'a'} />
            <text x="115" y={106 + i * 91} class="tiny"
              >draw {f(draw, 3)}
              {defaults ? '<' : '≥'} PD {f(g.PD)} → {defaults
                ? `default → ${money(v.lossOnDefault)}`
                : 'no default → $0'}</text
            >
          {/each}
          <text x="280" y="250" text-anchor="middle" class="bold"
            >Run loss {money(losses[run])} · {losses[run] > Number(g.reserve)
              ? 'breaches'
              : 'does not breach'} reserve {money(g.reserve)}</text
          >
        </svg>
      </div>
      <div class="diagram-table">
        <table>
          <caption>Same supplied draws as the exercise</caption><thead
            ><tr><th>Run</th><th>Draw A / B</th><th>Loss</th><th>Loss &gt; reserve?</th></tr></thead
          ><tbody
            >{#each losses as loss, i}<tr class:emphasis={i === run}
                ><td>{i + 1}</td><td>{f(draws[i * 2], 3)} / {f(draws[i * 2 + 1], 3)}</td><td
                  >{money(loss)}</td
                ><td>{loss > Number(g.reserve) ? 'Yes' : 'No'}</td></tr
              >{/each}</tbody
          >
        </table>
      </div>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
    <div class="diagram-scroll" role="region" tabindex="0" aria-label="Portfolio loss distribution">
      <svg
        viewBox="0 0 560 330"
        role="img"
        aria-label={method === 2
          ? 'Exact loss distribution under completely shared defaults'
          : 'Exact loss distribution for two independent loans compared with supplied scenarios'}
      >
        <text x="25" y="27" class="bold"
          >{method === 2 ? 'Perfectly shared defaults' : 'Independent defaults'} · exact model distribution</text
        >
        <line x1="40" x2="525" y1="245" y2="245" class="axis" />
        {#each distribution.losses as loss, i}
          {@const probability = distribution.probabilities[i]}
          <rect
            x={65 + i * 170}
            y={245 - (probability / maxProbability) * 160}
            width="85"
            height={Math.max(1, (probability / maxProbability) * 160)}
            class={loss > Number(g.reserve) ? 'b' : 'a'}
            class:selected={term === 'probability'}
          />
          <text
            x={107 + i * 170}
            y={233 - (probability / maxProbability) * 160}
            text-anchor="middle">{pct(probability)}</text
          ><text x={107 + i * 170} y="269" text-anchor="middle">{money(loss)}</text>
          {#if method === 0}<text x={107 + i * 170} y="293" text-anchor="middle" class="tiny"
              >Sample: {countLoss[i]} / {losses.length}</text
            >{/if}
        {/each}
        <text x="25" y="320" class="tiny"
          >Gold bars: loss strictly exceeds the {money(g.reserve)} reserve.</text
        >
      </svg>
    </div>
    <div class="diagram-metrics">
      <span>Model expected loss<strong>{money(distribution.mean)}</strong></span><span
        >Exact breach probability<strong>{pct(distribution.breach)}</strong></span
      ><span>Supplied sample<strong>Mean {money(v.mean)} · breach {pct(v.breach)}</strong></span>
    </div>
    {#if method === 2}<p class="method-context">
        Extreme positive-dependence comparison: both loans use the same uniform draw, so they
        default together. Each still has PD {pct(g.PD)} and expected loss remains {money(
          independent.mean,
        )}. Independent breach probability {pct(independent.breach)} becomes {pct(
          distribution.breach,
        )}. The supplied sample table and sample readouts still describe the original
        independent-draw exercise.
      </p>{/if}
    {#if method === 3}<p class="method-context">
        95% VaR = <strong>{money(distribution.valueAtRisk)}</strong>, using the smallest loss whose
        cumulative probability reaches 95%. ES =
        <strong>{money(distribution.expectedShortfall)}</strong>, averaging exactly the worst 5%
        probability mass and taking only the required share of a tied loss value.
      </p>{/if}
    {#if simulation}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Simulation convergence against analytical expected loss"
      >
        <svg
          viewBox="0 0 560 290"
          role="img"
          aria-label="Running simulated mean compared with the analytical expected loss"
        >
          <text x="25" y="28" class="bold"
            >Seed 7 · {simulation.runs.toLocaleString()} independent runs</text
          >
          <line x1="45" x2="515" y1="235" y2="235" class="axis" />
          <line
            x1="45"
            x2="515"
            y1={235 - (distribution.mean / convergenceMax) * 165}
            y2={235 - (distribution.mean / convergenceMax) * 165}
            class="link-gold dash"
          />
          <path
            d={simulation.checkpoints
              .map(
                (p, i) =>
                  `${i ? 'L' : 'M'}${45 + (p.runs / simulation.runs) * 470},${235 - (p.mean / convergenceMax) * 165}`,
              )
              .join(' ')}
            class="link"
          />
          <text x="48" y="263" class="tiny">0 runs</text><text x="385" y="263" class="tiny"
            >{simulation.runs.toLocaleString()} runs</text
          >
          <text x="48" y="55" class="tiny"
            >Gold: analytical {money(distribution.mean)} · green: running sample mean</text
          >
        </svg>
      </div>
      <div class="diagram-metrics">
        <span>Simulated mean<strong>{money(simulation.mean)}</strong></span><span
          >Simulated breach rate<strong>{pct(simulation.breach)}</strong></span
        ><span
          >Breach Monte Carlo SE<strong
            >{f(simulation.standardError * 100, 2)} percentage points</strong
          ></span
        >
      </div>
      <p class="diagram-note">
        The deterministic seed keeps repeated runs comparable. Sampling error may fluctuate as run
        count grows; convergence is not monotonic. The standard error is √[p̂(1−p̂)/N], conditional on
        independent runs and this model.
      </p>
    {/if}
    <p class="diagram-note">
      The histogram is the exact discrete model, not a claim that five runs have converged. More
      independent runs reduce sampling noise; they do not verify PD, LGD, or the dependence
      assumption. Reserve comparisons are recomputed for the selected reserve.
    </p>
  {/if}
</div>
