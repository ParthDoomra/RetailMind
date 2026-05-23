"""RetailMind — Search Routes"""
from flask import Blueprint, request, jsonify
from database.db import db
from database.models import Product, SearchLog
from services.product_search_service import search_products_smart
from utils.validators import require_query_param
from config import Config

search_bp = Blueprint("search", __name__)

@search_bp.get("/search")
def search():
    query = request.args.get("q", "").strip()
    limit = min(int(request.args.get("limit", Config.DEFAULT_SEARCH_RESULTS)), 50)
    error = require_query_param("q", query)
    if error: return jsonify(error), 400

    ranked = search_products_smart(query, top_n=limit)
    # Filter by minimum confidence to avoid random noisy results
    ranked = [r for r in ranked if r["score"] >= 0.18]

    if not ranked:
        _log_search(query, 0)
        from services.search_service import handle_manual_keyword_fallback
        fallback_data = handle_manual_keyword_fallback(query)
        return jsonify(fallback_data)

    score_map   = {r["product_id"]: r["score"] for r in ranked}
    product_ids = list(score_map.keys())
    
    products = db.session.query(Product).filter(Product.id.in_(product_ids)).all()
    products_by_id = {p.id: p for p in products}

    results = []
    for r in ranked:
        p = products_by_id.get(r["product_id"])
        if p:
            data = p.to_dict()
            data["relevance_score"] = r["score"]
            results.append(data)

    _log_search(query, len(results))
    return jsonify({
        "query": query, 
        "results": results, 
        "total": len(results),
        "not_found_in_catalog": False
    })


def _log_search(query: str, result_count: int) -> None:
    try:
        db.session.add(SearchLog(query=query, result_count=result_count))
        db.session.commit()
    except Exception:
        db.session.rollback()
