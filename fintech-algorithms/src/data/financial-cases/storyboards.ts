import {
  frame as f,
  bars,
  trend,
  flow,
  network,
  tiles,
  allocation,
  matrix,
  scatter,
  distribution,
  t,
  line,
  dot,
  rect,
  path,
  type FinancialCase,
  type CaseFrame,
  type CaseMark,
} from './types';
type Storyboard = {
  question: string;
  controlLabel: string;
  frames: CaseFrame[];
  takeaway?: string;
};
const boards: Record<string, Storyboard> = {};
function board(
  unit: string,
  n: number,
  question: string,
  controlLabel: string,
  frames: CaseFrame[],
  takeaway?: string,
) {
  boards[`${unit}/${n}`] = { question, controlLabel, frames, takeaway };
}
const timeline = (labels: string[], values: string[], active: number): CaseMark[] => [
  line(65, 125, 535, 125),
  ...labels.flatMap((label, i) => [
    dot(65 + (i * 470) / (labels.length - 1), 125, 9, i === active ? 'amber' : 'blue'),
    t(30 + (i * 470) / (labels.length - 1), 85, label, 'ink', true),
    t(30 + (i * 470) / (labels.length - 1), 175, values[i], 'muted', true),
  ]),
];

// Probability cases: distinguish target definition, ranking, and the action policy.
board(
  'logistic-regression',
  1,
  'What changes when “default” is observed over a longer window?',
  'Outcome observation window',
  [3, 6, 12].map((months, i) =>
    f(
      `${months} months`,
      `The same 100 applications are followed from the application date. By ${months} months, ${[2, 5, 9][i]} have defaulted, so the observed rate for this window is ${[2, 5, 9][i]}%.`,
      'A longer window gives more time for a default to happen, so it defines a different outcome. These observed rates describe this small example; they are not model probabilities or a forecast for every future applicant.',
      'Observed default rate',
      [2, 5, 9][i],
      '%',
      'cumulative defaults / the same 100 applications',
      [
        ...timeline(
          ['Apply', '3 months', '6 months', '12 months'],
          ['Features known', '2 defaults', '5 defaults', '9 defaults'],
          i + 1,
        ),
        rect(65, 210, [157, 313, 470][i], 18, 'amber'),
        t(65, 257, `Label window ends after ${months} months`, 'amber', true),
      ],
      [
        ['Applications', 100],
        ['Window months', months],
        ['Cumulative defaults', [2, 5, 9][i]],
      ],
    ),
  ),
  'Define the outcome and its window before estimating default risk; later outcomes are labels, not application features.',
);
board(
  'logistic-regression',
  2,
  'Which action changes now while the chargeback label arrives later?',
  'Authorization intervention cutoff',
  [1, 3, 5].map((cutoff) =>
    f(
      `${cutoff}% cutoff`,
      'A payment has a fixed calibrated 2% chargeback estimate; settlement occurs tomorrow and a dispute may arrive after 20 days.',
      cutoff <= 2
        ? 'Challenge now; any eventual dispute remains a later outcome.'
        : 'Below this cutoff; proceed subject to the rest of the authorization policy.',
      'Payments challenged',
      cutoff <= 2 ? 1 : 0,
      'of 1',
      'one payment; fixed 2% risk compared with the selected cutoff',
      [
        ...timeline(
          ['Authorize', 'Settle', 'Dispute label'],
          [cutoff <= 2 ? 'Challenge' : 'Proceed', 'Day 1', 'Day 20'],
          0,
        ),
        line(70, 35, 70, 220, 'red', true),
        t(120, 245, `Risk 2% stays fixed · cutoff ${cutoff}%`, 'amber', true),
      ],
      [
        ['Risk', '2%'],
        ['Cutoff', `${cutoff}%`],
        ['Future dispute', 'Unknown at authorization'],
      ],
    ),
  ),
);
board(
  'logistic-regression',
  4,
  'Who enters an outreach list as its cutoff changes?',
  'Churn-risk outreach cutoff',
  [70, 50, 30].map((cutoff) => {
    const scores = [80, 60, 40, 20];
    const selected = scores.filter((v) => v >= cutoff).length;
    return f(
      `${cutoff}% cutoff`,
      'Four fixed churn propensities form a risk ladder; there is no evidence that contact changes outcomes.',
      'Selecting more high-risk customers does not establish outreach uplift.',
      'Customers selected',
      selected,
      'customers',
      'four eligible customers with fixed churn estimates',
      [
        ...bars(
          ['Customer A', 'Customer B', 'Customer C', 'Customer D'],
          scores,
          '% estimated churn',
          100,
          scores.map((v) => (v >= cutoff ? 'amber' : 'blue')),
        ),
        t(190, 280, `Contact cutoff ${cutoff}% · uplift unknown`, 'muted', true),
      ],
      [
        ['Cutoff', cutoff],
        ['Selected', selected],
        ['Incremental retention effect', 'Not estimated'],
      ],
    );
  }),
);
board(
  'logistic-regression',
  5,
  'Does the highest payment propensity produce the largest expected receipt?',
  'Collections ranking objective',
  [0, 1, 2].map((i) => {
    const orders = [
        [0, 1, 2],
        [2, 1, 0],
        [1, 2, 0],
      ][i],
      names = ['A', 'B', 'C'],
      p = [0.8, 0.5, 0.2],
      balance = [100, 400, 2000],
      expected = p.map((v, j) => v * balance[j]);
    return f(
      ['Payment propensity', 'Expected dollars', 'Expected dollars per hour'][i],
      'Accounts A/B/C have balances $100/$400/$2,000, payment probabilities 80%/50%/20%, and handling times 1/1/4 hours.',
      'The best rank depends on whether the decision values events, dollars, or scarce handling time.',
      'Top-ranked expected receipt',
      expected[orders[0]],
      '$',
      'selected account probability × outstanding balance',
      bars(
        orders.map((j) => `Account ${names[j]}`),
        orders.map((j) =>
          i === 0 ? p[j] * 100 : i === 1 ? expected[j] : expected[j] / [1, 1, 4][j],
        ),
        ['% payment propensity', '$ expected receipt', '$ expected receipt / hour'][i],
        i === 0 ? 100 : i === 1 ? 400 : 200,
      ),
      [
        ['Rank', orders.map((j) => names[j]).join(' → ')],
        ['Expected receipts A/B/C', '$80 / $200 / $400'],
        ['Top expected receipt', expected[orders[0]]],
      ],
    );
  }),
);
board(
  'logistic-regression',
  6,
  'Which missing document stops merchant onboarding?',
  'Missing required application document',
  [0, 1, 2].map((i) =>
    f(
      ['All documents present', 'Bank verification missing', 'Ownership record missing'][i],
      'A fictional onboarding policy requires identity, bank verification, and ownership evidence before the risk-review gate.',
      [
        'Identity, bank verification, and ownership records are all present, so this example may proceed to a human risk review. Passing this document gate is not automatic approval.',
        'Bank verification is missing, so this application remains paused until bank evidence is supplied. A favorable risk score cannot replace the missing document.',
        'The ownership record is missing, so this application remains paused until ownership evidence is supplied. A favorable risk score cannot replace the missing document.',
      ][i],
      'Complete required documents',
      [3, 2, 2][i],
      'of 3',
      'identity, bank verification, ownership',
      [
        ...network(
          [
            ['Application', 65, 140],
            ['Identity', 245, 45],
            ['Bank', 245, 140],
            ['Ownership', 245, 235],
            ['Risk review', 510, 140],
          ],
          [
            [0, 1],
            [0, 2],
            [0, 3],
            ...(i === 0
              ? ([
                  [1, 4],
                  [2, 4],
                  [3, 4],
                ] as [number, number][])
              : []),
          ],
          [i === 1 ? 2 : i === 2 ? 3 : 4],
        ),
        t(380, 280, i ? 'Request evidence' : 'Proceed to risk review', 'amber', true),
      ],
      [
        ['Identity', 'Present'],
        ['Bank', i === 1 ? 'Missing' : 'Present'],
        ['Ownership', i === 2 ? 'Missing' : 'Present'],
        ['Risk gate', i ? 'Blocked pending evidence' : 'Eligible'],
      ],
    ),
  ),
);
board(
  'logistic-regression',
  7,
  'Which claims need routine handling or specialist escalation?',
  'Escalation cutoff',
  [30, 50, 70].map((cutoff) => {
    const k = [80, 60, 40, 20].filter((v) => v >= cutoff).length;
    return f(
      `${cutoff}% cutoff`,
      'Four claims have fixed escalation probabilities 80%, 60%, 40%, and 20%; specialist handling takes 30 minutes each.',
      'Changing the gate moves claims between routine and specialist handling; it does not establish fraud.',
      'Specialist workload',
      k * 30,
      'minutes',
      `${k} claims × 30 minutes`,
      network(
        [
          ['4 claims', 65, 140],
          ['Cutoff', 265, 140],
          ['Routine', 495, 60],
          ['Specialist', 495, 225],
        ],
        [
          [0, 1],
          [1, 2, `${4 - k} claims`],
          [1, 3, `${k} claims`],
        ],
        [3],
      ),
      [
        ['Routine', 4 - k],
        ['Specialist', k],
        ['Minutes', k * 30],
      ],
    );
  }),
);

board(
  'trees-and-forests',
  2,
  'How does changing one applicant detail change the questions in this example tree?',
  'Change applicant B’s payment history',
  [0, 1, 2].map((i) =>
    f(
      ['Same attributes', 'Higher DTI', 'Higher DTI + missed payment'][i],
      [
        'Debt-to-income (DTI) compares monthly debt payments with income. Both applicants have 25% DTI and no recent missed payment, so this example tree sends both to pass. The comparison rule reviews DTI above 35%.',
        'Applicant A stays at 25% DTI with no recent missed payment. Applicant B changes to 45% DTI and has no recent missed payment. Since 45% is above the 35% comparison point, the tree sends B to an affordability review.',
        'Applicant A stays unchanged. Applicant B has 45% DTI and a recent missed payment, so after the DTI question the tree sends B to a credit-history review. Both 45% examples are above the 35% comparison point.',
      ][i],
      [
        'Both applicants pass in the tree and under the fixed comparison rule. This route is an example policy, not proof that either applicant will repay.',
        'The tree selects an affordability review, while the fixed DTI rule also asks for review above 35%. A review is a request for human assessment, not a rejection or a probability of default.',
        'The tree selects a credit-history review because both details are considered; the fixed rule still only says “review” for DTI above 35%. Different routes do not prove who will repay.',
      ][i],
      'Applicant B’s route code',
      [0, 1, 2][i],
      'code',
      '0 means pass; 1 means review ability to afford the payment; 2 means review recent credit history. These are route labels, not amounts or risk probabilities.',
      network(
        [
          ['A: DTI 25%', 80, 40],
          ['A: no miss', 80, 140],
          ['A: pass', 80, 245],
          ['B: DTI ' + (i ? '45%' : '25%'), 380, 40],
          ['B: ' + (i === 2 ? 'missed' : 'no miss'), 380, 140],
          [['B: pass', 'B: affordability', 'B: credit review'][i], 380, 245],
        ],
        [
          [0, 1],
          [1, 2],
          [3, 4],
          [4, 5],
        ],
        [5],
      ),
      [
        ['A tree route', 'Pass'],
        ['B route through the tree', ['Pass', 'Affordability review', 'Credit-history review'][i]],
        ['B fixed-rule result', i ? 'Review: DTI over 35%' : 'Pass: DTI is 25%'],
      ],
    ),
  ),
);
board(
  'trees-and-forests',
  3,
  'Which detail could the model know when the payment was approved?',
  'Choose a transaction detail to check',
  [0, 1, 2].map((i) =>
    f(
      ['Prior account history', 'Delivery confirmation', 'Dispute resolution'][i],
      'The model must make its decision at authorization on day 0. Delivery arrives later, and the dispute decision arrives later still.',
      'Only account history already available by day 0 can inform this decision. Delivery and dispute outcomes may help assess the model later, but using them as approval inputs would reveal future information.',
      'Candidate details known at approval',
      i === 0 ? 1 : 0,
      'of 1',
      'one chosen detail checked against the approval time',
      [
        ...timeline(['Authorize', 'Deliver', 'Resolve dispute'], ['Day 0', 'Day 3', 'Day 25'], i),
        line(65, 25, 65, 225, 'red', true),
        t(
          95,
          263,
          [
            'Account history is already known',
            'Delivery happens after approval',
            'Dispute outcome happens later',
          ][i],
          'amber',
          true,
        ),
      ],
      [
        ['Candidate', ['History', 'Delivery', 'Dispute resolution'][i]],
        ['Known by authorization', i === 0 ? 'Yes' : 'No'],
        ['Eligible', i === 0 ? 1 : 0],
      ],
    ),
  ),
);
board(
  'trees-and-forests',
  5,
  'Does reduced activity mean the same thing for every customer?',
  'Compare customers with the same activity drop but different account histories',
  [0, 1, 2].map((i) =>
    f(
      ['Both established', 'B is newly onboarded', 'B has temporary account pause'][i],
      'Both customers show a 50% activity drop. The tree follows account context, such as time with the service or a temporary pause, to different example leaves.',
      'The supplied leaf scores differ as context changes, but they describe patterns in these examples; they do not show that tenure or a pause caused churn.',
      'Supplied churn score for B',
      [0.6, 0.35, 0.1][i],
      'score',
      'one leaf score; not a causal estimate',
      network(
        [
          ['Both: use −50%', 300, 30],
          ['A: established', 120, 115],
          ['B: ' + ['established', 'new', 'paused'][i], 465, 115],
          ['A score 0.60', 120, 235],
          ['B score ' + [0.6, 0.35, 0.1][i], 465, 235],
        ],
        [
          [0, 1],
          [0, 2],
          [1, 3],
          [2, 4],
        ],
      ),
      [
        ['A score', 0.6],
        ['B score', [0.6, 0.35, 0.1][i]],
        ['Changed context', ['None', 'Tenure', 'Temporary pause'][i]],
      ],
    ),
  ),
  'These supplied tree scores show how the example separates customers by context. They are not proof that tenure or a temporary pause causes churn.',
);
board(
  'trees-and-forests',
  6,
  'Which recovery queue can collectors finish today?',
  'Hours available for today’s indivisible collection queues',
  [1, 3, 7].map((hours, i) =>
    f(
      `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
      'Queue A takes 1 hour and has $80 in expected receipts; B takes 2 hours and has $160; C takes 4 hours and has $200. Each queue must be handled as a whole, so the example orders them by expected dollars per hour and fits them within the available time.',
      'Only whole queues that fit are counted. Expected receipts are estimates, not guaranteed collections, and a different queue order could change which work fits.',
      'Expected receipts in feasible queue',
      [80, 240, 440][i],
      '$',
      'sum over queues that fit the available collector hours',
      bars(
        ['Queue A: 1 h', 'Queue B: 2 h', 'Queue C: 4 h'],
        [80, 160, 200],
        'Expected receipts $',
        200,
        [0, 1, 2].map((j) => (j <= i ? 'amber' : 'muted')),
      ),
      [
        ['Hours', hours],
        ['Selected queues', i + 1],
        ['Expected receipts', [80, 240, 440][i]],
        ['Receipt rates A/B/C', '$80 / $80 / $50 per hour'],
      ],
    ),
  ),
  'The queue total counts only whole assignments that fit within the available hours. Expected receipts are estimates; actual collections can be lower or higher.',
);
board(
  'trees-and-forests',
  7,
  'Does a complex claim prove fraud?',
  'Evidence checked during an investigation',
  [0, 1, 2].map((i) =>
    f(
      ['Screening only', 'Receipts checked', 'Hospital confirms treatment'][i],
      [
        'The large claim reaches specialist review because it has many documents. No receipt or provider check is complete, so the evidence is still unresolved.',
        'The receipt has been checked, but the provider has not yet confirmed treatment. One of the two listed checks remains, so the claim is still unresolved.',
        'The receipt and hospital provider both confirm the treatment in this teaching example. Both listed checks are complete, so the example records legitimate treatment.',
      ][i],
      [
        'Screening has identified a claim to review, not established fraud. No supporting evidence has been checked yet.',
        'A checked receipt is useful evidence, but provider confirmation is still pending. The appropriate result remains unresolved.',
        'The checked receipt and provider confirmation support the stated treatment, so this example records it as legitimate. A tree only directs the claim to review; the checked evidence supports the conclusion.',
      ][i],
      'Unresolved checks',
      [2, 1, 0][i],
      'checks',
      'two checks: receipt and provider verification',
      network(
        [
          ['Large claim', 290, 25],
          ['Many documents', 290, 100],
          ['Specialist review', 290, 175],
          ['Receipts', 110, 245],
          ['Provider', 470, 245],
        ],
        [
          [0, 1],
          [1, 2],
          ...(i > 0 ? [[2, 3] as [number, number]] : []),
          ...(i > 1 ? [[2, 4] as [number, number]] : []),
        ],
        [i === 2 ? 4 : 2],
      ),
      [
        ['Complex claim', 'Yes'],
        ['Receipt verified', i > 0 ? 'Yes' : 'Pending'],
        ['Provider verified', i > 1 ? 'Yes' : 'Pending'],
        ['Outcome', i === 2 ? 'Legitimate treatment confirmed' : 'Unresolved'],
      ],
    ),
  ),
);
board(
  'trees-and-forests',
  8,
  'Can relationship evidence change a forest’s top alerts?',
  'Use of verified relationship information in alert ranking',
  [0, 1, 2].map((i) =>
    f(
      ['No relationship feature', 'Verified relationship feature', 'Noisy relationship feature'][i],
      'The same six alerts compete for two review slots in every state. The example changes whether relationship information is absent, verified, or noisy; usefulness is checked afterward using investigator-confirmed outcomes.',
      'A verified relationship feature puts two useful alerts in the two available slots here, while noisy information puts none there. This small supplied example does not prove future performance; check data quality and results on later cases before relying on it.',
      'Useful findings in top 2',
      [1, 2, 0][i],
      'findings',
      'two reviewed alerts under each fixed ranking',
      flow(
        ['Slot 1', 'Slot 2', 'Excluded'],
        [
          ['A: useful', 'D: not useful', 'B: useful'],
          ['A: useful', 'B: useful', 'D: not useful'],
          ['D: not useful', 'E: not useful', 'A and B useful'],
        ][i],
        i === 2 ? 2 : 1,
      ),
      [
        ['Feature state', ['Absent', 'Verified', 'Noisy'][i]],
        ['Reviewed', 2],
        ['Useful findings', [1, 2, 0][i]],
      ],
    ),
  ),
);

board(
  'gradient-boosting',
  1,
  'Does the challenger still help in a later validation period?',
  'Compare missed defaults on the same applications at the same decline limit',
  [0, 1, 2].map((i) => {
    const base = [10, 12, 15][i],
      boost = [8, 9, 17][i];
    return f(
      ['Earlier period', 'Recent period', 'Stress period'][i],
      'Both models are checked on the same applications in each period and are allowed the same number of declines. The bars count defaults each model missed.',
      ['In this earlier period, the boosted model misses 2 fewer defaults than logistic regression.', 'In this recent period, the boosted model misses 3 fewer defaults at the same decline limit.', 'In this stress period, boosting misses 2 more defaults. The earlier improvement did not carry over. These supplied counts show why later and difficult periods need separate checks.'][i],
      'Missed-default reduction',
      base - boost,
      'defaults',
      'baseline missed defaults minus challenger missed defaults',
      bars(
        ['Logistic baseline', 'Boosted challenger'],
        [base, boost],
        'Missed defaults at fixed decline count',
        20,
        ['muted', 'blue'],
      ),
      [
        ['Period', ['Earlier', 'Recent', 'Stress'][i]],
        ['Baseline misses', base],
        ['Challenger misses', boost],
        ['Difference', base - boost],
      ],
    );
  }),
);
board(
  'gradient-boosting',
  2,
  'Which equal-capacity fraud queue contains more confirmed cases?',
  'Reveal investigation results as they become known',
  [0, 1, 2].map((i) =>
    f(
      ['Before investigation', 'First two outcomes', 'All four outcomes'][i],
      'Each model sends four transactions to investigators, so both use the same review capacity. The states reveal zero, then two, then all four outcomes in each queue; an unrevealed result is still unknown, not a confirmed success or failure.',
      ['Before investigation, all eight selected transactions have unknown outcomes, so there is no evidence yet that either queue is better.', 'After two outcomes per queue are known, boosting has two confirmed frauds and the baseline has one. Two transactions in each queue are still unknown, so this early count is incomplete.', 'After all four outcomes are known, boosting has three confirmed frauds and the baseline has two. That is one extra confirmed case in this small example, not proof the same difference will hold for future queues.'][i],
      'Confirmed boosted-queue frauds',
      [0, 2, 3][i],
      'cases',
      'four review slots; undisclosed outcomes remain unknown',
      matrix(
        ['Baseline queue', 'Boosted queue'],
        ['Confirmed fraud', 'Confirmed legitimate', 'Unknown'],
        [
          [
            [0, 0, 4],
            [0, 0, 4],
          ],
          [
            [1, 1, 2],
            [2, 0, 2],
          ],
          [
            [2, 2, 0],
            [3, 1, 0],
          ],
        ][i],
        'Four transactions in each queue',
      ),
      [
        ['Slots per model', 4],
        ['Boosted confirmed fraud', [0, 2, 3][i]],
        ['Baseline confirmed fraud', [0, 1, 2][i]],
        ['Unknown per queue', [4, 2, 0][i]],
      ],
    ),
  ),
);
board(
  'gradient-boosting',
  3,
  'Can a small signed correction change an AML review queue?',
  'Change Alert C’s score, keeping the other alerts and two review slots fixed',
  [-0.2, 0, 0.3].map((delta) =>
    f(
      `${delta >= 0 ? '+' : ''}${delta} score`,
      'Alert C starts at 0.50. Alert A scores 0.80 and B scores 0.60. The correction is added to C’s starting score, then the three alerts compete for two slots. These ranking scores are not probabilities.',
      ['C falls to 0.30, below both other scores, so it is outside the two review slots.', 'C reaches 0.50, still below A at 0.80 and B at 0.60, so it remains outside the two review slots.', 'C reaches 0.80 and ties A for the highest score, so both fit in the two available slots. A higher ranking means earlier review, not proof that an alert is illicit.'][delta < 0 ? 0 : delta === 0 ? 1 : 2],
      'Alert C final score',
      0.5 + delta,
      'score',
      'starting score 0.50 plus the supplied correction',
      [
        ...bars(['Alert A', 'Alert B', 'Alert C'], [0.8, 0.6, 0.5 + delta], 'Ranking score', 1),
        t(
          190,
          265,
          `C: 0.50 ${delta < 0 ? '−' : '+'} ${Math.abs(delta).toFixed(2)} → ${(0.5 + delta).toFixed(2)}`,
          'amber',
          true,
        ),
      ],
      [
        ['Correction', delta],
        ['C final score', 0.5 + delta],
        ['C reviewed', 0.5 + delta > 0.6 ? 'Yes' : 'No'],
      ],
    ),
  ),
);
board(
  'gradient-boosting',
  4,
  'Do merchant estimates match outcomes in later windows?',
  'Compare estimates with later observed defaults for the same 100-merchant bands',
  [0, 1, 2].map((i) =>
    f(
      ['Development', 'Next quarter', 'Following quarter'][i],
      'Each band has 100 merchants. The estimates predict 5, 8, then 12 defaults per 100; later, the observed counts are 5, 12, then 20. A difference between these rates is measured in percentage points.',
      ['In development, 5 estimated and 5 observed defaults per 100 match: a gap of 0 percentage points.', 'In the next quarter, 12 observed minus 8 estimated defaults per 100 is a gap of 4 percentage points.', 'In the following quarter, 20 observed minus 12 estimated defaults per 100 is a gap of 8 percentage points. The estimates fall further below the observed rate; this is a calibration gap, not an 8% relative increase.'][i],
      'Observed minus predicted rate',
      [0, 4, 8][i],
      'percentage points',
      '100 merchants per evaluated band',
      [
        ...trend(
          ['Dev', 'Q+1', 'Q+2'],
          [5, 8, 12],
          'Defaults per 100: blue estimate, dashed observed',
          [5, 12, 20],
        ),
        dot(52 + i * 250, 230 - ([5, 8, 12][i] / 20) * 175, 10, 'amber'),
      ],
      [
        ['Window', ['Development', 'Q+1', 'Q+2'][i]],
        ['Predicted', [5, 8, 12][i]],
        ['Observed', [5, 12, 20][i]],
        ['Gap', [0, 4, 8][i]],
      ],
    ),
  ),
);
board(
  'gradient-boosting',
  5,
  'Does a better event ranking also recover more dollars?',
  'Choose whether to rank by payment chance, expected dollars, or expected dollars per handling hour',
  [0, 1, 2].map((i) =>
    f(
      ['Payment events', 'Expected dollars', 'Dollars per handling hour'][i],
      'Account A has an estimated 80% payment chance on $100, B has 50% on $400, and C has 20% on $2,000. Multiply chance by balance to estimate dollars: $80, $200, and $400. Dividing those estimates by handling time (1, 1, and 4 hours) gives expected dollars per hour.',
      ['Ranking by payment chance puts A first, but its estimated payment is only $80 (0.80 × $100). This order favors the chance of any payment, not the largest amount.', 'Ranking by expected dollars puts C first: 0.20 × $2,000 = $400. This is an average estimate, not a guaranteed receipt.', 'Ranking by expected dollars per hour puts B first: $200 per hour, compared with $100 for C ($400 ÷ 4 hours) and $80 for A. The preferred order depends on the goal and how much collector time is available.'][i],
      'Top-ranked expected dollars',
      [80, 400, 200][i],
      '$',
      'expected amount for top account under the selected objective',
      network(
        [
          ['Old A', 80, 45],
          ['Old B', 80, 140],
          ['Old C', 80, 235],
          ['New rank 1', 500, 45],
          ['New rank 2', 500, 140],
          ['New rank 3', 500, 235],
        ],
        [
          [0, [3, 5, 5][i]],
          [1, [4, 4, 3][i]],
          [2, [5, 3, 4][i]],
        ],
      ),
      [
        ['Rank', ['A → B → C', 'C → B → A', 'B → C → A'][i]],
        ['Objective', ['Events', 'Dollars', 'Dollars / hour'][i]],
        ['Top expected dollars', [80, 400, 200][i]],
      ],
    ),
  ),
  'Ranking by payment chance, expected dollars, or dollars per handling hour answers a different business question. State the goal and staff capacity before choosing the queue.',
);
board(
  'gradient-boosting',
  6,
  'Which model is right when their churn predictions disagree?',
  'Compare the two models only on cases where their decisions disagree',
  [0, 1, 2].map((i) =>
    f(
      ['Established customers', 'New customers', 'Recently migrated customers'][i],
      'These counts cover 10 held-back customers in the selected group where logistic regression and boosting disagreed. “Correct” means the prediction matched the supplied outcome for that customer; the table does not describe customers where both models agreed.',
      [`Among the 10 disagreement cases for established customers, boosting is correct for ${[8, 4, 2][i]} and logistic regression for ${[2, 6, 8][i]}. The result differs by customer group, and ten examples are too few to establish a dependable group-wide advantage.`, `Among the 10 disagreement cases for new customers, boosting is correct for ${[8, 4, 2][i]} and logistic regression for ${[2, 6, 8][i]}. The result differs by customer group, and ten examples are too few to establish a dependable group-wide advantage.`, `Among the 10 disagreement cases for recently migrated customers, boosting is correct for ${[8, 4, 2][i]} and logistic regression for ${[2, 6, 8][i]}. The result differs by customer group, and ten examples are too few to establish a dependable group-wide advantage.`][i],
      'Challenger correct disagreements',
      [8, 4, 2][i],
      'of 10',
      'ten disagreement cases in each selected held-out group',
      matrix(
        ['Baseline: stay', 'Baseline: churn'],
        ['Boost: stay', 'Boost: churn'],
        [
          [40, 6],
          [4, 50],
        ],
        `10 disagreements; challenger correct ${[8, 4, 2][i]}`,
      ),
      [
        ['Group', ['Established', 'New', 'Migrated'][i]],
        ['Disagreements', 10],
        ['Challenger correct', [8, 4, 2][i]],
        ['Baseline correct', [2, 6, 8][i]],
      ],
    ),
  ),
  'These ten disagreement cases are a small, selected slice of each group. Check more later cases and the cases where both models agree before claiming one model is generally better.',
);
board(
  'gradient-boosting',
  7,
  'How does an expense assumption change a price indication without changing risk?',
  'Change operating expenses while holding expected claims and margin fixed',
  [40, 60, 100].map((expense) =>
    f(
      `$${expense} expenses`,
      'This illustration adds three dollar amounts: a $100 expected-claims estimate, the selected expense assumption, and a fixed $20 margin allowance. Only expenses change between states; estimated claims and margin stay fixed.',
      `With $${expense} in expenses, the indication is $100 + $${expense} + $20 = $${120 + expense}. This arithmetic shows how an expense assumption affects a hypothetical price; it does not change the claim-risk estimate or determine an actual premium.`,
      'Price indication',
      100 + expense + 20,
      '$',
      'expected claims + expense allowance + margin allowance',
      allocation(
        ['Model claim estimate', 'Expense assumption', 'Margin allowance'],
        [100, expense, 20],
      ),
      [
        ['Expected claims', 100],
        ['Expenses', expense],
        ['Margin allowance', 20],
        ['Indication', 120 + expense],
      ],
    ),
  ),
  'A model’s expected claim cost is one input to price. Expenses, margin, regulation, and other pricing rules also matter; this arithmetic is an illustration, not a real premium quote.',
);
board(
  'gradient-boosting',
  8,
  'What cash-flow information existed at each prediction date?',
  'Move the prediction date and check which cash-flow details are known by then',
  [0, 1, 2].map((i) =>
    f(
      ['Monday', 'Wednesday', 'Friday'][i],
      'The same account begins with $100. A $120 bill due Friday becomes known on Wednesday, and an unexpected $80 receipt arrives Friday. The supplied estimates refer to overdraft by Friday; only information available at each prediction date can be used.',
      ['On Monday, the bill and receipt are not yet known. The supplied 20% estimate must use only information available Monday.', 'By Wednesday, the $120 bill is known but Friday’s $80 receipt is not. The supplied estimate rises to 60%; the later receipt cannot be used to justify a Monday or Wednesday forecast.', 'On Friday, the $80 receipt has arrived, so it is now known. The supplied 10% estimate uses a different information set from Monday’s and Wednesday’s estimates. These illustrative percentages show changing information, not a measured effect of the bill or receipt by itself.'][i],
      'Supplied event probability',
      [20, 60, 10][i],
      '%',
      'overdraft by Friday for the same account',
      [
        ...timeline(
          ['Monday', 'Wednesday', 'Friday'],
          ['Balance $100', 'Bill $120 known', 'Receipt $80'],
          i,
        ),
        line(65 + i * 235, 30, 65 + i * 235, 225, 'red', true),
        t(
          65,
          265,
          ['Bill not yet known', 'Bill now known; receipt unknown', 'Receipt observed'][i],
          'amber',
          true,
        ),
      ],
      [
        ['Prediction date', ['Mon', 'Wed', 'Fri'][i]],
        ['Bill known', i > 0 ? 'Yes' : 'No'],
        ['Receipt observed', i === 2 ? 'Yes' : 'No'],
        ['Event estimate', [20, 60, 10][i] + '%'],
      ],
    ),
  ),
  'A forecast is only fair if its inputs were known on its prediction date. Name the event and time horizon, and leave later bills or receipts out of earlier estimates.',
);

board(
  'k-means',
  3,
  'How much technology exposure is hidden inside each portfolio’s equity total?',
  'Choose a portfolio and view its holdings by asset class or by equity sector',
  [0, 1, 2].map((i) =>
    f(
      ['Asset classes', 'Equity sectors', 'Sector cohort order'][i],
      'The three example portfolios contain stocks and bonds. The sector view splits the stock portion into technology and other stocks. Each percentage is a share of the whole portfolio’s value, not a return or forecast.',
      ['Portfolio A holds 80% stocks and 20% bonds. Splitting its stock holding shows 60% of the whole portfolio in technology and 20% in other stocks; the broader “stocks” total hides that concentration.', 'Portfolio B has 50% of its total value in technology, 20% in other stocks, and 30% in bonds.', 'Portfolio C has 20% in technology, 20% in other stocks, and 60% in bonds. Changing the view reveals the mix; it does not change the holdings or predict future performance.'][i],
      'Technology exposure in selected portfolio',
      [60, 50, 20][i],
      '%',
      'percent of the selected portfolio, not future return',
      i === 0
        ? matrix(
            ['Portfolio A', 'Portfolio B', 'Portfolio C'],
            ['Equity', 'Bonds'],
            [
              [80, 20],
              [70, 30],
              [40, 60],
            ],
            'Asset-class weights %',
          )
        : matrix(
            i === 1
              ? ['Portfolio A', 'Portfolio B', 'Portfolio C']
              : ['Portfolio C', 'Portfolio B', 'Portfolio A'],
            ['Technology', 'Other equity', 'Bonds'],
            i === 1
              ? [
                  [60, 20, 20],
                  [50, 20, 30],
                  [20, 20, 60],
                ]
              : [
                  [20, 20, 60],
                  [50, 20, 30],
                  [60, 20, 20],
                ],
            'Sector representation; group order can change',
          ),
      [
        ['Selected portfolio', ['A', 'B', 'C'][i]],
        ['Technology weight', [60, 50, 20][i] + '%'],
        ['Future performance', 'Not inferred'],
      ],
    ),
  ),
  'A portfolio exposure profile describes holdings at this time. Similar exposure does not establish similar future returns or investment suitability.',
);
board(
  'k-means',
  4,
  'Does sorting the same customers by similar monthly product use make a pattern easier to see?',
  'Reorder the unchanged customer rows',
  [0, 1, 2].map((i) => {
    const names = ['A', 'B', 'C'],
      rows = [
        [20, 0, 0],
        [18, 0, 0],
        [4, 8, 7],
      ],
      orders = [
        [0, 2, 1],
        [0, 1, 2],
        [2, 0, 1],
      ][i];
    return f(
      ['Original order', 'Group similar use', 'Investing group first'][i],
      'Each row shows how many times a customer used payments, savings, and investing in a month. The control changes only row order; it leaves every count and the example group labels unchanged.',
      `There are two neighboring row pairs in the display. In this order, ${[0, 1, 1][i]} pair${[0, 1, 1][i] === 1 ? '' : 's'} share the payments-only pattern. Sorting can make similar rows easier to spot, but it does not create clusters or prove what product a customer wants.`,
      'Adjacent customer pairs sharing the same usage group',
      [0, 1, 1][i],
      'pairs',
      'two adjacent row pairs; A and B share a payments-only pattern',
      matrix(
        orders.map((j) => `Customer ${names[j]}`),
        ['Payments', 'Savings', 'Investing'],
        orders.map((j) => rows[j]),
        'Monthly uses; row order changes',
      ),
      [
        ['Order', orders.map((j) => names[j]).join(', ')],
        ['A/B usage group', 'Payments only'],
        ['C usage group', 'Multiple products'],
      ],
    );
  }),
  'The monthly counts and example group labels stay fixed. Reordering changes which rows sit next to each other, so the adjacency count is only a visual aid, not a clustering score.',
);
board(
  'k-means',
  5,
  'When are branch and digital visits busiest on each day?',
  'Choose the day whose six two-hour periods are shown',
  [0, 1, 2].map((i) =>
    f(
      ['Weekday', 'Saturday', 'Sunday'][i],
      'Each line shows customer interactions in six two-hour periods, from 08:00 to 20:00. The solid blue line is branch visits; the dashed line is digital visits. The displayed values are fictional counts, not a forecast.',
      `On a ${['weekday', 'Saturday', 'Sunday'][i]}, the busiest branch period has ${[70, 90, 10][i]} interactions. Compare both channel lines across the whole day before planning staffing; this peak alone says nothing about whether the visits are valuable.`,
      'Branch peak interactions',
      [70, 90, 10][i],
      'interactions',
      'maximum across six two-hour intervals',
      trend(
        ['08', '10', '12', '14', '16', '18'],
        [
          [20, 40, 70, 50, 30, 10],
          [10, 50, 90, 60, 20, 5],
          [0, 0, 10, 5, 0, 0],
        ][i],
        'Interactions: blue branch; dashed digital',
        [
          [15, 20, 30, 40, 55, 70],
          [25, 35, 40, 45, 50, 55],
          [20, 25, 30, 35, 40, 45],
        ][i],
      ),
      [
        ['Day', ['Weekday', 'Saturday', 'Sunday'][i]],
        ['Branch peak', [70, 90, 10][i]],
        ['Channel contrast', 'Time-of-day behavior, not demand quality'],
      ],
    ),
  ),
  'These fixed day profiles can help compare visit timing. Check several days and the total activity before using a peak to plan branch staffing.',
);
board(
  'k-means',
  6,
  'Should cash-flow similarity depend on dollar size, weekly pattern, or both?',
  'Compare raw amounts with amounts divided by each customer’s own weekly average',
  [0, 1, 2].map((i) => {
    const a = [100, 200, 100, 200],
      b = [1000, 2000, 1000, 2000],
      va = i ? a.map((x) => x / 150) : a,
      vb = i ? b.map((x) => x / 1500) : b;
    return f(
      ['Raw amounts', 'Divide by each mean', 'Inspect normalized shape'][i],
      'Customer B’s weekly flows are ten times Customer A’s: A has $100, $200, $100, $200, while B has $1,000, $2,000, $1,000, $2,000. The mean is the total divided by four weeks: $150 for A and $1,500 for B. Dividing each week by that customer’s own mean removes overall size but keeps the up-and-down pattern.',
      `In this view, the two customers have ${i ? 4 : 0} matching weekly points out of four. Dividing by the mean makes their patterns identical because every B amount is ten times A’s. Keep this normalization only if size is not the question; it deliberately hides the tenfold difference in dollars.`,
      'Coincident weekly profile points',
      i ? 4 : 0,
      'of 4',
      'weeks where the two displayed profile values are equal',
      [
        ...trend(['W1', 'W2', 'W3', 'W4'], va, i ? 'Flow / customer mean' : 'Net flow $', vb),
        ...(i === 2 ? [dot(219, 55, 11, 'amber')] : []),
      ],
      [
        ['Customer A mean', 150],
        ['Customer B mean', 1500],
        ['Normalized patterns', 'Identical'],
        ['Displayed profile points that coincide', i ? 4 : 0],
      ],
    );
  }),
  'Use normalized shape when timing patterns matter more than account size. If the amount of cash flow matters to the decision, compare raw dollar values too.',
);
board(
  'isolation-forest',
  1,
  'Why can a rare payment be separated with fewer random cuts?',
  'Add a sample cut by amount, then by activity count',
  [0, 1, 2].map((i) =>
    f(
      ['Before cuts', 'Cut by amount', 'Cut by activity'][i],
      'The plot shows ten fictional payments using amount and activity count. Nine sit near one another and one sits far away. A cut divides the plot into smaller regions; an unusual point often lands alone after fewer cuts. These two cuts illustrate the idea and are not a fitted Isolation Forest path.',
      [`${['No cuts have been made yet.', 'One cut now separates the highlighted payment from nearby examples.', 'After two cuts, the highlighted payment occupies a smaller region than the other examples.'][i]} Isolation Forest uses many such random splits; a shorter average path signals unusualness in these inputs, not a probability of fraud or proof of wrongdoing.`, `${['No cuts have been made yet.', 'One cut now separates the highlighted payment from nearby examples.', 'After two cuts, the highlighted payment occupies a smaller region than the other examples.'][i]} Isolation Forest uses many such random splits; a shorter average path signals unusualness in these inputs, not a probability of fraud or proof of wrongdoing.`, `${['No cuts have been made yet.', 'One cut now separates the highlighted payment from nearby examples.', 'After two cuts, the highlighted payment occupies a smaller region than the other examples.'][i]} Isolation Forest uses many such random splits; a shorter average path signals unusualness in these inputs, not a probability of fraud or proof of wrongdoing.`][i],
      'Cuts needed for highlighted payment',
      [0, 1, 2][i],
      'cuts',
      'number of shown partitions on its path',
      [
        ...scatter(
          [
            [10, 10, 0],
            [15, 18, 0],
            [20, 15, 0],
            [25, 22, 0],
            [30, 25, 0],
            [35, 15, 0],
            [40, 30, 0],
            [42, 22, 0],
            [45, 35, 0],
            [90, 85, 2],
          ],
          [],
          'Payment amount',
          'Activity count',
        ),
        ...(i > 0 ? [line(350, 35, 350, 238, 'red', true)] : []),
        ...(i > 1 ? [line(350, 85, 558, 85, 'red', true)] : []),
      ],
      [
        ['Payment points', 10],
        ['Shown cuts', i],
        ['Confirmed fraud', 'Unknown'],
      ],
    ),
  ),
);
board(
  'isolation-forest',
  2,
  'Is this $20,000 payment above the range for the population, the customer, or similar peers?',
  'Choose the reference range used for comparison',
  [0, 1, 2].map((i) =>
    f(
      ['All customers', 'Customer history', 'Matched peers'][i],
      'The payment is $20,000. The three supplied reference ranges are $1,000–$8,000 for all customers, $10,000–$25,000 for this customer’s history, and $8,000–$22,000 for matched peers. “Above upper bound” subtracts the range’s high end from $20,000 and reports zero when the payment is within or below the range.',
      [
        'The $20,000 payment is $12,000 above the all-customer range’s $8,000 upper end. It is within this customer’s and matched peers’ ranges, so the conclusion changes with the reference group. Being within a range does not prove the payment is safe.',
        'The $20,000 payment is within this customer’s history range, which ends at $25,000, so it is $0 above that upper end. It is above the all-customer range but within the matched-peer range. A reference group supplies context, not proof of safety.',
        'The $20,000 payment is within the matched-peer range, which ends at $22,000, so it is $0 above that upper end. It is above the broad all-customer range but inside this customer’s and peers’ ranges. A reference group supplies context, not proof of safety.',
      ][i],
      'Amount above reference upper bound',
      [12, 0, 0][i],
      '$k',
      'max(20 − upper bound, 0)',
      [line(50, 150, 550, 150)],
      [
        ['Current $k', 20],
        ['Reference lower', [1, 10, 8][i]],
        ['Reference upper', [8, 25, 22][i]],
      ],
    ),
  ),
);
// The envelope is drawn explicitly to retain a non-text geometric change for every reference.
boards['isolation-forest/2'].frames.forEach((entry, i) => {
  entry.marks = [
    line(50, 170, 550, 170),
    rect(50 + [1, 10, 8][i] * 16, 120, ([8, 25, 22][i] - [1, 10, 8][i]) * 16, 75, 'blue'),
    line(370, 85, 370, 220, 'amber'),
    t(335, 67, 'Current $20k', 'amber', true),
    t(110, 264, `Reference $${[1, 10, 8][i]}k–$${[8, 25, 22][i]}k`, 'muted', true),
  ];
});
board(
  'isolation-forest',
  4,
  'Is this $240 expense above the normal range for the employee’s role?',
  'Choose the role group used as the comparison',
  [0, 1, 2].map((i) =>
    f(
      ['Office staff', 'Field sales', 'Conference organizers'][i],
      'The expense is $240. The example ranges are $20–$60 for office staff, $80–$260 for field sales, and $150–$400 for conference organizers. The comparison calculates how many dollars $240 exceeds the selected range’s upper end, stopping at zero if it does not exceed it.',
      [`For ${['office staff', 'field sales', 'conference organizers'][i]}, the upper end is $${[60, 260, 400][i]}. The amount above it is $${[180, 0, 0][i]}: subtract the upper end from $240, or report zero when the expense is within the range. A peer range provides context but cannot verify the receipt or show misconduct.`, `For ${['office staff', 'field sales', 'conference organizers'][i]}, the upper end is $${[60, 260, 400][i]}. The amount above it is $${[180, 0, 0][i]}: subtract the upper end from $240, or report zero when the expense is within the range. A peer range provides context but cannot verify the receipt or show misconduct.`, `For ${['office staff', 'field sales', 'conference organizers'][i]}, the upper end is $${[60, 260, 400][i]}. The amount above it is $${[180, 0, 0][i]}: subtract the upper end from $240, or report zero when the expense is within the range. A peer range provides context but cannot verify the receipt or show misconduct.`][i],
      'Amount above peer upper bound',
      [180, 0, 0][i],
      '$',
      'max($240 − selected peer upper bound, 0)',
      [
        ...bars(
          ['Peer low', 'This expense', 'Peer high'],
          [
            [20, 240, 60],
            [80, 240, 260],
            [150, 240, 400],
          ][i],
          'Expense $',
          400,
          ['blue', 'amber', 'blue'],
        ),
        t(
          16,
          265,
          ['Office peer group', 'Sales travel peers', 'Event organizing peers'][i],
          'muted',
          true,
        ),
      ],
      [
        ['Expense', 240],
        ['Peer low', [20, 80, 150][i]],
        ['Peer high', [60, 260, 400][i]],
        ['Verification', 'Still required'],
      ],
    ),
  ),
);
board(
  'isolation-forest',
  5,
  'Which differences from the account’s usual wire would an investigator check?',
  'Select a wire and inspect its supporting documentation',
  [0, 1, 2].map((i) =>
    f(
      ['Large familiar wire', 'New-destination wire', 'Night-time wire'][i],
      'The account usually sends an $8,000 daytime domestic wire. The three examples change the amount, destination, or time. Each also shows a fictional investigator note to illustrate that unusual activity can have a documented business reason.',
      [`This wire differs from the account’s usual pattern on ${[1, 1, 2][i]} attribute${[1, 1, 2][i] === 1 ? '' : 's'}. The note says “${['Documented property closing', 'Verified supplier onboarding', 'Verified overseas supplier'][i]}.” That gives a possible explanation to verify; the unusualness signal still does not establish wrongdoing.`, `This wire differs from the account’s usual pattern on ${[1, 1, 2][i]} attribute${[1, 1, 2][i] === 1 ? '' : 's'}. The note says “${['Documented property closing', 'Verified supplier onboarding', 'Verified overseas supplier'][i]}.” That gives a possible explanation to verify; the unusualness signal still does not establish wrongdoing.`, `This wire differs from the account’s usual pattern on ${[1, 1, 2][i]} attribute${[1, 1, 2][i] === 1 ? '' : 's'}. The note says “${['Documented property closing', 'Verified supplier onboarding', 'Verified overseas supplier'][i]}.” That gives a possible explanation to verify; the unusualness signal still does not establish wrongdoing.`][i],
      'Changed wire attributes',
      [1, 1, 2][i],
      'attributes',
      'compared with the account’s usual $8k daytime domestic wire',
      timeline(
        ['Usual history', 'Selected wire', 'Evidence'],
        [
          '$8k / daytime',
          ['$50k / familiar', '$8k / new payee', '$12k / 02:00'][i],
          ['Property closing', 'New supplier invoice', 'Overseas time zone'][i],
        ],
        1,
      ),
      [
        ['Amount', [50000, 8000, 12000][i]],
        ['Destination', ['Familiar', 'New', 'New'][i]],
        ['Time', ['Daytime', 'Daytime', '02:00'][i]],
        [
          'Explanation',
          [
            'Documented property closing',
            'Verified supplier onboarding',
            'Verified overseas supplier',
          ][i],
        ],
      ],
    ),
  ),
);
board(
  'isolation-forest',
  6,
  'Does a rise from 5 to 30 refunds look as large against every time window?',
  'Choose the historical window used as the reference',
  [0, 1, 2].map((i) =>
    f(
      ['Previous week', 'Previous quarter', 'Same season last year'][i],
      `The current period has 30 refunds among 200 transactions (15%). The ${['previous week', 'previous quarter', 'same season last year'][i]} had ${[5, 15, 28][i]} refunds among ${[100, 180, 205][i]} transactions (${([5 / 100, 15 / 180, 28 / 205][i] * 100).toFixed(1)}%). It also had a different average ticket. Comparing counts alone ignores how many transactions occurred.`,
      `Refunds rose from ${[5, 15, 28][i]} to 30, a change of ${[25, 15, 2][i]} refunds. But the refund share also changed: from ${([5 / 100, 15 / 180, 28 / 205][i] * 100).toFixed(1)}% to 15%, or ${([15 - 5, 15 - (15 / 180 * 100), 15 - (28 / 205 * 100)][i]).toFixed(1)} percentage points. A different comparison period can change the alert; investigate seasonality and operating changes before attributing a cause.`,
      'Refund-count change',
      [25, 15, 2][i],
      'refunds',
      'current 30 less reference count',
      matrix(
        ['Reference', 'Current'],
        ['Refunds', 'Transactions', 'Ticket $'],
        [
          [
            [5, 100, 20],
            [15, 180, 38],
            [28, 205, 42],
          ][i],
          [30, 200, 40],
        ],
        'Counts and dollars: each column has its own unit',
      ),
      [
        ['Reference refunds', [5, 15, 28][i]],
        ['Current refunds', 30],
        ['Difference', [25, 15, 2][i]],
      ],
    ),
  ),
);
board(
  'isolation-forest',
  7,
  'What records can help explain a sudden burst of 120 orders?',
  'Reveal the announcement and cancellation records',
  [0, 1, 2].map((i) =>
    f(
      ['Burst only', 'Nearby market events', 'Order cancellations'][i],
      'The same 120-order burst happens at 10:02 in all three states. Investigators can check two records: whether an announcement was scheduled nearby and whether the burst orders were later canceled.',
      [`${i} of two context records have been checked so far. A sudden burst is unusual behavior worth examining; the announcement and cancellation records may help explain it, but they do not by themselves establish misconduct.`, `${i} of two context records have been checked so far. A sudden burst is unusual behavior worth examining; the announcement and cancellation records may help explain it, but they do not by themselves establish misconduct.`, `${i} of two context records have been checked so far. A sudden burst is unusual behavior worth examining; the announcement and cancellation records may help explain it, but they do not by themselves establish misconduct.`][i],
      'Context sources inspected',
      [0, 1, 2][i],
      'of 2',
      'announcement record and cancellation record',
      [
        ...timeline(
          ['10:00', '10:02', '10:04'],
          [
            i ? 'Announcement' : 'Not inspected',
            '120-order burst',
            i > 1 ? 'Cancellations' : 'Not inspected',
          ],
          1,
        ),
        ...(i > 0 ? [dot(65, 125, 17, 'green')] : []),
        ...(i > 1
          ? [
              line(535, 195, 535, 250, 'red'),
              t(385, 280, 'Cancellation records now visible', 'red', true),
            ]
          : []),
      ],
      [
        ['Burst orders', 120],
        ['Announcement checked', i ? 'Yes' : 'No'],
        ['Cancellations inspected', i > 1 ? 'Yes' : 'No'],
        ['Context sources inspected', [0, 1, 2][i]],
      ],
    ),
  ),
);
board(
  'isolation-forest',
  8,
  'Which record-level mismatch explains the difference between the payment and settlement ledgers?',
  'Choose the example ledger defect',
  [0, 1, 2].map((i) =>
    f(
      ['Missing record', 'Duplicate record', 'Amount mismatch'][i],
      'The payment ledger expects A=$100, B=$200, and C=$300, for $600 total. Compare each settlement entry with its matching payment; the total difference tells you that records disagree, while the row-by-row comparison helps identify why.',
      ['Settlement is $100 for A and $300 for C, but there is no entry for B. The missing $200 record explains the $200 shortfall. Check the source record before adding anything.', 'Settlement lists C as $600 instead of $300, so that record is duplicated by $300. The settlement total is $900, which is $300 above the $600 expected. Verify the duplicate before correcting it.', 'Settlement lists C as $270 instead of $300, a $30 shortfall. A total-only alert shows a mismatch; comparing the records identifies which amount needs source verification.'][i],
      'Absolute unmatched total',
      [200, 300, 30][i],
      '$',
      'absolute $600 payment total minus settlement total',
      matrix(
        ['Payments', 'Settlement'],
        ['A', 'B', 'C'],
        [
          [100, 200, 300],
          [
            [100, 0, 300],
            [100, 200, 600],
            [100, 200, 270],
          ][i],
        ],
        'Ledger amounts $',
      ),
      [
        ['Payments', 600],
        ['Settlement total', [400, 900, 570][i]],
        ['Mismatch type', ['Missing B', 'Duplicated C', 'C is $30 short'][i]],
        ['Difference', [200, 300, 30][i]],
      ],
    ),
  ),
);

board(
  'time-series',
  5,
  'How should 240 collection case-slots be scheduled across three days?',
  'Move the same total staff capacity between days',
  [0, 1, 2].map((i) => {
    const arrivals = [60, 120, 60],
      capacity = [
        [80, 80, 80],
        [60, 120, 60],
        [100, 100, 40],
      ][i];
    let backlog = 0;
    const backlogs = arrivals.map((v, j) => (backlog = Math.max(0, backlog + v - capacity[j])));
    return f(
      ['Even staffing', 'Match due-date peak', 'Front-loaded staffing'][i],
      'Arrivals are 60 cases Monday, 120 Tuesday, and 60 Wednesday. Each schedule offers 240 staff case-slots total, but places them on different days. Unfinished cases carry into the next day.',
      `With capacity ${capacity.join(', ')} across the three days, the end-of-day backlog is ${backlogs.join(', ')} cases and peaks at ${Math.max(...backlogs)}. Move capacity to match Tuesday’s 120 arrivals and no queue remains; having enough total capacity is not enough if it is available on the wrong day. These fixed arrivals are a planning example, not a forecast of future workload.`,
      'Peak case backlog',
      Math.max(...backlogs),
      'cases',
      'maximum end-of-day queue over three days',
      matrix(
        ['Arrivals', 'Capacity', 'Backlog'],
        ['Mon', 'Tue', 'Wed'],
        [arrivals, capacity, backlogs],
        'Cases per day',
      ),
      [
        ['Arrivals', arrivals.join(', ')],
        ['Capacity', capacity.join(', ')],
        ['Backlog', backlogs.join(', ')],
        ['Total capacity', 240],
      ],
    );
  }),
);
board(
  'time-series',
  6,
  'How does the premium-payment share change fees when the total stays at 1,000?',
  'Choose the share of transactions charged the premium fee',
  [0, 50, 100].map((share) =>
    f(
      `${share}% premium`,
      `The total stays at 1,000 payments. Standard payments earn $0.20 each and premium payments $0.80 each. At a ${share}% premium share, ${1000 - share * 10} are standard and ${share * 10} are premium; costs and refunds are left out.`,
      `Fee revenue is ${1000 - share * 10} × $0.20 + ${share * 10} × $0.80 = $${200 + share * 6}. The payment count stays fixed, but the mix changes the total because premium payments have a higher fee. This is gross fee revenue under the supplied rates, not profit.`,
      'Forecast fee revenue',
      (1000 - share * 10) * 0.2 + share * 10 * 0.8,
      '$',
      'standard count × $0.20 + premium count × $0.80',
      network(
        [
          ['1,000 payments', 80, 140],
          ['Standard', 340, 55],
          ['Premium', 340, 225],
          ['Revenue', 535, 140],
        ],
        [
          [0, 1, `${1000 - share * 10}`],
          [0, 2, `${share * 10}`],
          [1, 3, '$0.20'],
          [2, 3, '$0.80'],
        ],
      ),
      [
        ['Total volume', 1000],
        ['Premium count', share * 10],
        ['Standard count', 1000 - share * 10],
        ['Revenue', 200 + share * 6],
      ],
    ),
  ),
);
board(
  'time-series',
  8,
  'How does the persistence setting change how quickly volatility settles after a shock?',
  'Choose how much of the previous variance gap carries forward',
  [0.2, 0.5, 0.8].map((beta) => {
    const v = [9];
    for (let j = 0; j < 4; j++) v.push(1 + beta * (v[j] - 1));
    return f(
      `Persistence ${beta}`,
      `This teaching example starts with variance 9 after a shock and returns toward a long-run variance of 1. Each step uses: next variance = 1 + persistence × (current variance − 1). Variance measures squared movement; taking its square root gives volatility in return units.`,
      `With persistence ${beta}, four updates leave variance ${v[4].toFixed(2)} and volatility √${v[4].toFixed(2)} ≈ ${Math.sqrt(v[4]).toFixed(2)} return units. A higher persistence keeps more of the gap above 1 at each update, so volatility falls more slowly. This toy recursion illustrates a GARCH idea; it is not a fitted market forecast or an ARIMA result.`,
      'Volatility four periods after shock',
      Math.sqrt(v[4]),
      'return units',
      'square root of recursively projected variance',
      [
        ...trend(['Shock', 'T1', 'T2', 'T3', 'T4'], v.map(Math.sqrt), 'Conditional volatility'),
        ...v.map((value, j) =>
          line(
            52 + j * 125,
            140 - Math.sqrt(value) * 20,
            52 + j * 125,
            140 + Math.sqrt(value) * 20,
            'amber',
          ),
        ),
      ],
      [
        ['Persistence', beta],
        ['Variances', v.map((x) => x.toFixed(2)).join(', ')],
        ['Last volatility', Math.sqrt(v[4])],
      ],
    );
  }),
);

board(
  'graph-methods',
  1,
  'Which transfers are visible as investigators move forward in time?',
  'Reveal later transfers in their recorded time order',
  [0, 1, 2].map((i) =>
    f(
      ['09:00 fan-in', '10:00 pass-through', '11:00 fan-out'][i],
      'Accounts A and B each send $100 to a hub at 09:00. At 10:00, the hub sends a recorded $190 onward through another account. At 11:00, that account sends $100 and $90 to two recipients. The arrows show who sent money to whom.',
      [`By ${['09:00', '10:00', '11:00'][i]}, investigators can see ${[2, 3, 5][i]} recorded transfers. Revealing later edges adds information about the route, but a shared route or split payment can have a legitimate purpose. The diagram is a lead to investigate, not proof of a mule network.`, `By ${['09:00', '10:00', '11:00'][i]}, investigators can see ${[2, 3, 5][i]} recorded transfers. Revealing later edges adds information about the route, but a shared route or split payment can have a legitimate purpose. The diagram is a lead to investigate, not proof of a mule network.`, `By ${['09:00', '10:00', '11:00'][i]}, investigators can see ${[2, 3, 5][i]} recorded transfers. Revealing later edges adds information about the route, but a shared route or split payment can have a legitimate purpose. The diagram is a lead to investigate, not proof of a mule network.`][i],
      'Visible transfer edges',
      [2, 3, 5][i],
      'edges',
      'recorded directed transfers by the selected cutoff',
      network(
        [
          ['Source A', 65, 45],
          ['Source B', 65, 235],
          ['Hub', 240, 140],
          ['Pass-through', 400, 140],
          ['Recipient C', 545, 45],
          ['Recipient D', 545, 235],
        ],
        [
          [0, 2, '100 →'],
          [1, 2, '100 →'],
          ...(i > 0 ? [[2, 3, '190 →'] as [number, number, string]] : []),
          ...(i > 1
            ? ([
                [3, 4, '100 →'],
                [3, 5, '90 →'],
              ] as [number, number, string][])
            : []),
        ],
      ),
      [
        ['Cutoff', ['09:00', '10:00', '11:00'][i]],
        ['Visible edges', [2, 3, 5][i]],
        ['Purpose', 'Requires investigation'],
      ],
    ),
  ),
);
board(
  'graph-methods',
  3,
  'How much money reached D along each dated route?',
  'Select route A–B–D, A–C–D, or both',
  [0, 1, 2].map((i) =>
    f(
      ['A → B → D', 'A → C → D', 'Both paths'][i],
      'A sends $100 to B on day 1 and $200 to C on day 2. B later sends $90 to D on day 3; C sends $180 to D on day 4. Dates and arrow direction show when each transfer occurred.',
      [`Along the selected route${i === 2 ? 's' : ''}, $${[90, 180, 270][i]} reaches D: ${i === 0 ? 'the last transfer on A–B–D is $90' : i === 1 ? 'the last transfer on A–C–D is $180' : '$90 on A–B–D plus $180 on A–C–D is $270'}. Count the amounts arriving at D once; adding earlier transfers would count some of the same money a second time. This flow total does not show whether a transaction was improper.`, `Along the selected route${i === 2 ? 's' : ''}, $${[90, 180, 270][i]} reaches D: ${i === 0 ? 'the last transfer on A–B–D is $90' : i === 1 ? 'the last transfer on A–C–D is $180' : '$90 on A–B–D plus $180 on A–C–D is $270'}. Count the amounts arriving at D once; adding earlier transfers would count some of the same money a second time. This flow total does not show whether a transaction was improper.`, `Along the selected route${i === 2 ? 's' : ''}, $${[90, 180, 270][i]} reaches D: ${i === 0 ? 'the last transfer on A–B–D is $90' : i === 1 ? 'the last transfer on A–C–D is $180' : '$90 on A–B–D plus $180 on A–C–D is $270'}. Count the amounts arriving at D once; adding earlier transfers would count some of the same money a second time. This flow total does not show whether a transaction was improper.`][i],
      'Value arriving at D on selected paths',
      [90, 180, 270][i],
      '$',
      'last-edge amounts only; excludes intermediate transfers',
      network(
        [
          ['A', 65, 140],
          ['B', 285, 45],
          ['C', 285, 235],
          ['D', 535, 140],
        ],
        [
          ...(i !== 1
            ? ([
                [0, 1, 'D1: 100'],
                [1, 3, 'D3: 90'],
              ] as [number, number, string][])
            : []),
          ...(i !== 0
            ? ([
                [0, 2, 'D2: 200'],
                [2, 3, 'D4: 180'],
              ] as [number, number, string][])
            : []),
        ],
      ),
      [
        ['Path', ['A-B-D', 'A-C-D', 'Both'][i]],
        ['Arrival at D', [90, 180, 270][i]],
        ['Dates', 'Retained on each edge'],
      ],
    ),
  ),
);
board(
  'graph-methods',
  4,
  'How many accounts share this internet address, and what does that context mean?',
  'Check whether the shared address is a household or public Wi-Fi hub',
  [0, 1, 2].map((i) =>
    f(
      ['Unknown shared IP', 'Verified household', 'Public Wi-Fi hub'][i],
      'Three accounts connect to the same internet address (IP). Checking whether that address belongs to one household or a public Wi-Fi hub changes the context; it does not erase the observed connections.',
      [`${i === 2 ? 6 : 3} accounts connect directly to this IP address. A verified household can explain several people sharing a home connection, and public Wi-Fi can explain visitor accounts. The links alone do not establish account takeover or prove the accounts belong to one person.`, `${i === 2 ? 6 : 3} accounts connect directly to this IP address. A verified household can explain several people sharing a home connection, and public Wi-Fi can explain visitor accounts. The links alone do not establish account takeover or prove the accounts belong to one person.`, `${i === 2 ? 6 : 3} accounts connect directly to this IP address. A verified household can explain several people sharing a home connection, and public Wi-Fi can explain visitor accounts. The links alone do not establish account takeover or prove the accounts belong to one person.`][i],
      'Accounts connected to contextual hub',
      [3, 3, 6][i],
      'accounts',
      'direct observed account–IP links',
      network(
        [
          ['IP hub', 300, 140],
          ['Account A', 65, 40],
          ['Account B', 65, 140],
          ['Account C', 65, 240],
          ...(i === 2
            ? ([
                ['Visitor D', 535, 40],
                ['Visitor E', 535, 140],
                ['Visitor F', 535, 240],
              ] as [string, number, number][])
            : []),
        ],
        Array.from({ length: i === 2 ? 6 : 3 }, (_, j) => [0, j + 1] as [number, number]),
        i === 1 ? [1, 2, 3] : [0],
      ),
      [
        ['Context', ['Unknown', 'Verified household', 'Public Wi-Fi'][i]],
        ['Connected accounts', i === 2 ? 6 : 3],
        ['Takeover established', 'No'],
      ],
    ),
  ),
);
board(
  'graph-methods',
  5,
  'How many account-to-merchant purchases happened within each time window?',
  'Narrow the event-time window from a month to a minute',
  [0, 1, 2].map((i) =>
    f(
      ['Whole month', 'Same day', 'Same minute'][i],
      `The diagram tracks three accounts and two merchants. Over the month, ${[6, 4, 2][i]} purchases match the selected window: one month, one day, or one minute. A narrower window keeps only purchases close enough in time to meet that setting.`,
      `${[6, 4, 2][i]} purchases fall within the ${['month', 'day', 'minute'][i]} window. Fewer connections at a narrower window can focus an investigation, but shared timing does not prove coordination or collusion; check the transactions and ordinary business context.`,
      'Links in selected time window',
      [6, 4, 2][i],
      'transactions',
      'account–merchant purchases within selected window',
      network(
        [
          ['A', 80, 40],
          ['B', 80, 140],
          ['C', 80, 240],
          ['Merchant X', 490, 80],
          ['Merchant Y', 490, 220],
        ],
        [
          [0, 3],
          [0, 4],
          ...(i < 2
            ? ([
                [1, 3],
                [1, 4],
              ] as [number, number][])
            : []),
          ...(i === 0
            ? ([
                [2, 3],
                [2, 4],
              ] as [number, number][])
            : []),
        ],
      ),
      [
        ['Window', ['Month', 'Day', 'Minute'][i]],
        ['Links', [6, 4, 2][i]],
        ['Collusion', 'Requires supporting evidence'],
      ],
    ),
  ),
);
board(
  'graph-methods',
  6,
  'How large is the loss if counterparty A fails to repay a share of its $60m exposure?',
  'Choose the hypothetical loss share applied to counterparty A',
  [0, 25, 50].map((lgd) =>
    f(
      `${lgd}% stressed loss`,
      `The bank has $60m exposed to counterparty A, $25m to B, and $15m to C. This scenario applies a ${lgd}% loss share only to A’s exposure; the other exposures stay unchanged.`,
      `${lgd}% of A’s $60m exposure is $${(60 * lgd) / 100}m (60 × ${lgd}/100). This is a hypothetical loss amount under the selected stress assumption, not a predicted or realized loss. The network shows exposure size; it does not model whether one failure would cause another.`,
      'Scenario credit loss',
      (60 * lgd) / 100,
      '$m',
      '$60m exposure to A × stressed loss fraction',
      [
        ...network(
          [
            ['Bank', 300, 140],
            ['A · $60m', 80, 40],
            ['B · $25m', 515, 65],
            ['C · $15m', 435, 245],
          ],
          [
            [0, 1, '60'],
            [0, 2, '25'],
            [0, 3, '15'],
          ],
          [1],
        ),
        rect(40, 255, lgd * 3, 18, 'red'),
      ],
      [
        ['Exposure A', 60],
        ['Loss fraction', lgd + '%'],
        ['Scenario loss', (60 * lgd) / 100],
      ],
    ),
  ),
);
board(
  'graph-methods',
  8,
  'How many candidate pairs should be accepted when the match cutoff changes?',
  'Choose the minimum similarity score required to accept a candidate pair',
  [0.9, 0.7, 0.5].map((cutoff) => {
    const scores = [0.95, 0.8, 0.6],
      accepted = scores.filter((v) => v >= cutoff).length;
    const falseMerges = cutoff <= 0.8 ? 1 : 0;
    return f(
      `${cutoff.toFixed(2)} threshold`,
      'The system gives three possible person-pairs similarity scores of 0.95, 0.80, and 0.60. A threshold is the minimum score for accepting a pair for review. Verified same/different labels are shown only to evaluate the example; an accepted link is still a hypothesis, not confirmed identity.',
      cutoff === 0.9
        ? 'Only the 0.95 pair meets this cutoff, and the supplied labels show it is a true match. The true 0.60 pair is missed. Lowering the cutoff accepts more pairs, including the false 0.80 pair at 0.70. Similarity is a ranking score, not the chance that two records belong to the same person.'
        : cutoff === 0.7
          ? 'The 0.95 and 0.80 pairs meet this cutoff. The supplied labels show one true match and one false match, so one of the two accepted pairs would merge different people. The true 0.60 pair is still missed. These labels evaluate the example; an accepted pair remains a hypothesis.'
          : 'All three pairs meet this cutoff. The supplied labels show two true matches and one false match, so lowering the cutoff recovers the 0.60 true pair but also accepts the false 0.80 pair. Similarity is not identity probability; check reliable evidence before joining records.',
      'False merges among accepted candidates',
      falseMerges,
      'merges',
      `${accepted} accepted candidates; verified truth used only for evaluation`,
      network(
        [
          ['A', 75, 45],
          ['B', 75, 145],
          ['C', 75, 245],
          ['A′', 515, 45],
          ['B′', 515, 145],
          ['C′', 515, 245],
        ],
        [
          [0, 3, scores[0] >= cutoff ? 'accepted' : '?'],
          [1, 4, scores[1] >= cutoff ? 'accepted' : '?'],
          [2, 5, scores[2] >= cutoff ? 'accepted' : '?'],
        ],
        Array.from({ length: accepted }, (_, j) => j),
      ),
      [
        ['Scores', '.95 / .80 / .60'],
        ['Truth', 'same / different / same'],
        ['Accepted', accepted],
        ['False merges', cutoff <= 0.8 ? 1 : 0],
      ],
    );
  }),
);

board(
  'transformers',
  3,
  'Can a document classifier work when a critical section is missing?',
  'Critical document section visibility',
  [0, 1, 2].map((i) =>
    f(
      [
        'Complete identity document',
        'Identity heading hidden',
        'Heading and identity fields hidden',
      ][i],
      'A synthetic document contains a type heading, identifying fields, and footer; removed content is genuinely unavailable to the demonstration.',
      'Request a readable document when evidence for its class is missing; classification does not verify identity.',
      'Visible required sections',
      [3, 2, 1][i],
      'of 3',
      'heading, identity fields, and footer',
      [
        ...[0, 1, 2].map((j) => rect(130, 30 + j * 80, 340, 62, j < i ? 'muted' : 'blue')),
        ...[0, 1, 2].map((j) =>
          t(
            150,
            65 + j * 80,
            j < i
              ? 'Section missing'
              : ['IDENTITY DOCUMENT', 'Name · date · identifier', 'Issuer / footer'][j],
            'ink',
            true,
          ),
        ),
      ],
      [
        ['Heading', i > 0 ? 'Hidden' : 'Visible'],
        ['Identity fields', i > 1 ? 'Hidden' : 'Visible'],
        ['Footer', 'Visible'],
        ['Next step', i ? 'Request complete copy' : 'Continue verification'],
      ],
    ),
  ),
);
board(
  'transformers',
  4,
  'Does an exception change how an extracted covenant is applied?',
  'Exception clause',
  [0, 1, 2].map((i) =>
    f(
      ['No exception', 'Exception applies this quarter', 'Exception expired'][i],
      'Base leverage limit is 3×; measured leverage is 3.5×. A fictional temporary exception permits 4× through June 30.',
      'Extract threshold, dates, and exception conditions together before applying the clause.',
      'Applicable limit headroom',
      [-0.5, 0.5, -0.5][i],
      '× leverage',
      'applicable limit minus observed leverage 3.5×',
      [
        ...flow(
          ['Base clause', 'Exception / date', 'Applicable check'],
          [
            'Limit 3×',
            ['None', '4× until June 30', 'After June 30'][i],
            ['3.5 > 3', '3.5 ≤ 4', '3.5 > 3'][i],
          ],
          1,
        ),
        line(55, 260, 55 + [3, 4, 3][i] * 110, 260, i === 1 ? 'green' : 'red'),
      ],
      [
        ['Base limit', 3],
        ['Exception limit', i ? 4 : 'None'],
        ['Exception active', i === 1 ? 'Yes' : 'No'],
        ['Observed leverage', 3.5],
        ['Headroom', [-0.5, 0.5, -0.5][i]],
      ],
    ),
  ),
);
board(
  'transformers',
  6,
  'How do multiple topic tags differ from a sentiment label?',
  'Article evidence',
  [0, 1, 2].map((i) =>
    f(
      ['Earnings result', 'Earnings and merger', 'Earnings, merger, regulation'][i],
      `The teaching article has ${i + 1} supplied topic${i ? ' tags' : ' tag'} while its separate sentiment label remains neutral. No text model runs here.`,
      `This article has ${i + 1} supported topic tag${i ? 's' : ''} (${['earnings', 'earnings and merger', 'earnings, merger, and regulation'][i]}). More than one topic can fit an article. Sentiment answers a different question and stays neutral in this example, so count topic tags separately from sentiment labels.`,
      'Supported topic tags',
      i + 1,
      'tags',
      'one article; sentiment is a separate output',
      [
        ...network(
          [
            ['Article', 280, 130],
            ['Earnings', 70, 40],
            ['Merger', 70, 130],
            ['Regulation', 70, 230],
            ['Sentiment: neutral', 500, 130],
          ],
          [...Array.from({ length: i + 1 }, (_, j) => [0, j + 1] as [number, number]), [0, 4]],
        ),
        t(300, 265, 'Topic count changes; sentiment stays neutral', 'muted', true),
      ],
      [
        ['Topics', i + 1],
        ['Sentiment', 'Neutral'],
        ['Topic evidence', ['Earnings', 'Earnings; merger', 'Earnings; merger; regulation'][i]],
      ],
    ),
  ),
);
board(
  'transformers',
  7,
  'Which changed qualifier alters the scope of a policy?',
  'Fictional qualifier revision',
  [0, 1, 2].map((i) =>
    f(
      ['Formatting change', '“Above” becomes “at least”', 'Scope gains an exception'][i],
      'Fictional starting rule: review transfers above $10,000. The examples are a $10,000 external transfer, a $12,000 external transfer, and a $12,000 internal transfer. The second state changes “above” to “at least”; the third adds an exception for internal transfers. This is a teaching example, not legal advice.',
      [
        '“Above $10,000” excludes the transfer at exactly $10,000 and includes both $12,000 transfers: 2 of 3. The policy owner must confirm that this wording matches the intended rule.',
        '“At least $10,000” includes equality, so all three examples meet the amount test: 3 of 3. That is one more covered transfer than under “above”; the policy owner must decide whether the boundary change is intended.',
        'The new exception removes internal transfers from the starting rule. Only the $12,000 external transfer remains covered: 1 of 3. A text tool can flag the changed scope, but the responsible policy owner decides what the procedure requires.',
      ][i],
      'Example transfers covered',
      [2, 3, 1][i],
      'of 3',
      'three examples: $10k external, $12k external, $12k internal',
      [
        ...flow(
          ['Old rule', 'New qualifier', 'Owner review'],
          [
            'Above $10,000',
            ['No semantic change', 'At least $10,000', 'Except internal transfers'][i],
            i ? 'Assess scope change' : 'Formatting only',
          ],
          1,
        ),
        ...bars(
          ['$10k external', '$12k external', '$12k internal'],
          [
            [0, 1, 1],
            [1, 1, 1],
            [0, 1, 0],
          ][i],
          'Covered: 1 yes / 0 no',
          1,
        ).map((m) =>
          m.kind === 'text'
            ? { ...m, y: (m.y ?? 0) * 0.4 + 190 }
            : m.kind === 'rect'
              ? { ...m, y: (m.y ?? 0) * 0.4 + 190, height: (m.height ?? 0) * 0.4 }
              : m,
        ),
      ],
      [
        ['Qualifier', ['Above', 'At least', 'Above, except internal'][i]],
        ['Policy owner', 'Fictional compliance procedure team'],
        ['Covered examples', [2, 3, 1][i]],
      ],
    ),
  ),
);

board(
  'rag',
  5,
  'Does a missing or contradictory record change the supported summary?',
  'File evidence condition',
  [0, 1, 2].map((i) =>
    f(
      ['Consistent file', 'Income document missing', 'Income records contradict'][i],
      'Application states annual income $60,000; supporting evidence either agrees, is absent, or states $45,000.',
      'A summary must preserve missing and conflicting evidence instead of selecting a convenient figure.',
      'Unresolved income evidence issues',
      [0, 1, 1][i],
      'issues',
      'one required income fact checked across sources',
      network(
        [
          ['Application: $60k', 100, 50],
          ['Income evidence', 100, 230],
          ['Supported summary', 485, 140],
        ],
        [
          [0, 2],
          [1, 2, i === 1 ? '?' : i === 2 ? 'conflict' : 'agrees'],
        ],
        [i ? 1 : 2],
      ),
      [
        ['Application income', 60000],
        ['Evidence', [60000, 'Missing', 45000][i]],
        [
          'Summary',
          i === 0 ? '$60k supported' : i === 1 ? 'Income unverified' : 'Conflicting income sources',
        ],
      ],
    ),
  ),
);
board(
  'rag',
  6,
  'Which missing prerequisite stops a procedure?',
  'Procedure prerequisite status',
  [0, 1, 2].map((i) =>
    f(
      ['All prerequisites complete', 'Identity check missing', 'Approval missing'][i],
      'A fictional internal procedure requires verified identity and documented approval before preparing a payment instruction.',
      'Retrieving a procedure does not satisfy its prerequisites or authorize execution.',
      'Satisfied prerequisites',
      [2, 1, 1][i],
      'of 2',
      'identity verification and documented approval',
      network(
        [
          ['Identity checked', 90, 55],
          ['Approval recorded', 90, 230],
          ['Prepare instruction', 350, 140],
          ['Execute separately', 540, 140],
        ],
        [
          ...(i !== 1 ? [[0, 2] as [number, number]] : []),
          ...(i !== 2 ? [[1, 2] as [number, number]] : []),
          ...(i === 0 ? [[2, 3] as [number, number]] : []),
        ],
        [i === 1 ? 0 : i === 2 ? 1 : 2],
      ),
      [
        ['Identity', i === 1 ? 'Missing' : 'Complete'],
        ['Approval', i === 2 ? 'Missing' : 'Complete'],
        ['Preparation gate', i ? 'Blocked' : 'Satisfied'],
        ['Execution', 'Not performed'],
      ],
    ),
  ),
);
board(
  'rag',
  8,
  'Does every governance artifact refer to the intended model version?',
  'Version requested',
  [1, 2, 3].map((version) =>
    f(
      `Model v${version}`,
      'The repository contains all v1 artifacts; v2 has validation and approval but monitoring still refers to v1; v3 has only a model record.',
      'Evidence completeness includes version consistency across validation, approval, and monitoring.',
      'Matching artifacts',
      [4, 3, 1][version - 1],
      'of 4',
      'model, validation, approval, monitoring',
      flow(
        ['Model', 'Validation', 'Approval', 'Monitoring'],
        [
          `v${version}`,
          version < 3 ? `v${version}` : 'Missing',
          version < 3 ? `v${version}` : 'Missing',
          version === 1 ? 'v1' : version === 2 ? 'v1 mismatch' : 'Missing',
        ],
        version === 1 ? 0 : 3,
      ),
      [
        ['Requested version', version],
        ['Matching artifacts', [4, 3, 1][version - 1]],
        ['Monitoring', version === 1 ? 'v1 matches' : version === 2 ? 'v1 mismatches' : 'Missing'],
      ],
    ),
  ),
);

board(
  'optimization',
  1,
  'How does a return requirement shrink the feasible portfolios?',
  'Required expected return',
  [5, 7, 9].map((target) => {
    const returns = [4, 5, 6, 7, 8],
      risks = [3, 4, 6, 9, 13],
      feasible = returns.filter((r) => r >= target).length;
    return f(
      `${target}% target`,
      'The five supplied candidates have estimated returns of 4%, 5%, 6%, 7%, and 8%, with estimated volatilities of 3%, 4%, 6%, 9%, and 13%. The selected target is a minimum return, not a goal the chart solves for.',
      `${feasible} of 5 candidates meet the ${target}% minimum${feasible ? `: ${returns.flatMap((r, i) => r >= target ? [`${r}% estimated return with ${risks[i]}% estimated volatility`] : []).join('; ')}.` : '. No candidate meets it, so report that the requirement is infeasible.'} A lower volatility cannot make a below-target candidate eligible. These supplied estimates do not predict realized returns or recommend a portfolio.`,
      'Feasible candidate portfolios',
      feasible,
      'of 5',
      'candidate expected return at least the selected target',
      [
        ...scatter(
          returns.map((r, j) => [risks[j] * 6, r * 10, r >= target ? 1 : 0]),
          [],
          'Estimated volatility →',
          'Expected return →',
        ),
        line(55, 226 - target * 18.5, 558, 226 - target * 18.5, 'red', true),
        t(180, 291, `Required return ${target}%`, 'red', true),
      ],
      [
        ['Expected returns', '4, 5, 6, 7, 8%'],
        ['Volatilities', '3, 4, 6, 9, 13%'],
        ['Target', target],
        ['Feasible', feasible],
      ],
    );
  }),
  'A return requirement defines feasibility under uncertain estimates; a lower estimated risk cannot compensate for failing a mandatory constraint.',
);
board(
  'optimization',
  2,
  'Can available cash cover every account floor after an obligation changes?',
  'Settlement obligation',
  [20, 35, 50].map((need) =>
    f(
      `$${need}m obligation`,
      'Available cash is $60m; the operating account requires a $15m floor and settlement requires the selected amount.',
      'A larger obligation consumes the residual cash until both floors no longer fit.',
      'Unfunded minimum requirement',
      Math.max(0, 15 + need - 60),
      '$m',
      'operating floor + settlement requirement − total cash, floored at zero',
      allocation(
        ['Operating floor', 'Settlement requirement', 'Residual'],
        [15, need, Math.max(0, 60 - 15 - need)],
      ),
      [
        ['Cash available', 60],
        ['Operating floor', 15],
        ['Settlement minimum', need],
        ['Shortfall', Math.max(0, need - 45)],
      ],
    ),
  ),
);
board(
  'optimization',
  3,
  'How does a business-unit cap change the best available capital opportunity?',
  'Unit A allocation cap',
  [20, 40, 60].map((cap) =>
    f(
      `A capped at $${cap}m`,
      'Total capital is $100m. Toy opportunity benefits are A: 10% on first $40m then 3%; B: 6% throughout. Candidates respect A’s selected cap.',
      'Marginal benefit curves explain why more capital need not belong in the previously best unit.',
      'Total annual benefit',
      Math.min(cap, 40) * 0.1 + (100 - Math.min(cap, 40)) * 0.06,
      '$m',
      'A allocated min(cap,40); remainder to B under toy benefit curves',
      [
        ...trend(
          ['0', '20', '40', '60', '80', '100'],
          [0, 2, 4, 4.6, 5.2, 5.8],
          'Cumulative benefit $m: blue A, dashed B',
          [0, 1.2, 2.4, 3.6, 4.8, 6],
        ),
        line(52 + cap * 5, 35, 52 + cap * 5, 232, 'red', true),
      ],
      [
        ['A cap', cap],
        ['A allocation', Math.min(cap, 40)],
        ['B allocation', 100 - Math.min(cap, 40)],
        ['Benefit', Math.min(cap, 40) * 0.1 + (100 - Math.min(cap, 40)) * 0.06],
      ],
    ),
  ),
);
board(
  'optimization',
  4,
  'What happens when the cheap route loses capacity?',
  'Cheap-route capacity',
  [100, 60, 20].map((cap) =>
    f(
      `Route A capacity $${cap}k`,
      'A $100k payment may be split. Route A costs 1 bp and B costs 3 bp; B can carry all residual value.',
      'Route the permitted amount through A, then use the higher-cost feasible alternative.',
      'Routing cost',
      cap * 1000 * 0.0001 + (100 - cap) * 1000 * 0.0003,
      '$',
      'routed dollars × each route’s basis-point cost',
      network(
        [
          ['$100k payment', 65, 140],
          ['A · 1 bp', 300, 45],
          ['B · 3 bps', 300, 235],
          ['Recipient', 540, 140],
        ],
        [
          [0, 1, `$${cap}k`],
          [0, 2, `$${100 - cap}k`],
          [1, 3],
          [2, 3],
        ],
        [cap === 100 ? 1 : 2],
      ),
      [
        ['A capacity $k', cap],
        ['A amount $k', cap],
        ['B amount $k', 100 - cap],
        ['Cost $', cap * 0.1 + (100 - cap) * 0.3],
      ],
    ),
  ),
);
board(
  'optimization',
  7,
  'How does a short-term funding cap trade cost against rollover exposure?',
  'Cheap short-term funding cap',
  [20, 50, 80].map((cap) =>
    f(
      `Maximum ${cap}% short-term`,
      'A $100m requirement uses 3% short-term funding and 5% one-year funding; choose the cheapest permitted mix under these fixed assumptions.',
      `With an ${cap}% short-term cap, the mix is $${cap}m short-term at 3% and $${100 - cap}m for one year at 5%. Annual interest is $${(cap * 0.03 + (100 - cap) * 0.05).toFixed(1)}m under these assumptions. More short-term borrowing lowers this stated cost but leaves more money to refinance sooner.`,
      'Annual interest cost',
      cap * 0.03 + (100 - cap) * 0.05,
      '$m',
      'simple annual interest on the stated financing mix',
      [
        ...allocation(['Short-term maturity · 3%', 'One-year maturity · 5%'], [cap, 100 - cap]),
        t(20, 262, `Early rollover exposure $${cap}m`, 'amber', true),
      ],
      [
        ['Short-term cap', cap + '%'],
        ['Short-term $m', cap],
        ['One-year $m', 100 - cap],
        ['Annual cost', cap * 0.03 + (100 - cap) * 0.05],
      ],
    ),
  ),
);
board(
  'optimization',
  8,
  'Which reviews miss their deadline when an analyst is unavailable?',
  'Analyst availability',
  [0, 1, 2].map((i) =>
    f(
      ['Both analysts available', 'Specialist absent', 'General analyst absent'][i],
      'Two specialist and two general cases are due today. Each analyst has two slots; only the specialist can handle specialist cases.',
      [
        'Both analysts have two slots, so all four cases can be assigned before today’s deadline: two specialist cases to the specialist and two general cases to the general analyst.',
        'Without the specialist, the general analyst can take the two general cases but cannot take the two specialist cases. Two cases remain unassigned even though the general analyst has two slots: the required skill is missing.',
        'Without the general analyst, the specialist can take the two specialist cases, but the two general cases remain unassigned. A person’s available time only helps when they are allowed and qualified to handle that kind of case.',
      ][i],
      'Cases unassigned before deadline',
      [0, 2, 2][i],
      'of 4',
      'four cases due today; two slots per available analyst',
      matrix(
        ['General analyst', 'Specialist'],
        ['09:00', '11:00'],
        i === 0
          ? [
              [1, 1],
              [2, 2],
            ]
          : i === 1
            ? [
                [1, 1],
                [0, 0],
              ]
            : [
                [0, 0],
                [2, 2],
              ],
        'Assignment: 1 general case; 2 specialist; 0 unavailable',
      ),
      [
        ['General available', i !== 2 ? 'Yes' : 'No'],
        ['Specialist available', i !== 1 ? 'Yes' : 'No'],
        ['Unassigned', [0, 2, 2][i]],
      ],
    ),
  ),
);

board(
  'reinforcement-learning',
  1,
  'How does buying now versus waiting change inventory and cost?',
  'Execution policy',
  [0, 1, 2].map((i) => {
    const fills = [
        [5, 5],
        [0, 10],
        [10, 0],
      ][i],
      prices = [50, 50.3],
      slippage = fills[1] * 0.3,
      impact = fills.reduce((s, q) => s + 0.02 * q * q, 0);
    return f(
      ['Buy half, then half', 'Wait, then buy all', 'Buy all now'][i],
      'Target is ten shares; arrival price $50, second-period price $50.30, and toy impact cost is $0.02 × quantity² per trade. All schedules finish.',
      [
        'The two 5-share trades cost $1 in impact in total ($0.02 × 5² twice) and the second trade pays $1.50 more than the $50 arrival price. Total: $2.50. Splitting reduces impact relative to one large trade but leaves some shares exposed to the later price.',
        'Waiting buys all 10 shares at $50.30, so price movement adds $3.00 ($0.30 × 10); impact adds $2.00 ($0.02 × 10²). Total: $5.00. The same ten shares are filled, but the later price raises cost.',
        'Buying all 10 shares at the $50 arrival price avoids later-price slippage, but the single trade has $2.00 impact ($0.02 × 10²). All three schedules finish; under this toy formula, this one costs $2.00.',
      ][i],
      'Total execution cost',
      slippage + impact,
      '$',
      'arrival-price slippage + stated quadratic impact; same price path',
      [
        ...trend(['Start', 'After T1', 'After T2'], [10, 10 - fills[0], 0], 'Shares remaining'),
        ...fills.map((q, j) =>
          t(140 + j * 250, 35, `Buy ${q} at $${prices[j].toFixed(2)}`, 'amber', true),
        ),
      ],
      [
        ['Fills', fills.join(', ')],
        ['Slippage', slippage],
        ['Impact', impact],
        ['Total', slippage + impact],
      ],
    );
  }),
);
board(
  'reinforcement-learning',
  2,
  'Can a fixed liquidity policy survive a missed inflow?',
  'Next-period inflow shock',
  [20, 10, 0].map((inflow) =>
    f(
      `Inflow $${inflow}m`,
      'A fixed policy starts with $20m cash, borrows $10m now, then receives the selected inflow and pays $40m.',
      `The balance is $20m cash + $10m borrowing + $${inflow}m inflow − $40m payment = $${20 + 10 + inflow - 40}m. A negative balance means the plan is short by $${Math.max(0, 40 - (20 + 10 + inflow))}m; this fixed action does not adapt to the inflow shock.`,
      'Next cash balance',
      20 + 10 + inflow - 40,
      '$m',
      'cash + borrowing + inflow − payment',
      network(
        [
          ['Cash $20m', 60, 135],
          ['Borrow $10m', 240, 135],
          ['Inflow shock', 410, 45],
          ['Pay $40m', 410, 225],
          ['Next cash', 550, 135],
        ],
        [
          [0, 1],
          [1, 2, `+${inflow}`],
          [2, 4],
          [1, 3],
          [3, 4, '−40'],
        ],
        [2],
      ),
      [
        ['Borrowed', 10],
        ['Inflow', inflow],
        ['Payment', 40],
        ['Next balance', inflow - 10],
      ],
    ),
  ),
);
board(
  'reinforcement-learning',
  3,
  'How do contact and wait actions consume a contact allowance?',
  'Two-step collections policy',
  [0, 1, 2].map((i) =>
    f(
      ['Contact → wait', 'Wait → contact', 'Contact → contact'][i],
      'The example policy permits at most one contact in the next two steps; no repayment benefit is assumed.',
      [
        'Contact then wait uses one permitted contact and makes no second attempt, so zero attempts are blocked.',
        'Wait then contact also uses one permitted contact; the order changes, but the allowance is still respected and zero attempts are blocked.',
        'The first contact uses the one-contact allowance. The second attempt is blocked, so the schedule records one blocked attempt. A policy must track earlier actions to enforce a limit across steps.',
      ][i],
      'Blocked contact attempts',
      [0, 0, 1][i],
      'attempts',
      'one-contact allowance over two planned actions',
      flow(
        ['Initial state', 'Step 1', 'Step 2', 'End'],
        [
          '1 contact left',
          ['Contact', 'Wait', 'Contact'][i],
          ['Wait', 'Contact', 'Contact blocked'][i],
          '0 contacts left',
        ],
        i === 2 ? 2 : 1,
      ),
      [
        ['Policy', ['C → W', 'W → C', 'C → C'][i]],
        ['Completed contacts', 1],
        ['Blocked', [0, 0, 1][i]],
        ['Payment effect', 'Not estimated'],
      ],
    ),
  ),
);
board(
  'reinforcement-learning',
  4,
  'How does waiting for engagement change the timing decision?',
  'Two-step offer policy',
  [0, 1, 2].map((i) =>
    f(
      ['Offer now', 'Wait, then offer', 'Offer twice'][i],
      'Toy engagement states have supplied response probabilities 5% now and 15% later. Response value is $10; each offer costs $1. No causal uplift is claimed.',
      [
        'The supplied immediate response chance is 5%. At $10 per response minus a $1 offer cost, expected net reward is 0.05 × $10 − $1 = −$0.50.',
        'The supplied later response chance is 15%. Expected net reward is 0.15 × $10 − $1 = $0.50, higher than offering now under these toy assumptions. This does not prove that waiting causes more engagement.',
        'Two offers give expected response value of ($0.05 + $0.15) × $10 = $2, then cost $2 in total, for $0 net reward. A real policy must also obey contact limits and test whether timing changes outcomes.',
      ][i],
      'Toy expected net reward',
      [-0.5, 0.5, 0][i],
      '$',
      'sum of response probability × $10 less $1 per offer',
      network(
        [
          ['Low engagement', 70, 140],
          ['Offer now', 285, 45],
          ['Wait', 285, 230],
          ['Engaged later', 505, 230],
          ['End', 505, 45],
        ],
        i === 0
          ? [
              [0, 1],
              [1, 4],
            ]
          : i === 1
            ? [
                [0, 2],
                [2, 3],
                [3, 4],
              ]
            : [
                [0, 1],
                [1, 3],
                [3, 4],
              ],
      ),
      [
        ['Policy', ['Now only', 'Later only', 'Both steps'][i]],
        ['Offers', [1, 1, 2][i]],
        ['Toy expected reward', [-0.5, 0.5, 0][i]],
        ['Incremental uplift', 'Not established'],
      ],
    ),
  ),
);
board(
  'reinforcement-learning',
  5,
  'How does the first intervention affect the next action?',
  'Two-action fraud policy',
  [0, 1, 2].map((i) =>
    f(
      ['Pass → monitor', 'Challenge → pass if verified', 'Challenge → review if unresolved'][i],
      'Toy direct handling costs: pass/monitor $0, challenge $1, manual review $5. Future fraud losses and friction remain additional evaluation terms.',
      [
        'Pass then monitor costs $0 + $0 = $0. The payment is allowed, but future fraud loss is not included, so zero handling cost does not mean zero risk.',
        'Challenge costs $1; after identity is verified, passing costs $0, for $1 total. The later action depends on what the challenge reveals.',
        'Challenge costs $1 and manual review costs $5, for $6 total. This is the supplied handling cost only; fraud loss and customer friction would also matter in a real comparison.',
      ][i],
      'Direct handling cost',
      [0, 1, 6][i],
      '$',
      'sum of the selected two-step handling costs',
      flow(
        ['Current payment', 'Action 1', 'Observed state', 'Action 2'],
        [
          'Unverified',
          ['Pass', 'Challenge', 'Challenge'][i],
          ['Payment completed', 'Identity verified', 'Unresolved'][i],
          ['Monitor', 'Pass', 'Manual review'][i],
        ],
        2,
      ),
      [
        ['Sequence', ['Pass / monitor', 'Challenge / pass', 'Challenge / review'][i]],
        ['Handling cost', [0, 1, 6][i]],
        ['Future loss', 'Not supplied'],
      ],
    ),
  ),
);
board(
  'reinforcement-learning',
  6,
  'How does a simulated credit-limit change alter utilization without changing balance?',
  'Proposed limit adjustment',
  [-10, 0, 20].map((change) => {
    const proposed = 40 + change,
      allowed = proposed <= 50;
    return f(
      `${change >= 0 ? '+' : ''}$${change}k`,
      'Balance remains $30k. Current limit is $40k; the hard cap is $50k. A proposal above the cap is blocked.',
      `The balance stays $30k. Dividing by the proposed $${proposed}k limit gives ${(30 / proposed) * 100}% proposed utilization. ${allowed ? `The $${proposed}k limit is within the $50k cap.` : `The $${proposed}k request exceeds the $50k cap, so it is blocked and the applied limit remains $40k.`} A changed ratio does not show that the customer will repay differently.`,
      'Proposed utilization',
      (30 / proposed) * 100,
      '%',
      '$30k balance / proposed limit; proposal may be blocked',
      [
        ...trend(
          ['Current', 'Proposed', 'Applied'],
          [40, proposed, allowed ? proposed : 40],
          'Credit limit $k',
          undefined,
          50,
        ),
        t(
          60,
          278,
          `Balance stays $30k · ${allowed ? 'proposal allowed' : 'proposal blocked'}`,
          'amber',
          true,
        ),
      ],
      [
        ['Balance', 30],
        ['Current limit', 40],
        ['Proposed limit', proposed],
        ['Proposed utilization', (30 / proposed) * 100],
        ['Applied limit', allowed ? proposed : 40],
      ],
    );
  }),
);
board(
  'reinforcement-learning',
  7,
  'How does quote balance affect simulated fills and inventory?',
  'Bid / ask emphasis',
  [0, 1, 2].map((i) =>
    f(
      ['Balanced quotes', 'More aggressive bid', 'More aggressive ask'][i],
      'Starting inventory is two units; supplied fills are both sides, buy only, or sell only. These deterministic scenarios do not place orders.',
      [
        'One buy and one sell fill, so inventory stays at 2 + 1 − 1 = 2 units. This supplied scenario illustrates a balanced outcome; it does not place real orders.',
        'Only the buy fills, so inventory rises from 2 to 3 units (2 + 1 − 0). More inventory creates greater exposure to later price changes.',
        'Only the sell fills, so inventory falls from 2 to 1 unit (2 + 0 − 1). The quote setting changes the supplied fills and therefore the inventory exposure.',
      ][i],
      'Next inventory',
      [2, 3, 1][i],
      'units',
      'two initial units + buys − sells',
      network(
        [
          ['Buy market order', 65, 60],
          ['Bid quote', 270, 60],
          ['Inventory', 300, 170],
          ['Ask quote', 480, 235],
          ['Sell market order', 65, 235],
        ],
        [
          ...(i !== 2 ? [[1, 2, 'buy +1'] as [number, number, string]] : []),
          ...(i !== 1 ? [[2, 3, 'sell −1'] as [number, number, string]] : []),
          [0, 3],
          [4, 1],
        ],
        [i === 1 ? 1 : i === 2 ? 3 : 2],
      ),
      [
        ['Buy fills', i === 2 ? 0 : 1],
        ['Sell fills', i === 1 ? 0 : 1],
        ['Starting inventory', 2],
        ['Next inventory', [2, 3, 1][i]],
      ],
    ),
  ),
);
board(
  'reinforcement-learning',
  8,
  'Does a transfer policy outperform a fixed rule on the same cash path?',
  'Cash-management policy',
  [0, 1, 2].map((i) => {
    const transfers = [
        [10, 10],
        [20, 0],
        [0, 20],
      ][i],
      balances = [10, 10 + transfers[0] - 15, 10 + transfers[0] - 15 + 5 + transfers[1] - 10];
    return f(
      ['Fixed $10 each step', 'Transfer $20 now', 'Hold, then transfer $20'][i],
      'Operating cash starts at $10k; step 1 pays $15k; step 2 receives $5k and pays $10k. Each nonzero transfer costs $1.',
      [
        'Balances are $10k at opening, $5k after the first $15k payment, and $10k after the $5k inflow and second $10k payment. Two nonzero transfers cost $2 total; the lowest balance is $5k.',
        'Moving $20k before the first payment leaves $15k after that payment and $10k after the second. One transfer costs $1, and the lowest balance is $10k.',
        'Waiting leaves only $10k for the first $15k payment, a $5k shortfall. The later $5k inflow and $20k transfer bring the ending balance to $10k, but cannot undo the earlier shortage; the minimum is −$5k.',
      ][i],
      'Minimum operating balance',
      Math.min(...balances),
      '$k',
      'minimum of opening and two end-of-step balances',
      trend(['Opening', 'Step 1', 'Step 2'], balances, 'Operating cash $k', [10, 5, 10], 0),
      [
        ['Transfers', transfers.join(', ')],
        ['Cash balances', balances.join(', ')],
        ['Transfer fees', transfers.filter((x) => x > 0).length],
        ['Minimum cash', Math.min(...balances)],
      ],
    );
  }),
);

board(
  'monte-carlo',
  3,
  'How do underlying-price paths become discounted option payoffs?',
  'Call strike',
  [90, 100, 110].map((strike) => {
    const ends = [80, 100, 120],
      payoffs = ends.map((x) => Math.max(0, x - strike)),
      discount = 0.95;
    return f(
      `Strike $${strike}`,
      'Three equally weighted toy risk-neutral terminal-price paths; supplied discount factor is 0.95. This is not a market valuation.',
      `A call pays max(ending price − $${strike} strike, 0) on each path. Prices $80, $100, and $120 give payoffs ${payoffs.join(', ')}; their average is $${(payoffs.reduce((a, b) => a + b, 0) / 3).toFixed(2)}. Multiplying by the supplied 0.95 discount factor gives $${((payoffs.reduce((a, b) => a + b, 0) / 3) * discount).toFixed(2)} today. This is a teaching calculation, not a market valuation.`,
      'Discounted mean payoff',
      (payoffs.reduce((a, b) => a + b, 0) / 3) * discount,
      '$',
      '0.95 × mean(max(terminal price − strike, 0))',
      [
        ...trend(
          ['Today', 'Midpoint', 'Expiry'],
          [100, 90, 80],
          'Underlying price $',
          [100, 110, 120],
          strike,
        ),
        t(55, 279, `Payoffs ${payoffs.join(' / ')} · discount factor 0.95`, 'amber', true),
      ],
      [
        ['Terminal prices', '80, 100, 120'],
        ['Payoffs', payoffs.join(', ')],
        ['Discount factor', discount],
        ['Discounted mean', (payoffs.reduce((a, b) => a + b, 0) / 3) * discount],
      ],
    );
  }),
);
board(
  'monte-carlo',
  4,
  'How does asset-liability dependence change funding deficits?',
  'Scenario pairing',
  [0, 1, 2].map((i) => {
    const assets = [80, 100, 120],
      liabilities = [
        [75, 95, 115],
        [95, 115, 75],
        [115, 95, 75],
      ][i],
      gaps = assets.map((a, j) => a - liabilities[j]);
    return f(
      ['Move together', 'Mixed pairing', 'Move in opposite order'][i],
      'Asset outcomes and liability outcomes are unchanged; only their pairing into joint scenarios changes.',
      `The same asset values ($${assets.join(', ')}m) and liability values ($${liabilities.join(', ')}m) are paired differently. The gaps are $${gaps.join(', ')}m, so ${gaps.filter((v) => v < 0).length} of 3 scenarios have assets below liabilities (${((gaps.filter((v) => v < 0).length / 3) * 100).toFixed(1)}%). Only the pairing changes; neither list’s average changes. Three scenarios illustrate the effect but do not estimate real-world frequency.`,
      'Funding-deficit frequency',
      (gaps.filter((v) => v < 0).length / 3) * 100,
      '%',
      'asset-minus-liability gap below zero / three scenarios',
      trend(
        ['Scenario 1', 'Scenario 2', 'Scenario 3'],
        assets,
        '$m: blue assets, dashed liabilities',
        liabilities,
      ),
      [
        ['Assets', assets.join(', ')],
        ['Liabilities', liabilities.join(', ')],
        ['Funding gaps', gaps.join(', ')],
        ['Mean asset/liability', '$100m / $95m'],
      ],
    );
  }),
);
board(
  'monte-carlo',
  5,
  'How does a withdrawal shock push cash below its minimum?',
  'Extra withdrawal shock',
  [0, 20, 40].map((shock) => {
    const cash = [100, 80, 70 - shock, 85 - shock];
    return f(
      `Extra $${shock}m withdrawal`,
      'One supplied stress path starts at $100m; scheduled net flows are −20, −10, +15. The minimum required balance is $50m.',
      `The balances are $100m at opening, $80m after day 1, $${70 - shock}m after day 2, and $${85 - shock}m after day 3. The lowest is $${70 - shock}m, so compared with the $50m minimum the cushion is ${20 - shock < 0 ? `−$${shock - 20}m` : `$${20 - shock}m`}. A negative cushion means the path falls below the required minimum even if cash later recovers.`,
      'Minimum cash cushion',
      Math.min(...cash) - 50,
      '$m',
      'lowest path balance minus required $50m',
      trend(['Open', 'Day 1', 'Day 2', 'Day 3'], cash, 'Cash $m', undefined, 50),
      [
        ['Shock', shock],
        ['Cash path', cash.join(', ')],
        ['Minimum', Math.min(...cash)],
        ['Required minimum', 50],
      ],
    );
  }),
);
board(
  'monte-carlo',
  7,
  'How does a withdrawal policy change the same wealth scenarios?',
  'Annual withdrawal',
  [0, 10, 20].map((withdrawal) => {
    const wealth = [80, 100, 130].map((x) => x - 3 * withdrawal);
    return f(
      `$${withdrawal}k annually`,
      'Three toy three-year pre-withdrawal terminal outcomes are $80k/$100k/$130k, each including $5k annual contributions. Withdrawals are subtracted without return interactions to isolate cash-flow arithmetic.',
      `Subtract three years of $${withdrawal}k withdrawals (${withdrawal * 3}k total) from each supplied ending value: $${wealth.join(', ')}k. ${wealth.filter((x) => x < 50).length} of 3 outcomes finish below the $50k target (${((wealth.filter((x) => x < 50).length / 3) * 100).toFixed(1)}%). This isolates arithmetic; real withdrawals can also change later investment returns.`,
      'Below-$50k terminal frequency',
      (wealth.filter((x) => x < 50).length / 3) * 100,
      '%',
      'post-withdrawal terminal wealth below $50k / three scenarios',
      [
        ...trend(
          ['Start', 'Year 1', 'Year 2', 'Year 3'],
          [50, 60 - withdrawal, 70 - 2 * withdrawal, 80 - 3 * withdrawal],
          'Wealth $k',
          [50, 75 - withdrawal, 100 - 2 * withdrawal, 130 - 3 * withdrawal],
          50,
        ),
        t(55, 283, `Three annual withdrawals total $${withdrawal * 3}k`, 'amber', true),
      ],
      [
        ['Annual withdrawal', withdrawal],
        ['Total withdrawals', withdrawal * 3],
        ['Annual contributions', 5],
        ['Terminal outcomes', wealth.join(', ')],
        ['Target', 50],
      ],
    );
  }),
);

function scalingScene(state: number): CaseMark[] {
  const spend = [100, 110, 300, 310],
    savings = [10, 80, 20, 90];
  const xs = spend.map((value) => 65 + (state ? (value / 1000) * 200 : value * 0.5));
  const ys = savings.map((value) => 250 - (state ? (value / 100) * 200 : value * 0.5));
  const pairs = state
    ? [
        [0, 2],
        [1, 3],
      ]
    : [
        [0, 1],
        [2, 3],
      ];
  return [
    line(65, 35, 65, 250),
    line(65, 250, 280, 250),
    t(75, 280, state ? 'Spending / 1,000' : 'Spending ($)', 'muted', true),
    t(12, 20, state ? 'Savings / 100' : 'Savings (percentage points)', 'muted', true),
    ...pairs.map(([a, b]) => line(xs[a], ys[a], xs[b], ys[b], 'green')),
    ...xs.flatMap((x, j) => [
      dot(x, ys[j], 6, state === 2 && (j === 0 || j === 2) ? 'amber' : 'blue'),
      t(x + 9, ys[j] - 6, ['A', 'B', 'C', 'D'][j], 'ink', true),
    ]),
    t(330, 90, 'Nearest-neighbor pairs', 'ink', true),
    t(330, 128, state ? 'A–C and B–D' : 'A–B and C–D', 'blue'),
    t(330, 190, 'Equal numeric axis scales', 'muted', true),
    t(330, 220, 'Different feature definitions', 'muted', true),
  ];
}

board(
  'k-means',
  1,
  'Can changing feature units change which customers look alike?',
  'Choose whether raw spending and savings numbers or scaled values determine which customers look closest',
  [0, 1, 2].map((i) =>
    f(
      ['Raw features', 'Scale the two features', 'Inspect the scaled pairing'][i],
      'The four customers differ in spending ($100, $110, $300, $310) and savings rate (10%, 80%, 20%, 90%). A distance calculation can be dominated by whichever input has the larger numbers. The scaled view divides spending by 1,000 and savings percentage points by 100. The drawn lines show nearest neighbors only; they are not the output of a fitted K-means model.',
      'With the raw values, the nearest pairs are A–B and C–D. After scaling, the pairs are A–C and B–D, so all four nearest neighbors change. Scaling changes how much each measurement can influence distance; these chosen divisors are a teaching example, not a universal rule.',
      'Customers whose nearest neighbor changes',
      i ? 4 : 0,
      'of 4',
      'compare each customer’s nearest neighbor with the raw-feature reference',
      scalingScene(i),
      [
        ['Raw nearest-neighbor pairs', 'A–B; C–D'],
        ['Scaled pairs', 'A–C; B–D'],
        ['Display geometry', 'Equal numeric axis scales within each view'],
        ['Changed neighbor count', i ? 4 : 0],
      ],
    ),
  ),
);
board(
  'isolation-forest',
  3,
  'How many account-access details differ from this account’s usual pattern?',
  'Reveal whether device, location, or time is unusual',
  [0, 1, 2].map((i) =>
    f(
      ['Known device and place', 'New device, usual place', 'New device, new place, night-time'][i],
      'Compare each sign-in with the account’s own history: device, region, and time of day. The count adds the changed details out of three. No account-takeover outcome is supplied.',
      [`${[0, 1, 3][i]} of three details differ from the account’s usual pattern. A new device, place, or hour can be legitimate; the count is a reason to check authentication and account context, not proof someone took over the account.`, `${[0, 1, 3][i]} of three details differ from the account’s usual pattern. A new device, place, or hour can be legitimate; the count is a reason to check authentication and account context, not proof someone took over the account.`, `${[0, 1, 3][i]} of three details differ from the account’s usual pattern. A new device, place, or hour can be legitimate; the count is a reason to check authentication and account context, not proof someone took over the account.`][i],
      'Changed contextual signals',
      [0, 1, 3][i],
      'of 3',
      'device, region, and access-time indicators compared with account history',
      network(
        [
          ['Account', 300, 140],
          ['Device', 95, 40],
          ['Region', 95, 240],
          ['Access time', 515, 140],
        ],
        [
          [0, 1, i ? 'new' : 'usual'],
          [0, 2, i === 2 ? 'new' : 'usual'],
          [0, 3, i === 2 ? '02:00' : 'daytime'],
        ],
        i === 2 ? [1, 2, 3] : i === 1 ? [1] : [],
      ),
      [
        ['New device', i ? 'Yes' : 'No'],
        ['New region', i === 2 ? 'Yes' : 'No'],
        ['Outside usual hours', i === 2 ? 'Yes' : 'No'],
        ['Compromise confirmed', 'No'],
      ],
    ),
  ),
);
board(
  'rag',
  1,
  'What becomes unsupported when one reporting period is missing?',
  'Required period removed',
  [0, 1, 2].map((i) =>
    f(
      ['Both years available', 'Remove 2024 evidence', 'Remove 2025 evidence'][i],
      'Matching-period revenue is $100m in 2024 and $120m in 2025. Both amounts and units are required for the growth calculation.',
      i
        ? 'Do not calculate growth from one period. Report the missing evidence and request it.'
        : 'The two source periods support (120 − 100) / 100 = 20% revenue growth.',
      'Relevant-chunk recall',
      i ? 50 : 100,
      '%',
      'required revenue passages retrieved / two relevant passages',
      flow(
        ['2024 filing', '2025 filing', 'Cited answer'],
        [
          i === 1 ? 'Missing' : '$100m',
          i === 2 ? 'Missing' : '$120m',
          i ? 'Insufficient evidence' : '20% growth',
        ],
        i === 1 ? 0 : i === 2 ? 1 : 2,
      ),
      [
        ['2024 evidence', i === 1 ? 'Missing' : '$100m'],
        ['2025 evidence', i === 2 ? 'Missing' : '$120m'],
        ['Relevant retrieved', i ? 1 : 2],
        ['Growth answer', i ? 'Abstain' : '20%'],
      ],
    ),
  ),
);
board(
  'rag',
  3,
  'Does the source procedure apply to the requested product variant?',
  'Customer product',
  [0, 1, 2].map((i) =>
    f(
      ['Debit card', 'Credit card', 'Unsupported prepaid card'][i],
      'The local corpus has debit and credit replacement procedures. No prepaid-card procedure is supplied.',
      'Retrieve product-specific evidence; a similar card procedure is not enough when the product is unsupported.',
      'Applicable procedure found',
      i === 2 ? 0 : 1,
      'of 1',
      'one requested product-specific procedure',
      network(
        [
          ['Customer question', 70, 140],
          ['Debit procedure', 340, 45],
          ['Credit procedure', 340, 140],
          ['Human escalation', 340, 235],
        ],
        [[0, i + 1]],
        [i + 1],
      ),
      [
        ['Requested product', ['Debit', 'Credit', 'Prepaid'][i]],
        ['Applicable source', ['Debit procedure', 'Credit procedure', 'None'][i]],
        ['Answer route', i === 2 ? 'Escalate' : 'Use matching procedure'],
      ],
    ),
  ),
);
board(
  'rag',
  4,
  'Which due-diligence conclusion becomes incomplete when a document is removed?',
  'Document removed',
  [0, 1, 2].map((i) =>
    f(
      ['All documents available', 'Remove debt schedule', 'Remove ownership record'][i],
      'The fictional checklist requires audited accounts, ownership evidence, and a debt schedule. Every conclusion must retain its supporting document.',
      'Related evidence does not replace the missing checklist item. Make the gap explicit before calling the review complete.',
      'Evidence checklist coverage',
      i ? 200 / 3 : 100,
      '%',
      'supported categories / three required categories',
      tiles(
        ['Audited accounts', 'Ownership', 'Debt schedule'],
        [1, i === 2 ? 0 : 1, i === 1 ? 0 : 1],
        i === 1 ? 2 : i === 2 ? 1 : 0,
      ),
      [
        ['Audited accounts', 'Available'],
        ['Ownership', i === 2 ? 'Missing' : 'Available'],
        ['Debt schedule', i === 1 ? 'Missing' : 'Available'],
        ['Supported categories', i ? 2 : 3],
      ],
    ),
  ),
);

export function applyCaseStoryboards(cases: FinancialCase[]): FinancialCase[] {
  return cases.map((item) => {
    const change = boards[`${item.algorithmSlug}/${item.sourceRef.application}`];
    const result = change
      ? {
          ...item,
          question: change.question,
          controlLabel: change.controlLabel,
          frames: change.frames as FinancialCase['frames'],
          takeaway: change.takeaway ?? item.takeaway,
          prediction: `Before selecting “${change.frames[2].label}”, predict how ${change.frames[0].metric.label.toLowerCase()} will change.`,
        }
      : item;
    // A common numeric scale keeps the consequence visible even when a process diagram's
    // topology correctly stays fixed (for example, a changed amount through the same routes).
    const values = result.frames.map((entry) => entry.metric.value);
    const low = Math.min(0, ...values),
      high = Math.max(1, ...values);
    const at = (value: number) => 70 + ((value - low) / (high - low)) * 470;
    const directed = new Set([
      'graph-methods/1',
      'graph-methods/3',
      'graph-methods/7',
      'k-means/7',
      'time-series/4',
      'optimization/4',
      'rag/6',
      'reinforcement-learning/7',
    ]);
    result.frames = result.frames.map((entry) => ({
      ...entry,
      marks: [
        ...entry.marks.map((mark) =>
          directed.has(`${item.algorithmSlug}/${item.sourceRef.application}`) &&
          mark.kind === 'line'
            ? { ...mark, arrow: true }
            : mark,
        ),
        line(70, 320, 540, 320),
        rect(
          Math.min(at(0), at(entry.metric.value)),
          308,
          Math.max(2, Math.abs(at(entry.metric.value) - at(0))),
          22,
          entry.metric.value < 0 ? 'red' : 'green',
        ),
        line(at(0), 302, at(0), 335, 'ink'),
        t(
          70,
          350,
          `${entry.metric.label}: ${Number(entry.metric.value.toFixed(2))} ${entry.metric.unit}`,
          'ink',
          true,
        ),
      ],
    })) as FinancialCase['frames'];
    return result;
  });
}
