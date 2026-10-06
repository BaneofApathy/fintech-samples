import type { LessonBlock } from './lesson-types';
import type { TeachingTopic, QuestionDimension, PracticeQuestion } from './teaching-types';

const p = (text: string): LessonBlock => ({ kind: 'paragraph', text });
const table = (headers: string[], rows: string[][]): LessonBlock => ({
  kind: 'table',
  headers,
  rows,
});
const code = (text: string): LessonBlock => ({ kind: 'code', code: text });
type Answer = [text: string, explanation: string];
type Check = [
  dimension: QuestionDimension,
  prompt: string,
  correct: Answer,
  wrongA: Answer,
  wrongB: Answer,
];
interface FoundationSpec {
  slug: string;
  title: string;
  definition: string;
  precise: string;
  terms: [string, string, string][];
  understand: LessonBlock[];
  method: LessonBlock[];
  worked: LessonBlock[];
  application: LessonBlock[];
  checks: Check[];
  prerequisites: string[];
}
const specs: FoundationSpec[] = [
  {
    slug: 'notation',
    title: 'Read notation, sums, and units',
    prerequisites: [],
    definition:
      'Mathematical notation gives short names to quantities and operations. A formula is a set of instructions that you can read, substitute into, and calculate.',
    precise:
      'An indexed value xᵢ is the i-th observation. A finite sum Σᵢ₌₁ⁿ xᵢ adds the n indexed values. A mean divides that sum by the count n; units must remain consistent.',
    terms: [
      ['Index', 'A position identifying one observation or time.', 'x₂ is the second amount.'],
      ['Summation', 'Add all values over the stated index range.', 'Σ xᵢ = 10 + 20 + 30.'],
      [
        'Unit',
        'The measurement scale attached to a number.',
        'An amount in thousands of dollars must be multiplied by 1,000 to obtain dollars.',
      ],
      [
        'Parameter',
        'A setting or learned quantity used by a model.',
        'β is a fitted weight; it is different from an applicant feature.',
      ],
    ],
    understand: [
      p(
        'Read a formula in this order: name the quantity being calculated, define each symbol, check its unit, and identify the operations. Subscripts identify positions; they are not multiplication. x₂ means the second x, while 2x means twice x.',
      ),
      p(
        'A symbol has a local meaning. The letter p may mean probability in one formula and number of features in another. Always use the definition beside the formula rather than assuming one meaning throughout the course.',
      ),
    ],
    method: [
      p(
        'Σᵢ₌₁³ xᵢ says start at i = 1, stop at i = 3, and add x₁, x₂, and x₃. The average is x̄ = (Σ xᵢ)/n. Parentheses and fraction bars group operations: calculate the whole numerator before dividing by the whole denominator.',
      ),
      code(
        'total = 0\nfor amount in amounts:\n    total = total + amount\nmean = total / len(amounts)',
      ),
      p(
        'Percent means per hundred. 8% is 8/100 = 0.08. Percentage points describe a difference between percentages: 12% − 8% = 4 percentage points, while the relative increase is 4/8 = 50%.',
      ),
    ],
    worked: [
      table(
        ['i', 'Daily outflow xᵢ ($)', 'Running sum ($)'],
        [
          ['1', '10', '10'],
          ['2', '20', '30'],
          ['3', '30', '60'],
        ],
      ),
      p(
        'Here n = 3, Σ xᵢ = $60, and x̄ = $60/3 = $20. Counting dollars per day gives an average daily outflow, not an annual total. If the same observations were recorded as 0.010, 0.020, 0.030 thousand dollars, their mean would be 0.020 thousand dollars: still $20.',
      ),
    ],
    application: [
      p(
        'In a loan score, an input measured in thousands must use the same convention used to fit its coefficient. Entering $60,000 as 60,000 when the coefficient expects 60 multiplies its contribution by 1,000. Unit checks often reveal an error before any model evaluation does.',
      ),
      p(
        'To audit a calculation, write an intermediate table and keep units beside the result. Round only for display; reuse the unrounded value in later steps.',
      ),
    ],
    checks: [
      [
        'definition',
        'What does x₂ mean?',
        ['The second observation of x', 'The subscript identifies its position.'],
        ['Two times x', 'Multiplication would be written 2x.'],
        ['x squared', 'A square uses a superscript: x².'],
      ],
      [
        'definition',
        'In Σᵢ₌₁⁴ xᵢ, what is i?',
        ['An index running from 1 to 4', 'It selects the observation added at each step.'],
        ['The result of the sum', 'The sum is the result; i identifies a position.'],
        ['A currency unit', 'Units come from xᵢ, not the index.'],
      ],
      [
        'definition',
        'What does a coefficient represent in a weighted score?',
        [
          'A weight multiplying an input',
          'It converts the input into a contribution to the score.',
        ],
        ['The observed applicant outcome', 'That outcome is the label.'],
        ['The number of records', 'A count is not a weight.'],
      ],
      [
        'mechanism',
        'How do you calculate (10 + 20 + 30)/3?',
        [
          'Add all three amounts, then divide by 3',
          'The fraction bar groups the entire numerator.',
        ],
        ['Divide only 30 by 3', 'This ignores the grouping of the numerator.'],
        ['Divide by the largest amount', 'A mean divides by the observation count.'],
      ],
      [
        'mechanism',
        'How should an 8% probability enter a formula expecting a fraction?',
        ['As 0.08', '8 divided by 100 is 0.08.'],
        ['As 8', 'This is one hundred times too large.'],
        ['As 0.8', 'This is 80%, ten times too large.'],
      ],
      [
        'mechanism',
        'A sum includes i = 1 through i = 4. How many terms are added?',
        ['Four', 'Both endpoints are included.'],
        ['Three', 'Subtracting endpoints omits one indexed value.'],
        ['Five', 'There is no i = 0 term in this range.'],
      ],
      [
        'calculation',
        'What is the mean of $6, $9, and $15?',
        ['$10', 'The sum is $30 and the count is 3.'],
        ['$30', 'This is the sum, before dividing by the count.'],
        ['$15', 'This is the largest observation, not the mean.'],
      ],
      [
        'calculation',
        'A rate moves from 8% to 12%. What is its percentage-point change?',
        ['4 percentage points', 'Subtract the two percentages: 12 − 8 = 4.'],
        ['50 percentage points', '50% is the relative change, 4/8.'],
        ['0.04 percentage points', '0.04 is the difference expressed as a fraction.'],
      ],
      [
        'calculation',
        'Income is recorded in thousands of dollars. What represents $75,000?',
        ['75', '$75,000 divided by $1,000 is 75.'],
        ['75,000', 'The number is still in dollars rather than thousands.'],
        ['0.075', 'That would represent only $75.'],
      ],
      [
        'application',
        'A model expects income in thousands. Which check should precede scoring?',
        [
          'Confirm the input unit matches the coefficient convention',
          'A fitted weight is tied to the scale of its input.',
        ],
        [
          'Replace every income by a percentage',
          'Changing the scale arbitrarily changes the model.',
        ],
        ['Round income to zero', 'That discards the information entirely.'],
      ],
      [
        'application',
        'Which value should feed a later expected-loss calculation?',
        ['The unrounded probability', 'Rounding at each stage can accumulate error.'],
        [
          'Only the printed rounded percentage',
          'Display precision can be too coarse for downstream arithmetic.',
        ],
        ['The probability index', 'An index is a position, not a probability.'],
      ],
      [
        'application',
        'A formula gives dollars per reviewed alert. What does it measure?',
        ['A cost per alert', 'The denominator defines the per-alert interpretation.'],
        ['A fraction of frauds caught', 'That would be a count-based proportion, not dollars.'],
        ['Total annual spending', 'The result is per alert and has no annual count attached.'],
      ],
    ],
  },
  {
    slug: 'probability',
    title: 'Probability and expected value',
    prerequisites: ['notation'],
    definition:
      'Probability describes uncertainty about an event. Expected value is an average of possible outcomes weighted by their probabilities.',
    precise:
      'For mutually exclusive, exhaustive outcomes with probabilities pᵢ and values vᵢ, Σ pᵢ = 1 and E[V] = Σ pᵢvᵢ. An indicator equals 1 when an event occurs and 0 otherwise; its expectation is the event probability.',
    terms: [
      ['Event', 'A specified outcome or set of outcomes.', 'Default within one year.'],
      [
        'Conditional probability',
        'Probability within a specified condition or population.',
        'Default among applications with a given feature profile.',
      ],
      [
        'Expected value',
        'A probability-weighted average of possible values.',
        '0.1 × $4,000 + 0.9 × $0 = $400.',
      ],
      [
        'Indicator',
        'A variable that is 1 if an event occurs and 0 otherwise.',
        'A reserve-breach indicator is 1 when loss exceeds the reserve.',
      ],
    ],
    understand: [
      p(
        'A probability lies between 0 and 1. Zero means the event has no probability under the stated model; one means it is certain under that model. An estimate such as 10% should be interpreted over comparable cases and a defined time window. It does not mean a single borrower will default one tenth of the way.',
      ),
      p(
        'The complementary event has probability 1 − p. If default and repayment are the only outcomes, a 10% default probability implies 90% repayment probability. More complicated contracts may require more outcome categories.',
      ),
    ],
    method: [
      p(
        'List the possible outcomes, their values, and their probabilities. Check probabilities add to one, multiply each value by its probability, and sum the products. A negative value is allowed when it represents a loss in a signed-return convention; use one sign convention throughout.',
      ),
      p(
        'For a binary loss L, loss ℓ occurs with probability p and zero loss with probability 1 − p. E[L] = pℓ. If exposure is EAD and the fraction lost upon default is LGD, then ℓ = EAD × LGD and expected loss is PD × EAD × LGD. PD is probability of default; EAD is exposure at default.',
      ),
    ],
    worked: [
      table(
        ['Outcome', 'Probability', 'Loss', 'Weighted loss'],
        [
          ['Default', '0.10', '$4,000', '$400'],
          ['No default', '0.90', '$0', '$0'],
        ],
      ),
      p(
        'A $10,000 exposure with 40% LGD loses $4,000 if default occurs. At 10% PD, expected loss is $400. In this two-outcome model one loan realizes either $0 or $4,000, so $400 is an average, not a guaranteed realized amount.',
      ),
    ],
    application: [
      p(
        'Compare decisions using the outcomes each decision actually creates. A review policy has review costs and may alter later outcomes; simply paying a review fee does not guarantee the default loss disappears.',
      ),
      p(
        'Dependence affects portfolio uncertainty. Expected losses add even when loans are dependent, but the probability of several simultaneous defaults cannot generally be found by multiplying individual probabilities unless independence is assumed.',
      ),
    ],
    checks: [
      [
        'definition',
        'What does a 10% one-year default probability describe?',
        [
          'An estimated event frequency among comparable loans over that year',
          'It refers to a defined event and horizon.',
        ],
        ['A guaranteed 10% loss on this loan', 'Default probability differs from loss severity.'],
        [
          'A decision to reject exactly 10% of applications',
          'A probability does not specify an action policy.',
        ],
      ],
      [
        'definition',
        'What is expected loss?',
        [
          'The probability-weighted average of possible losses',
          'Each outcome contributes probability times loss.',
        ],
        ['Always the largest possible loss', 'That is a worst-case quantity.'],
        [
          'The loss every individual loan must realize',
          'Realized outcomes can differ from the average.',
        ],
      ],
      [
        'definition',
        'What is a default indicator?',
        ['1 for default and 0 otherwise', 'An indicator encodes occurrence of the event.'],
        ['The dollars lost in every default', 'That is a severity, not an indicator.'],
        ['A fitted feature weight', 'A coefficient has a different purpose.'],
      ],
      [
        'mechanism',
        'How is a discrete expected value calculated?',
        [
          'Multiply each outcome by its probability and add',
          'This weights outcomes by how likely they are.',
        ],
        ['Average the probabilities alone', 'This ignores the outcome values.'],
        ['Select the largest outcome', 'That gives a maximum rather than an expectation.'],
      ],
      [
        'mechanism',
        'Only default or repayment can occur. If PD = 0.2, what is repayment probability?',
        ['0.8', 'Complementary probabilities sum to one.'],
        ['0.2', 'The two outcomes need not be equally likely.'],
        ['1.2', 'A probability cannot exceed one.'],
      ],
      [
        'mechanism',
        'When may joint default probability be found by multiplying two PDs?',
        ['When the default events are independent', 'The product rule requires that assumption.'],
        ['Whenever their PDs are equal', 'Equal marginal probabilities do not imply independence.'],
        ['Whenever they are loans', 'Loan events may be correlated.'],
      ],
      [
        'calculation',
        'PD is 5% and loss on default is $2,000. What is expected loss?',
        ['$100', '0.05 × $2,000 = $100.'],
        ['$2,000', 'That is conditional loss if default happens.'],
        ['$10,000', 'Multiplying by 5 rather than 0.05 misreads percent.'],
      ],
      [
        'calculation',
        'Loss is $0 with probability 0.8 and $500 with probability 0.2. What is E[L]?',
        ['$100', '0.8 × 0 + 0.2 × 500 = 100.'],
        ['$250', 'An unweighted mean treats unequal probabilities as equal.'],
        ['$500', 'This selects the maximum outcome.'],
      ],
      [
        'calculation',
        'Exposure is $20,000, LGD is 25%, and PD is 4%. What is expected loss?',
        ['$200', 'Loss upon default is $5,000; 0.04 × $5,000 = $200.'],
        [
          '$800',
          'This uses PD × exposure but omits the 25% loss severity. Only $5,000 is lost upon default, so the expected loss is $200.',
        ],
        ['$5,000', 'This is loss upon default, before weighting by PD.'],
      ],
      [
        'application',
        'A portfolio has $1,000 expected loss. What should you conclude?',
        [
          'Realized loss may differ, so examine its distribution too',
          'An expectation does not describe tail uncertainty.',
        ],
        ['Exactly $1,000 will be lost', 'An average is not a guarantee.'],
        ['A $1,000 reserve can never be breached', 'Losses above the mean remain possible.'],
      ],
      [
        'application',
        'Two loans share the same employer. What assumption needs scrutiny?',
        ['Independence of their defaults', 'A common economic shock may affect both.'],
        [
          'That their individual probabilities exceed one',
          'Probabilities remain bounded even with dependence.',
        ],
        [
          'That expected losses cannot add',
          'Linearity of expectation does not require independence.',
        ],
      ],
      [
        'application',
        'A lender changes the review cutoff. What must be specified to estimate policy cost?',
        [
          'Action-specific losses, review costs, and outcomes',
          'Cost depends on what each action causes or consumes.',
        ],
        ['Only the cutoff number', 'A threshold alone supplies no dollars or outcomes.'],
        ['Only the number of input features', 'Feature count does not determine policy cost.'],
      ],
    ],
  },
  {
    slug: 'logarithms',
    title: 'Logs, exponentials, and odds',
    prerequisites: ['probability'],
    definition:
      'Exponentials and logarithms undo one another. Odds compare the probability of an event with the probability of its complement.',
    precise:
      'For 0 < p < 1, odds = p/(1 − p), log-odds z = ln(p/(1 − p)), and p = 1/(1 + exp(−z)). ln is the natural logarithm and exp(z) = eᶻ.',
    terms: [
      ['Exponential', 'The function exp(z) = eᶻ, always positive.', 'exp(0) = 1.'],
      [
        'Natural logarithm',
        'The inverse of the base-e exponential for positive inputs.',
        'ln(exp(2)) = 2.',
      ],
      [
        'Odds',
        'Event probability divided by complementary probability.',
        'p = 0.2 gives odds 0.2/0.8 = 0.25.',
      ],
      ['Log-odds', 'Natural logarithm of the odds.', 'p = 0.5 gives log-odds 0.'],
    ],
    understand: [
      p(
        'Probability is bounded by 0 and 1; odds are positive and may exceed 1; log-odds may be any real number. They are three representations of uncertainty, not interchangeable units. When p = 0.5, odds = 1 and log-odds = 0.',
      ),
      p(
        'ln(a × b) = ln(a) + ln(b) for positive a and b. This makes logarithms useful for products of probabilities. Log loss uses −ln of the probability assigned to the observed outcome: a very small assigned probability produces a large penalty.',
      ),
    ],
    method: [
      p(
        'To convert log-odds to probability, compute exp(−z), add one, and take the reciprocal. To convert probability back, divide p by 1 − p and take ln. At p exactly 0 or 1, finite log-odds do not exist; numerical implementations use documented clipping when computing log loss.',
      ),
      p(
        'A coefficient change of +1 adds 1 to log-odds and multiplies odds by e ≈ 2.718. It does not add one percentage point to probability. The probability change depends on the starting score.',
      ),
    ],
    worked: [
      table(
        ['Quantity', 'Operation', 'Result'],
        [
          ['Probability p', 'Given', '0.20'],
          ['Complement', '1 − 0.20', '0.80'],
          ['Odds', '0.20/0.80', '0.25'],
          ['Log-odds', 'ln(0.25)', '−1.386294'],
          ['Recovered probability', '1/(1 + exp(1.386294))', '0.20'],
        ],
      ),
      p(
        'For a second score z = 0, exp(−0) = 1 and p = 1/(1 + 1) = 0.5. The transformation preserves ordering: higher log-odds gives higher probability.',
      ),
    ],
    application: [
      p(
        'Credit scoring often adds contributions on the log-odds scale, then converts the result to PD. Explain a coefficient on the scale on which it acts. A separate threshold converts the PD into a policy action.',
      ),
      p(
        'Logarithms also turn compounded products into sums, but a log return and a simple return are different quantities. Do not mix their averaging or annualization conventions without conversion.',
      ),
    ],
    checks: [
      [
        'definition',
        'Which quantity can be negative?',
        ['Log-odds', 'A logarithm of odds below one is negative.'],
        ['Probability', 'Probability cannot be negative.'],
        ['Odds', 'Odds are positive for probabilities strictly between zero and one.'],
      ],
      [
        'definition',
        'What does ln mean here?',
        ['The natural logarithm', 'It is inverse to the base-e exponential.'],
        ['The observation count', 'A count is usually n, not ln.'],
        ['A linear probability', 'ln names a function, not a probability model.'],
      ],
      [
        'definition',
        'What do odds compare?',
        ['Event probability with complementary probability', 'The ratio is p/(1 − p).'],
        ['Profit with exposure', 'That is a different financial ratio.'],
        ['Probability with itself', 'That ratio would always be one.'],
      ],
      [
        'mechanism',
        'How do you convert a log-odds score z to probability?',
        ['1/(1 + exp(−z))', 'This is the sigmoid inverse of logit.'],
        ['exp(z) alone', 'That produces odds, which may exceed one.'],
        ['z/100', 'The score is not a percentage.'],
      ],
      [
        'mechanism',
        'Adding 1 to log-odds has what effect on odds?',
        ['Multiplies odds by e', 'exp(z + 1) = exp(z) × e.'],
        ['Adds one percentage point', 'That confuses log-odds with probability.'],
        [
          'Makes every probability equal to 1',
          'Finite scores still map inside the probability range.',
        ],
      ],
      [
        'mechanism',
        'Why must zero probabilities be handled explicitly in log loss?',
        ['ln(0) is not finite', 'A clipping convention prevents infinite numerical output.'],
        ['ln(0) equals zero', 'ln(1), not ln(0), equals zero.'],
        [
          'Zero probabilities mean the outcome was correct',
          'Correctness depends on the observed label.',
        ],
      ],
      [
        'calculation',
        'If p = 0.5, what are odds?',
        ['1', '0.5/(1 − 0.5) = 1.'],
        ['0.5', 'This is probability, not odds.'],
        ['0', 'Log-odds is zero, but odds is one.'],
      ],
      [
        'calculation',
        'If p = 0.25, what are odds?',
        ['1/3', '0.25/0.75 = 1/3.'],
        ['0.25', 'This omits the complementary denominator.'],
        ['3', 'This reverses event and complement.'],
      ],
      [
        'calculation',
        'What probability corresponds to z = 0?',
        ['50%', '1/(1 + exp(0)) = 1/2.'],
        ['0%', 'Zero log-odds is not zero probability.'],
        ['100%', 'A finite zero score is not certainty.'],
      ],
      [
        'application',
        'A coefficient is 0.4. How should its one-unit effect be described?',
        [
          'It adds 0.4 to log-odds, holding other inputs fixed',
          'The probability change depends on the starting score.',
        ],
        [
          'It always raises PD by 40 percentage points',
          'Coefficients do not act directly on probability.',
        ],
        ['It guarantees default', 'A positive contribution is not a certain outcome.'],
      ],
      [
        'application',
        'A default model assigns only 1% to a borrower who defaults. What does log loss emphasize?',
        [
          'The very small probability assigned to the observed event',
          '−ln(0.01) is a substantial penalty.',
        ],
        [
          'Only whether PD exceeded 50%',
          'Log loss evaluates probabilities, not just threshold decisions.',
        ],
        ['The dollar amount of the loan', 'Plain log loss does not include exposure.'],
      ],
      [
        'application',
        'Two applicants have different log-odds. What does the sigmoid preserve?',
        ['Their ordering by score', 'The sigmoid is monotone increasing.'],
        ['Equal differences in percentage points', 'The mapping is nonlinear.'],
        ['A fixed approval action', 'Approval requires an additional threshold or policy.'],
      ],
    ],
  },
  {
    slug: 'vectors',
    title: 'Vectors, dot products, distances, and scaling',
    prerequisites: ['notation'],
    definition:
      'A vector is an ordered list of numbers. Dot products combine corresponding coordinates; distances measure how far vectors lie apart.',
    precise:
      'For equal-length vectors x and w, w·x = Σⱼ wⱼxⱼ. Euclidean distance is √(Σⱼ(xⱼ − yⱼ)²); norm ||x|| is its distance from zero. Cosine similarity is x·y/(||x||||y||) for nonzero vectors.',
    terms: [
      [
        'Coordinate',
        'One component of an ordered vector.',
        'The second coordinate could be monthly payments.',
      ],
      ['Dot product', 'Sum of products of corresponding coordinates.', '[1,2]·[3,4] = 11.'],
      [
        'Euclidean distance',
        'Straight-line distance in the specified coordinate space.',
        'Distance from [0,0] to [3,4] is 5.',
      ],
      [
        'Scaling',
        'Transform feature units using a consistent rule.',
        'Standardize using a mean and scale learned on training data.',
      ],
    ],
    understand: [
      p(
        'The order and meaning of vector coordinates must agree. A customer vector [income, transactions] cannot be compared with [transactions, income] as though the positions matched. A matrix is a rectangular collection of values, often one observation per row and one feature per column.',
      ),
      p(
        'A dot product uses multiplication and addition, whereas a distance compares coordinate differences. Cosine compares direction after normalizing by vector lengths. Each operation answers a different question.',
      ),
    ],
    method: [
      p(
        'For Euclidean distance: subtract coordinates, square each difference, add the squares, then take the square root. For cosine: calculate the dot product and both lengths, then divide. A zero vector has no defined cosine direction.',
      ),
      p(
        'Units can dominate distance: a $10,000 income difference can overwhelm a difference of two transactions. Choose meaningful transformations and fit their statistics on the training set. Scaling changes the geometry; it is part of the model pipeline.',
      ),
    ],
    worked: [
      table(
        ['Operation', 'Intermediate values', 'Result'],
        [
          ['[1,2]·[3,4]', '1 × 3 = 3; 2 × 4 = 8', '11'],
          ['Distance [0,0] to [3,4]', '3² + 4² = 25', '5'],
          ['Cosine [1,0] with [1,1]', 'Dot = 1; lengths = 1 and √2', '1/√2 ≈ 0.7071'],
        ],
      ),
      p(
        'For a customer pair [1,2] and [3,4], coordinate differences are −2 and −2, squared distance is 8, and Euclidean distance is √8 ≈ 2.828. Always state what these coordinates measure before assigning a financial meaning.',
      ),
    ],
    application: [
      p(
        'K-means uses distances to assign customers to centers. Retrieval uses similarity to rank passages. A high similarity measures closeness in the representation; it does not verify that a passage supports a particular financial claim.',
      ),
      p(
        'When comparing a new customer with stored centers, apply the same feature order and training-derived scaling to both. Refitting the scaler on each new case would make those distances incomparable.',
      ),
    ],
    checks: [
      [
        'definition',
        'What is a vector?',
        ['An ordered list of numbers', 'Coordinate order is part of its meaning.'],
        ['An unordered bag of features', 'Reordering coordinates can change the calculation.'],
        ['Always one probability', 'Vectors can contain many kinds of numerical values.'],
      ],
      [
        'definition',
        'What does a dot product do?',
        ['Adds products of matching coordinates', 'It combines coordinate-wise contributions.'],
        ['Adds distances without multiplication', 'That is not the dot product formula.'],
        ['Sorts the coordinates', 'Sorting destroys feature alignment.'],
      ],
      [
        'definition',
        'When is cosine similarity undefined?',
        ['When either vector has zero norm', 'Its denominator contains both vector norms.'],
        [
          'When the vectors have the same direction',
          'Same-direction nonzero vectors have cosine one.',
        ],
        ['When the dot product is zero', 'Nonzero perpendicular vectors have defined cosine zero.'],
      ],
      [
        'mechanism',
        'What follows squaring coordinate differences in Euclidean distance?',
        [
          'Add them and take the square root',
          'This produces distance rather than squared distance.',
        ],
        ['Multiply them and divide by feature count', 'That is not the distance operation.'],
        ['Sort and retain the largest', 'That would discard other coordinate differences.'],
      ],
      [
        'mechanism',
        'Which statistics should a feature scaler use before final testing?',
        ['Statistics fitted on training data', 'This keeps final evaluation independent.'],
        [
          'Statistics recalculated from the test outcomes',
          'That leaks information into preprocessing.',
        ],
        [
          'A new scale for every compared vector',
          'Different scales make comparisons inconsistent.',
        ],
      ],
      [
        'mechanism',
        'Why divide a dot product by vector lengths for cosine?',
        [
          'To compare direction independently of magnitude',
          'Normalization removes the overall length factors.',
        ],
        [
          'To turn similarity into guaranteed relevance',
          'Geometry does not establish semantic evidence.',
        ],
        ['To change all negative values to positive', 'Cosine can be negative.'],
      ],
      [
        'calculation',
        'What is [1,2]·[3,4]?',
        ['11', 'Multiply matching coordinates and add: 1×3 + 2×4 = 3 + 8 = 11.'],
        ['10', 'Adding all coordinates is not a dot product.'],
        ['24', 'Multiplying all coordinates is not a dot product.'],
      ],
      [
        'calculation',
        'What is the distance from [0,0] to [3,4]?',
        [
          '5',
          'Square each coordinate difference, add, then take the square root: √(3² + 4²) = √25 = 5.',
        ],
        ['7', 'This adds absolute differences rather than Euclidean distance.'],
        ['25', 'This is squared distance, before the square root.'],
      ],
      [
        'calculation',
        'What is the dot product of [2,0] and [0,3]?',
        [
          '0',
          'Multiply coordinates in their original positions: 2×0 + 0×3 = 0. These vectors point in perpendicular directions.',
        ],
        ['6', 'This multiplies unmatched coordinates.'],
        ['5', 'Adding the nonzero entries is not the dot product.'],
      ],
      [
        'application',
        'Income is in dollars and purchases in counts. What should be checked before clustering?',
        [
          'Whether feature scales create meaningful distances',
          'Large numerical units can dominate assignments.',
        ],
        ['Whether every value is a probability', 'Clustering inputs need not be probabilities.'],
        [
          'Whether the feature names can be omitted',
          'Coordinate meanings are needed for interpretation.',
        ],
      ],
      [
        'application',
        'A passage has high embedding similarity. What still needs checking?',
        [
          'Whether its content supports the requested claim',
          'Similarity is a retrieval signal, not factual verification.',
        ],
        ['Whether similarity itself proves the claim', 'A score cannot substitute for evidence.'],
        [
          'Whether its vector can replace the cited figures',
          'Numerical answers require the actual figures.',
        ],
      ],
      [
        'application',
        'A stored center uses [balance, count]. How must a new customer be represented?',
        ['In that same order and scale', 'Matching coordinate meanings makes distance valid.'],
        ['In any order if the same two numbers occur', 'The coordinates are ordered.'],
        ['Only by its largest feature', 'That changes the model representation.'],
      ],
    ],
  },
  {
    slug: 'variance',
    title: 'Variance, covariance, and correlation',
    prerequisites: ['notation', 'probability'],
    definition:
      'Variance measures squared spread around a mean. Covariance describes how two quantities vary together; correlation rescales that relationship.',
    precise:
      'Population variance is Σ(xᵢ − μ)²/n; sample variance uses n − 1 after estimating the mean. Standard deviation is the square root. Covariance averages paired deviation products under the stated population/sample convention; correlation divides covariance by both standard deviations.',
    terms: [
      ['Deviation', 'A value minus its mean.', '12 − 10 = 2.'],
      [
        'Variance',
        'Average squared deviation under the stated convention.',
        'Values 0 and 2 have population variance 1.',
      ],
      [
        'Covariance',
        'Average product of paired deviations.',
        'Two returns moving together often have positive covariance.',
      ],
      [
        'Correlation',
        'A dimensionless standardized covariance between −1 and 1.',
        'Perfect opposite linear movement gives −1.',
      ],
    ],
    understand: [
      p(
        'A mean describes a center, not its spread. Two portfolios may have the same average return but different dispersion. Squaring deviations prevents positive and negative deviations from cancelling. Variance has squared units; standard deviation returns to the original unit.',
      ),
      p(
        'Covariance keeps the units of both variables. Correlation removes those scale factors, but it does not establish causation. A correlation cannot be calculated conventionally when a variable has zero standard deviation.',
      ),
    ],
    method: [
      p(
        'First compute the mean. Subtract it from every observation, square each difference, add the squares, and divide by the chosen denominator. State whether the displayed observations are the whole teaching population or a sample estimating a larger population.',
      ),
      p(
        'For a two-asset portfolio with weights w₁,w₂, variance is w₁²σ₁² + w₂²σ₂² + 2w₁w₂Cov(R₁,R₂). R names return, σ² is asset variance, and Cov is paired-return covariance. The cross term is why diversification depends on joint movement.',
      ),
    ],
    worked: [
      table(
        ['x', 'Mean', 'Deviation', 'Squared deviation'],
        [
          ['0', '1', '−1', '1'],
          ['2', '1', '+1', '1'],
        ],
      ),
      p(
        'The squared deviations sum to 2. Population variance is 2/2 = 1 and population SD is 1. Sample variance is 2/(2 − 1) = 2 and sample SD is √2. Both results can be correct under different stated conventions.',
      ),
      p(
        'If two assets each have variance 4, covariance 0, and weight 0.5, portfolio variance is 0.25×4 + 0.25×4 + 0 = 2. If covariance is 4 instead, the cross term adds 2 and the portfolio variance becomes 4.',
      ),
    ],
    application: [
      p(
        'Portfolio calculations require aligned returns measured over the same dates and horizon. Combining daily risk with an annual return without a consistent conversion can make ratios misleading.',
      ),
      p(
        'Historical covariance is an estimate. Stress scenarios can reveal portfolios that look diversified in ordinary data but concentrate exposure to a shared shock.',
      ),
    ],
    checks: [
      [
        'definition',
        'What does variance measure?',
        ['Squared spread around the mean', 'It aggregates squared deviations.'],
        ['Only the average value', 'That is the mean.'],
        ['The probability of default', 'Variance is not itself an event probability.'],
      ],
      [
        'definition',
        'What units does dollar-valued variance have?',
        ['Dollars squared', 'Squaring deviations squares the unit.'],
        ['Dollars', 'Standard deviation has the original dollar unit.'],
        ['No units', 'Correlation, rather than variance, is dimensionless.'],
      ],
      [
        'definition',
        'What does covariance describe?',
        ['Joint variation of paired observations', 'It uses products of aligned deviations.'],
        ['An individual observation count', 'Counts do not describe joint movement.'],
        ['Proof that one return causes the other', 'Association does not establish causation.'],
      ],
      [
        'mechanism',
        'Why square deviations when calculating variance?',
        [
          'To retain spread without sign cancellation',
          'Positive and negative deviations otherwise sum to zero.',
        ],
        ['To remove the need for a mean', 'The deviations still depend on the mean.'],
        ['To force variance below one', 'Variance is not bounded by one.'],
      ],
      [
        'mechanism',
        'What denominator does the usual sample variance use?',
        ['n − 1', 'The mean has been estimated from the same sample.'],
        ['Always n', 'That is the population-variance denominator.'],
        ['The largest observation', 'That does not normalize by sample information.'],
      ],
      [
        'mechanism',
        'Which term captures dependence in two-asset portfolio variance?',
        ['2w₁w₂Cov(R₁,R₂)', 'The cross term represents joint variation.'],
        ['Only w₁ + w₂', 'The sum of weights does not measure dependence.'],
        ['Only the mean return', 'The mean does not describe co-movement.'],
      ],
      [
        'calculation',
        'What is population variance of 0 and 2?',
        ['1', 'The mean is 1; squared deviations sum to 2; divide by 2.'],
        ['2', 'That is the sample variance.'],
        ['0', 'Signed deviations cancel, but squared deviations do not.'],
      ],
      [
        'calculation',
        'Variance is 9 dollars squared. What is SD?',
        ['$3', 'The square root restores the original unit.'],
        ['$9', 'This does not take the square root.'],
        ['$81', 'This squares variance again.'],
      ],
      [
        'calculation',
        'Two independent assets each have variance 4 and weight 0.5. What is portfolio variance?',
        ['2', '0.5²×4 + 0.5²×4 = 2.'],
        ['4', 'Averaging asset variances ignores squared weights.'],
        ['8', 'Summing full variances ignores portfolio weights.'],
      ],
      [
        'application',
        'Which returns should be paired to estimate covariance?',
        [
          'Returns aligned to the same observation dates',
          'Covariance measures simultaneous paired deviations.',
        ],
        ['Arbitrarily sorted returns', 'Sorting changes the joint relationship.'],
        [
          'One daily series and one unrelated annual series',
          'Different horizons and unmatched dates are not comparable.',
        ],
      ],
      [
        'application',
        'Correlation is high between two assets. What does that imply?',
        [
          'Their linear movements are strongly associated in the sample',
          'This is an association claim with sample scope.',
        ],
        ['One asset causes the other to move', 'Correlation alone cannot establish causation.'],
        ['They must have equal volatility', 'Correlation removes scale differences.'],
      ],
      [
        'application',
        'Why stress-test a covariance-based portfolio?',
        [
          'Estimated relationships can change under shared shocks',
          'Historical dependence may not describe stressed periods.',
        ],
        ['Because covariance guarantees zero loss', 'It offers no such guarantee.'],
        ['Because weights remove all uncertainty', 'Allocations still face uncertain returns.'],
      ],
    ],
  },
  {
    slug: 'gradients',
    title: 'Derivatives, gradients, and learning updates',
    prerequisites: ['notation'],
    definition:
      'A derivative measures local change in a function. A gradient collects derivatives for all parameters and guides a learning update.',
    precise:
      'For differentiable loss L(θ), gradient descent updates θ ← θ − η∇L(θ), where θ is a parameter vector, η > 0 is the learning rate, and ∇L contains partial derivatives.',
    terms: [
      [
        'Derivative',
        'Local rate of change with respect to one quantity.',
        'The derivative of (w − 3)² is 2(w − 3).',
      ],
      [
        'Gradient',
        'Vector of partial derivatives with respect to parameters.',
        'One component says how loss changes with the intercept.',
      ],
      [
        'Learning rate',
        'Positive scale controlling update size.',
        'η = 0.1 moves one tenth of the negative-gradient direction.',
      ],
      [
        'Loss',
        'A numerical objective measuring prediction error or fit.',
        'Squared error penalizes the squared prediction residual.',
      ],
    ],
    understand: [
      p(
        'A loss function makes the fitting goal explicit. A derivative is a local slope: positive means increasing the parameter slightly increases the loss; negative means it decreases it. Taking a small step opposite the slope aims to lower loss.',
      ),
      p(
        'For many parameters, compute a partial derivative for each while holding the others fixed. The gradient points toward local increase. An update changes fitted parameters; evaluating a fixed model on a new applicant does not normally perform this training update.',
      ),
    ],
    method: [
      code(
        'repeat until stopping condition:\n    predictions = model(training_inputs, parameters)\n    loss = objective(predictions, training_labels)\n    gradient = derivatives_of_loss(parameters)\n    parameters = parameters - learning_rate * gradient',
      ),
      p(
        'For L(w) = (w − 3)², dL/dw = 2(w − 3). At w = 1 the slope is −4. With η = 0.1, w becomes 1 − 0.1×(−4) = 1.4. Larger learning rates can overshoot; small rates can require many updates.',
      ),
    ],
    worked: [
      table(
        ['Step', 'w', 'Loss (w − 3)²', 'Gradient 2(w − 3)', 'Next w at η=0.1'],
        [
          ['1', '1', '4', '−4', '1.4'],
          ['2', '1.4', '2.56', '−3.2', '1.72'],
        ],
      ),
      p(
        'After the first update, loss falls from 4 to 2.56. After the second, it is (1.72 − 3)² = 1.6384. This toy objective is convex and has its minimum at w = 3; complex objectives may have local optima or saddle points.',
      ),
    ],
    application: [
      p(
        'Logistic regression learns coefficients by reducing a probability loss. Boosting fits learners to negative-gradient targets. Both use an objective, but their update mechanisms differ; a boosted tree is not simply a logistic coefficient update.',
      ),
      p(
        'Inspect training and validation behavior. A falling training loss alone does not establish improved performance on later loans. Stopping and learning-rate settings should be selected without tuning on the final test.',
      ),
    ],
    checks: [
      [
        'definition',
        'What is a gradient?',
        [
          'The vector of parameter-wise partial derivatives',
          'It collects local slopes for all parameters.',
        ],
        ['The final model probability', 'A probability is a prediction output.'],
        ['The number of training records', 'That is a count rather than a derivative.'],
      ],
      [
        'definition',
        'What does a learning rate control?',
        ['The size of the parameter update', 'It scales the negative gradient.'],
        ['The definition of the outcome label', 'The label must be specified separately.'],
        ['The loan interest rate', 'This is an optimization parameter, not a financial rate.'],
      ],
      [
        'definition',
        'What is a loss function?',
        [
          'The numerical objective being minimized during fitting',
          'It gives training an explicit error criterion.',
        ],
        ['Every realized financial loss', 'A statistical loss may have no dollar unit.'],
        ['A threshold for approving loans', 'A threshold is a policy parameter.'],
      ],
      [
        'mechanism',
        'Which direction does ordinary gradient descent use?',
        ['Opposite the gradient', 'The gradient points toward local increase.'],
        ['Along the gradient', 'That usually increases loss for a small step.'],
        [
          'Always toward larger parameter values',
          'Update direction depends on the derivative sign.',
        ],
      ],
      [
        'mechanism',
        'A derivative is negative. What does a small descent step do to that parameter?',
        ['Increase it', 'Subtracting a negative derivative adds a positive amount.'],
        ['Decrease it', 'That follows the slope toward higher loss locally.'],
        ['Set it to zero automatically', 'The update formula does not force zero.'],
      ],
      [
        'mechanism',
        'Why can a very large learning rate cause trouble?',
        [
          'It can overshoot a useful local step',
          'Local slope information may not remain valid across a large move.',
        ],
        ['It always removes overfitting', 'Step size does not guarantee generalization.'],
        ['It makes derivatives unnecessary', 'The gradient is still part of the update.'],
      ],
      [
        'calculation',
        'w = 1, gradient = −4, η = 0.1. What is the updated w?',
        ['1.4', '1 − 0.1×(−4) = 1.4.'],
        ['0.6', 'This adds the gradient instead of subtracting it.'],
        ['5', 'This omits the learning-rate factor.'],
      ],
      [
        'calculation',
        'w = 2, gradient = 3, η = 0.2. What is the updated w?',
        ['1.4', '2 − 0.2×3 = 1.4.'],
        ['2.6', 'That moves along the positive gradient.'],
        ['−1', 'This uses a step size of one rather than 0.2.'],
      ],
      [
        'calculation',
        'For L(w) = (w − 3)² at w = 1, what is L?',
        ['4', 'Substitute w = 1 into the loss, then square the difference: (1 − 3)² = (−2)² = 4.'],
        ['−2', 'That is the unsquared residual.'],
        ['−4', 'A squared loss cannot be negative.'],
      ],
      [
        'application',
        'Training loss falls but later-data loss rises. What should be investigated?',
        [
          'Overfitting and the stopping/settings choice',
          'Training fit and generalization are different.',
        ],
        [
          'Whether the test labels should be used for further fitting',
          'That compromises the final test.',
        ],
        ['Whether lower training loss proves success', 'It does not establish later performance.'],
      ],
      [
        'application',
        'A trained model scores one new loan. Should its coefficients automatically change?',
        [
          'No; prediction applies the fitted parameters',
          'Updating coefficients is a training operation.',
        ],
        [
          'Yes, because every prediction is a gradient update',
          'Inference and fitting are distinct.',
        ],
        [
          'Yes, using the still-unknown future default label',
          'That label is unavailable at decision time.',
        ],
      ],
      [
        'application',
        'Which data should choose an early-stopping iteration?',
        ['Validation data', 'It supports model selection without consuming the final test.'],
        ['The final test repeatedly', 'Repeated tuning makes the final result optimistic.'],
        ['Only the latest applicant', 'One case does not supply a sound stopping assessment.'],
      ],
    ],
  },
  {
    slug: 'data-splits',
    title: 'Training, validation, and honest testing',
    prerequisites: ['probability'],
    definition:
      'Separate data according to its role: training learns parameters, validation chooses settings, and a held-out test evaluates the final choice.',
    precise:
      'A generalization estimate evaluates the fixed fitted pipeline on observations not used for parameter estimation or model selection. Time-dependent tasks require evaluation that respects decision-time ordering and label availability.',
    terms: [
      [
        'Training set',
        'Observations used to estimate model parameters.',
        'Past labelled loans used to fit coefficients.',
      ],
      [
        'Validation set',
        'Observations used to choose settings or policies.',
        'Choose tree depth or an alert cutoff here.',
      ],
      [
        'Test set',
        'Held-out observations for the final fixed choice.',
        'Later loans assessed after model selection.',
      ],
      [
        'Baseline',
        'A simple comparator evaluated under the same conditions.',
        'A majority-class rule or last-value forecast.',
      ],
    ],
    understand: [
      p(
        'A model can fit patterns specific to its training examples. The question for students is whether the learned method works on new cases. Validation allows development choices; the final test should not be repeatedly used to choose those choices.',
      ),
      p(
        'A pipeline includes preprocessing as well as the estimator. Training-derived scales, imputation values, and vocabulary belong inside the fitted pipeline. Compare methods on the same population, time window, labels, and operating conditions.',
      ),
    ],
    method: [
      p(
        'For a chronological teaching example, train on January–June, choose settings on July–August, and test on September–October. Confirm that labels needed for each step had actually matured by that date. Never train on October to predict September.',
      ),
      p(
        'In cross-validation, fit the full pipeline separately inside each training fold. For repeated customers or related accounts, a row-level random split may leak identity; use a grouping strategy appropriate to the intended deployment population.',
      ),
    ],
    worked: [
      table(
        ['Observations', 'Role', 'Allowed operation'],
        [
          ['Loans 1–60', 'Training', 'Fit weights and preprocessing'],
          ['Loans 61–80', 'Validation', 'Choose settings and cutoff'],
          ['Loans 81–100', 'Test', 'Evaluate the fixed final method'],
        ],
      ),
      p(
        'Model A has validation error 12% and model B 10%, so choose B using validation. If B then has test error 14%, report that result. Changing to A because its test result is better would make the test another model-selection set.',
      ),
    ],
    application: [
      p(
        'For lending, the default horizon may delay labels by months. A simulated deployment must respect both application time and when outcomes become observable. Forecast evaluation similarly uses only information known before each forecast.',
      ),
      p(
        'A baseline reveals whether complexity adds value. Report the final model and baseline using the same measures, not one model’s accuracy and another model’s AUC.',
      ),
    ],
    checks: [
      [
        'definition',
        'Which set estimates fitted coefficients?',
        ['Training', 'Parameter fitting is the training role.'],
        ['Test', 'The test evaluates the final fixed choice.'],
        ['Validation only', 'Validation selects settings rather than being the main fitting set.'],
      ],
      [
        'definition',
        'Which set chooses tree depth?',
        ['Validation', 'Depth is a model-selection setting.'],
        ['Final test repeatedly', 'That would consume the honest final assessment.'],
        ['The current unlabeled applicant', 'A single new case provides no labelled comparison.'],
      ],
      [
        'definition',
        'What is a baseline?',
        [
          'A simple method used as a fair comparator',
          'It establishes whether additional complexity helps.',
        ],
        ['The best possible future prediction', 'Future perfect information is unavailable.'],
        ['A different outcome definition for each method', 'That makes methods incomparable.'],
      ],
      [
        'mechanism',
        'When should preprocessing be fitted in cross-validation?',
        ['Inside each training fold', 'This avoids learning from the held-out fold.'],
        [
          'Once on the complete dataset including test rows',
          'That exposes held-out information to development.',
        ],
        [
          'After looking at all held-out labels',
          'That uses information the fitted model should not have.',
        ],
      ],
      [
        'mechanism',
        'Which ordering is suitable for forecasting?',
        [
          'Train on past observations and evaluate on later ones',
          'The sequence respects available information.',
        ],
        [
          'Train on future observations and predict the past',
          'This reverses the intended decision timeline.',
        ],
        [
          'Randomize the dates without checking dependence',
          'That can expose future patterns during fitting.',
        ],
      ],
      [
        'mechanism',
        'Why may related-account rows need grouped splitting?',
        [
          'The same identity can otherwise appear in training and evaluation',
          'This can overstate performance on truly new accounts.',
        ],
        [
          'Because grouping guarantees perfect prediction',
          'It improves evaluation design, not prediction certainty.',
        ],
        ['Because every feature must become a label', 'Feature and outcome roles remain distinct.'],
      ],
      [
        'calculation',
        '100 rows are split 60/20/20. How many are for validation?',
        ['20', 'The middle portion contains 20 rows.'],
        ['60', 'That is the training count.'],
        ['40', 'That combines validation and test.'],
      ],
      [
        'calculation',
        'Validation errors are A:12%, B:10%. Which has lower validation error?',
        ['B', '10% is below 12% on the same validation set.'],
        [
          'A',
          'Model A has 12% error, which exceeds model B’s 10%; lower validation error favors B under this comparison.',
        ],
        [
          'Neither because lower error is worse',
          'For an error rate, lower is better under the specified task.',
        ],
      ],
      [
        'calculation',
        'A fixed classifier makes 14 errors in 100 test rows. What is its test error?',
        ['14%', 'Divide incorrect predictions by all test observations: 14/100 = 0.14, or 14%.'],
        ['86%', 'That is its accuracy, not error.'],
        ['1.4%', 'This divides by 1,000 rather than 100.'],
      ],
      [
        'application',
        'The final test result disappoints. What should the report say?',
        [
          'Report it honestly and reserve new data for later iterations',
          'The result reflects the tested final choice.',
        ],
        [
          'Hide it and publish only training performance',
          'That conceals evidence about generalization.',
        ],
        ['Keep tuning on this test and still call it untouched', 'It becomes part of development.'],
      ],
      [
        'application',
        'What makes a fair model comparison?',
        [
          'The same population, outcomes, horizon, and measures',
          'Differences should come from methods rather than evaluation conditions.',
        ],
        [
          'Different test populations for each model',
          'Population differences confound the comparison.',
        ],
        ['Only comparing training scores', 'That does not assess later performance.'],
      ],
      [
        'application',
        'A one-year default label has not matured. How should the data be treated?',
        [
          'Respect label availability when constructing the historical evaluation',
          'The outcome may not yet be observable at the simulated training date.',
        ],
        ['Assume the loan repaid', 'Missing future outcomes are not negative labels.'],
        ['Use the later default record as an earlier feature', 'That leaks future information.'],
      ],
    ],
  },
  {
    slug: 'leakage',
    title: 'Leakage and decision-time information',
    prerequisites: ['data-splits'],
    definition:
      'Leakage occurs when model development uses information that would be unavailable or improper at the intended decision time.',
    precise:
      'A valid prediction uses features measurable under the deployment information set. Target leakage, future-data leakage, and contamination across evaluation splits can bias estimates of generalization.',
    terms: [
      [
        'Decision cutoff',
        'The instant defining what information is available.',
        'An application timestamp before approval.',
      ],
      [
        'Target leakage',
        'An input directly or indirectly reveals the outcome.',
        'A collection status recorded after default.',
      ],
      [
        'Preprocessing leakage',
        'Held-out data influences fitted transformations.',
        'Scaling with the final test’s mean.',
      ],
      [
        'Selection bias',
        'The observed sample differs systematically from the intended population.',
        'Repayment outcomes are observed mainly for approved loans.',
      ],
    ],
    understand: [
      p(
        'An input can be strongly predictive and still be invalid. “Number of collections calls after default” predicts default well because it occurs afterward. The issue is not a low-quality correlation; the information cannot be known when the original loan is approved.',
      ),
      p(
        'Leakage can enter without an obvious future column. Duplicate customers across splits, full-data feature selection, or using test outcomes to choose a policy can all create misleading evaluation.',
      ),
    ],
    method: [
      p(
        'For each feature, record what it means, when its value is measured, and when it becomes available to the decision system. Compare that availability time with the decision cutoff. Fit transformations inside training partitions and keep evaluation outcomes out of selection.',
      ),
      code(
        'for feature in candidate_features:\n    assert feature.available_at <= decision_time\nfit_preprocessing(training_rows)\nfit_model(transformed_training_rows)\nevaluate(fixed_pipeline, later_held_out_rows)',
      ),
    ],
    worked: [
      table(
        ['Feature', 'Available', 'Valid for approval?'],
        [
          [
            'Income reported with application',
            'Before approval',
            'Potentially, subject to quality checks',
          ],
          ['Prior missed payments', 'Before approval', 'Potentially'],
          ['Collections calls next year', 'After outcome', 'No'],
          [
            'Future default label',
            'After approval horizon',
            'Training outcome only, never a live input',
          ],
        ],
      ),
      p(
        'If 90 of 100 later defaults have a collections-call record, that column may produce high retrospective accuracy. Removing it can lower the score while producing a more honest simulation of approval-time performance.',
      ),
    ],
    application: [
      p(
        'A fraud system must use transaction and relationship data available at its alert cutoff. A graph containing connections first discovered after investigation may leak investigator findings into an earlier prediction.',
      ),
      p(
        'A lending dataset may lack outcomes for rejected applicants. A good result among approved borrowers alone does not establish the same performance for every applicant; state the evaluated population.',
      ),
    ],
    checks: [
      [
        'definition',
        'What makes an input leaked?',
        [
          'It uses information unavailable or improper at the decision time',
          'Availability and evaluation roles matter.',
        ],
        ['It has any missing values', 'Missingness can be handled without leakage.'],
        ['It has a small coefficient', 'Coefficient size does not define leakage.'],
      ],
      [
        'definition',
        'What is target leakage?',
        [
          'An input reveals information about the later target',
          'The outcome indirectly becomes an input.',
        ],
        ['A low recall score', 'Recall is an evaluation result.'],
        ['A small training dataset', 'Dataset size is a separate issue.'],
      ],
      [
        'definition',
        'What is a decision cutoff?',
        [
          'The instant determining what evidence may be used',
          'It defines the deployment information set.',
        ],
        [
          'Always the classification probability threshold',
          'A time cutoff and a probability cutoff are different.',
        ],
        ['The largest feature value', 'It is a time/context boundary.'],
      ],
      [
        'mechanism',
        'What should be checked for each feature?',
        ['Its measurement and availability time', 'Evidence must exist before the decision.'],
        [
          'Whether it predicts perfectly, regardless of timing',
          'Perfect retrospective prediction can be caused by leakage.',
        ],
        ['Only its column name', 'Names can hide later information.'],
      ],
      [
        'mechanism',
        'How should imputation values be learned?',
        [
          'From the training partition',
          'Held-out observations must not influence fitted preprocessing.',
        ],
        ['From all rows including final test', 'That contaminates the assessment.'],
        ['From the future outcome column', 'That exposes target information.'],
      ],
      [
        'mechanism',
        'What should happen to duplicate customer identities across splits?',
        [
          'Use a split strategy consistent with the deployment goal',
          'Identity overlap can create an unrealistic evaluation.',
        ],
        ['Ignore them automatically', 'Overlap may inflate results on supposedly new customers.'],
        ['Replace outcomes with customer names', 'Names are not target labels.'],
      ],
      [
        'calculation',
        'Decision time is day 5. A feature first arrives day 8. How late is it?',
        ['3 days', '8 − 5 = 3; it is unavailable at the cutoff.'],
        ['Available 3 days early', 'That reverses the time difference.'],
        ['13 days', 'Adding times does not measure lateness.'],
      ],
      [
        'calculation',
        '90 of 100 defaults have a later collection record. What percentage is that?',
        [
          '90%',
          '90/100 = 90%; the strong relationship still does not make it a valid earlier feature.',
        ],
        ['10%', 'That is the share without the record.'],
        ['9%', 'This misplaces the percentage scale.'],
      ],
      [
        'calculation',
        '20 of 80 evaluation customers also occur in training. What share overlaps?',
        [
          '25%',
          'Divide overlapping evaluation customers by all evaluation customers: 20/80 = 0.25, or 25%.',
        ],
        ['20%', 'This uses a denominator of 100 rather than 80.'],
        ['75%', 'That is the non-overlapping share.'],
      ],
      [
        'application',
        'An approval model uses next year’s collection status. What is the problem?',
        [
          'That status is unavailable at approval',
          'A post-outcome signal cannot be used as an earlier live input.',
        ],
        ['The feature is too interpretable', 'Interpretability is not the issue.'],
        [
          'It must be valid because test accuracy is high',
          'Leakage can produce exactly that pattern.',
        ],
      ],
      [
        'application',
        'A historical graph includes links discovered after investigation. What needs checking?',
        [
          'Whether each link existed and was known at the prediction cutoff',
          'Investigator discoveries may leak later evidence.',
        ],
        ['Only whether the graph has many nodes', 'Size does not address timing.'],
        [
          'Whether every shared link proves fraud',
          'Relationships are investigative signals, not proof.',
        ],
      ],
      [
        'application',
        'Only approved borrowers have repayment outcomes. What limitation should be reported?',
        [
          'Evaluation applies to the observed approved-loan population',
          'Unobserved rejected-applicant outcomes limit transfer.',
        ],
        [
          'The model is proven for all applicants',
          'The evaluated sample does not establish that claim.',
        ],
        [
          'Every rejected applicant must have defaulted',
          'Rejection is an action, not an observed default.',
        ],
      ],
    ],
  },
  {
    slug: 'regularization',
    title: 'Overfitting, regularization, and model complexity',
    prerequisites: ['gradients', 'data-splits'],
    definition:
      'Overfitting learns training-specific detail that does not generalize. Regularization constrains or penalizes model complexity to reduce sensitivity to that detail.',
    precise:
      'A penalized estimator minimizes data loss plus λ times a complexity penalty. L2 uses a sum of squared weights; L1 uses a sum of absolute weights. λ controls penalty strength and is selected using validation.',
    terms: [
      [
        'Overfitting',
        'Strong training fit with poor generalization.',
        'A deep tree memorizes a few unusual training payments.',
      ],
      [
        'Regularization',
        'A restriction or penalty controlling complexity.',
        'Limit tree depth or penalize coefficient magnitudes.',
      ],
      [
        'L2 penalty',
        'Sum of squared penalized coefficients.',
        'Weights 2 and 1 give a penalty of 5.',
      ],
      [
        'Hyperparameter',
        'A setting selected outside ordinary parameter fitting.',
        'Penalty strength λ or maximum tree depth.',
      ],
    ],
    understand: [
      p(
        'A flexible model can reduce training error by fitting quirks and noise. This is useful only if the relationships continue on new observations. Underfitting is the opposite failure: an overly restricted method misses real structure even in training.',
      ),
      p(
        'Regularization does not guarantee good performance. It changes the fitting tradeoff. Data quality, leakage, population changes, and missing signal still matter. Models with different complexity should be compared on held-out data.',
      ),
    ],
    method: [
      p(
        'For weights w₁,w₂, an L2-penalized objective is Ldata + λ(w₁² + w₂²). Ldata is the prediction loss and λ is nonnegative penalty strength. Common implementations may treat intercepts differently; state exactly which parameters are penalized.',
      ),
      p(
        'Tune λ on validation. Increasing λ discourages large penalized weights but does not force all models to become identical. In tree models, minimum leaf size, depth limits, subsampling, and early stopping play related complexity-control roles.',
      ),
    ],
    worked: [
      table(
        ['Model', 'Data loss', 'w₁²+w₂²', 'Objective at λ=0.1'],
        [
          ['A: w=[2,1]', '1.0', '5', '1.0 + 0.5 = 1.5'],
          ['B: w=[1,1]', '1.2', '2', '1.2 + 0.2 = 1.4'],
        ],
      ),
      p(
        'A has lower data loss, but B has the lower penalized objective under this specified λ. Validation still evaluates which fitted model generalizes. If λ = 0, the penalty vanishes and A has the lower objective in this comparison.',
      ),
    ],
    application: [
      p(
        'Credit models often have correlated inputs and limited default events. Controlling complexity may stabilize fitted relationships, but a smaller coefficient does not prove causal importance or fairness.',
      ),
      p(
        'Keep the selection process separate from the final test. Report baseline comparisons and later-data results, not merely the reduction in training loss.',
      ),
    ],
    checks: [
      [
        'definition',
        'What is overfitting?',
        [
          'Learning training-specific detail that transfers poorly',
          'It is a generalization failure.',
        ],
        [
          'Any model with more than one input',
          'Multiple inputs do not automatically imply overfitting.',
        ],
        [
          'A model whose probabilities sum correctly',
          'Probability normalization is a separate property.',
        ],
      ],
      [
        'definition',
        'What is an L2 penalty?',
        ['A sum of squared penalized weights', 'Squaring discourages large magnitudes.'],
        ['The sum of all labels', 'Labels are outcomes rather than parameter magnitudes.'],
        ['The final test error', 'Test error evaluates a fitted method.'],
      ],
      [
        'definition',
        'What is a hyperparameter?',
        ['A development setting such as penalty strength', 'It controls how fitting is performed.'],
        ['The observed label of the newest loan', 'That is an outcome.'],
        ['Always a fitted intercept', 'The intercept is usually an estimated parameter.'],
      ],
      [
        'mechanism',
        'What happens when λ = 0 in a penalized objective?',
        ['The penalty term disappears', 'Zero times the penalty is zero.'],
        ['Every weight becomes zero', 'No penalty does not force zero coefficients.'],
        ['The final test becomes training data', 'The split roles are independent of λ.'],
      ],
      [
        'mechanism',
        'Where should λ be selected?',
        ['Validation', 'It is a model-selection choice.'],
        ['The final test repeatedly', 'That would consume the final assessment.'],
        ['From future unobserved labels', 'Those are unavailable during development.'],
      ],
      [
        'mechanism',
        'Which setting can reduce a tree’s complexity?',
        ['A smaller maximum depth', 'It limits how many sequential splits the tree can use.'],
        [
          'Adding later outcome information',
          'That introduces leakage rather than valid regularization.',
        ],
        ['Always using more leaves', 'More leaves generally increase flexibility.'],
      ],
      [
        'calculation',
        'Weights are 2 and 1. What is their L2 penalty before λ?',
        ['5', 'The L2 penalty sums squared weights: 2² + 1² = 4 + 1 = 5, before multiplying by λ.'],
        ['3', 'That is the sum of magnitudes, an L1 quantity.'],
        ['9', 'That squares the sum rather than summing squares.'],
      ],
      [
        'calculation',
        'Data loss is 1 and penalty is 5 at λ=0.1. What is the objective?',
        ['1.5', '1 + 0.1×5 = 1.5.'],
        ['6', 'This omits the penalty-strength multiplier.'],
        ['0.5', 'This omits the data loss.'],
      ],
      [
        'calculation',
        'A has objective 1.5 and B 1.4. Which is smaller?',
        ['B', '1.4 is below 1.5 for this minimization objective.'],
        ['A', 'A has the larger objective.'],
        [
          'Both because objectives are percentages',
          'These objective values need not be percentages.',
        ],
      ],
      [
        'application',
        'Training performance improves while validation worsens. What is a reasonable next check?',
        ['Complexity control and overfitting', 'The gap suggests training-specific fit.'],
        [
          'Whether to publish training scores alone',
          'That omits the relevant generalization evidence.',
        ],
        [
          'Whether validation labels should become live features',
          'That creates an invalid prediction input.',
        ],
      ],
      [
        'application',
        'Regularization reduces a feature’s coefficient. Does that prove the feature has no causal effect?',
        ['No', 'Predictive coefficient shrinkage does not identify causality.'],
        [
          'Yes, all coefficients are causal effects',
          'A fitted association is not necessarily causal.',
        ],
        [
          'Yes, if the value is rounded to zero',
          'Display rounding cannot establish a causal conclusion.',
        ],
      ],
      [
        'application',
        'How should two complexity settings be compared?',
        ['On the same held-out population and measures', 'This isolates the development choice.'],
        ['Only by which fits training perfectly', 'Perfect training fit may overfit.'],
        ['With a different target for each', 'Different outcomes prevent a fair comparison.'],
      ],
    ],
  },
  {
    slug: 'algorithm-tracing',
    title: 'Trace algorithms and understand computational cost',
    prerequisites: ['notation', 'vectors'],
    definition:
      'An algorithm specifies a sequence of operations. Tracing records the state after each operation so you can explain how inputs become outputs.',
    precise:
      'Pseudocode expresses control flow independently of a programming language. Time complexity describes how operation counts grow with input size; space complexity describes memory growth. Big-O states an asymptotic upper bound under specified assumptions.',
    terms: [
      [
        'State',
        'Values held at a particular step of an algorithm.',
        'Current cluster centers before reassignment.',
      ],
      [
        'Iteration',
        'One repetition of a repeated procedure.',
        'An assignment-and-update cycle in K-means.',
      ],
      [
        'Stopping condition',
        'The rule ending an iterative algorithm.',
        'Stop when assignments stabilize or a maximum count is reached.',
      ],
      [
        'Time complexity',
        'Growth of computational work as problem size increases.',
        'A one-pass sum is O(n).',
      ],
    ],
    understand: [
      p(
        'Read pseudocode as instructions. Identify initialized values, loop order, updates, and stopping conditions. A change to an intermediate variable can affect later operations even if the final formula looks familiar.',
      ),
      p(
        'Big-O is about growth, not exact seconds. Hardware, implementation, constants, and input structure still affect runtime. Training and prediction may have different costs; state which operation is being analyzed.',
      ),
    ],
    method: [
      code('total = 0\nfor x in [2, 4, 6]:\n    total = total + x\nreturn total / 3'),
      p(
        'Record total before and after each addition. This loop makes n additions for n values, so its time grows linearly: O(n). It needs one running accumulator beyond the input, giving O(1) extra space.',
      ),
      p(
        'Comparing every pair of n objects uses n(n − 1)/2 unordered comparisons. This grows as O(n²). A maximum iteration count prevents an iterative teaching algorithm from running indefinitely, but stopping does not by itself prove the optimum has been found.',
      ),
    ],
    worked: [
      table(
        ['Step', 'Input x', 'Total before', 'Total after'],
        [
          ['1', '2', '0', '2'],
          ['2', '4', '2', '6'],
          ['3', '6', '6', '12'],
        ],
      ),
      p(
        'The returned mean is 12/3 = 4. With four objects, all unordered pairs total 4×3/2 = 6; with eight, they total 8×7/2 = 28. Doubling input size can produce much more than twice the work when comparisons are quadratic.',
      ),
    ],
    application: [
      p(
        'For real-time payment screening, a computationally expensive training process may be acceptable if prediction is fast. Measure latency and throughput of the deployed scoring operation separately from offline model fitting.',
      ),
      p(
        'When debugging a portfolio or retrieval calculation, preserve intermediate arrays and explain their shapes and units. A correct-looking final number can hide a mistaken coordinate order or denominator.',
      ),
    ],
    checks: [
      [
        'definition',
        'What is an algorithm trace?',
        [
          'A record of intermediate state as operations execute',
          'It explains the path from inputs to outputs.',
        ],
        ['Only the final answer', 'The intermediate reasoning is missing.'],
        ['A list of feature names without operations', 'That describes inputs, not execution.'],
      ],
      [
        'definition',
        'What is pseudocode?',
        [
          'Language-independent instructions for an algorithm',
          'It communicates control flow without specific syntax requirements.',
        ],
        [
          'A guarantee that code has no bugs',
          'Instructions still need implementation and verification.',
        ],
        ['An evaluation measure', 'Pseudocode describes a procedure.'],
      ],
      [
        'definition',
        'What does O(n) describe?',
        [
          'Work growing at most linearly under the stated analysis',
          'It is a growth bound, not an exact runtime.',
        ],
        ['Exactly n seconds on every computer', 'Big-O does not specify hardware timing.'],
        ['A probability equal to n', 'It is computational notation.'],
      ],
      [
        'mechanism',
        'What should you record while tracing a loop?',
        [
          'The relevant values before and after each update',
          'Those values expose how later steps depend on earlier ones.',
        ],
        ['Only the largest final value', 'That conceals the operations.'],
        ['Only the file name', 'A file name does not describe state changes.'],
      ],
      [
        'mechanism',
        'What keeps an iterative procedure from running indefinitely?',
        [
          'A documented stopping condition or iteration limit',
          'The loop needs an explicit termination rule.',
        ],
        ['Calling it machine learning', 'The label does not stop a loop.'],
        ['Increasing every value forever', 'That may prevent termination.'],
      ],
      [
        'mechanism',
        'Why separate training and inference costs?',
        [
          'They perform different operations and run at different frequencies',
          'Deployment scoring can be cheap even when fitting is expensive.',
        ],
        ['They always take exactly equal time', 'Different procedures need not have equal costs.'],
        ['Only training consumes memory', 'Inference also uses model state and inputs.'],
      ],
      [
        'calculation',
        'A running total processes 2, 4, 6. What is the total after the second item?',
        ['6', 'Start at 0, add 2, then add 4.'],
        ['4', 'This replaces the accumulator rather than adding.'],
        ['12', 'This includes the third item too early.'],
      ],
      [
        'calculation',
        'How many unordered pairs exist among 4 objects?',
        [
          '6',
          'Each object has three possible partners; divide by two to avoid counting each unordered pair twice: 4×3/2 = 6.',
        ],
        ['16', 'This counts ordered pairs and self-pairs.'],
        ['4', 'This counts objects rather than pairs.'],
      ],
      [
        'calculation',
        'A one-pass sum examines 100 items. How many additions does the simple accumulator make?',
        ['100', 'It adds each item once.'],
        ['10,000', 'That would be a nested pairwise loop.'],
        ['1', 'There is one accumulator but many operations.'],
      ],
      [
        'application',
        'Which runtime matters most for an instant payment alert?',
        [
          'Latency of deployed prediction at the required load',
          'The alert deadline applies to the live scoring operation.',
        ],
        ['Only model training duration', 'Training can happen offline.'],
        ['Only the number of lesson pages', 'Page count does not measure scoring work.'],
      ],
      [
        'application',
        'A model is O(n). Can its exact response time be inferred?',
        [
          'No; constants, hardware, and implementation also matter',
          'Growth analysis is useful but does not replace measurement.',
        ],
        ['Yes, it always takes n milliseconds', 'No time unit is specified by Big-O.'],
        ['Yes, it cannot miss a deadline', 'An asymptotic bound does not guarantee capacity.'],
      ],
      [
        'application',
        'A trace stops at its iteration limit. What can you safely claim?',
        [
          'The stopping rule was reached; optimality needs separate evidence',
          'Termination is distinct from finding a global optimum.',
        ],
        ['A global optimum is guaranteed', 'The limit alone does not prove this.'],
        ['The inputs were necessarily invalid', 'A valid iterative procedure can reach its limit.'],
      ],
    ],
  },
];

const labels: Record<QuestionDimension, string> = {
  definition: 'Define the terms',
  mechanism: 'Explain the procedure',
  calculation: 'Trace a small calculation',
  application: 'Apply the concept in finance',
};
export const foundationTopics: TeachingTopic[] = specs.map((s) => {
  const topicId = `foundation:${s.slug}`;
  const lessonIds = {
    definition: `${s.slug}:understand`,
    mechanism: `${s.slug}:method`,
    calculation: `${s.slug}:worked`,
    application: `${s.slug}:apply`,
  };
  const counters: Record<QuestionDimension, number> = {
    definition: 0,
    mechanism: 0,
    calculation: 0,
    application: 0,
  };
  const questions: PracticeQuestion[] = s.checks.map(([dimension, prompt, correct, a, b]) => {
    const i = counters[dimension]++;
    const role = (['guided', 'practice', 'review'] as const)[i];
    return {
      id: `${topicId}:${dimension}:${role}`,
      topicId,
      objectiveId: `${topicId}:${dimension}`,
      dimension,
      role,
      difficulty: i === 0 ? 'introductory' : i === 1 ? 'standard' : 'challenge',
      prompt,
      choices: [correct, a, b].map(([text, explanation], j) => ({
        id: `choice-${j}`,
        text,
        explanation,
      })),
      correctChoiceId: 'choice-0',
      hint: `Review “${labels[dimension]}” below. ${dimension === 'calculation' ? 'Write each intermediate operation and check its units before choosing.' : 'Use the precise definition and the worked example, rather than an unrelated policy assumption.'}`,
      explanation: correct[1],
      lessonId: lessonIds[dimension],
    };
  });
  return {
    id: topicId,
    kind: 'foundation',
    slug: s.slug,
    title: s.title,
    definition: s.definition,
    preciseDefinition: s.precise,
    prerequisites: s.prerequisites,
    terms: s.terms.map(([term, definition, example]) => ({ term, definition, example })),
    objectives: (Object.keys(labels) as QuestionDimension[]).map((dimension) => ({
      id: `${topicId}:${dimension}`,
      dimension,
      title: labels[dimension],
      description: `${labels[dimension]} for ${s.title.toLowerCase()}.`,
    })),
    lessons: [
      {
        id: lessonIds.definition,
        title: 'Understand the concept',
        section: 'learn',
        objectiveId: `${topicId}:definition`,
        blocks: s.understand,
      },
      {
        id: lessonIds.mechanism,
        title: 'Follow the procedure',
        section: 'learn',
        objectiveId: `${topicId}:mechanism`,
        blocks: s.method,
      },
      {
        id: lessonIds.calculation,
        title: 'Work through a small example',
        section: 'calculate',
        objectiveId: `${topicId}:calculation`,
        blocks: s.worked,
      },
      {
        id: lessonIds.application,
        title: 'Use it in a financial application',
        section: 'interpret',
        objectiveId: `${topicId}:application`,
        blocks: s.application,
      },
    ],
    questions,
  };
});
