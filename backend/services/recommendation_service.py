"""
RetailMind — Recommendation Service
Manages standard sparse ML TF-IDF recommendations and category fallbacks.
"""
import logging, pickle
import scipy.sparse as sp
from database.db import db
from database.models import Product
from config import Config

log = logging.getLogger(__name__)

# ── Lazy Recommendation Model Loader ──────────────────────────────────────────
_recommender_payload = None
_recommender_matrix  = None

def _load_recommender():
    global _recommender_payload, _recommender_matrix
    if _recommender_payload is not None:
        return _recommender_payload, _recommender_matrix
    try:
        if not Config.RECOMMENDER_MODEL_PATH.exists():
            log.warning(f"Recommender model file not found at: {Config.RECOMMENDER_MODEL_PATH}")
            return None, None
            
        with open(Config.RECOMMENDER_MODEL_PATH, "rb") as f:
            _recommender_payload = pickle.load(f)
            
        matrix_path = Config.MODELS_DIR / _recommender_payload["matrix_filename"]
        if matrix_path.exists():
            _recommender_matrix = sp.load_npz(str(matrix_path))
            
        return _recommender_payload, _recommender_matrix
    except Exception as e:
        log.warning(f"Failed to load recommendation model: {e}")
        return None, None


def get_recommendations(product_id: int, top_n: int = 8) -> list[dict]:
    """
    Returns similar product recommendations using TF-IDF sparse Cosine similarity.
    This matches the original ML recommender model architecture.
    """
    payload, matrix = _load_recommender()
    if payload is None or matrix is None:
        log.warning("Recommendation models not trained or loaded. Using category fallback.")
        return []
    try:
        product_ids = payload["product_ids"]
        if product_id not in product_ids:
            return []
            
        idx = product_ids.index(product_id)
        
        # Get query product vector from normalized sparse matrix
        vec = matrix[idx]
        
        # Dot product with entire sparse matrix yields Cosine Similarity (since rows are L2 normalized)
        scores = matrix.dot(vec.T).toarray().flatten()
        
        # Get ranked indices (excluding query item itself)
        ranked_indices = [
            i for i in scores.argsort()[::-1]
            if product_ids[i] != product_id
        ]
        
        results = []
        for i in ranked_indices[:top_n]:
            results.append({
                "product_id": product_ids[i],
                "score": float(scores[i])
            })
        return results
    except Exception as e:
        log.error(f"Failed running recommendation engine: {e}")
        return []


def get_fallback_recommendations(category: str | None, brand: str | None, limit: int = 3) -> list[dict]:
    """
    Finds top products from the local inventory within the same category
    or brand to display as contextual suggestions if a scanned product is missing.
    """
    query = Product.query
    
    # 1. Attempt strict match (both Category & Brand)
    strict_matches = []
    if category and brand:
        strict_matches = (
            query.filter(Product.category == category)
            .filter(Product.brand.ilike(f"%{brand}%"))
            .order_by(Product.rating.desc())
            .limit(limit)
            .all()
        )
        
    if len(strict_matches) >= limit:
        return [p.to_dict() for p in strict_matches]

    # 2. Match primarily on category hierarchy
    cat_matches = []
    if category:
        main_cat = category.split("|")[0].strip()
        cat_matches = (
            query.filter(Product.category.like(f"{main_cat}%"))
            .order_by(Product.rating.desc())
            .limit(limit)
            .all()
        )

    # Combine results, ensuring unique items
    merged = {p.id: p for p in strict_matches}
    for p in cat_matches:
        if len(merged) >= limit:
            break
        merged[p.id] = p

    # 3. Fallback to general highly-rated inventory items if still empty
    if not merged:
        general_popular = (
            query.order_by(Product.rating.desc())
            .limit(limit)
            .all()
        )
        merged = {p.id: p for p in general_popular}

    return [p.to_dict() for p in list(merged.values())[:limit]]
