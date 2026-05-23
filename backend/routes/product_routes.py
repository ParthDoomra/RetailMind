"""
RetailMind — Product Routes
GET /api/product/<id>
GET /api/product/<id>/insights
GET /api/products          (browse with pagination)
"""

from flask import Blueprint, request, jsonify

from database.models import Product
from services.product_insight_service import get_product_insights
from services.memory_cache import get_cached_product

product_bp = Blueprint("product", __name__)


@product_bp.get("/product/<int:product_id>")
def get_product(product_id: int):
    """Return a single product by ID."""
    if product_id < 0:
        cached = get_cached_product(product_id)
        if cached:
            return jsonify(cached)

    product = Product.query.get(product_id)
    if product is None:
        return jsonify({"error": f"Product {product_id} not found"}), 404

    return jsonify(product.to_dict())


@product_bp.get("/product/<int:product_id>/insights")
def get_product_insights_route(product_id: int):
    """
    Return rich insights for a product:
    category benchmarks, price forecast, sentiment, rating context.
    Supports negative product_ids (Claude-generated scan mock insights).
    """
    if product_id < 0:
        cached = get_cached_product(product_id)
        if cached:
            # Generate highly premium synthetic insights for scanned product!
            price = cached.get("price", 1000)
            
            # 1. Generate 180 days of realistic random walk price history
            import random, datetime
            history = []
            current_price = price * 1.15 # start slightly higher
            start_date = datetime.date.today() - datetime.timedelta(days=180)
            for i in range(180):
                d = start_date + datetime.timedelta(days=i)
                # gentle random walk with slight downward trend
                change = random.uniform(-0.015, 0.012)
                current_price = max(price * 0.7, current_price * (1 + change))
                history.append({
                    "date": d.isoformat(),
                    "price": round(current_price, 2)
                })
            
            # Make today's price match exactly the advertised price
            history[-1]["price"] = price

            # 2. Generate 30 days of future forecast
            forecast = []
            last_p = price
            for i in range(30):
                d = datetime.date.today() + datetime.timedelta(days=i+1)
                # forecast showing a slight holiday discount/drop
                change = random.uniform(-0.008, 0.004)
                last_p = last_p * (1 + change)
                forecast.append({
                    "date": d.isoformat(),
                    "price": round(last_p, 2),
                    "lower": round(last_p * 0.95, 2),
                    "upper": round(last_p * 1.05, 2)
                })

            category = cached.get("category", "General")
            return jsonify({
                "product": cached,
                "category_stats": {
                    "avg_price": round(price * 1.05, 2),
                    "min_price": round(price * 0.75, 2),
                    "max_price": round(price * 1.6, 2),
                    "avg_rating": 4.15,
                    "product_count": 42
                },
                "rating_context": {
                    "label": "Significantly above average",
                    "delta": 0.35
                },
                "price_forecast": {
                    "history": history,
                    "forecast": forecast,
                    "method": "Prophet ML Ensemble (Synthetic)"
                },
                "sentiment": {
                    "summary": "Users praise the excellent design, build quality, and value for money. Minor complaints about battery charging speed.",
                    "positive_pct": 82,
                    "neutral_pct": 12,
                    "negative_pct": 6
                }
            })

    insights = get_product_insights(product_id)
    if insights is None:
        return jsonify({"error": f"Product {product_id} not found"}), 404

    return jsonify(insights)


@product_bp.get("/products")
def browse_products():
    """
    Browse all products with pagination and optional category filter.

    Query params:
        page     (int, default 1)
        per_page (int, default 24, max 48)
        category (str, optional)
        sort     (str: price_asc | price_desc | rating | newest)
    """
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(int(request.args.get("per_page", 24)), 48)
    category = request.args.get("category", "").strip() or None
    sort     = request.args.get("sort", "rating")

    query = Product.query

    if category:
        query = query.filter(Product.category == category)

    sort_map = {
        "price_asc":  Product.price.asc(),
        "price_desc": Product.price.desc(),
        "rating":     Product.rating.desc(),
        "newest":     Product.created_at.desc(),
    }
    query = query.order_by(sort_map.get(sort, Product.rating.desc()))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "products":    [p.to_dict() for p in pagination.items],
        "total":       pagination.total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": pagination.pages,
    })


@product_bp.get("/categories")
def get_categories():
    """Return all distinct product categories."""
    from database.db import db
    from sqlalchemy import func

    rows = (
        db.session.query(Product.category, func.count(Product.id).label("count"))
        .filter(Product.category.isnot(None))
        .group_by(Product.category)
        .order_by(func.count(Product.id).desc())
        .all()
    )

    return jsonify([{"name": r.category, "count": r.count} for r in rows])
