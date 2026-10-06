from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, brier_score_loss
X, y = make_classification(n_samples=3000, n_features=20,
    n_informative=10, weights=[.92, .08], flip_y=.01, random_state=21)
Xtr, Xte, ytr, yte = train_test_split(
    X, y, test_size=.30, stratify=y, random_state=21)
models = {
 "logit": make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000)),
 "boost": HistGradientBoostingClassifier(max_iter=100,
    learning_rate=.05, max_leaf_nodes=15, random_state=21)
}
for name, m in models.items():
    m.fit(Xtr, ytr)
    p = m.predict_proba(Xte)[:, 1]
    print(name, "AUC:", roc_auc_score(yte,p), "Brier:", brier_score_loss(yte,p))
