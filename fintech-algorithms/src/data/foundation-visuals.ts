export const foundationVisuals = [
  {
    id: 'features',
    title: 'What was known at decision time?',
    question: 'Can a future outcome be an input to today’s loan decision?',
    takeaway:
      'Features must exist when the decision is made. Repayment and default are labels learned later.',
  },
  {
    id: 'training',
    title: 'Learn once, then apply the relationship',
    question: 'What changes between fitting a model and using it for a new applicant?',
    takeaway:
      'Training uses historical labels. A new applicant’s eventual outcome is unknown at prediction time.',
  },
  {
    id: 'splits',
    title: 'Three different jobs for your data',
    question: 'Which sample should choose the review threshold?',
    takeaway:
      'Fit on training data, choose settings on validation data, and reserve the final test for evaluation.',
  },
  {
    id: 'probability',
    title: 'The estimate stays put; the policy moves',
    question: 'Does raising the review threshold change this applicant’s estimated risk?',
    takeaway:
      'A threshold changes the action. It does not change an already calculated probability.',
  },
  {
    id: 'expected-loss',
    title: 'An average across possible outcomes',
    question: 'Does $500 expected loss mean this particular loan will lose $500?',
    takeaway:
      'Expected loss averages possible outcomes. This loan’s realized loss can be $0 or $5,000 under these simplified assumptions.',
  },
  {
    id: 'formula',
    title: 'Read a formula through its objects',
    question: 'What does each term contribute to expected loss?',
    takeaway:
      'A symbol names an input or operation. Follow the units as you substitute the numbers.',
  },
  {
    id: 'counts',
    title: 'An index selects one observation',
    question: 'What is the difference between a value, a prediction, and the mean?',
    takeaway: 'The subscript selects a row; a hat marks a prediction; a bar marks an average.',
  },
  {
    id: 'operators',
    title: 'The operation changes the meaning',
    question:
      'What happens to positive and negative forecast errors when you add, take magnitudes, or square?',
    takeaway:
      'Signed errors can cancel. Absolute and squared errors retain the size of every miss.',
  },
  {
    id: 'logs',
    title: 'Read conditions, sets, and logarithms',
    question: 'Which small notation change alters the result?',
    takeaway:
      'Strict and inclusive boundaries differ at equality. Set overlap counts shared members; a logarithm reverses exponentiation.',
  },
  {
    id: 'percentages',
    title: 'Percent is not percentage points',
    question: 'How many different ways can we describe a move from 20% to 30%?',
    takeaway:
      'An increase from 20% to 30% is 10 percentage points, 1,000 basis points, and a 50% relative increase.',
  },
  {
    id: 'denominators',
    title: 'Name the population under the fraction',
    question: 'Which cases belong in the denominator of this question?',
    takeaway:
      'A rate means something only after naming its population. No eligible cases means the rate is undefined.',
  },
] as const;
export type FoundationId = (typeof foundationVisuals)[number]['id'];
