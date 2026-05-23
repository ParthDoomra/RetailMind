"""
RetailMind — Product Insight Service
Generates per-product analytical insights:
  - Category price benchmarks
  - Rating context
  - Price forecast
  - Sentiment summary (if reviews available)
"""

import logging

from sqlalchemy import func

from database.db import db
from database.models import Product, PriceHistory
from ml.price_forecasting_model import forecast_price
from ml.sentiment_model import analyze_reviews_batch

log = logging.getLogger(__name__)


def get_product_insights(product_id: int) -> dict | None:
    """
    Return a rich insight object for the given product.
    Returns None if the product doesn't exist.
    """
    product = Product.query.get(product_id)
    if product is None:
        return None

    category_stats = _get_category_stats(product.category)
    price_forecast = _get_price_forecast(product)
    rating_context = _get_rating_context(product, category_stats)

    return {
        "product":        product.to_dict(),
        "category_stats": category_stats,
        "rating_context": rating_context,
        "price_forecast": price_forecast,
        "sentiment":      _get_placeholder_sentiment(product),
    }


def _get_category_stats(category: str | None) -> dict:
    """Compute avg/min/max price and avg rating for this category."""
    if not category:
        return {}

    row = (
        db.session.query(
            func.avg(Product.price).label("avg_price"),
            func.min(Product.price).label("min_price"),
            func.max(Product.price).label("max_price"),
            func.avg(Product.rating).label("avg_rating"),
            func.count(Product.id).label("product_count"),
        )
        .filter(Product.category == category)
        .first()
    )

    if not row:
        return {}

    return {
        "avg_price":     round(row.avg_price or 0, 2),
        "min_price":     round(row.min_price or 0, 2),
        "max_price":     round(row.max_price or 0, 2),
        "avg_rating":    round(row.avg_rating or 0, 2),
        "product_count": row.product_count or 0,
    }


def _get_rating_context(product: Product, category_stats: dict) -> dict:
    """Describe how this product's rating compares to the category average."""
    if not product.rating or not category_stats.get("avg_rating"):
        return {"label": "No rating data", "delta": 0}

    delta = round(product.rating - category_stats["avg_rating"], 2)

    if delta >= 0.5:
        label = "Significantly above average"
    elif delta >= 0.1:
        label = "Above category average"
    elif delta <= -0.5:
        label = "Below average"
    elif delta <= -0.1:
        label = "Slightly below average"
    else:
        label = "Average for this category"

    return {"label": label, "delta": delta}


def _get_price_forecast(product: Product) -> dict:
    """
    Retrieve stored price history and run the forecast model.
    Falls back to synthetic history when no real data exists.
    """
    if product.price is None:
        return {}

    history_records = PriceHistory.query.filter_by(product_id=product.id).all()
    history = [r.to_dict() for r in history_records]

    return forecast_price(
        base_price=product.price,
        price_history=history if len(history) >= 10 else None,
        periods=30,
    )


def _get_placeholder_sentiment(product: Product) -> dict:
    """
    Return a synthetic sentiment summary.
    In production: pass real review texts here.
    """
    if not product.rating:
        return {"summary_label": "neutral", "positive_pct": 50, "negative_pct": 50}

    # Approximate sentiment from star rating
    if product.rating >= 4.0:
        pos = round(60 + product.rating * 8, 1)
        return {"summary_label": "positive", "positive_pct": min(pos, 95),
                "negative_pct": round(100 - pos, 1), "neutral_pct": 0,
                "note": "Based on star rating (no review text available)"}
    elif product.rating >= 3.0:
        return {"summary_label": "neutral", "positive_pct": 45,
                "negative_pct": 25, "neutral_pct": 30,
                "note": "Based on star rating"}
    else:
        neg = round(40 + (5 - product.rating) * 10, 1)
        return {"summary_label": "negative", "negative_pct": min(neg, 80),
                "positive_pct": round(100 - neg, 1), "neutral_pct": 0,
                "note": "Based on star rating"}
