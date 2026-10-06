# Native Python example requiring Sentence-Transformers and pretrained embeddings.
# Colab: pip install -q sentence-transformers
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

chunks = [
 "No customer accounted for more than 10 percent of revenue.",
 "Interest expense increased because average debt was higher.",
 "A small number of distributors represent a material share of sales.",
 "The company maintains a revolving credit facility."
]
question = "What customer concentration risk does the company disclose?"
encoder = SentenceTransformer("all-MiniLM-L6-v2")
D = encoder.encode(chunks, normalize_embeddings=True)
q = encoder.encode([question], normalize_embeddings=True)
scores = cosine_similarity(q, D)[0]
for i in scores.argsort()[::-1][:2]:
    print(round(scores[i], 3), chunks[i])
