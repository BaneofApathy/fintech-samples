export type Recommendation = { number: number; reason: string };

/** A short, task-specific starting point; the complete measure catalog remains available. */
export function recommendMeasures(
  question: string,
  rarity: string,
  cost: string,
): Recommendation[] {
  const expectedCost = {
    number: 17,
    reason:
      'Compare the cost of missed events and unnecessary interventions using the same explicit cost assumptions.',
  };
  const capacity = {
    number: 12,
    reason: 'Check how many relevant cases your team catches within its actual review capacity.',
  };
  const recall = {
    number: 5,
    reason: 'Measure the share of actual fraud or default events that the policy detects.',
  };
  const precision = {
    number: 4,
    reason: 'Check how many alerts are useful, rather than unnecessary customer interruptions.',
  };
  if (question === 'rare') {
    if (cost === 'both') return [expectedCost, capacity, recall];
    if (cost === 'review') return [capacity, precision, expectedCost];
    return [
      recall,
      expectedCost,
      rarity === 'balanced'
        ? {
            number: 3,
            reason:
              'Check performance in each class without letting the larger class dominate the average.',
          }
        : capacity,
    ];
  }
  if (question === 'rank')
    return [
      rarity === 'rare'
        ? {
            number: 11,
            reason:
              'Examine the tradeoff between catching rare events and the quality of the alert queue.',
          }
        : {
            number: 9,
            reason:
              'Compare how well scores put positive cases above negative cases across thresholds.',
          },
      capacity,
      expectedCost,
    ];
  if (question === 'probability')
    return [
      {
        number: 14,
        reason:
          'Compare predicted probabilities with observed event rates before using the scores as risk estimates.',
      },
      {
        number: 15,
        reason: 'Summarize probability error and compare it with a constant-probability baseline.',
      },
      expectedCost,
    ];
  if (question === 'forecast')
    return [
      { number: 20, reason: 'Express typical forecast error in the original financial units.' },
      {
        number: 24,
        reason: 'Check both how often intervals contain the outcome and how wide they must be.',
      },
      {
        number: 21,
        reason:
          'Check whether a few large errors create greater operational risk than the typical error suggests.',
      },
    ];
  if (question === 'retrieve')
    return [
      {
        number: 28,
        reason:
          'Check whether the required evidence is retrieved and how much irrelevant material enters the context.',
      },
      {
        number: 30,
        reason:
          'Verify that the answer is supported by its citations and that its arithmetic is correct.',
      },
      { number: 29, reason: 'Check how early useful evidence appears in the ranked results.' },
    ];
  if (question === 'act')
    return [
      expectedCost,
      {
        number: 19,
        reason:
          'For a decision policy affecting people, inspect group error rates as well as overall performance.',
      },
      {
        number: 33,
        reason:
          'When evaluating financial losses, examine the tail as well as the average outcome.',
      },
    ];
  return [
    {
      number: 39,
      reason:
        'Check whether latency, throughput, review capacity, and cost fit the operating constraints.',
    },
    {
      number: 37,
      reason: 'Check successful completion, verification, and unsafe actions together.',
    },
    {
      number: 38,
      reason:
        'Monitor changes in the input distribution; investigate rather than treating drift as proof of failure.',
    },
  ];
}
