import type { LessonBlock } from './lesson-types';
import type {
  PracticeQuestion,
  QuestionDimension,
  TeachingLesson,
  TeachingTopic,
} from './teaching-types';

// Classroom examples are authored independently of the retained exercise and source records.
const p = (text: string): LessonBlock => ({ kind: 'paragraph', text });
const list = (...items: string[]): LessonBlock => ({ kind: 'list', items });
const table = (headers: string[], rows: string[][]): LessonBlock => ({
  kind: 'table',
  headers,
  rows,
});
const code = (text: string): LessonBlock => ({ kind: 'code', code: text, language: 'python' });
const math = (latex: string, readAloud: string, meanings: [string, string][]): LessonBlock => ({
  kind: 'math',
  latex,
  readAloud,
  symbols: meanings.map(([symbol, meaning]) => ({ symbol, meaning })),
});
type QuestionSeed = {
  dimension: QuestionDimension;
  role: PracticeQuestion['role'];
  prompt: string;
  options: [string, string][];
  answer: number;
  hint: string;
  lesson?: string;
};
const q = (
  dimension: QuestionDimension,
  role: PracticeQuestion['role'],
  prompt: string,
  options: [string, string][],
  answer: number,
  hint: string,
  lesson?: string,
): QuestionSeed => ({ dimension, role, prompt, options, answer, hint, lesson });
const route: Record<QuestionDimension, Record<PracticeQuestion['role'], string>> = {
  definition: { guided: 'definition', practice: 'definition', review: 'mechanism' },
  mechanism: { guided: 'mechanism', practice: 'code', review: 'code' },
  calculation: { guided: 'formula', practice: 'tiny-example', review: 'tiny-example' },
  application: { guided: 'financial-example', practice: 'evaluation', review: 'financial-example' },
};
interface TopicSeed {
  slug: string;
  title: string;
  definition: string;
  preciseDefinition: string;
  prerequisites: string[];
  terms: [string, string, string][];
  objectives: [string, string, string, string];
  introduction: LessonBlock[];
  mechanism: LessonBlock[];
  formula: LessonBlock[];
  tiny: LessonBlock[];
  financial: LessonBlock[];
  evaluation: LessonBlock[];
  pseudocode: string;
  walkthrough: [string, string][];
  complexity: string;
  advanced: { title: string; blocks: LessonBlock[] }[];
  questions: QuestionSeed[];
}
function topic(s: TopicSeed): TeachingTopic {
  const id = `algorithm:${s.slug}`;
  const dims: QuestionDimension[] = ['definition', 'mechanism', 'calculation', 'application'];
  const titles = [
    'Define the method and its vocabulary',
    'Trace how the method works',
    'Calculate a small example',
    'Interpret a financial application',
  ];
  const lesson = (
    suffix: string,
    title: string,
    section: TeachingLesson['section'],
    dimension: QuestionDimension,
    blocks: LessonBlock[],
  ): TeachingLesson => ({
    id: `${s.slug}:${suffix}`,
    title,
    section,
    objectiveId: `${s.slug}:${dimension}`,
    blocks,
  });
  const formula = lesson(
    'formula',
    'Read and derive the calculation',
    'formula',
    'calculation',
    s.formula,
  );
  formula.advanced = s.advanced;
  return {
    id,
    kind: 'algorithm',
    slug: s.slug,
    title: s.title,
    definition: s.definition,
    preciseDefinition: s.preciseDefinition,
    prerequisites: s.prerequisites,
    terms: s.terms.map(([term, definition, example]) => ({ term, definition, example })),
    objectives: dims.map((dimension, i) => ({
      id: `${s.slug}:${dimension}`,
      dimension,
      title: titles[i],
      description: s.objectives[i],
    })),
    lessons: [
      lesson('definition', 'Start with the idea and vocabulary', 'intuition', 'definition', [
        p(s.definition),
        p(s.preciseDefinition),
        ...s.introduction,
      ]),
      lesson(
        'mechanism',
        'Follow the mechanism: learning and using it',
        'intuition',
        'mechanism',
        s.mechanism,
      ),
      formula,
      lesson('tiny-example', 'Hand trace a tiny example', 'worked', 'calculation', s.tiny),
      lesson(
        'financial-example',
        'Work through a financial example',
        'worked',
        'application',
        s.financial,
      ),
      lesson(
        'evaluation',
        'Interpret performance and limitations',
        'measures',
        'application',
        s.evaluation,
      ),
      lesson('code', 'Read the algorithm as code', 'defend', 'mechanism', [
        p(
          'This teaching pseudocode exposes the operations. Read each line with the traced examples; it is not a complete production implementation.',
        ),
        code(s.pseudocode),
        table(['Operation', 'Why it is there'], s.walkthrough),
        p(s.complexity),
      ]),
    ],
    questions: s.questions.map((seed) => {
      const correct = seed.options[seed.answer];
      const questionId = `${s.slug}:${seed.dimension}:${seed.role}`;
      // Stable, varied answer positions prevent "always pick the first choice" learning.
      const position =
        [...questionId].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0) %
        seed.options.length;
      const offset = (seed.answer - position + seed.options.length) % seed.options.length;
      const options = [...seed.options.slice(offset), ...seed.options.slice(0, offset)];
      return {
        id: questionId,
        topicId: id,
        objectiveId: `${s.slug}:${seed.dimension}`,
        dimension: seed.dimension,
        role: seed.role,
        difficulty:
          seed.role === 'guided'
            ? 'introductory'
            : seed.role === 'practice'
              ? 'standard'
              : 'challenge',
        prompt: seed.prompt,
        choices: options.map(([text, explanation], i) => ({
          id: `choice-${i + 1}`,
          text,
          explanation,
        })),
        correctChoiceId: `choice-${position + 1}`,
        hint: seed.hint,
        explanation: correct[1],
        lessonId: `${s.slug}:${seed.lesson ?? route[seed.dimension][seed.role]}`,
      };
    }),
    pseudocode: s.pseudocode,
    codeWalkthrough: s.walkthrough.map(([operation, explanation]) => ({ operation, explanation })),
    complexity: s.complexity,
  };
}

const logistic = topic({
  slug: 'logistic-regression',
  title: 'Logistic regression',
  definition:
    'Logistic regression learns how known features change the probability of a binary outcome. It adds weighted evidence on a log-odds scale, then converts that score into a probability.',
  preciseDefinition:
    'A binary generalized linear model uses a linear predictor z = β₀ + βᵀx and the logistic link p = 1/(1 + exp(−z)). Parameters are commonly fitted by minimizing binary cross-entropy, optionally with a penalty on coefficients.',
  prerequisites: [
    'notation',
    'probability',
    'logarithms',
    'gradients',
    'data-splits',
    'regularization',
  ],
  terms: [
    [
      'Feature',
      'A measured input available when scoring the case.',
      'Debt-to-income ratio measured at the loan application.',
    ],
    [
      'Label',
      'The observed outcome used during supervised training.',
      'Default within one year is encoded as y = 1.',
    ],
    [
      'Intercept',
      'The score when all supplied features equal zero.',
      'β₀ = −1 is the starting log-odds in the tiny model.',
    ],
    [
      'Coefficient',
      'The change in log-odds per one-unit feature increase, holding other supplied features fixed.',
      'β = 0.5 adds 0.5 to z when x rises by one.',
    ],
    [
      'Odds',
      'Probability of the event divided by probability of its complement.',
      'p = 0.2 gives odds 0.2/0.8 = 0.25.',
    ],
    ['Logit', 'The natural logarithm of the odds.', 'p = 0.5 gives logit ln(1) = 0.'],
    [
      'Cross-entropy',
      'Loss that penalizes low probability assigned to the observed outcome.',
      'For y = 1 and p = 0.5 the loss is −ln(0.5).',
    ],
    [
      'Decision threshold',
      'A cutoff that turns a score into an action.',
      'Flag a hypothetical loan for review when p ≥ 0.15.',
    ],
  ],
  objectives: [
    'Distinguish features, labels, log-odds, probability, and a decision threshold.',
    'Explain cross-entropy fitting, one gradient update, and inference on an unseen applicant.',
    'Compute a weighted score, odds, sigmoid probability, and expected loss.',
    'Use probability and loss severity to interpret a lending review decision.',
  ],
  introduction: [
    p(
      'Binary means two labelled outcomes, such as default/no default within a specified year. “Positive” means the designated event; it does not mean desirable. The model needs labelled historical applicants during training. At inference, it needs only the new applicant’s features.',
    ),
    p(
      'Linear describes the score before conversion. A straight-line change in log-odds does not create a constant change in probability. Near the extremes the sigmoid changes slowly; around 50% it changes more quickly. A coefficient therefore is not a percentage-point effect.',
    ),
    table(
      ['Quantity', 'Meaning', 'Example'],
      [
        ['z', 'Unbounded log-odds score', '0'],
        ['exp(z)', 'Event odds', '1 to 1'],
        ['p', 'Estimated event probability', '0.5'],
        ['Action', 'Separate policy result', 'Review if p ≥ cutoff'],
      ],
    ),
  ],
  mechanism: [
    list(
      'Define the label and decision-time features; split past training, validation, and final test cases.',
      'Compute each training score and probability using current coefficients.',
      'Compare probabilities with the known labels through cross-entropy.',
      'Calculate gradients and update parameters to reduce the loss; repeat until a stopping rule is reached.',
      'Choose settings on validation data; evaluate calibration and errors on untouched cases.',
      'For a new applicant, apply the same feature preparation and compute one score and sigmoid. Do not refit on that applicant.',
    ),
    p(
      'For one example the derivative of cross-entropy with respect to the score is p − y. A feature coefficient receives (p − y)x. If the event occurred and p is too small, this gradient is negative for a positive feature; subtracting it raises the coefficient. Full-batch training averages these contributions across examples.',
    ),
    p(
      'Scaling changes what a one-unit coefficient means. Learn scaling and imputation from training data only. Regularization discourages excessively large fitted coefficients; it controls sensitivity to the sample rather than supplying missing evidence.',
    ),
  ],
  formula: [
    math(
      String.raw`z=\beta_0+\sum_{j=1}^{d}\beta_jx_j,\quad o=e^z,\quad p=\frac{o}{1+o}=\frac{1}{1+e^{-z}}`,
      'Add the intercept and weighted features to get log-odds z. Exponentiate to get odds o, then divide those odds by one plus the odds to obtain probability p.',
      [
        ['z', 'Log-odds score.'],
        ['β₀', 'Intercept.'],
        ['βⱼ', 'Coefficient of feature j.'],
        ['xⱼ', 'Feature j in its stated units.'],
        ['d', 'Number of features.'],
        ['o', 'Event odds p/(1−p).'],
        ['p', 'Event probability.'],
        ['e', 'Base of natural logarithms.'],
      ],
    ),
    math(
      String.raw`\ell=-y\ln p-(1-y)\ln(1-p),\qquad \beta_j^{new}=\beta_j-\alpha(p-y)x_j`,
      'Select the negative log probability of the outcome that happened. For a coefficient update, subtract learning rate times prediction error times its feature value. Use x₀ = 1 for the intercept.',
      [
        ['ℓ', 'One-example binary cross-entropy.'],
        ['y', 'Observed label, either zero or one.'],
        ['p', 'Predicted probability.'],
        ['ln', 'Natural logarithm.'],
        ['βⱼ', 'Current coefficient.'],
        ['βⱼ new', 'Coefficient after this update.'],
        ['α', 'Positive learning rate.'],
        ['xⱼ', 'Feature value; x₀ is one.'],
      ],
    ),
    p(
      'The sigmoid follows by solving p/(1−p) = exp(z): multiply to get p = exp(z)(1−p), collect p terms, and divide. The update is a teaching version for one example without regularization; real optimization usually combines many examples.',
    ),
  ],
  tiny: [
    p(
      'Use one feature x = 2, intercept −1, slope 0.5, and observed label y = 1. The feature has no financial units.',
    ),
    table(
      ['Operation', 'Arithmetic', 'Result'],
      [
        ['Score', '−1 + 0.5 × 2', '0'],
        ['Odds', 'exp(0)', '1'],
        ['Probability', '1/(1 + exp(0))', '0.5'],
        ['Loss', '−ln(0.5)', '0.6931'],
      ],
    ),
    p(
      'With learning rate 0.1, the intercept gradient is 0.5 − 1 = −0.5 and the slope gradient is −0.5 × 2 = −1. The new intercept is −1 − 0.1(−0.5) = −0.95; the new slope is 0.5 − 0.1(−1) = 0.6. The new score is −0.95 + 0.6 × 2 = 0.25, probability 0.5622, and loss 0.5759. The update moves probability toward the observed event.',
    ),
    p(
      'This demonstrates one optimization step, not a fitted lending model. A single observed event does not require a final probability of one: many training cases, contradictory outcomes, and regularization shape the final coefficients.',
    ),
  ],
  financial: [
    p(
      'Use z = −3 + 0.04 DTI + 1.2 D − 0.03 I. DTI is measured in percentage points; D indicates a past delinquency (0 or 1); I is annual income in thousands of dollars. Use these coefficients for this example.',
    ),
    table(
      ['Input or operation', 'Value'],
      [
        ['DTI', '35, meaning 35%'],
        ['D', '1'],
        ['I', '40, meaning $40,000'],
        ['z', '−3 + 1.4 + 1.2 − 1.2 = −1.6'],
        ['Odds', 'exp(−1.6) ≈ 0.2019'],
        ['Probability', '1/(1 + exp(1.6)) ≈ 0.1680'],
      ],
    ),
    p(
      'A $10,000 exposure with loss given default 0.40 loses $4,000 if default occurs. Expected loss is 0.1679816 × $4,000 ≈ $671.93 over the model’s defined period. Under this hypothetical policy, p ≥ 0.15 triggers review, so this application is reviewed. Review is a request for more evidence, not certainty about default.',
    ),
    p(
      'Using DTI = 0.35 would be a unit error: this coefficient expects 35. Expected loss is an average across comparable exposures. It is neither a realized bill nor a full profit calculation, which also needs interest, funding costs, recoveries, and operating expense.',
    ),
  ],
  evaluation: [
    p(
      'Ranking measures such as ROC-AUC test whether eventual defaults tend to score higher. Calibration asks whether about 10% of comparable loans assigned 10% risk default. Brier score and log loss evaluate probability errors. These are different questions from whether a review policy is financially useful.',
    ),
    p(
      'At a chosen threshold, inspect the confusion matrix and expected cost. A false negative is a default not flagged; a false positive is a repayer flagged. Lowering the cutoff generally increases both capture and review workload. Compare policies on the same later loans and preserve a separate final test set.',
    ),
    list(
      'Interactions or transformed features can enrich the supplied linear predictor.',
      'Separable training data can drive unpenalized coefficients toward very large magnitudes.',
      'A coefficient describes an association in this model; it does not establish causation.',
      'Monitor data availability, calibration, and population shifts after deployment.',
    ),
  ],
  pseudocode:
    'beta = zeros(d + 1)\nfor epoch in range(max_epochs):\n    z = X_with_intercept @ beta\n    p = sigmoid(z)\n    gradient = X_with_intercept.T @ (p - y) / n\n    beta = beta - learning_rate * gradient\n# Inference uses fitted beta; no labels are needed.\np_new = sigmoid(x_new_with_intercept @ beta)\nreview = p_new >= threshold',
  walkthrough: [
    ['Add a column of ones', 'The intercept becomes another coefficient with input one.'],
    ['X @ beta', 'Compute one weighted score per training row.'],
    ['sigmoid(z)', 'Convert scores to probabilities.'],
    ['X.T @ (p − y) / n', 'Average feature-weighted loss gradients.'],
    ['Subtract the gradient step', 'Update fitted coefficients; this belongs to training.'],
    ['p_new ≥ threshold', 'Apply an inclusive decision policy after inference.'],
  ],
  complexity:
    'For n training examples, d features, and E full-batch iterations, dense gradient fitting costs O(E n d). Scoring one case costs O(d). The coefficient vector requires O(d) space; storing dense training inputs requires O(n d).',
  advanced: [
    {
      title: 'Advanced: regularization and geometry',
      blocks: [
        math(
          String.raw`J(\beta)=\frac1n\sum_i\ell_i+\frac\lambda2\sum_{j=1}^{d}\beta_j^2`,
          'Average the individual losses, then add an L2 penalty to slopes. This convention leaves the intercept unpenalized.',
          [
            ['J', 'Penalized training objective.'],
            ['n', 'Training example count.'],
            ['ℓᵢ', 'Cross-entropy for row i.'],
            ['λ', 'Nonnegative penalty strength.'],
            ['βⱼ', 'Slope coefficient; j starts at one.'],
            ['d', 'Feature count.'],
          ],
        ),
        p(
          'For L2 regularization the slope gradient gains λβⱼ. The threshold boundary satisfies z = ln(t/(1−t)), which is a hyperplane in the supplied features. At t = 0.5 it is z = 0. Adding an interaction changes the feature space without turning a coefficient into a causal effect.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What does the score z represent before the sigmoid?',
      [
        [
          'A default probability',
          'The probability is obtained after applying the sigmoid; z can be negative or exceed one.',
        ],
        [
          'Log-odds of the defined event',
          'The predictor is linear on the log-odds scale: exp(z) gives odds.',
        ],
        [
          'The applicant’s realized dollar loss',
          'Dollar loss also needs exposure and loss severity; z has no dollar units.',
        ],
      ],
      1,
      'Ask which quantity can take any real value.',
    ),
    q(
      'definition',
      'practice',
      'If β = 0.5, what does a one-unit feature increase do when other features stay fixed?',
      [
        [
          'Raises probability by 50 percentage points',
          'The coefficient changes the log-odds, and the probability change depends on the starting score.',
        ],
        ['Adds 0.5 to log-odds', 'The feature contribution βx rises by 0.5, so z rises by 0.5.'],
        [
          'Makes the event certain',
          'Finite scores still produce probabilities strictly between zero and one.',
        ],
      ],
      1,
      'Locate the coefficient before the sigmoid.',
    ),
    q(
      'definition',
      'review',
      'Which information is required at inference but not the new applicant’s future outcome?',
      [
        [
          'The new features and fitted coefficients',
          'Inference computes a score from known features and parameters learned earlier.',
        ],
        [
          'The default label for this applicant',
          'The future outcome is unavailable at decision time; requiring it would reveal the answer.',
        ],
        [
          'A fresh coefficient update for this one applicant',
          'A label-free scoring call applies the fitted model rather than retraining it.',
        ],
      ],
      0,
      'Distinguish learning parameters from using them.',
    ),
    q(
      'mechanism',
      'guided',
      'For y = 1 and p = 0.5, what is the score gradient p − y?',
      [
        ['0.5', 'This forgets to subtract the observed label one.'],
        ['−0.5', 'The gradient is 0.5 − 1; a descent step increases the score.'],
        ['1.5', 'Adding the label is not the cross-entropy derivative.'],
      ],
      1,
      'Use predicted probability minus observed label.',
    ),
    q(
      'mechanism',
      'practice',
      'Why does the code divide X.T @ (p − y) by n?',
      [
        [
          'To average training gradient contributions',
          'The objective uses mean loss, so its gradient averages the n rows.',
        ],
        [
          'To convert log-odds into probabilities',
          'The sigmoid performs that conversion; n is the row count.',
        ],
        [
          'To set the decision threshold',
          'The policy cutoff is chosen separately after model fitting.',
        ],
      ],
      0,
      'Match the gradient to mean loss.',
    ),
    q(
      'mechanism',
      'review',
      'Which operation must be repeated during training but is absent from a normal scoring call?',
      [
        ['Computing a weighted sum', 'Both training and inference compute scores.'],
        ['Applying the sigmoid', 'Both phases convert scores to probabilities.'],
        [
          'Updating coefficients from labelled prediction errors',
          'Labels and loss gradients update parameters during training; inference uses fixed parameters.',
        ],
      ],
      2,
      'Look for the operation that needs y.',
    ),
    q(
      'calculation',
      'guided',
      'What probability follows from z = 0?',
      [
        ['0', 'Zero is the log-odds score, not the probability.'],
        [
          '0.5',
          'exp(0) = 1, so 1/(1 + 1) = 0.5; zero log-odds means equally likely event and non-event.',
        ],
        ['1', 'One is the odds at z = 0; equal event and non-event odds imply 50%.'],
      ],
      1,
      'Evaluate the exponential first.',
    ),
    q(
      'calculation',
      'practice',
      'In the tiny update, what is the new slope from β = 0.5, α = 0.1, x = 2, y = 1, p = 0.5?',
      [
        ['0.4', 'This moves against the descent direction by adding the negative gradient.'],
        ['0.55', 'This uses the intercept gradient and omits the feature factor two.'],
        ['0.6', 'The slope gradient is −0.5 × 2 = −1, so 0.5 − 0.1(−1) = 0.6.'],
      ],
      2,
      'Multiply p − y by x before the update.',
    ),
    q(
      'calculation',
      'review',
      'With the updated intercept −0.95 and slope 0.6, what is the score at x = 2?',
      [
        ['0.25', '−0.95 + 0.6 × 2 = −0.95 + 1.2 = 0.25.'],
        ['−0.35', 'This omits multiplication by the input x = 2.'],
        ['1.55', 'The intercept is negative and must be subtracted in the sum.'],
      ],
      0,
      'Add intercept to coefficient times feature.',
    ),
    q(
      'application',
      'guided',
      'A $10,000 exposure has LGD 0.40 and default probability about 0.168. What is expected loss?',
      [
        ['About $672', 'Loss if default occurs is $4,000; probability-weighting gives about $672.'],
        ['$4,000', 'This is loss conditional on default, before weighting by its chance.'],
        ['$1,680', 'This multiplies probability by exposure but omits the 40% loss fraction.'],
      ],
      0,
      'Apply probability to loss if the event occurs.',
    ),
    q(
      'application',
      'practice',
      'Which observation directly checks calibration?',
      [
        ['Defaults rank above repayers most often', 'That checks discrimination or ranking.'],
        [
          'About 10% of many loans assigned 10% risk default',
          'Calibration compares predicted probability with observed frequency among comparable loans.',
        ],
        [
          'Every loan below the cutoff repays',
          'A threshold does not remove uncertainty; lower-risk loans can still default.',
        ],
      ],
      1,
      'Think frequencies within probability bands.',
    ),
    q(
      'application',
      'review',
      'The DTI coefficient expects percentage points. Which input encodes 35% DTI?',
      [
        ['0.35', 'This is a proportion, but the stated model expects percentage-point numbers.'],
        ['35', 'Use 35 because the coefficient was defined per percentage point.'],
        ['3,500', 'Multiplying by 100 again mis-scales the supplied feature.'],
      ],
      1,
      'Read the coefficient’s input units.',
    ),
  ],
});

const trees = topic({
  slug: 'trees-and-forests',
  title: 'Decision trees and random forests',
  definition:
    'A decision tree predicts by routing a case through learned questions. A random forest fits many randomized trees and combines their predictions.',
  preciseDefinition:
    'A classification tree recursively partitions feature space using splits chosen to reduce a node impurity objective. A random forest aggregates trees trained on bootstrap samples with randomized feature candidates at splits; classification may aggregate votes or average class scores, depending on the specified convention.',
  prerequisites: ['probability', 'algorithm-tracing', 'data-splits', 'regularization'],
  terms: [
    [
      'Node',
      'A group of training records or a routing point.',
      'The root holds all eight teaching payments.',
    ],
    ['Split', 'A question that divides a node into child groups.', 'Is the device new?'],
    [
      'Leaf',
      'A final group that supplies a prediction.',
      'Three frauds among four leaf records give an empirical score of 0.75.',
    ],
    [
      'Gini impurity',
      'One minus the sum of squared class proportions.',
      'A 50/50 binary node has Gini impurity 0.5.',
    ],
    [
      'Information gain',
      'Reduction from parent impurity to record-weighted child impurity.',
      'A perfectly separating split reduces Gini by 0.5 in the tiny example.',
    ],
    [
      'Bootstrap sample',
      'A sample of training rows drawn with replacement.',
      'A row can appear twice in one tree’s training sample.',
    ],
    [
      'Feature subsampling',
      'Randomly limit candidate features at a split.',
      'Consider amount and device for one split, but merchant age and velocity for another.',
    ],
    [
      'Out-of-bag record',
      'A training row excluded from a particular tree’s bootstrap sample.',
      'It can help estimate that tree ensemble’s error without scoring the same row in every fitted sample.',
    ],
  ],
  objectives: [
    'Define a node, split, leaf, impurity, bootstrap sample, and forest.',
    'Trace split search, stopping, randomized fitting, and inference.',
    'Calculate weighted Gini gain and average supplied tree scores.',
    'Interpret fraud routing and evaluate a queue separately from score calibration.',
  ],
  introduction: [
    p(
      'Training learns the questions; inference follows the questions already stored. A numeric split can be “amount ≤ $500”; a categorical split might test a device flag. A path is the sequence of answers for one case. The leaf often supplies a class fraction, rather than a certain outcome.',
    ),
    p(
      'A deep tree can form tiny pure leaves that memorize training accidents. Maximum depth, minimum leaf size, and pruning control this. Forests reduce sensitivity to one tree by combining varied trees; averaging many nearly identical trees provides less benefit.',
    ),
    table(
      ['Method', 'How trees relate'],
      [
        ['Single tree', 'One learned partition'],
        ['Random forest', 'Randomized trees fitted in parallel'],
        ['Gradient boosting', 'Trees added in sequence to correct the current model'],
      ],
    ),
  ],
  mechanism: [
    list(
      'At a node, enumerate candidate feature questions and divide its rows.',
      'Compute parent and child impurity; weight each child by its record count.',
      'Choose the largest impurity reduction among permitted splits.',
      'Recurse on children until stopping; store a prediction at each leaf.',
      'For a forest, fit multiple trees using bootstrap rows and randomized feature candidates.',
      'At inference, route the same case down every tree and combine the resulting class scores using the stated rule.',
    ),
    p(
      'Weighted impurity is essential. A child holding one record must not influence the criterion as much as a child holding nine. Impurity reduction is measured on training rows; it is not proof that a split improves later prediction. A leaf fraction may need probability calibration before a business policy treats it as risk.',
    ),
  ],
  formula: [
    math(
      String.raw`G=1-\sum_{c=1}^{C}p_c^2,\quad G_{split}=\sum_j\frac{n_j}{N}G_j,\quad \Delta G=G_{parent}-G_{split}`,
      'Compute each class proportion and subtract the sum of its squares from one. Average child impurities using their fractions of parent records. Subtract this weighted result from parent impurity.',
      [
        ['G', 'Node Gini impurity.'],
        ['C', 'Number of classes.'],
        ['p꜀', 'Class c fraction within this node.'],
        ['nⱼ', 'Child j record count.'],
        ['N', 'Parent record count.'],
        ['Gⱼ', 'Child j impurity.'],
        ['ΔG', 'Training impurity reduction.'],
      ],
    ),
    math(
      String.raw`p_{forest}=\frac1B\sum_{b=1}^{B}p_b`,
      'Add the supplied class scores from B trees and divide by B. This course example averages probabilities or class scores, rather than thresholding each tree into a vote first.',
      [
        ['p_forest', 'Averaged forest class score.'],
        ['B', 'Number of trees.'],
        ['p_b', 'Supplied score from tree b.'],
      ],
    ),
    p(
      'For two classes with proportion p and 1−p, expansion gives G = 1 − p² − (1−p)² = 2p(1−p). It is zero for a pure node and 0.5 at an even mixture. This Gini is distinct from the ranking Gini equal to 2 AUC − 1.',
    ),
  ],
  tiny: [
    p(
      'Four records contain two frauds and two legitimate payments. Candidate A places both frauds left and both legitimate records right. Candidate B puts one of each class in each child.',
    ),
    table(
      ['Candidate', 'Parent G', 'Left G', 'Right G', 'Weighted child G', 'Gain'],
      [
        ['A: pure children', '0.5', '0', '0', '0', '0.5'],
        ['B: mixed children', '0.5', '0.5', '0.5', '0.5', '0'],
      ],
    ),
    p(
      'For A, each child has two of four records: (2/4) × 0 + (2/4) × 0 = 0. For B: (2/4) × 0.5 + (2/4) × 0.5 = 0.5. Select A under this training criterion. The result requires later validation; four records cannot establish robust fraud detection.',
    ),
  ],
  financial: [
    p(
      'Eight payments contain four frauds. A proposed device split has a new-device child with three frauds and one legitimate payment, and a trusted-device child with one fraud and three legitimate payments.',
    ),
    table(
      ['Quantity', 'Arithmetic'],
      [
        ['Parent impurity', '1 − (4/8)² − (4/8)² = 0.5'],
        ['Each child impurity', '1 − (3/4)² − (1/4)² = 0.375'],
        ['Weighted impurity', '(4/8) × 0.375 + (4/8) × 0.375 = 0.375'],
        ['Gain', '0.5 − 0.375 = 0.125'],
        ['Forest score for a new payment', '(0.8 + 0.6 + 0.4)/3 = 0.6'],
      ],
    ),
    p(
      'Under the verification rule score ≥ 0.60, the forest requests verification exactly at 0.60. If each tree were first thresholded into a vote, the answer would be two out of three, about 0.667; that is a different convention and is not used here. Verification can allow a legitimate purchase to complete; a score of 0.6 requires calibration before being described as a 60% fraud chance.',
    ),
  ],
  evaluation: [
    p(
      'At a fixed review capacity, precision@K measures how much confirmed fraud the queue contains and recall@K measures how much total known fraud it captures. PR measures are useful for rare events. Brier score or a calibration curve answers whether forest scores behave like probabilities.',
    ),
    p(
      'Compare a tree, forest, and simple rule on the same later payments. Inspect errors for new devices, changed merchants, and customer subgroups. Feature importance records model reliance; high-cardinality inputs can distort some importance methods, and an important feature need not cause fraud.',
    ),
    p(
      'Forests usually cannot extrapolate a numeric response beyond leaf predictions in the way a linear model can. Out-of-bag estimates are convenient for independent rows, but they do not replace a historical cutoff when transactions are linked across customers or time.',
    ),
  ],
  pseudocode:
    'def grow(rows, depth):\n    if stop(rows, depth):\n        return Leaf(class_fraction(rows))\n    candidates = candidate_splits(rows, random_features())\n    split = max(candidates, key=weighted_impurity_gain)\n    left, right = partition(rows, split)\n    return Node(split, grow(left, depth + 1), grow(right, depth + 1))\nforest = [grow(bootstrap(training_rows), 0) for _ in range(B)]\nscores = [route(tree, new_case).score for tree in forest]\nforest_score = sum(scores) / B',
  walkthrough: [
    ['stop(rows, depth)', 'Stop before empty, too-small, or overly deep child groups.'],
    [
      'candidate_splits',
      'Training evaluates alternative questions rather than accepting the first one.',
    ],
    ['weighted_impurity_gain', 'Record count determines the child contribution.'],
    ['bootstrap and random_features', 'Introduce varied training samples and split choices.'],
    ['route(tree, new_case)', 'Inference follows stored tests without knowing the case’s label.'],
    ['sum(scores)/B', 'Average supplied tree scores before applying any policy cutoff.'],
  ],
  complexity:
    'With pre-sorted numeric features and balanced trees, common fitting work is approximately O(B m n log n) for B trees, n rows, and m candidate features per split; exact implementations differ and highly unbalanced trees can be much more costly. Inference takes O(B H) split tests for maximum depth H. Tree storage grows with the total node count.',
  advanced: [
    {
      title: 'Advanced: entropy and variance reduction',
      blocks: [
        math(
          String.raw`H=-\sum_c p_c\log_2p_c`,
          'Entropy also measures class mixture, assigning zero contribution when a class fraction is zero. A binary 50/50 node has entropy one bit.',
          [
            ['H', 'Node entropy.'],
            ['p꜀', 'Class fraction.'],
            ['log₂', 'Base-two logarithm.'],
          ],
        ),
        p(
          'Bootstrap aggregation is called bagging. Averaging reduces prediction variance most when the individual prediction errors are not perfectly correlated. Feature subsampling aims to make trees differ. Regression trees instead minimize criteria such as squared error, and leaves usually predict a mean numeric response.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'Which part of a tree supplies the final prediction?',
      [
        [
          'The leaf',
          'A leaf is the terminal node reached by following the stored split questions.',
        ],
        [
          'The root always',
          'The root is the initial group; a nontrivial tree continues through child nodes.',
        ],
        [
          'The bootstrap sample',
          'A bootstrap sample supplies training rows, not the final routing location.',
        ],
      ],
      0,
      'Find the terminal group.',
    ),
    q(
      'definition',
      'practice',
      'What makes a bootstrap sample different from ordinary sampling without replacement?',
      [
        ['It excludes every repeated row', 'Bootstrap sampling explicitly permits repetitions.'],
        [
          'It draws training rows with replacement',
          'After each draw the row remains eligible, so some rows repeat and some are absent.',
        ],
        [
          'It uses only test rows',
          'The forest must fit on training rows; using final test data leaks evaluation information.',
        ],
      ],
      1,
      'Ask whether a drawn row can be drawn again.',
    ),
    q(
      'definition',
      'review',
      'A leaf has three frauds among four training payments. What is its empirical fraud fraction?',
      [
        ['0.25', 'This is the legitimate share, one out of four.'],
        [
          '0.75',
          'Three of four leaf records are fraud; calibration still requires separate evidence.',
        ],
        ['3', 'Three is a count; a class fraction divides by leaf size.'],
      ],
      1,
      'Use the records in the leaf as the denominator.',
    ),
    q(
      'mechanism',
      'guided',
      'Why are child impurities weighted by child record counts?',
      [
        [
          'To give each training record equal influence',
          'Weight nⱼ/N makes a child’s contribution proportional to its records.',
        ],
        [
          'To make all leaves have equal size',
          'Weighting evaluates a split; it does not force the partition sizes to match.',
        ],
        [
          'To calibrate the forest probability',
          'A training impurity calculation does not establish probability calibration.',
        ],
      ],
      0,
      'A child with one row should not count as much as one with nine.',
    ),
    q(
      'mechanism',
      'practice',
      'What does route(tree, new_case) do?',
      [
        [
          'Refits the tree using the new outcome',
          'Inference applies existing splits without a future label.',
        ],
        [
          'Follows stored split tests to a leaf',
          'Each answer selects a child until the terminal prediction is reached.',
        ],
        [
          'Averages training impurity values',
          'Impurity chose splits during training; routing obtains a prediction.',
        ],
      ],
      1,
      'Follow the code’s inference path.',
    ),
    q(
      'mechanism',
      'review',
      'Which pair of operations creates varied forest trees?',
      [
        [
          'Bootstrap rows and randomized feature candidates',
          'Both operations diversify trees and can reduce correlated prediction errors.',
        ],
        [
          'Reuse identical rows and always choose the same feature list',
          'This encourages identical trees and less benefit from averaging.',
        ],
        [
          'Threshold each input into fraud/no fraud',
          'Feature thresholding does not define the forest’s sample and feature randomization.',
        ],
      ],
      0,
      'Look at the data and feature choices before each tree grows.',
    ),
    q(
      'calculation',
      'guided',
      'What is binary Gini impurity for an even class mixture?',
      [
        ['0', 'Zero describes a pure node containing only one class.'],
        ['0.5', 'An even mixture has two class shares 0.5, so 1 − 0.5² − 0.5² = 0.5.'],
        ['1', 'One minus only one class square would omit the other class contribution.'],
      ],
      1,
      'Square both class proportions.',
    ),
    q(
      'calculation',
      'practice',
      'The tiny parent has G = 0.5 and both children are pure. What is the gain?',
      [
        ['0', 'The weighted child impurity is zero, but gain subtracts it from the parent.'],
        [
          '0.5',
          'Pure children have zero weighted impurity, so gain is parent 0.5 minus zero, giving 0.5.',
        ],
        ['1', 'The parent’s binary Gini is only 0.5; the gain cannot exceed it.'],
      ],
      1,
      'Subtract child impurity from parent impurity.',
    ),
    q(
      'calculation',
      'review',
      'Each child in tiny Candidate B is 50/50 and has half the rows. What is weighted child impurity?',
      [
        ['0.25', 'This counts only one child; both contributions must be added.'],
        ['0.5', 'Both children contribute half their impurity: 0.5 × 0.5 + 0.5 × 0.5 = 0.5.'],
        ['1', 'Adding child impurities without their weights doubles the correct value.'],
      ],
      1,
      'Add both half-weighted child terms.',
    ),
    q(
      'application',
      'guided',
      'Scores 0.8, 0.6, and 0.4 are averaged. Does score ≥ 0.60 request verification?',
      [
        [
          'Yes: mean score is exactly 0.60',
          'The mean is 1.8/3 = 0.6, and the inclusive comparison accepts equality.',
        ],
        ['No: equality never qualifies', 'The specified rule uses ≥ rather than >.'],
        ['Yes: the score is 0.8', 'The first tree’s score does not replace the forest average.'],
      ],
      0,
      'Calculate the mean, then inspect the inequality.',
    ),
    q(
      'application',
      'practice',
      'Investigators can review 100 cases. Which measure directly describes fraud concentration in those cases?',
      [
        [
          'Precision@100',
          'Its denominator is the first 100 reviews; it measures how many contain confirmed fraud.',
        ],
        [
          'Gini impurity at the training root',
          'Impurity describes a training group, not confirmed fraud in the deployed queue.',
        ],
        ['Tree depth', 'Depth counts routing questions and is not a queue outcome rate.'],
      ],
      0,
      'Use a measure whose denominator is review capacity.',
    ),
    q(
      'application',
      'review',
      'Why is the forest’s 0.60 score not automatically a 60% fraud probability?',
      [
        [
          'Any averaged score must equal observed frequency',
          'Averaging alone does not establish agreement with observed outcomes.',
        ],
        [
          'Calibration must be checked on comparable held-back cases',
          'Predicted probabilities need frequency checks beyond training fractions and averaging.',
        ],
        [
          'Scores above 0.5 cannot be probabilities',
          'A valid probability can exceed 0.5; the issue is calibration evidence.',
        ],
      ],
      1,
      'Separate the arithmetic score from its empirical interpretation.',
    ),
  ],
});

const boosting = topic({
  slug: 'gradient-boosting',
  title: 'Gradient boosting',
  definition:
    'Gradient boosting builds a prediction in stages. Each new weak model is fitted to a loss-specific correction and added to the current model with a learning rate.',
  preciseDefinition:
    'Gradient boosting performs stagewise optimization in function space: fit a base learner to negative derivatives of the selected loss with respect to current predictions, then add a scaled contribution. Squared-error loss gives residual corrections; classification losses generally produce a different target.',
  prerequisites: ['gradients', 'algorithm-tracing', 'probability', 'data-splits', 'regularization'],
  terms: [
    [
      'Weak learner',
      'A deliberately limited component predictor.',
      'A shallow tree provides one correction.',
    ],
    [
      'Residual',
      'Observed numeric target minus current prediction.',
      'Actual 3 minus prediction 2 gives residual 1.',
    ],
    [
      'Negative gradient',
      'Direction that locally reduces the selected loss.',
      'For binary cross-entropy on a logit, y − p is the negative score gradient.',
    ],
    [
      'Learning rate',
      'Fraction of a new learner’s correction added.',
      'η = 0.5 adds half the correction.',
    ],
    [
      'Stage',
      'One successive contribution to the combined model.',
      'The second tree uses errors remaining after the first.',
    ],
    [
      'Early stopping',
      'Stop adding learners when validation loss no longer improves under a stated patience rule.',
      'Keep the best validation stage instead of the final attempted stage.',
    ],
    [
      'Logit',
      'Log-odds score converted to probability by a sigmoid.',
      'F = −1.6 gives probability about 0.168.',
    ],
  ],
  objectives: [
    'Define boosting, residual, negative gradient, weak learner, and learning rate.',
    'Trace the sequential fitting loop and distinguish it from forest averaging.',
    'Compute two correction stages and convert a classification logit to probability.',
    'Interpret a boosted credit-risk score and compare models under common evaluation conditions.',
  ],
  introduction: [
    p(
      'A forest fits varied trees independently and averages them. Boosting fits the next tree after inspecting the current combined model. Earlier trees remain in the sum; a new tree does not replace them. The target and loss determine what “needs correction” means.',
    ),
    p(
      'For regression with squared error, an underestimated value has a positive residual, so the next learner should raise its prediction. For a binary event, the combined score can be a logit and the loss can be cross-entropy. Fitting an event label minus a raw logit is not the correct cross-entropy gradient.',
    ),
  ],
  mechanism: [
    list(
      'Choose a target, loss, initial constant prediction, learning rate, and component model.',
      'Predict every training row with the current sum.',
      'Calculate negative loss gradients for those rows.',
      'Fit a small tree to those correction targets, possibly with a loss-specific leaf calculation.',
      'Add learning rate times that tree to the current model.',
      'Repeat while monitoring validation loss; choose a stopping stage without using final test outcomes.',
    ),
    p(
      'At inference, evaluate the stored initial prediction and every retained learner. No residual can be calculated because the new case’s outcome is unknown. For a logit-based classifier, apply the sigmoid only after summing the contributions.',
    ),
    p(
      'A small learning rate often needs more stages. Changing it during training also changes the errors later trees see. Comparing two rates while freezing supplied corrections, as a teaching exercise does, illustrates arithmetic but does not reproduce refitting.',
    ),
  ],
  formula: [
    math(
      String.raw`r_{im}=-\left.\frac{\partial\ell(y_i,F)}{\partial F}\right|_{F=F_{m-1}(x_i)},\qquad F_m(x)=F_{m-1}(x)+\eta h_m(x)`,
      'Differentiate the selected loss at each row’s current prediction and reverse the sign to obtain correction targets. Fit the next learner h to those targets, then add its scaled output.',
      [
        ['rᵢₘ', 'Correction target for row i at stage m.'],
        ['ℓ', 'Selected training loss.'],
        ['yᵢ', 'Observed target.'],
        ['F', 'Prediction or logit in the loss.'],
        ['Fₘ', 'Combined predictor after stage m.'],
        ['xᵢ', 'Features for row i.'],
        ['η', 'Learning rate.'],
        ['hₘ', 'New component learner.'],
      ],
    ),
    math(
      String.raw`\ell=\tfrac12(y-F)^2\Rightarrow r=y-F,\qquad \ell_{binary}\Rightarrow r=y-p,\quad p=\sigma(F)`,
      'Differentiating half the squared error gives F minus y, so reversing its sign gives the residual y minus F. For binary cross-entropy on a logit, the correction target is y minus sigmoid probability.',
      [
        ['ℓ', 'Loss on one row.'],
        ['y', 'Numeric target or binary label.'],
        ['F', 'Current numeric prediction or logit.'],
        ['r', 'Negative gradient.'],
        ['p', 'Sigmoid event probability.'],
        ['σ', 'Logistic sigmoid.'],
      ],
    ),
  ],
  tiny: [
    p(
      'Two observed values are 1 and 3. Start with their mean F₀ = 2. Use η = 0.5 and a learner that reproduces each supplied correction exactly.',
    ),
    table(
      ['Stage', 'Predictions', 'Targets for the next learner', 'Sum of squared errors'],
      [
        ['Start', '[2, 2]', '[−1, 1]', '1 + 1 = 2'],
        ['First correction', '[2 − 0.5, 2 + 0.5] = [1.5, 2.5]', '[−0.5, 0.5]', '0.25 + 0.25 = 0.5'],
        [
          'Second correction',
          '[1.5 − 0.25, 2.5 + 0.25] = [1.25, 2.75]',
          '[−0.25, 0.25]',
          '0.0625 + 0.0625 = 0.125',
        ],
      ],
    ),
    p(
      'The second targets use the current predictions, not the original [2, 2]. This is why stages are sequential. The training error fell, but the toy learner exactly identifying these two rows does not demonstrate generalization.',
    ),
  ],
  financial: [
    p(
      'Use initial logit F₀ = −2, learning rate η = 0.25, and two already-fitted tree outputs h₁ = 1.2 and h₂ = 0.4.',
    ),
    table(
      ['Operation', 'Result'],
      [
        ['First stage', '−2 + 0.25 × 1.2 = −1.7'],
        ['Second stage', '−1.7 + 0.25 × 0.4 = −1.6'],
        ['Default probability', 'sigmoid(−1.6) ≈ 0.1680'],
        ['Hypothetical review cutoff', '0.1680 ≥ 0.15, so review'],
      ],
    ),
    p(
      'Both contributions adjust a logit; adding 1.2 directly to probability would be incorrect. A $5,000 conditional default loss produces expected loss about 0.1679816 × $5,000 = $839.91 under these assumptions. Different applicants follow different tree paths and receive different corrections.',
    ),
    p(
      'If η were 0.10 and these same supplied outputs were held fixed, F would be −2 + 0.12 + 0.04 = −1.84, probability about 0.1371. Refitting with η = 0.10 can yield different later trees, so this comparison describes arithmetic only.',
    ),
  ],
  evaluation: [
    p(
      'Compare boosted trees and logistic regression on the same time split, labels, and decision-time features. ROC-AUC assesses ranking, PR or top-K measures assess rare-event capture, and calibration/Brier/log loss assess probability quality. A small AUC increase need not improve a lending policy.',
    ),
    p(
      'Inspect learning curves: training loss can keep falling while validation loss rises. Early stopping and shallow trees control complexity; repeated hyperparameter searching can also overfit validation data. Feature attribution explains this fitted model’s score, not causal effects.',
    ),
    p(
      'Dollar cost and review capacity must be compared under identical policies. A challenger can improve ranking yet give poorer probabilities, require expensive operations, or fail on a changed applicant population.',
    ),
  ],
  pseudocode:
    'F = initial_constant(training_labels)\nlearners = []\nfor stage in range(max_stages):\n    correction = negative_loss_gradient(y, F)\n    tree = fit_small_tree(X, correction)\n    F = F + eta * tree.predict(X)\n    learners.append(tree)\n    track_validation_loss(learners)\nlearners = keep_best_validation_stage(learners)\nnew_score = initial_constant + sum(eta * t.predict(x_new) for t in learners)',
  walkthrough: [
    [
      'initial_constant',
      'A mean is suitable for squared error; binary log loss commonly starts with the label prevalence logit.',
    ],
    ['negative_loss_gradient', 'The correction depends on the loss and the current predictor.'],
    [
      'fit_small_tree',
      'The new model approximates correction targets instead of refitting the entire ensemble.',
    ],
    ['F + eta × prediction', 'Retain earlier stages and add a scaled correction.'],
    [
      'keep_best_validation_stage',
      'Use validation to choose complexity while reserving final test data.',
    ],
    [
      'Sum at inference',
      'All retained learners contribute; no new labels or gradients are needed.',
    ],
  ],
  complexity:
    'For M balanced shallow trees, n rows, and d considered features, typical tree-fitting work is approximately O(M d n log n), with implementation-specific sorting and histogram methods. Stages are sequential, although work within a stage can be parallelized. Inference takes O(M H) split tests for depth H.',
  advanced: [
    {
      title: 'Advanced: leaf values and function-space steps',
      blocks: [
        p(
          'A tree need not match every negative gradient exactly. It partitions rows and chooses leaf outputs that reduce the original objective. Some implementations use second derivatives for Newton-style leaf updates and penalties on tree complexity. The simple residual trace illustrates the organizing idea rather than every library’s leaf formula.',
        ),
        p(
          'For binary labels the initial logit of prevalence π is ln(π/(1−π)), when 0 < π < 1. A score update can be large on the logit scale while having a small probability effect near zero or one. Class weights also change the fitted objective and may change calibration.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What is a residual under squared-error regression?',
      [
        [
          'Actual target minus current prediction',
          'The residual y − F points toward the observed numeric value.',
        ],
        [
          'Current prediction minus actual target',
          'That is the opposite sign; it is the loss derivative rather than its negative.',
        ],
        [
          'Probability minus threshold',
          'That describes a policy margin, not a regression residual.',
        ],
      ],
      0,
      'Which correction raises an underestimated prediction?',
    ),
    q(
      'definition',
      'practice',
      'What does η = 0.25 mean in a boosting update?',
      [
        [
          'Use only one quarter of the new learner’s correction',
          'The contribution is ηh, so the current score receives 25% of h.',
        ],
        ['Keep one quarter of the training rows', 'Row subsampling is a different parameter.'],
        [
          'Set every probability to 25%',
          'The learning rate scales corrections, not the final predicted probabilities.',
        ],
      ],
      0,
      'Locate η next to h in the update.',
    ),
    q(
      'definition',
      'review',
      'Why does classification boosting generally not use y − F when F is a logit?',
      [
        [
          'Every classifier must use raw numeric residuals',
          'Correction targets derive from the chosen loss.',
        ],
        [
          'Cross-entropy’s negative logit gradient is y − sigmoid(F)',
          'The gradient uses probability p, while F remains the score being updated.',
        ],
        [
          'Logits are already labels',
          'Logits are continuous scores; labels are observed outcomes.',
        ],
      ],
      1,
      'Apply the loss derivative on the correct score scale.',
    ),
    q(
      'mechanism',
      'guided',
      'Which prediction is used to fit the second correction tree?',
      [
        [
          'The current ensemble after the first update',
          'The second tree targets what remains wrong after earlier contributions.',
        ],
        [
          'Only the initial constant',
          'That would ignore the first correction and would not be stagewise boosting.',
        ],
        [
          'The final test outcomes directly',
          'Final test data must remain outside model fitting and tuning.',
        ],
      ],
      0,
      'Earlier trees remain in the combined predictor.',
    ),
    q(
      'mechanism',
      'practice',
      'What must a scoring call do with the retained boosting trees?',
      [
        [
          'Average their outputs and discard the initial score',
          'This is not the specified additive boosting rule.',
        ],
        [
          'Add their scaled outputs to the initial score',
          'Inference uses the same sum learned during training, followed by any required link function.',
        ],
        [
          'Fit a new tree to the applicant’s residual',
          'The applicant’s future label is unknown and no residual is available.',
        ],
      ],
      1,
      'Read the final new_score expression.',
    ),
    q(
      'mechanism',
      'review',
      'Training loss falls but validation loss rises across additional stages. Which choice fits early stopping?',
      [
        [
          'Retain the best validation stage',
          'Validation measures whether added complexity helps on held-back data.',
        ],
        ['Always keep the last stage', 'The last stage can overfit despite lower training loss.'],
        [
          'Choose a stage using the final test loss',
          'That consumes the independent final evaluation and makes it optimistic.',
        ],
      ],
      0,
      'Use validation to choose model complexity.',
    ),
    q(
      'calculation',
      'guided',
      'With F = 2, h = −1, and η = 0.5, what is the updated prediction?',
      [
        ['1', 'This adds the full correction and omits the learning rate.'],
        ['1.5', 'Add half the negative correction: 2 + 0.5 × (−1) = 1.5.'],
        ['2.5', 'The correction is negative, so it lowers rather than raises the score.'],
      ],
      1,
      'Multiply before adding.',
    ),
    q(
      'calculation',
      'practice',
      'After the first tiny stage predicts [1.5, 2.5] for targets [1, 3], what are the new residuals?',
      [
        ['[−1, 1]', 'Those were the initial residuals before the first stage.'],
        ['[−0.5, 0.5]', 'Subtract the current predictions from the two targets.'],
        ['[0.5, −0.5]', 'This reverses actual minus predicted.'],
      ],
      1,
      'Use the updated predictor.',
    ),
    q(
      'calculation',
      'review',
      'The second tiny stage predicts [1.25, 2.75] for [1, 3]. What is the sum of squared errors?',
      [
        ['0.5', 'This adds the absolute errors rather than their squares.'],
        ['0.125', 'Two errors of magnitude 0.25 give 0.0625 + 0.0625.'],
        ['0.0625', 'That counts only one of the two rows.'],
      ],
      1,
      'Square each of the two residuals and add.',
    ),
    q(
      'application',
      'guided',
      'What final logit follows from F₀ = −2, η = 0.25, h₁ = 1.2, and h₂ = 0.4?',
      [
        ['−1.6', '−2 + 0.25 × 1.2 + 0.25 × 0.4 = −1.6.'],
        ['−0.4', 'This adds full tree outputs without applying η.'],
        ['0.168', 'This is approximately the probability after sigmoid, not the logit.'],
      ],
      0,
      'Stay on the score scale during addition.',
    ),
    q(
      'application',
      'practice',
      'A challenger has better AUC but worse calibration. What does this establish?',
      [
        [
          'All financial decisions became cheaper',
          'AUC does not determine dollar cost or calibrated risk.',
        ],
        [
          'Ranking improved while probability agreement worsened',
          'The two metrics evaluate different properties and can move in opposite directions.',
        ],
        [
          'The challenger is impossible mathematically',
          'Improved ordering does not require better numerical probabilities.',
        ],
      ],
      1,
      'Separate order from probability values.',
    ),
    q(
      'application',
      'review',
      'Why can freezing h₁ and h₂ while changing η fail to describe retraining?',
      [
        [
          'Later correction targets depend on earlier η-scaled updates',
          'A different learning rate changes current errors and therefore can change later fitted trees.',
        ],
        ['Learning rate never changes scores', 'It directly scales every added contribution.'],
        [
          'The sigmoid stops working at smaller η',
          'The link function remains valid; the fitted sequence is what changes.',
        ],
      ],
      0,
      'Trace how the next tree gets its targets.',
    ),
  ],
});

const clustering = topic({
  slug: 'k-means',
  title: 'K-means clustering',
  definition:
    'K-means groups numeric observations by repeatedly assigning each one to the nearest center and moving each center to the mean of its assigned observations.',
  preciseDefinition:
    'Lloyd’s K-means algorithm alternates nearest-centroid assignments and arithmetic-mean centroid updates to decrease the within-cluster sum of squared Euclidean distances for a fixed K. It generally reaches a local optimum rather than guaranteeing the global minimum.',
  prerequisites: ['vectors', 'variance', 'algorithm-tracing', 'data-splits'],
  terms: [
    [
      'Cluster',
      'A set of observations assigned to the same group.',
      'Savings rates 5 and 10 can form one teaching cluster.',
    ],
    [
      'Centroid',
      'Coordinate-wise mean of assigned feature vectors.',
      'The mean of 5 and 10 is 7.5.',
    ],
    [
      'Euclidean distance',
      'Straight-line distance between numeric vectors.',
      'In one dimension it is absolute difference.',
    ],
    [
      'Inertia',
      'Sum of squared distances to assigned centroids.',
      'Four offsets of magnitude 0.5 give inertia 1.',
    ],
    [
      'Initialization',
      'Selection of starting centers before iterations.',
      'Start centers at 1 and 8.',
    ],
    [
      'Local optimum',
      'A solution that cannot improve through the current local updates but may not be globally best.',
      'Different starts can produce different final partitions.',
    ],
    [
      'Scaling',
      'Transform features so their numeric magnitudes represent a chosen comparison.',
      'A dollar balance can dominate a fractional savings-rate feature unless scaling is deliberate.',
    ],
    [
      'DBSCAN',
      'Density-based grouping using a neighborhood radius and minimum nearby-point count.',
      'A sparse point can remain noise instead of being forced into a K-means cluster.',
    ],
  ],
  objectives: [
    'Define clusters, centroids, distance, inertia, initialization, and unsupervised learning.',
    'Trace assignment/update iterations and distinguish fitting from assignment of a new point.',
    'Compute centroids, distances, and inertia through two iterations.',
    'Interpret customer grouping while evaluating separation, stability, and usefulness.',
  ],
  introduction: [
    p(
      'Unsupervised means the clustering objective has no target label such as default or repayment. It groups the supplied measurements, not hidden personal traits. Cluster numbers are arbitrary: changing “cluster 1” to “cluster 2” does not change the grouping.',
    ),
    p(
      'Choose what similarity should mean before fitting. K-means uses squared Euclidean distance and tends to favor compact groups. A long curved group, strong outliers, or unequal density can make this representation misleading. K is an input, not an answer automatically discovered.',
    ),
    table(
      ['Method', 'Main choices', 'Treatment of sparse points'],
      [
        ['K-means', 'K and feature scaling', 'Every point is assigned'],
        ['DBSCAN', 'Radius ε and min_samples', 'Some points can be labelled noise'],
      ],
    ),
  ],
  mechanism: [
    list(
      'Select features, scale them consistently, choose K, and initialize K centers.',
      'Assign each observation to the center with smallest distance; use a stated deterministic tie rule.',
      'Recompute each center as the mean of its assigned points.',
      'Repeat assignments and updates until centers or labels stabilize, or an iteration limit is reached.',
      'Try multiple initializations and compare the objective and grouping.',
      'For a new observation, apply fitted scaling and choose its nearest stored centroid without updating those centroids.',
    ),
    p(
      'The mean minimizes squared distance within a fixed group. The assignment step selects the best center given the centers, and the update step selects the best mean given assignments. Each step cannot increase the objective under exact arithmetic; this does not prove global optimality.',
    ),
    p(
      'An empty cluster has no mean. Real implementations must reinitialize it or use a documented alternative. This teaching code calls an explicit handler rather than silently dividing by zero.',
    ),
  ],
  formula: [
    math(
      String.raw`J=\sum_{i=1}^{n}\|x_i-\mu_{a_i}\|^2,\qquad a_i=\arg\min_j\|x_i-\mu_j\|^2,\qquad \mu_j=\frac1{|C_j|}\sum_{i\in C_j}x_i`,
      'Assign each point to its closest center in squared distance. For each nonempty assigned group, average the points to update its center. Add all squared distances to obtain inertia J.',
      [
        ['J', 'Within-cluster sum of squares, or inertia.'],
        ['n', 'Number of observations.'],
        ['xᵢ', 'Feature vector for point i.'],
        ['μⱼ', 'Center of cluster j.'],
        ['aᵢ', 'Assigned cluster index for point i.'],
        ['Cⱼ', 'Indices assigned to cluster j.'],
        ['|Cⱼ|', 'Number of points in cluster j.'],
        ['arg min', 'Index producing the smallest value.'],
        ['‖ ‖²', 'Squared Euclidean length.'],
      ],
    ),
    p(
      'For a one-dimensional group, differentiate Σ(xᵢ − μ)² with respect to μ: the derivative is 2Σ(μ − xᵢ). Setting it to zero gives |C|μ = Σxᵢ, hence the mean. Repeat coordinate by coordinate for vectors.',
    ),
  ],
  tiny: [
    p(
      'Use points [1, 2, 8, 9], K = 2, and starting centers [1, 8]. Ties go to the first center.',
    ),
    table(
      ['Point', 'Distance to 1', 'Distance to 8', 'First assignment'],
      [
        ['1', '0', '7', '1'],
        ['2', '1', '6', '1'],
        ['8', '7', '0', '2'],
        ['9', '8', '1', '2'],
      ],
    ),
    p(
      'Update centers: (1 + 2)/2 = 1.5 and (8 + 9)/2 = 8.5. In the second assignment, the distances are [0.5, 7.5], [0.5, 6.5], [6.5, 0.5], and [7.5, 0.5]. Assignments stay [1, 1, 2, 2], and the second update returns the same centers. The algorithm has stabilized.',
    ),
    p(
      'Final inertia is (1 − 1.5)² + (2 − 1.5)² + (8 − 8.5)² + (9 − 8.5)² = 4 × 0.25 = 1. A new point 5 is exactly 3.5 from both centers; the stated tie rule assigns it to cluster 1 without changing either mean.',
    ),
  ],
  financial: [
    p(
      'Savings rates [5, 10, 25, 30] are entered in percentage points. Start centers [0, 20]. A point at 10 is equally distant from both; ties select cluster 1.',
    ),
    table(
      ['Operation', 'Result'],
      [
        ['First groups', '[5, 10] and [25, 30]'],
        ['Updated centers', '7.5 and 27.5 percentage points'],
        ['New customer at 18', 'Distances 10.5 and 9.5; assign cluster 2'],
        ['Inertia', '4 × (2.5)² = 25 squared percentage points'],
      ],
    ),
    p(
      'The second iteration keeps the same two groups. A bank might name the measured groups lower and higher savings-rate segments and test a service suited to their behavior. The cluster label does not establish income, creditworthiness, customer need, or whether an offer will help.',
    ),
    p(
      'Changing rates to proportions [0.05, 0.10, 0.25, 0.30] would preserve assignments for this one feature but change inertia by a factor of 10,000. With several features, uneven rescaling can change the groups themselves.',
    ),
  ],
  evaluation: [
    p(
      'Inertia always tends to fall as K increases; one center per observation gives zero inertia and may teach nothing useful. Compare silhouette, repeated starts, and stability across months, not only the smallest J. Silhouette compares within-group distance with distance to the nearest other group.',
    ),
    p(
      'Cluster numbers can swap between runs. Compare co-membership or align clusters before treating label changes as instability. Useful separation on a chart does not show that a segment-based offer improves customer outcomes; test the proposed service independently.',
    ),
    p(
      'Feature scaling, duplicate size features, missing values, and outliers can dominate distance. DBSCAN uses density connectivity and can leave noise points unassigned, but its radius and density choices require their own evaluation.',
    ),
  ],
  pseudocode:
    'centers = initialize(X, K)\nfor iteration in range(max_iterations):\n    labels = nearest_center(X, centers, ties="first")\n    new_centers = []\n    for j in range(K):\n        members = X[labels == j]\n        new_centers.append(mean(members) if len(members) else reinitialize_empty(X))\n    if centers_close(centers, new_centers):\n        break\n    centers = new_centers\nnew_label = nearest_center(x_new, centers, ties="first")',
  walkthrough: [
    [
      'initialize(X, K)',
      'Centers are a starting guess; multiple starts help assess local solutions.',
    ],
    ['nearest_center', 'Assignment uses distance, not an unavailable outcome label.'],
    ['mean(members)', 'Update each nonempty center coordinate by coordinate.'],
    ['reinitialize_empty', 'Avoid an undefined mean for an empty group.'],
    [
      'centers_close',
      'A tolerance can stop small numerical changes before a hard iteration limit.',
    ],
    ['new_label', 'Inference assigns a new case using fitted centers without relearning them.'],
  ],
  complexity:
    'For n points, K clusters, d dimensions, and I iterations, direct Lloyd assignment costs O(I n K d); centroid updates cost O(I n d). Stored points use O(n d), labels O(n), and centers O(K d). Assigning one new point costs O(K d).',
  advanced: [
    {
      title: 'Advanced: initialization and density',
      blocks: [
        p(
          'K-means++ chooses spread-out starting centers using squared-distance weighting. It improves initialization but does not eliminate local minima. For DBSCAN, a core point has sufficiently many neighbors within ε; a border point is reached from a core point; a noise point is not density-connected to a core group. Neighborhood boundary and min_samples conventions must be stated.',
        ),
        p(
          'K-means is not a classifier. It can supply descriptive features to a later model, but that model needs independent labelled evaluation. A customer joining a cluster does not inherit every average characteristic of its members.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What is a centroid in K-means?',
      [
        [
          'The mean of the assigned points',
          'K-means updates each center to the coordinate-wise arithmetic mean.',
        ],
        ['Always an observed customer', 'The mean need not equal any existing observation.'],
        [
          'The confirmed outcome label',
          'Clustering has no supervised target label in its objective.',
        ],
      ],
      0,
      'Read the center update.',
    ),
    q(
      'definition',
      'practice',
      'What does inertia measure?',
      [
        [
          'Sum of squared distances to assigned centers',
          'Each point contributes its squared distance within its selected cluster.',
        ],
        ['The number of clusters', 'K is a chosen count; inertia is a distance-based objective.'],
        [
          'Profit from a customer campaign',
          'The geometric objective contains no campaign outcomes or financial value.',
        ],
      ],
      0,
      'Connect inertia to J.',
    ),
    q(
      'definition',
      'review',
      'Which statement distinguishes K-means from DBSCAN?',
      [
        [
          'Both force every point into exactly K groups',
          'DBSCAN need not have K groups and can identify noise.',
        ],
        [
          'K-means uses centers; DBSCAN uses density neighborhoods',
          'Their grouping rules and required parameters differ.',
        ],
        [
          'DBSCAN predicts default labels automatically',
          'Density grouping is unsupervised and does not establish default outcomes.',
        ],
      ],
      1,
      'Compare centers with density connectivity.',
    ),
    q(
      'mechanism',
      'guided',
      'What follows the nearest-center assignment step?',
      [
        [
          'Replace each center by its assigned points’ mean',
          'The update minimizes squared distance for the fixed assignments.',
        ],
        [
          'Assign known fraud labels to every cluster',
          'No labels are required by the K-means fitting loop.',
        ],
        ['Always add another cluster', 'K stays fixed during the stated algorithm.'],
      ],
      0,
      'Follow the alternating loop.',
    ),
    q(
      'mechanism',
      'practice',
      'What should the code do when a cluster has no members?',
      [
        [
          'Compute its mean as zero automatically',
          'Zero is not the mean of an empty set and can create an arbitrary center.',
        ],
        [
          'Use an explicit empty-cluster handler',
          'Reinitialization or another documented rule avoids an undefined update.',
        ],
        [
          'Divide its sum by zero',
          'That produces an invalid center and breaks distance calculations.',
        ],
      ],
      1,
      'Find the len(members) condition.',
    ),
    q(
      'mechanism',
      'review',
      'When assigning a new customer to fitted clusters, which operation is correct?',
      [
        [
          'Find the nearest stored center after fitted scaling',
          'Inference applies the established representation and centers.',
        ],
        [
          'Recompute all centers using the new customer alone',
          'This discards learned group structure and is a different fitting operation.',
        ],
        [
          'Use the customer’s future loan outcome',
          'The grouping objective uses supplied features, not future labels.',
        ],
      ],
      0,
      'Separate assigning from refitting.',
    ),
    q(
      'calculation',
      'guided',
      'What is the center of points 1 and 2?',
      [
        ['1.5', 'The centroid averages the two assigned points: (1 + 2)/2 = 1.5.'],
        ['3', 'Three is the sum; a mean divides by point count.'],
        ['1', 'Choosing the first point is not the mean update.'],
      ],
      0,
      'Average the group.',
    ),
    q(
      'calculation',
      'practice',
      'For [1, 2, 8, 9] and final centers [1.5, 8.5], what is inertia?',
      [
        ['2', 'Two is the total absolute distance, not squared distance.'],
        ['1', 'Four squared offsets of 0.5 give 4 × 0.25 = 1.'],
        ['0', 'Assignments are stable, but points do not coincide exactly with their centers.'],
      ],
      1,
      'Square each final offset.',
    ),
    q(
      'calculation',
      'review',
      'After the first update to [1.5, 8.5], why does the next iteration keep the same centers?',
      [
        [
          'The nearest-center groups remain [1, 2] and [8, 9]',
          'Unchanged groups produce the same means, so this trace has converged.',
        ],
        [
          'K-means always stops after one update',
          'Other data and initial centers can require many iterations.',
        ],
        ['All distances have become zero', 'Each point still has distance 0.5 to its center.'],
      ],
      0,
      'Reassign every point once more.',
    ),
    q(
      'application',
      'guided',
      'A new savings rate of 18 is compared with centers 7.5 and 27.5. Which cluster wins?',
      [
        ['Cluster 1', 'Its distance is 10.5, larger than the other distance.'],
        ['Cluster 2', 'Distance to 27.5 is 9.5, smaller than 10.5.'],
        [
          'Neither: every new point is noise',
          'K-means assigns every point; noise is a DBSCAN concept.',
        ],
      ],
      1,
      'Compute the two absolute differences.',
    ),
    q(
      'application',
      'practice',
      'Why is K = n and inertia zero not automatically a useful segmentation?',
      [
        [
          'Every observation can become its own group',
          'Perfect training compactness can eliminate meaningful shared structure.',
        ],
        [
          'Zero inertia proves financial benefit',
          'The objective contains distances rather than service outcomes.',
        ],
        ['K-means forbids K = n', 'The mathematical objective permits such a degenerate grouping.'],
      ],
      0,
      'Consider what one customer per segment teaches.',
    ),
    q(
      'application',
      'review',
      'Changing one savings-rate feature from percentage points to proportions changes inertia how?',
      [
        [
          'It divides inertia by 10,000',
          'Distances divide by 100, so squared distances divide by 100².',
        ],
        [
          'It leaves inertia numerically unchanged',
          'Assignments can remain the same in one dimension, but the objective’s units change.',
        ],
        [
          'It multiplies inertia by 100',
          'Converting to smaller numbers decreases squared distances instead.',
        ],
      ],
      0,
      'Apply the scale change before squaring.',
    ),
  ],
});

const isolation = topic({
  slug: 'isolation-forest',
  title: 'Isolation Forest',
  definition:
    'Isolation Forest ranks observations by how quickly random partitions can separate them from the other observations. Shorter average isolation paths indicate greater unusualness under the stated score convention.',
  preciseDefinition:
    'An isolation ensemble recursively selects a random feature and a random split within its observed range on subsampled data. It aggregates isolation path lengths and can normalize them using an expected path length to form an anomaly score. This unsupervised score is not a calibrated probability of fraud.',
  prerequisites: ['probability', 'logarithms', 'algorithm-tracing', 'data-splits'],
  terms: [
    [
      'Anomaly',
      'An observation unusual relative to the selected representation and reference data.',
      'A very large payment may be unusual but legitimate.',
    ],
    [
      'Isolation path',
      'The sequence of partition edges until a point is alone or the tree stops.',
      'A payment separated by the first split has path length one.',
    ],
    [
      'Random split',
      'A feature boundary sampled rather than optimized against labels.',
      'Choose amount, then draw a cutoff between the current minimum and maximum.',
    ],
    [
      'Subsample',
      'A smaller reference set used to grow one tree.',
      'Trees can be fitted on different samples of historical payments.',
    ],
    [
      'Normalization',
      'Adjust path lengths relative to a reference expectation.',
      'Divide average path length by the supplied positive c.',
    ],
    [
      'Contamination',
      'A setting or assumption about the fraction selected as anomalous.',
      'Selecting the top 1% sets a queue size, not an observed fraud rate.',
    ],
    [
      'Score direction',
      'Whether larger or smaller scores indicate unusualness.',
      'Here s = 2^(−h̄/c) is larger for shorter paths.',
    ],
  ],
  objectives: [
    'Define anomalies, random isolation, path length, normalization, and score direction.',
    'Trace tree growth and scoring without supervised labels.',
    'Compute averaged paths and normalized anomaly scores.',
    'Interpret a transaction ranking and evaluate its investigation queue.',
  ],
  introduction: [
    p(
      'Ordinary observations often remain together through many random partitions. A point far from its neighbors can be separated by a broad range of cutoffs and tends to have a shorter path. Averaging many trees reduces reliance on one lucky cut.',
    ),
    p(
      'The method answers “unusual relative to these features and reference data,” rather than “fraud.” A property sale, tuition payment, or first overseas purchase can be unusual for ordinary reasons. Feature design should use earlier behavior available at the decision time.',
    ),
    p(
      'Different software exposes different score signs and offset conventions. In these lessons higher s means more anomalous. Do not reverse a ranking by copying a library score without checking its documented direction.',
    ),
  ],
  mechanism: [
    list(
      'Sample reference observations for each isolation tree.',
      'At each nonterminal node, select a feature and draw a cutoff between its observed extremes.',
      'Partition observations and repeat until isolated, constant, or at the depth limit.',
      'Route a new case through every fitted tree and count its path length.',
      'Average paths, normalize, and order the anomaly scores.',
      'Choose a review capacity or cutoff, then collect outcomes to evaluate usefulness.',
    ),
    p(
      'Training does not select splits by fraud labels or Gini gain. At scoring time, the new observation follows stored random tests. If a leaf still contains multiple reference observations, standard implementations add an expected remaining path-length correction; the tiny trace below uses fully isolated leaves.',
    ),
    p(
      'An anomaly detector can find new patterns with delayed labels, but it can also waste a review queue on routine rare events. Freeze the historical reference period when evaluating future payments.',
    ),
  ],
  formula: [
    math(
      String.raw`\bar h=\frac1T\sum_{t=1}^{T}h_t,\qquad s=2^{-\bar h/c}`,
      'Average the path lengths across T trees. Divide by the positive normalization constant c, negate the ratio, and raise two to that power. Shorter paths produce larger scores.',
      [
        [
          'hₜ',
          'Isolation path length in tree t, including any specified remaining-path correction.',
        ],
        ['h̄', 'Mean path length.'],
        ['T', 'Number of trees.'],
        ['c', 'Positive normalization supplied for this example.'],
        ['s', 'Anomaly score; higher means more unusual here.'],
      ],
    ),
    p(
      'At h̄ = c, s = 2⁻¹ = 0.5. At h̄ = c/2, s = 2⁻⁰⋅⁵ ≈ 0.7071. Doubling a path does not simply halve its score because the conversion is exponential.',
    ),
  ],
  tiny: [
    p(
      'The scalar points are [1, 2, 3, 10]. A stored first cut at 5 sends 10 alone to the right. On the left, a cut at 1.5 isolates 1; a final cut at 2.5 separates 2 from 3.',
    ),
    table(
      ['Point', 'Routing', 'Path length'],
      [
        ['10', 'Right at 5', '1'],
        ['1', 'Left at 5; left at 1.5', '2'],
        ['2', 'Left at 5; right at 1.5; left at 2.5', '3'],
        ['3', 'Left at 5; right at 1.5; right at 2.5', '3'],
      ],
    ),
    p(
      'With supplied c = 2, point 10 scores 2^(−1/2) = 0.7071, point 1 scores 0.5, and points 2 and 3 score 2^(−3/2) = 0.3536. This is one random tree, so one point being isolated quickly is not conclusive. Repeated independent trees make the average path more dependable.',
    ),
  ],
  financial: [
    p(
      'Three transactions A, B, and C have path lengths [2, 2, 2], [4, 4, 4], and [6, 6, 6] across three already-fitted trees. The supplied normalization is c = 4.',
    ),
    table(
      ['Payment', 'Mean path', 'Score', 'Investigator finding'],
      [
        ['A', '2', '2^(−2/4) = 0.7071', 'Confirmed fraud'],
        ['B', '4', '2^(−4/4) = 0.5', 'Legitimate property payment'],
        ['C', '6', '2^(−6/4) = 0.3536', 'Not selected for the first queue'],
      ],
    ),
    p(
      'Capacity is two reviews, so order A then B and leave C out. The selected queue has precision 1/2 = 50%. If the full labelled period contains three frauds, these two reviews capture recall 1/3 ≈ 33.3%. The anomaly score 0.7071 is not a 70.71% fraud probability.',
    ),
    p(
      'The apparent rarity of B can be explained by its supporting records. Queue outcomes should be compared with an amount rule and random-review baseline at the same capacity; unreviewed outcomes may be delayed or missing.',
    ),
  ],
  evaluation: [
    p(
      'Evaluate confirmed outcomes at the available review capacity rather than interpreting a contamination setting as quality. Precision@K and recall@K describe useful concentration and coverage. Investigation yield depends on which cases were reviewed and how outcomes were confirmed.',
    ),
    p(
      'Measure stability under different seeds, reference samples, and periods. New product launches and legitimate seasonal activity can change unusualness. An anomaly score trained on stale behavior can flag healthy activity and overlook common coordinated fraud.',
    ),
    p(
      'Scaling is less directly tied to distance than in K-means, but feature representation still matters: duplicate fields, transformations, and irrelevant dimensions alter which random partitions are informative.',
    ),
  ],
  pseudocode:
    'def isolate(rows, depth):\n    if len(rows) <= 1 or depth == depth_limit or constant(rows):\n        return Leaf(len(rows))\n    feature = random_nonconstant_feature(rows)\n    cut = uniform(min(rows[feature]), max(rows[feature]))\n    left, right = partition(rows, feature, cut)\n    return Node(feature, cut, isolate(left, depth + 1), isolate(right, depth + 1))\ntrees = [isolate(subsample(reference_rows), 0) for _ in range(T)]\npaths = [corrected_path_length(tree, new_case) for tree in trees]\nscore = 2 ** (-mean(paths) / normalization)',
  walkthrough: [
    [
      'Terminal condition',
      'Single points are isolated; constant features or depth limits also stop splitting.',
    ],
    ['random_nonconstant_feature', 'There is no label-based split optimization.'],
    ['uniform(min, max)', 'The random cut lies within the current feature range.'],
    [
      'subsample(reference_rows)',
      'Each tree learns reference structure from a selected historical sample.',
    ],
    ['corrected_path_length', 'Account for remaining observations when isolation stops early.'],
    [
      'Exponent conversion',
      'Under this convention shorter paths receive higher unusualness scores.',
    ],
  ],
  complexity:
    'With T trees and subsample size ψ, expected fitting work for reasonably balanced random partitions is approximately O(T ψ log ψ); pathological partitions can cost more. Depth-limited scoring costs O(T H) tests per observation for depth limit H. Space grows with the nodes in the sampled trees.',
  advanced: [
    {
      title: 'Advanced: expected-path normalization',
      blocks: [
        math(
          String.raw`c(\psi)=2H_{\psi-1}-\frac{2(\psi-1)}{\psi},\qquad H_m=\sum_{k=1}^{m}\frac1k`,
          'A common normalization uses the harmonic-number expression for expected unsuccessful-search depth. The expression requires a sample size at least two; implementations handle smaller leaves separately.',
          [
            ['c(ψ)', 'Expected-path normalization for sample size ψ.'],
            ['ψ', 'Tree subsample size.'],
            ['Hₘ', 'Harmonic number up to m.'],
            ['k', 'Positive integer index in the harmonic sum.'],
          ],
        ),
        p(
          'The short-path score uses a model of random partition behavior, not a likelihood model for fraud labels. A downstream calibrated risk model would need labelled outcomes and representative validation beyond isolation scoring.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What does a short isolation path indicate?',
      [
        [
          'A point was separated in few random cuts',
          'This is evidence of unusualness relative to the selected reference features.',
        ],
        ['The point is certainly fraud', 'Unusual legitimate events can also isolate quickly.'],
        [
          'A large dollar loss has already occurred',
          'The path is a structural calculation and contains no realized-loss measure.',
        ],
      ],
      0,
      'Count partition steps, not outcomes.',
    ),
    q(
      'definition',
      'practice',
      'What does selecting the top 1% by anomaly score determine?',
      [
        [
          'A review fraction',
          'It selects queue size and does not establish that 1% of the data are fraud.',
        ],
        [
          'A 1% false-positive rate',
          'False-positive rate needs confirmed legitimate labels as its denominator.',
        ],
        ['Perfectly calibrated risk', 'A ranking fraction is not a calibration test.'],
      ],
      0,
      'Separate selection settings from outcome statistics.',
    ),
    q(
      'definition',
      'review',
      'Which definition matches score direction in these lessons?',
      [
        [
          'Larger s means longer paths',
          'The negative exponent makes the score decrease with path length.',
        ],
        [
          'Larger s means shorter paths and greater unusualness',
          'The convention s = 2^(−h̄/c) assigns higher scores to smaller h̄.',
        ],
        [
          'Larger s always means a larger payment amount',
          'Score uses partition paths across the supplied features, not amount alone.',
        ],
      ],
      1,
      'Inspect the negative exponent.',
    ),
    q(
      'mechanism',
      'guided',
      'How does an isolation tree choose a split?',
      [
        ['Optimize fraud-label Gini gain', 'That is a supervised classification-tree mechanism.'],
        [
          'Randomly select a feature and cutoff within its range',
          'Isolation uses randomized partitions without fraud labels.',
        ],
        [
          'Always cut at the mean',
          'A deterministic mean cut is not the random split specified here.',
        ],
      ],
      1,
      'Look for randomness rather than label purity.',
    ),
    q(
      'mechanism',
      'practice',
      'Why can corrected_path_length add a remaining-path term at a terminal leaf?',
      [
        [
          'The leaf may still contain several observations',
          'A depth or constant-feature stop can occur before full isolation, so path correction estimates remaining work.',
        ],
        [
          'To convert every anomaly into fraud',
          'The correction changes normalized path length, not the outcome interpretation.',
        ],
        [
          'To update the observed fraud label',
          'The detector does not require a fraud label to score a case.',
        ],
      ],
      0,
      'Distinguish early stopping from isolation to one point.',
    ),
    q(
      'mechanism',
      'review',
      'At inference, which data are needed to score a new payment?',
      [
        [
          'Stored tree tests and the payment’s known features',
          'The case follows fitted partitions to produce paths; no future label is required.',
        ],
        [
          'Its later chargeback outcome',
          'A chargeback is a future target and would leak unavailable information.',
        ],
        [
          'Only a desired queue precision',
          'Precision is an outcome measure, not enough information to route the payment.',
        ],
      ],
      0,
      'Identify the inputs to corrected_path_length.',
    ),
    q(
      'calculation',
      'guided',
      'What score results when mean path h̄ equals positive c?',
      [
        ['0.5', 'Equal mean path and normalization give ratio one, so the score is 2^(−1) = 0.5.'],
        ['1', 'A score of one corresponds to zero path in this conversion.'],
        ['0', 'A finite negative exponent remains positive.'],
      ],
      0,
      'Substitute h̄/c = 1.',
    ),
    q(
      'calculation',
      'practice',
      'How many cuts isolate point 2 in the tiny tree?',
      [
        ['1', 'The first cut only separates 10 from the other three points.'],
        ['2', 'After two cuts, 2 and 3 remain together.'],
        ['3', 'The cuts at 5, 1.5, and 2.5 finally separate point 2.'],
      ],
      2,
      'Trace the whole route to its leaf.',
    ),
    q(
      'calculation',
      'review',
      'With c = 2, which tiny point receives score about 0.7071?',
      [
        ['10', 'Point 10 isolates after the first cut, giving score 2^(−1/2) ≈ 0.7071 with c = 2.'],
        ['1', 'Point 1 requires two cuts, so its score is 2^(−2/2) = 0.5 rather than 0.7071.'],
        ['2', 'Its path is three, giving about 0.3536.'],
      ],
      0,
      'Find the shortest path.',
    ),
    q(
      'application',
      'guided',
      'Capacity is two reviews and A, B, C score 0.7071, 0.5, 0.3536. Which queue is selected?',
      [
        ['A then B', 'Scores are sorted descending under the stated convention.'],
        ['C then B', 'This reverses the anomaly direction.'],
        [
          'Only A because B is not certainly fraud',
          'Queue selection uses ranking and capacity; certainty is unavailable.',
        ],
      ],
      0,
      'Higher scores rank first.',
    ),
    q(
      'application',
      'practice',
      'One of two selected payments is confirmed fraud. What is queue precision?',
      [
        ['50%', 'Precision divides confirmed fraud by selected reviews: 1/2.'],
        ['33.3%', 'This could be recall if there are three total frauds; its denominator differs.'],
        ['70.71%', 'The leading anomaly score is not a confirmed-outcome rate.'],
      ],
      0,
      'Use reviewed cases as the denominator.',
    ),
    q(
      'application',
      'review',
      'Why can a legitimate property payment enter the unusualness queue?',
      [
        [
          'Rare activity can be legitimate',
          'The reference distribution detects unusual behavior rather than proving a fraud label.',
        ],
        [
          'Every high score is a model bug',
          'A legitimate anomaly is consistent with the detector’s intended objective.',
        ],
        [
          'Review confirms fraud by definition',
          'Review is an evidence-gathering step and can clear a payment.',
        ],
      ],
      0,
      'Recall the distinction between an anomaly and misconduct.',
    ),
  ],
});

const forecasting = topic({
  slug: 'time-series',
  title: 'Time-series forecasting',
  definition:
    'Time-series forecasting predicts future values using ordered historical observations and information available at the forecast time. The horizon, seasonal pattern, and uncertainty are part of the prediction problem.',
  preciseDefinition:
    'A time-series model represents temporal dependence, potentially after differencing and seasonal adjustment. An ARIMA(p,d,q) model uses p autoregressive lags and q lagged innovations on a series differenced d times. Forecast evaluation must respect the chronology and the actual information available at each origin.',
  prerequisites: ['notation', 'variance', 'algorithm-tracing', 'data-splits', 'leakage'],
  terms: [
    [
      'Lag',
      'An earlier observation offset by a specified number of periods.',
      'yₜ₋₁ is the previous daily outflow.',
    ],
    [
      'Horizon',
      'Number of periods between forecast origin and target.',
      'A seven-day-ahead liquidity forecast has horizon seven.',
    ],
    [
      'Trend',
      'A persistent change in level over time.',
      'Settlement volumes can grow over months.',
    ],
    [
      'Seasonality',
      'A pattern recurring at a known period.',
      'Weekday outflows can repeat with period seven.',
    ],
    [
      'Differencing',
      'Subtract an earlier value to transform levels into changes.',
      'Δyₜ = yₜ − yₜ₋₁.',
    ],
    [
      'Innovation',
      'An unpredictable model error given its past information.',
      'The MA component uses lagged innovations, not a simple moving average of levels.',
    ],
    [
      'Stationarity',
      'A stability property of a series distribution or its moments over time.',
      'A stable mean and covariance by lag support weak-stationarity assumptions.',
    ],
    [
      'Forecast origin',
      'The last time whose information is available for a prediction.',
      'Forecast Friday using data known by Thursday evening.',
    ],
  ],
  objectives: [
    'Define time order, lags, horizons, differencing, AR, MA, ARIMA, and seasonality.',
    'Trace fitting and recursive forecasting while maintaining chronological availability.',
    'Compute a differenced autoregressive forecast and a seasonal-naive forecast.',
    'Evaluate settlement forecasts in financial units and interpret reserve planning.',
  ],
  introduction: [
    p(
      'Forecasting is different from randomly labelling independent rows. A model cannot use tomorrow’s outflow to prepare today’s prediction. A one-day forecast and a one-month forecast serve different decisions and should be scored separately.',
    ),
    p(
      'AR means autoregression: use past series values. MA in ARIMA means moving average of innovations: use past prediction shocks. It does not mean taking an ordinary rolling mean of observed levels. Differencing can remove certain trends, but excessive differencing can discard useful structure.',
    ),
    p(
      'A naive baseline repeats the latest value; a seasonal naive baseline repeats the matching position of the last complete season. GARCH models conditional variance or volatility, and is not interchangeable with a mean outflow model.',
    ),
  ],
  mechanism: [
    list(
      'Define sampling frequency, forecast horizon, and which external inputs are available.',
      'Inspect missing dates, trend, seasonality, and historical shifts.',
      'Fit preprocessing and model parameters on past data only.',
      'At a forecast origin, compute the next prediction from stored lags and estimated parameters.',
      'For later horizons, use predicted values where future observed lags are not yet available.',
      'Advance the origin and repeat evaluation; compare with naive baselines at the same horizons.',
    ),
    p(
      'Walk-forward evaluation recreates repeated historical decisions. A validation window selects settings; a final later window checks them independently. When customer flows have delayed reporting, use their publication availability rather than assuming every earlier dated value was known.',
    ),
    p(
      'Residual autocorrelation can reveal missed temporal structure. Prediction intervals express future-value uncertainty, and their coverage must be checked together with width. A confidence interval for a fitted mean is a different object.',
    ),
  ],
  formula: [
    math(
      String.raw`\Delta y_t=y_t-y_{t-1},\quad \widehat{\Delta y}_{t+1}=\phi\Delta y_t,\quad \hat y_{t+1}=y_t+\widehat{\Delta y}_{t+1}`,
      'Subtract consecutive levels to obtain the latest change. Multiply that change by the fitted autoregressive coefficient, then add the predicted change to the latest observed level.',
      [
        ['yₜ', 'Latest observed level.'],
        ['yₜ₋₁', 'Previous observed level.'],
        ['Δyₜ', 'Latest observed change.'],
        ['φ', 'Fitted AR coefficient on the change series.'],
        ['hat Δyₜ₊₁', 'Predicted next change.'],
        ['hat yₜ₊₁', 'Predicted next level.'],
      ],
    ),
    math(
      String.raw`\hat y_{t+h}=y_{t-s+1+((h-1)\bmod s)}`,
      'For the seasonal-naive baseline, cycle through the latest complete season. The remainder selects the position corresponding to the future horizon.',
      [
        ['t', 'Forecast origin.'],
        ['h', 'Positive forecast horizon.'],
        ['s', 'Season length.'],
        ['y', 'Observed historical level.'],
        ['hat y', 'Forecast level.'],
        ['mod', 'Remainder operation wrapping the season.'],
      ],
    ),
    p(
      'The differenced example is a deliberately simplified ARIMA(1,1,0) with no intercept and no MA component. Recursive second-horizon forecasts use the predicted next change rather than a future actual change.',
    ),
  ],
  tiny: [
    p(
      'Levels at times 1 and 2 are 100 and 110. Use φ = 0.5, no intercept, and one lag of the differenced series.',
    ),
    table(
      ['Operation', 'Arithmetic'],
      [
        ['Latest change', '110 − 100 = 10'],
        ['Next predicted change', '0.5 × 10 = 5'],
        ['Time 3 level forecast', '110 + 5 = 115'],
        ['Time 4 predicted change', '0.5 × 5 = 2.5'],
        ['Time 4 level forecast', '115 + 2.5 = 117.5'],
      ],
    ),
    p(
      'If the actual time 3 value is 118, the first forecast error actual minus forecast is +3. A last-value naive prediction of 110 has error +8. The AR example is closer on this one case, but one error cannot establish that it is the best method. A new forecast made after time 3 can use the actual 118; the original two-step forecast could not.',
    ),
  ],
  financial: [
    p(
      'The latest complete three-period settlement cycle is [80, 100, 120] in thousands of dollars. Use s = 3 for this cycle. Forecast the next three periods using the seasonal-naive baseline.',
    ),
    table(
      ['Horizon', 'Forecast ($000)', 'Later actual ($000)', 'Error actual − forecast'],
      [
        ['1', '80', '90', '+10'],
        ['2', '100', '95', '−5'],
        ['3', '120', '130', '+10'],
      ],
    ),
    p(
      'MAE = (10 + 5 + 10)/3 = 8.333 thousand dollars, or about $8,333. RMSE = √((100 + 25 + 100)/3) = √75 ≈ 8.660 thousand dollars. The average signed error is +5 thousand dollars, indicating underforecasting on this tiny period.',
    ),
    p(
      'For the first horizon, a hypothetical $20,000 buffer produces planned liquidity $80,000 + $20,000 = $100,000. The later $90,000 outflow leaves $10,000 headroom. The buffer was a stated policy assumption; MAE does not by itself determine a reserve or interval.',
    ),
  ],
  evaluation: [
    p(
      'Report MAE and RMSE in target units. MAE treats absolute errors linearly; RMSE gives larger misses more weight. MASE uses a naive error scale computed from training history. MAPE is undefined at zero actuals. Include error direction because underforecasting and overforecasting can have different funding consequences.',
    ),
    p(
      'Compare interval coverage with its nominal target and width. Wider ranges can improve capture while reducing usefulness. Pinball loss evaluates a chosen quantile and can express asymmetric forecasting consequences.',
    ),
    p(
      'Check performance separately by horizon, holidays, stress periods, and changed reporting practices. A good past average can hide systematic liquidity shortages. A random row split can give an optimistic estimate by letting future patterns enter training.',
    ),
  ],
  pseudocode:
    'for origin in forecast_origins:\n    history = data_available_by(origin)\n    fitted = fit_model(history)\n    forecasts = recursive_forecast(fitted, horizon=H)\n    baseline = repeat_last_complete_season(history, H)\n    store(origin, forecasts, baseline)\n# After each target period actually arrives:\nerrors = actuals - stored_forecasts\nMAE = mean(abs(errors))\nRMSE = sqrt(mean(errors ** 2))',
  walkthrough: [
    ['data_available_by', 'Use only observations released by the forecast origin.'],
    ['fit_model(history)', 'Learn parameters from the historical window, not target outcomes.'],
    [
      'recursive_forecast',
      'Predicted lags replace unavailable future observations at longer horizons.',
    ],
    ['repeat_last_complete_season', 'Construct a causal comparison forecast.'],
    ['store(origin, forecasts)', 'Retain the exact forecast made before outcomes occurred.'],
    ['Score later actuals', 'Calculate errors only when the target period is observed.'],
  ],
  complexity:
    'An AR(p) forecast uses O(p) arithmetic per horizon, hence O(H p) for H recursive forecasts. Parameter fitting cost depends on the estimator and model orders; ARIMA likelihood optimization is iterative and has no single universal linear-time claim. Storing a complete history uses O(n) values; a fixed-lag inference buffer needs O(p) for an AR model.',
  advanced: [
    {
      title: 'Advanced: ARIMA and changing volatility',
      blocks: [
        math(
          String.raw`w_t=c+\sum_{i=1}^{p}\phi_iw_{t-i}+\varepsilon_t+\sum_{j=1}^{q}\theta_j\varepsilon_{t-j},\qquad w_t=\Delta^d y_t`,
          'An ARIMA model uses the d-times differenced series w. The AR terms use past w values; the MA terms use past innovations. This expression uses a plus-sign MA convention.',
          [
            ['wₜ', 'Differenced series.'],
            ['c', 'Intercept on that series.'],
            ['p, q, d', 'AR order, MA order, and differencing order.'],
            ['φᵢ', 'AR coefficient.'],
            ['θⱼ', 'MA coefficient under this sign convention.'],
            ['εₜ', 'Current innovation.'],
            ['Δᵈ', 'Apply first differencing d times.'],
          ],
        ),
        p(
          'Stationarity and invertibility conditions depend on polynomial roots; the simple AR(1) stationary-change case requires |φ| < 1. Seasonality may require seasonal lags or differencing. A GARCH variance model describes changing innovation variance, so a forecast of mean and a forecast of volatility remain separate.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What does a lag-one value yₜ₋₁ mean?',
      [
        ['The previous observed period', 'The subscript selects one period before t.'],
        [
          'The next forecast period',
          'The next period is indexed t + 1, whereas t − 1 names an earlier observation.',
        ],
        [
          'The model’s average error',
          'The notation indexes an observation rather than summarizing errors.',
        ],
      ],
      0,
      'Read the time index.',
    ),
    q(
      'definition',
      'practice',
      'In ARIMA, what does the MA component use?',
      [
        [
          'Lagged innovations',
          'MA terms combine earlier unpredictable shocks or model innovations.',
        ],
        [
          'Only a simple rolling mean of observed levels',
          'That ordinary moving average is different from the ARIMA MA mechanism.',
        ],
        ['Tomorrow’s known actual outflow', 'Future outcomes are unavailable when forecasting.'],
      ],
      0,
      'Distinguish innovations from observed levels.',
    ),
    q(
      'definition',
      'review',
      'What is a forecast origin?',
      [
        [
          'The final time whose information is available',
          'All inputs for the prediction must be known by this historical decision point.',
        ],
        [
          'The date of the largest later error',
          'An error is observed after the forecast target arrives.',
        ],
        ['The number of forecasted periods', 'That number is the horizon rather than the origin.'],
      ],
      0,
      'Ask when the prediction was actually made.',
    ),
    q(
      'mechanism',
      'guided',
      'When making a two-step forecast before either future outcome is observed, which lag is used for the second step?',
      [
        [
          'The predicted first-step value',
          'Recursive forecasting substitutes the forecast because the actual future value is unavailable.',
        ],
        [
          'The actual first-step future outcome',
          'That would leak information from after the forecast origin.',
        ],
        ['Always zero', 'The recurrence uses modelled lags, not an arbitrary zero.'],
      ],
      0,
      'Respect what is known at the origin.',
    ),
    q(
      'mechanism',
      'practice',
      'Why does the code store forecasts before scoring them?',
      [
        [
          'To preserve what was predicted before the outcome arrived',
          'Backtesting needs forecasts paired with later actuals rather than rewritten with hindsight.',
        ],
        [
          'To remove all forecasting errors',
          'Storage records the forecast; it does not change the outcome.',
        ],
        [
          'To train on future actuals immediately',
          'Those values are not yet available and would violate chronology.',
        ],
      ],
      0,
      'Keep a historical record of the decision.',
    ),
    q(
      'mechanism',
      'review',
      'Why can a random row split be misleading for forecasting?',
      [
        [
          'Future temporal patterns can enter training',
          'The evaluation may no longer reproduce forecasting from information available in the past.',
        ],
        [
          'Time-series models cannot use any held-back data',
          'Chronological validation and later test windows are appropriate.',
        ],
        [
          'It guarantees lower MAE on real future data',
          'An optimistic evaluation does not guarantee later accuracy.',
        ],
      ],
      0,
      'Check which dates each phase can see.',
    ),
    q(
      'calculation',
      'guided',
      'With latest levels 100 and 110 and φ = 0.5, what is the next forecast?',
      [
        ['105', 'This adds half the change to the earlier rather than the latest level.'],
        ['115', 'Latest change is 10, predicted change is 5, and 110 + 5 = 115.'],
        ['165', 'Multiplying the latest level by 1.5 ignores the differenced model.'],
      ],
      1,
      'Predict the change first, then recover the level.',
    ),
    q(
      'calculation',
      'practice',
      'What is the second-horizon forecast in the tiny recursive trace?',
      [
        ['120', 'That repeats the full first change rather than multiplying it again by φ.'],
        ['117.5', 'The next predicted change is 0.5 × 5 = 2.5; add it to 115.'],
        ['112.5', 'This adds to the original level rather than the predicted first level.'],
      ],
      1,
      'Apply the recurrence a second time.',
    ),
    q(
      'calculation',
      'review',
      'If actual time 3 is 118 and forecast is 115, what is signed error using actual minus forecast?',
      [
        ['−3', 'That reverses the stated sign convention.'],
        ['+3', '118 − 115 = +3, meaning the forecast was too low.'],
        ['8', 'Eight is the error of the separate last-value baseline at 110.'],
      ],
      1,
      'Use the specified error direction.',
    ),
    q(
      'application',
      'guided',
      'Errors are [10, −5, 10] in $000. What is MAE?',
      [
        ['5 thousand dollars', 'Five is the signed average; absolute errors must be used.'],
        [
          '8.333 thousand dollars',
          'Absolute errors sum to 25 thousand dollars; dividing by three gives 8.333 thousand dollars.',
        ],
        ['25 thousand dollars', 'Twenty-five is total absolute error, before dividing by three.'],
      ],
      1,
      'Take absolute values before averaging.',
    ),
    q(
      'application',
      'practice',
      'Which interval result should be reported together with coverage?',
      [
        ['Width', 'Very wide intervals can achieve coverage while giving poor planning guidance.'],
        [
          'Only the training row count',
          'Sample size matters, but it does not reveal how broad the future ranges are.',
        ],
        [
          'The number of model coefficients only',
          'Model size does not measure the usefulness of the forecast range.',
        ],
      ],
      0,
      'A range can capture everything by being extremely broad.',
    ),
    q(
      'application',
      'review',
      'A first-period forecast is $80,000 with a $20,000 buffer. Actual outflow is $90,000. What is remaining headroom?',
      [
        ['$10,000', 'Planned liquidity is $100,000, leaving $10,000 after the outflow.'],
        ['−$10,000', 'This ignores the stated $20,000 buffer.'],
        ['$20,000', 'The forecast error uses $10,000 of the buffer.'],
      ],
      0,
      'Add forecast and buffer before comparing actual flow.',
    ),
  ],
});

const graphs = topic({
  slug: 'graph-methods',
  title: 'Graph methods',
  definition:
    'Graph methods represent entities as nodes and recorded relationships as edges, then calculate paths, connected groups, and neighborhood information.',
  preciseDefinition:
    'A graph G = (V, E) is a set of vertices V and edges E, optionally directed, weighted, typed, and timestamped. Traversal and structural algorithms compute reachability and network properties; graph neural networks learn node or graph representations by aggregating neighbor information.',
  prerequisites: ['notation', 'vectors', 'algorithm-tracing', 'leakage'],
  terms: [
    ['Node or vertex', 'An entity represented in the graph.', 'An account, device, or merchant.'],
    ['Edge', 'A specified relationship between two nodes.', 'Account A uses device D.'],
    ['Adjacency list', 'A representation storing each node’s neighbors.', 'A: [B, C].'],
    [
      'Degree',
      'Count of incident edges in an undirected simple graph.',
      'A connected to B and C has degree two.',
    ],
    [
      'Connected component',
      'A maximal set of mutually reachable nodes in an undirected graph.',
      'Accounts joined by shared devices and merchants can belong to one component.',
    ],
    [
      'BFS',
      'Breadth-first search, which explores nodes in increasing hop distance.',
      'Its queue finds a minimum-hop path in an unweighted graph.',
    ],
    [
      'Message passing',
      'Update a node representation by combining its own and its neighbors’ information.',
      'Mean neighbor value five can contribute to node A’s new representation.',
    ],
    [
      'Entity resolution',
      'Determine whether source records refer to the same real entity.',
      'A mistaken device match can create a false network link.',
    ],
  ],
  objectives: [
    'Define graph representations, edge semantics, paths, components, and message passing.',
    'Trace breadth-first traversal and distinguish structural calculations from learned graph models.',
    'Calculate degrees, shortest paths, components, and one numerical aggregation.',
    'Interpret account links with timestamps, evidence quality, and financial investigation context.',
  ],
  introduction: [
    p(
      'A table can record each payment separately. A graph adds relationships between payments or their entities. A shared device, a transfer, and a shared merchant mean different things; keep edge types and timestamps. An undirected edge represents symmetric adjacency, while a directed transfer has sender and receiver.',
    ),
    p(
      'Reachability is a structural statement. A path between two people does not prove coordination. Popular merchants can connect many unrelated accounts. Entity matching errors and future-dated edges can make a technically correct calculation substantively misleading.',
    ),
    table(
      ['Representation', 'Contents', 'Tradeoff'],
      [
        ['Adjacency list', 'Neighbors for each node', 'Efficient for sparse relationships'],
        ['Adjacency matrix', 'A value for every node pair', 'Simple pair lookup but O(V²) storage'],
      ],
    ),
  ],
  mechanism: [
    list(
      'Define entity identifiers and exactly what each edge records.',
      'Build a graph frozen at the time of the historical decision.',
      'For BFS, mark the starting node visited and put it into a queue.',
      'Remove the oldest queued node; enqueue its unvisited neighbors and record their predecessors.',
      'Continue until the target is found or the component is exhausted.',
      'For learned message passing, aggregate neighboring representations with fitted weights, then train a prediction head on labelled examples.',
    ),
    p(
      'BFS finds minimum hop count in an unweighted graph because every distance-one node is explored before distance-two nodes. Weighted shortest paths need a different algorithm such as Dijkstra with nonnegative weights. Connected components can be found by restarting traversal at each unvisited node.',
    ),
    p(
      'BFS and degree counting have no parameter-training stage. A graph neural network does: training learns representation weights using an objective, and inference applies those learned operations to the current graph and features.',
    ),
  ],
  formula: [
    math(
      String.raw`d(v)=|N(v)|,\qquad h_v^{new}=\operatorname{ReLU}\left(w_{self}h_v+w_{neighbor}\frac1{|N(v)|}\sum_{u\in N(v)}h_u\right)`,
      'Degree counts a node’s neighbors in this simple undirected graph. The teaching update averages neighbor representations, weights that mean and the node’s own value, then removes negative output with ReLU.',
      [
        ['d(v)', 'Undirected simple-graph degree of v.'],
        ['N(v)', 'Set of direct neighbors.'],
        ['hᵥ', 'Current scalar representation of node v.'],
        ['hᵥ new', 'Updated scalar representation.'],
        ['hᵤ', 'Current representation of neighbor u.'],
        ['w_self', 'Weight on the node’s own value.'],
        ['w_neighbor', 'Weight on the neighbor mean.'],
        ['ReLU', 'Maximum of zero and the input.'],
      ],
    ),
    p(
      'This message-passing example uses a scalar mean update. Other GNN architectures can use vector weights, attention, edge features, or different aggregators. An isolated node needs a documented empty-neighbor convention.',
    ),
  ],
  tiny: [
    p('An undirected graph has nodes A, B, C, D, E and edges A–B, A–C, B–D, C–E.'),
    table(
      ['Node', 'Neighbors', 'Degree', 'BFS distance from D'],
      [
        ['D', 'B', '1', '0'],
        ['B', 'A, D', '2', '1'],
        ['A', 'B, C', '2', '2'],
        ['C', 'A, E', '2', '3'],
        ['E', 'C', '1', '4'],
      ],
    ),
    p(
      'Start queue [D]. Visit D and enqueue B; visit B and enqueue A; visit A and enqueue C; visit C and enqueue E. The predecessor chain gives D–B–A–C–E, four edges. All five nodes are reachable, so there is one connected component. Sum of degrees is 8 = twice four edges.',
    ),
    p(
      'For one numerical message update, let A have value 2 and neighbors B and C have values 4 and 6. Their mean is (4 + 6)/2 = 5. With self weight 0.5 and neighbor weight 0.5, the pre-activation is 0.5 × 2 + 0.5 × 5 = 3.5; ReLU returns 3.5.',
    ),
  ],
  financial: [
    p(
      'Accounts A and B use device D; accounts B and C pay merchant M. Edges are A–D, B–D, B–M, C–M, treated as undirected for this structural exercise.',
    ),
    table(
      ['Entity', 'Degree', 'Meaning'],
      [
        ['A', '1', 'One recorded device link'],
        ['B', '2', 'One device and one merchant link'],
        ['C', '1', 'One recorded merchant link'],
        ['D', '2', 'Used by two accounts'],
        ['M', '2', 'Paid by two accounts'],
      ],
    ),
    p(
      'The five nodes form one component. The minimum-hop route A–D–B–M–C has four edges. A and B share one device; B and C share one merchant. If an investigator can examine two accounts, degree alone puts B first but does not decide which degree-one account deserves the second slot.',
    ),
    p(
      'A household can explain a shared device and a popular merchant can explain shared payments. Freeze edges at the alert time and verify entity matches before attributing a link. This graph has no fraud labels, so neither component size five nor path length four is a measured fraud probability.',
    ),
  ],
  evaluation: [
    p(
      'For a predictive graph model, compare later outcomes with a transaction-only baseline at the same capacity. Precision@K and recall@K can test investigation yield. Hold apart linked entities or account for overlap; otherwise the test can repeat information seen during training.',
    ),
    p(
      'For structural exploration, verify edge counts, paths, direction, and timestamps. Inspect high-degree hubs and mistaken entity matches. Community detection groups dense relationships but does not establish collusion; PageRank-like centrality summarizes connection patterns, not credibility.',
    ),
    p(
      'A message-passing layer brings information from immediate neighbors; two layers can propagate information two hops. More layers can blur distinct representations, and an erroneous edge can propagate erroneous context.',
    ),
  ],
  pseudocode:
    'queue = [start]\nvisited = {start}\nparent = {}\nwhile queue:\n    v = pop_front(queue)\n    for u in adjacency[v]:\n        if u not in visited:\n            visited.add(u)\n            parent[u] = v\n            queue.append(u)\n# Recover an unweighted shortest path by following parents from target.\nneighbor_mean = mean(h[u] for u in adjacency[v])\nh_new[v] = relu(w_self * h[v] + w_neighbor * neighbor_mean)',
  walkthrough: [
    [
      'Queue in first-in, first-out order',
      'Explore all nodes at one hop distance before the next.',
    ],
    ['visited set', 'Prevent repeated visits and infinite cycling.'],
    ['parent[u] = v', 'Record the edge used to discover u so a path can be reconstructed.'],
    [
      'Adjacency lookup',
      'Traverse the stored direct neighbors rather than every possible node pair.',
    ],
    ['mean(h[u])', 'Combine neighbor information under the selected aggregation rule.'],
    [
      'Apply learned weights',
      'This belongs to the modelled message update; BFS itself learns no weights.',
    ],
  ],
  complexity:
    'BFS on adjacency lists takes O(|V| + |E|) time and O(|V|) auxiliary space. Storing an undirected adjacency list takes O(|V| + |E|); a dense matrix takes O(|V|²). Mean aggregation over d-dimensional node vectors has O(|E| d) edge work per layer, plus architecture-dependent transformations.',
  advanced: [
    {
      title: 'Advanced: centrality and temporal graphs',
      blocks: [
        p(
          'A directed graph has separate in-degree and out-degree. Weighted degree sums weights rather than simply counting edges. Connected components, strongly connected components, and weakly connected components are different concepts for directed graphs; state which one is being computed.',
        ),
        p(
          'PageRank combines incoming contributions and teleportation to produce a centrality distribution. Temporal motifs require ordered timestamps, such as rapid pass-through transfers. A graph model must preserve historical edge availability, including when a match became known rather than only the event’s timestamp.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What does an edge represent?',
      [
        [
          'A specified relationship between nodes',
          'Its meaning depends on the recorded relationship, such as a transfer or device use.',
        ],
        [
          'Proof of shared wrongdoing',
          'A link can have legitimate explanations and needs supporting evidence.',
        ],
        [
          'Always a predicted probability',
          'An edge can be a structural record without a risk score.',
        ],
      ],
      0,
      'Identify the relationship semantics.',
    ),
    q(
      'definition',
      'practice',
      'Which representation stores only each node’s listed neighbors?',
      [
        ['Adjacency list', 'It enumerates actual neighbors and suits sparse graphs.'],
        ['Adjacency matrix', 'A matrix stores a position for every node pair.'],
        ['Confusion matrix', 'That table counts prediction outcomes rather than entity links.'],
      ],
      0,
      'Compare neighbor lists with all-pairs storage.',
    ),
    q(
      'definition',
      'review',
      'What is a connected component in an undirected graph?',
      [
        [
          'A maximal mutually reachable node set',
          'Every node in the set is joined by some path, and no reachable node can be added from outside.',
        ],
        ['Only nodes with identical degrees', 'Equal degree does not imply reachability.'],
        ['A confirmed fraud ring', 'Reachability alone does not establish misconduct.'],
      ],
      0,
      'Use paths rather than labels.',
    ),
    q(
      'mechanism',
      'guided',
      'Why does BFS use a first-in, first-out queue?',
      [
        [
          'To explore increasing hop distances',
          'Earlier discovered nodes at one layer are processed before nodes farther away.',
        ],
        [
          'To choose the largest dollar transfer first',
          'Unweighted BFS does not prioritize amounts.',
        ],
        ['To learn feature coefficients', 'Traversal is a deterministic structural calculation.'],
      ],
      0,
      'Think distance layers.',
    ),
    q(
      'mechanism',
      'practice',
      'What is the visited set for?',
      [
        [
          'Avoid rediscovering nodes and looping through cycles',
          'Each node is enqueued once in this BFS.',
        ],
        [
          'Discard all shared devices',
          'Whether a device is relevant depends on edge semantics, not the traversal set.',
        ],
        [
          'Assign a fraud probability to every node',
          'Visited tracks traversal state rather than labelled risk.',
        ],
      ],
      0,
      'Trace A–B–A without a visited check.',
    ),
    q(
      'mechanism',
      'review',
      'Which operation distinguishes a trained GNN from BFS?',
      [
        [
          'Learning weights for representation updates',
          'A GNN fits parameters under an objective; BFS only follows relationships.',
        ],
        ['Using an adjacency representation', 'Both can use the same graph structure.'],
        ['Reading node identifiers', 'Both traversal and learned models need node identity.'],
      ],
      0,
      'Ask which process has fitted parameters.',
    ),
    q(
      'calculation',
      'guided',
      'If node A has neighbors B and C in a simple undirected graph, what is its degree?',
      [
        ['1', 'That counts A rather than its two incident edges.'],
        ['2', 'Degree counts the two listed neighbors.'],
        ['3', 'The node itself is not an extra incident edge.'],
      ],
      1,
      'Count direct links.',
    ),
    q(
      'calculation',
      'practice',
      'In the tiny graph, how many edges are on D–B–A–C–E?',
      [
        ['5', 'Five counts the nodes along the path.'],
        ['4', 'Five consecutive nodes have four transitions: D–B, B–A, A–C, and C–E.'],
        [
          '2',
          'Two edges traverse only part of the route; reaching E from D takes all four listed edges.',
        ],
      ],
      1,
      'A path with five nodes has four transitions.',
    ),
    q(
      'calculation',
      'review',
      'A has value 2; neighbors have 4 and 6; both weights are 0.5. What is ReLU output?',
      [
        ['3.5', 'Neighbor mean is five, giving 0.5 × 2 + 0.5 × 5 = 3.5.'],
        ['6', 'This adds the weighted neighbor sum without the required mean.'],
        ['0', 'ReLU returns zero only for a nonpositive input; 3.5 is positive.'],
      ],
      0,
      'Average neighbors before weighting.',
    ),
    q(
      'application',
      'guided',
      'How many connected components exist in A–D, B–D, B–M, C–M?',
      [
        ['1', 'The path A–D–B–M–C reaches every listed node.'],
        ['2', 'The device and merchant groups are joined by B.'],
        ['5', 'Separate identifiers do not mean disconnected nodes.'],
      ],
      0,
      'Find the account linking the two relationship types.',
    ),
    q(
      'application',
      'practice',
      'Which evaluation condition prevents future network evidence from leaking backward?',
      [
        [
          'Freeze the graph at each decision time',
          'Edges and entity matches must be available when the historical alert would have been made.',
        ],
        [
          'Include every edge found by the final date',
          'That can use links unknown at the decision time.',
        ],
        [
          'Use only node degree and ignore timestamps',
          'A simple feature can still contain unavailable future edges.',
        ],
      ],
      0,
      'Evaluate the graph that could actually have been observed.',
    ),
    q(
      'application',
      'review',
      'What does the four-edge account path establish?',
      [
        [
          'Recorded reachability through device and merchant links',
          'It establishes the structural route; evidence is still needed to interpret the relationships.',
        ],
        ['A 100% fraud probability', 'Paths alone have no calibrated outcome interpretation.'],
        [
          'A direct transfer between A and C',
          'The path uses intermediate nodes and does not record that transfer.',
        ],
      ],
      0,
      'Read every edge’s type.',
    ),
  ],
});

const attention = topic({
  slug: 'transformers',
  title: 'Transformers and financial text',
  definition:
    'A transformer represents each token using information from other tokens through attention. A financial-text classifier adds an output head that assigns probabilities to defined labels such as positive, neutral, and negative.',
  preciseDefinition:
    'A transformer maps token and positional representations through layers of attention, feed-forward transformations, residual connections, and normalization. Scaled dot-product attention uses softmax(QKᵀ/√dₖ)V; training learns the projection and layer parameters through a selected objective.',
  prerequisites: ['vectors', 'logarithms', 'probability', 'gradients', 'data-splits'],
  terms: [
    [
      'Token',
      'A unit produced by a model’s tokenizer, often a word piece rather than a full word.',
      '“Delinquency” can be split into several tokens.',
    ],
    [
      'Embedding',
      'A numeric vector representing a token or other item.',
      'Token vectors are combined with position information.',
    ],
    [
      'Query',
      'A projected representation used to ask which information to attend to.',
      'The query for “loss” can compare nearby modifiers.',
    ],
    [
      'Key',
      'A projected representation compared with a query to create attention scores.',
      'Keys describe how tokens match the current query.',
    ],
    [
      'Value',
      'The representation actually mixed using attention weights.',
      'A high-weight token contributes more of its value vector.',
    ],
    [
      'Softmax',
      'Exponentiate scores and normalize so nonnegative weights sum to one.',
      'Scores [0, ln 3] give weights [0.25, 0.75].',
    ],
    [
      'Classification head',
      'A learned output transformation for a fixed label set.',
      'Positive, neutral, and negative logits are converted to class probabilities.',
    ],
    [
      'Fine-tuning',
      'Continue fitting pretrained parameters for a task or domain.',
      'A pretrained language model can learn finance-specific sentiment labels.',
    ],
  ],
  objectives: [
    'Define tokens, embeddings, queries, keys, values, attention, and classification logits.',
    'Trace attention and distinguish parameter training from text inference.',
    'Compute softmax weights, a value mixture, and class probabilities.',
    'Interpret financial sentiment and apply a documented uncertainty-review cutoff.',
  ],
  introduction: [
    p(
      'Words have different meanings in context. “Loss narrowed” can describe improvement even though it includes the word loss. Attention lets a token representation incorporate other tokens; it does not directly prove which sentence claim is true.',
    ),
    p(
      'A tokenizer can split words into pieces and may truncate a long input. Position information helps distinguish word order. The classifier’s labels must have a finance-specific annotation guide: sentiment describes wording, not a buy or sell recommendation.',
    ),
    table(
      ['Task', 'Output', 'Example'],
      [
        ['Classification', 'One label from a fixed set', 'Positive financial sentiment'],
        ['Extraction', 'A field or text span', 'Reported revenue figure'],
        ['Generation', 'New text', 'A filing summary requiring evidence checks'],
      ],
    ),
  ],
  mechanism: [
    list(
      'Tokenize text and look up token vectors with positional information.',
      'Project representations into queries Q, keys K, and values V.',
      'Compute every permitted query–key dot product and scale by √dₖ.',
      'Apply row-wise softmax to obtain attention weights.',
      'Mix value vectors with those weights; combine multiple heads and layer transformations.',
      'Apply a task head; during training compare with labels and backpropagate gradients, while inference uses fixed learned parameters.',
    ),
    p(
      'The softmax row for one query sums to one across its allowed keys. Q and K determine the matching weights; V supplies the information being combined. Attention weights are not class probabilities and should not be read as fraud risk or sentence truth.',
    ),
    p(
      'Pretraining often learns language representations from large text collections. Fine-tuning uses a task loss such as sentiment cross-entropy. The browser’s small TF-IDF classifier and a native FinBERT model are different systems; their numerical outputs must not be conflated.',
    ),
  ],
  formula: [
    math(
      String.raw`a_i=\frac{\exp(q\cdot k_i/\sqrt{d_k})}{\sum_j\exp(q\cdot k_j/\sqrt{d_k})},\qquad h=\sum_i a_i v_i`,
      'For one query, compare it with each key using a dot product. Scale the score, exponentiate, and divide by the sum of exponentials to get weights. Use those weights to combine the value vectors.',
      [
        ['q', 'Query vector for the token being updated.'],
        ['kᵢ', 'Key for token i.'],
        ['dₖ', 'Key/query dimension.'],
        ['aᵢ', 'Attention weight assigned to token i.'],
        ['vᵢ', 'Value vector for token i.'],
        ['h', 'Weighted attention output.'],
        ['exp', 'Natural exponential function.'],
      ],
    ),
    math(
      String.raw`P(c\mid h)=\frac{e^{z_c}}{\sum_j e^{z_j}},\qquad L=-\ln P(y\mid h)`,
      'A classification head produces one logit per label. Softmax converts those logits into a distribution; cross-entropy selects the negative log probability of the observed correct label.',
      [
        ['c', 'Class label being scored.'],
        ['z꜀', 'Classification logit for class c.'],
        ['h', 'Input representation to the classification head.'],
        ['y', 'Observed training label.'],
        ['L', 'Single-example classification loss.'],
        ['ln', 'Natural logarithm.'],
      ],
    ),
    p(
      'Subtracting the maximum logit before exponentiating leaves softmax unchanged: multiplying numerator and denominator by the same factor cancels. This improves numerical stability. The √dₖ scaling counteracts dot-product magnitude growth with dimension.',
    ),
  ],
  tiny: [
    p(
      'For two-token attention, use a scalar query q = 1, key values [0, ln 3], value entries [2, 6], and dₖ = 1.',
    ),
    table(
      ['Operation', 'Arithmetic'],
      [
        ['Query–key scores', '[1 × 0, 1 × ln 3] = [0, ln 3]'],
        ['Scale', 'Divide by √1 = 1; scores unchanged'],
        ['Exponentials', '[exp(0), exp(ln 3)] = [1, 3]'],
        ['Attention weights', '[1/4, 3/4] = [0.25, 0.75]'],
        ['Value mixture', '0.25 × 2 + 0.75 × 6 = 5'],
      ],
    ),
    p(
      'The second token supplies three times the attention weight of the first. The output five is a representation value, not a 500% probability. Replacing the second value with zero while keeping the keys fixed changes the output to 0.5 but leaves the weights [0.25, 0.75] unchanged.',
    ),
  ],
  financial: [
    p(
      'An earnings statement says “Loss narrowed from $8 million to $5 million.” Use logits [ln 4, ln 2, 0] for [positive, neutral, negative]. These logits are supplied for the calculation rather than produced by FinBERT.',
    ),
    table(
      ['Class', 'Exponential', 'Probability'],
      [
        ['Positive', '4', '4/7 ≈ 57.14%'],
        ['Neutral', '2', '2/7 ≈ 28.57%'],
        ['Negative', '1', '1/7 ≈ 14.29%'],
      ],
    ),
    p(
      'Positive is the largest class probability. Under a hypothetical rule automatically accept a label only when the maximum probability is at least 0.60, this sentence goes to review because 0.5714 < 0.60. The financial loss reduction is ($8m − $5m)/$8m = 37.5%; it is not the sentiment probability.',
    ),
    p(
      'If the labelled training answer is positive, cross-entropy is −ln(4/7) ≈ 0.5596. Gradients with respect to the three logits are [−3/7, 2/7, 1/7]. A learning-rate 0.1 descent step increases the positive logit by about 0.04286 and decreases the others by 0.02857 and 0.01429, before considering earlier network layers.',
    ),
  ],
  evaluation: [
    p(
      'Use a confusion matrix and per-class precision/recall to inspect positive, neutral, and negative errors. Macro-F1 gives every class equal influence; support-weighted F1 emphasizes common classes. Test negation, comparatives, ambiguous guidance, long documents, and unfamiliar sectors.',
    ),
    p(
      'Evaluate review thresholds on representative labelled sentences. Softmax probabilities can be overconfident under domain shift. A high attention weight is not proof of a causal explanation, and a high sentiment probability is not a verification of reported accounting figures.',
    ),
    p(
      'Keep exact numerical extraction and arithmetic checks separate from sentiment. Match model input limits and tokenizer behavior to the actual document types; truncated context can reverse the interpretation.',
    ),
  ],
  pseudocode:
    'tokens = tokenizer(text)\nH = token_embeddings(tokens) + position_information(tokens)\nQ, K, V = H @ Wq, H @ Wk, H @ Wv\nscores = Q @ K.T / sqrt(key_dimension)\nweights = row_softmax(scores - row_max(scores))\ncontext = weights @ V\nH = transformer_layer_with_residuals(H, context)\nlogits = classifier(pool(H))\nprobabilities = softmax(logits)\n# Training: compare probabilities with labels and update weights.\n# Inference: keep the learned weights fixed.',
  walkthrough: [
    ['Tokenizer', 'Input units can be word pieces and are constrained by a sequence-length limit.'],
    ['Q, K, V projections', 'Learn distinct matching and content transformations.'],
    ['Q @ K.T', 'Form pairwise query–key scores.'],
    [
      'Row-wise softmax',
      'Produce a probability-like distribution over allowed positions for each query.',
    ],
    ['weights @ V', 'Combine content, not keys, with the attention weights.'],
    [
      'Classifier and task loss',
      'The output head learns task labels; inference applies the fitted head.',
    ],
  ],
  complexity:
    'Dense self-attention on L tokens stores O(L²) attention scores per head and takes O(L² d) pairwise work at representation dimension d, in addition to O(L d²) projection/feed-forward work in typical layers. Training also stores activations for gradients. Architecture-specific sparse or fused methods can alter memory and execution costs.',
  advanced: [
    {
      title: 'Advanced: heads, residuals, and training objectives',
      blocks: [
        p(
          'Multiple heads learn different projections and concatenate their value mixtures. Residual connections add a layer’s input to its transformed output; normalization controls representation scales. A feed-forward sublayer transforms each token representation after contextual mixing.',
        ),
        p(
          'An encoder model can attend bidirectionally across input tokens. An autoregressive generator masks future positions to avoid reading tokens it is meant to predict. FinBERT-style sentiment uses an encoder representation and classification objective; this is different from next-token generation.',
        ),
        p(
          'For softmax cross-entropy, the derivative of class logit z꜀ is predicted class probability minus the one-hot target. Backpropagation then propagates these derivatives through the classification head, attention projections, and other learned layers.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What is a token?',
      [
        [
          'A tokenizer-produced input unit, often a word piece',
          'Tokens are the model’s input units and need not match whole words.',
        ],
        [
          'A final sentiment probability',
          'Probabilities are produced by the task head after representation processing.',
        ],
        ['Always one complete sentence', 'A sentence normally contains several tokenizer units.'],
      ],
      0,
      'Look at the first text-processing operation.',
    ),
    q(
      'definition',
      'practice',
      'Which representation supplies the content mixed by attention weights?',
      [
        [
          'The values V',
          'Queries and keys create matching scores; weights combine the value vectors.',
        ],
        ['Only the keys K', 'Keys are used for comparison, not as the specified mixture content.'],
        ['The class labels', 'Labels supervise training and are not the attention values.'],
      ],
      0,
      'Read the final multiplication by V.',
    ),
    q(
      'definition',
      'review',
      'Which statement distinguishes attention weights from class probabilities?',
      [
        [
          'Both distributions always represent sentiment labels',
          'Attention weights are over positions, while class probabilities are over labels.',
        ],
        [
          'Attention weights select token information; the classification head scores labels',
          'They normalize different score sets and have different interpretations.',
        ],
        [
          'Attention weights are confirmed financial facts',
          'A learned weighting does not verify factual claims.',
        ],
      ],
      1,
      'Identify what each distribution indexes.',
    ),
    q(
      'mechanism',
      'guided',
      'Why apply softmax to a query’s matching scores?',
      [
        [
          'To obtain nonnegative weights summing to one',
          'Those normalized weights define the weighted value mixture.',
        ],
        [
          'To convert every token into the positive class',
          'Attention weighting precedes task-label classification.',
        ],
        [
          'To avoid computing any value vectors',
          'The resulting weights must still be applied to V.',
        ],
      ],
      0,
      'Consider the required mixture weights.',
    ),
    q(
      'mechanism',
      'practice',
      'What changes during training but stays fixed during an ordinary inference call?',
      [
        [
          'The learned projection and head parameters',
          'Training updates them using a loss; inference uses the fitted values.',
        ],
        [
          'The input token identities',
          'Different input texts can have different tokens in either phase.',
        ],
        [
          'All class probabilities',
          'Probabilities vary with the input even when parameters stay fixed.',
        ],
      ],
      0,
      'Separate parameters from outputs.',
    ),
    q(
      'mechanism',
      'review',
      'Why subtract each row’s maximum before softmax exponentiation?',
      [
        [
          'Improve numerical stability without changing normalized weights',
          'The common exponential factor cancels from numerator and denominator.',
        ],
        [
          'Remove the most relevant token permanently',
          'Subtracting a constant shifts scores; it does not delete a position.',
        ],
        [
          'Make every weight equal',
          'Score differences remain unchanged, so weights can remain unequal.',
        ],
      ],
      0,
      'A common shift preserves score differences.',
    ),
    q(
      'calculation',
      'guided',
      'What are softmax weights for scores [0, ln 3]?',
      [
        ['[0, 1]', 'Zero is a logit; exp(0) is one, so the first weight is not zero.'],
        ['[0.25, 0.75]', 'Exponentials [1, 3] divide by their sum four.'],
        ['[0.5, 0.5]', 'Equal weights require equal logits; these scores differ.'],
      ],
      1,
      'Exponentiate before normalizing.',
    ),
    q(
      'calculation',
      'practice',
      'Weights [0.25, 0.75] mix values [2, 6]. What is the output?',
      [
        ['5', '0.25 × 2 + 0.75 × 6 = 0.5 + 4.5 = 5.'],
        ['4', 'Four is the unweighted mean rather than the attention-weighted result.'],
        ['8', 'Eight is the sum of values without weights.'],
      ],
      0,
      'Use both weighted contributions.',
    ),
    q(
      'calculation',
      'review',
      'Keep keys fixed but change values from [2, 6] to [2, 0]. What happens?',
      [
        [
          'Weights stay [0.25, 0.75] and output becomes 0.5',
          'Weights depend on Q and K, while the new mixture is 0.25 × 2 + 0.75 × 0.',
        ],
        ['Weights become [1, 0]', 'Changing V does not change the specified query–key scores.'],
        ['Output remains five', 'The second value contribution has changed from 4.5 to zero.'],
      ],
      0,
      'Separate matching from content.',
    ),
    q(
      'application',
      'guided',
      'For class logits [ln 4, ln 2, 0], what is the largest class probability?',
      [
        ['4/7', 'Exponentials [4, 2, 1] sum to seven; the positive class has weight four.'],
        ['4/6', 'The zero logit contributes exp(0) = 1 and must stay in the denominator.'],
        ['1', 'Having the largest logit does not make the class certain.'],
      ],
      0,
      'Include all three exponential terms.',
    ),
    q(
      'application',
      'practice',
      'Which metric equally weights financial sentiment classes regardless of support?',
      [
        ['Macro-F1', 'Macro averaging gives each included class one equal contribution.'],
        ['Support-weighted F1', 'That gives more influence to classes with more examples.'],
        [
          'Mean attention weight',
          'Attention describes representation mixing and does not measure class-level prediction quality.',
        ],
      ],
      0,
      'Compare class-weighting conventions.',
    ),
    q(
      'application',
      'review',
      'Maximum class probability is 4/7 ≈ 0.5714; automatic acceptance requires ≥ 0.60. What action follows?',
      [
        [
          'Send to review',
          'The maximum is below the threshold despite positive being the highest-ranked label.',
        ],
        [
          'Accept automatically',
          'The model has a winning label, but it fails the stated confidence cutoff.',
        ],
        [
          'Calculate a 57.14% reduction in loss',
          'The sentiment probability is separate from the financial figure change.',
        ],
      ],
      0,
      'Apply the cutoff after finding the winning class.',
    ),
  ],
});

const retrieval = topic({
  slug: 'rag',
  title: 'Embeddings and retrieval-augmented generation',
  definition:
    'Embeddings represent text as vectors for comparison. Retrieval-augmented generation finds candidate evidence for a question, supplies that evidence to a language model, and checks the resulting claims and calculations.',
  preciseDefinition:
    'A RAG pipeline retrieves documents or chunks through lexical and/or vector search, optionally reranks them, conditions generation on selected context, and evaluates both retrieval and answer support. Cosine similarity is the normalized dot product of two nonzero vectors and is a similarity score rather than a truth probability.',
  prerequisites: ['vectors', 'probability', 'algorithm-tracing', 'data-splits'],
  terms: [
    [
      'Embedding',
      'A numeric vector representing an item for a chosen task.',
      'A passage and a query can each have a two-entry teaching vector.',
    ],
    ['Dot product', 'Sum of pairwise products of vector entries.', '[1, 0] · [3, 4] = 3.'],
    [
      'Norm',
      'Vector length; the Euclidean norm is square root of squared-entry sum.',
      'The norm of [3, 4] is five.',
    ],
    [
      'Cosine similarity',
      'Dot product divided by the product of vector lengths.',
      'cos([1, 0], [3, 4]) = 0.6.',
    ],
    [
      'Chunk',
      'A searchable segment of a document retaining useful boundaries and metadata.',
      'Keep a revenue table with its headers and year labels.',
    ],
    [
      'Reranking',
      'Rescore retrieved candidates using a more detailed relevance model.',
      'Prefer a passage explicitly containing the requested year.',
    ],
    [
      'Grounding',
      'Link generated claims to evidence that actually supports them.',
      'A growth claim should cite both revenue figures.',
    ],
    [
      'Abstention',
      'Decline to answer beyond the available evidence.',
      'State that margin cannot be calculated if expenses are missing.',
    ],
  ],
  objectives: [
    'Define embeddings, norms, similarity, chunks, retrieval, reranking, and grounding.',
    'Trace ingestion, query retrieval, generation, and verification as distinct stages.',
    'Calculate cosine ranking, retrieval rates, and a cited financial percentage change.',
    'Identify supported and unsupported financial answers and evaluate each pipeline stage.',
  ],
  introduction: [
    p(
      'A passage can sound related to a question while failing to contain the needed fact. Retrieval finds candidates, not verified answers. Preserve document dates, entity names, table headers, and source identifiers so the answer can distinguish periods and units.',
    ),
    p(
      'Embedding models are trained to form useful representations; a basic RAG pipeline can use a fixed pretrained model without retraining on each filing. Query-time generation applies a fitted language model to evidence. A retrieval score of 0.8 is not an 80% probability that a claim is correct.',
    ),
    p(
      'Lexical search can be important for exact identifiers and numbers. Vector search can help with semantic wording. Hybrid retrieval combines their strengths; permission filtering must occur before inaccessible material enters answer context.',
    ),
  ],
  mechanism: [
    list(
      'Parse documents while preserving tables, dates, and source identifiers.',
      'Create chunks and compute embeddings with a fixed model version.',
      'Embed the query; retrieve permitted candidates through vector and/or lexical search.',
      'Rerank candidates and select context within the model’s input limit.',
      'Generate an answer constrained by available evidence and cite its claims.',
      'Check quoted figures, units, calculations, dates, and support; abstain when essential evidence is absent.',
    ),
    p(
      'Training an embedding or language model is distinct from building an index. Indexing stores representations of corpus chunks. Inference embeds a new query and searches those representations. Changing the embedding model can require rebuilding the index so query and document vectors remain compatible.',
    ),
    p(
      'Do not separate a table value from its column headings or footnotes. A chunk containing “100” without its unit and period can retrieve successfully but produce an incorrect financial answer.',
    ),
  ],
  formula: [
    math(
      String.raw`\operatorname{cos}(q,d)=\frac{\sum_jq_jd_j}{\sqrt{\sum_jq_j^2}\sqrt{\sum_jd_j^2}}`,
      'Multiply matching vector entries and add them for the dot product. Divide by both vector lengths, removing magnitude from the directional comparison. Both vectors must be nonzero.',
      [
        ['q', 'Query vector.'],
        ['d', 'Document or chunk vector.'],
        ['j', 'Coordinate index.'],
        ['cos(q,d)', 'Cosine similarity, between −1 and one for real nonzero vectors.'],
      ],
    ),
    math(
      String.raw`\operatorname{Recall@K}=\frac{|R\cap S_K|}{|R|},\quad \operatorname{ContextPrecision}=\frac{|R\cap S_K|}{|S_K|}`,
      'Count retrieved relevant items in the intersection. Retrieval recall divides by all required relevant items; context precision divides by all selected context items.',
      [
        ['R', 'Set of required relevant evidence items.'],
        ['Sₖ', 'Selected retrieved items.'],
        ['K', 'Maximum number selected.'],
        ['| |', 'Set size.'],
        ['∩', 'Set intersection.'],
      ],
    ),
    p(
      'A zero vector makes cosine undefined. An empty relevant set or selected set requires a documented rate convention rather than a silent claim of perfect retrieval.',
    ),
  ],
  tiny: [
    p(
      'The query is q = [1, 0]. Passage vectors are A = [3, 0], B = [3, 4], and C = [0, 2].',
    ),
    table(
      ['Passage', 'Dot product', 'Passage norm', 'Cosine'],
      [
        ['A', '3', '3', '1'],
        ['B', '3', '5', '0.6'],
        ['C', '0', '2', '0'],
      ],
    ),
    p(
      'The query norm is one, so rank A, B, C. Select top two A and B. If the known required evidence set is {A, D}, the selected intersection is {A}: retrieval recall is 1/2 and context precision is 1/2. Passage D was never found. Selecting two items does not mean two items were relevant.',
    ),
    p(
      'Multiplying A by ten changes its norm and dot product by the same factor and leaves cosine one. A large vector magnitude alone does not improve directional similarity.',
    ),
  ],
  financial: [
    p(
      'Passage A states revenue was $80 million in 2024 and $100 million in 2025. Passage B discusses product launches but gives no margin figures. The question asks for revenue growth and whether profit margin improved.',
    ),
    table(
      ['Claim', 'Calculation or evidence', 'Verdict'],
      [
        ['Revenue growth', '(100 − 80)/80 = 0.25 = 25%', 'Supported by A'],
        ['Absolute revenue increase', '$100m − $80m = $20m', 'Supported by A'],
        [
          'Profit margin improved',
          'No profit or expense figures provided',
          'Insufficient evidence',
        ],
      ],
    ),
    p(
      'A supported answer states that revenue rose 25%, cites A, and says the supplied material does not establish margin improvement. Dividing the $20 million change by new revenue would give 20%, which answers a different ratio. Calling the increase 25 percentage points would confuse a percent change in dollars with a difference between rates.',
    ),
    p(
      'If the answer contains two supported claims and one unsupported margin claim, faithfulness is 2/3 under this claim-counting rubric. A citation to B does not rescue the margin claim; citation correctness checks whether the attached passage supports that exact statement.',
    ),
  ],
  evaluation: [
    p(
      'Evaluate retrieval independently using retrieval recall, context precision, MRR, or nDCG with explicit relevance judgments. Finding useful evidence late in a ranked list matters differently for first-relevant-result and graded-ranking measures.',
    ),
    p(
      'Evaluate answer faithfulness, citation correctness, and numerical accuracy with their own denominators. A retrieved correct passage does not guarantee that a generator uses it correctly. A true number can be attached to the wrong period or used in an unsupported conclusion.',
    ),
    p(
      'Use deterministic arithmetic for material figures, verify document freshness, and inspect failure traces. More chunks can raise recall but dilute relevant context or exceed token budgets. A model judge is a convenience rather than a substitute for checking the evidence rubric.',
    ),
  ],
  pseudocode:
    'chunks = parse_with_headers_dates_and_ids(documents)\nindex = store(embedding_model(chunks))\nq = embedding_model(question)\ncandidates = search(index, q, permitted_documents)\nranked = rerank(question, candidates)\ncontext = select_within_budget(ranked)\nanswer = generate(question, context)\nfor claim in answer.claims:\n    verify_support(claim, claim.citations)\nverify_units_and_calculations(answer)\nif missing_required_evidence(context):\n    answer.state_insufficient_evidence()',
  walkthrough: [
    ['Parse with metadata', 'A number needs its table heading, unit, period, and source identity.'],
    [
      'Use the same embedding model',
      'Document and query vectors must occupy a compatible representation space.',
    ],
    ['Permission-filtered search', 'Only permitted candidate material can enter context.'],
    ['Rerank and budget', 'Select useful evidence within the model’s capacity.'],
    ['Verify support per claim', 'A nearby topic is not necessarily a supporting citation.'],
    [
      'Check calculations and abstain',
      'Separate arithmetic certainty from missing documentary evidence.',
    ],
  ],
  complexity:
    'Brute-force cosine search over N d-dimensional vectors takes O(N d) query work and O(N d) vector storage. Approximate indexes trade retrieval accuracy, indexing time, memory, and latency; no universal sublinear guarantee is implied. Generation cost depends on input context length and output length as well as model architecture.',
  advanced: [
    {
      title: 'Advanced: retrieval design and evidence boundaries',
      blocks: [
        p(
          'Dense embeddings can miss exact number matches or confuse related companies. Hybrid search, document filters, and reranking can improve candidates, but evaluate them on representative financial questions. Chunk overlap helps preserve boundaries while also creating duplicate evidence; deduplicate where required by the evaluation rubric.',
        ),
        p(
          'An answer can be faithful to an outdated filing yet fail the actual question. Evidence support, currency, completeness, and authorization are separate conditions. A citation identifier should resolve to the exact passage rather than merely the document’s front page.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What does cosine similarity compare?',
      [
        [
          'Vector direction after normalizing lengths',
          'Dividing by both norms removes simple magnitude scaling.',
        ],
        [
          'A claim’s probability of being true',
          'Similarity is a representation comparison, not a truth estimate.',
        ],
        [
          'Only document word count',
          'Lengths and dot products are vector calculations, not direct token counts.',
        ],
      ],
      0,
      'Read the normalized dot product.',
    ),
    q(
      'definition',
      'practice',
      'What is grounding in a financial answer?',
      [
        [
          'Connecting each claim to evidence that supports it',
          'Support requires the cited content to establish that specific statement.',
        ],
        ['Adding any filing link', 'A topic-related link may not support the exact claim.'],
        [
          'Giving every claim a high similarity score',
          'Retrieval similarity does not verify the generated assertion.',
        ],
      ],
      0,
      'Check the relationship between a claim and its evidence.',
    ),
    q(
      'definition',
      'review',
      'How does indexing differ from model training?',
      [
        [
          'Indexing stores document representations; training learns parameters',
          'A fixed embedding model can build a new filing index without parameter updates.',
        ],
        [
          'Indexing always changes every model weight',
          'Storing vectors is not itself a learning step.',
        ],
        [
          'Training means retrieving one query',
          'Query-time retrieval applies existing representations and search logic.',
        ],
      ],
      0,
      'Ask whether parameters or corpus storage are changing.',
    ),
    q(
      'mechanism',
      'guided',
      'Which information should remain attached to a table chunk?',
      [
        [
          'Headers, units, period, and source identity',
          'These disambiguate the values and let a reader verify the answer.',
        ],
        ['Only numeric cells', 'Bare numbers can be misread without their labels.'],
        [
          'Only a model confidence score',
          'Confidence cannot replace the source context needed to interpret a value.',
        ],
      ],
      0,
      'Think what the number 100 alone tells you.',
    ),
    q(
      'mechanism',
      'practice',
      'Why should query and document vectors use compatible embedding models?',
      [
        [
          'Their coordinates must have matching representation meaning',
          'An incompatible query space can make cosine rankings meaningless.',
        ],
        [
          'Every model always produces identical vectors',
          'Models and versions can use different dimensions and learned spaces.',
        ],
        [
          'Compatibility guarantees perfect truth',
          'A valid similarity space still does not establish claim support.',
        ],
      ],
      0,
      'Compare vectors in the same space.',
    ),
    q(
      'mechanism',
      'review',
      'A top-ranked passage lacks a needed profit figure. What should the pipeline do?',
      [
        [
          'State insufficient evidence for that portion',
          'Retrieval rank does not fill a missing factual input.',
        ],
        [
          'Infer an exact profit margin from revenue alone',
          'Margin requires profit or equivalent expense information.',
        ],
        ['Treat the similarity as the missing margin', 'Similarity has no financial-margin units.'],
      ],
      0,
      'Check whether every required quantity is present.',
    ),
    q(
      'calculation',
      'guided',
      'What is cosine of [1, 0] and [3, 4]?',
      [
        ['3', 'Three is the dot product before dividing by the vector norms.'],
        ['0.6', 'The norms are one and five, so 3/(1 × 5) = 0.6.'],
        ['0.75', 'Dividing by one coordinate rather than the Euclidean norm is incorrect.'],
      ],
      1,
      'Compute the [3, 4] norm.',
    ),
    q(
      'calculation',
      'practice',
      'Top two are {A, B}; required evidence is {A, D}. What is retrieval recall?',
      [
        ['1/2', 'Only A was found out of two required evidence items.'],
        ['1', 'Selecting two passages does not mean both required passages were retrieved.'],
        ['1/3', 'Three is the candidate count, not the required-evidence denominator.'],
      ],
      0,
      'Recall divides by the complete relevant set.',
    ),
    q(
      'calculation',
      'review',
      'If document vector [3, 0] is multiplied by ten, what happens to its cosine with [1, 0]?',
      [
        [
          'It remains one',
          'The dot product and document norm both multiply by ten, so they cancel.',
        ],
        ['It becomes ten', 'Cosine cannot become ten for real nonzero vectors.'],
        ['It becomes 0.1', 'Both numerator and denominator scale, not the denominator alone.'],
      ],
      0,
      'Track the common factor.',
    ),
    q(
      'application',
      'guided',
      'Revenue rises from $80m to $100m. What is growth relative to the old year?',
      [
        ['25%', 'The old revenue is the denominator: (100 − 80)/80 = 20/80 = 0.25, or 25%.'],
        ['20%', 'Dividing by new revenue gives 20/100, a different comparison.'],
        [
          '25 percentage points',
          'This is relative change in dollar revenue, not a difference between rate values.',
        ],
      ],
      0,
      'Use the old amount as the denominator.',
    ),
    q(
      'application',
      'practice',
      'Which result can be good even when the generated answer invents a margin claim?',
      [
        [
          'Retrieval recall',
          'The system can find required passages and still generate an unsupported claim.',
        ],
        [
          'Faithfulness necessarily equals one',
          'An unsupported claim lowers faithfulness under the given rubric.',
        ],
        [
          'Numerical accuracy guarantees full support',
          'Correct copied numbers can appear in an unsupported inference.',
        ],
      ],
      0,
      'Evaluate retrieval and generation separately.',
    ),
    q(
      'application',
      'review',
      'Two of three answer claims are supported. What is faithfulness under this claim-counting rubric?',
      [
        ['2/3', 'Supported claims divide by all evaluated claims.'],
        ['1', 'The unsupported claim remains in the denominator.'],
        ['1/3', 'That is the unsupported share rather than supported share.'],
      ],
      0,
      'Keep unsupported claims in the total.',
    ),
  ],
});

const allocation = topic({
  slug: 'optimization',
  title: 'Optimization and portfolio allocation',
  definition:
    'Optimization chooses decision variables that minimize or maximize a stated objective while satisfying constraints. Portfolio optimization can minimize estimated variance subject to investment and return requirements.',
  preciseDefinition:
    'A constrained portfolio problem selects weights w to minimize wᵀΣw subject to constraints such as 1ᵀw = 1, μᵀw ≥ r_min, and bounds. With a positive-semidefinite covariance matrix and linear constraints, this variance objective forms a convex quadratic program.',
  prerequisites: ['vectors', 'variance', 'gradients', 'algorithm-tracing'],
  terms: [
    [
      'Decision variable',
      'A quantity the optimizer is allowed to choose.',
      'The portfolio share assigned to stocks.',
    ],
    [
      'Objective',
      'The numerical criterion being minimized or maximized.',
      'Estimated portfolio variance.',
    ],
    ['Constraint', 'A requirement every acceptable solution must satisfy.', 'Weights sum to one.'],
    [
      'Feasible',
      'Satisfies all stated constraints.',
      'A 60/40 allocation reaching the minimum return is feasible.',
    ],
    [
      'Covariance',
      'A measure of how two asset returns vary together.',
      'Correlation times both standard deviations gives covariance.',
    ],
    [
      'Binding constraint',
      'A constraint met exactly at the solution.',
      'Portfolio return equals the required minimum.',
    ],
    [
      'Solver',
      'An algorithm that searches for a solution to the stated optimization problem.',
      'A quadratic-program solver reports status as well as weights.',
    ],
    [
      'Positive semidefinite',
      'A matrix property making every quadratic variance nonnegative.',
      'A valid covariance matrix must have nonnegative quadratic forms.',
    ],
  ],
  objectives: [
    'Define variables, objective, constraints, feasibility, covariance, and solver status.',
    'Trace the formulation, feasible-set checks, and objective comparison.',
    'Compute two-asset return and variance including covariance.',
    'Choose a feasible portfolio and interpret sensitivity to estimated financial inputs.',
  ],
  introduction: [
    p(
      'A portfolio with low variance can still be unacceptable if it misses a return requirement or violates a position limit. Optimization compares candidates only after feasibility. “Best” always means best under the stated objective, inputs, and constraints.',
    ),
    p(
      'Weights are fractions of the portfolio. A long-only fully invested problem requires nonnegative weights summing to one. Expected returns and covariance are estimates, so a mathematically optimal allocation is not a guarantee of future returns.',
    ),
    table(
      ['Object', 'Teaching example'],
      [
        ['Variable', 'Stock share w'],
        ['Objective', 'Minimize estimated variance'],
        ['Constraints', '0 ≤ w ≤ 1 and expected return ≥ target'],
        ['Output', 'Feasible weights and solver status'],
      ],
    ),
  ],
  mechanism: [
    list(
      'Define decision variables and their units.',
      'Estimate expected returns and a mathematically valid covariance matrix from appropriate data.',
      'Write all constraints explicitly and check whether they can be jointly satisfied.',
      'Evaluate or solve the objective over feasible allocations.',
      'Inspect solver status and independently check every returned constraint.',
      'Stress estimates and trading costs before interpreting the solution as an action.',
    ),
    p(
      'The classroom candidate comparison evaluates a discrete list of allocations. A continuous solver can find weights between listed choices. State whether a result is the best listed candidate or a continuous optimum. If no candidate is feasible, report infeasibility rather than selecting the smallest variance anyway.',
    ),
    p(
      'Portfolio optimization is not supervised prediction training. An upstream model may estimate returns or risks; the optimization step takes those inputs and chooses weights. Re-solving with changed assumptions is a new optimization instance.',
    ),
  ],
  formula: [
    math(
      String.raw`r_p=w\mu_A+(1-w)\mu_B,\quad \sigma_p^2=w^2\sigma_A^2+(1-w)^2\sigma_B^2+2w(1-w)\rho\sigma_A\sigma_B`,
      'Weight the two expected returns for portfolio return. Add both weighted variance terms and twice the weighted covariance for portfolio variance. The square root gives volatility.',
      [
        ['rₚ', 'Expected portfolio return.'],
        ['w', 'Share assigned to asset A; asset B gets one minus w.'],
        ['μ_A, μ_B', 'Expected asset returns in matching periods.'],
        ['σ_A, σ_B', 'Asset return standard deviations.'],
        ['ρ', 'Asset return correlation.'],
        ['σₚ²', 'Portfolio variance in squared-return units.'],
      ],
    ),
    math(
      String.raw`\min_w w^\top\Sigma w\quad\text{subject to}\quad \mathbf1^\top w=1,\;\mu^\top w\ge r_{min},\;w\ge0`,
      'For several assets, minimize the covariance quadratic form while requiring full investment, adequate expected return, and nonnegative shares.',
      [
        ['w', 'Vector of portfolio shares.'],
        ['Σ', 'Covariance matrix.'],
        ['μ', 'Vector of expected returns.'],
        ['r_min', 'Required expected return.'],
        ['1', 'Vector of ones.'],
        ['⊤', 'Transpose, making a row for vector multiplication.'],
      ],
    ),
    p(
      'Expanding the two-asset matrix quadratic form produces the cross term twice because the covariance appears in both symmetric off-diagonal entries. Omitting it is valid only under the explicitly zero-covariance assumption.',
    ),
  ],
  tiny: [
    p(
      'Assets A and B have expected returns 10% and 4%, volatilities 20% and 10%, and correlation 0.5. Evaluate an equal-weight allocation w = 0.5.',
    ),
    table(
      ['Operation', 'Arithmetic'],
      [
        ['Expected return', '0.5 × 0.10 + 0.5 × 0.04 = 0.07'],
        ['A variance term', '0.5² × 0.20² = 0.01'],
        ['B variance term', '0.5² × 0.10² = 0.0025'],
        ['Covariance term', '2 × 0.5 × 0.5 × 0.5 × 0.20 × 0.10 = 0.005'],
        ['Total variance', '0.0175'],
        ['Volatility', '√0.0175 ≈ 0.13229, or 13.23%'],
      ],
    ),
    p(
      'Dropping covariance would give 0.0125 variance, understating this example’s risk. If the return requirement is 8%, the equal-weight portfolio’s 7% return is infeasible regardless of its volatility.',
    ),
  ],
  financial: [
    p(
      'A $100,000 portfolio uses the same two assets and must have expected return at least 8%. Compare only the listed stock shares [0.50, 0.75, 1.00], with long-only full investment.',
    ),
    table(
      ['Stock share', 'Expected return', 'Variance', 'Volatility', 'Feasible?'],
      [
        ['0.50', '7.0%', '0.0175', '13.23%', 'No'],
        ['0.75', '8.5%', '0.026875', '16.39%', 'Yes'],
        ['1.00', '10.0%', '0.0400', '20.00%', 'Yes'],
      ],
    ),
    p(
      'Among these listed candidates choose 0.75 because it has lower variance than the other feasible candidate. Allocate $75,000 to stocks and $25,000 to bonds. This is a discrete candidate answer. The continuous minimum under the 8% return constraint occurs at w = 2/3, with variance about 0.023333 and volatility about 15.28%; it was not in the list.',
    ),
    p(
      'For the continuous solution, return 0.04 + 0.06w ≥ 0.08 requires w ≥ 2/3. Variance expands to 0.01 + 0.03w² for these inputs, increasing for positive w, so the smallest feasible w minimizes it. The return requirement binds exactly. Four assets each capped at 20% could never meet a 100% invested rule; their caps sum to 80%.',
    ),
  ],
  evaluation: [
    p(
      'Check return, risk, bounds, total weight, and solver status independently. A solver can return an approximate result or a failure status. Numerical tolerance does not excuse a substantive violation of the financial requirements.',
    ),
    p(
      'Compare with an equal-weight or policy allocation under the same constraints. Sharpe/Sortino describe return relative to variability, while drawdown, turnover, tracking error, and tail measures expose different risks. Include transaction costs if moving to the recommended weights.',
    ),
    p(
      'Stress returns, volatilities, and correlation jointly. A slightly changed estimate can create a large allocation change. Keep a valid symmetric positive-semidefinite covariance matrix during stress tests; arbitrary edits can make an impossible risk model.',
    ),
  ],
  pseudocode:
    'feasible = []\nfor stock_weight in candidates:\n    weights = [stock_weight, 1 - stock_weight]\n    expected_return = dot(weights, mu)\n    if sum(weights) == 1 and min(weights) >= 0 and expected_return >= minimum:\n        variance = weights.T @ Sigma @ weights\n        feasible.append((variance, weights))\nif not feasible:\n    report_infeasible()\nelse:\n    best = min(feasible, key=lambda row: row[0])\n    verify_all_constraints(best.weights)',
  walkthrough: [
    ['Construct weights', 'Full investment links the two shares; they are not independent inputs.'],
    ['dot(weights, mu)', 'Compute a weighted expected return with consistent periods.'],
    ['Feasibility condition', 'Filter unacceptable allocations before minimizing variance.'],
    ['Quadratic form', 'Include all covariance entries rather than adding asset volatilities.'],
    ['Empty feasible list', 'There is no valid listed solution to choose.'],
    ['Independent verification', 'Check returned shares against every stated requirement.'],
  ],
  complexity:
    'Evaluating C candidates across d assets with a dense covariance matrix costs O(C d²) time and O(d²) matrix space. Continuous quadratic-program solver cost depends on algorithm, sparsity, conditioning, and tolerance; it should not be described by the candidate-loop bound. Dense matrix factorizations can require O(d³) work per solver step.',
  advanced: [
    {
      title: 'Advanced: convexity and binding constraints',
      blocks: [
        p(
          'Positive semidefinite Σ gives a convex variance objective. Linear constraints form a convex feasible region, so a correctly solved convex problem has a global optimum; singular Σ can permit several equally good solutions. Nonlinear trading rules or integer lot constraints can change that problem class.',
        ),
        p(
          'A binding constraint sits exactly on its permitted boundary. Its multiplier can express how the optimal objective changes when the requirement is relaxed, under regularity conditions. This is a sensitivity result inside the estimated model rather than a promise of future improvement.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What does feasible mean?',
      [
        [
          'Satisfies all stated constraints',
          'Low objective value does not compensate for a violated requirement.',
        ],
        [
          'Has the lowest variance among any weights',
          'An unconstrained low-risk allocation can still fail return or investment rules.',
        ],
        [
          'Guarantees a future profit',
          'Feasibility concerns model constraints, not realized outcomes.',
        ],
      ],
      0,
      'Separate acceptability from optimality.',
    ),
    q(
      'definition',
      'practice',
      'What is the objective in the stated mean-variance problem?',
      [
        [
          'Minimize estimated portfolio variance',
          'The quadratic form wᵀΣw is the criterion being minimized.',
        ],
        [
          'Make every weight equal',
          'Equal weighting is a possible baseline, not the stated objective.',
        ],
        ['Ignore covariance', 'Covariance is part of the risk objective.'],
      ],
      0,
      'Read the expression following min.',
    ),
    q(
      'definition',
      'review',
      'How does optimization differ from supervised model training in this lesson?',
      [
        [
          'It chooses allocation weights from supplied return/risk inputs',
          'Parameter estimation can happen upstream; the optimizer solves the allocation problem.',
        ],
        ['It must learn default labels', 'Default classification is a different task.'],
        [
          'It always changes the historical return data',
          'The solver takes data-derived inputs; it does not rewrite outcomes.',
        ],
      ],
      0,
      'Identify the decision variables.',
    ),
    q(
      'mechanism',
      'guided',
      'What must happen before comparing candidate variances?',
      [
        [
          'Check all constraints',
          'Only feasible candidates are eligible for the constrained minimum.',
        ],
        [
          'Choose the lowest variance regardless of return',
          'That can select an allocation outside the permitted set.',
        ],
        ['Discard every covariance term', 'Risk calculation should match the stated assumptions.'],
      ],
      0,
      'Filter the feasible set first.',
    ),
    q(
      'mechanism',
      'practice',
      'What should the code report if its feasible list is empty?',
      [
        [
          'Infeasible among the listed candidates',
          'There is no acceptable candidate under the supplied requirements.',
        ],
        ['The first candidate anyway', 'That silently violates the problem’s constraints.'],
        ['A zero-risk portfolio', 'Zero is not established by a failed feasibility search.'],
      ],
      0,
      'Find the empty-list branch.',
    ),
    q(
      'mechanism',
      'review',
      'Why is a discrete candidate minimum not always the continuous optimum?',
      [
        [
          'A better feasible weight may lie between listed candidates',
          'The list can omit valid continuous solutions, as w = 2/3 is omitted here.',
        ],
        [
          'Continuous problems have no constraints',
          'The same constraints can apply to a continuous feasible set.',
        ],
        [
          'Candidate enumeration always proves global optimality over all real weights',
          'It only proves the best choice within the evaluated list.',
        ],
      ],
      0,
      'Inspect the domain searched by the loop.',
    ),
    q(
      'calculation',
      'guided',
      'What return results from half of a 10% asset and half of a 4% asset?',
      [
        ['7%', 'Each asset contributes its weighted expected return: 0.5 × 10% + 0.5 × 4% = 7%.'],
        ['14%', 'Adding asset returns ignores their portfolio shares.'],
        ['5%', 'This omits the second asset’s contribution.'],
      ],
      0,
      'Weight both returns.',
    ),
    q(
      'calculation',
      'practice',
      'What is the equal-weight covariance contribution when σA = 0.2, σB = 0.1, and ρ = 0.5?',
      [
        ['0.005', '2 × 0.5 × 0.5 × 0.5 × 0.2 × 0.1 = 0.005.'],
        ['0.01', 'This omits the correlation factor 0.5.'],
        ['0', 'Correlation is positive, so the covariance contribution is not zero.'],
      ],
      0,
      'Include twice the weight product and both standard deviations.',
    ),
    q(
      'calculation',
      'review',
      'What volatility follows from variance 0.0175?',
      [
        ['About 13.23%', '√0.0175 ≈ 0.13229, then express the fraction as a percent.'],
        ['1.75%', 'That reports the variance as though it were volatility.'],
        ['17.5%', 'This shifts the decimal without applying the square root.'],
      ],
      0,
      'Take the square root before converting units.',
    ),
    q(
      'application',
      'guided',
      'Among listed stock shares [0.50, 0.75, 1.00], which minimizes variance while reaching at least 8% return?',
      [
        ['0.50', 'Its 7% expected return fails the constraint.'],
        ['0.75', 'It reaches 8.5% and has less variance than the feasible all-stock candidate.'],
        ['1.00', 'It is feasible but has higher variance than 0.75.'],
      ],
      1,
      'Eliminate the infeasible choice first.',
    ),
    q(
      'application',
      'practice',
      'Why must covariance stress scenarios remain positive semidefinite?',
      [
        [
          'Otherwise the matrix can imply impossible negative variance',
          'A valid covariance model must yield nonnegative variance for every weight vector.',
        ],
        [
          'To force all assets to have the same return',
          'Covariance validity does not constrain expected returns to be equal.',
        ],
        [
          'To eliminate every portfolio constraint',
          'Matrix validity and allocation constraints are separate requirements.',
        ],
      ],
      0,
      'Consider the sign of a variance quadratic form.',
    ),
    q(
      'application',
      'review',
      'Why is a four-asset portfolio with each weight capped at 20% incompatible with full investment?',
      [
        [
          'The maximum total weight is only 80%',
          'Four times 20% falls short of the required 100%.',
        ],
        [
          'All capped portfolios are impossible',
          'Caps can be feasible when their sum permits full investment.',
        ],
        ['The covariance must be zero', 'The conflict exists before calculating any risk.'],
      ],
      0,
      'Add the position caps.',
    ),
  ],
});

const reinforcement = topic({
  slug: 'reinforcement-learning',
  title: 'Reinforcement learning',
  definition:
    'Reinforcement learning learns a policy for sequences of decisions from their rewards and next states. Q-learning updates an action’s estimated future value toward an immediate reward plus a discounted estimate of what can follow.',
  preciseDefinition:
    'In a Markov decision process, a policy maps states to actions or action distributions. Tabular Q-learning is an off-policy temporal-difference method updating Q(s,a) toward r + γ max Q(s′,a′), with a zero future term at terminal states. Its estimates depend on reward definition, coverage, and environment assumptions.',
  prerequisites: ['probability', 'algorithm-tracing', 'data-splits', 'variance'],
  terms: [
    [
      'State',
      'Information used to describe the current decision situation.',
      'Time left and shares still to buy.',
    ],
    ['Action', 'An allowed choice in that state.', 'Buy 100 shares now or wait.'],
    [
      'Reward',
      'Numeric feedback after acting, in stated units.',
      'Negative execution cost, with a penalty for incomplete orders.',
    ],
    [
      'Policy',
      'A rule choosing actions from states.',
      'TWAP buys equal shares in equal time intervals.',
    ],
    [
      'Q-value',
      'Estimate of total discounted reward from a state-action pair and subsequent behavior.',
      'Q = −5 is a reward-unit estimate, not a probability.',
    ],
    [
      'Episode',
      'A finite sequence ending at a terminal condition.',
      'One order completed or reaching its deadline.',
    ],
    [
      'TD error',
      'Difference between the update target and the old value estimate.',
      'Target 4 minus old value 2 gives error 2.',
    ],
    [
      'Exploration',
      'Try allowed actions to learn their consequences.',
      'Sample a non-greedy action in an offline simulator.',
    ],
    [
      'Exploitation',
      'Choose the action with best currently estimated value.',
      'Select the largest Q-value in the current state.',
    ],
  ],
  objectives: [
    'Define state, action, reward, policy, Q-value, episode, and exploration.',
    'Trace the Q-learning target and terminal-state handling.',
    'Compute two numerical Q updates and an execution-cost trace.',
    'Compare an execution policy with TWAP using completion, cost, and tail outcomes.',
  ],
  introduction: [
    p(
      'Supervised prediction learns an outcome from known input-label pairs. RL learns choices whose consequences can change later choices. Waiting to trade can save immediate cost but leave an unfinished order. Reward must represent that consequence, or the learner can earn a good score by failing the real task.',
    ),
    p(
      'A Markov state is intended to contain the information needed to model the next-state and reward distributions given the current action. An incomplete state can hide important history. A credible simulator or sufficiently informative logged policy data is necessary for meaningful training and evaluation.',
    ),
    p(
      'Q-values use reward units. If reward is negative dollars of cost, a Q-value of −2 is preferable to −5, all else equal. It is not a negative probability, a realized return, or a guaranteed savings amount.',
    ),
  ],
  mechanism: [
    list(
      'Specify states, permitted actions, reward components, transitions, and termination.',
      'Choose an action using exploration or the current greedy Q rule during training.',
      'Observe the reward and next state from the environment.',
      'Build the target from immediate reward plus discounted best next value, unless terminal.',
      'Move the old Q estimate partway toward that target.',
      'At inference, apply the learned policy under hard constraints without learning through uncontrolled live exploration.',
    ),
    p(
      'The learning rate α controls the update size. The discount γ controls how much future reward contributes; they have different roles. The max in the target selects the best estimated next action, not necessarily the action the exploration policy actually tries next.',
    ),
    p(
      'Training may use a simulator. Evaluation should run full episodes under new seeds or suitable held-back conditions. A changing market, simulator shortcuts, and poor action coverage can invalidate apparently successful learning.',
    ),
  ],
  formula: [
    math(
      String.raw`G_t=\sum_{k=0}^{T-t-1}\gamma^k r_{t+k},\qquad Q_{new}(s,a)=Q(s,a)+\alpha\left[r+\gamma\max_{a'}Q(s',a')-Q(s,a)\right]`,
      'Return adds discounted future rewards. The Q target is immediate reward plus the discounted best estimated next value. Subtract the old estimate, multiply by learning rate, and add the update. At termination, set the next-value contribution to zero.',
      [
        ['Gₜ', 'Discounted episode return from time t.'],
        ['T', 'Episode terminal time.'],
        ['r', 'Immediate reward.'],
        ['γ', 'Discount factor, commonly between zero and one.'],
        ['Q(s,a)', 'Old action-value estimate.'],
        ['Q_new', 'Updated estimate.'],
        ['α', 'Learning rate.'],
        ['s, a', 'Current state and action.'],
        ['s′, a′', 'Next state and an allowed next action.'],
      ],
    ),
    p(
      'The update can also be written Q_new = (1−α)Q_old + α target. For 0 ≤ α ≤ 1 it is a weighted average of the old estimate and target. A terminal reward is the target, but the new estimate reaches it in one step only when α = 1.',
    ),
  ],
  tiny: [
    p(
      'In the first transition, old Q = 2, immediate reward r = 1, γ = 0.5, next action values [4, 6], and α = 0.25. The reward is an abstract value with no market units.',
    ),
    table(
      ['Operation', 'Arithmetic'],
      [
        ['Best next value', 'max(4, 6) = 6'],
        ['Target', '1 + 0.5 × 6 = 4'],
        ['TD error', '4 − 2 = 2'],
        ['Updated value', '2 + 0.25 × 2 = 2.5'],
      ],
    ),
    p(
      'For a second, terminal transition on another pair, old Q = 3, terminal reward −2, and α = 0.5. There is no future term: target = −2, error = −2 − 3 = −5, and updated Q = 3 + 0.5(−5) = 0.5. Calling the new Q “−2” would confuse the target with the partial update.',
    ),
    p(
      'A greedy policy chooses the highest permitted Q-value. If available current actions have estimates 2.5 and 2.0, it chooses the first under that estimate, but exploration during training may choose the other action to gather evidence.',
    ),
  ],
  financial: [
    p(
      'A buy order targets 1,000 shares at an arrival benchmark of $50.00, fills 400 at $50.10 and 500 at $50.20, and leaves 100 unfilled. Closing price is $50.30 and fees are $5. Use a shortfall convention that includes opportunity cost on unfilled shares.',
    ),
    table(
      ['Cost component', 'Arithmetic', 'Dollars'],
      [
        ['Filled-share slippage', '400 × 0.10 + 500 × 0.20', '$140'],
        ['Unfilled opportunity cost', '100 × (50.30 − 50.00)', '$30'],
        ['Fees', 'Supplied total', '$5'],
        ['Total shortfall', '140 + 30 + 5', '$175'],
      ],
    ),
    p(
      'Completion is 900/1,000 = 90%. Benchmark notional is 1,000 × $50 = $50,000, so shortfall is $175/$50,000 × 10,000 = 35 basis points. A comparable fully completed TWAP order costing $150 has cost 30 bps, five bps less under this cost convention.',
    ),
    p(
      'A reward of negative shortfall would give −175 for the incomplete policy and −150 for the TWAP cost comparison, but completion is separately reported and must satisfy any hard order requirement. If the reward ignored unfilled shares, delaying trades could look artificially attractive. This hand trace is a hypothetical accounting convention, not a simulated optimal policy.',
    ),
  ],
  evaluation: [
    p(
      'Evaluate total episode cost, completion, violations, and expensive tail outcomes across comparable orders and price paths. Cumulative reward alone can hide omissions. A zero-mean random price term does not automatically make an expected-reward optimizer risk-averse; use explicit risk penalties or tail evaluation.',
    ),
    p(
      'Regret requires a named comparator. A hindsight best feasible schedule may use later prices unavailable to a live policy; it should not be confused with an implementable baseline such as TWAP. Compare under the same fees, benchmark, and incomplete-order treatment.',
    ),
    p(
      'Logged data may lack examples of actions a new policy proposes. Off-policy evaluation requires adequate coverage and assumptions; a simulator must represent price impact, liquidity, and deadlines. Validate offline and with controlled shadow evaluation before interpreting a teaching result as market performance.',
    ),
  ],
  pseudocode:
    'Q = initialize_values()\nfor episode in training_episodes:\n    state = environment.reset()\n    while not terminal(state):\n        action = explore_or_greedy(Q[state], allowed_actions(state))\n        next_state, reward, done = environment.step(action)\n        future = 0 if done else max(Q[next_state, a] for a in allowed_actions(next_state))\n        target = reward + gamma * future\n        Q[state, action] += alpha * (target - Q[state, action])\n        state = next_state\n# Inference: choose allowed argmax action under fixed learned Q.',
  walkthrough: [
    ['Reset episode', 'Each order or task begins with a defined initial state.'],
    ['Explore or greedy', 'Training balances learning about actions with using current estimates.'],
    ['environment.step', 'An action produces a reward and next situation.'],
    ['Terminal future = 0', 'No actions remain after termination, so there is no bootstrap value.'],
    [
      'alpha × TD error',
      'Move partially toward the target, rather than replacing Q unconditionally.',
    ],
    ['Allowed argmax at inference', 'Enforce constraints while applying a fitted choice rule.'],
  ],
  complexity:
    'A tabular Q table needs O(|S||A|) space for state/action counts. A transition update takes O(|A|) work to search next-state actions, or less with maintained maxima. Training cost multiplies this by observed transitions; a large or continuous state space may require function approximation, changing both memory and computation.',
  advanced: [
    {
      title: 'Advanced: Bellman targets and learning limits',
      blocks: [
        p(
          'The Bellman optimality relationship decomposes an action’s value into expected immediate reward and discounted best next-state value. Q-learning estimates it from sampled transitions, so its target is noisy and itself based on current estimates.',
        ),
        p(
          'Classical tabular convergence requires restrictive conditions, including sufficient visitation and suitable decreasing learning rates in a stationary setting. Function approximation, offline datasets, and changing market regimes do not inherit a blanket convergence guarantee. Policy reward and real financial utility must be aligned explicitly.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What is a policy?',
      [
        [
          'A rule choosing actions from states',
          'The policy maps the current situation to an action or action distribution.',
        ],
        [
          'Only an observed outcome label',
          'Labels belong to supervised prediction; a policy specifies choices.',
        ],
        [
          'Always the total reward',
          'Reward evaluates consequences, while a policy chooses actions.',
        ],
      ],
      0,
      'Ask what the agent uses to choose.',
    ),
    q(
      'definition',
      'practice',
      'What does Q(s,a) estimate?',
      [
        [
          'Discounted reward from taking an action and continuing',
          'Q is an action-value estimate in the reward’s units.',
        ],
        [
          'A probability that must lie between zero and one',
          'Q can be negative or exceed one depending on reward scale.',
        ],
        [
          'The number of allowed actions only',
          'Action count affects storage and search, not the value definition.',
        ],
      ],
      0,
      'Identify the value’s units.',
    ),
    q(
      'definition',
      'review',
      'Which distinction between α and γ is correct?',
      [
        [
          'α controls update size; γ discounts future reward',
          'The parameters affect learning and time preference respectively.',
        ],
        [
          'Both are probability cutoffs for an action',
          'Neither is a classification policy threshold in this update.',
        ],
        [
          'γ controls update size; α counts future periods',
          'This reverses their roles and gives α an incorrect interpretation.',
        ],
      ],
      0,
      'Read their separate places in the update.',
    ),
    q(
      'mechanism',
      'guided',
      'What future-value contribution is used for a terminal transition?',
      [
        ['Zero', 'The episode ends, so there is no next allowed action to value.'],
        [
          'The largest arbitrary stored Q entry',
          'Unrelated table entries must not bootstrap beyond the terminal state.',
        ],
        [
          'The old current Q',
          'That is subtracted to form the error, not used as a terminal future value.',
        ],
      ],
      0,
      'No decisions remain after termination.',
    ),
    q(
      'mechanism',
      'practice',
      'Why does the update use alpha × (target − old_Q)?',
      [
        [
          'To move partway toward the target',
          'For α in [0,1], it blends the old estimate with sampled target evidence.',
        ],
        [
          'To replace Q with the target every time',
          'Only α = 1 produces that complete replacement.',
        ],
        ['To turn rewards into probabilities', 'The update preserves reward-unit estimates.'],
      ],
      0,
      'Rewrite it as a weighted average.',
    ),
    q(
      'mechanism',
      'review',
      'What does exploration do during training?',
      [
        [
          'Try allowed actions that may not have the best current estimate',
          'This gathers information about alternatives instead of always exploiting Q.',
        ],
        [
          'Guarantee profitable live trades',
          'Trying actions has no such guarantee and belongs in a controlled setting.',
        ],
        ['Ignore all action constraints', 'Exploration should still respect allowed actions.'],
      ],
      0,
      'Distinguish information gathering from greedy choice.',
    ),
    q(
      'calculation',
      'guided',
      'For reward 1, γ = 0.5, and next values [4, 6], what is the target?',
      [
        ['4', 'Use the largest next value six and discount it: 1 + 0.5 × 6 = 4.'],
        ['3.5', 'This uses the mean five instead of the specified maximum six.'],
        ['7', 'This omits discounting of the next value.'],
      ],
      0,
      'Take the maximum before discounting.',
    ),
    q(
      'calculation',
      'practice',
      'Old Q = 2, target = 4, and α = 0.25. What is updated Q?',
      [
        ['2.5', 'The target-old gap is two; a quarter-step adds 0.5, so updated Q is 2.5.'],
        ['4', 'This replaces the estimate completely and ignores α.'],
        ['3', 'This scales the target directly rather than the gap.'],
      ],
      0,
      'Scale the TD error, not the target alone.',
    ),
    q(
      'calculation',
      'review',
      'Terminal reward −2, old Q = 3, and α = 0.5 give what updated value?',
      [
        ['−2', 'That is the target, reached directly only with α = 1.'],
        [
          '0.5',
          'The terminal target is −2, so the error is −5 and the half-step gives 3 − 2.5 = 0.5.',
        ],
        [
          '2',
          'This subtracts half the reward magnitude without accounting for the old-target gap.',
        ],
      ],
      1,
      'Set future value to zero, then update partially.',
    ),
    q(
      'application',
      'guided',
      'Total shortfall is $175 on a $50,000 benchmark notional. What is shortfall in basis points?',
      [
        ['35 bps', '175/50,000 = 0.0035; multiplying by 10,000 gives 35.'],
        ['3.5 bps', 'This misses a factor of ten in the basis-point conversion.'],
        ['175 bps', 'Dollar cost and basis points have different denominators and units.'],
      ],
      0,
      'One basis point is 0.0001 of notional.',
    ),
    q(
      'application',
      'practice',
      'Why can average cumulative reward hide a bad execution policy?',
      [
        [
          'The reward may omit incomplete orders or tail losses',
          'Good scores can reflect a flawed objective or hide rare expensive episodes.',
        ],
        [
          'Reward can never represent cost',
          'Negative cost is a valid reward convention when its components are complete.',
        ],
        [
          'All policies with equal mean reward have identical risk',
          'Their outcome distributions can differ greatly.',
        ],
      ],
      0,
      'Inspect reward components and the outcome distribution.',
    ),
    q(
      'application',
      'review',
      'An order fills 900 of 1,000 shares. What is completion?',
      [
        ['90%', '900/1,000 = 0.9; the 100 unfilled shares remain visible.'],
        ['100%', 'Accounting for opportunity cost does not mean the order was completed.'],
        ['10%', 'Ten percent is the unfilled fraction, not completion.'],
      ],
      0,
      'Divide filled shares by requested shares.',
    ),
  ],
});

const simulation = topic({
  slug: 'monte-carlo',
  title: 'Monte Carlo simulation',
  definition:
    'Monte Carlo simulation draws many possible outcomes from stated assumptions and calculates a result for each. Their distribution estimates averages, tail losses, and probabilities within that model.',
  preciseDefinition:
    'Monte Carlo estimates expectations or probabilities by sample averages of functions of random draws. Under appropriate independence and finite-variance conditions, sampling error decreases with the square root of the number of runs; increasing runs does not remove model or parameter error.',
  prerequisites: ['probability', 'variance', 'algorithm-tracing', 'data-splits'],
  terms: [
    [
      'Random draw',
      'A sampled value from a specified distribution.',
      'A uniform number determines whether a teaching borrower defaults.',
    ],
    [
      'Trial or scenario',
      'One complete set of draws and its computed outcome.',
      'One scenario samples all borrower defaults before adding loss.',
    ],
    [
      'PD',
      'Probability of default over the defined horizon.',
      'PD = 0.25 means a 25% marginal event chance in the model.',
    ],
    ['EAD', 'Exposure at default, in currency units.', 'A $100 teaching loan balance.'],
    [
      'LGD',
      'Fraction of exposure lost conditional on default.',
      'LGD = 0.40 gives $40 loss on a $100 exposure.',
    ],
    [
      'Indicator',
      'A value of one when a condition holds, otherwise zero.',
      '1[u < PD] marks a simulated default.',
    ],
    [
      'Sampling error',
      'Variation caused by using finitely many draws.',
      'Two random runs can produce different reserve-breach estimates.',
    ],
    [
      'Model uncertainty',
      'Uncertainty about the assumptions and parameters used to generate outcomes.',
      'Unknown dependence between borrowers is not fixed by more trials.',
    ],
    [
      'Dependence',
      'Relationship between random outcomes across items.',
      'Shared conditions can cause defaults to happen together.',
    ],
  ],
  objectives: [
    'Define distributions, trials, indicators, PD/EAD/LGD, and sampling versus model uncertainty.',
    'Trace draw-to-default-to-loss simulation and distinguish it from predictive-model fitting.',
    'Compute an exact small loss distribution and hand trace supplied random scenarios.',
    'Interpret reserves, quantiles, tail averages, and Monte Carlo standard error.',
  ],
  introduction: [
    p(
      'A simulation is a machine for propagating assumptions, not validating them. It can use inputs estimated by statistical models, but generating additional random trials does not train those models or establish that the probabilities are correct.',
    ),
    p(
      'For each borrower, a default indicator turns a conditional loss amount into either zero or that amount. A trial is the whole portfolio outcome, not one borrower draw. New trials must redraw their randomness under the declared model.',
    ),
    p(
      'Independence between trials differs from independence between borrowers. Borrowers may share a systematic factor within one trial while separate trials remain independent. Dependence can change tail concentration even when individual default probabilities and expected loss stay the same.',
    ),
  ],
  mechanism: [
    list(
      'State the horizon and each borrower’s default probability, exposure, loss fraction, and dependence assumption.',
      'Draw one complete portfolio scenario using the selected random model.',
      'Convert draws into default indicators using the stated strict comparison.',
      'Add borrower loss contributions to obtain one scenario loss.',
      'Repeat scenarios with new draws, then summarize average loss, quantiles, and reserve breaches.',
      'Check a known small case, report Monte Carlo error, and stress model assumptions separately.',
    ),
    p(
      'A uniform U on [0,1) produces a Bernoulli default indicator when U < PD. Equality is not a default under this convention. Likewise, a reserve breach here means loss strictly greater than the reserve; equality is not a breach.',
    ),
    p(
      'Use a fixed random seed to reproduce a teaching run, then use several seeds to inspect sampling variation. Reusing a fixed draw set can help compare two policies under common randomness, but it does not create more independent evidence.',
    ),
  ],
  formula: [
    math(
      String.raw`D_i=\mathbf1[U_i<PD_i],\quad L=\sum_i D_i EAD_i LGD_i,\quad E[L]=\sum_i PD_i EAD_i LGD_i`,
      'Compare each uniform draw with its default probability. A default contributes exposure times loss fraction; add the contributions. Expected portfolio loss adds probability-weighted conditional loss amounts when exposure and LGD are fixed.',
      [
        ['Dᵢ', 'Default indicator for borrower i.'],
        ['Uᵢ', 'Uniform random draw.'],
        ['PDᵢ', 'Marginal default probability.'],
        ['EADᵢ', 'Fixed exposure at default.'],
        ['LGDᵢ', 'Fixed conditional loss fraction.'],
        ['L', 'Portfolio scenario loss.'],
        ['E[L]', 'Model expected loss.'],
      ],
    ),
    math(
      String.raw`\hat p=\frac BN,\qquad SE(\hat p)=\sqrt{\frac{\hat p(1-\hat p)}N}`,
      'Divide breach count B by N independent portfolio trials to estimate breach probability. The Bernoulli standard-error expression quantifies finite-run sampling noise under the fixed model.',
      [
        ['p̂', 'Estimated breach probability.'],
        ['B', 'Number of strict reserve breaches.'],
        ['N', 'Number of independent trials.'],
        ['SE', 'Estimated Monte Carlo standard error.'],
      ],
    ),
    p(
      'Linearity of expectation does not require borrowers to default independently. The simple expected-loss sum uses fixed exposures and loss fractions; random losses conditional on default require the corresponding conditional expectations.',
    ),
  ],
  tiny: [
    p(
      'Two independent loans each have EAD $100, LGD 0.40, and PD 0.25. Each default costs $40.',
    ),
    table(
      ['Defaults', 'Scenario loss', 'Probability'],
      [
        ['Neither', '$0', '0.75 × 0.75 = 0.5625'],
        ['Only loan A', '$40', '0.25 × 0.75 = 0.1875'],
        ['Only loan B', '$40', '0.75 × 0.25 = 0.1875'],
        ['Both', '$80', '0.25 × 0.25 = 0.0625'],
      ],
    ),
    p(
      'Expected loss is $0 × 0.5625 + $40 × 0.375 + $80 × 0.0625 = $20, matching 2 × 0.25 × $100 × 0.40. With reserve $40 and strict loss > reserve, breach probability is 0.0625 because only the $80 outcome breaches.',
    ),
    p(
      'If the defaults were perfectly linked with the same marginal PD 0.25, losses would be $0 with probability 0.75 and $80 with probability 0.25. Expected loss remains $20, but the $40 reserve-breach probability rises to 25%. Dependence changes the tail without changing this mean.',
    ),
  ],
  financial: [
    p(
      'Four portfolio trials use draw pairs [0.10, 0.80], [0.70, 0.90], [0.20, 0.15], [0.25, 0.60] for the same two loans. Default is U < 0.25.',
    ),
    table(
      ['Trial', 'Default indicators', 'Loss', 'Loss > $40?'],
      [
        ['1', '[1, 0]', '$40', 'No'],
        ['2', '[0, 0]', '$0', 'No'],
        ['3', '[1, 1]', '$80', 'Yes'],
        ['4', '[0, 0]', '$0', 'No; 0.25 is not below 0.25'],
      ],
    ),
    p(
      'Sample mean loss is ($40 + $0 + $80 + $0)/4 = $30. Breach estimate is 1/4 = 25%; standard error is √(0.25 × 0.75/4) ≈ 0.2165, or 21.65 percentage points. These four trials are far too few for precise probability estimation and differ from the exact independent-model breach rate 6.25%.',
    ),
    p(
      'Sorted sample losses are [$0, $0, $40, $80]. Using nearest-rank 75% VaR, position ceil(0.75 × 4) = 3 gives $40. The worst 25% means one equally weighted scenario, so tail mean is $80. Averaging only losses strictly greater than VaR can give the wrong tail size when many values tie; use the specified tail-count convention.',
    ),
  ],
  evaluation: [
    p(
      'Check simulation mean against a closed-form result where available. Increase runs and repeat seeds to study convergence. For an interior Bernoulli probability, multiplying independent runs by four approximately halves Monte Carlo standard error. It does not halve uncertainty about PD, LGD, or dependence.',
    ),
    p(
      'Report the horizon, loss sign, quantile method, tail averaging convention, reserve inequality, and number of trials. VaR is a quantile, not the maximum possible loss. ES is the mean of the specified tail rather than an arbitrary mean of all values above a threshold.',
    ),
    p(
      'Stress default probabilities, exposure, recovery, dependence, and missing tail events. Historical comparisons can help validate assumptions, but a precise simulated number can still come from a poor model. Small samples and probabilities near zero or one need more care than a normal-approximation interval.',
    ),
  ],
  pseudocode:
    'assert N > 0 and 0 < confidence < 1\nlosses = []\nfor trial in range(N):\n    draws = random_model.draw_portfolio()\n    default = draws < PD\n    loss = sum(default * EAD * LGD)\n    losses.append(loss)\nmean_loss = mean(losses)\nbreaches = sum(loss > reserve for loss in losses)\np_hat = breaches / N\nstandard_error = sqrt(p_hat * (1 - p_hat) / N)\nsorted_losses = sorted(losses)\nVaR = sorted_losses[ceil(confidence * N) - 1]\n# Match the retained exercise convention; protect integer tails from float drift.\ntail_count = ceil((1 - confidence - 1e-12) * N)\nES = mean(sorted_losses[-tail_count:])',
  walkthrough: [
    [
      'Draw a complete portfolio',
      'Model dependence within a scenario; use new randomness for the next trial.',
    ],
    ['draws < PD', 'A strict comparison turns uniform draws into binary events.'],
    [
      'Sum default × exposure × severity',
      'Only defaulted loans contribute fixed conditional loss.',
    ],
    ['loss > reserve', 'Equality does not count as a breach under this policy.'],
    [
      'Nearest-rank index',
      'Use one-based ceil(confidence × N), then convert to a zero-based array index.',
    ],
    [
      'Fixed tail count',
      'The worst equally weighted scenarios define ES even with boundary ties. The tiny floating-point adjustment preserves the retained exercise convention for integer tail sizes.',
    ],
  ],
  complexity:
    'For N trials and d borrowers, direct loss simulation takes O(N d) arithmetic. Streaming mean and breach counts needs O(1) summary space beyond model inputs; storing all losses needs O(N). Sorting stored losses for quantiles takes O(N log N), while selection algorithms or sketches can change the quantile cost and accuracy.',
  advanced: [
    {
      title: 'Advanced: a common-factor default model',
      blocks: [
        math(
          String.raw`Z_i=\sqrt\rho\,Y+\sqrt{1-\rho}\,\varepsilon_i,\quad D_i=\mathbf1[Z_i<\Phi^{-1}(PD_i)]`,
          'Combine a shared normal factor Y with independent borrower-specific normal factors. Compare each latent value with the normal quantile for its marginal default probability. New trials redraw the shared and borrower-specific factors.',
          [
            ['Zᵢ', 'Standard-normal latent risk value for borrower i.'],
            ['ρ', 'Common-factor variance share, between zero and one.'],
            ['Y', 'Shared standard-normal factor.'],
            ['εᵢ', 'Independent standard-normal borrower factor.'],
            ['Φ⁻¹', 'Standard-normal inverse distribution function.'],
            ['PDᵢ', 'Marginal default probability.'],
            ['Dᵢ', 'Simulated default indicator.'],
          ],
        ),
        p(
          'Latent-value correlation ρ is not generally equal to default-indicator correlation. This construction preserves marginal normal cutoffs under its assumptions. More elaborate models may also make exposure or LGD depend on the same stressed conditions, so fixed-loss formulas must then be adapted.',
        ),
      ],
    },
  ],
  questions: [
    q(
      'definition',
      'guided',
      'What is one portfolio trial?',
      [
        [
          'A complete set of draws and its computed loss',
          'All borrower outcomes combine into one scenario result.',
        ],
        ['One borrower’s PD parameter', 'PD is a model input used across trials.'],
        [
          'A guaranteed future loss',
          'A scenario is a modelled possibility rather than a certain outcome.',
        ],
      ],
      0,
      'Define the unit being averaged.',
    ),
    q(
      'definition',
      'practice',
      'Which uncertainty is reduced by adding independent simulation runs?',
      [
        [
          'Finite-run sampling error',
          'More draws improve numerical estimation within the fixed assumptions.',
        ],
        [
          'Every error in the assumed PD values',
          'More trials reuse those assumptions and do not validate them.',
        ],
        [
          'All missing dependence relationships',
          'Omitted dependence is a model issue requiring a different specification.',
        ],
      ],
      0,
      'Separate numerical precision from model accuracy.',
    ),
    q(
      'definition',
      'review',
      'Does the expected-loss sum require borrowers to default independently when EAD and LGD are fixed?',
      [
        [
          'No: expectation is additive even with dependence',
          'Marginal expected contributions add; dependence instead changes joint outcomes and tails.',
        ],
        [
          'Yes: any dependence makes a sum impossible',
          'Linearity of expectation holds without independence.',
        ],
        [
          'Only when PD is exactly 50%',
          'The additive property is not limited to one probability value.',
        ],
      ],
      0,
      'Recall linearity of expectation.',
    ),
    q(
      'mechanism',
      'guided',
      'Under default = U < PD, does U = PD count as default?',
      [
        ['No', 'The specified comparison is strict and excludes equality.'],
        ['Yes always', 'That would use ≤ and change the stated rule.'],
        [
          'Only if the reserve is large',
          'Default sampling and reserve evaluation are different operations.',
        ],
      ],
      0,
      'Inspect the inequality.',
    ),
    q(
      'mechanism',
      'practice',
      'Why draw a new shared factor for every trial in a common-factor model?',
      [
        [
          'To create independent scenarios under the fixed model',
          'Borrowers share a factor inside a trial; new trials use new randomness.',
        ],
        [
          'To force every borrower to default',
          'The factor still passes through borrower-specific thresholds.',
        ],
        [
          'To train the model’s PD automatically',
          'Redrawing scenarios does not update the supplied PD parameters.',
        ],
      ],
      0,
      'Distinguish within-trial dependence from between-trial independence.',
    ),
    q(
      'mechanism',
      'review',
      'How is nearest-rank VaR located in a zero-based sorted loss array?',
      [
        [
          'Index ceil(confidence × N) − 1',
          'Nearest rank is a one-based position; subtract one to access the array.',
        ],
        ['Index confidence without using N', 'A fractional confidence is not an array location.'],
        ['Always the largest loss', 'VaR selects the stated quantile rather than the maximum.'],
      ],
      0,
      'Convert the one-based rank to array indexing.',
    ),
    q(
      'calculation',
      'guided',
      'PD = 0.25, EAD = $100, and LGD = 0.40 imply what expected loss for one loan?',
      [
        ['$10', 'Default loss is $40, and weighting it by 0.25 gives expected loss $10.'],
        ['$40', 'Forty is loss conditional on default, before weighting by PD.'],
        ['$25', 'This omits the loss-given-default fraction.'],
      ],
      0,
      'Multiply all three inputs.',
    ),
    q(
      'calculation',
      'practice',
      'What is probability of both independent teaching loans defaulting?',
      [
        ['0.0625', 'Independent default events have joint probability 0.25 × 0.25 = 0.0625.'],
        ['0.5', 'Adding event chances is not the intersection probability.'],
        ['0.25', 'That is one marginal probability or the perfectly linked case.'],
      ],
      0,
      'Independence permits multiplying the two event probabilities.',
    ),
    q(
      'calculation',
      'review',
      'Under perfect linkage with marginal PD 0.25, what is expected loss for the two-loan portfolio?',
      [
        [
          '$20',
          'Loss $80 occurs with probability 0.25, giving $20; the marginal mean is unchanged.',
        ],
        ['$80', 'This is the worst conditional loss rather than its expectation.'],
        ['$5', 'This incorrectly keeps the independent joint default probability 0.0625.'],
      ],
      0,
      'Use the linked scenario distribution.',
    ),
    q(
      'application',
      'guided',
      'Hand-traced losses are [$40, $0, $80, $0], reserve $40, strict loss > reserve. What is breach rate?',
      [
        ['25%', 'Only the $80 trial exceeds $40, so one of four breaches.'],
        ['50%', 'The $40 trial equals the reserve and is excluded by the strict rule.'],
        ['75%', 'The zero-loss trials are below the $40 reserve; only the $80 trial exceeds it.'],
      ],
      0,
      'Count only strict exceedances.',
    ),
    q(
      'application',
      'practice',
      'To approximately halve interior-probability Monte Carlo standard error, how many independent runs are needed?',
      [
        [
          'Four times as many',
          'Standard error scales as 1/√N, so multiplying N by four halves it.',
        ],
        ['Twice as many', 'Doubling reduces standard error by about √2 rather than two.'],
        [
          'The same count with more displayed decimals',
          'Formatting cannot change sampling uncertainty.',
        ],
      ],
      0,
      'Use the square-root sample-size relationship.',
    ),
    q(
      'application',
      'review',
      'Sorted sample losses [$0, $0, $40, $80] have nearest-rank 75% VaR equal to what?',
      [
        ['$40', 'ceil(0.75 × 4) = 3, whose one-based position is $40.'],
        ['$80', 'That is the maximum and the one-scenario worst-tail mean here.'],
        ['$20', 'That interpolates a different quantile convention rather than nearest rank.'],
      ],
      0,
      'Use the stated rank convention without interpolation.',
    ),
  ],
});

export const algorithmTopics: TeachingTopic[] = [
  logistic,
  trees,
  boosting,
  clustering,
  isolation,
  forecasting,
  graphs,
  attention,
  retrieval,
  allocation,
  reinforcement,
  simulation,
];
