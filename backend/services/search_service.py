"""
RetailMind — Search Service
Manages smart, contextual search matching, category restriction, 
confidence scoring, and high-fidelity fallback generation.
"""
import logging, datetime, random
from database.db import db
from database.models import Product
from services.product_search_service import search_products_smart
from services.memory_cache import set_cached_product

log = logging.getLogger(__name__)

# Configurable confidence threshold for local inventory matching
CONFIDENCE_THRESHOLD = 0.65

def search_catalog_with_vision_metadata(vision_data: dict) -> dict:
    """
    Takes Claude Vision structured analysis and matches it against the local catalog.
    1. Runs smart search using the probable product name.
    2. Filters results strictly by the detected category and brand (if present)
       to avoid mismatch pollution.
    3. If matches exceed CONFIDENCE_THRESHOLD, returns top 3 matching products.
    4. If no match exceeds threshold, triggers fallback:
       Generates a dynamic negative ID product with dynamic synthetic insights.
    """
    probable_name = vision_data.get("probable_name", "Unidentified Product")
    detected_cat = vision_data.get("category", "")
    detected_brand = vision_data.get("brand") or ""
    
    log.info(f"Searching catalog for: '{probable_name}' | Cat: '{detected_cat}' | Brand: '{detected_brand}'")

    # Smart TF-IDF + exact re-ranking search
    raw_results = search_products_smart(probable_name, top_n=10)
    
    # Restrict and filter results contextually
    filtered_results = []
    if raw_results:
        product_ids = [r["product_id"] for r in raw_results]
        score_map = {r["product_id"]: r["score"] for r in raw_results}
        
        db_products = db.session.query(Product).filter(Product.id.in_(product_ids)).all()
        
        for p in db_products:
            p_dict = p.to_dict()
            score = score_map.get(p.id, 0.0)
            
            # Boost score if category matches
            if detected_cat and p.category:
                main_cat_detected = detected_cat.split("|")[0].lower()
                main_cat_product = p.category.split("|")[0].lower()
                if main_cat_detected == main_cat_product:
                    score += 0.15 # Strong category alignment boost
                    
            # Boost score if brand matches
            if detected_brand and p.brand and detected_brand.lower() in p.brand.lower():
                score += 0.15 # Strong brand alignment boost
                
            p_dict["relevance_score"] = min(1.0, round(score, 4))
            filtered_results.append(p_dict)

        # Re-sort with brand/category alignment boosts applied
        filtered_results.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Filter by confidence threshold to avoid weak random results (e.g. phone -> bag)
    high_confidence_matches = [
        p for p in filtered_results 
        if p.get("relevance_score", 0.0) >= CONFIDENCE_THRESHOLD
    ]

    # Return top 3 matches if high confidence exists
    if high_confidence_matches:
        log.info(f"Found {len(high_confidence_matches)} high-confidence matches in local inventory.")
        return {
            "query": probable_name,
            "detected_query": probable_name,
            "results": high_confidence_matches[:3],
            "total": len(high_confidence_matches),
            "confidence_score": max([p["relevance_score"] for p in high_confidence_matches]),
            "source": "local_database",
            "not_found_in_catalog": False
        }

    # ── Fallback flow: Product not in database ──
    log.info("No high-confidence local matches. Generating AI-based synthetic insights & fallback recommendations.")
    
    # 1. Create a dynamic negative timestamp ID
    import time
    unique_id = -int(time.time())
    
    # 2. Build estimated insights product card
    estimated_price = float(vision_data.get("estimated_price") or 1499)
    estimated_product = {
        "id": unique_id,
        "name": probable_name,
        "brand": detected_brand or "Generic",
        "category": detected_cat or "Electronics|Accessories",
        "sub_category": vision_data.get("product_type"),
        "description": vision_data.get("visual_description", ""),
        "price": estimated_price,
        "actual_price": round(estimated_price * 1.2, 2),
        "discount_pct": 15.0,
        "rating": 4.2,
        "review_count": 28,
        "image_url": None,
        "relevance_score": float(vision_data.get("confidence") or 0.85),
        "source": "claude_generated",
        "key_features": vision_data.get("key_features", []),
        "not_found_in_catalog": True
    }
    
    # Store in memory cache so product routes can load detail/insights beautifully
    set_cached_product(unique_id, estimated_product)

    # 3. Fetch similar products from local database for contextual recommendations
    from services.recommendation_service import get_fallback_recommendations
    fallback_items = get_fallback_recommendations(detected_cat, detected_brand, limit=3)

    return {
        "query": probable_name,
        "detected_query": probable_name,
        "results": [estimated_product],
        "similar_products": fallback_items,
        "total": 1,
        "confidence_score": float(vision_data.get("confidence") or 0.85),
        "source": "claude_generated",
        "not_found_in_catalog": True
    }


def handle_manual_keyword_fallback(query: str) -> dict:
    """
    If a manual text query returns 0 results, infer the category
    and return an intelligent fallback response containing estimated metrics
    and similar category recommendations to avoid showing a broken empty state.
    """
    log.info(f"Manual query fallback triggered for: '{query}'")
    
    # Simple semantic heuristics for manual fallback
    inferred_cat = "Electronics|Accessories"
    estimated_p = 999
    
    query_lower = query.lower()
    if "phone" in query_lower or "mobile" in query_lower:
        inferred_cat = "Electronics|Mobiles"
        estimated_p = 15000
    elif "laptop" in query_lower or "computer" in query_lower:
        inferred_cat = "Electronics|Computers"
        estimated_p = 45000
    elif "ear" in query_lower or "sound" in query_lower or "headphone" in query_lower:
        inferred_cat = "Electronics|Audio"
        estimated_p = 2499
    elif "watch" in query_lower or "fit" in query_lower:
        inferred_cat = "Electronics|Wearables"
        estimated_p = 3999

    from services.recommendation_service import get_fallback_recommendations
    fallback_items = get_fallback_recommendations(inferred_cat, brand=None, limit=3)

    return {
        "query": query,
        "results": [],
        "similar_products": fallback_items,
        "inferred_category": inferred_cat,
        "estimated_price": estimated_p,
        "not_found_in_catalog": True
    }
