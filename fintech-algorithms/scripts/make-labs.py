#!/usr/bin/env python3
from pathlib import Path
import json,textwrap,shutil
from datetime import datetime, timezone
from lab_content import LAB_CONTENT
ROOT=Path(__file__).resolve().parents[1]
course=json.loads((ROOT/'src/data/course.json').read_text());result={}
def code(s):return textwrap.dedent(s).strip()+'\n'
codes={
'logistic-regression':code('''
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
'''),
'trees-and-forests':code('''
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
'''),
'gradient-boosting':code('''
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
'''),
'k-means':code('''
import numpy as np
from sklearn.datasets import make_blobs
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, adjusted_rand_score
# Create fictional points; seed 9 controls the data, not the later rerun.
X, _ = make_blobs(n_samples=600, centers=4, n_features=5,
    cluster_std=[.7, 1.0, .8, 1.2], random_state=9)
# Put each feature on a comparable scale before measuring distance.
Z = StandardScaler().fit_transform(X)
# Try each group count on the same points; inertia falls as groups are added.
for k in range(2, 7):
    # Ten starts reduce dependence on one unlucky set of initial centers.
    km = KMeans(n_clusters=k, n_init=10, random_state=9)
    labels = km.fit_predict(Z)
    print(k, "Silhouette:", round(silhouette_score(Z, labels),3), "Inertia:", round(km.inertia_,1))
# Compare two four-group fits on the same points, changing only initialization.
segment = KMeans(n_clusters=4, n_init=10, random_state=9).fit_predict(Z)
rerun = KMeans(n_clusters=4, n_init=10, random_state=19).fit_predict(Z)
print("Seed stability ARI:", adjusted_rand_score(segment, rerun))
print("Segment counts:", np.bincount(segment))
'''),
'isolation-forest':code('''
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
'''),
'time-series':code('''
import numpy as np, pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_absolute_error
# Seed 4 makes this fictional trend, weekly cycle, and noise repeatable.
rng = np.random.default_rng(4)
t = np.arange(365)
y = 1000 + 1.1*t + 130*np.sin(2*np.pi*t/7) + rng.normal(0,45,365)
y = pd.Series(y,index=pd.date_range("2025-01-01",periods=365))
# Hold the final 28 dates back; fit using only earlier observations.
train,test = y.iloc[:-28],y.iloc[-28:]
model = SARIMAX(train,order=(1,1,1),seasonal_order=(1,0,1,7),
    enforce_stationarity=False).fit(disp=False,maxiter=50)
forecast = model.get_forecast(steps=28)
pred = forecast.predicted_mean
# MAE is the average absolute miss, in the series' original units.
print("MAE:", mean_absolute_error(test,pred))
# A simple reference repeats the last full training week four times.
seasonal_naive = np.tile(train.iloc[-7:].to_numpy(),4)
print("Seasonal naive MAE:",mean_absolute_error(test,seasonal_naive))
ci = forecast.conf_int().to_numpy()
# Coverage counts the share of test values inside their forecast intervals.
print("Interval coverage:", ((test.to_numpy()>=ci[:,0]) & (test.to_numpy()<=ci[:,1])).mean())
print(forecast.conf_int().tail())
'''),
'graph-methods':code('''
import networkx as nx
G = nx.Graph()
edges = [("acct_A","device_7"),("acct_B","device_7"),
    ("acct_A","merchant_X"),("acct_B","merchant_X"),
    ("acct_B","address_4"),("acct_C","address_4"),("acct_D","device_99")]
G.add_edges_from(edges)
components = sorted(nx.connected_components(G),key=len,reverse=True)
print("Largest component:",sorted(components[0]))
print("Degrees:",sorted(G.degree,key=lambda x:x[1],reverse=True))
print("A/B common neighbors:",len(list(nx.common_neighbors(G,"acct_A","acct_B"))))
print("PageRank:",{k:round(v,3) for k,v in nx.pagerank(G).items()})
print("Baseline: account-only graph has no edges and therefore no shared-device evidence.")
'''),
'transformers':code('''
# Comparison model: TF-IDF weights word counts; logistic regression selects one label.
# This is not FinBERT. The separate native/transformers.py download runs FinBERT.
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, classification_report
train = ["profit increased", "margin expanded", "revenue rose", "growth improved",
 "profit fell", "guidance withdrawn", "revenue declined", "loss widened",
 "scheduled debt payment", "report published", "meeting held", "filing submitted"]
labels = ["positive"]*4+["negative"]*4+["neutral"]*4
test_cases = [("profit rose", "positive"), ("margin improved", "positive"),
 ("guidance declined", "negative"), ("loss fell", "positive"),
 ("scheduled report published", "neutral"), ("meeting submitted", "neutral")]
test, truth = zip(*test_cases)
# C controls regularization: a smaller value discourages reliance on individual word patterns.
model = make_pipeline(TfidfVectorizer(),LogisticRegression(C=1.0,max_iter=500))
model.fit(train,labels)
pred = model.predict(test)
print("Macro-F1:",f1_score(truth,pred,average="macro"))
print(classification_report(truth,pred,zero_division=0))
print("Challenge:","loss fell", "prediction:",pred[3])
print("This tiny sample is for debugging, not evidence of finance-domain accuracy.")
'''),
'rag':code('''
# Offline TF-IDF retrieval baseline; no pretrained embedding model runs here.
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
chunks = ["No customer accounted for more than 10 percent of revenue.",
 "Interest expense increased because average debt was higher.",
 "A small number of distributors represent a material share of sales.",
 "The company maintains a revolving credit facility."]
question = "What customer concentration risk does the company disclose?"
relevant = {0, 2}
encoder = TfidfVectorizer(stop_words="english")
D = encoder.fit_transform(chunks)
q = encoder.transform([question])
scores = cosine_similarity(q,D)[0]
K = 2
top = scores.argsort()[::-1][:K]
hits = len(set(top) & relevant)
print(f"Retrieval Recall@{K}:", hits / len(relevant) if relevant else "undefined: no required passage is present")
print(f"Context precision@{K}:", hits / len(top))
for i in top: print("Passage", int(i+1), "score", round(float(scores[i]),3), chunks[i])
print("Answerability annotation:", "evidence is present" if relevant else "no supporting evidence in this collection")
print("This lab ranks passages. It does not generate an answer or automatically decide when to abstain.")
'''),
'optimization':code('''
import numpy as np
from scipy.optimize import minimize
# These decimal rates and matrix entries are supplied teaching assumptions, not historical estimates.
mu = np.array([.06,.08,.10,.04])
Sigma = np.array([[.040,.012,.018,.006],[.012,.055,.020,.008],
    [.018,.020,.090,.010],[.006,.008,.010,.025]])
# w @ Sigma @ w is modeled portfolio variance; its square root is volatility in return units.
def variance(w): return w @ Sigma @ w
target_return = .07
asset_cap = .50
constraints = [{"type":"eq","fun":lambda w:w.sum()-1},
    {"type":"ineq","fun":lambda w:w @ mu-target_return}]
# Every share must stay from 0 to 50%; first check that four caps can still fill 100%.
bounds = [(0,asset_cap)]*4
x0 = np.repeat(.25,4)
if len(mu) * asset_cap < 1:
    raise ValueError(f"Infeasible: {len(mu)} asset caps of {100*asset_cap:g}% allow only {100*len(mu)*asset_cap:g}% total allocation; the weights must sum to 100%.")
# SLSQP searches for a low-variance choice while respecting these rules; check its status.
result = minimize(variance,x0,method="SLSQP",bounds=bounds,constraints=constraints)
print("Feasible solve:",result.success,result.message)
if not result.success: raise ValueError("Solver did not find a feasible portfolio")
w = result.x
print("Weights:",w.round(3))
print("Return:",round(w @ mu,4))
print("Volatility:",round(np.sqrt(variance(w)),4))
print("Equal-weight volatility:",round(np.sqrt(variance(x0)),4))
print("Constraint checks:",abs(w.sum()-1)<1e-6,w @ mu >= target_return-1e-6,w.min()>=-1e-6,w.max()<=asset_cap+1e-6)
'''),
'reinforcement-learning':code('''
import numpy as np
rng = np.random.default_rng(5)
T,inventory0,actions = 10,10,np.array([0,1,2])
Q = np.zeros((T+1,inventory0+1,len(actions)))
alpha,gamma,eps = .15,.95,.20
impact_coefficient = .08
incomplete_penalty = 5.0
price_noise_sd = .10
for episode in range(2000):
    inv = inventory0
    for t in range(T):
        valid = np.where(actions<=inv)[0]
        a_idx = rng.choice(valid) if rng.random()<eps else valid[np.argmax(Q[t,inv,valid])]
        qty = actions[a_idx]
        impact = impact_coefficient*qty**2
        price_risk = rng.normal(0,price_noise_sd)*inv
        next_inv = inv-qty
        reward = -(impact+price_risk)
        if t==T-1: reward -= incomplete_penalty*next_inv
        next_valid = np.where(actions<=next_inv)[0]
        future = 0 if t==T-1 else Q[t+1,next_inv,next_valid].max()
        Q[t,inv,a_idx] += alpha*(reward+gamma*future-Q[t,inv,a_idx])
        inv = next_inv
policy,inv = [],inventory0
for t in range(T):
    valid = np.where(actions<=inv)[0]
    qty = actions[valid[np.argmax(Q[t,inv,valid])]]
    policy.append(int(qty));inv -= qty
cost = sum(impact_coefficient*q*q for q in policy)+incomplete_penalty*inv
print("Illustrative actions:",policy,"remaining:",int(inv))
print("Deterministic evaluation cost:",cost)
print("TWAP baseline cost:",T*impact_coefficient)
print("Reward:",-cost)
'''),
'monte-carlo':code('''
import numpy as np
from scipy.stats import norm
# Seed 17 repeats the random draws; each row below will be one possible portfolio outcome.
rng = np.random.default_rng(17)
n_sims,n_loans = 2500,1000
# PD is chance of default, EAD is amount owed, and LGD is the share lost after default.
pd = np.full(n_loans,.025)
ead = np.full(n_loans,10000.0)
lgd = np.full(n_loans,.45)
# rho controls a shared shock: positive values make defaults tend to occur together.
rho = .12
common = rng.normal(size=(n_sims,1))
idiosyncratic = rng.normal(size=(n_sims,n_loans))
latent = np.sqrt(rho)*common+np.sqrt(1-rho)*idiosyncratic
defaults = latent < norm.ppf(pd)
loss = (defaults*ead*lgd).sum(axis=1)
# Compare the simulated average with sum(PD × amount owed × lost share).
print("Expected loss:",loss.mean())
print("Analytical expected-loss baseline:",(pd*ead*lgd).sum())
print("95th percentile:",np.quantile(loss,.95))
print("99th percentile:",np.quantile(loss,.99))
breach = (loss>200000).mean()
print("P(loss > $200k):",breach)
print("Simulation SE:",np.sqrt(breach*(1-breach)/n_sims))
''')}

# Each edit identifies a unique code fragment and explains what to inspect.
edits = {
    'logistic-regression': [
        ('Make the positive outcome rarer', 'weights=[0.90, 0.10]', 'weights=[0.97, 0.03]', 'This creates a new sample with fewer positive outcomes. Check its new share before comparing the scores.'),
        ('Use stronger regularization', 'C=1.0', 'C=0.1', 'The smaller C applies a stronger penalty to large weights. Keep the sample and split fixed, then compare ranking and probability error.'),
        ('Create data with 12 inputs', 'n_features=8', 'n_features=12', 'The generator makes a new sample with more input columns; this does not add one controlled signal to the old sample.'),
        ('Remove input scaling', 'StandardScaler(),', '', 'Compare with the scaled model on the same split. Scaling changes the units used to fit inputs, not the outcomes.'),
    ],
    'trees-and-forests': [
        ('Increase tree depth', 'max_depth=5', 'max_depth=10', 'Compare average precision and Precision@20 with the depth-5 tree.'),
        ('Increase forest size', 'n_estimators=80', 'n_estimators=150', 'Compare average precision, top-20 yield, and run time.'),
        ('Require 20 rows per tree leaf', 'DecisionTreeClassifier(max_depth=5', 'DecisionTreeClassifier(min_samples_leaf=20, max_depth=5', 'Compare the single tree before and after limiting small leaves.'),
        ('Remove forest class weights', 'class_weight="balanced"', 'class_weight=None', 'Check whether average precision and Precision@20 change in the same direction.'),
    ],
    'gradient-boosting': [
        ('Increase learning rate', 'learning_rate=.05', 'learning_rate=.10', 'Compare AUC and Brier while keeping 100 boosting iterations.'),
        ('Reduce leaves per tree', 'max_leaf_nodes=15', 'max_leaf_nodes=7', 'Compare both scores against the unchanged logistic baseline.'),
        ('Increase class imbalance', 'weights=[.92, .08]', 'weights=[.97, .03]', 'Compare both models on the regenerated dataset and state its changed prevalence.'),
    ],
    'k-means': [
        ('Change rerun clustering seed', 'rerun = KMeans(n_clusters=4, n_init=10, random_state=19)', 'rerun = KMeans(n_clusters=4, n_init=10, random_state=29)', 'The generated data stays fixed; compare seed-stability ARI.'),
        ('Increase blob overlap', 'cluster_std=[.7, 1.0, .8, 1.2]', 'cluster_std=[1.7, 2.0, 1.8, 2.2]', 'Compare silhouette, inertia, and seed-stability ARI with the initial run.'),
    ],
    'isolation-forest': [
        ('Flag about 5% using contamination', 'contamination=.01', 'contamination=.05', 'Compare the number flagged by predict. The raw scores and top-ten ranking stay unchanged.'),
        ('Increase forest size', 'n_estimators=80', 'n_estimators=150', 'Compare top-ten indices and planted-anomaly yield with the 80-tree fit.'),
    ],
    'time-series': [
        ('Compare nonseasonal order (2,0,1)', 'order=(1,1,1)', 'order=(2,0,1)', 'Keep seasonal_order=(1,0,1,7) and the 28-day test period; inspect MAE, coverage, and convergence warnings.'),
        ('Double noise standard deviation', 'normal(0,45,365)', 'normal(0,90,365)', 'Compare MAE, interval endpoints, and covered days out of 28.'),
    ],
    'graph-methods': [
        ('Remove A’s merchant link', '("acct_A","merchant_X"),', '', 'Compare A/B common neighbors and connected components.'),
        ('Add a link after the decision cutoff', 'G.add_edges_from(edges)', 'G.add_edges_from(edges)\nG.add_edge("acct_C","device_99")', 'Inspect the component merger and explain why a late-recorded link is unavailable to an earlier decision.'),
    ],
    'transformers': [
        ('Use stronger regularization', 'C=1.0', 'C=0.1', 'Compare macro-F1 and individual sentence errors.'),
        ('Test negation with its label', '("profit rose", "positive")', '("profit did not rise", "neutral")', 'This exercise labels “did not rise” neutral because it does not state that profit fell. Inspect the prediction and discuss that annotation choice.'),
    ],
    'rag': [
        ('Ask a question without evidence', 'question = "What customer concentration risk does the company disclose?"\nrelevant = {0, 2}', 'question = "What was revenue in 2023?"\nrelevant = set()', 'No passage supplies that amount. Recall is undefined, context precision is zero, and returned passages do not establish answerability.'),
        ('Retrieve three passages', 'K = 2', 'K = 3', 'Compare which passage is added and recalculate recall and context precision.'),
    ],
    'optimization': [
        ('Raise target return to 9%', 'target_return = .07', 'target_return = .09', 'Check solver success and every constraint before comparing weights and volatility.'),
        ('Try infeasible 20% asset caps', 'asset_cap = .50', 'asset_cap = .20', 'Four caps of 20% allow at most 80% total allocation. The diagnostic is the intended result.'),
    ],
    'reinforcement-learning': [
        ('Increase training price noise', 'price_noise_sd = .10', 'price_noise_sd = .30', 'Retrain and compare the schedule. Deterministic evaluation still reports impact plus incompletion cost, with no random-price term.'),
        ('Increase incompletion penalty', 'incomplete_penalty = 5.0', 'incomplete_penalty = 10.0', 'The new penalty is used in both training and deterministic evaluation; inspect remaining inventory.'),
        ('Increase impact coefficient', 'impact_coefficient = .08', 'impact_coefficient = .20', 'Training, deterministic evaluation, and the TWAP baseline all use the new coefficient.'),
    ],
    'monte-carlo': [
        ('Set latent correlation to zero', 'rho = .12', 'rho = 0', 'Compare average loss and the tail while keeping marginal PDs fixed.'),
        ('Double default probabilities', 'n_loans,.025', 'n_loans,.050', 'Compare expected loss, tail quantiles, and reserve breaches with the initial PD assumption.'),
        ('Double simulation paths', 'n_sims,n_loans = 2500,1000', 'n_sims,n_loans = 5000,1000', 'Compare the breach estimate and its simulation standard error under unchanged risk assumptions.'),
    ],
}

metrics = ['ROC-AUC', 'Average precision', 'AUC', 'Silhouette',
           'Synthetic anomaly yield', 'MAE', 'common neighbors', 'Macro-F1',
           'Retrieval Recall', 'Volatility', 'Reward', 'Expected loss']

def markdown_cell(text):
    return dict(cell_type='markdown', metadata={}, source=text.splitlines(keepends=True))

def code_cell(text):
    return dict(cell_type='code', metadata={}, execution_count=None, outputs=[],
                source=text.splitlines(keepends=True))

for i, algorithm in enumerate(course['algorithms']):
    slug = algorithm['slug']
    copy = LAB_CONTENT[slug]
    runnable = codes[slug]
    compile(runnable, slug, 'exec')
    edit_items = [dict(label=label, find=find, replace=replace, description=description)
                  for label, find, replace, description in edits[slug]]
    for edit in edit_items:
        if runnable.count(edit['find']) != 1:
            raise ValueError(f"{slug}: edit target must occur once: {edit['label']}")
        compile(runnable.replace(edit['find'], edit['replace'], 1), slug, 'exec')
    result[slug] = dict(
        code=runnable, edits=edit_items, metric=metrics[i],
        source=algorithm['deepDive'].get('code', [{}])[0].get('source', {}),
        dataset=copy['dataset'], task=copy['task'], comparison=copy['comparison'],
        extension=copy['extension'], siteEdits=copy['runtime'],
    )
    intro = (f"# {copy['title']}\n\nAdnan Masood · University of South Florida\n\n{copy['scenario']}\n\n"
             f"**Dataset:** {copy['dataset']}\n\n**Task:** {copy['task']}\n\n"
             f"**Compare:** {copy['comparison']}\n\n**Runtime:** {copy['runtime']}\n")
    if slug in ('transformers', 'rag'):
        intro += f"\n[Download the native Python example](native/{slug}.py).\n"
    experiments = '## Try an experiment\n\nRun the initial example and record its results. Then make one of these changes:\n\n'
    for edit in edit_items:
        experiments += (f"### {edit['label']}\n\n{edit['description']}\n\n"
                        f"Replace:\n```python\n{edit['find']}\n```\nWith:\n```python\n{edit['replace']}\n```\n\n")
    notebook = dict(
        cells=[markdown_cell(intro), code_cell(runnable), markdown_cell(experiments),
               code_cell(copy['experimentStarter']),
               markdown_cell('## Break it\n\n' + copy['breakIt'] + '\n'),
               code_cell(copy['failureStarter']),
               markdown_cell('## What to submit\n\n' + '\n'.join('- ' + item for item in copy['deliverables'])
                             + '\n\n## Optional extension\n\n' + copy['extension'] + '\n')],
        metadata=dict(kernelspec=dict(display_name='Python (Pyodide)', language='python', name='python'),
                      language_info=dict(name='python', version='3.13')),
        nbformat=4, nbformat_minor=5,
    )
    serialized = json.dumps(notebook, indent=2) + '\n'
    for directory in (ROOT / 'labs', ROOT / 'public/notebooks', ROOT / 'public/labs/files'):
        directory.mkdir(parents=True, exist_ok=True)
        (directory / f'{slug}.ipynb').write_text(serialized)
    for directory in (ROOT / 'labs', ROOT / 'public/labs/files'):
        (directory / f'{slug}.py').write_text(runnable)

# The native examples are maintained separately and copied without changing code.
for native in (ROOT / 'labs/native').glob('*.py'):
    compile(native.read_text(), str(native), 'exec')
    for directory in (ROOT / 'public/notebooks/native', ROOT / 'public/labs/files/native'):
        directory.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(native, directory / native.name)

(ROOT / 'src/data/labs.json').write_text(json.dumps(result, indent=2) + '\n')
dataset_notes = ('# Dataset notes\n\nThe browser labs use fixed-seed synthetic samples or small, hand-written examples. '
                 'None contains customer data or supplies a benchmark for production performance. '
                 'Keep the dataset, split, and random seed fixed when comparing model settings.\n\n')
for slug, copy in LAB_CONTENT.items():
    dataset_notes += f"## {copy['title']}\n\n{copy['dataset']}\n\n{copy['runtime']}\n\n"
    if slug in ('transformers', 'rag'):
        dataset_notes += f"[Native Python example](native/{slug}.py)\n\n"
for directory in (ROOT / 'labs', ROOT / 'public/notebooks', ROOT / 'public/labs/files'):
    (directory / 'DATASET_NOTES.md').write_text(dataset_notes)

# JupyterLite fetches file bodies from files/. Keep its existing directory listing
# sizes current when only educational content changes, without rebuilding its UI.
contents_path = ROOT / 'public/labs/api/contents/all.json'
if contents_path.exists():
    contents = json.loads(contents_path.read_text())
    for entry in contents['content']:
        file_path = ROOT / 'public/labs/files' / entry['path']
        if file_path.is_file():
            entry['size'] = file_path.stat().st_size
    if not any(entry['path'] == 'DATASET_NOTES.md' for entry in contents['content']):
        note_path = ROOT / 'public/labs/files/DATASET_NOTES.md'
        timestamp = datetime.fromtimestamp(note_path.stat().st_mtime, timezone.utc).isoformat()
        contents['content'].append(dict(content=None, created=timestamp, format=None,
            hash=None, hash_algorithm=None, last_modified=timestamp, mimetype='text/markdown',
            name='DATASET_NOTES.md', path='DATASET_NOTES.md', size=note_path.stat().st_size,
            type='file', writable=True))
    contents_path.write_text(json.dumps(contents, indent=2) + '\n')
print('Created 12 runnable labs, 36 notebook copies, dataset notes, and native downloads.')
