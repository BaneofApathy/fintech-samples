import type { LessonSection } from './lesson-types';
export const notationLessons: LessonSection[] = [
  {
    title: 'Counts, indices, and estimates',
    blocks: [
      {
        kind: 'table',
        headers: ['Notation', 'Read it as', 'Meaning'],
        rows: [
          ['xᵢ', 'x sub i', 'The value of x for observation i.'],
          ['yₜ, yₜ₋₁', 'y at t; y at t minus one', 'Current and previous values in a time series.'],
          ['ŷ, p̂', 'y hat; p hat', 'A prediction or an estimated probability.'],
          ['ȳ', 'y bar', 'The arithmetic mean of the specified y values.'],
          ['s′', 's prime', 'The next state in Q-learning; here the prime is not a derivative.'],
          ['N, n', 'sample count', 'The number of observations included in the stated evaluation.'],
        ],
      },
      {
        kind: 'paragraph',
        text: 'A subscript selects an observation or category. A superscript may be a power or a label, such as “new.” The symbol key tells you which meaning applies.',
      },
    ],
  },
  {
    title: 'Operators: add, divide, and measure change',
    blocks: [
      { kind: 'math', latex: String.raw`\sum_{i=1}^{3}x_i=2+4+6=12,\qquad \frac{6}{20}=0.30`, readAloud: 'Add the three indexed values to get 12. Then divide 6 by the full group of 20: 6 out of 20 is 0.30, or 30 percent.', symbols: [{ symbol: 'x', meaning: 'The value being recorded for each observation.' }, { symbol: 'i', meaning: 'The observation number; the lower and upper bounds show which three observations are included.' }] },
      { kind: 'math', latex: String.raw`(-3)^2=9,\qquad \sqrt{9}=3,\qquad |-3|=3`, readAloud: 'Squaring negative three gives positive nine. The square root of nine reverses that square and returns three. Absolute value measures distance from zero, so negative three has absolute value three.', symbols: [] },
      {
        kind: 'paragraph',
        text: 'Σ means add the indexed values. A fraction divides the numerator by the denominator, so it answers “how much of the whole?” Squaring multiplies a value by itself; the square-root symbol reverses a square. Absolute-value bars measure distance from zero and remove the sign. Δx means a change in x, usually new minus old unless another convention is stated.',
      },
    ],
  },
  {
    title: 'Logarithms, sets, and conditions',
    blocks: [
      {
        kind: 'table',
        headers: ['Notation', 'Meaning'],
        rows: [
          ['eˣ; ln x', 'eˣ grows a starting value by repeated multiplication; ln reverses that operation. For example, e⁰ = 1 and ln(1) = 0.'],
          ['log₂ x', 'The power of 2 that gives x. For example, log₂ 8 = 3.'],
          ['max; min', 'Select the largest or smallest of the stated values.'],
          ['1[condition]', 'Count 1 if the condition holds, otherwise 0.'],
          ['⌈x⌉', 'Round upward to an integer: ⌈9.5⌉ = 10.'],
          ['∈; ∩', 'Belongs to a set; the overlap of two sets.'],
          ['|A|; ‖v‖', 'The number of elements in a set; the length of a vector.'],
        ],
      },
      {
        kind: 'paragraph',
        text: 'The symbol > means strictly greater, while ≥ includes equality. A loss equal to a reserve does not breach a rule defined as “strictly greater than the reserve.”',
      },
    ],
  },
  {
    title: 'Percentages, points, and units',
    blocks: [
      {
        kind: 'table',
        headers: ['Expression', 'Meaning'],
        rows: [
          ['0.20 = 20%', 'Twenty out of every hundred.'],
          ['20% to 30%', 'An increase of 10 percentage points.'],
          ['(0.30 − 0.20) / 0.20 = 0.50', 'A 50% relative increase from the old value.'],
          ['1 basis point', '0.01 percentage point, or 0.0001 as a fraction.'],
          ['10 basis points of $1 million', '0.001 × $1,000,000 = $1,000.'],
        ],
      },
      {
        kind: 'paragraph',
        text: 'Use decimals in calculations unless the model specifies percentage-point inputs. In the loan exercise, DTI is entered in percentage points, so a 35% DTI is entered as 35.',
      },
      {
        kind: 'paragraph',
        text: 'MAE keeps the units of the errors: dollar errors average to dollars. Variance has squared units; taking its square root restores the original units. A unitless score such as AUC or F1 is not automatically a probability, profit, or percentage of correct decisions.',
      },
    ],
  },
  {
    title: 'Denominators and conventions',
    blocks: [
      {
        kind: 'list',
        items: [
          'Identify the population: all transactions, actual frauds, alerts, questions, claims, or tool calls.',
          'Check units: dollars, thousands, millions, fractions, or basis points.',
          'State conventions: quantile method, annualization period, and treatment of ties.',
          'Check assumptions: calibration, loss amounts, independent simulation runs, and review effectiveness.',
        ],
      },
      {
        kind: 'paragraph',
        text: 'A zero denominator usually makes a ratio undefined. Report that limitation rather than silently substituting zero unless the evaluation explicitly specifies that convention.',
      },
    ],
  },
];
