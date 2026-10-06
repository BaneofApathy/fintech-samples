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
