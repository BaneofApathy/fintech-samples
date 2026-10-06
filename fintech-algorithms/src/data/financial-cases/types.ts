export interface CaseMark {
  kind: 'text' | 'rect' | 'circle' | 'line' | 'path';
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  r?: number;
  d?: string;
  text?: string;
  description?: string;
  maxWidth?: number;
  tone?: 'ink' | 'muted' | 'blue' | 'green' | 'amber' | 'red' | 'paper';
  dashed?: boolean;
  arrow?: boolean;
  small?: boolean;
}
export interface CaseFrame {
  label: string;
  caption: string;
  result: string;
  metric: { label: string; value: number; unit: string; denominator: string };
  marks: CaseMark[];
  rows: { label: string; value: string }[];
}
export interface FinancialCase {
  algorithmSlug: string;
  slug: string;
  title: string;
  question: string;
  visualId: string;
  sourceRef: { page: number; application: number };
  controlLabel: string;
  owner: string;
  timing: string;
  baseline: string;
  prediction: string;
  takeaway: string;
  measureSlugs: string[];
  frames: [CaseFrame, CaseFrame, CaseFrame];
}
export type Tone = NonNullable<CaseMark['tone']>;
export const t = (
  x: number,
  y: number,
  text: string,
  tone: Tone = 'ink',
  small = false,
): CaseMark => ({ kind: 'text', x, y, text, tone, small });
export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  tone: Tone = 'blue',
): CaseMark => ({ kind: 'rect', x, y, width, height, tone });
export const dot = (x: number, y: number, r = 6, tone: Tone = 'blue'): CaseMark => ({
  kind: 'circle',
  x,
  y,
  r,
  tone,
});
export const line = (
  x: number,
  y: number,
  x2: number,
  y2: number,
  tone: Tone = 'muted',
  dashed = false,
): CaseMark => ({ kind: 'line', x, y, x2, y2, tone, dashed });
export const path = (d: string, tone: Tone = 'blue', dashed = false): CaseMark => ({
  kind: 'path',
  d,
  tone,
  dashed,
});
export const number = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

/** Domain data are authored below; these helpers draw, never invent model outputs. */
export function bars(
  labels: string[],
  values: number[],
  unit: string,
  max = Math.max(...values, 1),
  tones: Tone[] = [],
): CaseMark[] {
  const gap = Math.min(49, 210 / labels.length);
  return [
    t(190, 27, unit, 'muted', true),
    ...labels.flatMap((label, i) => [
      t(14, 61 + i * gap, label, 'ink', true),
      rect(190, 44 + i * gap, Math.max(2, (values[i] / max) * 315), 23, tones[i] ?? 'blue'),
      t(516, 61 + i * gap, number(values[i]), tones[i] ?? 'ink', true),
    ]),
  ];
}
export function trend(
  labels: string[],
  values: number[],
  unit: string,
  compare?: number[],
  limit?: number,
): CaseMark[] {
  const all = [...values, ...(compare ?? []), ...(limit === undefined ? [] : [limit])];
  const min = Math.min(0, ...all),
    max = Math.max(...all, 1),
    range = max - min || 1;
  const xx = (i: number) => 52 + (i * 500) / Math.max(1, values.length - 1);
  const yy = (v: number) => 230 - ((v - min) / range) * 175;
  const curve = (vals: number[]) =>
    vals.map((v, i) => `${i ? 'L' : 'M'}${xx(i)},${yy(v)}`).join(' ');
  return [
    t(14, 23, unit, 'muted', true),
    line(52, 45, 52, 232),
    line(52, 232, 564, 232),
    t(5, 58, number(max), 'muted', true),
    t(5, 232, number(min), 'muted', true),
    ...(limit === undefined
      ? []
      : [
          line(52, yy(limit), 564, yy(limit), 'red', true),
          t(325, 38, `Limit / requirement: ${number(limit)}`, 'red', true),
        ]),
    ...(compare ? [path(curve(compare), 'muted', true)] : []),
    path(curve(values)),
    ...values.map((v, i) => dot(xx(i), yy(v), 4)),
    ...labels.map((label, i) => t(xx(i) - 15, 253, label, 'muted', true)),
    ...(compare ? [t(180, 277, 'Blue: proposal · dashed: baseline', 'muted', true)] : []),
  ];
}
export function flow(
  labels: string[],
  details: string[],
  selected = -1,
  vertical = false,
): CaseMark[] {
  const x = (i: number) => (vertical ? 40 + (i % 2) * 290 : 15 + i * (575 / labels.length));
  const y = (i: number) => (vertical ? 32 + Math.floor(i / 2) * 125 : 85);
  const w = vertical ? 235 : 575 / labels.length - 20;
  const connector = (i: number): CaseMark => {
    if (vertical && i % 2 === 0) {
      const fromX = x(i - 1) + w / 2,
        fromY = y(i - 1) + 85,
        toX = x(i) + w / 2,
        toY = y(i),
        middle = (fromY + toY) / 2;
      return path(`M${fromX},${fromY} V${middle} H${toX} V${toY}`, 'muted', true);
    }
    return line(x(i - 1) + w, y(i - 1) + 42.5, x(i), y(i) + 42.5, 'muted', true);
  };
  return labels.flatMap((label, i) => [
    ...(i ? [connector(i)] : []),
    rect(x(i), y(i), w, 85, i === selected ? 'amber' : 'blue'),
    { ...t(x(i) + 9, y(i) + 24, label, 'ink', true), maxWidth: w - 18 },
    { ...t(x(i) + 9, y(i) + 52, details[i] ?? '', 'ink', true), maxWidth: w - 18 },
  ]);
}
export function network(
  nodes: [string, number, number, Tone?][],
  edges: [number, number, string?][],
  active: number[] = [],
): CaseMark[] {
  return [
    ...edges.flatMap(([a, b, label]) => [
      {
        ...line(nodes[a][1], nodes[a][2], nodes[b][1], nodes[b][2], 'muted', label === '?'),
        description: `${nodes[a][0]} connects to ${nodes[b][0]}${label ? `: ${label}` : ''}`,
      },
      ...(label
        ? [
            t(
              (nodes[a][1] + nodes[b][1]) / 2 - Math.min(55, label.length * 3),
              (nodes[a][2] + nodes[b][2]) / 2 - 10,
              label,
              'muted',
              true,
            ),
          ]
        : []),
    ]),
    ...nodes.flatMap(([label, x, y, tone], i) => [
      dot(x, y, 17, active.includes(i) ? 'amber' : (tone ?? 'blue')),
      t(x - Math.min(55, label.length * 3.1), y + 36, label, 'ink', true),
    ]),
  ];
}
export function tiles(labels: string[], values: number[], selected = -1, unit = ''): CaseMark[] {
  return labels.flatMap((label, i) => {
    const x = 20 + (i % 3) * 190,
      y = 25 + Math.floor(i / 3) * 118;
    return [
      rect(x, y, 173, 91, i === selected ? 'amber' : 'blue'),
      t(x + 10, y + 27, label, 'ink', true),
      t(x + 10, y + 61, `${number(values[i])}${unit}`),
    ];
  });
}
export function scatter(
  points: [number, number, number][],
  centers: [number, number][],
  xLabel: string,
  yLabel: string,
): CaseMark[] {
  return [
    line(55, 32, 55, 238),
    line(55, 238, 558, 238),
    t(185, 272, xLabel, 'muted', true),
    t(12, 19, yLabel, 'muted', true),
    ...points.map(([x, y, group]) =>
      dot(65 + x * 4.7, 226 - y * 1.85, 6, (['blue', 'green', 'amber'] as Tone[])[group % 3]),
    ),
    ...centers.flatMap(([x, y], i) => [
      rect(57 + x * 4.7, 218 - y * 1.85, 16, 16, 'ink'),
      t(68 + x * 4.7, 214 - y * 1.85, `C${i + 1}`, 'ink', true),
    ]),
  ];
}
export function allocation(labels: string[], amounts: number[], cap?: number): CaseMark[] {
  const total = amounts.reduce((a, b) => a + b, 0);
  let offset = 20;
  const marks: CaseMark[] = [t(20, 28, `Allocated total: ${number(total)}`, 'muted', true)];
  amounts.forEach((value, i) => {
    const width = total ? (value / total) * 550 : 0;
    marks.push(
      rect(
        offset,
        65,
        Math.max(0, width - 3),
        55,
        (['blue', 'green', 'amber', 'muted'] as Tone[])[i % 4],
      ),
    );
    offset += width;
    marks.push(
      rect(20, 146 + i * 30, 9, 9, (['blue', 'green', 'amber', 'muted'] as Tone[])[i % 4]),
      t(
        40,
        156 + i * 30,
        `${labels[i]}: ${number(value)}${cap === undefined ? '' : ` (limit ${cap})`}`,
        value > (cap ?? Infinity) ? 'red' : 'ink',
        true,
      ),
    );
  });
  return marks;
}
export function matrix(
  rows: string[],
  columns: string[],
  values: number[][],
  unit: string,
): CaseMark[] {
  return [
    t(12, 24, unit, 'muted', true),
    ...columns.map((c, j) => t(184 + j * 124, 55, c, 'muted', true)),
    ...rows.flatMap((row, i) => [
      t(12, 100 + i * 58, row, 'ink', true),
      ...values[i].flatMap((v, j) => [
        rect(170 + j * 124, 75 + i * 58, 112, 42, v ? 'blue' : 'muted'),
        t(207 + j * 124, 103 + i * 58, number(v)),
      ]),
    ]),
  ];
}
export function distribution(losses: number[], reserve: number, unit: string): CaseMark[] {
  const sorted = [...losses].sort((a, b) => a - b),
    max = Math.max(...sorted, reserve, 1);
  return [
    t(12, 23, unit, 'muted', true),
    line(35, 220, 570, 220),
    ...sorted.flatMap((v, i) => [
      rect(
        37 + (i * 520) / sorted.length,
        215 - (v / max) * 165,
        Math.max(4, 450 / sorted.length),
        (v / max) * 165,
        v > reserve ? 'red' : 'blue',
      ),
      t(39 + (i * 520) / sorted.length, 240, number(v), 'muted', true),
    ]),
    line(35, 215 - (reserve / max) * 165, 570, 215 - (reserve / max) * 165, 'amber', true),
    t(230, 273, `Threshold ${number(reserve)}; red exceeds it`, 'muted', true),
  ];
}
export function frame(
  label: string,
  caption: string,
  result: string,
  metricLabel: string,
  value: number,
  unit: string,
  denominator: string,
  marks: CaseMark[],
  rows: [string, string | number][],
): CaseFrame {
  return {
    label,
    caption,
    result,
    metric: { label: metricLabel, value, unit, denominator },
    marks,
    rows: rows.map(([label, value]) => ({
      label,
      value: typeof value === 'number' ? number(value) : value,
    })),
  };
}
export function caseOf(
  algorithmSlug: string,
  page: number,
  application: number,
  title: string,
  question: string,
  controlLabel: string,
  takeaway: string,
  measureSlugs: string[],
  frames: CaseFrame[],
): FinancialCase {
  if (frames.length !== 3) throw new Error(`${title}: exactly three states are required`);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const owners: Record<string, string[]> = {
    'logistic-regression': [
      'Credit officer',
      'Fraud operations analyst',
      'AML investigator',
      'Retention team',
      'Collections team',
      'Merchant onboarding reviewer',
      'Claims supervisor',
      'Offer eligibility team',
    ],
    'trees-and-forests': [
      'Card authorization team',
      'Credit underwriter',
      'Chargeback analyst',
      'Merchant risk team',
      'Retention analyst',
      'Collections manager',
      'Claims investigator',
      'AML investigator',
    ],
    'gradient-boosting': [
      'Credit model review team',
      'Fraud operations team',
      'AML model review team',
      'Merchant risk analyst',
      'Collections analyst',
      'Retention model review team',
      'Insurance pricing team',
      'Cash-flow monitoring team',
    ],
    'k-means': [
      'Customer analytics team',
      'Merchant analytics team',
      'Portfolio analyst',
      'Product research team',
      'Channel operations team',
      'Cash-flow analyst',
      'AML research team',
      'Monitoring analyst',
    ],
    'isolation-forest': [
      'Payment investigator',
      'AML screening analyst',
      'Account security team',
      'Expense reviewer',
      'Wire investigator',
      'Merchant operations analyst',
      'Market surveillance analyst',
      'Reconciliation analyst',
    ],
    'time-series': [
      'Treasury team',
      'Payment operations team',
      'Deposit treasury team',
      'Collections risk team',
      'Collections staffing manager',
      'Revenue planning team',
      'ATM operations team',
      'Market risk analyst',
    ],
    'graph-methods': [
      'Fraud investigator',
      'Identity verification analyst',
      'AML investigator',
      'Account security analyst',
      'Merchant investigator',
      'Counterparty risk team',
      'Payment network operator',
      'Entity data steward',
    ],
    transformers: [
      'Financial research analyst',
      'Customer service triage team',
      'Onboarding reviewer',
      'Contract reviewer',
      'Earnings analyst',
      'Research editor',
      'Policy change reviewer',
      'Narrative reviewer',
    ],
    rag: [
      'Research analyst',
      'Policy reviewer',
      'Customer service analyst',
      'Due diligence reviewer',
      'Loan or claim reviewer',
      'Procedure owner',
      'Contract researcher',
      'Model governance reviewer',
    ],
    optimization: [
      'Portfolio team',
      'Treasury allocation team',
      'Capital planning team',
      'Payment routing operator',
      'Collateral manager',
      'Credit exposure team',
      'Treasury funding team',
      'Review scheduling manager',
    ],
    'reinforcement-learning': [
      'Execution research team',
      'Liquidity policy team',
      'Collections policy team',
      'Offer policy team',
      'Fraud policy team',
      'Credit-limit experiment team',
      'Market-making researcher',
      'Cash-management team',
    ],
    'monte-carlo': [
      'Credit portfolio risk team',
      'Market risk team',
      'Derivatives valuation analyst',
      'Asset-liability team',
      'Liquidity stress team',
      'Capital planning team',
      'Wealth planning analyst',
      'Portfolio risk analyst',
    ],
  };
  const baseline: Record<string, string> = {
    'logistic-regression':
      'A stated policy rule or constant historical probability on the same cases.',
    'trees-and-forests': 'A short domain rule on the same observations and decision cutoff.',
    'gradient-boosting':
      'A simpler model evaluated on the same observations, horizon, and operational capacity.',
    'k-means': 'Business-defined groups using the same observations and feature definitions.',
    'isolation-forest': 'A domain rule or simple deviation from an appropriate reference group.',
    'time-series':
      'Last-value or seasonal-naive prediction at the same forecast origin and horizon.',
    'graph-methods': 'The same decision using individual records without relationship features.',
    transformers: 'Keyword rules or a linear text classifier with the same task labels.',
    rag: 'Manual reading and keyword search over the same eligible source documents.',
    optimization: 'The current policy allocation, checked against the same constraints.',
    'reinforcement-learning':
      'A deterministic policy evaluated over the same scenario and complete cost definition.',
    'monte-carlo': 'Expected-value arithmetic plus the stated scenario assumptions.',
  };
  return {
    algorithmSlug,
    slug,
    title,
    question,
    controlLabel,
    takeaway,
    measureSlugs,
    frames: frames as FinancialCase['frames'],
    owner: owners[algorithmSlug]?.[application - 1] ?? 'Financial decision owner',
    timing:
      'Use only the evidence available at the stated decision or forecast cutoff. Any later outcome in this illustration is evaluation evidence.',
    baseline: baseline[algorithmSlug],
    visualId: `${algorithmSlug}-${slug}`,
    sourceRef: { page, application },
    prediction: `Before selecting “${frames[2].label}”, predict how ${frames[0].metric.label.toLowerCase()} will change.`,
  };
}
