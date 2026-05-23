"""
RetailMind — Sentiment Analysis Model
Analyzes product review text to produce sentiment scores.
Uses a pre-trained transformer model (no training data needed).

Usage:
    from ml.sentiment_model import analyze_sentiment

    result = analyze_sentiment("This product is absolutely amazing!")
    # → {"label": "positive", "score": 0.97}
"""

import logging
from functools import lru_cache

log = logging.getLogger(__name__)

# Lazy-loaded model (downloaded on first use, ~67 MB)
_PIPELINE = None


@lru_cache(maxsize=1)
def _load_pipeline():
    """Load the sentiment pipeline once and cache it."""
    try:
        from transformers import pipeline  # type: ignore

        log.info("Loading sentiment model (first run may take a moment)...")
        return pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            truncation=True,
            max_length=512,
        )
    except ImportError:
        log.warning("transformers not installed. Using keyword-based fallback.")
        return None


def _keyword_fallback(text: str) -> dict:
    """
    Simple keyword-based sentiment when transformers is not available.
    Accurate enough for a demo; replace with the real model in production.
    """
    text_lower = text.lower()

    positive_words = {"great", "excellent", "amazing", "love", "good", "best",
                      "perfect", "recommend", "fantastic", "wonderful", "awesome"}
    negative_words = {"bad", "terrible", "awful", "horrible", "worst", "poor",
                      "disappointing", "broken", "cheap", "hate", "waste"}

    pos_count = sum(1 for w in positive_words if w in text_lower)
    neg_count = sum(1 for w in negative_words if w in text_lower)

    if pos_count > neg_count:
        return {"label": "positive", "score": round(0.6 + pos_count * 0.05, 2)}
    elif neg_count > pos_count:
        return {"label": "negative", "score": round(0.6 + neg_count * 0.05, 2)}
    else:
        return {"label": "neutral", "score": 0.5}


def analyze_sentiment(text: str) -> dict:
    """
    Return sentiment label and confidence score for a piece of text.

    Returns:
        {"label": "positive" | "negative" | "neutral", "score": float}
    """
    if not text or not text.strip():
        return {"label": "neutral", "score": 0.5}

    pipeline = _load_pipeline()

    if pipeline is None:
        return _keyword_fallback(text)

    try:
        result = pipeline(text[:512])[0]
        return {
            "label": result["label"].lower(),
            "score": round(result["score"], 4),
        }
    except Exception as e:
        log.warning(f"Sentiment model error: {e}. Using fallback.")
        return _keyword_fallback(text)


def analyze_reviews_batch(reviews: list[str]) -> dict:
    """
    Analyze a batch of reviews and return aggregate sentiment stats.

    Returns:
        {
            "positive_pct": float,
            "negative_pct": float,
            "neutral_pct":  float,
            "average_score": float,
            "summary_label": str,
        }
    """
    if not reviews:
        return {"positive_pct": 0, "negative_pct": 0, "neutral_pct": 0,
                "average_score": 0.5, "summary_label": "neutral"}

    results  = [analyze_sentiment(r) for r in reviews[:100]]  # Cap at 100
    labels   = [r["label"] for r in results]
    scores   = [r["score"] for r in results]

    total    = len(results)
    pos_pct  = round(labels.count("positive") / total * 100, 1)
    neg_pct  = round(labels.count("negative") / total * 100, 1)
    neu_pct  = round(100 - pos_pct - neg_pct, 1)
    avg_score= round(sum(scores) / total, 3)

    summary  = max(["positive", "negative", "neutral"], key=labels.count)

    return {
        "positive_pct":  pos_pct,
        "negative_pct":  neg_pct,
        "neutral_pct":   neu_pct,
        "average_score": avg_score,
        "summary_label": summary,
    }
