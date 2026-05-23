"""RetailMind — Analytics Service (v2 — INR-aware buckets)"""
import logging
from sqlalchemy import func, desc
from database.db import db
from database.models import Product, SearchLog

log = logging.getLogger(__name__)


def get_dashboard_stats() -> dict:
    total = db.session.query(func.count(Product.id)).scalar() or 0
    if total == 0:
        return _empty()

    cat_rows = (
        db.session.query(Product.category, func.count(Product.id).label("count"))
        .filter(Product.category.isnot(None))
        .group_by(Product.category)
        .order_by(desc("count")).limit(12).all()
    )
    categories = [{"name": r.category, "count": r.count} for r in cat_rows]

    price_buckets = _price_distribution()

    rating_rows = (
        db.session.query(func.round(Product.rating, 0).label("band"), func.count(Product.id).label("count"))
        .filter(Product.rating.isnot(None), Product.rating > 0)
        .group_by("band").order_by("band").all()
    )
    rating_dist = [{"rating": int(r.band or 0), "count": r.count} for r in rating_rows]

    top_products = (
        db.session.query(Product)
        .filter(Product.rating.isnot(None), Product.rating > 0, Product.price.isnot(None))
        .order_by(desc(Product.rating)).limit(8).all()
    )

    avg_price  = db.session.query(func.avg(Product.price)).filter(Product.price > 0).scalar() or 0
    avg_rating = db.session.query(func.avg(Product.rating)).filter(Product.rating > 0).scalar() or 0
    total_cats = db.session.query(func.count(func.distinct(Product.category))).filter(Product.category.isnot(None)).scalar() or 0

    recent = db.session.query(SearchLog).order_by(desc(SearchLog.searched_at)).limit(8).all()

    return {
        "kpis": {
            "total_products":   total,
            "total_categories": total_cats,
            "avg_price":        round(float(avg_price), 2),
            "avg_rating":       round(float(avg_rating), 2),
        },
        "categories":          categories,
        "price_distribution":  price_buckets,
        "rating_distribution": rating_dist,
        "top_products": [
            {"id": p.id, "name": p.name[:60], "review_count": p.review_count,
             "rating": p.rating, "price": p.price}
            for p in top_products
        ],
        "recent_searches": [
            {"query": s.query, "result_count": s.result_count} for s in recent
        ],
    }


def _price_distribution() -> list[dict]:
    # INR-appropriate buckets for the retailmind_master dataset
    buckets = [
        ("Under ₹500",    0,      500),
        ("₹500–₹1k",      500,   1000),
        ("₹1k–₹2k",      1000,   2000),
        ("₹2k–₹5k",      2000,   5000),
        ("₹5k–₹10k",     5000,  10000),
        ("₹10k–₹25k",   10000,  25000),
        ("Over ₹25k",    25000, 999999),
    ]
    return [
        {"bucket": label, "count": db.session.query(func.count(Product.id))
         .filter(Product.price >= lo, Product.price < hi).scalar() or 0}
        for label, lo, hi in buckets
    ]


def _empty() -> dict:
    return {
        "kpis": {"total_products": 0, "total_categories": 0, "avg_price": 0, "avg_rating": 0},
        "categories": [], "price_distribution": [], "rating_distribution": [],
        "top_products": [], "recent_searches": [],
    }
