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
