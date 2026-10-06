import type { Givens, Value } from '../engine/types';
import { mean, sigmoid, solve, sum } from '../engine/solve/core';
import { random } from '../engine/variants';

export interface AlgorithmVisualStep {
  title: string;
  explanation: string;
  formula: string;
  terms: string[];
  exerciseSteps: string[];
}
export interface AlgorithmVisualDefinition {
  exercise: string;
  title: string;
  question: string;
  takeaway: string;
  methods: string[];
  steps: AlgorithmVisualStep[];
  prediction: { question: string; options: [string, string]; correct: number; explanation: string };
}
const step = (
  title: string,
  explanation: string,
  formula: string,
  terms: string[],
  exerciseSteps: string[],
): AlgorithmVisualStep => ({ title, explanation, formula, terms, exerciseSteps });

export const algorithmVisuals: Record<string, AlgorithmVisualDefinition> = {
  'logistic-regression': {
    exercise: 'A01',
    title: 'From application evidence to a decision',
    question: 'Where does the risk estimate end and the lending policy begin?',
    takeaway:
      'The model estimates a chance; the lender’s policy uses that estimate to choose an action. Moving the review cutoff can change the action without changing the applicant’s estimated chance of default.',
    methods: ['Score → probability → policy', 'Regularization comparison'],
    steps: [
      step(
        'Add the evidence',
        'Each input adds or subtracts part of the score according to its supplied weight. Here, DTI is entered in percentage points (35 means 35%), income is entered in thousands of dollars (60 means $60,000), and the delinquency input is 1 or 0. The score can be negative; it is not yet a probability.',
        'z = −3 + 0.04 × DTI + 1.2 × delinquency − 0.03 × income',
        ['score', 'DTI', 'delinquency', 'income'],
        ['z'],
      ),
      step(
        'Convert to probability',
        'A score can be any positive or negative number, while a probability must stay between 0 and 1. The sigmoid makes that conversion: zero becomes 0.50 (a 50% chance), negative scores fall below 50%, and positive scores rise above 50%.',
        'p = 1 / (1 + exp(−z))',
        ['score', 'probability'],
        ['p', 'odds'],
      ),
      step(
        'Calculate loss if default occurs',
        'Multiply the dollars outstanding by the fraction expected to remain unrecovered. This estimates the loss in the specific scenario where default occurs; it does not include how likely default is.',
        'loss on default = exposure × LGD',
        ['exposure', 'LGD'],
        ['lossOnDefault'],
      ),
      step(
        'Average across comparable loans',
        'Multiply the loss-if-default amount by the estimated chance of default. This probability weighting gives an average across similar loans under these assumptions, not a guaranteed bill for this borrower.',
        'EL = p × exposure × LGD',
        ['probability', 'exposure', 'LGD'],
        ['EL'],
      ),
      step(
        'Apply the policy',
        'Compare the estimated probability with the chosen cutoff. At or above the cutoff, this teaching policy requests a human review. A cutoff selects an action; it does not change the estimate, and review is not the same as rejection.',
        'review if p ≥ threshold',
        ['probability', 'threshold'],
        ['decision'],
      ),
    ],
    prediction: {
      question: 'Raise only the review threshold. What changes?',
      options: [
        'The action may change; estimated risk stays fixed.',
        'Estimated default probability falls.',
      ],
      correct: 0,
      explanation:
        'The threshold is applied after the model has estimated risk. Moving it can change whether the case is reviewed, but with the applicant details fixed it does not change the score, probability, or probability-weighted expected loss.',
    },
  },
  'trees-and-forests': {
    exercise: 'A02',
    title: 'Split a group, then combine trees',
    question: 'How does a tree find a useful question, and what changes when several trees are combined?',
    takeaway:
      'A useful split makes the resulting groups less mixed, with larger groups counting more. A forest averages scores from many trees; its score still needs checking before it is treated as a probability.',
    methods: ['Decision tree', 'Random forest', 'Bootstrap samples'],
    steps: [
      step(
        'Inspect the parent',
        'Start with all transactions before the device question. Gini impurity measures how mixed the fraud and legitimate labels are: zero means every transaction has the same label.',
        'Gini = 1 − p(fraud)² − p(legitimate)²',
        ['parent', 'fraud', 'legitimate'],
        ['parent'],
      ),
      step(
        'Follow the split',
        'The question “new device or trusted device?” divides the parent into two smaller groups, called children. Follow either branch to see which transactions and outcomes it contains.',
        'parent → new device / trusted device',
        ['new device', 'trusted device'],
        ['newGini', 'trustedGini'],
      ),
      step(
        'Weight child impurity',
        'A child with more transactions should have more influence on the combined result. Multiply each child’s impurity by its share of the full group, then add the weighted values.',
        'weighted Gini = Σ (child count / total) × child Gini',
        ['child count', 'weighted'],
        ['weighted', 'gain'],
      ),
      step(
        'Average several trees',
        'A bootstrap sample is made by drawing training transactions with replacement, so a transaction can appear more than once. The forest also gives trees different subsets of inputs. Add their different scores and divide by the number of trees; this average is not a majority vote.',
        'forest score = (tree 1 + tree 2 + tree 3) / 3',
        ['tree scores', 'forest'],
        ['score'],
      ),
      step(
        'Compare the action',
        'Apply the same challenge cutoff to the forest average and to the first tree alone. Scores near a cutoff can change an action, but a score is not automatically a trustworthy probability.',
        'review if forest score ≥ threshold',
        ['forest', 'threshold'],
        ['decision', 'firstDecision'],
      ),
    ],
    prediction: {
      question:
        'A large child is impure and a tiny child is pure. Which matters more to the split?',
      options: ['They contribute equally.', 'The large child contributes more.'],
      correct: 1,
      explanation: 'The larger child contributes more because it contains more of the transactions. Multiply each child’s impurity by its fraction of the full group; do not give a tiny group the same weight as a large one.',
    },
  },
  'gradient-boosting': {
    exercise: 'A03',
    title: 'Build a prediction one correction at a time',
    question: 'How does a learning rate control each new tree’s contribution?',
    takeaway:
      'Boosting keeps earlier trees and adds each new correction to their running score. In this example the corrections are added on the log-odds scale; the sigmoid converts the final score to a chance only after the updates. A smaller learning rate shrinks each fixed correction, but retraining can also change later trees.',
    methods: [
      'Sequential corrections',
      'Early stopping',
      'Forest versus boosting',
      'XGBoost / LightGBM / CatBoost',
    ],
    steps: [
      step(
        'Start with a score',
        'The first number is a log-odds score, which sits at zero for a 50 percent chance. A negative value means the model thinks the event is less likely to happen than not; a positive value means the estimated chance is above 50 percent. The next step converts this score into a probability.',
        'F₀ = starting log-odds',
        ['starting score'],
        [],
      ),
      step(
        'Add tree one',
        'A tree proposes a correction h₁. Multiply it by η, the learning rate between 0 and 1, so the model adds only part of the proposed change. Then add that amount to the starting score. A positive correction moves the score up; a negative one moves it down.',
        'F₁ = F₀ + ηh₁',
        ['starting score', 'learning rate', 'tree 1'],
        ['F1', 'smallF1'],
      ),
      step(
        'Keep it and add tree two',
        'Tree two responds to what the current model still gets wrong. Start from the score after tree one, scale the second correction by the same rate, and add it. The first tree stays in the running total; tree two does not replace it.',
        'F₂ = F₁ + ηh₂',
        ['tree 1', 'tree 2', 'learning rate'],
        ['F2', 'smallF2'],
      ),
      step(
        'Map the score to risk',
        'The corrections changed log-odds, not probability percentage points. Apply the sigmoid to the completed score to get a value from 0 to 1: zero maps to 50%, negative scores to below 50%, and positive scores to above 50%.',
        'p = sigmoid(F₂)',
        ['final score', 'probability'],
        ['p', 'smallP'],
      ),
      step(
        'Compare learning rates',
        'Here the two tree outputs stay fixed, so the comparison isolates the arithmetic effect of changing η: a smaller rate adds less of each correction. A full retraining is a different experiment because later trees may learn different corrections too.',
        'compare η with supplied η₂',
        ['learning rate', 'probability'],
        ['decision', 'smallDecision'],
      ),
    ],
    prediction: {
      question:
        'If a positive tree correction is multiplied by a smaller learning rate, what happens?',
      options: ['The score moves a smaller distance.', 'The score always becomes negative.'],
      correct: 0,
      explanation:
        'Multiplying by the smaller rate shortens this tree’s correction while keeping its direction. Whether the final score or probability is positive depends on the starting score and all corrections together.',
    },
  },
  'k-means': {
    exercise: 'A04',
    title: 'Assign points, move centers, repeat',
    question: 'How does repeating “assign to a nearby center, then update the center” create groups?',
    takeaway:
      'K-means repeatedly assigns each example to a nearby average center, then recalculates those centers. The result depends on the chosen inputs, their scales, the starting points, and the selected group count; a cluster is not proof of creditworthiness.',
    methods: ['K-means', 'DBSCAN neighborhoods', 'Feature scaling'],
    steps: [
      step(
        'Start with centers',
        'The main example uses savings rates measured in percentage points. Squares show the two chosen starting averages; circles show customer examples. Different starting centers can lead to a different final grouping.',
        'choose starting centers μ₁, μ₂',
        ['points', 'centers'],
        [],
      ),
      step(
        'Assign the nearest center',
        'Measure each customer’s distance from both centers and assign the closer one. Here an exact tie goes to group 1. This assigns a descriptive group; it does not rank the customer.',
        'group(x) = argminⱼ |x − μⱼ|',
        ['distance', 'centers'],
        ['groups'],
      ),
      step(
        'Update the centers',
        'Find the arithmetic average of the savings rates in each group and move its center there. The center now describes the current members; it is not a target for customers.',
        'μⱼ = mean(points in group j)',
        ['mean', 'centers'],
        ['c1', 'c2'],
      ),
      step(
        'Repeat until stable',
        'Repeat assignment and averaging. The displayed objective, called inertia, adds squared distances from each customer to its group center. A lower value means closer groups in these inputs, but adding more groups usually lowers it and does not prove the segments are useful.',
        'inertia = Σ |xᵢ − μgroup(i)|²',
        ['distance', 'inertia'],
        ['inertia'],
      ),
      step(
        'Place a new customer',
        'Compare the new customer with the updated centers used in this exercise and choose the closer one. Group numbers are arbitrary labels: this grouping describes savings behavior and does not establish creditworthiness or a suitable product.',
        'compare |new − μ₁| and |new − μ₂|',
        ['new customer', 'distance'],
        ['d1', 'd2', 'group'],
      ),
    ],
    prediction: {
      question: 'Two customers have savings rates 10% and 20%. Where is their updated center?',
      options: ['15%.', '30%.'],
      correct: 0,
      explanation: 'The center is the arithmetic mean: add the two rates and divide by two, so (10% + 20%) ÷ 2 = 15%. The mean represents these two customers; it is not a target and is not found by adding the rates without dividing.',
    },
  },
  'isolation-forest': {
    exercise: 'A05',
    title: 'Count the cuts needed to isolate a transaction',
    question: 'Which transaction stands alone after fewer random cuts?',
    takeaway:
      'Shorter average isolation paths imply greater unusualness under the stated score convention. Unusualness is not a fraud probability.',
    methods: ['Supplied isolation paths', 'Random cut illustration', 'Review capacity'],
    steps: [
      step(
        'Select a transaction',
        'A, B, and C each have three supplied path lengths, one from each random-cut tree. Select a transaction to see how quickly the trees separated it from the reference group.',
        'h = number of cuts along a path',
        ['transaction', 'path'],
        [],
      ),
      step(
        'Count each tree’s path',
        'Each cut divides a group of transactions into smaller groups. The number of cuts before this transaction stands alone is its path length. Different random trees can take different numbers of cuts for the same transaction.',
        'h₁, h₂, h₃',
        ['path', 'tree'],
        [],
      ),
      step(
        'Average the paths',
        'Average the three path lengths so the score reflects all three trees instead of relying on one random tree. A smaller average means the transaction was separated sooner.',
        'E[h] = (h₁ + h₂ + h₃) / 3',
        ['path', 'mean'],
        ['means'],
      ),
      step(
        'Normalize to a score',
        'The formula turns the average path into a score: shorter paths give larger scores here. The score direction varies across software, so read its definition before sorting.',
        's = 2^(−E[h] / c)',
        ['mean', 'normalization', 'score'],
        ['scores'],
      ),
      step(
        'Build a review queue',
        'Sort from largest score to smallest and send only the number of cases the investigators can review. This chooses a review order; it does not confirm fraud. Evidence comes from the investigation.',
        'rank descending by anomaly score',
        ['score', 'review'],
        ['top'],
      ),
    ],
    prediction: {
      question:
        'A transaction has a shorter average path. Under this score definition, its score is…',
      options: ['Higher.', 'Lower.'],
      correct: 0,
      explanation:
        'In s = 2^(−average path/c), lowering a positive average path makes the exponent less negative. That makes the score larger, which means more unusual under this exercise’s definition. It still says nothing by itself about whether the transaction is fraud.',
    },
  },
  'time-series': {
    exercise: 'A06',
    title: 'Forecast using only the observed past',
    question: 'What can treasury know when it forecasts settlement outflows?',
    takeaway:
      'A forecast must use only information available at the time it is made. ARIMA models the expected level or change; GARCH models how the size of forecast errors changes over time.',
    methods: [
      'ARIMA(1,1,0)',
      'Seasonal naive / SARIMA',
      'AR and MA terms',
      'GARCH volatility',
      'Walk-forward evaluation',
    ],
    steps: [
      step(
        'Freeze the observed past',
        'At the forecast date, treasury knows the previous and latest outflow. The later actual is still in the future, so hold it back until the forecast is recorded.',
        'known: yₜ₋₁ and yₜ',
        ['previous', 'last'],
        [],
      ),
      step(
        'Difference the series',
        'Subtract the previous day’s level from the latest level. This gives the change in outflow, which the example models before rebuilding a forecast level.',
        'Δyₜ = yₜ − yₜ₋₁',
        ['previous', 'last', 'change'],
        ['change'],
      ),
      step(
        'Forecast the next change',
        'Multiply the latest observed change by the fitted coefficient. This example carries half of the recent change forward; it is a model assumption, not a guarantee.',
        'Δŷₜ₊₁ = φ Δyₜ',
        ['change', 'coefficient'],
        ['nextChange', 'secondChange'],
      ),
      step(
        'Return to the level',
        'Add the predicted change to the latest observed level to get an outflow amount. For a second day ahead, use the first predicted change because the actual next-day value is not available yet.',
        'ŷₜ₊₁ = yₜ + Δŷₜ₊₁',
        ['last', 'forecast'],
        ['next', 'second', 'liquidity'],
      ),
      step(
        'Reveal the later actual',
        'After recording the forecast, compare it and the simple last-value forecast with the same later actual. Their absolute errors measure how far each estimate was off. The $10 million cash buffer is a planning choice; it is not a statistical prediction interval.',
        '|actual − forecast|',
        ['actual', 'forecast', 'baseline'],
        ['modelError', 'baselineError'],
      ),
    ],
    prediction: {
      question: 'A seven-day seasonal-naive forecast extends to day 15. What can it use?',
      options: [
        'The actual observed on future day 8.',
        'The matching day from the last fully observed week.',
      ],
      correct: 1,
      explanation:
        'Use the matching day from the last complete observed week. The future day-8 actual is unavailable at the forecast date; using it would let the forecast peek at the answer.',
    },
  },
  'graph-methods': {
    exercise: 'A07',
    title: 'Trace the relationships behind an alert',
    question: 'What do recorded links show, and what still needs investigation?',
    takeaway:
      'A graph records defined relationships between entities. Paths and groups can guide an investigation, but a connection by itself does not establish intent or wrongdoing.',
    methods: [
      'Connected components',
      'Degree / weighted degree',
      'Shortest path',
      'Communities',
      'PageRank',
      'Temporal motifs',
      'GNN message passing',
      'Historical cutoff',
    ],
    steps: [
      step(
        'Name the entities',
        'Circles represent accounts, squares represent devices, and the diamond represents a merchant. A link (edge) joins two nodes. Read its label: a shared device and a payment to the same merchant have different meanings.',
        'nodes + typed edges',
        ['nodes', 'edges'],
        [],
      ),
      step(
        'Inspect direct neighbors',
        'Degree counts an account’s direct neighbors. Weighted degree instead adds a specified value attached to those links, such as dollars transferred. Do not interpret a link count as money unless the graph defines it that way.',
        'degree(v) = number of neighbors',
        ['neighbors', 'degree'],
        ['degrees'],
      ),
      step(
        'Follow reachable links',
        'Follow links from the selected account to find every node it can reach. All mutually reachable nodes belong to the same connected component. This is about connectivity, not how many links there are or whether the group is fraudulent.',
        'component(v) = reachable nodes',
        ['component', 'edges'],
        ['components', 'sizes'],
      ),
      step(
        'Trace the shortest path',
        'Follow the fewest-link route from A to C. This example crosses four edges and visits five nodes. Path length counts the edges, not the nodes.',
        'A → Device 7 → B → Merchant 9 → C',
        ['path', 'edges'],
        ['edges'],
      ),
      step(
        'Check the explanation',
        'A household may share a device, and many people may pay a popular merchant. Check why each edge exists and when it was known. A link recorded later cannot justify an earlier decision, and a shared connection alone does not establish fraud.',
        'relationship ≠ proof',
        ['evidence', 'cutoff'],
        ['proof'],
      ),
    ],
    prediction: {
      question: 'A and C share a connected component. Does that prove fraud?',
      options: [
        'No; investigate the relationship and alternative explanations.',
        'Yes; connectivity establishes the outcome.',
      ],
      correct: 0,
      explanation:
        'Reachability only says that a path of recorded links connects the nodes. To establish wrongdoing, investigators need reliable link matching, context about why the links exist, and supporting evidence beyond the graph.',
    },
  },
  transformers: {
    exercise: 'A08',
    title: 'Mix token information before classifying',
    question: 'How does the toy model combine these words before assigning a sentiment label?',
    takeaway:
      'Attention weights combine token values; a separate classifier estimates label probabilities. The tiny supplied numbers teach the steps, not FinBERT’s learned behavior.',
    methods: [
      'Attention calculation',
      'Negation and context',
      'Classification / extraction / generation',
      'TF-IDF and FinBERT',
    ],
    steps: [
      step(
        'Start with token information',
        'The toy example supplies a score and a numeric value for “loss” and “narrowed.” It uses already-scaled scores and does not run FinBERT.',
        'scores = supplied QKᵀ / √dₖ',
        ['logits', 'values'],
        [],
      ),
      step(
        'Normalize attention scores',
        'Exponentiate each supplied score and divide by their total so the two weights add to one. These weights decide how much each token value contributes; they are not sentiment class probabilities.',
        'aᵢ = exp(scoreᵢ) / Σ exp(scoreⱼ)',
        ['logits', 'attention'],
        ['weights'],
      ),
      step(
        'Combine token values',
        'Multiply each token value by its attention share and add the contributions. The result h is a combined representation for the toy classifier, not a probability.',
        'h = Σ aᵢvᵢ',
        ['attention', 'values', 'representation'],
        ['h'],
      ),
      step(
        'Produce class probabilities',
        'The invented teaching rule turns h into three unnormalized scores: positive, neutral, and negative. A second softmax converts those scores into probabilities over labels.',
        'class logits = [2h, 0, −2h]',
        ['representation', 'class logits', 'probabilities'],
        ['classLogits', 'probabilities'],
      ),
      step(
        'Apply the confidence rule',
        'Compare the largest class probability with the 70% rule. Because the top score is below it, send this example to a person. Even a score above the rule would not guarantee correctness.',
        'accept if max(class probabilities) ≥ threshold',
        ['probabilities', 'threshold'],
        ['decision'],
      ),
    ],
    prediction: {
      question: 'Do attention weights of 25% and 75% mean a 75% positive sentiment probability?',
      options: [
        'Yes; attention and classification probabilities are identical.',
        'No; a separate classification head produces sentiment probabilities.',
      ],
      correct: 1,
      explanation:
        'The first softmax assigns shares for mixing token values. The later softmax compares the sentiment classes. They are different distributions, so a 75% attention share is not a 75% chance of positive sentiment.',
    },
  },
  rag: {
    exercise: 'A09',
    title: 'Connect an answer to its supporting evidence',
    question: 'Did search find both source figures needed to answer the revenue question?',
    takeaway:
      'A related passage is only a candidate. Find both required figures, calculate growth separately, and attach each claim to evidence that supports it.',
    methods: [
      'Evidence and cosine similarity',
      'Chunking a financial table',
      'Missing evidence',
      'TF-IDF versus embeddings',
    ],
    steps: [
      step(
        'Inspect the query and passages',
        'The question and three passage candidates have small example vectors. Passage A gives old revenue, B gives new revenue, and C describes branches; the revenue amounts use millions of dollars.',
        'query q; passage vectors dA, dB, dC',
        ['query', 'passages'],
        [],
      ),
      step(
        'Compare vector directions',
        'Cosine similarity compares the directions of the question and passage vectors after accounting for their lengths. It ranks possible matches but does not say whether a passage is true or supports the answer.',
        'cos(q,d) = q·d / (‖q‖‖d‖)',
        ['query', 'direction', 'similarity'],
        ['similarities'],
      ),
      step(
        'Retrieve the required evidence',
        'A growth calculation needs both the old and new revenue figures. K controls how many top-ranked passages are retrieved; changing K changes the evidence available, but it does not change what the source documents say.',
        'top K passages → selected evidence',
        ['ranking', 'evidence'],
        [],
      ),
      step(
        'Calculate using the evidence',
        'Subtract old revenue from new revenue, then divide by old revenue to express the change relative to where it started. Search supplies the figures; it does not do or verify the arithmetic.',
        'growth = (current − previous) / previous',
        ['current', 'previous', 'growth'],
        ['growth'],
      ),
      step(
        'Check every claim',
        'Check each answer claim against the passage cited for it. If one of the two figures is missing or the cited passage does not contain it, say the evidence is insufficient instead of guessing.',
        'claim → source passage → checked figure',
        ['claim', 'citation'],
        [],
      ),
    ],
    prediction: {
      question:
        'The highest-ranked passage contains current revenue but not the prior period. Can it establish revenue growth?',
      options: [
        'No; the prior value is also required.',
        'Yes; high similarity establishes the growth rate.',
      ],
      correct: 0,
      explanation:
        'A growth rate compares two periods, so it needs both values and the calculation (new minus old) divided by old. Search ranking cannot supply a missing source figure or prove the result.',
    },
  },
  optimization: {
    exercise: 'A10',
    title: 'Choose the lowest-risk feasible allocation',
    question: 'Which listed portfolio choices meet the estimated return requirement, and which of those has the lowest modeled risk?',
    takeaway:
      'First remove choices that fail a required rule. Then compare variance among the remaining choices. The example assumes stock and bond returns do not move together; changing that assumption can change the risk comparison.',
    methods: [
      'Allowed allocation choices',
      'Continuous allocation',
      'Infeasible constraints',
      'Correlation stress',
      'Input sensitivity',
    ],
    steps: [
      step(
        'List the allowed choices',
        'Each point is one of the stock shares allowed in this exercise. Bonds receive whatever share is left, so the two always add to 100%.',
        'wstock + wbond = 1',
        ['weights', 'bonds'],
        [],
      ),
      step(
        'Calculate expected return',
        'Multiply each asset’s estimated return by its share of the portfolio, then add. A larger share gives that asset more influence on the portfolio estimate.',
        'E[R] = w μstock + (1 − w) μbond',
        ['weights', 'return'],
        ['returns'],
      ),
      step(
        'Reject infeasible choices',
        'Choices below the line miss the required estimated return and are not eligible. The same requirement applies to the simple comparison allocation.',
        'E[R] ≥ required return',
        ['return', 'constraint'],
        [],
      ),
      step(
        'Compare feasible risk',
        'Under the zero-correlation assumption, the co-movement contribution is zero. Add the two share-weighted variance contributions; take the square root to express risk as volatility.',
        'variance = w² σstock² + (1 − w)² σbond²',
        ['variance', 'volatility'],
        ['variances', 'volatilities', 'weight'],
      ),
      step(
        'Translate weights into money',
        'Among the listed allocations that pass the return rule, choose the one with the smallest variance. Multiply its stock and bond shares by the portfolio value to convert fractions into dollars.',
        'stock dollars = selected w × portfolio',
        ['weights', 'dollars'],
        ['stockDollars', 'bondDollars'],
      ),
    ],
    prediction: {
      question: 'Four assets each have a 20% cap. Can their weights sum to 100%?',
      options: [
        'Yes; the optimizer can find a solution.',
        'No; the caps permit only 80% in total.',
      ],
      correct: 1,
      explanation:
        'The constraints conflict before risk is considered. No solver can create a feasible fully invested allocation under those caps.',
    },
  },
  'reinforcement-learning': {
    exercise: 'A11',
    title: 'Update an action estimate after seeing what happened next',
    question: 'How do the result now and the choices available later affect the estimate for acting now?',
    takeaway:
      'A Q-value estimates reward in the simulator’s units; it is not a probability or promise. When a sequence ends, there is no future action value to add.',
    methods: ['Q-learning update', 'Terminal state', 'Inventory and TWAP / VWAP', 'Reward design'],
    steps: [
      step(
        'Inspect the next-state options',
        'Compare the next actions’ estimated values and choose the largest. If costs are negative rewards, a value closer to zero is preferred, even when all choices are below zero.',
        'best next value = maxₐ Q(s′,a)',
        ['actions available next', 'largest estimated Q-value'],
        ['best'],
      ),
      step(
        'Form the target',
        'Add the immediate reward to the best next estimate after reducing it by the discount factor. If this step ends the episode, there is no future action and the target is just the immediate reward.',
        'target = reward + γ × best next value',
        ['immediate reward', 'discount future value', 'update target'],
        ['target', 'terminal'],
      ),
      step(
        'Find the update error',
        'Subtract the old estimate from the target. This gap, called the temporal-difference error, shows both how far apart they are and which direction the estimate should move.',
        'error = target − old Q',
        ['target estimate', 'previous estimate', 'difference to update'],
        ['error'],
      ),
      step(
        'Move partway toward the target',
        'Multiply the gap by the learning rate and add it to the old estimate. A smaller learning rate changes the estimate less on this observation.',
        'new Q = old Q + α × error',
        ['previous estimate', 'fraction of the gap used', 'updated estimate'],
        ['updated'],
      ),
      step(
        'Compare with waiting',
        'Compare the updated buy-now estimate with the supplied wait estimate and choose the larger. This one comparison does not show that a trading policy is safe or effective across market conditions.',
        'choose the higher permitted action value',
        ['updated buy-now estimate', 'wait estimate'],
        ['decision'],
      ),
    ],
    prediction: {
      question: 'At a terminal state, which target applies?',
      options: ['Immediate reward only.', 'Immediate reward plus the maximum next-state value.'],
      correct: 0,
      explanation: 'The episode is over, so no next action can happen. Use the immediate reward alone; adding a future value would count a step that does not exist.',
    },
  },
  'monte-carlo': {
    exercise: 'A12',
    title: 'Build a loss distribution one possible world at a time',
    question: 'How do individual default draws become a reserve-breach probability?',
    takeaway:
      'More runs reduce sampling noise. They do not validate default probabilities, loss fractions, or dependence assumptions.',
    methods: [
      'Supplied five runs',
      'Independent loss distribution',
      'Correlated defaults',
      'VaR and expected shortfall',
      'Simulation convergence',
    ],
    steps: [
      step(
        'Define the loss on default',
        'For each loan, multiply the amount owed by the fraction not recovered to estimate the dollars lost if that loan defaults. The example uses the same balance and loss fraction for both loans.',
        'loss on default = exposure × LGD',
        ['amount owed', 'fraction lost after recovery'],
        ['lossOnDefault'],
      ),
      step(
        'Read one pair of random draws',
        'Each random draw is compared with that loan’s default chance. A draw strictly below the chance counts as default; a draw equal to it does not. These supplied draws create this teaching sample, not a forecast of which real borrowers will default.',
        'default = 1[uniform draw < PD]',
        ['random draws', 'default chance'],
        [],
      ),
      step(
        'Add scenario losses',
        'Within one trial, add the losses from both loans. One row is a single complete possible outcome for the portfolio, including the possibility that neither, one, or both loans default.',
        'scenario loss = loss on default × number of defaults',
        ['which loans defaulted', 'combined dollar loss'],
        ['losses'],
      ),
      step(
        'Count reserve breaches',
        'Count trials whose loss is greater than the reserve and divide by all trials. A loss equal to the reserve is not counted as above it. This fraction estimates breach frequency only under the chosen assumptions.',
        'breach rate = runs with loss > reserve / runs',
        ['reserve amount', 'trials above the reserve'],
        ['mean', 'breach'],
      ),
      step(
        'Compare with the model distribution',
        'Calculate average loss directly from each loan’s default chance, balance, and loss fraction. Compare it with the small simulation average; they need not match exactly because only a few random trials are shown. The direct average-loss calculation does not require independent defaults.',
        'E[L] = 2 × PD × exposure × LGD',
        ['default chance', 'average loss'],
        ['analytical', 'exact'],
      ),
    ],
    prediction: {
      question: 'Increase the number of runs without changing the model. What is improved?',
      options: [
        'Whether the assumed default chances and co-movement are correct.',
        'How much random sampling variation remains under those assumptions.',
      ],
      correct: 1,
      explanation:
        'More independent trials make the estimate less sensitive to random draws from this run. They do not repair an incorrect default chance, loss fraction, or assumption about loans failing together.',
    },
  },
};

export function visualStepIndex(slug: string, focusStep?: string, mode = 'intuition') {
  const config = algorithmVisuals[slug];
  if (!config) return 0;
  if (focusStep) {
    const found = config.steps.findIndex((s) => s.exerciseSteps.includes(focusStep));
    if (found >= 0) return found;
  }
  return ['measures', 'defend'].includes(mode) ? config.steps.length - 1 : 0;
}

export function algorithmValues(
  slug: string,
  givens: Givens,
  exerciseId?: string,
): Record<string, Value> {
  return solve(exerciseId ?? algorithmVisuals[slug].exercise, givens);
}

export function logisticContributions(g: Givens) {
  return [
    { label: 'Intercept', term: 'score', value: -3 },
    { label: `DTI ${g.DTI} pp`, term: 'DTI', value: 0.04 * Number(g.DTI) },
    { label: `Delinquency ${g.D}`, term: 'delinquency', value: 1.2 * Number(g.D) },
    { label: `Income $${g.I}k`, term: 'income', value: -0.03 * Number(g.I) },
  ];
}

export function kmeansFrames(points: number[], starting: number[], limit = 8) {
  let centers = [...starting];
  const frames: { centers: number[]; next: number[]; groups: number[]; inertia: number }[] = [];
  for (let iteration = 0; iteration < limit; iteration++) {
    const groups = points.map((p) =>
      Math.abs(p - centers[0]) <= Math.abs(p - centers[1]) ? 0 : 1,
    );
    const next = centers.map((center, j) => {
      const own = points.filter((_, i) => groups[i] === j);
      return own.length ? mean(own) : center;
    });
    frames.push({
      centers: [...centers],
      next,
      groups,
      inertia: sum(points.map((p, i) => (p - next[groups[i]]) ** 2)),
    });
    if (next.every((v, i) => Math.abs(v - centers[i]) < 1e-10)) break;
    centers = next;
  }
  return frames;
}

export const densityPoints = [
  [0, 0],
  [0.65, 0],
  [0.35, 0.6],
  [1.4, 0],
  [3.5, 1.7],
  [4.1, 1.7],
  [3.8, 2.3],
  [6, 0.2],
];
export function densityNeighborhoods(epsilon: number, minPoints = 3) {
  const neighbors = densityPoints.map((p) =>
    densityPoints
      .map((q, j) => (Math.hypot(p[0] - q[0], p[1] - q[1]) <= epsilon + 1e-12 ? j : -1))
      .filter((i) => i >= 0),
  );
  const core = neighbors.map((n) => n.length >= minPoints);
  const labels = densityPoints.map((_, i) =>
    core[i] ? 'core' : neighbors[i].some((j) => core[j]) ? 'border' : 'noise',
  );
  return { neighbors, core, labels };
}

export const graphNodes = [
  { id: 'A', kind: 'account', x: 45, y: 75 },
  { id: 'Device 7', kind: 'device', x: 160, y: 75 },
  { id: 'B', kind: 'account', x: 275, y: 75 },
  { id: 'Merchant 9', kind: 'merchant', x: 390, y: 75 },
  { id: 'C', kind: 'account', x: 505, y: 75 },
  { id: 'D', kind: 'account', x: 165, y: 225 },
  { id: 'Device 8', kind: 'device', x: 330, y: 225 },
];
export const graphEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [5, 6],
];
export function graphMetrics(selected = 0, edges = graphEdges) {
  const neighbors = graphNodes.map((_, i) =>
    edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])),
  );
  const visited = new Set([selected]);
  const queue = [selected];
  while (queue.length)
    for (const next of neighbors[queue.shift()!])
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
  let ranks = graphNodes.map(() => 1 / graphNodes.length);
  for (let i = 0; i < 60; i++) {
    const next = graphNodes.map(() => 0.15 / graphNodes.length);
    ranks.forEach((r, j) => {
      if (!neighbors[j].length)
        next.forEach((_, k) => {
          next[k] += (0.85 * r) / graphNodes.length;
        });
      else
        neighbors[j].forEach((k) => {
          next[k] += (0.85 * r) / neighbors[j].length;
        });
    });
    ranks = next;
  }
  return { neighbors, component: [...visited], degree: neighbors[selected].length, ranks };
}

export function portfolioPoints(g: Givens, correlation = 0) {
  const weights = g.weights as number[];
  return weights.map((w) => {
    const expectedReturn = w * Number(g.stockReturn) + (1 - w) * Number(g.bondReturn);
    const variance =
      w * w * Number(g.stockVol) ** 2 +
      (1 - w) ** 2 * Number(g.bondVol) ** 2 +
      2 * w * (1 - w) * Number(g.stockVol) * Number(g.bondVol) * correlation;
    return {
      weight: w,
      expectedReturn,
      variance,
      volatility: Math.sqrt(Math.max(0, variance)),
      feasible: expectedReturn + 1e-12 >= Number(g.minimum),
    };
  });
}

export function exactLoanDistribution(g: Givens, commonDefault = false) {
  const p = Number(g.PD),
    loss = Number(g.loan) * Number(g.LGD);
  const probabilities = commonDefault ? [1 - p, 0, p] : [(1 - p) ** 2, 2 * p * (1 - p), p * p];
  const losses = [0, loss, 2 * loss];
  const breach = sum(losses.map((v, i) => (v > Number(g.reserve) ? probabilities[i] : 0)));
  let cumulative = 0,
    valueAtRisk = losses[2];
  for (let i = 0; i < losses.length; i++) {
    cumulative += probabilities[i];
    if (cumulative >= 0.95 - 1e-12) {
      valueAtRisk = losses[i];
      break;
    }
  }
  let remaining = 0.05,
    tail = 0;
  for (let i = losses.length - 1; i >= 0; i--) {
    const mass = Math.min(remaining, probabilities[i]);
    tail += mass * losses[i];
    remaining -= mass;
  }
  return {
    losses,
    probabilities,
    breach,
    mean: sum(losses.map((v, i) => v * probabilities[i])),
    valueAtRisk,
    expectedShortfall: tail / 0.05,
  };
}

export function seasonalNaive(history: number[], season: number, horizon: number) {
  if (season < 1 || history.length < season) return [];
  return Array.from({ length: horizon }, (_, i) => history[history.length - season + (i % season)]);
}

export function simulateLoanLosses(g: Givens, runs: number, seed = 7) {
  const rng = random(seed),
    loss = Number(g.loan) * Number(g.LGD),
    p = Number(g.PD);
  const counts = [0, 0, 0];
  let total = 0,
    breaches = 0;
  const checkpoints: { runs: number; mean: number; breach: number }[] = [];
  for (let i = 0; i < runs; i++) {
    const defaults = Number(rng() < p) + Number(rng() < p);
    counts[defaults]++;
    const outcome = defaults * loss;
    total += outcome;
    breaches += Number(outcome > Number(g.reserve));
    if ((i + 1) % Math.max(1, Math.floor(runs / 20)) === 0 || i === runs - 1)
      checkpoints.push({ runs: i + 1, mean: total / (i + 1), breach: breaches / (i + 1) });
  }
  const breach = breaches / runs;
  return {
    runs,
    counts,
    mean: total / runs,
    breach,
    standardError: Math.sqrt((breach * (1 - breach)) / runs),
    checkpoints,
  };
}

export const sigmoidPoints = Array.from({ length: 81 }, (_, i) => ({
  x: -8 + i / 5,
  y: sigmoid(-8 + i / 5),
}));

// Only the twelve small numerical fixtures enter the hydrated diagram bundle.
// The complete course and source-slide JSON stay outside it.
export const algorithmVisualGivens: Record<string, Givens> = {
  A01: { DTI: 35, D: 1, I: 60, loan: 10000, LGD: 0.4, threshold: 0.08 },
  A02: { counts: [3, 1, 1, 5], scores: [0.75, 0.5, 0.25], threshold: 0.6 },
  A03: { F0: -2, eta: 0.5, h1: 0.8, h2: 0.4, eta2: 0.25, threshold: 0.18 },
  A04: { points: [10, 20, 60, 70], centers: [10, 60], newPoint: 35 },
  A05: { paths: [2, 3, 1, 4, 5, 3, 6, 5, 7], c: 4 },
  A06: { previous: 110, last: 116, phi: 0.5, buffer: 10, actual: 125 },
  A07: { links: 5 },
  A08: { logits: [0, 1.0986122886681098], values: [-1, 1], threshold: 0.7 },
  A09: { q: [1, 0], docs: [3, 4, 4, 3, 0, 5], oldRevenue: 100, newRevenue: 120 },
  A10: {
    weights: [0.4, 0.5, 0.6],
    stockReturn: 0.1,
    bondReturn: 0.04,
    stockVol: 0.2,
    bondVol: 0.05,
    minimum: 0.07,
    portfolio: 100000,
  },
  A11: { old: -5, reward: -2, next: [-4, -1], alpha: 0.5, gamma: 0.9, wait: -4.2 },
  A12: {
    PD: 0.2,
    loan: 10000,
    LGD: 0.5,
    reserve: 5000,
    draws: [0.1, 0.8, 0.6, 0.4, 0.05, 0.15, 0.9, 0.7, 0.3, 0.1],
  },
};

export const algorithmVisualCatalog = Object.entries(algorithmVisuals).map(
  ([slug, definition]) => ({
    slug,
    id: `algorithm-${slug}`,
    ...definition,
  }),
);
