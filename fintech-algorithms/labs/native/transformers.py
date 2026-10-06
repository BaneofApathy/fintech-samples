# Native Python example requiring PyTorch and pretrained FinBERT.
# Colab: pip install -q transformers torch
from transformers import pipeline
clf = pipeline("text-classification",
               model="ProsusAI/finbert",
               truncation=True)

sentences = [
 "Operating margin expanded by 240 basis points.",
 "Management withdrew full-year revenue guidance.",
 "The company completed its scheduled debt repayment."
]
for text, result in zip(sentences, clf(sentences)):
    print(text)
    print(result)   # label and confidence score
