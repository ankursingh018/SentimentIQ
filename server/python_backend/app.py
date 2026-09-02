from flask import Flask, request, jsonify
from transformers import pipeline
import os

app = Flask(__name__)

# Base path for models
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'my_sentiment_model')

print(f"Loading model from: {MODEL_PATH}")
# Load the local Roberta model 
# (assuming task is sentiment analysis/text classification)
try:
    classifier = pipeline('text-classification', model=MODEL_PATH, tokenizer=MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    classifier = None

# Map the labels from your Robeta model to the Dashboard's Expected labels
# LABEL_0, LABEL_1, LABEL_2. Adjust these mappings based on how you trained it!
# Typically for Twitter-Roberta: 0 -> Negative, 1 -> Neutral, 2 -> Positive
LABEL_MAP = {
    "LABEL_0": "Negative",
    "LABEL_1": "Neutral",
    "LABEL_2": "Positive"
}

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    texts = data.get('texts', [])

    if not classifier:
        return jsonify({"results": [{"label": "Neutral", "score": 0.5} for _ in texts]})

    if not texts:
        return jsonify({"results": []})

    # Get predictions
    try:
        # Pipeline can process an array of texts automatically 
        preds = classifier(texts)
    except Exception as e:
        print(f"Inference error: {e}")
        return jsonify({"results": [{"label": "Neutral", "score": 0.5} for _ in texts]})
    
    results = []
    for p in preds:
        raw_label = p['label']
        raw_score = p['score']
        
        # Map label
        mapped_label = LABEL_MAP.get(raw_label, "Neutral")
        
        # Dashboard expects score between 0 and 1. Neural nets already output sigmoid/softmax scores (0-1).
        # We assume raw_score is already a confidence score between 0 and 1.
        results.append({
            "label": mapped_label,
            "score": raw_score
        })
        
    return jsonify({"results": results})

if __name__ == '__main__':
    # Run on port 5001 to avoid conflicts with your Node dashboard logic
    app.run(port=5001, debug=True)
