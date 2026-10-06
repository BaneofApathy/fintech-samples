export const widgets = [
  {
    id: 'sigmoid-el',
    title: 'Sigmoid & expected loss',
    exercise: 'A01',
    chart: 'sigmoid',
    notice:
      'Expected loss is the probability-weighted average dollars lost across comparable loans under these assumptions; it is not a guaranteed loss on this one loan. Review asks a person to check the application and is not the same as rejection.',
  },
  {
    id: 'confusion-builder',
    title: 'Confusion matrix builder',
    exercise: 'M01',
    chart: 'confusion',
    notice:
      'Separate fraud capture, missed fraud, and legitimate-customer interruptions before choosing a measure.',
  },
  {
    id: 'threshold-explorer',
    title: 'Threshold & decision cost',
    exercise: 'M08',
    chart: 'threshold',
    notice:
      'This illustration compares the cost of passing a fraudulent transaction with the cost of flagging a legitimate one. Choose thresholds using validation data and check review capacity.',
  },
  {
    id: 'calibration-lab',
    title: 'Calibration lab',
    exercise: 'M14',
    chart: 'calibration',
    notice:
      'Compare each band’s predicted probability with its observed default rate. Their difference is a calibration gap for this sample.',
  },
  {
    id: 'gini-split',
    title: 'Gini split & forest score',
    exercise: 'A02',
    chart: 'bars',
    notice:
      'Weight each child’s impurity by its share of the records. An unweighted average gives small and large groups equal influence.',
  },
  {
    id: 'boosting-steps',
    title: 'Boosting one correction at a time',
    exercise: 'A03',
    chart: 'boosting',
    notice:
      'Tree outputs are score corrections on the log-odds scale, not percentage-point changes in probability. This comparison holds the supplied tree outputs fixed; retraining with another learning rate can produce different trees.',
  },
  {
    id: 'kmeans-anim',
    title: 'Assign, update, compare clusters',
    exercise: 'A04',
    chart: 'clusters',
    notice:
      'The groups represent lower and higher observed savings rates. The groups alone do not justify credit decisions.',
  },
  {
    id: 'isolation-paths',
    title: 'Isolation paths & anomaly scores',
    exercise: 'A05',
    chart: 'isolation',
    notice:
      'A shorter average isolation path gives a higher anomaly score. The score measures unusualness, not the probability of fraud.',
  },
  {
    id: 'forecast-eval',
    title: 'Forecast errors & intervals',
    exercise: 'M20',
    chart: 'forecast',
    notice:
      'Show the dollar error, the large misses, interval coverage, and interval width. Compare with the baseline on the same observations.',
  },
  {
    id: 'entity-graph',
    title: 'Trace the entity network',
    exercise: 'A07',
    chart: 'graph',
    notice:
      'Shared use of a device or merchant may warrant investigation, but it is not proof of fraud.',
  },
  {
    id: 'attention-mini',
    title: 'A small attention calculation',
    exercise: 'A08',
    chart: 'attention',
    notice:
      'This example illustrates attention and classification with supplied scalar values. It does not run FinBERT.',
  },
  {
    id: 'retrieval-rank',
    title: 'Retrieval ranking & evidence',
    exercise: 'A09',
    chart: 'retrieval',
    notice:
      'Both revenue figures are needed; retrieval finds the evidence and arithmetic establishes the growth rate.',
  },
  {
    id: 'portfolio-feasible',
    title: 'Feasible portfolio explorer',
    exercise: 'A10',
    chart: 'portfolio',
    notice:
      'Compare variance only after checking feasibility. A low-risk allocation can fail a mandatory return requirement.',
  },
  {
    id: 'execution-update',
    title: 'Q-learning & implementation shortfall',
    exercise: 'A11',
    chart: 'execution',
    notice:
      'A positive update error raises the Q-value, meaning this observation makes the action look better. Neither the target nor the updated value is a probability.',
  },
  {
    id: 'monte-carlo-loss',
    title: 'Simulate loan portfolio losses',
    exercise: 'A12',
    chart: 'montecarlo',
    notice:
      'More independent runs reduce simulation noise. They do not validate the assumed default probability or the independence of the two loans.',
  },
  {
    id: 'fairness-rates',
    title: 'Compare group error rates',
    exercise: 'M19',
    chart: 'fairness',
    notice:
      'Use the stated retrospective benchmark. Equal false-positive rates do not settle the fairness question.',
  },
  {
    id: 'psi-drift',
    title: 'Population stability by bin',
    exercise: 'M38',
    chart: 'drift',
    notice:
      'The calculation describes a distribution shift. It does not prove that model accuracy has deteriorated.',
  },
  {
    id: 'ops-budget',
    title: 'Operating capacity & cost',
    exercise: 'M39b',
    chart: 'operations',
    notice:
      'Check API capacity and human review capacity separately. A faster scoring service does not give investigators more time to review alerts.',
  },
] as const;
export type WidgetId = (typeof widgets)[number]['id'];

export function widgetNotice(
  id: string,
  givens: Givens,
  values: Record<string, Value>,
  extra: Record<string, number>,
): string {
  const base = widgets.find((widget) => widget.id === id)?.notice ?? '';
  if (id === 'sigmoid-el')
    return `With these inputs, expected loss is ${format(values.EL, '$')} per comparable loan. ${base}`;
  if (id === 'calibration-lab') {
    const probabilities = givens.predicted as number[];
    const defaults = givens.defaults as number[];
    const counts = givens.counts as number[];
    const probability = extra.confident ? 0.99 : probabilities[2];
    const observed = defaults[2] / counts[2];
    const gap = (observed - probability) * 100;
    const comparison =
      Math.abs(gap) < 1e-9
        ? 'matches the observed rate'
        : `is ${format(Math.abs(gap))} percentage points ${gap > 0 ? 'below' : 'above'} the observed rate`;
    return `The high band predicts ${format(probability, 'proportion')} and observes ${format(observed, 'proportion')}. Its prediction ${comparison}.${extra.confident ? ' The 99% comparison updates the chart, expected counts, expected loss, Brier score, log loss, and ECE from the same active probabilities.' : ''}`;
  }
  return base;
}

const readoutLabels: Record<string, string> = {
  TP: 'True positives',
  FP: 'False positives',
  FN: 'False negatives',
  TN: 'True negatives',
  N: 'Total transactions',
  accuracy: 'Accuracy',
  precision: 'Precision',
  recall: 'Recall',
  specificity: 'Specificity',
  FPR: 'False-positive rate',
  FNR: 'False-negative rate',
  balanced: 'Balanced accuracy',
  F1: 'F1 score',
  F2: 'F2 score',
  Fbeta: 'F-beta score',
  threshold: 'Decision threshold',
  AUC: 'ROC-AUC',
  AP: 'Average precision',
  KS: 'KS statistic',
  lift: 'Lift',
  expectedCost: 'Expected decision cost',
  reviewLoad: 'Alerts to review',
  z: 'Log-odds score',
  p: 'Predicted default probability',
  odds: 'Default odds',
  lossOnDefault: 'Loss if default occurs',
  EL: 'Expected loss',
  expected: 'Expected defaults by band',
  observed: 'Observed default rates by band',
  gaps: 'Observed minus predicted rate by band',
  expectedTotal: 'Total expected defaults',
  actualTotal: 'Total observed defaults',
  realized: 'Realized loss',
  difference: 'Realized loss minus expected loss',
  Brier: 'Brier score',
  logLoss: 'Log loss',
  ECE: 'Mean absolute calibration gap (ECE)',
  parent: 'Parent Gini impurity',
  newGini: 'New-device Gini impurity',
  trustedGini: 'Trusted-device Gini impurity',
  weighted: 'Weighted child impurity',
  gain: 'Reduction in Gini impurity',
  score: 'Mean forest score',
  firstDecision: 'First tree flags for review?',
  smallF1: 'Score after tree 1 at comparison learning rate',
  smallF2: 'Score after tree 2 at comparison learning rate',
  smallP: 'Default probability at comparison learning rate',
  smallDecision: 'Review at comparison learning rate?',
  groups: 'Assigned cluster for each customer',
  c1: 'Updated center 1',
  c2: 'Updated center 2',
  d1: 'Distance to center 1',
  d2: 'Distance to center 2',
  group: 'Nearest cluster for new customer',
  inertia: 'Within-cluster squared distance',
  silhouettes: 'Silhouette scores by customer',
  silhouette: 'Mean silhouette score',
  means: 'Mean isolation path lengths',
  scores: 'Anomaly scores for A, B, and C',
  top: 'Highest-scoring item (1 = A, 2 = B, 3 = C)',
  MAE: 'Mean absolute error ($ thousands)',
  RMSE: 'Root mean squared error ($ thousands)',
  MAPE: 'Mean absolute percentage error',
  WAPE: 'Weighted absolute percentage error',
  MASE: 'Mean absolute scaled error',
  R2: 'R²',
  actualMean: 'Mean actual outflow ($ thousands)',
  SSE: 'Squared forecast errors (sum)',
  SST: 'Squared deviations from actual mean (sum)',
  naiveScale: 'Training naive-error scale',
  baselineMAE: 'Baseline MAE ($ thousands)',
  coverage: 'Interval coverage',
  intervalWidth: 'Interval width ($ thousands)',
  pinball: 'Mean pinball loss (weighted $ thousands)',
  similarities: 'Cosine similarities for passages A, B, and C',
  growth: 'Revenue growth',
  recallAtK: 'Relevant-passage recall@K',
  contextPrecision: 'Relevant share of retrieved passages',
  MRR: 'Reciprocal rank of first relevant passage',
  nDCG: 'nDCG of the full three-passage order',
  components: 'Connected components',
  sizes: 'Component sizes',
  degrees: 'Degrees of accounts A, B, C, and D',
  edges: 'Edges on the shortest A-to-C path',
  proof: 'Do shared links prove fraud?',
  selectedDegree: 'Selected account’s degree',
  selectedComponent: 'Nodes in selected account’s component',
  selectedPageRank: 'Selected account’s PageRank',
  accountPageRanks: 'PageRank of accounts A, B, C, and D',
  weights: 'Attention weights',
  h: 'Attention-weighted representation',
  classLogits: 'Positive, neutral, and negative logits',
  probabilities: 'Positive, neutral, and negative probabilities',
  returns: 'Expected returns of allowed allocations',
  variances: 'Variances of allowed allocations',
  volatilities: 'Volatilities of allowed allocations',
  weight: 'Selected feasible stock weight',
  stockDollars: 'Stock allocation',
  bondDollars: 'Bond allocation',
  selectedReturn: 'Slider allocation’s expected return',
  selectedVolatility: 'Slider allocation’s volatility',
  feasible: 'Does the slider allocation meet minimum return?',
  selectedStocks: 'Slider allocation in stocks',
  best: 'Highest next-state Q-value',
  target: 'Q-learning update target',
  error: 'Temporal-difference error',
  updated: 'Updated Q-value',
  terminal: 'Target if the episode ends',
  shortfall: 'Implementation shortfall',
  shortfallBps: 'Shortfall (basis points)',
  completion: 'Order filled',
  losses: 'Losses in the five supplied runs',
  mean: 'Mean loss in supplied runs',
  breach: 'Reserve-breach rate in supplied runs',
  analytical: 'Analytical expected loss',
  exact: 'Exact reserve-breach probability',
  simulationMean: 'Mean simulated loss',
  reserveBreach: 'Simulated reserve-breach rate',
  simulationSE: 'Monte Carlo standard error',
  VaR95: 'Simulated 95% VaR',
  ES95: 'Mean loss in worst 5% of runs',
  selectionA: 'Group A approval rate',
  selectionB: 'Group B approval rate',
  ratio: 'B/A approval-rate ratio',
  TPRA: 'Group A repayer approval rate',
  TPRB: 'Group B repayer approval rate',
  gap: 'A-minus-B repayer approval-rate gap',
  FPRA: 'Group A non-repayer approval rate',
  FPRB: 'Group B non-repayer approval rate',
  terms: 'PSI contributions by band',
  PSI: 'Population Stability Index',
  shift: 'Change in higher-risk band share',
  capacity: 'API capacity (requests per second)',
  requestBacklog: 'Requests waiting after the load test',
  human: 'Human review capacity per day',
  dailyBacklog: 'Daily growth in unreviewed alerts',
  alertBacklog: 'Alerts waiting after the selected days',
  requiredPace: 'Reviews needed per analyst per day',
  monthlyInference: 'Monthly inference cost',
  costPerCorrect: 'Cost per correct resolution in the fixed workflow example',
};

export function widgetReadoutLabel(id: string, key: string): string {
  if (id === 'boosting-steps' && (key === 'F1' || key === 'F2'))
    return `Log-odds score after tree ${key.slice(1)}`;
  if (key === 'decision') {
    if (id === 'attention-mini') return 'Accept the automatic sentiment label?';
    if (id === 'execution-update') return 'Does the updated action outrank waiting?';
    return 'Send to review?';
  }
  return readoutLabels[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
}

export function widgetReadoutUnit(id: string, key: string): string | undefined {
  if (id === 'boosting-steps' && ['F1', 'F2', 'smallF1', 'smallF2'].includes(key)) return '';
  if (
    id === 'gini-split' &&
    ['parent', 'newGini', 'trustedGini', 'weighted', 'gain', 'score'].includes(key)
  )
    return '';
  if (id === 'calibration-lab' && ['observed', 'gaps'].includes(key)) return 'proportion';
  if (id === 'portfolio-feasible' && ['returns', 'volatilities'].includes(key)) return 'proportion';
  if (
    id === 'portfolio-feasible' &&
    ['stockDollars', 'bondDollars', 'selectedStocks'].includes(key)
  )
    return '$';
  if (id === 'monte-carlo-loss' && ['lossOnDefault', 'losses', 'mean', 'analytical'].includes(key))
    return '$';
  if (
    id === 'fairness-rates' &&
    ['selectionA', 'selectionB', 'TPRA', 'TPRB', 'FPRA', 'FPRB', 'gap'].includes(key)
  )
    return 'proportion';
  if (id === 'psi-drift' && key === 'shift') return 'proportion';
  if (key === 'growth') return 'proportion';
  return undefined;
}
import { format } from '../../engine/check';
import type { Givens, Value } from '../../engine/types';
