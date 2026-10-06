/** Illustrative reasoning, not a prefilled answer or a claim about a learner's run. */
export const defenseExamples: Record<
  string,
  { decision: string; evidence: string; limit: string }
> = {
  'logistic-regression': {
    decision:
      'I would use the estimated default probability to prioritize loan review, with a review threshold chosen from explicit loss and review-cost assumptions.',
    evidence:
      'I would compare the model’s Brier score with the constant-risk baseline on the same held-out applicants, then inspect calibration before using the probabilities.',
    limit:
      'A high ROC-AUC alone cannot justify a threshold. These synthetic features do not show that the model is suitable for real applicants.',
  },
  'trees-and-forests': {
    decision: 'I would rank transactions for a review team with a fixed daily capacity.',
    evidence:
      'I would compare the tree and forest using average precision and precision at the actual queue size on the same test transactions.',
    limit:
      'If the positive rate or transaction population changes, a good test ranking may no longer provide the same review yield.',
  },
  'gradient-boosting': {
    decision:
      'I would consider boosting for a risk-ranking task if it improves the decision enough to justify its added complexity.',
    evidence:
      'I would compare its AUC and Brier score with logistic regression on the same held-out rows, then evaluate the intended cost threshold separately.',
    limit:
      'Repeated tuning on the test set would weaken this evidence. I would tune on validation data and reserve a final test set.',
  },
  'k-means': {
    decision: 'I would use clusters to propose customer segments for further investigation.',
    evidence:
      'I would compare silhouette across cluster counts and assignment stability across seeds, then inspect each segment’s feature profile.',
    limit:
      'Cluster numbers are arbitrary labels. Stable geometry alone does not prove that a segment supports a useful or fair business action.',
  },
  'isolation-forest': {
    decision: 'I would route unusually behaving transactions to a limited investigation queue.',
    evidence:
      'I would compare the top-ten planted-anomaly yield with the largest-amount rule at the same queue size.',
    limit:
      'The planted rows are unusual by construction. This yield is not an estimate of real fraud detection without reviewed outcome labels.',
  },
  'time-series': {
    decision:
      'I would use the forecast to plan capacity while retaining a buffer for forecast uncertainty.',
    evidence:
      'I would compare MAE with seasonal naive on the same dates and inspect how often the prediction interval covers observed demand.',
    limit:
      'One 28-day test window may miss regime changes. I would use rolling time windows and check that no future observations enter training.',
  },
  'graph-methods': {
    decision:
      'I would use shared entities to identify account groups that deserve further investigation.',
    evidence:
      'I would identify the actual common devices or merchants and inspect how removing a link changes the connected structure.',
    limit:
      'A shared merchant can be ordinary behavior. The graph has no fraud labels, so connectivity is evidence of a link, not proof of fraud.',
  },
  transformers: {
    decision: 'I would treat sentiment labels as a review aid for financial text.',
    evidence:
      'I would inspect class-specific errors and a phrase such as “loss fell,” alongside macro-F1, to test whether the model handles financial meaning.',
    limit:
      'This browser lab runs a tiny TF-IDF baseline. It does not establish the accuracy of FinBERT or performance on unseen financial documents.',
  },
  rag: {
    decision:
      'I would answer a disclosure question only when retrieved passages support the specific claim.',
    evidence:
      'I would inspect retrieval recall and context precision, then identify the passage supporting each sentence of a proposed answer.',
    limit:
      'Relevant retrieval does not guarantee a faithful answer. This lab does not generate answers or implement an automatic abstention policy.',
  },
  optimization: {
    decision: 'I would compare feasible allocations under an explicit return target and asset cap.',
    evidence:
      'I would check solver success, weights summing to one, the target return and each bound before comparing modeled volatility with equal weights.',
    limit:
      'The assumed returns and covariance matrix may be wrong. I would stress valid alternative inputs and consider turnover before changing allocations.',
  },
  'reinforcement-learning': {
    decision: 'I would compare an execution policy with TWAP while requiring the order to finish.',
    evidence:
      'I would report modeled cost, remaining inventory and the action sequence under the same impact and penalty assumptions.',
    limit:
      'A deterministic evaluation in one simulator does not establish market performance. I would evaluate many paths and test sensitivity to the reward design.',
  },
  'monte-carlo': {
    decision:
      'I would estimate how often portfolio loss breaches a planning limit and how severe tail losses could be.',
    evidence:
      'I would compare simulated mean loss with the analytical expectation and compare tail percentiles under different dependence assumptions.',
    limit:
      'A small simulation standard error does not validate the assumed default probabilities or dependence model.',
  },
  capstone: {
    decision:
      'I would begin with a clearly specified financial action, the information available before it, and the consequences of each error.',
    evidence:
      'I would compare a simple baseline and the proposed method on the same held-out data, with a measure tied to that decision and a recorded result.',
    limit:
      'I would state which data changes, missing evidence or failed checks would make me withhold the recommendation.',
  },
};
