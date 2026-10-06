<script lang="ts">
  import type { Givens, Value } from '../../../engine/types';
  import { seasonalNaive } from '../../../data/algorithm-visuals';
  import { number as f, percent as pct, plotLine } from './helpers';
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
  const forecastValues = $derived(
    slug === 'time-series'
      ? [Number(g.previous), Number(g.last), Number(v.next), Number(v.second)]
      : [],
  );
  const forecastLow = $derived(
    Math.min(...forecastValues, ...(step === 4 ? [Number(g.actual)] : [])) - 10,
  );
  const forecastHigh = $derived(
    Math.max(
      ...forecastValues,
      Number(g.last ?? 0) + Number(g.buffer ?? 0),
      step === 4 ? Number(g.actual) : 0,
    ) + 10,
  );
  const fy = (n: number) => 235 - ((n - forecastLow) / (forecastHigh - forecastLow)) * 170;
  const logits = $derived((g.logits as number[]) ?? []);
  const weights = $derived((v.weights as number[]) ?? []);
  const tokenValues = $derived((g.values as number[]) ?? []);
  const probabilities = $derived((v.probabilities as number[]) ?? []);
  const rankings = $derived(
    ((v.similarities as number[]) ?? [])
      .map((similarity, i) => ({ similarity, index: i }))
      .sort((a, b) => b.similarity - a.similarity),
  );
  const K = $derived(Math.min(3, Math.max(1, choice || 2)));
  const retrieved = $derived(
    rankings
      .slice(0, K)
      .map((x) => x.index)
      .filter((i) => method !== 2 || i !== 0),
  );
  const supported = $derived(retrieved.includes(0) && retrieved.includes(1));
  const history = [100, 105, 120, 130, 125, 90, 80];
  const seasonal = seasonalNaive(history, 7, 28);
  const walkSeries = [...history, 102, 104, 118, 138, 120, 92, 85, 104, 112, 123, 140, 130, 98, 88];
  const origin = $derived(choice === 1 ? 14 : 7);
  const walkForecast = $derived(seasonalNaive(walkSeries.slice(0, origin), 7, 7));
  const walkError = $derived(
    walkForecast.reduce((s, p, i) => s + Math.abs(walkSeries[origin + i] - p), 0) / 7,
  );
  const shock = $derived(choice === 1 ? 0.5 : 0.1);
  const variance = $derived(0.01 + 0.15 * shock * shock + 0.8 * 0.04);
  const q = $derived((g.q as number[]) ?? [1, 0]);
  const docs = $derived((g.docs as number[]) ?? []);
</script>

<div class="algorithm-diagram">
  {#if slug === 'time-series'}
    {#if method === 0}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Forecast origin and lagged change"
      >
        <svg
          viewBox="0 0 560 325"
          role="img"
          aria-label="Two observed values before the forecast cutoff, then one and two step forecasts; later actual is revealed only during evaluation"
        >
          <text x="25" y="28" class="bold">Settlement outflow · $ thousands</text><line
            x1="40"
            x2="530"
            y1="250"
            y2="250"
            class="axis"
          />
          <rect
            x="260"
            y="43"
            width="265"
            height="207"
            fill="var(--gold-soft,#f8ebcc)"
            opacity=".55"
          /><line x1="260" x2="260" y1="43" y2="250" class="link dash" />
          <text x="64" y="56" class="tiny">Observed history</text><text x="305" y="56" class="tiny"
            >Forecasts made at cutoff</text
          >
          <line x1="65" x2="195" y1={fy(Number(g.previous))} y2={fy(Number(g.last))} class="link" />
          {#each forecastValues as value, i}
            {#if i < 2 || step >= 3}
              {#if i >= 2}<line
                  x1={65 + (i - 1) * 130}
                  x2={65 + i * 130}
                  y1={fy(forecastValues[i - 1])}
                  y2={fy(value)}
                  class="link-gold dash"
                />{/if}
              <circle
                cx={65 + i * 130}
                cy={fy(value)}
                r="7"
                class={i < 2 ? 'a' : 'b'}
                class:selected={term === (i === 0 ? 'previous' : i === 1 ? 'last' : 'forecast')}
              /><text x={65 + i * 130} y={fy(value) - 14} text-anchor="middle">{f(value)}</text>
            {/if}
            <text x={65 + i * 130} y="276" text-anchor="middle" class="tiny"
              >{['Previous', 'Last', 'Horizon 1', 'Horizon 2'][i]}</text
            >
          {/each}
          {#if step >= 1}<text x="105" y="228" class="tiny">Δ={f(v.change)}</text>{/if}
          {#if step >= 2}<text x="299" y="227" class="tiny">Next Δ={f(v.nextChange)}</text>{/if}
          {#if step === 4}<path
              d={`M325,${fy(Number(g.actual)) - 10} l10,10 l-10,10 l-10,-10 Z`}
              class="c"
            /><text x="343" y={fy(Number(g.actual)) - 15} class="tiny">Actual {g.actual}</text>{/if}
          <text x="25" y="307" class="tiny"
            >Green: known values · gold: model forecast · blue diamond: later actual</text
          >
        </svg>
      </div>
      <div class="diagram-metrics">
        <span>Observed change<strong>{g.last} − {g.previous} = {f(v.change)}</strong></span><span
          >Forecast change<strong>{g.phi} × {f(v.change)} = {f(v.nextChange)}</strong></span
        ><span>Next level<strong>{g.last} + {f(v.nextChange)} = {f(v.next)}</strong></span>
      </div>
      {#if step === 4}<p class="diagram-note">
          Later actual = {g.actual}; model absolute error = {f(v.modelError)}; last-value baseline
          error = {f(v.baselineError)} ($ thousands). Planning amount with the supplied buffer = {f(
            v.liquidity,
          )}. The buffer is not an estimated prediction interval.
        </p>{/if}
    {:else if method === 1}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Seasonal naive forecast repeats the observed week"
      >
        <svg
          viewBox="0 0 560 315"
          role="img"
          aria-label="One observed week is repeated four times without future observations"
        >
          <text x="25" y="28" class="bold">Separate daily example · a 7-day pattern repeats</text>
          <path
            d={plotLine([...history, ...seasonal], 45, 245, 470, 170, [70, 140])}
            class="link"
          />
          <line
            x1={45 + (6.5 / 34) * 470}
            x2={45 + (6.5 / 34) * 470}
            y1="45"
            y2="248"
            class="link-gold dash"
          />
          {#each [0, 1, 2, 3, 4] as week}<text
              x={45 + ((week * 7 + 3) / 34) * 470}
              y="277"
              text-anchor="middle"
              class="tiny">{week === 0 ? 'Observed' : `Week ${week}`}</text
            >{/each}
          <text x="25" y="305" class="tiny"
            >Day 15 forecast = {seasonal[14]} · from the matching observed weekday</text
          >
        </svg>
      </div>
      <p class="diagram-note">
        SARIMA can model seasonal lags and seasonal differencing in addition to ordinary ARIMA
        terms. Seasonal naive simply repeats the last complete season. This supplied seven-day
        history is separate from A06; no SARIMA model is being fitted here.
      </p>
      <div class="process-cards">
        <div><strong>Ordinary lag</strong><span>Yesterday → today</span></div>
        <div><strong>Seasonal lag, s = 7</strong><span>Last Monday → this Monday</span></div>
        <div><strong>Seasonal difference</strong><span>Today − same weekday last week</span></div>
      </div>
    {:else if method === 2}
      <div class="process-cards">
        <div class:active={step <= 1}>
          <strong>AR: previous values</strong><span
            >Known previous value 110 × coefficient 0.8 = 88</span
          >
        </div>
        <div class:active={step === 2}>
          <strong>MA: previous errors</strong><span
            >Known previous error −5 × coefficient 0.4 = −2</span
          >
        </div>
        <div class:active={step >= 3}>
          <strong>Combine with intercept</strong><span>10 + 88 − 2 = next forecast 96</span>
        </div>
      </div>
      <p class="diagram-note">
        Separate ARMA teaching calculation. AR uses prior observations; MA uses prior forecast
        errors. A simple moving-average baseline instead averages observations. Differencing (the I
        in ARIMA) changes the series modeled; it does not guarantee stationarity.
      </p>
    {:else if method === 4}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Walk-forward evaluation with chronological origins"
      >
        <svg
          viewBox="0 0 560 310"
          role="img"
          aria-label="History expands to each forecast origin; forecasts cover the following seven days before their actuals are revealed"
        >
          <text x="25" y="27" class="bold">Separate daily example · origin after day {origin}</text>
          <rect
            x={40 + (origin / 21) * 470}
            y="50"
            width={(7 / 21) * 470}
            height="190"
            fill="var(--gold-soft,#f8ebcc)"
          />
          <path
            d={walkSeries
              .slice(0, origin)
              .map(
                (value, i) =>
                  `${i ? 'L' : 'M'}${40 + ((i + 1) / 21) * 470},${235 - ((value - 70) / 80) * 170}`,
              )
              .join(' ')}
            class="link"
          />
          <path
            d={walkForecast
              .map(
                (value, i) =>
                  `${i ? 'L' : 'M'}${40 + ((origin + i + 1) / 21) * 470},${235 - ((value - 70) / 80) * 170}`,
              )
              .join(' ')}
            class="link-gold dash"
          />
          {#if step === 4}<path
              d={walkSeries
                .slice(origin, origin + 7)
                .map(
                  (value, i) =>
                    `${i ? 'L' : 'M'}${40 + ((origin + i + 1) / 21) * 470},${235 - ((value - 70) / 80) * 170}`,
                )
                .join(' ')}
              fill="none"
              stroke="var(--av-c)"
              stroke-width="2"
            />{/if}
          <line
            x1={40 + (origin / 21) * 470}
            x2={40 + (origin / 21) * 470}
            y1="50"
            y2="245"
            class="link dash"
          />
          <text x="43" y="269" class="tiny">Day 1</text><text
            x={40 + (origin / 21) * 470}
            y="269"
            text-anchor="middle"
            class="tiny">Cutoff {origin}</text
          ><text x="475" y="269" class="tiny">Day 21</text>
          <text x="25" y="297" class="tiny"
            >Green: past · gold: seasonal-naive forecast · blue: later actual</text
          >
        </svg>
      </div>
      <p class="diagram-note">
        Train/history days 1–{origin}; forecast days {origin + 1}–{origin + 7}. The second origin
        may use outcomes already observed by day 14. {step === 4
          ? `After revealing actuals, this fold’s MAE is ${f(walkError)} ($ thousands).`
          : 'Advance to the final step to reveal the held-out actuals and error.'} This supplied chronology
        illustration is separate from A06.
      </p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
      <div
        class="diagram-scroll"
        role="region"
        tabindex="0"
        aria-label="Conditional volatility after a shock"
      >
        <svg
          viewBox="0 0 560 300"
          role="img"
          aria-label="A larger previous shock increases the conditional variance band around a fixed zero mean"
        >
          <text x="25" y="28" class="bold">GARCH: variance changes while the mean stays fixed</text>
          <path
            d={`M45,${150 - 45} L210,${150 - 45} L340,${150 - Math.sqrt(variance) * 190} L510,${150 - Math.sqrt(variance) * 190} L510,${150 + Math.sqrt(variance) * 190} L340,${150 + Math.sqrt(variance) * 190} L210,${150 + 45} L45,${150 + 45} Z`}
            fill="var(--gold-soft,#f8ebcc)"
          />
          <line x1="45" x2="510" y1="150" y2="150" class="link" /><text x="55" y="140"
            >Mean = 0</text
          >
          <line x1="265" x2="265" y1="90" y2="220" class="link-gold dash" /><text x="219" y="249"
            >Previous shock {shock}</text
          >
          <text x="25" y="281" class="tiny"
            >Shading illustrates ±1 conditional standard deviation, not a fitted interval.</text
          >
        </svg>
      </div>
      <p class="diagram-note">
        Separate supplied GARCH-style update: h = 0.01 + 0.15 × {shock}² + 0.8 × 0.04 =
        <strong>{f(variance, 4)}</strong>; conditional standard deviation =
        <strong>{f(Math.sqrt(variance), 4)}</strong>. A larger squared shock increases variance
        without necessarily changing the conditional mean.
      </p>
    {/if}
  {:else if slug === 'transformers'}
    {#if method === 1}
      <div class="process-cards">
        <div>
          <strong>Original</strong><span
            ><span class="token">Profit</span> <span class="token">rose</span></span
          >
        </div>
        <div class="active">
          <strong>Changed context</strong><span
            ><span class="token">Profit</span> <span class="token">did</span>
            <span class="token">not</span> <span class="token">rise</span></span
          >
        </div>
      </div>
      <p class="diagram-note">
        The word “not” changes the statement even though “profit” and “rise” remain. A keyword
        baseline can miss the reversal. Review the new target label under the annotation guide; “did
        not rise” may require context to distinguish neutral from negative. No predicted FinBERT
        label is invented here.
      </p>
    {:else if method === 2}
      <div class="process-cards">
        <div>
          <strong>Classification</strong><span>“Margins narrowed” → one sentiment label</span><span
            >Check per-class precision and recall.</span
          >
        </div>
        <div>
          <strong>Extraction</strong><span>“Revenue was $120m” → revenue: 120, unit: $m</span><span
            >Check field correctness and completeness.</span
          >
        </div>
        <div>
          <strong>Generation</strong><span>Passages → an open-ended explanation</span><span
            >Check supported claims, figures, dates, and omissions.</span
          >
        </div>
      </div>
    {:else if method === 3}
      <div class="process-cards">
        <div>
          <strong>TF-IDF + linear classifier</strong><span
            >Count weighted terms → linear score → label</span
          ><span>The browser lab runs this baseline.</span>
        </div>
        <div>
          <strong>FinBERT</strong><span
            >Contextual token representations → classification head → label</span
          ><span>The native example runs the trained model.</span>
        </div>
      </div>
      <p class="diagram-note">
        Use the same reviewed sentences, labels, and split to compare models. The attention
        arithmetic below is a scalar illustration and is not either model’s actual prediction.
      </p>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
    <div
      class="diagram-scroll"
      role="region"
      tabindex="0"
      aria-label="Attention computation and sentiment head"
    >
      <svg
        viewBox="0 0 560 370"
        role="img"
        aria-label="Two supplied token logits become attention weights, weighted token values form h, and a separate head gives sentiment probabilities"
      >
        <text x="25" y="26" class="bold">Two-token teaching calculation</text>
        {#each logits as logit, i}
          {@const x = 85 + i * 295}
          <rect
            {x}
            y="48"
            width="115"
            height="55"
            rx="8"
            class="node"
            class:selected={step === 0 || term === 'logits' || term === 'values'}
          />
          <text x={x + 57} y="72" text-anchor="middle" class="bold"
            >{['loss', 'narrowed'][i] ?? `token ${i + 1}`}</text
          ><text x={x + 57} y="93" text-anchor="middle" class="tiny">value {f(tokenValues[i])}</text
          >
          <text x={x + 57} y="126" text-anchor="middle">logit {f(logit, 3)}</text><text
            x={x + 57}
            y="149"
            text-anchor="middle"
            class="tiny">exp = {f(Math.exp(logit), 3)}</text
          >
          <path
            d={`M${x + 57},160 Q${x + 57},208 280,230`}
            fill="none"
            stroke={i ? 'var(--av-b)' : 'var(--av-a)'}
            stroke-width={2 + weights[i] * 8}
          />
          <text x={x + 57} y="188" text-anchor="middle" class="bold">{pct(weights[i])}</text>
        {/each}
        <rect
          x="190"
          y="225"
          width="180"
          height="46"
          rx="8"
          class="gold-node"
          class:selected={step === 2 || term === 'representation'}
        /><text x="280" y="254" text-anchor="middle" class="bold">h = {f(v.h)}</text>
        {#each probabilities as probability, i}
          <line x1="280" x2={103 + i * 177} y1="272" y2="292" class="link" /><rect
            x={25 + i * 177}
            y="297"
            width="156"
            height="57"
            rx="7"
            class="node"
            class:selected={step >= 3 || term === 'probabilities'}
          /><text x={103 + i * 177} y="320" text-anchor="middle"
            >{['Positive', 'Neutral', 'Negative'][i]}</text
          ><text x={103 + i * 177} y="341" text-anchor="middle">{pct(probability)}</text>
        {/each}
      </svg>
    </div>
    <div class="diagram-metrics">
      <span
        >Attention normalization<strong
          >Sum = {f(
            weights.reduce((s, x) => s + x, 0),
            4,
          )}</strong
        ></span
      ><span
        >Weighted representation<strong
          >{weights.map((w, i) => `${f(w)} × ${f(tokenValues[i])}`).join(' + ')} = {f(v.h)}</strong
        ></span
      ><span
        >Confidence rule<strong>{v.decision ? 'Accept automatic label' : 'Send for review'}</strong
        >Threshold {pct(g.threshold)}</span
      >
    </div>
    <p class="diagram-note">
      Class logits: {(v.classLogits as number[]).map((x) => f(x)).join(', ')}. Attention weights
      describe this computation; they do not establish causal explanations or guarantee that a label
      is correct.
    </p>
  {:else}
    {#if method === 1}
      <div class="process-cards">
        <div>
          <strong>Broken chunk</strong><span>120 · 100</span><span
            >Period, unit, and meaning lost.</span
          >
        </div>
        <div class="active">
          <strong>Preserved table context</strong><span
            >Revenue ($m): current period {g.newRevenue}; previous period {g.oldRevenue}.</span
          ><span>Keep the document identity, headers, dates, and footnotes.</span>
        </div>
      </div>
    {:else if method === 3}
      <div class="process-cards">
        <div>
          <strong>Keyword / TF-IDF baseline</strong><span
            >Match weighted query terms to document terms.</span
          >
        </div>
        <div>
          <strong>Embedding retrieval</strong><span
            >Compare query and passage vector directions.</span
          >
        </div>
        <div>
          <strong>Evidence judgment</strong><span
            >Check which passages establish the requested fact, regardless of retriever.</span
          >
        </div>
      </div>
      <p class="diagram-note">
        The browser lab runs TF-IDF retrieval; semantic retrieval is a native extension. This
        diagram uses the supplied two-dimensional vectors and does not call a generative model.
      </p>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focusable region allows keyboard scrolling of the labeled SVG on narrow screens.) -->
    <div
      class="diagram-scroll"
      role="region"
      tabindex="0"
      aria-label="Cosine retrieval and source evidence"
    >
      <svg
        viewBox="0 0 560 340"
        role="img"
        aria-label="Normalized query and passage vector directions alongside the ranked selected source passages"
      >
        <text x="20" y="27" class="bold">Vector directions</text><line
          x1="38"
          x2="230"
          y1="220"
          y2="220"
          class="axis"
        /><line x1="38" x2="38" y1="53" y2="220" class="axis" />
        <line
          x1="38"
          y1="220"
          x2={38 + (q[0] / Math.hypot(...q)) * 165}
          y2={220 - (q[1] / Math.hypot(...q)) * 165}
          class="link"
          stroke-width="4"
        />
        <text x="80" y="241" class="tiny">Query q (unit length)</text>
        {#each [0, 1, 2] as i}
          {@const length = Math.hypot(docs[i * 2], docs[i * 2 + 1])}
          <line
            x1="38"
            y1="220"
            x2={38 + (docs[i * 2] / length) * 145}
            y2={220 - (docs[i * 2 + 1] / length) * 145}
            class="link-gold"
            class:selected={term === 'direction'}
          /><text x={45 + (docs[i * 2] / length) * 145} y={212 - (docs[i * 2 + 1] / length) * 145}
            >{['A', 'B', 'C'][i]}</text
          >
        {/each}
        <text x="270" y="27" class="bold">Ranked evidence · K={K}</text>
        {#each rankings as passage, i}
          {@const included = retrieved.includes(passage.index)}
          <rect
            x="260"
            y={47 + i * 73}
            width="277"
            height="64"
            rx="7"
            class="node"
            class:faded={!included}
          />
          <text x="274" y={68 + i * 73} class="bold"
            >{i + 1}. Passage {['A', 'B', 'C'][passage.index]} · {f(passage.similarity, 3)}</text
          >
          <text x="274" y={93 + i * 73} class="tiny"
            >{passage.index === 0
              ? `Previous revenue: $${g.oldRevenue}m`
              : passage.index === 1
                ? `Current revenue: $${g.newRevenue}m`
                : 'Branch count: irrelevant to growth'}{method === 2 && passage.index === 0
              ? ' (removed)'
              : ''}</text
          >
        {/each}
        <path d="M400,261 L400,278 L175,278 L175,288" class="link" />
        <rect
          x="35"
          y="288"
          width="490"
          height="36"
          rx="7"
          class={supported ? 'node' : 'gold-node'}
        /><text x="280" y="312" text-anchor="middle" class="tiny"
          >{supported
            ? `A + B support: (${g.newRevenue} − ${g.oldRevenue}) / ${g.oldRevenue} = ${pct(v.growth)}`
            : 'Insufficient evidence: both current and previous values are required.'}</text
        >
      </svg>
    </div>
    <p class="diagram-note">
      The ranking is recomputed from the supplied vectors. Passage A provides the prior value; B the
      current value; C does not establish growth. {supported
        ? 'The numerical claim is linked to A and B.'
        : 'The available selected passages cannot support the growth claim.'} Similarity is not a truth
      score.
    </p>
    <div class="diagram-metrics">
      <span
        >Required evidence found<strong
          >{retrieved.filter((i) => i !== 2).length} of 2 passages</strong
        ></span
      ><span
        >Selected context<strong
          >{retrieved.length
            ? pct(retrieved.filter((i) => i !== 2).length / retrieved.length)
            : 'No passages'} relevant</strong
        ></span
      ><span
        >Arithmetic from all supplied figures<strong>{pct(v.growth)}</strong>Report only when both
        sources are available.</span
      >
    </div>
  {/if}
</div>
