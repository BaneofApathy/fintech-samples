export interface LearningGuide {
  question: string;
  minutes: number;
  prerequisites: string[];
  outcomes: string[];
}

export const learningFamilies = [
  {
    title: 'Predict an outcome',
    description: 'Estimate risk before choosing who or what to review.',
  },
  { title: 'Discover structure', description: 'Find useful groups and unusual observations.' },
  {
    title: 'Model time and relations',
    description: 'Understand future outflows and shared connections.',
  },
  {
    title: 'Understand language',
    description: 'Classify financial text and find supporting evidence.',
  },
  { title: 'Choose an action', description: 'Allocate resources and compare uncertain outcomes.' },
];

export const learningPath: Record<string, LearningGuide> = {
  'logistic-regression': {
    question: 'How does a review threshold affect a loan decision?',
    minutes: 45,
    prerequisites: ['Percentages and probability', 'Features and labels'],
    outcomes: [
      'Convert a weighted score into default probability.',
      'Explain why a threshold changes the action, not the risk.',
      'Compare review policies using expected loss.',
    ],
  },
  'trees-and-forests': {
    question: 'Which transactions should enter the review queue?',
    minutes: 45,
    prerequisites: ['Class proportions', 'Probability versus action'],
    outcomes: [
      'Choose a split using weighted impurity.',
      'Combine tree scores into a forest score.',
      'Evaluate fraud capture and customer interruptions together.',
    ],
  },
  'gradient-boosting': {
    question: 'Can a sequence of small corrections improve credit-risk ranking?',
    minutes: 45,
    prerequisites: ['Logistic regression', 'Decision trees'],
    outcomes: [
      'Trace sequential corrections to a score.',
      'Explain how the learning rate changes a prediction.',
      'Compare a boosted model with a simple baseline.',
    ],
  },
  'k-means': {
    question: 'Do customers form useful groups from their observed behavior?',
    minutes: 40,
    prerequisites: ['Means and distances', 'Feature scales'],
    outcomes: [
      'Assign observations to the nearest center.',
      'Update cluster centers and interpret the groups.',
      'Check whether a grouping is stable and useful.',
    ],
  },
  'isolation-forest': {
    question: 'Which unusual payments deserve limited investigation time?',
    minutes: 40,
    prerequisites: ['Ranking', 'Averages'],
    outcomes: [
      'Relate short isolation paths to anomaly scores.',
      'Choose an investigation queue within capacity.',
      'Distinguish unusual behavior from evidence of fraud.',
    ],
  },
  'time-series': {
    question: 'How much liquidity should cover the next settlement outflow?',
    minutes: 50,
    prerequisites: ['Averages and prediction errors', 'Training versus evaluation'],
    outcomes: [
      'Evaluate forecasts in chronological order.',
      'Compare errors against a naive baseline.',
      'Interpret interval coverage and width together.',
    ],
  },
  'graph-methods': {
    question: 'What can shared accounts, devices, and merchants tell us?',
    minutes: 40,
    prerequisites: ['Sets and relationships', 'Decision-time data'],
    outcomes: [
      'Trace a path and identify connected components.',
      'Compare network signals for investigation.',
      'Explain why a shared connection does not prove fraud.',
    ],
  },
  transformers: {
    question: 'When should financial sentiment go to human review?',
    minutes: 50,
    prerequisites: ['Weighted averages', 'Class probabilities'],
    outcomes: [
      'Trace a small attention calculation.',
      'Interpret class probabilities and uncertainty.',
      'Compare a text baseline with a financial language model.',
    ],
  },
  rag: {
    question: 'Which filing passages support a trustworthy financial answer?',
    minutes: 55,
    prerequisites: ['Vectors and similarity', 'Ratios and percentage change'],
    outcomes: [
      'Rank passages by similarity and relevance.',
      'Calculate an answer from retrieved evidence.',
      'Check that each claim is supported by its citation.',
    ],
  },
  optimization: {
    question: 'Which portfolio meets the return requirement with acceptable risk?',
    minutes: 50,
    prerequisites: ['Weighted averages', 'Variance and correlation'],
    outcomes: [
      'Check an allocation against its constraints.',
      'Compare risk only among feasible choices.',
      'Explain the chosen allocation and its assumptions.',
    ],
  },
  'reinforcement-learning': {
    question: 'How should an execution policy balance cost and completion?',
    minutes: 55,
    prerequisites: ['Weighted updates', 'Rewards and sequential decisions'],
    outcomes: [
      'Calculate a Q-learning update.',
      'Measure execution shortfall and completion.',
      'Defend a policy using cost, constraints, and tail risk.',
    ],
  },
  'monte-carlo': {
    question: 'How often might portfolio losses exceed the reserve?',
    minutes: 45,
    prerequisites: ['Probability and expected value', 'Sampling'],
    outcomes: [
      'Simulate losses under stated assumptions.',
      'Estimate expected loss and reserve-breach frequency.',
      'Separate simulation noise from model uncertainty.',
    ],
  },
};
