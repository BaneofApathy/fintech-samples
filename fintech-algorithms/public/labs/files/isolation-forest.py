import numpy as np
from sklearn.ensemble import IsolationForest
# Use a fixed seed so both rankings use the same fictional transactions.
rng = np.random.default_rng(12)
normal = np.c_[rng.lognormal(3.2,.5,1000),rng.normal(14,3,1000),
    rng.poisson(2,1000),rng.normal(0,1,1000)]
anomaly = np.array([[4500,3,18,8],[2800,2,22,11],[15,4,35,9],
    [9000,13,1,0],[3200,23,16,7]])
X = np.vstack([normal, anomaly])
# Contamination sets a flagging cutoff; score order is checked separately.
iso = IsolationForest(n_estimators=80, contamination=.01, random_state=12)
iso.fit(X)
# sklearn scores lower for isolated rows, so reverse the sign for ranking.
score = -iso.score_samples(X)
# Compare the first ten rows selected by score with the planted examples.
top = np.argsort(score)[-10:][::-1]
print("Top 10 indices:", top)
print("Synthetic anomaly yield@10:", (top >= len(normal)).mean())
# Use the same ten-row capacity for the simple amount-only rule.
rule = np.argsort(X[:,0])[-10:]
print("Amount-rule yield@10:", (rule >= len(normal)).mean())
print("Flagged by contamination cutoff:", int((iso.predict(X) == -1).sum()))
