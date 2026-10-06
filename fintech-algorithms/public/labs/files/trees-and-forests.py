from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score
X, y = make_classification(n_samples=2000, n_features=12,
    n_informative=7, weights=[.97, .03], random_state=11)
Xtr, Xte, ytr, yte = train_test_split(
    X, y, stratify=y, test_size=.30, random_state=11)
print("Random-ranking baseline AP:", yte.mean())
models = {
 "tree": DecisionTreeClassifier(max_depth=5, random_state=11),
 "forest": RandomForestClassifier(n_estimators=80,
    max_depth=10, class_weight="balanced", n_jobs=1, random_state=11)
}
for name, model in models.items():
    model.fit(Xtr, ytr)
    p = model.predict_proba(Xte)[:, 1]
    print(name, "Average precision:", average_precision_score(yte, p))
    top = p.argsort()[::-1][:20]
    print(name, "Precision@20:", yte[top].mean())
