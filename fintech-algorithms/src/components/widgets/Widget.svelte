<script lang="ts">
  import { scaleLinear, line, area } from 'd3';
  import { untrack } from 'svelte';
  import { widgets, widgetNotice, widgetReadoutLabel, widgetReadoutUnit } from './catalog';
  import { widgetValues, scored } from './calculations';
  import {
    widgetDefaults,
    widgetGuides,
    widgetInterpretation,
    signedChartDomain,
  } from './guidance';
  import { cloneGivens } from '../../engine/variants';
  import { sigmoid, sum } from '../../engine/solve/core';
  import { format } from '../../engine/check';
  import type { Exercise, Givens, Value } from '../../engine/types';
  let { id, exercise }: { id: string; exercise: Exercise } = $props();
  const config = $derived(widgets.find((w) => w.id === id)!);
  let g = $state<Givens>(untrack(() => cloneGivens(exercise.givens)));
  const defaults = widgetDefaults;
  const guide = $derived(widgetGuides[config.id]);
  const baseline = $derived(widgetValues(id, exercise.id, cloneGivens(exercise.givens), defaults));
  let prediction = $state('');
  let extra = $state({ ...defaults }),
    error = $state('');
  let vals = $derived(widgetValues(id, exercise.id, g, extra));
  const notice = $derived(widgetNotice(id, g, vals, extra));
  const interpretation = $derived(widgetInterpretation(config.id, g, vals, extra));
  const W = 440,
    H = 230,
    pad = 38;
  const green = 'var(--green)',
    gold = 'var(--gold)',
    blue = 'var(--blue)';
  let allEntries = $derived(Object.entries(vals));
  const keys = $derived(Object.keys(g));
  const primaryEntries = $derived(
    guide.primaryResults.map((key) => [key, vals[key]] as [string, Value]),
  );
  const moreEntries = $derived(allEntries.filter(([key]) => !guide.primaryResults.includes(key)));
  type ExtraKey = keyof typeof defaults;
  type ExtraField = {
    key: ExtraKey;
    label: string;
    min: number;
    max?: number;
    step: number;
    inputId: string;
    slider?: boolean;
  };
  const extraFields: ExtraField[] = $derived([
    ...(id === 'threshold-explorer'
      ? [
          {
            key: 'threshold' as const,
            label: 'Decision threshold (proportion)',
            min: 0,
            max: 1,
            step: 0.01,
            inputId: `${id}-extra-threshold`,
            slider: true,
          },
          {
            key: 'cFN' as const,
            label: 'Missed case cost · $',
            min: 0,
            max: 10000,
            step: 50,
            inputId: `${id}-extra-cFN`,
            slider: true,
          },
          {
            key: 'cFP' as const,
            label: 'False alert cost · $',
            min: 0,
            max: 1000,
            step: 10,
            inputId: `${id}-extra-cFP`,
            slider: true,
          },
          {
            key: 'cReview' as const,
            label: 'Cost per review · $',
            min: 0,
            max: 100,
            step: 1,
            inputId: `${id}-extra-cReview`,
            slider: true,
          },
        ]
      : []),
    ...(id === 'confusion-builder'
      ? [
          {
            key: 'beta' as const,
            label: 'F-beta emphasis',
            min: 0.5,
            max: 3,
            step: 0.5,
            inputId: 'beta-slider',
            slider: true,
          },
        ]
      : []),
    ...(id === 'forecast-eval'
      ? [
          {
            key: 'width' as const,
            label: 'Interval half-width · $ thousands',
            min: 5,
            max: 60,
            step: 5,
            inputId: 'width-slider',
            slider: true,
          },
          {
            key: 'tau' as const,
            label: 'Quantile τ',
            min: 0.5,
            max: 0.99,
            step: 0.01,
            inputId: 'tau-slider',
            slider: true,
          },
        ]
      : []),
    ...(id === 'retrieval-rank'
      ? [
          {
            key: 'K' as const,
            label: 'Passages to retrieve',
            min: 1,
            max: 3,
            step: 1,
            inputId: 'retrieval-k',
            slider: true,
          },
        ]
      : []),
    ...(id === 'portfolio-feasible'
      ? [
          {
            key: 'weight' as const,
            label: 'Stock weight (proportion)',
            min: 0,
            max: 1,
            step: 0.01,
            inputId: 'stock-weight',
            slider: true,
          },
        ]
      : []),
    ...(id === 'execution-update'
      ? [
          {
            key: 'close' as const,
            label: 'Closing price · shortfall',
            min: 0,
            step: 0.1,
            inputId: 'closing-price',
          },
        ]
      : []),
    ...(id === 'monte-carlo-loss'
      ? [
          {
            key: 'paths' as const,
            label: 'Simulation runs',
            min: 100,
            max: 10000,
            step: 100,
            inputId: 'simulation-paths',
            slider: true,
          },
        ]
      : []),
    ...(id === 'ops-budget'
      ? [
          {
            key: 'transactions' as const,
            label: 'Monthly transactions',
            min: 1,
            step: 1,
            inputId: 'monthly-volume',
          },
          {
            key: 'unitCost' as const,
            label: 'Inference cost per transaction · $',
            min: 0,
            step: 0.001,
            inputId: 'unit-cost',
          },
        ]
      : []),
  ]);
  const editableKeys = $derived(
    config.chart === 'graph'
      ? []
      : keys.filter((key) => !(id === 'threshold-explorer' && key === 'thresholds')),
  );
  const hasMoreSettings = $derived(
    editableKeys.some((key) => !guide.primaryControls.includes(key)) ||
      extraFields.some((field) => !guide.primaryControls.includes(`extra.${field.key}`)),
  );
  function isPrimary(key: string, primary: boolean) {
    return guide.primaryControls.includes(key) === primary;
  }
  function baselineInput(key: string) {
    const value = exercise.givens[key];
    return Array.isArray(value) ? value.join(', ') : String(value);
  }
  function displayValue(key: string, value: Value) {
    if (id === 'sigmoid-el' && key === 'decision') return value ? 'Review' : 'Below threshold';
    return format(value, units(key));
  }
  function accept(next: Givens) {
    const fractionKeys = new Set([
      'threshold',
      'LGD',
      'PD',
      'eta',
      'eta2',
      'alpha',
      'gamma',
      'confidence',
      'stockReturn',
      'bondReturn',
      'stockVol',
      'bondVol',
      'minimum',
      'costRate',
      'cap',
      'tau',
    ]);
    if (
      Object.entries(next).some(
        ([key, value]) =>
          typeof value === 'number' && fractionKeys.has(key) && (value < 0 || value > 1),
      )
    ) {
      error = 'Probabilities and fraction controls must be between 0 and 1.';
      return false;
    }
    if (next.D !== undefined && next.D !== 0 && next.D !== 1) {
      error = 'Prior delinquency is a binary input: enter 0 or 1.';
      return false;
    }
    if (id === 'confusion-builder') {
      const n = Number(next.N),
        fraud = Number(next.fraud),
        alerts = Number(next.alerts),
        caught = Number(next.caught);
      if (
        [n, fraud, alerts, caught].some((x) => !Number.isInteger(x) || x < 0) ||
        n === 0 ||
        caught > Math.min(fraud, alerts) ||
        n - fraud - alerts + caught < 0
      ) {
        error =
          'Use nonnegative integer counts. Caught fraud cannot exceed actual fraud or alerts, and the matrix must fit the transaction total.';
        return false;
      }
    }
    if (
      id === 'psi-drift' &&
      ['current', 'reference'].some((k) => {
        const shares = next[k] as number[];
        return shares.some((x) => x <= 0) || Math.abs(sum(shares) - 1) > 1e-6;
      })
    ) {
      error = 'Each distribution must contain positive shares that sum to 1.';
      return false;
    }
    try {
      const out = widgetValues(id, exercise.id, next, extra);
      const numbers = Object.values(out).flatMap((v) =>
        Array.isArray(v) ? v : typeof v === 'number' ? [v] : [],
      );
      if (numbers.some((n) => !Number.isFinite(n))) throw new Error('undefined result');
    } catch {
      error =
        id === 'kmeans-anim'
          ? 'These inputs leave an empty cluster or an undefined distance. Keep at least one point in each cluster.'
          : 'These inputs make a calculation undefined. Check that the quantities used as denominators are positive.';
      return false;
    }
    g = next;
    error = '';
    return true;
  }
  function num(key: string, value: number) {
    if (!Number.isFinite(value)) {
      error = 'Enter a finite number.';
      return false;
    }
    return accept({ ...g, [key]: value });
  }
  function arr(key: string, value: string) {
    const a = value.split(',').map((x) => (x.trim() ? Number(x.trim()) : NaN));
    if (a.every(Number.isFinite) && a.length === (g[key] as number[]).length)
      return accept({ ...g, [key]: a });
    error = `Enter ${(g[key] as number[]).length} comma-separated numbers for ${inputLabel(key).toLowerCase()}.`;
    return false;
  }
  $effect(() => {
    const state = { id, givens: cloneGivens(g), extra: { ...extra }, values: vals };
    if (typeof window !== 'undefined')
      window.dispatchEvent(new CustomEvent('course-widget', { detail: state }));
  });
  function updateExtra(key: keyof typeof extra, value: number) {
    const field = extraFields.find((field) => field.key === key);
    const min = field?.min ?? 0,
      max = field?.max ?? Infinity;
    if (
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (['K', 'paths', 'transactions'].includes(key) && !Number.isInteger(value))
    ) {
      error = Number.isFinite(max)
        ? `Enter a ${['K', 'paths'].includes(key) ? 'whole ' : ''}number from ${min} to ${max}.`
        : `Enter a finite number of at least ${min}.`;
      return false;
    }
    extra = { ...extra, [key]: value };
    error = '';
    return true;
  }
  function minval(key: string, value: number) {
    if (
      [
        'D',
        'threshold',
        'LGD',
        'PD',
        'eta',
        'eta2',
        'phi',
        'alpha',
        'gamma',
        'confidence',
        'rf',
        'stockReturn',
        'bondReturn',
        'stockVol',
        'bondVol',
        'minimum',
        'baseline',
        'costRate',
        'cap',
        'objective',
        'tau',
      ].includes(key)
    )
      return 0;
    return value < 0 ? value * 3 : 0;
  }
  function maxval(key: string, value: number) {
    if (
      [
        'D',
        'threshold',
        'LGD',
        'PD',
        'eta',
        'eta2',
        'phi',
        'alpha',
        'gamma',
        'confidence',
        'rf',
        'stockReturn',
        'bondReturn',
        'stockVol',
        'bondVol',
        'minimum',
        'baseline',
        'costRate',
        'cap',
        'objective',
        'tau',
      ].includes(key)
    )
      return 1;
    return value < 0 ? 0 : Math.max(10, value * 2);
  }
  function stepval(key: string, value: number) {
    if (key === 'D') return 1;
    return maxval(key, value) <= 1
      ? 0.01
      : Math.abs(value) < 10
        ? 0.1
        : Math.abs(value) >= 1000
          ? 100
          : 1;
  }
  const labels: Record<string, string> = {
    N: 'Transactions',
    fraud: 'Actual frauds',
    alerts: 'Alerts',
    caught: 'Frauds caught',
    counts: 'Counts in stated order',
    scores: 'Tree or model scores',
    DTI: 'DTI · percentage points',
    D: 'Prior delinquency · 0 or 1',
    I: 'Income · $ thousands',
    loan: 'Exposure · $',
    LGD: 'Loss fraction',
    threshold: 'Review threshold',
    F0: 'Starting log-odds',
    eta: 'Learning rate',
    eta2: 'Comparison learning rate',
    h1: 'First tree correction',
    h2: 'Second tree correction',
    points: 'Savings rates · %',
    centers: 'Starting centers · %',
    newPoint: 'New customer · %',
    paths: 'Path lengths · 3 per transaction',
    c: 'Normalization constant',
    q: 'Query vector',
    docs: 'Document vectors · A, B, C',
    oldRevenue: 'Previous revenue · $m',
    newRevenue: 'Current revenue · $m',
    matrix: 'Actual-row confusion matrix',
    current: 'Current band shares',
    reference: 'Reference band shares',
    actual: 'Actual outflows',
    predicted: 'Forecasts or probabilities',
    baseline: 'Baseline forecast',
    defaults: 'Observed defaults',
    loss: 'Loss per default · $',
    stockReturn: 'Stock return',
    bondReturn: 'Bond return',
    stockVol: 'Stock volatility',
    bondVol: 'Bond volatility',
    minimum: 'Minimum return',
    portfolio: 'Portfolio value · $',
    old: 'Old Q-value',
    reward: 'Immediate reward',
    next: 'Next-state Q-values',
    alpha: 'Learning rate',
    gamma: 'Discount factor',
    wait: 'Wait Q-value',
    draws: 'Uniform draws · A, B per run',
    PD: 'Default probability',
    reserve: 'Reserve · $',
    perMinute: 'Requests per minute',
    arrival: 'Requests arriving per second',
    minutes: 'Load-test minutes',
    analysts: 'Analysts',
    pace: 'Reviews per analyst per day',
    days: 'Days',
    values: 'Token values',
    logits: 'Attention logits',
  };
  function inputLabel(key: string): string {
    if (id === 'gini-split' && key === 'counts')
      return 'New-device fraud, new-device legitimate, trusted-device fraud, trusted-device legitimate';
    if (id === 'gini-split' && key === 'scores') return 'Fraud scores from the three trees';
    if (id === 'threshold-explorer' && key === 'scores') return 'Fraud scores for transactions A–F';
    if (id === 'threshold-explorer' && key === 'labels')
      return 'Actual labels for A–F · 1 = fraud, 0 = legitimate';
    if (id === 'calibration-lab' && key === 'counts') return 'Loans in low, medium, and high bands';
    if (id === 'calibration-lab' && key === 'predicted')
      return 'Default probabilities in low, medium, and high bands';
    if (id === 'calibration-lab' && key === 'defaults')
      return 'Observed defaults in low, medium, and high bands';
    if (id === 'forecast-eval' && key === 'actual') return 'Actual outflows · $ thousands';
    if (id === 'forecast-eval' && key === 'predicted') return 'Forecast outflows · $ thousands';
    if (id === 'forecast-eval' && key === 'baseline') return 'Baseline outflows · $ thousands';
    if (id === 'portfolio-feasible' && key === 'weights') return 'Allowed stock weights';
    const supplied = exercise.labels[key];
    return supplied && supplied !== key ? supplied : (labels[key] ?? key);
  }
  function units(key: string) {
    const explicit = widgetReadoutUnit(id, key);
    if (explicit !== undefined) return explicit;
    const st = exercise.steps.find((s) => s.id === key);
    if (st?.unit) return st.unit;
    if (
      /^(precision|recall|accuracy|balanced|specificity|FPR|TPR|F1|F2|Fbeta|ECE|coverage|MAPE|WAPE|R2|AUC|AP|KS|reserveBreach|simulationSE|recallAtK|contextPrecision|selectedReturn|selectedVolatility|completion)$/.test(
        key,
      )
    )
      return 'proportion';
    if (
      /(Cost|Dollars|EL|realized|simulationMean|VaR95|ES95|shortfall|monthlyInference)/.test(key) &&
      !key.includes('Bps')
    )
      return '$';
    return '';
  }
  function chartData(): { label: string; value: number }[] {
    if (config.chart === 'attention')
      return (vals.weights as number[]).map((v, i) => ({
        label: ['loss', 'narrowed'][i],
        value: v,
      }));
    if (config.chart === 'isolation')
      return (vals.scores as number[]).map((v, i) => ({ label: ['A', 'B', 'C'][i], value: v }));
    if (config.chart === 'boosting')
      return [Number(g.F0), Number(vals.F1), Number(vals.F2)].map((v, i) => ({
        label: ['Start', 'Tree 1', 'Tree 2'][i],
        value: v,
      }));
    if (config.chart === 'drift')
      return (g.current as number[]).map((v, i) => ({
        label: ['Lower risk', 'Higher risk'][i],
        value: v,
      }));
    if (config.chart === 'fairness')
      return [
        { label: 'A selection', value: Number(vals.selectionA) },
        { label: 'B selection', value: Number(vals.selectionB) },
        { label: 'A TPR', value: Number(vals.TPRA) },
        { label: 'B TPR', value: Number(vals.TPRB) },
        { label: 'A FPR', value: Number(vals.FPRA) },
        { label: 'B FPR', value: Number(vals.FPRB) },
      ];
    if (config.chart === 'execution')
      return [
        { label: 'Before', value: Number(g.old) },
        { label: 'Target', value: Number(vals.target) },
        { label: 'After', value: Number(vals.updated) },
        { label: 'Wait', value: Number(g.wait) },
      ];
    if (config.chart === 'operations')
      return [
        { label: 'API / sec', value: Number(vals.capacity) },
        { label: 'Arrive / sec', value: Number(g.arrival) },
        { label: 'Review / day', value: Number(vals.human) },
        { label: 'Alerts / day', value: Number(g.alerts) },
      ];
    if (config.chart === 'retrieval')
      return (extra.reverse ? [2, 0, 1] : [1, 0, 2]).map((index) => ({
        label: ['A · 2024', 'B · 2025', 'C · branches'][index],
        value: (vals.similarities as number[])[index],
      }));
    if (config.chart === 'montecarlo') {
      const p = Number(g.PD);
      return [
        { label: 'No defaults', value: (1 - p) ** 2 },
        { label: 'One default', value: 2 * p * (1 - p) },
        { label: 'Two defaults', value: p * p },
      ];
    }
    return ['parent', 'newGini', 'trustedGini', 'weighted', 'gain']
      .filter((k) => typeof vals[k] === 'number')
      .map((k) => ({
        label: (
          {
            parent: 'Parent',
            newGini: 'New device',
            trustedGini: 'Trusted device',
            weighted: 'Weighted',
            gain: 'Reduction',
            score: 'Forest score',
          } as Record<string, string>
        )[k],
        value: Number(vals[k]),
      }));
  }
  const bars = $derived(chartData());
  const clusterCenters = $derived(
    extra.iteration === 2 ? [Number(vals.c1), Number(vals.c2)] : (g.centers as number[]),
  );
  const barDomain = $derived(signedChartDomain(bars.map((b) => b.value)));
  const barY = $derived(
    scaleLinear()
      .domain(barDomain)
      .range([H - pad, pad + 12]),
  );
  const curve = $derived(
    line<[number, number]>()
      .x((d) =>
        scaleLinear()
          .domain([-8, 8])
          .range([pad, W - pad])(d[0]),
      )
      .y((d) =>
        scaleLinear()
          .domain([0, 1])
          .range([H - pad, pad])(d[1]),
      )(Array.from({ length: 161 }, (_, i) => [-8 + i * 0.1, sigmoid(-8 + i * 0.1)])) ?? '',
  );
  const roc = $derived(
    config.chart === 'threshold'
      ? [1.01, ...[...(g.scores as number[])].sort((a, b) => b - a), 0].map((t) => scored(g, t))
      : [],
  );
  function path(values: number[], domain?: [number, number]) {
    const xx = scaleLinear()
        .domain([0, Math.max(1, values.length - 1)])
        .range([pad, W - pad]),
      yy = scaleLinear()
        .domain(domain ?? [0, Math.max(1, ...values) * 1.15])
        .range([H - pad, pad]);
    return (
      line<number>()
        .x((d, i) => xx(i))
        .y((d) => yy(d))(values) ?? ''
    );
  }
  const costPoints = $derived(
    config.chart === 'threshold'
      ? Array.from({ length: 101 }, (_, i) => ({
          threshold: i / 100,
          cost: scored(g, i / 100, extra.cFN, extra.cFP, extra.cReview).cost,
        }))
      : [],
  );
  const costMax = $derived(Math.max(1, ...costPoints.map((p) => p.cost)));
  const allForecast = $derived(
    config.chart === 'forecast'
      ? [
          ...(g.actual as number[]),
          ...(g.predicted as number[]).flatMap((value) => [
            value - extra.width,
            value + extra.width,
          ]),
          ...(g.baseline as number[]),
        ]
      : [],
  );
  const forecastDomain = $derived([
    Math.min(0, ...allForecast),
    Math.max(1, ...allForecast) * 1.1,
  ] as [number, number]);
  const forecastY = $derived(
    scaleLinear()
      .domain(forecastDomain)
      .range([H - pad, pad]),
  );
  const forecastBand = $derived(
    config.chart === 'forecast'
      ? (area<number>()
          .x(
            (_, i) => pad + (i * (W - 2 * pad)) / Math.max(1, (g.predicted as number[]).length - 1),
          )
          .y0((value) => forecastY(value - extra.width))
          .y1((value) => forecastY(value + extra.width))(g.predicted as number[]) ?? '')
      : '',
  );
  const operationGroups = $derived(
    config.chart === 'operations'
      ? [
          {
            title: 'API requests per second',
            entries: [
              { label: 'Capacity', value: Number(vals.capacity) },
              { label: 'Arrivals', value: Number(g.arrival) },
            ],
          },
          {
            title: 'Human reviews per day',
            entries: [
              { label: 'Capacity', value: Number(vals.human) },
              { label: 'Alerts', value: Number(g.alerts) },
            ],
          },
        ]
      : [],
  );
  const portfolioY = $derived(
    scaleLinear()
      .domain([
        0,
        Math.max(0.01, Number(g.stockReturn), Number(g.bondReturn), Number(g.minimum)) * 1.2,
      ])
      .range([H - pad, pad]),
  );
  const feasibleWeights = $derived(
    Array.from({ length: 101 }, (_, i) => i / 100).filter(
      (weight) =>
        Number(g.stockReturn) * weight + Number(g.bondReturn) * (1 - weight) >= Number(g.minimum),
    ),
  );
  const graphNodes = [
    { id: 'A', x: 55, y: 70 },
    { id: 'Device 7', x: 155, y: 70 },
    { id: 'B', x: 255, y: 70 },
    { id: 'Merchant 9', x: 255, y: 160 },
    { id: 'C', x: 365, y: 160 },
    { id: 'D', x: 70, y: 190 },
    { id: 'Device 8', x: 165, y: 190 },
  ];
  const graphEdges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [5, 6],
  ];
</script>

{#snippet controls(primary: boolean)}
  {#each editableKeys.filter((key) => isPrimary(key, primary)) as key}
    {@const value = g[key]}
    {@const original = exercise.givens[key]}
    <div class="widget-field">
      <label for={`${id}-${key}`}
        >{inputLabel(key)}
        {#if !Array.isArray(value)}
          <input
            id={`${id}-${key}`}
            aria-label={inputLabel(key)}
            type="number"
            step={stepval(key, Number(original))}
            {value}
            oninput={(e) => {
              if (!num(key, e.currentTarget.valueAsNumber)) e.currentTarget.value = String(g[key]);
            }}
          />
        {/if}
      </label>
      {#if Array.isArray(value)}
        <input
          id={`${id}-${key}`}
          aria-label={inputLabel(key)}
          type="text"
          value={value.join(', ')}
          onchange={(e) => {
            if (!arr(key, e.currentTarget.value))
              e.currentTarget.value = (g[key] as number[]).join(', ');
          }}
        />
      {:else}
        <input
          aria-label={`${inputLabel(key)} slider`}
          type="range"
          min={minval(key, Number(original))}
          max={maxval(key, Number(original))}
          step={stepval(key, Number(original))}
          {value}
          oninput={(e) => {
            if (!num(key, e.currentTarget.valueAsNumber)) e.currentTarget.value = String(g[key]);
          }}
        />
      {/if}
      <span class="control-baseline">Baseline: {baselineInput(key)}</span>
    </div>
  {/each}
  {#each extraFields.filter((field) => isPrimary(`extra.${field.key}`, primary)) as field}
    <div class="widget-field">
      <label for={`${field.inputId}-number`}
        >{field.label}
        <input
          id={`${field.inputId}-number`}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={extra[field.key]}
          oninput={(e) => {
            if (!updateExtra(field.key, e.currentTarget.valueAsNumber))
              e.currentTarget.value = String(extra[field.key]);
          }}
        />
      </label>
      {#if field.slider}<input
          id={field.inputId}
          aria-label={`${field.label} slider`}
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={extra[field.key]}
          oninput={(e) => {
            if (!updateExtra(field.key, e.currentTarget.valueAsNumber))
              e.currentTarget.value = String(extra[field.key]);
          }}
        />{/if}
      <span class="control-baseline">Baseline: {defaults[field.key]}</span>
    </div>
  {/each}
  {#if primary}
    {#if id === 'entity-graph'}
      <div class="widget-field">
        <label for={`account-${id}`}>Account to inspect</label>
        <select id={`account-${id}`} class="input" bind:value={extra.account}>
          <option value={0}>Account A</option><option value={1}>Account B</option><option value={2}
            >Account C</option
          ><option value={3}>Account D</option>
        </select><span class="control-baseline">Baseline: Account A</span>
      </div>
    {/if}
    {#if id === 'calibration-lab'}
      <label class="comparison-toggle"
        ><input
          type="checkbox"
          checked={!!extra.confident}
          onchange={(e) => (extra.confident = e.currentTarget.checked ? 1 : 0)}
        />Compare a high-band prediction of 99%</label
      >
    {/if}
    {#if id === 'retrieval-rank'}
      <button
        class="button secondary"
        aria-pressed={!!extra.reverse}
        onclick={() => (extra.reverse = extra.reverse ? 0 : 1)}
        >{extra.reverse ? 'Restore example ranking' : 'Put the irrelevant passage first'}</button
      >
    {/if}
    {#if id === 'kmeans-anim'}
      <button class="button" onclick={() => (extra.iteration = (extra.iteration + 1) % 3)}
        >{['Assign to starting centers', 'Update the centers', 'Restart the assignment'][
          extra.iteration
        ]}</button
      >
      <span class="small muted"
        >{['Starting centers', 'Assigned groups', 'Updated centers'][extra.iteration]}</span
      >
    {/if}
  {/if}
{/snippet}

{#snippet readout(key: string, value: Value, primary: boolean)}
  <div class="readout" class:primary>
    <span class="label">{widgetReadoutLabel(id, key)}</span>
    <span class="value" data-readout={key}>{displayValue(key, value)}</span>
    <span class="readout-baseline">Baseline: {displayValue(key, baseline[key])}</span>
  </div>
{/snippet}

<section class="widget guided-widget" data-widget={id} aria-label={config.title}>
  <div class="widget-header">
    <div>
      <span class="widget-eyebrow">Explore · {config.title}</span>
      <h3>{guide.question}</h3>
    </div>
  </div>
  <div class="experiment-intro">
    <p>{guide.experiment}</p>
    <details class="prediction-prompt">
      <summary>Make a prediction <span>(optional)</span></summary>
      <label for={`${id}-prediction`}>{guide.prediction}</label>
      <textarea id={`${id}-prediction`} rows="2" bind:value={prediction} placeholder="I expect…"
      ></textarea>
    </details>
  </div>
  <div class="widget-layout">
    <div class="widget-controls">
      {@render controls(true)}
      {#if hasMoreSettings}<details class="more-settings">
          <summary>More settings</summary>
          <div class="advanced-controls">{@render controls(false)}</div>
        </details>{/if}
    </div>
    <div class="widget-chart">
      {#if config.chart === 'sigmoid'}<div class="chart-title">
          From log-odds to predicted probability
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Sigmoid curve with the applicant's probability and review threshold"
          ><line class="axis" x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} /><line
            class="axis"
            x1={pad}
            x2={pad}
            y1={pad}
            y2={H - pad}
          /><path d={curve} fill="none" stroke={green} stroke-width="2.5" /><line
            x1={pad}
            x2={W - pad}
            y1={H - pad - Number(g.threshold) * (H - 2 * pad)}
            y2={H - pad - Number(g.threshold) * (H - 2 * pad)}
            stroke={gold}
            stroke-dasharray="5 4"
          /><circle
            cx={pad + ((Math.max(-8, Math.min(8, Number(vals.z))) + 8) / 16) * (W - 2 * pad)}
            cy={H - pad - Number(vals.p) * (H - 2 * pad)}
            r="6"
            fill={green}
          /><text x={pad} y="17">Default probability</text><text x="12" y={pad}>1.0</text><text
            x="12"
            y={H - pad}>0.0</text
          ><text x={pad} y={H - 12}>−8</text><text x={W / 2 - 25} y={H - 12}>score z</text><text
            x={W - pad - 8}
            y={H - 12}>8</text
          ><text x={W - pad - 115} y={H - pad - Number(g.threshold) * (H - 2 * pad) - 8}
            >Review threshold</text
          ></svg
        >
      {:else if config.chart === 'confusion'}<div class="chart-title">
          Count outcomes before calculating rates
        </div>
        <div class="matrix">
          <div></div>
          <div class="matrix-heading">Actual fraud</div>
          <div class="matrix-heading">Actually legitimate</div>
          <div class="matrix-heading">Send to review</div>
          <div class="matrix-cell"><span>True positive</span><strong>{vals.TP}</strong></div>
          <div class="matrix-cell error"><span>False positive</span><strong>{vals.FP}</strong></div>
          <div class="matrix-heading">Pass</div>
          <div class="matrix-cell error"><span>False negative</span><strong>{vals.FN}</strong></div>
          <div class="matrix-cell"><span>True negative</span><strong>{vals.TN}</strong></div>
        </div>
        <p class="chart-caption">
          Rows are actions. Columns are outcomes. TP + FP + FN + TN = {Number(vals.N)}.
        </p>
      {:else if config.chart === 'threshold'}<div class="chart-title">
          Decision cost across thresholds
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Expected decision cost across validation thresholds"
          ><line class="axis" x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} /><path
            d={line<{ threshold: number; cost: number }>()
              .x((d) => pad + d.threshold * (W - 2 * pad))
              .y((d) => H - pad - (d.cost / costMax) * (H - 2 * pad))(costPoints) ?? ''}
            fill="none"
            stroke={gold}
            stroke-width="2.5"
          /><circle
            cx={pad + extra.threshold * (W - 2 * pad)}
            cy={H - pad - (Number(vals.expectedCost) / costMax) * (H - 2 * pad)}
            r="6"
            fill={blue}
          /><text x={pad} y="17">Cost · $</text><text x={W / 2 - 35} y={H - 12}>Threshold</text
          ></svg
        >
        <details class="chart-diagnostics">
          <summary>Compare ROC, precision–recall, and thresholds</summary>
          <div class="chart-title">ROC operating points</div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="ROC curve with current threshold operating point"
            ><line class="axis" x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} /><line
              class="axis"
              x1={pad}
              x2={pad}
              y1={pad}
              y2={H - pad}
            /><line
              x1={pad}
              x2={W - pad}
              y1={H - pad}
              y2={pad}
              stroke={gold}
              stroke-dasharray="4 4"
            /><path
              d={line<{ FPR: number; recall: number }>()
                .x((d) => pad + d.FPR * (W - 2 * pad))
                .y((d) => H - pad - d.recall * (H - 2 * pad))(roc) ?? ''}
              fill="none"
              stroke={green}
              stroke-width="2.5"
            /><circle
              cx={pad +
                (Number(vals.FP) /
                  ((g.labels as number[]).length - (g.labels as number[]).filter(Boolean).length)) *
                  (W - 2 * pad)}
              cy={H - pad - Number(vals.recall) * (H - 2 * pad)}
              fill={blue}
              r="6"
            /><text x={W / 2 - 50} y={H - 12}>False-positive rate</text><text x={pad} y="17"
              >True-positive rate</text
            ></svg
          >
          <div class="chart-title">Precision and recall at each operating point</div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Precision-recall curve with selected threshold"
            ><line class="axis" x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} /><line
              class="axis"
              x1={pad}
              x2={pad}
              y1={pad}
              y2={H - pad}
            /><path
              d={line<{ precision: number; recall: number }>()
                .x((d) => pad + d.recall * (W - 2 * pad))
                .y((d) => H - pad - (d.recall === 0 ? 1 : d.precision) * (H - 2 * pad))(roc) ?? ''}
              fill="none"
              stroke={green}
              stroke-width="2.5"
            /><circle
              cx={pad + Number(vals.recall) * (W - 2 * pad)}
              cy={H - pad - Number(vals.precision) * (H - 2 * pad)}
              fill={blue}
              r="6"
            /><text x={W / 2 - 20} y={H - 12}>Recall</text><text x={pad} y="17">Precision</text
            ></svg
          >
          <div class="table-scroll">
            <table>
              <thead><tr><th>Threshold</th><th>Review load</th><th>Expected cost</th></tr></thead
              ><tbody
                >{#each [0.05, 0.1, 0.2, 0.3] as t}{@const c = scored(
                    g,
                    t,
                    extra.cFN,
                    extra.cFP,
                    extra.cReview,
                  )}<tr><td>{t}</td><td>{c.TP + c.FP}</td><td>{format(c.cost, '$')}</td></tr
                  >{/each}</tbody
              >
            </table>
          </div>
          <div class="chart-caption">
            Expected cost = cFN × FN + cFP × FP + review cost × all reviews.
          </div>
        </details>
      {:else if config.chart === 'calibration'}<div class="chart-title">
          Predicted probability vs observed rate
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Reliability diagram showing predicted probabilities and observed defaults"
          ><line class="axis" x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} /><line
            class="axis"
            x1={pad}
            x2={pad}
            y1={pad}
            y2={H - pad}
          /><line
            x1={pad}
            x2={W - pad}
            y1={H - pad}
            y2={pad}
            stroke={gold}
            stroke-dasharray="4 4"
          />{#each g.predicted as number[] as p, i}<circle
              cx={pad + (extra.confident && i === 2 ? 0.99 : p) * (W - 2 * pad)}
              cy={H - pad - (vals.observed as number[])[i] * (H - 2 * pad)}
              r="6"
              fill={green}
            /><text
              x={pad + (extra.confident && i === 2 ? 0.99 : p) * (W - 2 * pad) + 8}
              y={H - pad - (vals.observed as number[])[i] * (H - 2 * pad) - 8}
              >{['Low', 'Medium', 'High'][i]}</text
            >{/each}<text x={W / 2 - 65} y={H - 12}>Predicted probability</text><text x={pad} y="17"
            >Observed default rate</text
          ></svg
        >
        <p class="chart-caption">
          Brier and log loss treat every loan in a band as having its band mean probability. ECE
          weights the absolute calibration gap by band size.
        </p>
      {:else if config.chart === 'forecast'}<div class="chart-title">
          Settlement outflows · $ thousands
        </div>
        <div class="chart-legend">
          <span class="legend-green">Actual</span><span class="legend-gold">Forecast</span><span
            >Dashed: baseline</span
          ><span>Shaded: forecast interval</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Actual outflows, forecasts, baseline, and shaded prediction interval on the same days"
          ><line class="axis" x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} />
          <line class="axis" x1={pad} x2={pad} y1={pad} y2={H - pad} />
          <text x={pad} y="17">Outflow · $ thousands</text>
          <text x={pad - 6} y={pad + 4} text-anchor="end">{Math.round(forecastDomain[1])}</text>
          <text x={pad - 6} y={H - pad + 4} text-anchor="end">{Math.round(forecastDomain[0])}</text>
          <path data-forecast-interval d={forecastBand} fill={gold} opacity="0.18" />
          <path
            d={path(g.actual as number[], forecastDomain)}
            fill="none"
            stroke={green}
            stroke-width="2.5"
          /><path
            d={path(g.predicted as number[], forecastDomain)}
            fill="none"
            stroke={gold}
            stroke-width="2.5"
          /><path
            d={path(g.baseline as number[], forecastDomain)}
            fill="none"
            stroke={blue}
            stroke-width="1.5"
            stroke-dasharray="5 4"
          />{#each g.actual as number[] as v, i}<text
              x={pad + (i * (W - 2 * pad)) / ((g.actual as number[]).length - 1) - 10}
              y={H - 12}>D{i + 1}</text
            ><circle
              cx={pad + (i * (W - 2 * pad)) / ((g.actual as number[]).length - 1)}
              cy={forecastY(v)}
              r="4"
              fill={green}
            />{/each}</svg
        >
      {:else if config.chart === 'graph'}<div class="chart-title">
          Shared connections at the cutoff
        </div>
        <svg
          viewBox="0 0 440 250"
          role="img"
          aria-label="Two connected components of accounts, devices, and merchants"
          >{#each graphEdges as [a, b]}<line
              x1={graphNodes[a].x}
              y1={graphNodes[a].y}
              x2={graphNodes[b].x}
              y2={graphNodes[b].y}
              stroke={green}
              stroke-width="2"
            />{/each}{#each graphNodes as node, i}<circle
              cx={node.x}
              cy={node.y}
              r={node.id === ['A', 'B', 'C', 'D'][extra.account] ? 20 : 16}
              fill={node.id.length === 1 ? green : gold}
            /><text x={node.x} y={node.y + 35} text-anchor="middle">{node.id}</text>{/each}</svg
        >
        <p class="chart-caption">
          A to C: A, Device 7, B, Merchant 9, C. Four edges. Device sharing is a link to
          investigate.
        </p>
      {:else if config.chart === 'clusters'}<div class="chart-title">
          Savings behavior · one-dimensional assignment
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Savings percentages assigned to two clusters"
          ><line
            class="axis"
            x1={pad}
            x2={W - pad}
            y1="130"
            y2="130"
          />{#each g.points as number[] as p, i}<circle
              cx={pad + (p / 100) * (W - 2 * pad)}
              cy={extra.iteration === 0 ? 100 : (vals.groups as number[])[i] === 1 ? 90 : 155}
              r="7"
              fill={(vals.groups as number[])[i] === 1 ? green : gold}
            /><text
              x={pad + (p / 100) * (W - 2 * pad)}
              y={extra.iteration === 0 ? 80 : (vals.groups as number[])[i] === 1 ? 65 : 185}
              text-anchor="middle">{p}%</text
            >{/each}{#each clusterCenters as c, i}<path
              d={`M${pad + (c / 100) * (W - 2 * pad) - 6},124 l12,0 l0,12 l-12,0 Z`}
              fill={i === 0 ? green : gold}
            />{/each}<path
            d={`M${pad + (Number(g.newPoint) / 100) * (W - 2 * pad)},100 l6,7 l-6,7 l-6,-7 Z`}
            fill={blue}
          />
          <text x={pad} y="17">Savings rate (%) · new customer: {g.newPoint}%</text>
          <text x={pad} y={H - 12}>Squares: centers · Diamond: new customer</text></svg
        >
      {:else if config.chart === 'portfolio'}<div class="chart-title">
          Return constraint and stock allocation
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Expected portfolio return with required minimum and selected weight"
          >{#if feasibleWeights.length}<rect
              x={pad + feasibleWeights[0] * (W - 2 * pad)}
              y={pad}
              width={(feasibleWeights[feasibleWeights.length - 1] - feasibleWeights[0]) *
                (W - 2 * pad)}
              height={H - 2 * pad}
              fill="var(--green-soft)"
            />{/if}
          <text x={pad} y="17">Expected return</text><line
            class="axis"
            x1={pad}
            x2={W - pad}
            y1={H - pad}
            y2={H - pad}
          />
          <path
            d={`M${pad},${portfolioY(Number(g.bondReturn))} L${W - pad},${portfolioY(Number(g.stockReturn))}`}
            stroke={green}
            stroke-width="2.5"
            fill="none"
          /><line
            x1={pad}
            x2={W - pad}
            y1={portfolioY(Number(g.minimum))}
            y2={portfolioY(Number(g.minimum))}
            stroke={gold}
            stroke-dasharray="4 4"
          /><circle
            cx={pad + extra.weight * (W - 2 * pad)}
            cy={portfolioY(Number(vals.selectedReturn))}
            r="6"
            fill={green}
          /><text x={pad} y={H - 12}>0% stocks</text><text x={W - pad - 70} y={H - 12}
            >100% stocks</text
          ></svg
        >
        <p class="chart-caption">
          Shaded region meets the return constraint. The allowed stock weights entered above are
          {(g.weights as number[]).map((weight) => format(weight, 'proportion')).join(', ')}. The
          slider also lets you explore allocations between those choices.
        </p>
      {:else if config.chart === 'operations'}
        {#each operationGroups as group}
          {@const scale = scaleLinear()
            .domain([0, Math.max(1, ...group.entries.map((entry) => entry.value)) * 1.2])
            .range([0, W - 2 * pad])}
          <div class="chart-title">{group.title}</div>
          <svg viewBox="0 0 440 160" role="img" aria-label={group.title}>
            {#each group.entries as entry, i}
              <text x={pad} y={28 + i * 60}>{entry.label}: {format(entry.value)}</text>
              <rect
                x={pad}
                y={36 + i * 60}
                width={scale(entry.value)}
                height="22"
                rx="3"
                fill={i ? gold : green}
              />
            {/each}
            <text x={pad} y="148">0</text><text x={W - pad} y="148" text-anchor="end"
              >{group.title}</text
            >
          </svg>
        {/each}
      {:else}<div class="chart-title">
          {(
            {
              montecarlo: 'Loss probabilities for two independent loans',
              attention: 'Attention weights by token',
              isolation: 'Anomaly scores by transaction',
              boosting: 'Log-odds after each tree',
              drift: 'Current share in each score band',
              fairness: 'Approval and error rates by group',
              execution: 'Q-values before and after the update',
              operations: 'Scoring and review rates',
              retrieval: 'Cosine similarity to the question',
              bars: 'Gini impurity before and after the split',
            } as Record<string, string>
          )[config.chart]}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Live ${config.title} comparison`}>
          <text x={pad} y="17">{guide.axisLabel}</text>
          <line class="zero-axis" x1={pad} x2={W - pad} y1={barY(0)} y2={barY(0)} />
          <text x={pad - 8} y={barY(0) + 4} text-anchor="end">0</text>
          {#each bars as b, i}{@const width = (W - 2 * pad) / Math.max(1, bars.length)}<rect
              x={pad + i * width + width * 0.2}
              y={Math.min(barY(0), barY(b.value))}
              width={width * 0.6}
              height={Math.abs(barY(b.value) - barY(0))}
              rx="3"
              fill={i % 2 ? gold : green}
              opacity={config.chart === 'retrieval' && i >= extra.K ? 0.25 : 1}
            /><text
              x={pad + i * width + width * 0.5}
              y={b.value >= 0 ? barY(b.value) - 7 : barY(b.value) + 14}
              text-anchor="middle">{b.value.toFixed(Math.abs(b.value) < 1 ? 3 : 2)}</text
            ><text
              x={pad + i * width + width * 0.5}
              y={H - 15}
              text-anchor="middle"
              style="font-size:10px">{b.label}</text
            >{/each}
        </svg>{#if config.chart === 'retrieval'}<p class="chart-caption">
            Left to right: supplied ranking. Full-color bars are retrieved; faded bars are outside
            the selected count. Editing vectors changes similarity scores; the ranking button
            compares the two supplied orders.
          </p>{/if}{#if config.chart === 'montecarlo'}<p class="chart-caption">
            Simulation uses a fixed seed, {extra.paths} runs, and two independent loans. Readouts compare
            it with the original five-run exercise.
          </p>{/if}{/if}
    </div>
  </div>
  {#if error}<p class="widget-error" role="alert">{error}</p>{/if}
  <div class="widget-readouts" aria-live="polite" aria-atomic="false">
    {#each primaryEntries as [key, value]}{@render readout(key, value, true)}{/each}
  </div>
  <p class="live-interpretation" aria-live="polite">{interpretation}</p>
  <details class="more-results">
    <summary>More results and context</summary>
    <div class="widget-readouts">
      {#each moreEntries as [key, value]}{@render readout(key, value, false)}{/each}
    </div>
    <div class="widget-notice">{notice}</div>
  </details>
  <div class="widget-reset">
    <button
      class="button quiet"
      onclick={() => {
        g = cloneGivens(exercise.givens);
        extra = { ...defaults };
        error = '';
        prediction = '';
      }}>Reset example</button
    >
  </div>
</section>

<style>
  .guided-widget {
    border-radius: 12px;
  }
  .guided-widget .widget-header {
    align-items: flex-start;
    border-bottom: 0;
    padding-bottom: 0.4rem;
  }
  .widget-eyebrow {
    display: block;
    font-size: 0.78rem;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }
  .guided-widget .widget-header h3 {
    font-size: 1.12rem;
    line-height: 1.45;
  }
  .widget-reset {
    padding: 0 1rem 1rem;
    text-align: right;
  }
  .experiment-intro {
    padding: 0 1.2rem;
  }
  .experiment-intro p {
    font-size: 0.92rem;
    margin: 0.5rem 0 0.8rem;
  }
  .guided-widget summary {
    cursor: pointer;
    color: var(--green);
    min-height: 44px;
    align-content: center;
    font-size: 0.85rem;
  }
  .prediction-prompt summary span {
    color: var(--muted);
  }
  .prediction-prompt label {
    display: block;
    font-size: 0.85rem;
    margin: 0.4rem 0;
  }
  .prediction-prompt textarea {
    width: 100%;
    min-height: 70px;
    padding: 0.7rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    resize: vertical;
  }
  .guided-widget .widget-layout {
    grid-template-columns: minmax(190px, 0.8fr) minmax(0, 1.5fr);
    align-items: start;
  }
  .guided-widget .widget-controls,
  .advanced-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }
  .advanced-controls {
    padding-top: 0.6rem;
  }
  .guided-widget .widget-field label {
    font-size: 0.85rem;
    color: var(--ink);
  }
  .guided-widget .widget-field input[type='number'] {
    min-height: 44px;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  .guided-widget .widget-field input[type='text'],
  .guided-widget .widget-field select {
    min-height: 44px;
    max-width: 100%;
  }
  .guided-widget .widget-field input[type='range'] {
    min-height: 30px;
  }
  .control-baseline,
  .readout-baseline {
    display: block;
    color: var(--muted);
    font-size: 0.73rem;
    overflow-wrap: anywhere;
  }
  .control-baseline {
    margin-top: 0.2rem;
  }
  .readout-baseline {
    margin-top: 0.35rem;
  }
  .guided-widget .widget-chart {
    border: 0;
    background: var(--canvas);
  }
  .guided-widget .readout.primary {
    background: var(--canvas);
    border: 0;
    border-top: 2px solid var(--green);
    border-radius: 0;
  }
  .guided-widget .readout .label {
    font-size: 0.78rem;
  }
  .guided-widget .readout .value {
    font-size: 0.98rem;
  }
  .comparison-toggle {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    font-size: 0.85rem;
    min-height: 44px;
  }
  .comparison-toggle input {
    margin-top: 0.25rem;
    accent-color: var(--green);
  }
  .live-interpretation {
    padding: 0 1.2rem 1.2rem;
    font-size: 0.92rem;
    margin: 0 !important;
    line-height: 1.65;
  }
  .more-results {
    border-top: 1px solid var(--line);
  }
  .more-results > summary {
    padding: 0.2rem 1.2rem;
  }
  .more-results .widget-readouts {
    padding-top: 0.8rem;
  }
  .guided-widget .zero-axis {
    stroke: var(--muted);
    stroke-width: 1;
  }
  .guided-widget svg circle,
  .guided-widget svg rect {
    transition:
      cx 0.15s,
      cy 0.15s,
      y 0.15s,
      height 0.15s;
  }
  .guided-widget :is(input, select, textarea, button, summary):focus-visible {
    outline: 3px solid var(--green);
    outline-offset: 3px;
  }
  @media (max-width: 799px) {
    .guided-widget .widget-layout {
      grid-template-columns: 1fr;
    }
    .guided-widget .widget-controls {
      display: flex;
    }
    .guided-widget .widget-readouts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .guided-widget .widget-header {
      flex-direction: column;
      padding: 0.9rem;
    }
    .experiment-intro {
      padding: 0 0.9rem;
    }
    .guided-widget .widget-layout {
      padding: 0.9rem;
    }
    .guided-widget .widget-readouts {
      grid-template-columns: 1fr;
    }
    .live-interpretation {
      padding: 0 0.9rem 1rem;
    }
    .guided-widget .widget-field label {
      gap: 0.75rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .guided-widget svg circle,
    .guided-widget svg rect {
      transition: none;
    }
  }
</style>
