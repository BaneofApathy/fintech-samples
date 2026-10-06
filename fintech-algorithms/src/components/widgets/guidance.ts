import type { Givens, Value } from '../../engine/types';
import { format } from '../../engine/check';
import type { WidgetId } from './catalog';

export const widgetDefaults = {
  beta: 2,
  threshold: 0.1,
  cFN: 4000,
  cFP: 450,
  cReview: 18,
  confident: 0,
  width: 20,
  tau: 0.95,
  reverse: 0,
  K: 2,
  account: 0,
  weight: 0.5,
  close: 50.3,
  paths: 2500,
  transactions: 50000000,
  unitCost: 0.003,
  iteration: 0,
};

export type WidgetGuide = {
  question: string;
  experiment: string;
  prediction: string;
  primaryControls: string[];
  primaryResults: string[];
  axisLabel: string;
};

export const widgetGuides: Record<WidgetId, WidgetGuide> = {
  'sigmoid-el': {
    question: 'If the applicant stays the same, what changes when the lender raises the review cutoff?',
    experiment:
      'Move the review cutoff from 0.08 (8%) to 0.12 (12%). Keep every applicant detail fixed so you can isolate the effect of the policy change.',
    prediction: 'Before you move it, predict whether the probability estimate, expected loss, review decision, or more than one will change.',
    primaryControls: ['threshold'],
    primaryResults: ['p', 'decision', 'EL'],
    axisLabel: 'Estimated chance of default (0% to 100%)',
  },
  'confusion-builder': {
    question: 'If one more actual fraud is caught while 50 alerts stay fixed, what changes?',
    experiment:
      'Start with 15 frauds caught among 50 flagged transactions and 20 actual frauds. Change caught from 15 to 16 while keeping the total alerts and actual fraud count fixed. One fewer alert is then a false positive, and one fewer fraud is missed. These are counts at the illustrated cutoff, not model probabilities.',
    prediction:
      'Before changing the count, predict what happens to precision (frauds among alerts) and recall (frauds caught among all actual frauds).',
    primaryControls: ['caught', 'alerts'],
    primaryResults: ['precision', 'recall', 'FP'],
    axisLabel: 'Transactions (count)',
  },
  'threshold-explorer': {
    question: 'Which threshold balances missed fraud and review cost?',
    experiment: 'Move the threshold from 0.10 to 0.30 and compare the cost and review load.',
    prediction: 'Will fewer reviews always mean lower total cost?',
    primaryControls: ['extra.threshold', 'extra.cFN'],
    primaryResults: ['expectedCost', 'reviewLoad', 'recall'],
    axisLabel: 'Decision cost ($)',
  },
  'calibration-lab': {
    question: 'Does a more confident prediction better match the evidence?',
    experiment: 'Compare the high band with a prediction of 99%. The observed defaults stay fixed.',
    prediction: 'Will the calibration gap grow or shrink?',
    primaryControls: ['extra.confident'],
    primaryResults: ['ECE', 'Brier', 'logLoss'],
    axisLabel: 'Observed default rate',
  },
  'gini-split': {
    question: 'Does separating new-device and trusted-device payments make the groups less mixed?',
    experiment: 'Change the fraud and legitimate counts for each device group. Compare the mixedness of the full group with the size-weighted mixedness after the split.',
    prediction: 'If a very small group becomes pure but a much larger group stays mixed, will the full split gain be large?',
    primaryControls: ['counts'],
    primaryResults: ['parent', 'weighted', 'gain'],
    axisLabel: 'Gini impurity (how mixed the outcomes are)',
  },
  'boosting-steps': {
    question: 'How does changing the learning rate change the total correction from two trees?',
    experiment:
      'Change the learning rate from 0.50 to 0.25 while leaving the starting score and both supplied tree outputs fixed. Follow how much of each correction is added; a full retraining could also change what later trees learn.',
    prediction: 'With the same two tree outputs, will the smaller rate move the final score farther from or closer to the starting score?',
    primaryControls: ['eta', 'h1'],
    primaryResults: ['F2', 'p', 'decision'],
    axisLabel: 'Combined model score (log-odds)',
  },
  'kmeans-anim': {
    question: 'Which group is closest after the savings-rate centers move?',
    experiment:
      'Keep the listed customers and their savings rates fixed. Assign each to its nearest center, recalculate each center as its group average, and change only the new customer’s savings rate to see which center is closer.',
    prediction: 'At a 35% savings rate, which updated center is nearer?',
    primaryControls: ['newPoint', 'extra.iteration'],
    primaryResults: ['c1', 'c2', 'group'],
    axisLabel: 'Savings rate (%)',
  },
  'isolation-paths': {
    question: 'Which transaction is easiest to isolate?',
    experiment: 'The listed path lengths and normalization value stay fixed except for the one path value you change. Shorten the first transaction’s paths and watch how its average and score move. A shorter path means fewer random cuts were needed to separate it from the reference transactions.',
    prediction: 'If the first transaction needs fewer cuts on average, will its anomaly score rise or fall under this formula?',
    primaryControls: ['paths'],
    primaryResults: ['means', 'scores', 'top'],
    axisLabel: 'Anomaly score',
  },
  'forecast-eval': {
    question: 'How often does the forecast range contain a later outflow, and how wide is that range?',
    experiment:
      'The actual outflows and point forecasts stay fixed. Increase only the interval half-width to make the shaded range wider, then watch which observations it includes. A wider range can capture more actuals without changing the forecast line.',
    prediction: 'If the range gets wider, does the point forecast itself change, or only the range around it?',
    primaryControls: ['extra.width'],
    primaryResults: ['coverage', 'intervalWidth', 'MAE'],
    axisLabel: 'Outflow ($ thousands)',
  },
  'entity-graph': {
    question: 'How is each account connected, and what can a link safely tell us?',
    experiment: 'The graph and its links stay fixed while you select Account B or Account D. Trace each account’s component and count its direct neighbors. A path shows recorded connectivity; it does not show that money moved or prove misconduct.',
    prediction: 'Which selected account has more direct neighbors in this graph?',
    primaryControls: ['extra.account'],
    primaryResults: ['selectedDegree', 'selectedComponent', 'selectedPageRank'],
    axisLabel: 'Accounts and shared entities',
  },
  'attention-mini': {
    question: 'How do token scores affect the combined representation and its later label probabilities?',
    experiment:
      'The two token values and the teaching classifier stay fixed. Change the already-scaled attention scores to shift how much each token contributes, then compare the separate class probabilities. Attention weights describe token mixing; class probabilities describe labels.',
    prediction: 'If one token receives a larger share of attention, does that directly set the probability of its sentiment label?',
    primaryControls: ['logits', 'threshold'],
    primaryResults: ['weights', 'probabilities', 'decision'],
    axisLabel: 'Attention weight',
  },
  'retrieval-rank': {
    question: 'Did search return both passages needed for a supported growth calculation?',
    experiment: 'The query and the three source passages stay fixed. Change K to retrieve more or fewer top-ranked passages, or reverse their order to test a weak ranking. Watch whether both old and new revenue figures reach the answer stage; a similarity score alone cannot support either figure.',
    prediction: 'If search returns only the new-period revenue, can it establish the growth rate?',
    primaryControls: ['extra.K', 'extra.reverse'],
    primaryResults: ['recallAtK', 'contextPrecision', 'MRR'],
    axisLabel: 'Cosine similarity',
  },
  'portfolio-feasible': {
    question: 'Which allocations meet the minimum estimated return, and what is their estimated volatility?',
    experiment: 'Move the stock share. The bond share automatically becomes the remainder, so the total stays at 100%. Watch the return and volatility estimates change.',
    prediction: 'Could the lowest-volatility allocation be unusable because it misses the return minimum?',
    primaryControls: ['extra.weight', 'minimum'],
    primaryResults: ['selectedReturn', 'selectedVolatility', 'feasible'],
    axisLabel: 'Expected return',
  },
  'execution-update': {
    question: 'After this result, is buying now estimated to be better than waiting?',
    experiment:
      'Keep the next-action values fixed. Change the immediate reward to change the target, or change the learning rate to change how far the old Q-value moves toward it. Compare the updated estimate with waiting.',
    prediction: 'If both action values are negative costs, can the less negative value still be preferred?',
    primaryControls: ['reward', 'alpha'],
    primaryResults: ['target', 'updated', 'decision'],
    axisLabel: 'Q-value (reward units)',
  },
  'monte-carlo-loss': {
    question: 'Under these assumptions, how often does simulated loss exceed the reserve?',
    experiment: 'First raise one loan’s default chance while the balances, loss fractions, reserve, and number of trials stay fixed. Then increase the trial count without changing those assumptions; compare the breach estimate and its sampling error.',
    prediction: 'If many more trials give a steadier estimate, have they shown that the default chances or co-movement assumptions are correct?',
    primaryControls: ['PD', 'extra.paths'],
    primaryResults: ['reserveBreach', 'simulationMean', 'simulationSE'],
    axisLabel: 'Probability',
  },
  'fairness-rates': {
    question: 'Do these groups experience the same approval errors?',
    experiment: 'Change Group B approvals while holding its applicant and repayment counts fixed. Then change approvals among its repayers and compare the within-group rates with Group A.',
    prediction: 'Can groups have the same approval share but different approval rates among repayers or non-repayers?',
    primaryControls: ['approvedB', 'TPB'],
    primaryResults: ['selectionB', 'gap', 'FPRB'],
    axisLabel: 'Rate (proportion)',
  },
  'psi-drift': {
    question: 'How far has the population moved from its reference mix?',
    experiment: 'Change the two current shares together, keeping their sum equal to 1.',
    prediction: 'What should PSI be when current shares match the reference?',
    primaryControls: ['current'],
    primaryResults: ['PSI', 'shift'],
    axisLabel: 'Population share',
  },
  'ops-budget': {
    question: 'Where does the workflow run out of capacity?',
    experiment: 'Increase analysts and then arriving requests. Watch the two queues separately.',
    prediction: 'Will adding analysts reduce the API request backlog?',
    primaryControls: ['analysts', 'arrival'],
    primaryResults: ['requestBacklog', 'dailyBacklog', 'alertBacklog'],
    axisLabel: 'Capacity and arrival rates',
  },
};

export function widgetInterpretation(
  id: WidgetId,
  g: Givens,
  v: Record<string, Value>,
  extra: Record<string, number>,
): string {
  const number = (key: string) => format(v[key]);
  const percent = (key: string) => format(v[key], 'proportion');
  switch (id) {
    case 'sigmoid-el':
      return `Estimated risk is ${percent('p')}; the threshold is ${format(g.threshold, 'proportion')}. ${v.decision ? 'Send this application to review.' : 'This application is below the review threshold.'} Changing only the threshold changes the action, while estimated risk and expected loss stay the same.`;
    case 'confusion-builder':
      return `${number('TP')} actual frauds were caught; ${number('FP')} legitimate transactions were flagged by mistake; ${number('FN')} frauds were missed; and ${number('TN')} legitimate transactions were passed. Precision is ${percent('precision')} of flagged transactions that were fraud. Recall is ${percent('recall')} of all actual fraud that was caught. These are counts and rates at the selected example settings, not calibrated probabilities or proof about future transactions.`;
    case 'threshold-explorer':
      return `At ${format(extra.threshold, 'proportion')}, ${number('reviewLoad')} transactions need review and ${number('FN')} frauds are missed. Their combined decision cost is ${format(v.expectedCost, '$')}.`;
    case 'calibration-lab':
      return `The average absolute calibration gap is ${percent('ECE')}. Smaller gaps mean predicted probabilities are closer to the observed rates in this sample.`;
    case 'gini-split':
      return `The full group’s Gini impurity is ${number('parent')}; after the split, the size-weighted child impurity is ${number('weighted')}. The reduction is ${number('gain')}. Larger child groups count more because they contain more transactions. This describes the supplied counts, not how well the split predicts future payments.`;
    case 'boosting-steps':
      return `The two corrections produce log-odds of ${number('F2')} and default probability of ${percent('p')}. ${v.decision ? 'The score meets' : 'The score is below'} the review threshold.`;
    case 'kmeans-anim':
      return `The updated centers are ${number('c1')}% and ${number('c2')}%. The new customer is closest to group ${number('group')}. Assignment uses distance, not a creditworthiness label.`;
    case 'isolation-paths':
      return `Transaction ${['A', 'B', 'C'][Number(v.top) - 1]} has the highest anomaly score. Shorter average paths increase the score; investigate before interpreting unusualness as fraud.`;
    case 'forecast-eval':
      return `The shaded intervals cover ${percent('coverage')} of the observed outflows and span ${number('intervalWidth')} thousand dollars. The point forecast MAE is ${number('MAE')} thousand dollars; changing interval width does not change it.`;
    case 'entity-graph':
      return `Account ${['A', 'B', 'C', 'D'][extra.account]} has ${number('selectedDegree')} direct connections in a component of ${number('selectedComponent')} nodes. A shared connection provides an investigation lead.`;
    case 'attention-mini':
      return `Attention weights are ${format(v.weights, 'proportion')}. ${v.decision ? 'The largest class probability meets the automatic-label threshold.' : 'The class probabilities require review at this threshold.'} The token weights determine how values combine.`;
    case 'retrieval-rank':
      return `${extra.K} retrieved passage${extra.K === 1 ? '' : 's'} cover ${percent('recallAtK')} of the two relevant passages. ${Number(v.recallAtK) === 1 ? 'Both revenue figures are available to calculate growth.' : 'Retrieve the missing revenue evidence before calculating growth.'}`;
    case 'portfolio-feasible':
      return `With ${format(extra.weight, 'proportion')} in stocks, expected return is ${percent('selectedReturn')} and volatility is ${percent('selectedVolatility')}. This allocation ${v.feasible ? 'meets' : 'misses'} the minimum return of ${format(g.minimum, 'proportion')}.`;
    case 'execution-update':
      return `The updated Q-value is ${number('updated')}, compared with ${format(g.wait)} for waiting. ${v.decision ? 'The updated action ranks above waiting.' : 'The updated action does not rank above waiting.'} Higher values are preferred, including when both values are negative.`;
    case 'monte-carlo-loss':
      return `Across ${extra.paths.toLocaleString()} seeded runs, the reserve is breached in ${percent('reserveBreach')} of runs. The simulated mean loss is ${format(v.simulationMean, '$')}; the analytical expectation is ${format(v.analytical, '$')}.`;
    case 'fairness-rates':
      return `Group B’s approval rate is ${percent('selectionB')}. The absolute difference between groups’ approval rates among repayers is ${(Number(v.gap) * 100).toFixed(1)} percentage points. Group B’s approval rate among non-repayers is ${percent('FPRB')}. Each rate uses a different denominator, so compare them as separate questions.`;
    case 'psi-drift':
      return `PSI is ${number('PSI')} and the higher-risk band’s share changed by ${(Number(v.shift) * 100).toFixed(1)} percentage points. This quantifies a population shift; performance needs a separate check.`;
    case 'ops-budget':
      return `The API leaves ${number('requestBacklog')} requests waiting after ${g.minutes} minutes. Human review adds ${number('dailyBacklog')} unreviewed alerts per day. The charts use separate units because these are different queues.`;
  }
}

/** Include zero and retain signs; a bar must never turn a negative value positive. */
export function signedChartDomain(values: number[]): [number, number] {
  const low = Math.min(0, ...values),
    high = Math.max(0, ...values);
  if (low === 0 && high === 0) return [0, 1];
  const padding = (high - low) * 0.15;
  return [low < 0 ? low - padding : 0, high > 0 ? high + padding : 0];
}
