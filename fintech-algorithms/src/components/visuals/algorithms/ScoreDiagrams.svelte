<script lang="ts">
  import type { Givens, Value } from '../../../engine/types';
  import { logisticContributions, sigmoidPoints } from '../../../data/algorithm-visuals';
  import { number as f, percent as pct, money, plotLine } from './helpers';
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
  const contributions = $derived(slug === 'logistic-regression' ? logisticContributions(g) : []);
  const counts = $derived((g.counts as number[]) ?? []);
  const scores = $derived((g.scores as number[]) ?? []);
  const treeTotal = $derived(counts.reduce((s, x) => s + x, 0));
  const boost = $derived([Number(g.F0 ?? 0), Number(v.F1 ?? 0), Number(v.F2 ?? 0)]);
  const low = $derived(Math.min(0, ...boost) - 0.25);
  const high = $derived(Math.max(0, ...boost) + 0.25);
  const by = (n: number) => 260 - ((n - low) / (high - low)) * 200;
</script>

<div class="algorithm-diagram">
  {#if slug === 'logistic-regression'}
    {#if method === 1}<p class="method-context">
        Regularization discourages large coefficients during fitting. The main diagram keeps the
        original exercise coefficients. The comparison underneath illustrates 50% shrinkage with the
        intercept held fixed; it is not a refitted model.
      </p>{/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
    <div
      class="diagram-scroll"
      role="region"
      tabindex="0"
      aria-label="Application contributions, sigmoid, and review policy diagram"
    >
      <svg
        viewBox="0 0 560 380"
        role="img"
        aria-label="Feature contributions add to log-odds, the sigmoid gives probability, and a separate threshold gives the review action"
      >
        <text x="20" y="25" class="bold">1 · Add signed evidence</text>
        <line x1="195" x2="195" y1="40" y2="176" class="axis" />
        {#each contributions as c, i}
          {@const value = c.value}
          <text x="18" y={62 + i * 31} class="tiny">{c.label}</text>
          <rect
            x={Math.min(195, 195 + value * 23)}
            y={47 + i * 31}
            width={Math.max(1, Math.abs(value) * 23)}
            height="21"
            class={value >= 0 ? 'a' : 'b'}
            class:selected={step === 0 || term === c.term}
          />
          <text x="277" y={62 + i * 31}>{value >= 0 ? '+' : ''}{f(value)}</text>
        {/each}
        <text x="30" y="207" class="bold">Exercise score z = {f(v.z)}</text>
        <text x="333" y="25" class="bold">2 · Convert to risk</text>
        <line x1="345" x2="540" y1="175" y2="175" class="axis" /><line
          x1="345"
          x2="345"
          y1="45"
          y2="175"
          class="axis"
        />
        <path
          d={sigmoidPoints
            .map((p, i) => `${i ? 'L' : 'M'}${345 + ((p.x + 8) / 16) * 195},${175 - p.y * 130}`)
            .join(' ')}
          class="link"
        />
        <circle
          cx={345 + ((Math.max(-8, Math.min(8, Number(v.z))) + 8) / 16) * 195}
          cy={175 - Number(v.p) * 130}
          r="7"
          class="c"
          class:selected={step === 1 || term === 'probability' || term === 'score'}
        />
        <text x="350" y="197" class="tiny">−8</text><text x="525" y="197" class="tiny">8</text><text
          x="317"
          y="55"
          class="tiny">1</text
        ><text x="317" y="177" class="tiny">0</text>
        <text x="370" y="225" class="big">{pct(v.p)} risk</text>
        <text x="20" y="265" class="bold">3 · Apply a separate review policy</text>
        <rect x="30" y="290" width="490" height="14" fill="var(--green-soft,#e4f0e7)" />
        <rect
          x={30 + Number(g.threshold) * 490}
          y="290"
          width={(1 - Number(g.threshold)) * 490}
          height="14"
          fill="var(--gold-soft,#f8ebcc)"
        />
        <line
          x1={30 + Number(g.threshold) * 490}
          x2={30 + Number(g.threshold) * 490}
          y1="278"
          y2="321"
          class="link-gold"
          class:selected={step === 4 || term === 'threshold'}
        />
        <circle cx={30 + Number(v.p) * 490} cy="297" r="7" class="c" />
        <text x="30" y="342" class="tiny">0%</text><text x="486" y="342" class="tiny">100%</text>
        <text x="165" y="343"
          >Threshold {pct(g.threshold)} · {v.decision ? 'Review' : 'Below threshold'}</text
        >
        <text x="30" y="368" class="tiny"
          >Blue dot: estimated probability · line: chosen review threshold</text
        >
      </svg>
    </div>
    <div class="diagram-metrics">
      <span class:active={step === 1}
        >Score → probability<strong>{f(v.z)} → {pct(v.p, 2)}</strong></span
      ><span class:active={step === 2 || term === 'exposure' || term === 'LGD'}
        >Loss if default<strong>{money(g.loan)} × {pct(g.LGD)} = {money(v.lossOnDefault)}</strong
        ></span
      ><span class:active={step === 3}
        >Expected loss<strong>{pct(v.p, 3)} × {money(v.lossOnDefault)} ≈ {money(v.EL)}</strong
        ></span
      >
    </div>
    {#if method === 1}<div class="process-cards">
        {#each contributions.slice(1) as contribution}<div>
            <strong>{contribution.label}</strong><span
              >Original {f(contribution.value)} → shrunk {f(contribution.value * 0.5)}</span
            >
          </div>{/each}
      </div>
      <p class="diagram-note">
        Shrunk illustrative score: {f(
          -3 + contributions.slice(1).reduce((s, c) => s + c.value * 0.5, 0),
        )}. All exercise probability, loss, and policy readouts above retain the original supplied
        coefficients.
      </p>{/if}
  {:else if slug === 'trees-and-forests'}
    {#if method === 2}
      <div class="process-cards">
        <div class="active">
          <strong>Original records</strong><span
            >{Array.from({ length: 10 }, (_, i) => i + 1).join(' · ')}</span
          >
        </div>
        <div>
          <strong>Bootstrap tree 1</strong><span>1 · 1 · 3 · 4 · 6 · 6 · 7 · 8 · 9 · 10</span>
        </div>
        <div>
          <strong>Bootstrap tree 2</strong><span>2 · 3 · 3 · 4 · 5 · 7 · 7 · 8 · 10 · 10</span>
        </div>
      </div>
      <p class="diagram-note">
        Separate ten-record illustration: sampling with replacement repeats some record IDs and
        omits others. Random feature subsets further vary the trees. These sample IDs do not
        generate the exercise’s supplied scores.
      </p>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
    <div
      class="diagram-scroll"
      role="region"
      tabindex="0"
      aria-label="Decision tree and forest process"
    >
      <svg
        viewBox="0 0 560 360"
        role="img"
        aria-label="Parent records split into new and trusted devices, with child impurity weighted by group size"
      >
        <path d="M280,82 L143,140 M280,82 L417,140" class="link" />
        <rect
          x="170"
          y="15"
          width="220"
          height="70"
          rx="8"
          class="node"
          class:selected={term === 'parent'}
        />
        <text x="280" y="40" text-anchor="middle" class="bold">Parent: {treeTotal} records</text>
        <text x="280" y="66" text-anchor="middle"
          >{counts[0] + counts[2]} fraud · {counts[1] + counts[3]} legitimate</text
        >
        <text x="94" y="122" class="tiny">New device?</text><text x="385" y="122" class="tiny"
          >Trusted device?</text
        >
        {#each [0, 1] as child}
          {@const x = child ? 322 : 48}
          {@const fraud = counts[child * 2]}
          {@const legitimate = counts[child * 2 + 1]}
          <rect
            {x}
            y="143"
            width="190"
            height="94"
            rx="8"
            class="node"
            class:selected={choice === child && step >= 1}
          />
          <text x={x + 95} y="165" text-anchor="middle" class="bold"
            >{child ? 'Trusted' : 'New'} device</text
          >
          <rect
            x={x + 10}
            y="179"
            width={(170 * fraud) / (fraud + legitimate)}
            height="16"
            class="b"
          />
          <rect
            x={x + 10 + (170 * fraud) / (fraud + legitimate)}
            y="179"
            width={(170 * legitimate) / (fraud + legitimate)}
            height="16"
            class="a"
          />
          <text x={x + 95} y="218" text-anchor="middle" class="tiny"
            >{fraud} fraud / {legitimate} legitimate · n={fraud + legitimate}</text
          >
        {/each}
        <text x="280" y="270" text-anchor="middle"
          >Weighted Gini: {f(v.weighted, 4)} · reduction: {f(v.gain, 4)}</text
        >
        <text x="30" y="305" class="bold">Forest</text>
        {#each scores as score, i}
          <rect x={100 + i * 100} y="287" width="82" height="48" rx="7" class="gold-node" />
          <text x={141 + i * 100} y="306" text-anchor="middle" class="tiny">Tree {i + 1}</text><text
            x={141 + i * 100}
            y="325"
            text-anchor="middle">{f(score)}</text
          >
        {/each}
        <text x="430" y="306">→ Mean</text><text x="445" y="330" class="big">{f(v.score)}</text>
      </svg>
    </div>
    <div class="diagram-metrics">
      <span
        >Child contributions<strong
          >{f((counts[0] + counts[1]) / treeTotal)} × {f(v.newGini, 3)} + {f(
            (counts[2] + counts[3]) / treeTotal,
          )} × {f(v.trustedGini, 3)}</strong
        ></span
      ><span
        >At threshold {f(g.threshold)}<strong
          >Forest: {v.decision ? 'review' : 'below threshold'}</strong
        >First tree: {v.firstDecision ? 'review' : 'below threshold'}</span
      >
    </div>
    <p class="diagram-note">
      Gold = fraud; green = legitimate. Each child bar shows its own composition; the printed n and
      equation supply the group-size weighting. The supplied forest scores are separate from this
      one split.
    </p>
  {:else}
    {#if method === 1}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Early stopping teaching example"
      >
        <svg
          viewBox="0 0 560 320"
          role="img"
          aria-label="Illustrative training loss continues down while validation loss reaches a minimum then rises"
        >
          <text x="30" y="25" class="bold">Separate early-stopping illustration</text>
          <path
            d={plotLine(
              [0.7, 0.54, 0.43, 0.34, 0.27, 0.21, 0.17, 0.14],
              45,
              265,
              460,
              205,
              [0, 0.8],
            )}
            class="link"
          />
          <path
            d={plotLine(
              [0.72, 0.58, 0.5, 0.46, 0.45, 0.48, 0.52, 0.58],
              45,
              265,
              460,
              205,
              [0, 0.8],
            )}
            class="link-gold"
          />
          <line x1="308" x2="308" y1="60" y2="265" class="link dash" /><text x="320" y="91"
            >Stop near the</text
          ><text x="320" y="113">validation minimum</text>
          <text x="35" y="294">Trees added →</text><text x="355" y="270">Training</text><text
            x="420"
            y="135">Validation</text
          >
        </svg>
      </div>
      <p class="diagram-note">
        Supplied loss curves illustrate the principle; they are not training results from A03.
        Select stopping on validation data, then evaluate the frozen model on untouched test data.
      </p>
    {:else if method === 2}
      <div class="process-cards">
        <div>
          <strong>Random forest</strong><span>Parallel trees → average predictions</span><span
            >Different bootstrap samples and feature choices</span
          >
        </div>
        <div class="active">
          <strong>Gradient boosting</strong><span>Start → correction 1 → correction 2 → sum</span
          ><span>Each new tree improves the accumulated model’s loss</span>
        </div>
      </div>
    {:else if method === 3}
      <div class="process-cards">
        <div>
          <strong>XGBoost</strong><span
            >A gradient-boosting implementation with regularization and tree-building options.</span
          >
        </div>
        <div>
          <strong>LightGBM</strong><span
            >An implementation commonly using histogram-based, leaf-wise tree growth.</span
          >
        </div>
        <div>
          <strong>CatBoost</strong><span
            >An implementation with specific handling for categorical features.</span
          >
        </div>
      </div>
      <p class="diagram-note">
        All belong to the boosted-tree family. This arithmetic walkthrough teaches additive
        corrections; it does not run any of these libraries or imply identical training behavior.
      </p>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
    <div class="diagram-scroll" role="region" tabindex="0" aria-label="Signed boosting corrections">
      <svg
        viewBox="0 0 560 350"
        role="img"
        aria-label="Signed waterfall adds scaled tree corrections to the starting log-odds score"
      >
        <text x="25" y="25" class="bold">Log-odds · signed corrections</text><line
          x1="38"
          x2="520"
          y1={by(0)}
          y2={by(0)}
          class="axis"
        /><text x="16" y={by(0) + 5}>0</text>
        {#each boost as score, i}
          {@const previous = i === 0 ? 0 : boost[i - 1]}
          <rect
            x={70 + i * 150}
            y={Math.min(by(previous), by(score))}
            width="75"
            height={Math.max(2, Math.abs(by(previous) - by(score)))}
            class={i === 0 ? 'b' : 'a'}
            class:selected={step === i || term === `tree ${i}`}
          />
          {#if i < 2}<line
              x1={145 + i * 150}
              x2={220 + i * 150}
              y1={by(score)}
              y2={by(score)}
              class="link dash"
            />{/if}
          <text x={108 + i * 150} y={Math.min(by(previous), by(score)) - 9} text-anchor="middle"
            >{i === 0
              ? f(score)
              : `${score - previous >= 0 ? '+' : ''}${f(score - previous)}`}</text
          >
          <text x={108 + i * 150} y="289" text-anchor="middle"
            >{['Start', 'η × tree 1', 'η × tree 2'][i]}</text
          >
          <text x={108 + i * 150} y="313" text-anchor="middle" class="tiny">Score {f(score)}</text>
        {/each}
        <text x="280" y="340" text-anchor="middle"
          >Final {f(v.F2)} → sigmoid → {pct(v.p)} probability</text
        >
      </svg>
    </div>
    <div class="diagram-metrics">
      <span
        >Chosen rate η = {f(g.eta)}<strong
          >{f(g.F0)} + {f(Number(g.eta) * Number(g.h1))} + {f(Number(g.eta) * Number(g.h2))} = {f(
            v.F2,
          )}</strong
        ></span
      ><span>Comparison η = {f(g.eta2)}<strong>Score {f(v.smallF2)} → {pct(v.smallP)}</strong></span
      >
    </div>
    <p class="diagram-note">
      For squared-error loss, new trees fit residuals. Classification uses a loss-specific
      correction; the supplied A03 increments are log-odds, not probability percentage points.
    </p>
  {/if}
</div>
