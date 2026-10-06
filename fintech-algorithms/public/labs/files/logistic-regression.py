from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, brier_score_loss
# Generate fictional examples; the positive label is the event being estimated.
X, y = make_classification(n_samples=5000, n_features=8,
    weights=[0.90, 0.10], class_sep=1.1, random_state=7)
# Hold back 30% for evaluation and preserve the outcome mix in both groups.
Xtr, Xte, ytr, yte = train_test_split(
    X, y, test_size=.30, stratify=y, random_state=7)
# Learn input scaling from training rows, then fit the probability model.
model = make_pipeline(StandardScaler(),
    LogisticRegression(C=1.0, max_iter=2000))
model.fit(Xtr, ytr)
# Evaluate only on held-back rows; ranking and probability error differ.
pd_hat = model.predict_proba(Xte)[:, 1]
print("ROC-AUC:", roc_auc_score(yte, pd_hat))
print("Brier:", brier_score_loss(yte, pd_hat))
print("Baseline Brier:", brier_score_loss(yte, ytr.mean() * __import__('numpy').ones(len(yte))))
print("First five PDs:", pd_hat[:5].round(3))
