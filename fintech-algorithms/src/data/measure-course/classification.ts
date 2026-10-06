import { c, f, type MeasureSeed } from './authoring';
const basic = ['notation', 'probability', 'data-splits'];
const fraudTerms: MeasureSeed['terms'] = [
  [
    'Positive class',
    'The outcome designated for detection, regardless of whether it is desirable.',
    'Fraud is positive; legitimate is negative.',
  ],
  [
    'True positive',
    'An actual positive correctly predicted positive.',
    'A fraudulent payment that is flagged.',
  ],
  [
    'False positive',
    'An actual negative incorrectly predicted positive.',
    'A legitimate payment that is flagged.',
  ],
  [
    'False negative',
    'An actual positive incorrectly predicted negative.',
    'A fraudulent payment that passes.',
  ],
  [
    'True negative',
    'An actual negative correctly predicted negative.',
    'A legitimate payment that passes.',
  ],
];
export const classificationSeeds: MeasureSeed[] = [
  {
    number: 1,
    slug: 'confusion-matrix',
    title: 'Confusion Matrix',
    definition:
      'A confusion matrix is a counted map of predictions against observed outcomes. It separates correct decisions from each type of error.',
    precise:
      'For a binary classifier at a fixed threshold, the matrix contains TP, FP, FN and TN, with actual and predicted classes stated explicitly.',
    prerequisites: basic,
    terms: fraudTerms,
    mechanics: [
      'Declare fraud positive. In 20 payments, four are fraud, five are flagged, and three flagged payments are fraud. These are three different populations.',
      'Cross actual class with predicted class once per payment. TP=3; flagged but legitimate FP=5−3=2; unflagged fraud FN=4−3=1; the remaining legitimate TN=16−2=14.',
      'These are nonnegative integer counts. On a fixed sample, more TP/TN and fewer FP/FN indicate more correct labels; cost still depends on the error mix. TP+FP+FN+TN=N. Changing the threshold changes predicted classes, while observed labels remain fixed. Row/column orientation varies between software packages, so read the labels.',
    ],
    formulas: [
      f(
        'N=TP+FP+FN+TN,\\quad P=TP+FN,\\quad A=TP+FP',
        'N counts all payments; P counts actual fraud; A counts alerts. Add disjoint cells, not overlapping totals. All quantities are event counts.',
        ['N', 'Number of evaluated payments.'],
        ['P', 'Number of actual positive payments.'],
        ['A', 'Number of alerts.'],
        ['TP', 'Flagged fraud count.'],
        ['FP', 'Flagged legitimate count.'],
        ['FN', 'Passed fraud count.'],
        ['TN', 'Passed legitimate count.'],
      ),
    ],
    trace: [
      ['Actual class', 'P=4; negatives=20−4=16', 'Fraud is a minority.'],
      ['Flagged cells', 'TP=3; FP=5−3=2', 'The five alerts contain two false alerts.'],
      ['Passed cells', 'FN=4−3=1; TN=16−2=14', 'One fraud escapes.'],
      ['Audit total', '3+2+1+14=20', 'Every payment is counted exactly once.'],
    ],
    interpretation:
      'This detector interrupts two legitimate customers, finds three frauds, and misses one. These counts support precision, recall and cost analysis; they do not directly price the errors.',
    comparison:
      'Two detectors with the same total errors may have different FP/FN mixtures and financial consequences. Compare on the same labeled transactions and positive-class convention.',
    boundaries:
      'The matrix is still meaningful with no alerts or no actual fraud, but a rate derived from a zero denominator can be undefined. Multi-class matrices have one actual/predicted cell per class pair; the binary labels TP/FP/FN/TN are class-relative.',
    mechanismChecks: [
      c(
        'What distinguishes FP from FN in payment review?',
        'FP interrupts a legitimate payment; FN misses fraud.',
        'FP is predicted positive but actually negative; FN is actually positive but predicted negative.',
        'FP is caught fraud; FN is passed legitimate activity.|Caught fraud is TP, and passed legitimate activity is TN; FP and FN are errors.',
        'Both cells count all correct predictions.|FP and FN are the two error types, so neither counts correct predictions.',
      ),
      c(
        'Which total counts every actual fraud?',
        'TP + FN',
        'Actual fraud is either caught or missed. Alerts instead use TP+FP.',
        'TP + FP|This is the alert total.',
        'FP + TN|This is the legitimate population.',
      ),
      c(
        'What are the units of a confusion-matrix cell?',
        'Counts of observations',
        'Each payment contributes one integer to one cell. Rates require an additional denominator.',
        'Dollar loss|Dollar loss requires multiplying cells by severity assumptions; a matrix cell itself counts events.',
        'Probability of default|A probability requires dividing a count by a defined population; the cell is a raw count.',
      ),
    ],
    calculations: [
      c(
        'Of 20 payments, 4 are fraud. Five alerts contain 3 frauds. How many FP are there?',
        '2',
        'FP=all alerts−caught fraud=5−3=2.',
        '1|One is the FN count.',
        '5|Five counts all alerts.',
      ),
      c(
        'A queue catches 6 of 8 actual frauds. How many FN remain?',
        '2',
        'Actual fraud partitions into TP and FN: 8−6=2.',
        '6|Six is the TP count.',
        '14|Adding TP to actual fraud double counts.',
      ),
      c(
        'A sample has N=30, TP=4, FP=3 and FN=2. What is TN?',
        '21',
        'Subtract the other three disjoint cells: 30−4−3−2=21.',
        '23|This leaves FN unaccounted for.',
        '30|This ignores the other cells.',
      ),
    ],
    applications: [
      c(
        'Which policy question can this matrix answer directly?',
        'How many legitimate customers were flagged?',
        'FP directly counts legitimate customer interruptions in the labeled sample.',
        'How many dollars each fraud will cost?|The matrix has event counts but no individual severity amounts, so it cannot price each fraud.',
        'Whether a customer is certainly fraudulent?|The table records evaluated labels and predictions, not certainty about a new customer.',
      ),
      c(
        'Two policies each make 3 errors. What should the analyst inspect next?',
        'Their FP/FN mix and the costs of each error',
        'Three false alerts and three missed frauds can have very different costs.',
        'Treat the policies as financially identical.|Equal error totals can have different expensive misses and cheap false alerts.',
        'Pick whichever has more TN without considering the sample size.|TN count depends on sample size and does not by itself compare error severity.',
      ),
      c(
        'There are zero alerts. Which conclusion is valid?',
        'TP=FP=0, but precision has a zero denominator.',
        'The count matrix remains valid; TP/(TP+FP)=0/0 is undefined unless a convention is stated.',
        'Precision must equal 100%.|No alerts leaves TP+FP=0; absence of FP does not turn 0/0 into perfect precision.',
        'All actual fraud was caught.|No alerts means no actual fraud is caught; any actual fraud would be missed.',
      ),
    ],
  },
  {
    number: 2,
    slug: 'accuracy',
    title: 'Accuracy',
    definition: 'Accuracy is the proportion of all evaluated decisions that are correct.',
    precise:
      'Binary accuracy is (TP+TN)/N, where every observation has equal weight regardless of class or financial value.',
    prerequisites: basic,
    terms: [
      [
        'Correct prediction',
        'A prediction that matches the observed label.',
        'Caught fraud and passed legitimate payments.',
      ],
      [
        'Prevalence',
        'The fraction of observations belonging to the positive class.',
        'Four frauds out of 20 is 20%.',
      ],
      [
        'Majority-class baseline',
        'A rule that always predicts the more common class.',
        'Passing all 20 payments correctly passes 16.',
      ],
    ],
    mechanics: [
      'Use all observations as the denominator, not just alerts or actual fraud. Add TP and TN, then divide by N.',
      'The same calculation equals one minus the fraction of mistakes, (FP+FN)/N. Accuracy is unitless in [0,1]; higher means more correct labels.',
      'Correctness weights a $1 fraud and a $10,000 fraud equally. It does not identify a suitable threshold or prove probabilities are calibrated.',
    ],
    formulas: [
      f(
        'Accuracy=\\frac{TP+TN}{N}=1-\\frac{FP+FN}{N}',
        'Add correctly labeled fraud and legitimate payments. Divide by all evaluated payments. Counts cancel to a unitless fraction.',
        ['TP', 'Correctly flagged fraud count.'],
        ['TN', 'Correctly passed legitimate count.'],
        ['FP', 'Incorrect legitimate-alert count.'],
        ['FN', 'Missed-fraud count.'],
        ['N', 'Total observation count.'],
      ),
    ],
    trace: [
      ['Count correct', '3+14=17', 'Both actual classes contribute.'],
      ['Divide', '17/20=0.85=85%', '17 of 20 labels are correct.'],
      ['Baseline', '16/20=80%', 'Always passing finds no fraud.'],
    ],
    interpretation:
      'In this 20-payment sample, the detector is 85% accurate against an 80% always-pass baseline. The financial value of three caught frauds must still be compared with false-alert and review costs.',
    comparison:
      'When fraud prevalence falls to 1%, always passing gives 99% accuracy while missing every fraud. Compare accuracy with recall, precision and expected cost on the same population.',
    boundaries:
      'N=0 makes accuracy undefined. Accuracy depends on class prevalence; changes in the customer mix can change it without improving class-specific detection.',
    mechanismChecks: [
      c(
        'What does accuracy count as correct?',
        'TP and TN',
        'Both caught positives and correctly passed negatives match actual labels.',
        'TP only|TP omits correctly classified negatives, which also count toward accuracy.',
        'TN only|TN omits correctly classified positives, which also count toward accuracy.',
      ),
      c(
        'What is the denominator of accuracy?',
        'All evaluated observations N',
        'Each observation counts once, so use TP+FP+FN+TN.',
        'Only actual positives|Actual positives form the recall denominator, not the all-observation denominator of accuracy.',
        'Only alerts|Alerts form the precision denominator; accuracy also evaluates passed cases.',
      ),
      c(
        'Which describes accuracy correctly?',
        'A unitless fraction from 0 to 1, with larger values indicating more correct labels',
        'It is a correctness rate, not a dollar return or a probability for one applicant.',
        'A signed dollar loss|Accuracy counts correct labels without pricing their financial consequences.',
        'A probability that each flagged payment is fraud|The probability that an alert is positive describes precision, not overall accuracy.',
      ),
    ],
    calculations: [
      c(
        'TP=3, TN=14 and N=20. What is accuracy?',
        '85%',
        '(3+14)/20=17/20=85%.',
        '75%|This confuses recall with accuracy.',
        '70%|This counts TN alone.',
      ),
      c(
        'A model makes 6 mistakes in 30 loans. What is accuracy?',
        '80%',
        'Correct=30−6=24; 24/30=80%.',
        '20%|This is the error rate.',
        '24%|24 is a count, not a percentage.',
      ),
      c(
        'Only 2 of 100 payments are fraud. An always-legitimate model has what accuracy?',
        '98%',
        'It correctly labels the 98 legitimate payments and misses both frauds.',
        '2%|This is fraud prevalence.',
        '100%|The two missed frauds are errors.',
      ),
    ],
    applications: [
      c(
        'Does 99% accuracy establish strong fraud detection when fraud prevalence is 1%?',
        'No; always predicting legitimate also achieves 99%.',
        'A majority-class baseline exposes what accuracy can hide.',
        'Yes; the detector catches 99% of fraud.|99% accuracy can come entirely from correctly passing legitimate cases; it says nothing by itself about fraud capture.',
        'Yes; every alert has 99% precision.|Precision conditions on alerts; the overall correct-label fraction cannot determine their purity.',
      ),
      c(
        'A detector improves accuracy by passing more transactions but loses fraud recall. What next?',
        'Compare the changed error counts and financial costs.',
        'A correctness gain need not be a cost reduction when missed fraud is expensive.',
        'Accept it solely because accuracy rose.|Lower fraud recall may increase costly misses even as more majority-class labels are correct.',
        'Conclude calibrated probabilities improved.|Accuracy uses hard decisions, so it cannot establish improved probability calibration.',
      ),
      c(
        'Two datasets have different fraud prevalence. What is needed for a fair accuracy comparison?',
        'A common evaluation population or an explicit adjustment for the mix.',
        'Accuracy is prevalence-dependent; class-specific rates and consistent samples help interpret changes.',
        'Only identical model names.|Model names do not hold class proportions and difficulty constant between samples.',
        'No adjustment because accuracy is unitless.|Being unitless does not make a rate independent of population composition.',
      ),
    ],
  },
  {
    number: 3,
    slug: 'balanced-accuracy',
    title: 'Balanced Accuracy',
    definition:
      'Balanced accuracy gives each actual class equal weight by averaging its detection rate.',
    precise:
      'For two classes, balanced accuracy is (recall+specificity)/2; multi-class balanced accuracy averages recall over the classes.',
    prerequisites: basic,
    terms: [
      ['Recall', 'Caught positives divided by all actual positives.', '3/4 of frauds are caught.'],
      [
        'Specificity',
        'Correct negatives divided by all actual negatives.',
        '14/16 legitimate payments pass.',
      ],
      [
        'Class weighting',
        'The influence assigned to each actual class.',
        'Fraud receives half the binary score even when rare.',
      ],
    ],
    mechanics: [
      'Compute each class rate using its own actual population. Then average the two fractions with equal weight.',
      'Do not average TP and TN counts or weight class rates by their sample sizes: that recovers ordinary accuracy instead.',
      'The score is unitless in [0,1], higher is better. An always-negative rule has 0.5 when both classes occur. Equal weighting is a statistical convention, not a financial cost ratio.',
    ],
    formulas: [
      f(
        'BA=\\frac12\\left(\\frac{TP}{TP+FN}+\\frac{TN}{TN+FP}\\right)',
        'The first fraction measures fraud detection; the second measures legitimate passing. The outer half gives each actual class equal importance.',
        ['BA', 'Balanced accuracy, unitless.'],
        ['TP', 'Caught-positive count.'],
        ['FN', 'Missed-positive count.'],
        ['TN', 'Correct-negative count.'],
        ['FP', 'False-positive count.'],
      ),
    ],
    trace: [
      ['Fraud rate', '3/(3+1)=0.75', '75% of frauds are found.'],
      ['Legitimate rate', '14/(14+2)=0.875', '87.5% pass correctly.'],
      ['Equal average', '(0.75+0.875)/2=0.8125', 'Balanced accuracy is 81.25%.'],
    ],
    interpretation:
      'Balanced accuracy keeps the minority fraud population visible, unlike an aggregate count dominated by legitimate transactions.',
    comparison:
      'Ordinary accuracy here is 85%; balanced accuracy is 81.25%. They summarize the same decisions under different class weights.',
    boundaries:
      'An absent actual class gives a zero class denominator. State which classes are included rather than silently assigning a perfect rate. Balanced accuracy still excludes dollar severity and queue capacity.',
    mechanismChecks: [
      c(
        'Which operation defines binary balanced accuracy?',
        'Average recall and specificity equally.',
        'First calculate within-class rates, then use equal weights.',
        'Average TP and TN counts.|TP and TN are counts from differently sized classes; averaging their counts does not equal averaging their rates.',
        'Calculate TP divided by alerts.|TP divided by alerts is precision, not equal-weight class detection.',
      ),
      c(
        'What is the recall denominator in balanced accuracy?',
        'TP+FN',
        'This is all actual positive cases, including misses.',
        'N|Using N dilutes positive-class detection with negative observations.',
        'TP+FP|TP+FP counts predicted positives and would produce precision rather than recall.',
      ),
      c(
        'If both classes occur, what score does always predicting negative achieve?',
        '0.5',
        'Recall=0 and specificity=1; their average is 0.5.',
        '1|Perfect negative passing is only one component; the zero positive recall must also be averaged.',
        '0|The negative class is passed correctly, so its specificity is one rather than zero.',
      ),
    ],
    calculations: [
      c(
        'Recall=0.75 and specificity=0.875. What is balanced accuracy?',
        '0.8125',
        '(0.75+0.875)/2=0.8125.',
        '0.85|This is ordinary accuracy in the shared sample.',
        '1.625|The sum has not been averaged.',
      ),
      c(
        'A fraud detector has recall 0.60 and specificity 0.90. What is BA?',
        '0.75',
        'Equal averaging gives (0.60+0.90)/2=0.75.',
        '0.54|Multiplication is not the definition.',
        '0.90|This ignores positive detection.',
      ),
      c(
        'BA=0.80 and recall=0.70. What is specificity?',
        '0.90',
        '0.80×2−0.70=0.90.',
        '0.10|This is the difference, not the second rate.',
        '0.80|The two component rates need not equal their mean.',
      ),
    ],
    applications: [
      c(
        'Why use balanced accuracy for rare fraud?',
        'It prevents the majority class from dominating the average.',
        'Each actual class contributes equally even when sample counts differ.',
        'It directly minimizes dollar losses.|Equal class weighting supplies no dollar severity or intervention-cost model.',
        'It gives every alert equal economic value.|The weights apply to actual classes, not economic value of each alert.',
      ),
      c(
        'BA improves but expensive fraud misses rise. What is justified?',
        'Inspect expected cost and class-specific errors before choosing.',
        'Equal class weights are not dollar-cost weights.',
        'Approve because BA determines profit.|Balanced accuracy is a statistical class-weighted rate, not a profit calculation.',
        'Discard fraud loss because classes are balanced.|Equal statistical weights do not remove the real loss severity of missed fraud.',
      ),
      c(
        'The evaluation sample contains no fraud. What must be reported?',
        'Positive recall is undefined and the usual binary BA cannot be evaluated as written.',
        'TP+FN=0; the positive rate has no observed denominator.',
        'BA is automatically 1.|The actual-positive denominator is zero; perfect balanced performance cannot be inferred.',
        'The classifier has proven perfect fraud recall.|With no observed fraud, the sample supplies no evidence about positive capture.',
      ),
    ],
  },
  {
    number: 4,
    slug: 'precision',
    title: 'Precision',
    definition:
      'Precision is the share of predicted positives that really are positive. It describes the quality of an alert queue.',
    precise:
      'Precision=TP/(TP+FP); its denominator is all predicted positives at the chosen cutoff.',
    prerequisites: basic,
    terms: [
      ['Alert queue', 'The observations selected for review.', 'Five flagged payments.'],
      ['True positive', 'An alert that is confirmed positive.', 'Three flagged frauds.'],
      [
        'False discovery',
        'A predicted positive that is actually negative.',
        'Two flagged legitimate payments.',
      ],
    ],
    mechanics: [
      'Freeze the score threshold. Count all alerts, then count the actual frauds inside them. Divide the second count by the first.',
      'Precision is conditional on being flagged. Recall is conditional on actually being fraud: swapping denominators changes the question.',
      'Precision is unitless in [0,1], higher means less false-alert contamination. It changes with prevalence even when true/false-positive rates are fixed.',
    ],
    formulas: [
      f(
        'P=\\frac{TP}{TP+FP},\\quad CostPerCaught=\\frac{c(TP+FP)}{TP}',
        'P counts the fraction of the review queue that is fraud. If every review costs c dollars, multiplying queue size by c and dividing by caught fraud gives dollars spent per caught event.',
        ['P', 'Precision, a unitless fraction.'],
        ['TP', 'Caught-fraud count.'],
        ['FP', 'False-alert count.'],
        ['c', 'Cost in dollars per reviewed alert.'],
      ),
    ],
    trace: [
      ['Alert total', '3+2=5', 'Three frauds and two legitimate payments.'],
      ['Precision', '3/5=0.60', '60% of alerts are fraud.'],
      ['Review spend', '5×$4=$20', 'Every reviewed alert incurs cost.'],
      ['Spend per caught fraud', '$20/3=$6.67', 'Investigation cost, excluding fraud losses.'],
    ],
    interpretation:
      'Higher precision means investigators spend less of the queue on legitimate payments, under the stated review-cost assumptions.',
    comparison:
      'A queue of two alerts catching two frauds has 100% precision but only 50% recall if four frauds exist. Compare both measures and queue volume.',
    boundaries:
      'No alerts makes precision 0/0, undefined unless a software convention is stated. No caught fraud makes cost per caught event undefined. Precision alone cannot establish recall or dollar profit.',
    mechanismChecks: [
      c(
        'Which population does precision describe?',
        'The flagged queue',
        'Precision asks how many flagged payments are actually fraud.',
        'All actual fraud|All actual fraud forms the recall population; precision conditions on receiving an alert.',
        'All payments correctly passed|Correctly passed payments are TN, whereas precision describes flagged payments.',
      ),
      c(
        'What is the precision denominator?',
        'TP+FP',
        'All predicted positives include both correct and false alerts.',
        'TP+FN|This is recall’s denominator.',
        'TN+FP|This is the actual-negative population.',
      ),
      c(
        'What does precision=0.60 mean?',
        '60% of alerts are actual positives.',
        'It describes the queue composition, not the fraction of all fraud caught.',
        '60% of all fraud is caught.|The fraction of all fraud caught is recall; precision uses the alert denominator.',
        'Every customer has a 60% default probability.|A queue-level empirical rate is not an individual calibrated default probability.',
      ),
    ],
    calculations: [
      c(
        'Five alerts contain three actual frauds. What is precision?',
        '60%',
        '3/5=0.60=60%.',
        '75%|This uses four actual frauds as denominator.',
        '15%|This uses all 20 payments.',
      ),
      c(
        'Eight of ten reviewed alerts are fraud. What is precision?',
        '80%',
        '8/10=0.80. The other two alerts are false positives.',
        '20%|This is the false-discovery share.',
        '125%|The numerator and denominator were reversed.',
      ),
      c(
        'Twelve alerts catch four frauds. Reviews cost $3 each. What is review cost per caught fraud?',
        '$9',
        '$3×12=$36; $36/4=$9 per caught fraud.',
        '$3|This is per alert, not per caught fraud.',
        '$36|This is total spending.',
      ),
    ],
    applications: [
      c(
        'Which measure best answers how useful the analyst queue is?',
        'Precision together with queue volume',
        'Precision estimates fraud concentration in the reviewed group; volume determines workload.',
        'Recall alone|Recall tells how much fraud was found but does not describe how many queue cases are false alerts.',
        'Accuracy alone|Accuracy includes many passed negatives and can hide low alert concentration.',
      ),
      c(
        'A very small queue reaches 100% precision. What still needs checking?',
        'How much actual fraud remains outside the queue.',
        'Perfect queue composition can coexist with many missed frauds.',
        'Whether precision proves every fraud was caught.|Perfect precision means every reviewed case is fraud, not that every fraud is reviewed.',
        'Whether TN must be zero.|TN describes legitimate payments passed, which can be numerous despite a pure queue.',
      ),
      c(
        'There are no alerts today. How should precision be described?',
        'Undefined because its denominator is zero.',
        'TP+FP=0, so 0/0 has no event-based interpretation.',
        '100%, because no false alerts occurred.|A zero queue supplies no observations from which to estimate its positive fraction.',
        '0%, proving the detector is useless.|An undefined queue ratio cannot by itself establish that the detector has no value.',
      ),
    ],
  },
  {
    number: 5,
    slug: 'recall',
    title: 'Recall',
    definition:
      'Recall is the fraction of actual positives the detector finds. Fraud recall describes fraud capture.',
    precise:
      'Recall=TP/(TP+FN); it is also sensitivity or the true-positive rate at a stated threshold.',
    prerequisites: basic,
    terms: [
      ['Sensitivity', 'Another name for recall.', 'Finding three out of four actual frauds.'],
      [
        'False negative',
        'An actual positive that the detector misses.',
        'One fraud passes unflagged.',
      ],
      [
        'Event recall',
        'The fraction of positive events caught, with equal event weight.',
        'Catching a $5 fraud and a $5,000 fraud each adds one event.',
      ],
    ],
    mechanics: [
      'Count all actual fraud, including cases outside the review queue. Divide caught fraud by this complete labeled population.',
      'Recall rises when more positive events are caught; lowering a threshold can raise it while also increasing false alerts.',
      'It is unitless in [0,1], with higher capture preferred subject to costs and capacity. Event recall differs from a dollar-weighted capture rate.',
    ],
    formulas: [
      f(
        'R=\\frac{TP}{TP+FN},\\quad ResidualLoss=FN\\,c_{FN}',
        'R measures the fraction of actual fraud found. If every miss loses c_FN dollars, multiply missed-fraud count by that assumed severity.',
        ['R', 'Recall, unitless.'],
        ['TP', 'Caught-fraud count.'],
        ['FN', 'Missed-fraud count.'],
        ['c_{FN}', 'Assumed dollars lost per missed fraud.'],
      ),
    ],
    trace: [
      ['Actual fraud', '3+1=4', 'Includes both found and missed events.'],
      ['Recall', '3/4=0.75', '75% capture.'],
      ['Missed loss', '1×$500=$500', 'A hypothetical equal-severity loss assumption.'],
    ],
    interpretation:
      'Recall indicates detection coverage. Residual loss translates misses into money only after a loss-severity assumption has been supplied.',
    comparison:
      'Precision can rise while recall falls if a threshold keeps only the highest-risk alerts. Inspect both plus dollar-weighted fraud capture.',
    boundaries:
      'No actual positives makes recall undefined. Full recall does not imply few false alerts, low cost or prevention of every fraud loss. Labels may arrive late, so incomplete follow-up distorts the denominator.',
    mechanismChecks: [
      c(
        'Recall answers which question?',
        'What share of all actual fraud was caught?',
        'Its denominator includes both detected and missed fraud.',
        'What share of alerts was fraud?|Fraud among alerts is precision; recall includes fraud outside the queue.',
        'What share of legitimate activity passed?|Legitimate passing is specificity, which conditions on actual negatives.',
      ),
      c(
        'What is the denominator for recall?',
        'TP+FN',
        'Actual positives partition into caught and missed cases.',
        'TP+FP|TP+FP is the alert total and therefore the precision denominator.',
        'N|N includes legitimate cases; recall conditions on actual positive events only.',
      ),
      c(
        'Why can event recall differ from dollar capture?',
        'Events have different dollar loss amounts.',
        'Recall counts each positive event once; dollar capture weights amounts.',
        'Recall already measures dollars.|Event recall weights each caught fraud once regardless of dollar amount.',
        'False positives determine all captured dollars.|False positives are legitimate interruptions; dollar capture depends on the amounts of true positives and all actual fraud.',
      ),
    ],
    calculations: [
      c(
        'Three of four actual frauds are caught. What is recall?',
        '75%',
        '3/4=75%.',
        '60%|This is precision in the five-alert queue.',
        '25%|This is the missed fraction.',
      ),
      c(
        'A detector catches 8 of 20 frauds. How many frauds are missed?',
        '12',
        'FN=20−8=12; recall is 40%.',
        '8|This is caught fraud.',
        '28|Adding double counts.',
      ),
      c(
        'A detector misses 3 frauds, each assumed to cost $500. What is residual loss?',
        '$1,500',
        '3×$500=$1,500 under equal loss severity.',
        '$500|This is per missed event.',
        '$167|Division reverses the aggregation.',
      ),
    ],
    applications: [
      c(
        'Which measure directly assesses fraud capture coverage?',
        'Recall',
        'It counts caught fraud as a share of all actual fraud.',
        'Precision|Precision describes fraud concentration in the selected queue rather than coverage of all fraud.',
        'Specificity|Specificity describes correct legitimate passes, not caught positives.',
      ),
      c(
        'Flagging every payment gives recall=1. What prevents declaring success?',
        'False alerts, review capacity and financial costs still matter.',
        'Every positive is caught, but all legitimate activity is also flagged.',
        'Recall=1 guarantees no customer interruptions.|Flagging everyone also flags every legitimate customer, despite finding every fraud.',
        'Recall=1 guarantees calibration.|A hard-threshold policy finding all fraud does not validate the probabilities it outputs.',
      ),
      c(
        'Fraud labels are available only for investigated alerts. What is the recall problem?',
        'Missed fraud outside the queue is not fully observed.',
        'A selective labeling process can underestimate FN and inflate measured recall.',
        'Precision and recall become identical.|Selective labels do not equate queue purity with positive capture; missing FN remains a separate problem.',
        'Unobserved cases should automatically be counted TN.|Unobserved outcomes are unknown; assigning them TN hides fraud that escaped review.',
      ),
    ],
  },
  {
    number: 6,
    slug: 'specificity-and-false-positive-rate',
    title: 'Specificity and False-Positive Rate',
    definition:
      'Specificity measures legitimate activity correctly passed; false-positive rate measures legitimate activity incorrectly flagged.',
    precise:
      'Specificity=TN/(TN+FP), FPR=FP/(TN+FP), and specificity+FPR=1 on the same actual-negative population.',
    prerequisites: basic,
    terms: [
      [
        'Actual negative',
        'An observation not belonging to the designated positive class.',
        'A legitimate payment.',
      ],
      [
        'Specificity',
        'The correct-pass fraction among actual negatives.',
        '14 legitimate passes out of 16.',
      ],
      [
        'False-positive rate',
        'The false-alert fraction among actual negatives.',
        'Two false alerts out of 16.',
      ],
    ],
    mechanics: [
      'Both denominators are legitimate payments, including those incorrectly flagged. Their numerators partition that same population.',
      'Subtract either rate from one to obtain the other. FPR differs from false-discovery rate, whose denominator is alerts.',
      'Both are unitless fractions in [0,1]. Higher specificity and lower FPR reduce legitimate interruptions, but neither measures fraud capture.',
    ],
    formulas: [
      f(
        'Specificity=\\frac{TN}{TN+FP},\\quad FPR=\\frac{FP}{TN+FP},\\quad ExpectedFP=N_-\\,FPR',
        'Use the same actual-negative denominator for both complementary rates. Multiply FPR by expected legitimate volume to estimate interruption count if the rate transfers.',
        ['TN', 'Legitimate payments correctly passed.'],
        ['FP', 'Legitimate payments falsely flagged.'],
        ['N_-', 'Number of legitimate payments in the target population.'],
        ['FPR', 'False-positive rate, unitless.'],
      ),
    ],
    trace: [
      ['Negative total', '14+2=16', 'Legitimate transactions only.'],
      ['Specificity', '14/16=0.875', '87.5% legitimate passing.'],
      ['FPR', '2/16=0.125', '12.5% false alerting.'],
      ['Volume consequence', '1,000×0.125=125', 'Expected false alerts if the same rate applies.'],
    ],
    interpretation:
      'A modest FPR can create a large customer interruption burden at high payment volume. Convert the rate to expected counts.',
    comparison:
      'Queue precision uses TP+FP; FPR uses TN+FP. A low FPR and low precision can coexist when fraud is rare.',
    boundaries:
      'No actual negatives makes both rates undefined. Extrapolation assumes the target population and policy support a similar rate; more volume does not improve the rate itself.',
    mechanismChecks: [
      c(
        'Which group is used by both specificity and FPR?',
        'Actual negatives',
        'The two numerators partition legitimate activity.',
        'All alerts|Alert denominators describe queue purity or false discovery, not the actual-negative rates.',
        'Actual positives|Actual positives supply recall, whereas these measures condition on legitimate activity.',
      ),
      c(
        'What is the FPR denominator?',
        'TN+FP',
        'Count every legitimate observation, whether passed or flagged.',
        'TP+FP|This would form the false-discovery rate.',
        'TP+FN|This counts fraud.',
      ),
      c(
        'What relationship holds when the denominator is nonzero?',
        'Specificity+FPR=1',
        'TN and FP partition the same legitimate population.',
        'Specificity+recall=1|Specificity and recall use different classes, so they are not complementary fractions.',
        'FPR equals 1−precision|1−precision is false-discovery rate, whose denominator is alerts rather than actual negatives.',
      ),
    ],
    calculations: [
      c(
        'TN=14 and FP=2. What is FPR?',
        '12.5%',
        '2/(14+2)=2/16=12.5%.',
        '40%|This uses all five alerts as denominator.',
        '87.5%|This is specificity.',
      ),
      c(
        'Specificity is 96%. What is FPR?',
        '4%',
        'The complementary fractions sum to 100%, so 100−96=4%.',
        '96%|This repeats specificity.',
        '104%|This is not a probability fraction.',
      ),
      c(
        'FPR is 2% on 10,000 legitimate payments. What is the expected false-alert count?',
        '200',
        '10,000×0.02=200 false alerts if the rate applies.',
        '2|A percent is not a count.',
        '9,800|This is expected correct passes.',
      ),
    ],
    applications: [
      c(
        'Why translate FPR into counts?',
        'To estimate customer interruptions at the actual volume.',
        'A percentage alone does not indicate how many customers enter the queue.',
        'To convert it into recall.|Multiplying FPR by legitimate volume estimates false alerts; it cannot recover caught-fraud counts.',
        'To prove the detector is calibrated.|False-alert frequency is a thresholded class rate, not agreement between probabilities and event frequencies.',
      ),
      c(
        'A detector has low FPR but low fraud recall. What does this mean?',
        'It interrupts few legitimate customers but also misses fraud.',
        'The two rates condition on different actual classes.',
        'Its precision must be 100%.|Precision also depends on fraud prevalence and TP; low FPR does not ensure a perfectly pure queue.',
        'Its expected fraud loss must be zero.|Low recall means fraud is missed, which can generate loss despite few legitimate interruptions.',
      ),
      c(
        'Is false-positive rate the share of alerts that are false?',
        'No; that is false-discovery rate, FP/(TP+FP).',
        'FPR conditions on actual legitimate activity; false-discovery rate conditions on receiving an alert.',
        'Yes; both denominators are alerts.|Only false-discovery rate conditions on alerts; FPR conditions on actual legitimate cases.',
        'Yes; specificity is precision’s complement.|Specificity complements FPR because they share actual negatives, not precision’s alert population.',
      ),
    ],
  },
  {
    number: 7,
    slug: 'f1-and-f-beta',
    title: 'F1 and F-beta',
    definition:
      'F1 combines precision and recall using a harmonic mean. F-beta changes their relative emphasis.',
    precise:
      'F1=2PR/(P+R); F-beta=(1+β²)PR/(β²P+R), where β>1 emphasizes recall and β<1 emphasizes precision.',
    prerequisites: basic,
    terms: [
      [
        'Harmonic mean',
        'A mean formed from reciprocals that is strongly reduced by a small component.',
        'P=0.6 and R=0.75 produce F1≈0.667.',
      ],
      [
        'Beta',
        'A positive parameter controlling recall emphasis relative to precision.',
        'Beta=2 gives recall more weight.',
      ],
      [
        'F-score',
        'A unitless combined precision/recall summary.',
        'The score omits TN and dollar losses.',
      ],
    ],
    mechanics: [
      'Calculate precision and recall on the same evaluated policy before combining them. F1 rewards having both reasonably high.',
      'Beta is squared in the formula. Beta=1 recovers F1; beta=2 weights recall more heavily, but does not mean a two-dollar miss cost.',
      'Scores lie in [0,1] when inputs are defined. F1 can be written 2TP/(2TP+FP+FN), making its exclusion of TN explicit.',
    ],
    formulas: [
      f(
        'F_1=\\frac{2PR}{P+R},\\quad F_\\beta=\\frac{(1+\\beta^2)PR}{\\beta^2P+R}',
        'P and R are precision and recall fractions. Beta controls their weighting; squaring beta is essential. The rates cancel to unitless scores.',
        ['P', 'Precision, TP/(TP+FP).'],
        ['R', 'Recall, TP/(TP+FN).'],
        ['\\beta', 'Positive recall-emphasis parameter.'],
      ),
    ],
    trace: [
      ['Input rates', 'P=3/5=0.6; R=3/4=0.75', 'Different denominators.'],
      ['F1', '2×0.6×0.75/(0.6+0.75)=0.9/1.35≈0.667', 'Harmonic rather than arithmetic mean.'],
      [
        'F2',
        '5×0.6×0.75/(4×0.6+0.75)=2.25/3.15≈0.714',
        'Higher because recall is the stronger input.',
      ],
    ],
    interpretation:
      'F1 and F2 summarize the same fraud decisions differently. A higher F2 than F1 here is a weighting effect, not an improved detector.',
    comparison:
      'The arithmetic mean is (0.6+0.75)/2=0.675, slightly higher than F1. Expected cost is more direct when financial severities are known.',
    boundaries:
      'If P=R=0, the harmonic expression has 0/0; the count form gives zero when FP+FN>0. If every relevant count is zero, state the convention. Undefined precision/recall cases require an explicit policy.',
    mechanismChecks: [
      c(
        'Which operation does F1 use?',
        'A harmonic mean of precision and recall',
        'The harmonic mean penalizes a low component more than the arithmetic average.',
        'An arithmetic average of class accuracies|An equal arithmetic mean of recall and specificity defines balanced accuracy, not the precision/recall harmonic mean.',
        'A mean dollar loss|Dollar loss requires explicit costs and is absent from an F-score.',
      ),
      c(
        'What does beta=2 change?',
        'It emphasizes recall more strongly in the summary.',
        'Beta²=4 appears on precision in the denominator, producing greater recall sensitivity.',
        'It doubles the number of frauds caught.|Beta changes a summary of existing counts; it does not modify any prediction or catch another fraud.',
        'It sets missed-fraud loss to $2.|Beta is a dimensionless weighting parameter rather than a dollar miss-cost input.',
      ),
      c(
        'Which quantity is absent from the count-based F1 formula?',
        'True negatives',
        '2TP/(2TP+FP+FN) contains no TN.',
        'False negatives|FN appears in 2TP+FP+FN and penalizes missed positives.',
        'False positives|FP appears in 2TP+FP+FN and penalizes false alerts.',
      ),
    ],
    calculations: [
      c(
        'P=0.6 and R=0.75. What is F1, rounded to three decimals?',
        '0.667',
        '2×0.6×0.75/(0.6+0.75)=0.9/1.35≈0.667.',
        '0.675|This is the arithmetic mean.',
        '0.45|This is PR alone.',
      ),
      c(
        'P=R=0.50. What is F2?',
        '0.50',
        '5×0.5×0.5/(4×0.5+0.5)=1.25/2.5=0.5.',
        '1.00|Equal rates do not double the result.',
        '0.25|This is only PR.',
      ),
      c(
        'TP=4, FP=2, FN=2. What is F1?',
        '2/3',
        '2TP/(2TP+FP+FN)=8/(8+2+2)=8/12=2/3.',
        '1/2|TP divided by eight is not F1.',
        '4/5|This omits one error type.',
      ),
    ],
    applications: [
      c(
        'F2 exceeds F1 for the same model. Which interpretation is valid?',
        'Recall is stronger than precision and receives more weight.',
        'Changing beta changes the summary, not the predictions.',
        'The model caught more fraud after computing F2.|Computing a different F-score does not change which observations the same detector flagged.',
        'Financial profits necessarily increased.|The scoring weight changes, but dollar profit requires costs and actual policy outcomes.',
      ),
      c(
        'When losses and false-alert costs are known, what should accompany F1?',
        'Expected cost and review workload',
        'F1 excludes explicit dollars and capacity.',
        'Only a larger beta|A beta setting adjusts statistical emphasis without encoding exact monetary loss or workload.',
        'No other evidence|F1 omits economic severity and capacity, so additional evidence is essential.',
      ),
      c(
        'Can identical F1 values imply different financial outcomes?',
        'Yes; error counts, severities and capacity can differ.',
        'F1 is a compressed rate summary, not a financial objective.',
        'No; F1 uniquely determines all dollar costs.|The same compressed precision/recall summary can arise from different costs and event amounts.',
        'No; F1 includes every TN and loss amount.|F1’s count formula excludes TN and contains no monetary severity terms.',
      ),
    ],
  },
  {
    number: 8,
    slug: 'roc-curve',
    title: 'ROC Curve',
    definition:
      'The ROC curve traces fraud capture versus legitimate interruption as a score cutoff changes.',
    precise:
      'Each threshold contributes a point (FPR,TPR); TPR=TP/N+ and FPR=FP/N− use separate actual-class populations.',
    prerequisites: basic,
    terms: [
      ['Threshold', 'The score boundary selecting predicted positives.', 'Flag score≥0.75.'],
      [
        'True-positive rate',
        'The fraction of actual positives caught; recall.',
        'One of two frauds gives TPR=0.5.',
      ],
      [
        'ROC point',
        'The false-positive and true-positive rates at one cutoff.',
        '(0.5,0.5) means half of each class is flagged.',
      ],
    ],
    mechanics: [
      'Sort scores and evaluate cutoffs. A score equal to the cutoff is positive under the course’s score≥threshold convention.',
      'For fraud scores 0.9,0.7 and legitimate scores 0.8,0.2, cutoff 0.75 flags one of each class; cutoff 0.65 flags both frauds and one legitimate payment.',
      'Plot FPR horizontally and TPR vertically. Both axes are fractions in [0,1]. Lowering a cutoff cannot remove previously selected observations.',
    ],
    formulas: [
      f(
        'TPR(t)=\\frac{TP(t)}{N_+},\\quad FPR(t)=\\frac{FP(t)}{N_-},\\quad \\hat y_i=\\mathbf1[s_i\\ge t]',
        'The indicator is one when score meets the cutoff. Count positives separately within each actual class; neither denominator is queue size.',
        ['t', 'Decision cutoff, in score units.'],
        ['s_i', 'Observation i’s score.'],
        ['TP(t)', 'Fraud caught at cutoff t.'],
        ['FP(t)', 'Legitimate payments flagged at t.'],
        ['N_+', 'Actual fraud count.'],
        ['N_-', 'Actual legitimate count.'],
        ['\\hat y_i', 'Predicted positive indicator.'],
      ),
    ],
    trace: [
      ['Threshold 0.75', 'TP=1, FP=1; TPR=1/2; FPR=1/2', 'ROC point (0.5,0.5).'],
      ['Threshold 0.65', 'TP=2, FP=1; TPR=2/2; FPR=1/2', 'ROC point (0.5,1).'],
      ['Threshold 0.95', 'TP=FP=0', 'Point (0,0); nothing reviewed.'],
    ],
    interpretation:
      'The curve shows the feasible error tradeoffs across cutoffs. Financial costs and analyst capacity select a useful operating point.',
    comparison:
      'The diagonal represents equal class capture, consistent with random ranking on average. The curve does not display precision or prove a score is a calibrated probability.',
    boundaries:
      'An absent class makes its ROC rate undefined. Ties enter together under a shared cutoff; state tie conventions. Selecting a cutoff using the final test set leaks evaluation into policy development.',
    mechanismChecks: [
      c(
        'What changes between points on one ROC curve?',
        'The score cutoff',
        'The actual labels and scores stay fixed while the cutoff changes predicted classes.',
        'The definition of fraud changes at every point.|Labels and the definition of the positive class stay fixed while cutoffs move.',
        'The loss severity is the ROC axis.|ROC axes are class-conditioned rates; neither axis represents dollar severity.',
      ),
      c(
        'Which denominator does the vertical axis use?',
        'All actual positives N+',
        'TPR is recall, conditioned on actual fraud.',
        'All alerts|All alerts would supply precision’s denominator, not TPR’s actual-positive denominator.',
        'All observations|All observations would mix classes and cannot give the actual-positive capture fraction.',
      ),
      c(
        'Which axis ordering is conventional?',
        'FPR horizontal, TPR vertical',
        'Both axes are unitless class-conditioned rates.',
        'Precision horizontal, recall vertical|Precision/recall axes define a PR curve, a different plot from ROC.',
        'Dollar cost horizontal, profit vertical|Dollar-cost/profit axes could describe an economic frontier but are not ROC axes.',
      ),
    ],
    calculations: [
      c(
        'There are 2 frauds and 2 legitimate payments. TP=1, FP=1. What is the ROC point?',
        '(0.5,0.5)',
        'FPR=1/2 and TPR=1/2; horizontal coordinate comes first.',
        '(0.25,0.25)|This divides by all four observations.',
        '(1,1)|One is a count, not the rate.',
      ),
      c(
        'At a lower cutoff TP=2, FP=1, with two observations in each class. What is the point?',
        '(0.5,1)',
        'FPR=1/2; TPR=2/2.',
        '(1,0.5)|The axes are reversed.',
        '(2,1)|These are counts.',
      ),
      c(
        'Scores are 0.9,0.8,0.7,0.2. With score≥0.8, how many are flagged?',
        '2',
        'Both 0.9 and the score equal to 0.8 meet the inclusive rule.',
        '1|This incorrectly uses a strict cutoff.',
        '3|0.7 is below the cutoff.',
      ),
    ],
    applications: [
      c(
        'Can the ROC curve alone choose a financial cutoff?',
        'No; costs, prevalence and capacity are also needed.',
        'The curve gives rate tradeoffs, not a complete financial objective.',
        'Yes; always select TPR=1.|Catching every positive may require flagging too much legitimate activity for available capacity.',
        'Yes; FPR alone determines profitability.|FPR omits fraud capture, prevalence, severity and review costs needed to calculate profit.',
      ),
      c(
        'A lower cutoff catches more fraud and flags more legitimate payments. What comparison is needed?',
        'Incremental avoided loss versus review and interruption costs',
        'The additional capture has both benefits and burdens.',
        'Compare only total alert volume.|Alert volume alone ignores the additional fraud caught and the severity of both error types.',
        'Assume the lower cutoff improves calibration.|A cutoff changes actions, not the underlying probability estimates whose calibration must be checked separately.',
      ),
      c(
        'A high ROC point has TPR=0.9, FPR=0.1. Does this mean 90% precision?',
        'No; precision also depends on class prevalence.',
        'TPR conditions on fraud, while precision conditions on alerts.',
        'Yes; TPR and precision are identical.|TPR uses all actual fraud; precision uses alerts, so different prevalence gives different precision.',
        'Yes; 1−FPR is precision.|1−FPR is specificity, which measures correct legitimate passing rather than queue purity.',
      ),
    ],
  },
  {
    number: 9,
    slug: 'roc-auc-and-gini',
    title: 'ROC-AUC and Gini',
    definition:
      'ROC-AUC measures ranking separation across positive-negative pairs. Its Gini transformation rescales that ranking score.',
    precise: 'AUC=(positive-score wins+half of ties)/(N+N−), and AUC-derived Gini=2AUC−1.',
    prerequisites: basic,
    terms: [
      [
        'Pairwise win',
        'A positive has a higher score than a negative.',
        'Fraud 0.9 outranks legitimate 0.8.',
      ],
      [
        'Tie credit',
        'Half a win awarded to equal positive/negative scores.',
        'Equal scores contribute 0.5.',
      ],
      [
        'AUC-derived Gini',
        'A linear rescaling of AUC; distinct from tree impurity.',
        'AUC 0.75 gives Gini 0.5.',
      ],
    ],
    mechanics: [
      'Form every positive-negative pair. The product N+×N− is the pair count, not the total observations.',
      'Fraud scores 0.9,0.7 against legitimate 0.8,0.2 give wins (0.9>0.8),(0.9>0.2),(0.7>0.2): three of four pairs.',
      'AUC lies in [0,1]; random ranking has expected 0.5. Gini lies in [−1,1] with random expectation zero. Reversed ranking can score below random. Larger AUC and its derived Gini indicate stronger positive-first ordering, with the same labels and population.',
    ],
    formulas: [
      f(
        'AUC=\\frac{W+0.5T}{N_+N_-},\\quad Gini=2AUC-1',
        'W counts strict wins and T tied pairs. Half-credit ties avoid treating equal scores as successful ordering. Both summaries are unitless.',
        ['W', 'Strict positive-negative pair wins.'],
        ['T', 'Tied positive-negative pairs.'],
        ['N_+', 'Positive count.'],
        ['N_-', 'Negative count.'],
        ['AUC', 'Pairwise ranking fraction.'],
      ),
    ],
    trace: [
      ['Enumerate pairs', '2×2=4', 'Two frauds times two legitimate payments.'],
      ['Count wins', '3 wins; 0 ties', 'One fraud is below the 0.8 legitimate score.'],
      ['AUC', '3/4=0.75', '75% of pairs correctly ordered.'],
      ['Gini', '2×0.75−1=0.50', 'A rescaled rank separation.'],
    ],
    interpretation:
      'The ranking prioritizes fraud reasonably in this tiny sample. AUC does not specify an affordable operating queue or reliable absolute probabilities.',
    comparison:
      'AUC-derived Gini is different from decision-tree Gini impurity. Inspect precision/recall at the actual review budget and calibration for financial probability use.',
    boundaries:
      'If either class is absent, the pair denominator is zero. Uncertainty can be large with few positive events. AUC comparisons require comparable populations and label definitions.',
    mechanismChecks: [
      c(
        'What does ROC-AUC measure pairwise?',
        'How often a positive outranks a negative, with half credit for ties',
        'This is ranking separation over all cross-class pairs.',
        'The fraction of alerts that are fraud.|Fraud among alerts is precision at one cutoff, not global pairwise score ordering.',
        'The share of loan dollars lost.|AUC gives every positive-negative pair a rank comparison without dollar amounts.',
      ),
      c(
        'What is the pairwise AUC denominator?',
        'N+ times N−',
        'Each positive is compared against each negative.',
        'N+ plus N−|Adding class counts gives observations, whereas each positive is paired with every negative.',
        'TP+FP|TP+FP is an alert count at a chosen cutoff; pairwise AUC has no chosen alert cutoff.',
      ),
      c(
        'How much credit does an equal-score pair receive?',
        'One-half of a win',
        'A tie supplies no directional advantage; half-credit gives random separation.',
        'A full win|A full win treats an equal score as correct directional separation when it supplies no direction.',
        'Zero credit under the course convention|Zero credit would penalize ties as defeats; the declared course convention gives half credit.',
      ),
    ],
    calculations: [
      c(
        'There are 3 wins, no ties and 4 cross-class pairs. What is AUC?',
        '0.75',
        '3/4=0.75.',
        '0.50|This is the random reference.',
        '1.00|One pair was incorrectly ordered.',
      ),
      c(
        'AUC=0.80. What is its AUC-derived Gini?',
        '0.60',
        '2×0.80−1=0.60.',
        '0.80|Gini is a rescaling.',
        '1.60|The final subtraction is missing.',
      ),
      c(
        'Among 8 pairs there are 4 wins and 2 ties. What is AUC?',
        '0.625',
        '(4+0.5×2)/8=5/8=0.625.',
        '0.75|This awards ties full credit.',
        '0.50|This ignores tie credit.',
      ),
    ],
    applications: [
      c(
        'AUC improves. What is not established?',
        'Whether the deployed cutoff is cheaper or probabilities are calibrated.',
        'AUC measures ordering, which leaves absolute risk and policy costs open.',
        'Whether the pairwise ordering improved.|With the same evaluation population, larger AUC directly indicates improved average pair ordering.',
        'Whether the Gini transformation increased.|Gini=2AUC−1 is monotone, so larger AUC necessarily raises this Gini transformation.',
      ),
      c(
        'Two models have equal AUC but different top-20 alert precision. What should a capacity-limited team inspect?',
        'The ranking quality inside its actual review budget',
        'Global pair ranking can hide differences at the operating region.',
        'AUC alone because top-20 performance is irrelevant.|The relevant budget is twenty reviews; equal global AUC can hide different quality in that region.',
        'Tree impurity instead of review outcomes.|Tree Gini impurity measures node mixtures and cannot substitute for deployed top-queue outcomes.',
      ),
      c(
        'AUC=0.40 on the stated labels. What does this suggest?',
        'Ranking is worse than random in its present direction.',
        'Random expectation is 0.5; reversing score direction would give 0.6 with the same tie convention.',
        'Every probability is 40% calibrated.|AUC is a rank statistic and does not measure calibration of any individual probability.',
        'The detector catches 40% of fraud.|Fraud capture is recall at a cutoff; AUC0.40 is not that threshold-specific fraction.',
      ),
    ],
  },
  {
    number: 10,
    slug: 'ks-statistic',
    title: 'KS Statistic',
    definition:
      'KS is the largest separation between positive and negative score distributions across cutoffs.',
    precise: 'In the course’s capture-rate convention, KS=max_t |TPR(t)−FPR(t)|.',
    prerequisites: basic,
    terms: [
      [
        'Capture rate',
        'The fraction of a specified actual class above a cutoff.',
        '60% of defaults and 15% of non-defaults.',
      ],
      [
        'Cutoff gap',
        'The absolute difference between the two class capture rates.',
        '|0.60−0.15|=0.45.',
      ],
      [
        'Maximum',
        'The largest value over all evaluated candidates.',
        'Choose 0.45 rather than the first cutoff’s 0.225.',
      ],
    ],
    mechanics: [
      'At each candidate cutoff, divide caught defaults by all defaults and flagged non-defaults by all non-defaults.',
      'Take the absolute gap at each cutoff, then its largest value. A single arbitrary cutoff’s gap is not automatically KS.',
      'KS is unitless in [0,1], often reported as percentage points. Larger KS indicates stronger maximum class separation. Absolute separation ignores the sign of score orientation, which should be checked separately.',
    ],
    formulas: [
      f(
        'KS=\\max_t\\left|\\frac{TP(t)}{N_+}-\\frac{FP(t)}{N_-}\\right|',
        'Use actual-class denominators at each cutoff and select the largest absolute difference. 0.45 means 45 percentage points, not 45% of the alert queue.',
        ['t', 'Evaluated score cutoff.'],
        ['TP(t)', 'Positives above cutoff.'],
        ['FP(t)', 'Negatives above cutoff.'],
        ['N_+', 'All positives.'],
        ['N_-', 'All negatives.'],
      ),
    ],
    trace: [
      ['Cutoff 1', '5/20−2/80=0.25−0.025=0.225', '22.5-point gap.'],
      ['Cutoff 2', '12/20−12/80=0.60−0.15=0.45', '45-point gap.'],
      ['Cutoff 3', '18/20−40/80=0.90−0.50=0.40', '40-point gap.'],
      ['Select', 'max(0.225,0.45,0.40)=0.45', 'Cutoff 2 maximizes sampled separation.'],
    ],
    interpretation:
      'KS locates strong statistical separation in this credit sample, but the maximizing cutoff can exceed affordable review volume.',
    comparison:
      'AUC summarizes global ranking, whereas KS reports its largest class-rate gap. Neither directly minimizes financial expected cost.',
    boundaries:
      'An absent class makes capture rates undefined. The maximum only covers evaluated cutoffs; coarse candidates can underestimate the true empirical maximum. Select policy settings on validation data.',
    mechanismChecks: [
      c(
        'Which aggregation gives KS?',
        'The maximum absolute class-capture gap',
        'Each cutoff provides a gap; the statistic takes the largest.',
        'The mean precision across alerts|KS takes a maximum class-rate separation, not an average queue precision.',
        'The minimum dollar loss|Finding the lowest dollar cost is an economic optimization needing extra severity inputs.',
      ),
      c(
        'Why must both class totals be known?',
        'They form separate denominators for capture rates.',
        'Raw counts are not comparable when default and non-default group sizes differ.',
        'They determine every loan’s loss severity.|Class totals contain event counts, not the dollar amounts lost on individual loans.',
        'They are added as the KS numerator.|Each total normalizes its own class count; adding them does not form the gap numerator.',
      ),
      c(
        'KS=0.45 should be read as what?',
        'A 45-percentage-point separation',
        'KS subtracts two fractions; it is a difference, not a relative percentage increase.',
        '45% precision|Precision is a caught-positive fraction within alerts, not the difference of two class capture rates.',
        '45 dollars of avoided loss|KS has no monetary severity term, so it cannot be expressed as dollars saved.',
      ),
    ],
    calculations: [
      c(
        'TPR=0.60 and FPR=0.15. What is their KS candidate gap?',
        '0.45',
        '|0.60−0.15|=0.45.',
        '0.75|Adding rates is not separation.',
        '0.09|Multiplication is not separation.',
      ),
      c(
        'Candidate absolute gaps are 0.20,0.50,0.30. What is KS?',
        '0.50',
        'KS takes the maximum gap.',
        '0.333|This averages the gaps.',
        '0.20|This takes the minimum.',
      ),
      c(
        'At a cutoff, 9 of 10 defaults and 4 of 20 non-defaults are selected. What is the gap?',
        '0.70',
        '9/10−4/20=0.9−0.2=0.7.',
        '0.50|This subtracts counts then divides by ten.',
        '0.13|This uses the wrong combined denominator.',
      ),
    ],
    applications: [
      c(
        'Should a lender deploy the cutoff maximizing KS automatically?',
        'No; evaluate dollar costs, capacity and policy constraints.',
        'Statistical class separation is not a complete operating objective.',
        'Yes; maximum KS guarantees maximum profit.|Maximizing class separation does not account for review costs, losses or constraints.',
        'Yes; maximum KS guarantees fairness.|Statistical class separation does not compare group fairness criteria.',
      ),
      c(
        'Can two models have similar KS and different calibration?',
        'Yes; KS depends on ordering and class separation, not absolute probability accuracy.',
        'A monotonic score transformation can preserve cutoffs’ ordering while changing probability meaning.',
        'No; KS directly verifies all predicted probabilities.|KS uses score order and class capture; probabilities can be distorted while separation remains similar.',
        'No; calibration is the same as class separation.|Calibration measures frequency agreement with absolute probability, not separation of class distributions.',
      ),
      c(
        'A coarse cutoff grid is used. What qualification is needed?',
        'KS is the largest gap over the evaluated grid.',
        'Unexamined cutoffs may yield a larger empirical gap.',
        'Every cutoff has the same gap.|Different cutoffs select different class fractions and can have different gaps.',
        'The first grid point defines KS by convention.|The statistic selects the largest evaluated gap, not the first listed one.',
      ),
    ],
  },
  {
    number: 11,
    slug: 'precision-recall-curve-and-pr-auc',
    title: 'Precision-Recall Curve and PR-AUC',
    definition:
      'A precision–recall curve tracks queue purity versus positive capture as review depth changes. PR area summarizes this tradeoff under a stated convention.',
    precise:
      'P@K=C_K/K and R@K=C_K/F. Average precision sums ΔR×end precision; trapezoidal PR area sums ΔR×the average endpoint precision.',
    prerequisites: basic,
    terms: [
      [
        'Review depth K',
        'The number of highest-ranked observations selected.',
        'Review the first three transactions.',
      ],
      [
        'Recall increment',
        'Additional caught positives divided by all positives.',
        'Finding one new fraud out of two raises recall by 0.5.',
      ],
      [
        'Average precision',
        'A recall-increment weighted sum of precision at positive discoveries.',
        'For labels 1,0,1,0: AP=(1+2/3)/2.',
      ],
      [
        'Trapezoidal area',
        'Area obtained by linearly connecting stated PR endpoints.',
        'Average the start and end precision on each recall interval.',
      ],
    ],
    mechanics: [
      'Scan descending scores. Each prefix has a cumulative caught count C_K, queue size K and a fixed total positive count F.',
      'Recall changes only when a new positive is added. For labels [1,0,1,0], precision at the two discoveries is 1 and 2/3, with recall increments 1/2.',
      'AP and trapezoidal PR area need not agree. State the area/interpolation convention; the course distinguishes both and uses AP in its classification code.',
    ],
    formulas: [
      f(
        'AP=\\sum_j\\Delta R_jP_j,\\quad Area_{trap}=\\sum_j\\Delta R_j\\frac{P_{start,j}+P_{end,j}}2',
        'Each recall increment supplies an interval width. AP uses end precision; trapezoidal area averages the interval’s endpoints. Both are unitless in [0,1] for valid PR inputs.',
        ['\\Delta R_j', 'Recall gained on interval j.'],
        ['P_j', 'Precision at the positive discovery ending interval j.'],
        ['P_{start,j}', 'Stated starting precision.'],
        ['P_{end,j}', 'Stated ending precision.'],
      ),
    ],
    trace: [
      ['Rank 1', 'C=1; P=1/1=1; R=1/2=0.5', 'First fraud found.'],
      ['Rank 2', 'C=1; P=1/2=0.5; R=0.5', 'False alert reduces precision.'],
      ['Rank 3', 'C=2; P=2/3; R=1', 'Second fraud found.'],
      ['AP', '0.5×1+0.5×(2/3)=5/6≈0.8333', 'Precision weighted at discoveries.'],
      ['Trapezoid', '0.5×1+0.5×(0.5+2/3)/2=19/24≈0.7917', 'For these explicitly stated endpoints.'],
    ],
    interpretation:
      'The top-ranked queue captures fraud much better than a random ranking on this small population. AP is a ranking summary, not a probability for one transaction.',
    comparison:
      'The random precision reference is prevalence F/N, which is 2/4=0.5 here. AP comparisons across different prevalence can be misleading; ROC and PR emphasize different aspects.',
    boundaries:
      'F=0 makes recall and AP undefined as written; K=0 gives undefined precision unless a plotting convention supplies an initial point. Ties and interpolation choices must be documented.',
    mechanismChecks: [
      c(
        'What changes along a PR curve?',
        'Precision and recall as queue depth or threshold changes',
        'Each prefix recomputes queue purity and cumulative positive capture.',
        'Only the true-negative rate|True-negative rate belongs to ROC-related class rates; PR tracks precision and recall.',
        'Only individual calibrated probabilities|Moving through ranked prefixes changes selected counts, not the values of the original probabilities.',
      ),
      c(
        'Which precision does AP use for each recall increment?',
        'The precision at the positive discovery ending that increment',
        'AP weights precision by newly captured recall rather than linearly averaging endpoints.',
        'The average of endpoint precisions|That is the stated trapezoidal convention.',
        'The precision of the entire dataset for every increment|Full-population precision discards how queue purity changes at each positive discovery.',
      ),
      c(
        'Is AP always equal to trapezoidal PR area?',
        'No; the area conventions differ.',
        'AP uses endpoint precision; trapezoids average endpoints and can yield a different value.',
        'Yes; they have identical formulas.|AP weights end precision; trapezoids average interval endpoints, so their formulas differ.',
        'Yes; prevalence forces equality.|Prevalence supplies a baseline but does not force different area rules to agree.',
      ),
    ],
    calculations: [
      c(
        'Labels in descending score order are 1,0,1,0. What is AP?',
        '5/6≈0.8333',
        'Two recall jumps of 0.5 use precisions 1 and 2/3: 0.5+1/3=5/6.',
        '0.50|This is prevalence.',
        '0.75|This is not the recall-weighted sum.',
      ),
      c(
        'A recall increment 0.20 ends at precision 0.60. What is its AP contribution?',
        '0.12',
        '0.20×0.60=0.12.',
        '0.80|This adds rather than weights.',
        '0.30|This divides precision by two.',
      ),
      c(
        'An interval has ΔR=0.20, start precision=0.80, end precision=0.60. What is trapezoid area?',
        '0.14',
        '0.20×(0.80+0.60)/2=0.20×0.70=0.14.',
        '0.12|This is the AP endpoint contribution.',
        '0.28|The endpoint average division is missing.',
      ),
    ],
    applications: [
      c(
        'Why examine PR for rare fraud?',
        'It exposes the tradeoff between fraud capture and queue contamination.',
        'Precision focuses directly on what enters review, unlike ROC’s actual-negative denominator.',
        'It removes all dependence on prevalence.|Precision and its random-ranking reference depend on positive prevalence.',
        'It proves predictions are calibrated.|Ranking tradeoffs do not test whether absolute probabilities match observed event frequencies.',
      ),
      c(
        'AP rose after the test set became more fraud-heavy. What should be checked?',
        'Whether prevalence changed rather than ranking quality alone.',
        'AP’s baseline and precision depend on the positive proportion.',
        'Assume only ranking quality improved.|More positive cases can improve measured precision/AP even when ranking skill does not change.',
        'Whether AP is now a default probability.|AP summarizes the ranked population; it is not a per-transaction risk probability.',
      ),
      c(
        'A report says PR-AUC without its area convention. What is missing?',
        'Whether it used AP, trapezoidal area, or another interpolation.',
        'The same PR points can produce distinct summaries under different conventions.',
        'Which single cutoff maximizes accuracy.|A single operating cutoff does not identify how area between PR points was calculated.',
        'A compulsory 0.5 decision threshold.|PR area sweeps cutoffs and its convention is not determined by imposing 0.5.',
      ),
    ],
  },
  {
    number: 12,
    slug: 'precision-k-and-recall-k',
    title: 'Precision@K and Recall@K',
    definition:
      'These measures evaluate a ranked queue at a fixed review budget: purity among K reviews and capture among all positives.',
    precise:
      'Precision@K=TP_K/K; Recall@K=TP_K/F, with F the total number of actual positives in the evaluation population.',
    prerequisites: basic,
    terms: [
      [
        'K',
        'A positive integer specifying the review budget.',
        'Investigators can review five payments.',
      ],
      [
        'TP_K',
        'Actual positives within the top K ranked observations.',
        'Three frauds among the first five.',
      ],
      [
        'Recall@K',
        'The caught-positive share at that review budget.',
        'Three of eight frauds means 37.5%.',
      ],
    ],
    mechanics: [
      'Rank observations using information available at decision time. Select exactly the first K under a stated tie rule.',
      'Count caught positives once. Divide by K for queue purity, or by all positives F for coverage.',
      'Both measures are unitless in [0,1]. Increasing K cannot decrease caught count or recall, but precision may rise or fall depending on the added cases.',
    ],
    formulas: [
      f(
        'P@K=\\frac{TP_K}{K},\\quad R@K=\\frac{TP_K}{F},\\quad IncrementalCost=\\frac{c(K_2-K_1)}{TP_{K_2}-TP_{K_1}}',
        'The two ratios reuse the numerator but answer different questions. The incremental ratio prices extra reviews per extra positive found when capture increases.',
        ['TP_K', 'Caught positives in the top K.'],
        ['K', 'Number reviewed.'],
        ['F', 'All actual positives.'],
        ['c', 'Dollars per review.'],
        ['K_1', 'Original queue size.'],
        ['K_2', 'Expanded queue size.'],
      ),
    ],
    trace: [
      ['Budget 5', '3/5=60%; 3/8=37.5%', 'Precision and recall at five reviews.'],
      ['Budget 10', '5/10=50%; 5/8=62.5%', 'Lower purity, higher capture.'],
      [
        'Increment',
        '5 extra reviews; 2 extra frauds; $2×5/2=$5',
        'Extra review cost per extra fraud found.',
      ],
    ],
    interpretation:
      'These measures align ranking evaluation with the actual number of cases investigators can handle.',
    comparison:
      'A single global AUC can conceal weak top-K performance. Compare budgets using extra captures, review costs and loss severity.',
    boundaries:
      'K=0 or F=0 makes the corresponding ratio undefined. K must not exceed available items without an explicit truncation convention. If extra reviews capture no new positives, incremental cost per extra capture has a zero denominator.',
    mechanismChecks: [
      c(
        'What distinguishes Precision@K from Recall@K?',
        'Their denominators: K versus all actual positives',
        'Both count TP_K, but condition on different populations.',
        'Their positive-class labels must differ.|Both use the same designated positive label and captured-count numerator.',
        'Both are dollar ratios.|Their count denominators yield fractions; costs require a separate monetary model.',
      ),
      c(
        'Which denominator represents investigator workload?',
        'K',
        'K counts reviewed cases; F counts all positive events.',
        'F|F counts all actual fraud, including cases outside the queue; it is not the review volume.',
        'TN|TN counts legitimate activity passed and does not count reviewed cases.',
      ),
      c(
        'What happens to recall as K increases on one fixed ranking?',
        'It cannot decrease.',
        'Cumulative caught count can only stay constant or rise.',
        'It must decrease.|Expanding a fixed prefix cannot remove already caught positives, so recall cannot decrease.',
        'It always equals precision.|Recall divides by all actual positives; precision divides by K, and these totals can differ.',
      ),
    ],
    calculations: [
      c(
        'The top 5 contain 3 frauds; there are 8 frauds overall. What is Recall@5?',
        '37.5%',
        '3/8=0.375.',
        '60%|This is Precision@5.',
        '62.5%|This is not the captured fraction.',
      ),
      c(
        'The top 10 contain 5 frauds. What is Precision@10?',
        '50%',
        '5/10=0.5.',
        '100%|Half the queue is not fraud.',
        '5%|Five is a count, not a percent.',
      ),
      c(
        'Five additional reviews cost $2 each and find 2 additional frauds. What is incremental cost per extra fraud?',
        '$5',
        '$2×5/2=$5.',
        '$10|This is total extra spend.',
        '$2|This is per review.',
      ),
    ],
    applications: [
      c(
        'Analysts can review only 20 cases. Which evidence is most directly relevant?',
        'Precision@20, Recall@20 and cost at that budget',
        'The evaluated ranking region matches operational capacity.',
        'AUC alone|Global AUC can miss differences specifically in the top twenty reviewed cases.',
        'Accuracy of passing every case|An always-pass baseline has no review queue and cannot assess its fraud concentration.',
      ),
      c(
        'Expanding K lowers precision and raises recall. Is that contradictory?',
        'No; a bigger queue can find more fraud at lower concentration.',
        'The numerator rises while the precision denominator also expands.',
        'Yes; recall and precision must move together.|The denominator for precision expands with K, while recall’s positive total stays fixed.',
        'Yes; expanding K changes actual labels.|The ranking’s actual labels remain fixed; only the selected prefix changes.',
      ),
      c(
        'Extra reviews find no additional fraud. What happens to extra cost per extra fraud?',
        'It is undefined because additional captures are zero.',
        'There is no observed extra captured event over which to spread the spend.',
        'It is zero dollars.|Zero new captures leaves the per-extra-capture denominator zero, even though new reviews cost money.',
        'It equals the old precision.|Old precision is a queue fraction, not dollars spent per new captured event.',
      ),
    ],
  },
  {
    number: 13,
    slug: 'lift-and-cumulative-gain',
    title: 'Lift and Cumulative Gain',
    definition:
      'Lift compares top-ranked fraud concentration with random review; cumulative gain measures the share of all fraud captured.',
    precise: 'Lift@K=(TP_K/K)/(F/N); Gain@K=TP_K/F, plotted against reviewed share K/N.',
    prerequisites: basic,
    terms: [
      [
        'Prevalence',
        'The positive fraction in the full population.',
        'Four frauds among 20 means 20%.',
      ],
      [
        'Lift',
        'A concentration multiple relative to prevalence.',
        '60% queue precision / 20% prevalence = 3.',
      ],
      [
        'Cumulative gain',
        'The share of all positives captured in a ranked prefix.',
        'Three of four frauds captured means 75%.',
      ],
    ],
    mechanics: [
      'Compute population prevalence first. Then compute top-K precision and divide by prevalence to get lift.',
      'Gain has the same formula as Recall@K. The horizontal gain-curve axis is reviewed fraction K/N.',
      'Lift is unitless and may exceed one; one is random expectation, below one is poorer-than-random concentration. Gain is a fraction in [0,1], and reaches one after all positives are included.',
    ],
    formulas: [
      f(
        '\\pi=F/N,\\quad Lift@K=\\frac{TP_K/K}{\\pi},\\quad Gain@K=TP_K/F',
        'Pi is the base positive rate. Dividing queue precision by that base rate produces a multiple, not a probability. Gain is captured positives divided by all positives.',
        ['\\pi', 'Population prevalence.'],
        ['F', 'Actual positives.'],
        ['N', 'All observations.'],
        ['K', 'Reviewed prefix size.'],
        ['TP_K', 'Positives caught in that prefix.'],
      ),
    ],
    trace: [
      ['Base rate', '4/20=0.20', 'Random review finds 0.2 frauds per case on average.'],
      ['Queue precision', '3/5=0.60', 'The top five are 60% fraud.'],
      ['Lift', '0.60/0.20=3', 'Three times random concentration.'],
      ['Gain', '3/4=0.75 at reviewed share 5/20=0.25', 'Reviewing 25% captures 75% of fraud.'],
    ],
    interpretation:
      'The ranking concentrates fraud effectively in the affordable part of the queue. Randomly reviewing five of these 20 would capture one fraud on average.',
    comparison:
      'Lift depends on prevalence; a lift of three is not 300% probability. Gain reports coverage, while lift reports concentration relative to a baseline.',
    boundaries:
      'F=0 makes prevalence zero and lift/gain undefined. K=0 makes precision/lift undefined. At K=N, lift=1 if positives exist, because the reviewed group is the entire population.',
    mechanismChecks: [
      c(
        'Which baseline does lift use?',
        'Population positive prevalence',
        'Random selection has expected precision equal to prevalence.',
        'The maximum possible score|Lift normalizes by observed positive prevalence, not by the largest score value.',
        'The true-negative count|TN is a correctly passed count rather than random selection’s positive rate.',
      ),
      c(
        'What is cumulative gain’s denominator?',
        'All actual positives F',
        'Gain is cumulative captured-positive fraction.',
        'K|K produces queue precision, not the fraction of all positives captured.',
        'N|N gives captured positives as a fraction of all observations, not positive coverage.',
      ),
      c(
        'What does lift=3 signify?',
        'Three times the population positive concentration',
        'Lift is a ratio of two rates and can exceed one.',
        '300% of transactions are fraud.|Lift is a concentration multiple and may exceed one, but a probability cannot exceed 100%.',
        'Three dollars saved per review.|No dollars enter the lift calculation; review cost and loss severity are separate.',
      ),
    ],
    calculations: [
      c(
        'Prevalence=0.20 and Precision@5=0.60. What is lift?',
        '3',
        '0.60/0.20=3.',
        '0.12|This multiplies the rates.',
        '0.40|This subtracts them.',
      ),
      c(
        'Three of four frauds are captured by reviewing 5 of 20 payments. What is gain?',
        '75%',
        '3/4=75%; reviewed share is separately 5/20=25%.',
        '25%|This is reviewed share.',
        '60%|This is precision.',
      ),
      c(
        'A random queue reviews 10 of 100 payments, with prevalence 0.05. What is expected fraud capture count?',
        '0.5',
        '10×0.05=0.5 in expectation; a realized count is an integer.',
        '5|This is total expected positives in all 100.',
        '50|This treats a fraction as a count.',
      ),
    ],
    applications: [
      c(
        'Why compare a ranked review queue with random selection?',
        'To establish whether ranking concentrates positives above the base rate.',
        'Lift gives a baseline-relative queue concentration.',
        'To establish calibrated probabilities.|Random-relative concentration assesses ranking, not agreement of probabilities with outcomes.',
        'To eliminate the need for labels.|Prevalence and caught positives still require actual or judged positive labels.',
      ),
      c(
        'Two samples have different prevalence. How should their lift be interpreted?',
        'Each lift is relative to its own base rate; compare underlying precision and population mix.',
        'Equal lift can correspond to very different queue purity.',
        'Equal lift guarantees equal precision.|Precision=lift×prevalence, so identical lift at different base rates gives different purity.',
        'Higher lift guarantees lower missed dollar loss.|Lift omits loss severities and misses outside the chosen queue, so it cannot guarantee lower loss.',
      ),
      c(
        'What is lift when the entire positive-containing population is reviewed?',
        '1',
        'Queue precision then equals population prevalence.',
        '0|The full queue has the same positive fraction as the population, making the ratio one rather than zero.',
        'The number of positives|Lift divides rates and remains dimensionless, rather than equaling an event count.',
      ),
    ],
  },
  {
    number: 14,
    slug: 'calibration-curve',
    title: 'Calibration Curve',
    definition:
      'A calibration curve checks whether predicted probabilities match observed event frequencies in comparable groups.',
    precise:
      'Within each probability bin b, compare mean predicted probability p̄_b with observed rate d_b/n_b; expected event count is n_b p̄_b.',
    prerequisites: basic,
    terms: [
      [
        'Probability bin',
        'A group of cases with similar predicted probabilities.',
        'Ten loans predicted near 10%.',
      ],
      [
        'Observed rate',
        'The fraction of labeled cases in a bin that experienced the event.',
        'Two defaults among ten means 20%.',
      ],
      [
        'Calibration gap',
        'Observed rate minus mean predicted probability under the stated sign convention.',
        '20% observed−10% predicted=+10 percentage points.',
      ],
    ],
    mechanics: [
      'Group out-of-sample predictions by declared bin edges. Calculate a mean probability and observed event fraction within each bin.',
      'Plot mean predicted probability horizontally and observed frequency vertically. The diagonal represents agreement at that binning resolution.',
      'Both axes are unitless fractions; smaller absolute bin gaps mean closer agreement at that resolution. Bin size, sample uncertainty and overall population mix matter; coarse bins can hide within-bin problems.',
    ],
    formulas: [
      f(
        'E_b=n_b\\bar p_b,\\quad O_b=d_b/n_b,\\quad Gap_b=O_b-\\bar p_b',
        'Multiply bin count by mean probability to estimate event count. Divide observed events by the bin count to compare like-for-like fractions.',
        ['n_b', 'Labeled loans in bin b.'],
        ['\\bar p_b', 'Mean predicted default probability in bin b.'],
        ['d_b', 'Observed defaults in bin b.'],
        ['E_b', 'Expected default count.'],
        ['O_b', 'Observed default fraction.'],
      ),
    ],
    trace: [
      [
        'Bin A',
        'n=10, p=0.10: expected=1; defaults=2: observed=0.20',
        'Underestimates observed risk in this bin.',
      ],
      [
        'Bin B',
        'n=20, p=0.20: expected=4; defaults=2: observed=0.10',
        'Overestimates observed risk in this bin.',
      ],
      [
        'Totals',
        'Expected=1+4=5; actual=2+2=4',
        'Aggregate agreement can hide opposite bin errors.',
      ],
      [
        'Financial link',
        '$500×5=$2,500 expected; $500×4=$2,000 realized',
        'Uses the same assumed loss per default.',
      ],
    ],
    interpretation:
      'Calibration helps turn probability estimates into expected-loss or reserve inputs. A curve is an empirical check, not a guarantee about the next individual loan.',
    comparison:
      'A well-ranked model can be miscalibrated, and an always-base-rate model can be calibrated on average while ranking poorly. Evaluate calibration alongside discrimination.',
    boundaries:
      'Empty bins have undefined observed rates. Missing follow-up labels invalidate the observed denominator. A 10% estimate does not mean each loan loses exactly 10% of its balance.',
    mechanismChecks: [
      c(
        'What does calibration compare?',
        'Predicted probabilities with observed event frequencies',
        'Agreement is assessed over groups of cases, not certainty about one outcome.',
        'Only the order of model scores|Score order measures discrimination; calibration checks absolute probability against frequencies.',
        'Only review thresholds|A threshold is a decision policy and does not itself validate probability estimates.',
      ),
      c(
        'What is the observed default-rate denominator in a bin?',
        'The labeled loans in that bin n_b',
        'Defaults and non-defaults in the same probability group form the population.',
        'Defaults alone|Using defaults as both numerator and denominator would erase non-defaults and force an uninformative value.',
        'All alerts in other bins|Observations in other bins do not belong to the conditional population being checked.',
      ),
      c(
        'What does the diagonal calibration line represent?',
        'Observed event rate equals mean predicted probability.',
        'The two fractions agree within each group.',
        'Perfect classification of every loan|Frequency agreement over groups permits both defaults and repayments; it is not perfect individual classification.',
        'A compulsory 50% lending threshold|The diagonal is an agreement reference, not a rule for approval or review.',
      ),
    ],
    calculations: [
      c(
        'Ten loans average 10% default probability. What is expected default count?',
        '1',
        '10×0.10=1 expected default.',
        '10|This is the group size.',
        '0.10|This is probability, not count.',
      ),
      c(
        'Two defaults among ten loans predicted at 10%. What is observed-minus-predicted gap?',
        '+10 percentage points',
        '2/10−0.10=0.20−0.10=0.10.',
        '−10 percentage points|This reverses the declared sign.',
        '+100 percentage points|A relative doubling is not the rate difference.',
      ),
      c(
        'Four expected defaults each have assumed $500 loss. What is expected loss?',
        '$2,000',
        '4×$500=$2,000.',
        '$500|This is per default.',
        '$125|This divides instead of aggregating.',
      ),
    ],
    applications: [
      c(
        'Why does a lender care about calibration?',
        'Expected-loss calculations rely on meaningful probabilities.',
        'Ranking alone cannot tell whether a 10% estimate behaves like 10% risk.',
        'Calibration guarantees no individual default.|A calibrated 10% group still contains defaults; calibration is an aggregate frequency property.',
        'Calibration fixes the optimal queue size.|Optimal queue size additionally depends on costs and capacity, not just probability reliability.',
      ),
      c(
        'Total expected defaults match total actual defaults, but bins have opposite gaps. What follows?',
        'Aggregate agreement does not establish local calibration.',
        'Overprediction in one group can cancel underprediction in another.',
        'Every group is perfectly calibrated.|Opposite local errors can cancel in totals while each affected bin remains miscalibrated.',
        'AUC must equal one.|AUC measures ranking and is not determined by total expected-versus-observed event agreement.',
      ),
      c(
        'A probability bin has no labeled loans. What should be reported?',
        'Its observed rate is undefined.',
        'd_b/n_b has a zero denominator; do not plot a fictitious measured rate.',
        'Its observed rate is exactly zero.|No labels mean no observed denominator; zero is an assumed value rather than a measured rate.',
        'Its observed rate equals the prediction automatically.|No data exist to establish agreement with the prediction, so agreement cannot be assumed.',
      ),
    ],
  },
  {
    number: 15,
    slug: 'brier-score',
    title: 'Brier Score',
    definition:
      'The Brier score averages squared errors of predicted probabilities against binary outcomes.',
    precise:
      'Binary Brier score=(1/N)Σ(p_i−y_i)², with probabilities in [0,1] and labels y_i∈{0,1}.',
    prerequisites: basic,
    terms: [
      ['Binary label', 'An outcome encoded as zero or one.', 'Default=1, repayment=0.'],
      [
        'Squared probability error',
        'The square of predicted probability minus observed binary label.',
        '(0.2−0)²=0.04.',
      ],
      [
        'Base-rate forecast',
        'A constant probability equal to the training event frequency.',
        'Predict 0.25 for each loan when the historical rate is 25%.',
      ],
    ],
    mechanics: [
      'Evaluate probabilities rather than thresholded labels. For every case subtract the binary outcome, square the difference, then average all cases.',
      'Binary Brier lies in [0,1]; lower is better and zero is perfectly correct probabilities on the sample. Squaring removes sign but penalizes larger errors more.',
      'The score reflects probability quality including calibration and discrimination. It is not itself dollars, a percentage correctly classified, or an isolated calibration-only test.',
    ],
    formulas: [
      f(
        'BS=\\frac1N\\sum_{i=1}^{N}(p_i-y_i)^2',
        'Every labeled observation contributes one squared probability error. Dividing by N gives a unitless average; compare with a base-rate model on the same cases.',
        ['BS', 'Binary Brier score.'],
        ['N', 'Number of labeled evaluated cases.'],
        ['p_i', 'Predicted positive probability for case i.'],
        ['y_i', 'Observed 0/1 positive label.'],
      ),
    ],
    trace: [
      ['Repayment case', 'p=0.2,y=0: (0.2−0)²=0.04', 'Small probability error.'],
      ['Default case', 'p=0.8,y=1: (0.8−1)²=0.04', 'Same squared error.'],
      ['Average', '(0.04+0.04)/2=0.04', 'Mean probability error across both loans.'],
      [
        'Constant baseline',
        'p=0.5 gives (0.25+0.25)/2=0.25',
        'The model beats this baseline here.',
      ],
    ],
    interpretation:
      'A lower Brier score indicates better probability predictions on the same evaluation cases. Financial loss estimates still require exposure and severity assumptions.',
    comparison:
      'Unlike accuracy, Brier can distinguish probability confidence even when both models predict the same class. Unlike log loss, its binary per-case penalty is bounded by one.',
    boundaries:
      'N=0 is undefined. Probabilities outside [0,1] violate the interpretation. Multiclass Brier definitions can sum across classes and have a different scale, so do not mix conventions.',
    mechanismChecks: [
      c(
        'What inputs does binary Brier score use?',
        'Probabilities and 0/1 observed labels',
        'Thresholded classes discard confidence information needed for probability scoring.',
        'Only hard class predictions|Hard labels discard probability confidence; Brier uses the original probabilities.',
        'Dollar loss amounts only|Dollar amounts do not replace binary event labels or probability forecasts.',
      ),
      c(
        'Which aggregation is used?',
        'Mean squared probability error over evaluated cases',
        'Square every error, sum, and divide by N.',
        'Square the mean signed error|Signed errors can cancel before squaring, which gives a different and potentially misleading quantity.',
        'Sum errors without dividing|The score is a mean, so a sum without dividing grows with sample count.',
      ),
      c(
        'Which direction and range apply to binary Brier?',
        'Lower is better; range 0 to 1',
        'Valid binary probabilities produce errors no larger than one.',
        'Higher is better; range −1 to 1|Binary squared probability errors are nonnegative and larger errors are worse.',
        'Lower is better; units are dollars|Probability-minus-label differences are dimensionless, not financial dollar quantities.',
      ),
    ],
    calculations: [
      c(
        'p=0.2, y=0. What is the squared Brier contribution?',
        '0.04',
        '(0.2−0)²=0.04.',
        '0.20|This is unsquared error.',
        '0.80|This is the complement probability.',
      ),
      c(
        'Contributions are 0.04 and 0.04. What is Brier score?',
        '0.04',
        '(0.04+0.04)/2=0.04.',
        '0.08|This is the sum, not mean.',
        '0.20|This takes a square root not in Brier.',
      ),
      c(
        'A loan defaults but was assigned p=0.1. What is its Brier contribution?',
        '0.81',
        '(0.1−1)²=(−0.9)²=0.81.',
        '0.01|This would apply to y=0.',
        '−0.9|Squaring removes the sign.',
      ),
    ],
    applications: [
      c(
        'Two models have identical hard predictions but different probabilities. Can Brier distinguish them?',
        'Yes; it scores probability errors before thresholding.',
        'Confidence changes squared error even when class labels stay the same.',
        'No; Brier only uses accuracy.|Accuracy uses hard-label agreement; Brier separately uses probability confidence.',
        'No; Brier ignores confidence.|Changing the assigned probability changes squared error even when the thresholded label stays fixed.',
      ),
      c(
        'What baseline makes a Brier comparison informative?',
        'A fixed base-rate forecast evaluated on the same observations',
        'The comparison holds cases and labels constant and tests added predictive value.',
        'An unrelated population with higher default frequency|A different positive mix changes the scoring problem and makes baseline comparison confounded.',
        'An always-100% risk forecast without explanation|A useful base-rate comparator must be justified; assigning universal certainty is not a neutral baseline.',
      ),
      c(
        'Does a Brier score of 0.04 mean 4% defaults?',
        'No; it is average squared probability error.',
        'Default frequency and probability-error score are different quantities.',
        'Yes; Brier is prevalence.|Prevalence counts positive outcomes; Brier averages squared probability errors instead.',
        'Yes; exactly 4% of decisions are incorrect.|Brier is not a hard-label error count, so0.04 cannot be read as4% incorrect decisions.',
      ),
    ],
  },
  {
    number: 16,
    slug: 'log-loss',
    title: 'Log Loss',
    definition:
      'Log loss scores how much probability a model assigned to the outcome that actually occurred.',
    precise: 'Binary log loss=−(1/N)Σ[y_i ln p_i+(1−y_i)ln(1−p_i)], using natural logarithms.',
    prerequisites: ['notation', 'probability', 'logarithms', 'data-splits'],
    terms: [
      [
        'Observed-outcome probability',
        'The probability assigned to the label that occurred.',
        'Use p for default, 1−p for repayment.',
      ],
      ['Natural logarithm', 'The logarithm with base e.', '−ln(0.5)≈0.693.'],
      [
        'Confident mistake',
        'Assigning near-zero probability to the outcome that occurs.',
        'Predicting 0.99 default when the loan repays.',
      ],
    ],
    mechanics: [
      'For y=1 the loss is −ln p; for y=0 it is −ln(1−p). Only the term matching the actual label contributes.',
      'Average per-case losses over N. Log loss is unitless, nonnegative and unbounded above; lower is better.',
      'A confident wrong probability creates a much larger penalty than a mild error. Software may clip probabilities to avoid infinities; report epsilon rather than silently changing the mathematical boundary.',
    ],
    formulas: [
      f(
        'LL=-\\frac1N\\sum_i[y_i\\ln p_i+(1-y_i)\\ln(1-p_i)]',
        'The binary label selects the log probability of the observed outcome. A leading minus makes losses positive since log probabilities are nonpositive.',
        ['LL', 'Mean negative natural log likelihood.'],
        ['N', 'Evaluated labeled case count.'],
        ['p_i', 'Predicted positive probability.'],
        ['y_i', 'Observed 0/1 label.'],
        ['\\ln', 'Natural logarithm; dimensionless input.'],
      ),
    ],
    trace: [
      ['Default', 'p=0.8,y=1: −ln(0.8)=0.2231', 'High probability assigned to the event.'],
      ['Repayment', 'p=0.1,y=0: −ln(0.9)=0.1054', 'High probability assigned to repayment.'],
      [
        'Confident error',
        'p=0.99,y=0: −ln(0.01)=4.6052',
        'Large penalty despite only one incorrect hard label.',
      ],
      ['Average', '(0.2231+0.1054+4.6052)/3≈1.6446', 'All three observations have equal weight.'],
    ],
    interpretation:
      'Log loss discourages overconfident risk predictions. A rare confident mistake can substantially change a credit model’s score.',
    comparison:
      'Predicting 0.6 rather than 0.99 for the repaying third loan leaves its hard class wrong at threshold 0.5 but reduces the penalty to −ln(0.4)≈0.9163.',
    boundaries:
      'N=0 is undefined. Assigning probability zero to the realized outcome yields infinite loss. Log base and clipping policy affect numerical values, and should be held fixed in comparisons.',
    mechanismChecks: [
      c(
        'Which probability is logged when a loan repays (y=0)?',
        '1−p',
        'The realized outcome is negative, so the probability assigned to repayment is 1−p.',
        'p|p is probability of default, not the realized repayment outcome when y=0.',
        'The threshold itself|A threshold determines action but is not probability assigned to the observed outcome.',
      ),
      c(
        'Why is there a leading minus sign?',
        'Log probabilities are nonpositive, so negative logs produce nonnegative losses.',
        'For 0<p<1, ln p<0; −ln p measures the penalty.',
        'To reward confident wrong predictions|The sign makes poor observed-outcome probability a larger positive penalty, not a reward.',
        'To convert probability into dollars|Taking a logarithm of a probability introduces no monetary exposure or severity units.',
      ),
      c(
        'What is the range and preferred direction?',
        'Nonnegative and unbounded above; lower is better',
        'Near-zero probability for a realized outcome gives arbitrarily large loss.',
        'Between 0 and 1; higher is better|Unlike bounded Brier loss, log loss can grow above one when realized outcomes received tiny probabilities.',
        'Between −1 and 1; zero is random|Log loss cannot be negative under valid probabilities, and its optimum zero is not a random reference.',
      ),
    ],
    calculations: [
      c(
        'A default receives p=0.5. What is its log loss with natural logs?',
        'About 0.693',
        '−ln(0.5)≈0.6931.',
        '0.25|This is a Brier contribution.',
        '−0.693|The leading minus is missing.',
      ),
      c(
        'A repayment receives p=0.99. What is its loss?',
        'About 4.605',
        'Use repayment probability 1−0.99=0.01; −ln(0.01)=4.6052.',
        'About 0.010|This logs the wrong outcome probability.',
        '0.99|This is not a logarithmic penalty.',
      ),
      c(
        'Two observations have losses 0.2 and 0.8. What is mean log loss?',
        '0.5',
        '(0.2+0.8)/2=0.5.',
        '1.0|This is the sum.',
        '0.16|Multiplication is not averaging.',
      ),
    ],
    applications: [
      c(
        'Why can log loss reveal a problem hidden by accuracy?',
        'It distinguishes cautious errors from confident wrong predictions.',
        'Identical hard labels can have very different realized-outcome probabilities.',
        'It counts TN twice.|The formula has one contribution per observation; it does not double-count true negatives.',
        'It only scores correct labels.|Every realized outcome is scored, including wrong hard-label predictions.',
      ),
      c(
        'A model changes a wrong probability from 0.99 to 0.60. Accuracy stays the same. What can improve?',
        'Log loss because the actual outcome receives more probability.',
        'For repayment, probability rises from 0.01 to 0.40, sharply reducing −ln probability.',
        'The observed label changes.|A revised prediction changes no actual observed repayment/default outcome.',
        'The number of default events changes.|Changing model confidence does not create or remove real default events in the fixed sample.',
      ),
      c(
        'The model assigns zero probability to an event that occurs. What is mathematical log loss?',
        'Infinite unless a stated clipping convention is applied.',
        '−ln(0) diverges; epsilon clipping changes the implementation, not the underlying boundary.',
        'Zero|Loss zero requires assigning probability one to the realized outcome, the opposite boundary.',
        'Exactly one|A zero realized-outcome probability has an infinite log penalty, not Brier’s bounded-one penalty.',
      ),
    ],
  },
  {
    number: 17,
    slug: 'expected-cost',
    title: 'Expected Cost',
    definition:
      'Expected cost translates model errors or uncertain outcomes into monetary consequences under explicit assumptions.',
    precise:
      'For labeled policies C=c_FN FN+c_FP FP; for one probability, the course’s simplified action costs are C_pass=500p and C_review=4(1−p).',
    prerequisites: ['notation', 'probability', 'data-splits'],
    terms: [
      [
        'False-negative cost',
        'Assumed dollars lost per missed positive.',
        'A missed fraud loses $500.',
      ],
      [
        'False-positive cost',
        'Assumed dollars charged per incorrectly flagged negative.',
        'A legitimate interruption costs $4.',
      ],
      [
        'Capacity constraint',
        'A bound on the number of cases that can be reviewed.',
        'At most four payments can enter review.',
      ],
      [
        'Expected cost',
        'Probability-weighted or count-aggregated monetary loss under a stated model.',
        'At p=0.01, passing has $5 expected loss.',
      ],
    ],
    mechanics: [
      'State which events incur each cost. The simple count objective prices FN and FP; it excludes any unmodeled cost for reviewing a true positive.',
      'Calculate policy cost before checking feasibility: low dollar cost does not override TP+FP≤H. For probability decisions, compare expected costs for each action.',
      'The threshold c_FP/(c_FN+c_FP) follows only when review avoids the positive loss and its $4 penalty applies to negatives. If all reviews cost $4, the formula changes to a constant review cost.',
    ],
    formulas: [
      f(
        'C=c_{FN}FN+c_{FP}FP,\\quad TP+FP\\le H',
        'Multiply each error count by dollars per error and add dollars. The queue capacity is a separate count constraint.',
        ['C', 'Total dollars under the error-cost assumptions.'],
        ['c_{FN}', 'Dollars per missed positive.'],
        ['c_{FP}', 'Dollars per false positive.'],
        ['FN', 'Missed-positive count.'],
        ['FP', 'False-positive count.'],
        ['TP', 'Caught-positive count.'],
        ['H', 'Review capacity in cases.'],
      ),
      f(
        'C_{pass}=c_{FN}p,\\quad C_{review}=c_{FP}(1-p),\\quad p^*=\\frac{c_{FP}}{c_{FN}+c_{FP}}',
        'Equate the two expected action costs to find the break-even probability. Cost rates are dollars per decision; p and the threshold are unitless.',
        ['p', 'Predicted positive probability.'],
        ['p^*', 'Break-even threshold under this simplified action model.'],
        ['c_{FN}', 'Loss when a positive passes.'],
        ['c_{FP}', 'Penalty when a negative is reviewed.'],
      ),
    ],
    trace: [
      [
        'Policy cost',
        'FN=1, FP=2: $500×1+$4×2=$508',
        'The assumptions explicitly price two error types.',
      ],
      ['Queue feasibility', 'TP+FP=3+2=5; H=4', 'The policy is one case over capacity.'],
      [
        'Individual decision',
        'p=0.01: pass=$5; review=$3.96',
        'Review is cheaper before capacity constraints.',
      ],
      [
        'Threshold',
        '4/(500+4)=0.0079365≈0.79365%',
        'Small false-alert cost relative to miss cost gives a low cutoff.',
      ],
    ],
    interpretation:
      'Expected cost links statistical performance to the financial objective, but the chosen policy must satisfy operational limits and the action model must represent real interventions.',
    comparison:
      'Precision, recall and F1 are useful diagnostics; cost uses severities and can rank their tradeoffs differently. Cost per review and cost per false alert are distinct assumptions.',
    boundaries:
      'Probability and loss estimates can be wrong. Perfect prevention, fixed severity and omitted review costs are teaching assumptions. Zero total action costs makes the threshold denominator zero and leaves both actions cost-equivalent; report that case explicitly.',
    mechanismChecks: [
      c(
        'What does expected cost require beyond error counts?',
        'An explicit cost assigned to each relevant outcome',
        'Counts become money only after severity assumptions are supplied.',
        'Only a higher accuracy value|Accuracy supplies a rate but contains no error-severity or dollar-cost assumptions.',
        'Only a larger beta in F-beta|Beta controls an F-score’s emphasis but does not supply monetary costs.',
      ),
      c(
        'How is a capacity limit handled?',
        'Check queue volume separately from monetary cost.',
        'A cheap policy can still exceed available review cases.',
        'Ignore it when dollar cost is small.|An infeasible queue remains infeasible even if its nominal monetary loss is attractive.',
        'Divide precision by capacity to create a probability.|Capacity is a count constraint; dividing a fraction by a case count does not price feasible actions.',
      ),
      c(
        'When does the threshold c_FP/(c_FN+c_FP) apply?',
        'Under the stated pass-loss and negative-only review-penalty model',
        'Changing intervention effectiveness or charging all reviews changes expected action costs.',
        'For every financial review process without assumptions|Different intervention effectiveness or all-review charges alter expected action costs and the break-even equation.',
        'Whenever accuracy exceeds 50%|Overall correctness does not determine the monetary decision threshold.',
      ),
    ],
    calculations: [
      c(
        'FN=1, FP=2, miss cost=$500 and false-alert cost=$4. What is cost?',
        '$508',
        '$500×1+$4×2=$508.',
        '$504|This prices only one false alert.',
        '$2,500|This prices all five reviews as misses.',
      ),
      c(
        'p=0.01 with C_pass=500p and C_review=4(1−p). Which is cheaper?',
        'Review at $3.96 versus pass at $5',
        '500×0.01=5; 4×0.99=3.96.',
        'Pass at $0.04|Pass cost is 500×.01=$5; $.04 incorrectly combines the $4 review rate with the positive probability.',
        'Review at $500|The $500 amount is the severity of a missed positive, not probability-weighted review cost.',
      ),
      c(
        'TP=3, FP=2 and capacity=4. How far over capacity is the queue?',
        '1 case',
        'Volume=3+2=5; excess=max(5−4,0)=1.',
        '2 cases|This counts only false alerts.',
        '0 cases|Low cost does not satisfy capacity.',
      ),
    ],
    applications: [
      c(
        'Which policy is acceptable when cheaper policy B has 100 alerts but capacity is 75?',
        'Reconsider B or allocate review under the constraint.',
        'B violates the stated capacity by 25 cases despite lower nominal cost.',
        'Deploy B without alteration because it is cheaper.|A queue of 100 exceeds 75-case capacity by 25; nominal savings do not supply missing reviewer capacity.',
        'Declare capacity satisfied because recall is high.|Recall measures fraud capture and cannot change the physical number of cases reviewers can handle.',
      ),
      c(
        'If every review costs $4, can C_review=4(1−p) be used unchanged?',
        'No; all-review cost would be $4 before other consequences.',
        '4(1−p) charges only negatives, so it encodes a different outcome-cost model.',
        'Yes; probability removes true-positive costs automatically.|Charging every review also charges true positives; weighting the charge by1−p omits that cost.',
        'Yes; this formula is universal.|This formula encodes a particular outcome-cost table and changes when that table changes.',
      ),
      c(
        'What should accompany a dollar-optimal policy recommendation?',
        'Sensitivity to cost/probability assumptions and feasibility',
        'The calculated optimum depends on estimates and constraints.',
        'A claim of guaranteed realized profit|Expected costs are conditional on estimates and do not guarantee the next realized outcome.',
        'Only its model name|A model name provides no evidence about assumptions, cost robustness or queue feasibility.',
      ),
    ],
  },
  {
    number: 18,
    slug: 'macro-f1-micro-f1-weighted-f1',
    title: 'Macro-F1, Micro-F1, Weighted-F1',
    definition:
      'Multiclass F1 summaries differ in how they combine class-specific success: equal class weight, pooled counts, or observed class support.',
    precise:
      'Macro-F1 averages per-class F1; weighted-F1 averages per-class F1 with actual support weights; micro-F1 computes F1 from pooled TP, FP and FN.',
    prerequisites: basic,
    terms: [
      [
        'One-vs-rest counts',
        'Treat one class as positive and all other classes as negative.',
        'For negative sentiment, other sentiments form the rest.',
      ],
      [
        'Support',
        'The number of actual observations in a class.',
        'Two actual negative-sentiment items.',
      ],
      [
        'Macro averaging',
        'Give each class score equal weight.',
        'Average three sentiment F1 scores regardless of support.',
      ],
      [
        'Micro averaging',
        'Pool class-relative TP, FP and FN before calculating the score.',
        'Eleven correct class labels among sixteen items.',
      ],
      [
        'Weighted averaging',
        'Weight each class F1 by actual support.',
        'Common sentiment has more influence.',
      ],
    ],
    mechanics: [
      'Read a multiclass confusion matrix with actual rows and predicted columns. For class c, TP is its diagonal, FN its off-diagonal row sum, FP its off-diagonal column sum.',
      'Calculate every class F1 first for macro and weighted averages. Micro instead pools counts before division; averaging and pooling are different operations.',
      'All three scores are unitless in [0,1], with higher values indicating stronger precision/recall performance under their respective weighting. For complete single-label multiclass classification, micro-F1 equals accuracy. Minority-class failure can be hidden by micro or support weighting.',
    ],
    formulas: [
      f(
        'F1_c=\\frac{2TP_c}{2TP_c+FP_c+FN_c},\\quad F1_{macro}=\\frac1C\\sum_cF1_c,\\quad F1_{weighted}=\\frac{\\sum_cn_cF1_c}{N}',
        'C is class count, n_c actual support, N total observations. Macro divides by classes; weighted divides the support-weighted sum by observations.',
        ['TP_c', 'Correct positives for class c.'],
        ['FP_c', 'Other classes predicted as c.'],
        ['FN_c', 'Actual c predicted otherwise.'],
        ['C', 'Number of evaluated classes.'],
        ['n_c', 'Actual support of class c.'],
        ['N', 'Total labeled observations.'],
      ),
      f(
        'F1_{micro}=\\frac{2\\sum_cTP_c}{2\\sum_cTP_c+\\sum_cFP_c+\\sum_cFN_c}',
        'Pooling means add counts across classes before taking the ratio. A single wrong class contributes one FP and one FN.',
        ['TP_c', 'True-positive count for class c.'],
        ['FP_c', 'False-positive count for class c.'],
        ['FN_c', 'False-negative count for class c.'],
      ),
    ],
    trace: [
      ['Class A', 'TP=8,FP=3,FN=2: F1=16/21≈0.7619; support=10', 'Common class.'],
      ['Class B', 'TP=3,FP=1,FN=1: F1=6/8=0.75; support=4', 'Middle class.'],
      ['Class C', 'TP=0,FP=1,FN=2: F1=0/3=0; support=2', 'The rare class is never found.'],
      ['Macro', '(0.7619+0.75+0)/3≈0.5040', 'Rare-class failure strongly affects equal weighting.'],
      ['Weighted', '(10×0.7619+4×0.75+2×0)/16≈0.6637', 'Support weights the common class more.'],
      [
        'Micro',
        'TP=11,FP=5,FN=5: 22/(22+5+5)=0.6875',
        'Equals 11/16 accuracy in this single-label case.',
      ],
    ],
    interpretation:
      'For financial sentiment, a model can perform well on common neutral statements while missing every rare negative statement. The averaging choice exposes or hides that failure.',
    comparison:
      'Report per-class results with the summary. Macro treats classes equally, weighted reflects the sample mix, and micro reflects pooled decisions. None encodes class-specific financial loss.',
    boundaries:
      'Classes with no actual or predicted examples can yield 0/0 F1; document the included classes and zero-division policy. The micro=accuracy identity does not generally apply to multilabel tasks.',
    mechanismChecks: [
      c(
        'Which operation defines micro-F1?',
        'Pool TP, FP and FN before computing F1.',
        'Micro is a ratio of summed counts, not an average of class scores.',
        'Average class F1 equally.|Equal averaging of per-class F1 defines macro-F1; micro instead pools counts before division.',
        'Average class F1 by support.|Support-weighted averaging defines weighted-F1; it is not the pooled-count micro calculation.',
      ),
      c(
        'What weights does weighted-F1 use?',
        'Actual class support n_c',
        'Each class F1 is multiplied by its number of actual observations.',
        'Predicted probability confidence|Prediction confidence is not the actual class count used for support weighting.',
        'Financial loss severity automatically|Support weighting uses observations, not financial severity unless a separate custom objective is defined.',
      ),
      c(
        'When does micro-F1 equal accuracy?',
        'In complete single-label multiclass evaluation',
        'Every error contributes one FP and one FN; pooled TP is the correct-label count.',
        'In every multilabel evaluation|Multilabel examples can produce multiple decisions per item, so the single-label accuracy identity need not hold.',
        'Only when all classes have equal support|The pooled-count identity applies even with unequal class support in complete single-label tasks.',
      ),
    ],
    calculations: [
      c(
        'Class F1 values are 0.8,0.6,0.1. What is macro-F1?',
        '0.5',
        '(0.8+0.6+0.1)/3=1.5/3=0.5.',
        '0.8|This ignores two classes.',
        '1.5|This is the sum.',
      ),
      c(
        'Two classes have F1 0.8 and 0.2 with supports 9 and 1. What is weighted-F1?',
        '0.74',
        '(9×0.8+1×0.2)/10=7.4/10=0.74.',
        '0.50|This is macro-F1.',
        '0.80|This ignores the rare class.',
      ),
      c(
        'Pooled TP=11,FP=5,FN=5. What is micro-F1?',
        '0.6875',
        '22/(22+5+5)=22/32=0.6875.',
        '0.50397|This is macro-F1 for the worked three-class example.',
        '0.34375|The numerator is 2TP, not TP.',
      ),
    ],
    applications: [
      c(
        'A rare negative-sentiment class has F1=0. What should a report include?',
        'Per-class results and a summary that exposes the rare-class failure',
        'A common-class dominated score can hide missed financial warning statements.',
        'Only overall accuracy|Overall accuracy can be dominated by common classes and hide the rare class’s zero F1.',
        'Only the common class F1|Reporting only the common class conceals the negative-sentiment failure the report must expose.',
      ),
      c(
        'Weighted-F1 is much higher than macro-F1. What is a plausible explanation?',
        'Common classes perform better than rare classes.',
        'Support weighting emphasizes the stronger common categories.',
        'Every class has identical performance.|If every class score were identical, weighted and macro averages would equal that common score.',
        'Weighted-F1 is measured in dollars.|F1 summarizes classification rates and contains no dollar exposure or cost units.',
      ),
      c(
        'A class is absent both in predictions and actual labels. What must be stated?',
        'The zero-division and class-inclusion convention',
        'Its per-class F1 is 0/0 in the raw formula; software conventions affect averages.',
        'That its F1 is mathematically always one|The raw formula has 0/0, which supplies no mathematically defined value of one.',
        'That it should silently be counted as perfect|Silently assigning perfection changes the average and hides the zero-division policy.',
      ),
    ],
  },
  {
    number: 19,
    slug: 'fairness-measures',
    title: 'Fairness Measures',
    definition:
      'Group fairness measures compare decision rates and class-conditioned errors across named groups.',
    precise:
      'Selection rate=approvals/N_g; TPR=approved actual repayers/P_g; FPR=approved actual non-repayers/(N_g−P_g). Selection ratios and rate gaps summarize comparisons.',
    prerequisites: basic,
    terms: [
      [
        'Selection rate',
        'The fraction of a group receiving the favorable decision.',
        'Six of ten applicants are approved.',
      ],
      [
        'Equal opportunity comparison',
        'Compare TPR across groups for the designated favorable actual outcome.',
        'Compare approval among actual repayers.',
      ],
      [
        'Equalized-odds comparison',
        'Compare both TPR and FPR across groups.',
        'Compare approvals among repayers and non-repayers.',
      ],
      [
        'Selection ratio',
        'One group’s selection rate divided by the reference group’s rate.',
        '40%/60%=2/3.',
      ],
    ],
    mechanics: [
      'Declare favorable decision, actual positive outcome, group definitions and time window. Here approval is predicted positive and repayment is actual positive; this differs from fraud-positive examples.',
      'Selection rates use all group members; TPR uses actual repayers; FPR uses actual non-repayers. Never substitute one denominator for another.',
      'Rates are fractions, signed gaps range [−1,1], and ratios are nonnegative and can exceed one. For a parity comparison, gaps near zero and reference ratios near one indicate closer agreement; selection rates alone have no universally better direction. Numerical parity on one rate does not imply parity on the others or establish individual fairness.',
    ],
    formulas: [
      f(
        'SR_g=A_g/N_g,\\quad TPR_g=TP_g/P_g,\\quad FPR_g=FP_g/(N_g-P_g)',
        'A_g counts approvals in group g. P_g counts actual repayers. FP means approved actual non-repayer under this favorable-outcome labeling.',
        ['A_g', 'Group approvals.'],
        ['N_g', 'Group applicants.'],
        ['P_g', 'Actual repayers in group.'],
        ['TP_g', 'Approved actual repayers.'],
        ['FP_g', 'Approved actual non-repayers.'],
      ),
      f(
        'Ratio_{B/A}=SR_B/SR_A,\\quad Gap_{TPR}=TPR_A-TPR_B',
        'Always name numerator/reference group and gap direction. Ratios and percentage-point gaps answer different comparison questions.',
        ['SR_A', 'Group A approval fraction.'],
        ['SR_B', 'Group B approval fraction.'],
        ['TPR_A', 'Group A repayment-conditioned approval rate.'],
        ['TPR_B', 'Group B repayment-conditioned approval rate.'],
      ),
    ],
    trace: [
      [
        'Group A',
        'N=10, approvals=6, repayers=8, TP=6: SR=.6; TPR=.75; FPR=0/2=0',
        'All A approvals are actual repayers.',
      ],
      [
        'Group B',
        'N=10, approvals=4, repayers=5, TP=3: SR=.4; TPR=.6; FPR=1/5=.2',
        'One approval goes to a non-repayer.',
      ],
      ['Ratio', '0.4/0.6=2/3≈0.667', 'B receives two-thirds A’s approval rate.'],
      ['Opportunity gap', '0.75−0.60=0.15', '15-percentage-point TPR difference.'],
      [
        'Error comparison',
        '0−0.20=−0.20',
        'FPR also differs; equalized odds is not satisfied in this sample.',
      ],
    ],
    interpretation:
      'The measures reveal distinct disparities for investigation. Interpret them with sample sizes, uncertainty, label quality, business context and the chosen favorable outcome.',
    comparison:
      'Selection parity and equal-opportunity parity condition on different populations and can disagree. A score ratio is a descriptive screen, not proof of causation, a complete fairness judgment, or compliance.',
    boundaries:
      'Zero group size, no actual repayers or no actual non-repayers makes the relevant rate undefined. A zero reference selection rate makes a selection ratio undefined. Historical labels may encode prior access and selective observation.',
    mechanismChecks: [
      c(
        'Why must the favorable outcome be declared?',
        'It determines what TP, FP and the group rates mean.',
        'Repayment-positive approval analysis uses different labels from fraud-positive detection.',
        'It makes all groups have equal sizes.|Outcome labeling determines class meaning but does not change how many applicants each group contains.',
        'It fixes financial profit at one value.|Declaring the favorable class supplies no loan margins, severity or profit calculation.',
      ),
      c(
        'What denominator does group TPR use?',
        'Actual positives within that group',
        'It compares approval among actual repayers rather than all applicants.',
        'All applicants across every group|Combining all applicants ignores the within-group actual-positive conditioning required by TPR.',
        'Group approvals only|Group approvals supply a predicted-positive denominator associated with precision, not TPR.',
      ),
      c(
        'How are a rate gap and ratio different?',
        'A gap subtracts rates; a ratio divides one by the reference.',
        '0.6−0.4=0.2 points-as-fraction; 0.4/0.6≈0.667 relative rate.',
        'Both always equal the same number.|Subtraction and division express absolute and relative differences and generally yield different numbers.',
        'Both measure dollar losses.|Both use event-rate fractions without monetary loss terms.',
      ),
    ],
    calculations: [
      c(
        'Group B approval rate is 0.4 and A is 0.6. What is B/A selection ratio?',
        '2/3≈0.667',
        '0.4/0.6=2/3.',
        '0.20|This is the A−B gap.',
        '1.50|This reverses numerator and reference.',
      ),
      c(
        'Group A TPR=0.75 and B TPR=0.60. What is A−B gap?',
        '15 percentage points',
        '0.75−0.60=0.15=15 percentage points.',
        '25 percentage points|This confuses relative change with a gap.',
        '1.25|This is their ratio.',
      ),
      c(
        'A group has 5 actual non-repayers; 1 is approved. What is its FPR?',
        '20%',
        'FP/(actual negatives)=1/5=20%.',
        '10%|This uses all ten group members.',
        '80%|This is specificity.',
      ),
    ],
    applications: [
      c(
        'Equal selection rates are observed. What can be concluded?',
        'Selection parity on that sample, while TPR/FPR still require checking.',
        'Equal overall approval rates do not force equal conditional errors.',
        'Every fairness criterion is satisfied.|Selection parity alone leaves conditional TPR/FPR and other fairness criteria unresolved.',
        'The decisions are legally compliant by definition.|A descriptive numerical rate is not a complete assessment of the decision process or applicable requirements.',
      ),
      c(
        'A disparity is detected in a very small group. What next?',
        'Inspect uncertainty, data quality and the decision process.',
        'Small denominators create unstable rates; a gap merits investigation without proving its cause.',
        'Treat the ratio as a causal proof.|A group ratio is descriptive evidence; it does not identify what caused the disparity.',
        'Ignore all disparities because one group is small.|Small samples call for uncertainty analysis and careful investigation rather than automatic dismissal.',
      ),
      c(
        'The reference group has zero approvals. What happens to a selection ratio using it as denominator?',
        'It is undefined and must be reported as such.',
        'A zero reference selection rate cannot support ordinary division.',
        'It is automatically one.|Dividing by a zero reference rate is undefined, not ordinary equal-rate parity.',
        'It proves every other group is treated fairly.|An undefined ratio cannot establish equitable treatment or evaluate the remaining fairness properties.',
      ),
    ],
  },
];
