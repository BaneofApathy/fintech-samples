import type { AlgorithmLesson, LessonBlock, LessonSection } from './lesson-types';
import { isSubstantiveExplanation } from '../engine/explanation-quality';

const p = (text: string): LessonBlock => ({ kind: 'paragraph', text });
const list = (...items: string[]): LessonBlock => ({ kind: 'list', items });
const math = (latex: string, readAloud?: string, symbols?: { symbol: string; meaning: string }[]): LessonBlock => {
  if (readAloud && !isSubstantiveExplanation(readAloud)) throw new Error(`Generic or empty formula explanation: ${latex}`);
  return { kind: 'math', latex, readAloud, symbols };
};
const table = (headers: string[], rows: string[][]): LessonBlock => ({
  kind: 'table',
  headers,
  rows,
});
const section = (title: string, ...blocks: LessonBlock[]): LessonSection => ({ title, blocks });
interface Copy extends AlgorithmLesson {
  financialProblem: string;
  baseline: string;
  definition: string;
  intuition: string;
  useWhen: string[];
  avoidWhen: string[];
  question: string;
  defenseQuestions?: string[];
}

// Author lesson copy separately from the retained extraction/provenance records.
export const algorithmLessons: Record<string, Copy> = {
  'logistic-regression': {
    definition: 'Logistic regression combines known applicant details into a score, then converts that score into an estimated chance of a two-outcome event, such as default within one year.',
    financialProblem:
      'A lender wants to estimate the chance that an applicant will miss the agreed payments during a defined period, such as the first year. That estimate is one input to a separate choice: approve, ask a person to review the application, or decline it.',
    available:
      'The model can use details known when the application is made, such as income, debt compared with income, credit use, requested amount, and payment history. The lender must define exactly what counts as default and how long it will watch each loan; otherwise, the examples do not share the same outcome.',
    costs:
      'Approving a loan that later defaults can cost the lender money. Declining an applicant who would have repaid can lose interest income and a customer. Asking an analyst to review a file costs staff time and can delay the decision.',
    decision:
      'First estimate the chance of default. Then use a stated policy to choose an action, taking account of the cost of mistakes and how many applications staff can review.',
    baseline:
      'Compare against a simple existing rule or scorecard on the same applications and time period. This shows whether the more flexible model adds useful information.',
    intuition:
      'Each input, called a feature, contributes evidence according to a fitted weight. The model adds those contributions into a score, then the sigmoid function turns that score into a probability between 0% and 100%. The score estimates risk; a separate policy uses the estimate and business constraints to choose an action.',
    useWhen: [
      'The outcome is binary and measured over a defined period.',
      'Inputs are mostly tabular and available when the decision is made.',
      'Coefficients and an inexpensive scoring method are useful.',
      'Feature transformations can capture the important relationships.',
    ],
    avoidWhen: [
      'The available features have little predictive signal or require interactions the model does not represent.',
      'The main inputs are raw text, images, graph relationships, or long sequences.',
      'The question asks what an intervention causes, or concerns time to an event rather than a fixed-window outcome.',
      'Product or population changes make fitted relationships unreliable.',
    ],
    question:
      'A probability describes how often an outcome is expected among similar cases; a decision is the action taken for one application. Compare the estimated costs at two cutoffs, then explain why the cheaper cutoff in one sample is not automatically the right policy for every applicant or future period.',
    defenseQuestions: [
      'A probability describes how often an outcome is expected among similar cases; a decision is the action taken for one application. Compare the estimated costs at two cutoffs, then explain why the cheaper cutoff in one sample may not be the right policy for future applicants.',
      'At application time, which details are already known, and which arrive only later? Explain why using a later detail, such as whether the borrower eventually missed a payment, would let the model peek at the answer.',
      'A 10% probability of default means about 10 of 100 similar loans would default over the stated period if the estimate is well calibrated. Why might a secured loan, an unsecured loan, and a credit-card line need different actions at that same estimated risk? Consider recovery, amount owed, and review capacity.',
      'Suppose boosting ranks defaulters slightly better than logistic regression but its probabilities are less trustworthy and its reasons are harder to explain. Which evidence would you need before choosing either model for a lending workflow, and what limitation would you report?',
    ],
    method: [
      section(
        'From features to probability',
        math(String.raw`z=\beta_0+\sum_{j=1}^{p}\beta_jx_j,\qquad P(y=1\mid x)=\frac{1}{1+e^{-z}}`,
          'First, add the starting value β₀ and each input xⱼ multiplied by its fitted weight βⱼ to get score z. Then the sigmoid 1/(1 + e⁻ᶻ) converts that score to a probability between 0 and 1. At z = 0 the probability is 50%; negative scores are below 50%. The probability estimates the defined outcome; a separate policy sets the action.',
          [
            { symbol: 'z', meaning: 'The model score before conversion; it is not itself a probability.' },
            { symbol: 'β₀', meaning: 'The starting score when the input values are zero.' },
            { symbol: 'βⱼ', meaning: 'The fitted weight for input number j.' },
            { symbol: 'xⱼ', meaning: 'The applicant value for input number j.' },
            { symbol: 'p', meaning: 'The number of input features in this formula.' },
            { symbol: 'y', meaning: 'The outcome label; y = 1 means the event being predicted occurred.' },
            { symbol: 'x', meaning: 'The set of input values for this applicant.' },
            { symbol: 'e', meaning: 'The fixed mathematical constant used by the exponential function.' },
          ]),
        p(
          'A coefficient is the fitted weight attached to one input. If the other inputs stay fixed, changing that input changes the score by its weight times the change in the input. The weight acts on log-odds, a scale used by the model before it converts the score to probability; it is not a percentage-point change. At a fixed cutoff, the boundary is a straight line in the supplied inputs. Adding squared terms or combinations of inputs can bend that boundary when viewed in the original data.',
        ),
        p(
          'Regularization adds a penalty when fitted weights grow very large, which can make the model less sensitive to quirks in its training examples. Learn any data-cleaning or scaling rules from the training portion only, then apply those same rules to later data. Finally, check calibration on data the model did not train on: among cases assigned about 10% risk, roughly 10% should experience the defined outcome over the stated period.',
        ),
      ),
    ],
    worked: [
      section(
        'An application sent for review',
        p(
          'Suppose an applicant has used 42% of their available revolving credit, has stable income, and has no recent missed payments. The model estimates a 5.8% chance of default during its defined observation period.',
        ),
        table(
          ['Policy band', 'Action'],
          [
            ['Below 4%', 'Approve'],
            ['4% through 8%', 'Manual review'],
            ['Above 8%', 'Decline'],
          ],
        ),
        p(
          'Because 5.8% falls between 4% and 8%, this example’s policy sends the application to a person for review. The estimate summarizes outcomes among comparable applicants; it cannot tell us with certainty what this one person will do. These cutoffs are teaching assumptions, not universal lending rules or the inputs in the separate calculation exercise.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Compare the cost of a policy',
        table(
          ['Outcome or action', 'Assumed cost'],
          [
            ['Approve an applicant who defaults', '$4,000'],
            ['Decline an applicant who would repay', '$450'],
            ['Review an application', '$18'],
          ],
        ),
        p(
          'A threshold t is a chosen probability cutoff. In this example, applicants below t are approved and applicants at or above t are declined. A false negative here is a borrower who defaults but was approved; a false positive is a borrower who would repay but was declined. These names depend on which outcome the model calls positive, so keep the definitions beside the counts.',
        ),
        math(String.raw`C(t)=4000\,FN(t)+450\,FP(t)`,
          'For a chosen cutoff t, count the approved applicants who later default (FN) and multiply by the assumed $4,000 loss. Count the repaying applicants declined (FP) and multiply by the assumed $450 lost opportunity. Add the costs. The result depends on this sample, period, and cost assumptions.',
          [
            { symbol: 'C(t)', meaning: 'Total estimated cost when the decision cutoff is t.' },
            { symbol: 't', meaning: 'The chosen probability cutoff that changes approve/decline decisions.' },
            { symbol: 'FN(t)', meaning: 'Applicants who defaulted but were approved at cutoff t.' },
            { symbol: 'FP(t)', meaning: 'Applicants who would repay but were declined at cutoff t.' },
          ]),
        p(
          'A three-action policy needs two cutoffs: approve below a, send scores from a through b to review, and decline scores above b. Nreview is the number of applications in that middle range. Multiply it by the assumed $18 review cost, then add any remaining default losses and lost business from mistaken declines after review. Review can improve a decision, but it does not guarantee that every later loss is prevented.',
        ),
        p(
          'Try candidate cutoffs such as 5%, 10%, 20%, and 30% on validation data, which is a held-back set used to choose settings. After choosing the policy, leave the separate test set untouched until the final check; repeatedly tuning against it would make the final score too optimistic. Recalculate when losses, funding costs, review capacity, or the mix of applicants changes, because each can change which policy is useful.',
        ),
      ),
    ],
  },
  'trees-and-forests': {
    definition: 'A decision tree predicts an outcome by asking a sequence of questions about a case. Each answer sends the case to a smaller group, and a final group, called a leaf, supplies the prediction. A random forest builds many trees from slightly different samples and combines their predictions, so one tree has less influence.',
    financialProblem:
      'A card issuer must decide which transactions to approve, ask the customer to verify, or send to an investigator. The tree uses information available before the payment is approved; later chargebacks are outcomes to predict, not clues available at decision time.',
    available:
      'Possible inputs, also called features, include the amount, whether the device has been used before, merchant age, location, and earlier account activity. These details must be known before the payment decision. A later chargeback is the outcome label used to teach and check the model; including it as an input would reveal the answer.',
    costs:
      'An approved fraudulent payment can cost the issuer money. Asking a legitimate customer to verify adds time and frustration; declining that payment can lose a sale. Investigators also have limited time, so a policy must fit the number of alerts they can review.',
    decision:
      'First check that the score works on later transactions that were not used to fit the trees. Then choose a threshold for approval, verification, or investigation using the cost of each mistake and the team’s review capacity. A score by itself does not choose an action.',
    baseline:
      'Start with a rule investigators already understand, such as asking for extra verification when a new device makes a purchase above $500. Compare the rule and model on the same transactions and under the same policy.',
    intuition:
      'A tree asks questions such as “Is this device new?” and “Is the payment above this amount?” Each answer narrows the cases to a smaller group. A forest repeats this with many trees and combines their scores, which makes the result less dependent on the quirks of one tree. The combined score still needs testing before it is treated as a probability.',
    useWhen: [
      'The data are organized in rows and columns, and risk may change suddenly at cutoffs or when two details occur together.',
      'Inputs use different units, such as dollars and days. Trees can usually compare those values without first converting them to a common scale.',
      'You can check how well the model ranks later cases and show the questions along a tree’s path.',
      'There are enough examples to check whether the result changes when trees are shallower or leaves contain more cases.',
    ],
    avoidWhen: [
      'A single short rule must explain every result, but the forest’s many trees cannot be explained clearly enough.',
      'The model must make reliable predictions far outside the amounts, ages, or values it saw before.',
      'The order of events or connections between accounts matter, but the input rows leave those details out.',
      'There are too few examples to make stable groups, or most useful evidence is raw text rather than row-and-column data.',
    ],
    question:
      'Why can combining many trees make the result less dependent on one sample? What check would you run before interpreting the forest score as an estimated chance of fraud?',
    defenseQuestions: [
      'A forest averages predictions from many trees trained on different samples and input choices. What evidence would show that this makes the ranking more dependable on later transactions, and what additional test would you need before calling its score a probability?',
      'A device identifier dominates the importance ranking. What would you check to tell whether it provides useful information, accidentally reveals a later outcome, or acts as a fragile stand-in for another customer detail?',
    ],
    method: [
      section(
        'Splitting and averaging',
        p(
          'A classification tree tries questions that make the resulting groups less mixed: ideally, a group contains mostly fraud cases or mostly legitimate payments. These smaller groups are called child nodes. A very deep tree can memorize accidental details, so limit how many questions it asks and require a minimum number of examples in each final leaf.',
        ),
        table(
          ['Model', 'How it is fitted', 'What to inspect'],
          [
            [
              'Decision tree',
              'Ask a sequence of questions that separates cases into smaller groups',
              'The questions on a path, examples per leaf, and results on held-back cases',
            ],
            [
              'Random forest',
              'Fit each tree on a resampled set of cases and a randomized set of inputs, then combine their scores',
              'Ranking, probability checks, and how much results vary across fits',
            ],
          ],
        ),
        p(
          'A forest is harder to summarize as one short rule because it combines many trees. Gradient boosting is another way to combine trees: it adds corrections in sequence rather than averaging parallel trees. Compare methods on the same held-back cases, and use a more complex method only if its improvement justifies the extra testing and maintenance.',
        ),
      ),
    ],
    worked: [
      section(
        'A card-authentication example',
        p(
          'A fictional $860 payment comes from a new device, crosses a country boundary, and uses a merchant account opened last week. A tree could first ask whether the device is new, then check the amount and merchant age. Each answer narrows the group of similar payments; the path is a model rule, not proof that this payment is fraud.',
        ),
        p(
          'Suppose a forest score is 0.71 and a policy that was checked on separate data uses 0.65 as its challenge cutoff. Since 0.71 is above 0.65, the customer is asked to verify the payment. This score is not automatically a 71% chance unless probability calibration has been checked. Verification adds friction, but it can allow a real customer to complete a payment instead of declining it.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Evaluate the queue and the probability',
        list(
          'Compare the existing rule, one tree, a forest, and logistic regression using the same past and later transactions.',
          'Use a validation group, separate from the final test group, to choose tree depth and the smallest leaf size.',
          'If investigators can handle 500 alerts, report how many of those 500 are confirmed fraud (precision@500) and how much total fraud the queue finds (recall@500).',
          'Check estimated chances against outcomes and inspect errors for new customers, large payments, changed devices, and uncommon merchants.',
        ),
        p(
          'The Python function average_precision_score reports average precision (AP), a summary of precision as recall rises. It can differ from the area made by connecting curve points with straight lines. State which calculation you used so readers know what the number means.',
        ),
        p(
          'Feature importance shows which inputs the fitted model relied on; it does not show that an input caused fraud. A field with many possible values, such as a device identifier, can look important for technical reasons or may accidentally reveal the label. Check whether its importance survives different samples and time periods, and ask whether it was available when the decision was made.',
        ),
      ),
    ],
  },
  'gradient-boosting': {
    definition: 'Gradient boosting builds a prediction in small steps. Each new tree adds a correction aimed at errors that remain in the current prediction.',
    financialProblem:
      'A lender wants to know whether a sequence of small tree corrections predicts one-year default better than a logistic-regression model. To make the comparison fair, both models must use information available at the same application-time cutoff and be evaluated on the same later loans.',
    available:
      'Application, credit-bureau, and cash-flow details available before the decision, plus later default outcomes used as training labels and evaluation answers. A later outcome can teach the model but must not be used as an input to the earlier decision.',
    costs:
      'Missing a borrower who later defaults, declining someone who would repay, and reviewing an application all have different costs. Boosting also takes time to tune, explain, and monitor, so any improvement should be large and useful enough to justify that work.',
    decision:
      'Compare the boosted model (the challenger) with the simpler reference model (the baseline). If its probabilities are reliable, choose an action cutoff using the costs of mistakes and the number of applications staff can review.',
    baseline:
      'Use logistic regression with the same application details, training period, validation choices, and later test period. This helps show whether the sequential tree corrections add value beyond the simpler model.',
    intuition:
      'Start with an initial score. The first tree proposes a correction; the learning rate chooses what fraction to add. The next tree looks at what the current model still gets wrong and adds another correction. Earlier trees remain in the running total. This training process tries to reduce a chosen loss, a number that summarizes prediction errors; it does not guarantee that the model will improve on future cases.',
    useWhen: [
      'The inputs are rows and columns, and patterns may depend on combinations or cutoffs that a straight-line score misses.',
      'A held-back validation period is large enough to tell whether the added complexity improves decisions, not only a chart score.',
      'The team can tune the settings, explain individual outcomes, and monitor the model after launch.',
      'The chosen software handles the actual input types and missing values without hiding important data problems.',
    ],
    avoidWhen: [
      'The held-back data are too small to distinguish real improvement from random variation.',
      'A simple, auditable scorecard is required and the team cannot run a fair test of a more complex alternative.',
      'The useful evidence is mainly raw text, images, or links between entities, which this tabular setup does not represent directly.',
      'The decision depends on behavior outside the examples seen so far, or the team cannot check whether probability quality and feature effects change over time.',
    ],
    question:
      'Does the boosted model improve results enough on later, held-back cases to justify its extra tuning and operating work? Compare what its ranking says, whether its probabilities match observed rates, and what decisions cost under the same review limit.',
    defenseQuestions: [
      'On the same later loans and under the same review limit, what changed in ranking, probability accuracy, and missed defaults? How much uncertainty remains, and what extra operating work does boosting add?',
      'Before testing results, state how much improvement would make the added model complexity worthwhile. Which financial cost or staff limit sets that bar, and what result would make you keep the simpler model?',
      'If ROC-AUC rises from 0.800 to 0.807 while probability calibration gets worse, what did the ranking improve by? What does that change not tell you about the accuracy of each borrower’s chance or the cost of lending decisions?',
    ],
    method: [
      section(
        'Add a correction to the current prediction',
        math(String.raw`F_m(x)=F_{m-1}(x)+\eta h_m(x)`,
          'Begin with the score after m−1 trees. Multiply the next tree’s correction hₘ(x) by learning rate η, then add it. A smaller η makes this step more cautious. This shows the update with an already-fitted tree; during training, changing η may also change later trees.',
          [
            { symbol: 'F_m(x)', meaning: 'The combined model score for input x after m trees have contributed.' },
            { symbol: 'F_{m-1}(x)', meaning: 'The combined score before the next tree is added.' },
            { symbol: '\\eta', meaning: 'The learning rate: the fraction of the new tree’s correction to add.' },
            { symbol: 'h_m(x)', meaning: 'The correction proposed by tree m for input x.' },
            { symbol: 'x', meaning: 'The case, such as one loan application, being scored.' },
          ]),
        p(
          'The learning rate η controls what fraction of the new tree’s correction is added. A smaller rate takes a shorter step, so training often needs more trees. With squared-error loss, the leftover error (called a residual) is actual value minus current prediction. Other objectives use a loss-specific correction; they do not all fit that same residual.',
        ),
        table(
          ['Parameter', 'What changes', 'What to check'],
          [
            [
              'Learning rate',
              'Fraction of each tree’s correction added to the score',
              'Error on held-back validation cases and trees needed',
            ],
            ['Depth or leaves', 'How many split decisions a tree can make', 'Whether rare patterns are memorized'],
            ['Early stopping', 'Stop adding trees when validation results stop improving', 'Use a separate validation period, not the final test period'],
            [
              'Class or sample weights',
              'How strongly each example affects the training error',
              'Calibration and decision costs under the intended policy',
            ],
          ],
        ),
      ),
    ],
    worked: [
      section(
        'Compare default models on the same evidence',
        list(
          'Separate older loans for training from later loans for validation and final testing. Learn cleaning or scaling rules from training loans only so future information does not leak backward.',
          'Fit logistic regression and boosted trees using the same training loans and application-time inputs. Their later comparison can then isolate the method more fairly.',
          'Use the validation period to choose tree depth, learning rate, and number of trees. Record the settings you tried; repeatedly tuning until validation scores look good can overfit even the validation sample.',
          'Check whether predicted chances match observed default rates, then compare the models at the same cutoff costs and staff review limit.',
        ),
        p(
          'Suppose ROC-AUC rises from 0.800 to 0.807. The difference is 0.007, which is 0.7 percentage points on the 0-to-1 AUC scale. It means ranking improved slightly on this comparison; it does not say that default probability is 0.7% more accurate or that lending losses fell. Check the uncertainty and whether the change improves decisions at the actual review limit.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Explain global patterns and individual scores',
        table(
          ['Global questions', 'Individual-case questions'],
          [
            [
              'Which features matter across the portfolio?',
              'Which observed inputs contributed to this score?',
            ],
            [
              'Are relationships stable over time?',
              'Would correcting a small data error change the decision?',
            ],
            [
              'Does the model depend on fragile proxies?',
              'Can the stated reason accurately describe the model output?',
            ],
          ],
        ),
        p(
          'SHAP is a tool that assigns parts of a model’s prediction to its input features. Use global summaries to ask what matters across many loans and local explanations to ask what influenced one score. These describe how this model behaves; they do not prove that a feature caused default or that the system is fair. If regulations require a reason for a decision, confirm that the translated reason is permitted, accurate, and representative.',
        ),
        p(
          'Document the baseline comparison, calibration checks, examples of individual scores, and at least one case the model handled poorly. If the held-back results are too close to distinguish, prefer the option whose complexity and operating cost the team can justify and support.',
        ),
      ),
    ],
  },
  'k-means': {
    definition: 'K-means divides examples into a chosen number of groups, called clusters. It assigns each example to the nearest center, then moves each center to the average of its assigned examples. It repeats those two steps until assignments stop changing or a limit is reached.',
    financialProblem:
      'A digital bank may group accounts with similar recent behavior to explore whether different customers need different services. These are descriptive groups: a cluster number does not say whether someone is creditworthy or what service will help them.',
    available:
      'Choose account details measured over the same time window, such as monthly deposits, savings rate, withdrawals, card use, and mobile activity. These selected details are features. Their units and ranges affect how near or far two accounts look to the algorithm.',
    costs:
      'Unstable or poorly understood groups can send customers the wrong offer or service. Collecting and scaling behavior data also takes work. A cluster label alone is not evidence for approving or declining credit, or accusing someone of misconduct.',
    decision:
      'Decide which account details and distance make “similar” meaningful for the intended question. Compare groupings across samples and time, then test a specific service use with a controlled trial before acting on it.',
    baseline: 'Compare with the segments the bank already uses, such as balance bands or product ownership, on the same accounts. More detailed clusters are useful only if they add a stable distinction that changes a worthwhile service.',
    intuition:
      'Clustering groups examples that look similar on the measurements you selected. K-means does not know what “good customer” means; it only uses the chosen distances. People must decide whether the groups repeat, make sense, and support a helpful action.',
    useWhen: [
      'You do not have a known outcome to predict, and grouping behavior may help explore the data.',
      'You want to explore customer patterns or design a product study, not directly predict who will repay.',
      'You can explain why the chosen measurements and their scaled distances represent meaningful similarity.',
      'You can check whether the groups persist and test a proposed use rather than treating group names as facts.',
    ],
    avoidWhen: [
      'You already have an outcome, such as default, to predict; a labeled prediction method answers that question more directly.',
      'The cluster number would directly approve or decline a person, or be treated as proof of wrongdoing.',
      'Missing values or inconsistent units make “nearby” accounts a poor comparison.',
      'Customer behavior changes too quickly for groups to remain useful, or the question is whether an offer caused a change.',
    ],
    question:
      'If a customer moves to a different cluster when you rerun the grouping or change the month, would the service decision still make sense? How would you test that decision before offering it to customers?',
    defenseQuestions: [
      'If the same customer moves to a different cluster when you change the sample or month, what could that do to a service decision? What later-data or controlled test would show whether the proposed service still helps?',
      'A set of customers forms a clearly separated group, but the bank would offer them the same service as everyone else. What customer need or measurable benefit would make this grouping worth maintaining?',
    ],
    method: [
      section(
        'K-means and DBSCAN',
        math(
          String.raw`\min_{C_1,\ldots,C_k}\sum_{j=1}^{k}\sum_{x_i\in C_j}\lVert x_i-\mu_j\rVert^2`,
          'For a chosen number k of groups, assign each example xᵢ to a group Cⱼ with center μⱼ. Measure its squared distance from that center and add these distances across all examples. K-means searches for assignments and centers with a small total; because distance depends on units and k is chosen in advance, a small total does not by itself prove that the groups are useful.',
          [
            { symbol: 'k', meaning: 'The number of clusters selected before fitting K-means.' },
            { symbol: 'C_j', meaning: 'The examples assigned to cluster j.' },
            { symbol: 'x_i', meaning: 'The feature values for example i, such as one account’s measured behavior.' },
            { symbol: 'μ_j', meaning: 'The center of cluster j: the average of its assigned feature values.' },
            { symbol: 'i', meaning: 'The index naming one example in the data.' },
            { symbol: 'j', meaning: 'The index naming one cluster.' },
            { symbol: '‖x_i − μ_j‖²', meaning: 'Squared distance from example i to the center of its assigned cluster.' },
          ],
        ),
        table(
          ['Method', 'Grouping rule', 'Important choice'],
          [
            [
              'K-means',
              'Assign every example to its nearest center, then move each center to the group average',
              'Choose the number k first; it aims for nearby, compact groups',
            ],
            [
              'DBSCAN',
              'Join points that have enough nearby neighbors; leave sparse points ungrouped as noise',
              'Choose what counts as nearby and how many neighbors are enough; a group count is not required',
            ],
          ],
        ),
        p(
          'K-means compares distances, so units matter. If monthly deposits are measured in thousands of dollars while savings rate runs from 0 to 1, deposits can dominate the distance simply because their numbers are larger. Scale features using a rule that reflects the question, and check whether several inputs repeat the same account-size information.',
        ),
      ),
    ],
    worked: [
      section(
        'From segments to a testable use',
        p(
          'For a fictional account study, compare several chosen group counts k, inspect what measurements are typical in each group, and check whether similar groups appear in other samples. If a group suggests a useful service, test that service with a controlled trial before changing what customers receive.',
        ),
        p(
          'The browser lab uses generated numerical clouds to demonstrate clustering calculations. Its five dimensions have no real-world names, so they are not income, merchant mix, or savings. The separate worked exercise and explorer use stated savings-rate numbers; keep those examples distinct.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Evaluate clustering without target labels',
        list(
          'Check whether each account is closer to its own group than to another group. A silhouette score summarizes this comparison, but it does not say that the groups help customers.',
          'Rerun with a different random start, sample, and month. Compare which accounts stay together; group numbers such as 1 and 2 are arbitrary labels.',
          'Describe the measured behavior in a group without assuming every person in it has the same needs or character.',
          'Name the specific offer or service choice the grouping would change and how many customers the team can contact.',
          'Test whether the proposed service helps in a controlled trial. A neat-looking plot does not show that the service caused a benefit.',
        ),
      ),
    ],
  },
  'isolation-forest': {
    definition: 'Isolation Forest looks for transactions that random data splits can separate from the rest in unusually few steps. It ranks unusual behavior; it does not estimate the chance that a transaction is fraud.',
    financialProblem:
      'A payments team needs to prioritize unusual transactions when confirmed fraud labels are incomplete or delayed.',
    available:
      'Information available before the decision, such as how an amount compares with the customer’s past activity, how quickly transactions arrive, whether a device is new, and how the transaction compares with similar customers. Build these comparisons from an appropriate earlier period.',
    costs:
      'Reviewing a legitimate transaction takes staff time and can inconvenience a customer. A suspicious-looking transaction might reveal new fraud, but unusual behavior alone does not show that anyone did something wrong.',
    decision:
      'Rank transactions for a limited investigation queue, then use investigator outcomes to evaluate the ranking.',
    baseline: 'Simple amount and velocity rules, with random sampling as an additional comparison.',
    intuition:
      'Imagine repeatedly drawing random boundaries through a group of transactions. A transaction that resembles many others tends to stay in a larger group for longer. One that differs from the group may be separated after only a few cuts. The forest repeats this process with many trees and combines their results.',
    useWhen: [
      'Confirmed fraud examples are missing or arrive too late to train a usual fraud classifier.',
      'The goal is to choose which unusual transactions investigators should review first.',
      'The input features describe activity that was genuinely available at decision time, and the team knows how many cases it can review.',
      'You can later check investigation outcomes and compare the queue with simple rules.',
    ],
    avoidWhen: [
      'A well-tested model already answers the question and unusual-activity screening would add no useful information.',
      'A flag would automatically be treated as proof or trigger a serious action without review.',
      'Customer behavior changes faster than the reference data and model can be checked and updated.',
      'You need a well-calibrated probability of a named event, or the main question is how accounts connect to one another.',
    ],
    question:
      'At the available review capacity, how useful are the flagged cases? Why is the anomaly score not a fraud probability?',
    defenseQuestions: [
      'If investigators can review only ten transactions, how many useful cases appear in the first ten, and what evidence tells you the score is an unusualness ranking rather than a fraud chance?',
      'Name three ordinary financial activities that could look unusual in a population, and say what records would help an investigator understand each one.',
      'Would you use an unusualness score to decline a transaction, ask the customer to verify it, or send it to a human reviewer? Explain which outcomes and error costs you would need to compare before choosing.',
    ],
    method: [
      section(
        'Random cuts and path length',
        math(String.raw`\bar h=\frac{1}{T}\sum_t h_t,\qquad s=2^{-\bar h/c}`,
          'For one transaction, add the number of cuts it took to isolate it in each tree and divide by the number of trees T. That gives its average path length h-bar. Divide this average by the supplied normalization value c, make the ratio negative, and use it as the exponent on 2 to get score s. A shorter average path makes the exponent less negative and the score larger under this convention. The score ranks unusualness; it is not a probability of fraud.',
          [
            { symbol: '\\bar h', meaning: 'the transaction’s average number of cuts before isolation' },
            { symbol: 'T', meaning: 'the number of trees in the average' },
            { symbol: 'h_t', meaning: 'the number of cuts for this transaction in tree t' },
            { symbol: 's', meaning: 'the anomaly score; larger means more unusual under this formula' },
            { symbol: 'c', meaning: 'a path-length normalization value supplied or calculated for the data set' },
          ]),
        list(
          'A tree randomly chooses one measured feature, such as transaction amount.',
          'It randomly chooses a value on that feature to draw a boundary and divide the transactions into smaller groups.',
          'It keeps drawing boundaries until the transaction stands alone or the tree reaches its stopping limit. The number of boundaries it crossed is its path length in that tree.',
          'Repeat across many trees, average each transaction’s path lengths, and convert the average into an anomaly score. This lets the system rank transactions by how easily the trees separated them.',
        ),
        p(
          'A shorter average path means the random cuts separated that transaction sooner, so it looks less like the reference group. In this exercise, a larger score means more unusual. Some software reports a reversed score, so check the definition before deciding which end of a list is most unusual.',
        ),
      ),
    ],
    worked: [
      section(
        'Review 200 of 100,000 transactions',
        p(
          'Suppose investigators have time to inspect 200 of 100,000 transactions today. Use only information available before each transaction was decided, calculate a score for every transaction, sort from most unusual to least unusual, and send the first 200 for review. The limit of 200 reflects staff capacity, not a claim that exactly 200 transactions are fraudulent.',
        ),
        p(
          'After investigators review them, record which cases they confirmed and calculate precision at 200: the number of confirmed cases among those 200, divided by 200. Compare that result with the existing amount rule and look for useful discoveries it missed. Also check whether the queue repeatedly includes legitimate large purchases, payroll, travel, or seasonal payments.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Evaluate the investigation queue',
        list(
          'Judge the queue with outcomes confirmed later, or with a consistent review process. A score by itself cannot tell you whether a case was truly fraud.',
          'Count newly discovered cases, repeated alerts that turn out to be legitimate, review time per case, and how many alerts each investigator receives.',
          'Check results separately for customer and merchant groups so one group is not burdened with many more unhelpful alerts.',
          'Test on later time periods than the data used to build the model, then keep checking whether normal behavior is changing.',
        ),
        p(
          'The lab reverses the sign of the library’s score_samples output so that larger displayed values rank as more unusual. Its contamination setting chooses a cutoff for labeling a portion of the training data as outliers; changing that cutoff changes which cases are flagged, not their underlying ranking. Compare the flagged count with the team’s review capacity.',
        ),
        p(
          'Try describing amount relative to each customer’s usual activity, then check whether ordinary large payments still fill the top of the queue. Keep the reason for each flag beside the investigator’s eventual finding so the team can see what the ranking is learning.',
        ),
      ),
    ],
  },
  'time-series': {
    definition: 'A time-series forecast uses earlier measurements, recorded in time order, to estimate a value at a future time. It can use recent changes and repeating patterns such as the same rise in outflows every Friday.',
    financialProblem:
      'Treasury estimates how much money will leave through settlements so it can keep enough cash available. Operations forecasts transaction volume to schedule enough staff. The forecast horizon matters: tomorrow’s estimate and next month’s estimate answer different planning questions.',
    available:
      'A history measured at regular times up to the moment a forecast is made. Calendar information and other inputs can be used only if they are already known at that moment; later actual outflows must be held back for evaluation.',
    costs:
      'If outflows are higher than forecast, treasury may not have enough cash ready. If they are lower, cash may sit unused. Staffing forecasts can leave queues too long or pay for unused capacity. The size and timing of each error determine its practical cost.',
    decision:
      'Estimate outflows for a stated number of days ahead, report a range of plausible values when uncertainty matters, and compare performance with a simple forecast on later dates.',
    baseline:
      'A useful first comparison is seasonal naive: if daily outflows repeat weekly, predict each day using the matching day from the last fully observed week. Also compare a last-value forecast and a recent average.',
    intuition:
      'The recent direction, repeating calendar patterns, and past forecast misses can help estimate what comes next. These patterns are clues, not promises: a holiday, policy change, or sudden market event can make the past a poor guide.',
    useWhen: [
      'There is enough regularly spaced history to see useful patterns.',
      'Recent values or a repeating season plausibly relate to the future values you need.',
      'You know how far ahead the forecast will be used and what decision depends on it.',
      'You can test it on later periods and check whether reported ranges capture outcomes as often as promised.',
    ],
    avoidWhen: [
      'A major change means the old pattern no longer represents current behavior.',
      'Values are mostly zero with occasional jumps, and the chosen method cannot represent that pattern.',
      'Important drivers are missing from the data available at forecast time.',
      'You need to know what would happen under a policy change, or are describing a distant scenario as if it were a precise prediction.',
    ],
    question:
      'How does the model compare with seasonal naive on walk-forward tests, and does its prediction interval achieve the stated coverage?',
    defenseQuestions: [
      'Across several future test periods, how does SARIMAX compare with repeating the last observed week? Does its 95% interval include outcomes about 95 times out of 100 over enough forecasts, and what limits a check based on only 28 days?',
      'One model has a lower average forecast miss but repeatedly underestimates holiday peaks. What matters more for the treasury decision: average accuracy or avoiding a cash shortage? How could an error measure assign extra cost to under-forecasting?',
    ],
    method: [
      section(
        'ARIMA, seasonality, and volatility',
        table(
          ['Term', 'What it represents'],
          [
            ['AR(p)', 'Dependence on p prior values'],
            ['I(d)', 'd rounds of differencing'],
            ['MA(q)', 'Dependence on q prior forecast errors'],
            ['Seasonal ARIMA', 'Additional terms for a specified seasonal period'],
          ],
        ),
        math(String.raw`\phi(B)(1-B)^d y_t=c+\theta(B)\varepsilon_t`,
          'This ARIMA equation describes a series after taking d differences. The operator B means “use the previous time step,” so Byₜ = yₜ₋₁. The φ polynomial uses earlier values (autoregression), while θ uses earlier forecast errors (moving average). The constant c is a drift term when included. The equation is a model for patterns in the series, not a guarantee that future values will follow them.',
          [
            { symbol: 'B', meaning: 'the lag operator; B yₜ means the previous observation yₜ₋₁' },
            { symbol: 'yₜ', meaning: 'the measured value at time t, such as today’s settlement outflow' },
            { symbol: 'd', meaning: 'how many times the series is differenced before modeling' },
            { symbol: 'φ(B)', meaning: 'the selected weights on earlier differenced values' },
            { symbol: 'θ(B)', meaning: 'the selected weights on earlier forecast errors' },
            { symbol: 'εₜ', meaning: 'the part of the current value not captured by the model' },
            { symbol: 'c', meaning: 'an optional constant or drift term' },
          ]),
        p(
          'Here B is the lag operator: applying B to today’s value gives the prior value, Byₜ = yₜ₋₁. The AR and MA polynomials combine selected time lags. Differencing models changes between periods instead of the original levels; it does not automatically make a series suitable for ARIMA.',
        ),
        p(
          'ARIMA describes the expected value, or conditional mean, given the history. GARCH answers a different question: how the size of forecast errors may change over time. It can represent volatility clustering, where unusually large movements tend to arrive near other large movements.',
        ),
      ),
    ],
    worked: [
      section(
        'Repeat the last observed season',
        p(
          'A last-value forecast uses the final observation for every future horizon. A seasonal-naive forecast repeats the most recent complete season, including when the horizon exceeds one season.',
        ),
        math(String.raw`\widehat y_{t+h}=y_{\,t-s+1+((h-1)\bmod s)},\qquad h\ge1`,
          'For a forecast h steps ahead, seasonal naive copies the observed value from the matching place in the last complete season. If the season has s periods, the remainder operation wraps the forecast back to the same position in that season. With daily data and s = 7, day 8 uses the matching weekday from the last observed week. This is a comparison forecast, not evidence that the next week will repeat perfectly.',
          [
            { symbol: 'ŷₜ₊ₕ', meaning: 'the forecast h steps after the latest observed time t' },
            { symbol: 'y', meaning: 'an observed value, such as settlement outflow' },
            { symbol: 'h', meaning: 'how many periods ahead the forecast is' },
            { symbol: 's', meaning: 'the number of periods in one season; 7 for a weekly pattern in daily data' },
            { symbol: 'mod', meaning: 'the remainder operation, which cycles back through the season' },
          ]),
        p(
          'For daily observations with s = 7, a 28-day forecast repeats the last observed seven-day pattern four times. It never uses future observations. A separate planning scenario might request 14 days; evaluate that horizon explicitly rather than treating all horizons as equivalent.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Walk-forward evaluation',
        list(
          'Keep dates in order, and learn any data-cleaning or scaling rules from the past only.',
          'At each forecast date, fit using what would have been available then and predict the required number of periods ahead.',
          'Compare errors separately at day 1, day 7, and day 28 when those decisions matter; a good one-day forecast may be poor four weeks ahead.',
          'For an 80% or 95% prediction interval, check how often later actual values land inside the range and how wide that range is.',
          'Look at holidays, unusual shocks, patterns in the remaining errors, and changes over time instead of relying only on an average score.',
        ),
        p(
          'A prediction interval is a range intended to capture a future value at a stated rate, such as 80% of the time. Its width depends on the model and how far ahead you forecast. A wide range can capture more outcomes while being less useful for planning, so report both its coverage and width beside the baseline comparison.',
        ),
      ),
    ],
  },
  'graph-methods': {
    definition: 'Graph methods map entities—such as accounts, devices, merchants, or people—and the relationships between them. They help investigators see shared connections and paths that are hard to spot when each transaction is viewed alone.',
    financialProblem:
      'An investigator wants to know whether an account is connected to other accounts through a shared device, merchant, address, or money transfer. Those links can help prioritize research, but each link must be interpreted before it affects a customer.',
    available:
      'Records about accounts, devices, merchants, cards, addresses, and transactions that were available at the time being studied. Each link needs a timestamp and a measure of how confidently the records refer to the same entity.',
    costs:
      'A mistaken identity match can connect unrelated customers and send them into an investigation. Missing or outdated links can hide a real relationship. Investigators also have limited time to examine paths and groups.',
    decision:
      'Use the graph to prioritize account groups for review, or add tested relationship measures to a transaction model. Keep the actual path behind each alert so a reviewer can see why the accounts were connected.',
    baseline:
      'Compare against a transaction model or simple rule that uses no network links. The browser lesson measures graph structure; it does not fit or validate a production fraud model.',
    intuition:
      'One payment may look ordinary by itself. A device used by several accounts or a repeated path through merchants can add context. The graph records that connection; investigators still need to check whether it reflects shared infrastructure, a household, a business, or suspicious coordination.',
    useWhen: [
      'Relationships may reveal context that the fields on a single transaction do not show.',
      'You know when each link became available and have a defensible way to match records to entities.',
      'Investigators can inspect the actual links and paths that triggered an alert.',
      'The team can keep links fresh and retrieve relevant paths quickly enough for the workflow.',
    ],
    avoidWhen: [
      'Links are unreliable, too incomplete to interpret, or were first recorded after the decision being tested.',
      'The matching process often combines unrelated people or accounts.',
      'A transaction-only approach already gives the evidence needed for this decision.',
      'A shared connection would be treated as proof that a person committed misconduct.',
    ],
    question:
      'Which recorded link would help you decide whether to review these accounts, and what ordinary shared connection could create a false alert?',
    defenseQuestions: [
      'Show which recorded relationship adds useful evidence. Name one ordinary reason people could share that device, address, or merchant, and explain why a connection is not proof of wrongdoing.',
      'If the score is high mainly because two accounts connect to the same people or devices, what does that tell you? What else could explain the shared links, and why is the score not proof of wrongdoing?',
    ],
    method: [
      section(
        'Specify nodes and edges',
        p(
          'A node is an entity such as an account or device; an edge is a recorded relationship between two nodes. Specify what each edge means and, when relevant, its direction, date, amount, and matching confidence. A shared household device is not the same kind of link as a money transfer.',
        ),
        table(
          ['Example node', 'Relationship', 'Example node'],
          [
            ['Account A', 'uses', 'Device 7'],
            ['Account B', 'uses', 'Device 7'],
            ['Account B', 'transfers to', 'Account C'],
            ['Account B', 'registered at', 'Address'],
            ['Account C', 'registered at', 'Address'],
            ['Account A', 'paid', 'Merchant X'],
            ['Account B', 'paid', 'Merchant X'],
          ],
        ),
        p(
          'These rows illustrate why relationship types matter. The interactive graph uses its own labeled accounts, devices, and merchant; use only those displayed links when doing its calculation. A listed connection says what the records relate, not why the people made that connection.',
        ),
      ),
      section(
        'What graph methods measure',
        table(
          ['Method', 'Question'],
          [
            ['Connected components', 'Which entities can be reached by following the recorded links?'],
            [
              'Degree / weighted degree',
              'How many direct links does an entity have, or how much recorded value is attached to them?',
            ],
            ['Community detection', 'Which groups have many links within the group?'],
            ['Shortest paths', 'What is the fewest recorded links between two entities?'],
            ['PageRank-like centrality', 'Which entities connect to others that are themselves well connected?'],
            [
              'Temporal motifs',
              'Which dated sequences, such as rapid pass-through or many accounts funding one account, repeat?',
            ],
          ],
        ),
        p(
          'These measurements describe the shape of the recorded network. A large component means its members can be linked by some path; it does not mean they coordinated or committed fraud. A common merchant or workplace can connect many legitimate accounts.',
        ),
      ),
      section(
        'Graph neural networks',
        math(
          String.raw`h_v^{(k+1)}=\sigma\!\left(W_1h_v^{(k)}+W_2\operatorname{AGG}\{h_u^{(k)}:u\in N(v)\}\right)`,
          'At layer k, each node v has a representation h built from its known information and previous neighbor information. The layer gathers the representations of v’s directly connected neighbors, combines them with AGG, applies learned weights W₁ and W₂, then uses the activation σ. After another layer, information can travel one more link. A learned representation can summarize patterns; it does not make a recorded edge trustworthy or prove wrongdoing.',
          [
            { symbol: 'v', meaning: 'the account or other node being updated' },
            { symbol: 'u', meaning: 'one of the nodes connected directly to v' },
            { symbol: 'N(v)', meaning: 'the set of direct neighbors of node v' },
            { symbol: 'hᵥ⁽ᵏ⁾', meaning: 'the information representation for v after layer k' },
            { symbol: 'AGG', meaning: 'the rule that combines information from the neighbors' },
            { symbol: 'W₁ and W₂', meaning: 'learned weights for the node’s own and its neighbors’ information' },
            { symbol: 'σ', meaning: 'an activation function applied after combining information' },
          ],
        ),
        p(
          'One message-passing layer combines a node’s current representation with information from its direct neighbors. N(v) is the neighbor set, AGG combines their representations, W₁ and W₂ are learned weights, and σ is an activation function. This is a technical extension; the graph exercises below use direct counts and paths instead.',
        ),
        p(
          'First test whether simpler graph counts or paths add anything. A graph neural network brings extra work: selecting which neighbors to sample, refreshing the graph, training with the right historical cutoff, explaining alerts, and checking whether training and test accounts overlap. It should earn that complexity in a time-aware evaluation.',
        ),
      ),
    ],
    worked: [
      section(
        'Investigate a linked account group',
        p(
          'Suppose eight accounts share two devices, three funding cards, and a beneficiary over short time windows. Build typed, timestamped links and inspect shared neighbors and transfer sequences.',
        ),
        p(
          'Preserve the path behind the alert and investigate alternative explanations such as shared households or business infrastructure. Compare any predictive model with a version using only transaction attributes.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Check whether the links are useful',
        list(
          'Freeze the graph at each historical decision cutoff; future edges are leakage.',
          'Measure entity-resolution errors and inspect high-degree hubs.',
          'Check whether graph features improve held-out results at the same review capacity.',
          'Monitor stale edges and changing relationship patterns.',
          'Keep legitimate shared-link examples alongside confirmed problematic cases.',
        ),
      ),
    ],
  },
  transformers: {
    definition: 'A transformer builds a representation of each part of an input using information from other parts. This context can help distinguish “loss narrowed,” which may be positive, from “loss widened,” which may be negative.',
    financialProblem:
      'Analysts may want to group statements as positive, neutral, or negative, then send uncertain or poorly handled statements to a person. A sentiment label describes the wording; it is not an investment recommendation.',
    available:
      'The text, its date and document type, clear sentence boundaries, and labels assigned using the same finance-specific guide. The label examples should match the kind of documents the model will later see.',
    costs:
      'A wrong sentiment label can send analysts toward the wrong statements. Truncated text, unclear label rules, and confident mistakes need review before anyone uses the output for a consequential decision.',
    decision:
      'Define what positive, neutral, and negative mean; classify each sentence; and send uncertain statements or unfamiliar document types for review.',
    baseline:
      'Compare with a majority-label guess, simple word rules, or a TF-IDF linear classifier. The browser lab runs a small TF-IDF example; the separate native example runs FinBERT. They are different models, so the browser result is not a FinBERT score.',
    intuition:
      'Attention lets one word use information from other words. “Profit rose” and “profit did not rise” share most of their words but mean different things; context helps the representation keep track of that difference.',
    useWhen: [
      'The signal depends on natural-language context.',
      'Keyword rules miss negation, nuance, or longer dependencies.',
      'Pretrained transfer learning fits the available data.',
      'Representative labeled evaluation and review of consequential outputs are possible.',
    ],
    avoidWhen: [
      'The task is exact arithmetic or a database lookup.',
      'A tested deterministic rule already meets the need.',
      'The inputs are mainly a small tabular dataset.',
      'Representative sentiment labels are unavailable, or privacy, retention, and licensing requirements are unresolved.',
    ],
    question:
      'How do classification, extraction, and generation differ in their expected output and evaluation?',
    defenseQuestions: [
      'A classifier chooses a label, an extractor points to information in the text, and a generator writes new text. What should a reviewer check for each output before it is used?',
      'If a sentence containing “loss narrowed” is labeled negative because the model notices “loss,” how would you test the mistake, fix the example or label rule, and check that the fix did not create a new problem?',
    ],
    method: [
      section(
        'Build context-sensitive representations',
        list(
          'Split the text into tokens and turn each token and its position into numbers called vectors.',
          'Use self-attention to decide how much information each token should take from other tokens in the same text.',
          'Repeat the mixing step through transformer layers so each token representation can include wider context.',
          'For classification, use a separate output layer to calculate scores for the task’s fixed labels.',
        ),
        math(
          String.raw`\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V`,
          'Attention first compares each query Q with the keys K to produce relevance scores. Dividing by the square root of the key dimension dₖ keeps the scores at a manageable scale. Softmax converts the scores into weights that sum to one. The weights combine the value vectors V, giving the query a context-aware result. The small lesson calculation uses supplied numbers; a trained transformer computes much larger learned vectors.',
          [
            { symbol: 'Q', meaning: 'query vectors: what each token is looking for from context' },
            { symbol: 'K', meaning: 'key vectors: information used to compare which tokens are relevant' },
            { symbol: 'V', meaning: 'value vectors: the token information that gets combined using the weights' },
            { symbol: 'dₖ', meaning: 'the number of values in each key vector' },
            { symbol: 'softmax', meaning: 'a conversion from scores to nonnegative weights that sum to one' },
            { symbol: '⊤', meaning: 'transpose: turn rows into columns for the score comparison' },
          ],
        ),
        p(
          'Q, K, and V mean query, key, and value; dₖ is the number of entries in a key vector. The toy exercise supplies tiny scalar values so you can follow the arithmetic. FinBERT uses a trained transformer with many parameters, so its decisions cannot be explained by this two-token calculation alone.',
        ),
      ),
      section(
        'Classification is not generation',
        table(
          ['Task', 'Output', 'Evaluation'],
          [
            [
              'Classification',
              'One of a fixed set of labels',
              'Confusion matrix and per-class precision/recall',
            ],
            [
              'Extraction',
              'Specified spans or structured fields',
              'Field-level correctness and completeness',
            ],
            [
              'Generation',
              'An open-ended answer or summary',
              'Supported claims, omitted facts, correct figures and dates',
            ],
          ],
        ),
        p(
          'Match the output to the question. Classification chooses from fixed labels. Extraction returns specified facts or spans. Generation writes an open-ended answer. A positive sentiment label does not verify a reported number, and a fluent summary is not automatically factual.',
        ),
      ),
    ],
    worked: [
      section(
        'Label earnings-call statements',
        p(
          'Create a test set of financial sentences and write clear instructions for each label. Have reviewers discuss ambiguous neutral wording, future guidance, margin pressure, and liquidity language so the test reflects the real task.',
        ),
        p(
          'Compare a simple word-based baseline and the native FinBERT example on the same labeled sentences. Check that the labels are correct: if you change “profit rose” to “profit did not rise,” the target label must change too. Otherwise the test would reward a model for missing the negation.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Inspect errors by class and context',
        list(
          'Use in-domain test data rather than assuming performance on movie reviews transfers.',
          'Report each class separately; a common neutral label can dominate averages.',
          'Test negation, forward-looking language, document types, sectors, dates, sentence length, and truncation.',
          'Check calibration or the chosen review threshold on representative data.',
          'Monitor label distribution and confidence after the document mix changes.',
        ),
        p(
          'Keep a confusion matrix, challenge set, and explanation of which cases require review. High confidence under domain shift does not guarantee a correct label.',
        ),
      ),
    ],
  },
  rag: {
    definition:
      'Retrieval-augmented generation (RAG) searches a collection of documents for passages related to a question, then gives those passages to a language model to help write an answer. An embedding is a list of numbers representing text, which lets a search system rank passages by how their wording or meaning compares with the question. Search finds possible evidence; a person or system still needs to check that each cited passage supports each claim.',
    financialProblem:
      'An analyst asks a question about a company filing and needs an answer that points to the exact passages and figures used. The system should say when the collection does not contain enough evidence.',
    available:
      'A reviewed set of filings or policies the user is allowed to see. Keep document dates, section boundaries, table headers, and stable identifiers so a reader can trace a result back to its source.',
    costs:
      'The system might miss the needed passage, use an old document, separate a number from its table heading, invent an unsupported claim, or calculate incorrectly. A fluent answer can still be wrong; the cited text must support it.',
    decision:
      'Find relevant passages, check that they answer the question, and make only claims that the cited text supports. If the evidence is missing or incomplete, say so instead of filling the gap with a guess.',
    baseline:
      'Compare with keyword search followed by manual reading. The browser lab demonstrates a small TF-IDF retrieval method; it does not run a language model or generate answers. Native semantic search is a separate comparison.',
    intuition:
      'Search first, answer second. Retrieval decides which passages the answer writer can see. If search misses a needed fact, the writer should not invent it; it should report that the available evidence is insufficient.',
    useWhen: [
      'The needed information is in a changing document collection rather than a fixed database field.',
      'Readers need to inspect the source passages behind each answer.',
      'Questions use varied wording, so exact keyword matches alone may miss the relevant passage.',
      'You can maintain document permissions, test answerable and unanswerable questions, and let the system admit when evidence is missing.',
    ],
    avoidWhen: [
      'A reliable database lookup or fixed API returns the exact answer more directly.',
      'Documents are incomplete, untrusted, or visible to people who do not have permission to read them.',
      'The answer requires exact arithmetic across many table rows that the system cannot reliably verify.',
      'The output would automatically trigger a consequential transaction, or there are no examples with which to test answer quality.',
    ],
    question: 'Was the required evidence retrieved, and does it support each claim in the answer?',
    defenseQuestions: [
      'For each sentence in the answer, point to the passage that supports it. What should happen when a required fact is missing or the passage does not support the claim?',
      'If search finds the correct passage but the answer invents a number, which part failed? Describe a test that checks retrieval separately from whether the written answer is supported.',
    ],
    method: [
      section(
        'RAG is a pipeline with several checks',
        list(
          'Read documents while keeping headings, table labels, dates, and access permissions attached.',
          'Split documents into passages small enough to search, then represent them as searchable text or number vectors.',
          'Search for candidate passages and, if useful, reorder them so the best evidence appears near the top.',
          'Check whether the retrieved passages contain the facts the question requires before writing an answer.',
          'Show the source passages and check every claim, number, date, and citation against them.',
        ),
        p(
          'Retrieval and answer generation are separate jobs: the search stage ranks passages, and the writer uses the selected context. Text inside a retrieved document is evidence to inspect, not an instruction that should override the user’s question or system rules.',
        ),
      ),
      section(
        'Similarity and chunking',
        math(String.raw`\cos(\theta)=\frac{q\cdot d}{\lVert q\rVert\lVert d\rVert}`,
          'Cosine similarity compares the directions of the question vector q and a passage vector d. Multiply matching coordinates and add them for the dot product; divide by both vector lengths to account for their sizes. A larger score means the vectors point in a more similar direction, which can help rank candidates. It does not give the probability that a passage is correct or that it supports the answer.',
          [
            { symbol: 'q', meaning: 'the number-vector representation of the question' },
            { symbol: 'd', meaning: 'the number-vector representation of one document passage' },
            { symbol: 'q · d', meaning: 'the dot product: multiply matching coordinates and add them' },
            { symbol: '‖q‖ and ‖d‖', meaning: 'the lengths of the question and passage vectors' },
            { symbol: 'cos(θ)', meaning: 'the cosine similarity score used to rank passage candidates' },
          ]),
        p(
          'Cosine similarity compares vector direction. A high score suggests that a passage may relate to the question, but a person still needs to check that it contains the requested fact and actually supports the answer.',
        ),
        table(
          ['Chunking problem', 'What the learner should check'],
          [
            ['Too small', 'A number can become separated from the heading, definition, footnote, or conditions that explain it'],
            ['Too large', 'Unrelated material can hide the useful passage and use space the answer writer needs'],
          ],
        ),
        p(
          'Keep each financial table row with its column headings and footnotes. Also check how the question is represented, whether the document collection is current and permissioned, which passages are filtered out, and how candidate passages are ranked.',
        ),
      ),
    ],
    worked: [
      section(
        'Find evidence for a filing question',
        p(
          'For a question about increased capital expenditures, retrieve the relevant reporting periods and the explanation of the change. Display those passages before drafting an answer.',
        ),
        p(
          'If a question requires a growth rate, retrieve both period values and calculate the rate explicitly. A retrieval score neither performs the arithmetic nor proves that a generated citation supports its claim.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Evaluate each stage',
        table(
          ['Stage', 'Checks'],
          [
            ['Parsing', 'Table integrity, section coverage, and numeric extraction errors'],
            ['Retrieval', 'Relevant-passage recall, ranking, and context precision'],
            [
              'Generation',
              'Supported claims, citation correctness, numerical accuracy, and completeness',
            ],
            ['Whole task', 'Answer correctness, insufficient-evidence behavior, latency, and cost'],
          ],
        ),
        p(
          'Remove the passage required to answer a question. The appropriate response is that the supplied evidence is insufficient. Update the relevance labels for this negative test rather than reusing labels from the answerable version.',
        ),
        p(
          'Keep one documented retrieval failure and one answer-generation failure. An “approved model” means a model permitted for this data and use; that approval does not establish answer correctness.',
        ),
      ),
    ],
  },
  optimization: {
    definition: 'Constrained optimization compares possible choices and selects the one that best meets a stated goal while obeying rules such as a budget, maximum position size, or required return. “Best” depends on the goal and the rules supplied; the result is not automatically the best real-world decision.',
    financialProblem:
      'A portfolio team must choose asset weights that satisfy a return requirement and explicit allocation limits while minimizing estimated variance.',
    available:
      'Expected-return estimates, a valid covariance matrix, current holdings, investment amount, transaction costs, and the constraints that apply to the proposed allocation.',
    costs:
      'Unstable inputs can create concentrated or high-turnover allocations. An omitted constraint or infeasible target can make a numerical result unusable.',
    decision:
      'Specify the objective and constraints, check feasibility, solve, and compare the resulting weights and costs with a simple allocation.',
    baseline:
      'Equal weighting or the current policy allocation, checked against the same constraints.',
    intuition:
      'Prediction estimates what may happen. Optimization chooses what to do within stated limits. The result depends on the objective, constraints, input estimates, and numerical solution.',
    useWhen: [
      'Decision variables, objective, and constraints can be stated explicitly.',
      'Choosing among feasible actions is the task.',
      'Input uncertainty and sensitivity can be examined.',
      'Hard constraints can be distinguished from preferences.',
    ],
    avoidWhen: [
      'The task only requires prediction.',
      'Important operational or policy constraints remain unstated.',
      'A point solution would hide unacceptable input uncertainty.',
      'The objective rewards the wrong outcome, or a simpler rule already meets the need.',
    ],
    question:
      'What are the objective and constraints, and how sensitive is the allocation to the input estimates?',
    defenseQuestions: [
      'Name the quantity this allocation tries to minimize and each rule its weights must obey. Which estimates matter most, and what happens if one changes?',
      'If a small change in an estimated return moves a large share of the portfolio, how should that affect your confidence? What simple allocation would you compare against under the same rules?',
    ],
    method: [
      section(
        'Mean-variance optimization',
        p(
          'Suppose a portfolio team wants the least variable mix of investments that can still reach a chosen expected return. The decision variables wᵢ are the fractions invested in each asset. The vector μ contains each asset’s estimated return, and Σ records how their returns vary alone and move together. The first line minimizes portfolio variance; the conditions require all weights to add to 100%, expected return to reach the target, and each asset weight to stay between zero and its cap. This is a mathematical model of the stated estimates and rules, not a guarantee of future performance:',
        ),
        math(
          String.raw`\min_w w^\top\Sigma w\quad\text{subject to}\quad\mathbf1^\top w=1,\quad\mu^\top w\ge r_{target},\quad0\le w_i\le u_i`,
          'Choose the asset shares w that make the portfolio’s variance as small as possible. The rules say the shares must total 1 (the whole portfolio), their estimated weighted return must be at least the target, and each share must be between zero and its allowed maximum. Σ describes both each asset’s variability and how pairs of assets move together; μ lists their estimated returns. Variance summarizes modeled spread in returns, not a promised loss or gain.',
          [
            { symbol: 'w', meaning: 'The list of fractions assigned to the assets; all fractions together must equal 1, or 100%.' },
            { symbol: 'Σ', meaning: 'The covariance matrix: it records each asset’s variance and how pairs of assets move together.' },
            { symbol: 'μ', meaning: 'The list of estimated returns for the assets.' },
            { symbol: 'r_target', meaning: 'The minimum estimated portfolio return the allocation must reach.' },
            { symbol: '1', meaning: 'The total portfolio share, equal to 100%.' },
            { symbol: 'w_i', meaning: 'The share invested in asset i.' },
            { symbol: 'u_i', meaning: 'The maximum allowed share for asset i.' },
          ],
        ),
        p(
          'Other rules can limit trading, sector concentration, cash needed to make trades, or transaction costs. First ask whether any allocation can satisfy all the rules; if not, there is no feasible answer. Then check that the solver finished successfully and that the returned weights obey every rule. A list of numbers alone does not show that a valid best solution was found.',
        ),
      ),
    ],
    worked: [
      section(
        'Recognize an infeasible allocation',
        p(
          'Imagine four investments, each capped at 20% of the portfolio. Even if all four reach their cap, they add up to only 80%. The portfolio rule requires 100% to be invested, so these rules cannot all be true at once. This is called an infeasible problem. No choice of returns or risk can fix the conflict; identify the failed constraints rather than treating a solver’s output as a valid allocation.',
        ),
        p(
          'Keep the original return requirement when comparing with equal weights. An allocation with low variance can still fail that requirement.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Measure input sensitivity',
        list(
          'Raise or lower each estimated annual return by one percentage point and solve again. A percentage point is an absolute change: 8% becomes 9%, not 8.08%.',
          'When testing a high-correlation scenario, change the full correlation matrix in a way that remains mathematically valid. Editing one correlation in isolation can produce a matrix that describes no possible set of asset returns.',
          'Report the largest change in any asset’s portfolio share and the total amount traded to move from the original allocation. These show how much the recommendation depends on the estimates.',
          'Identify which limits the solution reaches exactly, then compare estimated risk, return, and trading costs with a simple allocation that follows the same rules.',
        ),
        p(
          'For a concrete correlation stress, keep the original standard deviations D and combine the original correlation matrix R with a high-correlation matrix Rstress having diagonal 1 and off-diagonal 0.8. Set Rnew = 0.9R + 0.1Rstress and Σnew = D Rnew D. Check symmetry and nonnegative eigenvalues before solving. A convex combination of valid correlation matrices remains valid.',
        ),
        p(
          'Expected returns and correlations are estimates. Report the sensitivity of the recommendation rather than implying that one set of weights is known precisely.',
        ),
      ),
    ],
  },
  'reinforcement-learning': {
    definition: 'Reinforcement learning learns a sequence of choices by observing what happens after each action. It estimates which action is worthwhile in each situation from later rewards or costs. Those estimates depend on what the reward includes and how closely the simulator or past data match the real setting.',
    financialProblem:
      'A trading desk must buy a requested number of shares before a deadline. Buying quickly can move the price; waiting can reduce immediate cost but leave too few shares purchased. A useful policy must balance these effects and the cost of an incomplete order.',
    available:
      'At each decision the state describes what is known now: time left, shares still needed, the gap between buy and sell prices, recent trading volume, price variability, and recent price movement. A simulator or suitable historical policy data is needed to test how choices play out.',
    costs:
      'Trading too quickly can move prices against the order; waiting can let prices rise or leave shares unfilled at the deadline. A simulator that omits fees, price impact, or unfinished orders can reward a strategy that would perform poorly in real trading.',
    decision:
      'At each moment choose how many shares to buy or how aggressively to trade. Evaluate the whole sequence against a clear rule such as equal purchases over equal time intervals, using the same orders, market conditions, costs, and completion requirement.',
    baseline:
      'Time-weighted average price (TWAP): divide an order into equal portions and submit one at each equal time interval. If reliable trading-volume information exists, also compare with volume-weighted or adaptive rules.',
    intuition:
      'An action has an immediate result and changes what can happen next. Q-learning keeps an estimate, called a Q-value, of the total reward expected from taking an action now and continuing afterward. After observing a reward, it nudges that estimate toward a target made from the immediate reward plus a discounted estimate of the best next action. The estimate is only as meaningful as the rewards and simulator behind it.',
    useWhen: [
      'Decisions are sequential and affect later options.',
      'Rewards can represent the intended costs and completion requirement.',
      'A credible simulator or sufficiently informative logged policy data exists.',
      'Offline evaluation and hard limits can be enforced.',
    ],
    avoidWhen: [
      'A one-shot supervised prediction or simple policy solves the problem.',
      'No defensible reward can be defined.',
      'Exploration could harm customers or markets.',
      'Regime changes outpace validation, or logged data cannot support evaluation of the proposed actions.',
    ],
    question:
      'Does the score include trading costs and the cost of shares left unbought? What evidence would show that the practice simulator is close enough to the real trading situation?',
    defenseQuestions: [
      'Does the learning score count trading costs and any shares left unbought? Name a simple schedule to compare against and explain why both schedules need the same order, price path, and costs.',
      'Could a policy have a lower average cost but occasionally leave many shares unfilled or suffer a large loss? Name a measure that would reveal a bad outcome, and explain why the practice simulator may miss it.',
    ],
    method: [
      section(
        'Define the decision process',
        table(
          ['Part of the problem', 'What it means for a buy order'],
          [
            ['State: what is known now', 'Time left, shares still needed, buy/sell price gap, volume, volatility, and recent price movement'],
            ['Action: what can be chosen', 'Shares to buy now or one allowed trading pace'],
            ['Reward: score after acting', 'A score that includes fees, price impact, and the consequence of leaving shares unfilled'],
            ['Policy: the choice rule', 'A rule that uses the current situation to choose the next action'],
            ['Environment: what happens next', 'A historical replay or a described simulator that supplies the next situation and reward'],
          ],
        ),
        p(
          'Test whether the score accidentally rewards waiting too long, leaving shares unfilled, or taking advantage of a shortcut in the simulator. If the desk wants to avoid unusually costly outcomes, measure or penalize those outcomes explicitly; average reward alone does not represent tail risk.',
        ),
      ),
      section(
        'The Q-learning update',
        math(
          String.raw`Q(s_t,a_t)\leftarrow Q(s_t,a_t)+\alpha\left[r_t+\gamma\max_aQ(s_{t+1},a)-Q(s_t,a_t)\right]`,
          'Start with the old Q-value for action a in the current situation s. The bracket is the update error: immediate reward r plus the discounted best Q-value available in the next situation, minus the old estimate. Multiply that gap by learning rate α and add it to the old estimate. A small α changes the estimate gradually; γ determines how much future reward counts. If the sequence ends now, there is no next action and the future-value term is zero. Q-values use reward units; they are not probabilities or guaranteed trading results.',
          [
            { symbol: 'Q(s_t,a_t)', meaning: 'The estimated long-run reward for taking action a in the current situation s at time t.' },
            { symbol: 'α', meaning: 'Learning rate: the fraction of the update gap added to the old estimate.' },
            { symbol: 'r_t', meaning: 'Immediate reward observed after the action; a cost may be represented as a negative reward.' },
            { symbol: 'γ', meaning: 'Discount factor: how much the estimated future reward counts.' },
            { symbol: 's_{t+1}', meaning: 'The next situation after taking the action.' },
            { symbol: 'max_a Q(s_{t+1},a)', meaning: 'The largest estimated value among actions allowed in the next situation.' },
            { symbol: 'a_t', meaning: 'The action taken at time t.' },
          ],
        ),
        p(
          'The learning rate α controls the update size; the discount factor γ reduces the influence of rewards farther in the future. Exploration tries an allowed action to learn what follows; exploitation chooses the action with the highest current estimate. For trading, this learning and testing belongs in an offline or tightly controlled environment before any live use.',
        ),
      ),
    ],
    worked: [
      section(
        'Keep the simulator units explicit',
        p(
          'A planning example can buy 1,000 shares over ten intervals; TWAP buys 100 each interval. A 10,000-share example is a separate scale. The browser lab uses a small discrete inventory simulation, so its inventory units and costs should not be interpreted as a calibrated market model.',
        ),
        p(
          'The lab adds inventory-weighted random noise whose average is zero. Randomness alone does not make a policy that maximizes average reward avoid variability: if two choices have the same average reward, it needs an explicit risk penalty to prefer the steadier one. Try several random seeds and do not describe a reward change as risk control unless the reward or evaluation actually measures risk.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Compare policies across scenarios',
        list(
          'Calculate the policy’s order cost and TWAP’s cost using the same benchmark, fees, and treatment of unfilled shares.',
          'Across several random runs, report total benchmark cost, the most expensive outcomes, the share of the order completed, and any rule violations.',
          'Test different price variability and trading activity, including quiet markets where few shares are available to trade.',
          'Review the sequence of choices to find cases where the policy improves its score by delaying or leaving work unfinished.',
          'Keep tests of different training rewards separate from tests of market conditions; otherwise it is unclear what caused a change.',
          'Before any live use, run the policy alongside the existing process without letting it place orders, and compare what it would have done.',
        ),
      ),
    ],
  },
  'monte-carlo': {
    definition: 'Monte Carlo simulation repeats a calculation many times, each time using a different random draw from stated assumptions. The collection of results shows what the model predicts could happen and how often. It does not show that the assumptions are true or that any one outcome is certain.',
    financialProblem:
      'A lender wants to estimate the range of credit losses across possible futures and how often losses might exceed money set aside to cover them.',
    available:
      'For each loan: the chance it defaults over a defined period, the amount owed, and the fraction likely to be lost if it defaults. The model also needs an assumption about whether borrowers can default together.',
    costs:
      'If the model understates unusually large losses, the reserve may be too small; if it overstates them, money may be held back unnecessarily. Running more trials reduces random sampling noise but cannot fix inaccurate default chances or assumptions about borrowers failing together.',
    decision:
      'Estimate the average loss, the losses near the high end of the range, and the fraction of modeled outcomes above the reserve. Then vary the assumptions to learn which ones drive the result.',
    baseline:
      'For each loan, multiply its probability of default (PDᵢ), amount owed when default happens (exposure at default, EADᵢ), and fraction lost (loss given default, LGDᵢ), then add across loans. This estimates average loss without requiring defaults to be independent. Multiplying averages is only valid when the inputs meet the needed assumptions.',
    intuition:
      'Create many possible outcomes from the assumptions: draw which events occur, calculate the loss in each trial, and compare the results. The result describes what follows if the assumptions are reasonable; it does not verify them.',
    useWhen: [
      'Uncertain inputs propagate through a defined financial model.',
      'Tail loss, reserve breaches, or path dependence matters.',
      'Sensitivity and scenario comparisons can guide the decision.',
      'Input and dependence assumptions can be documented and checked.',
    ],
    avoidWhen: [
      'The underlying model is not credible.',
      'Input distributions have no supporting evidence.',
      'A closed-form answer already resolves the question.',
      'Important tail events are omitted or too rarely sampled to estimate reliably.',
    ],
    question:
      'If results vary from one batch of trials to another, is that random sampling noise or a wrong assumption? What can happen to the largest losses when borrowers tend to default together?',
    defenseQuestions: [
      'When two runs give different reserve-breach percentages, how can you tell whether that is random sampling wobble or a changed assumption? What happens to the largest losses if borrowers can default together?',
      'Would one million simulations make the answer trustworthy if the default chances or the assumption about borrowers failing together were wrong? Explain what more trials can and cannot fix.',
    ],
    method: [
      section(
        'Build a loss distribution',
        list(
          'State each loan’s default chance, amount owed, fraction lost after default, and whether loans may default together.',
          'Draw one complete possible outcome for the whole portfolio.',
          'Calculate the dollar loss in that outcome using the same loss rule for every loan.',
          'Repeat with new random draws to make many separate trial outcomes.',
          'Summarize the average loss, high-loss cutoffs, reserve overruns, and how much these estimates vary across trials.',
        ),
        p(
          'For a simple case, calculate average loss directly and compare it with the simulation average. With more independent trials, the simulation estimate usually wiggles less around the model’s answer. This improves numerical precision for those assumptions; it does not make the assumptions more accurate.',
        ),
      ),
      section(
        'Correlation changes the tail',
        p(
          'Keep each borrower’s individual default chance the same. If defaults are independent, one borrower’s trouble tells us nothing about another’s. If defaults are positively related, shared conditions can make many borrowers fail in the same trial. The average loss can stay similar while the range widens and very large portfolio losses become more common.',
        ),
        math(
          String.raw`Z_i=\sqrt{\rho}\,Y+\sqrt{1-\rho}\,\varepsilon_i,\qquad D_i=\mathbf1[Z_i<\Phi^{-1}(PD_i)]`,
          'This example creates a risk signal for loan i from two pieces: a shared economic factor Y and a loan-specific random value εᵢ. The share ρ controls how strongly the shared factor matters. Convert the signal to a default when it falls below the cutoff for that loan’s default probability PDᵢ. Loans in one trial share Y, which lets them default together; each new trial gets new random values. This is one modeling assumption, not a claim about the true cause of defaults.',
          [
            { symbol: 'Z_i', meaning: 'The simulated risk signal for loan i before checking whether it defaults.' },
            { symbol: 'ρ', meaning: 'A number from 0 to 1 controlling how strongly loans share the common factor.' },
            { symbol: 'Y', meaning: 'The random economic condition shared by loans in one simulation trial.' },
            { symbol: 'ε_i', meaning: 'Random variation specific to loan i.' },
            { symbol: 'D_i', meaning: 'An indicator equal to 1 if loan i defaults in this trial and 0 otherwise.' },
            { symbol: 'PD_i', meaning: 'The supplied default probability for loan i.' },
            { symbol: 'Φ⁻¹', meaning: 'A function that converts a probability cutoff to the matching point on the standard-normal scale.' },
          ],
        ),
        p(
          'Y and each εᵢ are independent random values on the standard-normal scale. The loans in the same trial share Y but receive their own εᵢ; a new trial draws a new shared factor. This introduces co-movement while keeping the individual default cutoffs tied to PDᵢ.',
        ),
      ),
    ],
    worked: [
      section(
        'Compare reserve scenarios',
        p(
          'Run the same portfolio through 10,000 modeled trials. Compare average loss, the loss cutoff exceeded in about 5% and 1% of trials, and the fraction above the reserve. Repeat after changing only the assumption about whether defaults move together.',
        ),
        p(
          'When losses can take only particular dollar values, state how tied values are ranked and exactly which outcomes count in the high-loss average. The simulated cutoff and tail average depend on the model and random trials; they are not guarantees.',
        ),
      ),
    ],
    evaluation: [
      section(
        'Check convergence and assumptions',
        list(
          'Check a small case whose answer can be calculated directly.',
          'Run more trials and see whether the average, reserve-overrun fraction, and high-loss estimates settle down.',
          'Change default chances, loss fractions, balances, and co-movement assumptions one at a time, then test combinations.',
          'Where reliable past portfolio outcomes exist, compare the model’s predictions with them.',
          'Keep uncertainty about input estimates separate from the random variation between modeled trials.',
        ),
        p(
          'Do not present a result such as $327,418 as exact when default chances, loss fractions, and co-movement are rough estimates. Round sensibly and show how the answer changes across plausible assumptions.',
        ),
      ),
    ],
  },
};

export function applyAlgorithmLessons(course: any) {
  for (const a of course.algorithms) {
    const copy = algorithmLessons[a.slug];
    if (!copy) throw new Error(`Missing algorithm lesson: ${a.slug}`);
    if (!copy.definition) throw new Error(`Missing authored definition: ${a.slug}`);
    for (const key of [
      'financialProblem',
      'baseline',
      'definition',
      'intuition',
      'useWhen',
      'avoidWhen',
    ] as const)
      if (copy[key] !== undefined) a[key] = copy[key];
    a.definition = copy.definition;
    a.lesson = {
      available: copy.available,
      costs: copy.costs,
      decision: copy.decision,
      method: copy.method,
      worked: copy.worked,
      evaluation: copy.evaluation,
    };
    a.defenseQuestions = a.defenseQuestions.map((q: any, i: number) => ({
      ...q,
      text:
        copy.defenseQuestions?.[i]
          ? copy.defenseQuestions[i]
          : i === 0
          ? copy.question
          : q.text
              .replace('a 0.7-point AUC gain', 'an AUC increase from 0.800 to 0.807')
              .replace(/prove that/gi, 'test whether'),
    }));
  }
}
