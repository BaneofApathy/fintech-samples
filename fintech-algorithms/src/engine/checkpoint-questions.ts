export interface CheckpointQuestion {
  q: string;
  choices: [string, string, string];
  answer: number;
  explanation: string;
}
const question = (
  q: string,
  choices: [string, string, string],
  explanation: string,
): CheckpointQuestion => ({ q, choices, answer: 0, explanation });

export const checkpointQuestions: Record<string, CheckpointQuestion[]> = {
  'logistic-regression': [
    question(
      'A loan model estimates a 10% chance of default during the defined loan period. What else does the lender need before deciding whether to review the application?',
      [
        'The costs and effects of reviewing versus passing the loan',
        'Whether the probability is above the conventional 50% cutoff',
        'Whether 10% is above the average prediction in the training set',
      ],
      'The probability estimates an outcome; it does not include what review costs, whether review changes the outcome, or how many cases staff can handle. Those costs and operating limits determine the policy cutoff. A 50% cutoff is not automatically best.',
    ),
    question(
      'Which input would give an application-time model information that was not available when the lender had to make its decision?',
      [
        'A collection action recorded after the loan was issued',
        'The applicant’s debt-to-income ratio at application time',
        'A delinquency recorded before the application',
      ],
      'A collection action happens after a loan is issued, so it could not have been known at application time. Training with it leaks future information into the past and makes test results look better than a real application-time model could achieve.',
    ),
    question(
      'The model assigns about a 20% default chance to a large group of loans, but only about 5% of that group defaults during the stated period. What should you check?',
      [
        'Calibration over the relevant population and time period',
        'The sign of every positive logistic coefficient',
        'Whether the classification threshold is exactly 20%',
      ],
      'Calibration checks whether predicted chances match observed rates. In this group, a 20% estimate paired with a 5% observed rate suggests the probabilities may be too high for this population or period. Moving the action cutoff changes who is reviewed; it does not repair the probability estimates.',
    ),
  ],
  'trees-and-forests': [
    question(
      'A tree split makes the training groups less mixed by fraud label. What does that tell you, and what still needs to be checked?',
      [
        'The child groups are less mixed on those training records',
        'The forest’s estimated chances match observed fraud rates',
        'The split will reduce loss on the next month’s transactions',
      ],
      'Gini impurity describes how mixed the groups used to build the tree are. A reduction means those training groups became more uniform. It does not show whether the pattern will hold for later payments, whether a stated 60% chance happens about 60 times in 100 similar cases, or whether using the split saves money; check those separately on later data.',
    ),
    question(
      'A small change in the training examples makes one tree give very different scores. Why can combining a forest of trees help, and what does it not guarantee?',
      [
        'Combining trees trained on different samples can soften one tree’s jumpy scores',
        'Every tree in a forest is fitted to exactly the same rows and features',
        'Averaging trees removes the need for held-out evaluation',
      ],
      'A forest trains trees on different resampled records and subsets of inputs, then combines their scores. If one tree reacts strongly to a few examples, the others can soften its influence. This can make results less jumpy when the training sample changes, but later transactions still need a separate test.',
    ),
    question(
      'Investigators can review at most 100 alerts each day. Which comparison tells them what each model would find within that fixed workload?',
      [
        'Compare frauds found and precision within each model’s top 100 alerts',
        'Compare overall accuracy with every transaction weighted equally',
        'Compare the number of leaves in the fitted models',
      ],
      'For each model, take its 100 highest-ranked alerts, count how many are confirmed fraud, and divide that count by 100 to get precision in the actual queue. Comparing the fraud counts and precision at the same review limit matches the team’s capacity; an overall score across every transaction does not tell what the 100-person queue contains.',
    ),
  ],
  'gradient-boosting': [
    question(
      'A team lowers the learning rate and trains the boosted model again. What may change besides the size of each correction?',
      [
        'The sizes of updates and the later trees learned during training',
        'Only the final probability threshold, with all fitted trees unchanged',
        'Only the number of input features',
      ],
      'Each later tree is trained using the errors left by earlier predictions. Changing the rate changes those predictions and can therefore change which corrections later trees learn. Multiplying already-fitted tree outputs by a new rate is only a hand calculation with the trees held fixed.',
    ),
    question(
      'Boosting ranks defaulting loans above repaying loans more often, but has a worse Brier score than logistic regression. What could that mean?',
      [
        'Ranking improved while probability accuracy may have worsened',
        'The two metrics must have been computed on different labels',
        'Higher AUC guarantees lower expected lending loss',
      ],
      'AUC asks whether cases that default tend to rank above cases that repay. The Brier score averages squared differences between predicted chances and actual 0-or-1 outcomes, so it checks probability accuracy. A model can rank better while its probabilities fit less well. Check calibration and the costs of decisions under the same policy before choosing.',
    ),
    question(
      'How can a lender make a fair test of whether boosting improves on logistic regression?',
      [
        'Use the same available features, held-out period and evaluation costs',
        'Give boosting a later test period with an easier class balance',
        'Choose the model with the best score after repeatedly tuning on the final test set',
      ],
      'Giving both models the same information, future test period, and cost assumptions makes the comparison about the method rather than an easier dataset. Keep the final test period untouched while tuning; repeatedly choosing settings based on it makes the reported result look better than a fresh future result may be.',
    ),
  ],
  'k-means': [
    question(
      'One account feature is monthly spending in dollars, while another is savings rate from 0 to 1. What should you check before asking K-means to group these accounts?',
      [
        'Feature scaling and the meaning of distance between customers',
        'Whether every customer has a known fraud label',
        'Whether cluster numbers are already in alphabetical order',
      ],
      'K-means decides which accounts are near by measuring distances. Dollar values may have much larger numbers than rates, so spending could dominate even if savings is equally important to the question. Choose units or scaling that reflect the intended similarity; making numbers small by itself does not make the distance meaningful.',
    ),
    question(
      'After a rerun, the software swaps group labels A and B but every account stays with the same accounts as before. What does this say about the grouping?',
      [
        'The same grouping, after accounting for arbitrary names',
        'Zero agreement because the displayed labels changed',
        'A different customer population because the seed changed',
      ],
      'The grouping is unchanged: the letters A and B are arbitrary labels and can switch between runs. Compare which accounts stay together, not the displayed group numbers. An adjusted Rand index (ARI) is one score that compares those pairings while ignoring the label names.',
    ),
    question(
      'If each customer becomes their own group, the distance from each customer to their center is zero. Why is that not enough reason to use one group per customer?',
      [
        'Compactness alone does not establish a useful or stable segmentation',
        'A valid clustering is required to have positive inertia',
        'K-means can only fit two clusters',
      ],
      'Inertia adds squared distances from customers to their group centers, so creating more groups usually lowers it; one group per customer makes it zero by construction. That does not reveal useful customer patterns. Choose a grouping that is stable and adds a clear distinction for a tested service decision.',
    ),
  ],
  'isolation-forest': [
    question(
      'A transaction receives an anomaly score of 0.8. What can you conclude from that number alone?',
      [
        'It is relatively easy to isolate under the model’s scoring convention',
        'It has an 80% probability of being fraud',
        'It should always be declined automatically',
      ],
      'A score of 0.8 means the transaction is relatively easy to isolate under the model’s scoring convention. The decimal is not a percentage: it does not say there is an 80% chance of fraud. A probability needs outcome data and a calibrated probability model; an action also needs a policy and evidence about the consequences.',
    ),
    question(
      'A legitimate seasonal payment is flagged repeatedly. What is the most useful next check?',
      [
        'Inspect whether the reference data represents that seasonal behavior',
        'Treat every previously unseen payment as confirmed fraud',
        'Increase review volume until all transactions are flagged',
      ],
      'The model calls behavior unusual when it differs from the examples used to build its reference. Check whether the reference period included that seasonal payment pattern. If it did not, legitimate customers may be flagged repeatedly; the flag is a reason to review the model and case, not proof of fraud.',
    ),
    question(
      'How should you compare an anomaly queue with a simple amount rule?',
      [
        'Review the same number of highest-ranked cases and compare outcomes',
        'Compare raw anomaly scores with dollar amounts directly',
        'Use training accuracy without obtaining any outcome labels',
      ],
      'Send the same number of cases from each method for review, then compare how many were confirmed, what each method missed, and how much staff time it used. Matching the review limit makes the comparison fair: a method should not look better just because it sent more cases to investigators.',
    ),
  ],
  'time-series': [
    question(
      'How should you evaluate a forecast that will be used on future settlement days?',
      [
        'Train on earlier observations and evaluate later periods in time order',
        'Randomly mix observations from every date before each split',
        'Normalize the full series using future test outcomes before training',
      ],
      'For each test date, fit using only dates before it and compare the forecast with the later outcome. This recreates what treasury could know at decision time and prevents future values from leaking into the forecast.',
    ),
    question(
      'Daily outflows have strong weekly seasonality. Which simple baseline is useful?',
      [
        'Predict from the corresponding day of the previous week',
        'Use the average of the future test week',
        'Use the actual outflow after it has arrived',
      ],
      'A seasonal-naive forecast copies the same weekday from the last fully observed week. It uses a known repeating pattern without looking at the future test week, making it a useful simple comparison.',
    ),
    question(
      'One model has lower MAE but misses large holiday peaks. What should treasury compare next?',
      [
        'Underforecast costs, peak-period errors and interval coverage',
        'Only the overall MAE, because it already prices cash shortages',
        'Only how many model parameters each forecast uses',
      ],
      'Mean absolute error tells how far forecasts are from actual values on average, but it treats an overforecast and an underforecast of the same size equally. Treasury should also compare shortage risk, holiday-peak errors, and whether its uncertainty ranges capture actuals.',
    ),
  ],
  'graph-methods': [
    question(
      'Two accounts share a device. What does that relationship establish?',
      [
        'They are connected by the observed device relationship',
        'Both accounts have committed fraud',
        'A payment must have flowed directly between the accounts',
      ],
      'The graph says that the two accounts are connected through the recorded device link. Check how device sharing is defined and whether the match is reliable; people may legitimately share a household device. The relationship alone does not show a transfer or prove fraud.',
    ),
    question(
      'Which graph construction leaks future information into an earlier fraud decision?',
      [
        'Including relationships first observed after that decision',
        'Using an address already recorded at account opening',
        'Counting neighbors known at the scoring timestamp',
      ],
      'At each decision date, build the graph only from links already recorded by then. Adding a link first observed later gives the earlier model information it could not have had and makes the historical test unfair.',
    ),
    question(
      'How can you test whether graph features add useful signal?',
      [
        'Compare matched held-out predictions with and without those features',
        'Assume the highest-degree node is fraud',
        'Compare the drawing’s visual density with the tabular row count',
      ],
      'Use the same held-out accounts, time period, outcome, and review limit for both versions. Then the comparison isolates whether the graph features add useful information instead of mixing their effect with a different population or task.',
    ),
  ],
  transformers: [
    question(
      'A classifier labels “loss narrowed from $20M to $5M” as negative because of “loss.” What test helps expose the problem?',
      [
        'Evaluate contrasting phrases where context changes the sentiment',
        'Delete every occurrence of “loss” from future inputs',
        'Measure only whether the word “loss” appears in training',
      ],
      'Compare carefully labeled sentences that differ in context, such as “loss narrowed” and “loss widened.” This checks whether the model uses the phrase meaning rather than reacting only to the word “loss.”',
    ),
    question(
      'Neutral statements dominate a sentiment dataset. Which report can reveal a failed negative class?',
      [
        'Per-class scores and macro-F1 alongside the aggregate result',
        'Only overall accuracy',
        'Only the average length of the statements',
      ],
      'Report precision, recall, and F1 for each sentiment label so a weak negative class cannot hide behind the common neutral label. Macro-F1 averages the class F1 scores equally, regardless of how many examples each class has.',
    ),
    question(
      'What does the browser’s tiny TF-IDF sentiment example establish about FinBERT?',
      [
        'It provides a separate baseline; it does not measure FinBERT performance',
        'It reproduces the pretrained FinBERT model’s weights',
        'Its test accuracy is a benchmark for all financial text',
      ],
      'The browser’s small TF-IDF model is a separate linear baseline that counts weighted word patterns. It does not contain FinBERT’s pretrained transformer weights, so only the native FinBERT example can show that model’s behavior. Compare them on a suitable, labeled financial test set.',
    ),
  ],
  rag: [
    question(
      'The correct filing passage is retrieved, but the answer invents a number. Which stage should the test isolate?',
      [
        'Answer generation and its use of the retrieved evidence',
        'Only whether the retriever returned any passage',
        'Only the speed of document loading',
      ],
      'Retrieval only selects passages. The answer-writing stage can still invent a number, so test whether the claim appears in and follows from the passage that is cited.',
    ),
    question(
      'No retrieved passage supports the requested revenue figure. What should the system do?',
      [
        'Abstain or request supporting evidence',
        'Use the number from the most similar-looking unrelated passage',
        'Treat the top cosine score as the missing revenue figure',
      ],
      'A high similarity score only says a passage ranked near the question. It cannot replace a revenue figure that is missing from the retrieved evidence. The system should ask for a source or say it cannot answer from the available passages.',
    ),
    question(
      'A correct profit figure is followed by a citation to a debt passage. Which check fails?',
      [
        'Citation correctness',
        'Numerical accuracy of that profit figure',
        'Whether the claim appears in grammatical prose',
      ],
      'The profit number might happen to be right, but a passage about debt does not support that claim. Check numerical accuracy and citation support separately; a valid answer needs both.',
    ),
  ],
  optimization: [
    question(
      'Four assets must sum to 100%, and each is capped at 20%. What happens?',
      [
        'The constraints are infeasible because total permitted weight is only 80%',
        'The solver should silently ignore one cap',
        'A sufficiently large expected return makes the constraints feasible',
      ],
      'Feasibility is determined by the constraints. Better objective values cannot repair an impossible allocation.',
    ),
    question(
      'A small change in expected returns completely changes the optimal weights. What should you examine?',
      [
        'Sensitivity to uncertain inputs and whether a more robust allocation is needed',
        'Whether the original weights guarantee realized returns',
        'Only the number of decimal places printed by the solver',
      ],
      'Expected returns are estimates, so small changes can move the selected weights. Recalculate under several plausible inputs and report how much the allocation changes; one optimized answer does not establish that its weights or future return are certain.',
    ),
    question(
      'Which is a fair comparison with an optimized portfolio?',
      [
        'A feasible baseline evaluated with the same returns, costs and constraints',
        'An unconstrained baseline with transaction costs omitted only for it',
        'The optimizer’s training objective compared with an unrelated asset’s return',
      ],
      'Use a baseline that can meet the same rules and calculate its return, risk, and costs with the same inputs. Then differences reflect the allocation choices, not easier constraints or missing costs.',
    ),
  ],
  'reinforcement-learning': [
    question(
      'An execution agent appears cheap because it leaves most of the order unfilled. What is missing?',
      [
        'Completion requirements and the cost of unfinished inventory',
        'A larger display precision for the reward',
        'A guarantee that every negative reward is a failure',
      ],
      'If the reward counts trading cost but does not penalize leaving required shares unfilled, waiting forever can look cheap. Include the completion target and a defensible consequence for missing it, then compare policies on both cost and completion.',
    ),
    question(
      'How should an execution policy be compared with TWAP?',
      [
        'Use matched orders, market scenarios, completion rules and cost components',
        'Give TWAP harder orders and count fewer costs for the learned policy',
        'Compare the learned policy’s training reward with TWAP’s live loss directly',
      ],
      'Give the learned policy and TWAP the same orders, price paths, deadline, fee rules, and completion requirement. Then compare average cost, expensive tail outcomes, and the shares each policy actually filled. This lets the comparison reflect policy behavior instead of easier test conditions.',
    ),
    question(
      'A Q-learning transition ends the episode. What is its update target?',
      [
        'The immediate reward, with no future-value term',
        'The immediate reward plus the highest value from an unrelated next episode',
        'Zero regardless of the terminal reward',
      ],
      'A terminal transition ends the decision sequence. There is no next action to estimate, so the target is the immediate reward alone; adding a next-state value would count a future event that cannot happen in this episode.',
    ),
  ],
  'monte-carlo': [
    question(
      'You run four times as many independent trials, and the estimated breach frequency stays the same. What happens to the estimate’s typical random wobble (standard error)?',
      ['It is about half as large', 'It is about one quarter as large', 'It disappears completely'],
      'Standard error describes how much an estimate typically changes just because a new random set of trials was drawn. It shrinks roughly as 1 divided by the square root of trial count, so four times as many trials makes the wobble about half as large, not zero.',
    ),
    question(
      'The model assumes borrowers default together less often than they really do, but you run one million simulations. What has improved?',
      [
        'Precision of the estimate under the wrong model, not the correlation assumptions',
        'The correctness of the correlation assumptions',
        'The guarantee that no reserve breach can occur',
      ],
      'Many trials make the answer more precise for the model you supplied. They do not correct its inaccurate assumption about how borrowers’ defaults move together, so its real-world answer can still be wrong.',
    ),
    question(
      'Two models keep each loan’s default chance and loss the same, but one makes defaults more likely to happen together. What may change?',
      [
        'The portfolio loss tail even when expected total loss stays the same',
        'Expected total loss must double whenever correlation increases',
        'Dependence cannot affect the distribution of portfolio loss',
      ],
      'The average expected loss can stay the same because each loan’s chance and loss are unchanged. But if defaults happen together more often, unusually large combined losses become more common. Dependence affects the high-loss tail even when the average does not move.',
    ),
  ],
};
