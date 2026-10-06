import type { LessonBlock, LessonSection } from './lesson-types';
import { isSubstantiveExplanation } from '../engine/explanation-quality';

const paragraph = (text: string): LessonBlock => ({ kind: 'paragraph', text });
const math = (latex: string, readAloud?: string, symbols?: { symbol: string; meaning: string }[]): LessonBlock => {
  if (readAloud && !isSubstantiveExplanation(readAloud)) throw new Error(`Generic or empty formula explanation: ${latex}`);
  return { kind: 'math', latex, readAloud, symbols };
};
const table = (headers: string[], rows: string[][]): LessonBlock => ({
  kind: 'table',
  headers,
  rows,
});
const worked = (...blocks: LessonBlock[]): LessonSection => ({ title: 'Worked example', blocks });

interface MeasureLesson {
  financialInterpretation: string;
  workingExample: string;
  whatItMisses: string;
  lessonSections: LessonSection[];
}

function lesson(
  financialInterpretation: string,
  workingExample: string,
  whatItMisses: string,
  ...lessonSections: LessonSection[]
): MeasureLesson {
  return { financialInterpretation, workingExample, whatItMisses, lessonSections };
}

// These examples are authored for the application. Raw extracted records remain
// available for maintenance, but are not used as learner-facing lesson blocks.
const lessons: Record<string, MeasureLesson> = {
  'confusion-matrix': lesson(
    'A confusion matrix counts correct and incorrect decisions for each actual class. In fraud detection, it separates caught fraud, missed fraud, false alerts, and legitimate transactions passed correctly.',
    'Of 10,000 transactions, 100 are fraud. The detector flags 200 transactions and catches 60 frauds: TP = 60, FP = 140, FN = 40, and TN = 9,760.',
    'Counts depend on the population and the chosen threshold. They do not tell you the dollar cost of a miss or whether investigators can review every alert.',
    worked(
      paragraph(
        'There are 100 frauds among 10,000 transactions. The detector flags 200 transactions; 60 of those flags are fraud. Fraud is the positive class here. “Positive” names the designated outcome, even when that outcome is unwanted.',
      ),
      table(
        ['Decision', 'Actually fraud', 'Actually legitimate'],
        [
          ['Flagged', 'TP = 60', 'FP = 200 − 60 = 140'],
          ['Passed', 'FN = 100 − 60 = 40', 'TN = 9,900 − 140 = 9,760'],
        ],
      ),
      math('60 + 140 + 40 + 9{,}760 = 10{,}000'),
      paragraph(
        'The detector catches 60 frauds and misses 40. It also interrupts 140 legitimate transactions. Precision, recall, and accuracy summarize different parts of this same table.',
      ),
    ),
  ),
  accuracy: lesson(
    'Accuracy is the share of all decisions that were correct. Each transaction counts equally, whether it was fraud or legitimate.',
    'With 60 true positives and 9,760 true negatives out of 10,000 transactions, accuracy is 98.2%. Passing every transaction would score 99% while catching no fraud.',
    'When fraud is rare, correct decisions on the much larger legitimate class can hide missed fraud. Use the confusion matrix and error costs to interpret accuracy.',
    worked(
      math('\\text{Accuracy} = \\frac{TP+TN}{N} = \\frac{60+9{,}760}{10{,}000} = 98.2\\%'),
      paragraph(
        'Now try a detector that always predicts “legitimate.” It correctly passes all 9,900 legitimate transactions, so its accuracy is 99%. It misses all 100 frauds.',
      ),
      table(
        ['Detector', 'Accuracy', 'Frauds caught'],
        [
          ['Flags selected transactions', '98.2%', '60'],
          ['Always predicts legitimate', '99.0%', '0'],
        ],
      ),
      paragraph(
        'The higher accuracy does not settle the decision. We still need to compare the value of catching fraud with the cost of false alerts.',
      ),
    ),
  ),
  'balanced-accuracy': lesson(
    'Balanced accuracy gives the positive and negative classes equal weight. First calculate the success rate within each class, then average the two rates.',
    'Recall of 60% and specificity of about 98.6% give balanced accuracy of about 79.3%, even though overall accuracy is 98.2%.',
    'Equal class weighting is a statistical choice. It does not account for unequal losses, review costs, or intervention capacity.',
    worked(
      math(
        '\\text{Recall}=\\frac{60}{100}=60\\%,\\qquad \\text{Specificity}=\\frac{9{,}760}{9{,}900}\\approx98.6\\%',
      ),
      math('\\text{Balanced accuracy}=\\frac{60\\%+98.6\\%}{2}\\approx79.3\\%'),
      paragraph(
        'Fraud receives half the weight even though it makes up only 1% of this sample. This makes the 40% of frauds that were missed much harder to overlook.',
      ),
    ),
  ),
  precision: lesson(
    'Precision tells you how many alerts lead to confirmed fraud. It helps you understand what investigators will find in the review queue.',
    'The queue contains 200 alerts, including 60 frauds. Precision is 60 ÷ 200 = 30%: about 30 frauds for every 100 alerts.',
    'A small queue can have high precision while missing many frauds. Read precision alongside recall and the available review capacity.',
    worked(
      math('\\text{Precision}=\\frac{TP}{TP+FP}=\\frac{60}{60+140}=30\\%',
        'The top counts the 60 flagged transactions that were truly fraud. The bottom counts all 200 flagged transactions, including 140 legitimate ones. Dividing 60 by 200 answers: “Out of the alerts investigators receive, what share are fraud?” Here that is 30%.',
        [
          { symbol: 'TP', meaning: 'True positives: fraudulent transactions correctly flagged.' },
          { symbol: 'FP', meaning: 'False positives: legitimate transactions incorrectly flagged.' },
        ]),
      paragraph(
        'Investigators review 200 cases to find 60 frauds. The other 140 alerts concern legitimate transactions. Higher precision means fewer legitimate cases per fraud found, but it does not tell us what remains outside the queue.',
      ),
    ),
  ),
  recall: lesson(
    'Recall is the share of all actual frauds that the detector catches. It is also called sensitivity or true-positive rate.',
    'Catching 60 of 100 frauds gives 60% recall and leaves 40 misses. At an assumed $500 loss per miss, those misses cost $20,000.',
    'Recall does not count false alerts or review costs. It also weights fraud events equally even when their dollar losses differ.',
    worked(
      math('\\text{Recall}=\\frac{TP}{TP+FN}=\\frac{60}{60+40}=60\\%',
        'The top is the 60 frauds caught. The bottom is all 100 actual frauds: caught fraud plus the 40 missed cases. Dividing tells us what share of fraud the detector found, so recall is 60%.',
        [
          { symbol: 'TP', meaning: 'True positives: actual frauds the detector caught.' },
          { symbol: 'FN', meaning: 'False negatives: actual frauds the detector missed.' },
        ]),
      math('\\text{Missed-fraud loss}=40\\times\\$500=\\$20{,}000',
        'There are 40 missed fraud cases, and this example assumes each one causes a $500 loss. Multiplying estimates $20,000 in total missed-fraud loss under that assumption; it is not a measured universal cost.'),
      paragraph(
        'That loss calculation assumes every missed fraud costs $500. If fraud amounts vary, event recall and the share of fraud dollars detected can be quite different.',
      ),
    ),
  ),
  'specificity-and-false-positive-rate': lesson(
    'Specificity is the share of legitimate transactions passed correctly. The false-positive rate is the share of legitimate transactions incorrectly flagged.',
    'Among 9,900 legitimate transactions, 9,760 pass and 140 are flagged. Specificity is about 98.6%, and the false-positive rate is about 1.4%.',
    'A small false-positive rate can still create many interruptions at high volume. It also says nothing about how many frauds are caught.',
    worked(
      math('\\text{Specificity}=\\frac{TN}{TN+FP}=\\frac{9{,}760}{9{,}900}\\approx98.6\\%',
        'The top counts the 9,760 legitimate transactions correctly passed. The bottom counts all 9,900 legitimate transactions. Dividing answers what share of legitimate activity passes without a false alert.',
        [
          { symbol: 'TN', meaning: 'True negatives: legitimate transactions correctly passed.' },
          { symbol: 'FP', meaning: 'False positives: legitimate transactions incorrectly flagged.' },
        ]),
      math('\\text{FPR}=\\frac{FP}{TN+FP}=\\frac{140}{9{,}900}\\approx1.4\\%',
        'The top counts legitimate transactions incorrectly flagged; the bottom counts all legitimate transactions. This rate estimates how much legitimate activity is interrupted. Specificity and false-positive rate use the same group and add to 100%.',
        [
          { symbol: 'FP', meaning: 'False positives: legitimate transactions incorrectly flagged.' },
          { symbol: 'TN', meaning: 'True negatives: legitimate transactions correctly passed.' },
        ]),
      paragraph(
        'Both rates use legitimate transactions as the denominator, so they add to 100%. At 10 million legitimate transactions, a 1.4% false-positive rate would cause about 140,000 interruptions.',
      ),
    ),
  ),
  'f1-and-f-beta': lesson(
    'Precision asks how many flagged transactions really are fraud. Recall asks how much of the actual fraud was caught. F1 combines these two rates into one score and is pulled down when either rate is low; this particular combination is called the harmonic mean. F-beta changes the emphasis: beta above 1 gives more weight to recall, while beta below 1 gives more weight to precision.',
    'With precision 0.30 and recall 0.60, F1 is 0.40 and F2 is 0.50. These are two summaries of the same detector, not evidence that it improved.',
    'F-scores do not include dollar losses, calibrated probabilities, or review capacity. Beta does not directly specify a dollar-cost ratio.',
    worked(
      math('F_1=\\frac{2PR}{P+R}=\\frac{2(0.30)(0.60)}{0.30+0.60}=0.40',
        'P is precision (0.30) and R is recall (0.60). This harmonic-mean formula combines them while pulling the result down when either rate is low. The F1 score is 0.40. It does not include dollars or review workload.',
        [
          { symbol: 'P', meaning: 'Precision: the share of alerts that are truly fraud.' },
          { symbol: 'R', meaning: 'Recall: the share of all fraud that was caught.' },
        ]),
      math('F_2=\\frac{(1+2^2)PR}{2^2P+R}=\\frac{5(0.30)(0.60)}{4(0.30)+0.60}=0.50',
        'This version sets β = 2, so it gives recall more weight than precision. With P = 0.30 and R = 0.60, the result is 0.50. Choosing β changes the summary’s emphasis; it does not change the underlying alerts.',
        [
          { symbol: 'P', meaning: 'Precision: the share of alerts that are truly fraud.' },
          { symbol: 'R', meaning: 'Recall: the share of all fraud that was caught.' },
        ]),
      paragraph(
        'F2 is higher here because recall is the stronger of the two inputs and receives more weight. Changing the summary does not change which transactions were flagged.',
      ),
    ),
  ),
  'roc-curve': lesson(
    'A receiver operating characteristic (ROC) curve shows what happens as the score cutoff changes. Its true-positive rate (also called recall) is the share of all actual fraud caught; its false-positive rate is the share of all legitimate transactions flagged by mistake. Each point is one possible decision setting.',
    'Lowering a threshold from 0.80 to 0.50 catches 30 more frauds and flags 160 more legitimate transactions in this example.',
    'The curve does not choose a threshold for you. Convert the rates to counts and costs for the population and review capacity you expect.',
    worked(
      paragraph('Use the same 100 frauds and 9,900 legitimate transactions at both thresholds.'),
      table(
        ['Threshold', 'Frauds caught', 'False alerts', 'True-positive rate', 'False-positive rate'],
        [
          ['0.80', '40', '20', '40 / 100 = 40%', '20 / 9,900 ≈ 0.20%'],
          ['0.50', '70', '180', '70 / 100 = 70%', '180 / 9,900 ≈ 1.82%'],
        ],
      ),
      paragraph(
        'Plot false-positive rate horizontally and true-positive rate vertically. The lower threshold captures more fraud, but it also sends more legitimate activity to review.',
      ),
    ),
  ),
  'roc-auc-and-gini': lesson(
    'ROC-AUC is the area under the receiver operating characteristic curve. In this fraud example, “positive” means fraud and “negative” means legitimate. AUC measures how often a randomly chosen fraud receives a higher score than a randomly chosen legitimate transaction, without choosing a score cutoff.',
    'An AUC of 0.88 gives an AUC-derived Gini of 2 × 0.88 − 1 = 0.76.',
    'AUC does not tell you whether probabilities are calibrated, what a threshold costs, or whether its alerts fit review capacity.',
    worked(
      paragraph(
        'Choose a fraud and a legitimate transaction at random. With no tied scores, AUC = 0.88 means the fraud has the higher score in about 88% of such pairs. The pairwise calculation gives half credit to ties.',
      ),
      math('\\text{Gini}=2\\,\\text{AUC}-1=2(0.88)-1=0.76'),
      paragraph(
        'This Gini rescales AUC. It is different from the Gini impurity used to split decision-tree nodes.',
      ),
    ),
  ),
  'ks-statistic': lesson(
    'Try each score cutoff and compare the share of actual defaults flagged with the share of repaying borrowers flagged. The Kolmogorov–Smirnov statistic, or KS, is the biggest gap between those two shares. A gap of 54 percentage points means that, at that cutoff, the shares differ by 54 points.',
    'If the largest evaluated gap occurs where 72% of defaults and 18% of non-defaults are flagged, KS is 54 percentage points.',
    'The largest statistical separation need not be the best lending threshold. Lending margins, loss severity, capacity, and policy constraints require separate consideration.',
    worked(
      paragraph(
        'Compare class capture rates at every evaluated score cutoff. Suppose the largest gap is at a cutoff that flags 72% of defaults and 18% of non-defaults.',
      ),
      math('KS=\\max_t|D(t)-L(t)|=|0.72-0.18|=0.54'),
      paragraph(
        'KS is 0.54, or 54 percentage points. A gap at one arbitrarily chosen cutoff would not establish KS; it must be the largest gap over the cutoffs being evaluated.',
      ),
    ),
  ),
  'precision-recall-curve-and-pr-auc': lesson(
    'Precision is the share of flagged transactions that really are fraud; recall is the share of all fraud cases the queue catches. A precision–recall curve shows how those two rates move as the team reviews more of the ranked queue. It is especially useful when fraud is rare.',
    'If 1% of transactions are fraud, that 1% is the event prevalence—the share of the whole group that is fraud. Random ranking has about 1% precision on average. Average precision (AP) of 0.32 summarizes a much stronger ranking on that same population; it is not a 32% probability for each transaction.',
    'AP depends on prevalence. Compare models on the same population, state the area convention, and inspect the threshold the team would actually use.',
    worked(
      table(
        ['Operating point', 'Precision', 'Recall'],
        [
          ['Higher threshold', '45%', '45%'],
          ['Lower threshold', '18%', '75%'],
        ],
      ),
      paragraph(
        'The lower threshold finds more fraud but includes a larger share of legitimate transactions. An empirical curve can also rise locally: adding a fraud to the queue can increase both precision and recall.',
      ),
      math('AP=\\sum_j(R_j-R_{j-1})P_j'),
      paragraph(
        'AP weights precision by each increase in recall. A trapezoidal area instead joins observed points with straight lines and can give a different number. Name the convention rather than using AP and PR-AUC as interchangeable labels.',
      ),
    ),
  ),
  'precision-k-and-recall-k': lesson(
    'K is how many cases the team can review from the top of a ranked list. Precision@K is the share of those K reviews that find fraud; recall@K is the share of all fraud cases found within those K reviews. This matches a team with a fixed review capacity.',
    'The top 100 transactions contain 45 of the population’s 100 frauds. Precision@100 and recall@100 are both 45%, but they use different denominators.',
    'State K, the time window, and event prevalence. Results for 100 daily reviews cannot be compared directly with results for 1,000 monthly reviews.',
    worked(
      math('\\text{Precision@100}=\\frac{45}{100\\text{ reviews}}=45\\%'),
      math('\\text{Recall@100}=\\frac{45}{100\\text{ total frauds}}=45\\%'),
      paragraph(
        'The queue finds 45 frauds with 55 false alerts. Another 55 frauds remain outside the queue. The two percentages happen to match because review capacity equals the total fraud count in this example.',
      ),
    ),
  ),
  'lift-and-cumulative-gain': lesson(
    'Lift compares the fraud share in a ranked queue with fraud prevalence—the share of the full population that is fraud. Cumulative gain is the share of all fraud cases captured by that queue. Lift measures concentration relative to random review; gain measures coverage.',
    'The top 100 of 10,000 transactions contain 45 frauds. With 1% fraud prevalence, lift is 45 and gain at the top 1% is 45%.',
    'Lift depends on prevalence and does not measure profit. Review costs, fraud amounts, and intervention effectiveness still matter.',
    worked(
      math(
        '\\text{Lift@100}=\\frac{\\text{Precision@100}}{\\text{Prevalence}}=\\frac{45\\%}{1\\%}=45',
      ),
      math('\\text{Gain at top 1\\%}=\\frac{45}{100}=45\\%'),
      paragraph(
        'A random set of 100 transactions would contain one fraud on average; this ranked set contains 45. That is 45 times the fraud concentration, not 45 times the profit.',
      ),
    ),
  ),
  'calibration-curve': lesson(
    'Calibration asks whether predicted probabilities match observed event frequencies. Among many comparable loans assigned 10% default risk, roughly 10 in 100 should default.',
    'Three groups of 100 loans have predicted default rates of 5%, 10%, and 20%, with 3, 10, and 30 observed defaults. The high band understates the observed rate by 10 percentage points.',
    'Calibration and ranking answer different questions. A small sample can differ from predicted frequencies by chance, so assess uncertainty and stability over time.',
    worked(
      table(
        [
          'Band',
          'Loans',
          'Mean predicted probability',
          'Expected defaults',
          'Observed defaults',
          'Observed rate',
        ],
        [
          ['Low', '100', '5%', '5', '3', '3%'],
          ['Medium', '100', '10%', '10', '10', '10%'],
          ['High', '100', '20%', '20', '30', '30%'],
        ],
      ),
      paragraph(
        'Plot predicted probability horizontally and observed rate vertically. A point on the diagonal has matching values. Here the high-band point is (20%, 30%).',
      ),
      math('\\text{Expected loss}=35\\times\\$4{,}000=\\$140{,}000'),
      math('\\text{Realized loss}=43\\times\\$4{,}000=\\$172{,}000'),
      paragraph(
        'With a fixed $4,000 loss per default, the observed loss is $32,000 above the probability-based estimate in this sample.',
      ),
    ),
  ),
  'brier-score': lesson(
    'The Brier score averages the squared differences between predicted probabilities and actual 0/1 outcomes. Lower values mean smaller probability errors on the evaluated sample.',
    'Probabilities [0.10, 0.80, 0.60, 0.20] and outcomes [0, 1, 0, 0] give a Brier score of 0.1125.',
    'Brier score reflects calibration and discrimination and depends on event prevalence. Compare with a baseline on the same observations.',
    worked(
      table(
        ['Loan', 'Predicted default probability', 'Outcome', 'Squared error'],
        [
          ['A', '0.10', '0', '0.01'],
          ['B', '0.80', '1', '0.04'],
          ['C', '0.60', '0', '0.36'],
          ['D', '0.20', '0', '0.04'],
        ],
      ),
      math('\\text{Brier}=\\frac{0.01+0.04+0.36+0.04}{4}=0.1125'),
      paragraph(
        'Loan C contributes the largest error. One non-default on a 60% prediction does not by itself show miscalibration; calibration concerns frequencies across comparable cases.',
      ),
    ),
  ),
  'log-loss': lesson(
    'Log loss scores the probability assigned to the outcome that actually occurred. The natural logarithm bends sharply as a probability approaches zero; taking its negative creates a positive penalty that rises sharply when a model gives little chance to what happened. A 100% probability on the outcome gives a penalty of zero.',
    'For a legitimate transaction, a fraud probability of 0.60 gives log loss about 0.92; a probability of 0.99 gives about 4.61.',
    'Log loss is not a dollar loss. In the mathematical definition, assigning probability zero to an outcome that occurs gives infinite loss. This exercise caps the selected probability at 10⁻¹⁵ so its displayed result stays finite; decision costs must still be evaluated separately.',
    worked(
      paragraph('The actual outcome is legitimate, so use the probability of legitimacy, 1 − p.'),
      math('L(p=0.60)=-\\ln(1-0.60)\\approx0.92'),
      math('L(p=0.99)=-\\ln(1-0.99)\\approx4.61'),
      paragraph(
        'Both probabilities produce the same wrong fraud label at a 0.50 threshold. Log loss distinguishes them because 0.99 leaves far less probability for the outcome that occurred.',
      ),
    ),
  ),
  'expected-cost': lesson(
    'Expected cost asks which action has the lower average loss across comparable cases. Multiply each possible outcome’s chance or count by its assumed cost, then add the results. The answer is in the cost’s units, often dollars.',
    'At $500 per missed fraud and $4 per false alert, threshold A costs $20,560 and threshold B costs $14,500 under the stated loss table.',
    'A lower modeled cost is useful only if the interventions can be delivered. Check review capacity, intervention effectiveness, and sensitivity to the assumed costs.',
    worked(
      paragraph(
        'Assume a missed fraud costs $500 and a false alert costs $4. A threshold is the probability cutoff that decides which transactions are flagged. Count each kind of error, multiply by its assigned cost, and add. Correct outcomes have zero added cost in this simplified loss table; this is a teaching assumption, not a claim that real reviews are free.',
      ),
      table(
        ['Threshold', 'TP', 'FP', 'FN', 'Error cost'],
        [
          ['A', '60', '140', '40', '40 × $500 + 140 × $4 = $20,560'],
          ['B', '75', '500', '25', '25 × $500 + 500 × $4 = $14,500'],
        ],
      ),
      paragraph(
        'B finds more fraud and has lower modeled error cost, but it sends 575 transactions to review instead of 200. The cost total and the queue size answer different questions: can the team actually act on that many alerts? Recalculate if review expense, intervention success, or the assumed cost of an error changes. This comparison does not prove which policy is best outside these assumptions.',
      ),
    ),
  ),
  'macro-f1-micro-f1-weighted-f1': lesson(
    'When a classifier has several labels, F1 can be summarized in more than one way. Macro-F1 gives every label equal weight. Support-weighted F1 gives more influence to labels with more examples. Micro-F1 adds the error counts across labels first, so common labels can dominate.',
    'With class shares 70%, 20%, and 10%, and F1 scores 0.95, 0.80, and 0.20, macro-F1 is 0.65 and weighted-F1 is 0.845.',
    'An average can hide which class fails. Report per-class precision and recall, especially for less common classes that matter to the decision.',
    worked(
      table(
        ['Class', 'Number of examples', 'Class F1'],
        [
          ['Neutral', '70', '0.95'],
          ['Positive', '20', '0.80'],
          ['Negative', '10', '0.20'],
        ],
      ),
      math('F_{1,\\text{macro}}=\\frac{0.95+0.80+0.20}{3}=0.65'),
      math('F_{1,\\text{weighted}}=0.70(0.95)+0.20(0.80)+0.10(0.20)=0.845'),
      paragraph(
        'The rare negative class has poor F1 but only 10% of the weight in weighted-F1. To calculate micro-F1, use the underlying true-positive, false-positive, and false-negative counts. In single-label classification with all classes included, micro-F1 equals accuracy.',
      ),
    ),
  ),
  'fairness-measures': lesson(
    'Group rates compare the share approved or the share incorrectly approved within each group. The denominator matters: all applicants, actual repayers, and actual non-repayers answer different questions. A direct difference between rates is measured in percentage points; a ratio is a relative comparison. Neither number alone establishes fairness or explains a difference.',
    'Approval rates of 60% and 42% give a B/A selection-rate ratio of 0.70. Repayer approval rates of 80% and 72% differ by 8 percentage points.',
    'Interpret the rates with the outcome definition, sample size, product mix, and population differences. The arithmetic alone does not establish a cause or a legal conclusion.',
    worked(
      paragraph(
        'For this teaching example, repayment outcomes are supplied for every applicant and the approvals are simulated. That lets us count rates in each outcome group. In real lending, repayment is usually not observed for someone who was declined, so the data can have a missing-outcome problem.',
      ),
      table(
        ['Group', 'Applicants', 'Approvals', 'Approval rate'],
        [
          ['A', '1,000', '600', '60%'],
          ['B', '1,000', '420', '42%'],
        ],
      ),
      math('\\text{Selection-rate ratio}_{B/A}=\\frac{42\\%}{60\\%}=0.70'),
      paragraph(
        'Among actual repayers, suppose 80% in A and 72% in B are approved. Subtract 72% from 80% to get an 8 percentage-point gap. This is a direct difference between rates, not an 8% relative change. Compare it with the non-repayer false-positive rates and calibration; no single group measure settles the fairness question.',
      ),
    ),
  ),
  'mean-absolute-error': lesson(
    'Mean absolute error, or MAE, is the average size of the forecast error in the target’s original units. Taking absolute values stops positive and negative errors from cancelling.',
    'For actual outflows [100, 120, 80, 150] and forecasts [90, 130, 100, 140], all in thousands of dollars, MAE is 12.5 thousand dollars.',
    'MAE does not show error direction or give extra weight to rare, large misses. It is forecast error, not the resulting funding cost.',
    worked(
      table(
        ['Day', 'Actual ($ thousands)', 'Forecast ($ thousands)', 'Absolute error ($ thousands)'],
        [
          ['1', '100', '90', '10'],
          ['2', '120', '130', '10'],
          ['3', '80', '100', '20'],
          ['4', '150', '140', '10'],
        ],
      ),
      math('MAE=\\frac{10+10+20+10}{4}=12.5\\text{ thousand dollars}'),
      paragraph(
        'The forecast misses by $12,500 per day on average over these four days. This does not mean every day misses by $12,500.',
      ),
    ),
  ),
  'root-mean-squared-error': lesson(
    'RMSE squares forecast errors before averaging and then takes the square root. This gives large errors more influence while returning the result to the original unit.',
    'Errors [10, −10, −20, 10], in thousands of dollars, have RMSE √175 ≈ 13.2 thousand dollars, compared with MAE of 12.5.',
    'A few large misses can dominate RMSE, and it does not distinguish shortages from excess forecasts. Compare MAE, signed errors, and performance during stress periods.',
    worked(
      paragraph(
        'Define error as actual minus forecast. Positive error means underforecasting. Use the same four-day outflows as the MAE example, in thousands of dollars.',
      ),
      math('RMSE=\\sqrt{\\frac{10^2+(-10)^2+(-20)^2+10^2}{4}}=\\sqrt{175}\\approx13.2'),
      paragraph(
        'The 20-unit error contributes 400 squared units, four times the contribution of a 10-unit error. That is why RMSE exceeds MAE here.',
      ),
    ),
  ),
  'mape-wape-mase': lesson(
    'MAPE averages percentage errors, WAPE divides total absolute error by total actual volume, and MASE compares test error with a training-period naive forecast error scale.',
    'For the four-day forecast, MAPE is 12.5%, WAPE is about 11.1%, and MASE is 0.625 using a training naive-error scale of 20.',
    'MAPE is undefined at zero actual values. WAPE can hide poor results on small series. MASE needs a stated training-period baseline and is undefined when its error scale is zero.',
    worked(
      paragraph(
        'Test actuals are [100, 120, 80, 150] and forecasts are [90, 130, 100, 140]. Use separate training history [80, 100, 120, 140] for a nonseasonal last-value naive forecast.',
      ),
      math('MAPE=\\frac{10/100+10/120+20/80+10/150}{4}\\times100\\%=12.5\\%'),
      math('WAPE=\\frac{10+10+20+10}{100+120+80+150}\\times100\\%\\approx11.1\\%'),
      math('d_{\\text{train}}=\\frac{|100-80|+|120-100|+|140-120|}{3}=20'),
      math('MASE=\\frac{12.5}{20}=0.625'),
      paragraph(
        'The forecast’s test error is 62.5% of the training-period naive error scale. To see whether it beats a naive forecast on new data, compare both forecasts on the same test period.',
      ),
    ),
  ),
  r: lesson(
    'R-squared compares model squared error with the squared error around the evaluated sample’s mean. It measures relative error reduction, not the share of forecasts that are correct.',
    'Model squared error of 700 and sample-mean reference error of 2,675 give R² = 1 − 700 / 2,675 ≈ 0.7383.',
    'The test-set mean is an evaluation reference, not a forecast available in advance. R² can be negative; use a time-appropriate forecast baseline and report errors in financial units.',
    worked(
      paragraph(
        'For actual values [100, 120, 80, 150], the sample mean is 112.5. The model’s squared errors sum to 700; deviations from that mean have squared sum 2,675.',
      ),
      math('R^2=1-\\frac{SSE}{SST}=1-\\frac{700}{2{,}675}\\approx0.7383'),
      paragraph(
        'The model removes about 73.83% of squared error relative to the sample-mean reference. It need not match any individual daily value exactly to obtain this score.',
      ),
    ),
  ),
  'prediction-interval-coverage-and-width': lesson(
    'Coverage is the share of outcomes inside their prediction intervals. Width tells you how broad those intervals are. Both matter when planning reserves or liquidity.',
    'If 37 of 50 outcomes fall inside intervals labeled 90%, observed coverage is 74%. That calls for a closer calibration check.',
    'Wider intervals can raise coverage while giving less useful guidance. Examine both measures by forecast horizon and stress period, with enough observations to assess uncertainty.',
    worked(
      math('\\text{Observed coverage}=\\frac{37}{50}=74\\%'),
      paragraph(
        'The sample coverage is below the nominal 90% level. Check whether undercoverage persists over an adequate validation period and which conditions produce the misses.',
      ),
      paragraph(
        'A second model could reach 92% coverage by issuing very wide intervals. That alone would not make it more useful: compare average width in the same units and over the same forecast horizons.',
      ),
    ),
  ),
  'pinball-loss': lesson(
    'Pinball loss scores a quantile forecast. It gives different weights to underforecasting and overforecasting according to the chosen quantile.',
    'For a 95th-percentile forecast of $130 million, actual demand of $150 million gives loss 19, while $120 million gives loss 0.5, in weighted million-dollar error units.',
    'The quantile sets a scoring asymmetry; it does not automatically equal the institution’s funding-cost ratio. Check the forecast’s coverage separately.',
    worked(
      paragraph('The 95th-percentile liquidity forecast is $130 million, so τ = 0.95.'),
      table(
        ['Actual need ($m)', 'Forecast error', 'Pinball loss'],
        [
          ['150', '20 below actual', '0.95 × 20 = 19'],
          ['120', '10 above actual', '0.05 × 10 = 0.5'],
          ['130', 'No error', '0'],
        ],
      ),
      paragraph(
        'For equal-size errors, underforecasting receives 0.95 / 0.05 = 19 times as much weight. These are weighted forecast-error units, not realized borrowing losses.',
      ),
    ),
  ),
  'silhouette-score': lesson(
    'Silhouette compares an observation’s distance to its own cluster with its distance to the nearest alternative cluster. It describes separation in the chosen feature space.',
    'With average within-cluster distance a = 2 and nearest-other-cluster distance b = 5, the silhouette score is 0.60.',
    'A high silhouette score does not show whether clusters are stable or useful for a business decision. Results also depend on the features, scaling, and distance measure.',
    worked(
      math('s=\\frac{b-a}{\\max(a,b)}=\\frac{5-2}{5}=0.60'),
      paragraph(
        'A score near 1 indicates clear separation. A score near 0 means similar average distance to the two clusters. A negative score means the observation is closer on average to another cluster.',
      ),
      paragraph(
        'Here b is the average distance to members of the nearest alternative cluster, not the distance to the nearest individual customer.',
      ),
    ),
  ),
  'inertia-and-stability': lesson(
    'Inertia measures how tightly observations cluster around their centers. Stability asks whether similar memberships reappear when the data or random seed changes.',
    'Inertia falls from 1,200 to 800 to 700 as the number of clusters rises from 3 to 4 to 5. The smaller second improvement suggests investigating four clusters.',
    'Inertia decreases as more clusters are allowed, so its minimum is not a useful stopping rule by itself. Check stability and whether the groups support a meaningful action.',
    worked(
      table(
        ['Number of clusters', 'Inertia', 'Reduction from previous choice'],
        [
          ['3', '1,200', '—'],
          ['4', '800', '400'],
          ['5', '700', '100'],
        ],
      ),
      paragraph(
        'Four clusters is a candidate elbow, not proof of the correct number. Compare membership across repeated fits or resamples.',
      ),
      paragraph(
        'Adjusted Rand index (ARI) compares two groupings of the same observations while adjusting for a chance reference. A value near 1 indicates similar memberships. Cluster labels such as A and B are arbitrary; renaming them must not change ARI.',
      ),
    ),
  ),
  'retrieval-recall-k-and-context-precision': lesson(
    'A retrieval system brings passages to an analyst or answer generator. Recall asks how much of the known-needed evidence it found. Context precision asks what share of the passages it returned are relevant under the stated counting rule.',
    'If each question has exactly one required passage and retrieval finds it in the top five for 16 of 20 questions, mean recall@5 is 80%. Two relevant passages among five give context precision@5 of 40%.',
    'Finding one useful passage may leave other required evidence missing. Retrieval quality does not establish that the generated answer uses the evidence correctly.',
    worked(
      paragraph(
        'First assume each of 20 questions has exactly one relevant passage in the corpus. The top five results include it for 16 questions.',
      ),
      math('\\text{Mean recall@5}=\\frac{16}{20}=80\\%'),
      paragraph(
        'Under this one-passage assumption, mean recall equals question-level hit rate. If a question needs several passages, count how many of those passages were retrieved instead.',
      ),
      paragraph('For a separate question, suppose two of five retrieved passages are relevant.'),
      math('\\text{Context precision@5}=\\frac{2}{5}=40\\%'),
      paragraph(
        'This course uses relevant-passage share for context precision. A rank-weighted evaluator can use a different definition, so state the rule when comparing results.',
      ),
    ),
  ),
  'mrr-and-ndcg': lesson(
    'Mean reciprocal rank (MRR) rewards finding the first relevant passage near the top; a miss contributes zero and still counts in the average. Normalized discounted cumulative gain (nDCG) also gives more credit to highly relevant passages when they appear early in the list.',
    'First relevant ranks [1, 2, 5, not found] give MRR 0.425. With exponential gain, relevance order [1, 3, 0] has nDCG@3 about 0.71 against ideal order [3, 1, 0].',
    'MRR ignores useful results after the first. nDCG depends on the relevance grades and gain convention. Neither measures whether an answer is supported.',
    worked(
      math('MRR=\\frac{1+1/2+1/5+0}{4}=0.425'),
      paragraph(
        'The unsuccessful search stays in the denominator and contributes zero. Dropping it would inflate the result.',
      ),
      math('\\text{gain}(r)=2^r-1,\\qquad DCG@K=\\sum_{i=1}^{K}\\frac{2^{r_i}-1}{\\log_2(i+1)}'),
      math('nDCG@3=\\frac{1+7/\\log_2(3)}{7+1/\\log_2(3)}\\approx0.71'),
      paragraph(
        'The grade-3 passage was found but placed second. Moving it first produces the ideal ordering in this three-passage example.',
      ),
    ),
  ),
  'faithfulness-citation-correctness-numerical-accuracy': lesson(
    'These checks ask three separate questions: Are the claims supported? Does each attached citation support its claim? Are the reported numbers correct?',
    'Four supported claims out of five give 80% faithfulness. Three supporting citations out of four give 75% citation correctness. Seven correct figures out of eight give 87.5% numerical accuracy.',
    'The scores depend on what is counted and how support is judged. Check material numbers deterministically and inspect the evidence; an automated judge can miss errors.',
    worked(
      table(
        ['Check', 'Correct or supported', 'Evaluated total', 'Result'],
        [
          ['Faithfulness', '4 claims', '5 claims', '80%'],
          ['Citation correctness', '3 claim–citation pairs', '4 pairs', '75%'],
          ['Numerical accuracy', '7 figures', '8 figures', '87.5%'],
        ],
      ),
      paragraph(
        'A claim can be true but have the wrong citation. A correctly copied number can also appear in an unsupported conclusion. Keep the three denominators separate instead of averaging them into one accuracy score.',
      ),
    ),
  ),
  'sharpe-and-sortino-ratios': lesson(
    'Sharpe compares excess return with total return variability. Sortino compares return above a chosen target with downside variability relative to that target.',
    'With annual mean return 9%, reference and target rates 4%, total volatility 10%, and downside deviation 6%, Sharpe is 0.50 and Sortino is about 0.83.',
    'Use consistent return periods and annualization conventions. Small samples, illiquidity, leverage, skew, and tail losses can make either ratio misleading.',
    worked(
      paragraph(
        'Assume all estimates are annualized consistently. Use 4% as both the risk-free rate for Sharpe and the minimum acceptable return for Sortino.',
      ),
      math('\\text{Sharpe}=\\frac{9\\%-4\\%}{10\\%}=0.50'),
      math('\\text{Sortino}=\\frac{9\\%-4\\%}{6\\%}\\approx0.83'),
      paragraph(
        'Sortino is higher here because the supplied downside deviation is smaller. Neither ratio is an investment return or a probability of profit.',
      ),
    ),
  ),
  'maximum-drawdown-turnover-tracking-error': lesson(
    'Maximum drawdown measures the largest decline from an earlier peak. Turnover measures trading activity, and tracking error measures variability relative to a benchmark.',
    'A fall from 120 to 90 is a 25% drawdown. Moving weights from [50, 30, 20]% to [30, 50, 20]% gives 20% one-way turnover. Active-return standard deviation of 3% gives 3% tracking error.',
    'State the observation frequency, trading-cost convention, and return period. Check liquidity and mandatory constraints alongside these measures.',
    worked(
      math('\\text{Drawdown}=\\frac{120-90}{120}=25\\%'),
      math('\\text{One-way turnover}=\\frac{|30-50|+|50-30|+|20-20|}{2}=20\\%'),
      paragraph(
        'The turnover example assumes a fully invested portfolio with no market movement or external cash flows during the rebalance. It sells 20% and buys 20%, so gross trading is 40% of portfolio value.',
      ),
      paragraph(
        'Tracking error is the standard deviation of fund return minus benchmark return over the stated period. If that standard deviation is 3%, tracking error is 3%; it does not mean the fund underperformed by 3%.',
      ),
    ),
  ),
  'value-at-risk-and-expected-shortfall': lesson(
    'Value at Risk (VaR) is a loss quantile for a stated horizon. Expected Shortfall (ES) averages losses in the specified worst tail.',
    'In 10,000 equally weighted one-day scenarios, suppose the 99% VaR is $2 million and the worst 100 scenarios average $3.4 million. Then 99% ES is $3.4 million.',
    'VaR is not a maximum loss. Both measures depend on the loss distribution and assumptions about defaults, correlation, liquidity, and market conditions.',
    worked(
      paragraph(
        'Sort 10,000 equally weighted one-day losses. With the nearest-rank convention, 99% VaR is the loss at position 9,900. Suppose that loss is $2 million.',
      ),
      math(
        'ES_{99\\%}=\\frac{\\text{sum of the worst 100 scenario losses}}{100}=\\$3.4\\text{ million}',
      ),
      paragraph(
        'VaR locates the tail; ES describes the average loss within it. For discrete losses or tied values, averaging only losses strictly greater than VaR can select the wrong tail size. State the quantile and tail-averaging conventions.',
      ),
    ),
  ),
  'probability-of-shortfall-and-monte-carlo-error': lesson(
    'Shortfall probability estimates how often a limit is breached. Monte Carlo standard error measures the uncertainty caused by using a finite number of simulation runs.',
    'If 1,200 of 10,000 independent runs exceed the reserve, estimated shortfall probability is 12%, with standard error about 0.325 percentage point.',
    'More runs reduce simulation noise. They do not validate the assumed default probabilities, recoveries, correlations, or stress scenarios.',
    worked(
      math(
        '\\hat p=\\frac{1{,}200}{10{,}000}=0.12,\\qquad SE(\\hat p)=\\sqrt{\\frac{0.12(0.88)}{10{,}000}}\\approx0.00325',
      ),
      math('\\hat p\\pm1.96SE\\approx12\\%\\pm0.64\\text{ percentage point}'),
      paragraph(
        'This approximate 95% interval concerns independent runs under one fixed model. It does not include uncertainty about whether that model describes real losses. Near-zero or near-one estimates and small run counts require more care than this normal approximation.',
      ),
    ),
  ),
  'var-exception-rate': lesson(
    'A VaR backtest compares each realized loss with the forecast made for that same period. The exception rate is the share of losses that exceed their forecasts.',
    'A 99% daily VaR target implies a nominal exception probability of 1%, or 2.5 expected exceptions in 250 trading days. Twelve observed exceptions give a 4.8% exception rate.',
    'The count alone does not identify the cause or size of failures. Examine breach timing, dependence, loss severity, and possible market or data changes.',
    worked(
      math('\\text{Nominal expected count}=250(1-0.99)=2.5'),
      math('\\text{Observed exception rate}=\\frac{12}{250}=4.8\\%'),
      paragraph(
        'The observed rate is well above the nominal 1% target and warrants investigation. The expected count of 2.5 is neither a guaranteed annual count nor an acceptance range. Check whether exceptions cluster and how large the excess losses are.',
      ),
    ),
  ),
  'cumulative-reward-and-regret': lesson(
    'Cumulative reward adds the rewards over an episode. Regret compares the policy’s result with a specified benchmark, which may use information available only afterward.',
    'If TWAP costs 18 basis points, a learned execution policy costs 15, and the best feasible hindsight schedule costs 11, the policy saves 3 basis points versus TWAP and has 4 basis points of hindsight regret.',
    'A reward can omit market impact, incomplete orders, or constraint violations. State its components and distinguish a live baseline from an unattainable hindsight comparator.',
    worked(
      table(
        ['Schedule', 'Execution cost'],
        [
          ['TWAP baseline', '18 basis points'],
          ['Learned policy', '15 basis points'],
          ['Best feasible hindsight schedule', '11 basis points'],
        ],
      ),
      math(
        '\\text{Improvement}=18-15=3\\text{ bps},\\qquad \\text{Hindsight regret}=15-11=4\\text{ bps}',
      ),
      paragraph(
        'All schedules must complete the same order and include the same cost components. If reward is negative execution cost, a less negative cumulative reward is better. Report the distribution of results across simulations, including costly tail outcomes.',
      ),
    ),
  ),
  'task-success-verification-unsafe-actions': lesson(
    'Agent evaluation separates completing a workflow from passing individual checks. It also records tool errors and attempted actions outside the agent’s authority.',
    'Of 500 invoice tasks, 460 complete correctly and pass checks, 475 pass field checks, and five contain blocked unauthorized attempts. The corresponding task-level rates are 92%, 95%, and 1%.',
    'Different rates can overlap and use different denominators. Inspect failure traces and blocked attempts even when the final task result is acceptable.',
    worked(
      table(
        ['Measure', 'Count', 'Denominator', 'Rate'],
        [
          ['Correct completion plus required checks', '460', '500 tasks', '92%'],
          ['Required field checks passed', '475', '500 tasks', '95%'],
          ['Tasks with an unauthorized attempt', '5', '500 tasks', '1%'],
        ],
      ),
      paragraph(
        'Passing field checks does not prove the workflow finished. Blocking every unauthorized attempt gives zero executed unauthorized actions in this sample, but the attempts still show where controls were needed.',
      ),
      paragraph(
        'If average cost is $0.42 per task and p95 latency is 11 seconds, report those alongside task outcomes. Use tool calls, rather than tasks, as the denominator for a tool-call error rate.',
      ),
    ),
  ),
  'population-stability-index': lesson(
    'Population Stability Index (PSI) compares the shares of observations in the same bins across two periods. It describes distribution shift without using outcome labels.',
    'Reference shares [20, 30, 30, 20]% and current shares [10, 25, 35, 30]% produce PSI about 0.127.',
    'PSI alone cannot show that accuracy, calibration, or fairness has deteriorated. Interpretation depends on the bins, sample size, and application; outcome labels are needed to assess prediction quality.',
    worked(
      table(
        ['Score band', 'Reference share E', 'Current share A'],
        [
          ['1', '0.20', '0.10'],
          ['2', '0.30', '0.25'],
          ['3', '0.30', '0.35'],
          ['4', '0.20', '0.30'],
        ],
      ),
      math('PSI=\\sum_i(A_i-E_i)\\ln\\!\\left(\\frac{A_i}{E_i}\\right)\\approx0.127'),
      paragraph(
        'Use fractions and identical bin boundaries in both periods. The current population has shifted toward the higher score bands. Investigate channels, products, policy, and the data pipeline before drawing conclusions about model performance.',
      ),
      paragraph(
        'All shares here are positive. A zero share requires a stated smoothing or binning rule before the logarithm can be evaluated.',
      ),
    ),
  ),
  'latency-throughput-review-load-cost': lesson(
    'Latency measures response time, throughput measures completed requests per unit time, review load counts human work, and cost measures the resources used to deliver the workflow.',
    'A service can average 40 ms yet miss a 100 ms target at p95. A queue of 25,000 alerts exceeds capacity of 8,000 per day. At $0.003 per transaction, 50 million monthly transactions cost $150,000.',
    'Averages hide slow requests and peak demand. Check percentiles, deadline failures, queue growth, availability, and the cost of the complete workflow.',
    worked(
      table(
        ['Operating measure', 'Observation', 'Comparison'],
        [
          ['Response time', 'Mean 40 ms; p95 180 ms', '100 ms authorization deadline'],
          ['Daily alerts', '25,000', '8,000 reviews available'],
          ['Monthly inference cost', '50 million × $0.003', '$150,000'],
        ],
      ),
      paragraph(
        'The mean response time does not show the slow tail. The review queue grows by 17,000 cases a day if arrivals and capacity stay fixed. Increasing API throughput would not increase investigator capacity.',
      ),
      paragraph(
        'When the system abstains and sends a request to a person, include both model spending and human review spending. State whether costs caused by incorrect decisions are included.',
      ),
    ),
  ),
};

const relatedExplorers: Record<number, { href: string; title: string; description: string }> = {
  18: {
    href: '/explorers/confusion-builder/',
    title: 'Practice with a binary confusion matrix',
    description:
      'Review true positives, false positives, and false negatives before applying those counts to each sentiment class.',
  },
  30: {
    href: '/explorers/retrieval-rank/',
    title: 'Explore retrieval ranking',
    description:
      'See which passages reach the answer stage, then use the exercises below to check the answer itself.',
  },
  31: {
    href: '/explorers/portfolio-feasible/',
    title: 'Explore portfolio return and volatility',
    description:
      'Compare allocations and return constraints. The ratio exercises on this page add reference rates and downside deviation.',
  },
  32: {
    href: '/explorers/portfolio-feasible/',
    title: 'Explore allocation constraints',
    description:
      'Check whether a proposed portfolio meets its return requirement. The exercises here examine its path, trading, and benchmark-relative risk.',
  },
  35: {
    href: '/explorers/monte-carlo-loss/',
    title: 'Explore simulated portfolio losses',
    description:
      'Compare a simulated loss distribution with the backtesting task here, which needs forecasts paired with later realized losses.',
  },
  36: {
    href: '/explorers/execution-update/',
    title: 'Explore a Q-learning update',
    description:
      'See how one reward changes an action value. Then compare full execution-policy costs in the exercises on this page.',
  },
  37: {
    href: '/explorers/ops-budget/',
    title: 'Explore operating capacity and cost',
    description:
      'Check the resources a workflow needs alongside its task-completion and verification results.',
  },
};

const symbolNames: Record<string, string> = {
  '2u': '2ᵘ',
  'e, e−z': 'e, e⁻ᶻ',
  'e−Fm': 'e^(−Fₘ)',
  e2i: 'eᵢ²',
  'p2f , p2l': 'p_f², p_l²',
  σp2: 'σₚ²',
  β2: 'β²',
  R2: 'R²',
  log2: 'log₂',
  'log2 (i + 1)': 'log₂(i + 1)',
  maxt: 'max over t',
  gaini: 'gainᵢ',
  reli: 'relᵢ',
  'K1 , K2': 'K₁, K₂',
  'K2 − K1': 'K₂ − K₁',
  'n1 , n2': 'n₁, n₂',
  'q1 , q2 , d1 , d2': 'q₁, q₂, d₁, d₂',
  'p or P D': 'p or PD',
  'F ees': 'Fees',
  'P Di': 'PDᵢ',
  'M DD': 'MDD',
  'V aRα,t': 'VaRα,t',
  'CT W AP': 'C_TWAP',
  'Nunsaf e': 'N_unsafe',
  'Cpass , Cf lag': 'C_pass, C_flag',
  'Numerator T P + T N': 'Numerator TP + TN',
  'T P (t)': 'TP(t)',
  'F P (t)': 'FP(t)',
  'F 1c': 'F1꜀',
  '∆T P R': 'ΔTPR',
  'T Pc': 'TP꜀',
  'F Pc': 'FP꜀',
  'F Nc': 'FN꜀',
  'T Pg': 'TPɡ',
  'T P Rg , F P Rg': 'TPRɡ, FPRɡ',
  'Ag − T Pg': 'Aɡ − TPɡ',
  'cF N': 'c_FN',
  'cF P': 'c_FP',
  'M AEbaseline , M AEmodel': 'MAE_baseline, MAE_model',
  'P @K': 'P@K',
  'CK 2 − CK 1': 'C_K₂ − C_K₁',
  'G 1 , G2': 'G₁, G₂',
  'Vinitial , Vf inal': 'V_initial, V_final',
};

function repairSymbol(exercise: string, originalSymbol: string, originalMeaning: string) {
  let symbol = symbolNames[originalSymbol] ?? originalSymbol;
  let meaning = originalMeaning;
  if (exercise === 'M06' && originalSymbol.startsWith('1 in Specif')) {
    symbol = '1 in Specificity + FPR = 1';
    meaning = 'The whole legitimate population, equivalent to 100%.';
  }
  if (exercise === 'M32b' && originalSymbol === 'point') return null;
  if (exercise === 'M32b' && originalSymbol === 'Basis point; percentage') {
    symbol = 'Basis point; percentage point';
    meaning =
      'One basis point is 0.01 percentage point. A rise from 50% to 55% is five percentage points.';
  }
  if (exercise === 'M14' && meaning.startsWith('Index of a score band')) symbol = 'b';
  if (exercise === 'A08' && meaning.startsWith('Add the indicated terms')) symbol = 'Σ';
  if (originalSymbol === 'Positive class')
    meaning = 'The outcome designated as positive; fraud in this exercise.';
  if (exercise === 'S04' && originalSymbol === '⌈pN ⌉')
    meaning =
      'Nearest-rank position: round p × N up to the smallest integer at least as large as the product. An integer product stays unchanged.';
  if (exercise === 'A08' && originalSymbol === 'e; ln')
    meaning =
      'e ≈ 2.71828 is the base of the exponential function; ln is its inverse function. For example, e^(ln 3) = 3.';
  if (exercise === 'M16' && originalSymbol === 'ln')
    meaning =
      'Natural logarithm, using base e ≈ 2.71828. For a probability greater than 0 and at most 1, its value is nonpositive.';
  meaning = meaning
    .replace(/2AU C/g, '2 × AUC')
    .replace(/\(F P R, T P R\)/g, '(FPR, TPR)')
    .replace(/2reli − 1/g, '2^(relᵢ) − 1')
    .replace(/2−1 = 1\/2/g, '2⁻¹ = 1/2');
  return { symbol, meaning };
}

function repairGlossary(course: any) {
  for (const exercise of course.exercises) {
    exercise.symbols = exercise.symbols.flatMap((original: { symbol: string; meaning: string }) => {
      const repaired = repairSymbol(exercise.id, original.symbol, original.meaning);
      return repaired ? [{ ...original, ...repaired }] : [];
    });
  }
  const entries: Record<string, any[]> = {};
  for (const [originalSymbol, definitions] of Object.entries(course.glossary) as [
    string,
    any[],
  ][]) {
    for (const original of definitions) {
      const repaired = repairSymbol(original.exercise, originalSymbol, original.meaning);
      if (!repaired) continue;
      const { symbol, meaning } = repaired;
      const definition = { ...original, meaning };
      const group = (entries[symbol] ??= []);
      const existing = group.find((item) => item.meaning === definition.meaning);
      if (existing) {
        existing.exercises = [
          ...new Set([
            ...(existing.exercises ?? [existing.exercise]),
            ...(definition.exercises ?? [definition.exercise]),
          ]),
        ];
        existing.sources = [
          ...(existing.sources ?? [{ exercise: existing.exercise, source: existing.source }]),
          ...(definition.sources ?? [{ exercise: definition.exercise, source: definition.source }]),
        ];
      } else {
        group.push({ ...definition, exercises: definition.exercises ?? [definition.exercise] });
      }
    }
  }
  course.glossary = entries;
}

const workedEquationCopy: Record<string, { readAloud: string; symbols: { symbol: string; meaning: string }[] }[]> = {
  'confusion-matrix': [{ readAloud: 'Add the four cells to confirm the table accounts for all 10,000 transactions. Each transaction belongs in exactly one cell, so this is a check of the counts rather than a performance score.', symbols: [] }],
  accuracy: [{ readAloud: 'Accuracy is the number of correct decisions, true positives plus true negatives, divided by every evaluated transaction. Here that is 98.2%. Because legitimate transactions dominate the sample, accuracy can be high even when many frauds are missed.', symbols: [{ symbol: 'TP', meaning: 'Frauds correctly flagged.' }, { symbol: 'TN', meaning: 'Legitimate transactions correctly passed.' }, { symbol: 'N', meaning: 'All evaluated transactions.' }] }],
  'balanced-accuracy': [
    { readAloud: 'Recall divides the 60 caught frauds by all 100 frauds. Specificity divides correctly passed legitimate transactions by all 9,900 legitimate transactions. The denominators are the actual class totals.', symbols: [{ symbol: 'Recall', meaning: 'Share of actual fraud cases flagged.' }, { symbol: 'Specificity', meaning: 'Share of actual legitimate cases passed.' }, { symbol: '60', meaning: 'True positives: fraud cases caught.' }, { symbol: '100', meaning: 'All fraud cases.' }, { symbol: '9,760', meaning: 'True negatives: legitimate cases passed.' }, { symbol: '9,900', meaning: 'All legitimate cases.' }] },
    { readAloud: 'Balanced accuracy gives recall and specificity equal weight by taking their average. The result is not the fraction of every transaction classified correctly; it balances performance across the two actual classes.', symbols: [{ symbol: 'Balanced accuracy', meaning: 'Average of positive-class recall and negative-class specificity.' }, { symbol: 'Recall', meaning: 'Fraction of actual fraud caught.' }, { symbol: 'Specificity', meaning: 'Fraction of actual legitimate cases correctly passed.' }] },
  ],
  recall: [{ readAloud: 'Multiply the 40 missed frauds by the assumed $500 loss per missed case. This is the modeled loss for these misses under that cost assumption; it does not include review costs or other consequences.', symbols: [{ symbol: '40', meaning: 'Fraud cases the detector missed.' }, { symbol: '$500', meaning: 'Assumed loss for each missed fraud.' }] }],
  'roc-auc-and-gini': [{ readAloud: 'Gini rescales AUC by doubling it and subtracting one. With AUC 0.88, the ranking Gini is 0.76. This is a ranking measure and is distinct from Gini impurity used to judge a tree split.', symbols: [{ symbol: 'AUC', meaning: 'Area under the ROC curve; summarizes how often positive cases rank above negative cases.' }, { symbol: 'Gini', meaning: 'AUC rescaled so random ranking is zero.' }] }],
  'ks-statistic': [{ readAloud: 'At each cutoff, compare the cumulative share of defaults captured, D(t), with the cumulative share of non-defaults flagged, L(t). The largest absolute gap here is 0.54 at the supplied cutoff; it is a separation statistic, not an optimal financial threshold.', symbols: [{ symbol: 'KS', meaning: 'Largest gap between the two cumulative capture rates.' }, { symbol: 'D(t)', meaning: 'Share of actual defaults flagged at cutoff t.' }, { symbol: 'L(t)', meaning: 'Share of actual non-defaults flagged at cutoff t.' }, { symbol: 't', meaning: 'Score cutoff being evaluated.' }] }],
  'precision-recall-curve-and-pr-auc': [{ readAloud: 'Average precision adds each precision value weighted by the recall gained at that point. It is a stepwise convention for summarizing a ranked list; it is not the trapezoid area unless that convention is explicitly used.', symbols: [{ symbol: 'AP', meaning: 'Average precision for the ranked list.' }, { symbol: 'R_j−R_(j−1)', meaning: 'Increase in recall at step j.' }, { symbol: 'P_j', meaning: 'Precision at step j.' }] }],
  'precision-k-and-recall-k': [
    { readAloud: 'Precision at 100 is 45 frauds divided by the 100 reviewed transactions, so 45% of this queue is fraud. The denominator is review workload.', symbols: [{ symbol: 'Precision@100', meaning: 'Frauds found in the first 100 reviews divided by 100 reviews.' }] },
    { readAloud: 'Recall at 100 is the same 45 frauds divided by all 100 frauds in the population, so this queue caught 45% of known fraud. The denominator is all fraud, not the reviewed cases.', symbols: [{ symbol: 'Recall@100', meaning: 'Frauds found in the first 100 reviews divided by all fraud cases.' }] },
  ],
  'lift-and-cumulative-gain': [
    { readAloud: 'Lift compares the queue’s 45% fraud share with the 1% population prevalence. A value of 45 means this queue is 45 times as concentrated as random selection in this sample; it does not say the queue caught 45 times all fraud.', symbols: [{ symbol: 'Lift@100', meaning: 'Queue precision divided by population fraud prevalence.' }, { symbol: 'Precision@100', meaning: 'Fraud share among the first 100 reviewed cases.' }, { symbol: 'Prevalence', meaning: 'Fraud share in the full population.' }] },
    { readAloud: 'Cumulative gain divides the 45 frauds found by all 100 fraud cases. Reviewing the top 1% of transactions therefore captures 45% of the known fraud in this example.', symbols: [{ symbol: 'Gain', meaning: 'Share of all fraud cases found within the selected queue.' }, { symbol: '45', meaning: 'Frauds found in the queue.' }, { symbol: '100', meaning: 'All fraud cases in the population.' }] },
  ],
  'calibration-curve': [
    { readAloud: 'Multiply 35 expected defaults by the assumed $4,000 loss per default. The $140,000 is a probability-weighted average loss estimate for this group, not a bill known in advance.', symbols: [{ symbol: '35', meaning: 'Expected defaults from the group’s predicted probabilities.' }, { symbol: '$4,000', meaning: 'Assumed dollars lost per default.' }] },
    { readAloud: 'Multiply the 43 defaults that actually occurred by the same assumed loss. This gives realized loss in this sample; it can differ from expected loss because probabilities describe averages, not certain individual outcomes.', symbols: [{ symbol: '43', meaning: 'Defaults observed in the group.' }, { symbol: '$4,000', meaning: 'Assumed dollars lost per default.' }] },
  ],
  'brier-score': [{ readAloud: 'For each of four cases, square the difference between predicted probability and actual 0-or-1 outcome, then average the four terms. The mean is 0.1125; lower is better on these same cases, but the score alone does not isolate calibration.', symbols: [{ symbol: 'p_i', meaning: 'Predicted probability for case i.' }, { symbol: 'y_i', meaning: 'Actual outcome, 1 if default happened and 0 otherwise.' }, { symbol: 'N', meaning: 'Four evaluated cases.' }] }],
  'log-loss': [
    { readAloud: 'Because the outcome is legitimate, the probability assigned to what happened is 1−p = 0.40. Taking the negative natural logarithm of 0.40 gives a penalty of about 0.92; a probability of 1 would give zero penalty, while zero would give infinite loss mathematically. This exercise uses a tiny floor so the result remains finite.', symbols: [{ symbol: 'p', meaning: 'Model probability of fraud.' }, { symbol: '1−p', meaning: 'Model probability of a legitimate outcome.' }, { symbol: 'ln', meaning: 'Natural logarithm; its negative turns a small outcome probability into a large positive penalty.' }] },
    { readAloud: 'The actual outcome is still legitimate, but this model assigned only 1% probability to it. Taking the negative natural logarithm of 0.01 gives about 4.61, a much larger penalty for a confident miss. This is a probability score, not a dollar amount.', symbols: [{ symbol: 'p', meaning: 'Model probability of fraud.' }, { symbol: '1−p', meaning: 'Probability of the observed legitimate outcome.' }, { symbol: 'L', meaning: 'Log-loss penalty for this case.' }] },
  ],
  'macro-f1-micro-f1-weighted-f1': [
    { readAloud: 'Macro-F1 averages the three class F1 scores equally. The low 0.20 score for the rare class counts just as much as either larger class, bringing the average to 0.65.', symbols: [{ symbol: 'F1_macro', meaning: 'Unweighted mean of per-class F1 scores.' }, { symbol: '0.95, 0.80, 0.20', meaning: 'F1 scores for the three classes.' }, { symbol: '3', meaning: 'Number of classes.' }] },
    { readAloud: 'Weighted-F1 multiplies each class F1 by that class’s share of examples, then adds. The common class contributes 70% of the result, so the score of 0.845 can conceal weaker performance on the rare class.', symbols: [{ symbol: 'F1_weighted', meaning: 'Per-class F1 average weighted by each class’s support.' }, { symbol: '0.70, 0.20, 0.10', meaning: 'Share of examples in each class.' }, { symbol: '0.95, 0.80, 0.20', meaning: 'F1 score for each corresponding class.' }] },
  ],
  'fairness-measures': [{ readAloud: 'Divide group B’s 42% selection rate by group A’s 60% rate. The ratio is 0.70, so B’s rate is 70% of A’s rate in this sample. This flags a difference; it does not explain its cause or settle a fairness assessment.', symbols: [{ symbol: 'Selection-rate ratio B/A', meaning: 'Group B’s approval share divided by group A’s approval share.' }, { symbol: '42%', meaning: 'Share selected in group B.' }, { symbol: '60%', meaning: 'Share selected in group A.' }] }],
  'mean-absolute-error': [{ readAloud: 'Add the four absolute forecast errors, measured in thousands of dollars, and divide by four observations. The average miss is 12.5 thousand dollars per period; taking absolute values prevents over- and underestimates from canceling.', symbols: [{ symbol: 'MAE', meaning: 'Average absolute difference between forecast and actual.' }, { symbol: '10, 10, 20, 10', meaning: 'Absolute errors in thousands of dollars.' }, { symbol: '4', meaning: 'Number of forecast periods.' }] }],
  'root-mean-squared-error': [{ readAloud: 'Square each error so larger misses count more, average the four squared errors, and take the square root to return to thousands of dollars. RMSE is about 13.2 thousand dollars and exceeds MAE because of the larger miss.', symbols: [{ symbol: 'RMSE', meaning: 'Square root of mean squared forecast error.' }, { symbol: 'errors', meaning: 'Forecast minus actual, in thousands of dollars.' }, { symbol: '4', meaning: 'Number of periods.' }] }],
  'mape-wape-mase': [
    { readAloud: 'For each period, divide absolute error by that period’s actual amount, average the four percentages, and convert to percent. The result gives each period equal weight and can become unstable when actual values are small.', symbols: [{ symbol: 'MAPE', meaning: 'Mean of absolute error divided by each actual value.' }, { symbol: '10, 10, 20, 10', meaning: 'Absolute errors.' }, { symbol: '100, 120, 80, 150', meaning: 'Actual values for the four periods.' }] },
    { readAloud: 'WAPE adds absolute errors first and divides by total actual volume. Here the result is about 11.1%; larger-volume periods contribute more than they do in MAPE.', symbols: [{ symbol: 'WAPE', meaning: 'Total absolute error divided by total actual amount.' }, { symbol: 'Σ|error|', meaning: 'Sum of absolute errors.' }, { symbol: 'Σactual', meaning: 'Sum of actual values.' }] },
    { readAloud: 'The training naive scale averages the absolute one-step errors on training data. It is 20 thousand dollars and supplies a fixed reference for scaling test MAE.', symbols: [{ symbol: 'd_train', meaning: 'Mean absolute error of the naive forecast on training periods.' }, { symbol: '100, 120, 140', meaning: 'Observed training values used in consecutive differences.' }, { symbol: '80, 100, 120', meaning: 'Previous-period naive forecasts.' }] },
    { readAloud: 'Divide test MAE by the training naive error scale. A MASE of 0.625 means test error is 62.5% of that training reference scale; it does not guarantee future improvement.', symbols: [{ symbol: 'MASE', meaning: 'Test mean absolute error divided by training naive-error scale.' }, { symbol: '12.5', meaning: 'Test MAE in thousands of dollars.' }, { symbol: '20', meaning: 'Training naive MAE in thousands of dollars.' }] },
  ],
  r: [{ readAloud: 'R-squared is one minus model squared error divided by variation around the sample mean. With SSE 700 and SST 2,675, it is about 0.738. The model reduces squared error relative to the mean reference by about 73.8% on this sample.', symbols: [{ symbol: 'R²', meaning: 'Squared-error improvement over predicting the sample mean.' }, { symbol: 'SSE', meaning: 'Sum of squared model errors.' }, { symbol: 'SST', meaning: 'Sum of squared deviations from the actual-value mean.' }] }],
  'prediction-interval-coverage-and-width': [{ readAloud: 'Thirty-seven of 50 observed values fell inside their predicted intervals, so empirical coverage is 74%. Compare this with the advertised target; coverage alone can be increased by making intervals excessively wide.', symbols: [{ symbol: 'Observed coverage', meaning: 'Fraction of actual values inside their predicted lower and upper bounds.' }, { symbol: '37', meaning: 'Values covered by the intervals.' }, { symbol: '50', meaning: 'Total evaluated values.' }] }],
  'silhouette-score': [{ readAloud: 'The point’s average distance to its own cluster is 2 and to the nearest other cluster is 5. The silhouette is (5−2)/5 = 0.60, indicating it is closer to its assigned cluster in this distance comparison.', symbols: [{ symbol: 's', meaning: 'Silhouette score for one data point.' }, { symbol: 'a', meaning: 'Average distance to points in its own cluster.' }, { symbol: 'b', meaning: 'Average distance to the nearest alternative cluster.' }] }],
  'retrieval-recall-k-and-context-precision': [
    { readAloud: 'Across the questions, 16 of 20 known relevant passages were retrieved, giving mean recall of 80% under this pooled calculation. High recall means evidence coverage, not that every retrieved passage is useful.', symbols: [{ symbol: 'Recall@5', meaning: 'Relevant passages retrieved among the top five relative to all known relevant passages.' }, { symbol: '16', meaning: 'Relevant passages retrieved.' }, { symbol: '20', meaning: 'Relevant passages available across the questions.' }] },
    { readAloud: 'Two of the five retrieved passages were relevant, so context precision is 40%. Its denominator is all retrieved passages, unlike recall’s denominator of all relevant evidence.', symbols: [{ symbol: 'Context precision@5', meaning: 'Relevant retrieved passages divided by the five returned passages.' }, { symbol: '2', meaning: 'Relevant passages returned.' }, { symbol: '5', meaning: 'All passages returned.' }] },
  ],
  'mrr-and-ndcg': [
    { readAloud: 'For each query, score the rank of its first relevant result as one divided by that rank; no result contributes zero. Averaging 1, one-half, one-fifth, and zero gives MRR 0.425. It measures first-useful-result position, not full evidence coverage.', symbols: [{ symbol: 'MRR', meaning: 'Mean reciprocal rank across queries.' }, { symbol: '1, 1/2, 1/5, 0', meaning: 'Reciprocal ranks for the four queries.' }, { symbol: '4', meaning: 'Number of evaluated queries.' }] },
    { readAloud: 'Each relevance grade r becomes gain 2^r−1, then is divided by a logarithmic rank discount. Summing the discounted gains gives DCG@K; high-relevance results near the top contribute most.', symbols: [{ symbol: 'r_i', meaning: 'Relevance grade of result at rank i.' }, { symbol: '2^r−1', meaning: 'Gain transformation that gives larger grades extra weight.' }, { symbol: 'log₂(i+1)', meaning: 'Rank discount.' }, { symbol: 'K', meaning: 'Number of ranked results included.' }] },
    { readAloud: 'Normalize the ranking’s DCG by the ideal ranking’s DCG. A value near 0.71 means the observed ordering earns about 71% of the ideal discounted gain under these relevance judgments.', symbols: [{ symbol: 'nDCG@3', meaning: 'DCG for the top three divided by ideal DCG for those results.' }, { symbol: 'DCG', meaning: 'Discounted gain in the observed order.' }, { symbol: 'IDCG', meaning: 'Discounted gain in the ideal order.' }] },
  ],
  'sharpe-and-sortino-ratios': [
    { readAloud: 'Subtract the 4% reference return from the fund’s 9% average, then divide the 5 percentage-point excess by 10% total volatility. Sharpe is 0.50 for this period convention.', symbols: [{ symbol: 'Sharpe', meaning: 'Average return above the risk-free rate divided by total return standard deviation.' }, { symbol: '9%', meaning: 'Fund average return.' }, { symbol: '4%', meaning: 'Risk-free reference return.' }, { symbol: '10%', meaning: 'Standard deviation of fund returns.' }] },
    { readAloud: 'Keep the same 5 percentage-point excess return but divide by 6% downside deviation. Sortino is about 0.83; its larger value here reflects that downside variability is smaller than total variability.', symbols: [{ symbol: 'Sortino', meaning: 'Average excess return divided by downside deviation.' }, { symbol: '9%', meaning: 'Fund average return.' }, { symbol: '4%', meaning: 'Risk-free reference return.' }, { symbol: '6%', meaning: 'Downside deviation under the stated target.' }] },
  ],
  'maximum-drawdown-turnover-tracking-error': [
    { readAloud: 'The value fell $30 from a previous peak of $120. Dividing the decline by the peak gives a 25% drawdown; it measures loss from a high, even if the portfolio later recovers.', symbols: [{ symbol: 'Drawdown', meaning: 'Decline from the running portfolio-value peak divided by that peak.' }, { symbol: '120', meaning: 'Prior peak value.' }, { symbol: '90', meaning: 'Current value at the trough.' }] },
    { readAloud: 'Sum the absolute changes in the three asset weights, then halve the total because purchases and sales are two sides of the same rebalance. One-way turnover is 20% of portfolio value.', symbols: [{ symbol: 'Turnover', meaning: 'One-way fraction of portfolio value traded.' }, { symbol: '30, 50, 20', meaning: 'Target asset weights in percent.' }, { symbol: '50, 30, 20', meaning: 'Current asset weights in percent.' }] },
  ],
  'value-at-risk-and-expected-shortfall': [{ readAloud: 'Average the 100 largest scenario losses to estimate 99% Expected Shortfall under the exercise’s tail convention. This describes average severity in that simulated tail; it depends on the scenario assumptions and sample.', symbols: [{ symbol: 'ES_99%', meaning: 'Average loss in the worst 1% tail under the stated convention.' }, { symbol: '100', meaning: 'Number of tail scenarios averaged.' }, { symbol: 'scenario loss', meaning: 'Loss amount produced by one simulated scenario.' }] }],
  'probability-of-shortfall-and-monte-carlo-error': [
    { readAloud: 'Divide the 1,200 simulated breaches by 10,000 runs to estimate a 12% probability. The standard error formula measures finite-run sampling noise and is about 0.00325, or 0.325 percentage point.', symbols: [{ symbol: 'p̂', meaning: 'Estimated breach probability.' }, { symbol: '1,200', meaning: 'Simulation runs with a breach.' }, { symbol: '10,000', meaning: 'Total simulation runs.' }, { symbol: 'SE', meaning: 'Approximate standard error from finite simulation count.' }] },
    { readAloud: 'A rough 95% interval is the estimate plus or minus 1.96 standard errors. Here the margin is about 0.64 percentage point. This interval covers simulation sampling uncertainty under the model, not uncertainty about whether the model assumptions are right.', symbols: [{ symbol: 'p̂', meaning: 'Estimated breach probability.' }, { symbol: '1.96', meaning: 'Approximate normal multiplier for a 95% interval.' }, { symbol: 'SE', meaning: 'Monte Carlo standard error.' }] },
  ],
  'var-exception-rate': [
    { readAloud: 'A 99% confidence threshold has a 1% nominal tail probability. Across 250 periods, the expected exception count is 2.5 on average; an individual sample need not contain exactly 2.5 exceptions.', symbols: [{ symbol: '250', meaning: 'Number of evaluated periods.' }, { symbol: '1−0.99', meaning: 'Nominal 1% tail probability for exceptions.' }] },
    { readAloud: 'Twelve exceptions among 250 periods produce an observed rate of 4.8%. Compare this with the 1% nominal rate over the same window; the difference is a diagnostic to investigate, not an explanation by itself.', symbols: [{ symbol: '12', meaning: 'Exceptions observed.' }, { symbol: '250', meaning: 'Periods evaluated.' }, { symbol: 'Observed rate', meaning: 'Observed exceptions divided by evaluated periods.' }] },
  ],
  'cumulative-reward-and-regret': [{ readAloud: 'The policy saves 3 basis points relative to the 18-bps TWAP cost, while it remains 4 bps above the 11-bps hindsight cost. Hindsight uses future information, so it is a reference floor rather than a strategy that could be selected in advance.', symbols: [{ symbol: 'Improvement', meaning: 'TWAP cost minus policy cost, in basis points.' }, { symbol: 'Hindsight regret', meaning: 'Policy cost minus hindsight cost, in basis points.' }, { symbol: '18 bps', meaning: 'TWAP benchmark cost.' }, { symbol: '15 bps', meaning: 'Policy cost.' }, { symbol: '11 bps', meaning: 'Hindsight benchmark cost.' }] }],
  'population-stability-index': [{ readAloud: 'For each band, compare its current share A_i with its reference share E_i, weight their difference by the log ratio, then sum. PSI of about 0.127 signals a shift worth investigating; it does not prove predictive performance has degraded.', symbols: [{ symbol: 'PSI', meaning: 'Population Stability Index, the sum of band-level distribution-change contributions.' }, { symbol: 'A_i', meaning: 'Current share in band i.' }, { symbol: 'E_i', meaning: 'Reference share in band i.' }, { symbol: 'ln', meaning: 'Natural logarithm.' }] }],
};

function authorWorkedEquations(slug: string, content: MeasureLesson): void {
  const pending = content.lessonSections.flatMap((section) => section.blocks).filter((block) => block.kind === 'math' && (!block.readAloud?.trim() || !Array.isArray(block.symbols)));
  if (pending.length === 0) return;
  const authored = workedEquationCopy[slug] ?? [];
  if (authored.length !== pending.length) throw new Error(`Worked formula copy count mismatch for ${slug}: ${authored.length} authored, ${pending.length} needed`);
  pending.forEach((block, index) => Object.assign(block, authored[index]));
}

export function applyMeasureLessons(course: any): void {
  for (const measure of course.measures) {
    const content = lessons[measure.slug];
    if (!content) throw new Error(`Missing authored measure lesson: ${measure.slug}`);
    Object.assign(measure, content);
    authorWorkedEquations(measure.slug, measure);
    if (relatedExplorers[measure.number])
      measure.relatedExplorer = relatedExplorers[measure.number];
    if (measure.slug === 'r') measure.title = 'R²';
  }
  const probability = course.evaluation.find((group: any) => group.id === 'probability');
  if (probability) {
    probability.title = 'Do predicted probabilities match what happens?';
    probability.interpretation =
      'Among applicants assigned 10% default risk, do about 10% default? This is calibration.';
  }
  const rare = course.evaluation.find((group: any) => group.id === 'rare');
  if (rare)
    rare.interpretation = 'How much fraud is detected, and how many legitimate cases are reviewed?';
  repairGlossary(course);
}
