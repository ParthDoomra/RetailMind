"""RetailMind — Recommendation Routes"""
from flask import Blueprint, request, jsonify
from database.models import Product
from services.recommendation_service import get_recommendations
from config import Config

recommendation_bp = Blueprint("recommendation", __name__)

@recommendation_bp.get("/recommend/<int:product_id>")
def recommend(product_id: int):
    """Return similar product recommendations for a given product."""
    top_n = min(int(request.args.get("n", Config.DEFAULT_RECOMMENDATION_COUNT)), 20)

    if product_id < 0:
        from services.memory_cache import get_cached_product
        from services.recommendation_service import get_fallback_recommendations
        cached = get_cached_product(product_id)
        if cached:
            results = get_fallback_recommendations(
                cached.get("category"), 
                cached.get("brand"), 
                limit=top_n
            )
            return jsonify({"product_id": product_id, "recommendations": results})
        return jsonify({"product_id": product_id, "recommendations": []})

    ranked = get_recommendations(product_id, top_n=top_n)

    if not ranked:
        return jsonify({"product_id": product_id, "recommendations": []})

    product_id_map = {r["product_id"]: r["score"] for r in ranked}
    products       = Product.query.filter(Product.id.in_(product_id_map.keys())).all()
    products_by_id = {p.id: p for p in products}

    results = []
    for r in ranked:
        p = products_by_id.get(r["product_id"])
        if p:
            data = p.to_dict()
            data["similarity_score"] = r["score"]
            results.append(data)

    return jsonify({"product_id": product_id, "recommendations": results})
