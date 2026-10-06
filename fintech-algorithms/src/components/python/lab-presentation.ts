// Baseline rows captured from the bundled Python runtime using labs.json and the inspection expressions below.
import generatedDataPreviews from './generated-data-previews.json';

export type LabEdit = { label: string; find: string; replace: string; description?: string };
export type LabDefinition = {
  code: string;
  edits: LabEdit[];
  metric: string;
  dataset: string;
  task: string;
  comparison: string;
  extension: string;
};
export type Preview = { caption: string; columns: string[]; rows: string[][] };
export type LabMetric = {
  label: string;
  pattern: RegExp;
  direction: 'higher' | 'lower' | 'context';
};
export type MetricValue = { label: string; value: number; direction: LabMetric['direction'] };
export type RunSnapshot = {
  stdout: string;
  stderr: string;
  figures: string[];
  metrics: MetricValue[];
  preview?: Preview;
};
const metric = (
  label: string,
  pattern: RegExp,
  direction: LabMetric['direction'] = 'context',
): LabMetric => ({ label, pattern, direction });
const number = '(-?\\d+(?:\\.\\d*)?(?:e[+-]?\\d+)?)';
const valueAfter = (label: string) => new RegExp(`^${label}:\\s*${number}`, 'mi');

export const labPresentation: Record<
  string,
  {
    question: string;
    interpretation: string;
    preview: Preview;
    metrics: LabMetric[];
    previewExpression?: string;
  }
> = {
  'logistic-regression': {
    question: 'Does a fitted probability model improve on giving every applicant the same risk?',
    interpretation:
      'Compare Brier with Baseline Brier: a lower value means better probability accuracy on these test rows. ROC-AUC measures ranking, not a loan approval policy. These synthetic features have no assigned financial units.',
    preview: generatedDataPreviews['logistic-regression'],
    metrics: [
      metric('ROC-AUC', valueAfter('ROC-AUC'), 'higher'),
      metric('Brier', valueAfter('Brier'), 'lower'),
      metric('Baseline Brier', valueAfter('Baseline Brier'), 'lower'),
    ],
    previewExpression: `{'caption': 'First 3 generated rows; showing 3 of 8 numerical features and the target.', 'columns': ['Feature 1', 'Feature 2', 'Feature 3', 'Target'], 'rows': [[*[format(v, '.4g') for v in X[i, :3]], str(int(y[i]))] for i in range(min(3, len(X)))]}`,
  },
  'trees-and-forests': {
    question: 'Does the forest find more positives in a limited review queue than one tree?',
    interpretation:
      'Compare tree and forest average precision with the random-ranking reference. Precision@20 describes the yield of a 20-case queue; higher ranking quality does not itself establish that review is cost-effective.',
    preview: generatedDataPreviews['trees-and-forests'],
    metrics: [
      metric('Tree average precision', valueAfter('tree Average precision'), 'higher'),
      metric('Forest average precision', valueAfter('forest Average precision'), 'higher'),
      metric('Random-ranking AP', valueAfter('Random-ranking baseline AP'), 'higher'),
      metric('Tree precision@20', valueAfter('tree Precision@20'), 'higher'),
      metric('Forest precision@20', valueAfter('forest Precision@20'), 'higher'),
    ],
    previewExpression: `{'caption': 'First 3 generated rows; showing 3 of 12 features and the target.', 'columns': ['Feature 1', 'Feature 2', 'Feature 3', 'Target'], 'rows': [[*[format(v, '.4g') for v in X[i, :3]], str(int(y[i]))] for i in range(min(3, len(X)))]}`,
  },
  'gradient-boosting': {
    question: 'Does boosting improve on logistic regression using exactly the same test rows?',
    interpretation:
      'AUC asks whether positive cases tend to receive higher scores than negative cases; Brier asks how close the predicted probabilities are to what happened. Higher AUC and lower Brier are useful in different ways, so check both before claiming an improvement and avoid tuning repeatedly against this final test set.',
    preview: generatedDataPreviews['gradient-boosting'],
    metrics: [
      metric('Logistic AUC', valueAfter('logit AUC'), 'higher'),
      metric('Boosting AUC', valueAfter('boost AUC'), 'higher'),
      metric('Logistic Brier', new RegExp(`^logit AUC:.*?Brier:\\s*${number}`, 'mi'), 'lower'),
      metric('Boosting Brier', new RegExp(`^boost AUC:.*?Brier:\\s*${number}`, 'mi'), 'lower'),
    ],
    previewExpression: `{'caption': 'First 3 generated rows; showing 3 of 20 features and the target.', 'columns': ['Feature 1', 'Feature 2', 'Feature 3', 'Target'], 'rows': [[*[format(v, '.4g') for v in X[i, :3]], str(int(y[i]))] for i in range(min(3, len(X)))]}`,
  },
  'k-means': {
    question: 'Which cluster count separates these observations, and is the grouping stable?',
    interpretation:
      'Silhouette asks whether each observation is close to its own group and separated from other groups. Adjusted Rand index (ARI) asks whether changing the starting point puts the same observations together. Inertia usually decreases as clusters are added; that alone does not justify more segments or give them a business meaning.',
    preview: generatedDataPreviews['k-means'],
    metrics: [
      metric('4-cluster silhouette', valueAfter('4 Silhouette'), 'higher'),
      metric('Seed stability ARI', valueAfter('Seed stability ARI'), 'higher'),
      metric('3-cluster silhouette', valueAfter('3 Silhouette'), 'higher'),
      metric('5-cluster silhouette', valueAfter('5 Silhouette'), 'higher'),
    ],
    previewExpression: `{'caption': 'First 3 generated rows before standardization; showing 3 of 5 dimensions.', 'columns': ['Feature 1', 'Feature 2', 'Feature 3'], 'rows': [[format(v, '.4g') for v in row[:3]] for row in X[:3]]}`,
  },
  'isolation-forest': {
    question: 'Does the anomaly ranking recover more planted cases than the largest-amount rule?',
    interpretation:
      'Compare synthetic anomaly yield@10 with the amount-rule yield using the same queue size. Planted anomalies are known here; in real transactions, unusual behavior is not proof of fraud.',
    preview: {
      caption: 'Three of the five deliberately planted unusual rows, copied from the example.',
      columns: ['Amount', 'Hour', 'Activity count', 'Relative deviation'],
      rows: [
        ['4500', '3', '18', '8'],
        ['2800', '2', '22', '11'],
        ['15', '4', '35', '9'],
      ],
    },
    metrics: [
      metric('Synthetic anomaly yield@10', valueAfter('Synthetic anomaly yield@10'), 'higher'),
      metric('Amount-rule yield@10', valueAfter('Amount-rule yield@10'), 'higher'),
      metric('Flagged rows', valueAfter('Flagged by contamination cutoff')),
    ],
    previewExpression: `{'caption': 'First 3 actual dataset rows (generated background rows).', 'columns': ['Amount', 'Hour', 'Activity count', 'Relative deviation'], 'rows': [[format(v, '.4g') for v in row] for row in X[:3]]}`,
  },
  'time-series': {
    question:
      'Does the forecast improve on repeating last week, and how often does its interval cover reality?',
    interpretation:
      'Lower MAE means smaller average errors on the last 28 days. Compare interval coverage with the nominal 95%, then repeat across other time windows before trusting the model for planning.',
    preview: generatedDataPreviews['time-series'],
    metrics: [
      metric('MAE', valueAfter('MAE'), 'lower'),
      metric('Seasonal naive MAE', valueAfter('Seasonal naive MAE'), 'lower'),
      metric('Interval coverage', valueAfter('Interval coverage')),
    ],
    previewExpression: `{'caption': 'First 3 generated daily observations.', 'columns': ['Date', 'Observed value'], 'rows': [[str(d.date()), format(v, '.5g')] for d, v in y.iloc[:3].items()]}`,
  },
  'graph-methods': {
    question: 'What shared evidence connects accounts A and B?',
    interpretation:
      'Common neighbors identify shared entities. Inspect which links remain after an edit: connectivity and PageRank do not establish wrongdoing or predict fraud without outcome data.',
    preview: {
      caption: 'First three links in the hand-written graph.',
      columns: ['From', 'To'],
      rows: [
        ['acct_A', 'device_7'],
        ['acct_B', 'device_7'],
        ['acct_A', 'merchant_X'],
      ],
    },
    metrics: [metric('A/B common neighbors', valueAfter('A/B common neighbors'))],
    previewExpression: `{'caption': 'First 3 links currently in the graph.', 'columns': ['From', 'To'], 'rows': [[str(a), str(b)] for a, b in list(G.edges())[:3]]}`,
  },
  transformers: {
    question: 'Which financial phrases does this simple sentiment model misread?',
    interpretation:
      'Macro-F1 gives each class equal weight. Inspect “loss fell” and the per-class report: this tiny TF-IDF exercise tests reasoning about language, not FinBERT or finance-domain production accuracy.',
    preview: {
      caption: 'Three labeled training sentences from the actual example.',
      columns: ['Sentence', 'Label'],
      rows: [
        ['profit increased', 'positive'],
        ['profit fell', 'negative'],
        ['scheduled debt payment', 'neutral'],
      ],
    },
    metrics: [metric('Macro-F1', valueAfter('Macro-F1'), 'higher')],
    previewExpression: `{'caption': 'First 3 training sentences in this run.', 'columns': ['Sentence', 'Label'], 'rows': [[str(t), str(l)] for t, l in list(zip(train, labels))[:3]]}`,
  },
  rag: {
    question: 'Which passages support an answer about customer concentration?',
    interpretation:
      'Recall measures how much required evidence was found; context precision measures how much retrieved evidence is relevant. Read the selected passages before writing an answer. This lab performs retrieval only.',
    preview: {
      caption:
        'Actual passages and relevance labels for the original customer-concentration question.',
      columns: ['Passage', 'Text', 'Relevant'],
      rows: [
        ['1', 'No customer accounted for more than 10 percent of revenue.', 'Yes'],
        ['2', 'Interest expense increased because average debt was higher.', 'No'],
        ['3', 'A small number of distributors represent a material share of sales.', 'Yes'],
      ],
    },
    metrics: [
      metric(
        'Retrieval recall',
        new RegExp(`^Retrieval Recall@\\d+:\\s*${number}`, 'mi'),
        'higher',
      ),
      metric(
        'Context precision',
        new RegExp(`^Context precision@\\d+:\\s*${number}`, 'mi'),
        'higher',
      ),
    ],
    previewExpression: `{'caption': 'First 3 passages and relevance labels in this run.', 'columns': ['Passage', 'Text', 'Relevant'], 'rows': [[str(i + 1), str(t), 'Yes' if i in relevant else 'No'] for i, t in enumerate(chunks[:3])]}`,
  },
  optimization: {
    question:
      'Can a feasible portfolio meet the return target with less volatility than equal weights?',
    interpretation:
      'Check feasibility and every constraint before comparing volatility. The inputs are assumed returns and covariances; lower modeled volatility does not guarantee a better realized outcome.',
    preview: {
      caption:
        'Assumed asset inputs copied from the example; covariance between assets is available in the code.',
      columns: ['Asset', 'Expected return', 'Variance'],
      rows: [
        ['1', '0.06', '0.040'],
        ['2', '0.08', '0.055'],
        ['3', '0.10', '0.090'],
        ['4', '0.04', '0.025'],
      ],
    },
    metrics: [
      metric('Return', valueAfter('Return')),
      metric('Volatility', valueAfter('Volatility'), 'lower'),
      metric('Equal-weight volatility', valueAfter('Equal-weight volatility'), 'lower'),
    ],
    previewExpression: `{'caption': 'Asset assumptions used in this run.', 'columns': ['Asset', 'Expected return', 'Variance'], 'rows': [[str(i + 1), format(v, '.4g'), format(Sigma[i, i], '.4g')] for i, v in enumerate(mu)]}`,
  },
  'reinforcement-learning': {
    question: 'Does the learned execution policy finish the order at lower modeled cost than TWAP?',
    interpretation:
      'Compare deterministic cost with TWAP and check remaining inventory. Reward is negative cost here. This single simulator and deterministic evaluation do not demonstrate performance in a live market.',
    preview: {
      caption: 'Simulator inputs from the example; there is no historical trade dataset.',
      columns: ['Input', 'Value'],
      rows: [
        ['Time steps / initial inventory', '10 / 10 units'],
        ['Allowed actions', 'Buy 0, 1, or 2 units'],
        ['Impact coefficient / unfinished penalty', '0.08 / 5.0 per unit'],
      ],
    },
    metrics: [
      metric('Evaluation cost', valueAfter('Deterministic evaluation cost'), 'lower'),
      metric('TWAP cost', valueAfter('TWAP baseline cost'), 'lower'),
      metric('Reward', valueAfter('Reward'), 'higher'),
    ],
    previewExpression: `{'caption': 'First 3 actions of the learned greedy policy in this run.', 'columns': ['Step', 'Units bought'], 'rows': [[str(i + 1), str(q)] for i, q in enumerate(policy[:3])]}`,
  },
  'monte-carlo': {
    question: 'How can dependence change large losses even when average loss stays similar?',
    interpretation:
      'Compare simulated mean loss with the analytical baseline. Then compare tail percentiles after changing correlation. Simulation standard error describes sampling noise, not uncertainty in the default assumptions.',
    preview: {
      caption: 'The first three of 1,000 identical loan assumptions in the example.',
      columns: ['Loan', 'PD', 'Exposure', 'Loss given default'],
      rows: [
        ['1', '0.025', '$10,000', '0.45'],
        ['2', '0.025', '$10,000', '0.45'],
        ['3', '0.025', '$10,000', '0.45'],
      ],
    },
    metrics: [
      metric('Expected loss', valueAfter('Expected loss')),
      metric('Analytical mean loss', valueAfter('Analytical expected-loss baseline')),
      metric('99th percentile', valueAfter('99th percentile')),
      metric('95th percentile', valueAfter('95th percentile')),
      metric('Breach probability', valueAfter('P\\(loss > \\$200k\\)')),
      metric('Simulation SE', valueAfter('Simulation SE'), 'lower'),
    ],
    previewExpression: `{'caption': 'First 3 loan assumptions in this run.', 'columns': ['Loan', 'PD', 'Exposure', 'Loss given default'], 'rows': [[str(i + 1), str(pd[i]), str(ead[i]), str(lgd[i])] for i in range(min(3, n_loans))]}`,
  },
};

export const PREVIEW_MARKER = '__FINTECH_DATA_PREVIEW__';
/** Add inspection only; the learner's model, data generation and stdout remain intact. */
export function withDataPreview(code: string, slug: string): string {
  const expression = labPresentation[slug]?.previewExpression;
  if (!expression) return code;
  return `${code}\n\n# Inspect a few actual inputs without changing the model or its data.\ntry:\n    import json as _fintech_preview_json\n    print('${PREVIEW_MARKER}' + _fintech_preview_json.dumps(${expression}))\nexcept Exception:\n    pass\n`;
}
export function parseRun(
  slug: string,
  stdout: string,
  stderr = '',
  figures: string[] = [],
): RunSnapshot {
  let preview: Preview | undefined;
  const visible = stdout
    .split('\n')
    .filter((line) => {
      if (!line.startsWith(PREVIEW_MARKER)) return true;
      try {
        const value = JSON.parse(line.slice(PREVIEW_MARKER.length));
        if (
          typeof value.caption === 'string' &&
          Array.isArray(value.columns) &&
          value.columns.every((c: unknown) => typeof c === 'string') &&
          Array.isArray(value.rows) &&
          value.rows.every(
            (row: unknown) =>
              Array.isArray(row) &&
              row.length === value.columns.length &&
              row.every((v: unknown) => typeof v === 'string'),
          )
        )
          preview = value;
      } catch {
        /* User code can print arbitrary output; ignore malformed inspection output. */
      }
      return false;
    })
    .join('\n');
  const metrics = (labPresentation[slug]?.metrics ?? []).flatMap((item) => {
    const match = visible.match(item.pattern);
    const value = match ? Number(match[1]) : NaN;
    return Number.isFinite(value) ? [{ label: item.label, direction: item.direction, value }] : [];
  });
  return { stdout: visible, stderr, figures, metrics, preview };
}
export function hasRunError(stderr: string): boolean {
  return /Traceback|PythonError|(?:^|\n)\s*(?:[\w.]*Error|[\w.]*Exception):/m.test(stderr);
}
export function formatMetric(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 5 }).format(value);
}
