export interface MeasureVisualDefinition {
  number: number;
  id: string;
  title: string;
  question: string;
  takeaway: string;
  views: string[];
  exampleReference: string;
  states: string[];
  controls: string[];
  textAlternative: string;
}
const rows: [string, string, string, string[]][] = [
  [
    'Confusion matrix',
    'Where does each transaction go?',
    'Fraud is the positive class. Each case belongs to exactly one cell.',
    ['Four outcomes'],
  ],
  [
    'Accuracy',
    'Could higher accuracy catch less fraud?',
    'A rare event can disappear inside a high overall correctness rate.',
    ['Detector comparison'],
  ],
  [
    'Balanced accuracy',
    'Whose errors receive more weight?',
    'Equal class weighting gives the rare class half the influence; it does not express financial costs.',
    ['Population weighting', 'Equal class weighting'],
  ],
  [
    'Precision',
    'What fraction of the review tray is useful?',
    'Only reviewed cases belong in the precision denominator.',
    ['Review tray'],
  ],
  [
    'Recall',
    'How much fraud remains outside the queue?',
    'Event capture and dollar capture differ when fraud amounts differ.',
    ['Event capture', 'Dollar capture'],
  ],
  [
    'Specificity and false-positive rate',
    'How many legitimate payments are interrupted?',
    'The two rates share the legitimate-case denominator and sum to 100%.',
    ['Specificity', 'False-positive rate'],
  ],
  [
    'F1 and F-beta',
    'What changes when we change the summary?',
    'Changing beta changes emphasis, not transaction decisions.',
    ['F1', 'F0.5', 'F2'],
  ],
  [
    'ROC curve',
    'What is gained and lost by lowering the cutoff?',
    'An operating point is a decision; the curve shows many possible decisions.',
    ['Threshold curve'],
  ],
  [
    'ROC-AUC and Gini',
    'How often is fraud ranked above a legitimate case?',
    'Ties receive half credit. AUC-derived Gini is different from tree impurity.',
    ['Pair comparisons', 'Gini'],
  ],
  [
    'KS statistic',
    'Where are the class distributions farthest apart?',
    'KS is the largest gap, not necessarily the gap at the business cutoff.',
    ['Cumulative distributions'],
  ],
  [
    'Precision–recall curve and PR-AUC',
    'How does queue quality change as we capture more events?',
    'Average precision weights recall increments; trapezoidal area uses a different convention.',
    ['Average precision', 'Trapezoidal PR-AUC'],
  ],
  [
    'Precision@K and recall@K',
    'How useful is the queue that fits our staffing?',
    'Reviews and total actual fraud are different denominators.',
    ['Precision@K', 'Recall@K'],
  ],
  [
    'Lift and cumulative gain',
    'Does this queue concentrate fraud?',
    'Lift compares concentration with random review; it is not profit.',
    ['Lift', 'Cumulative gain'],
  ],
  [
    'Calibration curve',
    'Do the probabilities match observed frequencies?',
    'Changing a predicted probability must update all expected counts and probability scores together.',
    ['Reliability diagram'],
  ],
  [
    'Brier score',
    'Which probability contributes most error?',
    'Squared probability error is averaged across the same observations.',
    ['Squared errors'],
  ],
  [
    'Log loss',
    'What happens when a confident prediction is wrong?',
    'Log loss penalizes little probability assigned to the actual outcome; it is not dollar loss.',
    ['Probability of actual outcome'],
  ],
  [
    'Expected cost',
    'Which decision costs less and fits capacity?',
    'Multiply each kind of error by its assumed dollar cost, then add. Compare review workload with capacity separately: a lower modeled cost does not mean the team can carry out every alert or that omitted costs are zero in real life.',
    ['Error-cost stack', 'Action-cost cutoff'],
  ],
  [
    'Macro-F1, micro-F1, weighted-F1',
    'Which class can disappear in an average?',
    'Macro-F1 gives each class equal influence; support-weighted F1 gives common classes more influence; micro-F1 pools counts first. In a single-label task micro-F1 equals accuracy, so check class-by-class scores for a weak rare label.',
    ['Macro-F1', 'Weighted-F1', 'Micro-F1'],
  ],
  [
    'Fairness measures',
    'Which population is underneath this group rate?',
    'Selection rate divides approvals by all applicants; repayer approval divides approved repayers by all repayers; false-positive rate divides approved non-repayers by all non-repayers. A direct rate gap is in percentage points (60% versus 50% is 10 points); a ratio is relative. These diagnostics do not explain cause or establish fairness on their own.',
    ['Selection rate', 'Repayer approval', 'False-positive rate'],
  ],
  [
    'Mean absolute error',
    'How large is a typical forecast miss?',
    'Find each forecast’s distance from the actual value without a sign, then average; positive and negative misses cannot cancel. The answer keeps the target’s units, such as dollars, but does not say whether cash was short or extra.',
    ['Absolute gaps'],
  ],
  [
    'Root mean squared error',
    'Why does one large miss matter so much?',
    'Square every miss before averaging, so one large error can outweigh several small ones, then take the square root to return to dollars. Like MAE, RMSE does not say whether forecasts are too high or too low.',
    ['Squared error areas'],
  ],
  [
    'MAPE, WAPE, MASE',
    'What are we dividing the errors by?',
    'MAPE averages each miss divided by its own actual value and is undefined at zero; WAPE divides total miss by total actual volume; MASE divides test MAE by a training-history comparison scale. Their different denominators can change which forecast looks better.',
    ['MAPE', 'WAPE', 'MASE'],
  ],
  [
    'R²',
    'Does the model improve on the evaluation mean?',
    'R² compares model squared error with the squared variation around the sample mean: 1 is perfect, 0 matches that mean-only reference, and a negative value is worse. The test-set mean is only an evaluation yardstick, not information available for a future forecast.',
    ['Squared error comparison'],
  ],
  [
    'Prediction-interval coverage and width',
    'Can a wider interval become less useful?',
    'Coverage is the share of actual values between the lower and upper bounds; width is their average distance apart. Widening intervals can raise observed coverage while making guidance less precise. Compare both, and do not treat five days as proof of long-run calibration.',
    ['Coverage', 'Width'],
  ],
  [
    'Pinball loss',
    'Which side of the quantile forecast is penalized more?',
    'The quantile level tau sets the scoring asymmetry. At tau = 0.95, an equal-sized underforecast receives 19 times the penalty of an overforecast. This scores a chosen quantile; the weights are not automatically real borrowing costs, and calibration should be checked separately.',
    ['Asymmetric loss'],
  ],
  [
    'Silhouette score',
    'Is this customer closer to its own group?',
    'For each customer, compare the average distance to its assigned cluster with the average distance to the nearest alternative cluster. Near 1 means it fits its group better, near 0 means the groups are similarly close, and below 0 suggests another group may fit better. Scaling and chosen features affect these distances.',
    ['Within and between distances'],
  ],
  [
    'Inertia and stability',
    'Are tighter clusters also reproducible?',
    'Inertia adds the squared distances from each point to its group center, so adding groups usually makes it smaller even if the split is not useful. Stability asks whether the same customers regroup together on a repeated run. Look at both and the business purpose; neither picks a universally correct number of groups.',
    ['Inertia', 'Adjusted Rand index'],
  ],
  [
    'Retrieval recall@K and context precision',
    'Did we find all the required evidence?',
    'Recall@K divides relevant passages found in the first K results by all relevant passages needed. Context precision@K divides the relevant passages found by the K passages returned. One useful passage can still leave required evidence missing.',
    ['Retrieval recall', 'Context precision'],
  ],
  [
    'MRR and nDCG',
    'How early does the useful evidence appear?',
    'MRR scores the rank of the first relevant passage and gives a search with no match zero while keeping it in the average. nDCG uses relevance grades across the ranked list and compares the result with the ideal order. Neither proves the answer is supported.',
    ['MRR', 'nDCG'],
  ],
  [
    'Faithfulness, citation correctness, numerical accuracy',
    'Can every claim, citation, and figure be verified?',
    'Keep the denominators separate: supported claims out of 5, correct claim–citation links out of 4, and correct figures out of 8. A true claim can have a wrong citation; accurate arithmetic does not prove its source supports it.',
    ['Faithfulness', 'Citation correctness', 'Numerical accuracy'],
  ],
  [
    'Sharpe and Sortino ratios',
    'Which variability is in the denominator?',
    'Both ratios compare return above a stated reference with variability. Sharpe uses all return variability; Sortino uses downside variation below a target. Ratios depend on the period and estimates supplied; they are not returns or guarantees of future safety.',
    ['Sharpe', 'Sortino'],
  ],
  [
    'Maximum drawdown, turnover, tracking error',
    'What does the path hide that ending wealth misses?',
    'Maximum drawdown is the largest drop from a previous peak; turnover estimates how much must be bought and sold to rebalance; tracking error is variability in fund-minus-benchmark returns, not average underperformance. Each measures a different risk or operating concern.',
    ['Maximum drawdown', 'Turnover', 'Tracking error'],
  ],
  [
    'Value at Risk and Expected Shortfall',
    'Where does the worst tail begin and how severe is it?',
    'Nearest-rank VaR is a boundary; ES averages a fixed number of worst scenarios.',
    ['VaR', 'Expected shortfall'],
  ],
  [
    'Probability of shortfall and Monte Carlo error',
    'Did more simulations change the assumed world?',
    'More runs reduce simulation noise, not uncertainty about the model assumptions.',
    ['Shortfall probability', 'Monte Carlo error'],
  ],
  [
    'VaR exception rate',
    'Are breaches scattered or clustered?',
    'The expected exception count is neither a guarantee nor an acceptance rule.',
    ['Exception rate', 'Breach timing'],
  ],
  [
    'Cumulative reward and regret',
    'Does a better reward mean a completed order?',
    'Compare the same completed order and costs; hindsight is not a live baseline.',
    ['Cumulative reward', 'Regret'],
  ],
  [
    'Task success, verification, unsafe actions',
    'Can a task pass checks without finishing?',
    'Completion, checks, blocked attempts, executed actions, and tool errors can overlap.',
    ['Task success', 'Verification', 'Unsafe attempts', 'Unsafe execution', 'Tool errors'],
  ],
  [
    'Population Stability Index',
    'What shifted between the two populations?',
    'Use fixed bins. Distribution drift does not establish worse prediction quality.',
    ['Bin contributions'],
  ],
  [
    'Latency, throughput, review load, cost',
    'Which bottleneck prevents a usable financial service?',
    'Request processing and human review are different capacities. State each denominator.',
    ['Latency', 'Throughput and review load', 'Cost', 'Availability'],
  ],
];
const authoredTextAlternatives: Record<number, string> = {
  1: 'The table separates actual outcomes from the detector’s flags. A true positive is a fraud correctly flagged; a false positive is a legitimate transaction flagged by mistake; a false negative is a fraud the detector missed; and a true negative is a legitimate transaction correctly passed. Each transaction belongs in one cell, and the four counts add to the population.',
  2: 'The comparison shows that accuracy counts every transaction, so the much larger legitimate group can dominate the percentage. A baseline that passes everyone can score well when fraud is rare while catching no fraud. Read accuracy beside the fraud capture count and the cost of each kind of error.',
  3: 'The visual compares ordinary population weighting with equal class weighting. Balanced accuracy gives recall for fraud and specificity for legitimate transactions one-half of the score each. This prevents the larger group from hiding weak results on the smaller group, but equal weighting is not the same as weighting errors by their dollar cost.',
  8: 'Each point on the ROC curve is one score cutoff. The horizontal value is the share of legitimate transactions flagged by mistake; the vertical value is the share of actual fraud caught. Lowering a cutoff usually moves toward catching more fraud and flagging more legitimate activity. The curve shows possible choices, not which choice fits review capacity or financial costs.',
  9: 'AUC compares every fraud score with every legitimate-transaction score. AUC of 0.88 means the fraud score is higher in about 88 out of 100 such pairs, with ties counted halfway. The AUC-derived Gini rescales that same ranking result as 2 × AUC − 1; it is not the Gini impurity used to split a tree.',
  10: 'At each cutoff, compare the share of defaults flagged with the share of non-defaults flagged. KS is the largest absolute gap between those two rates across the tested cutoffs. A 54 percentage-point gap means one rate is 54 points higher at that cutoff. It summarizes separation in the tested sample; it does not choose a lending policy or account for costs.',
  11: 'A precision–recall curve tracks how many reviewed cases are real events (precision) as the queue captures more of all events (recall). Average precision weights precision by each increase in recall; trapezoidal PR area joins neighboring points with straight lines. These conventions can produce different values, so report which one you used.',
  12: 'For the first K ranked transactions, precision@K is the share of reviews that find fraud; recall@K is the share of all fraud cases found. K is the review capacity in this comparison. The two rates can be equal by coincidence while using different denominators, so inspect both before judging a queue.',
  13: 'Lift compares fraud’s share in a ranked queue with fraud’s share in the whole population, the expected concentration under random review. Cumulative gain instead asks what share of all fraud the queue captured. A queue with 15 times the lift does not promise 15 times the profit; actual value, review cost, and intervention success still matter.',
  14: 'A calibration plot groups loans by predicted default chance. For each group, compare its mean predicted probability with the fraction that actually defaulted; points on the diagonal match. Here the high-risk group predicted 20% but observed 30%, a 10 percentage-point gap. Group rates can vary by chance, so check sample size and repeat across time.',
  15: 'For each loan, square the difference between its predicted default probability and its actual 0-or-1 outcome, then average the squared errors. A lower Brier score means smaller average probability errors on these cases. The average can still hide one large miss, and the score alone does not isolate calibration from ranking quality.',
  16: 'For each transaction, log loss uses the probability assigned to the outcome that happened and takes its negative natural logarithm. A probability of 1 gives zero penalty; a probability close to zero gives a very large penalty. The mathematical penalty is infinite at zero; this exercise uses a 10⁻¹⁵ floor. It is a probability score, not money lost.',
};
export const measureVisuals: MeasureVisualDefinition[] = rows.map(
  ([title, question, takeaway, views], i) => ({
    number: i + 1,
    id: `measure-${i + 1}`,
    title,
    question,
    takeaway,
    views,
    exampleReference: `M${String(i + 1).padStart(2, '0')} example`,
    states: ['Inspect the starting example', 'Change one assumption', 'Explain the consequence'],
    controls: [question],
    textAlternative: authoredTextAlternatives[i + 1] ?? takeaway,
  }),
);
export const measureVisual = (number: number) => measureVisuals[number - 1];
